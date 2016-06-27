'use strict';

// helper function to find credentials from environment variables
function getCredentials() {
  var opts = {
    couchHost: process.env.COUCH_HOST || null,
    databaseName: process.env.MBAAS_DATABASE_NAME || 'mbaas',
    logFormat: process.env.LOG_FORMAT || 'off',
    port: process.env.PORT || 8000,
    url: null
  };
  if (process.env.VCAP_SERVICES) {

    // this will throw an exception if VCAP_SERVICES is not valid JSON
    var services = JSON.parse(process.env.VCAP_SERVICES);

    // extract Cloudant credentials from VCAP_SERVICES
    if (!opts.couchHost  &&
        Array.isArray(services.cloudantNoSQLDB) &&
        services.cloudantNoSQLDB.length >0 &&
        typeof services.cloudantNoSQLDB[0].credentials === 'object') {
      var bluemixOpts = services.cloudantNoSQLDB[0].credentials;
      opts.couchHost = 'https://' +
        encodeURIComponent(bluemixOpts.username) + ':' +
        encodeURIComponent(bluemixOpts.password) + '@' +
        encodeURIComponent(bluemixOpts.username) + '.cloudant.com';
    }

    // bluemix/cloudfoundry config
    var cfenv = require('cfenv');
    var appEnv = cfenv.getAppEnv();
    opts.port = appEnv.port;
    opts.url = appEnv.url;

  }

  // piecemeal environment variables
  if (!opts.url) {
    opts.url = 'localhost:' + process.env.PORT;
  }
  if (!opts.couchHost || !opts.port) {
    throw('Missing env variable - ' +
          'must supply COUCH_HOST & PORT');
  }
  if (typeof opts.port === 'string' && parseInt(opts.port,10).toString() !== opts.port) {
    throw new Error ('port ' + opts.port + ' must be an integer');
  }
  
  return opts;
}

module.exports = {
  getCredentials: getCredentials
};
