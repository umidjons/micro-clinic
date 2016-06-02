'use strict';

var router = require('express').Router();
var debug = require('debug')('myclinic:router:cash');
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
    .post('/registry', function (req, res) {
        if (!req.body.startDate || !req.body.endDate) {
            return Msg.sendError(res, 'Неправильный период!');
        }
        models.PatientService.payedPatients(req.body.startDate, req.body.endDate, function (err, records) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, '', records);
        });
    })
    .post('/registry/pay-details/:patientId', function (req, res) {
        if (!req.body.payTime) {
            return Msg.sendError(res, 'Неправильная время оплаты!');
        }

        models.PatientService.payDetails(req.params.patientId, req.body.payTime, function (err, records) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, '', records);
        });
    })
    .post('/pending-services-of/:patientId', function (req, res) {
        debug(`patientId: ${req.params.patientId}`);

        models.PatientService.pendingServicesOf(req.params.patientId, function (err, patientServices) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, '', patientServices, 'List of patient services:');
        });
    })
    .post('/pay-all', function (req, res) {
        var payInfo = req.body.pay;

        debug('Paying all patient services.' + F.inspect(payInfo, 'Pay Info', true));

        models.Cash.payAll(req.user, payInfo, function (err) {
            if (err) {
                return Msg.sendError(res, err);
            }

            return Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .post('/', function (req, res, next) {
        var patSrvList = req.body.pendingServices;
        models.Cash.preparePays(req.user, patSrvList, function (err) {
            if (err) {
                return Msg.sendError(err);
            }
            next();
        });
    }, function (req, res) {
        // output request body
        debug('Saving pays: ' + F.inspect(req.body, 'Modified patient services:', true));

        models.Cash.savePays(req.body.pendingServices, function (err) {
            if (err) {
                return Msg.sendError(res, err);
            }
            return Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    });

module.exports = router;