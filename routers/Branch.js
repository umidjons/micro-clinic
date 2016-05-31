'use strict';

var router = require('express').Router();
var debug = require('debug')('myclinic:router:branch');
var models = require('../models');
var Msg = require('../include/Msg');

router
    .param('id', function (req, res, next, id) {
        debug(`id: ${req.params.id}`);
        models.Branch.findOne({_id: req.params.id})
            .populate('user', 'username lastName firstName middleName')
            .exec(function (err, branch) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                req.branch = branch;
                next();
            });
    })
    .get('/:id', function (req, res) {
        Msg.sendSuccess(res, '', req.branch, 'Branch:');
    })
    .get('/', function (req, res) {
        var condition = {};
        if (!req.query.all) {
            condition = {'state._id': 'active'};
        }
        models.Branch
            .find(condition)
            .sort({title: 1})
            .populate('user', 'username lastName firstName middleName')
            .exec(function (err, branches) {
                if (err) {
                    return Msg.sendError(res, err.message);
                }

                Msg.sendSuccess(res, '', branches, 'List of branches:');
            });
    })
    .post('/', function (req, res) {
        // create model and fill fields from request body
        let newBranch = new models.Branch(req.body);
        newBranch.user = req.user._id;

        // try to save branch
        newBranch.save(function (err) {
            // if there is error, send it and stop handler with return
            if (err) {
                return Msg.sendError(res, err.message);
            }

            // all right, show success message
            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .put('/:id', function (req, res) {
        req.branch = Object.assign(req.branch, req.body);

        req.branch.save(function (err) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .delete('/:id', function (req, res) {
        req.branch.remove(function (err) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, 'Запись удален!');
        });
    });

module.exports = router;