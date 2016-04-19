'use strict';

var router = require('express').Router();
var models = require('../models');
var Msg = require('../include/Msg');
var ObjectId = require('mongoose').Types.ObjectId;

router
    .post('/pending-patients', function (req, res) {
        models.PatientService.aggregate([
            //db.patientservices.aggregate([
            {
                $match: {
                    'state._id': 'new'
                }
            },
            {
                $group: {
                    _id: '$patientId', // _id is patient id
                    quantity: {$sum: '$quantity'},
                    total: {$sum: '$priceTotal'},
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
            'state._id': 'new'
        };

        models.PatientService.find(condition).sort({created: -1}).exec(function (err, patientServices) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, '', patientServices, 'List of patient services:');
        });
    });

module.exports = router;