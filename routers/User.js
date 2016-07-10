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
                return Msg.sendError(res, err);
            }

            // populate user object on request
            req.userObj = user;
            next();
        });
    })
    .put('/profile', function (req, res) {
        L.logger.info('Изменить профиль пользователя', L.meta('user'));

        if (!models.User.can(req.user, 'user:profile')) {
            return Msg.sendError(res, 'Доступ запрещен.');
        }

        // received data
        let data = req.body;

        // change profile of the current user
        models.User.findById(req.user._id, function (err, user) {
            if (err) {
                return Msg.sendError(res, err);
            }

            // empty password means - DO NOT CHANGE PASSWORD
            if (data.password == '') {
                delete data.password;
            } else {
                user.password = data.password;
            }

            // set allowed attributes
            user.lastName = data.lastName;
            user.firstName = data.firstName;
            user.middleName = data.middleName;
            user.address = data.address;
            user.cellPhone = data.cellPhone;
            user.homePhone = data.homePhone;
            user.email = data.email;

            user.save(function (err) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                Msg.sendSuccess(res, 'Данные успешно сохранены.');
            });
        });
    })
    .get('/:id', function (req, res) {
        L.logger.info('Получить информацию о пользователе', L.meta());
        Msg.sendSuccess(res, '', req.userObj, {log: false});
    })
    .get('/', function (req, res) {
        L.logger.info('Список пользователей', L.meta());
        models.User.find()
            .sort({created: 1})
            .populate('user', 'username lastName firstName middleName')
            .exec(function (err, users) {
                if (err) {
                    return Msg.sendError(res, err);
                }

                Msg.sendSuccess(res, '', users, {log: false});
            });
    })
    .post('/', function (req, res) {
        L.logger.info('Новый пользователь', L.meta('user'));

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
                return Msg.sendError(res, err);
            }

            // all right, show success message
            Msg.sendSuccess(res, 'Данные успешно сохранены.', {userId: user._id});
        });
    })
    .put('/:id', function (req, res) {
        L.logger.info('Изменить пользователя', L.meta('user'));

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
                return Msg.sendError(res, err);
            }

            Msg.sendSuccess(res, 'Данные успешно сохранены.');
        });
    })
    .delete('/:id',
        function (req, res, next) {
            L.logger.info('Удалить пользователя', L.meta());

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
                    return Msg.sendError(res, err);
                }

                Msg.sendSuccess(res, 'Запись удален!');
            });
        }
    );

module.exports = router;