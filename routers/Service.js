'use strict';

var router = require('express').Router();
var debug = require('debug')('myclinic:router:service');
var models = require('../models');
var Msg = require('../include/Msg');
var L = require('../include/L');

router
    .use(function (req, res, next) {
        L.context = 'service';
        next();
    })
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
    .get('/:id', function (req, res) {
        L.logger.info('Получить информацию об услуге', L.meta());
        Msg.sendSuccess(res, '', req.service, {log: false});
    })
    .get('/', function (req, res) {
        L.logger.info('Список услуг', L.meta());

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

                Msg.sendSuccess(res, '', services, {log: false});
            });
    })
    .post('/clone', function (req, res) {
        L.logger.info('Дублировать услугу', L.meta());

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
        L.logger.info('Новая услуга', L.meta());

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
        L.logger.info('Изменить услугу', L.meta());

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
            L.logger.info('Удалить услугу', L.meta());

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