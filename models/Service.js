var mongoose = require('mongoose');
var categorySchema = require('./ServiceCategory').ServiceCategorySchema;
var stateSchema = require('./State').StateSchema;

var ServiceSchema = mongoose.Schema({
    category: categorySchema,
    title: {type: String, required: true, maxlength: 150},
    shortTitle: {type: String, required: true, maxlength: 20},
    price: {type: Number, required: true, default: 0, min: 0},
    state: stateSchema,
    created: {type: Date, required: true, default: new Date()},
    userId: {type: String, required: true, default: '1'} //todo: set real user id or user schema
});

var Service = mongoose.model('Service', ServiceSchema);

module.exports = Service;