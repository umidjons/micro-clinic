var mongoose = require('mongoose');

var StateSchema = mongoose.Schema({
    _id: String,
    title: String
});

var State = mongoose.model('State', StateSchema);

module.exports.StateSchema = StateSchema;
module.exports.State = State;