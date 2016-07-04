var mongoose = require('mongoose');
var stateSchema = require('./State').StateSchema;
var subCategorySchema = require('./ServiceSubCategory').ServiceSubCategorySchema;

var ServiceCategorySchema = mongoose.Schema({
    _id: {type: String, required: true, maxlength: 100}, // manually create
    title: {type: String, required: true, maxlength: 50},
    shortTitle: {type: String, required: true, maxlength: 20},
    subcategories: [subCategorySchema],
    state: stateSchema,
    created: {type: Date, required: true, default: new Date()},
    user: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'}
});

ServiceCategorySchema.index({_id: 1}, {unique: true});

var ServiceCategory = mongoose.model('ServiceCategory', ServiceCategorySchema);

module.exports.ServiceCategorySchema = ServiceCategorySchema;
module.exports.ServiceCategory = ServiceCategory;