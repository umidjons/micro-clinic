'use strict';

var router = require('express').Router();
var models = require('../models');
var Msg = require('../include/Msg');
var sugar = require('sugar');
var debug = require('debug')('myclinic:router:patient');
var L = require('../include/L');

router
    .use(function (req, res, next) {
        L.context = 'patient';
        next();
    })
    .param('id', function (req, res, next, id) {
        models.Patient.findById(id, function (err, patient) {
            if (err) {
                return Msg.sendError(res, err);
            }

            req.patient = patient;
            next();
        });
    })
    .post('/search',
        function (req, res, next) {
            if (!models.User.can(req.user, 'search')) {
                return Msg.sendError(res, 'Доступ запрещен.');
            }

            debug(`Search params: ${req.body}`);

            if (!(req.body.lastName && req.body.firstName) && !req.body.code) {
                return Msg.sendError(res, 'Объязательные параметры не указаны.');
            }

            var condition = {};

            if (req.body.code) {
                condition.code = new RegExp(req.body.code, 'i');
            }

            if (req.body.lastName && req.body.firstName) {
                condition.lastName = new RegExp(req.body.lastName, 'i');
                condition.firstName = new RegExp(req.body.firstName, 'i');
            }

            if (req.body.middleName) {
                condition.middleName = new RegExp(req.body.middleName, 'i');
            }

            if (req.body.dateOfBirth) {
                condition.dateOfBirth = {
                    $gte: Date.create(req.body.dateOfBirth).beginningOfDay(),
                    $lte: Date.create(req.body.dateOfBirth).endOfDay()
                };
            }

            if (!condition) {
                return Msg.sendError(res, 'Объязательные параметры не указаны.');
            }

            var sort = {
                lastName: 1,
                firstName: 1,
                middleName: 1,
                dateOfBirth: 1
            };

            models.Patient
                .find(condition)
                .limit(20)
                .sort(sort)
                .populate('user', 'username lastName firstName middleName')
                .populate('branch', 'shortTitle')
                .lean()
                .exec(function (err, patients) {
                    if (err) {
                        Msg.sendError(res, err);
                    }

                    req.patients = patients;

                    next();
                });
        },
        function (req, res) {
            models.Patient.fillAdditions(req.patients, function (err, results) {
                if (err) {
                    return Msg.sendError(res, err);
                }
                Msg.sendSuccess(res, '', results);
            });
        })
    .get('/:id', function (req, res) {
        req.patient
            .populate('user', 'username lastName firstName middleName')
            .populate('branch', 'shortTitle', function (err, patient) {
                if (err) {
                    return Msg.sendError(res, err);
                }
                Msg.sendSuccess(res, '', patient);
            });
    })
    .get('/',
        function (req, res, next) {
            // by default no condition
            req.condition = {};

            // show only patients visited today
            if (req.query.today == 1) {
                let beginOfDay = Date.create('today').beginningOfDay();
                let endOfDay = Date.create('today').endOfDay();
                req.condition = {lastVisit: {$gte: beginOfDay, $lte: endOfDay}};
            }

            if (req.query.branch) {
                // filter by branch id
                req.condition.branch = req.query.branch;
            }

            // calculate count of patients
            models.Patient.count(req.condition, function (err, count) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                // set total items header
                res.header('X-Total-Items', count);

                next();
            });
        },
        function (req, res) {
            var pageCurrent = 1 * req.query.p || 1;
            var pageSize = 1 * req.query.ps || 0; // limit=0 means no limit, so default is to retrieve all
            var skip = (pageCurrent - 1) * pageSize;

            debug(`skip=${skip} pageCurrent=${pageCurrent} pageSize=${pageSize}`);

            models.Patient.find(req.condition)
                .skip(skip)
                .limit(pageSize)
                .sort({lastVisit: -1, created: -1})
                .populate('user', 'username lastName firstName middleName')
                .populate('branch', 'shortTitle')
                .lean()
                .exec(function (err, patients) {
                    if (err) {
                        return Msg.sendError(res, err);
                    }

                    models.Patient.fillAdditions(patients, function (err, patients) {
                        if (err) {
                            return Msg.sendError(res, err);
                        }

                        req.patients = patients;
                        return Msg.sendSuccess(res, '', req.patients);
                    });
                });
        }
    )
    .post('/', function (req, res) {
        if (!models.User.can(req.user, 'patient:create')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        debug(`Request body: ${req.body}`);

        // create model and fill fields from request body
        let newPatient = new models.Patient(req.body);
        newPatient.created = new Date();
        newPatient.lastVisit = newPatient.created;
        newPatient.user = req.user._id;
        newPatient.branch = req.user.branch._id;

        // get new patient code
        models.Setting.findById('patientCode').exec(function (err, setting) {
            if (err) {
                return Msg.sendError(res, err);
            }

            // set new code
            newPatient.code = setting.value;

            // try to save patient
            newPatient.save(function (err, savedPatient) {
                // if there is error, send it and stop handler with return
                if (err) {
                    return Msg.sendError(res, err);
                }

                // increment patient code
                models.Patient.incCode(function (err) {
                    if (err) {
                        return Msg.sendError(res, err);
                    }

                    // all right, show success message
                    Msg.sendSuccess(res, 'Данные успешно сохранены.', savedPatient);
                });
            });
        });
    })
    .put('/:id', function (req, res) {
        if (!models.User.can(req.user, 'patient:edit')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        debug(`Updating patient with id: ${req.params.id}`);

        // merge existing data with modified data
        req.patient = Object.assign(req.patient, req.body);

        req.patient.save(function (err, patient) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.', patient);
        });
    })
    .delete('/:id',
        function (req, res, next) {
            if (!models.User.can(req.user, 'patient:delete')) {
                return Msg.sendError(res, 'Доступ запрещен.');
            }

            debug(`Checking patient services before deleting. Patient id: ${req.params.id}`);
            models.PatientService.count({patientId: req.params.id, 'pays.0': {$exists: true}})
                .exec(function (err, srvCount) {
                    if (err) {
                        return Msg.sendError(res, err);
                    }

                    debug(`Payed patient services count: ${srvCount}`);

                    if (srvCount > 0) {
                        return Msg.sendError(res, 'Нельзя удалить пациента с оплаченными услугами.');
                    }

                    next();
                });
        },
        function (req, res) {
            debug(`Deleting patient with id: ${req.params.id}`);

            req.patient.remove(function (err) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                //todo: Delete related patient services

                Msg.sendSuccess(res, 'Запись удален!');
            });
        });

module.exports = router;