'use strict';

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var ISODate = Date;
var models = require('../../models');
var F = require('../../include/F');

describe('Laboratory', function () {
    describe('PatientService.laboratory()', function () {
        // fake user
        let user = {
            _id: 'myuser',
            branch: {
                _id: 'mybranch'
            }
        };

        let pendingPatients;

        var sandbox;
        var time;

        beforeEach(function () {
            // create sandbox
            sandbox = sinon.sandbox.create();

            // stub Date
            // Note: 0-Jan, 5-Jun
            time = new Date(2016, 5, 18, 10, 20, 0); // 2016-06-18 10:20:00
            sandbox.useFakeTimers(time.getTime());

            pendingPatients = [
                /* 1 */
                {
                    "_id": ObjectId("5764c8051d9a46d00b8b6312"),
                    "user": ObjectId("57483e928e061688284ceffb"),
                    "category": {
                        "_id": "ginekolog",
                        "title": "Гинеколог",
                        "shortTitle": "гинек.",
                        "state": {
                            "title": "Активный",
                            "_id": "active"
                        },
                        "user": ObjectId("57483e928e061688284ceffb"),
                        "created": ISODate("2016-05-08T02:17:17.445Z"),
                        "subcategories": []
                    },
                    "title": "Осмотр пациента в динамике",
                    "shortTitle": "осмотр в динамике",
                    "state": {
                        "_id": "new",
                        "title": "Новый"
                    },
                    "__v": 0,
                    "quantity": 1,
                    "priceTotal": 10000,
                    "company": null,
                    "serviceId": ObjectId("5756cac051033cfc17bc06e8"),
                    "branch": ObjectId("574de8d09870f8f81b77ed1c"),
                    "patientId": ObjectId("5764c7b41d9a46d00b8b6309"),
                    "debt": 10000,
                    "created": ISODate("2016-06-18T04:03:17.866Z"),
                    "result": {
                        "fields": []
                    },
                    "fields": [],
                    "overPriceTotal": 0,
                    "overPrice": 0,
                    "overPercent": 0,
                    "discountPrice": 0,
                    "pays": [],
                    "payed": 0,
                    "price": 10000
                },
                /* 2 */
                {
                    "_id": ObjectId("5764c8051d9a46d00b8b6314"),
                    "user": ObjectId("57483e928e061688284ceffb"),
                    "category": {
                        "_id": "ginekolog",
                        "title": "Гинеколог",
                        "shortTitle": "гинек.",
                        "state": {
                            "title": "Активный",
                            "_id": "active"
                        },
                        "user": ObjectId("57483e928e061688284ceffb"),
                        "created": ISODate("2016-05-08T02:17:17.445Z"),
                        "subcategories": []
                    },
                    "title": "Первичный осмотр и консультация",
                    "shortTitle": "перв.осмотр и консул",
                    "state": {
                        "_id": "new",
                        "title": "Новый"
                    },
                    "__v": 0,
                    "quantity": 1,
                    "priceTotal": 20000,
                    "company": null,
                    "serviceId": ObjectId("5756ca9c51033cfc17bc06e2"),
                    "branch": ObjectId("574de8d09870f8f81b77ed1c"),
                    "patientId": ObjectId("5764c7b41d9a46d00b8b6309"),
                    "debt": 20000,
                    "created": ISODate("2016-06-18T04:03:17.866Z"),
                    "result": {
                        "fields": []
                    },
                    "fields": [],
                    "overPriceTotal": 0,
                    "overPrice": 0,
                    "overPercent": 0,
                    "discountPrice": 0,
                    "pays": [],
                    "payed": 0,
                    "price": 20000
                },

                /* 3 */
                {
                    "_id": ObjectId("5764c8051d9a46d00b8b6316"),
                    "user": ObjectId("57483e928e061688284ceffb"),
                    "category": {
                        "_id": "ginekolog",
                        "title": "Гинеколог",
                        "shortTitle": "гинек.",
                        "state": {
                            "title": "Активный",
                            "_id": "active"
                        },
                        "user": ObjectId("57483e928e061688284ceffb"),
                        "created": ISODate("2016-05-08T02:17:17.445Z"),
                        "subcategories": []
                    },
                    "title": "Консультация без осмотра",
                    "shortTitle": "Консуль. без осмотра",
                    "state": {
                        "_id": "new",
                        "title": "Новый"
                    },
                    "__v": 0,
                    "quantity": 1,
                    "priceTotal": 5000,
                    "serviceId": ObjectId("5756ca4f51033cfc17bc06d6"),
                    "branch": ObjectId("574de8d09870f8f81b77ed1c"),
                    "patientId": ObjectId("5764c7b41d9a46d00b8b6309"),
                    "debt": 5000,
                    "created": ISODate("2016-06-18T04:03:17.866Z"),
                    "result": {
                        "fields": []
                    },
                    "fields": [],
                    "overPriceTotal": 0,
                    "overPrice": 0,
                    "overPercent": 0,
                    "discountPrice": 0,
                    "pays": [],
                    "payed": 0,
                    "price": 5000
                },

                /* 4 */
                {
                    "_id": ObjectId("5764c8051d9a46d00b8b6317"),
                    "user": ObjectId("57483e928e061688284ceffb"),
                    "category": {
                        "_id": "ginekolog",
                        "title": "Гинеколог",
                        "shortTitle": "гинек.",
                        "state": {
                            "title": "Активный",
                            "_id": "active"
                        },
                        "user": ObjectId("57483e928e061688284ceffb"),
                        "created": ISODate("2016-05-08T02:17:17.445Z"),
                        "subcategories": []
                    },
                    "title": "Прижигание (химическое) эрозии",
                    "shortTitle": "приж.(хим.) эроз",
                    "state": {
                        "_id": "new",
                        "title": "Новый"
                    },
                    "__v": 0,
                    "quantity": 1,
                    "priceTotal": 5000,
                    "serviceId": ObjectId("5756cb4451033cfc17bc0706"),
                    "branch": ObjectId("574de8d09870f8f81b77ed1c"),
                    "patientId": ObjectId("5764c7b41d9a46d00b8b6309"),
                    "debt": 5000,
                    "created": ISODate("2016-06-18T04:03:17.866Z"),
                    "result": {
                        "fields": []
                    },
                    "fields": [],
                    "overPriceTotal": 0,
                    "overPrice": 0,
                    "overPercent": 0,
                    "discountPrice": 0,
                    "pays": [],
                    "payed": 0,
                    "price": 5000
                },

                /* 5 */
                {
                    "_id": ObjectId("5764c8051d9a46d00b8b6318"),
                    "user": ObjectId("57483e928e061688284ceffb"),
                    "category": {
                        "_id": "ginekolog",
                        "title": "Гинеколог",
                        "shortTitle": "гинек.",
                        "state": {
                            "title": "Активный",
                            "_id": "active"
                        },
                        "user": ObjectId("57483e928e061688284ceffb"),
                        "created": ISODate("2016-05-08T02:17:17.445Z"),
                        "subcategories": []
                    },
                    "title": "Эстриол (свечи)",
                    "shortTitle": "Эстриол (свечи)",
                    "state": {
                        "_id": "new",
                        "title": "Новый"
                    },
                    "__v": 0,
                    "quantity": 1,
                    "priceTotal": 1000,
                    "serviceId": ObjectId("5756ca7751033cfc17bc06dc"),
                    "branch": ObjectId("574de8d09870f8f81b77ed1c"),
                    "patientId": ObjectId("5764c7b41d9a46d00b8b6309"),
                    "debt": 1000,
                    "created": ISODate("2016-06-18T04:03:17.866Z"),
                    "result": {
                        "fields": []
                    },
                    "fields": [],
                    "overPriceTotal": 0,
                    "overPrice": 0,
                    "overPercent": 0,
                    "discountPrice": 0,
                    "pays": [],
                    "payed": 0,
                    "price": 1000
                }
            ];
        });

        afterEach(function () {
            sandbox.restore();
        });

        after(function (done) {
            // necessary to prevent model already compiled errors
            mongoose.models = {};
            mongoose.modelSchemas = {};
            mongoose.connection.close();
            done();
        });

        it('cash payment with enough money', function (done) {
            
        });

    });
});