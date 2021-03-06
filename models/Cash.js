'use strict';

var mongoose = require('mongoose');
var async = require('async');
var sugar = require('sugar');
var stateSchema = require('./State').StateSchema;
var branchSchema = require('./Branch').BranchSchema;
var discountSchema = require('./Discount').DiscountSchema;
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
 { _id: 'company', title: 'Организация' } - internal
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
    refundedUser: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    discount: discountSchema // original discount model
});

/*
 Available states:
 { _id: 'payed', title: 'Оплачен' }
 { _id: 'refunded', title: 'Возвращен' }
 { _id: 'active', title: 'Активный' } - internal, used for refund pays
 */

/**
 * Prepares pays for the given patient services.
 * @param {object} user user instance
 * @param {Array} patSrvList array of PatientService models
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
 * @param {Array} patSrvList array of PatientService models.
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
 * Changes companies' balance for given list.
 * @param {Array} companies list in format [{companyId: nnn, amount: -nnn}, ...]
 * @param {function} cb callback function with one parameter - error.
 */
CashSchema.statics.changeCompaniesBalance = function (companies, cb) {
    // change all companies' balance
    async.eachSeries(companies,
        function (company, done) {
            models.Company.incBalance(company.companyId, company.amount, function (err) {
                if (err) {
                    return done(err);
                }
                done();
            });
        },
        function (err) {
            if (err) {
                return cb(err);
            }
            cb();
        });
};

/**
 * Generates discount type pay in the given patient's service.
 * @param {object} user user object
 * @param {date} time pay date and time
 * @param {object} patSrv patient's service object
 * @returns {*}
 */
var genDiscountPay = function (user, time, patSrv) {
    // if there is discount, generate pay for it
    if (patSrv.discount && patSrv.discount.type && patSrv.discount.state._id == 'new') {
        // by default assume type='amount' and discount sum = discount amount
        patSrv.discount.sum = patSrv.discount.amount;

        // if discount type is percent, calculate discount sum
        if (patSrv.discount.type == 'percent') {
            patSrv.discount.sum = (patSrv.discount.amount * (patSrv.quantity * (patSrv.price + patSrv.overPrice))) / 100;
        }

        // this is saved only in pays[n].discount property
        patSrv.discount.state = {_id: 'payed', title: 'Оплачен'};

        patSrv.pays.push({
            amount: patSrv.discount.sum,
            payType: {_id: 'discount', title: 'Скидка'},
            created: time,
            branch: user.branch,
            user: user._id,
            state: {_id: 'payed', title: 'Оплачен'},
            discount: patSrv.discount
        });
    }
    return patSrv;
};

/**
 * Gathers patient services in payInfo.patientServicesWithPays object.
 * Patient service's ID becomes key, patient service itself becomes its value.
 * If payInfo.patientServicesWithPays is undefined, initializes with empty object.
 * @param {object} payInfo payment info object
 * @param {object} patSrv patient services to gather
 */
var gatherPatSrvWithPays = function (payInfo, patSrv) {
    // initialize patientServicesWithPays
    payInfo.patientServicesWithPays = payInfo.patientServicesWithPays || {};
    // keep patient service with pay(s),
    // if it is already there, this statement will replace it
    payInfo.patientServicesWithPays[patSrv._id] = patSrv;
};

/**
 * Generates discount.
 * @param {object} user current user
 * @param {Date} time pay date and time
 * @param {object} payInfo pay info object
 * @param {object} patSrv patient service
 * @param {string} sumProperty possible values: 'sum' or 'sumCompany'
 */
