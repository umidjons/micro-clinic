var mongoose = require('mongoose');

var DiscountReasonSchema = mongoose.Schema({
    text: {type: String, maxlength: 300}
});

var DiscountReason = mongoose.model('DiscountReason', DiscountReasonSchema);

module.exports.DiscountReason = DiscountReason;
module.exports.DiscountReasonSchema = DiscountReasonSchema;
