'use strict';

var basicAuth = require('basic-auth'),
  crypto = require('crypto'),
  app = require('../app');

function unauthorized(res) {
  res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
  return res.status(401).end();
}

// Authenticator - shared middleware
function auth(req, res, next) {
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
  app.cloudant.auth(user.name, user.pass, function(err, data) {
    if (!err && data) {
      req.session.user = data;
      return next();
    } else {
      return unauthorized(res);
    }
  });

}

function sha1(string) {
  return crypto.createHash('sha1').update(string).digest('hex');
}

module.exports = {
  isAuthenticated: auth,
  unauthorized: unauthorized,
  sha1: sha1
};