var addDiscountPay = function (user, time, payInfo, patSrv, sumProperty) {
    // determine amount
    let amount = patSrv.debt;

    // if there is discount, generate discount model & pay
    if (payInfo.discount[sumProperty] > 0) {
        // generate discount model
        let discount = {};
        discount.type = payInfo.discount.type;
        discount.note = payInfo.discount.note;
        discount.state = {_id: 'payed', title: 'Оплачен'};
        discount.amount = payInfo.discount.amount; // amount % or amount sum

        // determine discount sum
        if (payInfo.discount[sumProperty] >= amount) {
            // discount covers whole debt
            discount.sum = amount;
            // calculate left discount sum
            payInfo.discount[sumProperty] -= amount;
        } else {
            // there is more debt than discount sum
            // set all discount sum as discount sum in model
            discount.sum = payInfo.discount[sumProperty];
            // no left discount sum
            payInfo.discount[sumProperty] = 0;
        }

        // generate discount pay
        patSrv.pays.push({
            amount: discount.sum,
            payType: {_id: 'discount', title: 'Скидка'},
            created: time,
            branch: user.branch,
            user: user._id,
            state: {_id: 'payed', title: 'Оплачен'},
            discount: discount,
            percentOfPartner: 0, // do not calculate partners' interest for discounts
            interestOfPartner: 0
        });

        // increase discount price
        patSrv.discountPrice += discount.sum;

        // decrease total price
        patSrv.priceTotal -= discount.sum;

        // decrease debt & increase payed
        patSrv.debt -= discount.sum;
        patSrv.payed += discount.sum;

        // change service state, if it isn't completed already
        if (patSrv.state._id != 'completed') {
            if (patSrv.debt > 0) {
                patSrv.state = {_id: 'partlyPayed', title: 'Частично оплачен'};
            } else {
                patSrv.state = {_id: 'payed', title: 'Оплачен'};
            }
        }

        gatherPatSrvWithPays(payInfo, patSrv);
    }
};

var addPay = function (user, time, payInfo, patSrv, totalProperty, payType) {
    // counter
    //payInfo.counter = payInfo.counter || 0;
    //payInfo.counter++;

    // if not enough money, just return
    if (payInfo[totalProperty] <= 0) {
        //F.inspect(patSrv, `${payInfo.counter}. ----- RETURN PatientService:`);
        //F.inspect(payInfo, `${payInfo.counter}. +++++ RETURN PayInfo:`);
        return;
    }

    // determine amount
    let amount = patSrv.debt;

    if (amount > payInfo[totalProperty] && payInfo[totalProperty] > 0) {
        amount = payInfo[totalProperty];
    }

    // check for discount
    genDiscountPay(user, time, patSrv);

    let pay = {
        amount: amount,
        payType: payType,
        created: time,
        branch: user.branch,
        user: user._id,
        state: {_id: 'payed', title: 'Оплачен'}
    };

    calcPartnerInterest(pay, patSrv);

    // generate pay
    patSrv.pays.push(pay);

    // decrease debt & increase payed
    patSrv.debt -= amount;
    patSrv.payed += amount;

    // change service state, if it isn't completed already
    if (patSrv.state._id != 'completed') {
        if (patSrv.debt > 0) {
            patSrv.state = {_id: 'partlyPayed', title: 'Частично оплачен'};
        } else {
            patSrv.state = {_id: 'payed', title: 'Оплачен'};
        }
    }

    // decrease left amount
    if (totalProperty == 'totalCashless' || totalProperty == 'totalCash' || totalProperty == 'totalCompany') {
        payInfo[totalProperty] -= amount;
    }
    // total company amount is not in total value,
    // for total company do not increase total to amount value
    if (totalProperty != 'totalCompany') {
        payInfo.total -= amount;
    }

    gatherPatSrvWithPays(payInfo, patSrv);

    //F.inspect(patSrv, `${payInfo.counter}. ----- PatientService:`);
    //F.inspect(payInfo, `${payInfo.counter}. +++++ PayInfo:`);
};

/**
 * Calculates partner's interest and fill appropriate fields in pay object.
 * @param {object} pay pay object with amount
 * @param {object} patSrv patient's service object
 */
