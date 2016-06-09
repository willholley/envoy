'use strict';
/* globals testUtils */

var assert = require('assert'),
  auth = require('../lib/auth'),
  PouchDB = require('pouchdb'),
  chance = require('chance')();

describe('all_docs', function () {
  it('GET /db/_all_docs with no parameters', function () {
    
    // create two users, one who has 5 docs, the other 10, in the
    // the same database. Ensure that each user gets only their own data
    this.timeout(10000);
    var docCount = 5,
      docs = testUtils.makeDocs(docCount),
      docs2 = testUtils.makeDocs(docCount*2),
      remote = null,
      remote2 = null;
      
    return testUtils.createUser().then(function(remoteURL){
      remote = new PouchDB(remoteURL);
      return remote.bulkDocs(docs);
    }).then(function (response) {
      assert.equal(response.length, docCount, response);
      response.forEach(function (row) {
        assert(!row.error);
      });

      return testUtils.createUser();
        
        
    }).then(function(remoteURL2) {
      remote2 = new PouchDB(remoteURL2);
      return remote2.bulkDocs(docs2);
    }).then(function(response) {
      
      // ensure we can retrieve what we inserted
      return remote.allDocs();
    }).then(function (data) {
      assert.equal(typeof data,'object');
      assert.equal(typeof data.rows,'object');
      assert.equal(data.rows.length,docCount);
      data.rows.forEach(function(row) {
        assert.equal(typeof row,'object');
        assert.equal(typeof row.id,'string');
        assert.equal(typeof row.key,'string');
        assert.equal(typeof row.value,'object');
        assert.equal(row.id, row.key);
        assert.equal(typeof row.doc,'object');
      });
      return remote2.allDocs();
    }).then(function(data) {
      assert.equal(typeof data,'object');
      assert.equal(typeof data.rows,'object');
      assert.equal(data.rows.length,docCount*2);
      data.rows.forEach(function(row) {
        assert.equal(typeof row,'object');
        assert.equal(typeof row.id,'string');
        assert.equal(typeof row.key,'string');
        assert.equal(typeof row.value,'object');
        assert.equal(row.id, row.key);
        assert.equal(typeof row.doc,'object');
      });        
    })
  });
  
  it('GET /db/_all_docs with keys parameters', function () {
    this.timeout(10000);
    var docCount = 5,
      docs = testUtils.makeDocs(docCount),
      remote = null;
      
    return testUtils.createUser().then(function(remoteURL){
      remote = new PouchDB(remoteURL);
      return remote.bulkDocs(docs);
    }).then(function (response) {
      assert.equal(response.length, docCount, response);
      var keys = [];
      response.forEach(function (row) {
        keys.push(row.id);
        assert(!row.error);
      });
      
      // remove first two items from keys
      // we want to only ask for 3 docs
      keys.splice(0,2);
      
      // ensure we can retrieve what we inserted
      return remote.allDocs({keys: keys});
    }).then(function (data) {
      assert.equal(typeof data,'object');
      assert.equal(typeof data.rows,'object');
      assert.equal(data.rows.length, docCount - 2);
      data.rows.forEach(function(row) {
        assert.equal(typeof row,'object');
        assert.equal(typeof row.id,'string');
        assert.equal(typeof row.key,'string');
        assert.equal(typeof row.value,'object');
        assert.equal(row.id, row.key);
        assert.equal(typeof row.doc,'object');
      });
    });
  });

});

