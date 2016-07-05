'use strict';

var router = require('express').Router();
var debug = require('debug')('myclinic:router:cash');
var models = require('../models');
var Msg = require('../include/Msg');
var F = require('../include/F');
var L = require('../include/L');

router
    .use(function (req, res, next) {
        L.context = 'cash';
        next();
    })
    .post('/pending-patients', function (req, res) {
        debug(F.inspect(req.body.branch, 'Filter pending patients by branch:', true));

        models.PatientService.pendingPatients(req.body.branch, req.body.period, function (err, records) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, '', records);
        });
    })
    .post('/registry', function (req, res) {
        if (!models.User.can(req.user, 'cash:registry')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        if (!req.body.startDate || !req.body.endDate) {
            return Msg.sendError(res, 'Неправильный период!');
        }
        models.PatientService.payedPatients(
            req.body.branch,
            req.body.startDate,
            req.body.endDate,
            function (err, records) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                Msg.sendSuccess(res, '', records);
            });
    })
    .post('/registry/pay-details/:patientId', function (req, res) {
        if (!models.User.can(req.user, 'cash:registry')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        if (!req.body.payTime) {
            return Msg.sendError(res, 'Неправильная время оплаты!');
        }

        models.PatientService.payDetails(req.params.patientId, req.body.payTime, false, function (err, records) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, '', records);
        });
    })
    .post('/refund', function (req, res) {
        if (!models.User.can(req.user, 'cash:cancel')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        if (!req.body.patientId || !req.body.payTime || !req.body.payAmount) {
            return Msg.sendError(res, 'Указаны неправильные параметры');
        }
        let payInfo = {
            branch: req.body.branch,
            patientId: req.body.patientId,
            payTime: req.body.payTime,
            payAmount: req.body.payAmount
        };
        models.Cash.refund(req.user, payInfo, function (err) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, 'Возврат денег успешно выполнен.', payInfo);
        });
    })
    .get('/registry/print-check/:patientId/:payTime', function (req, res) {
        debug(`Print check. Patient id: ${req.params.patientId}. Pay time: ${req.params.payTime}`);

        if (!req.params.patientId || !req.params.payTime) {
            return Msg.sendError(res, 'Указаны неправильные параметры.');
        }

        models.PatientService.payDetails(req.params.patientId, req.params.payTime, true, function (err, records) {
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
        debug(`branch: ${req.query.branch}`);

        models.PatientService.pendingServicesOf(
            req.query.branch,
            req.params.patientId,
            function (err, patientServices) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                Msg.sendSuccess(res, '', patientServices);
            });
    })
    .post('/pay-all', function (req, res) {
        if (!models.User.can(req.user, 'cash:pay')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

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
        if (!models.User.can(req.user, 'cash:pay')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

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