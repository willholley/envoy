'use strict';

var express = require('express'),
  router = express.Router(),
  app = require('../../app'),
  utils = require('../utils'),
  auth = require('../auth');

router.get('/:db/:id', auth.isAuthenticated, function(req, res) {
  // 1. Get the document from the db
  // 2. Validate that the user has access
  // 3. return the document with the auth information stripped out
  app.db.get(req.params.id, function(err, data) {
    if (err) {
      utils.sendError(err, res);
      return;
    }

    if (!utils.isMine(data, req.session.user.name)) {
      return auth.unauthorized(res);
    }
    
    utils.stripAndSendJSON(data, res);
  });
});

module.exports = router;
