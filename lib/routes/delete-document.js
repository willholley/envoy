'use strict';

var express = require('express'),
  router = express.Router(),
  app = require('../../app'),
  access = require('../access'),
  utils = require('../utils'),
  auth = require('../auth');

// Delete a document
router.delete('/:db/:id', auth.isAuthenticated, function(req, res) {
  var id = access.addOwnerId(req.params.id, req.session.user.name);    
  app.db.destroy(id, req.query.rev,
    function(err, data) {
      if (err) {
        utils.sendError(err, res);
        return;
      }
      res.send(access.strip(data));
    }
  );
});

module.exports = router;
