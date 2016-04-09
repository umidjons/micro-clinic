'use strict';

var mongoose = require('mongoose');
var models = require('../../models');
mongoose.connect('mongodb://127.0.0.1:27017/starmed');
mongoose.connection.once('open', function () {
    var categories = [
        {
            _id: 'laboratory',
            title: 'Лаборатория',
            shortTitle: 'лаб.'
        },
        {
            _id: 'uzd',
            title: 'Ультра звуковая диагностика',
            shortTitle: 'УЗД'
        },
        {
            _id: 'xray',
            title: 'Рентген',
            shortTitle: 'рен.'
        },
        {
            _id: 'nervopatolog',
            title: 'Невропатолог',
            shortTitle: 'невр.'
        },
        {
            _id: 'dermatolog',
            title: 'Дерматолог',
            shortTitle: 'дерм.'
        },
        {
            _id: 'urolog',
            title: 'Уролог',
            shortTitle: 'урол.'
        },
        {
            _id: 'oftalmolog',
            title: 'Офтальмолог',
            shortTitle: 'офтал.'
        },
        {
            _id: 'surgery',
            title: 'Хирург',
            shortTitle: 'хир.'
        },
        {
            _id: 'stomatolog',
            title: 'Стоматолог',
            shortTitle: 'стом.'
        },
        {
            _id: 'lor',
            title: 'Лор',
            shortTitle: 'лор'
        },
        {
            _id: 'ginekolog',
            title: 'Гинеколог',
            shortTitle: 'гинек.'
        },
        {
            _id: 'terapevt',
            title: 'Терапевт',
            shortTitle: 'терап.'
        },
        {
            _id: 'procedurnaya',
            title: 'Процедурная',
            shortTitle: 'проц.'
        },
        {
            _id: 'massage',
            title: 'Массаж',
            shortTitle: 'масс.'
        },
        {
            _id: 'endokrinolog',
            title: 'Эндокринолог',
            shortTitle: 'эндокр.'
        },
        {
            _id: 'fizioterapiya',
            title: 'Физиотерапия',
            shortTitle: 'физ.тер.'
        },
        {
            _id: 'pediator',
            title: 'Педиатор',
            shortTitle: 'пед.'
        }
    ];

    models.ServiceCategory.collection.insert(categories, function (err, res) {
        if (err) {
            console.log('Error occured:', err.message);
        } else {
            console.info(`${res.insertedCount} service categories successfully created.`);
        }
        mongoose.connection.close();
    });
});