var mongoose = require('mongoose');
var categorySchema = require('./ServiceCategory').ServiceCategorySchema;
var subCategorySchema = require('./ServiceSubCategory').ServiceSubCategorySchema;
var subSubCategorySchema = require('./ServiceSubSubCategory').ServiceSubSubCategorySchema;
var stateSchema = require('./State').StateSchema;
var templateSchema = require('./Template').TemplateSchema;
var serviceFieldSchema = require('./ServiceField').ServiceFieldSchema;

var ServiceSchema = mongoose.Schema({
    category: categorySchema,
    subcategory: subCategorySchema,
    subsubcategory: subSubCategorySchema,
    title: {type: String, required: true, maxlength: 150},
    shortTitle: {type: String, required: true, maxlength: 20},
    price: {type: Number, required: true, default: 0, min: 0},
    state: stateSchema,
    templates: [templateSchema],
    fields: [serviceFieldSchema],
    created: {type: Date, required: true, default: new Date()},
    userId: {type: String, required: true, default: '1'} //todo: set real user id or user schema
});

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

var Service = mongoose.model('Service', ServiceSchema);

module.exports = Service;