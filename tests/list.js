/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: false latedef: false */
/*global define: true */

!(typeof(define) !== "function" ? function($){ $(typeof(require) !== 'function' ? (function() { throw Error('require unsupported'); }) : require, typeof(exports) === 'undefined' ? this : exports); } : define)(function(require, exports) {

'use strict';

var fs = require('../fs')
var path = require('path')
var root = path.join(path.dirname(module.filename), './fixtures/')
var streamer = require('streamer')
var Assert = require('./assert').Assert

exports.Assert = Assert
exports['test list fixtures'] = function(expect, complete) {
  var entries = streamer.filter(function(entry) {
    return entry !== '.DS_Store'
  }, fs.list(root))

  expect(entries).to.be(
    'elipses.txt',
    'empty.txt',
    'file-1',
    'file-2.js',
    'folder-1',
    'folder-2',
    'x.txt').and.then(complete)
}

exports['test list non-existing'] = function(expect, complete) {
  var stream = fs.list(path.join(root, '<nonexisting>'))
  expect(stream).to.have.an.error(/ENOENT/).and.then(complete)
}

if (module == require.main)
  require("test").run(exports);

});
