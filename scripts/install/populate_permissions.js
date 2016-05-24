'use strict';

var mongoose = require('mongoose');
var models = require('../../models');
mongoose.connect('mongodb://127.0.0.1:27017/starmed');
mongoose.connection.once('open', function () {
    var docs = [
        {
            _id: 'user:create',
            title: 'Создание пользователя'
        },
        {
            _id: 'user:edit',
            title: 'Редактирование пользователя'
        },
        {
            _id: 'user:delete',
            title: 'Удаление пользователя'
        },
        {
            _id: 'user:view',
            title: 'Просмотр пользователя'
        },
        {
            _id: 'user:list',
            title: 'Просмотр списка пользователей'
        },
        {
            _id: 'category:create',
            title: 'Создание категории'
        },
        {
            _id: 'category:edit',
            title: 'Редактирование категории'
        },
        {
            _id: 'category:delete',
            title: 'Удаление категории'
        },
        {
            _id: 'category:view',
            title: 'Просмотр категории'
        },
        {
            _id: 'category:list',
            title: 'Просмотр списка категорий'
        }
    ];

    models.Permission.collection.insert(docs, function (err, res) {
        if (err) {
            console.log('Error occurred:', err.message);
        } else {
            console.info(`${res.insertedCount} documents successfully created.`);
        }
        mongoose.connection.close();
    });
});