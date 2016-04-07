'use strict';

var router = require('express').Router();
var models = require('../models');
var Msg = require('../include/Msg');

router
    .get('/:id', function (req, res) {
        models.Patient.findOne({_id: req.params.id}, function (err, patient) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, '', patient, 'Patient:');
        });
    })
    .get('/', function (req, res) {
        models.Patient.find(function (err, patients) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, '', patients, 'List of patients:');
        });
    })
    .post('/', function (req, res) {
        console.log('Request body:', req.body);

        // create model and fill fields from request body
        let newPatient = new models.Patient(req.body);

        // try to save patient
        newPatient.save(function (err) {
            // if there is error, send it and stop handler with return
            if (err) {
                return Msg.sendError(res, err.message);
            }

            // all right, show success message
            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .put('/:id', function (req, res) {
        console.log('Request body:', req.body);
        console.log('id:', req.params.id);

        models.Patient.update({_id: req.params.id}, req.body, function (err, raw) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .delete('/:id', function (req, res) {
        console.log('id:', req.params.id);

        models.Patient.remove({_id: req.params.id}, function (err, removedPatient) {
            if (err) {
                return Msg.sendError(res, err.message);
            }
            
            Msg.sendSuccess(res, 'Запись удален!');
        });
    });

module.exports = router;