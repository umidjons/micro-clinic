'use strict';

var router = require('express').Router();
var debug = require('debug')('myclinic:router:setting');
var models = require('../models');
var Msg = require('../include/Msg');
var F = require('../include/F');

router
    .param('id', function (req, res, next, id) {
        debug(`id: ${req.params.id}`);
        models.Setting.findOne({_id: req.params.id})
            .exec(function (err, setting) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                req.setting = setting;
                next();
            });
    })
    .get('/:id', function (req, res) {
        Msg.sendSuccess(res, '', req.setting, 'Setting:');
    })
    .get('/', function (req, res) {
        models.Setting
            .find()
            .exec(function (err, settings) {
                if (err) {
                    return Msg.sendError(res, err.message);
                }

                // id-s becomes keys, value-s becomes values
                let config = F.array2object(settings, '_id', 'value');

                Msg.sendSuccess(res, '', config, 'Settings object:');
            });
    })
    .post('/', function (req, res) {
        debug(F.inspect(req.body, 'Settings object from request body:', true));

        models.Setting.saveFromObject(req.body, function (err) {
            if (err) {
                return Msg.sendError(res, err.message);
            }
            return Msg.sendSuccess(res, 'Параметры системы успешно сохранены.', req.body);
        });
    });

module.exports = router;