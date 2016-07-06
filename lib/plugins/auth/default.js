'use strict';

var basicAuth = require('basic-auth'),
  crypto = require('crypto'),
  uuid = require('uuid'),
  USERS_DATABASE_NAME = 'envoyusers',
  app = require('../../../app'),
  express = require('express'),
  router = express.Router(),
  usersdb = null;

// create envoyusers database if it doesn't exist already
// called at startup
var init = function(callback) {
  usersdb = app.cloudant.db.use(USERS_DATABASE_NAME);

  app.cloudant.db.get(USERS_DATABASE_NAME, function(err, body, header) {
    if ((err && err.statusCode === 404)) {
      // 404 response == DB doesn't exist, try to create it
      app.cloudant.db.create(USERS_DATABASE_NAME, function(err, body, header) {
        if (err && err.statusCode !== 412) {
          // 412 response == already exists, maybe the DB got created between checking and creating?
          // any other error response, bail out 
          return callback(err, '[ERR] createUsersDB: please log into your CouchDB Dashboard and create a new database called ' + USERS_DATABASE_NAME + ".");
        } else if (!err &&  header.statusCode === 201) {
          // 201 response == created, we can start
          callback(null, '[OK]  Created users database: ' + USERS_DATABASE_NAME);
        }
      });
    } else if ((err && err.statusCode === 403)) {
      // 403 response == something's up with permissions
      return callback(err, '[ERR] createUsersDB: please ensure API key and/or database permissions are correct for  ' + USERS_DATABASE_NAME + " (403 Forbidden).")
    } else if (!err && header.statusCode === 200) {
      // 200 response == database found, we can start
      callback(null, '[OK]  Users database already exists: ' + USERS_DATABASE_NAME);        
    }
  });  
};

// returns the sha1 of a string
var sha1 = function(string) {
  return crypto.createHash('sha1').update(string).digest('hex');
};

// create a new user - this function is used by the 
// test suite to generate a new user. Our envoyusers database
// follows a similar pattern to the CouchDB _users database
// but we perform the salt/hash process here
var newUser = function(username, password, callback) {
  var salt = uuid.v4();
  var user = {
    _id: username,
    type: 'user',
    name: username,
    roles: [],
    username: username,
    password_scheme: 'simple',
    salt: salt,
    password: sha1(salt + password)
  };
  return usersdb.insert(user, callback);
};

// Express middleware that is the gatekeeper for whether a request is
// allowed to proceed or not. It checks with Cloudant to see if the 
// supplied Basic Auth credentials are correct and issues a session cookie
// if they are. The next request (with a valid cookie), doesn't need to
// hit the users database
var isAuthenticated = function (req, res, next) {
  // if the user has valid session then we're good to go
  // without hitting the _users database again
  if (req.session.user) {
    return next();
  }
  
  // extract basic auth
  var user = basicAuth(req);
  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  }
  
  // validate user and save to session
  usersdb.get(user.name, function(err, data) {
    if (!data || data.password !== sha1(data.salt + user.pass)) {
      return unauthorized(res);
    } else {
      req.session.user = data;
      return next();
    }
  });
};

// the response to requests which are not authorised
var unauthorized = function(res) {
  return res.status(403).end();
};

// allow clients to see if they are logged in or not
router.get('/_auth', isAuthenticated, function(req, res) {
  res.send({ 
    loggedin: req.session.user?true:false,
    username: req.session.user?req.session.user.name:null
  });
});

// and to log out
router.get('/_logout', function(req, res) {
  delete req.session.user;
  res.send({ok: true});
});

module.exports = {
  init: init,
  newUser: newUser,
  isAuthenticated: isAuthenticated,
  unauthorized: unauthorized,
  routes: router
};
