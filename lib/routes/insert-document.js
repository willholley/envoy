'use strict';

var express = require('express'),
  router = express.Router(),
  app = require('../../app'),
  access = require('../access'),
  utils = require('../utils'),
  auth = require('../auth');

// Insert (or update) a document

router.put('/' + app.dbName + '/:id', auth.isAuthenticated, function(req, res) {
  var id = access.addOwnerId(req.params.id, req.session.user.name);
  if (req.body._id) { // In case the body contains an _id, we need to tweak that, too.
    req.body._id = access.addOwnerId(req.body._id, req.session.user.name);
  }
  app.db.insert(req.body, id, function(err, body) {
    if (err) {
      return utils.sendError(err, res);
    } 
    res.send(access.strip(body));
  });
});

module.exports = router;
