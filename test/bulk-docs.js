'use strict';
/* globals testUtils */

var assert = require('assert'),
  auth = require('../lib/auth'),
  PouchDB = require('pouchdb'),
  chance = require('chance')();

describe('bulk_docs', function () {
  it('bulk_docs with server assigned ids', function () {
    this.timeout(10000);
    var docCount = 5,
      docs = testUtils.makeDocs(docCount),
      remote = null;
      
    return testUtils.createUser().then(function(remoteURL){
      remote = new PouchDB(remoteURL);
      return remote.bulkDocs(docs);
    }).then(function (response) {
      assert.equal(response.length, docCount, response);
      response.forEach(function (row) {
        assert(!row.error);
      });

      // ensure we can retrieve what we inserted
      return remote.get(response[0].id);
    }).then(function (doc) {
      assert(doc._id);
    });
  });

  it('bulk_docs with user assigned ids', function () {
    this.timeout(10000);
    var docCount = 2;
    var docs = testUtils.makeDocs(docCount),
      remote = null;

    docs[0]._id = chance.guid();
    docs[1]._id = chance.guid();

    return testUtils.createUser().then(function(remoteURL){
      remote = new PouchDB(remoteURL);
      return remote.bulkDocs(docs);
    }).then(function (response) {
      assert.equal(response.length, docCount, response);
      response.forEach(function (row) {
        assert(!row.error);
      });

      // ensure we can retrieve what we inserted
      return remote.get(docs[0]._id);
    }).then(function (doc) {
      assert(doc._id);
    });
  });

  it('bulk_docs with both user and server assigned ids', function () {
    this.timeout(10000);
    var docCount = 2;
    var docs = testUtils.makeDocs(docCount),
    remote = null;

    docs[0]._id = chance.guid();

    return testUtils.createUser().then(function(remoteURL){
      remote = new PouchDB(remoteURL);
      return remote.bulkDocs(docs);
    }).then(function (response) {
      assert.equal(response.length, docCount, response);
      response.forEach(function (row) {
        assert(!row.error);
      });
    });
  });
 
});
