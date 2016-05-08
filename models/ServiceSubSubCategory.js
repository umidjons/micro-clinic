var mongoose = require('mongoose');

var ServiceSubSubCategorySchema = mongoose.Schema({
    title: {type: String, required: true, maxlength: 50},
    shortTitle: {type: String, required: true, maxlength: 20}
});

var ServiceSubSubCategory = mongoose.model('ServiceSubSubCategory', ServiceSubSubCategorySchema);

module.exports.ServiceSubSubCategorySchema = ServiceSubSubCategorySchema;
module.exports.ServiceSubSubCategory = ServiceSubSubCategory;