'use strict';

var express = require('express'),
  router = express.Router(),
  app = require('../../app'),
  utils = require('../utils'),
  auth = require('../auth');

// Delete a document
router.delete('/:db/:id', auth.isAuthenticated, function(req, res) {
  app.db.get(req.params.id, req.query.rev, function(err, data) {
    // We need a rev in order to delete
    if (!req.query.rev) {
      res.status(409).send({
        error: 'conflict',
        reason: 'Document update conflict.'
      });
      return;
    }
    if (err) {
      utils.sendError(err, res);
      return;
    }

    if (!utils.isMine(data, req.session.user.name)) {
      return auth.unauthorized(res);
    }
    
    app.db.destroy(req.params.id, req.query.rev,
      function(err, data) {
        if (err) {
          utils.sendError(err, res);
          return;
        }
        utils.stripAndSendJSON(data, res);
      }
    );
  });
});

module.exports = router;
