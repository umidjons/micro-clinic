'use strict';

var cfg = require('./include/config');
var express = require('express');
var app = express();
var nunjucks = require('nunjucks');
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var logger = require('morgan');
var favicon = require('serve-favicon');
var compression = require('compression');
var routers = require('./routers');
var passport = require('passport');
var models = require('./models');
var Msg = require('./include/Msg');
var winston = require('winston');
require('winston-mongodb').MongoDB;
var L = require('./include/L');

// configure logger
winston.add(winston.transports.MongoDB, {
    db: cfg.logdb,
    level: 'debug',
    tryReconnect: true,
    //handleExceptions: true,
    //humanReadableUnhandledException: true
});

// set logger instance
L.logger = winston;

mongoose.connect(cfg.db);
mongoose.connection.once('open', function () {
    app.set('port', process.env.PORT || cfg.app_port);

    app.disable('x-powered-by');

    app.use(compression());
    app.use(logger('dev'));
    app.use(favicon(path.join(__dirname, '/public/src/images/favicon.png')));

    //---< configure template engine >---
    const VIEW_PATH = path.join(__dirname, 'public', 'views');

    nunjucks.configure(
        VIEW_PATH,
        {
            express: app,
            tags: {
                blockStart: '{%',
                blockEnd: '%}',
                commentStart: '{#',
                commentEnd: '#}',
                variableStart: '{{{',
                variableEnd: '}}}'
            }
        }
    );

    app.set('view engine', 'njk');

    // render all html files with Nunjucks
    app.use('*.html', function (req, res) {
        // generate path to view
        let view_path = path.join(VIEW_PATH, req.originalUrl);
        // replace *.html to *.njk
        view_path = view_path.replace(/\..+/, '.njk');
        // render template
        res.render(view_path);
    });
    //---</ configure template engine >---

    // configure static assets
    app.use('/assets', express.static(path.join(__dirname, 'public')));

    // configure parsers
    app.use(bodyParser.urlencoded({extended: true, limit: '1mb'}));
    app.use(bodyParser.json({limit: '5mb'}));

    app.use(function (req, res, next) {
        // clear L.req
        L.req = undefined;

        next();
    });

    app.get('/', function (req, res) {
        //res.set('Authorization', `JWT ${app.get('jwt_token')}`);
        res.render('index', {year: 1900 + new Date().getYear()});
    });

    app.get('/active-branches', function (req, res) {
        // Used on login page.
        // Fetches without authorization.
        models.Branch
            .find({'state._id': 'active'})
            .sort({title: 1})
            .exec(function (err, branches) {
                if (err) {
                    return Msg.sendError(res, err.message);
                }

                Msg.sendSuccess(res, '', branches);
            });
    });

    routers.Auth(app);

    app
        .use(function (req, res, next) {
            // do accessible request to the logger
            L.req = req;

            next();
        })
        .use('/log', routers.Log)
        .use('/user', routers.User)
        .use('/permission', routers.Permission)
        .use('/patient-service', routers.PatientService)
        .use('/patient', routers.Patient)
        .use('/service', routers.Service)
        .use('/service-category', routers.ServiceCategory)
        .use('/partner', routers.Partner)
        .use('/cash', routers.Cash)
        .use('/branch', routers.Branch)
        .use('/company', routers.Company)
        .use('/discount-reason', routers.DiscountReason)
        .use('/setting', routers.Setting)
        .use('/report', routers.Report)
        .listen(app.get('port'), function () {
            L.logger.info('Server started.', L.meta('server'));
            console.log(`Listening on http://localhost:${app.get('port')}...`);
        });
});

module.exports = app;
