'use strict';

var express = require('express'),
  router = express.Router(),
  auth = require('../auth'),
  access = require('../access'),
  app = require('../../app');

router.get('/:db/_local/:key',  auth.isAuthenticated, function(req, res) {
  app.cloudant.request({
    db: app.dbName,
    path: access.addOwnerId('_local/' + req.params.key, req.session.user.name)
  }).pipe(res);
});

router.post('/:db/_local/:key',  auth.isAuthenticated, function(req, res) {
  app.cloudant.request({
    db: app.dbName,
    path: access.addOwnerId('_local/' + req.params.key, req.session.user.name),
    method: 'POST',
    body: req.body
  }).pipe(res);
});

module.exports = router;
