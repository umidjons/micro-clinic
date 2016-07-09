'use strict';

var router = require('express').Router();
var debug = require('debug')('myclinic:router:permission');
var models = require('../models');
var Msg = require('../include/Msg');
var L = require('../include/L');

router
    .use(function (req, res, next) {
        L.context = 'permission';
        next();
    })
    .get('/:id', function (req, res) {
        L.logger.info('Получить информацию о привилегии', L.meta());

        debug(`id: ${req.params.id}`);
        models.Permission.findOne({_id: req.params.id}, function (err, permission) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, '', permission, {log: false});
        });
    })
    .get('/', function (req, res) {
        L.logger.info('Список привилегий', L.meta());

        models.Permission.find().sort({_id: 1}).exec(function (err, permissions) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, '', permissions, {log: false});
        });
    });

module.exports = router;