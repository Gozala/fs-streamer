/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: false latedef: false */
/*global define: true */

!(typeof(define) !== "function" ? function($){ $(typeof(require) !== 'function' ? (function() { throw Error('require unsupported'); }) : require, typeof(exports) === 'undefined' ? this : exports); } : define)(function(require, exports) {

'use strict';

var fs = require('../fs')
var streamer = require('streamer')
var path = require('path')
var root = path.join(path.dirname(module.filename), './fixtures/')
var Assert = require('./assert').Assert

exports.Assert = Assert
exports['test write to file'] = function(assert, complete) {
  var file = path.join(root, 'write.txt')
  var content = '012345678910'

  assert(fs.write(file, streamer.list(content))).to.an.empty()
  assert(streamer.map(String, fs.read(file))).to(content)
  assert(fs.remove(file)).to.an.empty().and.then(complete)
}
}

if (module == require.main)
  require("test").run(exports);

});
