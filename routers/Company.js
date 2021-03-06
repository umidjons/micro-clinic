'use strict';

var router = require('express').Router();
var debug = require('debug')('myclinic:router:company');
var models = require('../models');
var Msg = require('../include/Msg');
var sugar = require('sugar');
var L = require('../include/L');

router
    .use(function (req, res, next) {
        L.context = 'company';
        next();
    })
    .param('id', function (req, res, next, id) {
        debug(`id: ${req.params.id}`);
        models.Company.findOne({_id: req.params.id})
            .populate('user', 'username lastName firstName middleName')
            .populate('pays.user', 'username lastName firstName middleName')
            .populate('pays.canceledUser', 'username lastName firstName middleName')
            .exec(function (err, company) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                req.company = company;
                next();
            });
    })
    .post('/details/:id', function (req, res) {
        L.logger.info('Детализация организации', L.meta());

        if (!models.User.can(req.user, 'company:details')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        if (!req.body.start || !req.body.end) {
            return Msg.sendError(res, 'Неправильный период!');
        }

        models.Company.details(req.body.start, req.body.end, req.params.id, function (err, details) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, '', details, {log: false});
        });
    })
    .post('/pay/:id', function (req, res) {
        L.logger.info('Пополнить счет организации', L.meta());

        if (!models.User.can(req.user, 'company:pay')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        // check pay amount
        if (req.body.amount <= 0) {
            return Msg.sendError(res, 'Неправильная сумма.');
        }

        // check pay date
        if (!req.body.date) {
            return Msg.sendError(res, 'Неправильная дата оплаты.');
        }

        // generate new pay
        let pay = new models.Deposit();
        pay.amount = req.body.amount;
        pay.date = Date.create(req.body.date);
        pay.state = {_id: 'active', title: 'Активный'};
        pay.created = new Date();
        pay.user = req.user._id;

        // append to the pays list
        req.company.pays.push(pay);

        // change balance
        req.company.balance += pay.amount;

        // save company with modified pays
        req.company.save(function (err, company) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, 'Счет пополнен.', company);
        });
    })
    .delete('/pay/:id/:payId', function (req, res) {
        L.logger.info('Отменить оплату организации', L.meta());

        if (!models.User.can(req.user, 'company:pay:cancel')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        // find and modify pay state
        let pay = req.company.pays.id(req.params.payId);
        pay.amount = -pay.amount; // negate sign
        pay.state = {_id: 'canceled', title: 'Отменен'};
        pay.canceledUser = req.user._id;
        pay.canceled = new Date();

        // change balance
        req.company.balance += pay.amount;

        req.company.save(function (err, company) {
            if (err) {
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, 'Оплата отменена.', company);
        });
    })
    .get('/pays/:id', function (req, res) {
        L.logger.info('Получить информацию об оплатах организации', L.meta());
        Msg.sendSuccess(res, '', req.company.pays, {log: false});
    })
    .get('/:id', function (req, res) {
        L.logger.info('Получить информацию об организации', L.meta());
        Msg.sendSuccess(res, '', req.company, {log: false});
    })
    .get('/', function (req, res) {
        L.logger.info('Список организаций', L.meta());

        var condition = {};
        if (!req.query.all) {
            condition = {'state._id': 'active'};
        }
        models.Company
            .find(condition)
            .sort({title: 1})
            .populate('user', 'username lastName firstName middleName')
            .exec(function (err, companies) {
                if (err) {
                    return Msg.sendError(res, err.message);
                }

                Msg.sendSuccess(res, '', companies, {log: false});
            });
    })
    .post('/', function (req, res) {
        L.logger.info('Новая организация', L.meta());

        if (!models.User.can(req.user, 'company:create')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        // create model and fill fields from request body
        let newCompany = new models.Company(req.body);
        newCompany.user = req.user._id;

        // try to save company
        newCompany.save(function (err) {
            // if there is error, send it and stop handler with return
            if (err) {
                return Msg.sendError(res, err.message);
            }

            // all right, show success message
            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .put('/:id', function (req, res) {
        L.logger.info('Изменить организацию', L.meta());

        if (!models.User.can(req.user, 'company:edit')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        req.company = Object.assign(req.company, req.body);

        req.company.save(function (err) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .delete('/:id',
        function (req, res, next) {
            L.logger.info('Удалить организацию', L.meta());

            if (!models.User.can(req.user, 'company:delete')) {
                return Msg.sendError(res, 'Доступ запрещен.');
            }

            // check, is there any patient service with this company
            models.PatientService.count({'company._id': req.company._id}, function (err, count) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                if (count > 0) {
                    return Msg.sendError(res, 'Организация используются, её нельзя удалить');
                }

                next();
            });
        },
        function (req, res) {
            req.company.remove(function (err) {
                if (err) {
                    return Msg.sendError(res, err.message);
                }

                Msg.sendSuccess(res, 'Запись удален!');
            });
        }
    );

module.exports = router;