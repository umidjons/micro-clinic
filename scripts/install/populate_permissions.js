'use strict';

var mongoose = require('mongoose');
var models = require('../../models');
const async = require('async');

mongoose.connect('mongodb://admin:admin@127.0.0.1:27017/starmed');
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
            _id: 'cash',
            title: 'Касса'
        },
        {
            _id: 'cash:pay',
            title: 'Касса: Производить оплаты'
        },
        {
            _id: 'cash:registry',
            title: 'Касса: Реестр оплат'
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
            _id: 'patient:list',
            title: 'Пациент: Список'
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
        },
        {
            _id: 'patient:view',
            title: 'Пациент: Анкета'
        },
        {
            _id: 'patient:service:add',
            title: 'Пациент: Добавить услугу'
        },
        {
            _id: 'search',
            title: 'Поиск'
        },
        {
            _id: 'laboratory',
            title: 'Лаборатория'
        },
        {
            _id: 'report',
            title: 'Отчеты'
        },
        {
            _id: 'report:partnerInterests',
            title: 'Отчеты: Доля партнёров за период'
        },
        {
            _id: 'admin',
            title: 'Администрирование'
        }
    ];

    async.each(
        docs,
        function (doc, cb) {
            let model = new models.Permission(doc);
            model.save(function (err, permission) {
                if (err) {
                    console.log('_id:', doc._id, ' failed. Error:', err.message);
                    return cb(); //cb(err);
                }
                console.info(`_id: ${doc._id} successfully created.`);
                cb();
            });
        },
        function (err) {
            mongoose.connection.close();
        }
    );
});