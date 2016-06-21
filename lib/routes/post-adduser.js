'use strict';

var express = require('express'),
  router = express.Router(),
  auth = require('../auth');

// warning message;
var warning = '[WARNING] POST /_adduser is enabled. This is recommended for testing only.';
warning += ' It can be disabled by setting env variable PRODUCTION=true';

// warning
console.log(warning);

// Beginners API call to allow users to be created
router.post('/_adduser', function(req, res) {
  
  // warning message
  console.error(warning);

  // missing parameters
  if (!req.body.username || !req.body.password) {
    return res.status(400).send({ok:false, error: 'username and password are mandatory'});
  }

  // Authenticate the documents requested
  auth.newUser(req.body.username, req.body.password, function(err, data) {
    if (err) {
      return res.status(401).send(err);
    } 
    data.warning = warning;
    res.send(data);
  });

});

module.exports = router;
