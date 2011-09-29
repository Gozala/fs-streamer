/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false supernew: true */
/*global define: true exports: true */

"use strict";

var fs = require('fs')

exports.list = function list(path) {
  return function stream(next, stop) {
    fs.readdir(path, function callback(error, entries, entry) {
      if (!error) while ((entry = entries.shift())) next(entry)
      if (stop) stop(error)
    })
  }
}

exports.readFile = function readFile(path, encoding) {
  var args = Array.prototype.slice.call(arguments)
  return function stream(next, stop) {
    fs.readFile.apply(null, args.concat([function callback(error, data) {
      if (!error) next(data)
      if (stop) stop(error)
    }]))
  }
}

exports.writeFile = function writeFile(path, data, encoding) {
  var args = Array.prototype.slice.call(arguments)
  return function stream(next, stop) {
    fs.writeFile.apply(null, args.concat([ stop ]))
  }
}

exports.stat = function stat(path) {
  return function stream(next, stop) {
    var descriptor = { path: { value: path, enumerable: true } }
    fs.stat(path, function callback(error, stats) {
      if (!error) next(Object.create(stats, descriptor))
      if (stop) stop(error)
    })
  }
}
