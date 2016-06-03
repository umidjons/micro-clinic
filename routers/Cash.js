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
    .get('/registry/print-check/:patientId/:payTime', function (req, res) {
        debug(`Print check. Patient id: ${req.params.patientId}. Pay time: ${req.params.payTime}`);

        if (!req.params.patientId || !req.params.payTime) {
            return Msg.sendError(res, 'Указаны неправильные параметры.');
        }

        models.PatientService.payDetails(req.params.patientId, req.params.payTime, function (err, records) {
            if (err) {
                return Msg.sendError(res, err);
            }

            if (!records || !records.length) {
                return Msg.sendError(res, 'Необходимые данные для распечатки чека не найдены.');
            }

            // 'include cash' flag doesn't set, so exclude cash type pays
            if (!(1 * req.query.ic)) {
                debug('"ic" query parameter is not set, so exclude cash type pays.');
                records = records.filter(function (rec) {
                    return rec.pays.payType._id != 'cash';
                });
            }

            if (!(1 * req.query.icl)) {
                debug('"icl" query parameter is not set, so exclude cashless type pays.');
                records = records.filter(function (rec) {
                    return rec.pays.payType._id != 'cashless';
                });
            }

            if (!records || !records.length) {
                return Msg.sendError(res, 'После фильтрации оплаты по типу необходимые данные для распечатки чека не найдены.');
            }

            models.Patient.findById(req.params.patientId, function (err, patient) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                let total = 0;
                for (let rec of records) {
                    total += rec.pays.amount;
                }

                // send rendered check's content
                res.render('partials/cash/check',
                    {
                        payTime: F.formatDateTime(req.params.payTime),
                        branch: records[0].pays.branch.title,
                        patient: patient,
                        records: records,
                        total: F.formatNumber(total)
                    },
                    function (err, html) {
                        if (err) {
                            return Msg.sendError(res, err);
                        }
                        Msg.sendSuccess(res, '', {checkContent: html});
                    }
                );
            });
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

        models.Cash.payAll(req.user, payInfo, function (err, payTime) {
            if (err) {
                return Msg.sendError(res, err);
            }

            return Msg.sendSuccess(res, 'Данные успешно сохранены.', {payTime: payTime});
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