var mongoose = require('mongoose');
require('mongoose-type-email');
var stateSchema = require('./State').StateSchema;

var UserSchema = mongoose.Schema({
    username: {type: String, required: true, maxlength: 50},
    password: {type: String, required: true, maxlength: 100},
    firstName: {type: String, required: true, maxlength: 50},
    lastName: {type: String, required: true, maxlength: 50},
    middleName: {type: String, maxlength: 50},
    address: {type: String, maxlength: 500},
    cellPhone: {type: String, required: true, match: /^\d{5,12}$/},
    homePhone: {type: String, match: /^\d{5,12}$/},
    email: {type: mongoose.SchemaTypes.Email, maxlength: 50},
    state: stateSchema,
    permissions: [], // array of Permission._id-s
    created: {type: Date, required: true, default: new Date()},
    userId: {type: String, required: true, default: '1'} //todo: set real user id or user schema
});

UserSchema.virtual('fullName').get(function () {
    return (this.lastName + ' ' + this.firstName + ' ' + this.middleName).trim();
});

UserSchema.set('toJSON', {virtuals: true});
UserSchema.set('toObject', {virtuals: true});

UserSchema.statics.can = function (user, operation) {
    if (!operation) {
        return false;
    }

    if (!user || !Array.isArray(user.permissions) || user.permissions.length < 1) {
        return false;
    }

    return (user.permissions.indexOf(operation) !== -1);
};

var User = mongoose.model('User', UserSchema);

module.exports.User = User;
module.exports.UserSchema = UserSchema;