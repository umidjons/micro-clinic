var mongoose = require('mongoose');
var stateSchema = require('./State').StateSchema;

var DiscountSchema = mongoose.Schema({
    type: {type: String, required: true, enum: ['percent', 'amount']},
    amount: {type: Number, required: true, min: 0, max: 1000000},
    note: {type: String, maxlength: 200},
    state: {type: stateSchema, required: true}
});

var Discount = mongoose.model('Discount', DiscountSchema);

module.exports.Discount = Discount;
module.exports.DiscountSchema = DiscountSchema;

/*
 Available state values:
 {_id: 'new', 'Новый'},
 {_id: 'payed', 'Оплачен'}
 */