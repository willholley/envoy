'use strict';
var express = require('express');
var basicAuth = require('basic-auth');
var Cloudant = require('cloudant');

var app = express();

var cloudant = new Cloudant({
    account: 'drsm79',
    key: 'sirithercenstationsuctio',
    password: '76f1139b4da550e120e2735831b8c69f301cf87b'
});


// Authenticator
function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.send(401);
}

var auth = function (req, res, next) {
  var user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  }
  // Call into for realz auth here
  if (user.name === 'foo' && user.pass === 'bar') {
    return next();
  } else {
    return unauthorized(res);
  }
};

// Demo function, not something to keep for a long time...
app.get('/', function(req, res) {
    res.header('Content-Type', 'text/html');
    res.write('<li><a href="/c3065e59c9fa54cc81b5623fa0610544">doc1</a></li>');
    res.write('<li><a href="/c3065e59c9fa54cc81b5623fa06902f0">doc2</a></li>');
    res.end();
});

var db = cloudant.db.use('mbaas');

var stripAndSendJSON = function(data, res){
    delete data['com.cloudant.meta'];
    res.json(data);
};

app.get('/:id', auth, function(req, res) {
    // 1. Get the document from the db
    // 2. Validate that the user has access
    // 3. return the document with the auth information stripped out
    db.get(req.params.id, function(err, data) {
        console.log(err);
        console.log(data['com.cloudant.meta']);
        var user = basicAuth(req);
        var auth = data['com.cloudant.meta'].auth;
        if (auth.users.indexOf(user.name) >= 0) {
            stripAndSendJSON(data, res);
        } else {
            return unauthorized(res);
        }
    });
});

// Update a document
app.post('/:id', auth, function(req, res) {
    // 1. Get the document from the db
    // 2. Validate that the user has access
    // 3. Write the doc with the auth information added back in, return the database response
});

// Insert a document
app.put('/', auth, function(req, res) {
    // 1. Read the new doc
    // 2. Add auth information, user has access
    // 3. Write the doc, return the database response
});

// TODO: API endpoint for setting permissions on a doc

app.listen(process.env.PORT || 8080);
