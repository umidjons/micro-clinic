'use strict';

var router = require('express').Router();
var debug = require('debug')('myclinic:router:servicecategory');
var models = require('../models');
var Msg = require('../include/Msg');

router
    .get('/with-services', function (req, res) {
        models.Service.aggregate([
            {
                $project: {
                    _id: 0,
                    categoryTitle: '$category.title'
                }
            },
            {
                $group: {
                    _id: '$categoryTitle'
                }
            },
            {
                $sort: {categoryTitle: 1}
            }
        ], function (err, categories) {
            if (err) {
                Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, '', categories, 'Categories with services:');
        });
    })
    .get('/:id', function (req, res) {
        models.ServiceCategory.findOne({_id: req.params.id}, function (err, serviceCategory) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, '', serviceCategory, 'Service:');
        });
    })
    .get('/', function (req, res) {
        models.ServiceCategory.find().sort({title: 1}).exec(function (err, serviceCategories) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, '', serviceCategories, 'List of service categories:');
        });
    })
    .post('/:id?', function (req, res) {
        //console.log('Request body:', req.body);

        // create model and fill fields from request body
        let newServiceCat = new models.ServiceCategory(req.body);

        newServiceCat.created = new Date();
        newServiceCat.userId = '1'; //todo: set real user id or user schema

        // try to save
        newServiceCat.save(function (err, savedServiceCategory) {
            // if there is error, send it and stop handler with return
            if (err) {
                return Msg.sendError(res, err.message);
            }

            // all right, show success message
            Msg.sendSuccess(res, 'Данные успешно сохранены.', savedServiceCategory);
        });
    })
    .put('/:id', function (req, res) {
        debug(`id: ${req.params.id}`);

        var serviceCategory = req.body;

        models.ServiceCategory.update({_id: req.params.id}, serviceCategory, function (err) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.', serviceCategory);
        });
    })
    .delete('/:id', function (req, res) {
        debug(`id:${req.params.id}`);

        models.ServiceCategory.remove({_id: req.params.id}, function (err, removedServiceCategory) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, 'Запись удален!');
        });
    });

module.exports = router;