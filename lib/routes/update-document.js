'use strict';

var express = require('express'),
  router = express.Router(),
  app = require('../../app'),
  access = require('../access'),
  utils = require('../utils'),
  auth = require('../auth');

// Update a document
router.post('/:db/:id', auth.isAuthenticated, function(req, res) {

  // 1. Get the document from the db
  // 2. Validate that the user has access
  // 3. Write the doc with the auth information added back in,
  //  return the database response
  var id = access.addOwnerId(req.params.id, req.session.user.name);
  app.db.insert(req.body, id, function(err, body) {
    if (err) {
      return utils.sendError(err, res);
    } 
    res.send(access.strip(body));
  });
});

module.exports = router;
