var mongoose = require('mongoose');

var DiscountSchema = mongoose.Schema({
    amount: {type: Number, required: true, min: 0, max: 100},
    note: {type: String, maxlength: 200}
});

var Discount = mongoose.model('Discount', DiscountSchema);

module.exports.Discount = Discount;
module.exports.DiscountSchema = DiscountSchema;