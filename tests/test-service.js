var chai = require('chai');
var should = chai.should();
var chaiHttp = require('chai-http');
var server = require('../server');

chai.use(chaiHttp);

describe('Service CRUD', function () {
    it('Testing GET /service/with-category', function (done) {
        chai.request(server)
            .get('/service/with-category')
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.an('array');
                var srv = res.body[0];
                srv.should.be.an('object');
                srv.should.have.property('_id').and.be.ok;
                srv.should.have.property('category').and.be.an('object').and.be.ok;
                should.exist(srv.categoryId, 'categoryId should have value');
                should.exist(srv.categoryTitle, 'categoryTitle should have value');
                srv.should.have.property('title').and.be.ok;
                srv.should.have.property('shortTitle').and.be.ok;
                srv.should.have.property('price').and.above(0);
                srv.should.have.property('userId').and.be.ok;
                srv.should.have.property('created').and.be.ok;
                srv.should.not.have.property('state');
                done();
            });
    });

    it('Testing GET /service', function (done) {
        chai.request(server)
            .get('/service')
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.an('array');
                var srv = res.body[0];
                srv.should.be.an('object');
                srv.should.have.property('_id').and.be.ok;
                srv.should.have.property('category').and.be.an('object').and.be.ok;
                srv.should.have.property('title').and.be.ok;
                srv.should.have.property('shortTitle').and.be.ok;
                srv.should.have.property('price').and.above(0);
                srv.should.have.property('state').and.be.an('object').and.be.ok;
                srv.should.have.property('userId').and.be.ok;
                srv.should.have.property('created').and.be.ok;
                done();
            });
    });

    describe('Testing POST /service', function () {

        it('Testing POST /service with empty body', function (done) {
            chai.request(server)
                .post('/service')
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

        it('Testing POST /service with invalid category and price', function (done) {
            chai.request(server)
                .post('/service')
                .send({
                    category: 'Im string category, it should be object',
                    title: 'TestService',
                    shortTitle: 'TS',
                    price: -1
                })
                .end(function (err, res) {
                    should.not.exist(err);
                    should.exist(res);
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.be.an('object');
                    res.body.should.have.property('code', 'error');
                    res.body.should.have.property('err').and.be.an('object');
                    res.body.err.should.have.deep.property('errors.category\\.title'); // errors['category.title']
                    res.body.err.should.have.deep.property('errors.price');
                    done();
                });
        });

        // keep newly created service in this variable for later use/delete
        var savedSrv;

        it('Testing POST /service with valid data', function (done) { // todo: should be implemented

            var category = {
                _id: 'test',
                title: 'Test Category',
                shortTitle: 'test cat'
            };

            var state = {
                _id: 'active',
                title: 'Активный'
            };

            var currentDateTime = new Date();

            var newSrv = {
                category: category,
                title: 'Test Service',
                shortTitle: 'Test Srv',
                price: 14000,
                state: state,
                created: currentDateTime,
                userId: 1
            };

            chai.request(server)
                .post('/service')
                .send(newSrv)
                .end(function (err, res) {
                    should.not.exist(err);
                    should.exist(res);
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.be.an('object');
                    res.body.should.have.property('_id').and.be.ok;

                    // keep newly created service
                    savedSrv = res.body;

                    done();
                });
        });

        it('Testing GET /service/:id', function (done) {
            chai.request(server)
                .get('/service/' + savedSrv._id)
                .end(function (err, res) {
                    should.not.exist(err);
                    should.exist(res);
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.be.an('object');
                    res.body.should.have.property('_id').and.be.ok;
                    done();
                });
        });

        it('Testing PUT /service/:id', function (done) {
            savedSrv.price = 15000;
            chai.request(server)
                .put('/service/' + savedSrv._id)
                .send(savedSrv)
                .end(function (err, res) {
                    should.not.exist(err);
                    should.exist(res);
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.be.an('object');
                    res.body.should.have.property('price', 15000);
                    done();
                });
        });

        it('Testing DELETE /service/:id', function (done) {
            chai.request(server)
                .delete('/service/' + savedSrv._id)
                .end(function (err, res) {
                    should.not.exist(err);
                    should.exist(res);
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.have.property('code', 'success');

                    // mark saved service as already removed
                    savedSrv = null;
                    done();
                });
        });

        after('Removing saved service', function (done) {
            if (savedSrv) {
                chai.request(server)
                    .delete('/service/' + savedSrv._id)
                    .end(function (err, res) {
                        done();
                    });
            } else {
                done();
            }
        });

    });
});