'use strict';

var mongoose = require('mongoose');
var async = require('async');
var stateSchema = require('./State').StateSchema;
var branchSchema = require('./Branch').BranchSchema;
var models = require('.');
var F = require('../include/F');
var debug = require('debug')('myclinic:model:cash');

var PayTypeSchema = mongoose.Schema({
    _id: {type: String, required: true},
    title: {type: String, required: true}
});

/*
 Available pay types:
 { _id: 'cash', title: 'Наличные' }
 { _id: 'cashless', title: 'Безналичные' }
 { _id: 'separated', title: 'Наличный/Безналичный' }
 { _id: 'discount', title: 'Скидка' } - internal
 { _id: 'refund', title: 'Возврат' } - internal
 */

var CashSchema = mongoose.Schema({
    payType: PayTypeSchema,
    amount: {type: Number, min: 0, required: true},
    branch: {type: branchSchema, required: true},
    state: stateSchema,
    created: {type: Date, required: true, default: new Date()},
    user: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'}
});

/**
 * Prepares pays for the given patient services.
 * @param {array} patSrvList array of PatientService models
 * @param {function} cb callback function with one parameter - error.
 */
CashSchema.statics.preparePays = function (user, patSrvList, cb) {
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
                pay.user = user._id;
                pay.branch = user.branch;

                // set pay state
                pay.state = {_id: 'payed', title: 'Оплачен'};
            }
        }
    }

    cb();
};

/**
 * Saves patient services with pays.
 * @param {array} patSrvList array of PatientService models.
 * @param {function} cb callback function with one parameter - error.
 */
