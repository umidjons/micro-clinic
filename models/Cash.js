'use strict';

var mongoose = require('mongoose');
var async = require('async');
var sugar = require('sugar');
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
    user: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
    percentOfPartner: {type: Number, default: 0},
    interestOfPartner: {type: Number, default: 0},
    refunded: {type: Date},
    refundedUser: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
});

/*
 Available states:
 { _id: 'payed', title: 'Оплачен' }
 { _id: 'refunded', title: 'Возвращен' }
 { _id: 'active', title: 'Активный' } - internal, used for refund pays
 */

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

/**
 * Generates discount type pay in the given patient's service.
 * @param {object} user user object
 * @param {date} time pay date and time
 * @param {object} patSrv patient's service object
 * @returns {*}
 */
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
 * Calculates partner's interest and fill appropriate fields in pay object.
 * @param {object} pay pay object with amount
 * @param {object} patSrv patient's service object
 */
CashSchema.statics.calcPartnerInterest = function (pay, patSrv) {
    pay.percentOfPartner = 0;
    pay.interestOfPartner = 0;

    // if there is partner for this service and its percent is greater than zero, calculate partner's interest
    if (patSrv.partner && patSrv.partner.percent > 0) {
        pay.percentOfPartner = patSrv.partner.percent;
        pay.interestOfPartner = pay.amount * 0.01 * pay.percentOfPartner;
    }
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

            //debug(F.inspect(patSrv, '-------Patient Service=', true));
            //debug(F.inspect(pType, '--------Pay Type=', true));

            if (pType == 'cash' || pType == 'cashless') {
                // determine amount
                let amount = patSrv.debt;
                if (patSrv.debt > payInfo.total && payInfo.total > 0) {
                    amount = payInfo.total;
                }

                // check for discount
                Cash.genDiscountPay(user, time, patSrv);

                let pay = {
                    amount: amount,
                    payType: payInfo.payType,
                    created: time,
                    branch: user.branch,
                    user: user._id,
                    state: {_id: 'payed', title: 'Оплачен'}
                };

                Cash.calcPartnerInterest(pay, patSrv);

                // generate pay
                patSrv.pays.push(pay);

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

                let pay = {
                    amount: amount,
                    payType: {_id: 'cashless', title: 'Безналичные'},
                    created: time,
                    branch: user.branch,
                    user: user._id,
                    state: {_id: 'payed', title: 'Оплачен'}
                };

                Cash.calcPartnerInterest(pay, patSrv);

                // generate pay
                patSrv.pays.push(pay);

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

                    let pay = {
                        amount: amount,
                        payType: {_id: 'cash', title: 'Наличные'},
                        created: time,
                        branch: user.branch,
                        user: user._id,
                        state: {_id: 'payed', title: 'Оплачен'}
                    };

                    Cash.calcPartnerInterest(pay, patSrv);

                    // generate pay
                    patSrv.pays.push(pay);

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
                } else {
                    patientServicesWithPays.push(patSrv);
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

CashSchema.statics.refund = function (user, payInfo, cb) {
    if (!payInfo.payAmount) {
        cb('Нечего возвращать.');
    }

    let ObjectId = mongoose.Types.ObjectId;
    let refundTime = Date.create();
    let payTime = Date.create(payInfo.payTime);
    let condition = {
        'pays.payType._id': {$in: ['cash', 'cashless', 'discount']}
    };
    if (payInfo.branch) {
        condition['pays.branch._id'] = ObjectId(payInfo.branch);
    }

    // check pay amount to refund
    models.PatientService.aggregate([
        //db.patientservices.aggregate([
        {
            $match: {'pays.created': payTime, patientId: ObjectId(payInfo.patientId)}
        },
        {
            $unwind: '$pays'
        },
        {
            $match: condition
        },
        {
            $group: {
                _id: {patientId: '$patientId', 'payTime': '$pays.created'},
                payAmount: {$sum: '$pays.amount'}
            }
        }
    ], function (err, records) {
        if (err) {
            return cb(err);
        }

        // if there is no records, return error
        if (!records) {
            return cb('Оплаты для возврата не найдены.');
        }

        // check pay amounts
        if (records[0].payAmount != payInfo.payAmount) {
            debug(
                'Pays amount not matched.'
                + F.inspect(payInfo, 'Params to search:', true)
                + F.inspect(records, 'Found records:', true)
            );
            return cb('Сумма оплаты не совпадают.');
        }

        // prepare conditions to retrieve pays and do actual refunding
        let cond = {patientId: payInfo.patientId, 'pays.created': payInfo.payTime};

        // if there is branch, take into account it too
        if (payInfo.branch) {
            cond['pays.branch._id'] = payInfo.branch;
        }

        // contains changed patient services, which must be saved
        let changedPatientServices = [];

        models.PatientService
            .find(cond)
            .exec(function (err, patientServices) {
                for (let patSrv of patientServices) {
                    // by default mark patient service as unchanged
                    let changed = false;

                    // process each pay of this patient service
                    for (let pay of patSrv.pays) {
                        // pays is embedded array,
                        // so it can contain other pays too,
                        // therefore we have to check pay time and branch to identify
                        // pays to refund
                        if (Date.create(pay.created).is(payTime)) {
                            // if branch given as condition, check pay's branch too
                            // if branches doesn't match, ignore that pay
                            if (payInfo.branch && pay.branch._id != payInfo.branch) {
                                continue;
                            }

                            // change pay's state to refunded
                            pay.state = {_id: 'refunded', title: 'Возвращен'};
                            // set when pay is refunded
                            pay.refunded = refundTime;
                            // set who refunded pay
                            pay.refundedUser = user._id;

                            // discount type pays doesn't impact overall amount
                            if (pay.payType._id != 'discount') {
                                // increase debt
                                patSrv.debt += pay.amount;
                                // decrease payed
                                patSrv.payed -= pay.amount;
                            }

                            // create refund pay
                            patSrv.pays.push({
                                payType: {_id: 'refund', title: 'Возврат'},
                                amount: pay.amount,
                                branch: pay.branch,
                                state: {_id: 'active', title: 'Активный'},
                                created: refundTime,
                                user: user._id
                            });

                            // mark this patient service as changed
                            changed = true;
                        }
                    }

                    // gather changed patient services
                    if (changed) {
                        // if after refund no pays remains, mark this patient service as new
                        if (patSrv.payed == 0) {
                            patSrv.state = {_id: 'new', title: 'Новый'};
                        } else if (patSrv.payed > 0) {
                            // if after refund there are some pays, mark this service as partly payed
                            patSrv.state = {_id: 'partlyPayed', title: 'Частично оплачен'};
                        }
                        changedPatientServices.push(patSrv);
                    }
                }

                // if there are changed patient services, save them
                if (changedPatientServices.length > 0) {
                    return Cash.savePays(changedPatientServices, cb);
                }

                // I don't think control will be here, bu anyway will call callback
                cb('Функция "Возврат" работает неправильно!');
            });
    });
};
var Cash = mongoose.model('Cash', CashSchema);

module.exports.PayTypeSchema = PayTypeSchema;
module.exports.CashSchema = CashSchema;
module.exports.Cash = Cash;