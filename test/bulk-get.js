'use strict';
/* globals testUtils */

var assert = require('assert'),
  auth = require('../lib/auth'),
  PouchDB = require('pouchdb');

describe('bulk_get', function () {
  it('bulk_get_1', function () {
    this.timeout(10000);
    var docCount = 5;
    var docs = testUtils.makeDocs(docCount),
      remote = null;

    return testUtils.createUser().then(function(remoteURL){
        remote = new PouchDB(remoteURL);
        return remote.bulkDocs(docs);
    }).then(function (response) {
      return remote.bulkGet({docs: response});
    }).then(function (response) {
      assert.equal(typeof response, 'object');
      assert.equal(typeof response.results, 'object');
      assert.equal(response.results.length, docCount);
      response.results.forEach(function (row) {
        var doc = row.docs[0];
        assert(doc.ok && doc.ok._id && doc.ok._id && doc.ok._rev);
      });
    });
  });
});
