'use strict';

var chai = require('chai'),
    should = chai.should(),
    chaiHttp = require('chai-http'),
    server = require('../server');

chai.use(chaiHttp);

describe('Testing /cash actions', function () {

    const PATIENT_ID = "5704dce34bd33c1c21eb7949";

    it('POST /cash/pending-patients', function (done) {
        chai.request(server)
            .post('/cash/pending-patients')
            .send({})
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.an('array');

                console.log('Quantity of pending services:', res.body.length);
                // if there are pending services, continue testing its details...
                if (res.body.length > 0) {
                    let patSrv = res.body[0];
                    patSrv.should.have.property('quantity').and.be.at.least(1);
                    patSrv.should.have.property('total').and.be.above(0);
                    patSrv.should.have.property('lastService').and.be.ok;
                    patSrv.should.have.property('patient').and.be.an('object').and.be.ok;
                }

                done();
            });
    });

    it('POST /cash/pending-services-of/:patientId with invalid param', function (done) {
        chai.request(server)
            .post('/cash/pending-services-of/111')
            .send({patientId: 111})
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

    it('POST /cash/pending-services-of/:patientId with valid param', function (done) {
        chai.request(server)
            .post('/cash/pending-services-of/' + PATIENT_ID)
            .send({patientId: PATIENT_ID})
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.an('array');
                res.body.should.have.length.of.at.least(1);

                done();
            });
    });

});