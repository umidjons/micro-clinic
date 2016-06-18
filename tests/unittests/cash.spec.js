'use strict';

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var ISODate = Date;
var models = require('../../models');
var F = require('../../include/F');

describe('Cash', function () {
    describe('Cash.payAll()', function () {
        // fake user
        let user = {
            _id: 'myuser',
            branch: {
                _id: 'mybranch'
            }
        };

        let pendingPatients = [
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

        var sandbox;
        var time;

        beforeEach(function () {
            // create sandbox
            sandbox = sinon.sandbox.create();

            // stub Date
            // Note: 0-Jan, 5-Jun
            time = new Date(2016, 5, 18, 10, 20, 0); // 2016-06-18 10:20:00
            sandbox.useFakeTimers(time.getTime());
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

        it('cash payment', function (done) {
            let payInfo = {
                branch: "574de8d09870f8f81b77ed1c",
                patientId: "5764c7b41d9a46d00b8b6309",
                totalDebt: 41000,
                payType: {"_id": "cash", "title": "Наличные"},
                total: 41000,
                totalCash: 0,
                totalCashless: 0,
                totalCompany: 0,
                discount: {
                    type: "percent",
                    note: "",
                    amount: 0,
                    max: 100,
                    sum: 0,
                    sumCompany: 0
                },
                debt: 0,
                period: {start: "2016-06-18T04:13:51.080Z", end: "2016-06-18T04:13:51.080Z"}
            };

            // replace resulting callback
            let cb = function (err, payTime) {
                console.log('Final callback called');

                expect(err).to.be.null;
                expect(payTime).not.to.be.null;
                expect(payTime.toString()).to.equal(time.toString());

                done();
            };

            // replace models.Cash.savePays()
            let stubSavePays = sandbox.stub(models.Cash, 'savePays', function (patientServicesWithPays, cb) {
                //console.log('Cash.savePays() called');
                //F.inspect(patientServicesWithPays, 'patientServicesWithPays:');

                let srv1 = patientServicesWithPays[0];
                expect(srv1.priceTotal).to.equal(10000);
                expect(srv1.debt).to.equal(0);
                expect(srv1.payed).to.equal(10000);
                expect(srv1.pays).to.be.an('array').and.to.have.lengthOf(1);

                // check first pay
                let pay1 = srv1.pays[0];
                expect(pay1.amount).to.equal(10000);
                expect(pay1.payType._id).to.equal('cash');
                expect(pay1.created.toString()).to.equal(time.toString());
                expect(pay1.branch._id).to.equal('mybranch');
                expect(pay1.user).to.equal('myuser');
                expect(pay1.state._id).to.equal('payed');
                expect(pay1.percentOfPartner).to.equal(0);
                expect(pay1.interestOfPartner).to.equal(0);

                // after all pay, there shouldn't be any left money
                expect(payInfo.total).to.equal(0);
                cb(null, new Date());
            });

            // replace models.PatientService.pendingServicesOf() method
            let stubPendingServicesOf = sandbox.stub(models.PatientService, 'pendingServicesOf');

            // invokes 3rd argument as callback - cb(null, pendingPatients)
            stubPendingServicesOf.onCall(0).callsArgWith(2, null, pendingPatients);

            // spy models.Cash.payAll() method call
            let spyPayAll = sandbox.spy(models.Cash, 'payAll');

            // try to pay for all pending services
            models.Cash.payAll(user, payInfo, cb);

            expect(spyPayAll.called).to.be.true;
            expect(spyPayAll.getCall(0).args[0]).to.be.equal(user);
        });

    });
});


let originalPendingPatients = [
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
        "priceTotal": 16500,
        "company": {
            "user": ObjectId("57483e928e061688284ceffb"),
            "title": "Клевая организация",
            "shortTitle": "Клева",
            "address": "Ташкент",
            "phone": "1112233",
            "state": {
                "_id": "active",
                "title": "Активный"
            },
            "__v": 0,
            "_id": ObjectId("576229b9d11698941b998696"),
            "created": ISODate("2016-06-16T04:22:57.533Z"),
            "pays": [],
            "balance": -25000
        },
        "serviceId": ObjectId("5756cac051033cfc17bc06e8"),
        "branch": ObjectId("574de8d09870f8f81b77ed1c"),
        "patientId": ObjectId("5764c7b41d9a46d00b8b6309"),
        "debt": 16500,
        "created": ISODate("2016-06-18T04:03:17.866Z"),
        "result": {
            "fields": []
        },
        "fields": [],
        "overPriceTotal": 1500,
        "overPrice": 1500,
        "overPercent": 10,
        "discountPrice": 0,
        "pays": [],
        "payed": 0,
        "price": 15000
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
        "priceTotal": 22000,
        "company": {
            "user": ObjectId("57483e928e061688284ceffb"),
            "title": "Клевая организация",
            "shortTitle": "Клева",
            "address": "Ташкент",
            "phone": "1112233",
            "state": {
                "_id": "active",
                "title": "Активный"
            },
            "__v": 0,
            "_id": ObjectId("576229b9d11698941b998696"),
            "created": ISODate("2016-06-16T04:22:57.533Z"),
            "pays": [],
            "balance": -25000
        },
        "serviceId": ObjectId("5756ca9c51033cfc17bc06e2"),
        "branch": ObjectId("574de8d09870f8f81b77ed1c"),
        "patientId": ObjectId("5764c7b41d9a46d00b8b6309"),
        "debt": 22000,
        "created": ISODate("2016-06-18T04:03:17.866Z"),
        "result": {
            "fields": []
        },
        "fields": [],
        "overPriceTotal": 2000,
        "overPrice": 2000,
        "overPercent": 10,
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
        "priceTotal": 5500,
        "serviceId": ObjectId("5756ca4f51033cfc17bc06d6"),
        "branch": ObjectId("574de8d09870f8f81b77ed1c"),
        "patientId": ObjectId("5764c7b41d9a46d00b8b6309"),
        "debt": 5500,
        "created": ISODate("2016-06-18T04:03:17.866Z"),
        "result": {
            "fields": []
        },
        "fields": [],
        "overPriceTotal": 500,
        "overPrice": 500,
        "overPercent": 10,
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
        "priceTotal": 9900,
        "serviceId": ObjectId("5756cb4451033cfc17bc0706"),
        "branch": ObjectId("574de8d09870f8f81b77ed1c"),
        "patientId": ObjectId("5764c7b41d9a46d00b8b6309"),
        "debt": 9900,
        "created": ISODate("2016-06-18T04:03:17.866Z"),
        "result": {
            "fields": []
        },
        "fields": [],
        "overPriceTotal": 900,
        "overPrice": 900,
        "overPercent": 10,
        "discountPrice": 0,
        "pays": [],
        "payed": 0,
        "price": 9000
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
        "priceTotal": 2200,
        "serviceId": ObjectId("5756ca7751033cfc17bc06dc"),
        "branch": ObjectId("574de8d09870f8f81b77ed1c"),
        "patientId": ObjectId("5764c7b41d9a46d00b8b6309"),
        "debt": 2200,
        "created": ISODate("2016-06-18T04:03:17.866Z"),
        "result": {
            "fields": []
        },
        "fields": [],
        "overPriceTotal": 200,
        "overPrice": 200,
        "overPercent": 10,
        "discountPrice": 0,
        "pays": [],
        "payed": 0,
        "price": 2000
    }
];