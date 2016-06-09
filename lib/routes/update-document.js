'use strict';

var express = require('express'),
  router = express.Router(),
  app = require('../../app'),
  utils = require('../utils'),
  auth = require('../auth');

// Update a document
router.post('/:db/:id', auth.isAuthenticated, function(req, res) {

  // 1. Get the document from the db
  // 2. Validate that the user has access
  // 3. Write the doc with the auth information added back in,
  //  return the database response
  app.db.get(req.params.id, function(err, data) {
    if (err) {
      utils.sendError(err, res);
      return;
    }
        
    if (!utils.isMine(data, req.session.user.name)) {
      console.error('Unexpected doc: ', JSON.stringify(data, null, 4));
      return auth.unauthorized(res);
    }

    var doc = req.body;
    utils.addAuth(doc, req.session.user.name);
    // TODO - should we require the user to send the current _rev
    // also need to propagate 409 correctly
    doc._rev = data._rev;
    utils.writeDoc(app.db, doc, req, res);
  });
});

module.exports = router;
