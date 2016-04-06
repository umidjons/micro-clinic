'use strict';

var express = require('express');
var app = express();
var nunjucks = require('nunjucks');
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/starmed');
mongoose.connection.once('open', function () {

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

        // show original URL in the console
        console.log('Original URL: %s', req.originalUrl);

        // generate path to view
        let view_path = path.join(VIEW_PATH, req.originalUrl);

        // replace *.html to *.njk
        view_path = view_path.replace(/\..+/, '.njk');

        console.log('File to render: %s', view_path);

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
        .get('*', function (req, res) {
            res.render('index', {year: 1900 + new Date().getYear()});
        })
        .listen(3000, function () {
            console.log('Listening on http://localhost:3000...');
        });
});