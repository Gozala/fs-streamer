/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: false latedef: false */
/*global define: true */

!(typeof(define) !== "function" ? function($){ $(typeof(require) !== 'function' ? (function() { throw Error('require unsupported'); }) : require, typeof(exports) === 'undefined' ? this : exports); } : define)(function(require, exports) {

'use strict';

var fs = require('fs')
var binding = process.binding('fs')
var streamer = require('streamer/core')

function stat(path) {
  return function stream(next) {
    var descriptor = { path: { value: path, enumerable: true } }
    binding.stat(path, function onStat(error, stats) {
      error ? next(error)
            : streamer.list(Object.create(stats, descriptor))(next)
    })
  }
}
exports.stat = stat

function list(path) {
  return function stream(next) {
    binding.readdir(path, function onReaddir(error, entries) {
      error ? next(error) : streamer.list.apply(null, entries)(next)
    })
  }
}
exports.list = list

function remove(path) {
  return function stream(next) {
    binding.unlink(path, function onUnlink(error) {
      error ? next(error) : streamer.empty(next)
    })
  }
}
exports.remove = remove

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
    binding.close(fd, next)
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
  var encoding = options.encoding || 'raw'
  return end <= start ? streamer.empty : function stream(next) {
    var buffer = new Buffer(size)
    binding.read(fd, buffer, 0, size, start, function onRead(error, count) {
      error ? next(error) :
      count === 0 ? next() :
      next(buffer.slice(0, count), reader(fd, {
        size: size,
        start: start + count,
        end: end,
        encoding: encoding
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

function decoder(encoding) {
  return function decode(buffer) { return buffer.toString(encoding) }
}

function read(path, options) {
  /**
  Returns stream of contents of the file under the given `path`. Optional
  `options` object may be used to configure reading in further details. By
  default file will be open with an `'r'` flag and `'0666'` mode, alternatively
  `options.flags` and `options.mode` strings may be used to override those
  defaults. By default complete file is read, but `options.start` and
  `options.end` integers may be passed to read out just a given range. Stream
  elements are buffers of content, size of those chunks may be configured via
  `options.size` option.
  **/
  options = options || {}
  options.flags = options.flags || 'r'
  var encoding = options.encoding || 'raw'
  return streamer.flatten(streamer.map(function(fd) {
    // If optional `encoding` is passed, map buffers to strings with a given
    // encoding.
    var content = encoding === 'raw' ? reader(fd, options) :
                  streamer.map(decoder(encoding), reader(fd, options))
    // Append file closer stream, to the content stream to make sure
    // that file descriptor is closed once done with reading.
    return streamer.append(streamer.handle(function onError(error) {
      // If read error occurs, close file descriptor and forward
      // read error to the reader.
      return streamer.append(closer(fd), streamer.stream(error, null))
    }, content, closer(fd)))
  }, opener(path, options)))
}
exports.read = read

function write(path, source, options) {
  /**
  Writes content from the given `source` stream to a file under the given
  `path`.  Optional `options` object may be used to configure writing in
  further details. By default file will be open with an `'w'` flag and `'0666'`
  mode, alternatively `options.flags` and `options.mode` strings may be used to
  override those defaults. By default file is written from the begining, but
  this could be overridden via `options.start`. As result stream of 0 elements
  is returned, which will end once write is complete. All errors will propagate
  to a resulting stream.
  **/
  options = options || {}
  options.flags = options.flags || 'w'
  return streamer.flatten(streamer.map(function(fd) {
    return streamer.append(streamer.handle(function onError(error) {
      return streamer.append(closer(fd), streamer.stream(error, null))
    }, writter(fd, source, options)), closer(fd))
  }, opener(path, options)))
}
exports.write = write

});
