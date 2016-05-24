'use strict';

var mongoose = require('mongoose');
require('mongoose-type-email');
var sexSchema = require('./Sex').SexSchema;
var residentSchema = require('./Resident').ResidentSchema;
var async = require('async');
var PatientService = require('./PatientService').PatientService;

var PatientSchema = mongoose.Schema({
    firstName: {type: String, required: true, maxlength: 50},
    lastName: {type: String, required: true, maxlength: 50},
    middleName: {type: String, maxlength: 50},
    dateOfBirth: {type: Date, required: true},
    sex: sexSchema,
    resident: residentSchema,
    passport: {type: String, match: /^[A-Za-z]{2}\s\d{7}$/},
    address: {type: String, required: true, maxlength: 500},
    cellPhone: {type: String, required: true, match: /^\d{5,12}$/},
    homePhone: {type: String, match: /^\d{5,12}$/},
    email: {type: mongoose.SchemaTypes.Email, maxlength: 50},
    workplace: {type: String, maxlength: 200},
    company: {type: String, maxlength: 200},
    lastVisit: {type: Date, required: true},
    created: {type: Date, required: true},
    userId: {type: String, required: true, default: '1'} //todo: set real user id or user schema
});

PatientSchema.index({lastName: 1, firstName: 1, middleName: 1, dateOfBirth: 1}, {unique: true});

PatientSchema.statics.fillAdditions = function (patients, cb) {
    async.each(
        patients,
        function (pat, done) {
            pat.debt = 0;
            pat.lastVisit = null;

            PatientService.find({patientId: pat._id}, function (err, services) {
                if (err) {
                    done(err);
                }
                for (let ps of services) {
                    // calculate debt
                    pat.debt += ps.debt;

                    // set last visit date & time
                    if (ps.created > pat.lastVisit) {
                        pat.lastVisit = ps.created;
                    }
                }
                done();
            });
        },
        function (err) {
            if (err) {
                return cb(err);
            }
            cb(null, patients);
        }
    );
};

PatientSchema.statics.setLastVisit = function (patientId, visitDateTime, cb) {
    Patient.update({_id: patientId}, {$set: {lastVisit: visitDateTime}}, function (err, raw) {
        cb(err, raw);
    });
};

var Patient = mongoose.model('Patient', PatientSchema);

module.exports = Patient;