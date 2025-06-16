// @bun
/*! MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */
import zlib from 'node:zlib'
import stream from 'node:stream'

// fyi, Byte streams aren't really implemented anywhere yet
// It only exist as a issue: https://github.com/WICG/compression/issues/31

const make = (ctx: any, handle: any) => Object.assign(ctx, {
  readable: stream.Readable.toWeb(handle),
  writable: stream.Writable.toWeb(handle),
})

globalThis.CompressionStream ??= class CompressionStream {
  readable: ReadableStream
  writable: WritableStream

  constructor(format: 'deflate' | 'gzip' | 'deflate-raw') {
    make(this, format === 'deflate' ? zlib.createDeflate() :
    format === 'gzip' ? zlib.createGzip() : zlib.createDeflateRaw())
  }
}

globalThis.DecompressionStream ??= class DecompressionStream {
  readable: ReadableStream
  writable: WritableStream

  constructor(format: 'deflate' | 'gzip' | 'deflate-raw') {
    make(this, format === 'deflate' ? zlib.createInflate() :
    format === 'gzip' ? zlib.createGunzip() :
    zlib.createInflateRaw())
  }
} 