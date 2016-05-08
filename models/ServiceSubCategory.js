var mongoose = require('mongoose');

var ServiceSubCategorySchema = mongoose.Schema({
    title: {type: String, required: true, maxlength: 50},
    shortTitle: {type: String, required: true, maxlength: 20}
});

var ServiceSubCategory = mongoose.model('ServiceSubCategory', ServiceSubCategorySchema);

module.exports.ServiceSubCategorySchema = ServiceSubCategorySchema;
module.exports.ServiceSubCategory = ServiceSubCategory;