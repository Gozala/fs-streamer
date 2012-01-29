/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: false latedef: false */
/*global define: true */

!(typeof(define) !== "function" ? function($){ $(typeof(require) !== 'function' ? (function() { throw Error('require unsupported'); }) : require, typeof(exports) === 'undefined' ? this : exports); } : define)(function(require, exports) {

'use strict';

exports['test list'] = require('./list')
exports['test stat'] = require('./stat')
exports['test remove'] = require('./remove')
exports['test read'] = require('./read')
exports['test write'] = require('./write')

if (module == require.main)
  require("test").run(exports);

})
