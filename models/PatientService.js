'use strict';

var mongoose = require('mongoose');
var categorySchema = require('./ServiceCategory').ServiceCategorySchema;
var stateSchema = require('./State').StateSchema;
var discountSchema = require('./Discount').DiscountSchema;
var partnerSchema = require('./Partner').PartnerSchema;
var companySchema = require('./Company').CompanySchema;
var cashSchema = require('./Cash').CashSchema;
var templateSchema = require('./Template').TemplateSchema;
var serviceFieldSchema = require('./ServiceField').ServiceFieldSchema;
var subCategorySchema = require('./ServiceSubCategory').ServiceSubCategorySchema;
var subSubCategorySchema = require('./ServiceSubSubCategory').ServiceSubSubCategorySchema;
var sugar = require('sugar');
var F = require('../include/F');
var debug = require('debug')('myclinic:model:patientservice');
var async = require('async');

var PatientServiceSchema = mongoose.Schema({
    patientId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Patient'},
    serviceId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Service'},
    category: categorySchema,
    subcategory: subCategorySchema,
    subsubcategory: subSubCategorySchema,
    title: {type: String, required: true, maxlength: 150},
    shortTitle: {type: String, required: true, maxlength: 20},
    price: {type: Number, required: true, default: 0, min: 0},
    quantity: {type: Number, required: true, min: 0},
    priceTotal: {type: Number, required: true, min: 0},
    payed: {type: Number, required: true, min: 0, default: 0},
    debt: {type: Number, required: true, min: 0},
    pays: [cashSchema],
    discount: {type: discountSchema},
    discountPrice: {type: Number, default: 0},
    overPercent: {type: Number, default: 0}, // over percent for non-residents
    overPrice: {type: Number, default: 0}, // over price for non-residents, auto-calculates according to over percent
    overPriceTotal: {type: Number, default: 0},
    partner: partnerSchema,
    company: companySchema,
    fields: [serviceFieldSchema],
    result: {
        fields: [serviceFieldSchema],
        template: templateSchema,
        content: {type: String}
    },
    state: stateSchema,
    created: {type: Date, required: true, default: new Date()},
    user: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
    branch: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Branch'}
});

PatientServiceSchema.virtual('minCat').get(function () {
    if (this.subsubcategory && this.subsubcategory.title) {
        return this.subsubcategory.title;
    }

    if (this.subcategory && this.subcategory.title) {
        return this.subcategory.title;
    }

    if (this.category && this.category.title) {
        return this.category.title;
    }
    
    return '';
});

PatientServiceSchema.virtual('cat').get(function () {
    let cats = [];

    if (this.category && this.category.title) {
        cats.push(this.category.title);
    }

    if (this.subcategory && this.subcategory.title) {
        cats.push(this.subcategory.title);
    }

    if (this.subsubcategory && this.subsubcategory.title) {
        cats.push(this.subsubcategory.title);
    }

    if (!cats) {
        return '';
    }

    return cats.join(' / ');
});

PatientServiceSchema.set('toJSON', {virtuals: true});
PatientServiceSchema.set('toObject', {virtuals: true});


PatientServiceSchema.statics.pendingPatients = function (branch, period, cb) {
    let ObjectId = mongoose.Types.ObjectId;
    let condition = {'state._id': {$in: ['new', 'partlyPayed']}};

    // if branch (branch id) is specified, filter by it
    if (branch) {
        condition.branch = ObjectId(branch);
    }

    // filter patient services by patient's last visit date
    let conditionWithPeriod = Object.assign({}, condition);
    if (period) {
        period = F.normalizePeriod(period.start, period.end);
        conditionWithPeriod['patient.lastVisit'] = {$gte: period.start, $lte: period.end};
    }

    debug(F.inspect(condition, 'Condition to retrieve pending patient services for cash:', true));

    PatientService.aggregate()
        .match(condition)
        .lookup({
            from: 'patients',
            localField: 'patientId',
            foreignField: '_id',
            as: 'patient'
        })
        .match(conditionWithPeriod)
        .group({
            _id: '$patientId', // _id is patient id
            quantity: {$sum: '$quantity'},
            totalPrice: {$sum: '$priceTotal'},
            totalPayed: {$sum: '$payed'},
            totalDebt: {$sum: '$debt'},
            totalCompany: { // if company specified for patient service, then gather its debt into totalCompany
                $sum: {
                    $cond: [
                        {$gt: ['$company', null]},
                        '$debt',
                        0
                    ]
                }
            },
            lastService: {$max: '$created'}
        })
        .lookup({
            from: 'patients',
            localField: '_id',
            foreignField: '_id',
            as: 'patient'
        })
        .sort({lastService: -1})
        .unwind('$patient')
        .exec(function (err, records) {
            if (err) {
                return cb(err);
            }

            cb(null, records);
        });
};

