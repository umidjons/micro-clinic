var mongoose = require('mongoose');
var stateSchema = require('./State').StateSchema;

var CompanySchema = mongoose.Schema({
    title: {type: String, required: true, maxlength: 100},
    shortTitle: {type: String, required: true, maxlength: 50},
    address: {type: String, maxlength: 500},
    phone: {type: String, match: /^\d{5,12}$/},
    balance: {type: Number, default: 0},
    state: stateSchema,
    created: {type: Date, required: true, default: new Date()},
    user: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'}
});

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

var Company = mongoose.model('Company', CompanySchema);

module.exports.Company = Company;
module.exports.CompanySchema = CompanySchema;