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
                //console.log('Final callback called');

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
                expect(srv1.state._id).to.equal('payed');
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

        it('cashless payment with enough money', function (done) {
            let payInfo = {
                branch: "574de8d09870f8f81b77ed1c",
                patientId: "5764c7b41d9a46d00b8b6309",
                totalDebt: 41000,
                payType: {"_id": "cashless", "title": "Безналичные"},
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
                //console.log('Final callback called');

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
                expect(srv1.state._id).to.equal('payed');
                expect(srv1.pays).to.be.an('array').and.to.have.lengthOf(1);

                // check first pay
                let pay1 = srv1.pays[0];
                expect(pay1.amount).to.equal(10000);
                expect(pay1.payType._id).to.equal('cashless');
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

        it('cashless payment with not enough money. Only first service covered.', function (done) {
            let payInfo = {
                branch: "574de8d09870f8f81b77ed1c",
                patientId: "5764c7b41d9a46d00b8b6309",
                totalDebt: 41000,
                payType: {"_id": "cashless", "title": "Безналичные"},
                total: 9000,
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
                //console.log('Final callback called');

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
                expect(srv1.debt).to.equal(1000);
                expect(srv1.payed).to.equal(9000);
                expect(srv1.state._id).to.equal('partlyPayed');
                expect(srv1.pays).to.be.an('array').and.to.have.lengthOf(1);

                // check first pay
                let pay1 = srv1.pays[0];
                expect(pay1.amount).to.equal(9000);
                expect(pay1.payType._id).to.equal('cashless');
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

        it('cashless payment with not enough money. First covered, but second partly payed.', function (done) {
            let payInfo = {
                branch: "574de8d09870f8f81b77ed1c",
                patientId: "5764c7b41d9a46d00b8b6309",
                totalDebt: 41000,
                payType: {"_id": "cashless", "title": "Безналичные"},
                total: 12000,
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
                //console.log('Final callback called');

                expect(err).to.be.null;
                expect(payTime).not.to.be.null;
                expect(payTime.toString()).to.equal(time.toString());

                done();
            };

            // replace models.Cash.savePays()
            let stubSavePays = sandbox.stub(models.Cash, 'savePays', function (patientServicesWithPays, cb) {
                //console.log('Cash.savePays() called');
                //F.inspect(patientServicesWithPays, 'patientServicesWithPays:');

                // first service
                let srv1 = patientServicesWithPays[0];
                expect(srv1.priceTotal).to.equal(10000);
                expect(srv1.debt).to.equal(0);
                expect(srv1.payed).to.equal(10000);
                expect(srv1.state._id).to.equal('payed');
                expect(srv1.pays).to.be.an('array').and.to.have.lengthOf(1);

                // check first pay
                let pay1 = srv1.pays[0];
                expect(pay1.amount).to.equal(10000);
                expect(pay1.payType._id).to.equal('cashless');
                expect(pay1.created.toString()).to.equal(time.toString());
                expect(pay1.branch._id).to.equal('mybranch');
                expect(pay1.user).to.equal('myuser');
                expect(pay1.state._id).to.equal('payed');
                expect(pay1.percentOfPartner).to.equal(0);
                expect(pay1.interestOfPartner).to.equal(0);

                // second service
                let srv2 = patientServicesWithPays[1];
                expect(srv2.priceTotal).to.equal(20000);
                expect(srv2.debt).to.equal(18000);
                expect(srv2.payed).to.equal(2000);
                expect(srv2.state._id).to.equal('partlyPayed');
                expect(srv2.pays).to.be.an('array').and.to.have.lengthOf(1);

                // check first pay of the second service
                let pay2 = srv2.pays[0];
                expect(pay2.amount).to.equal(2000);
                expect(pay2.payType._id).to.equal('cashless');
                expect(pay2.created.toString()).to.equal(time.toString());
                expect(pay2.branch._id).to.equal('mybranch');
                expect(pay2.user).to.equal('myuser');
                expect(pay2.state._id).to.equal('payed');
                expect(pay2.percentOfPartner).to.equal(0);
                expect(pay2.interestOfPartner).to.equal(0);

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

        it('cash payment with discount and enough money', function (done) {
            let payInfo = {
                branch: "574de8d09870f8f81b77ed1c",
                patientId: "5764c7b41d9a46d00b8b6309",
                totalDebt: 41000,
                payType: {"_id": "cash", "title": "Наличные"},
                total: 36900, // total is without discount, so 41000 - 4100 = 36900
                totalCash: 0,
                totalCashless: 0,
                totalCompany: 0,
                discount: {
                    type: "percent",
                    note: "this is discount note",
                    amount: 10,
                    max: 100,
                    sum: 4100,
                    sumCompany: 0
                },
                debt: 0,
                period: {start: "2016-06-18T04:13:51.080Z", end: "2016-06-18T04:13:51.080Z"}
            };

            // replace resulting callback
            let cb = function (err, payTime) {
                //console.log('Final callback called');

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
                expect(srv1.priceTotal).to.equal(5900);
                expect(srv1.debt).to.equal(0);
                expect(srv1.payed).to.equal(10000);
                expect(srv1.state._id).to.equal('payed');
                expect(srv1.pays).to.be.an('array').and.to.have.lengthOf(2);

                // check first pay - discount type
                let pay1 = srv1.pays[0];
                //F.inspect(pay1, 'First discount pay:');
                expect(pay1.amount).to.equal(4100);
                expect(pay1.payType._id).to.equal('discount');
                expect(pay1.created.toString()).to.equal(time.toString());
                expect(pay1.branch._id).to.equal('mybranch');
                expect(pay1.user).to.equal('myuser');
                expect(pay1.state._id).to.equal('payed');
                expect(pay1.percentOfPartner).to.equal(0);
                expect(pay1.interestOfPartner).to.equal(0);
                // check discount object
                expect(pay1).to.have.deep.property('discount.type', 'percent');
                expect(pay1).to.have.deep.property('discount.note', 'this is discount note');
                expect(pay1).to.have.deep.property('discount.state._id', 'payed');
                expect(pay1).to.have.deep.property('discount.amount', 10);
                expect(pay1).to.have.deep.property('discount.sum', 4100);

                // second pay is cash payment
                let pay2 = srv1.pays[1];
                expect(pay2.amount).to.equal(5900);
                expect(pay2.payType._id).to.equal('cash');
                expect(pay2.created.toString()).to.equal(time.toString());
                expect(pay2.branch._id).to.equal('mybranch');
                expect(pay2.user).to.equal('myuser');
                expect(pay2.state._id).to.equal('payed');
                expect(pay2.percentOfPartner).to.equal(0);
                expect(pay2.interestOfPartner).to.equal(0);

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

        it('cash payment with discount and not enough money', function (done) {
            let payInfo = {
                branch: "574de8d09870f8f81b77ed1c",
                patientId: "5764c7b41d9a46d00b8b6309",
                totalDebt: 41000,
                payType: {"_id": "cash", "title": "Наличные"},
                total: 36000, // total is without discount, so 40000 - 4000 = 36000
                totalCash: 0,
                totalCashless: 0,
                totalCompany: 0,
                discount: {
                    type: "amount",
                    note: "this is discount note",
                    amount: 4000,
                    max: 100,
                    sum: 4000,
                    sumCompany: 0
                },
                debt: 0,
                period: {start: "2016-06-18T04:13:51.080Z", end: "2016-06-18T04:13:51.080Z"}
            };

            // replace resulting callback
            let cb = function (err, payTime) {
                //console.log('Final callback called');

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
                expect(srv1.priceTotal).to.equal(6000);
                expect(srv1.debt).to.equal(0);
                expect(srv1.payed).to.equal(10000);
                expect(srv1.state._id).to.equal('payed');
                expect(srv1.pays).to.be.an('array').and.to.have.lengthOf(2);

                // check first pay - discount type
                let pay1 = srv1.pays[0];
                //F.inspect(pay1, 'First discount pay:');
                expect(pay1.amount).to.equal(4000);
                expect(pay1.payType._id).to.equal('discount');
                expect(pay1.created.toString()).to.equal(time.toString());
                expect(pay1.branch._id).to.equal('mybranch');
                expect(pay1.user).to.equal('myuser');
                expect(pay1.state._id).to.equal('payed');
                expect(pay1.percentOfPartner).to.equal(0);
                expect(pay1.interestOfPartner).to.equal(0);
                // check discount object
                expect(pay1).to.have.deep.property('discount.type', 'amount');
                expect(pay1).to.have.deep.property('discount.note', 'this is discount note');
                expect(pay1).to.have.deep.property('discount.state._id', 'payed');
                expect(pay1).to.have.deep.property('discount.amount', 4000);
                expect(pay1).to.have.deep.property('discount.sum', 4000);

                // second pay is cash payment
                let pay2 = srv1.pays[1];
                expect(pay2.amount).to.equal(6000);
                expect(pay2.payType._id).to.equal('cash');
                expect(pay2.created.toString()).to.equal(time.toString());
                expect(pay2.branch._id).to.equal('mybranch');
                expect(pay2.user).to.equal('myuser');
                expect(pay2.state._id).to.equal('payed');
                expect(pay2.percentOfPartner).to.equal(0);
                expect(pay2.interestOfPartner).to.equal(0);

                // there is no money for the last service
                let srv5 = pendingPatients[4];
                expect(srv5.priceTotal).to.equal(1000);
                expect(srv5.debt).to.equal(1000);
                expect(srv5.payed).to.equal(0);
                expect(srv5.state._id).to.equal('new');
                expect(srv5.pays).to.be.an('array').and.to.have.lengthOf(0);

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

        it('separate payment with enough money', function (done) {
            let payInfo = {
                branch: "574de8d09870f8f81b77ed1c",
                patientId: "5764c7b41d9a46d00b8b6309",
                totalDebt: 41000,
                payType: {"_id": "separated", "title": "Наличный/Безналичный"},
                total: 41000,
                totalCash: 15000,
                totalCashless: 26000,
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
                //console.log('Final callback called');

                expect(err).to.be.null;
                expect(payTime).not.to.be.null;
                expect(payTime.toString()).to.equal(time.toString());

                done();
            };

            // replace models.Cash.savePays()
            let stubSavePays = sandbox.stub(models.Cash, 'savePays', function (patientServicesWithPays, cb) {
                //console.log('Cash.savePays() called');
                //F.inspect(patientServicesWithPays.length, 'patientServicesWithPays:');

                // 1) 26000 cashless is enough for the first service
                let srv1 = patientServicesWithPays[0];
                expect(srv1.priceTotal).to.equal(10000);
                expect(srv1.debt).to.equal(0);
                expect(srv1.payed).to.equal(10000);
                expect(srv1.state._id).to.equal('payed');
                expect(srv1.pays).to.be.an('array').and.to.have.lengthOf(1);

                // check pay
                let pay1 = srv1.pays[0];
                expect(pay1.amount).to.equal(10000);
                expect(pay1.payType._id).to.equal('cashless');
                expect(pay1.created.toString()).to.equal(time.toString());
                expect(pay1.branch._id).to.equal('mybranch');
                expect(pay1.user).to.equal('myuser');
                expect(pay1.state._id).to.equal('payed');
                expect(pay1.percentOfPartner).to.equal(0);
                expect(pay1.interestOfPartner).to.equal(0);

                // 2) there should be 2 pays, first 16000 cashless, second 4000 cash
                let srv2 = patientServicesWithPays[1];
                expect(srv2.priceTotal).to.equal(20000);
                expect(srv2.debt).to.equal(0);
                expect(srv2.payed).to.equal(20000);
                expect(srv2.state._id).to.equal('payed');
                expect(srv2.pays).to.be.an('array').and.to.have.lengthOf(2);

                // check 1st pay 16000 cashless
                let pay21 = srv2.pays[0];
                expect(pay21.amount).to.equal(16000);
                expect(pay21.payType._id).to.equal('cashless');
                expect(pay21.created.toString()).to.equal(time.toString());
                expect(pay21.branch._id).to.equal('mybranch');
                expect(pay21.user).to.equal('myuser');
                expect(pay21.state._id).to.equal('payed');
                expect(pay21.percentOfPartner).to.equal(0);
                expect(pay21.interestOfPartner).to.equal(0);

                // check 2nd pay 4000 cash
                let pay22 = srv2.pays[1];
                expect(pay22.amount).to.equal(4000);
                expect(pay22.payType._id).to.equal('cash');
                expect(pay22.created.toString()).to.equal(time.toString());
                expect(pay22.branch._id).to.equal('mybranch');
                expect(pay22.user).to.equal('myuser');
                expect(pay22.state._id).to.equal('payed');
                expect(pay22.percentOfPartner).to.equal(0);
                expect(pay22.interestOfPartner).to.equal(0);

                // 3) there should be a pay with 5000 cash
                let srv3 = patientServicesWithPays[2];
                expect(srv3.priceTotal).to.equal(5000);
                expect(srv3.debt).to.equal(0);
                expect(srv3.payed).to.equal(5000);
                expect(srv3.state._id).to.equal('payed');
                expect(srv3.pays).to.be.an('array').and.to.have.lengthOf(1);

                // check 1st pay
                let pay31 = srv3.pays[0];
                expect(pay31.amount).to.equal(5000);
                expect(pay31.payType._id).to.equal('cash');
                expect(pay31.created.toString()).to.equal(time.toString());
                expect(pay31.branch._id).to.equal('mybranch');
                expect(pay31.user).to.equal('myuser');
                expect(pay31.state._id).to.equal('payed');
                expect(pay31.percentOfPartner).to.equal(0);
                expect(pay31.interestOfPartner).to.equal(0);

                // 4) there should be a pay with 5000 cash
                let srv4 = patientServicesWithPays[3];
                expect(srv4.priceTotal).to.equal(5000);
                expect(srv4.debt).to.equal(0);
                expect(srv4.payed).to.equal(5000);
                expect(srv4.state._id).to.equal('payed');
                expect(srv4.pays).to.be.an('array').and.to.have.lengthOf(1);

                // check 1st pay
                let pay41 = srv4.pays[0];
                expect(pay41.amount).to.equal(5000);
                expect(pay41.payType._id).to.equal('cash');
                expect(pay41.created.toString()).to.equal(time.toString());
                expect(pay41.branch._id).to.equal('mybranch');
                expect(pay41.user).to.equal('myuser');
                expect(pay41.state._id).to.equal('payed');
                expect(pay41.percentOfPartner).to.equal(0);
                expect(pay41.interestOfPartner).to.equal(0);

                // 5) there should be a pay with 1000 cash
                let srv5 = patientServicesWithPays[4];
                expect(srv5.priceTotal).to.equal(1000);
                expect(srv5.debt).to.equal(0);
                expect(srv5.payed).to.equal(1000);
                expect(srv5.state._id).to.equal('payed');
                expect(srv5.pays).to.be.an('array').and.to.have.lengthOf(1);

                // check 1st pay
                let pay51 = srv5.pays[0];
                expect(pay51.amount).to.equal(1000);
                expect(pay51.payType._id).to.equal('cash');
                expect(pay51.created.toString()).to.equal(time.toString());
                expect(pay51.branch._id).to.equal('mybranch');
                expect(pay51.user).to.equal('myuser');
                expect(pay51.state._id).to.equal('payed');
                expect(pay51.percentOfPartner).to.equal(0);
                expect(pay51.interestOfPartner).to.equal(0);

                // after all pay, there shouldn't be any left money
                expect(payInfo.total).to.equal(0);
                expect(payInfo.totalCash).to.equal(0);
                expect(payInfo.totalCashless).to.equal(0);
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

        it('separate payment with not enough money', function (done) {
            let payInfo = {
                branch: "574de8d09870f8f81b77ed1c",
                patientId: "5764c7b41d9a46d00b8b6309",
                totalDebt: 41000,
                payType: {"_id": "separated", "title": "Наличный/Безналичный"},
                total: 37000,
                totalCash: 13000,
                totalCashless: 24000,
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
                //console.log('Final callback called');

                expect(err).to.be.null;
                expect(payTime).not.to.be.null;
                expect(payTime.toString()).to.equal(time.toString());

                done();
            };

            // replace models.Cash.savePays()
            let stubSavePays = sandbox.stub(models.Cash, 'savePays', function (patientServicesWithPays, cb) {
                //console.log('Cash.savePays() called');
                //F.inspect(patientServicesWithPays.length, 'patientServicesWithPays:');

                // 1) 24000 cashless is enough for the first service
                let srv1 = patientServicesWithPays[0];
                expect(srv1.priceTotal).to.equal(10000);
                expect(srv1.debt).to.equal(0);
                expect(srv1.payed).to.equal(10000);
                expect(srv1.state._id).to.equal('payed');
                expect(srv1.pays).to.be.an('array').and.to.have.lengthOf(1);

                // check pay
                let pay1 = srv1.pays[0];
                expect(pay1.amount).to.equal(10000);
                expect(pay1.payType._id).to.equal('cashless');
                expect(pay1.created.toString()).to.equal(time.toString());
                expect(pay1.branch._id).to.equal('mybranch');
                expect(pay1.user).to.equal('myuser');
                expect(pay1.state._id).to.equal('payed');
                expect(pay1.percentOfPartner).to.equal(0);
                expect(pay1.interestOfPartner).to.equal(0);

                // 2) there should be 2 pays, first 14000 cashless, second 6000 cash
                let srv2 = patientServicesWithPays[1];
                expect(srv2.priceTotal).to.equal(20000);
                expect(srv2.debt).to.equal(0);
                expect(srv2.payed).to.equal(20000);
                expect(srv2.state._id).to.equal('payed');
                expect(srv2.pays).to.be.an('array').and.to.have.lengthOf(2);

                // check 1st pay 14000 cashless
                let pay21 = srv2.pays[0];
                expect(pay21.amount).to.equal(14000);
                expect(pay21.payType._id).to.equal('cashless');
                expect(pay21.created.toString()).to.equal(time.toString());
                expect(pay21.branch._id).to.equal('mybranch');
                expect(pay21.user).to.equal('myuser');
                expect(pay21.state._id).to.equal('payed');
                expect(pay21.percentOfPartner).to.equal(0);
                expect(pay21.interestOfPartner).to.equal(0);

                // check 2nd pay 6000 cash
                let pay22 = srv2.pays[1];
                expect(pay22.amount).to.equal(6000);
                expect(pay22.payType._id).to.equal('cash');
                expect(pay22.created.toString()).to.equal(time.toString());
                expect(pay22.branch._id).to.equal('mybranch');
                expect(pay22.user).to.equal('myuser');
                expect(pay22.state._id).to.equal('payed');
                expect(pay22.percentOfPartner).to.equal(0);
                expect(pay22.interestOfPartner).to.equal(0);

                // 3) there should be a pay with 5000 cash
                let srv3 = patientServicesWithPays[2];
                expect(srv3.priceTotal).to.equal(5000);
                expect(srv3.debt).to.equal(0);
                expect(srv3.payed).to.equal(5000);
                expect(srv3.state._id).to.equal('payed');
                expect(srv3.pays).to.be.an('array').and.to.have.lengthOf(1);

                // check 1st pay
                let pay31 = srv3.pays[0];
                expect(pay31.amount).to.equal(5000);
                expect(pay31.payType._id).to.equal('cash');
                expect(pay31.created.toString()).to.equal(time.toString());
                expect(pay31.branch._id).to.equal('mybranch');
                expect(pay31.user).to.equal('myuser');
                expect(pay31.state._id).to.equal('payed');
                expect(pay31.percentOfPartner).to.equal(0);
                expect(pay31.interestOfPartner).to.equal(0);

                // 4) there should be a pay with 5000 cash
                let srv4 = patientServicesWithPays[3];
                expect(srv4.priceTotal).to.equal(5000);
                expect(srv4.debt).to.equal(3000);
                expect(srv4.payed).to.equal(2000);
                expect(srv4.state._id).to.equal('partlyPayed');
                expect(srv4.pays).to.be.an('array').and.to.have.lengthOf(1);

                // check 1st pay
                let pay41 = srv4.pays[0];
                expect(pay41.amount).to.equal(2000);
                expect(pay41.payType._id).to.equal('cash');
                expect(pay41.created.toString()).to.equal(time.toString());
                expect(pay41.branch._id).to.equal('mybranch');
                expect(pay41.user).to.equal('myuser');
                expect(pay41.state._id).to.equal('payed');
                expect(pay41.percentOfPartner).to.equal(0);
                expect(pay41.interestOfPartner).to.equal(0);

                // 5) there should not be any pay
                let srv5 = pendingPatients[4];
                expect(srv5.priceTotal).to.equal(1000);
                expect(srv5.debt).to.equal(1000);
                expect(srv5.payed).to.equal(0);
                expect(srv5.state._id).to.equal('new');
                expect(srv5.pays).to.be.an('array').and.to.have.lengthOf(0);

                // after all pay, there shouldn't be any left money
                expect(payInfo.total).to.equal(0);
                expect(payInfo.totalCash).to.equal(0);
                expect(payInfo.totalCashless).to.equal(0);
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

        it('discount covers all debt', function (done) {
            let payInfo = {
                branch: "574de8d09870f8f81b77ed1c",
                patientId: "5764c7b41d9a46d00b8b6309",
                totalDebt: 41000,
                payType: {"_id": "cash", "title": "Наличные"},
                total: 0, // total is without discount, so 41000 - 41000 = 0
                totalCash: 0,
                totalCashless: 0,
                totalCompany: 0,
                discount: {
                    type: "percent",
                    note: "this is discount note",
                    amount: 100,
                    max: 100,
                    sum: 41000,
                    sumCompany: 0
                },
                debt: 0,
                period: {start: "2016-06-18T04:13:51.080Z", end: "2016-06-18T04:13:51.080Z"}
            };

            // replace resulting callback
            let cb = function (err, payTime) {
                expect(err).to.be.null;
                expect(payTime).not.to.be.null;
                expect(payTime.toString()).to.equal(time.toString());

                done();
            };

            // replace models.Cash.savePays()
            let stubSavePays = sandbox.stub(models.Cash, 'savePays', function (patientServicesWithPays, cb) {
                //F.inspect(patientServicesWithPays, 'patientServicesWithPays:');

                let srv1 = patientServicesWithPays[0];
                expect(srv1.priceTotal).to.equal(0);
                expect(srv1.debt).to.equal(0);
                expect(srv1.payed).to.equal(10000);
                expect(srv1.state._id).to.equal('payed');
                expect(srv1.pays).to.be.an('array').and.to.have.lengthOf(1);

                // check first pay - discount type
                let pay11 = srv1.pays[0];
                expect(pay11.amount).to.equal(10000);
                expect(pay11.payType._id).to.equal('discount');
                expect(pay11.created.toString()).to.equal(time.toString());
                expect(pay11.branch._id).to.equal('mybranch');
                expect(pay11.user).to.equal('myuser');
                expect(pay11.state._id).to.equal('payed');
                expect(pay11.percentOfPartner).to.equal(0);
                expect(pay11.interestOfPartner).to.equal(0);
                // check discount object
                expect(pay11).to.have.deep.property('discount.type', 'percent');
                expect(pay11).to.have.deep.property('discount.note', 'this is discount note');
                expect(pay11).to.have.deep.property('discount.state._id', 'payed');
                expect(pay11).to.have.deep.property('discount.amount', 100);
                expect(pay11).to.have.deep.property('discount.sum', 10000);

                let srv2 = patientServicesWithPays[1];
                expect(srv2.priceTotal).to.equal(0);
                expect(srv2.debt).to.equal(0);
                expect(srv2.payed).to.equal(20000);
                expect(srv2.state._id).to.equal('payed');
                expect(srv2.pays).to.be.an('array').and.to.have.lengthOf(1);

                // check first pay - discount type
                let pay21 = srv2.pays[0];
                expect(pay21.amount).to.equal(20000);
                expect(pay21.payType._id).to.equal('discount');
                expect(pay21.created.toString()).to.equal(time.toString());
                expect(pay21.branch._id).to.equal('mybranch');
                expect(pay21.user).to.equal('myuser');
                expect(pay21.state._id).to.equal('payed');
                expect(pay21.percentOfPartner).to.equal(0);
                expect(pay21.interestOfPartner).to.equal(0);
                // check discount object
                expect(pay21).to.have.deep.property('discount.type', 'percent');
                expect(pay21).to.have.deep.property('discount.note', 'this is discount note');
                expect(pay21).to.have.deep.property('discount.state._id', 'payed');
                expect(pay21).to.have.deep.property('discount.amount', 100);
                expect(pay21).to.have.deep.property('discount.sum', 20000);

                let srv3 = patientServicesWithPays[2];
                expect(srv3.priceTotal).to.equal(0);
                expect(srv3.debt).to.equal(0);
                expect(srv3.payed).to.equal(5000);
                expect(srv3.state._id).to.equal('payed');
                expect(srv3.pays).to.be.an('array').and.to.have.lengthOf(1);

                // check first pay - discount type
                let pay31 = srv3.pays[0];
                expect(pay31.amount).to.equal(5000);
                expect(pay31.payType._id).to.equal('discount');
                expect(pay31.created.toString()).to.equal(time.toString());
                expect(pay31.branch._id).to.equal('mybranch');
                expect(pay31.user).to.equal('myuser');
                expect(pay31.state._id).to.equal('payed');
                expect(pay31.percentOfPartner).to.equal(0);
                expect(pay31.interestOfPartner).to.equal(0);
                // check discount object
                expect(pay31).to.have.deep.property('discount.type', 'percent');
                expect(pay31).to.have.deep.property('discount.note', 'this is discount note');
                expect(pay31).to.have.deep.property('discount.state._id', 'payed');
                expect(pay31).to.have.deep.property('discount.amount', 100);
                expect(pay31).to.have.deep.property('discount.sum', 5000);

                let srv4 = patientServicesWithPays[3];
                expect(srv4.priceTotal).to.equal(0);
                expect(srv4.debt).to.equal(0);
                expect(srv4.payed).to.equal(5000);
                expect(srv4.state._id).to.equal('payed');
                expect(srv4.pays).to.be.an('array').and.to.have.lengthOf(1);

                // check first pay - discount type
                let pay41 = srv4.pays[0];
                expect(pay41.amount).to.equal(5000);
                expect(pay41.payType._id).to.equal('discount');
                expect(pay41.created.toString()).to.equal(time.toString());
                expect(pay41.branch._id).to.equal('mybranch');
                expect(pay41.user).to.equal('myuser');
                expect(pay41.state._id).to.equal('payed');
                expect(pay41.percentOfPartner).to.equal(0);
                expect(pay41.interestOfPartner).to.equal(0);
                // check discount object
                expect(pay41).to.have.deep.property('discount.type', 'percent');
                expect(pay41).to.have.deep.property('discount.note', 'this is discount note');
                expect(pay41).to.have.deep.property('discount.state._id', 'payed');
                expect(pay41).to.have.deep.property('discount.amount', 100);
                expect(pay41).to.have.deep.property('discount.sum', 5000);

                let srv5 = patientServicesWithPays[4];
                expect(srv5.priceTotal).to.equal(0);
                expect(srv5.debt).to.equal(0);
                expect(srv5.payed).to.equal(1000);
                expect(srv5.state._id).to.equal('payed');
                expect(srv5.pays).to.be.an('array').and.to.have.lengthOf(1);

                // check first pay - discount type
                let pay51 = srv5.pays[0];
                expect(pay51.amount).to.equal(1000);
                expect(pay51.payType._id).to.equal('discount');
                expect(pay51.created.toString()).to.equal(time.toString());
                expect(pay51.branch._id).to.equal('mybranch');
                expect(pay51.user).to.equal('myuser');
                expect(pay51.state._id).to.equal('payed');
                expect(pay51.percentOfPartner).to.equal(0);
                expect(pay51.interestOfPartner).to.equal(0);
                // check discount object
                expect(pay51).to.have.deep.property('discount.type', 'percent');
                expect(pay51).to.have.deep.property('discount.note', 'this is discount note');
                expect(pay51).to.have.deep.property('discount.state._id', 'payed');
                expect(pay51).to.have.deep.property('discount.amount', 100);
                expect(pay51).to.have.deep.property('discount.sum', 1000);

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

        it('only company payment', function (done) {
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
                        "balance": 0
                    },
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
                        "balance": 0
                    },
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
                }
            ];
            let payInfo = {
                branch: "574de8d09870f8f81b77ed1c",
                patientId: "5764c7b41d9a46d00b8b6309",
                totalDebt: 30000,
                payType: undefined,
                total: 0,
                totalCash: 0,
                totalCashless: 0,
                totalCompany: 30000,
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
                expect(err).to.be.null;
                expect(payTime).not.to.be.null;
                expect(payTime.toString()).to.equal(time.toString());

                done();
            };

            sandbox.stub(models.Cash, 'changeCompaniesBalance', function (companies, cb) {
                cb(null, new Date());
            });

            // replace models.Cash.savePays()
            let stubSavePays = sandbox.stub(models.Cash, 'savePays', function (patientServicesWithPays, cb) {
                //console.log('Cash.savePays() called');
                //F.inspect(patientServicesWithPays, 'patientServicesWithPays:');

                let srv1 = patientServicesWithPays[0];
                expect(srv1.priceTotal).to.equal(10000);
                expect(srv1.debt).to.equal(0);
                expect(srv1.payed).to.equal(10000);
                expect(srv1.state._id).to.equal('payed');
                expect(srv1.pays).to.be.an('array').and.to.have.lengthOf(1);

                // check first pay - company type pay
                let pay11 = srv1.pays[0];
                expect(pay11.amount).to.equal(10000);
                expect(pay11.payType._id).to.equal('company');
                expect(pay11.created.toString()).to.equal(time.toString());
                expect(pay11.branch._id).to.equal('mybranch');
                expect(pay11.user).to.equal('myuser');
                expect(pay11.state._id).to.equal('payed');
                expect(pay11.percentOfPartner).to.equal(0);
                expect(pay11.interestOfPartner).to.equal(0);

                let srv2 = patientServicesWithPays[1];
                expect(srv2.priceTotal).to.equal(20000);
                expect(srv2.debt).to.equal(0);
                expect(srv2.payed).to.equal(20000);
                expect(srv2.state._id).to.equal('payed');
                expect(srv2.pays).to.be.an('array').and.to.have.lengthOf(1);

                // check first pay - company type pay
                let pay21 = srv2.pays[0];
                expect(pay21.amount).to.equal(20000);
                expect(pay21.payType._id).to.equal('company');
                expect(pay21.created.toString()).to.equal(time.toString());
                expect(pay21.branch._id).to.equal('mybranch');
                expect(pay21.user).to.equal('myuser');
                expect(pay21.state._id).to.equal('payed');
                expect(pay21.percentOfPartner).to.equal(0);
                expect(pay21.interestOfPartner).to.equal(0);

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

        it('cash and company payments with enough money', function (done) {
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
                        "balance": 0
                    },
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
                        "balance": 0
                    },
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
                }
            ];
            let payInfo = {
                branch: "574de8d09870f8f81b77ed1c",
                patientId: "5764c7b41d9a46d00b8b6309",
                totalDebt: 35000,
                payType: {_id: 'cash', title: 'Наличные'},
                total: 5000,
                totalCash: 5000,
                totalCashless: 0,
                totalCompany: 30000,
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
                expect(err).to.be.null;
                expect(payTime).not.to.be.null;
                expect(payTime.toString()).to.equal(time.toString());

                done();
            };

            sandbox.stub(models.Cash, 'changeCompaniesBalance', function (companies, cb) {
                cb(null, new Date());
            });

            // replace models.Cash.savePays()
            let stubSavePays = sandbox.stub(models.Cash, 'savePays', function (patientServicesWithPays, cb) {
                //console.log('Cash.savePays() called');
                //F.inspect(patientServicesWithPays, 'patientServicesWithPays:');

                let srv1 = patientServicesWithPays[0];
                expect(srv1.priceTotal).to.equal(10000);
                expect(srv1.debt).to.equal(0);
                expect(srv1.payed).to.equal(10000);
                expect(srv1.state._id).to.equal('payed');
                expect(srv1.pays).to.be.an('array').and.to.have.lengthOf(1);

                // check first pay - company type pay
                let pay11 = srv1.pays[0];
                expect(pay11.amount).to.equal(10000);
                expect(pay11.payType._id).to.equal('company');
                expect(pay11.created.toString()).to.equal(time.toString());
                expect(pay11.branch._id).to.equal('mybranch');
                expect(pay11.user).to.equal('myuser');
                expect(pay11.state._id).to.equal('payed');
                expect(pay11.percentOfPartner).to.equal(0);
                expect(pay11.interestOfPartner).to.equal(0);

                let srv2 = patientServicesWithPays[1];
                expect(srv2.priceTotal).to.equal(20000);
                expect(srv2.debt).to.equal(0);
                expect(srv2.payed).to.equal(20000);
                expect(srv2.state._id).to.equal('payed');
                expect(srv2.pays).to.be.an('array').and.to.have.lengthOf(1);

                // check first pay - company type pay
                let pay21 = srv2.pays[0];
                expect(pay21.amount).to.equal(20000);
                expect(pay21.payType._id).to.equal('company');
                expect(pay21.created.toString()).to.equal(time.toString());
                expect(pay21.branch._id).to.equal('mybranch');
                expect(pay21.user).to.equal('myuser');
                expect(pay21.state._id).to.equal('payed');
                expect(pay21.percentOfPartner).to.equal(0);
                expect(pay21.interestOfPartner).to.equal(0);

                let srv3 = patientServicesWithPays[2];
                expect(srv3.priceTotal).to.equal(5000);
                expect(srv3.debt).to.equal(0);
                expect(srv3.payed).to.equal(5000);
                expect(srv3.state._id).to.equal('payed');
                expect(srv3.pays).to.be.an('array').and.to.have.lengthOf(1);

                // check first pay - cash type pay
                let pay31 = srv3.pays[0];
                expect(pay31.amount).to.equal(5000);
                expect(pay31.payType._id).to.equal('cash');
                expect(pay31.created.toString()).to.equal(time.toString());
                expect(pay31.branch._id).to.equal('mybranch');
                expect(pay31.user).to.equal('myuser');
                expect(pay31.state._id).to.equal('payed');
                expect(pay31.percentOfPartner).to.equal(0);
                expect(pay31.interestOfPartner).to.equal(0);

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

        it('cash and company payments with not enough money', function (done) {
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
                        "balance": 0
                    },
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
                        "balance": 0
                    },
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
                }
            ];
            let payInfo = {
                branch: "574de8d09870f8f81b77ed1c",
                patientId: "5764c7b41d9a46d00b8b6309",
                totalDebt: 35000,
                payType: {_id: 'cash', title: 'Наличные'},
                total: 4000,
                totalCash: 4000,
                totalCashless: 0,
                totalCompany: 30000,
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
                expect(err).to.be.null;
                expect(payTime).not.to.be.null;
                expect(payTime.toString()).to.equal(time.toString());

                done();
            };

            sandbox.stub(models.Cash, 'changeCompaniesBalance', function (companies, cb) {
                cb(null, new Date());
            });

            // replace models.Cash.savePays()
            let stubSavePays = sandbox.stub(models.Cash, 'savePays', function (patientServicesWithPays, cb) {
                //console.log('Cash.savePays() called');
                //F.inspect(patientServicesWithPays, 'patientServicesWithPays:');

                let srv1 = patientServicesWithPays[0];
                expect(srv1.priceTotal).to.equal(10000);
                expect(srv1.debt).to.equal(0);
                expect(srv1.payed).to.equal(10000);
                expect(srv1.state._id).to.equal('payed');
                expect(srv1.pays).to.be.an('array').and.to.have.lengthOf(1);

                // check first pay - company type pay
                let pay11 = srv1.pays[0];
                expect(pay11.amount).to.equal(10000);
                expect(pay11.payType._id).to.equal('company');
                expect(pay11.created.toString()).to.equal(time.toString());
                expect(pay11.branch._id).to.equal('mybranch');
                expect(pay11.user).to.equal('myuser');
                expect(pay11.state._id).to.equal('payed');
                expect(pay11.percentOfPartner).to.equal(0);
                expect(pay11.interestOfPartner).to.equal(0);

                let srv2 = patientServicesWithPays[1];
                expect(srv2.priceTotal).to.equal(20000);
                expect(srv2.debt).to.equal(0);
                expect(srv2.payed).to.equal(20000);
                expect(srv2.state._id).to.equal('payed');
                expect(srv2.pays).to.be.an('array').and.to.have.lengthOf(1);

                // check first pay - company type pay
                let pay21 = srv2.pays[0];
                expect(pay21.amount).to.equal(20000);
                expect(pay21.payType._id).to.equal('company');
                expect(pay21.created.toString()).to.equal(time.toString());
                expect(pay21.branch._id).to.equal('mybranch');
                expect(pay21.user).to.equal('myuser');
                expect(pay21.state._id).to.equal('payed');
                expect(pay21.percentOfPartner).to.equal(0);
                expect(pay21.interestOfPartner).to.equal(0);

                let srv3 = patientServicesWithPays[2];
                expect(srv3.priceTotal).to.equal(5000);
                expect(srv3.debt).to.equal(1000);
                expect(srv3.payed).to.equal(4000);
                expect(srv3.state._id).to.equal('partlyPayed');
                expect(srv3.pays).to.be.an('array').and.to.have.lengthOf(1);

                // check first pay - cash type pay
                let pay31 = srv3.pays[0];
                expect(pay31.amount).to.equal(4000);
                expect(pay31.payType._id).to.equal('cash');
                expect(pay31.created.toString()).to.equal(time.toString());
                expect(pay31.branch._id).to.equal('mybranch');
                expect(pay31.user).to.equal('myuser');
                expect(pay31.state._id).to.equal('payed');
                expect(pay31.percentOfPartner).to.equal(0);
                expect(pay31.interestOfPartner).to.equal(0);

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

        it('cash and company payments with discount');

        it('separate and company payments with enough money');

        it('separate and company payments with not enough money');

        it('separate and company payments with discount and enough money');

        it('separate and company payments with discount and not enough money');

        it('Error cases!');

    });

    describe('Cash.changeCompaniesBalance()', function () {
        it('should change company balance');
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