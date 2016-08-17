'use strict';

var express = require('express'),
  router = express.Router(),
  auth = require('../auth'),
  utils = require('../utils'),  
  access = require('../access'),
  app = require('../../app');

router.get('/' + app.dbName + '/_local/:key',  auth.isAuthenticated, function(req, res) {
  app.cloudant.request({
    db: app.dbName,
    path: access.addOwnerId('_local/' + req.params.key, req.session.user.name)
  }, function(err, data) {
    if (err) {
      return utils.sendError(err, res);
    }
    res.send(access.strip(data));
  });;
});

router.put('/' + app.dbName + '/_local/:key',  auth.isAuthenticated, function(req, res) {
  app.cloudant.request({
    db: app.dbName,
    path: access.addOwnerId('_local/' + req.params.key, req.session.user.name),
    method: 'PUT',
    body: req.body
  }, function(err, data) {
    if (err) {
      return utils.sendError(err, res);
    }
    res.send(access.strip(data));
  });
});

module.exports = router;
