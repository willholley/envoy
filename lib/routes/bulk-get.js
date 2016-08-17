'use strict';

// NOTE: The _bulk_get end point does not return its results line-by-line
// as e.g. _changes.
//
// NOTE: The response format is convoluted, and seemingly undocumented.
//
//  "results": [
// {
//   "id": "1c43dd76fee5036c0cb360648301a710",
//   "docs": [
//     {
//       "ok": { ..doc body here...
//
//         }
//       }
//     }
//   ]
// },
//
// Not sure if the "docs" array can ever contain multiple items.

var express = require('express'),
  router = express.Router(),
  app = require('../../app'),
  auth = require('../auth'),
  access = require('../access'),
  utils = require('../utils');

// Pouch does this to check it exists
router.get('/' + app.dbName + '/_bulk_get', auth.isAuthenticated, function(req, res) {
  app.cloudant.request({
    db: app.dbName,
    qs: req.query || {},
    path: '_bulk_get'
  }).pipe(res);
});

router.post('/' + app.dbName + '/_bulk_get', auth.isAuthenticated, function(req, res) {
  // add ownerids to incoming ids
  if (req.body && req.body.docs) {
    req.body.docs = req.body.docs.map(function(doc) {
      doc.id = access.addOwnerId(doc.id, req.session.user.name);
      return doc;
    });
  }
  app.cloudant.request({
    db: app.dbName,
    qs: req.query || {},
    path: '_bulk_get',
    method: 'POST',
    body: req.body
  }, function (err, data) {
    if (err) {
      return utils.sendError(err, res);
    }
    res.send({ results: data.results.map(function (row) {
      var stripped = Object.assign({}, row);
      stripped.id = access.removeOwnerId(stripped.id);
      stripped.docs.forEach(function (item) {
        if (item.ok) {
          access.strip(item.ok);
        }
        if (item.error) {
          access.strip(item.error);
        }  
      });        
      return stripped;
    })});
  });
});

module.exports = router;