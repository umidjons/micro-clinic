'use strict';

var router = require('express').Router();
var debug = require('debug')('myclinic:router:company');
var models = require('../models');
var Msg = require('../include/Msg');

router
    .param('id', function (req, res, next, id) {
        debug(`id: ${req.params.id}`);
        models.Company.findOne({_id: req.params.id})
            .populate('user', 'username lastName firstName middleName')
            .exec(function (err, company) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                req.company = company;
                next();
            });
    })
    .get('/:id', function (req, res) {
        Msg.sendSuccess(res, '', req.company, 'Company:');
    })
    .get('/', function (req, res) {
        var condition = {};
        if (!req.query.all) {
            condition = {'state._id': 'active'};
        }
        models.Company
            .find(condition)
            .sort({title: 1})
            .populate('user', 'username lastName firstName middleName')
            .exec(function (err, companies) {
                if (err) {
                    return Msg.sendError(res, err.message);
                }

                Msg.sendSuccess(res, '', companies, 'List of companies:');
            });
    })
    .post('/', function (req, res) {
        // create model and fill fields from request body
        let newCompany = new models.Company(req.body);
        newCompany.user = req.user._id;

        // try to save company
        newCompany.save(function (err) {
            // if there is error, send it and stop handler with return
            if (err) {
                return Msg.sendError(res, err.message);
            }

            // all right, show success message
            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .put('/:id', function (req, res) {
        req.company = Object.assign(req.company, req.body);

        req.company.save(function (err) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .delete('/:id',
        function (req, res, next) {
            //todo: check, is there any patient service with this company
            next();
        },
        function (req, res) {
            req.company.remove(function (err) {
                if (err) {
                    return Msg.sendError(res, err.message);
                }

                Msg.sendSuccess(res, 'Запись удален!');
            });
        });

module.exports = router;