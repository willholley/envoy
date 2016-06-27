'use strict';

var request = require('request'),
  assert = require('assert');

describe('auth', function() {

  var remote = null,
    url1 = null,
    badurl1 = null,
    badurl2 = null,
    badurl3 = null,
    badurl4 = null;

  var authmod = function(url, alter) {
    var URL = require('url');
    var parsed = URL.parse(url);
    switch(alter) {
      case 'username':
        parsed.auth = parsed.auth.replace(/^.+:/,'badusername:');
        break;
      case 'password':
        parsed.auth = parsed.auth.replace(/:.+$/,':badpassword');
        break;
      case 'both':
        parsed.auth = ':';
        break;
      case 'all':
        delete parsed.auth;
        break;  
    }
    return URL.format(parsed).slice(0,-1);;
  }

  before(function () {
    return testUtils.createUser().then(function(remoteURL){
       url1 = remoteURL.replace(/\/[a-z]+$/,'');
       badurl1 = authmod(url1, 'all');
       badurl2 = authmod(url1, 'password');
       badurl3 = authmod(url1, 'username');
       badurl4 = authmod(url1, 'both');
    });
  });


  // check that we can login once with credentials
  // then call again with no credentials but with a cookie
  it('session login', function(done) {
    var r = {
      method: 'get',
      url: url1 + '/mbaas/_all_docs',
      jar: true
    };
    request(r, function(err, resp, data) {
      assert.equal(err, null);
      assert.equal(resp.statusCode, 200);
      // now try without credentials, it should still work
      // because of cookies
      var r = {
        method: 'get',
        url: badurl1 + '/mbaas/_all_docs',
        jar: true
      };   
      request(r, function(err, resp, data) {
        assert.equal(err, null);
        assert.equal(resp.statusCode, 200);

        // now call /_auth to see if we are logged in
        var r = {
          method: 'get',
          url: badurl1 + '/_auth',
          jar: true
        };   
        request(r, function(err, resp, data) {
          assert.equal(err, null);
          assert.equal(resp.statusCode, 200);

          // now call /_logout to clear the session
          var r = {
            method: 'get',
            url: badurl1 + '/_logout',
            jar: true
          };   
          request(r, function(err, resp, data) {
            assert.equal(err, null);
            assert.equal(resp.statusCode, 200);
            done();
          });

        });

      });
    });
  });

  // check we can't access a protected endpoint without credentials
  it('access denied with no credentials', function(done) {
    var r = {
      method: 'get',
      url: badurl1 + '/mbaas/_all_docs'
    };
    request(r, function(err, resp, data) {
      assert.equal(err, null);
      assert.equal(resp.statusCode, 403);
      done();
    });
  });

  // check we can't access a protected endpoint with bad password
  it('access denied with bad password', function(done) {
    var r = {
      method: 'get',
      url: badurl2 + '/mbaas/_all_docs'
    };
    request(r, function(err, resp, data) {
      assert.equal(err, null);
      assert.equal(resp.statusCode, 403);
      done();
    });
  });

  // check we can't access a protected endpoint with bad username
  it('access denied with bad username', function(done) {
    var r = {
      method: 'get',
      url: badurl3 + '/mbaas/_all_docs'
    };
    request(r, function(err, resp, data) {
      assert.equal(err, null);
      assert.equal(resp.statusCode, 403);
      done();
    });
  });

  // check we can't access a protected endpoint with empty username and password
  it('access denied with empty credentials', function(done) {
    var r = {
      method: 'get',
      url: badurl4 + '/mbaas/_all_docs'
    };
    request(r, function(err, resp, data) {
      assert.equal(err, null);
      assert.equal(resp.statusCode, 403);
      done();
    });
  });

});