var calcPartnerInterest = function (pay, patSrv) {
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
 *   {
 *     patientId: XXX,
 *     payType: undefined | { _id: XXX, title: XXX },
 *     totalDebt: XXX,
 *     total: XXX,
 *     totalCash: XXX,
 *     totalCashless: XXX,
 *     totalCompany: XXX,
 *     discount: {
 *       type: XXX, // percent | amount
 *       amount: XXX, // XXX % or XXX som
 *       sum: XXX, // calculated total discount amount in som
 *       sumCompany: XXX // calculated company's discount amount in som
 *     }
 *     debt: XXX
 *   }
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

        var companies = [];

        let pType = payInfo.payType ? payInfo.payType._id : undefined;

        // discount amount without company's discount amount
        payInfo.discount.sum -= payInfo.discount.sumCompany;

        // populating pays for each pending service
        for (let patSrv of patientServices) {

            // Pay by company
            if (patSrv.company) {

                addDiscountPay(user, time, payInfo, patSrv, 'sumCompany');

                if (patSrv.debt > payInfo.totalCompany) {
                    return cb(`Сумма оплаты за счет организации пациента меньше чем долг за услуги ${patSrv.title}.`);
                }

                // keep debt amount,
                // debt amount is necessary to change company balance
                let amount = patSrv.debt;

                addPay(user, time, payInfo, patSrv, 'totalCompany', {_id: 'company', title: 'Организация'});

                // decrease company's balance
                companies.push({
                    companyId: patSrv.company._id,
                    amount: -amount
                });

                // if there are no more money, stop processing other services
                if (payInfo.totalCompany <= 0) {
                    // if there is other type of pays or discounts, continue processing them
                    if (payInfo.total > 0 || payInfo.discount.sum > 0 || payInfo.discount.sumCompany > 0) {
                        continue;
                    }

                    // otherwise, stop processing
                    break;
                }
            } else if (pType == 'cash' || pType == 'cashless') {
                // if there is no more money, but there is company pays or company pay discount,
                // continue processing other patient services
                if (payInfo.total <= 0 && payInfo.discount.sum <= 0 &&
                    (payInfo.totalCompany > 0 || payInfo.discount.sumCompany > 0)) {
                    continue;
                }

                addDiscountPay(user, time, payInfo, patSrv, 'sum');

                addPay(user, time, payInfo, patSrv, 'total', payInfo.payType);

                // if there are no more money or discount, stop processing other services
                if (payInfo.total <= 0 && payInfo.totalCompany == 0 &&
                    payInfo.discount.sum <= 0 && payInfo.discount.sumCompany <= 0) {
                    break;
                }


            } else if (pType == 'separated') {
                // if there is no more money, but there is company pays or company pay discount,
                // continue processing other patient services
                if (payInfo.total <= 0 && payInfo.discount.sum <= 0 &&
                    (payInfo.totalCompany > 0 || payInfo.discount.sumCompany > 0)) {
                    continue;
                }

                addDiscountPay(user, time, payInfo, patSrv, 'sum');

                addPay(user, time, payInfo, patSrv, 'totalCashless', {_id: 'cashless', title: 'Безналичные'});

                // if there are no more money & discount, stop processing other services
                if (payInfo.total <= 0 && payInfo.discount.sum <= 0) {
                    // if there is company pays or discount for company pays, then continue processing patient services
                    if (payInfo.totalCompany > 0 || payInfo.discount.sumCompany > 0) {
                        continue;
                    }

                    // if there is no company pays, stop processing other services
                    break;
                }

                // if there is more debt, cover it from cash
                if (patSrv.debt > 0) {

                    addPay(user, time, payInfo, patSrv, 'totalCash', {_id: 'cash', title: 'Наличные'});

                    // if there are no more money, stop processing other services
                    if (payInfo.total <= 0 && payInfo.discount.sum <= 0) {
                        // if there is company pays or discount for company pays,
                        // then continue processing patient services
                        if (payInfo.totalCompany > 0 || payInfo.discount.sumCompany > 0) {
                            continue;
                        }

                        // if there is no company pays, stop processing other services
                        break;
                    }
                }
            }
        }

        //F.inspect(payInfo.patientServicesWithPays, 'PayInfo.patientServicesWithPays=');

        // convert {pSrvId1: PatSrv1, pSrvId2: PatSrv2, ...} to [PatSrv1, PatSrv2, ...] array
        let patientServicesWithPays = [];
        for (let pSrvId in payInfo.patientServicesWithPays) {
            patientServicesWithPays.push(payInfo.patientServicesWithPays[pSrvId]);
        }

        // save patient services with pays
        Cash.savePays(patientServicesWithPays, function (err) {
            if (err) {
                return cb(err);
            }

            // if there is companies with pending balance change, do it
            if (companies.length > 0) {
                Cash.changeCompaniesBalance(companies, function (err) {
                    if (err) {
                        return cb(err);
                    }
                    return cb(null, time);
                });
            } else {
                return cb(null, time);
            }
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
        'pays.payType._id': {$in: ['cash', 'cashless', 'discount', 'company']}
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