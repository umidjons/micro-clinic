'use strict';

var mongoose = require('mongoose');
var categorySchema = require('./ServiceCategory').ServiceCategorySchema;
var stateSchema = require('./State').StateSchema;
var discountSchema = require('./Discount').DiscountSchema;
var partnerSchema = require('./Partner').PartnerSchema;
var cashSchema = require('./Cash').CashSchema;
var templateSchema = require('./Template').TemplateSchema;
var serviceFieldSchema = require('./ServiceField').ServiceFieldSchema;
var subCategorySchema = require('./ServiceSubCategory').ServiceSubCategorySchema;
var subSubCategorySchema = require('./ServiceSubSubCategory').ServiceSubSubCategorySchema;
var sugar = require('sugar');
var F = require('../include/F');
var debug = require('debug')('myclinic:model:patientservice');

var PatientServiceSchema = mongoose.Schema({
    patientId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Patient'},
    serviceId: {type: mongoose.Schema.Types.ObjectId, required: true},
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
    partner: partnerSchema,
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

PatientServiceSchema.statics.pendingPatients = function (branch, cb) {
    let ObjectId = mongoose.Types.ObjectId;
    let condition = {'state._id': {$in: ['new', 'partlyPayed']}};

    // if branch (branch id) is specified, filter by it
    if (branch) {
        condition.branch = ObjectId(branch);
    }

    debug(F.inspect(condition, 'Condition to retrieve pending patient services for cash:', true));

    PatientService.aggregate()
        .match(condition)
        .group({
            _id: '$patientId', // _id is patient id
            quantity: {$sum: '$quantity'},
            totalPrice: {$sum: '$priceTotal'},
            totalPayed: {$sum: '$payed'},
            totalDebt: {$sum: '$debt'},
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

PatientServiceSchema.statics.payedPatients = function (startDate, endDate, cb) {
    startDate = startDate || 'today';
    endDate = endDate || 'today';

    startDate = Date.create(startDate);
    endDate = Date.create(endDate);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    //todo: implement total by refund pay type
    //todo: implement total by discount pay type

    PatientService.aggregate([
        //db.patientservices.aggregate([
        {
            $match: {
                'pays.created': {$gte: startDate, $lte: endDate}
            }
        },
        {
            $unwind: '$pays'
        },
        {
            $group: {
                _id: {patientId: '$patientId', 'payTime': '$pays.created'},
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
                payAmount: '$payAmount',
                payAmountCash: '$payAmountCash',
                payAmountCashless: '$payAmountCashless'
            }
        }
    ], function (err, records) {
        if (err) {
            return cb(err);
        }

        cb(null, records);
    });
};


PatientServiceSchema.statics.payDetails = function (patientId, dateTime, cb) {
    dateTime = Date.create(dateTime);

    PatientService.aggregate([
        //db.patientservices.aggregate([
        {
            $match: {
                'pays.created': dateTime
            }
        },
        {
            $unwind: '$pays'
        },
        {
            $match: {
                'pays.created': dateTime
            }
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

var PatientService = mongoose.model('PatientService', PatientServiceSchema);

module.exports.PatientService = PatientService;
module.exports.PatientServiceSchema = PatientServiceSchema;

/*
 * Available states:
 * {_id:'new', title:'Новый'}
 * {_id:'partlyPayed', title:'Частично оплачен'}
 * {_id:'payed', title:'Оплачен'}
 * {_id:'completed', title:'Завершен'}
 */