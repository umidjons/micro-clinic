'use strict';

var router = require('express').Router();
var models = require('../models');

router
    .get('/', function (req, res) {
        models.Patient.find(function (err, patients) {
            if (err) {
                return res.json({code: 'error', message: 'Ошибка: ' + err.message, url: '/'});
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
                return res.json({code: 'error', message: 'Ошибка: ' + err.message});
            }

            // all right, show success message
            res.json({code: 'success', message: 'Данные успешно сохранены.'});
        });
    });

module.exports = router;