'use strict';

var router = require('express').Router();
var debug = require('debug')('myclinic:router:servicecategory');
var models = require('../models');
var Msg = require('../include/Msg');
var F = require('../include/F');

router
    .param('id', function (req, res, next, id) {
        models.ServiceCategory.findById(id).exec(function (err, category) {
            if (err) {
                return Msg.sendError(res, err);
            }

            req.serviceCategory = category;
            next();
        });
    })
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
        //req.serviceCategory.populate('user', 'username lastName firstName middleName');
        Msg.sendSuccess(res, '', req.serviceCategory, 'Service:');
    })
    .get('/', function (req, res) {
        models.ServiceCategory.find()
            .sort({title: 1, 'subcategories.title': 1, 'subcategories.subcategories.title': 1})
            .populate('user', 'username lastName firstName middleName')
            .exec(function (err, serviceCategories) {
                if (err) {
                    return Msg.sendError(res, err.message);
                }

                Msg.sendSuccess(res, '', serviceCategories, 'List of service categories:');
            });
    })
    .post('/', function (req, res) {
        // create model and fill fields from request body
        let newServiceCat = new models.ServiceCategory(req.body);

        newServiceCat.created = new Date();
        newServiceCat.user = req.user._id;

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
        req.serviceCategory = Object.assign(req.serviceCategory, req.body);

        req.serviceCategory.save(function (err, serviceCategory) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.', serviceCategory);
        });
    })
    .delete('/:id', function (req, res) {
        req.serviceCategory.remove(function (err) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, 'Запись удален!');
        });
    });

module.exports = router;