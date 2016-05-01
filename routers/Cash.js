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
        models.PatientService.pendingServicesOf(req.params.patientId, function (err, patientServices) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, '', patientServices, 'List of patient services:');
        });
    })
    .post('/pay-all', function (req, res) {
        var payInfo = req.body.pay;

        F.inspect(payInfo, 'Pay Info');

        models.PatientService.pendingServicesOf(payInfo.patientId, function (err, patientServices) {
            if (err) {
                return Msg.sendError(res, err);
            }

            if (patientServices.length == 0) {
                return Msg.sendError(res, 'Неоплаченные услуги не найдены.');
            }

            let totalDebt = 0;
            for (let patSrv of patientServices) {
                totalDebt += patSrv.debt;
            }

            if (totalDebt != payInfo.totalDebt) {
                return Msg.sendError('Неверная сумма оплаты.');
            }

            for (let patSrv of patientServices) {
                patSrv.pays.push({
                    amount: patSrv.debt,
                    payType: payInfo.payType
                });
            }

            models.Cash.preparePays(patientServices, function (err) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                models.Cash.savePays(patientServices, function (err) {
                    if (err) {
                        return Msg.sendError(res, err);
                    }
                    return Msg.sendSuccess(res, 'Данные успешно сохранены.');
                });
            });
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