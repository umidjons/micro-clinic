var chai = require('chai');
var should = chai.should();
var chaiHttp = require('chai-http');
var server = require('../server');
var ObjectId = require('mongoose').Types.ObjectId;

chai.use(chaiHttp);

describe('Patient Service CRUD', function () {
    var retrievedServicesForPatient = null;
    var lastPatientServiceId = null;
    var patId = ObjectId();
    var savedPatSrv = null;
    var currentDateTime = new Date();
    var params = {
        patientId: patId,
        services: [
            {
                _id: '0001',
                category: {
                    _id: 'cat1',
                    title: 'Cat 1',
                    shortTitle: 'C1'
                },
                title: 'Service 1',
                shortTitle: 'Srv1',
                userId: '1',
                created: currentDateTime,
                price: 100,
                categoryId: 'cat1',
                categoryTitle: 'Cat 1',
                categoryShortTitle: 'C1',
                quantity: 1,
                priceTotal: 100
            },
            {
                _id: '0002',
                category: {
                    _id: 'cat2',
                    title: 'Cat 2',
                    shortTitle: 'C2'
                },
                title: 'Service 2',
                shortTitle: 'Srv2',
                userId: '1',
                created: currentDateTime,
                price: 100,
                categoryId: 'cat2',
                categoryTitle: 'Cat 2',
                categoryShortTitle: 'C2',
                quantity: 1,
                priceTotal: 90,
                discount: {
                    amount: 10,
                    note: 'Test discount'
                }
            },
            {
                _id: '0003',
                category: {
                    _id: 'cat3',
                    title: 'Cat 3',
                    shortTitle: 'C3'
                },
                title: 'Service 3',
                shortTitle: 'Srv3',
                userId: '1',
                created: currentDateTime,
                price: 100,
                categoryId: 'cat3',
                categoryTitle: 'Cat 3',
                categoryShortTitle: 'C3',
                quantity: 1,
                priceTotal: 90,
                discount: {
                    amount: 10,
                    note: 'Test discount'
                },
                partner: {
                    code: '000001',
                    percent: 10,
                    firstName: 'Partner',
                    lastName: 'Partner',
                    middleName: 'Partner',
                    address: 'partner address',
                    cellPhone: '1112233',
                    homePhone: '2223344',
                    email: 'partner@partner.uz',
                    company: 'Partner Ltd.',
                    state: {
                        _id: 'partner',
                        title: 'Partner State'
                    },
                    created: currentDateTime,
                    userId: '1'
                }
            }
        ]
    };

    it('POST /patient-service with empty body', function (done) {
        chai.request(server)
            .post('/patient-service')
            .send({patientId: patId})
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.an('object');
                res.body.should.have.property('code', 'error');

                done();
            });
    });

    it('POST /patient-service with invalid patientId', function (done) {
        chai.request(server)
            .post('/patient-service')
            .send({})
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.an('object');
                res.body.should.have.property('code', 'error');

                done();
            });
    });

    it('POST /patient-service with valid data', function (done) {
        chai.request(server)
            .post('/patient-service')
            .send(params)
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.an('object');
                res.body.should.have.property('code', 'success');

                done();
            });
    });

    it('GET /patient-service/for/:patientId', function (done) {
        chai.request(server)
            .get('/patient-service/for/' + patId)
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.an('array');
                res.body.should.have.lengthOf(params.services.length);

                // keep patient services for later use in another tests
                retrievedServicesForPatient = res.body;

                done();
            });
    });

    it('POST /patient-service/delete-bulk', function (done) {
        retrievedServicesForPatient.should.be.an('array');

        var ids = retrievedServicesForPatient.map(function (patSrv) {
            return patSrv._id;
        });
        ids.should.be.an('array');

        // remove & return last _id for DELETE /patient-service test
        lastPatientServiceId = ids.pop();

        chai.request(server)
            .post('/patient-service/delete-bulk')
            .send({ids: ids})
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.an('object');
                res.body.should.have.property('code', 'success');

                done();
            });
    });

    it('DELETE /patient-service/:id', function (done) {
        lastPatientServiceId.should.be.ok;

        chai.request(server)
            .delete('/patient-service/' + lastPatientServiceId)
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.an('object');
                res.body.should.have.property('code', 'success');

                done();
            });
    });

});