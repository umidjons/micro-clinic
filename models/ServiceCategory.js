var mongoose = require('mongoose');

var ServiceCategorySchema = mongoose.Schema({
    _id: {type: String, required: true, maxlength: 100}, // manually create
    title: {type: String, required: true, maxlength: 50},
    shortTitle: {type: String, required: true, maxlength: 20}
});

var ServiceCategory = mongoose.model('ServiceCategory', ServiceCategorySchema);

module.exports.ServiceCategorySchema = ServiceCategorySchema;
module.exports.ServiceCategory = ServiceCategory;