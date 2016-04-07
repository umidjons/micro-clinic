'use strict';

var router = require('express').Router();
var models = require('../models');

router
    .get('/:id', function (req, res) {
        models.Patient.findOne({_id: req.params.id}, function (err, patient) {
            if (err) {
                console.error(err);
                return res.json({code: 'error', message: 'Ошибка: ' + err.message});
            }

            console.log('Patient:', patient);
            res.json(patient);
        });
    })
    .get('/', function (req, res) {
        models.Patient.find(function (err, patients) {
            if (err) {
                console.error(err);
                return res.json({code: 'error', message: 'Ошибка: ' + err.message});
            }

            console.log('List of patients:', patients);
            res.json(patients);
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
                console.error(err);
                return res.json({code: 'error', message: 'Ошибка: ' + err.message});
            }

            // all right, show success message
            res.json({code: 'success', message: 'Данные успешно сохранены.'});
        });
    })
    .put('/:id', function (req, res) {
        console.log('Request body:', req.body);
        console.log('id:', req.params.id);
        
        models.Patient.update({_id: req.params.id}, req.body, function (err, raw) {
            console.log('raw:', raw);

            if (err) {
                console.error(err);
                return res.json({code: 'error', message: 'Ошибка: ' + err.message});
            }

            res.json({code: 'success', message: 'Данные успешно сохранены.'});
        });
    });

module.exports = router;