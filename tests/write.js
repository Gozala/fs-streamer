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

exports['test read fixtures'] = function(assert, done) {
  var file = path.join(root, 'write.txt')
  var expected = '012345678910'
  var data = streamer.list(expected)
  test(assert, fs.write(file, data), [], 'write')(function() {
    test(assert, streamer.map(String, fs.read(file)), [ expected ], 'written')(function() {
      test(assert, fs.remove(file), [], 'remove')(done)
    })
  })
}

if (module == require.main)
  require("test").run(exports);

});
