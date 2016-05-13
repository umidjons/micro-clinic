var mongoose = require('mongoose');
var categorySchema = require('./ServiceCategory').ServiceCategorySchema;
var stateSchema = require('./State').StateSchema;
var discountSchema = require('./Discount').DiscountSchema;
var partnerSchema = require('./Partner').PartnerSchema;
var cashSchema = require('./Cash').CashSchema;
var templateSchema = require('./Template').TemplateSchema;
var serviceFieldSchema = require('./ServiceField').ServiceFieldSchema;


var PatientServiceSchema = mongoose.Schema({
    patientId: {type: mongoose.Schema.Types.ObjectId, required: true},
    serviceId: {type: mongoose.Schema.Types.ObjectId, required: true},
    category: categorySchema,
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
    userId: {type: String, required: true, default: '1'} //todo: set real user id or user schema
});

PatientServiceSchema.statics.pendingPatients = function (cb) {
    PatientService.aggregate([
        //db.patientservices.aggregate([
        {
            $match: {
                'state._id': {$in: ['new', 'partlyPayed']}
            }
        },
        {
            $group: {
                _id: '$patientId', // _id is patient id
                quantity: {$sum: '$quantity'},
                totalPrice: {$sum: '$priceTotal'},
                totalPayed: {$sum: '$payed'},
                totalDebt: {$sum: '$debt'},
                lastService: {$max: '$created'}
            }
        },
        {
            $lookup: {
                from: 'patients',
                localField: '_id',
                foreignField: '_id',
                as: 'patient'
            }
        },
        {
            $sort: {lastService: -1}
        },
        {
            $unwind: '$patient'
        }
    ], function (err, records) {
        if (err) {
            return cb(err);
        }

        cb(null, records);
    });
};

PatientServiceSchema.statics.pendingServicesOf = function (patientId, cb) {
    var condition = {
        patientId: patientId,
        'state._id': {$in: ['new', 'partlyPayed']}
    };

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