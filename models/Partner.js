'use strict';

var mongoose = require('mongoose');
require('mongoose-type-email');
var stateSchema = require('./State').StateSchema;
var models = require('.');
var sugar = require('sugar');
var F = require('../include/F');
var debug = require('debug')('myclinic:model:partner');

var PartnerSchema = mongoose.Schema({
    code: {type: String, required: true, maxlength: 50},
    percent: {type: Number, required: true, min: 0, max: 100},
    firstName: {type: String, required: true, maxlength: 50},
    lastName: {type: String, required: true, maxlength: 50},
    middleName: {type: String, maxlength: 50},
    address: {type: String, required: true, maxlength: 500},
    cellPhone: {type: String, required: true, match: /^\d{5,12}$/},
    homePhone: {type: String, match: /^\d{5,12}$/},
    email: {type: mongoose.SchemaTypes.Email, maxlength: 50},
    company: {type: String, maxlength: 200},
    position: {type: String, maxlength: 200},
    comment: {type: String, maxlength: 1000},
    state: stateSchema,
    created: {type: Date, required: true, default: new Date()},
    user: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'}
});

PartnerSchema.index({code: 1}, {unique: true});

PartnerSchema.virtual('fullName').get(function () {
    return (this.lastName + ' ' + this.firstName + ' ' + this.middleName).trim();
});

/**
 * Increments partner code in application settings.
 * @param {callback} cb callback function with error and new code arguments.
 */
PartnerSchema.statics.incCode = function (cb) {
    models.Setting.findById('partnerCode', function (err, setting) {
        if (err) {
            return cb(err);
        }
        let len = setting.value.length;
        let currentValue = 1 * setting.value; // current value as number
        let newValue = (++currentValue).pad(len);
        setting.value = newValue;
        setting.save(function (err) {
            if (err) {
                return cb(err);
            }
            cb(null, newValue);
        });
    });
};

PartnerSchema.statics.interests = function (startDate, endDate, partnerId, cb) {
    var period = F.normalizePeriod(startDate, endDate);

    debug(F.inspect(period, 'Period to get partners interests:', true));

    let cond = {
        'partner': {$exists: true},
        'pays.created': {$gte: period.start, $lte: period.end}
    };

    if (partnerId) {
        cond['partner._id'] = mongoose.Types.ObjectId(partnerId);
    }

    models.PatientService.aggregate([
        //db.patientservices.aggregate([
        {
            $match: cond
        },
        {
            $unwind: '$pays'
        },
        {
            $match: {
                'pays.payType._id': {$in: ['cash', 'cashless']},
                'pays.state._id': 'payed'
            }
        },
        {
            $group: {
                _id: {partnerCode: '$partner.code'},
                partnerInterest: {$sum: '$pays.interestOfPartner'}
            }
        },
        {
            $sort: {'_id.partnerCode': 1}
        },
        {
            $lookup: {
                from: 'partners',
                localField: '_id.partnerCode',
                foreignField: 'code',
                as: 'partner'
            }
        },
        {
            $unwind: '$partner'
        },
        {
            $project: {
                _id: 0,
                partnerCode: '$_id.partnerCode',
                partner: '$partner',
                partnerInterest: '$partnerInterest'
            }
        }
    ], function (err, records) {
        if (err) {
            return cb(err);
        }

        cb(null, records);
    });
};

PartnerSchema.statics.interestsDetails = function (startDate, endDate, partnerCode, cb) {
    var period = F.normalizePeriod(startDate, endDate);

    debug(F.inspect(period, "Period to get partner's interests details:", true));

    models.PatientService.aggregate([
        //db.patientservices.aggregate([
        {
            $match: {
                'partner': {$exists: true},
                'partner.code': partnerCode,
                'pays.created': {$gte: period.start, $lte: period.end},
                'pays.state._id': 'payed'
            }
        },
        {
            $unwind: '$pays'
        },
        {
            $match: {
                'pays.payType._id': {$in: ['cash', 'cashless']},
                'pays.state._id': 'payed'
            }
        },
        {
            $group: {
                _id: {
                    partnerCode: '$partner.code',
                    serviceTitle: '$title',
                    patientId: '$patientId',
                    serviceTime: '$created'
                },
                partnerInterest: {$sum: '$pays.interestOfPartner'},
                payed: {$sum: '$pays.amount'}
            }
        },
        {
            $sort: {'_id.serviceTime': 1}
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
                partnerCode: '$_id.partnerCode',
                serviceTitle: '$_id.serviceTitle',
                serviceTime: '$_id.serviceTime',
                patient: '$patient',
                payed: '$payed',
                partnerInterest: '$partnerInterest'
            }
        }
    ], function (err, records) {
        if (err) {
            return cb(err);
        }

        cb(null, records);
    });
};

PartnerSchema.set('toJSON', {virtuals: true});
PartnerSchema.set('toObject', {virtuals: true});

var Partner = mongoose.model('Partner', PartnerSchema);

module.exports.Partner = Partner;
module.exports.PartnerSchema = PartnerSchema;