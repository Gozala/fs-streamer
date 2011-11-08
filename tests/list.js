/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: false latedef: false */
/*global define: true */

!(typeof(define) !== "function" ? function($){ $(typeof(require) !== 'function' ? (function() { throw Error('require unsupported'); }) : require, typeof(exports) === 'undefined' ? this : exports); } : define)(function(require, exports) {

'use strict';

var fs = require('../fs')
var path = require('path')
var root = path.join(path.dirname(module.filename), './fixtures/list/')
var test = require('./test-utils').test

exports['test list fixtures'] = function(assert, done) {
  var actual = fs.list(root)
  var expected = ['file-1', 'file-2.js', 'folder-1', 'folder-2']
  test(assert, actual, expected, 'list entries')(done)
}

exports['test list non-existing'] = function(assert, done) {
  var actual = fs.list(path.join(root, '<nonexisting>'))
  var expected = { elements: [], error: /ENOENT/ }
  test(assert, actual, expected, 'list non existing')(done)
}

if (module == require.main)
  require("test").run(exports);

});
