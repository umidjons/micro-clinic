var mongoose = require('mongoose');
var stateSchema = require('./State').StateSchema;

var BranchSchema = mongoose.Schema({
    title: {type: String, required: true, maxlength: 100},
    address: {type: String, maxlength: 500},
    phone: {type: String, match: /^\d{5,12}$/},
    state: stateSchema,
    created: {type: Date, required: true, default: new Date()},
    user: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'}
});

var Branch = mongoose.model('Branch', BranchSchema);

module.exports.Branch = Branch;
module.exports.BranchSchema = BranchSchema;