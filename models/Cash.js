'use strict';

var mongoose = require('mongoose');
var async = require('async');
var stateSchema = require('./State').StateSchema;
var models = require('.');

var PayTypeSchema = mongoose.Schema({
    _id: {type: String, required: true},
    title: {type: String, required: true}
});

var CashSchema = mongoose.Schema({
    payType: PayTypeSchema,
    amount: {type: Number, min: 0, required: true},
    state: stateSchema,
    created: {type: Date, required: true, default: new Date()},
    userId: {type: String, required: true, default: '1'} //todo: set real user id or user schema
});

CashSchema.statics.preparePays = function (patSrvList, cb) {
    if (!patSrvList || patSrvList.length == 0) {
        return cb('Данные не указаны!');
    }

    var time = new Date();

    for (let patSrv of patSrvList) {
        if (!patSrv.pays || patSrv.pays.length == 0) {
            return cb(`Оплата услуги ${patSrv.title} не указана!`);
        }

        for (let pay of patSrv.pays) {
            // no state means new payment, process it
            if (!pay.state) {
                // check amount
                if (pay.amount < 0) {
                    return cb(`Указана неправильная сумма! Услуга: ${patSrv.title}.`);
                }

                if (pay.amount == 0 && (!pay.discount || pay.discount.amount < 100)) {
                    return cb(`Сумма не указана! Услуга: ${patSrv.title}.`);
                }

                // decrease debt & increase payed
                patSrv.debt -= pay.amount;
                patSrv.payed += pay.amount;

                // change service state
                if (patSrv.debt > 0) {
                    patSrv.state = {_id: 'partlyPayed', title: 'Частично оплачен'};
                } else {
                    patSrv.state = {_id: 'payed', title: 'Оплачен'};
                }

                pay.created = time;
                pay.userId = 1; // todo: set currently logged in user's id (or model)

                // set pay state
                pay.state = {_id: 'payed', title: 'Оплачен'};
            }
        }
    }

    cb();
};

CashSchema.statics.savePays = function (patSrvList, cb) {
    // save all patient services with pays
    async.each(
        patSrvList, // array of patient services with pays
        function (patSrv, done) {
            models.PatientService.findById(patSrv._id, function (err, doc) {
                doc.debt = patSrv.debt;
                doc.payed = patSrv.payed;
                doc.state = patSrv.state;
                if (!doc.pays) {
                    doc.pays = patSrv.pays;
                } else {
                    for (let pay of patSrv.pays) {
                        doc.pays.push(pay);
                    }
                }
                doc.save(function (err, savedPatSrv) {
                    if (err) {
                        return done(err);
                    }
                    done();
                });
            });
        },
        function (err) {
            if (err) {
                // One of the patient service has error, stop all processing
                console.log('Err:', err);
                return cb(err);
            } else {
                // all patient services successfully saved
                return cb();
            }
        }
    );
};

var Cash = mongoose.model('Cash', CashSchema);

module.exports.PayTypeSchema = PayTypeSchema;
module.exports.CashSchema = CashSchema;
module.exports.Cash = Cash;