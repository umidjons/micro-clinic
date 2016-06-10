'use strict';

var mongoose = require('mongoose');
require('mongoose-type-email');
var stateSchema = require('./State').StateSchema;
var models = require('.');
var sugar = require('sugar');

var PartnerSchema = mongoose.Schema({
    code: {type: String, required: true, maxlength: 50},
    percent: {type: Number, required: true, min: 0, max: 100},
    firstName: {type: String, required: true, maxlength: 50},
    lastName: {type: String, required: true, maxlength: 50},
    middleName: {type: String, maxlength: 50},
    address: {type: String, required: true, maxlength: 500},
    cellPhone: {type: String, required: true, match: /^\d{5,12}$/},
    homePhone: {type: String, match: /^\d{5,12}$/},
    email: {type: mongoose.SchemaTypes.Email, maxlength: 50},
    company: {type: String, maxlength: 200},
    state: stateSchema,
    created: {type: Date, required: true, default: new Date()},
    user: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'}
});

PartnerSchema.index({code: 1}, {unique: true});

PartnerSchema.virtual('fullName').get(function () {
    return (this.lastName + ' ' + this.firstName + ' ' + this.middleName).trim();
});

/**
 * Increments partner code in application settings.
 * @param {callback} cb callback function with error and new code arguments.
 */
PartnerSchema.statics.incCode = function (cb) {
    models.Setting.findById('partnerCode', function (err, setting) {
        if (err) {
            return cb(err);
        }
        let len = setting.value.length;
        let currentValue = 1 * setting.value; // current value as number
        let newValue = (++currentValue).pad(len);
        setting.value = newValue;
        setting.save(function (err) {
            if (err) {
                return cb(err);
            }
            cb(null, newValue);
        });
    });
};

PartnerSchema.set('toJSON', {virtuals: true});
PartnerSchema.set('toObject', {virtuals: true});

var Partner = mongoose.model('Partner', PartnerSchema);

module.exports.Partner = Partner;
module.exports.PartnerSchema = PartnerSchema;