'use strict';

var router = require('express').Router();
var debug = require('debug')('myclinic:router:branch');
var models = require('../models');
var Msg = require('../include/Msg');
var L = require('../include/L');
var F = require('../include/F');

router
    .use(function (req, res, next) {
        L.context = 'log';
        next();
    })
    .get('/context', function (req, res) {
        models.Log.distinct('meta.zContext', {'meta.zContext': {$exists: true, $ne: null}}, function (err, contexts) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, '', contexts)
        });
    })
    .get('/method', function (req, res) {
        models.Log.distinct('meta.zMethod', {'meta.zMethod': {$exists: true, $ne: null}}, function (err, methods) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, '', methods)
        });
    })
    .get('/level', function (req, res) {
        models.Log.distinct('level', {'level': {$exists: true, $ne: null}}, function (err, levels) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, '', levels)
        });
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
    .get('/',
        function (req, res, next) {
            var condition = {};

            // if period specified, filter by it
            if (req.query.start && req.query.end) {
                let period = F.normalizePeriod(req.query.start, req.query.end);
                condition['timestamp'] = {$gte: period.start, $lte: period.end};
            }

            // if branch id is specified, filter logs by it
            if (req.query.branch) {
                condition['meta.zBranchId'] = req.query.branch;
            }

            // if context is specified, filter logs by it
            if (req.query.context) {
                condition['meta.zContext'] = req.query.context;
            }

            // if method is specified, filter logs by it
            if (req.query.method) {
                condition['meta.zMethod'] = req.query.method;
            }

            // if level is specified, filter logs by it
            if (req.query.level) {
                condition['level'] = req.query.level;
            }

            // if user id is specified, filter logs by it
            if (req.query.uid) {
                condition['meta.zUserId'] = req.query.uid;
            }

            // if user name is specified, filter logs by it
            if (req.query.login) {
                condition['meta.zUsername'] = req.query.login;
            }

            req.condition = condition;

            models.Log.count(condition, function (err, count) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                // set total items header
                res.header('X-Total-Items', count);

                next();
            });
        },
        function (req, res) {
            var pageCurrent = 1 * req.query.p || 1;
            var pageSize = 1 * req.query.ps || 0; // limit=0 means no limit, so default is to retrieve all
            var skip = (pageCurrent - 1) * pageSize;

            debug(`skip=${skip} pageCurrent=${pageCurrent} pageSize=${pageSize}`);

            models.Log
                .find(req.condition)
                .skip(skip)
                .limit(pageSize)
                .sort({timestamp: -1})
                .lean()
                .exec(function (err, logs) {
                    if (err) {
                        return Msg.sendError(res, err);
                    }

                    Msg.sendSuccess(res, '', logs);
                });
        }
    );

module.exports = router;