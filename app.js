'use strict';

module.exports = function(opts) {
  var express = require('express'), 
    fs = require('fs'),
    app = module.exports = express(),
    spdy = require('spdy'),
    compression = require('compression'),
    session = require('express-session'),
    Cloudant = require('cloudant'),
    bodyParser = require('body-parser'),
    async = require('async'),
    init = require('./lib/init'),
    events = require('events'),
    ee = new events.EventEmitter(),
    auth = require('./lib/auth'),
    morgan = require('morgan'),
    cors = require('./lib/cors'); 

  // Required environment variables
  app.opts = require('./lib/env').getCredentials(opts);

  var cloudant = new Cloudant(app.opts.couchHost),
    dbName = app.dbName = app.opts.databaseName;

  app.db = cloudant.db.use(dbName);
  app.usersdb = cloudant.db.use('_users');
  app.metaKey = 'com_cloudant_meta';
  app.events = ee;
  app.cloudant = cloudant;
  app.serverURL = app.opts.couchHost;
  app.auth = auth;

  // session support
  if (opts && opts.sessionHandler) {
    app.use(opts.sessionHandler)
  } else {
    console.log('[OK]  Using default session handler');
    app.use(session({ 
      secret: app.metaKey,
      resave: true,
      saveUninitialized: true
    }));
  }
  
  // Setup the logging format
  if (app.opts.logFormat !== 'off') {
    app.use(morgan(app.opts.logFormat));
  }

  function main() {
    
    // plug in custom routes
    if (app.opts.router) {
      app.use(app.opts.router);
    }

    var production = (app.opts.production && app.opts.production === 'true');
    if (app.opts.static) {
      console.log('[OK]  Serving out directory: ' + app.opts.static);
      app.use('/', express.static(app.opts.static)); 
    } else if (!production) {
      // setup static public directory
      app.use(express.static(__dirname + '/public')); 
    } 

    // enable cors
    app.use(cors());   
    
    // gzip responses
    app.use(compression());
    
    app.use(bodyParser.json({ limit: '50mb'}));
    app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));

    // load the routes
    var router = require('./lib/routes/index');
    app.use('/', router);

    // Catch unknown paths
    app.use(function(req, res, next) {
      res.status(400).send({error: 'bad_request', reason: 'unknown path'})
    });

    // Error handlers
    app.use(function(err, req, res, next) {
      console.error(err.stack);
      res.status(500).send('Something broke!');
    });

    var options = {
      key: fs.readFileSync('./key.pem'),
      cert: fs.readFileSync('./server.crt')
    };
    spdy.createServer(options, app)
      .listen(app.opts.port);
  }

  // Make sure that any init stuff is executed before
  // kicking off the app.
  async.series(
    [
      init.verifyDB,
      init.verifyBulkGet,
      init.verifySecurityDoc,
      init.installSystemViews,
      auth.init
    ],

    function (err, results) {
      for (var result in results) {
        if (results[result]) {
          console.log(results[result]);
        }
      }

      if (err != null) {
        process.exit(1);
      }

      main();

      ee.emit('listening');
      console.log('[OK]  main: Started app on', app.opts.url);
    }
  );

  require("cf-deployment-tracker-client").track();

  return app;
};


