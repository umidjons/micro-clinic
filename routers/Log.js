'use strict';

var router = require('express').Router();
var debug = require('debug')('myclinic:router:branch');
var models = require('../models');
var Msg = require('../include/Msg');
var L = require('../include/L');

router
    .use(function (req, res, next) {
        L.context = 'log';
        next();
    })
    .param('id', function (req, res, next, id) {
        debug(`id: ${req.params.id}`);
        models.Log.findOne({_id: req.params.id})
            .exec(function (err, log) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                req.log = log;
                next();
            });
    })
    .get('/:id', function (req, res) {
        Msg.sendSuccess(res, '', req.log);
    })
    .get('/', function (req, res) {
        var condition = {};
        // todo: search by period, user, context
        models.Log
            .find(condition)
            .sort({timestamp: -1})
            .exec(function (err, logs) {
                if (err) {
                    return Msg.sendError(res, err.message);
                }

                Msg.sendSuccess(res, '', logs);
            });
    });

module.exports = router;