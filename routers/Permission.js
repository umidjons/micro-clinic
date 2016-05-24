'use strict';

var router = require('express').Router();
var debug = require('debug')('myclinic:router:permission');
var models = require('../models');
var Msg = require('../include/Msg');

router
    .get('/:id', function (req, res) {
        debug(`id: ${req.params.id}`);
        models.Permission.findOne({_id: req.params.id}, function (err, permission) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, '', permission, 'Permission:');
        });
    })
    .get('/', function (req, res) {
        models.Permission.find().sort({_id: 1}).exec(function (err, permissions) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, '', permissions, 'List of permissions:');
        });
    });

module.exports = router;