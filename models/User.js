'use strict';

var bcrypt = require('bcrypt-nodejs');
var mongoose = require('mongoose');
require('mongoose-type-email');
var stateSchema = require('./State').StateSchema;
var branchSchema = require('./Branch').BranchSchema;
var debug = require('debug')('myclinic:model:user');
var F = require('../include/F');

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
    branch: {type: branchSchema},
    created: {type: Date, required: true, default: new Date()},
    user: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'}
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
    var password = this.password;
    var enteredPassword = candidatePassword + '';

    debug(F.inspect(enteredPassword, 'Candidate Password:', true));
    debug(F.inspect(password, 'User Password from DB:', true));

    bcrypt.compare(enteredPassword, password, function (err, isMatch) {
        debug(F.inspect(err, 'Err:', true));
        debug(F.inspect(isMatch, 'isMatch:', true));

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

UserSchema.statics.sortPermissions = function (userJson) {
    debug('sortPermissions()');
    if (userJson.permissions) {
        // sort permissions
        let perms = {};
        Object.keys(userJson.permissions)
            .sort()
            .forEach(function (permName) {
                perms[permName] = userJson.permissions[permName];
            });
        userJson.permissions = perms;
    }

    return userJson;
};

var User = mongoose.model('User', UserSchema);

module.exports.User = User;
module.exports.UserSchema = UserSchema;