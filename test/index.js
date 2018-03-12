const expect = require('chai').expect;
const api = new (require('../index'))('');

describe('#testing status', function() {
    it('module exists', function() {
        expect(api).to.be.a('object');
        expect(api.healthStatus).to.be.a('function');
    });
    it('api is live', function(done) {
        api.healthStatus().then((res) => {
            done();
        }, err => {
            done(err);
        });
    });
});

describe('#matches endpoint', function() {
    it('function exists', function() {
        expect(api.loadMatches).to.be.a('function');
    });
    it('should throw unauthorized error', function(done) {
        api.loadMatches().then(res => {
            done('This call should have failed');
        }, err => {
            expect(err).to.be.not.null;
            done();
        });
    });
    it('it should load 5 matches without filters', function(done) {
        api.setAPIKey('sdf');
        api.loadMatches().then(res => {
            expect(res).to.not.be.null;
            done();
        }, err => {
            done(err);
        });
    });
});