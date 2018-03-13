const expect = require('chai').expect;
const api = new (require('../src/index'))('');
const env = process.env;

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
    it('observable are working', function(done) {
      api.asyncType = 'observable';
        api.healthStatus().subscribe((res) => {
          done();
        }, err => done(err));
    });
});

describe('#matches endpoint', function() {
    it('function exists', function() {
        expect(api.loadMatches).to.be.a('function');
    });
    it('should throw unauthorized error', function(done) {
      api.asyncType = 'promise';
        api.loadMatches().then(res => {
            done('This call should have failed');
        }, err => {
            expect(err).to.be.not.null;
            done();
        });
    });
    /*it('it should load 5 matches without filters', function(done) {
        console.info('Using following api key :', env.PUBG_API_KEY_TEST);
        api.setAPIKey(env.PUBG_API_KEY_TEST);
        api.loadMatches().then(res => {
            expect(res).to.not.be.null;
            done();
        }, err => {
            done(err);
        });
    });*/
});