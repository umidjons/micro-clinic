'use strict';

var router = require('express').Router();
var models = require('../models');
var Msg = require('../include/Msg');
var sugar = require('sugar');
var debug = require('debug')('myclinic:router:patient');

router
    .post('/search',
        function (req, res, next) {
            debug(`Search params: ${req.body}`);

            if (!req.body.firstName || !req.body.lastName) {
                return Msg.sendError(res, 'Объязательные параметры не указаны.');
            }

            var condition = {
                firstName: new RegExp(req.body.firstName, 'i'),
                lastName: new RegExp(req.body.lastName, 'i')
            };

            if (req.body.middleName) {
                condition.middleName = new RegExp(req.body.middleName, 'i');
            }

            if (req.body.dateOfBirth) {
                condition.dateOfBirth = {
                    $gte: Date.create(req.body.dateOfBirth).beginningOfDay(),
                    $lte: Date.create(req.body.dateOfBirth).endOfDay()
                };
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
        models.Patient.findOne({_id: req.params.id}, function (err, patient) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, '', patient, 'Patient:');
        });
    })
    .get('/',
        function (req, res, next) {
            models.Patient.count(function (err, count) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                // set total items header
                res.header('X-Total-Items', count);

                next();
            });
        },
        function (req, res, next) {
            var pageCurrent = 1 * req.query.p || 1;
            var pageSize = 1 * req.query.ps || 0; // limit=0 means no limit, so default is to retrieve all
            var skip = (pageCurrent - 1) * pageSize;

            debug(`skip=${skip} pageCurrent=${pageCurrent} pageSize=${pageSize}`);

            models.Patient.find()
                .skip(skip)
                .limit(pageSize)
                .sort({created: -1})
                .lean()
                .exec(function (err, patients) {
                    if (err) {
                        return Msg.sendError(res, err);
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
                Msg.sendSuccess(res, '', results, 'List of patients:');
            });
        })
    .post('/', function (req, res) {
        debug(`Request body: ${req.body}`);

        // create model and fill fields from request body
        let newPatient = new models.Patient(req.body);
        newPatient.created = new Date();

        // try to save patient
        newPatient.save(function (err, savedPatient) {
            // if there is error, send it and stop handler with return
            if (err) {
                return Msg.sendError(res, err);
            }

            // all right, show success message
            Msg.sendSuccess(res, 'Данные успешно сохранены.', savedPatient);
        });
    })
    .put('/:id', function (req, res) {
        //debug(`Request body: ${req.body}`);
        debug(`id: ${req.params.id}`);

        models.Patient.update({_id: req.params.id}, req.body, function (err, raw) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.', req.body);
        });
    })
    .delete('/:id', function (req, res) {
        debug(`id: ${req.params.id}`);

        models.Patient.remove({_id: req.params.id}, function (err) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, 'Запись удален!');
        });
    });

module.exports = router;