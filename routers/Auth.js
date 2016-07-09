'use strict';
module.exports = function (app) {
    var router = require('express').Router();
    var debug = require('debug')('myclinic:router:auth');
    var models = require('../models');
    var Msg = require('../include/Msg');
    var F = require('../include/F');
    var L = require('../include/L');
    var cfg = require('../include/config');
    var passport = require('passport');
    var jwt = require('jsonwebtoken');
    var jwtStrategy = require('passport-jwt').Strategy;
    var jwtExtract = require('passport-jwt').ExtractJwt;

    var opts = {
        jwtFromRequest: jwtExtract.fromAuthHeader(),
        secretOrKey: cfg.jwt.secret
    };

    passport.use(new jwtStrategy(opts, function (jwtPayload, done) {

        debug('JWT Strategy. Payload:' + F.inspect(jwtPayload, '', true));

        models.User.findById(jwtPayload._id, function (err, user) {
            if (err) {
                return done(err, false);
            }

            if (user) { // success

                // populate currently chosen branch - it will be available via req.user.branch
                user.branch = jwtPayload.branch;

                return done(null, user);
            } else { // no err, but user not found
                return done(null, false);
            }
        });
    }));

    app
        .use(passport.initialize())
        .post('/authenticate', function (req, res) {
            if (!L.req) {
                L.req = req;
                L.req.user = {
                    _id: null,
                    username: req.body.username,
                    branch: req.body.branch
                };
            }
            L.logger.info('Авторизация', L.meta('auth'));

            var username = req.body.username;
            var password = req.body.password;
            var branch = req.body.branch;

            debug(F.inspect(branch, 'Branch:', true));

            models.User.findOne({username: username.toLowerCase()}, function (err, user) {
                debug(F.inspect(err, 'Err:', true));
                debug(F.inspect(user, 'User:', true));

                if (err) {
                    return Msg.sendError(res, err);
                }

                if (!user) {
                    return Msg.sendError(res, 'Пользователь не существует.');
                }

                if (user.state._id != 'active') {
                    return Msg.sendError(res, 'Пользователь не активный.');
                }

                user.comparePassword(password, function (err, isMatch) {
                    debug(F.inspect(err, 'compare password Err:', true));
                    debug(F.inspect(isMatch, 'compare password isMatch:', true));

                    if (err) {
                        return Msg.sendError(res, err);
                    }

                    if (!isMatch) {
                        return Msg.sendError(res, 'Неправильный пароль.');
                    }

                    // do not expose password
                    user.password = undefined;

                    // set branch, this branch will be available on JWT
                    user.branch = branch;

                    // generate token and response
                    let userJson = user.toJSON();
                    let token = jwt.sign(userJson, cfg.jwt.secret, {expiresIn: cfg.jwt.expire});
                    let msg = `Добро пожаловать ${user.username}.`;
                    app.set('jwt_token', token);
                    return Msg.sendSuccess(res, msg, {user: user, token: token}, {log: false});
                });
            });
        })
        .use(passport.authenticate('jwt', {session: false}));
};