var express = require('express'),
	router = express.Router(),
  crypto = require('crypto');

var sha1 = function(string) {
  return crypto.createHash('sha1').update(string).digest('hex');
};

// adds owner id to an a document id
// e.g. dog becomes glynn-dog
var addOwnerId = function(id, ownerid) {
  var match = id.match(/_local\/(.*)/);
  var hashownerid = sha1(ownerid);
  if (match) {
    var localid = match[1];
    return '_local/' + hashownerid + '-' + localid;
  } else {
    return hashownerid + '-' + id;
  }
};

// removes ownerid from a document id
// e.g. glynn-dog becomes dog
var removeOwnerId = function(id) {
  var match = id.match(/_local\/(.*)/);
  if (match) {
    var localid = match[1].replace(/^[^-]+\-/,'');
    return '_local/' + localid;
  } else {
    return id.replace(/^[^-]+\-/,''); 
  }
};

// determines whether a document id is owned by ownerid
var myId = function(id, ownerid) {
  var hashownerid = sha1(ownerid);
  return (id.indexOf(hashownerid + '-') === 0 || id.indexOf('_local/'+hashownerid+'-') ===0);
};

// determines whether a doc object is owned by ownerd
var isMine = function(doc, ownerid) {
  return (doc && doc._id && myId(doc._id, ownerid))
};

// strips a document of its ownership information
var strip = function(doc) {
  if (typeof doc === 'object' && doc._id) {
    doc._id = removeOwnerId(doc._id);    
  }
  if (typeof doc === 'object' && doc.id) {
    doc.id = removeOwnerId(doc.id);    
  }
  return doc;
};

// adds 
var addAuth = function(doc, ownerid) {
  if (doc._id) {
    doc._id = addOwnerId(doc._id, ownerid);
  }
  return doc;
};

// stream transformer that removes auth details from documents
var authRemover = require('./common/authremover.js')(myId, removeOwnerId);

module.exports = {
  addOwnerId: addOwnerId,
  removeOwnerId: removeOwnerId,
  myId: myId,
  isMine: isMine,
  strip: strip,
  addAuth: addAuth,
  authRemover: authRemover,
  routes: router
}