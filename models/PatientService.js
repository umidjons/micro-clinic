var mongoose = require('mongoose');
var categorySchema = require('./ServiceCategory').ServiceCategorySchema;
var stateSchema = require('./State').StateSchema;
var discountSchema = require('./Discount').DiscountSchema;
var partnerSchema = require('./Partner').PartnerSchema;


var PatientServiceSchema = mongoose.Schema({
    patientId: {type: String, required: true},
    category: categorySchema,
    title: {type: String, required: true, maxlength: 150},
    shortTitle: {type: String, required: true, maxlength: 20},
    price: {type: Number, required: true, default: 0, min: 0},
    quantity: {type: Number, required: true, min: 0},
    priceTotal: {type: Number, required: true, min: 0},
    discount: {type: discountSchema},
    partner: partnerSchema,
    state: stateSchema,
    created: {type: Date, required: true, default: new Date()},
    userId: {type: String, required: true, default: '1'} //todo: set real user id or user schema
});

var PatientService = mongoose.model('PatientService', PatientServiceSchema);

module.exports.PatientService = PatientService;
module.exports.PatientServiceSchema = PatientServiceSchema;