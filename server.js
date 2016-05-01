'use strict';

var express = require('express');
var app = express();
var nunjucks = require('nunjucks');
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var logger = require('morgan');
var favicon = require('serve-favicon');
var routers = require('./routers');

mongoose.connect('mongodb://127.0.0.1:27017/starmed');
mongoose.connection.once('open', function () {
    app.set('port', process.env.PORT || 3000);

    app.disable('x-powered-by');

    app.use(logger('combined'));
    app.use(favicon(path.join(__dirname, '/public/src/images/favicon.png')));

    //---< configure template engine >---
    const VIEW_PATH = path.join(__dirname, 'public', 'views');

    nunjucks.configure(
        VIEW_PATH,
        {
            express: app,
            tags: {
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
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());

    app
        .use('/patient-service', routers.PatientService)
        .use('/patient', routers.Patient)
        .use('/service', routers.Service)
        .use('/service-category', routers.ServiceCategory)
        .use('/partner', routers.Partner)
        .use('/cash', routers.Cash)
        .get('*', function (req, res) {
            res.render('index', {year: 1900 + new Date().getYear()});
        })
        .listen(app.get('port'), function () {
            console.log(`Listening on http://localhost:${app.get('port')}...`);
        });
});

module.exports = app;
