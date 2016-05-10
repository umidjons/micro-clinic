var mongoose = require('mongoose');

var ServiceFieldTypeSchema = mongoose.Schema({
    _id: {type: String, required: true},
    title: {type: String, required: true}
});

var ServiceFieldSchema = mongoose.Schema({
    type: {type: ServiceFieldTypeSchema, required: true},
    title: {type: String, required: true, maxlength: 50},
    placeholder: {type: String, maxlength: 50},
    hint: {type: String, maxlength: 200},
    minlength: {type: Number, min: 0, max: 1000},
    maxlength: {type: Number, min: 0, max: 1000},
    pattern: {type: String, maxlength: 1000},
    min: {type: Number},
    max: {type: Number},
    values: [
        {
            text: {type: String, required: true}
        }
    ],
    required: {type: Boolean, default: false},
    value: mongoose.Schema.Types.Mixed
});

var ServiceField = mongoose.model('ServiceField', ServiceFieldSchema);

module.exports.ServiceFieldTypeSchema = ServiceFieldTypeSchema;
module.exports.ServiceFieldSchema = ServiceFieldSchema;
module.exports.ServiceField = ServiceField;