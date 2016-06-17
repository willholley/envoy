var plugin = process.env.ENVOY_ACCESS || 'default';
console.log('[OK]  Using the ' + plugin + ' access control plugin');
module.exports = require('./plugins/access/' + plugin);