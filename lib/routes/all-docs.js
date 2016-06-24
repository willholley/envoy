'use strict';

/*
  CouchDB 2 will support the filtering of _all_docs by id, but
  unfortunately at the time of writing this is not implemented
  correctly for dbnext, hence the heath-robinson solution below.
*/

var express = require('express'),
  router = express.Router(),
  app = require('../../app'),
  access = require('../access'),
  utils = require('../utils'),
  auth = require('../auth');
  
// use startkey and endkey to get all a user's docs
var getSelector = function(ownerid, query) {
  delete query.keys;
  delete query.key;
  query.startkey = access.addOwnerId('',ownerid);
  query.endkey = query.startkey.replace('-','z');
  query.descending = false;
  return query;
};

router.get('/:db/_all_docs', auth.isAuthenticated, function(req, res) {
  
  if (req.query.keys) {
    
    // add ownerid to requested ids
    req.query.keys = JSON.parse(req.query.keys);
    req.query.keys = req.query.keys.map(function(id) {
      return access.addOwnerId(id, req.session.user.name);
    });

    // return only the keys asked for
    app.db.list(req.query)
      .pipe(utils.liner())
      .pipe(access.authRemover(req.session.user.name))
      .pipe(res);
      
  } else {
    
    // use the primary index for range selection
    var selector = getSelector(req.session.user.name, req.query);
    app.db.list(selector)
      .pipe(utils.liner())
      .pipe(access.authRemover(req.session.user.name))
      .pipe(res);
  }
    
});

router.post('/:db/_all_docs', auth.isAuthenticated, function(req, res) {

  if (req.body.keys) {

    // add ownerid to requested ids
    var body = {};
    body.keys = req.body.keys.map(function(id) {
      return access.addOwnerId(id, req.session.user.name);
    });
    
    // return only the keys asked for
    app.db.fetch(body, req.query)
      .pipe(utils.liner())
      .pipe(access.authRemover(req.session.user.name))
      .pipe(res);
      
  } else {
    
    // use the primary index for range selection
    var selector = getSelector(req.session.user.name, req.body);
    app.db.fetch(selector, req.query)
      .pipe(utils.liner())
      .pipe(access.authRemover(req.session.user.name))
      .pipe(res);
  }
 
});

module.exports = router;
