/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: false latedef: false */
/*global define: true */

!(typeof(define) !== "function" ? function($){ $(typeof(require) !== 'function' ? (function() { throw Error('require unsupported'); }) : require, typeof(exports) === 'undefined' ? this : exports); } : define)(function(require, exports) {

'use strict';

var on = require('streamer/core').on

exports.test = function test(assert, actual, expected, message) {
  message = message || ''
  return function promise(deliver) {
    var elements = []
    on(actual)(function next(element) {
      elements.push(element)
    }, function stop(error) {
      assert.deepEqual(elements, expected.elements || expected,
                       message + ' (elements match)')

      if (expected.error) {
        assert.throws(function() {
          throw error
        }, expected.error, message + ' (stopped with expected error)')
      } else {
        assert.ok(!error, message + ' (stopped as expected)')
      }
      deliver && deliver()
    })
  }
}

});
