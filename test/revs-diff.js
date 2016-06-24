'use strict';
/* globals testUtils */

var assert = require('assert'),
  auth = require('../lib/auth'),
  chance = require('chance')(),
  PouchDB = require('pouchdb');

describe('revsDiff', function () {
  it('single user', function () {

    var docCount = 1,
      docs = testUtils.makeDocs(docCount),
      remote = null,
      fakeid = chance.guid(),
      fakerev = '1-f5cecfc5e2d5ea3e8b254e21d990fa7c';

    return testUtils.createUser().then(function(remoteURL){
      remote = new PouchDB(remoteURL);
      return remote.bulkDocs(docs);
    }).then(function (response) {
      var newDoc = testUtils.makeDocs(1)[0];
      newDoc._id = response[0].id;
      newDoc._rev = response[0].rev;
      return remote.put(newDoc);
    }).then(function (response) {
      var payload = {};
      payload[fakeid] = [fakerev];
      payload[response.id] = [response.rev];
      return remote.revsDiff(payload);
    }).then(function (response) {

      // id present
      assert(response[fakeid]);

      // single id
      assert.equal(Object.keys(response).length, 1,
        'Revsdiff listing should have a single entry');

      // rev present
      assert.equal(response[fakeid].missing.indexOf(fakerev), 0,
        'Revision should be present');

      // single revision
      assert.equal(response[fakeid].missing.length, 1,
        'Single revision');
    });
  });

  it('multiple users', function () {

    var docCount = 1,
      docs = testUtils.makeDocs(docCount),
      docs2 = testUtils.makeDocs(docCount),
      remote = null,
      remote2 = null,
      fakeid = chance.guid(),
      fakerev = '1-45cecfc5e2d5ea3e8b254f21d990fa7a';

    return testUtils.createUser().then(function(remoteURL){
      remote = new PouchDB(remoteURL);
      return testUtils.createUser();
    }).then(function(remoteURL2){
      remote2 = new PouchDB(remoteURL2);
      return remote2.bulkDocs(docs2);
    }).then(function() {
      return remote.bulkDocs(docs)
    }).then(function (response) {
      var newDoc = testUtils.makeDocs(1)[0];
      newDoc._id = response[0].id;
      newDoc._rev = response[0].rev;
      return remote.put(newDoc);
    }).then(function (response) {
      var payload = {};
      payload[fakeid] = [fakerev];
      payload[response.id] = [response.rev];
      return remote.revsDiff(payload);
    }).then(function (response) {

      // id present
      assert(response[fakeid]);

      // single id
      assert.equal(Object.keys(response).length, 1,
        'Revsdiff listing should have a single entry');

      // rev present
      assert.equal(response[fakeid].missing.indexOf(fakerev), 0,
        'Revision should be present');

      // single revision
      assert.equal(response[fakeid].missing.length, 1,
        'Single revision');
    }).catch(function(x) {
      console.log("X",x);
    });;
  });

  it('bad revs_diff request user', function (done) {
    testUtils.createUser().then(function(remoteURL){
      var request = require('request');
      var r = {
        url: remoteURL + '/_revs_diff',
        method: 'post',
        body:{docs:{}},
        json:true
      };
      request(r, function(err, resp, body) {
        assert.equal(resp.statusCode, 500);
        done();
      });
    });
  });
});
