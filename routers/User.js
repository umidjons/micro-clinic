'use strict';

var router = require('express').Router();
var debug = require('debug')('myclinic:router:user');
var models = require('../models');
var Msg = require('../include/Msg');
var F = require('../include/F');
var L = require('../include/L');

router
    .use(function (req, res, next) {
        L.context = 'user';
        next();
    })
    .param('id', function (req, res, next, id) {
        debug(`param(id): ${id}`);
        models.User.findById(id).exec(function (err, user) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            // populate user object on request
            req.userObj = user;
            next();
        });
    })
    .get('/:id', function (req, res) {
        // req.userObj is populated via param(id) handler
        Msg.sendSuccess(res, '', req.userObj);
    })
    .get('/', function (req, res) {
        models.User.find()
            .sort({created: 1})
            .populate('user', 'username lastName firstName middleName')
            .exec(function (err, users) {
                if (err) {
                    return Msg.sendError(res, err.message);
                }

                Msg.sendSuccess(res, '', users);
            });
    })
    .post('/', function (req, res) {
        L.logger.info('Create user', L.meta('user'));

        if (!models.User.can(req.user, 'user:create')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        let user = models.User.sortPermissions(req.body);

        // create model and fill fields from request body
        let newUser = new models.User(user);
        newUser.created = new Date();
        newUser.user = req.user._id;

        // try to save partner
        newUser.save(function (err, user) {
            // if there is error, send it and stop handler with return
            if (err) {
                return Msg.sendError(res, err.message);
            }

            // all right, show success message
            Msg.sendSuccess(res, 'Данные успешно сохранены.', {userId: user._id});
        });
    })
    .put('/:id', function (req, res) {
        L.logger.info('Edit user', L.meta('user'));

        if (!models.User.can(req.user, 'user:edit')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        // req.userObj contains user object retrieved via param(id) handler

        let user = models.User.sortPermissions(req.body);

        // empty password means - DO NOT CHANGE PASSWORD
        if (user.password == '') {
            delete user.password;
        }

        // merge req.body into user
        req.userObj = Object.assign(req.userObj, user);

        req.userObj.save(function (err) {
            if (err) {
                return Msg.sendError(res, err.message);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .delete('/:id',
        function (req, res, next) {
            if (!models.User.can(req.user, 'user:delete')) {
                return Msg.sendError(res, 'Доступ запрещен.');
            }

            models.Branch.count({user: req.userObj._id}, function (err, count) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                if (count > 0) {
                    return Msg.sendError(res, 'У пользователя имеется активность, её нельзя удалить.');
                }

                next();
            });
        },
        function (req, res, next) {
            models.Company.count({user: req.userObj._id}, function (err, count) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                if (count > 0) {
                    return Msg.sendError(res, 'У пользователя имеется активность, её нельзя удалить.');
                }

                next();
            });
        },
        function (req, res, next) {
            models.Company.count({'pays.user': req.userObj._id}, function (err, count) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                if (count > 0) {
                    return Msg.sendError(res, 'У пользователя имеется активность, её нельзя удалить.');
                }

                next();
            });
        },
        function (req, res, next) {
            models.Partner.count({user: req.userObj._id}, function (err, count) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                if (count > 0) {
                    return Msg.sendError(res, 'У пользователя имеется активность, её нельзя удалить.');
                }

                next();
            });
        },
        function (req, res, next) {
            models.Patient.count({user: req.userObj._id}, function (err, count) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                if (count > 0) {
                    return Msg.sendError(res, 'У пользователя имеется активность, её нельзя удалить.');
                }

                next();
            });
        },
        function (req, res, next) {
            models.PatientService.count({user: req.userObj._id}, function (err, count) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                if (count > 0) {
                    return Msg.sendError(res, 'У пользователя имеется активность, её нельзя удалить.');
                }

                next();
            });
        },
        function (req, res, next) {
            models.PatientService.count({'pays.user': req.userObj._id}, function (err, count) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                if (count > 0) {
                    return Msg.sendError(res, 'У пользователя имеется активность, её нельзя удалить.');
                }

                next();
            });
        },
        function (req, res, next) {
            models.Service.count({user: req.userObj._id}, function (err, count) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                if (count > 0) {
                    return Msg.sendError(res, 'У пользователя имеется активность, её нельзя удалить.');
                }

                next();
            });
        },
        function (req, res, next) {
            models.ServiceCategory.count({user: req.userObj._id}, function (err, count) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                if (count > 0) {
                    return Msg.sendError(res, 'У пользователя имеется активность, её нельзя удалить.');
                }

                next();
            });
        },
        function (req, res, next) {
            models.User.count({user: req.userObj._id}, function (err, count) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                if (count > 0) {
                    return Msg.sendError(res, 'У пользователя имеется активность, её нельзя удалить.');
                }

                next();
            });
        },
        function (req, res) {
            // req.userObj contains user object retrieved via param(id) handler
            req.userObj.remove(function (err) {
                if (err) {
                    return Msg.sendError(res, err.message);
                }

                Msg.sendSuccess(res, 'Запись удален!');
            });
        }
    );

module.exports = router;