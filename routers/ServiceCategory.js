'use strict';

var router = require('express').Router();
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
    .post('/', function (req, res) {
        console.log('Request body:', req.body);

        // create model and fill fields from request body
        let newServiceCat = new models.ServiceCategory(req.body);

        // try to save
        newServiceCat.save(function (err) {
            // if there is error, send it and stop handler with return
            if (err) {
                return Msg.sendError(res, err.message);
            }

            // all right, show success message
            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .put('/:id', function (req, res) {
        console.log('Request body:', req.body);
        console.log('id:', req.params.id);

        models.ServiceCategory.update({_id: req.params.id}, req.body, function (err, raw) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .delete('/:id', function (req, res) {
        console.log('id:', req.params.id);

        models.ServiceCategory.remove({_id: req.params.id}, function (err, removedServiceCategory) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, 'Запись удален!');
        });
    });

module.exports = router;