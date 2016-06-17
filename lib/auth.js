var plugin = process.env.ENVOY_AUTH || 'default';
console.log('[OK]  Using the ' + plugin + ' auth plugin');
module.exports = require('./plugins/auth/' + plugin);