'use strict';

var router = require('express').Router();
var debug = require('debug')('myclinic:router:user');
var models = require('../models');
var Msg = require('../include/Msg');

router
    .get('/:id', function (req, res) {
        debug(`id: ${req.params.id}`);
        models.User.findOne({_id: req.params.id}, function (err, user) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, '', user, 'User:');
        });
    })
    .get('/', function (req, res) {
        models.User.find(function (err, users) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, '', users, 'List of users:');
        });
    })
    .post('/', function (req, res) {

        // create model and fill fields from request body
        let newUser = new models.User(req.body);

        // try to save partner
        newUser.save(function (err) {
            // if there is error, send it and stop handler with return
            if (err) {
                return Msg.sendError(res, err.message);
            }

            // all right, show success message
            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .put('/:id', function (req, res) {
        debug(`id: ${req.params.id}`);

        models.User.update({_id: req.params.id}, req.body, function (err) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .delete('/:id', function (req, res) {
        debug(`id: ${req.params.id}`);

        models.User.remove({_id: req.params.id}, function (err) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, 'Запись удален!');
        });
    });

module.exports = router;