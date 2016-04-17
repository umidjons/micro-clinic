var chai = require('chai');
var should = chai.should();
var chaiHttp = require('chai-http');
var server = require('../server');

chai.use(chaiHttp);

describe('Patient CRUD', function () {

    var savedPatient = null;

    it('POST /patient with empty body', function (done) {
        chai.request(server)
            .post('/patient')
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

    it('POST /patient with valid data', function (done) {
        var currentDateTime = new Date();
        var patient = {
            firstName: 'Test',
            lastName: 'Testov',
            middleName: 'Testovich',
            dateOfBirth: currentDateTime,
            sex: {
                _id: 'male',
                title: 'Мужчина'
            },
            address: 'Test city',
            cellPhone: '1234567',
            homePhone: '7654321',
            email: 'test@test.uz',
            company: 'Test Company',
            created: currentDateTime,
            userId: 1
        };

        chai.request(server)
            .post('/patient')
            .send(patient)
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.an('object')
                    .and.have.property('_id')
                    .and.be.ok;
                res.body.should.have.property('firstName', patient.firstName);
                res.body.should.have.property('email', patient.email);

                // keep newly created patient
                savedPatient = res.body;

                done();
            });
    });

    it('PUT /patient/:id', function (done) {
        savedPatient.lastName = 'Testova';
        savedPatient.sex = {
            _id: 'female',
            title: 'Женщина'
        };

        chai.request(server)
            .put('/patient/' + savedPatient._id)
            .send(savedPatient)
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.an('object')
                    .and.have.property('_id')
                    .and.be.ok;
                res.body.should.have.property('firstName', savedPatient.firstName);
                res.body.should.have.property('sex')
                    .and.be.an('object')
                    .and.have.property('_id', 'female');
                done();
            });
    });

    it('GET /patient', function (done) {
        chai.request(server)
            .get('/patient')
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.an('array');

                // there is sort by created date, so just added patient is the first item
                var pat = res.body[0];
                pat.should.have.property('_id', savedPatient._id);
                pat.should.have.property('firstName', savedPatient.firstName);
                pat.should.have.property('lastName', savedPatient.lastName);
                pat.should.have.property('middleName', savedPatient.middleName);
                pat.should.have.property('dateOfBirth', savedPatient.dateOfBirth);
                pat.should.have.property('sex').and.be.an('object')
                    .and.have.property('_id', 'female');
                pat.should.have.property('address', savedPatient.address);
                pat.should.have.property('cellPhone', savedPatient.cellPhone);
                pat.should.have.property('homePhone', savedPatient.homePhone);
                pat.should.have.property('email', savedPatient.email);
                pat.should.have.property('company', savedPatient.company);
                pat.should.have.property('created').and.be.ok;
                pat.should.have.property('userId', '1');

                done();
            });
    });

    it('GET /patient/:id', function (done) {
        chai.request(server)
            .get('/patient/' + savedPatient._id)
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.an('object');

                var pat = res.body;
                pat.should.have.property('_id', savedPatient._id);
                pat.should.have.property('firstName', savedPatient.firstName);
                pat.should.have.property('lastName', savedPatient.lastName);
                pat.should.have.property('middleName', savedPatient.middleName);
                pat.should.have.property('dateOfBirth', savedPatient.dateOfBirth);
                pat.should.have.property('sex').and.be.an('object')
                    .and.have.property('_id', 'female');
                pat.should.have.property('address', savedPatient.address);
                pat.should.have.property('cellPhone', savedPatient.cellPhone);
                pat.should.have.property('homePhone', savedPatient.homePhone);
                pat.should.have.property('email', savedPatient.email);
                pat.should.have.property('company', savedPatient.company);
                pat.should.have.property('created').and.be.ok;
                pat.should.have.property('userId', '1');

                done();
            });
    });

    it('POST /patient/search with empty body', function (done) {
        chai.request(server)
            .post('/patient/search')
            .send({})
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                res.should.have.status(200);
                res.body.should.be.an('object');
                res.body.should.have.property('code', 'error');
                done();
            });
    });

    it('POST /patient/search with first & last names', function (done) {
        // partial & case-insensitive match
        var condition = {
            firstName: savedPatient.firstName.toLowerCase(),
            lastName: savedPatient.lastName.toLowerCase()
        };

        chai.request(server)
            .post('/patient/search')
            .send(condition)
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.an('array');

                var pat = res.body[0];
                pat.should.have.property('_id', savedPatient._id);
                pat.should.have.property('firstName', savedPatient.firstName);
                pat.should.have.property('lastName', savedPatient.lastName);
                pat.should.have.property('middleName', savedPatient.middleName);
                pat.should.have.property('dateOfBirth', savedPatient.dateOfBirth);
                pat.should.have.property('sex').and.be.an('object')
                    .and.have.property('_id', 'female');
                pat.should.have.property('address', savedPatient.address);
                pat.should.have.property('cellPhone', savedPatient.cellPhone);
                pat.should.have.property('homePhone', savedPatient.homePhone);
                pat.should.have.property('email', savedPatient.email);
                pat.should.have.property('company', savedPatient.company);
                pat.should.have.property('created').and.be.ok;
                pat.should.have.property('userId', '1');

                done();
            });
    });

    it('POST /patient/search with first, last & middle names, also date of birth', function (done) {
        var condition = {
            firstName: savedPatient.firstName.toLowerCase(),
            lastName: savedPatient.lastName.toLowerCase(),
            middleName: savedPatient.middleName.toLowerCase(),
            dateOfBirth: savedPatient.dateOfBirth
        };

        chai.request(server)
            .post('/patient/search')
            .send(condition)
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.an('array');

                var pat = res.body[0];
                pat.should.have.property('_id', savedPatient._id);
                pat.should.have.property('firstName', savedPatient.firstName);
                pat.should.have.property('lastName', savedPatient.lastName);
                pat.should.have.property('middleName', savedPatient.middleName);
                pat.should.have.property('dateOfBirth', savedPatient.dateOfBirth);
                pat.should.have.property('sex').and.be.an('object')
                    .and.have.property('_id', 'female');
                pat.should.have.property('address', savedPatient.address);
                pat.should.have.property('cellPhone', savedPatient.cellPhone);
                pat.should.have.property('homePhone', savedPatient.homePhone);
                pat.should.have.property('email', savedPatient.email);
                pat.should.have.property('company', savedPatient.company);
                pat.should.have.property('created').and.be.ok;
                pat.should.have.property('userId', '1');

                done();
            });
    });

    it('DELETE /patient/:id', function (done) {
        chai.request(server)
            .delete('/patient/' + savedPatient._id)
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.an('object');
                res.body.should.have.property('code', 'success');

                // mark saved patient as already removed
                savedPatient = null;

                done();
            });
    });

    after(function (done) {
        if (savedPatient) {
            chai.request(server)
                .delete('/patient/' + savedPatient._id)
                .end(function (err, res) {
                    done();
                });
        } else {
            done();
        }
    });
});