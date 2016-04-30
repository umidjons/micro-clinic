'use strict';

var router = require('express').Router();
var models = require('../models');
var Msg = require('../include/Msg');
var F = require('../include/F');
var ObjectId = require('mongoose').Types.ObjectId;
var async = require('async');

router
    .post('/pending-patients', function (req, res) {
        models.PatientService.aggregate([
            //db.patientservices.aggregate([
            {
                $match: {
                    'state._id': {$in: ['new', 'partlyPayed']}
                }
            },
            {
                $group: {
                    _id: '$patientId', // _id is patient id
                    quantity: {$sum: '$quantity'},
                    totalPrice: {$sum: '$priceTotal'},
                    totalPayed: {$sum: '$payed'},
                    totalDebt: {$sum: '$debt'},
                    lastService: {$max: '$created'}
                }
            },
            {
                $lookup: {
                    from: 'patients',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'patient'
                }
            },
            {
                $sort: {lastService: -1}
            },
            {
                $unwind: '$patient'
            }
        ], function (err, records) {
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

        if (!patSrvList || patSrvList.length == 0) {
            return Msg.sendError(res, 'Данные не указаны!');
        }

        var time = new Date();

        for (let patSrv of patSrvList) {
            if (!patSrv.pays || patSrv.pays.length == 0) {
                return Msg.sendError(`Оплата услуги ${patSrv.title} не указана!`);
            }

            for (let pay of patSrv.pays) {
                // no state means new payment, process it
                if (!pay.state) {
                    // check amount
                    if (pay.amount < 0) {
                        return Msg.sendError(`Указана неправильная сумма! Услуга: ${patSrv.title}.`);
                    }

                    if (pay.amount == 0 && (!pay.discount || pay.discount.amount < 100)) {
                        return Msg.sendError(`Сумма не указана! Услуга: ${patSrv.title}.`);
                    }

                    // decrease debt & increase payed
                    patSrv.debt -= pay.amount;
                    patSrv.payed += pay.amount;

                    // change service state
                    if (patSrv.debt > 0) {
                        patSrv.state = {_id: 'partlyPayed', title: 'Частично оплачен'};
                    } else {
                        patSrv.state = {_id: 'payed', title: 'Оплачен'};
                    }

                    pay.created = time;
                    pay.userId = 1; // todo: set currently logged in user's id (or model)

                    // set pay state
                    pay.state = {_id: 'payed', title: 'Оплачен'};
                }
            }
        }

        next();
    }, function (req, res) {
        // output request body
        F.inspect(req.body, 'Modified patient services:');

        // save all patient services with pays
        async.each(
            req.body.pendingServices, // array of patient services with pays
            function (patSrv, done) {
                models.PatientService.findById(patSrv._id, function (err, doc) {
                    doc.debt = patSrv.debt;
                    doc.payed = patSrv.payed;
                    doc.state = patSrv.state;
                    if (!doc.pays) {
                        doc.pays = patSrv.pays;
                    } else {
                        for (let pay of patSrv.pays) {
                            doc.pays.push(pay);
                        }
                    }
                    doc.save(function (err, savedPatSrv) {
                        if (err) {
                            return done(err);
                        }
                        done();
                    });
                });
            },
            function (err) {
                if (err) {
                    // One of the patient service has error, stop all processing
                    console.log('Err:', err);
                    return Msg.sendError(res, err);
                } else {
                    // all patient services successfully saved
                    return Msg.sendSuccess(res, 'Данные успешно сохранены.');
                }
            }
        );
    });

module.exports = router;