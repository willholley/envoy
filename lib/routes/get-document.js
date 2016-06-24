'use strict';

var express = require('express'),
  router = express.Router(),
  app = require('../../app'),
  access = require('../access'),
  utils = require('../utils'),
  auth = require('../auth');

router.get('/:db/:id', auth.isAuthenticated, function(req, res) {
  // 1. Get the document from the db
  // 2. Validate that the user has access
  // 3. return the document with the auth information stripped out
  var id = access.addOwnerId(req.params.id, req.session.user.name);
  app.db.get(id, function(err, data) {
    if (err) {
      return utils.sendError(err, res);
    }
    res.send(access.strip(data));
  });
});

module.exports = router;
