'use strict';

var router = require('express').Router();
var models = require('../models');
var Msg = require('../include/Msg');

router
    .get('/:id', function (req, res) {
        models.Service.findOne({_id: req.params.id}, function (err, service) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, '', service, 'Service:');
        });
    })
    .get('/', function (req, res) {
        models.Service.find(function (err, services) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, '', services, 'List of services:');
        });
    })
    .post('/', function (req, res) {
        console.log('Request body:', req.body);

        // create model and fill fields from request body
        let newService = new models.Service(req.body);

        // try to save
        newService.save(function (err) {
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

        models.Service.update({_id: req.params.id}, req.body, function (err, raw) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .delete('/:id', function (req, res) {
        console.log('id:', req.params.id);

        models.Service.remove({_id: req.params.id}, function (err, removedService) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, 'Запись удален!');
        });
    });

module.exports = router;