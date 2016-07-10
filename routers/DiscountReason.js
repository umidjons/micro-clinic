'use strict';

var router = require('express').Router();
var debug = require('debug')('myclinic:router:discountReason');
var models = require('../models');
var Msg = require('../include/Msg');
var F = require('../include/F');
var L = require('../include/L');

router
    .use(function (req, res, next) {
        L.context = 'discountReason';
        next();
    })
    .param('id', function (req, res, next, id) {
        debug(`id: ${req.params.id}`);
        models.DiscountReason.findOne({_id: req.params.id})
            .exec(function (err, reason) {
                if (err) {
                    return Msg.sendError(res, err.message);
                }

                req.reason = reason;
                next();
            });
    })
    .get('/:id', function (req, res) {
        L.logger.info('Получить информацию о причине скидки', L.meta());
        Msg.sendSuccess(res, '', req.reason, {log: false});
    })
    .get('/', function (req, res) {
        L.logger.info('Список причин скидки', L.meta());

        models.DiscountReason.find()
            .sort({text: 1})
            .lean()
            .exec(function (err, reasons) {
                if (err) {
                    return Msg.sendError(res, err.message);
                }

                Msg.sendSuccess(res, '', reasons, {log: false});
            });
    })
    .post('/', function (req, res) {
        L.logger.info('Новая причина скидки', L.meta());

        if (!models.User.can(req.user, 'cash:discount:reason:create')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        // create model and fill fields from request body
        let newReason = new models.DiscountReason(req.body);

        // try to save reason
        newReason.save(function (err) {
            // if there is error, send it and stop handler with return
            if (err) {
                return Msg.sendError(res, err.message);
            }

            // all right, show success message
            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .put('/:id', function (req, res) {
        L.logger.info('Изменить причину скидки', L.meta());

        if (!models.User.can(req.user, 'cash:discount:reason:edit')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        req.reason = Object.assign(req.reason, req.body);

        req.reason.save(function (err) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .delete('/:id',
        function (req, res) {
            L.logger.info('Удалить причину скидки', L.meta());

            if (!models.User.can(req.user, 'cash:discount:reason:delete')) {
                return Msg.sendError(res, 'Доступ запрещен.');
            }

            req.reason.remove(function (err) {
                if (err) {
                    return Msg.sendError(res, err.message);
                }

                Msg.sendSuccess(res, 'Запись удален!');
            });
        });

module.exports = router;