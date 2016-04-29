var mongoose = require('mongoose');
var stateSchema = require('./State').StateSchema;

var PayTypeSchema = mongoose.Schema({
    _id: {type: String, required: true},
    title: {type: String, required: true}
});

var CashSchema = mongoose.Schema({
    patientServiceId: {type: mongoose.Schema.Types.ObjectId, required: true},
    payType: PayTypeSchema,
    amount: {type: Number, min: 0, required: true},
    state: stateSchema,
    created: {type: Date, required: true, default: new Date()},
    userId: {type: String, required: true, default: '1'} //todo: set real user id or user schema
});

var Cash = mongoose.model('Cash', CashSchema);

module.exports.PayTypeSchema = PayTypeSchema;
module.exports.CashSchema = CashSchema;
module.exports.Cash = Cash;