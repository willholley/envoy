'use strict';
/* globals testUtils */

var assert = require('assert'),
  app = require('../app'),
  auth = require('../lib/auth'),
  PouchDB = require('pouchdb');

describe('bulk_get', function () {
  
  var remote = null;
  var url = null;
  var docCount = 5;
  var resp = null

  before(function () {
    var docs = testUtils.makeDocs(docCount);
    return testUtils.createUser().then(function(remoteURL){
      remote = new PouchDB(remoteURL);
      url = remoteURL.replace(/\/[a-z0-9]+$/,'');
      return remote.bulkDocs(docs);
    }).then(function(r) {
      resp = r;
    });
  });    

  it('GET /db/_bulk_get', function (done) {
    var cloudant = require('cloudant')(url);
    var r = {
      method: 'get',
      db: app.dbName,
      path: '_bulk_get'
    };
    cloudant.request(r, function(err, data) { 
      assert.equal(typeof err, 'object');
      assert.equal(err.statusCode, 405);
      assert.equal(err.error, 'method_not_allowed');
      assert.equal(err.reason, 'Only POST allowed');
      done();
    });
  });

  it('POST /db/_bulk_get with valid docs', function () {
    return remote.bulkGet({docs: resp}).then(function (response) {
      assert.equal(typeof response, 'object');
      assert.equal(typeof response.results, 'object');
      assert.equal(response.results.length, docCount);
      for(var i in response.results) {
        var doc = response.results[i].docs[0];
        assert.equal(response.results[i].id, resp[i].id);
        assert(doc.ok && doc.ok._id && doc.ok._id && doc.ok._rev);
        assert.equal(doc.ok._id, resp[i].id);
      }
    });
  });


  it('POST /db/_bulk_get with invalid docs', function () {
    // add some invalid ids
    for(var i = 0; i < docCount; i++) {
      resp.push({id: "a"+i, _rev: i+"-"+i*1000})
    }
    return remote.bulkGet({docs: resp}).then(function (response) {
      assert.equal(typeof response, 'object');
      assert.equal(typeof response.results, 'object');
      assert.equal(response.results.length, docCount*2);
      for(var i in response.results) {
        var doc = response.results[i].docs[0];
        assert.equal(response.results[i].id, resp[i].id);
        // if this is one of our invalid ids
        if (response.results[i].id.match(/^a[0-9]$/)) {
          assert.equal(typeof doc.error, 'object');
          assert.equal(doc.error.id, resp[i].id);
        } else {
          assert.equal(typeof doc.ok, 'object');
          assert.equal(doc.ok._id, resp[i].id);
        }
      }
    });
  });

  it('POST /db/_bulk_get with missing docs parameter', function () {
    return remote.bulkGet({}).then(function (response) {
      // we shouldn't get here
      assert(false);
    }).catch(function(e) {
      assert.equal(e.status, 400);
    });
  });

});
