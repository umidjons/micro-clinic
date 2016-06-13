'use strict';

var router = require('express').Router();
var debug = require('debug')('myclinic:router:patientservice');
var models = require('../models');
var Msg = require('../include/Msg');
var mongoose = require('mongoose');
var F = require('../include/F');
var async = require('async');

router
    .param('id', function (req, res, next, id) {
        debug(`param(id): ${id}`);
        models.PatientService.findById(id, function (err, patSrv) {
            if (err) {
                return Msg.sendError(res, err);
            }

            req.patientService = patSrv;
            next();
        });
    })
    .get('/:id', function (req, res) {
        req.patientService
            .populate('user', 'username lastName firstName middleName')
            .populate('branch', 'shortTitle', function (err, patSrv) {
                if (err) {
                    return Msg.sendError(res, err);
                }
                Msg.sendSuccess(res, '', patSrv, 'Patient Service:');
            });
    })
    .get('/for/:patientId', function (req, res) {
        debug(`patientId: ${req.params.patientId}`);
        // do not populate user attribute, because it is unnecessary here
        models.PatientService
            .find({patientId: req.params.patientId})
            .populate('user', 'username lastName firstName middleName')
            .populate('branch', 'shortTitle')
            .exec(function (err, patientServices) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                Msg.sendSuccess(res, '', patientServices, 'List of patient services:');
            });
    })
    .post('/',
        function (req, res, next) {
            // middleware to prepare patient services for save
            if (!req.body.patientId) {
                return Msg.sendError(res, 'Пациент не указан.');
            }

            if (!req.body.services) {
                return Msg.sendError(res, 'Услуги не указаны');
            }

            let time = new Date();
            for (let srv of req.body.services) {
                // keep original service id
                srv.serviceId = srv._id;

                // delete _id, because it belongs to the service, not patient service
                delete srv._id;

                // currently logged in user
                srv.user = req.user._id;

                // set branch
                srv.branch = req.user.branch._id;

                // set discount's state
                if (srv.discount && srv.discount.type) {
                    srv.discount.state = {_id: 'new', title: 'Новый'};
                }

                // there is already 'created' field from Service model, we MUST override it
                srv.created = time;

                // set patient id for each service
                srv.patientId = req.body.patientId;
                srv.payed = 0;
                srv.debt = srv.priceTotal;

                srv.state = {_id: 'new', title: 'Новый'};
            }
            next();
        },
        function (req, res) {
            models.PatientService.create(req.body.services, function (err) {
                // if there is error, send it and stop handler with return
                if (err) {
                    return Msg.sendError(res, err);
                }

                // update last visit
                models.Patient.setLastVisit(req.body.patientId, req.body.services[0].created, function (err) {
                    if (err) {
                        return Msg.sendError(res, err);
                    }

                    // all right, show success message
                    Msg.sendSuccess(res, 'Данные успешно сохранены.');
                });
            });
        }
    )
    .put('/:id', function (req, res) {
        req.patientService = Object.assign(req.patientService, req.body);
        req.patientService.save(function (err) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .post('/delete-bulk',
        function (req, res, next) {
            debug(`STEP 1. Checking patient services states, pays, results before bulk deleting. IDS: ${req.body.ids}`);

            models.PatientService.find({_id: {$in: req.body.ids}})
                .exec(function (err, services) {
                    if (err) {
                        return Msg.sendError(res, err);
                    }

                    if (!services || !services.length) {
                        return Msg.sendError(res, 'Услуги для удаления не найдены.');
                    }

                    for (let srv of services) {
                        // by default mark as removable
                        srv.removeType = 'remove';

                        // is there any completed service
                        if (srv.state._id == 'completed') {
                            return Msg.sendError(res, `Нельзя удалить услугу ${srv.title} в состоянии "${srv.state.title}"`);
                        }

                        // is there any active pay
                        if (srv.pays && srv.pays.length) {
                            // there are pays, so mark as not removable
                            srv.removeType = 'change-state';

                            for (let pay of srv.pays) {
                                if (pay.state._id == 'payed') {
                                    return Msg.sendError(res, `У услуги ${srv.title} имеется активные оплаты.`);
                                }
                            }
                        }

                        // is there any result
                        if (srv.result) {
                            if (srv.result.fields && srv.result.fields.length) {
                                for (let resFld of srv.result.fields) {
                                    if (typeof resFld.value !== 'undefined' && resFld.value !== null && resFld.value !== '') {
                                        return Msg.sendError(res, `У услуги ${srv.title} имеется заполненные результаты.`);
                                    }
                                }
                            }

                            if (srv.result.template && srv.result.content && srv.result.template.content != srv.result.content) {
                                return Msg.sendError(res, `У услуги ${srv.title} имеется заполненные результаты.`);
                            }
                        }
                    }

                    req.services = services;

                    // all right
                    next();
                });
        },
        function (req, res, next) {
            debug('STEP 2. Determining services for actual remove & update state.');

            req.servicesForSave = [];
            req.servicesForRemove = [];
            for (let srv of req.services) {
                switch (srv.removeType) {
                    case 'change-state':
                        srv.state = {_id: 'removed', title: 'Удален'};
                        req.servicesForSave.push(srv);
                        break;

                    case 'remove':
                        req.servicesForRemove.push(srv);
                        break;
                }
            }
            next();
        },
        function (req, res, next) {
            debug('STEP 3. Changing patient services states as removed.');

            if (req.servicesForSave.length) {
                async.each(req.servicesForSave, function (patSrv, done) {
                    patSrv.save(function (err) {
                        if (err) {
                            return done(err);
                        }
                        done();
                    });
                }, function (err) {
                    if (err) {
                        return Msg.sendError(res, err);
                    }

                    return next();
                });
            } else {
                next();
            }
        },
        function (req, res) {
            debug('STEP 4. Actually remove patient services.');

            if (req.servicesForRemove.length) {
                async.each(req.servicesForRemove, function (patSrv, done) {
                    patSrv.remove(function (err) {
                        if (err) {
                            return done(err);
                        }

                        done();
                    });
                }, function (err) {
                    if (err) {
                        return Msg.sendError(res, err);
                    }
                    Msg.sendSuccess(res, 'Записи удалены!');
                })
            }
        }
    )
    .delete('/:id',
        function (req, res, next) {
            debug(`STEP 1. Checking patient service state, pays, results before deleting. id=${req.params.id}`);

            // by default mark as removable
            req.patientService.removeType = 'remove';

            // is there any completed service
            if (req.patientService.state._id == 'completed') {
                return Msg.sendError(res, `Нельзя удалить услугу ${req.patientService.title} в состоянии "${req.patientService.state.title}"`);
            }

            // is there any active pay
            if (req.patientService.pays && req.patientService.pays.length) {
                // there are pays, so mark as not removable
                req.patientService.removeType = 'change-state';

                for (let pay of req.patientService.pays) {
                    if (pay.state._id == 'payed') {
                        return Msg.sendError(res, `У услуги ${req.patientService.title} имеется активные оплаты.`);
                    }
                }
            }

            // is there any result
            if (req.patientService.result) {
                if (req.patientService.result.fields && req.patientService.result.fields.length) {
                    for (let resFld of req.patientService.result.fields) {
                        if (typeof resFld.value !== 'undefined' && resFld.value !== null && resFld.value !== '') {
                            return Msg.sendError(res, `У услуги ${req.patientService.title} имеется заполненные результаты.`);
                        }
                    }
                }

                if (req.patientService.result.template && req.patientService.result.content
                    && req.patientService.result.template.content != req.patientService.result.content) {
                    return Msg.sendError(res, `У услуги ${req.patientService.title} имеется заполненные результаты.`);
                }
            }

            next();
        },
        function (req, res) {
            debug(`STEP 2. Delete patient service (actual remove or change state to removed. id: ${req.params.id}`);
            let cb = function (err) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                Msg.sendSuccess(res, 'Запись удален!');
            };

            switch (req.patientService.removeType) {
                case 'change-state':
                    req.patientService.state = {_id: 'removed', title: 'Удален'};
                    req.patientService.save(cb);
                    break;

                case 'remove':
                    req.patientService.remove(cb);
                    break;
            }
        }
    );

module.exports = router;