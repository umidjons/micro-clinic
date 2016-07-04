'use strict';

var router = require('express').Router();
var debug = require('debug')('myclinic:router:partner');
var models = require('../models');
var Msg = require('../include/Msg');

router
    .param('id', function (req, res, next, id) {
        debug(`param(id): ${id}`);

        models.Partner.findById(id).exec(function (err, partner) {
            if (err) {
                return Msg.sendError(res, err);
            }

            req.partner = partner;
            next();
        });
    })
    .post('/interests/details/:partnerCode', function (req, res) {
        if (!models.User.can(req.user, 'report:partnerInterests')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        if (!req.body.period || !req.body.period.start || !req.body.period.end) {
            return Msg.sendError(res, 'Неправильный период!');
        }

        models.Partner.interestsDetails(
            req.body.period.start,
            req.body.period.end,
            req.params.partnerCode,
            function (err, records) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                Msg.sendSuccess(res, '', records);
            }
        );
    })
    .post('/interests', function (req, res) {
        if (!models.User.can(req.user, 'report:partnerInterests')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        if (!req.body.period || !req.body.period.start || !req.body.period.end) {
            return Msg.sendError(res, 'Неправильный период!');
        }

        let partnerId = req.body.partnerId;

        models.Partner.interests(req.body.period.start, req.body.period.end, partnerId, function (err, records) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, '', records);
        });
    })
    .get('/:id', function (req, res) {
        req.partner.populate('user', 'username lastName firstName middleName');
        Msg.sendSuccess(res, '', req.partner, 'Partner:');
    })
    .get('/', function (req, res) {
        models.Partner.find()
            .sort({code: 1})
            .populate('user', 'username lastName firstName middleName')
            .exec(function (err, partners) {
                if (err) {
                    return Msg.sendError(res, err.message);
                }

                Msg.sendSuccess(res, '', partners, 'List of partners:');
            });
    })
    .post('/', function (req, res) {
        if (!models.User.can(req.user, 'partner:create')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        // create model and fill fields from request body
        let newPartner = new models.Partner(req.body);
        newPartner.created = new Date();
        newPartner.user = req.user._id;

        // try to save partner
        newPartner.save(function (err, partner) {
            // if there is error, send it and stop handler with return
            if (err) {
                if (err.code == 11000) {
                    return Msg.sendError(res, 'Партнёр с таким кодом уже существует.');
                }
                return Msg.sendError(res, err);
            }

            // increment partner code on application settings
            models.Partner.incCode(function (err) {
                if (err) {
                    return Msg.sendError(res, err);
                }
                // all right, show success message
                Msg.sendSuccess(res, 'Данные успешно сохранены.', {partnerId: partner._id});
            });
        });
    })
    .put('/:id', function (req, res) {
        if (!models.User.can(req.user, 'partner:edit')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        req.partner = Object.assign(req.partner, req.body);
        req.partner.save(function (err) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .delete('/:id', function (req, res) {
        if (!models.User.can(req.user, 'partner:delete')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        req.partner.remove(function (err) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, 'Запись удален!');
        });
    });

module.exports = router;