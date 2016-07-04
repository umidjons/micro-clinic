var mongoose = require('mongoose');

var SexSchema = mongoose.Schema({
    _id: String,
    title: String
});

SexSchema.index({_id: 1}, {unique: true});

var Sex = mongoose.model('Sex', SexSchema);

module.exports.SexSchema = SexSchema;
module.exports.Sex = Sex;