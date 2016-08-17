'use strict';
/* globals testUtils */

var assert = require('assert'),
  PouchDB = require('pouchdb'),
  app = require('../app'),
  remoteURL = null,
  remote = null;

describe('query', function () {
  
  before(function() {
    return testUtils.createUser().then(function(url){
      remote = new PouchDB(url);
      remoteURL = url;
    });
  });
  
  it('visit unknown url to force a 400 error', function (done) {
    // Cloudant "/db/_find"
    var r = { 
      url: '_design/missing', 
      method: 'get'
    };
    remote.request(r, function (err, response) {
      assert.equal(typeof response, 'undefined');
      assert.equal(typeof err, 'object');
      assert.equal(typeof err.status, 'number');
      assert.equal(err.status, 400);
      done();
    });
  });

  it('visit _session, should be 404', function (done) {
    // Cloudant "/db/_find"
    var r = { 
      url: '_session', 
      method: 'get'
    };
    remote.request(r, function (err, response) {
      assert.equal(typeof response, 'undefined');
      assert.equal(typeof err, 'object');
      assert.equal(typeof err.status, 'number');
      assert.equal(err.status, 404);
      done();
    });
  });
  
});
