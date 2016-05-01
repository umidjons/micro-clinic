'use strict';

var router = require('express').Router();
var models = require('../models');
var Msg = require('../include/Msg');
var F = require('../include/F');

router
    .post('/pending-patients', function (req, res) {
        models.PatientService.pendingPatients(function (err, records) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, '', records);
        });
    })
    .post('/pending-services-of/:patientId', function (req, res) {
        var condition = {
            patientId: req.params.patientId,
            'state._id': {$in: ['new', 'partlyPayed']}
        };

        models.PatientService.find(condition).sort({created: -1}).exec(function (err, patientServices) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, '', patientServices, 'List of patient services:');
        });
    })
    .post('/', function (req, res, next) {
        var patSrvList = req.body.pendingServices;
        models.Cash.preparePays(patSrvList, function (err) {
            if (err) {
                return Msg.sendError(err);
            }
            next();
        });
    }, function (req, res) {
        // output request body
        F.inspect(req.body, 'Modified patient services:');
        
        models.Cash.savePays(req.body.pendingServices, function (err) {
            if (err) {
                return Msg.sendError(res, err);
            }
            return Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    });

module.exports = router;