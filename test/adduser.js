'use strict';
/* globals testUtils */

var assert = require('assert'),
  auth = require('../lib/auth'),
  app = require('../app'),
  env = require('../lib/env'),
  remote = null;

describe('adduser', function () {
  
  before(function() {
    var e = env.getCredentials();
    remote = require('cloudant')('http://'+e.url);
  });

  it('add user successfully', function (done) {
    var username = testUtils.uniqueUsername();
    var password = 'password';
    var r = { 
      path: '_adduser', 
      method: 'post', 
      body: { 
        username: username,
        password: password
      }
    };
    remote.request(r, function (err, response) {
      assert(err == null);
      assert.equal(typeof response.warning, 'string');
      assert.equal(typeof response.ok, 'boolean');
      assert.equal(response.ok, true);
      assert.equal(typeof response.id, 'string');
      assert.equal(response.id, username);
      done();
    });
  });

  it('fail to add user - missing username', function (done) {
    var r = { 
      path: '_adduser', 
      method: 'post', 
      body: { 
        password: 'password'
      }
    };
    remote.request(r, function (err, response) {
      assert(err != null);
      done();
    });
  });


  it('fail to add user - missing password', function (done) {
    var r = { 
      path: '_adduser', 
      method: 'post', 
      body: { 
        username: testUtils.uniqueUsername()
      }
    };
    remote.request(r, function (err, response) {
      assert(err != null);
      done();
    });
  });

  it('duplicate user', function (done) {
    var username = testUtils.uniqueUsername();
    var r = { 
      path: '_adduser', 
      method: 'post', 
      body: { 
        username: username,
        password: 'password'
      }
    };
    remote.request(r, function (err, response) {
      assert.equal(err, null);
      remote.request(r, function(err, response) {
        assert(err != null);
        done();
      });
    });
  });

});
