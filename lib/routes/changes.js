'use strict';

var express = require('express'),
  router = express.Router(),
  app = require('../../app'),
  auth = require('../auth'),
  access = require('../access'),
  utils = require('../utils'),
  stream = require('stream');

// _changes
router.get('/' + app.dbName + '/_changes', auth.isAuthenticated, function(req, res) {
  var query = req.query || {};
  if (query.filter) {
    return auth.unauthorized(res);
  }

  // if we know the sequence number when a user was created
  // then there's no need to get changes before that point
  if((typeof req.query.since === 'undefined' || req.query.since === '0') && req.session.user.seq) {
    req.query.since = req.session.user.seq;
  }

  // use Mango filtering https://github.com/apache/couchdb-couch/pull/162
  query.filter = '_selector';
  var prefix = access.addOwnerId('',req.session.user.name);
  var selector = { 
                   selector: { 
                     '_id':  { '$gt': prefix,
                               '$lt': prefix + 'z'
                             }
                   }
                 };

  // query filtered changes               
  app.cloudant.request( {
    db: app.dbName,
    path: '_changes',
    qs: query,
    method: 'POST',
    body: selector
  }).pipe(utils.liner())
    .pipe(access.authRemover())
    .pipe(res);

});

module.exports = router;
