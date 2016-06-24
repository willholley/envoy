'use strict';
/* globals testUtils */

var assert = require('assert'),
  auth = require('../lib/auth'),
  PouchDB = require('pouchdb'),
  app = require('../app'),
  uuid = require('uuid'),
  url1 = null,
  remoteURL = null,
  remoteRita = null,
  remoteBob = null;

describe('CRUD', function () {
  
  before(function() {
    return testUtils.createUser(2).then(function(urls){
      url1=urls[0].replace(/\/[a-z]+$/,'');
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
      assert.equal(typeof body.ok, 'boolean');
      assert(body.ok);
      assert.equal(typeof body.id, 'string');
      assert.equal(typeof body.rev, 'string');
      assert.equal(body.id, testid);
      done();
    });
  });

  // this test just exercises an 'if' in the code
  it('create with _id in body', function (done) {
    var testid = 'b9a568ff3ddba79a2d450e501fdac96e'
    var r = { 
      url: testid, 
      method: 'put', 
      body: { 
        _id: testid,
        hello: 'world'
      }
    };

    remoteBob.request(r, function (err, body) {
      done();
    });
  });

  it('create a _local documnent', function (done) {
    var testid = '_local/a'
    var r = { 
      url: testid, 
      method: 'put', 
      body: { 
        hello: 'world'
      }
    };
    remoteBob.request(r, function (err, body) {
      if (err) {
        assert(false);
      }
      remoteBob.get(testid, function(err, data) {
        assert.equal(typeof data, 'object');
        assert.equal(data._id, testid);
        assert.equal(data.hello, 'world');
        done();
      });
    });
  });

  // just to force Cloudant to throw an errors
  it('fail to add a _local documnent', function (done) {
    var testid = '_local/a'
    var r = { 
      url: testid, 
      method: 'put', 
      body: { 
        _bad: testid,
        hello: 'world'
      }
    };
    remoteBob.request(r, function (err, body) {
      if (body) {
        assert(false);
      }
      done();
    });
  });

  it('read non-existant _local documnent', function (done) {
    var testid = '_local/b'
    remoteBob.get(testid, function (err, body) {
      if (body) {
        assert(false);
      }
      done();
    });
  });

  // Create a document, and read it back. Usual caveats apply: 
  // this is normally A Bad Idea
  it('read', function (done) { 

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
        assert.equal(get._rev, post.rev);
        done();
      });
    });
  });


  // Make sure we get an error back for a missing document
  it('read 404', function (done) { 
    remoteBob.get('unknownid', function(err, get) {
      if (err) {
        assert(true);
        done();
      }
      assert(false);
    });
  });

  // Create a document, and then update it. Usual caveats apply: 
  // this is normally A Bad Idea
  it('update', function () { 

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
      assert(false);
    });
  });

  // Create a document, and then delete it. Usual caveats apply: 
  // this is normally A Bad Idea
  it('delete', function () { 

    return remoteBob.post({
      hello: 'world'
    }).then(function (create) {
      return remoteBob.remove({
        _id: create.id,
        _rev: create.rev
      })
    }).then(function (remove) {
      assert(remove.ok);
    }).catch(function (err) {
      assert(false);
    });
  });

  // User 1 creates a document. Verify that User 2 can't read it.
  it("users can not read each other's docs", function () { 

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
      assert.equal(expectedFailure.name, 'not_found');
    })
  });

  // User 1 creates a document. Verify that User 2 can't delete it.
  it("users can not delete each other's docs", function () { 

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
      assert.equal(expectedFailure.name, 'not_found');
    })
  });

  it("update a document with POST /db", function(done) {
    var cloudant = require('cloudant')(url1);
    var db = cloudant.db.use('mbaas');
    var doc = { a:1}

    db.insert(doc, function(err, data) {
      assert.equal(err, null);
      doc.b = 2;
      doc._id = data.id;
      doc._rev = data.rev;
      db.insert(doc, function(err, data) {
        assert.equal(err, null);
        done();
      });
    })
  });

  it("update a document with bad POST /db", function(done) {
    var cloudant = require('cloudant')(url1);
    var db = cloudant.db.use('mbaas');
    var doc = { _bad:1}

    db.insert(doc, function(err, data) {
      assert.equal(typeof data, 'undefined');
      assert.equal(typeof err, 'object');
      done();
    })
  });

  it("update a document with POST /db/:id and id in the body", function(done) {
    var request = require('request');
    var testid = 'newid';
    var url = url1 + '/mbaas/' + testid;
    var r = {
      method: 'post',
      url: url,
      body: {
        _id: testid,
        a: 1
      },
      json: true
    };
    request(r, function(err, resp, body) {
      assert.equal(resp.statusCode, 200);
      assert.equal(body.id, testid);
      done();
    })
  });

  //  // User 1 creates a document. Verify that User 2 can't update it.
  //  // This test is problematic due to eventual consistency issues
  // it("users can not update each other's docs", function () { 
  //   
  //   return remoteBob.request({ 
  //       url: uuid.v4(), 
  //       method: 'put', 
  //       body: { 
  //         hello: 'world'
  //       }
  //     }).then(function (bobdoc) {
  //     return remoteRita.request({ 
  //       url: bobdoc.id, 
  //       method: 'put', 
  //       body: { 
  //         _id: bobdoc.id,
  //         _rev: bobdoc.rev,
  //         hello: 'world2'
  //       }
  //     })
  //   }).then(function (thisIsBad) {
  //     console.log(thisIsBad);
  //     assert(false); // Rita updated Bob's doc
  //   }).catch(function (expectedFailure) {
  //     assert.equal(expectedFailure.name, 'conflict');
  //   })
  // });
  
});
