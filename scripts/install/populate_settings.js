'use strict';

var mongoose = require('mongoose');
var models = require('../../models');
mongoose.connect('mongodb://127.0.0.1:27017/starmed');
mongoose.connection.once('open', function () {
    var docs = [
        {
            _id: 'foreignerOverPercent',
            title: 'Сверх цена для нерезидентных',
            value: 15,
            comment: 'Значение задается в процентах',
            order: 1
        },
        {
            _id: 'partnerCode',
            title: 'Код нового партнёра',
            value: '0001',
            comment: 'Следующий код партнёра',
            order: 2
        },
        {
            _id: 'patientCode',
            title: 'ID нового пациента',
            value: '0000001',
            comment: 'Следующий ID пациента',
            order: 3
        }
    ];

    models.Setting.collection.insert(docs, function (err, res) {
        if (err) {
            console.log('Error occurred:', err.message);
        } else {
            console.info(`${res.insertedCount} documents successfully created.`);
        }
        mongoose.connection.close();
    });
});