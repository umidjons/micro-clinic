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
        if (!models.User.can(req.user, 'branch:create')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

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
        if (!models.User.can(req.user, 'branch:edit')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        req.branch = Object.assign(req.branch, req.body);

        req.branch.save(function (err) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .delete('/:id',
        function (req, res, next) {
            if (!models.User.can(req.user, 'branch:delete')) {
                return Msg.sendError(res, 'Доступ запрещен.');
            }

            // Is branch used in Patient model?
            models.Patient.count({branch: req.branch._id}, function (err, count) {
                if (err) {
                    return Msg.sendError(res, err);
                }
                if (count > 0) {
                    return Msg.sendError(res, 'Филиал используются, его нельзя удалить');
                }

                next();
            });
        },
        function (req, res, next) {
            // Is branch used in PatientService model?
            models.PatientService.count({branch: req.branch._id}, function (err, count) {
                if (err) {
                    return Msg.sendError(res, err);
                }
                if (count > 0) {
                    return Msg.sendError(res, 'Филиал используются, его нельзя удалить');
                }

                next();
            });
        },
        function (req, res, next) {
            // Is branch used in User model?
            models.User.count({'branch._id': req.branch._id}, function (err, count) {
                if (err) {
                    return Msg.sendError(res, err);
                }
                if (count > 0) {
                    return Msg.sendError(res, 'Филиал используются, его нельзя удалить');
                }

                next();
            });
        },
        function (req, res) {
            req.branch.remove(function (err) {
                if (err) {
                    return Msg.sendError(res, err.message);
                }

                Msg.sendSuccess(res, 'Запись удален!');
            });
        });

module.exports = router;