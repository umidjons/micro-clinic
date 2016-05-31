'use strict';

var router = require('express').Router();
var debug = require('debug')('myclinic:router:user');
var models = require('../models');
var Msg = require('../include/Msg');

router
    .param('id', function (req, res, next, id) {
        debug(`param id: ${req.params.id}`);
        models.User.findOne({_id: req.params.id}, function (err, user) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            // populate user object on request
            req.userObj = user;

            next();
        });
    })
    .get('/:id', function (req, res) {
        // req.userObj is populated via param(id) handler
        Msg.sendSuccess(res, '', req.userObj, 'User:');
    })
    .get('/', function (req, res) {
        models.User.find().exec(function (err, users) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, '', users, 'List of users:');
        });
    })
    .post('/', function (req, res) {
        let user = models.User.sortPermissions(req.body);

        // create model and fill fields from request body
        let newUser = new models.User(user);

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
        // req.userObj contains user object retrieved via param(id) handler

        let user = models.User.sortPermissions(req.body);

        // empty password means - DO NOT CHANGE PASSWORD
        if (user.password == '') {
            delete user.password;
        }

        // merge req.body into user
        req.userObj = Object.assign(req.userObj, user);

        req.userObj.save(function (err) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .delete('/:id', function (req, res) {
        // req.userObj contains user object retrieved via param(id) handler
        req.userObj.remove(function (err) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, 'Запись удален!');
        });
    });

module.exports = router;