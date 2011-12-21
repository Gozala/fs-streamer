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
var test = require('./test-utils').test

exports['test remove non-existing'] = function(assert, done) {
  var expected = { error: /ENOENT/, elements: [] }
  var actual = fs.remove(path.join(root, 'does_not_exist'))

  test(assert, actual, expected, 'file does not exists')(done)
}

exports['test remove file'] = function(assert, done) {
  var file = path.join('temp')

  test(assert, fs.write(file, streamer.empty), [], 'create file')(function() {
    test(assert, fs.remove(file), [], 'remove file')(function() {
      test(assert, fs.remove(file), { error: /ENOENT/, elements: [] }, 'removed')(done)
    })
  })
}

if (module == require.main)
  require("test").run(exports);

});
