var mongoose = require('mongoose');
var stateSchema = require('./State').StateSchema;

var CompanySchema = mongoose.Schema({
    title: {type: String, required: true, maxlength: 100},
    shortTitle: {type: String, required: true, maxlength: 50},
    address: {type: String, maxlength: 500},
    phone: {type: String, match: /^\d{5,12}$/},
    state: stateSchema,
    created: {type: Date, required: true, default: new Date()},
    user: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'}
});

var Company = mongoose.model('Company', CompanySchema);

module.exports.Company = Company;
module.exports.CompanySchema = CompanySchema;