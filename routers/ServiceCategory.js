'use strict';

var router = require('express').Router();
var debug = require('debug')('myclinic:router:servicecategory');
var slug = require('limax');
var models = require('../models');
var Msg = require('../include/Msg');
var F = require('../include/F');
var L = require('../include/L');

router
    .use(function (req, res, next) {
        L.context = 'serviceCategory';
        next();
    })
    .param('id', function (req, res, next, id) {
        models.ServiceCategory.findById(id).exec(function (err, category) {
            if (err) {
                return Msg.sendError(res, err);
            }

            req.serviceCategory = category;
            next();
        });
    })
    .get('/:id', function (req, res) {
        L.logger.info('Получить информацию о категории', L.meta());
        Msg.sendSuccess(res, '', req.serviceCategory, {log: false});
    })
    .get('/', function (req, res) {
        L.logger.info('Список категорий', L.meta());
        models.ServiceCategory.find()
            .sort({title: 1, 'subcategories.title': 1, 'subcategories.subcategories.title': 1})
            .populate('user', 'username lastName firstName middleName')
            .exec(function (err, serviceCategories) {
                if (err) {
                    return Msg.sendError(res, err.message);
                }

                Msg.sendSuccess(res, '', serviceCategories, {log: false});
            });
    })
    .post('/', function (req, res) {
        L.logger.info('Новая категория', L.meta());

        if (!models.User.can(req.user, 'category:create')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        // create model and fill fields from request body
        let newServiceCat = new models.ServiceCategory(req.body);

        newServiceCat._id = slug(newServiceCat.title);
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
        L.logger.info('Изменить категорию', L.meta());

        if (!models.User.can(req.user, 'category:edit')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        req.serviceCategory = Object.assign(req.serviceCategory, req.body);

        req.serviceCategory.save(function (err, serviceCategory) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.', serviceCategory);
        });
    })
    .delete('/:id',
        function (req, res, next) {
            L.logger.info('Удалить категорию', L.meta());

            if (!models.User.can(req.user, 'category:delete')) {
                return Msg.sendError(res, 'Доступ запрещен.');
            }

            models.Service.count({'category._id': req.serviceCategory._id}, function (err, count) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                if (count > 0) {
                    return Msg.sendError(res, 'Категория используются, её нельзя удалить.');
                }

                next();
            });
        },
        function (req, res) {
            req.serviceCategory.remove(function (err) {
                if (err) {
                    return Msg.sendError(res, err.message);
                }

                Msg.sendSuccess(res, 'Запись удален!');
            });
        }
    );

module.exports = router;