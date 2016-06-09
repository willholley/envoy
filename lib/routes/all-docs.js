'use strict';

/*
  CouchDB 2 will support the filtering of _all_docs by id, but
  unfortunately at the time of writing this is not implemented
  correctly for dbnext, hence the heath-robinson solution below.
*/

var express = require('express'),
  router = express.Router(),
  app = require('../../app'),
  utils = require('../utils'),
  auth = require('../auth');

router.get('/:db/_all_docs', auth.isAuthenticated, function(req, res) {

  // force docs to be included
  // TODO strip these out from the response
  req.query.include_docs = true;
  
  if (req.query.keys) {
    req.query.keys = JSON.parse(req.query.keys);
    
    // hit the real all_docs
    app.db.list(req.query)
      .pipe(utils.liner())
      .pipe(utils.authRemover(req.session.user.name))
      .pipe(res);
      
  } else {
    
    // Don't allow selection by keys - get everything
    delete req.query.endkey;
    delete req.query.startkey;
    delete req.query.keys;
    delete req.query.key;
    
    // filter by userid
    req.query.key = req.session.user.name;
    
    app.db.view('auth','userdocs', req.query)
      .pipe(utils.liner())
      .pipe(utils.authRemover(req.session.user.name))
      .pipe(res);
  }
    
});

router.post('/:db/_all_docs', auth.isAuthenticated, function(req, res) {
 
  // force docs to be included
  // TODO strip these out from the response
  req.body.include_docs = true;
 
  if (req.query.keys) {
    req.query.keys = JSON.parse(req.query.keys);
    
    // hit the real all_docs
    app.db.fetch(req.query)
      .pipe(utils.liner())
      .pipe(utils.authRemover(req.session.user.name))
      .pipe(res);
      
  } else {
    // remove key level access
    delete req.query.endkey;
    delete req.query.startkey;
    delete req.query.keys;
    delete req.query.key;
    req.query.include_docs = true;
  
    // filter by userid
    req.query.key = req.session.user.name;
  
    app.db.view('auth','userdocs', req.body)
      .pipe(utils.liner())
      .pipe(utils.authRemover(req.session.user.name))
      .pipe(res);
  }
 
});

module.exports = router;
