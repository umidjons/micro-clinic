'use strict';

var router = require('express').Router();
var debug = require('debug')('myclinic:router:partner');
var models = require('../models');
var Msg = require('../include/Msg');
var L = require('../include/L');

router
    .use(function (req, res, next) {
        L.context = 'partner';
        next();
    })
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
        L.logger.info('Получить детализацию по партнёру', L.meta());

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

                Msg.sendSuccess(res, '', records, {log: false});
            }
        );
    })
    .post('/interests', function (req, res) {
        L.logger.info('Получить информацию о доле партнёра', L.meta());

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

            Msg.sendSuccess(res, '', records, {log: false});
        });
    })
    .get('/:id', function (req, res) {
        L.logger.info('Получить информацию о партнёре', L.meta());
        req.partner.populate('user', 'username lastName firstName middleName');
        Msg.sendSuccess(res, '', req.partner, {log: false});
    })
    .get('/', function (req, res) {
        L.logger.info('Список партнёров', L.meta());
        models.Partner.find()
            .sort({code: 1})
            .populate('user', 'username lastName firstName middleName')
            .exec(function (err, partners) {
                if (err) {
                    return Msg.sendError(res, err.message);
                }

                Msg.sendSuccess(res, '', partners, {log: false});
            });
    })
    .post('/', function (req, res) {
        L.logger.info('Новый партнёр', L.meta());

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
        L.logger.info('Изменить партнёра', L.meta());

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
    .delete('/:id',
        function (req, res, next) {
            L.logger.info('Удалить партнёра', L.meta());

            if (!models.User.can(req.user, 'partner:delete')) {
                return Msg.sendError(res, 'Доступ запрещен.');
            }

            models.PatientService.count({'partner._id': req.partner._id}, function (err, count) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                if (count > 0) {
                    return Msg.sendError(res, 'У партнёра существует пациенты, его нельзя удалить.');
                }

                next();
            });
        },
        function (req, res) {
            req.partner.remove(function (err) {
                if (err) {
                    return Msg.sendError(res, err.message);
                }

                Msg.sendSuccess(res, 'Запись удален!');
            });
        }
    );

module.exports = router;