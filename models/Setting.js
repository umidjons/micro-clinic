'use strict';

var mongoose = require('mongoose');
var async = require('async');
var debug = require('debug')('myclinic:model:setting');
var F = require('../include/F');
var models = require('.');

var SettingSchema = mongoose.Schema({
    _id: {type: String, required: true},
    title: {type: String},
    value: {},
    comment: {type: String},
    order: {type: Number, default: 0}
});

SettingSchema.index({_id: 1}, {unique: true});

/**
 * Converts settings object into setting models and saves all models.
 * @param {object} settingsObject settings object, keys are model's id, values are model's value.
 * @param {function} cb callback function with one parameter - error.
 */
SettingSchema.statics.saveFromObject = function (settingsObject, cb) {
    let settingList = [];

    // convert setting object into setting models
    for (let id in settingsObject) {
        settingList.push({
            _id: id,
            value: settingsObject[id]
        });
    }

    // save all settings
    async.each(
        settingList, // array of settings
        function (setting, done) {
            models.Setting.findById(setting._id, function (err, doc) {
                doc.value = setting.value;
                doc.save(function (err) {
                    if (err) {
                        return done(err);
                    }
                    done();
                });
            });
        },
        function (err) {
            if (err) {
                // One of the patient service has error, stop all processing
                debug(F.inspect(err, 'Err:', true));
                return cb(err);
            } else {
                // all patient services successfully saved
                return cb();
            }
        }
    );
};

var Setting = mongoose.model('Setting', SettingSchema);

module.exports.SettingSchema = SettingSchema;
module.exports.Setting = Setting;