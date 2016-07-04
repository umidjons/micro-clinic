var mongoose = require('mongoose');

var ResidentSchema = mongoose.Schema({
    _id: String,
    title: String
});

ResidentSchema.index({_id: 1}, {unique: true});

var Resident = mongoose.model('Resident', ResidentSchema);

module.exports.ResidentSchema = ResidentSchema;
module.exports.Resident = Resident;

/*
 Available values:
 { _id: 'resident', title : 'Узбекистан' }
 { _id: 'other', title : 'Другое' }
 */
