'use strict';

var mongoose = require('mongoose');
var models = require('../../models');
mongoose.connect('mongodb://127.0.0.1:27017/starmed');
mongoose.connection.once('open', function () {
    var docs = [
        {
            _id: 'user:create',
            title: 'Пользователи: Создание пользователя'
        },
        {
            _id: 'user:edit',
            title: 'Пользователи: Редактирование пользователя'
        },
        {
            _id: 'user:delete',
            title: 'Пользователи: Удаление пользователя'
        },
        {
            _id: 'user:view',
            title: 'Пользователи: Просмотр пользователя'
        },
        {
            _id: 'user:list',
            title: 'Пользователи: Просмотр списка пользователей'
        },
        {
            _id: 'category:create',
            title: 'Категория: Создание категории'
        },
        {
            _id: 'category:edit',
            title: 'Категория: Редактирование категории'
        },
        {
            _id: 'category:delete',
            title: 'Категория: Удаление категории'
        },
        {
            _id: 'category:view',
            title: 'Категория: Просмотр категории'
        },
        {
            _id: 'category:list',
            title: 'Категория: Просмотр списка категорий'
        },
        {
            _id: 'cash:pay',
            title: 'Касса: Производить оплаты'
        },
        {
            _id: 'cash:cancel',
            title: 'Касса: Отменить оплаты'
        },
        {
            _id: 'cash:discount',
            title: 'Касса: Скидки'
        },
        {
            _id: 'patient:create',
            title: 'Пациент: Новый'
        },
        {
            _id: 'patient:edit',
            title: 'Пациент: Редактирование'
        },
        {
            _id: 'patient:delete',
            title: 'Пациент: Удаление'
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