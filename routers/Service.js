'use strict';

var router = require('express').Router();
var debug = require('debug')('myclinic:router:service');
var models = require('../models');
var Msg = require('../include/Msg');

router
    .get('/with-category', function (req, res) {
        models.Service.aggregate([
            {
                $match: {
                    'state._id': 'active'
                }
            },
            {
                $project: {
                    categoryId: '$category._id',
                    categoryTitle: '$category.title',
                    categoryShortTitle: '$category.shortTitle',
                    category: 1,
                    title: 1,
                    shortTitle: 1,
                    userId: 1,
                    created: 1,
                    price: 1,
                    __v: 1
                }
            },
            {
                $sort: {
                    categoryTitle: 1,
                    title: 1
                }
            }
        ], function (err, services) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, '', services, 'Services with category');
        });
    })
    .get('/:id', function (req, res) {
        debug(`id: ${req.params.id}`);

        models.Service.findOne({_id: req.params.id}, function (err, service) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, '', service, 'Service:');
        });
    })
    .get('/', function (req, res) {
        models.Service.find().sort({'category.title': 1, title: 1}).exec(function (err, services) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, '', services, 'List of services:');
        });
    })
    .post('/', function (req, res) {
        //console.log('Request body:', req.body);

        // create model and fill fields from request body
        let newService = new models.Service(req.body);

        // try to save
        newService.save(function (err, savedService) {
            // if there is error, send it and stop handler with return
            if (err) {
                return Msg.sendError(res, err);
            }

            // all right, show success message
            Msg.sendSuccess(res, 'Данные успешно сохранены.', savedService);
        });
    })
    .put('/:id', function (req, res) {
        debug(`id: ${req.params.id}`);

        models.Service.update({_id: req.params.id}, req.body, function (err) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.', req.body);
        });
    })
    .delete('/:id', function (req, res) {
        debug(`id: ${req.params.id}`);

        models.Service.remove({_id: req.params.id}, function (err) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, 'Запись удален!');
        });
    });

module.exports = router;