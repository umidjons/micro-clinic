'use strict';

var router = require('express').Router();
var models = require('../models');
var Msg = require('../include/Msg');

router
    .get('/:id', function (req, res) {
        models.Partner.findOne({_id: req.params.id}, function (err, partner) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, '', partner, 'Partner:');
        });
    })
    .get('/', function (req, res) {
        models.Partner.find(function (err, partners) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, '', partners, 'List of partners:');
        });
    })
    .post('/', function (req, res) {
        console.log('Request body:', req.body);

        // create model and fill fields from request body
        let newPartner = new models.Partner(req.body);

        // try to save partner
        newPartner.save(function (err) {
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

        models.Partner.update({_id: req.params.id}, req.body, function (err, raw) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .delete('/:id', function (req, res) {
        console.log('id:', req.params.id);

        models.Partner.remove({_id: req.params.id}, function (err, removedPartner) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, 'Запись удален!');
        });
    });

module.exports = router;