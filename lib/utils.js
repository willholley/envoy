'use strict';

var app = require('../app'),
  stream = require('stream');


var isObject = function(obj) {
  var type = typeof obj;
  return type === 'function' || type === 'object' && !!obj;
};

var isArray = function(obj) {
  return obj instanceof Array;
};

var isString = function(str) {
  return typeof str === 'string';
};


var sendError = function (err, res) {
  //console.error(err);
  res.status(err.statusCode).send({
    error: err.error,
    reason: err.reason
  });
};


// stream transformer that breaks incoming chunks into lines
var liner = function() {

  var liner = new stream.Transform({objectMode: true});
   
  liner._transform = function (chunk, encoding, done) {
    var data = chunk.toString('utf8');
    if (this._lastLineData) {
      data = this._lastLineData + data;
    }
     
    var lines = data.split(/\s*\n/);
    this._lastLineData = lines.splice(lines.length-1,1)[0];
    lines.forEach(this.push.bind(this));
    done();
  };
   
  liner._flush = function (done) {
    if (this._lastLineData) {
      this.push(this._lastLineData);
    }
    this._lastLineData = null;
    done();
  };

  return liner;
};

// console.log utility
var dmp = function (msg, obj) {
  console.log(msg, JSON.stringify(obj, null, 2));
};

module.exports = {
  isObject: isObject,
  isArray: isArray,
  isString: isString,
  sendError: sendError,
  liner: liner,
  dmp: dmp
};
