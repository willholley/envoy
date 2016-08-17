'use strict';
/* globals testUtils */

var assert = require('assert'),
  app = require('../app'),
  auth = require('../lib/auth'),
  PouchDB = require('pouchdb'),
  chance = require('chance')();


describe('POST /all_docs', function () {
  var docCount = 5,
     docs = null,
     docs2 = null,
     url1 = null,
     url2 = null,
     res1 = null,
    remote = null, 
    remote2= null;

  before(function () {
    
    // create two users, one who has 5 docs, the other 10, in the
    // the same database. Ensure that each user gets only their own data
    docs = testUtils.makeDocs(docCount),
    docs2 = testUtils.makeDocs(docCount*2)

    return testUtils.createUser().then(function(remoteURL){
      remote = new PouchDB(remoteURL);
      url1 = remoteURL.replace(/\/[a-z0-9]+$/,'');
      return remote.bulkDocs(docs);
    }).then(function (response) {
      res1 = response;
      assert.equal(response.length, docCount, response);
      response.forEach(function (row) {
        assert(!row.error);
      });
      return testUtils.createUser();
    }).then(function(remoteURL2) {
      remote2 = new PouchDB(remoteURL2);
      url2 = remoteURL2.replace(/\/[a-z0-9]+$/,'');
      return remote2.bulkDocs(docs2);
    })
    
  });

  it('POST /db/_all_docs with no parameters', function(done) {
    var cloudant = require('cloudant')(url1);
    var r = {
      method: 'post',
      db: app.dbName,
      path: '_all_docs'
    }
    cloudant.request(r, function(err,data) {
      assert.equal(typeof data,'object');
      assert.equal(typeof data.rows,'object');
      assert.equal(data.rows.length,docCount);
      data.rows.forEach(function(row) {
        assert.equal(typeof row,'object');
        assert.equal(typeof row.id,'string');
        assert.equal(typeof row.key,'string');
        assert.equal(typeof row.value,'object');
        assert.equal(typeof row.doc, 'object');
        assert.equal(row.id, row.key);
      });
      done();
    });
  });
     
  it('POST /db/_all_docs with keys parameters', function (done) {

    var keys = [];
    res1.forEach(function (row) {
    keys.push(row.id);
    assert(!row.error);
    });

    var cloudant = require('cloudant')(url1);
    var r = {
    method: 'post',
    db: app.dbName,
    path: '_all_docs',
    body: { keys: keys}
    }
    cloudant.request(r, function(err, data) {
      assert.equal(err, null);
      assert.equal(typeof data,'object');
      assert.equal(typeof data.rows,'object');
      assert.equal(data.rows.length, docCount);
      data.rows.forEach(function(row) {
        assert.equal(typeof row,'object');
        assert.equal(typeof row.id,'string');
        assert.equal(typeof row.key,'string');
        assert.equal(typeof row.value,'object');
        assert.equal(row.id, row.key);
        assert.equal(typeof row.doc,'object');
      });
      done();
    });
  });
  
});