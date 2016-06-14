'use strict';
/* globals testUtils */

var assert = require('assert'),
  auth = require('../lib/auth'),
  PouchDB = require('pouchdb'),
  app = require('../app'),
  remoteURL = null,
  remoteRita = null,
  remoteBob = null;

describe('CRUD', function () {
  
  before(function() {
    return testUtils.createUser(2).then(function(urls){
      remoteBob = new PouchDB(urls[0]);
      remoteRita = new PouchDB(urls[1]);      
    });
  });
  
  it('create', function (done) {
    var testid = 'b9a568ff3ddba79a2d450e501fdac96e'
    var r = { 
      url: testid, 
      method: 'put', 
      body: { 
        hello: 'world'
      }
    };

    remoteBob.request(r, function (err, body) {
      assert(err == null);
      assert(typeof body.ok === 'boolean');
      assert(body.ok);
      assert(typeof body.id === 'string');
      assert(typeof body.rev === 'string');
      assert(body.id === testid);
      done();
    });
  });

  // Create a document, and read it back. Usual caveats apply: 
  // this is normally A Bad Idea
  it('read', function (done) { 
    this.timeout(20000);
    remoteBob.post({hello: 'world'}, function(err, post) {
      if (err) {
        assert(false);
        done();
      }
      remoteBob.get(post.id, function(err, get) {
        if (err) {
          assert(false);
          done();
        }
        assert(get._rev === post.rev);
        done();
      });
    });
  });


  // Create a document, and then update it. Usual caveats apply: 
  // this is normally A Bad Idea
  it('update', function () { 
    this.timeout(20000);
    return remoteBob.post({
      hello: 'world'
    }).then(function (create) {
      return remoteBob.put({
        _id: create.id,
        _rev: create.rev,
        hello: 'world2'
      })
    }).then(function (update) {
      assert(update.rev.startsWith('2-'));
    }).catch(function (err) {
      console.log(err);
      assert(false);
    });
  });

  // Create a document, and then delete it. Usual caveats apply: 
  // this is normally A Bad Idea
  it('delete', function () { 
    this.timeout(20000);
    return remoteBob.post({
      hello: 'world'
    }).then(function (create) {
      return remoteBob.remove({
        _id: create.id,
        _rev: create.rev
      })
    }).then(function (remove) {
      assert(remove.ok === true);
    }).catch(function (err) {
      console.log(err);
      assert(false);
    });
  });

  // User 1 creates a document. Verify that User 2 can't read it.
  it("users can not read each other's docs", function () { 
    this.timeout(20000);
    return remoteBob.post({
      hello: 'world'
    }).then(function (bobdoc) {
      return remoteRita.get({
        _id: bobdoc.id,
        _rev: bobdoc.rev
      })
    }).then(function (thisIsBad) { 
      assert(false); // Rita saw bob's doc
    }).catch(function (expectedFailure) {
      assert(expectedFailure.name === 'not_found');
    })
  });

  // User 1 creates a document. Verify that User 2 can't delete it.
  it("users can not delete each other's docs", function () { 
    this.timeout(20000);
    return remoteBob.post({
      hello: 'world'
    }).then(function (bobdoc) {
      return remoteRita.remove({
        _id: bobdoc.id,
        _rev: bobdoc.rev
      })
    }).then(function (thisIsBad) {
      assert(false); // Rita deleted Bob's doc
    }).catch(function (expectedFailure) {
      assert(expectedFailure.name === 'unknown_error');
    })
  });

   // User 1 creates a document. Verify that User 2 can't update it.
  it("users can not update each other's docs", function () { 
    this.timeout(20000);
    return remoteBob.post({
      hello: 'world'
    }).then(function (bobdoc) {
      return remoteRita.put({
        _id: bobdoc.id,
        _rev: bobdoc.rev,
        hello: 'world2'
      })
    }).then(function (thisIsBad) {
      assert(false); // Rita updated Bob's doc
    }).catch(function (expectedFailure) {
      assert(expectedFailure.name === 'forbidden');
    })
  });
  
});
