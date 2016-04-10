var mongoose = require('mongoose');
require('mongoose-type-email');
var stateSchema = require('./State').StateSchema;

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
    state: stateSchema,
    created: {type: Date, required: true, default: new Date()},
    userId: {type: String, required: true, default: '1'} //todo: set real user id or user schema
});

var Partner = mongoose.model('Partner', PartnerSchema);

module.exports = Partner;