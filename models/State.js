var mongoose = require('mongoose');

var StateSchema = mongoose.Schema({
    _id: String,
    title: String
});

StateSchema.index({_id: 1}, {unique: true});

var State = mongoose.model('State', StateSchema);

module.exports.StateSchema = StateSchema;
module.exports.State = State;