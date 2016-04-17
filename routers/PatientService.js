'use strict';

var router = require('express').Router();
var models = require('../models');
var Msg = require('../include/Msg');

router
    .get('/:id', function (req, res) {
        models.PatientService.findOne({_id: req.params.id}, function (err, patientService) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, '', patientService, 'Patient:');
        });
    })
    .get('/for/:patientId', function (req, res) {
        models.PatientService.find({patientId: req.params.patientId}, function (err, patientServices) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, '', patientServices, 'List of patient services:');
        });
    })
    .post('/',
        function (req, res, next) {
            // middleware to prepare patient services for save

            console.log('Request body 1:', req.body);

            // todo: set currently logged in user's id (or model)
            let user = 1;
            let time = new Date();
            for (let srv of req.body.services) {
                // delete _id, because it belongs to the service, not patient service
                delete srv._id;

                srv.userId = user;

                // there is already 'created' field from Service model, we MUST override it
                srv.created = time;

                // set patient id for each service
                srv.patientId = req.body.patientId;

                srv.state = {_id: 'new', title: 'новая'};
            }
            next();
        },
        function (req, res) {
            console.log('Request body 2:', req.body);

            models.PatientService.create(req.body.services, function (err, patientServices) {
                // if there is error, send it and stop handler with return
                if (err) {
                    console.log('Err:', err);
                    return Msg.sendError(res, err);
                }

                // all right, show success message
                Msg.sendSuccess(res, 'Данные успешно сохранены.');
            });
        }
    )
    .put('/:id', function (req, res) {
        console.log('Request body:', req.body);
        console.log('id:', req.params.id);

        models.PatientService.update({_id: req.params.id}, req.body, function (err, raw) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .post('/delete-bulk', function (req, res) {
        var ids = req.body.ids;
        console.log('/delete-bulk IDS:', ids);
        models.PatientService.remove({_id: {$in: ids}}, function (err, raw) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, 'Записи удалены!');
        });
    })
    .delete('/:id', function (req, res) {
        console.log('id:', req.params.id);

        models.PatientService.remove({_id: req.params.id}, function (err, removedPatientService) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, 'Запись удален!');
        });
    });

module.exports = router;