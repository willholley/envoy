'use strict';

var express = require('express'),
  app = require('../../app.js'),
	router = express.Router();

var auth = require('../auth');
if (auth.routes) {
  router.use(auth.routes);
}

var access = require('../access');
if (access.routes) {
  router.use(access.routes);
}
console.log(app.opts);
if (app.opts.production === false) {
  router.use(require('./post-adduser'));
}

router.use(require('./post-index'));
router.use(require('./find.js'));
router.use(require('./all-docs'));
router.use(require('./bulk-get'));
router.use(require('./local'));
router.use(require('./get-root'));
router.use(require('./get-database'));
router.use(require('./revs-diff'));
router.use(require('./bulk-docs'));
router.use(require('./changes'));
router.use(require('./delete-document'));
router.use(require('./get-document'));
router.use(require('./insert-document'));
router.use(require('./update-document'));


module.exports = router;
