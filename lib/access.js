var plugin = process.env.ENVOY_ACCESS || 'id-hash';
console.log('[OK]  Using the ' + plugin + ' access control plugin');
module.exports = require('./plugins/access/' + plugin);