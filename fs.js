/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: false latedef: false */
/*global define: true */

!(typeof(define) !== "function" ? function($){ $(typeof(require) !== 'function' ? (function() { throw Error('require unsupported'); }) : require, typeof(exports) === 'undefined' ? this : exports); } : define)(function(require, exports) {

'use strict';

var fs = require('fs')
var streamer = require('streamer/core')

exports.stat = function stat(path) {
  return function stream(next, stop) {
    var descriptor = { path: { value: path, enumerable: true } }
    fs.stat(path, function callback(error, stats) {
      if (!error) next(Object.create(stats, descriptor))
      if (stop) stop(error)
    })
  }
}

exports.list = function list(path) {
  return function stream(next) {
    fs.readdir(path, function callback(error, entries) {
      error ? next(error) : streamer.list.apply(null, entries)(next)
    })
  }
}

function opener(path, options) {
  options = options || {}
  var flags = options.flags || 'r'
  var mode =  parseInt(options.mode || '0666', 8)
  return function stream(next) {
    fs.open(path, flags, mode, function onOpen(error, fd) {
      error ? next(error) : next(fd, streamer.empty)
    })
  }
}

function closer(fd) {
  /**
  Takes file descriptor and returns stream that closes given descriptor on
  stream consumption and either propagates close error to the consumer or
  reaches end.
  **/
  return function stream(next) {
    fs.close(fd, next)
  }
}

function reader(fd, options) {
  /**
  Takes file descriptor and (optional) options object that may contain
  `size` per chunk, start position to start read form and end position
  to read to.
  **/
  options = options || {}
  var size = options.size || 64 * 1024
  var start = options.start || 0
  var end = options.end || Infinity
  var encoding = options.encoding || 'utf-8'
  return end <= start ? streamer.empty : function stream(next) {
    var buffer = new Buffer(size)
    fs.read(fd, buffer, 0, size, start, function onRead(error, count) {
      error ? next(error) :
      count === 0 ? next() : next(buffer.slice(0, count), reader(fd, {
        size: size,
        start: start + count,
        end: end
      }))
    })
  }
}
exports.reader = reader

function writter(fd, source, options) {
  var start = options.start || 0
  var encoding = options.encoding || 'utf-8'
  return function stream(next) {
    source(function write(head, tail) {
      if (!tail) return next(head)
      var data = Buffer.isBuffer(head) ? head : new Buffer(head, encoding)
      fs.write(fd, data, 0, data.length, start, function onWrite(error, count) {
        error ? next(error) : writter(fd, tail, { start: start + count })(next)
      })
    })
  }
}
exports.writter = writter

function read(path, options) {
  options = options || {}
  options.flags = options.flags || 'r'
  return streamer.flatten(streamer.map(function(fd) {
    // Append file closer stream, to the content stream to make sure
    // that file descriptor is closed once done with reading.
    return streamer.append(streamer.handle(function(error) {
      // If read error occurs, close file descriptor and forward
      // read error to the reader.
      return streamer.append(closer(fd), streamer.stream(error, null))
    }, reader(fd, options)), closer(fd))
  }, opener(path, options)))
}
exports.read = read

function write(path, source, options) {
  options = options || {}
  options.flags = options.flags || 'w'
  return streamer.flatten(streamer.map(function(fd) {
    return streamer.append(streamer.handle(function(error) {
      return streamer.append(closer(fd), streamer.stream(error, null))
    }, writter(fd, source, options)), closer(fd))
  }, opener(path, options)))
}
exports.write = write

});
