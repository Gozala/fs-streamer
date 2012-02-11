/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: false latedef: false */
/*global define: true */

!(typeof(define) !== "function" ? function($){ $(typeof(require) !== 'function' ? (function() { throw Error('require unsupported'); }) : require, typeof(exports) === 'undefined' ? this : exports); } : define)(function(require, exports) {

'use strict';

var fs = require('../fs')
var streamer = require('streamer'), Stream = streamer.Stream
var path = require('path')
var root = path.join(path.dirname(module.filename), './fixtures/')
var Assert = require('./assert').Assert

exports.Assert = Assert
exports['test remove non-existing'] = function(expect, complete) {
  var stream = fs.remove(path.join(root, 'does_not_exist'))
  expect(stream).to.stop.with.an.error(/ENOENT/).then(complete)
}

exports['test remove file'] = function(expect, complete) {
  var file = path.join(root, 'temp')
  var createFile = fs.write(file, Stream.empty)

  expect(createFile).to.be(0)
  expect(fs.remove(file)).to.be.empty()
  expect(fs.remove(file)).to.stop.with.an.error(/ENOENT/).then(complete)
}

if (module == require.main)
  require("test").run(exports);

});
