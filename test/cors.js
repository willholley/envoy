'use strict';
/* globals testUtils */

var assert = require('assert'),
  auth = require('../lib/auth'),
  cloudant = null,
  app = require('../app'),
  fakedomain = 'http://mydomain.com',
  fakeacl = 'X-PINGOTHER, Content-Type',
  remoteURL = null,
  remote = null;

describe('cors', function () {
  
  before(function() {
    return testUtils.createUser().then(function(url){
      url = url.replace(/\/[a-z]+$/,'');
      var headers = {
        origin: fakedomain,
        'Access-Control-Request-Headers': fakeacl
      }
      cloudant = require('cloudant')({url: url, requestDefaults: { headers: headers }});
      remote = cloudant.db.use('mbaas');
      remoteURL = url;
    });
  });
  
  it('select records with CORS headers', function (done) {
    // Cloudant "/db/_all_docs"
    remote.list(function (err, response, headers) {
      assert.equal(headers['access-control-allow-credentials'], 'true');
      assert.equal(headers['access-control-allow-origin'], fakedomain);
      assert.equal(headers['access-control-allow-headers'], fakeacl);
      done();
    });
  });

  
});
