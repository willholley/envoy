'use strict';

var express = require('express'),
	router = express.Router(),
	app = require('../../app'),
	utils = require('../utils'),
	auth = require('../auth');

router.get('/' + app.dbName , auth.isAuthenticated, function(req, res) {
  app.db.get('').pipe(res);
});

module.exports = router;
