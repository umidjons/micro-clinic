'use strict';

var router = require('express').Router();
var debug = require('debug')('myclinic:router:service');
var models = require('../models');
var Msg = require('../include/Msg');

router
    .param('id', function (req, res, next, id) {
        debug(`param(id): ${id}`);
        models.Service.findById(id, function (err, service) {
            if (err) {
                return Msg.sendError(res, err);
            }

            req.service = service;
            next();
        });
    })
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
                    user: 1,
                    created: 1,
                    price: 1,
                    fields: 1,
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
        //req.service.populate('user', 'username lastName firstName middleName');
        Msg.sendSuccess(res, '', req.service, 'Service:');
    })
    .get('/', function (req, res) {
        var light = req.query.light;
        models.Service.find()
            .sort({
                'category.title': 1,
                'subcategory.title': 1,
                'subsubcategory.title': 1,
                'category.subcategories.title': 1,
                title: 1
            })
            .populate('user', 'username lastName firstName middleName')
            .lean()
            .exec(function (err, services) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                if (light) {
                    for (let srv of services) {
                        srv.templateCount = srv.templates ? srv.templates.length : 0;
                        srv.templates = undefined;
                    }
                }

                Msg.sendSuccess(res, '', services, 'List of services:');
            });
    })
    .post('/clone', function (req, res) {
        if (!models.User.can(req.user, 'service:create')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        var srv = req.body;

        // remove unnecessary _id
        delete srv._id;

        // set new create date & time
        srv.created = new Date();

        // set who cloned
        srv.user = req.user._id;

        // create model and fill fields from request body
        let newService = new models.Service(srv);

        // delete category & subcategory subcategories
        models.Service.lighten(newService);

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
    .post('/', function (req, res) {
        if (!models.User.can(req.user, 'service:create')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        // create model and fill fields from request body
        let newService = new models.Service(req.body);
        newService.created = new Date();
        newService.user = req.user._id;

        // delete category & subcategory subcategories
        models.Service.lighten(newService);

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
        if (!models.User.can(req.user, 'service:edit')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        req.service = Object.assign(req.service, req.body);

        // delete category & subcategory subcategories
        models.Service.lighten(req.service);

        req.service.save(function (err, service) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.', service);
        });
    })
    .delete('/:id',
        function (req, res, next) {
            if (!models.User.can(req.user, 'service:delete')) {
                return Msg.sendError(res, 'Доступ запрещен.');
            }

            req.service.isUsed(function (err, isUsed) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                if (isUsed) {
                    return Msg.sendError(res, 'Существуют связанные записи. Услугу нельзя удалить!', req.service);
                }

                next();
            });
        },
        function (req, res) {
            req.service.remove(function (err) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                Msg.sendSuccess(res, 'Запись удален!');
            });
        });

module.exports = router;