const expect = require('chai').expect;
const api = new (require('../src/index'))('');
const env = process.env;

const USERNAME = 'gintsmurans';
const USERID = 'account.dad37f85080547c988bacfb4f59d1b3b';

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

describe('#players endpoint', function() {
  it('functions exists', function() {
      expect(api.searchPlayers).to.be.a('function');
      expect(api.loadPlayerById).to.be.a('function');
  });
  it('should throw unauthorized error', function(done) {
    api.asyncType = 'promise';
      api.searchPlayers().then(res => {
          done('This call should have failed');
      }, err => {
          expect(err).to.be.not.null;
          done();
      });
  });
  it('should search for a player by name "gintsmurans"', function(done) {
    api.setAPIKey(env.PUBG_API_KEY);
    api.defaultShard = 'pc-eu';
    api.asyncType = 'promise';
      api.searchPlayers({playerNames: USERNAME}).then(res => {
        expect(res.data.length).to.equal(1);
        expect(res.data[0].attributes.name).to.equal(USERNAME);
        done();
      }, err => {
          done(err);
      });
  });
  it('should search for a player by id "account.dad37f85080547c988bacfb4f59d1b3b"', function(done) {
    api.asyncType = 'promise';
      api.searchPlayers({playerIds: USERID}).then(res => {
        expect(res.data.length).to.equal(1);
        expect(res.data[0].id).to.equal(USERID);
        done();
      }, err => {
        done(err);
      });
  });
  it('should load player by id "account.dad37f85080547c988bacfb4f59d1b3b"', function(done) {
    api.asyncType = 'promise';
      api.loadPlayerById(USERID).then(res => {
        expect(res.data).to.not.be.null;
        expect(res.data.id).to.equal(USERID);
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
    it('should load first match of "account.dad37f85080547c988bacfb4f59d1b3b"', function(done) {
      api.asyncType = 'promise';
      api.loadPlayerById(USERID)
      .then(res => {
        expect(res.data).to.exist;
        expect(res.data.id).to.equal(USERID);
        expect(res.data.relationships).to.exist;
        expect(res.data.relationships.matches).to.exist;
        expect(res.data.relationships.matches.data).to.exist;
        expect(res.data.relationships.matches.data.length).to.be.greaterThan(0);
        return api.loadMatchById(res.data.relationships.matches.data[0].id);
      })
      .then(match => {
        expect(match).to.be.not.null;
        expect(match.data).to.exist;
        expect(match.data.type).to.equal('match');
        done();
      })
      .catch(err => done(err));
    });
});