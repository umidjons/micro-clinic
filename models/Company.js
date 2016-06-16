var mongoose = require('mongoose');
var stateSchema = require('./State').StateSchema;
var models = require('.');
var F = require('../include/F');
var debug = require('debug')('myclinic:model:company');

var DepositSchema = mongoose.Schema({
    amount: {type: Number, required: true},
    date: {type: Date, required: true, default: new Date()},
    state: stateSchema,
    created: {type: Date, required: true, default: new Date()},
    user: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
    canceled: {type: Date},
    canceledUser: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
});

/*
 Available states:
 { _id: 'active',   title: 'Активный' }
 { _id: 'canceled', title: 'Отменен'  }
 */

var Deposit = mongoose.model('Deposit', DepositSchema);

var CompanySchema = mongoose.Schema({
    title: {type: String, required: true, maxlength: 100},
    shortTitle: {type: String, required: true, maxlength: 50},
    address: {type: String, maxlength: 500},
    phone: {type: String, match: /^\d{5,12}$/},
    balance: {type: Number, required: true, default: 0},
    pays: [DepositSchema],
    state: stateSchema,
    created: {type: Date, required: true, default: new Date()},
    user: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'}
});

/*
 Available states:
 { _id: 'active',  title: 'Активный'     }
 { _id: 'blocked', title: 'Заблокирован' }
 */

CompanySchema.statics.incBalance = function (companyId, amount, cb) {
    Company.findById(companyId).exec(function (err, company) {
        if (err) {
            return cb(err);
        }

        company.balance += amount;
        company.save(function (err) {
            if (err) {
                return cb(err);
            }

            cb(null);
        });
    });
};

CompanySchema.statics.details = function (startDate, endDate, companyId, cb) {
    var period = F.normalizePeriod(startDate, endDate);

    debug(F.inspect(period, 'Period to get company details:', true));

    models.PatientService
        .find({
            'created': {$gte: period.start, $lte: period.end},
            'company._id': companyId
        }, {code: 1, patientId: 1, title: 1, priceTotal: 1, created: 1})
        .populate('patientId', 'lastName firstName middleName')
        .sort({'patientId.lastName': 1, 'patientId.firstName': 1, created: 1, title: 1})
        .exec(function (err, docs) {
            if (err) {
                return cb(err);
            }

            cb(null, docs);
        });
};

var Company = mongoose.model('Company', CompanySchema);

module.exports.Company = Company;
module.exports.CompanySchema = CompanySchema;
module.exports.Deposit = Deposit;
module.exports.DepositSchema = DepositSchema;