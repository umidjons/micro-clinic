var mongoose = require('mongoose');
var categorySchema = require('./ServiceCategory').ServiceCategorySchema;
var subCategorySchema = require('./ServiceSubCategory').ServiceSubCategorySchema;
var subSubCategorySchema = require('./ServiceSubSubCategory').ServiceSubSubCategorySchema;
var stateSchema = require('./State').StateSchema;
var templateSchema = require('./Template').TemplateSchema;
var serviceFieldSchema = require('./ServiceField').ServiceFieldSchema;
var models = require('.');

var ServiceSchema = mongoose.Schema({
    category: categorySchema,
    subcategory: subCategorySchema,
    subsubcategory: subSubCategorySchema,
    title: {type: String, required: true, maxlength: 150},
    shortTitle: {type: String, required: true, maxlength: 20},
    price: {type: Number, required: true, default: 0, min: 0},
    norm: {type: String, maxlength: 1000},
    state: stateSchema,
    templates: [templateSchema],
    fields: [serviceFieldSchema],
    resultFields: [serviceFieldSchema],
    created: {type: Date, required: true, default: new Date()},
    user: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'}
});

ServiceSchema.index({category: 1, subcategory: 1, subsubcategory: 1, title: 1}, {unique: true});

/**
 * Removes/empties unnecessary properties.
 * @param {object} service
 */
ServiceSchema.statics.lighten = function (service) {
    service.category.subcategories = undefined;
    if (service.subcategory && service.subcategory.subcategories) {
        service.subcategory.subcategories = undefined;
    }
};

ServiceSchema.methods.isUsed = function (cb) {
    models.PatientService.count({serviceId: this._id}, function (err, count) {
        if (err) {
            return cb(err);
        }
        return cb(null, count > 0);
    });
};

var Service = mongoose.model('Service', ServiceSchema);

module.exports = Service;