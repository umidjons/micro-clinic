var mongoose = require('mongoose');
require('mongoose-type-email');
var sexSchema = require('./Sex').SexSchema;

var PatientSchema = mongoose.Schema({
    firstName: {type: String, required: true, maxlength: 50},
    lastName: {type: String, required: true, maxlength: 50},
    middleName: {type: String, maxlength: 50},
    dateOfBirth: {type: Date, required: true},
    sex: sexSchema,
    address: {type: String, required: true, maxlength: 500},
    cellPhone: {type: String, required: true, match: /^\d{5,12}$/},
    homePhone: {type: String, match: /^\d{5,12}$/},
    email: {type: mongoose.SchemaTypes.Email, maxlength: 50},
    company: {type: String, maxlength: 200},
    created: {type: Date, required: true, default: new Date()}
});

var Patient = mongoose.model('Patient', PatientSchema);

module.exports = Patient;