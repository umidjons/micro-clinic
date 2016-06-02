'use strict';

var router = require('express').Router();
var debug = require('debug')('myclinic:router:patientservice');
var models = require('../models');
var Msg = require('../include/Msg');
var mongoose = require('mongoose');
var F = require('../include/F');

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
        req.patientService.populate('user', 'username lastName firstName middleName', function (err, patSrv) {
            if (err) {
                return Msg.sendError(res, err);
            }
            Msg.sendSuccess(res, '', patSrv, 'Patient Service:');
        });
    })
    .get('/for/:patientId', function (req, res) {
        debug(`patientId: ${req.params.patientId}`);
        // do not populate user attribute, because it is unnecessary here
        models.PatientService.find({patientId: req.params.patientId}, function (err, patientServices) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, '', patientServices, 'List of patient services:');
        });
    })
    .post('/',
        function (req, res, next) {
            // middleware to prepare patient services for save

            //console.log('Request body 1:', req.body);

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

                // there is already 'created' field from Service model, we MUST override it
                srv.created = time;

                // set patient id for each service
                srv.patientId = req.body.patientId;
                srv.payed = 0;
                srv.debt = srv.priceTotal;

                srv.state = {_id: 'new', title: 'новая'};
            }
            next();
        },
        function (req, res) {
            //console.log('Request body 2:', req.body);

            models.PatientService.create(req.body.services, function (err, patientServices) {
                // if there is error, send it and stop handler with return
                if (err) {
                    return Msg.sendError(res, err);
                }

                // update last visit
                models.Patient.setLastVisit(req.body.patientId, req.body.services[0].created, function (err, patient) {
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
        req.patientService.save(function (err, patSrv) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .post('/delete-bulk',
        function (req, res, next) {
            debug(`Checking patient services states before bulk deleting. IDS: ${req.body.ids}`);

            models.PatientService.find({_id: {$in: req.body.ids}, 'state._id': {$ne: 'new'}})
                .exec(function (err, services) {
                    if (err) {
                        return Msg.sendError(res, err);
                    }

                    if (services.length > 0) {
                        let msg = 'Следующих услуг удалить нельзя:\n';
                        for (let srv of service) {
                            msg.concat(`${srv.title} состояние - ${srv.state.title}\n`);
                        }
                        return Msg.sendError(res, msg);
                    }

                    // all right
                    next();
                });
        },
        function (req, res) {
            var ids = req.body.ids;

            debug(`Bulk deleting patient services. IDS: ${ids}`);

            models.PatientService.remove({_id: {$in: ids}}, function (err, raw) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                Msg.sendSuccess(res, 'Записи удалены!');
            });
        }
    )
    .delete('/:id',
        function (req, res, next) {
            debug(`Checking patient service state before deleting. id=${req.params.id}`);

            if (req.patientService.state._id != 'new') {
                return Msg.sendError(res, `Нельзя удалить услугу в состоянии "${req.patientService.state.title}"`);
            }

            next();
        },
        function (req, res) {
            debug(`Delete patient service id: ${req.params.id}`);

            req.patientService.remove(function (err) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                Msg.sendSuccess(res, 'Запись удален!');
            });
        }
    );

module.exports = router;