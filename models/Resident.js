var mongoose = require('mongoose');

var ResidentSchema = mongoose.Schema({
    _id: String,
    title: String
});

var Resident = mongoose.model('Resident', ResidentSchema);

module.exports.ResidentSchema = ResidentSchema;
module.exports.Resident = Resident;