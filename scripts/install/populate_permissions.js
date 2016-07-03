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
            _id: 'patient:service:delete',
            title: 'Пациент: Удалить услугу'
        },
        {
            _id: 'patient:service:discount',
            title: 'Пациент: Добавить скидку'
        },
        {
            _id: 'patient:service:partner',
            title: 'Пациент: Прикрепить партнёра к услугу'
        },
        {
            _id: 'patient:service:company',
            title: 'Пациент: Прикрепить организацию к услугу'
        },
        {
            _id: 'patient:service:results',
            title: 'Пациент: Результаты'
        },
        {
            _id: 'patient:service:results:print',
            title: 'Пациент: Распечатка результатов'
        },
        {
            _id: 'patient:service:results:fill',
            title: 'Пациент: Внесения результатов'
        },
        {
            _id: 'patient:service:results:complete',
            title: 'Пациент: Завершить услугу'
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
            _id: 'laboratory:export',
            title: 'Лаборатория: Экспорт'
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
        },
        {
            _id: 'admin:settings',
            title: 'Администрирование: Параметры системы'
        },
        {
            _id: 'service:list',
            title: 'Услуга: Список'
        },
        {
            _id: 'service:create',
            title: 'Услуга: Новый'
        },
        {
            _id: 'service:edit',
            title: 'Услуга: Редактирование'
        },
        {
            _id: 'service:delete',
            title: 'Услуга: Удаление'
        },
        {
            _id: 'service:history',
            title: 'Услуга: История'
        },
        {
            _id: 'branch:list',
            title: 'Филиал: Список'
        },
        {
            _id: 'branch:create',
            title: 'Филиал: Новый'
        },
        {
            _id: 'branch:edit',
            title: 'Филиал: Редактирование'
        },
        {
            _id: 'branch:delete',
            title: 'Филиал: Удаление'
        },
        {
            _id: 'company:list',
            title: 'Организация: Список'
        },
        {
            _id: 'company:create',
            title: 'Организация: Новый'
        },
        {
            _id: 'company:edit',
            title: 'Организация: Редактирование'
        },
        {
            _id: 'company:delete',
            title: 'Организация: Удаление'
        },
        {
            _id: 'company:pay',
            title: 'Организация: Пополнить счет'
        },
        {
            _id: 'company:pay:cancel',
            title: 'Организация: Отменить оплату'
        },
        {
            _id: 'company:details',
            title: 'Организация: Детализация'
        },
        {
            _id: 'partner:list',
            title: 'Партнёр: Список'
        },
        {
            _id: 'partner:create',
            title: 'Партнёр: Новый'
        },
        {
            _id: 'partner:edit',
            title: 'Партнёр: Редактирование'
        },
        {
            _id: 'partner:delete',
            title: 'Партнёр: Удаление'
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