PatientServiceSchema.statics.payedPatients = function (branch, startDate, endDate, cb) {
    var period = F.normalizePeriod(startDate, endDate);

    let ObjectId = mongoose.Types.ObjectId;
    let condition = {'pays.created': {$gte: period.start, $lte: period.end}};

    if (branch) {
        condition['pays.branch._id'] = ObjectId(branch);
    }

    PatientService.aggregate([
        //db.patientservices.aggregate([
        {
            $match: condition
        },
        {
            $unwind: '$pays'
        },
        {
            $match: condition
        },
        {
            $group: {
                _id: {patientId: '$patientId', 'payTime': '$pays.created', 'payState': '$pays.state'},
                payAmount: {$sum: '$pays.amount'},
                payAmountCash: {
                    $sum: {
                        $cond: [
                            {$eq: ['$pays.payType._id', 'cash']},
                            '$pays.amount',
                            0
                        ]
                    }
                },
                payAmountCashless: {
                    $sum: {
                        $cond: [
                            {$eq: ['$pays.payType._id', 'cashless']},
                            '$pays.amount',
                            0
                        ]
                    }
                },
                payAmountDiscount: {
                    $sum: {
                        $cond: [
                            {$eq: ['$pays.payType._id', 'discount']},
                            '$pays.amount',
                            0
                        ]
                    }
                },
                payAmountRefund: {
                    $sum: {
                        $cond: [
                            {$eq: ['$pays.payType._id', 'refund']},
                            '$pays.amount',
                            0
                        ]
                    }
                },
                payAmountCompany: {
                    $sum: {
                        $cond: [
                            {$eq: ['$pays.payType._id', 'company']},
                            '$pays.amount',
                            0
                        ]
                    }
                }
            }
        },
        {
            $sort: {'_id.payTime': -1}
        },
        {
            $lookup: {
                from: 'patients',
                localField: '_id.patientId',
                foreignField: '_id',
                as: 'patient'
            }
        },
        {
            $unwind: '$patient'
        },
        {
            $project: {
                _id: 0,
                patientId: '$_id.patientId',
                patient: '$patient',
                payTime: '$_id.payTime',
                payState: '$_id.payState',
                payAmount: '$payAmount',
                payAmountCash: '$payAmountCash',
                payAmountCashless: '$payAmountCashless',
                payAmountDiscount: '$payAmountDiscount',
                payAmountRefund: '$payAmountRefund',
                payAmountCompany: '$payAmountCompany',
                isRefund: {$cond: [{$gt: ['$payAmountRefund', 0]}, true, false]}
            }
        }
    ], function (err, records) {
        if (err) {
            return cb(err);
        }

        cb(null, records);
    });
};


