var stream = require('stream');

// adds owner id to an a document id
// e.g. dog becomes glynn-dog
var addOwnerId = function(id, ownerid) {
  var match = id.match(/_local\/(.*)/);
  if (match) {
    var localid = match[1];
    return '_local/' + ownerid + '-' + localid;
  } else {
    return ownerid + '-' + id;
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
  return (id.indexOf(ownerid + '-') === 0);
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
  doc._id = addOwnerId(doc._id, ownerid);
  return doc;
};

// stream transformer that removes auth details from documents
var authRemover = function(onlyuser, removeDoc) {
  var firstRecord = true;
  
  
  var stripAuth = function (obj, onlyuser, removeDoc) {
    var addComma = false;
    var chunk = obj;

    // If the line ends with a comma, this would break JSON parsing.
    if (obj.endsWith(',')) {
      chunk = obj.slice(0, -1);
      addComma = true;
    }

    try { 
      var row = JSON.parse(chunk); 
    } catch (e) {
      return obj+'\n'; // An incomplete fragment: pass along as is.
    }  

    // if this line doesn't belong to the owner, filter it outs
    if (onlyuser && row.id && !myId(row.id, onlyuser)) {
      return '';
    }
  
    // remove ownerid from the id
    if (row.id) {
      row.id = removeOwnerId(row.id);
    }
    if (row.key) {
      row.key = removeOwnerId(row.key);
    }
    if (row._id) {
      row._id = removeOwnerId(row._id);
    }
    if (row.doc && row.doc._id) {
      row.doc._id = removeOwnerId(row.doc._id);
    }
  
    // if we need to remove the doc object
    if (removeDoc) {
      delete row.doc;
    }

    // Repack, and add the trailling comma if required
    var retval = JSON.stringify(row);
    if (firstRecord) {
      firstRecord = false;
      return retval+'';
    } else {
      return ',\n'+retval;
    }
  };
  
  var tr = new stream.Transform({objectMode: true});
  tr._transform = function (obj, encoding, done) {
    var data = stripAuth(obj, onlyuser, removeDoc);
    if (data) {
      this.push(data);
    }
    done();
  };
  return tr;
};

module.exports = {
  addOwnerId: addOwnerId,
  removeOwnerId: removeOwnerId,
  myId: myId,
  isMine: isMine,
  strip: strip,
  addAuth: addAuth,
  authRemover: authRemover
}