'use strict';

var express = require('express'),
	router = express.Router(),
	app = require('../../app'),
  access = require('../access'),
	utils = require('../utils'),
	auth = require('../auth');

// Insert a document
router.put('/:db/:id', auth.isAuthenticated, function(req, res) {

  // 1. Read the new doc
  // 2. Add auth information, user has access
  // 3. Write the doc, return the database response
  var id = access.addOwnerId(req.params.id, req.session.user.name);
  app.db.insert(req.body, id, function(err, body) {
    if (err) {
      return utils.sendError(err, res);
    } 
    res.send(access.strip(body));
  });
});

module.exports = router;
