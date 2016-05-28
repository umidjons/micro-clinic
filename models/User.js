var bcrypt = require('bcrypt-nodejs');
var mongoose = require('mongoose');
require('mongoose-type-email');
var stateSchema = require('./State').StateSchema;
var debug = require('debug')('myclinic:model:user');

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
    // Permission object, attributes are permission names, values are true/false, e.g.: {"user:create":true}
    permissions: {},
    created: {type: Date, required: true, default: new Date()},
    userId: {type: String, required: true, default: '1'} //todo: set real user id or user schema
});

UserSchema.pre('save', function (next) {
    var user = this;

    if (!user.isModified('password')) {
        debug('Password does not modified');
        return next();
    }

    debug('Password modified, new password is ' + user.password);

    bcrypt.genSalt(12, function (err, salt) {
        if (err) {
            return next(err);
        }

        bcrypt.hash(user.password, salt, null, function (err, hash) {
            if (err) {
                return next(err);
            }

            debug('New hash set.');

            user.password = hash;
            return next();
        });
    });
});

UserSchema.methods.comparePassword = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

UserSchema.virtual('fullName').get(function () {
    return (this.lastName + ' ' + this.firstName + ' ' + this.middleName).trim();
});

UserSchema.set('toJSON', {virtuals: true});
UserSchema.set('toObject', {virtuals: true});

UserSchema.statics.can = function (user, operation) {
    if (!operation) {
        debug('Invalid operation.');
        return false;
    }

    if (!user || Array.isArray(user.permissions)) {
        debug('User not found or no permissions available for that user yet.');
        return false;
    }

    debug('Checking permissions...');
    return !!user.permissions[operation];
};

var User = mongoose.model('User', UserSchema);

module.exports.User = User;
module.exports.UserSchema = UserSchema;