CashSchema.statics.savePays = function (patSrvList, cb) {
    // save all patient services with pays
    async.each(
        patSrvList, // array of patient services with pays
        function (patSrv, done) {
            models.PatientService.findById(patSrv._id, function (err, doc) {
                // if there is discount, then we already generated discount pay for it, change its state to payed
                if (patSrv.discount && patSrv.discount.state._id == 'new') {
                    doc.discount.state = {_id: 'payed', title: 'Оплачен'};
                }
                doc.debt = patSrv.debt;
                doc.payed = patSrv.payed;
                doc.state = patSrv.state;
                doc.pays = patSrv.pays;
                doc.save(function (err) {
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
                debug(F.inspect(err, 'Err:', true));
                return cb(err);
            } else {
                // all patient services successfully saved
                return cb();
            }
        }
    );
};

CashSchema.statics.genDiscountPay = function (user, time, patSrv) {
    // if there is discount, generate pay for it
    if (patSrv.discount && patSrv.discount.type && patSrv.discount.state._id == 'new') {
        let discountAmount = patSrv.discount.amount;

        // if discount type is percent, calculate discount amount
        if (patSrv.discount.type == 'percent') {
            discountAmount = (patSrv.discount.amount * (patSrv.quantity * patSrv.price)) / 100;
        }

        patSrv.pays.push({
            amount: discountAmount,
            payType: {_id: 'discount', title: 'Скидка'},
            created: time,
            branch: user.branch,
            user: user._id,
            state: {_id: 'payed', title: 'Оплачен'}
        });
    }
    return patSrv;
};

/**
 * Generates & saves pays for given patient's pending services.
 * @param {object} user currently logged in user
 * @param {object} payInfo payment info in format
 *   {patientId: XXX, payType: XXX, totalDebt: XXX, total: XXX, totalCash: XXX, totalCashless: XXX, debt: XXX}
 * @param {function} cb callback function with one parameter - error.
 */
CashSchema.statics.payAll = function (user, payInfo, cb) {
    models.PatientService.pendingServicesOf(payInfo.branch, payInfo.patientId, function (err, patientServices) {
        if (err) {
            return cb(err);
        }

        if (patientServices.length == 0) {
            return cb('Неоплаченные услуги не найдены.');
        }

        var time = new Date();

        var patientServicesWithPays = [];

        let pType = payInfo.payType._id;

        // populating pays for each pending service
        for (let patSrv of patientServices) {

            //debug(F.inspect(patSrv, 'Patient Service=', true));
            //debug(F.inspect(pType, 'Pay Type=', true));

            if (pType == 'cash' || pType == 'cashless') {
                // determine amount
                let amount = patSrv.debt;
                if (patSrv.debt > payInfo.total && payInfo.total > 0) {
                    amount = payInfo.total;
                }

                // check for discount
                Cash.genDiscountPay(user, time, patSrv);

                // generate pay
                patSrv.pays.push({
                    amount: amount,
                    payType: payInfo.payType,
                    created: time,
                    branch: user.branch,
                    user: user._id,
                    state: {_id: 'payed', title: 'Оплачен'}
                });

                // decrease debt & increase payed
                patSrv.debt -= amount;
                patSrv.payed += amount;

                // change service state
                if (patSrv.debt > 0) {
                    patSrv.state = {_id: 'partlyPayed', title: 'Частично оплачен'};
                } else {
                    patSrv.state = {_id: 'payed', title: 'Оплачен'};
                }

                // decrease left amount
                payInfo.total -= amount;

                patientServicesWithPays.push(patSrv);

                // if there are no more money, stop processing other services
                if (payInfo.total <= 0) {
                    break;
                }


            } else if (pType == 'separated') {
                let amount = patSrv.debt;
                if (patSrv.debt > payInfo.totalCashless && payInfo.totalCashless > 0) {
                    amount = payInfo.totalCashless;
                }

                // check for discount
                Cash.genDiscountPay(user, time, patSrv);

                // generate pay
                patSrv.pays.push({
                    amount: amount,
                    payType: {_id: 'cashless', title: 'Безналичные'},
                    created: time,
                    branch: user.branch,
                    user: user._id,
                    state: {_id: 'payed', title: 'Оплачен'}
                });

                // decrease debt & increase payed
                patSrv.debt -= amount;
                patSrv.payed += amount;

                // change service state
                if (patSrv.debt > 0) {
                    patSrv.state = {_id: 'partlyPayed', title: 'Частично оплачен'};
                } else {
                    patSrv.state = {_id: 'payed', title: 'Оплачен'};
                }

                // decrease left amount
                payInfo.totalCashless -= amount;
                payInfo.total -= amount;

                // if there are no more money, stop processing other services
                if (payInfo.total <= 0) {
                    patientServicesWithPays.push(patSrv);
                    break;
                }

                // if there is more debt, cover it from cash
                if (patSrv.debt > 0) {
                    amount = patSrv.debt;
                    if (patSrv.debt > payInfo.totalCash && payInfo.totalCash > 0) {
                        amount = payInfo.totalCash;
                    }

                    // generate pay
                    patSrv.pays.push({
                        amount: amount,
                        payType: {_id: 'cash', title: 'Наличные'},
                        created: time,
                        branch: user.branch,
                        user: user._id,
                        state: {_id: 'payed', title: 'Оплачен'}
                    });

                    // decrease debt & increase payed
                    patSrv.debt -= amount;
                    patSrv.payed += amount;

                    // change service state
                    if (patSrv.debt > 0) {
                        patSrv.state = {_id: 'partlyPayed', title: 'Частично оплачен'};
                    } else {
                        patSrv.state = {_id: 'payed', title: 'Оплачен'};
                    }

                    // decrease left amount
                    payInfo.totalCash -= amount;
                    payInfo.total -= amount;

                    // if there are no more money, stop processing other services
                    if (payInfo.total <= 0) {
                        patientServicesWithPays.push(patSrv);
                        break;
                    }
                }
            }
        }

        debug(F.inspect(patientServicesWithPays, 'patientServicesWithPays=', true));

        // save patient services with pays
        Cash.savePays(patientServicesWithPays, function (err) {
            if (err) {
                return cb(err);
            }
            return cb(null, time);
        });
    });
};

var Cash = mongoose.model('Cash', CashSchema);

module.exports.PayTypeSchema = PayTypeSchema;
module.exports.CashSchema = CashSchema;
module.exports.Cash = Cash;