PatientServiceSchema.statics.payDetails = function (patientId, dateTime, isForCheck, cb) {
    dateTime = Date.create(dateTime);

    let condition = {
        'pays.created': dateTime
    };

    // if for printing check, then do not show discount and refund type pays
    if (isForCheck) {
        condition['pays.payType._id'] = {$nin: ['discount', 'refund']};
    }

    PatientService.aggregate([
        //db.patientservices.aggregate([
        {
            $match: {
                'pays.created': dateTime // do not use 'condition' variable here
            }
        },
        {
            $unwind: '$pays'
        },
        {
            $match: condition
        },
        {
            $lookup: {
                from: 'patients',
                localField: 'patientId',
                foreignField: '_id',
                as: 'patient'
            }
        },
        {
            $unwind: '$patient'
        },
        {
            $lookup: {
                from: 'users',
                localField: 'pays.user',
                foreignField: '_id',
                as: 'pays.cashier'
            }
        },
        {
            $unwind: '$pays.cashier'
        },
        {
            $sort: {
                '_id': 1
            }
        }
    ], function (err, records) {
        if (err) {
            return cb(err);
        }

        cb(null, records);
    });
};

PatientServiceSchema.statics.pendingServicesOf = function (branch, patientId, cb) {
    var condition = {
        patientId: patientId,
        'state._id': {$in: ['new', 'partlyPayed']}
    };

    if (branch) {
        condition.branch = mongoose.Types.ObjectId(branch);
    }

    PatientService.find(condition).sort({created: -1}).exec(function (err, patientServices) {
        if (err) {
            return cb(err);
        }

        return cb(null, patientServices);
    });
};

PatientServiceSchema.statics.laboratory = function (condition, cb) {
    async.parallel({
        services: function (callback) {
            PatientService.aggregate([
                    {
                        $match: condition
                    },
                    {
                        $group: {
                            _id: '$serviceId',
                            srvQty: {
                                $sum: 1
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: 'services',
                            localField: '_id',
                            foreignField: '_id',
                            as: 'service'
                        }
                    },
                    {
                        $unwind: '$service'
                    },
                    {
                        $sort: {
                            'service.title': 1
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            id: '$service._id',
                            title: '$service.title',
                            shortTitle: '$service.shortTitle',
                            qty: '$srvQty'
                        }
                    }
                ])
                .exec(function (err, services) {
                    if (err) {
                        return callback(err);
                    }

                    return callback(null, services);
                });
        },
        patientServices: function (callback) {
            PatientService.aggregate([
                    {
                        $match: condition
                    },
                    {
                        $lookup: {
                            from: 'patients',
                            localField: 'patientId',
                            foreignField: '_id',
                            as: 'patient'
                        }
                    },
                    {
                        $unwind: '$patient'
                    },
                    {
                        $lookup: {
                            from: 'branches',
                            localField: 'branch',
                            foreignField: '_id',
                            as: 'branch'
                        }
                    },
                    {
                        $unwind: '$branch'
                    },
                    {
                        $sort: {
                            'patient.lastName': 1,
                            'patient.firstName': 1,
                            'patient.middleName': 1,
                            'title': 1,
                            'branch.title': 1,
                            'created': -1
                        }
                    },
                    {
                        $group: {
                            _id: {
                                created: "$created",
                                patient: "$patient",
                                branch: "$branch"
                            },
                            services: {
                                $push: "$$ROOT"
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            services: 1,
                            fullName: {
                                $concat: [
                                    "$_id.patient.lastName", " ",
                                    "$_id.patient.firstName", " ",
                                    "$_id.patient.middleName"
                                ]
                            }
                        }
                    }
                ])
                .exec(function (err, patSrvList) {
                    if (err) {
                        return callback(err);
                    }

                    return callback(null, patSrvList);
                });
        }
    }, function (err, results) {
        if (err) {
            return cb(err)
        }

        cb(null, results);
    });
};

var PatientService = mongoose.model('PatientService', PatientServiceSchema);

module.exports.PatientService = PatientService;
module.exports.PatientServiceSchema = PatientServiceSchema;

/*
 * Available states:
 * { _id: 'new',          title: 'Новый'            }
 * { _id: 'partlyPayed',  title: 'Частично оплачен' }
 * { _id: 'payed',        title: 'Оплачен'          }
 * { _id: 'completed',    title: 'Завершен'         }
 * { _id: 'removed',      title: 'Удален'           }
 */