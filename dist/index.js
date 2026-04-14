#!/usr/bin/env node
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/delayed-stream/lib/delayed_stream.js
var require_delayed_stream = __commonJS({
  "node_modules/delayed-stream/lib/delayed_stream.js"(exports, module) {
    var Stream = __require("stream").Stream;
    var util = __require("util");
    module.exports = DelayedStream;
    function DelayedStream() {
      this.source = null;
      this.dataSize = 0;
      this.maxDataSize = 1024 * 1024;
      this.pauseStream = true;
      this._maxDataSizeExceeded = false;
      this._released = false;
      this._bufferedEvents = [];
    }
    util.inherits(DelayedStream, Stream);
    DelayedStream.create = function(source, options) {
      var delayedStream = new this();
      options = options || {};
      for (var option in options) {
        delayedStream[option] = options[option];
      }
      delayedStream.source = source;
      var realEmit = source.emit;
      source.emit = function() {
        delayedStream._handleEmit(arguments);
        return realEmit.apply(source, arguments);
      };
      source.on("error", function() {
      });
      if (delayedStream.pauseStream) {
        source.pause();
      }
      return delayedStream;
    };
    Object.defineProperty(DelayedStream.prototype, "readable", {
      configurable: true,
      enumerable: true,
      get: function() {
        return this.source.readable;
      }
    });
    DelayedStream.prototype.setEncoding = function() {
      return this.source.setEncoding.apply(this.source, arguments);
    };
    DelayedStream.prototype.resume = function() {
      if (!this._released) {
        this.release();
      }
      this.source.resume();
    };
    DelayedStream.prototype.pause = function() {
      this.source.pause();
    };
    DelayedStream.prototype.release = function() {
      this._released = true;
      this._bufferedEvents.forEach(function(args) {
        this.emit.apply(this, args);
      }.bind(this));
      this._bufferedEvents = [];
    };
    DelayedStream.prototype.pipe = function() {
      var r = Stream.prototype.pipe.apply(this, arguments);
      this.resume();
      return r;
    };
    DelayedStream.prototype._handleEmit = function(args) {
      if (this._released) {
        this.emit.apply(this, args);
        return;
      }
      if (args[0] === "data") {
        this.dataSize += args[1].length;
        this._checkIfMaxDataSizeExceeded();
      }
      this._bufferedEvents.push(args);
    };
    DelayedStream.prototype._checkIfMaxDataSizeExceeded = function() {
      if (this._maxDataSizeExceeded) {
        return;
      }
      if (this.dataSize <= this.maxDataSize) {
        return;
      }
      this._maxDataSizeExceeded = true;
      var message = "DelayedStream#maxDataSize of " + this.maxDataSize + " bytes exceeded.";
      this.emit("error", new Error(message));
    };
  }
});

// node_modules/combined-stream/lib/combined_stream.js
var require_combined_stream = __commonJS({
  "node_modules/combined-stream/lib/combined_stream.js"(exports, module) {
    var util = __require("util");
    var Stream = __require("stream").Stream;
    var DelayedStream = require_delayed_stream();
    module.exports = CombinedStream;
    function CombinedStream() {
      this.writable = false;
      this.readable = true;
      this.dataSize = 0;
      this.maxDataSize = 2 * 1024 * 1024;
      this.pauseStreams = true;
      this._released = false;
      this._streams = [];
      this._currentStream = null;
      this._insideLoop = false;
      this._pendingNext = false;
    }
    util.inherits(CombinedStream, Stream);
    CombinedStream.create = function(options) {
      var combinedStream = new this();
      options = options || {};
      for (var option in options) {
        combinedStream[option] = options[option];
      }
      return combinedStream;
    };
    CombinedStream.isStreamLike = function(stream) {
      return typeof stream !== "function" && typeof stream !== "string" && typeof stream !== "boolean" && typeof stream !== "number" && !Buffer.isBuffer(stream);
    };
    CombinedStream.prototype.append = function(stream) {
      var isStreamLike = CombinedStream.isStreamLike(stream);
      if (isStreamLike) {
        if (!(stream instanceof DelayedStream)) {
          var newStream = DelayedStream.create(stream, {
            maxDataSize: Infinity,
            pauseStream: this.pauseStreams
          });
          stream.on("data", this._checkDataSize.bind(this));
          stream = newStream;
        }
        this._handleErrors(stream);
        if (this.pauseStreams) {
          stream.pause();
        }
      }
      this._streams.push(stream);
      return this;
    };
    CombinedStream.prototype.pipe = function(dest, options) {
      Stream.prototype.pipe.call(this, dest, options);
      this.resume();
      return dest;
    };
    CombinedStream.prototype._getNext = function() {
      this._currentStream = null;
      if (this._insideLoop) {
        this._pendingNext = true;
        return;
      }
      this._insideLoop = true;
      try {
        do {
          this._pendingNext = false;
          this._realGetNext();
        } while (this._pendingNext);
      } finally {
        this._insideLoop = false;
      }
    };
    CombinedStream.prototype._realGetNext = function() {
      var stream = this._streams.shift();
      if (typeof stream == "undefined") {
        this.end();
        return;
      }
      if (typeof stream !== "function") {
        this._pipeNext(stream);
        return;
      }
      var getStream = stream;
      getStream(function(stream2) {
        var isStreamLike = CombinedStream.isStreamLike(stream2);
        if (isStreamLike) {
          stream2.on("data", this._checkDataSize.bind(this));
          this._handleErrors(stream2);
        }
        this._pipeNext(stream2);
      }.bind(this));
    };
    CombinedStream.prototype._pipeNext = function(stream) {
      this._currentStream = stream;
      var isStreamLike = CombinedStream.isStreamLike(stream);
      if (isStreamLike) {
        stream.on("end", this._getNext.bind(this));
        stream.pipe(this, { end: false });
        return;
      }
      var value = stream;
      this.write(value);
      this._getNext();
    };
    CombinedStream.prototype._handleErrors = function(stream) {
      var self2 = this;
      stream.on("error", function(err) {
        self2._emitError(err);
      });
    };
    CombinedStream.prototype.write = function(data) {
      this.emit("data", data);
    };
    CombinedStream.prototype.pause = function() {
      if (!this.pauseStreams) {
        return;
      }
      if (this.pauseStreams && this._currentStream && typeof this._currentStream.pause == "function") this._currentStream.pause();
      this.emit("pause");
    };
    CombinedStream.prototype.resume = function() {
      if (!this._released) {
        this._released = true;
        this.writable = true;
        this._getNext();
      }
      if (this.pauseStreams && this._currentStream && typeof this._currentStream.resume == "function") this._currentStream.resume();
      this.emit("resume");
    };
    CombinedStream.prototype.end = function() {
      this._reset();
      this.emit("end");
    };
    CombinedStream.prototype.destroy = function() {
      this._reset();
      this.emit("close");
    };
    CombinedStream.prototype._reset = function() {
      this.writable = false;
      this._streams = [];
      this._currentStream = null;
    };
    CombinedStream.prototype._checkDataSize = function() {
      this._updateDataSize();
      if (this.dataSize <= this.maxDataSize) {
        return;
      }
      var message = "DelayedStream#maxDataSize of " + this.maxDataSize + " bytes exceeded.";
      this._emitError(new Error(message));
    };
    CombinedStream.prototype._updateDataSize = function() {
      this.dataSize = 0;
      var self2 = this;
      this._streams.forEach(function(stream) {
        if (!stream.dataSize) {
          return;
        }
        self2.dataSize += stream.dataSize;
      });
      if (this._currentStream && this._currentStream.dataSize) {
        this.dataSize += this._currentStream.dataSize;
      }
    };
    CombinedStream.prototype._emitError = function(err) {
      this._reset();
      this.emit("error", err);
    };
  }
});

// node_modules/mime-db/db.json
var require_db = __commonJS({
  "node_modules/mime-db/db.json"(exports, module) {
    module.exports = {
      "application/1d-interleaved-parityfec": {
        source: "iana"
      },
      "application/3gpdash-qoe-report+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/3gpp-ims+xml": {
        source: "iana",
        compressible: true
      },
      "application/3gpphal+json": {
        source: "iana",
        compressible: true
      },
      "application/3gpphalforms+json": {
        source: "iana",
        compressible: true
      },
      "application/a2l": {
        source: "iana"
      },
      "application/ace+cbor": {
        source: "iana"
      },
      "application/activemessage": {
        source: "iana"
      },
      "application/activity+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-costmap+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-costmapfilter+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-directory+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-endpointcost+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-endpointcostparams+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-endpointprop+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-endpointpropparams+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-error+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-networkmap+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-networkmapfilter+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-updatestreamcontrol+json": {
        source: "iana",
        compressible: true
      },
      "application/alto-updatestreamparams+json": {
        source: "iana",
        compressible: true
      },
      "application/aml": {
        source: "iana"
      },
      "application/andrew-inset": {
        source: "iana",
        extensions: ["ez"]
      },
      "application/applefile": {
        source: "iana"
      },
      "application/applixware": {
        source: "apache",
        extensions: ["aw"]
      },
      "application/at+jwt": {
        source: "iana"
      },
      "application/atf": {
        source: "iana"
      },
      "application/atfx": {
        source: "iana"
      },
      "application/atom+xml": {
        source: "iana",
        compressible: true,
        extensions: ["atom"]
      },
      "application/atomcat+xml": {
        source: "iana",
        compressible: true,
        extensions: ["atomcat"]
      },
      "application/atomdeleted+xml": {
        source: "iana",
        compressible: true,
        extensions: ["atomdeleted"]
      },
      "application/atomicmail": {
        source: "iana"
      },
      "application/atomsvc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["atomsvc"]
      },
      "application/atsc-dwd+xml": {
        source: "iana",
        compressible: true,
        extensions: ["dwd"]
      },
      "application/atsc-dynamic-event-message": {
        source: "iana"
      },
      "application/atsc-held+xml": {
        source: "iana",
        compressible: true,
        extensions: ["held"]
      },
      "application/atsc-rdt+json": {
        source: "iana",
        compressible: true
      },
      "application/atsc-rsat+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rsat"]
      },
      "application/atxml": {
        source: "iana"
      },
      "application/auth-policy+xml": {
        source: "iana",
        compressible: true
      },
      "application/bacnet-xdd+zip": {
        source: "iana",
        compressible: false
      },
      "application/batch-smtp": {
        source: "iana"
      },
      "application/bdoc": {
        compressible: false,
        extensions: ["bdoc"]
      },
      "application/beep+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/calendar+json": {
        source: "iana",
        compressible: true
      },
      "application/calendar+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xcs"]
      },
      "application/call-completion": {
        source: "iana"
      },
      "application/cals-1840": {
        source: "iana"
      },
      "application/captive+json": {
        source: "iana",
        compressible: true
      },
      "application/cbor": {
        source: "iana"
      },
      "application/cbor-seq": {
        source: "iana"
      },
      "application/cccex": {
        source: "iana"
      },
      "application/ccmp+xml": {
        source: "iana",
        compressible: true
      },
      "application/ccxml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ccxml"]
      },
      "application/cdfx+xml": {
        source: "iana",
        compressible: true,
        extensions: ["cdfx"]
      },
      "application/cdmi-capability": {
        source: "iana",
        extensions: ["cdmia"]
      },
      "application/cdmi-container": {
        source: "iana",
        extensions: ["cdmic"]
      },
      "application/cdmi-domain": {
        source: "iana",
        extensions: ["cdmid"]
      },
      "application/cdmi-object": {
        source: "iana",
        extensions: ["cdmio"]
      },
      "application/cdmi-queue": {
        source: "iana",
        extensions: ["cdmiq"]
      },
      "application/cdni": {
        source: "iana"
      },
      "application/cea": {
        source: "iana"
      },
      "application/cea-2018+xml": {
        source: "iana",
        compressible: true
      },
      "application/cellml+xml": {
        source: "iana",
        compressible: true
      },
      "application/cfw": {
        source: "iana"
      },
      "application/city+json": {
        source: "iana",
        compressible: true
      },
      "application/clr": {
        source: "iana"
      },
      "application/clue+xml": {
        source: "iana",
        compressible: true
      },
      "application/clue_info+xml": {
        source: "iana",
        compressible: true
      },
      "application/cms": {
        source: "iana"
      },
      "application/cnrp+xml": {
        source: "iana",
        compressible: true
      },
      "application/coap-group+json": {
        source: "iana",
        compressible: true
      },
      "application/coap-payload": {
        source: "iana"
      },
      "application/commonground": {
        source: "iana"
      },
      "application/conference-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/cose": {
        source: "iana"
      },
      "application/cose-key": {
        source: "iana"
      },
      "application/cose-key-set": {
        source: "iana"
      },
      "application/cpl+xml": {
        source: "iana",
        compressible: true,
        extensions: ["cpl"]
      },
      "application/csrattrs": {
        source: "iana"
      },
      "application/csta+xml": {
        source: "iana",
        compressible: true
      },
      "application/cstadata+xml": {
        source: "iana",
        compressible: true
      },
      "application/csvm+json": {
        source: "iana",
        compressible: true
      },
      "application/cu-seeme": {
        source: "apache",
        extensions: ["cu"]
      },
      "application/cwt": {
        source: "iana"
      },
      "application/cybercash": {
        source: "iana"
      },
      "application/dart": {
        compressible: true
      },
      "application/dash+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mpd"]
      },
      "application/dash-patch+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mpp"]
      },
      "application/dashdelta": {
        source: "iana"
      },
      "application/davmount+xml": {
        source: "iana",
        compressible: true,
        extensions: ["davmount"]
      },
      "application/dca-rft": {
        source: "iana"
      },
      "application/dcd": {
        source: "iana"
      },
      "application/dec-dx": {
        source: "iana"
      },
      "application/dialog-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/dicom": {
        source: "iana"
      },
      "application/dicom+json": {
        source: "iana",
        compressible: true
      },
      "application/dicom+xml": {
        source: "iana",
        compressible: true
      },
      "application/dii": {
        source: "iana"
      },
      "application/dit": {
        source: "iana"
      },
      "application/dns": {
        source: "iana"
      },
      "application/dns+json": {
        source: "iana",
        compressible: true
      },
      "application/dns-message": {
        source: "iana"
      },
      "application/docbook+xml": {
        source: "apache",
        compressible: true,
        extensions: ["dbk"]
      },
      "application/dots+cbor": {
        source: "iana"
      },
      "application/dskpp+xml": {
        source: "iana",
        compressible: true
      },
      "application/dssc+der": {
        source: "iana",
        extensions: ["dssc"]
      },
      "application/dssc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xdssc"]
      },
      "application/dvcs": {
        source: "iana"
      },
      "application/ecmascript": {
        source: "iana",
        compressible: true,
        extensions: ["es", "ecma"]
      },
      "application/edi-consent": {
        source: "iana"
      },
      "application/edi-x12": {
        source: "iana",
        compressible: false
      },
      "application/edifact": {
        source: "iana",
        compressible: false
      },
      "application/efi": {
        source: "iana"
      },
      "application/elm+json": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/elm+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.cap+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/emergencycalldata.comment+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.control+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.deviceinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.ecall.msd": {
        source: "iana"
      },
      "application/emergencycalldata.providerinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.serviceinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.subscriberinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/emergencycalldata.veds+xml": {
        source: "iana",
        compressible: true
      },
      "application/emma+xml": {
        source: "iana",
        compressible: true,
        extensions: ["emma"]
      },
      "application/emotionml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["emotionml"]
      },
      "application/encaprtp": {
        source: "iana"
      },
      "application/epp+xml": {
        source: "iana",
        compressible: true
      },
      "application/epub+zip": {
        source: "iana",
        compressible: false,
        extensions: ["epub"]
      },
      "application/eshop": {
        source: "iana"
      },
      "application/exi": {
        source: "iana",
        extensions: ["exi"]
      },
      "application/expect-ct-report+json": {
        source: "iana",
        compressible: true
      },
      "application/express": {
        source: "iana",
        extensions: ["exp"]
      },
      "application/fastinfoset": {
        source: "iana"
      },
      "application/fastsoap": {
        source: "iana"
      },
      "application/fdt+xml": {
        source: "iana",
        compressible: true,
        extensions: ["fdt"]
      },
      "application/fhir+json": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/fhir+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/fido.trusted-apps+json": {
        compressible: true
      },
      "application/fits": {
        source: "iana"
      },
      "application/flexfec": {
        source: "iana"
      },
      "application/font-sfnt": {
        source: "iana"
      },
      "application/font-tdpfr": {
        source: "iana",
        extensions: ["pfr"]
      },
      "application/font-woff": {
        source: "iana",
        compressible: false
      },
      "application/framework-attributes+xml": {
        source: "iana",
        compressible: true
      },
      "application/geo+json": {
        source: "iana",
        compressible: true,
        extensions: ["geojson"]
      },
      "application/geo+json-seq": {
        source: "iana"
      },
      "application/geopackage+sqlite3": {
        source: "iana"
      },
      "application/geoxacml+xml": {
        source: "iana",
        compressible: true
      },
      "application/gltf-buffer": {
        source: "iana"
      },
      "application/gml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["gml"]
      },
      "application/gpx+xml": {
        source: "apache",
        compressible: true,
        extensions: ["gpx"]
      },
      "application/gxf": {
        source: "apache",
        extensions: ["gxf"]
      },
      "application/gzip": {
        source: "iana",
        compressible: false,
        extensions: ["gz"]
      },
      "application/h224": {
        source: "iana"
      },
      "application/held+xml": {
        source: "iana",
        compressible: true
      },
      "application/hjson": {
        extensions: ["hjson"]
      },
      "application/http": {
        source: "iana"
      },
      "application/hyperstudio": {
        source: "iana",
        extensions: ["stk"]
      },
      "application/ibe-key-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/ibe-pkg-reply+xml": {
        source: "iana",
        compressible: true
      },
      "application/ibe-pp-data": {
        source: "iana"
      },
      "application/iges": {
        source: "iana"
      },
      "application/im-iscomposing+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/index": {
        source: "iana"
      },
      "application/index.cmd": {
        source: "iana"
      },
      "application/index.obj": {
        source: "iana"
      },
      "application/index.response": {
        source: "iana"
      },
      "application/index.vnd": {
        source: "iana"
      },
      "application/inkml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ink", "inkml"]
      },
      "application/iotp": {
        source: "iana"
      },
      "application/ipfix": {
        source: "iana",
        extensions: ["ipfix"]
      },
      "application/ipp": {
        source: "iana"
      },
      "application/isup": {
        source: "iana"
      },
      "application/its+xml": {
        source: "iana",
        compressible: true,
        extensions: ["its"]
      },
      "application/java-archive": {
        source: "apache",
        compressible: false,
        extensions: ["jar", "war", "ear"]
      },
      "application/java-serialized-object": {
        source: "apache",
        compressible: false,
        extensions: ["ser"]
      },
      "application/java-vm": {
        source: "apache",
        compressible: false,
        extensions: ["class"]
      },
      "application/javascript": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["js", "mjs"]
      },
      "application/jf2feed+json": {
        source: "iana",
        compressible: true
      },
      "application/jose": {
        source: "iana"
      },
      "application/jose+json": {
        source: "iana",
        compressible: true
      },
      "application/jrd+json": {
        source: "iana",
        compressible: true
      },
      "application/jscalendar+json": {
        source: "iana",
        compressible: true
      },
      "application/json": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["json", "map"]
      },
      "application/json-patch+json": {
        source: "iana",
        compressible: true
      },
      "application/json-seq": {
        source: "iana"
      },
      "application/json5": {
        extensions: ["json5"]
      },
      "application/jsonml+json": {
        source: "apache",
        compressible: true,
        extensions: ["jsonml"]
      },
      "application/jwk+json": {
        source: "iana",
        compressible: true
      },
      "application/jwk-set+json": {
        source: "iana",
        compressible: true
      },
      "application/jwt": {
        source: "iana"
      },
      "application/kpml-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/kpml-response+xml": {
        source: "iana",
        compressible: true
      },
      "application/ld+json": {
        source: "iana",
        compressible: true,
        extensions: ["jsonld"]
      },
      "application/lgr+xml": {
        source: "iana",
        compressible: true,
        extensions: ["lgr"]
      },
      "application/link-format": {
        source: "iana"
      },
      "application/load-control+xml": {
        source: "iana",
        compressible: true
      },
      "application/lost+xml": {
        source: "iana",
        compressible: true,
        extensions: ["lostxml"]
      },
      "application/lostsync+xml": {
        source: "iana",
        compressible: true
      },
      "application/lpf+zip": {
        source: "iana",
        compressible: false
      },
      "application/lxf": {
        source: "iana"
      },
      "application/mac-binhex40": {
        source: "iana",
        extensions: ["hqx"]
      },
      "application/mac-compactpro": {
        source: "apache",
        extensions: ["cpt"]
      },
      "application/macwriteii": {
        source: "iana"
      },
      "application/mads+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mads"]
      },
      "application/manifest+json": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["webmanifest"]
      },
      "application/marc": {
        source: "iana",
        extensions: ["mrc"]
      },
      "application/marcxml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mrcx"]
      },
      "application/mathematica": {
        source: "iana",
        extensions: ["ma", "nb", "mb"]
      },
      "application/mathml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mathml"]
      },
      "application/mathml-content+xml": {
        source: "iana",
        compressible: true
      },
      "application/mathml-presentation+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-associated-procedure-description+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-deregister+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-envelope+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-msk+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-msk-response+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-protection-description+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-reception-report+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-register+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-register-response+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-schedule+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbms-user-service-description+xml": {
        source: "iana",
        compressible: true
      },
      "application/mbox": {
        source: "iana",
        extensions: ["mbox"]
      },
      "application/media-policy-dataset+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mpf"]
      },
      "application/media_control+xml": {
        source: "iana",
        compressible: true
      },
      "application/mediaservercontrol+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mscml"]
      },
      "application/merge-patch+json": {
        source: "iana",
        compressible: true
      },
      "application/metalink+xml": {
        source: "apache",
        compressible: true,
        extensions: ["metalink"]
      },
      "application/metalink4+xml": {
        source: "iana",
        compressible: true,
        extensions: ["meta4"]
      },
      "application/mets+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mets"]
      },
      "application/mf4": {
        source: "iana"
      },
      "application/mikey": {
        source: "iana"
      },
      "application/mipc": {
        source: "iana"
      },
      "application/missing-blocks+cbor-seq": {
        source: "iana"
      },
      "application/mmt-aei+xml": {
        source: "iana",
        compressible: true,
        extensions: ["maei"]
      },
      "application/mmt-usd+xml": {
        source: "iana",
        compressible: true,
        extensions: ["musd"]
      },
      "application/mods+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mods"]
      },
      "application/moss-keys": {
        source: "iana"
      },
      "application/moss-signature": {
        source: "iana"
      },
      "application/mosskey-data": {
        source: "iana"
      },
      "application/mosskey-request": {
        source: "iana"
      },
      "application/mp21": {
        source: "iana",
        extensions: ["m21", "mp21"]
      },
      "application/mp4": {
        source: "iana",
        extensions: ["mp4s", "m4p"]
      },
      "application/mpeg4-generic": {
        source: "iana"
      },
      "application/mpeg4-iod": {
        source: "iana"
      },
      "application/mpeg4-iod-xmt": {
        source: "iana"
      },
      "application/mrb-consumer+xml": {
        source: "iana",
        compressible: true
      },
      "application/mrb-publish+xml": {
        source: "iana",
        compressible: true
      },
      "application/msc-ivr+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/msc-mixer+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/msword": {
        source: "iana",
        compressible: false,
        extensions: ["doc", "dot"]
      },
      "application/mud+json": {
        source: "iana",
        compressible: true
      },
      "application/multipart-core": {
        source: "iana"
      },
      "application/mxf": {
        source: "iana",
        extensions: ["mxf"]
      },
      "application/n-quads": {
        source: "iana",
        extensions: ["nq"]
      },
      "application/n-triples": {
        source: "iana",
        extensions: ["nt"]
      },
      "application/nasdata": {
        source: "iana"
      },
      "application/news-checkgroups": {
        source: "iana",
        charset: "US-ASCII"
      },
      "application/news-groupinfo": {
        source: "iana",
        charset: "US-ASCII"
      },
      "application/news-transmission": {
        source: "iana"
      },
      "application/nlsml+xml": {
        source: "iana",
        compressible: true
      },
      "application/node": {
        source: "iana",
        extensions: ["cjs"]
      },
      "application/nss": {
        source: "iana"
      },
      "application/oauth-authz-req+jwt": {
        source: "iana"
      },
      "application/oblivious-dns-message": {
        source: "iana"
      },
      "application/ocsp-request": {
        source: "iana"
      },
      "application/ocsp-response": {
        source: "iana"
      },
      "application/octet-stream": {
        source: "iana",
        compressible: false,
        extensions: ["bin", "dms", "lrf", "mar", "so", "dist", "distz", "pkg", "bpk", "dump", "elc", "deploy", "exe", "dll", "deb", "dmg", "iso", "img", "msi", "msp", "msm", "buffer"]
      },
      "application/oda": {
        source: "iana",
        extensions: ["oda"]
      },
      "application/odm+xml": {
        source: "iana",
        compressible: true
      },
      "application/odx": {
        source: "iana"
      },
      "application/oebps-package+xml": {
        source: "iana",
        compressible: true,
        extensions: ["opf"]
      },
      "application/ogg": {
        source: "iana",
        compressible: false,
        extensions: ["ogx"]
      },
      "application/omdoc+xml": {
        source: "apache",
        compressible: true,
        extensions: ["omdoc"]
      },
      "application/onenote": {
        source: "apache",
        extensions: ["onetoc", "onetoc2", "onetmp", "onepkg"]
      },
      "application/opc-nodeset+xml": {
        source: "iana",
        compressible: true
      },
      "application/oscore": {
        source: "iana"
      },
      "application/oxps": {
        source: "iana",
        extensions: ["oxps"]
      },
      "application/p21": {
        source: "iana"
      },
      "application/p21+zip": {
        source: "iana",
        compressible: false
      },
      "application/p2p-overlay+xml": {
        source: "iana",
        compressible: true,
        extensions: ["relo"]
      },
      "application/parityfec": {
        source: "iana"
      },
      "application/passport": {
        source: "iana"
      },
      "application/patch-ops-error+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xer"]
      },
      "application/pdf": {
        source: "iana",
        compressible: false,
        extensions: ["pdf"]
      },
      "application/pdx": {
        source: "iana"
      },
      "application/pem-certificate-chain": {
        source: "iana"
      },
      "application/pgp-encrypted": {
        source: "iana",
        compressible: false,
        extensions: ["pgp"]
      },
      "application/pgp-keys": {
        source: "iana",
        extensions: ["asc"]
      },
      "application/pgp-signature": {
        source: "iana",
        extensions: ["asc", "sig"]
      },
      "application/pics-rules": {
        source: "apache",
        extensions: ["prf"]
      },
      "application/pidf+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/pidf-diff+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/pkcs10": {
        source: "iana",
        extensions: ["p10"]
      },
      "application/pkcs12": {
        source: "iana"
      },
      "application/pkcs7-mime": {
        source: "iana",
        extensions: ["p7m", "p7c"]
      },
      "application/pkcs7-signature": {
        source: "iana",
        extensions: ["p7s"]
      },
      "application/pkcs8": {
        source: "iana",
        extensions: ["p8"]
      },
      "application/pkcs8-encrypted": {
        source: "iana"
      },
      "application/pkix-attr-cert": {
        source: "iana",
        extensions: ["ac"]
      },
      "application/pkix-cert": {
        source: "iana",
        extensions: ["cer"]
      },
      "application/pkix-crl": {
        source: "iana",
        extensions: ["crl"]
      },
      "application/pkix-pkipath": {
        source: "iana",
        extensions: ["pkipath"]
      },
      "application/pkixcmp": {
        source: "iana",
        extensions: ["pki"]
      },
      "application/pls+xml": {
        source: "iana",
        compressible: true,
        extensions: ["pls"]
      },
      "application/poc-settings+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/postscript": {
        source: "iana",
        compressible: true,
        extensions: ["ai", "eps", "ps"]
      },
      "application/ppsp-tracker+json": {
        source: "iana",
        compressible: true
      },
      "application/problem+json": {
        source: "iana",
        compressible: true
      },
      "application/problem+xml": {
        source: "iana",
        compressible: true
      },
      "application/provenance+xml": {
        source: "iana",
        compressible: true,
        extensions: ["provx"]
      },
      "application/prs.alvestrand.titrax-sheet": {
        source: "iana"
      },
      "application/prs.cww": {
        source: "iana",
        extensions: ["cww"]
      },
      "application/prs.cyn": {
        source: "iana",
        charset: "7-BIT"
      },
      "application/prs.hpub+zip": {
        source: "iana",
        compressible: false
      },
      "application/prs.nprend": {
        source: "iana"
      },
      "application/prs.plucker": {
        source: "iana"
      },
      "application/prs.rdf-xml-crypt": {
        source: "iana"
      },
      "application/prs.xsf+xml": {
        source: "iana",
        compressible: true
      },
      "application/pskc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["pskcxml"]
      },
      "application/pvd+json": {
        source: "iana",
        compressible: true
      },
      "application/qsig": {
        source: "iana"
      },
      "application/raml+yaml": {
        compressible: true,
        extensions: ["raml"]
      },
      "application/raptorfec": {
        source: "iana"
      },
      "application/rdap+json": {
        source: "iana",
        compressible: true
      },
      "application/rdf+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rdf", "owl"]
      },
      "application/reginfo+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rif"]
      },
      "application/relax-ng-compact-syntax": {
        source: "iana",
        extensions: ["rnc"]
      },
      "application/remote-printing": {
        source: "iana"
      },
      "application/reputon+json": {
        source: "iana",
        compressible: true
      },
      "application/resource-lists+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rl"]
      },
      "application/resource-lists-diff+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rld"]
      },
      "application/rfc+xml": {
        source: "iana",
        compressible: true
      },
      "application/riscos": {
        source: "iana"
      },
      "application/rlmi+xml": {
        source: "iana",
        compressible: true
      },
      "application/rls-services+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rs"]
      },
      "application/route-apd+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rapd"]
      },
      "application/route-s-tsid+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sls"]
      },
      "application/route-usd+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rusd"]
      },
      "application/rpki-ghostbusters": {
        source: "iana",
        extensions: ["gbr"]
      },
      "application/rpki-manifest": {
        source: "iana",
        extensions: ["mft"]
      },
      "application/rpki-publication": {
        source: "iana"
      },
      "application/rpki-roa": {
        source: "iana",
        extensions: ["roa"]
      },
      "application/rpki-updown": {
        source: "iana"
      },
      "application/rsd+xml": {
        source: "apache",
        compressible: true,
        extensions: ["rsd"]
      },
      "application/rss+xml": {
        source: "apache",
        compressible: true,
        extensions: ["rss"]
      },
      "application/rtf": {
        source: "iana",
        compressible: true,
        extensions: ["rtf"]
      },
      "application/rtploopback": {
        source: "iana"
      },
      "application/rtx": {
        source: "iana"
      },
      "application/samlassertion+xml": {
        source: "iana",
        compressible: true
      },
      "application/samlmetadata+xml": {
        source: "iana",
        compressible: true
      },
      "application/sarif+json": {
        source: "iana",
        compressible: true
      },
      "application/sarif-external-properties+json": {
        source: "iana",
        compressible: true
      },
      "application/sbe": {
        source: "iana"
      },
      "application/sbml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sbml"]
      },
      "application/scaip+xml": {
        source: "iana",
        compressible: true
      },
      "application/scim+json": {
        source: "iana",
        compressible: true
      },
      "application/scvp-cv-request": {
        source: "iana",
        extensions: ["scq"]
      },
      "application/scvp-cv-response": {
        source: "iana",
        extensions: ["scs"]
      },
      "application/scvp-vp-request": {
        source: "iana",
        extensions: ["spq"]
      },
      "application/scvp-vp-response": {
        source: "iana",
        extensions: ["spp"]
      },
      "application/sdp": {
        source: "iana",
        extensions: ["sdp"]
      },
      "application/secevent+jwt": {
        source: "iana"
      },
      "application/senml+cbor": {
        source: "iana"
      },
      "application/senml+json": {
        source: "iana",
        compressible: true
      },
      "application/senml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["senmlx"]
      },
      "application/senml-etch+cbor": {
        source: "iana"
      },
      "application/senml-etch+json": {
        source: "iana",
        compressible: true
      },
      "application/senml-exi": {
        source: "iana"
      },
      "application/sensml+cbor": {
        source: "iana"
      },
      "application/sensml+json": {
        source: "iana",
        compressible: true
      },
      "application/sensml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sensmlx"]
      },
      "application/sensml-exi": {
        source: "iana"
      },
      "application/sep+xml": {
        source: "iana",
        compressible: true
      },
      "application/sep-exi": {
        source: "iana"
      },
      "application/session-info": {
        source: "iana"
      },
      "application/set-payment": {
        source: "iana"
      },
      "application/set-payment-initiation": {
        source: "iana",
        extensions: ["setpay"]
      },
      "application/set-registration": {
        source: "iana"
      },
      "application/set-registration-initiation": {
        source: "iana",
        extensions: ["setreg"]
      },
      "application/sgml": {
        source: "iana"
      },
      "application/sgml-open-catalog": {
        source: "iana"
      },
      "application/shf+xml": {
        source: "iana",
        compressible: true,
        extensions: ["shf"]
      },
      "application/sieve": {
        source: "iana",
        extensions: ["siv", "sieve"]
      },
      "application/simple-filter+xml": {
        source: "iana",
        compressible: true
      },
      "application/simple-message-summary": {
        source: "iana"
      },
      "application/simplesymbolcontainer": {
        source: "iana"
      },
      "application/sipc": {
        source: "iana"
      },
      "application/slate": {
        source: "iana"
      },
      "application/smil": {
        source: "iana"
      },
      "application/smil+xml": {
        source: "iana",
        compressible: true,
        extensions: ["smi", "smil"]
      },
      "application/smpte336m": {
        source: "iana"
      },
      "application/soap+fastinfoset": {
        source: "iana"
      },
      "application/soap+xml": {
        source: "iana",
        compressible: true
      },
      "application/sparql-query": {
        source: "iana",
        extensions: ["rq"]
      },
      "application/sparql-results+xml": {
        source: "iana",
        compressible: true,
        extensions: ["srx"]
      },
      "application/spdx+json": {
        source: "iana",
        compressible: true
      },
      "application/spirits-event+xml": {
        source: "iana",
        compressible: true
      },
      "application/sql": {
        source: "iana"
      },
      "application/srgs": {
        source: "iana",
        extensions: ["gram"]
      },
      "application/srgs+xml": {
        source: "iana",
        compressible: true,
        extensions: ["grxml"]
      },
      "application/sru+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sru"]
      },
      "application/ssdl+xml": {
        source: "apache",
        compressible: true,
        extensions: ["ssdl"]
      },
      "application/ssml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ssml"]
      },
      "application/stix+json": {
        source: "iana",
        compressible: true
      },
      "application/swid+xml": {
        source: "iana",
        compressible: true,
        extensions: ["swidtag"]
      },
      "application/tamp-apex-update": {
        source: "iana"
      },
      "application/tamp-apex-update-confirm": {
        source: "iana"
      },
      "application/tamp-community-update": {
        source: "iana"
      },
      "application/tamp-community-update-confirm": {
        source: "iana"
      },
      "application/tamp-error": {
        source: "iana"
      },
      "application/tamp-sequence-adjust": {
        source: "iana"
      },
      "application/tamp-sequence-adjust-confirm": {
        source: "iana"
      },
      "application/tamp-status-query": {
        source: "iana"
      },
      "application/tamp-status-response": {
        source: "iana"
      },
      "application/tamp-update": {
        source: "iana"
      },
      "application/tamp-update-confirm": {
        source: "iana"
      },
      "application/tar": {
        compressible: true
      },
      "application/taxii+json": {
        source: "iana",
        compressible: true
      },
      "application/td+json": {
        source: "iana",
        compressible: true
      },
      "application/tei+xml": {
        source: "iana",
        compressible: true,
        extensions: ["tei", "teicorpus"]
      },
      "application/tetra_isi": {
        source: "iana"
      },
      "application/thraud+xml": {
        source: "iana",
        compressible: true,
        extensions: ["tfi"]
      },
      "application/timestamp-query": {
        source: "iana"
      },
      "application/timestamp-reply": {
        source: "iana"
      },
      "application/timestamped-data": {
        source: "iana",
        extensions: ["tsd"]
      },
      "application/tlsrpt+gzip": {
        source: "iana"
      },
      "application/tlsrpt+json": {
        source: "iana",
        compressible: true
      },
      "application/tnauthlist": {
        source: "iana"
      },
      "application/token-introspection+jwt": {
        source: "iana"
      },
      "application/toml": {
        compressible: true,
        extensions: ["toml"]
      },
      "application/trickle-ice-sdpfrag": {
        source: "iana"
      },
      "application/trig": {
        source: "iana",
        extensions: ["trig"]
      },
      "application/ttml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ttml"]
      },
      "application/tve-trigger": {
        source: "iana"
      },
      "application/tzif": {
        source: "iana"
      },
      "application/tzif-leap": {
        source: "iana"
      },
      "application/ubjson": {
        compressible: false,
        extensions: ["ubj"]
      },
      "application/ulpfec": {
        source: "iana"
      },
      "application/urc-grpsheet+xml": {
        source: "iana",
        compressible: true
      },
      "application/urc-ressheet+xml": {
        source: "iana",
        compressible: true,
        extensions: ["rsheet"]
      },
      "application/urc-targetdesc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["td"]
      },
      "application/urc-uisocketdesc+xml": {
        source: "iana",
        compressible: true
      },
      "application/vcard+json": {
        source: "iana",
        compressible: true
      },
      "application/vcard+xml": {
        source: "iana",
        compressible: true
      },
      "application/vemmi": {
        source: "iana"
      },
      "application/vividence.scriptfile": {
        source: "apache"
      },
      "application/vnd.1000minds.decision-model+xml": {
        source: "iana",
        compressible: true,
        extensions: ["1km"]
      },
      "application/vnd.3gpp-prose+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp-prose-pc3ch+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp-v2x-local-service-information": {
        source: "iana"
      },
      "application/vnd.3gpp.5gnas": {
        source: "iana"
      },
      "application/vnd.3gpp.access-transfer-events+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.bsf+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.gmop+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.gtpc": {
        source: "iana"
      },
      "application/vnd.3gpp.interworking-data": {
        source: "iana"
      },
      "application/vnd.3gpp.lpp": {
        source: "iana"
      },
      "application/vnd.3gpp.mc-signalling-ear": {
        source: "iana"
      },
      "application/vnd.3gpp.mcdata-affiliation-command+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-payload": {
        source: "iana"
      },
      "application/vnd.3gpp.mcdata-service-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-signalling": {
        source: "iana"
      },
      "application/vnd.3gpp.mcdata-ue-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcdata-user-profile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-affiliation-command+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-floor-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-location-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-mbms-usage-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-service-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-signed+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-ue-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-ue-init-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcptt-user-profile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-affiliation-command+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-affiliation-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-location-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-mbms-usage-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-service-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-transmission-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-ue-config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mcvideo-user-profile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.mid-call+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.ngap": {
        source: "iana"
      },
      "application/vnd.3gpp.pfcp": {
        source: "iana"
      },
      "application/vnd.3gpp.pic-bw-large": {
        source: "iana",
        extensions: ["plb"]
      },
      "application/vnd.3gpp.pic-bw-small": {
        source: "iana",
        extensions: ["psb"]
      },
      "application/vnd.3gpp.pic-bw-var": {
        source: "iana",
        extensions: ["pvb"]
      },
      "application/vnd.3gpp.s1ap": {
        source: "iana"
      },
      "application/vnd.3gpp.sms": {
        source: "iana"
      },
      "application/vnd.3gpp.sms+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.srvcc-ext+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.srvcc-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.state-and-event-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp.ussd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp2.bcmcsinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.3gpp2.sms": {
        source: "iana"
      },
      "application/vnd.3gpp2.tcap": {
        source: "iana",
        extensions: ["tcap"]
      },
      "application/vnd.3lightssoftware.imagescal": {
        source: "iana"
      },
      "application/vnd.3m.post-it-notes": {
        source: "iana",
        extensions: ["pwn"]
      },
      "application/vnd.accpac.simply.aso": {
        source: "iana",
        extensions: ["aso"]
      },
      "application/vnd.accpac.simply.imp": {
        source: "iana",
        extensions: ["imp"]
      },
      "application/vnd.acucobol": {
        source: "iana",
        extensions: ["acu"]
      },
      "application/vnd.acucorp": {
        source: "iana",
        extensions: ["atc", "acutc"]
      },
      "application/vnd.adobe.air-application-installer-package+zip": {
        source: "apache",
        compressible: false,
        extensions: ["air"]
      },
      "application/vnd.adobe.flash.movie": {
        source: "iana"
      },
      "application/vnd.adobe.formscentral.fcdt": {
        source: "iana",
        extensions: ["fcdt"]
      },
      "application/vnd.adobe.fxp": {
        source: "iana",
        extensions: ["fxp", "fxpl"]
      },
      "application/vnd.adobe.partial-upload": {
        source: "iana"
      },
      "application/vnd.adobe.xdp+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xdp"]
      },
      "application/vnd.adobe.xfdf": {
        source: "iana",
        extensions: ["xfdf"]
      },
      "application/vnd.aether.imp": {
        source: "iana"
      },
      "application/vnd.afpc.afplinedata": {
        source: "iana"
      },
      "application/vnd.afpc.afplinedata-pagedef": {
        source: "iana"
      },
      "application/vnd.afpc.cmoca-cmresource": {
        source: "iana"
      },
      "application/vnd.afpc.foca-charset": {
        source: "iana"
      },
      "application/vnd.afpc.foca-codedfont": {
        source: "iana"
      },
      "application/vnd.afpc.foca-codepage": {
        source: "iana"
      },
      "application/vnd.afpc.modca": {
        source: "iana"
      },
      "application/vnd.afpc.modca-cmtable": {
        source: "iana"
      },
      "application/vnd.afpc.modca-formdef": {
        source: "iana"
      },
      "application/vnd.afpc.modca-mediummap": {
        source: "iana"
      },
      "application/vnd.afpc.modca-objectcontainer": {
        source: "iana"
      },
      "application/vnd.afpc.modca-overlay": {
        source: "iana"
      },
      "application/vnd.afpc.modca-pagesegment": {
        source: "iana"
      },
      "application/vnd.age": {
        source: "iana",
        extensions: ["age"]
      },
      "application/vnd.ah-barcode": {
        source: "iana"
      },
      "application/vnd.ahead.space": {
        source: "iana",
        extensions: ["ahead"]
      },
      "application/vnd.airzip.filesecure.azf": {
        source: "iana",
        extensions: ["azf"]
      },
      "application/vnd.airzip.filesecure.azs": {
        source: "iana",
        extensions: ["azs"]
      },
      "application/vnd.amadeus+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.amazon.ebook": {
        source: "apache",
        extensions: ["azw"]
      },
      "application/vnd.amazon.mobi8-ebook": {
        source: "iana"
      },
      "application/vnd.americandynamics.acc": {
        source: "iana",
        extensions: ["acc"]
      },
      "application/vnd.amiga.ami": {
        source: "iana",
        extensions: ["ami"]
      },
      "application/vnd.amundsen.maze+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.android.ota": {
        source: "iana"
      },
      "application/vnd.android.package-archive": {
        source: "apache",
        compressible: false,
        extensions: ["apk"]
      },
      "application/vnd.anki": {
        source: "iana"
      },
      "application/vnd.anser-web-certificate-issue-initiation": {
        source: "iana",
        extensions: ["cii"]
      },
      "application/vnd.anser-web-funds-transfer-initiation": {
        source: "apache",
        extensions: ["fti"]
      },
      "application/vnd.antix.game-component": {
        source: "iana",
        extensions: ["atx"]
      },
      "application/vnd.apache.arrow.file": {
        source: "iana"
      },
      "application/vnd.apache.arrow.stream": {
        source: "iana"
      },
      "application/vnd.apache.thrift.binary": {
        source: "iana"
      },
      "application/vnd.apache.thrift.compact": {
        source: "iana"
      },
      "application/vnd.apache.thrift.json": {
        source: "iana"
      },
      "application/vnd.api+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.aplextor.warrp+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.apothekende.reservation+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.apple.installer+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mpkg"]
      },
      "application/vnd.apple.keynote": {
        source: "iana",
        extensions: ["key"]
      },
      "application/vnd.apple.mpegurl": {
        source: "iana",
        extensions: ["m3u8"]
      },
      "application/vnd.apple.numbers": {
        source: "iana",
        extensions: ["numbers"]
      },
      "application/vnd.apple.pages": {
        source: "iana",
        extensions: ["pages"]
      },
      "application/vnd.apple.pkpass": {
        compressible: false,
        extensions: ["pkpass"]
      },
      "application/vnd.arastra.swi": {
        source: "iana"
      },
      "application/vnd.aristanetworks.swi": {
        source: "iana",
        extensions: ["swi"]
      },
      "application/vnd.artisan+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.artsquare": {
        source: "iana"
      },
      "application/vnd.astraea-software.iota": {
        source: "iana",
        extensions: ["iota"]
      },
      "application/vnd.audiograph": {
        source: "iana",
        extensions: ["aep"]
      },
      "application/vnd.autopackage": {
        source: "iana"
      },
      "application/vnd.avalon+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.avistar+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.balsamiq.bmml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["bmml"]
      },
      "application/vnd.balsamiq.bmpr": {
        source: "iana"
      },
      "application/vnd.banana-accounting": {
        source: "iana"
      },
      "application/vnd.bbf.usp.error": {
        source: "iana"
      },
      "application/vnd.bbf.usp.msg": {
        source: "iana"
      },
      "application/vnd.bbf.usp.msg+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.bekitzur-stech+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.bint.med-content": {
        source: "iana"
      },
      "application/vnd.biopax.rdf+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.blink-idb-value-wrapper": {
        source: "iana"
      },
      "application/vnd.blueice.multipass": {
        source: "iana",
        extensions: ["mpm"]
      },
      "application/vnd.bluetooth.ep.oob": {
        source: "iana"
      },
      "application/vnd.bluetooth.le.oob": {
        source: "iana"
      },
      "application/vnd.bmi": {
        source: "iana",
        extensions: ["bmi"]
      },
      "application/vnd.bpf": {
        source: "iana"
      },
      "application/vnd.bpf3": {
        source: "iana"
      },
      "application/vnd.businessobjects": {
        source: "iana",
        extensions: ["rep"]
      },
      "application/vnd.byu.uapi+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cab-jscript": {
        source: "iana"
      },
      "application/vnd.canon-cpdl": {
        source: "iana"
      },
      "application/vnd.canon-lips": {
        source: "iana"
      },
      "application/vnd.capasystems-pg+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cendio.thinlinc.clientconf": {
        source: "iana"
      },
      "application/vnd.century-systems.tcp_stream": {
        source: "iana"
      },
      "application/vnd.chemdraw+xml": {
        source: "iana",
        compressible: true,
        extensions: ["cdxml"]
      },
      "application/vnd.chess-pgn": {
        source: "iana"
      },
      "application/vnd.chipnuts.karaoke-mmd": {
        source: "iana",
        extensions: ["mmd"]
      },
      "application/vnd.ciedi": {
        source: "iana"
      },
      "application/vnd.cinderella": {
        source: "iana",
        extensions: ["cdy"]
      },
      "application/vnd.cirpack.isdn-ext": {
        source: "iana"
      },
      "application/vnd.citationstyles.style+xml": {
        source: "iana",
        compressible: true,
        extensions: ["csl"]
      },
      "application/vnd.claymore": {
        source: "iana",
        extensions: ["cla"]
      },
      "application/vnd.cloanto.rp9": {
        source: "iana",
        extensions: ["rp9"]
      },
      "application/vnd.clonk.c4group": {
        source: "iana",
        extensions: ["c4g", "c4d", "c4f", "c4p", "c4u"]
      },
      "application/vnd.cluetrust.cartomobile-config": {
        source: "iana",
        extensions: ["c11amc"]
      },
      "application/vnd.cluetrust.cartomobile-config-pkg": {
        source: "iana",
        extensions: ["c11amz"]
      },
      "application/vnd.coffeescript": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.document": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.document-template": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.presentation": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.presentation-template": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.spreadsheet": {
        source: "iana"
      },
      "application/vnd.collabio.xodocuments.spreadsheet-template": {
        source: "iana"
      },
      "application/vnd.collection+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.collection.doc+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.collection.next+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.comicbook+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.comicbook-rar": {
        source: "iana"
      },
      "application/vnd.commerce-battelle": {
        source: "iana"
      },
      "application/vnd.commonspace": {
        source: "iana",
        extensions: ["csp"]
      },
      "application/vnd.contact.cmsg": {
        source: "iana",
        extensions: ["cdbcmsg"]
      },
      "application/vnd.coreos.ignition+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cosmocaller": {
        source: "iana",
        extensions: ["cmc"]
      },
      "application/vnd.crick.clicker": {
        source: "iana",
        extensions: ["clkx"]
      },
      "application/vnd.crick.clicker.keyboard": {
        source: "iana",
        extensions: ["clkk"]
      },
      "application/vnd.crick.clicker.palette": {
        source: "iana",
        extensions: ["clkp"]
      },
      "application/vnd.crick.clicker.template": {
        source: "iana",
        extensions: ["clkt"]
      },
      "application/vnd.crick.clicker.wordbank": {
        source: "iana",
        extensions: ["clkw"]
      },
      "application/vnd.criticaltools.wbs+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wbs"]
      },
      "application/vnd.cryptii.pipe+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.crypto-shade-file": {
        source: "iana"
      },
      "application/vnd.cryptomator.encrypted": {
        source: "iana"
      },
      "application/vnd.cryptomator.vault": {
        source: "iana"
      },
      "application/vnd.ctc-posml": {
        source: "iana",
        extensions: ["pml"]
      },
      "application/vnd.ctct.ws+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cups-pdf": {
        source: "iana"
      },
      "application/vnd.cups-postscript": {
        source: "iana"
      },
      "application/vnd.cups-ppd": {
        source: "iana",
        extensions: ["ppd"]
      },
      "application/vnd.cups-raster": {
        source: "iana"
      },
      "application/vnd.cups-raw": {
        source: "iana"
      },
      "application/vnd.curl": {
        source: "iana"
      },
      "application/vnd.curl.car": {
        source: "apache",
        extensions: ["car"]
      },
      "application/vnd.curl.pcurl": {
        source: "apache",
        extensions: ["pcurl"]
      },
      "application/vnd.cyan.dean.root+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cybank": {
        source: "iana"
      },
      "application/vnd.cyclonedx+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.cyclonedx+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.d2l.coursepackage1p0+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.d3m-dataset": {
        source: "iana"
      },
      "application/vnd.d3m-problem": {
        source: "iana"
      },
      "application/vnd.dart": {
        source: "iana",
        compressible: true,
        extensions: ["dart"]
      },
      "application/vnd.data-vision.rdz": {
        source: "iana",
        extensions: ["rdz"]
      },
      "application/vnd.datapackage+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dataresource+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dbf": {
        source: "iana",
        extensions: ["dbf"]
      },
      "application/vnd.debian.binary-package": {
        source: "iana"
      },
      "application/vnd.dece.data": {
        source: "iana",
        extensions: ["uvf", "uvvf", "uvd", "uvvd"]
      },
      "application/vnd.dece.ttml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["uvt", "uvvt"]
      },
      "application/vnd.dece.unspecified": {
        source: "iana",
        extensions: ["uvx", "uvvx"]
      },
      "application/vnd.dece.zip": {
        source: "iana",
        extensions: ["uvz", "uvvz"]
      },
      "application/vnd.denovo.fcselayout-link": {
        source: "iana",
        extensions: ["fe_launch"]
      },
      "application/vnd.desmume.movie": {
        source: "iana"
      },
      "application/vnd.dir-bi.plate-dl-nosuffix": {
        source: "iana"
      },
      "application/vnd.dm.delegation+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dna": {
        source: "iana",
        extensions: ["dna"]
      },
      "application/vnd.document+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dolby.mlp": {
        source: "apache",
        extensions: ["mlp"]
      },
      "application/vnd.dolby.mobile.1": {
        source: "iana"
      },
      "application/vnd.dolby.mobile.2": {
        source: "iana"
      },
      "application/vnd.doremir.scorecloud-binary-document": {
        source: "iana"
      },
      "application/vnd.dpgraph": {
        source: "iana",
        extensions: ["dpg"]
      },
      "application/vnd.dreamfactory": {
        source: "iana",
        extensions: ["dfac"]
      },
      "application/vnd.drive+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ds-keypoint": {
        source: "apache",
        extensions: ["kpxx"]
      },
      "application/vnd.dtg.local": {
        source: "iana"
      },
      "application/vnd.dtg.local.flash": {
        source: "iana"
      },
      "application/vnd.dtg.local.html": {
        source: "iana"
      },
      "application/vnd.dvb.ait": {
        source: "iana",
        extensions: ["ait"]
      },
      "application/vnd.dvb.dvbisl+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.dvbj": {
        source: "iana"
      },
      "application/vnd.dvb.esgcontainer": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcdftnotifaccess": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcesgaccess": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcesgaccess2": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcesgpdd": {
        source: "iana"
      },
      "application/vnd.dvb.ipdcroaming": {
        source: "iana"
      },
      "application/vnd.dvb.iptv.alfec-base": {
        source: "iana"
      },
      "application/vnd.dvb.iptv.alfec-enhancement": {
        source: "iana"
      },
      "application/vnd.dvb.notif-aggregate-root+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-container+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-generic+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-ia-msglist+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-ia-registration-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-ia-registration-response+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.notif-init+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.dvb.pfr": {
        source: "iana"
      },
      "application/vnd.dvb.service": {
        source: "iana",
        extensions: ["svc"]
      },
      "application/vnd.dxr": {
        source: "iana"
      },
      "application/vnd.dynageo": {
        source: "iana",
        extensions: ["geo"]
      },
      "application/vnd.dzr": {
        source: "iana"
      },
      "application/vnd.easykaraoke.cdgdownload": {
        source: "iana"
      },
      "application/vnd.ecdis-update": {
        source: "iana"
      },
      "application/vnd.ecip.rlp": {
        source: "iana"
      },
      "application/vnd.eclipse.ditto+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ecowin.chart": {
        source: "iana",
        extensions: ["mag"]
      },
      "application/vnd.ecowin.filerequest": {
        source: "iana"
      },
      "application/vnd.ecowin.fileupdate": {
        source: "iana"
      },
      "application/vnd.ecowin.series": {
        source: "iana"
      },
      "application/vnd.ecowin.seriesrequest": {
        source: "iana"
      },
      "application/vnd.ecowin.seriesupdate": {
        source: "iana"
      },
      "application/vnd.efi.img": {
        source: "iana"
      },
      "application/vnd.efi.iso": {
        source: "iana"
      },
      "application/vnd.emclient.accessrequest+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.enliven": {
        source: "iana",
        extensions: ["nml"]
      },
      "application/vnd.enphase.envoy": {
        source: "iana"
      },
      "application/vnd.eprints.data+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.epson.esf": {
        source: "iana",
        extensions: ["esf"]
      },
      "application/vnd.epson.msf": {
        source: "iana",
        extensions: ["msf"]
      },
      "application/vnd.epson.quickanime": {
        source: "iana",
        extensions: ["qam"]
      },
      "application/vnd.epson.salt": {
        source: "iana",
        extensions: ["slt"]
      },
      "application/vnd.epson.ssf": {
        source: "iana",
        extensions: ["ssf"]
      },
      "application/vnd.ericsson.quickcall": {
        source: "iana"
      },
      "application/vnd.espass-espass+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.eszigno3+xml": {
        source: "iana",
        compressible: true,
        extensions: ["es3", "et3"]
      },
      "application/vnd.etsi.aoc+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.asic-e+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.etsi.asic-s+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.etsi.cug+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvcommand+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvdiscovery+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvprofile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvsad-bc+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvsad-cod+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvsad-npvr+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvservice+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvsync+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.iptvueprofile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.mcid+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.mheg5": {
        source: "iana"
      },
      "application/vnd.etsi.overload-control-policy-dataset+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.pstn+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.sci+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.simservs+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.timestamp-token": {
        source: "iana"
      },
      "application/vnd.etsi.tsl+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.etsi.tsl.der": {
        source: "iana"
      },
      "application/vnd.eu.kasparian.car+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.eudora.data": {
        source: "iana"
      },
      "application/vnd.evolv.ecig.profile": {
        source: "iana"
      },
      "application/vnd.evolv.ecig.settings": {
        source: "iana"
      },
      "application/vnd.evolv.ecig.theme": {
        source: "iana"
      },
      "application/vnd.exstream-empower+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.exstream-package": {
        source: "iana"
      },
      "application/vnd.ezpix-album": {
        source: "iana",
        extensions: ["ez2"]
      },
      "application/vnd.ezpix-package": {
        source: "iana",
        extensions: ["ez3"]
      },
      "application/vnd.f-secure.mobile": {
        source: "iana"
      },
      "application/vnd.familysearch.gedcom+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.fastcopy-disk-image": {
        source: "iana"
      },
      "application/vnd.fdf": {
        source: "iana",
        extensions: ["fdf"]
      },
      "application/vnd.fdsn.mseed": {
        source: "iana",
        extensions: ["mseed"]
      },
      "application/vnd.fdsn.seed": {
        source: "iana",
        extensions: ["seed", "dataless"]
      },
      "application/vnd.ffsns": {
        source: "iana"
      },
      "application/vnd.ficlab.flb+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.filmit.zfc": {
        source: "iana"
      },
      "application/vnd.fints": {
        source: "iana"
      },
      "application/vnd.firemonkeys.cloudcell": {
        source: "iana"
      },
      "application/vnd.flographit": {
        source: "iana",
        extensions: ["gph"]
      },
      "application/vnd.fluxtime.clip": {
        source: "iana",
        extensions: ["ftc"]
      },
      "application/vnd.font-fontforge-sfd": {
        source: "iana"
      },
      "application/vnd.framemaker": {
        source: "iana",
        extensions: ["fm", "frame", "maker", "book"]
      },
      "application/vnd.frogans.fnc": {
        source: "iana",
        extensions: ["fnc"]
      },
      "application/vnd.frogans.ltf": {
        source: "iana",
        extensions: ["ltf"]
      },
      "application/vnd.fsc.weblaunch": {
        source: "iana",
        extensions: ["fsc"]
      },
      "application/vnd.fujifilm.fb.docuworks": {
        source: "iana"
      },
      "application/vnd.fujifilm.fb.docuworks.binder": {
        source: "iana"
      },
      "application/vnd.fujifilm.fb.docuworks.container": {
        source: "iana"
      },
      "application/vnd.fujifilm.fb.jfi+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.fujitsu.oasys": {
        source: "iana",
        extensions: ["oas"]
      },
      "application/vnd.fujitsu.oasys2": {
        source: "iana",
        extensions: ["oa2"]
      },
      "application/vnd.fujitsu.oasys3": {
        source: "iana",
        extensions: ["oa3"]
      },
      "application/vnd.fujitsu.oasysgp": {
        source: "iana",
        extensions: ["fg5"]
      },
      "application/vnd.fujitsu.oasysprs": {
        source: "iana",
        extensions: ["bh2"]
      },
      "application/vnd.fujixerox.art-ex": {
        source: "iana"
      },
      "application/vnd.fujixerox.art4": {
        source: "iana"
      },
      "application/vnd.fujixerox.ddd": {
        source: "iana",
        extensions: ["ddd"]
      },
      "application/vnd.fujixerox.docuworks": {
        source: "iana",
        extensions: ["xdw"]
      },
      "application/vnd.fujixerox.docuworks.binder": {
        source: "iana",
        extensions: ["xbd"]
      },
      "application/vnd.fujixerox.docuworks.container": {
        source: "iana"
      },
      "application/vnd.fujixerox.hbpl": {
        source: "iana"
      },
      "application/vnd.fut-misnet": {
        source: "iana"
      },
      "application/vnd.futoin+cbor": {
        source: "iana"
      },
      "application/vnd.futoin+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.fuzzysheet": {
        source: "iana",
        extensions: ["fzs"]
      },
      "application/vnd.genomatix.tuxedo": {
        source: "iana",
        extensions: ["txd"]
      },
      "application/vnd.gentics.grd+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.geo+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.geocube+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.geogebra.file": {
        source: "iana",
        extensions: ["ggb"]
      },
      "application/vnd.geogebra.slides": {
        source: "iana"
      },
      "application/vnd.geogebra.tool": {
        source: "iana",
        extensions: ["ggt"]
      },
      "application/vnd.geometry-explorer": {
        source: "iana",
        extensions: ["gex", "gre"]
      },
      "application/vnd.geonext": {
        source: "iana",
        extensions: ["gxt"]
      },
      "application/vnd.geoplan": {
        source: "iana",
        extensions: ["g2w"]
      },
      "application/vnd.geospace": {
        source: "iana",
        extensions: ["g3w"]
      },
      "application/vnd.gerber": {
        source: "iana"
      },
      "application/vnd.globalplatform.card-content-mgt": {
        source: "iana"
      },
      "application/vnd.globalplatform.card-content-mgt-response": {
        source: "iana"
      },
      "application/vnd.gmx": {
        source: "iana",
        extensions: ["gmx"]
      },
      "application/vnd.google-apps.document": {
        compressible: false,
        extensions: ["gdoc"]
      },
      "application/vnd.google-apps.presentation": {
        compressible: false,
        extensions: ["gslides"]
      },
      "application/vnd.google-apps.spreadsheet": {
        compressible: false,
        extensions: ["gsheet"]
      },
      "application/vnd.google-earth.kml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["kml"]
      },
      "application/vnd.google-earth.kmz": {
        source: "iana",
        compressible: false,
        extensions: ["kmz"]
      },
      "application/vnd.gov.sk.e-form+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.gov.sk.e-form+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.gov.sk.xmldatacontainer+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.grafeq": {
        source: "iana",
        extensions: ["gqf", "gqs"]
      },
      "application/vnd.gridmp": {
        source: "iana"
      },
      "application/vnd.groove-account": {
        source: "iana",
        extensions: ["gac"]
      },
      "application/vnd.groove-help": {
        source: "iana",
        extensions: ["ghf"]
      },
      "application/vnd.groove-identity-message": {
        source: "iana",
        extensions: ["gim"]
      },
      "application/vnd.groove-injector": {
        source: "iana",
        extensions: ["grv"]
      },
      "application/vnd.groove-tool-message": {
        source: "iana",
        extensions: ["gtm"]
      },
      "application/vnd.groove-tool-template": {
        source: "iana",
        extensions: ["tpl"]
      },
      "application/vnd.groove-vcard": {
        source: "iana",
        extensions: ["vcg"]
      },
      "application/vnd.hal+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hal+xml": {
        source: "iana",
        compressible: true,
        extensions: ["hal"]
      },
      "application/vnd.handheld-entertainment+xml": {
        source: "iana",
        compressible: true,
        extensions: ["zmm"]
      },
      "application/vnd.hbci": {
        source: "iana",
        extensions: ["hbci"]
      },
      "application/vnd.hc+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hcl-bireports": {
        source: "iana"
      },
      "application/vnd.hdt": {
        source: "iana"
      },
      "application/vnd.heroku+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hhe.lesson-player": {
        source: "iana",
        extensions: ["les"]
      },
      "application/vnd.hl7cda+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.hl7v2+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.hp-hpgl": {
        source: "iana",
        extensions: ["hpgl"]
      },
      "application/vnd.hp-hpid": {
        source: "iana",
        extensions: ["hpid"]
      },
      "application/vnd.hp-hps": {
        source: "iana",
        extensions: ["hps"]
      },
      "application/vnd.hp-jlyt": {
        source: "iana",
        extensions: ["jlt"]
      },
      "application/vnd.hp-pcl": {
        source: "iana",
        extensions: ["pcl"]
      },
      "application/vnd.hp-pclxl": {
        source: "iana",
        extensions: ["pclxl"]
      },
      "application/vnd.httphone": {
        source: "iana"
      },
      "application/vnd.hydrostatix.sof-data": {
        source: "iana",
        extensions: ["sfd-hdstx"]
      },
      "application/vnd.hyper+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hyper-item+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hyperdrive+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.hzn-3d-crossword": {
        source: "iana"
      },
      "application/vnd.ibm.afplinedata": {
        source: "iana"
      },
      "application/vnd.ibm.electronic-media": {
        source: "iana"
      },
      "application/vnd.ibm.minipay": {
        source: "iana",
        extensions: ["mpy"]
      },
      "application/vnd.ibm.modcap": {
        source: "iana",
        extensions: ["afp", "listafp", "list3820"]
      },
      "application/vnd.ibm.rights-management": {
        source: "iana",
        extensions: ["irm"]
      },
      "application/vnd.ibm.secure-container": {
        source: "iana",
        extensions: ["sc"]
      },
      "application/vnd.iccprofile": {
        source: "iana",
        extensions: ["icc", "icm"]
      },
      "application/vnd.ieee.1905": {
        source: "iana"
      },
      "application/vnd.igloader": {
        source: "iana",
        extensions: ["igl"]
      },
      "application/vnd.imagemeter.folder+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.imagemeter.image+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.immervision-ivp": {
        source: "iana",
        extensions: ["ivp"]
      },
      "application/vnd.immervision-ivu": {
        source: "iana",
        extensions: ["ivu"]
      },
      "application/vnd.ims.imsccv1p1": {
        source: "iana"
      },
      "application/vnd.ims.imsccv1p2": {
        source: "iana"
      },
      "application/vnd.ims.imsccv1p3": {
        source: "iana"
      },
      "application/vnd.ims.lis.v2.result+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolconsumerprofile+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolproxy+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolproxy.id+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolsettings+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ims.lti.v2.toolsettings.simple+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.informedcontrol.rms+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.informix-visionary": {
        source: "iana"
      },
      "application/vnd.infotech.project": {
        source: "iana"
      },
      "application/vnd.infotech.project+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.innopath.wamp.notification": {
        source: "iana"
      },
      "application/vnd.insors.igm": {
        source: "iana",
        extensions: ["igm"]
      },
      "application/vnd.intercon.formnet": {
        source: "iana",
        extensions: ["xpw", "xpx"]
      },
      "application/vnd.intergeo": {
        source: "iana",
        extensions: ["i2g"]
      },
      "application/vnd.intertrust.digibox": {
        source: "iana"
      },
      "application/vnd.intertrust.nncp": {
        source: "iana"
      },
      "application/vnd.intu.qbo": {
        source: "iana",
        extensions: ["qbo"]
      },
      "application/vnd.intu.qfx": {
        source: "iana",
        extensions: ["qfx"]
      },
      "application/vnd.iptc.g2.catalogitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.conceptitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.knowledgeitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.newsitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.newsmessage+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.packageitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.iptc.g2.planningitem+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ipunplugged.rcprofile": {
        source: "iana",
        extensions: ["rcprofile"]
      },
      "application/vnd.irepository.package+xml": {
        source: "iana",
        compressible: true,
        extensions: ["irp"]
      },
      "application/vnd.is-xpr": {
        source: "iana",
        extensions: ["xpr"]
      },
      "application/vnd.isac.fcs": {
        source: "iana",
        extensions: ["fcs"]
      },
      "application/vnd.iso11783-10+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.jam": {
        source: "iana",
        extensions: ["jam"]
      },
      "application/vnd.japannet-directory-service": {
        source: "iana"
      },
      "application/vnd.japannet-jpnstore-wakeup": {
        source: "iana"
      },
      "application/vnd.japannet-payment-wakeup": {
        source: "iana"
      },
      "application/vnd.japannet-registration": {
        source: "iana"
      },
      "application/vnd.japannet-registration-wakeup": {
        source: "iana"
      },
      "application/vnd.japannet-setstore-wakeup": {
        source: "iana"
      },
      "application/vnd.japannet-verification": {
        source: "iana"
      },
      "application/vnd.japannet-verification-wakeup": {
        source: "iana"
      },
      "application/vnd.jcp.javame.midlet-rms": {
        source: "iana",
        extensions: ["rms"]
      },
      "application/vnd.jisp": {
        source: "iana",
        extensions: ["jisp"]
      },
      "application/vnd.joost.joda-archive": {
        source: "iana",
        extensions: ["joda"]
      },
      "application/vnd.jsk.isdn-ngn": {
        source: "iana"
      },
      "application/vnd.kahootz": {
        source: "iana",
        extensions: ["ktz", "ktr"]
      },
      "application/vnd.kde.karbon": {
        source: "iana",
        extensions: ["karbon"]
      },
      "application/vnd.kde.kchart": {
        source: "iana",
        extensions: ["chrt"]
      },
      "application/vnd.kde.kformula": {
        source: "iana",
        extensions: ["kfo"]
      },
      "application/vnd.kde.kivio": {
        source: "iana",
        extensions: ["flw"]
      },
      "application/vnd.kde.kontour": {
        source: "iana",
        extensions: ["kon"]
      },
      "application/vnd.kde.kpresenter": {
        source: "iana",
        extensions: ["kpr", "kpt"]
      },
      "application/vnd.kde.kspread": {
        source: "iana",
        extensions: ["ksp"]
      },
      "application/vnd.kde.kword": {
        source: "iana",
        extensions: ["kwd", "kwt"]
      },
      "application/vnd.kenameaapp": {
        source: "iana",
        extensions: ["htke"]
      },
      "application/vnd.kidspiration": {
        source: "iana",
        extensions: ["kia"]
      },
      "application/vnd.kinar": {
        source: "iana",
        extensions: ["kne", "knp"]
      },
      "application/vnd.koan": {
        source: "iana",
        extensions: ["skp", "skd", "skt", "skm"]
      },
      "application/vnd.kodak-descriptor": {
        source: "iana",
        extensions: ["sse"]
      },
      "application/vnd.las": {
        source: "iana"
      },
      "application/vnd.las.las+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.las.las+xml": {
        source: "iana",
        compressible: true,
        extensions: ["lasxml"]
      },
      "application/vnd.laszip": {
        source: "iana"
      },
      "application/vnd.leap+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.liberty-request+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.llamagraphics.life-balance.desktop": {
        source: "iana",
        extensions: ["lbd"]
      },
      "application/vnd.llamagraphics.life-balance.exchange+xml": {
        source: "iana",
        compressible: true,
        extensions: ["lbe"]
      },
      "application/vnd.logipipe.circuit+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.loom": {
        source: "iana"
      },
      "application/vnd.lotus-1-2-3": {
        source: "iana",
        extensions: ["123"]
      },
      "application/vnd.lotus-approach": {
        source: "iana",
        extensions: ["apr"]
      },
      "application/vnd.lotus-freelance": {
        source: "iana",
        extensions: ["pre"]
      },
      "application/vnd.lotus-notes": {
        source: "iana",
        extensions: ["nsf"]
      },
      "application/vnd.lotus-organizer": {
        source: "iana",
        extensions: ["org"]
      },
      "application/vnd.lotus-screencam": {
        source: "iana",
        extensions: ["scm"]
      },
      "application/vnd.lotus-wordpro": {
        source: "iana",
        extensions: ["lwp"]
      },
      "application/vnd.macports.portpkg": {
        source: "iana",
        extensions: ["portpkg"]
      },
      "application/vnd.mapbox-vector-tile": {
        source: "iana",
        extensions: ["mvt"]
      },
      "application/vnd.marlin.drm.actiontoken+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.marlin.drm.conftoken+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.marlin.drm.license+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.marlin.drm.mdcf": {
        source: "iana"
      },
      "application/vnd.mason+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.maxar.archive.3tz+zip": {
        source: "iana",
        compressible: false
      },
      "application/vnd.maxmind.maxmind-db": {
        source: "iana"
      },
      "application/vnd.mcd": {
        source: "iana",
        extensions: ["mcd"]
      },
      "application/vnd.medcalcdata": {
        source: "iana",
        extensions: ["mc1"]
      },
      "application/vnd.mediastation.cdkey": {
        source: "iana",
        extensions: ["cdkey"]
      },
      "application/vnd.meridian-slingshot": {
        source: "iana"
      },
      "application/vnd.mfer": {
        source: "iana",
        extensions: ["mwf"]
      },
      "application/vnd.mfmp": {
        source: "iana",
        extensions: ["mfm"]
      },
      "application/vnd.micro+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.micrografx.flo": {
        source: "iana",
        extensions: ["flo"]
      },
      "application/vnd.micrografx.igx": {
        source: "iana",
        extensions: ["igx"]
      },
      "application/vnd.microsoft.portable-executable": {
        source: "iana"
      },
      "application/vnd.microsoft.windows.thumbnail-cache": {
        source: "iana"
      },
      "application/vnd.miele+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.mif": {
        source: "iana",
        extensions: ["mif"]
      },
      "application/vnd.minisoft-hp3000-save": {
        source: "iana"
      },
      "application/vnd.mitsubishi.misty-guard.trustweb": {
        source: "iana"
      },
      "application/vnd.mobius.daf": {
        source: "iana",
        extensions: ["daf"]
      },
      "application/vnd.mobius.dis": {
        source: "iana",
        extensions: ["dis"]
      },
      "application/vnd.mobius.mbk": {
        source: "iana",
        extensions: ["mbk"]
      },
      "application/vnd.mobius.mqy": {
        source: "iana",
        extensions: ["mqy"]
      },
      "application/vnd.mobius.msl": {
        source: "iana",
        extensions: ["msl"]
      },
      "application/vnd.mobius.plc": {
        source: "iana",
        extensions: ["plc"]
      },
      "application/vnd.mobius.txf": {
        source: "iana",
        extensions: ["txf"]
      },
      "application/vnd.mophun.application": {
        source: "iana",
        extensions: ["mpn"]
      },
      "application/vnd.mophun.certificate": {
        source: "iana",
        extensions: ["mpc"]
      },
      "application/vnd.motorola.flexsuite": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.adsi": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.fis": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.gotap": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.kmr": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.ttc": {
        source: "iana"
      },
      "application/vnd.motorola.flexsuite.wem": {
        source: "iana"
      },
      "application/vnd.motorola.iprm": {
        source: "iana"
      },
      "application/vnd.mozilla.xul+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xul"]
      },
      "application/vnd.ms-3mfdocument": {
        source: "iana"
      },
      "application/vnd.ms-artgalry": {
        source: "iana",
        extensions: ["cil"]
      },
      "application/vnd.ms-asf": {
        source: "iana"
      },
      "application/vnd.ms-cab-compressed": {
        source: "iana",
        extensions: ["cab"]
      },
      "application/vnd.ms-color.iccprofile": {
        source: "apache"
      },
      "application/vnd.ms-excel": {
        source: "iana",
        compressible: false,
        extensions: ["xls", "xlm", "xla", "xlc", "xlt", "xlw"]
      },
      "application/vnd.ms-excel.addin.macroenabled.12": {
        source: "iana",
        extensions: ["xlam"]
      },
      "application/vnd.ms-excel.sheet.binary.macroenabled.12": {
        source: "iana",
        extensions: ["xlsb"]
      },
      "application/vnd.ms-excel.sheet.macroenabled.12": {
        source: "iana",
        extensions: ["xlsm"]
      },
      "application/vnd.ms-excel.template.macroenabled.12": {
        source: "iana",
        extensions: ["xltm"]
      },
      "application/vnd.ms-fontobject": {
        source: "iana",
        compressible: true,
        extensions: ["eot"]
      },
      "application/vnd.ms-htmlhelp": {
        source: "iana",
        extensions: ["chm"]
      },
      "application/vnd.ms-ims": {
        source: "iana",
        extensions: ["ims"]
      },
      "application/vnd.ms-lrm": {
        source: "iana",
        extensions: ["lrm"]
      },
      "application/vnd.ms-office.activex+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ms-officetheme": {
        source: "iana",
        extensions: ["thmx"]
      },
      "application/vnd.ms-opentype": {
        source: "apache",
        compressible: true
      },
      "application/vnd.ms-outlook": {
        compressible: false,
        extensions: ["msg"]
      },
      "application/vnd.ms-package.obfuscated-opentype": {
        source: "apache"
      },
      "application/vnd.ms-pki.seccat": {
        source: "apache",
        extensions: ["cat"]
      },
      "application/vnd.ms-pki.stl": {
        source: "apache",
        extensions: ["stl"]
      },
      "application/vnd.ms-playready.initiator+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ms-powerpoint": {
        source: "iana",
        compressible: false,
        extensions: ["ppt", "pps", "pot"]
      },
      "application/vnd.ms-powerpoint.addin.macroenabled.12": {
        source: "iana",
        extensions: ["ppam"]
      },
      "application/vnd.ms-powerpoint.presentation.macroenabled.12": {
        source: "iana",
        extensions: ["pptm"]
      },
      "application/vnd.ms-powerpoint.slide.macroenabled.12": {
        source: "iana",
        extensions: ["sldm"]
      },
      "application/vnd.ms-powerpoint.slideshow.macroenabled.12": {
        source: "iana",
        extensions: ["ppsm"]
      },
      "application/vnd.ms-powerpoint.template.macroenabled.12": {
        source: "iana",
        extensions: ["potm"]
      },
      "application/vnd.ms-printdevicecapabilities+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ms-printing.printticket+xml": {
        source: "apache",
        compressible: true
      },
      "application/vnd.ms-printschematicket+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ms-project": {
        source: "iana",
        extensions: ["mpp", "mpt"]
      },
      "application/vnd.ms-tnef": {
        source: "iana"
      },
      "application/vnd.ms-windows.devicepairing": {
        source: "iana"
      },
      "application/vnd.ms-windows.nwprinting.oob": {
        source: "iana"
      },
      "application/vnd.ms-windows.printerpairing": {
        source: "iana"
      },
      "application/vnd.ms-windows.wsd.oob": {
        source: "iana"
      },
      "application/vnd.ms-wmdrm.lic-chlg-req": {
        source: "iana"
      },
      "application/vnd.ms-wmdrm.lic-resp": {
        source: "iana"
      },
      "application/vnd.ms-wmdrm.meter-chlg-req": {
        source: "iana"
      },
      "application/vnd.ms-wmdrm.meter-resp": {
        source: "iana"
      },
      "application/vnd.ms-word.document.macroenabled.12": {
        source: "iana",
        extensions: ["docm"]
      },
      "application/vnd.ms-word.template.macroenabled.12": {
        source: "iana",
        extensions: ["dotm"]
      },
      "application/vnd.ms-works": {
        source: "iana",
        extensions: ["wps", "wks", "wcm", "wdb"]
      },
      "application/vnd.ms-wpl": {
        source: "iana",
        extensions: ["wpl"]
      },
      "application/vnd.ms-xpsdocument": {
        source: "iana",
        compressible: false,
        extensions: ["xps"]
      },
      "application/vnd.msa-disk-image": {
        source: "iana"
      },
      "application/vnd.mseq": {
        source: "iana",
        extensions: ["mseq"]
      },
      "application/vnd.msign": {
        source: "iana"
      },
      "application/vnd.multiad.creator": {
        source: "iana"
      },
      "application/vnd.multiad.creator.cif": {
        source: "iana"
      },
      "application/vnd.music-niff": {
        source: "iana"
      },
      "application/vnd.musician": {
        source: "iana",
        extensions: ["mus"]
      },
      "application/vnd.muvee.style": {
        source: "iana",
        extensions: ["msty"]
      },
      "application/vnd.mynfc": {
        source: "iana",
        extensions: ["taglet"]
      },
      "application/vnd.nacamar.ybrid+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.ncd.control": {
        source: "iana"
      },
      "application/vnd.ncd.reference": {
        source: "iana"
      },
      "application/vnd.nearst.inv+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nebumind.line": {
        source: "iana"
      },
      "application/vnd.nervana": {
        source: "iana"
      },
      "application/vnd.netfpx": {
        source: "iana"
      },
      "application/vnd.neurolanguage.nlu": {
        source: "iana",
        extensions: ["nlu"]
      },
      "application/vnd.nimn": {
        source: "iana"
      },
      "application/vnd.nintendo.nitro.rom": {
        source: "iana"
      },
      "application/vnd.nintendo.snes.rom": {
        source: "iana"
      },
      "application/vnd.nitf": {
        source: "iana",
        extensions: ["ntf", "nitf"]
      },
      "application/vnd.noblenet-directory": {
        source: "iana",
        extensions: ["nnd"]
      },
      "application/vnd.noblenet-sealer": {
        source: "iana",
        extensions: ["nns"]
      },
      "application/vnd.noblenet-web": {
        source: "iana",
        extensions: ["nnw"]
      },
      "application/vnd.nokia.catalogs": {
        source: "iana"
      },
      "application/vnd.nokia.conml+wbxml": {
        source: "iana"
      },
      "application/vnd.nokia.conml+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.iptv.config+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.isds-radio-presets": {
        source: "iana"
      },
      "application/vnd.nokia.landmark+wbxml": {
        source: "iana"
      },
      "application/vnd.nokia.landmark+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.landmarkcollection+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.n-gage.ac+xml": {
        source: "iana",
        compressible: true,
        extensions: ["ac"]
      },
      "application/vnd.nokia.n-gage.data": {
        source: "iana",
        extensions: ["ngdat"]
      },
      "application/vnd.nokia.n-gage.symbian.install": {
        source: "iana",
        extensions: ["n-gage"]
      },
      "application/vnd.nokia.ncd": {
        source: "iana"
      },
      "application/vnd.nokia.pcd+wbxml": {
        source: "iana"
      },
      "application/vnd.nokia.pcd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.nokia.radio-preset": {
        source: "iana",
        extensions: ["rpst"]
      },
      "application/vnd.nokia.radio-presets": {
        source: "iana",
        extensions: ["rpss"]
      },
      "application/vnd.novadigm.edm": {
        source: "iana",
        extensions: ["edm"]
      },
      "application/vnd.novadigm.edx": {
        source: "iana",
        extensions: ["edx"]
      },
      "application/vnd.novadigm.ext": {
        source: "iana",
        extensions: ["ext"]
      },
      "application/vnd.ntt-local.content-share": {
        source: "iana"
      },
      "application/vnd.ntt-local.file-transfer": {
        source: "iana"
      },
      "application/vnd.ntt-local.ogw_remote-access": {
        source: "iana"
      },
      "application/vnd.ntt-local.sip-ta_remote": {
        source: "iana"
      },
      "application/vnd.ntt-local.sip-ta_tcp_stream": {
        source: "iana"
      },
      "application/vnd.oasis.opendocument.chart": {
        source: "iana",
        extensions: ["odc"]
      },
      "application/vnd.oasis.opendocument.chart-template": {
        source: "iana",
        extensions: ["otc"]
      },
      "application/vnd.oasis.opendocument.database": {
        source: "iana",
        extensions: ["odb"]
      },
      "application/vnd.oasis.opendocument.formula": {
        source: "iana",
        extensions: ["odf"]
      },
      "application/vnd.oasis.opendocument.formula-template": {
        source: "iana",
        extensions: ["odft"]
      },
      "application/vnd.oasis.opendocument.graphics": {
        source: "iana",
        compressible: false,
        extensions: ["odg"]
      },
      "application/vnd.oasis.opendocument.graphics-template": {
        source: "iana",
        extensions: ["otg"]
      },
      "application/vnd.oasis.opendocument.image": {
        source: "iana",
        extensions: ["odi"]
      },
      "application/vnd.oasis.opendocument.image-template": {
        source: "iana",
        extensions: ["oti"]
      },
      "application/vnd.oasis.opendocument.presentation": {
        source: "iana",
        compressible: false,
        extensions: ["odp"]
      },
      "application/vnd.oasis.opendocument.presentation-template": {
        source: "iana",
        extensions: ["otp"]
      },
      "application/vnd.oasis.opendocument.spreadsheet": {
        source: "iana",
        compressible: false,
        extensions: ["ods"]
      },
      "application/vnd.oasis.opendocument.spreadsheet-template": {
        source: "iana",
        extensions: ["ots"]
      },
      "application/vnd.oasis.opendocument.text": {
        source: "iana",
        compressible: false,
        extensions: ["odt"]
      },
      "application/vnd.oasis.opendocument.text-master": {
        source: "iana",
        extensions: ["odm"]
      },
      "application/vnd.oasis.opendocument.text-template": {
        source: "iana",
        extensions: ["ott"]
      },
      "application/vnd.oasis.opendocument.text-web": {
        source: "iana",
        extensions: ["oth"]
      },
      "application/vnd.obn": {
        source: "iana"
      },
      "application/vnd.ocf+cbor": {
        source: "iana"
      },
      "application/vnd.oci.image.manifest.v1+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oftn.l10n+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.contentaccessdownload+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.contentaccessstreaming+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.cspg-hexbinary": {
        source: "iana"
      },
      "application/vnd.oipf.dae.svg+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.dae.xhtml+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.mippvcontrolmessage+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.pae.gem": {
        source: "iana"
      },
      "application/vnd.oipf.spdiscovery+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.spdlist+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.ueprofile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oipf.userprofile+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.olpc-sugar": {
        source: "iana",
        extensions: ["xo"]
      },
      "application/vnd.oma-scws-config": {
        source: "iana"
      },
      "application/vnd.oma-scws-http-request": {
        source: "iana"
      },
      "application/vnd.oma-scws-http-response": {
        source: "iana"
      },
      "application/vnd.oma.bcast.associated-procedure-parameter+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.drm-trigger+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.imd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.ltkm": {
        source: "iana"
      },
      "application/vnd.oma.bcast.notification+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.provisioningtrigger": {
        source: "iana"
      },
      "application/vnd.oma.bcast.sgboot": {
        source: "iana"
      },
      "application/vnd.oma.bcast.sgdd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.sgdu": {
        source: "iana"
      },
      "application/vnd.oma.bcast.simple-symbol-container": {
        source: "iana"
      },
      "application/vnd.oma.bcast.smartcard-trigger+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.sprov+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.bcast.stkm": {
        source: "iana"
      },
      "application/vnd.oma.cab-address-book+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.cab-feature-handler+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.cab-pcc+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.cab-subs-invite+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.cab-user-prefs+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.dcd": {
        source: "iana"
      },
      "application/vnd.oma.dcdc": {
        source: "iana"
      },
      "application/vnd.oma.dd2+xml": {
        source: "iana",
        compressible: true,
        extensions: ["dd2"]
      },
      "application/vnd.oma.drm.risd+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.group-usage-list+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.lwm2m+cbor": {
        source: "iana"
      },
      "application/vnd.oma.lwm2m+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.lwm2m+tlv": {
        source: "iana"
      },
      "application/vnd.oma.pal+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.detailed-progress-report+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.final-report+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.groups+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.invocation-descriptor+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.poc.optimized-progress-report+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.push": {
        source: "iana"
      },
      "application/vnd.oma.scidm.messages+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oma.xcap-directory+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.omads-email+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.omads-file+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.omads-folder+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.omaloc-supl-init": {
        source: "iana"
      },
      "application/vnd.onepager": {
        source: "iana"
      },
      "application/vnd.onepagertamp": {
        source: "iana"
      },
      "application/vnd.onepagertamx": {
        source: "iana"
      },
      "application/vnd.onepagertat": {
        source: "iana"
      },
      "application/vnd.onepagertatp": {
        source: "iana"
      },
      "application/vnd.onepagertatx": {
        source: "iana"
      },
      "application/vnd.openblox.game+xml": {
        source: "iana",
        compressible: true,
        extensions: ["obgx"]
      },
      "application/vnd.openblox.game-binary": {
        source: "iana"
      },
      "application/vnd.openeye.oeb": {
        source: "iana"
      },
      "application/vnd.openofficeorg.extension": {
        source: "apache",
        extensions: ["oxt"]
      },
      "application/vnd.openstreetmap.data+xml": {
        source: "iana",
        compressible: true,
        extensions: ["osm"]
      },
      "application/vnd.opentimestamps.ots": {
        source: "iana"
      },
      "application/vnd.openxmlformats-officedocument.custom-properties+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.customxmlproperties+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawing+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.chart+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.extended-properties+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.comments+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
        source: "iana",
        compressible: false,
        extensions: ["pptx"]
      },
      "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.presprops+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slide": {
        source: "iana",
        extensions: ["sldx"]
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slide+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slideshow": {
        source: "iana",
        extensions: ["ppsx"]
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.tags+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.template": {
        source: "iana",
        extensions: ["potx"]
      },
      "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
        source: "iana",
        compressible: false,
        extensions: ["xlsx"]
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.template": {
        source: "iana",
        extensions: ["xltx"]
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.theme+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.themeoverride+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.vmldrawing": {
        source: "iana"
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
        source: "iana",
        compressible: false,
        extensions: ["docx"]
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.template": {
        source: "iana",
        extensions: ["dotx"]
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-package.core-properties+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.openxmlformats-package.relationships+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oracle.resource+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.orange.indata": {
        source: "iana"
      },
      "application/vnd.osa.netdeploy": {
        source: "iana"
      },
      "application/vnd.osgeo.mapguide.package": {
        source: "iana",
        extensions: ["mgp"]
      },
      "application/vnd.osgi.bundle": {
        source: "iana"
      },
      "application/vnd.osgi.dp": {
        source: "iana",
        extensions: ["dp"]
      },
      "application/vnd.osgi.subsystem": {
        source: "iana",
        extensions: ["esa"]
      },
      "application/vnd.otps.ct-kip+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.oxli.countgraph": {
        source: "iana"
      },
      "application/vnd.pagerduty+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.palm": {
        source: "iana",
        extensions: ["pdb", "pqa", "oprc"]
      },
      "application/vnd.panoply": {
        source: "iana"
      },
      "application/vnd.paos.xml": {
        source: "iana"
      },
      "application/vnd.patentdive": {
        source: "iana"
      },
      "application/vnd.patientecommsdoc": {
        source: "iana"
      },
      "application/vnd.pawaafile": {
        source: "iana",
        extensions: ["paw"]
      },
      "application/vnd.pcos": {
        source: "iana"
      },
      "application/vnd.pg.format": {
        source: "iana",
        extensions: ["str"]
      },
      "application/vnd.pg.osasli": {
        source: "iana",
        extensions: ["ei6"]
      },
      "application/vnd.piaccess.application-licence": {
        source: "iana"
      },
      "application/vnd.picsel": {
        source: "iana",
        extensions: ["efif"]
      },
      "application/vnd.pmi.widget": {
        source: "iana",
        extensions: ["wg"]
      },
      "application/vnd.poc.group-advertisement+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.pocketlearn": {
        source: "iana",
        extensions: ["plf"]
      },
      "application/vnd.powerbuilder6": {
        source: "iana",
        extensions: ["pbd"]
      },
      "application/vnd.powerbuilder6-s": {
        source: "iana"
      },
      "application/vnd.powerbuilder7": {
        source: "iana"
      },
      "application/vnd.powerbuilder7-s": {
        source: "iana"
      },
      "application/vnd.powerbuilder75": {
        source: "iana"
      },
      "application/vnd.powerbuilder75-s": {
        source: "iana"
      },
      "application/vnd.preminet": {
        source: "iana"
      },
      "application/vnd.previewsystems.box": {
        source: "iana",
        extensions: ["box"]
      },
      "application/vnd.proteus.magazine": {
        source: "iana",
        extensions: ["mgz"]
      },
      "application/vnd.psfs": {
        source: "iana"
      },
      "application/vnd.publishare-delta-tree": {
        source: "iana",
        extensions: ["qps"]
      },
      "application/vnd.pvi.ptid1": {
        source: "iana",
        extensions: ["ptid"]
      },
      "application/vnd.pwg-multiplexed": {
        source: "iana"
      },
      "application/vnd.pwg-xhtml-print+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.qualcomm.brew-app-res": {
        source: "iana"
      },
      "application/vnd.quarantainenet": {
        source: "iana"
      },
      "application/vnd.quark.quarkxpress": {
        source: "iana",
        extensions: ["qxd", "qxt", "qwd", "qwt", "qxl", "qxb"]
      },
      "application/vnd.quobject-quoxdocument": {
        source: "iana"
      },
      "application/vnd.radisys.moml+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit-conf+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit-conn+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit-dialog+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-audit-stream+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-conf+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-base+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-fax-detect+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-fax-sendrecv+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-group+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-speech+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.radisys.msml-dialog-transform+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.rainstor.data": {
        source: "iana"
      },
      "application/vnd.rapid": {
        source: "iana"
      },
      "application/vnd.rar": {
        source: "iana",
        extensions: ["rar"]
      },
      "application/vnd.realvnc.bed": {
        source: "iana",
        extensions: ["bed"]
      },
      "application/vnd.recordare.musicxml": {
        source: "iana",
        extensions: ["mxl"]
      },
      "application/vnd.recordare.musicxml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["musicxml"]
      },
      "application/vnd.renlearn.rlprint": {
        source: "iana"
      },
      "application/vnd.resilient.logic": {
        source: "iana"
      },
      "application/vnd.restful+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.rig.cryptonote": {
        source: "iana",
        extensions: ["cryptonote"]
      },
      "application/vnd.rim.cod": {
        source: "apache",
        extensions: ["cod"]
      },
      "application/vnd.rn-realmedia": {
        source: "apache",
        extensions: ["rm"]
      },
      "application/vnd.rn-realmedia-vbr": {
        source: "apache",
        extensions: ["rmvb"]
      },
      "application/vnd.route66.link66+xml": {
        source: "iana",
        compressible: true,
        extensions: ["link66"]
      },
      "application/vnd.rs-274x": {
        source: "iana"
      },
      "application/vnd.ruckus.download": {
        source: "iana"
      },
      "application/vnd.s3sms": {
        source: "iana"
      },
      "application/vnd.sailingtracker.track": {
        source: "iana",
        extensions: ["st"]
      },
      "application/vnd.sar": {
        source: "iana"
      },
      "application/vnd.sbm.cid": {
        source: "iana"
      },
      "application/vnd.sbm.mid2": {
        source: "iana"
      },
      "application/vnd.scribus": {
        source: "iana"
      },
      "application/vnd.sealed.3df": {
        source: "iana"
      },
      "application/vnd.sealed.csf": {
        source: "iana"
      },
      "application/vnd.sealed.doc": {
        source: "iana"
      },
      "application/vnd.sealed.eml": {
        source: "iana"
      },
      "application/vnd.sealed.mht": {
        source: "iana"
      },
      "application/vnd.sealed.net": {
        source: "iana"
      },
      "application/vnd.sealed.ppt": {
        source: "iana"
      },
      "application/vnd.sealed.tiff": {
        source: "iana"
      },
      "application/vnd.sealed.xls": {
        source: "iana"
      },
      "application/vnd.sealedmedia.softseal.html": {
        source: "iana"
      },
      "application/vnd.sealedmedia.softseal.pdf": {
        source: "iana"
      },
      "application/vnd.seemail": {
        source: "iana",
        extensions: ["see"]
      },
      "application/vnd.seis+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.sema": {
        source: "iana",
        extensions: ["sema"]
      },
      "application/vnd.semd": {
        source: "iana",
        extensions: ["semd"]
      },
      "application/vnd.semf": {
        source: "iana",
        extensions: ["semf"]
      },
      "application/vnd.shade-save-file": {
        source: "iana"
      },
      "application/vnd.shana.informed.formdata": {
        source: "iana",
        extensions: ["ifm"]
      },
      "application/vnd.shana.informed.formtemplate": {
        source: "iana",
        extensions: ["itp"]
      },
      "application/vnd.shana.informed.interchange": {
        source: "iana",
        extensions: ["iif"]
      },
      "application/vnd.shana.informed.package": {
        source: "iana",
        extensions: ["ipk"]
      },
      "application/vnd.shootproof+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.shopkick+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.shp": {
        source: "iana"
      },
      "application/vnd.shx": {
        source: "iana"
      },
      "application/vnd.sigrok.session": {
        source: "iana"
      },
      "application/vnd.simtech-mindmapper": {
        source: "iana",
        extensions: ["twd", "twds"]
      },
      "application/vnd.siren+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.smaf": {
        source: "iana",
        extensions: ["mmf"]
      },
      "application/vnd.smart.notebook": {
        source: "iana"
      },
      "application/vnd.smart.teacher": {
        source: "iana",
        extensions: ["teacher"]
      },
      "application/vnd.snesdev-page-table": {
        source: "iana"
      },
      "application/vnd.software602.filler.form+xml": {
        source: "iana",
        compressible: true,
        extensions: ["fo"]
      },
      "application/vnd.software602.filler.form-xml-zip": {
        source: "iana"
      },
      "application/vnd.solent.sdkm+xml": {
        source: "iana",
        compressible: true,
        extensions: ["sdkm", "sdkd"]
      },
      "application/vnd.spotfire.dxp": {
        source: "iana",
        extensions: ["dxp"]
      },
      "application/vnd.spotfire.sfs": {
        source: "iana",
        extensions: ["sfs"]
      },
      "application/vnd.sqlite3": {
        source: "iana"
      },
      "application/vnd.sss-cod": {
        source: "iana"
      },
      "application/vnd.sss-dtf": {
        source: "iana"
      },
      "application/vnd.sss-ntf": {
        source: "iana"
      },
      "application/vnd.stardivision.calc": {
        source: "apache",
        extensions: ["sdc"]
      },
      "application/vnd.stardivision.draw": {
        source: "apache",
        extensions: ["sda"]
      },
      "application/vnd.stardivision.impress": {
        source: "apache",
        extensions: ["sdd"]
      },
      "application/vnd.stardivision.math": {
        source: "apache",
        extensions: ["smf"]
      },
      "application/vnd.stardivision.writer": {
        source: "apache",
        extensions: ["sdw", "vor"]
      },
      "application/vnd.stardivision.writer-global": {
        source: "apache",
        extensions: ["sgl"]
      },
      "application/vnd.stepmania.package": {
        source: "iana",
        extensions: ["smzip"]
      },
      "application/vnd.stepmania.stepchart": {
        source: "iana",
        extensions: ["sm"]
      },
      "application/vnd.street-stream": {
        source: "iana"
      },
      "application/vnd.sun.wadl+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wadl"]
      },
      "application/vnd.sun.xml.calc": {
        source: "apache",
        extensions: ["sxc"]
      },
      "application/vnd.sun.xml.calc.template": {
        source: "apache",
        extensions: ["stc"]
      },
      "application/vnd.sun.xml.draw": {
        source: "apache",
        extensions: ["sxd"]
      },
      "application/vnd.sun.xml.draw.template": {
        source: "apache",
        extensions: ["std"]
      },
      "application/vnd.sun.xml.impress": {
        source: "apache",
        extensions: ["sxi"]
      },
      "application/vnd.sun.xml.impress.template": {
        source: "apache",
        extensions: ["sti"]
      },
      "application/vnd.sun.xml.math": {
        source: "apache",
        extensions: ["sxm"]
      },
      "application/vnd.sun.xml.writer": {
        source: "apache",
        extensions: ["sxw"]
      },
      "application/vnd.sun.xml.writer.global": {
        source: "apache",
        extensions: ["sxg"]
      },
      "application/vnd.sun.xml.writer.template": {
        source: "apache",
        extensions: ["stw"]
      },
      "application/vnd.sus-calendar": {
        source: "iana",
        extensions: ["sus", "susp"]
      },
      "application/vnd.svd": {
        source: "iana",
        extensions: ["svd"]
      },
      "application/vnd.swiftview-ics": {
        source: "iana"
      },
      "application/vnd.sycle+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.syft+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.symbian.install": {
        source: "apache",
        extensions: ["sis", "sisx"]
      },
      "application/vnd.syncml+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["xsm"]
      },
      "application/vnd.syncml.dm+wbxml": {
        source: "iana",
        charset: "UTF-8",
        extensions: ["bdm"]
      },
      "application/vnd.syncml.dm+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["xdm"]
      },
      "application/vnd.syncml.dm.notification": {
        source: "iana"
      },
      "application/vnd.syncml.dmddf+wbxml": {
        source: "iana"
      },
      "application/vnd.syncml.dmddf+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["ddf"]
      },
      "application/vnd.syncml.dmtnds+wbxml": {
        source: "iana"
      },
      "application/vnd.syncml.dmtnds+xml": {
        source: "iana",
        charset: "UTF-8",
        compressible: true
      },
      "application/vnd.syncml.ds.notification": {
        source: "iana"
      },
      "application/vnd.tableschema+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.tao.intent-module-archive": {
        source: "iana",
        extensions: ["tao"]
      },
      "application/vnd.tcpdump.pcap": {
        source: "iana",
        extensions: ["pcap", "cap", "dmp"]
      },
      "application/vnd.think-cell.ppttc+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.tmd.mediaflex.api+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.tml": {
        source: "iana"
      },
      "application/vnd.tmobile-livetv": {
        source: "iana",
        extensions: ["tmo"]
      },
      "application/vnd.tri.onesource": {
        source: "iana"
      },
      "application/vnd.trid.tpt": {
        source: "iana",
        extensions: ["tpt"]
      },
      "application/vnd.triscape.mxs": {
        source: "iana",
        extensions: ["mxs"]
      },
      "application/vnd.trueapp": {
        source: "iana",
        extensions: ["tra"]
      },
      "application/vnd.truedoc": {
        source: "iana"
      },
      "application/vnd.ubisoft.webplayer": {
        source: "iana"
      },
      "application/vnd.ufdl": {
        source: "iana",
        extensions: ["ufd", "ufdl"]
      },
      "application/vnd.uiq.theme": {
        source: "iana",
        extensions: ["utz"]
      },
      "application/vnd.umajin": {
        source: "iana",
        extensions: ["umj"]
      },
      "application/vnd.unity": {
        source: "iana",
        extensions: ["unityweb"]
      },
      "application/vnd.uoml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["uoml"]
      },
      "application/vnd.uplanet.alert": {
        source: "iana"
      },
      "application/vnd.uplanet.alert-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.bearer-choice": {
        source: "iana"
      },
      "application/vnd.uplanet.bearer-choice-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.cacheop": {
        source: "iana"
      },
      "application/vnd.uplanet.cacheop-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.channel": {
        source: "iana"
      },
      "application/vnd.uplanet.channel-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.list": {
        source: "iana"
      },
      "application/vnd.uplanet.list-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.listcmd": {
        source: "iana"
      },
      "application/vnd.uplanet.listcmd-wbxml": {
        source: "iana"
      },
      "application/vnd.uplanet.signal": {
        source: "iana"
      },
      "application/vnd.uri-map": {
        source: "iana"
      },
      "application/vnd.valve.source.material": {
        source: "iana"
      },
      "application/vnd.vcx": {
        source: "iana",
        extensions: ["vcx"]
      },
      "application/vnd.vd-study": {
        source: "iana"
      },
      "application/vnd.vectorworks": {
        source: "iana"
      },
      "application/vnd.vel+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.verimatrix.vcas": {
        source: "iana"
      },
      "application/vnd.veritone.aion+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.veryant.thin": {
        source: "iana"
      },
      "application/vnd.ves.encrypted": {
        source: "iana"
      },
      "application/vnd.vidsoft.vidconference": {
        source: "iana"
      },
      "application/vnd.visio": {
        source: "iana",
        extensions: ["vsd", "vst", "vss", "vsw"]
      },
      "application/vnd.visionary": {
        source: "iana",
        extensions: ["vis"]
      },
      "application/vnd.vividence.scriptfile": {
        source: "iana"
      },
      "application/vnd.vsf": {
        source: "iana",
        extensions: ["vsf"]
      },
      "application/vnd.wap.sic": {
        source: "iana"
      },
      "application/vnd.wap.slc": {
        source: "iana"
      },
      "application/vnd.wap.wbxml": {
        source: "iana",
        charset: "UTF-8",
        extensions: ["wbxml"]
      },
      "application/vnd.wap.wmlc": {
        source: "iana",
        extensions: ["wmlc"]
      },
      "application/vnd.wap.wmlscriptc": {
        source: "iana",
        extensions: ["wmlsc"]
      },
      "application/vnd.webturbo": {
        source: "iana",
        extensions: ["wtb"]
      },
      "application/vnd.wfa.dpp": {
        source: "iana"
      },
      "application/vnd.wfa.p2p": {
        source: "iana"
      },
      "application/vnd.wfa.wsc": {
        source: "iana"
      },
      "application/vnd.windows.devicepairing": {
        source: "iana"
      },
      "application/vnd.wmc": {
        source: "iana"
      },
      "application/vnd.wmf.bootstrap": {
        source: "iana"
      },
      "application/vnd.wolfram.mathematica": {
        source: "iana"
      },
      "application/vnd.wolfram.mathematica.package": {
        source: "iana"
      },
      "application/vnd.wolfram.player": {
        source: "iana",
        extensions: ["nbp"]
      },
      "application/vnd.wordperfect": {
        source: "iana",
        extensions: ["wpd"]
      },
      "application/vnd.wqd": {
        source: "iana",
        extensions: ["wqd"]
      },
      "application/vnd.wrq-hp3000-labelled": {
        source: "iana"
      },
      "application/vnd.wt.stf": {
        source: "iana",
        extensions: ["stf"]
      },
      "application/vnd.wv.csp+wbxml": {
        source: "iana"
      },
      "application/vnd.wv.csp+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.wv.ssp+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.xacml+json": {
        source: "iana",
        compressible: true
      },
      "application/vnd.xara": {
        source: "iana",
        extensions: ["xar"]
      },
      "application/vnd.xfdl": {
        source: "iana",
        extensions: ["xfdl"]
      },
      "application/vnd.xfdl.webform": {
        source: "iana"
      },
      "application/vnd.xmi+xml": {
        source: "iana",
        compressible: true
      },
      "application/vnd.xmpie.cpkg": {
        source: "iana"
      },
      "application/vnd.xmpie.dpkg": {
        source: "iana"
      },
      "application/vnd.xmpie.plan": {
        source: "iana"
      },
      "application/vnd.xmpie.ppkg": {
        source: "iana"
      },
      "application/vnd.xmpie.xlim": {
        source: "iana"
      },
      "application/vnd.yamaha.hv-dic": {
        source: "iana",
        extensions: ["hvd"]
      },
      "application/vnd.yamaha.hv-script": {
        source: "iana",
        extensions: ["hvs"]
      },
      "application/vnd.yamaha.hv-voice": {
        source: "iana",
        extensions: ["hvp"]
      },
      "application/vnd.yamaha.openscoreformat": {
        source: "iana",
        extensions: ["osf"]
      },
      "application/vnd.yamaha.openscoreformat.osfpvg+xml": {
        source: "iana",
        compressible: true,
        extensions: ["osfpvg"]
      },
      "application/vnd.yamaha.remote-setup": {
        source: "iana"
      },
      "application/vnd.yamaha.smaf-audio": {
        source: "iana",
        extensions: ["saf"]
      },
      "application/vnd.yamaha.smaf-phrase": {
        source: "iana",
        extensions: ["spf"]
      },
      "application/vnd.yamaha.through-ngn": {
        source: "iana"
      },
      "application/vnd.yamaha.tunnel-udpencap": {
        source: "iana"
      },
      "application/vnd.yaoweme": {
        source: "iana"
      },
      "application/vnd.yellowriver-custom-menu": {
        source: "iana",
        extensions: ["cmp"]
      },
      "application/vnd.youtube.yt": {
        source: "iana"
      },
      "application/vnd.zul": {
        source: "iana",
        extensions: ["zir", "zirz"]
      },
      "application/vnd.zzazz.deck+xml": {
        source: "iana",
        compressible: true,
        extensions: ["zaz"]
      },
      "application/voicexml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["vxml"]
      },
      "application/voucher-cms+json": {
        source: "iana",
        compressible: true
      },
      "application/vq-rtcpxr": {
        source: "iana"
      },
      "application/wasm": {
        source: "iana",
        compressible: true,
        extensions: ["wasm"]
      },
      "application/watcherinfo+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wif"]
      },
      "application/webpush-options+json": {
        source: "iana",
        compressible: true
      },
      "application/whoispp-query": {
        source: "iana"
      },
      "application/whoispp-response": {
        source: "iana"
      },
      "application/widget": {
        source: "iana",
        extensions: ["wgt"]
      },
      "application/winhlp": {
        source: "apache",
        extensions: ["hlp"]
      },
      "application/wita": {
        source: "iana"
      },
      "application/wordperfect5.1": {
        source: "iana"
      },
      "application/wsdl+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wsdl"]
      },
      "application/wspolicy+xml": {
        source: "iana",
        compressible: true,
        extensions: ["wspolicy"]
      },
      "application/x-7z-compressed": {
        source: "apache",
        compressible: false,
        extensions: ["7z"]
      },
      "application/x-abiword": {
        source: "apache",
        extensions: ["abw"]
      },
      "application/x-ace-compressed": {
        source: "apache",
        extensions: ["ace"]
      },
      "application/x-amf": {
        source: "apache"
      },
      "application/x-apple-diskimage": {
        source: "apache",
        extensions: ["dmg"]
      },
      "application/x-arj": {
        compressible: false,
        extensions: ["arj"]
      },
      "application/x-authorware-bin": {
        source: "apache",
        extensions: ["aab", "x32", "u32", "vox"]
      },
      "application/x-authorware-map": {
        source: "apache",
        extensions: ["aam"]
      },
      "application/x-authorware-seg": {
        source: "apache",
        extensions: ["aas"]
      },
      "application/x-bcpio": {
        source: "apache",
        extensions: ["bcpio"]
      },
      "application/x-bdoc": {
        compressible: false,
        extensions: ["bdoc"]
      },
      "application/x-bittorrent": {
        source: "apache",
        extensions: ["torrent"]
      },
      "application/x-blorb": {
        source: "apache",
        extensions: ["blb", "blorb"]
      },
      "application/x-bzip": {
        source: "apache",
        compressible: false,
        extensions: ["bz"]
      },
      "application/x-bzip2": {
        source: "apache",
        compressible: false,
        extensions: ["bz2", "boz"]
      },
      "application/x-cbr": {
        source: "apache",
        extensions: ["cbr", "cba", "cbt", "cbz", "cb7"]
      },
      "application/x-cdlink": {
        source: "apache",
        extensions: ["vcd"]
      },
      "application/x-cfs-compressed": {
        source: "apache",
        extensions: ["cfs"]
      },
      "application/x-chat": {
        source: "apache",
        extensions: ["chat"]
      },
      "application/x-chess-pgn": {
        source: "apache",
        extensions: ["pgn"]
      },
      "application/x-chrome-extension": {
        extensions: ["crx"]
      },
      "application/x-cocoa": {
        source: "nginx",
        extensions: ["cco"]
      },
      "application/x-compress": {
        source: "apache"
      },
      "application/x-conference": {
        source: "apache",
        extensions: ["nsc"]
      },
      "application/x-cpio": {
        source: "apache",
        extensions: ["cpio"]
      },
      "application/x-csh": {
        source: "apache",
        extensions: ["csh"]
      },
      "application/x-deb": {
        compressible: false
      },
      "application/x-debian-package": {
        source: "apache",
        extensions: ["deb", "udeb"]
      },
      "application/x-dgc-compressed": {
        source: "apache",
        extensions: ["dgc"]
      },
      "application/x-director": {
        source: "apache",
        extensions: ["dir", "dcr", "dxr", "cst", "cct", "cxt", "w3d", "fgd", "swa"]
      },
      "application/x-doom": {
        source: "apache",
        extensions: ["wad"]
      },
      "application/x-dtbncx+xml": {
        source: "apache",
        compressible: true,
        extensions: ["ncx"]
      },
      "application/x-dtbook+xml": {
        source: "apache",
        compressible: true,
        extensions: ["dtb"]
      },
      "application/x-dtbresource+xml": {
        source: "apache",
        compressible: true,
        extensions: ["res"]
      },
      "application/x-dvi": {
        source: "apache",
        compressible: false,
        extensions: ["dvi"]
      },
      "application/x-envoy": {
        source: "apache",
        extensions: ["evy"]
      },
      "application/x-eva": {
        source: "apache",
        extensions: ["eva"]
      },
      "application/x-font-bdf": {
        source: "apache",
        extensions: ["bdf"]
      },
      "application/x-font-dos": {
        source: "apache"
      },
      "application/x-font-framemaker": {
        source: "apache"
      },
      "application/x-font-ghostscript": {
        source: "apache",
        extensions: ["gsf"]
      },
      "application/x-font-libgrx": {
        source: "apache"
      },
      "application/x-font-linux-psf": {
        source: "apache",
        extensions: ["psf"]
      },
      "application/x-font-pcf": {
        source: "apache",
        extensions: ["pcf"]
      },
      "application/x-font-snf": {
        source: "apache",
        extensions: ["snf"]
      },
      "application/x-font-speedo": {
        source: "apache"
      },
      "application/x-font-sunos-news": {
        source: "apache"
      },
      "application/x-font-type1": {
        source: "apache",
        extensions: ["pfa", "pfb", "pfm", "afm"]
      },
      "application/x-font-vfont": {
        source: "apache"
      },
      "application/x-freearc": {
        source: "apache",
        extensions: ["arc"]
      },
      "application/x-futuresplash": {
        source: "apache",
        extensions: ["spl"]
      },
      "application/x-gca-compressed": {
        source: "apache",
        extensions: ["gca"]
      },
      "application/x-glulx": {
        source: "apache",
        extensions: ["ulx"]
      },
      "application/x-gnumeric": {
        source: "apache",
        extensions: ["gnumeric"]
      },
      "application/x-gramps-xml": {
        source: "apache",
        extensions: ["gramps"]
      },
      "application/x-gtar": {
        source: "apache",
        extensions: ["gtar"]
      },
      "application/x-gzip": {
        source: "apache"
      },
      "application/x-hdf": {
        source: "apache",
        extensions: ["hdf"]
      },
      "application/x-httpd-php": {
        compressible: true,
        extensions: ["php"]
      },
      "application/x-install-instructions": {
        source: "apache",
        extensions: ["install"]
      },
      "application/x-iso9660-image": {
        source: "apache",
        extensions: ["iso"]
      },
      "application/x-iwork-keynote-sffkey": {
        extensions: ["key"]
      },
      "application/x-iwork-numbers-sffnumbers": {
        extensions: ["numbers"]
      },
      "application/x-iwork-pages-sffpages": {
        extensions: ["pages"]
      },
      "application/x-java-archive-diff": {
        source: "nginx",
        extensions: ["jardiff"]
      },
      "application/x-java-jnlp-file": {
        source: "apache",
        compressible: false,
        extensions: ["jnlp"]
      },
      "application/x-javascript": {
        compressible: true
      },
      "application/x-keepass2": {
        extensions: ["kdbx"]
      },
      "application/x-latex": {
        source: "apache",
        compressible: false,
        extensions: ["latex"]
      },
      "application/x-lua-bytecode": {
        extensions: ["luac"]
      },
      "application/x-lzh-compressed": {
        source: "apache",
        extensions: ["lzh", "lha"]
      },
      "application/x-makeself": {
        source: "nginx",
        extensions: ["run"]
      },
      "application/x-mie": {
        source: "apache",
        extensions: ["mie"]
      },
      "application/x-mobipocket-ebook": {
        source: "apache",
        extensions: ["prc", "mobi"]
      },
      "application/x-mpegurl": {
        compressible: false
      },
      "application/x-ms-application": {
        source: "apache",
        extensions: ["application"]
      },
      "application/x-ms-shortcut": {
        source: "apache",
        extensions: ["lnk"]
      },
      "application/x-ms-wmd": {
        source: "apache",
        extensions: ["wmd"]
      },
      "application/x-ms-wmz": {
        source: "apache",
        extensions: ["wmz"]
      },
      "application/x-ms-xbap": {
        source: "apache",
        extensions: ["xbap"]
      },
      "application/x-msaccess": {
        source: "apache",
        extensions: ["mdb"]
      },
      "application/x-msbinder": {
        source: "apache",
        extensions: ["obd"]
      },
      "application/x-mscardfile": {
        source: "apache",
        extensions: ["crd"]
      },
      "application/x-msclip": {
        source: "apache",
        extensions: ["clp"]
      },
      "application/x-msdos-program": {
        extensions: ["exe"]
      },
      "application/x-msdownload": {
        source: "apache",
        extensions: ["exe", "dll", "com", "bat", "msi"]
      },
      "application/x-msmediaview": {
        source: "apache",
        extensions: ["mvb", "m13", "m14"]
      },
      "application/x-msmetafile": {
        source: "apache",
        extensions: ["wmf", "wmz", "emf", "emz"]
      },
      "application/x-msmoney": {
        source: "apache",
        extensions: ["mny"]
      },
      "application/x-mspublisher": {
        source: "apache",
        extensions: ["pub"]
      },
      "application/x-msschedule": {
        source: "apache",
        extensions: ["scd"]
      },
      "application/x-msterminal": {
        source: "apache",
        extensions: ["trm"]
      },
      "application/x-mswrite": {
        source: "apache",
        extensions: ["wri"]
      },
      "application/x-netcdf": {
        source: "apache",
        extensions: ["nc", "cdf"]
      },
      "application/x-ns-proxy-autoconfig": {
        compressible: true,
        extensions: ["pac"]
      },
      "application/x-nzb": {
        source: "apache",
        extensions: ["nzb"]
      },
      "application/x-perl": {
        source: "nginx",
        extensions: ["pl", "pm"]
      },
      "application/x-pilot": {
        source: "nginx",
        extensions: ["prc", "pdb"]
      },
      "application/x-pkcs12": {
        source: "apache",
        compressible: false,
        extensions: ["p12", "pfx"]
      },
      "application/x-pkcs7-certificates": {
        source: "apache",
        extensions: ["p7b", "spc"]
      },
      "application/x-pkcs7-certreqresp": {
        source: "apache",
        extensions: ["p7r"]
      },
      "application/x-pki-message": {
        source: "iana"
      },
      "application/x-rar-compressed": {
        source: "apache",
        compressible: false,
        extensions: ["rar"]
      },
      "application/x-redhat-package-manager": {
        source: "nginx",
        extensions: ["rpm"]
      },
      "application/x-research-info-systems": {
        source: "apache",
        extensions: ["ris"]
      },
      "application/x-sea": {
        source: "nginx",
        extensions: ["sea"]
      },
      "application/x-sh": {
        source: "apache",
        compressible: true,
        extensions: ["sh"]
      },
      "application/x-shar": {
        source: "apache",
        extensions: ["shar"]
      },
      "application/x-shockwave-flash": {
        source: "apache",
        compressible: false,
        extensions: ["swf"]
      },
      "application/x-silverlight-app": {
        source: "apache",
        extensions: ["xap"]
      },
      "application/x-sql": {
        source: "apache",
        extensions: ["sql"]
      },
      "application/x-stuffit": {
        source: "apache",
        compressible: false,
        extensions: ["sit"]
      },
      "application/x-stuffitx": {
        source: "apache",
        extensions: ["sitx"]
      },
      "application/x-subrip": {
        source: "apache",
        extensions: ["srt"]
      },
      "application/x-sv4cpio": {
        source: "apache",
        extensions: ["sv4cpio"]
      },
      "application/x-sv4crc": {
        source: "apache",
        extensions: ["sv4crc"]
      },
      "application/x-t3vm-image": {
        source: "apache",
        extensions: ["t3"]
      },
      "application/x-tads": {
        source: "apache",
        extensions: ["gam"]
      },
      "application/x-tar": {
        source: "apache",
        compressible: true,
        extensions: ["tar"]
      },
      "application/x-tcl": {
        source: "apache",
        extensions: ["tcl", "tk"]
      },
      "application/x-tex": {
        source: "apache",
        extensions: ["tex"]
      },
      "application/x-tex-tfm": {
        source: "apache",
        extensions: ["tfm"]
      },
      "application/x-texinfo": {
        source: "apache",
        extensions: ["texinfo", "texi"]
      },
      "application/x-tgif": {
        source: "apache",
        extensions: ["obj"]
      },
      "application/x-ustar": {
        source: "apache",
        extensions: ["ustar"]
      },
      "application/x-virtualbox-hdd": {
        compressible: true,
        extensions: ["hdd"]
      },
      "application/x-virtualbox-ova": {
        compressible: true,
        extensions: ["ova"]
      },
      "application/x-virtualbox-ovf": {
        compressible: true,
        extensions: ["ovf"]
      },
      "application/x-virtualbox-vbox": {
        compressible: true,
        extensions: ["vbox"]
      },
      "application/x-virtualbox-vbox-extpack": {
        compressible: false,
        extensions: ["vbox-extpack"]
      },
      "application/x-virtualbox-vdi": {
        compressible: true,
        extensions: ["vdi"]
      },
      "application/x-virtualbox-vhd": {
        compressible: true,
        extensions: ["vhd"]
      },
      "application/x-virtualbox-vmdk": {
        compressible: true,
        extensions: ["vmdk"]
      },
      "application/x-wais-source": {
        source: "apache",
        extensions: ["src"]
      },
      "application/x-web-app-manifest+json": {
        compressible: true,
        extensions: ["webapp"]
      },
      "application/x-www-form-urlencoded": {
        source: "iana",
        compressible: true
      },
      "application/x-x509-ca-cert": {
        source: "iana",
        extensions: ["der", "crt", "pem"]
      },
      "application/x-x509-ca-ra-cert": {
        source: "iana"
      },
      "application/x-x509-next-ca-cert": {
        source: "iana"
      },
      "application/x-xfig": {
        source: "apache",
        extensions: ["fig"]
      },
      "application/x-xliff+xml": {
        source: "apache",
        compressible: true,
        extensions: ["xlf"]
      },
      "application/x-xpinstall": {
        source: "apache",
        compressible: false,
        extensions: ["xpi"]
      },
      "application/x-xz": {
        source: "apache",
        extensions: ["xz"]
      },
      "application/x-zmachine": {
        source: "apache",
        extensions: ["z1", "z2", "z3", "z4", "z5", "z6", "z7", "z8"]
      },
      "application/x400-bp": {
        source: "iana"
      },
      "application/xacml+xml": {
        source: "iana",
        compressible: true
      },
      "application/xaml+xml": {
        source: "apache",
        compressible: true,
        extensions: ["xaml"]
      },
      "application/xcap-att+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xav"]
      },
      "application/xcap-caps+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xca"]
      },
      "application/xcap-diff+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xdf"]
      },
      "application/xcap-el+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xel"]
      },
      "application/xcap-error+xml": {
        source: "iana",
        compressible: true
      },
      "application/xcap-ns+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xns"]
      },
      "application/xcon-conference-info+xml": {
        source: "iana",
        compressible: true
      },
      "application/xcon-conference-info-diff+xml": {
        source: "iana",
        compressible: true
      },
      "application/xenc+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xenc"]
      },
      "application/xhtml+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xhtml", "xht"]
      },
      "application/xhtml-voice+xml": {
        source: "apache",
        compressible: true
      },
      "application/xliff+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xlf"]
      },
      "application/xml": {
        source: "iana",
        compressible: true,
        extensions: ["xml", "xsl", "xsd", "rng"]
      },
      "application/xml-dtd": {
        source: "iana",
        compressible: true,
        extensions: ["dtd"]
      },
      "application/xml-external-parsed-entity": {
        source: "iana"
      },
      "application/xml-patch+xml": {
        source: "iana",
        compressible: true
      },
      "application/xmpp+xml": {
        source: "iana",
        compressible: true
      },
      "application/xop+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xop"]
      },
      "application/xproc+xml": {
        source: "apache",
        compressible: true,
        extensions: ["xpl"]
      },
      "application/xslt+xml": {
        source: "iana",
        compressible: true,
        extensions: ["xsl", "xslt"]
      },
      "application/xspf+xml": {
        source: "apache",
        compressible: true,
        extensions: ["xspf"]
      },
      "application/xv+xml": {
        source: "iana",
        compressible: true,
        extensions: ["mxml", "xhvml", "xvml", "xvm"]
      },
      "application/yang": {
        source: "iana",
        extensions: ["yang"]
      },
      "application/yang-data+json": {
        source: "iana",
        compressible: true
      },
      "application/yang-data+xml": {
        source: "iana",
        compressible: true
      },
      "application/yang-patch+json": {
        source: "iana",
        compressible: true
      },
      "application/yang-patch+xml": {
        source: "iana",
        compressible: true
      },
      "application/yin+xml": {
        source: "iana",
        compressible: true,
        extensions: ["yin"]
      },
      "application/zip": {
        source: "iana",
        compressible: false,
        extensions: ["zip"]
      },
      "application/zlib": {
        source: "iana"
      },
      "application/zstd": {
        source: "iana"
      },
      "audio/1d-interleaved-parityfec": {
        source: "iana"
      },
      "audio/32kadpcm": {
        source: "iana"
      },
      "audio/3gpp": {
        source: "iana",
        compressible: false,
        extensions: ["3gpp"]
      },
      "audio/3gpp2": {
        source: "iana"
      },
      "audio/aac": {
        source: "iana"
      },
      "audio/ac3": {
        source: "iana"
      },
      "audio/adpcm": {
        source: "apache",
        extensions: ["adp"]
      },
      "audio/amr": {
        source: "iana",
        extensions: ["amr"]
      },
      "audio/amr-wb": {
        source: "iana"
      },
      "audio/amr-wb+": {
        source: "iana"
      },
      "audio/aptx": {
        source: "iana"
      },
      "audio/asc": {
        source: "iana"
      },
      "audio/atrac-advanced-lossless": {
        source: "iana"
      },
      "audio/atrac-x": {
        source: "iana"
      },
      "audio/atrac3": {
        source: "iana"
      },
      "audio/basic": {
        source: "iana",
        compressible: false,
        extensions: ["au", "snd"]
      },
      "audio/bv16": {
        source: "iana"
      },
      "audio/bv32": {
        source: "iana"
      },
      "audio/clearmode": {
        source: "iana"
      },
      "audio/cn": {
        source: "iana"
      },
      "audio/dat12": {
        source: "iana"
      },
      "audio/dls": {
        source: "iana"
      },
      "audio/dsr-es201108": {
        source: "iana"
      },
      "audio/dsr-es202050": {
        source: "iana"
      },
      "audio/dsr-es202211": {
        source: "iana"
      },
      "audio/dsr-es202212": {
        source: "iana"
      },
      "audio/dv": {
        source: "iana"
      },
      "audio/dvi4": {
        source: "iana"
      },
      "audio/eac3": {
        source: "iana"
      },
      "audio/encaprtp": {
        source: "iana"
      },
      "audio/evrc": {
        source: "iana"
      },
      "audio/evrc-qcp": {
        source: "iana"
      },
      "audio/evrc0": {
        source: "iana"
      },
      "audio/evrc1": {
        source: "iana"
      },
      "audio/evrcb": {
        source: "iana"
      },
      "audio/evrcb0": {
        source: "iana"
      },
      "audio/evrcb1": {
        source: "iana"
      },
      "audio/evrcnw": {
        source: "iana"
      },
      "audio/evrcnw0": {
        source: "iana"
      },
      "audio/evrcnw1": {
        source: "iana"
      },
      "audio/evrcwb": {
        source: "iana"
      },
      "audio/evrcwb0": {
        source: "iana"
      },
      "audio/evrcwb1": {
        source: "iana"
      },
      "audio/evs": {
        source: "iana"
      },
      "audio/flexfec": {
        source: "iana"
      },
      "audio/fwdred": {
        source: "iana"
      },
      "audio/g711-0": {
        source: "iana"
      },
      "audio/g719": {
        source: "iana"
      },
      "audio/g722": {
        source: "iana"
      },
      "audio/g7221": {
        source: "iana"
      },
      "audio/g723": {
        source: "iana"
      },
      "audio/g726-16": {
        source: "iana"
      },
      "audio/g726-24": {
        source: "iana"
      },
      "audio/g726-32": {
        source: "iana"
      },
      "audio/g726-40": {
        source: "iana"
      },
      "audio/g728": {
        source: "iana"
      },
      "audio/g729": {
        source: "iana"
      },
      "audio/g7291": {
        source: "iana"
      },
      "audio/g729d": {
        source: "iana"
      },
      "audio/g729e": {
        source: "iana"
      },
      "audio/gsm": {
        source: "iana"
      },
      "audio/gsm-efr": {
        source: "iana"
      },
      "audio/gsm-hr-08": {
        source: "iana"
      },
      "audio/ilbc": {
        source: "iana"
      },
      "audio/ip-mr_v2.5": {
        source: "iana"
      },
      "audio/isac": {
        source: "apache"
      },
      "audio/l16": {
        source: "iana"
      },
      "audio/l20": {
        source: "iana"
      },
      "audio/l24": {
        source: "iana",
        compressible: false
      },
      "audio/l8": {
        source: "iana"
      },
      "audio/lpc": {
        source: "iana"
      },
      "audio/melp": {
        source: "iana"
      },
      "audio/melp1200": {
        source: "iana"
      },
      "audio/melp2400": {
        source: "iana"
      },
      "audio/melp600": {
        source: "iana"
      },
      "audio/mhas": {
        source: "iana"
      },
      "audio/midi": {
        source: "apache",
        extensions: ["mid", "midi", "kar", "rmi"]
      },
      "audio/mobile-xmf": {
        source: "iana",
        extensions: ["mxmf"]
      },
      "audio/mp3": {
        compressible: false,
        extensions: ["mp3"]
      },
      "audio/mp4": {
        source: "iana",
        compressible: false,
        extensions: ["m4a", "mp4a"]
      },
      "audio/mp4a-latm": {
        source: "iana"
      },
      "audio/mpa": {
        source: "iana"
      },
      "audio/mpa-robust": {
        source: "iana"
      },
      "audio/mpeg": {
        source: "iana",
        compressible: false,
        extensions: ["mpga", "mp2", "mp2a", "mp3", "m2a", "m3a"]
      },
      "audio/mpeg4-generic": {
        source: "iana"
      },
      "audio/musepack": {
        source: "apache"
      },
      "audio/ogg": {
        source: "iana",
        compressible: false,
        extensions: ["oga", "ogg", "spx", "opus"]
      },
      "audio/opus": {
        source: "iana"
      },
      "audio/parityfec": {
        source: "iana"
      },
      "audio/pcma": {
        source: "iana"
      },
      "audio/pcma-wb": {
        source: "iana"
      },
      "audio/pcmu": {
        source: "iana"
      },
      "audio/pcmu-wb": {
        source: "iana"
      },
      "audio/prs.sid": {
        source: "iana"
      },
      "audio/qcelp": {
        source: "iana"
      },
      "audio/raptorfec": {
        source: "iana"
      },
      "audio/red": {
        source: "iana"
      },
      "audio/rtp-enc-aescm128": {
        source: "iana"
      },
      "audio/rtp-midi": {
        source: "iana"
      },
      "audio/rtploopback": {
        source: "iana"
      },
      "audio/rtx": {
        source: "iana"
      },
      "audio/s3m": {
        source: "apache",
        extensions: ["s3m"]
      },
      "audio/scip": {
        source: "iana"
      },
      "audio/silk": {
        source: "apache",
        extensions: ["sil"]
      },
      "audio/smv": {
        source: "iana"
      },
      "audio/smv-qcp": {
        source: "iana"
      },
      "audio/smv0": {
        source: "iana"
      },
      "audio/sofa": {
        source: "iana"
      },
      "audio/sp-midi": {
        source: "iana"
      },
      "audio/speex": {
        source: "iana"
      },
      "audio/t140c": {
        source: "iana"
      },
      "audio/t38": {
        source: "iana"
      },
      "audio/telephone-event": {
        source: "iana"
      },
      "audio/tetra_acelp": {
        source: "iana"
      },
      "audio/tetra_acelp_bb": {
        source: "iana"
      },
      "audio/tone": {
        source: "iana"
      },
      "audio/tsvcis": {
        source: "iana"
      },
      "audio/uemclip": {
        source: "iana"
      },
      "audio/ulpfec": {
        source: "iana"
      },
      "audio/usac": {
        source: "iana"
      },
      "audio/vdvi": {
        source: "iana"
      },
      "audio/vmr-wb": {
        source: "iana"
      },
      "audio/vnd.3gpp.iufp": {
        source: "iana"
      },
      "audio/vnd.4sb": {
        source: "iana"
      },
      "audio/vnd.audiokoz": {
        source: "iana"
      },
      "audio/vnd.celp": {
        source: "iana"
      },
      "audio/vnd.cisco.nse": {
        source: "iana"
      },
      "audio/vnd.cmles.radio-events": {
        source: "iana"
      },
      "audio/vnd.cns.anp1": {
        source: "iana"
      },
      "audio/vnd.cns.inf1": {
        source: "iana"
      },
      "audio/vnd.dece.audio": {
        source: "iana",
        extensions: ["uva", "uvva"]
      },
      "audio/vnd.digital-winds": {
        source: "iana",
        extensions: ["eol"]
      },
      "audio/vnd.dlna.adts": {
        source: "iana"
      },
      "audio/vnd.dolby.heaac.1": {
        source: "iana"
      },
      "audio/vnd.dolby.heaac.2": {
        source: "iana"
      },
      "audio/vnd.dolby.mlp": {
        source: "iana"
      },
      "audio/vnd.dolby.mps": {
        source: "iana"
      },
      "audio/vnd.dolby.pl2": {
        source: "iana"
      },
      "audio/vnd.dolby.pl2x": {
        source: "iana"
      },
      "audio/vnd.dolby.pl2z": {
        source: "iana"
      },
      "audio/vnd.dolby.pulse.1": {
        source: "iana"
      },
      "audio/vnd.dra": {
        source: "iana",
        extensions: ["dra"]
      },
      "audio/vnd.dts": {
        source: "iana",
        extensions: ["dts"]
      },
      "audio/vnd.dts.hd": {
        source: "iana",
        extensions: ["dtshd"]
      },
      "audio/vnd.dts.uhd": {
        source: "iana"
      },
      "audio/vnd.dvb.file": {
        source: "iana"
      },
      "audio/vnd.everad.plj": {
        source: "iana"
      },
      "audio/vnd.hns.audio": {
        source: "iana"
      },
      "audio/vnd.lucent.voice": {
        source: "iana",
        extensions: ["lvp"]
      },
      "audio/vnd.ms-playready.media.pya": {
        source: "iana",
        extensions: ["pya"]
      },
      "audio/vnd.nokia.mobile-xmf": {
        source: "iana"
      },
      "audio/vnd.nortel.vbk": {
        source: "iana"
      },
      "audio/vnd.nuera.ecelp4800": {
        source: "iana",
        extensions: ["ecelp4800"]
      },
      "audio/vnd.nuera.ecelp7470": {
        source: "iana",
        extensions: ["ecelp7470"]
      },
      "audio/vnd.nuera.ecelp9600": {
        source: "iana",
        extensions: ["ecelp9600"]
      },
      "audio/vnd.octel.sbc": {
        source: "iana"
      },
      "audio/vnd.presonus.multitrack": {
        source: "iana"
      },
      "audio/vnd.qcelp": {
        source: "iana"
      },
      "audio/vnd.rhetorex.32kadpcm": {
        source: "iana"
      },
      "audio/vnd.rip": {
        source: "iana",
        extensions: ["rip"]
      },
      "audio/vnd.rn-realaudio": {
        compressible: false
      },
      "audio/vnd.sealedmedia.softseal.mpeg": {
        source: "iana"
      },
      "audio/vnd.vmx.cvsd": {
        source: "iana"
      },
      "audio/vnd.wave": {
        compressible: false
      },
      "audio/vorbis": {
        source: "iana",
        compressible: false
      },
      "audio/vorbis-config": {
        source: "iana"
      },
      "audio/wav": {
        compressible: false,
        extensions: ["wav"]
      },
      "audio/wave": {
        compressible: false,
        extensions: ["wav"]
      },
      "audio/webm": {
        source: "apache",
        compressible: false,
        extensions: ["weba"]
      },
      "audio/x-aac": {
        source: "apache",
        compressible: false,
        extensions: ["aac"]
      },
      "audio/x-aiff": {
        source: "apache",
        extensions: ["aif", "aiff", "aifc"]
      },
      "audio/x-caf": {
        source: "apache",
        compressible: false,
        extensions: ["caf"]
      },
      "audio/x-flac": {
        source: "apache",
        extensions: ["flac"]
      },
      "audio/x-m4a": {
        source: "nginx",
        extensions: ["m4a"]
      },
      "audio/x-matroska": {
        source: "apache",
        extensions: ["mka"]
      },
      "audio/x-mpegurl": {
        source: "apache",
        extensions: ["m3u"]
      },
      "audio/x-ms-wax": {
        source: "apache",
        extensions: ["wax"]
      },
      "audio/x-ms-wma": {
        source: "apache",
        extensions: ["wma"]
      },
      "audio/x-pn-realaudio": {
        source: "apache",
        extensions: ["ram", "ra"]
      },
      "audio/x-pn-realaudio-plugin": {
        source: "apache",
        extensions: ["rmp"]
      },
      "audio/x-realaudio": {
        source: "nginx",
        extensions: ["ra"]
      },
      "audio/x-tta": {
        source: "apache"
      },
      "audio/x-wav": {
        source: "apache",
        extensions: ["wav"]
      },
      "audio/xm": {
        source: "apache",
        extensions: ["xm"]
      },
      "chemical/x-cdx": {
        source: "apache",
        extensions: ["cdx"]
      },
      "chemical/x-cif": {
        source: "apache",
        extensions: ["cif"]
      },
      "chemical/x-cmdf": {
        source: "apache",
        extensions: ["cmdf"]
      },
      "chemical/x-cml": {
        source: "apache",
        extensions: ["cml"]
      },
      "chemical/x-csml": {
        source: "apache",
        extensions: ["csml"]
      },
      "chemical/x-pdb": {
        source: "apache"
      },
      "chemical/x-xyz": {
        source: "apache",
        extensions: ["xyz"]
      },
      "font/collection": {
        source: "iana",
        extensions: ["ttc"]
      },
      "font/otf": {
        source: "iana",
        compressible: true,
        extensions: ["otf"]
      },
      "font/sfnt": {
        source: "iana"
      },
      "font/ttf": {
        source: "iana",
        compressible: true,
        extensions: ["ttf"]
      },
      "font/woff": {
        source: "iana",
        extensions: ["woff"]
      },
      "font/woff2": {
        source: "iana",
        extensions: ["woff2"]
      },
      "image/aces": {
        source: "iana",
        extensions: ["exr"]
      },
      "image/apng": {
        compressible: false,
        extensions: ["apng"]
      },
      "image/avci": {
        source: "iana",
        extensions: ["avci"]
      },
      "image/avcs": {
        source: "iana",
        extensions: ["avcs"]
      },
      "image/avif": {
        source: "iana",
        compressible: false,
        extensions: ["avif"]
      },
      "image/bmp": {
        source: "iana",
        compressible: true,
        extensions: ["bmp"]
      },
      "image/cgm": {
        source: "iana",
        extensions: ["cgm"]
      },
      "image/dicom-rle": {
        source: "iana",
        extensions: ["drle"]
      },
      "image/emf": {
        source: "iana",
        extensions: ["emf"]
      },
      "image/fits": {
        source: "iana",
        extensions: ["fits"]
      },
      "image/g3fax": {
        source: "iana",
        extensions: ["g3"]
      },
      "image/gif": {
        source: "iana",
        compressible: false,
        extensions: ["gif"]
      },
      "image/heic": {
        source: "iana",
        extensions: ["heic"]
      },
      "image/heic-sequence": {
        source: "iana",
        extensions: ["heics"]
      },
      "image/heif": {
        source: "iana",
        extensions: ["heif"]
      },
      "image/heif-sequence": {
        source: "iana",
        extensions: ["heifs"]
      },
      "image/hej2k": {
        source: "iana",
        extensions: ["hej2"]
      },
      "image/hsj2": {
        source: "iana",
        extensions: ["hsj2"]
      },
      "image/ief": {
        source: "iana",
        extensions: ["ief"]
      },
      "image/jls": {
        source: "iana",
        extensions: ["jls"]
      },
      "image/jp2": {
        source: "iana",
        compressible: false,
        extensions: ["jp2", "jpg2"]
      },
      "image/jpeg": {
        source: "iana",
        compressible: false,
        extensions: ["jpeg", "jpg", "jpe"]
      },
      "image/jph": {
        source: "iana",
        extensions: ["jph"]
      },
      "image/jphc": {
        source: "iana",
        extensions: ["jhc"]
      },
      "image/jpm": {
        source: "iana",
        compressible: false,
        extensions: ["jpm"]
      },
      "image/jpx": {
        source: "iana",
        compressible: false,
        extensions: ["jpx", "jpf"]
      },
      "image/jxr": {
        source: "iana",
        extensions: ["jxr"]
      },
      "image/jxra": {
        source: "iana",
        extensions: ["jxra"]
      },
      "image/jxrs": {
        source: "iana",
        extensions: ["jxrs"]
      },
      "image/jxs": {
        source: "iana",
        extensions: ["jxs"]
      },
      "image/jxsc": {
        source: "iana",
        extensions: ["jxsc"]
      },
      "image/jxsi": {
        source: "iana",
        extensions: ["jxsi"]
      },
      "image/jxss": {
        source: "iana",
        extensions: ["jxss"]
      },
      "image/ktx": {
        source: "iana",
        extensions: ["ktx"]
      },
      "image/ktx2": {
        source: "iana",
        extensions: ["ktx2"]
      },
      "image/naplps": {
        source: "iana"
      },
      "image/pjpeg": {
        compressible: false
      },
      "image/png": {
        source: "iana",
        compressible: false,
        extensions: ["png"]
      },
      "image/prs.btif": {
        source: "iana",
        extensions: ["btif"]
      },
      "image/prs.pti": {
        source: "iana",
        extensions: ["pti"]
      },
      "image/pwg-raster": {
        source: "iana"
      },
      "image/sgi": {
        source: "apache",
        extensions: ["sgi"]
      },
      "image/svg+xml": {
        source: "iana",
        compressible: true,
        extensions: ["svg", "svgz"]
      },
      "image/t38": {
        source: "iana",
        extensions: ["t38"]
      },
      "image/tiff": {
        source: "iana",
        compressible: false,
        extensions: ["tif", "tiff"]
      },
      "image/tiff-fx": {
        source: "iana",
        extensions: ["tfx"]
      },
      "image/vnd.adobe.photoshop": {
        source: "iana",
        compressible: true,
        extensions: ["psd"]
      },
      "image/vnd.airzip.accelerator.azv": {
        source: "iana",
        extensions: ["azv"]
      },
      "image/vnd.cns.inf2": {
        source: "iana"
      },
      "image/vnd.dece.graphic": {
        source: "iana",
        extensions: ["uvi", "uvvi", "uvg", "uvvg"]
      },
      "image/vnd.djvu": {
        source: "iana",
        extensions: ["djvu", "djv"]
      },
      "image/vnd.dvb.subtitle": {
        source: "iana",
        extensions: ["sub"]
      },
      "image/vnd.dwg": {
        source: "iana",
        extensions: ["dwg"]
      },
      "image/vnd.dxf": {
        source: "iana",
        extensions: ["dxf"]
      },
      "image/vnd.fastbidsheet": {
        source: "iana",
        extensions: ["fbs"]
      },
      "image/vnd.fpx": {
        source: "iana",
        extensions: ["fpx"]
      },
      "image/vnd.fst": {
        source: "iana",
        extensions: ["fst"]
      },
      "image/vnd.fujixerox.edmics-mmr": {
        source: "iana",
        extensions: ["mmr"]
      },
      "image/vnd.fujixerox.edmics-rlc": {
        source: "iana",
        extensions: ["rlc"]
      },
      "image/vnd.globalgraphics.pgb": {
        source: "iana"
      },
      "image/vnd.microsoft.icon": {
        source: "iana",
        compressible: true,
        extensions: ["ico"]
      },
      "image/vnd.mix": {
        source: "iana"
      },
      "image/vnd.mozilla.apng": {
        source: "iana"
      },
      "image/vnd.ms-dds": {
        compressible: true,
        extensions: ["dds"]
      },
      "image/vnd.ms-modi": {
        source: "iana",
        extensions: ["mdi"]
      },
      "image/vnd.ms-photo": {
        source: "apache",
        extensions: ["wdp"]
      },
      "image/vnd.net-fpx": {
        source: "iana",
        extensions: ["npx"]
      },
      "image/vnd.pco.b16": {
        source: "iana",
        extensions: ["b16"]
      },
      "image/vnd.radiance": {
        source: "iana"
      },
      "image/vnd.sealed.png": {
        source: "iana"
      },
      "image/vnd.sealedmedia.softseal.gif": {
        source: "iana"
      },
      "image/vnd.sealedmedia.softseal.jpg": {
        source: "iana"
      },
      "image/vnd.svf": {
        source: "iana"
      },
      "image/vnd.tencent.tap": {
        source: "iana",
        extensions: ["tap"]
      },
      "image/vnd.valve.source.texture": {
        source: "iana",
        extensions: ["vtf"]
      },
      "image/vnd.wap.wbmp": {
        source: "iana",
        extensions: ["wbmp"]
      },
      "image/vnd.xiff": {
        source: "iana",
        extensions: ["xif"]
      },
      "image/vnd.zbrush.pcx": {
        source: "iana",
        extensions: ["pcx"]
      },
      "image/webp": {
        source: "apache",
        extensions: ["webp"]
      },
      "image/wmf": {
        source: "iana",
        extensions: ["wmf"]
      },
      "image/x-3ds": {
        source: "apache",
        extensions: ["3ds"]
      },
      "image/x-cmu-raster": {
        source: "apache",
        extensions: ["ras"]
      },
      "image/x-cmx": {
        source: "apache",
        extensions: ["cmx"]
      },
      "image/x-freehand": {
        source: "apache",
        extensions: ["fh", "fhc", "fh4", "fh5", "fh7"]
      },
      "image/x-icon": {
        source: "apache",
        compressible: true,
        extensions: ["ico"]
      },
      "image/x-jng": {
        source: "nginx",
        extensions: ["jng"]
      },
      "image/x-mrsid-image": {
        source: "apache",
        extensions: ["sid"]
      },
      "image/x-ms-bmp": {
        source: "nginx",
        compressible: true,
        extensions: ["bmp"]
      },
      "image/x-pcx": {
        source: "apache",
        extensions: ["pcx"]
      },
      "image/x-pict": {
        source: "apache",
        extensions: ["pic", "pct"]
      },
      "image/x-portable-anymap": {
        source: "apache",
        extensions: ["pnm"]
      },
      "image/x-portable-bitmap": {
        source: "apache",
        extensions: ["pbm"]
      },
      "image/x-portable-graymap": {
        source: "apache",
        extensions: ["pgm"]
      },
      "image/x-portable-pixmap": {
        source: "apache",
        extensions: ["ppm"]
      },
      "image/x-rgb": {
        source: "apache",
        extensions: ["rgb"]
      },
      "image/x-tga": {
        source: "apache",
        extensions: ["tga"]
      },
      "image/x-xbitmap": {
        source: "apache",
        extensions: ["xbm"]
      },
      "image/x-xcf": {
        compressible: false
      },
      "image/x-xpixmap": {
        source: "apache",
        extensions: ["xpm"]
      },
      "image/x-xwindowdump": {
        source: "apache",
        extensions: ["xwd"]
      },
      "message/cpim": {
        source: "iana"
      },
      "message/delivery-status": {
        source: "iana"
      },
      "message/disposition-notification": {
        source: "iana",
        extensions: [
          "disposition-notification"
        ]
      },
      "message/external-body": {
        source: "iana"
      },
      "message/feedback-report": {
        source: "iana"
      },
      "message/global": {
        source: "iana",
        extensions: ["u8msg"]
      },
      "message/global-delivery-status": {
        source: "iana",
        extensions: ["u8dsn"]
      },
      "message/global-disposition-notification": {
        source: "iana",
        extensions: ["u8mdn"]
      },
      "message/global-headers": {
        source: "iana",
        extensions: ["u8hdr"]
      },
      "message/http": {
        source: "iana",
        compressible: false
      },
      "message/imdn+xml": {
        source: "iana",
        compressible: true
      },
      "message/news": {
        source: "iana"
      },
      "message/partial": {
        source: "iana",
        compressible: false
      },
      "message/rfc822": {
        source: "iana",
        compressible: true,
        extensions: ["eml", "mime"]
      },
      "message/s-http": {
        source: "iana"
      },
      "message/sip": {
        source: "iana"
      },
      "message/sipfrag": {
        source: "iana"
      },
      "message/tracking-status": {
        source: "iana"
      },
      "message/vnd.si.simp": {
        source: "iana"
      },
      "message/vnd.wfa.wsc": {
        source: "iana",
        extensions: ["wsc"]
      },
      "model/3mf": {
        source: "iana",
        extensions: ["3mf"]
      },
      "model/e57": {
        source: "iana"
      },
      "model/gltf+json": {
        source: "iana",
        compressible: true,
        extensions: ["gltf"]
      },
      "model/gltf-binary": {
        source: "iana",
        compressible: true,
        extensions: ["glb"]
      },
      "model/iges": {
        source: "iana",
        compressible: false,
        extensions: ["igs", "iges"]
      },
      "model/mesh": {
        source: "iana",
        compressible: false,
        extensions: ["msh", "mesh", "silo"]
      },
      "model/mtl": {
        source: "iana",
        extensions: ["mtl"]
      },
      "model/obj": {
        source: "iana",
        extensions: ["obj"]
      },
      "model/step": {
        source: "iana"
      },
      "model/step+xml": {
        source: "iana",
        compressible: true,
        extensions: ["stpx"]
      },
      "model/step+zip": {
        source: "iana",
        compressible: false,
        extensions: ["stpz"]
      },
      "model/step-xml+zip": {
        source: "iana",
        compressible: false,
        extensions: ["stpxz"]
      },
      "model/stl": {
        source: "iana",
        extensions: ["stl"]
      },
      "model/vnd.collada+xml": {
        source: "iana",
        compressible: true,
        extensions: ["dae"]
      },
      "model/vnd.dwf": {
        source: "iana",
        extensions: ["dwf"]
      },
      "model/vnd.flatland.3dml": {
        source: "iana"
      },
      "model/vnd.gdl": {
        source: "iana",
        extensions: ["gdl"]
      },
      "model/vnd.gs-gdl": {
        source: "apache"
      },
      "model/vnd.gs.gdl": {
        source: "iana"
      },
      "model/vnd.gtw": {
        source: "iana",
        extensions: ["gtw"]
      },
      "model/vnd.moml+xml": {
        source: "iana",
        compressible: true
      },
      "model/vnd.mts": {
        source: "iana",
        extensions: ["mts"]
      },
      "model/vnd.opengex": {
        source: "iana",
        extensions: ["ogex"]
      },
      "model/vnd.parasolid.transmit.binary": {
        source: "iana",
        extensions: ["x_b"]
      },
      "model/vnd.parasolid.transmit.text": {
        source: "iana",
        extensions: ["x_t"]
      },
      "model/vnd.pytha.pyox": {
        source: "iana"
      },
      "model/vnd.rosette.annotated-data-model": {
        source: "iana"
      },
      "model/vnd.sap.vds": {
        source: "iana",
        extensions: ["vds"]
      },
      "model/vnd.usdz+zip": {
        source: "iana",
        compressible: false,
        extensions: ["usdz"]
      },
      "model/vnd.valve.source.compiled-map": {
        source: "iana",
        extensions: ["bsp"]
      },
      "model/vnd.vtu": {
        source: "iana",
        extensions: ["vtu"]
      },
      "model/vrml": {
        source: "iana",
        compressible: false,
        extensions: ["wrl", "vrml"]
      },
      "model/x3d+binary": {
        source: "apache",
        compressible: false,
        extensions: ["x3db", "x3dbz"]
      },
      "model/x3d+fastinfoset": {
        source: "iana",
        extensions: ["x3db"]
      },
      "model/x3d+vrml": {
        source: "apache",
        compressible: false,
        extensions: ["x3dv", "x3dvz"]
      },
      "model/x3d+xml": {
        source: "iana",
        compressible: true,
        extensions: ["x3d", "x3dz"]
      },
      "model/x3d-vrml": {
        source: "iana",
        extensions: ["x3dv"]
      },
      "multipart/alternative": {
        source: "iana",
        compressible: false
      },
      "multipart/appledouble": {
        source: "iana"
      },
      "multipart/byteranges": {
        source: "iana"
      },
      "multipart/digest": {
        source: "iana"
      },
      "multipart/encrypted": {
        source: "iana",
        compressible: false
      },
      "multipart/form-data": {
        source: "iana",
        compressible: false
      },
      "multipart/header-set": {
        source: "iana"
      },
      "multipart/mixed": {
        source: "iana"
      },
      "multipart/multilingual": {
        source: "iana"
      },
      "multipart/parallel": {
        source: "iana"
      },
      "multipart/related": {
        source: "iana",
        compressible: false
      },
      "multipart/report": {
        source: "iana"
      },
      "multipart/signed": {
        source: "iana",
        compressible: false
      },
      "multipart/vnd.bint.med-plus": {
        source: "iana"
      },
      "multipart/voice-message": {
        source: "iana"
      },
      "multipart/x-mixed-replace": {
        source: "iana"
      },
      "text/1d-interleaved-parityfec": {
        source: "iana"
      },
      "text/cache-manifest": {
        source: "iana",
        compressible: true,
        extensions: ["appcache", "manifest"]
      },
      "text/calendar": {
        source: "iana",
        extensions: ["ics", "ifb"]
      },
      "text/calender": {
        compressible: true
      },
      "text/cmd": {
        compressible: true
      },
      "text/coffeescript": {
        extensions: ["coffee", "litcoffee"]
      },
      "text/cql": {
        source: "iana"
      },
      "text/cql-expression": {
        source: "iana"
      },
      "text/cql-identifier": {
        source: "iana"
      },
      "text/css": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["css"]
      },
      "text/csv": {
        source: "iana",
        compressible: true,
        extensions: ["csv"]
      },
      "text/csv-schema": {
        source: "iana"
      },
      "text/directory": {
        source: "iana"
      },
      "text/dns": {
        source: "iana"
      },
      "text/ecmascript": {
        source: "iana"
      },
      "text/encaprtp": {
        source: "iana"
      },
      "text/enriched": {
        source: "iana"
      },
      "text/fhirpath": {
        source: "iana"
      },
      "text/flexfec": {
        source: "iana"
      },
      "text/fwdred": {
        source: "iana"
      },
      "text/gff3": {
        source: "iana"
      },
      "text/grammar-ref-list": {
        source: "iana"
      },
      "text/html": {
        source: "iana",
        compressible: true,
        extensions: ["html", "htm", "shtml"]
      },
      "text/jade": {
        extensions: ["jade"]
      },
      "text/javascript": {
        source: "iana",
        compressible: true
      },
      "text/jcr-cnd": {
        source: "iana"
      },
      "text/jsx": {
        compressible: true,
        extensions: ["jsx"]
      },
      "text/less": {
        compressible: true,
        extensions: ["less"]
      },
      "text/markdown": {
        source: "iana",
        compressible: true,
        extensions: ["markdown", "md"]
      },
      "text/mathml": {
        source: "nginx",
        extensions: ["mml"]
      },
      "text/mdx": {
        compressible: true,
        extensions: ["mdx"]
      },
      "text/mizar": {
        source: "iana"
      },
      "text/n3": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["n3"]
      },
      "text/parameters": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/parityfec": {
        source: "iana"
      },
      "text/plain": {
        source: "iana",
        compressible: true,
        extensions: ["txt", "text", "conf", "def", "list", "log", "in", "ini"]
      },
      "text/provenance-notation": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/prs.fallenstein.rst": {
        source: "iana"
      },
      "text/prs.lines.tag": {
        source: "iana",
        extensions: ["dsc"]
      },
      "text/prs.prop.logic": {
        source: "iana"
      },
      "text/raptorfec": {
        source: "iana"
      },
      "text/red": {
        source: "iana"
      },
      "text/rfc822-headers": {
        source: "iana"
      },
      "text/richtext": {
        source: "iana",
        compressible: true,
        extensions: ["rtx"]
      },
      "text/rtf": {
        source: "iana",
        compressible: true,
        extensions: ["rtf"]
      },
      "text/rtp-enc-aescm128": {
        source: "iana"
      },
      "text/rtploopback": {
        source: "iana"
      },
      "text/rtx": {
        source: "iana"
      },
      "text/sgml": {
        source: "iana",
        extensions: ["sgml", "sgm"]
      },
      "text/shaclc": {
        source: "iana"
      },
      "text/shex": {
        source: "iana",
        extensions: ["shex"]
      },
      "text/slim": {
        extensions: ["slim", "slm"]
      },
      "text/spdx": {
        source: "iana",
        extensions: ["spdx"]
      },
      "text/strings": {
        source: "iana"
      },
      "text/stylus": {
        extensions: ["stylus", "styl"]
      },
      "text/t140": {
        source: "iana"
      },
      "text/tab-separated-values": {
        source: "iana",
        compressible: true,
        extensions: ["tsv"]
      },
      "text/troff": {
        source: "iana",
        extensions: ["t", "tr", "roff", "man", "me", "ms"]
      },
      "text/turtle": {
        source: "iana",
        charset: "UTF-8",
        extensions: ["ttl"]
      },
      "text/ulpfec": {
        source: "iana"
      },
      "text/uri-list": {
        source: "iana",
        compressible: true,
        extensions: ["uri", "uris", "urls"]
      },
      "text/vcard": {
        source: "iana",
        compressible: true,
        extensions: ["vcard"]
      },
      "text/vnd.a": {
        source: "iana"
      },
      "text/vnd.abc": {
        source: "iana"
      },
      "text/vnd.ascii-art": {
        source: "iana"
      },
      "text/vnd.curl": {
        source: "iana",
        extensions: ["curl"]
      },
      "text/vnd.curl.dcurl": {
        source: "apache",
        extensions: ["dcurl"]
      },
      "text/vnd.curl.mcurl": {
        source: "apache",
        extensions: ["mcurl"]
      },
      "text/vnd.curl.scurl": {
        source: "apache",
        extensions: ["scurl"]
      },
      "text/vnd.debian.copyright": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/vnd.dmclientscript": {
        source: "iana"
      },
      "text/vnd.dvb.subtitle": {
        source: "iana",
        extensions: ["sub"]
      },
      "text/vnd.esmertec.theme-descriptor": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/vnd.familysearch.gedcom": {
        source: "iana",
        extensions: ["ged"]
      },
      "text/vnd.ficlab.flt": {
        source: "iana"
      },
      "text/vnd.fly": {
        source: "iana",
        extensions: ["fly"]
      },
      "text/vnd.fmi.flexstor": {
        source: "iana",
        extensions: ["flx"]
      },
      "text/vnd.gml": {
        source: "iana"
      },
      "text/vnd.graphviz": {
        source: "iana",
        extensions: ["gv"]
      },
      "text/vnd.hans": {
        source: "iana"
      },
      "text/vnd.hgl": {
        source: "iana"
      },
      "text/vnd.in3d.3dml": {
        source: "iana",
        extensions: ["3dml"]
      },
      "text/vnd.in3d.spot": {
        source: "iana",
        extensions: ["spot"]
      },
      "text/vnd.iptc.newsml": {
        source: "iana"
      },
      "text/vnd.iptc.nitf": {
        source: "iana"
      },
      "text/vnd.latex-z": {
        source: "iana"
      },
      "text/vnd.motorola.reflex": {
        source: "iana"
      },
      "text/vnd.ms-mediapackage": {
        source: "iana"
      },
      "text/vnd.net2phone.commcenter.command": {
        source: "iana"
      },
      "text/vnd.radisys.msml-basic-layout": {
        source: "iana"
      },
      "text/vnd.senx.warpscript": {
        source: "iana"
      },
      "text/vnd.si.uricatalogue": {
        source: "iana"
      },
      "text/vnd.sosi": {
        source: "iana"
      },
      "text/vnd.sun.j2me.app-descriptor": {
        source: "iana",
        charset: "UTF-8",
        extensions: ["jad"]
      },
      "text/vnd.trolltech.linguist": {
        source: "iana",
        charset: "UTF-8"
      },
      "text/vnd.wap.si": {
        source: "iana"
      },
      "text/vnd.wap.sl": {
        source: "iana"
      },
      "text/vnd.wap.wml": {
        source: "iana",
        extensions: ["wml"]
      },
      "text/vnd.wap.wmlscript": {
        source: "iana",
        extensions: ["wmls"]
      },
      "text/vtt": {
        source: "iana",
        charset: "UTF-8",
        compressible: true,
        extensions: ["vtt"]
      },
      "text/x-asm": {
        source: "apache",
        extensions: ["s", "asm"]
      },
      "text/x-c": {
        source: "apache",
        extensions: ["c", "cc", "cxx", "cpp", "h", "hh", "dic"]
      },
      "text/x-component": {
        source: "nginx",
        extensions: ["htc"]
      },
      "text/x-fortran": {
        source: "apache",
        extensions: ["f", "for", "f77", "f90"]
      },
      "text/x-gwt-rpc": {
        compressible: true
      },
      "text/x-handlebars-template": {
        extensions: ["hbs"]
      },
      "text/x-java-source": {
        source: "apache",
        extensions: ["java"]
      },
      "text/x-jquery-tmpl": {
        compressible: true
      },
      "text/x-lua": {
        extensions: ["lua"]
      },
      "text/x-markdown": {
        compressible: true,
        extensions: ["mkd"]
      },
      "text/x-nfo": {
        source: "apache",
        extensions: ["nfo"]
      },
      "text/x-opml": {
        source: "apache",
        extensions: ["opml"]
      },
      "text/x-org": {
        compressible: true,
        extensions: ["org"]
      },
      "text/x-pascal": {
        source: "apache",
        extensions: ["p", "pas"]
      },
      "text/x-processing": {
        compressible: true,
        extensions: ["pde"]
      },
      "text/x-sass": {
        extensions: ["sass"]
      },
      "text/x-scss": {
        extensions: ["scss"]
      },
      "text/x-setext": {
        source: "apache",
        extensions: ["etx"]
      },
      "text/x-sfv": {
        source: "apache",
        extensions: ["sfv"]
      },
      "text/x-suse-ymp": {
        compressible: true,
        extensions: ["ymp"]
      },
      "text/x-uuencode": {
        source: "apache",
        extensions: ["uu"]
      },
      "text/x-vcalendar": {
        source: "apache",
        extensions: ["vcs"]
      },
      "text/x-vcard": {
        source: "apache",
        extensions: ["vcf"]
      },
      "text/xml": {
        source: "iana",
        compressible: true,
        extensions: ["xml"]
      },
      "text/xml-external-parsed-entity": {
        source: "iana"
      },
      "text/yaml": {
        compressible: true,
        extensions: ["yaml", "yml"]
      },
      "video/1d-interleaved-parityfec": {
        source: "iana"
      },
      "video/3gpp": {
        source: "iana",
        extensions: ["3gp", "3gpp"]
      },
      "video/3gpp-tt": {
        source: "iana"
      },
      "video/3gpp2": {
        source: "iana",
        extensions: ["3g2"]
      },
      "video/av1": {
        source: "iana"
      },
      "video/bmpeg": {
        source: "iana"
      },
      "video/bt656": {
        source: "iana"
      },
      "video/celb": {
        source: "iana"
      },
      "video/dv": {
        source: "iana"
      },
      "video/encaprtp": {
        source: "iana"
      },
      "video/ffv1": {
        source: "iana"
      },
      "video/flexfec": {
        source: "iana"
      },
      "video/h261": {
        source: "iana",
        extensions: ["h261"]
      },
      "video/h263": {
        source: "iana",
        extensions: ["h263"]
      },
      "video/h263-1998": {
        source: "iana"
      },
      "video/h263-2000": {
        source: "iana"
      },
      "video/h264": {
        source: "iana",
        extensions: ["h264"]
      },
      "video/h264-rcdo": {
        source: "iana"
      },
      "video/h264-svc": {
        source: "iana"
      },
      "video/h265": {
        source: "iana"
      },
      "video/iso.segment": {
        source: "iana",
        extensions: ["m4s"]
      },
      "video/jpeg": {
        source: "iana",
        extensions: ["jpgv"]
      },
      "video/jpeg2000": {
        source: "iana"
      },
      "video/jpm": {
        source: "apache",
        extensions: ["jpm", "jpgm"]
      },
      "video/jxsv": {
        source: "iana"
      },
      "video/mj2": {
        source: "iana",
        extensions: ["mj2", "mjp2"]
      },
      "video/mp1s": {
        source: "iana"
      },
      "video/mp2p": {
        source: "iana"
      },
      "video/mp2t": {
        source: "iana",
        extensions: ["ts"]
      },
      "video/mp4": {
        source: "iana",
        compressible: false,
        extensions: ["mp4", "mp4v", "mpg4"]
      },
      "video/mp4v-es": {
        source: "iana"
      },
      "video/mpeg": {
        source: "iana",
        compressible: false,
        extensions: ["mpeg", "mpg", "mpe", "m1v", "m2v"]
      },
      "video/mpeg4-generic": {
        source: "iana"
      },
      "video/mpv": {
        source: "iana"
      },
      "video/nv": {
        source: "iana"
      },
      "video/ogg": {
        source: "iana",
        compressible: false,
        extensions: ["ogv"]
      },
      "video/parityfec": {
        source: "iana"
      },
      "video/pointer": {
        source: "iana"
      },
      "video/quicktime": {
        source: "iana",
        compressible: false,
        extensions: ["qt", "mov"]
      },
      "video/raptorfec": {
        source: "iana"
      },
      "video/raw": {
        source: "iana"
      },
      "video/rtp-enc-aescm128": {
        source: "iana"
      },
      "video/rtploopback": {
        source: "iana"
      },
      "video/rtx": {
        source: "iana"
      },
      "video/scip": {
        source: "iana"
      },
      "video/smpte291": {
        source: "iana"
      },
      "video/smpte292m": {
        source: "iana"
      },
      "video/ulpfec": {
        source: "iana"
      },
      "video/vc1": {
        source: "iana"
      },
      "video/vc2": {
        source: "iana"
      },
      "video/vnd.cctv": {
        source: "iana"
      },
      "video/vnd.dece.hd": {
        source: "iana",
        extensions: ["uvh", "uvvh"]
      },
      "video/vnd.dece.mobile": {
        source: "iana",
        extensions: ["uvm", "uvvm"]
      },
      "video/vnd.dece.mp4": {
        source: "iana"
      },
      "video/vnd.dece.pd": {
        source: "iana",
        extensions: ["uvp", "uvvp"]
      },
      "video/vnd.dece.sd": {
        source: "iana",
        extensions: ["uvs", "uvvs"]
      },
      "video/vnd.dece.video": {
        source: "iana",
        extensions: ["uvv", "uvvv"]
      },
      "video/vnd.directv.mpeg": {
        source: "iana"
      },
      "video/vnd.directv.mpeg-tts": {
        source: "iana"
      },
      "video/vnd.dlna.mpeg-tts": {
        source: "iana"
      },
      "video/vnd.dvb.file": {
        source: "iana",
        extensions: ["dvb"]
      },
      "video/vnd.fvt": {
        source: "iana",
        extensions: ["fvt"]
      },
      "video/vnd.hns.video": {
        source: "iana"
      },
      "video/vnd.iptvforum.1dparityfec-1010": {
        source: "iana"
      },
      "video/vnd.iptvforum.1dparityfec-2005": {
        source: "iana"
      },
      "video/vnd.iptvforum.2dparityfec-1010": {
        source: "iana"
      },
      "video/vnd.iptvforum.2dparityfec-2005": {
        source: "iana"
      },
      "video/vnd.iptvforum.ttsavc": {
        source: "iana"
      },
      "video/vnd.iptvforum.ttsmpeg2": {
        source: "iana"
      },
      "video/vnd.motorola.video": {
        source: "iana"
      },
      "video/vnd.motorola.videop": {
        source: "iana"
      },
      "video/vnd.mpegurl": {
        source: "iana",
        extensions: ["mxu", "m4u"]
      },
      "video/vnd.ms-playready.media.pyv": {
        source: "iana",
        extensions: ["pyv"]
      },
      "video/vnd.nokia.interleaved-multimedia": {
        source: "iana"
      },
      "video/vnd.nokia.mp4vr": {
        source: "iana"
      },
      "video/vnd.nokia.videovoip": {
        source: "iana"
      },
      "video/vnd.objectvideo": {
        source: "iana"
      },
      "video/vnd.radgamettools.bink": {
        source: "iana"
      },
      "video/vnd.radgamettools.smacker": {
        source: "iana"
      },
      "video/vnd.sealed.mpeg1": {
        source: "iana"
      },
      "video/vnd.sealed.mpeg4": {
        source: "iana"
      },
      "video/vnd.sealed.swf": {
        source: "iana"
      },
      "video/vnd.sealedmedia.softseal.mov": {
        source: "iana"
      },
      "video/vnd.uvvu.mp4": {
        source: "iana",
        extensions: ["uvu", "uvvu"]
      },
      "video/vnd.vivo": {
        source: "iana",
        extensions: ["viv"]
      },
      "video/vnd.youtube.yt": {
        source: "iana"
      },
      "video/vp8": {
        source: "iana"
      },
      "video/vp9": {
        source: "iana"
      },
      "video/webm": {
        source: "apache",
        compressible: false,
        extensions: ["webm"]
      },
      "video/x-f4v": {
        source: "apache",
        extensions: ["f4v"]
      },
      "video/x-fli": {
        source: "apache",
        extensions: ["fli"]
      },
      "video/x-flv": {
        source: "apache",
        compressible: false,
        extensions: ["flv"]
      },
      "video/x-m4v": {
        source: "apache",
        extensions: ["m4v"]
      },
      "video/x-matroska": {
        source: "apache",
        compressible: false,
        extensions: ["mkv", "mk3d", "mks"]
      },
      "video/x-mng": {
        source: "apache",
        extensions: ["mng"]
      },
      "video/x-ms-asf": {
        source: "apache",
        extensions: ["asf", "asx"]
      },
      "video/x-ms-vob": {
        source: "apache",
        extensions: ["vob"]
      },
      "video/x-ms-wm": {
        source: "apache",
        extensions: ["wm"]
      },
      "video/x-ms-wmv": {
        source: "apache",
        compressible: false,
        extensions: ["wmv"]
      },
      "video/x-ms-wmx": {
        source: "apache",
        extensions: ["wmx"]
      },
      "video/x-ms-wvx": {
        source: "apache",
        extensions: ["wvx"]
      },
      "video/x-msvideo": {
        source: "apache",
        extensions: ["avi"]
      },
      "video/x-sgi-movie": {
        source: "apache",
        extensions: ["movie"]
      },
      "video/x-smv": {
        source: "apache",
        extensions: ["smv"]
      },
      "x-conference/x-cooltalk": {
        source: "apache",
        extensions: ["ice"]
      },
      "x-shader/x-fragment": {
        compressible: true
      },
      "x-shader/x-vertex": {
        compressible: true
      }
    };
  }
});

// node_modules/mime-db/index.js
var require_mime_db = __commonJS({
  "node_modules/mime-db/index.js"(exports, module) {
    module.exports = require_db();
  }
});

// node_modules/mime-types/index.js
var require_mime_types = __commonJS({
  "node_modules/mime-types/index.js"(exports) {
    "use strict";
    var db = require_mime_db();
    var extname = __require("path").extname;
    var EXTRACT_TYPE_REGEXP = /^\s*([^;\s]*)(?:;|\s|$)/;
    var TEXT_TYPE_REGEXP = /^text\//i;
    exports.charset = charset;
    exports.charsets = { lookup: charset };
    exports.contentType = contentType;
    exports.extension = extension;
    exports.extensions = /* @__PURE__ */ Object.create(null);
    exports.lookup = lookup;
    exports.types = /* @__PURE__ */ Object.create(null);
    populateMaps(exports.extensions, exports.types);
    function charset(type) {
      if (!type || typeof type !== "string") {
        return false;
      }
      var match = EXTRACT_TYPE_REGEXP.exec(type);
      var mime = match && db[match[1].toLowerCase()];
      if (mime && mime.charset) {
        return mime.charset;
      }
      if (match && TEXT_TYPE_REGEXP.test(match[1])) {
        return "UTF-8";
      }
      return false;
    }
    function contentType(str) {
      if (!str || typeof str !== "string") {
        return false;
      }
      var mime = str.indexOf("/") === -1 ? exports.lookup(str) : str;
      if (!mime) {
        return false;
      }
      if (mime.indexOf("charset") === -1) {
        var charset2 = exports.charset(mime);
        if (charset2) mime += "; charset=" + charset2.toLowerCase();
      }
      return mime;
    }
    function extension(type) {
      if (!type || typeof type !== "string") {
        return false;
      }
      var match = EXTRACT_TYPE_REGEXP.exec(type);
      var exts = match && exports.extensions[match[1].toLowerCase()];
      if (!exts || !exts.length) {
        return false;
      }
      return exts[0];
    }
    function lookup(path) {
      if (!path || typeof path !== "string") {
        return false;
      }
      var extension2 = extname("x." + path).toLowerCase().substr(1);
      if (!extension2) {
        return false;
      }
      return exports.types[extension2] || false;
    }
    function populateMaps(extensions, types) {
      var preference = ["nginx", "apache", void 0, "iana"];
      Object.keys(db).forEach(function forEachMimeType(type) {
        var mime = db[type];
        var exts = mime.extensions;
        if (!exts || !exts.length) {
          return;
        }
        extensions[type] = exts;
        for (var i = 0; i < exts.length; i++) {
          var extension2 = exts[i];
          if (types[extension2]) {
            var from = preference.indexOf(db[types[extension2]].source);
            var to = preference.indexOf(mime.source);
            if (types[extension2] !== "application/octet-stream" && (from > to || from === to && types[extension2].substr(0, 12) === "application/")) {
              continue;
            }
          }
          types[extension2] = type;
        }
      });
    }
  }
});

// node_modules/asynckit/lib/defer.js
var require_defer = __commonJS({
  "node_modules/asynckit/lib/defer.js"(exports, module) {
    module.exports = defer;
    function defer(fn) {
      var nextTick = typeof setImmediate == "function" ? setImmediate : typeof process == "object" && typeof process.nextTick == "function" ? process.nextTick : null;
      if (nextTick) {
        nextTick(fn);
      } else {
        setTimeout(fn, 0);
      }
    }
  }
});

// node_modules/asynckit/lib/async.js
var require_async = __commonJS({
  "node_modules/asynckit/lib/async.js"(exports, module) {
    var defer = require_defer();
    module.exports = async;
    function async(callback) {
      var isAsync = false;
      defer(function() {
        isAsync = true;
      });
      return function async_callback(err, result) {
        if (isAsync) {
          callback(err, result);
        } else {
          defer(function nextTick_callback() {
            callback(err, result);
          });
        }
      };
    }
  }
});

// node_modules/asynckit/lib/abort.js
var require_abort = __commonJS({
  "node_modules/asynckit/lib/abort.js"(exports, module) {
    module.exports = abort;
    function abort(state) {
      Object.keys(state.jobs).forEach(clean.bind(state));
      state.jobs = {};
    }
    function clean(key) {
      if (typeof this.jobs[key] == "function") {
        this.jobs[key]();
      }
    }
  }
});

// node_modules/asynckit/lib/iterate.js
var require_iterate = __commonJS({
  "node_modules/asynckit/lib/iterate.js"(exports, module) {
    var async = require_async();
    var abort = require_abort();
    module.exports = iterate;
    function iterate(list, iterator, state, callback) {
      var key = state["keyedList"] ? state["keyedList"][state.index] : state.index;
      state.jobs[key] = runJob(iterator, key, list[key], function(error, output) {
        if (!(key in state.jobs)) {
          return;
        }
        delete state.jobs[key];
        if (error) {
          abort(state);
        } else {
          state.results[key] = output;
        }
        callback(error, state.results);
      });
    }
    function runJob(iterator, key, item, callback) {
      var aborter;
      if (iterator.length == 2) {
        aborter = iterator(item, async(callback));
      } else {
        aborter = iterator(item, key, async(callback));
      }
      return aborter;
    }
  }
});

// node_modules/asynckit/lib/state.js
var require_state = __commonJS({
  "node_modules/asynckit/lib/state.js"(exports, module) {
    module.exports = state;
    function state(list, sortMethod) {
      var isNamedList = !Array.isArray(list), initState = {
        index: 0,
        keyedList: isNamedList || sortMethod ? Object.keys(list) : null,
        jobs: {},
        results: isNamedList ? {} : [],
        size: isNamedList ? Object.keys(list).length : list.length
      };
      if (sortMethod) {
        initState.keyedList.sort(isNamedList ? sortMethod : function(a, b) {
          return sortMethod(list[a], list[b]);
        });
      }
      return initState;
    }
  }
});

// node_modules/asynckit/lib/terminator.js
var require_terminator = __commonJS({
  "node_modules/asynckit/lib/terminator.js"(exports, module) {
    var abort = require_abort();
    var async = require_async();
    module.exports = terminator;
    function terminator(callback) {
      if (!Object.keys(this.jobs).length) {
        return;
      }
      this.index = this.size;
      abort(this);
      async(callback)(null, this.results);
    }
  }
});

// node_modules/asynckit/parallel.js
var require_parallel = __commonJS({
  "node_modules/asynckit/parallel.js"(exports, module) {
    var iterate = require_iterate();
    var initState = require_state();
    var terminator = require_terminator();
    module.exports = parallel;
    function parallel(list, iterator, callback) {
      var state = initState(list);
      while (state.index < (state["keyedList"] || list).length) {
        iterate(list, iterator, state, function(error, result) {
          if (error) {
            callback(error, result);
            return;
          }
          if (Object.keys(state.jobs).length === 0) {
            callback(null, state.results);
            return;
          }
        });
        state.index++;
      }
      return terminator.bind(state, callback);
    }
  }
});

// node_modules/asynckit/serialOrdered.js
var require_serialOrdered = __commonJS({
  "node_modules/asynckit/serialOrdered.js"(exports, module) {
    var iterate = require_iterate();
    var initState = require_state();
    var terminator = require_terminator();
    module.exports = serialOrdered;
    module.exports.ascending = ascending;
    module.exports.descending = descending;
    function serialOrdered(list, iterator, sortMethod, callback) {
      var state = initState(list, sortMethod);
      iterate(list, iterator, state, function iteratorHandler(error, result) {
        if (error) {
          callback(error, result);
          return;
        }
        state.index++;
        if (state.index < (state["keyedList"] || list).length) {
          iterate(list, iterator, state, iteratorHandler);
          return;
        }
        callback(null, state.results);
      });
      return terminator.bind(state, callback);
    }
    function ascending(a, b) {
      return a < b ? -1 : a > b ? 1 : 0;
    }
    function descending(a, b) {
      return -1 * ascending(a, b);
    }
  }
});

// node_modules/asynckit/serial.js
var require_serial = __commonJS({
  "node_modules/asynckit/serial.js"(exports, module) {
    var serialOrdered = require_serialOrdered();
    module.exports = serial;
    function serial(list, iterator, callback) {
      return serialOrdered(list, iterator, null, callback);
    }
  }
});

// node_modules/asynckit/index.js
var require_asynckit = __commonJS({
  "node_modules/asynckit/index.js"(exports, module) {
    module.exports = {
      parallel: require_parallel(),
      serial: require_serial(),
      serialOrdered: require_serialOrdered()
    };
  }
});

// node_modules/es-object-atoms/index.js
var require_es_object_atoms = __commonJS({
  "node_modules/es-object-atoms/index.js"(exports, module) {
    "use strict";
    module.exports = Object;
  }
});

// node_modules/es-errors/index.js
var require_es_errors = __commonJS({
  "node_modules/es-errors/index.js"(exports, module) {
    "use strict";
    module.exports = Error;
  }
});

// node_modules/es-errors/eval.js
var require_eval = __commonJS({
  "node_modules/es-errors/eval.js"(exports, module) {
    "use strict";
    module.exports = EvalError;
  }
});

// node_modules/es-errors/range.js
var require_range = __commonJS({
  "node_modules/es-errors/range.js"(exports, module) {
    "use strict";
    module.exports = RangeError;
  }
});

// node_modules/es-errors/ref.js
var require_ref = __commonJS({
  "node_modules/es-errors/ref.js"(exports, module) {
    "use strict";
    module.exports = ReferenceError;
  }
});

// node_modules/es-errors/syntax.js
var require_syntax = __commonJS({
  "node_modules/es-errors/syntax.js"(exports, module) {
    "use strict";
    module.exports = SyntaxError;
  }
});

// node_modules/es-errors/type.js
var require_type = __commonJS({
  "node_modules/es-errors/type.js"(exports, module) {
    "use strict";
    module.exports = TypeError;
  }
});

// node_modules/es-errors/uri.js
var require_uri = __commonJS({
  "node_modules/es-errors/uri.js"(exports, module) {
    "use strict";
    module.exports = URIError;
  }
});

// node_modules/math-intrinsics/abs.js
var require_abs = __commonJS({
  "node_modules/math-intrinsics/abs.js"(exports, module) {
    "use strict";
    module.exports = Math.abs;
  }
});

// node_modules/math-intrinsics/floor.js
var require_floor = __commonJS({
  "node_modules/math-intrinsics/floor.js"(exports, module) {
    "use strict";
    module.exports = Math.floor;
  }
});

// node_modules/math-intrinsics/max.js
var require_max = __commonJS({
  "node_modules/math-intrinsics/max.js"(exports, module) {
    "use strict";
    module.exports = Math.max;
  }
});

// node_modules/math-intrinsics/min.js
var require_min = __commonJS({
  "node_modules/math-intrinsics/min.js"(exports, module) {
    "use strict";
    module.exports = Math.min;
  }
});

// node_modules/math-intrinsics/pow.js
var require_pow = __commonJS({
  "node_modules/math-intrinsics/pow.js"(exports, module) {
    "use strict";
    module.exports = Math.pow;
  }
});

// node_modules/math-intrinsics/round.js
var require_round = __commonJS({
  "node_modules/math-intrinsics/round.js"(exports, module) {
    "use strict";
    module.exports = Math.round;
  }
});

// node_modules/math-intrinsics/isNaN.js
var require_isNaN = __commonJS({
  "node_modules/math-intrinsics/isNaN.js"(exports, module) {
    "use strict";
    module.exports = Number.isNaN || function isNaN2(a) {
      return a !== a;
    };
  }
});

// node_modules/math-intrinsics/sign.js
var require_sign = __commonJS({
  "node_modules/math-intrinsics/sign.js"(exports, module) {
    "use strict";
    var $isNaN = require_isNaN();
    module.exports = function sign(number) {
      if ($isNaN(number) || number === 0) {
        return number;
      }
      return number < 0 ? -1 : 1;
    };
  }
});

// node_modules/gopd/gOPD.js
var require_gOPD = __commonJS({
  "node_modules/gopd/gOPD.js"(exports, module) {
    "use strict";
    module.exports = Object.getOwnPropertyDescriptor;
  }
});

// node_modules/gopd/index.js
var require_gopd = __commonJS({
  "node_modules/gopd/index.js"(exports, module) {
    "use strict";
    var $gOPD = require_gOPD();
    if ($gOPD) {
      try {
        $gOPD([], "length");
      } catch (e) {
        $gOPD = null;
      }
    }
    module.exports = $gOPD;
  }
});

// node_modules/es-define-property/index.js
var require_es_define_property = __commonJS({
  "node_modules/es-define-property/index.js"(exports, module) {
    "use strict";
    var $defineProperty = Object.defineProperty || false;
    if ($defineProperty) {
      try {
        $defineProperty({}, "a", { value: 1 });
      } catch (e) {
        $defineProperty = false;
      }
    }
    module.exports = $defineProperty;
  }
});

// node_modules/has-symbols/shams.js
var require_shams = __commonJS({
  "node_modules/has-symbols/shams.js"(exports, module) {
    "use strict";
    module.exports = function hasSymbols() {
      if (typeof Symbol !== "function" || typeof Object.getOwnPropertySymbols !== "function") {
        return false;
      }
      if (typeof Symbol.iterator === "symbol") {
        return true;
      }
      var obj = {};
      var sym = /* @__PURE__ */ Symbol("test");
      var symObj = Object(sym);
      if (typeof sym === "string") {
        return false;
      }
      if (Object.prototype.toString.call(sym) !== "[object Symbol]") {
        return false;
      }
      if (Object.prototype.toString.call(symObj) !== "[object Symbol]") {
        return false;
      }
      var symVal = 42;
      obj[sym] = symVal;
      for (var _ in obj) {
        return false;
      }
      if (typeof Object.keys === "function" && Object.keys(obj).length !== 0) {
        return false;
      }
      if (typeof Object.getOwnPropertyNames === "function" && Object.getOwnPropertyNames(obj).length !== 0) {
        return false;
      }
      var syms = Object.getOwnPropertySymbols(obj);
      if (syms.length !== 1 || syms[0] !== sym) {
        return false;
      }
      if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) {
        return false;
      }
      if (typeof Object.getOwnPropertyDescriptor === "function") {
        var descriptor = (
          /** @type {PropertyDescriptor} */
          Object.getOwnPropertyDescriptor(obj, sym)
        );
        if (descriptor.value !== symVal || descriptor.enumerable !== true) {
          return false;
        }
      }
      return true;
    };
  }
});

// node_modules/has-symbols/index.js
var require_has_symbols = __commonJS({
  "node_modules/has-symbols/index.js"(exports, module) {
    "use strict";
    var origSymbol = typeof Symbol !== "undefined" && Symbol;
    var hasSymbolSham = require_shams();
    module.exports = function hasNativeSymbols() {
      if (typeof origSymbol !== "function") {
        return false;
      }
      if (typeof Symbol !== "function") {
        return false;
      }
      if (typeof origSymbol("foo") !== "symbol") {
        return false;
      }
      if (typeof /* @__PURE__ */ Symbol("bar") !== "symbol") {
        return false;
      }
      return hasSymbolSham();
    };
  }
});

// node_modules/get-proto/Reflect.getPrototypeOf.js
var require_Reflect_getPrototypeOf = __commonJS({
  "node_modules/get-proto/Reflect.getPrototypeOf.js"(exports, module) {
    "use strict";
    module.exports = typeof Reflect !== "undefined" && Reflect.getPrototypeOf || null;
  }
});

// node_modules/get-proto/Object.getPrototypeOf.js
var require_Object_getPrototypeOf = __commonJS({
  "node_modules/get-proto/Object.getPrototypeOf.js"(exports, module) {
    "use strict";
    var $Object = require_es_object_atoms();
    module.exports = $Object.getPrototypeOf || null;
  }
});

// node_modules/function-bind/implementation.js
var require_implementation = __commonJS({
  "node_modules/function-bind/implementation.js"(exports, module) {
    "use strict";
    var ERROR_MESSAGE = "Function.prototype.bind called on incompatible ";
    var toStr = Object.prototype.toString;
    var max = Math.max;
    var funcType = "[object Function]";
    var concatty = function concatty2(a, b) {
      var arr = [];
      for (var i = 0; i < a.length; i += 1) {
        arr[i] = a[i];
      }
      for (var j = 0; j < b.length; j += 1) {
        arr[j + a.length] = b[j];
      }
      return arr;
    };
    var slicy = function slicy2(arrLike, offset) {
      var arr = [];
      for (var i = offset || 0, j = 0; i < arrLike.length; i += 1, j += 1) {
        arr[j] = arrLike[i];
      }
      return arr;
    };
    var joiny = function(arr, joiner) {
      var str = "";
      for (var i = 0; i < arr.length; i += 1) {
        str += arr[i];
        if (i + 1 < arr.length) {
          str += joiner;
        }
      }
      return str;
    };
    module.exports = function bind(that) {
      var target = this;
      if (typeof target !== "function" || toStr.apply(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
      }
      var args = slicy(arguments, 1);
      var bound;
      var binder = function() {
        if (this instanceof bound) {
          var result = target.apply(
            this,
            concatty(args, arguments)
          );
          if (Object(result) === result) {
            return result;
          }
          return this;
        }
        return target.apply(
          that,
          concatty(args, arguments)
        );
      };
      var boundLength = max(0, target.length - args.length);
      var boundArgs = [];
      for (var i = 0; i < boundLength; i++) {
        boundArgs[i] = "$" + i;
      }
      bound = Function("binder", "return function (" + joiny(boundArgs, ",") + "){ return binder.apply(this,arguments); }")(binder);
      if (target.prototype) {
        var Empty = function Empty2() {
        };
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
      }
      return bound;
    };
  }
});

// node_modules/function-bind/index.js
var require_function_bind = __commonJS({
  "node_modules/function-bind/index.js"(exports, module) {
    "use strict";
    var implementation = require_implementation();
    module.exports = Function.prototype.bind || implementation;
  }
});

// node_modules/call-bind-apply-helpers/functionCall.js
var require_functionCall = __commonJS({
  "node_modules/call-bind-apply-helpers/functionCall.js"(exports, module) {
    "use strict";
    module.exports = Function.prototype.call;
  }
});

// node_modules/call-bind-apply-helpers/functionApply.js
var require_functionApply = __commonJS({
  "node_modules/call-bind-apply-helpers/functionApply.js"(exports, module) {
    "use strict";
    module.exports = Function.prototype.apply;
  }
});

// node_modules/call-bind-apply-helpers/reflectApply.js
var require_reflectApply = __commonJS({
  "node_modules/call-bind-apply-helpers/reflectApply.js"(exports, module) {
    "use strict";
    module.exports = typeof Reflect !== "undefined" && Reflect && Reflect.apply;
  }
});

// node_modules/call-bind-apply-helpers/actualApply.js
var require_actualApply = __commonJS({
  "node_modules/call-bind-apply-helpers/actualApply.js"(exports, module) {
    "use strict";
    var bind = require_function_bind();
    var $apply = require_functionApply();
    var $call = require_functionCall();
    var $reflectApply = require_reflectApply();
    module.exports = $reflectApply || bind.call($call, $apply);
  }
});

// node_modules/call-bind-apply-helpers/index.js
var require_call_bind_apply_helpers = __commonJS({
  "node_modules/call-bind-apply-helpers/index.js"(exports, module) {
    "use strict";
    var bind = require_function_bind();
    var $TypeError = require_type();
    var $call = require_functionCall();
    var $actualApply = require_actualApply();
    module.exports = function callBindBasic(args) {
      if (args.length < 1 || typeof args[0] !== "function") {
        throw new $TypeError("a function is required");
      }
      return $actualApply(bind, $call, args);
    };
  }
});

// node_modules/dunder-proto/get.js
var require_get = __commonJS({
  "node_modules/dunder-proto/get.js"(exports, module) {
    "use strict";
    var callBind = require_call_bind_apply_helpers();
    var gOPD = require_gopd();
    var hasProtoAccessor;
    try {
      hasProtoAccessor = /** @type {{ __proto__?: typeof Array.prototype }} */
      [].__proto__ === Array.prototype;
    } catch (e) {
      if (!e || typeof e !== "object" || !("code" in e) || e.code !== "ERR_PROTO_ACCESS") {
        throw e;
      }
    }
    var desc = !!hasProtoAccessor && gOPD && gOPD(
      Object.prototype,
      /** @type {keyof typeof Object.prototype} */
      "__proto__"
    );
    var $Object = Object;
    var $getPrototypeOf = $Object.getPrototypeOf;
    module.exports = desc && typeof desc.get === "function" ? callBind([desc.get]) : typeof $getPrototypeOf === "function" ? (
      /** @type {import('./get')} */
      function getDunder(value) {
        return $getPrototypeOf(value == null ? value : $Object(value));
      }
    ) : false;
  }
});

// node_modules/get-proto/index.js
var require_get_proto = __commonJS({
  "node_modules/get-proto/index.js"(exports, module) {
    "use strict";
    var reflectGetProto = require_Reflect_getPrototypeOf();
    var originalGetProto = require_Object_getPrototypeOf();
    var getDunderProto = require_get();
    module.exports = reflectGetProto ? function getProto(O) {
      return reflectGetProto(O);
    } : originalGetProto ? function getProto(O) {
      if (!O || typeof O !== "object" && typeof O !== "function") {
        throw new TypeError("getProto: not an object");
      }
      return originalGetProto(O);
    } : getDunderProto ? function getProto(O) {
      return getDunderProto(O);
    } : null;
  }
});

// node_modules/hasown/index.js
var require_hasown = __commonJS({
  "node_modules/hasown/index.js"(exports, module) {
    "use strict";
    var call = Function.prototype.call;
    var $hasOwn = Object.prototype.hasOwnProperty;
    var bind = require_function_bind();
    module.exports = bind.call(call, $hasOwn);
  }
});

// node_modules/get-intrinsic/index.js
var require_get_intrinsic = __commonJS({
  "node_modules/get-intrinsic/index.js"(exports, module) {
    "use strict";
    var undefined2;
    var $Object = require_es_object_atoms();
    var $Error = require_es_errors();
    var $EvalError = require_eval();
    var $RangeError = require_range();
    var $ReferenceError = require_ref();
    var $SyntaxError = require_syntax();
    var $TypeError = require_type();
    var $URIError = require_uri();
    var abs = require_abs();
    var floor = require_floor();
    var max = require_max();
    var min = require_min();
    var pow = require_pow();
    var round = require_round();
    var sign = require_sign();
    var $Function = Function;
    var getEvalledConstructor = function(expressionSyntax) {
      try {
        return $Function('"use strict"; return (' + expressionSyntax + ").constructor;")();
      } catch (e) {
      }
    };
    var $gOPD = require_gopd();
    var $defineProperty = require_es_define_property();
    var throwTypeError = function() {
      throw new $TypeError();
    };
    var ThrowTypeError = $gOPD ? (function() {
      try {
        arguments.callee;
        return throwTypeError;
      } catch (calleeThrows) {
        try {
          return $gOPD(arguments, "callee").get;
        } catch (gOPDthrows) {
          return throwTypeError;
        }
      }
    })() : throwTypeError;
    var hasSymbols = require_has_symbols()();
    var getProto = require_get_proto();
    var $ObjectGPO = require_Object_getPrototypeOf();
    var $ReflectGPO = require_Reflect_getPrototypeOf();
    var $apply = require_functionApply();
    var $call = require_functionCall();
    var needsEval = {};
    var TypedArray = typeof Uint8Array === "undefined" || !getProto ? undefined2 : getProto(Uint8Array);
    var INTRINSICS = {
      __proto__: null,
      "%AggregateError%": typeof AggregateError === "undefined" ? undefined2 : AggregateError,
      "%Array%": Array,
      "%ArrayBuffer%": typeof ArrayBuffer === "undefined" ? undefined2 : ArrayBuffer,
      "%ArrayIteratorPrototype%": hasSymbols && getProto ? getProto([][Symbol.iterator]()) : undefined2,
      "%AsyncFromSyncIteratorPrototype%": undefined2,
      "%AsyncFunction%": needsEval,
      "%AsyncGenerator%": needsEval,
      "%AsyncGeneratorFunction%": needsEval,
      "%AsyncIteratorPrototype%": needsEval,
      "%Atomics%": typeof Atomics === "undefined" ? undefined2 : Atomics,
      "%BigInt%": typeof BigInt === "undefined" ? undefined2 : BigInt,
      "%BigInt64Array%": typeof BigInt64Array === "undefined" ? undefined2 : BigInt64Array,
      "%BigUint64Array%": typeof BigUint64Array === "undefined" ? undefined2 : BigUint64Array,
      "%Boolean%": Boolean,
      "%DataView%": typeof DataView === "undefined" ? undefined2 : DataView,
      "%Date%": Date,
      "%decodeURI%": decodeURI,
      "%decodeURIComponent%": decodeURIComponent,
      "%encodeURI%": encodeURI,
      "%encodeURIComponent%": encodeURIComponent,
      "%Error%": $Error,
      "%eval%": eval,
      // eslint-disable-line no-eval
      "%EvalError%": $EvalError,
      "%Float16Array%": typeof Float16Array === "undefined" ? undefined2 : Float16Array,
      "%Float32Array%": typeof Float32Array === "undefined" ? undefined2 : Float32Array,
      "%Float64Array%": typeof Float64Array === "undefined" ? undefined2 : Float64Array,
      "%FinalizationRegistry%": typeof FinalizationRegistry === "undefined" ? undefined2 : FinalizationRegistry,
      "%Function%": $Function,
      "%GeneratorFunction%": needsEval,
      "%Int8Array%": typeof Int8Array === "undefined" ? undefined2 : Int8Array,
      "%Int16Array%": typeof Int16Array === "undefined" ? undefined2 : Int16Array,
      "%Int32Array%": typeof Int32Array === "undefined" ? undefined2 : Int32Array,
      "%isFinite%": isFinite,
      "%isNaN%": isNaN,
      "%IteratorPrototype%": hasSymbols && getProto ? getProto(getProto([][Symbol.iterator]())) : undefined2,
      "%JSON%": typeof JSON === "object" ? JSON : undefined2,
      "%Map%": typeof Map === "undefined" ? undefined2 : Map,
      "%MapIteratorPrototype%": typeof Map === "undefined" || !hasSymbols || !getProto ? undefined2 : getProto((/* @__PURE__ */ new Map())[Symbol.iterator]()),
      "%Math%": Math,
      "%Number%": Number,
      "%Object%": $Object,
      "%Object.getOwnPropertyDescriptor%": $gOPD,
      "%parseFloat%": parseFloat,
      "%parseInt%": parseInt,
      "%Promise%": typeof Promise === "undefined" ? undefined2 : Promise,
      "%Proxy%": typeof Proxy === "undefined" ? undefined2 : Proxy,
      "%RangeError%": $RangeError,
      "%ReferenceError%": $ReferenceError,
      "%Reflect%": typeof Reflect === "undefined" ? undefined2 : Reflect,
      "%RegExp%": RegExp,
      "%Set%": typeof Set === "undefined" ? undefined2 : Set,
      "%SetIteratorPrototype%": typeof Set === "undefined" || !hasSymbols || !getProto ? undefined2 : getProto((/* @__PURE__ */ new Set())[Symbol.iterator]()),
      "%SharedArrayBuffer%": typeof SharedArrayBuffer === "undefined" ? undefined2 : SharedArrayBuffer,
      "%String%": String,
      "%StringIteratorPrototype%": hasSymbols && getProto ? getProto(""[Symbol.iterator]()) : undefined2,
      "%Symbol%": hasSymbols ? Symbol : undefined2,
      "%SyntaxError%": $SyntaxError,
      "%ThrowTypeError%": ThrowTypeError,
      "%TypedArray%": TypedArray,
      "%TypeError%": $TypeError,
      "%Uint8Array%": typeof Uint8Array === "undefined" ? undefined2 : Uint8Array,
      "%Uint8ClampedArray%": typeof Uint8ClampedArray === "undefined" ? undefined2 : Uint8ClampedArray,
      "%Uint16Array%": typeof Uint16Array === "undefined" ? undefined2 : Uint16Array,
      "%Uint32Array%": typeof Uint32Array === "undefined" ? undefined2 : Uint32Array,
      "%URIError%": $URIError,
      "%WeakMap%": typeof WeakMap === "undefined" ? undefined2 : WeakMap,
      "%WeakRef%": typeof WeakRef === "undefined" ? undefined2 : WeakRef,
      "%WeakSet%": typeof WeakSet === "undefined" ? undefined2 : WeakSet,
      "%Function.prototype.call%": $call,
      "%Function.prototype.apply%": $apply,
      "%Object.defineProperty%": $defineProperty,
      "%Object.getPrototypeOf%": $ObjectGPO,
      "%Math.abs%": abs,
      "%Math.floor%": floor,
      "%Math.max%": max,
      "%Math.min%": min,
      "%Math.pow%": pow,
      "%Math.round%": round,
      "%Math.sign%": sign,
      "%Reflect.getPrototypeOf%": $ReflectGPO
    };
    if (getProto) {
      try {
        null.error;
      } catch (e) {
        errorProto = getProto(getProto(e));
        INTRINSICS["%Error.prototype%"] = errorProto;
      }
    }
    var errorProto;
    var doEval = function doEval2(name) {
      var value;
      if (name === "%AsyncFunction%") {
        value = getEvalledConstructor("async function () {}");
      } else if (name === "%GeneratorFunction%") {
        value = getEvalledConstructor("function* () {}");
      } else if (name === "%AsyncGeneratorFunction%") {
        value = getEvalledConstructor("async function* () {}");
      } else if (name === "%AsyncGenerator%") {
        var fn = doEval2("%AsyncGeneratorFunction%");
        if (fn) {
          value = fn.prototype;
        }
      } else if (name === "%AsyncIteratorPrototype%") {
        var gen = doEval2("%AsyncGenerator%");
        if (gen && getProto) {
          value = getProto(gen.prototype);
        }
      }
      INTRINSICS[name] = value;
      return value;
    };
    var LEGACY_ALIASES = {
      __proto__: null,
      "%ArrayBufferPrototype%": ["ArrayBuffer", "prototype"],
      "%ArrayPrototype%": ["Array", "prototype"],
      "%ArrayProto_entries%": ["Array", "prototype", "entries"],
      "%ArrayProto_forEach%": ["Array", "prototype", "forEach"],
      "%ArrayProto_keys%": ["Array", "prototype", "keys"],
      "%ArrayProto_values%": ["Array", "prototype", "values"],
      "%AsyncFunctionPrototype%": ["AsyncFunction", "prototype"],
      "%AsyncGenerator%": ["AsyncGeneratorFunction", "prototype"],
      "%AsyncGeneratorPrototype%": ["AsyncGeneratorFunction", "prototype", "prototype"],
      "%BooleanPrototype%": ["Boolean", "prototype"],
      "%DataViewPrototype%": ["DataView", "prototype"],
      "%DatePrototype%": ["Date", "prototype"],
      "%ErrorPrototype%": ["Error", "prototype"],
      "%EvalErrorPrototype%": ["EvalError", "prototype"],
      "%Float32ArrayPrototype%": ["Float32Array", "prototype"],
      "%Float64ArrayPrototype%": ["Float64Array", "prototype"],
      "%FunctionPrototype%": ["Function", "prototype"],
      "%Generator%": ["GeneratorFunction", "prototype"],
      "%GeneratorPrototype%": ["GeneratorFunction", "prototype", "prototype"],
      "%Int8ArrayPrototype%": ["Int8Array", "prototype"],
      "%Int16ArrayPrototype%": ["Int16Array", "prototype"],
      "%Int32ArrayPrototype%": ["Int32Array", "prototype"],
      "%JSONParse%": ["JSON", "parse"],
      "%JSONStringify%": ["JSON", "stringify"],
      "%MapPrototype%": ["Map", "prototype"],
      "%NumberPrototype%": ["Number", "prototype"],
      "%ObjectPrototype%": ["Object", "prototype"],
      "%ObjProto_toString%": ["Object", "prototype", "toString"],
      "%ObjProto_valueOf%": ["Object", "prototype", "valueOf"],
      "%PromisePrototype%": ["Promise", "prototype"],
      "%PromiseProto_then%": ["Promise", "prototype", "then"],
      "%Promise_all%": ["Promise", "all"],
      "%Promise_reject%": ["Promise", "reject"],
      "%Promise_resolve%": ["Promise", "resolve"],
      "%RangeErrorPrototype%": ["RangeError", "prototype"],
      "%ReferenceErrorPrototype%": ["ReferenceError", "prototype"],
      "%RegExpPrototype%": ["RegExp", "prototype"],
      "%SetPrototype%": ["Set", "prototype"],
      "%SharedArrayBufferPrototype%": ["SharedArrayBuffer", "prototype"],
      "%StringPrototype%": ["String", "prototype"],
      "%SymbolPrototype%": ["Symbol", "prototype"],
      "%SyntaxErrorPrototype%": ["SyntaxError", "prototype"],
      "%TypedArrayPrototype%": ["TypedArray", "prototype"],
      "%TypeErrorPrototype%": ["TypeError", "prototype"],
      "%Uint8ArrayPrototype%": ["Uint8Array", "prototype"],
      "%Uint8ClampedArrayPrototype%": ["Uint8ClampedArray", "prototype"],
      "%Uint16ArrayPrototype%": ["Uint16Array", "prototype"],
      "%Uint32ArrayPrototype%": ["Uint32Array", "prototype"],
      "%URIErrorPrototype%": ["URIError", "prototype"],
      "%WeakMapPrototype%": ["WeakMap", "prototype"],
      "%WeakSetPrototype%": ["WeakSet", "prototype"]
    };
    var bind = require_function_bind();
    var hasOwn = require_hasown();
    var $concat = bind.call($call, Array.prototype.concat);
    var $spliceApply = bind.call($apply, Array.prototype.splice);
    var $replace = bind.call($call, String.prototype.replace);
    var $strSlice = bind.call($call, String.prototype.slice);
    var $exec = bind.call($call, RegExp.prototype.exec);
    var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
    var reEscapeChar = /\\(\\)?/g;
    var stringToPath = function stringToPath2(string) {
      var first = $strSlice(string, 0, 1);
      var last = $strSlice(string, -1);
      if (first === "%" && last !== "%") {
        throw new $SyntaxError("invalid intrinsic syntax, expected closing `%`");
      } else if (last === "%" && first !== "%") {
        throw new $SyntaxError("invalid intrinsic syntax, expected opening `%`");
      }
      var result = [];
      $replace(string, rePropName, function(match, number, quote, subString) {
        result[result.length] = quote ? $replace(subString, reEscapeChar, "$1") : number || match;
      });
      return result;
    };
    var getBaseIntrinsic = function getBaseIntrinsic2(name, allowMissing) {
      var intrinsicName = name;
      var alias;
      if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
        alias = LEGACY_ALIASES[intrinsicName];
        intrinsicName = "%" + alias[0] + "%";
      }
      if (hasOwn(INTRINSICS, intrinsicName)) {
        var value = INTRINSICS[intrinsicName];
        if (value === needsEval) {
          value = doEval(intrinsicName);
        }
        if (typeof value === "undefined" && !allowMissing) {
          throw new $TypeError("intrinsic " + name + " exists, but is not available. Please file an issue!");
        }
        return {
          alias,
          name: intrinsicName,
          value
        };
      }
      throw new $SyntaxError("intrinsic " + name + " does not exist!");
    };
    module.exports = function GetIntrinsic(name, allowMissing) {
      if (typeof name !== "string" || name.length === 0) {
        throw new $TypeError("intrinsic name must be a non-empty string");
      }
      if (arguments.length > 1 && typeof allowMissing !== "boolean") {
        throw new $TypeError('"allowMissing" argument must be a boolean');
      }
      if ($exec(/^%?[^%]*%?$/, name) === null) {
        throw new $SyntaxError("`%` may not be present anywhere but at the beginning and end of the intrinsic name");
      }
      var parts = stringToPath(name);
      var intrinsicBaseName = parts.length > 0 ? parts[0] : "";
      var intrinsic = getBaseIntrinsic("%" + intrinsicBaseName + "%", allowMissing);
      var intrinsicRealName = intrinsic.name;
      var value = intrinsic.value;
      var skipFurtherCaching = false;
      var alias = intrinsic.alias;
      if (alias) {
        intrinsicBaseName = alias[0];
        $spliceApply(parts, $concat([0, 1], alias));
      }
      for (var i = 1, isOwn = true; i < parts.length; i += 1) {
        var part = parts[i];
        var first = $strSlice(part, 0, 1);
        var last = $strSlice(part, -1);
        if ((first === '"' || first === "'" || first === "`" || (last === '"' || last === "'" || last === "`")) && first !== last) {
          throw new $SyntaxError("property names with quotes must have matching quotes");
        }
        if (part === "constructor" || !isOwn) {
          skipFurtherCaching = true;
        }
        intrinsicBaseName += "." + part;
        intrinsicRealName = "%" + intrinsicBaseName + "%";
        if (hasOwn(INTRINSICS, intrinsicRealName)) {
          value = INTRINSICS[intrinsicRealName];
        } else if (value != null) {
          if (!(part in value)) {
            if (!allowMissing) {
              throw new $TypeError("base intrinsic for " + name + " exists, but the property is not available.");
            }
            return void undefined2;
          }
          if ($gOPD && i + 1 >= parts.length) {
            var desc = $gOPD(value, part);
            isOwn = !!desc;
            if (isOwn && "get" in desc && !("originalValue" in desc.get)) {
              value = desc.get;
            } else {
              value = value[part];
            }
          } else {
            isOwn = hasOwn(value, part);
            value = value[part];
          }
          if (isOwn && !skipFurtherCaching) {
            INTRINSICS[intrinsicRealName] = value;
          }
        }
      }
      return value;
    };
  }
});

// node_modules/has-tostringtag/shams.js
var require_shams2 = __commonJS({
  "node_modules/has-tostringtag/shams.js"(exports, module) {
    "use strict";
    var hasSymbols = require_shams();
    module.exports = function hasToStringTagShams() {
      return hasSymbols() && !!Symbol.toStringTag;
    };
  }
});

// node_modules/es-set-tostringtag/index.js
var require_es_set_tostringtag = __commonJS({
  "node_modules/es-set-tostringtag/index.js"(exports, module) {
    "use strict";
    var GetIntrinsic = require_get_intrinsic();
    var $defineProperty = GetIntrinsic("%Object.defineProperty%", true);
    var hasToStringTag = require_shams2()();
    var hasOwn = require_hasown();
    var $TypeError = require_type();
    var toStringTag = hasToStringTag ? Symbol.toStringTag : null;
    module.exports = function setToStringTag(object, value) {
      var overrideIfSet = arguments.length > 2 && !!arguments[2] && arguments[2].force;
      var nonConfigurable = arguments.length > 2 && !!arguments[2] && arguments[2].nonConfigurable;
      if (typeof overrideIfSet !== "undefined" && typeof overrideIfSet !== "boolean" || typeof nonConfigurable !== "undefined" && typeof nonConfigurable !== "boolean") {
        throw new $TypeError("if provided, the `overrideIfSet` and `nonConfigurable` options must be booleans");
      }
      if (toStringTag && (overrideIfSet || !hasOwn(object, toStringTag))) {
        if ($defineProperty) {
          $defineProperty(object, toStringTag, {
            configurable: !nonConfigurable,
            enumerable: false,
            value,
            writable: false
          });
        } else {
          object[toStringTag] = value;
        }
      }
    };
  }
});

// node_modules/form-data/lib/populate.js
var require_populate = __commonJS({
  "node_modules/form-data/lib/populate.js"(exports, module) {
    "use strict";
    module.exports = function(dst, src) {
      Object.keys(src).forEach(function(prop) {
        dst[prop] = dst[prop] || src[prop];
      });
      return dst;
    };
  }
});

// node_modules/form-data/lib/form_data.js
var require_form_data = __commonJS({
  "node_modules/form-data/lib/form_data.js"(exports, module) {
    "use strict";
    var CombinedStream = require_combined_stream();
    var util = __require("util");
    var path = __require("path");
    var http = __require("http");
    var https = __require("https");
    var parseUrl = __require("url").parse;
    var fs = __require("fs");
    var Stream = __require("stream").Stream;
    var crypto = __require("crypto");
    var mime = require_mime_types();
    var asynckit = require_asynckit();
    var setToStringTag = require_es_set_tostringtag();
    var hasOwn = require_hasown();
    var populate = require_populate();
    function FormData2(options) {
      if (!(this instanceof FormData2)) {
        return new FormData2(options);
      }
      this._overheadLength = 0;
      this._valueLength = 0;
      this._valuesToMeasure = [];
      CombinedStream.call(this);
      options = options || {};
      for (var option in options) {
        this[option] = options[option];
      }
    }
    util.inherits(FormData2, CombinedStream);
    FormData2.LINE_BREAK = "\r\n";
    FormData2.DEFAULT_CONTENT_TYPE = "application/octet-stream";
    FormData2.prototype.append = function(field, value, options) {
      options = options || {};
      if (typeof options === "string") {
        options = { filename: options };
      }
      var append = CombinedStream.prototype.append.bind(this);
      if (typeof value === "number" || value == null) {
        value = String(value);
      }
      if (Array.isArray(value)) {
        this._error(new Error("Arrays are not supported."));
        return;
      }
      var header = this._multiPartHeader(field, value, options);
      var footer = this._multiPartFooter();
      append(header);
      append(value);
      append(footer);
      this._trackLength(header, value, options);
    };
    FormData2.prototype._trackLength = function(header, value, options) {
      var valueLength = 0;
      if (options.knownLength != null) {
        valueLength += Number(options.knownLength);
      } else if (Buffer.isBuffer(value)) {
        valueLength = value.length;
      } else if (typeof value === "string") {
        valueLength = Buffer.byteLength(value);
      }
      this._valueLength += valueLength;
      this._overheadLength += Buffer.byteLength(header) + FormData2.LINE_BREAK.length;
      if (!value || !value.path && !(value.readable && hasOwn(value, "httpVersion")) && !(value instanceof Stream)) {
        return;
      }
      if (!options.knownLength) {
        this._valuesToMeasure.push(value);
      }
    };
    FormData2.prototype._lengthRetriever = function(value, callback) {
      if (hasOwn(value, "fd")) {
        if (value.end != void 0 && value.end != Infinity && value.start != void 0) {
          callback(null, value.end + 1 - (value.start ? value.start : 0));
        } else {
          fs.stat(value.path, function(err, stat) {
            if (err) {
              callback(err);
              return;
            }
            var fileSize = stat.size - (value.start ? value.start : 0);
            callback(null, fileSize);
          });
        }
      } else if (hasOwn(value, "httpVersion")) {
        callback(null, Number(value.headers["content-length"]));
      } else if (hasOwn(value, "httpModule")) {
        value.on("response", function(response) {
          value.pause();
          callback(null, Number(response.headers["content-length"]));
        });
        value.resume();
      } else {
        callback("Unknown stream");
      }
    };
    FormData2.prototype._multiPartHeader = function(field, value, options) {
      if (typeof options.header === "string") {
        return options.header;
      }
      var contentDisposition = this._getContentDisposition(value, options);
      var contentType = this._getContentType(value, options);
      var contents = "";
      var headers = {
        // add custom disposition as third element or keep it two elements if not
        "Content-Disposition": ["form-data", 'name="' + field + '"'].concat(contentDisposition || []),
        // if no content type. allow it to be empty array
        "Content-Type": [].concat(contentType || [])
      };
      if (typeof options.header === "object") {
        populate(headers, options.header);
      }
      var header;
      for (var prop in headers) {
        if (hasOwn(headers, prop)) {
          header = headers[prop];
          if (header == null) {
            continue;
          }
          if (!Array.isArray(header)) {
            header = [header];
          }
          if (header.length) {
            contents += prop + ": " + header.join("; ") + FormData2.LINE_BREAK;
          }
        }
      }
      return "--" + this.getBoundary() + FormData2.LINE_BREAK + contents + FormData2.LINE_BREAK;
    };
    FormData2.prototype._getContentDisposition = function(value, options) {
      var filename;
      if (typeof options.filepath === "string") {
        filename = path.normalize(options.filepath).replace(/\\/g, "/");
      } else if (options.filename || value && (value.name || value.path)) {
        filename = path.basename(options.filename || value && (value.name || value.path));
      } else if (value && value.readable && hasOwn(value, "httpVersion")) {
        filename = path.basename(value.client._httpMessage.path || "");
      }
      if (filename) {
        return 'filename="' + filename + '"';
      }
    };
    FormData2.prototype._getContentType = function(value, options) {
      var contentType = options.contentType;
      if (!contentType && value && value.name) {
        contentType = mime.lookup(value.name);
      }
      if (!contentType && value && value.path) {
        contentType = mime.lookup(value.path);
      }
      if (!contentType && value && value.readable && hasOwn(value, "httpVersion")) {
        contentType = value.headers["content-type"];
      }
      if (!contentType && (options.filepath || options.filename)) {
        contentType = mime.lookup(options.filepath || options.filename);
      }
      if (!contentType && value && typeof value === "object") {
        contentType = FormData2.DEFAULT_CONTENT_TYPE;
      }
      return contentType;
    };
    FormData2.prototype._multiPartFooter = function() {
      return function(next) {
        var footer = FormData2.LINE_BREAK;
        var lastPart = this._streams.length === 0;
        if (lastPart) {
          footer += this._lastBoundary();
        }
        next(footer);
      }.bind(this);
    };
    FormData2.prototype._lastBoundary = function() {
      return "--" + this.getBoundary() + "--" + FormData2.LINE_BREAK;
    };
    FormData2.prototype.getHeaders = function(userHeaders) {
      var header;
      var formHeaders = {
        "content-type": "multipart/form-data; boundary=" + this.getBoundary()
      };
      for (header in userHeaders) {
        if (hasOwn(userHeaders, header)) {
          formHeaders[header.toLowerCase()] = userHeaders[header];
        }
      }
      return formHeaders;
    };
    FormData2.prototype.setBoundary = function(boundary) {
      if (typeof boundary !== "string") {
        throw new TypeError("FormData boundary must be a string");
      }
      this._boundary = boundary;
    };
    FormData2.prototype.getBoundary = function() {
      if (!this._boundary) {
        this._generateBoundary();
      }
      return this._boundary;
    };
    FormData2.prototype.getBuffer = function() {
      var dataBuffer = new Buffer.alloc(0);
      var boundary = this.getBoundary();
      for (var i = 0, len = this._streams.length; i < len; i++) {
        if (typeof this._streams[i] !== "function") {
          if (Buffer.isBuffer(this._streams[i])) {
            dataBuffer = Buffer.concat([dataBuffer, this._streams[i]]);
          } else {
            dataBuffer = Buffer.concat([dataBuffer, Buffer.from(this._streams[i])]);
          }
          if (typeof this._streams[i] !== "string" || this._streams[i].substring(2, boundary.length + 2) !== boundary) {
            dataBuffer = Buffer.concat([dataBuffer, Buffer.from(FormData2.LINE_BREAK)]);
          }
        }
      }
      return Buffer.concat([dataBuffer, Buffer.from(this._lastBoundary())]);
    };
    FormData2.prototype._generateBoundary = function() {
      this._boundary = "--------------------------" + crypto.randomBytes(12).toString("hex");
    };
    FormData2.prototype.getLengthSync = function() {
      var knownLength = this._overheadLength + this._valueLength;
      if (this._streams.length) {
        knownLength += this._lastBoundary().length;
      }
      if (!this.hasKnownLength()) {
        this._error(new Error("Cannot calculate proper length in synchronous way."));
      }
      return knownLength;
    };
    FormData2.prototype.hasKnownLength = function() {
      var hasKnownLength = true;
      if (this._valuesToMeasure.length) {
        hasKnownLength = false;
      }
      return hasKnownLength;
    };
    FormData2.prototype.getLength = function(cb) {
      var knownLength = this._overheadLength + this._valueLength;
      if (this._streams.length) {
        knownLength += this._lastBoundary().length;
      }
      if (!this._valuesToMeasure.length) {
        process.nextTick(cb.bind(this, null, knownLength));
        return;
      }
      asynckit.parallel(this._valuesToMeasure, this._lengthRetriever, function(err, values) {
        if (err) {
          cb(err);
          return;
        }
        values.forEach(function(length) {
          knownLength += length;
        });
        cb(null, knownLength);
      });
    };
    FormData2.prototype.submit = function(params, cb) {
      var request;
      var options;
      var defaults = { method: "post" };
      if (typeof params === "string") {
        params = parseUrl(params);
        options = populate({
          port: params.port,
          path: params.pathname,
          host: params.hostname,
          protocol: params.protocol
        }, defaults);
      } else {
        options = populate(params, defaults);
        if (!options.port) {
          options.port = options.protocol === "https:" ? 443 : 80;
        }
      }
      options.headers = this.getHeaders(params.headers);
      if (options.protocol === "https:") {
        request = https.request(options);
      } else {
        request = http.request(options);
      }
      this.getLength(function(err, length) {
        if (err && err !== "Unknown stream") {
          this._error(err);
          return;
        }
        if (length) {
          request.setHeader("Content-Length", length);
        }
        this.pipe(request);
        if (cb) {
          var onResponse;
          var callback = function(error, responce) {
            request.removeListener("error", callback);
            request.removeListener("response", onResponse);
            return cb.call(this, error, responce);
          };
          onResponse = callback.bind(this, null);
          request.on("error", callback);
          request.on("response", onResponse);
        }
      }.bind(this));
      return request;
    };
    FormData2.prototype._error = function(err) {
      if (!this.error) {
        this.error = err;
        this.pause();
        this.emit("error", err);
      }
    };
    FormData2.prototype.toString = function() {
      return "[object FormData]";
    };
    setToStringTag(FormData2.prototype, "FormData");
    module.exports = FormData2;
  }
});

// node_modules/ms/index.js
var require_ms = __commonJS({
  "node_modules/ms/index.js"(exports, module) {
    var s = 1e3;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var w = d * 7;
    var y = d * 365.25;
    module.exports = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === "string" && val.length > 0) {
        return parse(val);
      } else if (type === "number" && isFinite(val)) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error(
        "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
      );
    };
    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || "ms").toLowerCase();
      switch (type) {
        case "years":
        case "year":
        case "yrs":
        case "yr":
        case "y":
          return n * y;
        case "weeks":
        case "week":
        case "w":
          return n * w;
        case "days":
        case "day":
        case "d":
          return n * d;
        case "hours":
        case "hour":
        case "hrs":
        case "hr":
        case "h":
          return n * h;
        case "minutes":
        case "minute":
        case "mins":
        case "min":
        case "m":
          return n * m;
        case "seconds":
        case "second":
        case "secs":
        case "sec":
        case "s":
          return n * s;
        case "milliseconds":
        case "millisecond":
        case "msecs":
        case "msec":
        case "ms":
          return n;
        default:
          return void 0;
      }
    }
    function fmtShort(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return Math.round(ms / d) + "d";
      }
      if (msAbs >= h) {
        return Math.round(ms / h) + "h";
      }
      if (msAbs >= m) {
        return Math.round(ms / m) + "m";
      }
      if (msAbs >= s) {
        return Math.round(ms / s) + "s";
      }
      return ms + "ms";
    }
    function fmtLong(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return plural(ms, msAbs, d, "day");
      }
      if (msAbs >= h) {
        return plural(ms, msAbs, h, "hour");
      }
      if (msAbs >= m) {
        return plural(ms, msAbs, m, "minute");
      }
      if (msAbs >= s) {
        return plural(ms, msAbs, s, "second");
      }
      return ms + " ms";
    }
    function plural(ms, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
    }
  }
});

// node_modules/debug/src/common.js
var require_common = __commonJS({
  "node_modules/debug/src/common.js"(exports, module) {
    function setup(env) {
      createDebug.debug = createDebug;
      createDebug.default = createDebug;
      createDebug.coerce = coerce;
      createDebug.disable = disable;
      createDebug.enable = enable;
      createDebug.enabled = enabled;
      createDebug.humanize = require_ms();
      createDebug.destroy = destroy;
      Object.keys(env).forEach((key) => {
        createDebug[key] = env[key];
      });
      createDebug.names = [];
      createDebug.skips = [];
      createDebug.formatters = {};
      function selectColor(namespace) {
        let hash = 0;
        for (let i = 0; i < namespace.length; i++) {
          hash = (hash << 5) - hash + namespace.charCodeAt(i);
          hash |= 0;
        }
        return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
      }
      createDebug.selectColor = selectColor;
      function createDebug(namespace) {
        let prevTime;
        let enableOverride = null;
        let namespacesCache;
        let enabledCache;
        function debug(...args) {
          if (!debug.enabled) {
            return;
          }
          const self2 = debug;
          const curr = Number(/* @__PURE__ */ new Date());
          const ms = curr - (prevTime || curr);
          self2.diff = ms;
          self2.prev = prevTime;
          self2.curr = curr;
          prevTime = curr;
          args[0] = createDebug.coerce(args[0]);
          if (typeof args[0] !== "string") {
            args.unshift("%O");
          }
          let index = 0;
          args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
            if (match === "%%") {
              return "%";
            }
            index++;
            const formatter = createDebug.formatters[format];
            if (typeof formatter === "function") {
              const val = args[index];
              match = formatter.call(self2, val);
              args.splice(index, 1);
              index--;
            }
            return match;
          });
          createDebug.formatArgs.call(self2, args);
          const logFn = self2.log || createDebug.log;
          logFn.apply(self2, args);
        }
        debug.namespace = namespace;
        debug.useColors = createDebug.useColors();
        debug.color = createDebug.selectColor(namespace);
        debug.extend = extend;
        debug.destroy = createDebug.destroy;
        Object.defineProperty(debug, "enabled", {
          enumerable: true,
          configurable: false,
          get: () => {
            if (enableOverride !== null) {
              return enableOverride;
            }
            if (namespacesCache !== createDebug.namespaces) {
              namespacesCache = createDebug.namespaces;
              enabledCache = createDebug.enabled(namespace);
            }
            return enabledCache;
          },
          set: (v) => {
            enableOverride = v;
          }
        });
        if (typeof createDebug.init === "function") {
          createDebug.init(debug);
        }
        return debug;
      }
      function extend(namespace, delimiter) {
        const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
        newDebug.log = this.log;
        return newDebug;
      }
      function enable(namespaces) {
        createDebug.save(namespaces);
        createDebug.namespaces = namespaces;
        createDebug.names = [];
        createDebug.skips = [];
        const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
        for (const ns of split) {
          if (ns[0] === "-") {
            createDebug.skips.push(ns.slice(1));
          } else {
            createDebug.names.push(ns);
          }
        }
      }
      function matchesTemplate(search, template) {
        let searchIndex = 0;
        let templateIndex = 0;
        let starIndex = -1;
        let matchIndex = 0;
        while (searchIndex < search.length) {
          if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
            if (template[templateIndex] === "*") {
              starIndex = templateIndex;
              matchIndex = searchIndex;
              templateIndex++;
            } else {
              searchIndex++;
              templateIndex++;
            }
          } else if (starIndex !== -1) {
            templateIndex = starIndex + 1;
            matchIndex++;
            searchIndex = matchIndex;
          } else {
            return false;
          }
        }
        while (templateIndex < template.length && template[templateIndex] === "*") {
          templateIndex++;
        }
        return templateIndex === template.length;
      }
      function disable() {
        const namespaces = [
          ...createDebug.names,
          ...createDebug.skips.map((namespace) => "-" + namespace)
        ].join(",");
        createDebug.enable("");
        return namespaces;
      }
      function enabled(name) {
        for (const skip of createDebug.skips) {
          if (matchesTemplate(name, skip)) {
            return false;
          }
        }
        for (const ns of createDebug.names) {
          if (matchesTemplate(name, ns)) {
            return true;
          }
        }
        return false;
      }
      function coerce(val) {
        if (val instanceof Error) {
          return val.stack || val.message;
        }
        return val;
      }
      function destroy() {
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
      createDebug.enable(createDebug.load());
      return createDebug;
    }
    module.exports = setup;
  }
});

// node_modules/debug/src/browser.js
var require_browser = __commonJS({
  "node_modules/debug/src/browser.js"(exports, module) {
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = localstorage();
    exports.destroy = /* @__PURE__ */ (() => {
      let warned = false;
      return () => {
        if (!warned) {
          warned = true;
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
      };
    })();
    exports.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
        return true;
      }
      if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
        return false;
      }
      let m;
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function formatArgs(args) {
      args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
      if (!this.useColors) {
        return;
      }
      const c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      let index = 0;
      let lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, (match) => {
        if (match === "%%") {
          return;
        }
        index++;
        if (match === "%c") {
          lastC = index;
        }
      });
      args.splice(lastC, 0, c);
    }
    exports.log = console.debug || console.log || (() => {
    });
    function save(namespaces) {
      try {
        if (namespaces) {
          exports.storage.setItem("debug", namespaces);
        } else {
          exports.storage.removeItem("debug");
        }
      } catch (error) {
      }
    }
    function load() {
      let r;
      try {
        r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
      } catch (error) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }
      return r;
    }
    function localstorage() {
      try {
        return localStorage;
      } catch (error) {
      }
    }
    module.exports = require_common()(exports);
    var { formatters } = module.exports;
    formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (error) {
        return "[UnexpectedJSONParseError]: " + error.message;
      }
    };
  }
});

// node_modules/has-flag/index.js
var require_has_flag = __commonJS({
  "node_modules/has-flag/index.js"(exports, module) {
    "use strict";
    module.exports = (flag, argv = process.argv) => {
      const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
      const position = argv.indexOf(prefix + flag);
      const terminatorPosition = argv.indexOf("--");
      return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
    };
  }
});

// node_modules/supports-color/index.js
var require_supports_color = __commonJS({
  "node_modules/supports-color/index.js"(exports, module) {
    "use strict";
    var os = __require("os");
    var tty = __require("tty");
    var hasFlag = require_has_flag();
    var { env } = process;
    var forceColor;
    if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
      forceColor = 0;
    } else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
      forceColor = 1;
    }
    if ("FORCE_COLOR" in env) {
      if (env.FORCE_COLOR === "true") {
        forceColor = 1;
      } else if (env.FORCE_COLOR === "false") {
        forceColor = 0;
      } else {
        forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
      }
    }
    function translateLevel(level) {
      if (level === 0) {
        return false;
      }
      return {
        level,
        hasBasic: true,
        has256: level >= 2,
        has16m: level >= 3
      };
    }
    function supportsColor(haveStream, streamIsTTY) {
      if (forceColor === 0) {
        return 0;
      }
      if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
        return 3;
      }
      if (hasFlag("color=256")) {
        return 2;
      }
      if (haveStream && !streamIsTTY && forceColor === void 0) {
        return 0;
      }
      const min = forceColor || 0;
      if (env.TERM === "dumb") {
        return min;
      }
      if (process.platform === "win32") {
        const osRelease = os.release().split(".");
        if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
          return Number(osRelease[2]) >= 14931 ? 3 : 2;
        }
        return 1;
      }
      if ("CI" in env) {
        if (["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((sign) => sign in env) || env.CI_NAME === "codeship") {
          return 1;
        }
        return min;
      }
      if ("TEAMCITY_VERSION" in env) {
        return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
      }
      if (env.COLORTERM === "truecolor") {
        return 3;
      }
      if ("TERM_PROGRAM" in env) {
        const version = parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
        switch (env.TERM_PROGRAM) {
          case "iTerm.app":
            return version >= 3 ? 3 : 2;
          case "Apple_Terminal":
            return 2;
        }
      }
      if (/-256(color)?$/i.test(env.TERM)) {
        return 2;
      }
      if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
        return 1;
      }
      if ("COLORTERM" in env) {
        return 1;
      }
      return min;
    }
    function getSupportLevel(stream) {
      const level = supportsColor(stream, stream && stream.isTTY);
      return translateLevel(level);
    }
    module.exports = {
      supportsColor: getSupportLevel,
      stdout: translateLevel(supportsColor(true, tty.isatty(1))),
      stderr: translateLevel(supportsColor(true, tty.isatty(2)))
    };
  }
});

// node_modules/debug/src/node.js
var require_node = __commonJS({
  "node_modules/debug/src/node.js"(exports, module) {
    var tty = __require("tty");
    var util = __require("util");
    exports.init = init;
    exports.log = log;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.destroy = util.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    );
    exports.colors = [6, 2, 3, 4, 5, 1];
    try {
      const supportsColor = require_supports_color();
      if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
        exports.colors = [
          20,
          21,
          26,
          27,
          32,
          33,
          38,
          39,
          40,
          41,
          42,
          43,
          44,
          45,
          56,
          57,
          62,
          63,
          68,
          69,
          74,
          75,
          76,
          77,
          78,
          79,
          80,
          81,
          92,
          93,
          98,
          99,
          112,
          113,
          128,
          129,
          134,
          135,
          148,
          149,
          160,
          161,
          162,
          163,
          164,
          165,
          166,
          167,
          168,
          169,
          170,
          171,
          172,
          173,
          178,
          179,
          184,
          185,
          196,
          197,
          198,
          199,
          200,
          201,
          202,
          203,
          204,
          205,
          206,
          207,
          208,
          209,
          214,
          215,
          220,
          221
        ];
      }
    } catch (error) {
    }
    exports.inspectOpts = Object.keys(process.env).filter((key) => {
      return /^debug_/i.test(key);
    }).reduce((obj, key) => {
      const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
        return k.toUpperCase();
      });
      let val = process.env[key];
      if (/^(yes|on|true|enabled)$/i.test(val)) {
        val = true;
      } else if (/^(no|off|false|disabled)$/i.test(val)) {
        val = false;
      } else if (val === "null") {
        val = null;
      } else {
        val = Number(val);
      }
      obj[prop] = val;
      return obj;
    }, {});
    function useColors() {
      return "colors" in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(process.stderr.fd);
    }
    function formatArgs(args) {
      const { namespace: name, useColors: useColors2 } = this;
      if (useColors2) {
        const c = this.color;
        const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
        const prefix = `  ${colorCode};1m${name} \x1B[0m`;
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push(colorCode + "m+" + module.exports.humanize(this.diff) + "\x1B[0m");
      } else {
        args[0] = getDate() + name + " " + args[0];
      }
    }
    function getDate() {
      if (exports.inspectOpts.hideDate) {
        return "";
      }
      return (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function log(...args) {
      return process.stderr.write(util.formatWithOptions(exports.inspectOpts, ...args) + "\n");
    }
    function save(namespaces) {
      if (namespaces) {
        process.env.DEBUG = namespaces;
      } else {
        delete process.env.DEBUG;
      }
    }
    function load() {
      return process.env.DEBUG;
    }
    function init(debug) {
      debug.inspectOpts = {};
      const keys = Object.keys(exports.inspectOpts);
      for (let i = 0; i < keys.length; i++) {
        debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
      }
    }
    module.exports = require_common()(exports);
    var { formatters } = module.exports;
    formatters.o = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts).split("\n").map((str) => str.trim()).join(" ");
    };
    formatters.O = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts);
    };
  }
});

// node_modules/debug/src/index.js
var require_src = __commonJS({
  "node_modules/debug/src/index.js"(exports, module) {
    if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) {
      module.exports = require_browser();
    } else {
      module.exports = require_node();
    }
  }
});

// node_modules/follow-redirects/debug.js
var require_debug = __commonJS({
  "node_modules/follow-redirects/debug.js"(exports, module) {
    var debug;
    module.exports = function() {
      if (!debug) {
        try {
          debug = require_src()("follow-redirects");
        } catch (error) {
        }
        if (typeof debug !== "function") {
          debug = function() {
          };
        }
      }
      debug.apply(null, arguments);
    };
  }
});

// node_modules/follow-redirects/index.js
var require_follow_redirects = __commonJS({
  "node_modules/follow-redirects/index.js"(exports, module) {
    var url = __require("url");
    var URL2 = url.URL;
    var http = __require("http");
    var https = __require("https");
    var Writable = __require("stream").Writable;
    var assert = __require("assert");
    var debug = require_debug();
    (function detectUnsupportedEnvironment() {
      var looksLikeNode = typeof process !== "undefined";
      var looksLikeBrowser = typeof window !== "undefined" && typeof document !== "undefined";
      var looksLikeV8 = isFunction(Error.captureStackTrace);
      if (!looksLikeNode && (looksLikeBrowser || !looksLikeV8)) {
        console.warn("The follow-redirects package should be excluded from browser builds.");
      }
    })();
    var useNativeURL = false;
    try {
      assert(new URL2(""));
    } catch (error) {
      useNativeURL = error.code === "ERR_INVALID_URL";
    }
    var sensitiveHeaders = [
      "Authorization",
      "Proxy-Authorization",
      "Cookie"
    ];
    var preservedUrlFields = [
      "auth",
      "host",
      "hostname",
      "href",
      "path",
      "pathname",
      "port",
      "protocol",
      "query",
      "search",
      "hash"
    ];
    var events = ["abort", "aborted", "connect", "error", "socket", "timeout"];
    var eventHandlers = /* @__PURE__ */ Object.create(null);
    events.forEach(function(event) {
      eventHandlers[event] = function(arg1, arg2, arg3) {
        this._redirectable.emit(event, arg1, arg2, arg3);
      };
    });
    var InvalidUrlError = createErrorType(
      "ERR_INVALID_URL",
      "Invalid URL",
      TypeError
    );
    var RedirectionError = createErrorType(
      "ERR_FR_REDIRECTION_FAILURE",
      "Redirected request failed"
    );
    var TooManyRedirectsError = createErrorType(
      "ERR_FR_TOO_MANY_REDIRECTS",
      "Maximum number of redirects exceeded",
      RedirectionError
    );
    var MaxBodyLengthExceededError = createErrorType(
      "ERR_FR_MAX_BODY_LENGTH_EXCEEDED",
      "Request body larger than maxBodyLength limit"
    );
    var WriteAfterEndError = createErrorType(
      "ERR_STREAM_WRITE_AFTER_END",
      "write after end"
    );
    var destroy = Writable.prototype.destroy || noop;
    function RedirectableRequest(options, responseCallback) {
      Writable.call(this);
      this._sanitizeOptions(options);
      this._options = options;
      this._ended = false;
      this._ending = false;
      this._redirectCount = 0;
      this._redirects = [];
      this._requestBodyLength = 0;
      this._requestBodyBuffers = [];
      if (responseCallback) {
        this.on("response", responseCallback);
      }
      var self2 = this;
      this._onNativeResponse = function(response) {
        try {
          self2._processResponse(response);
        } catch (cause) {
          self2.emit("error", cause instanceof RedirectionError ? cause : new RedirectionError({ cause }));
        }
      };
      this._headerFilter = new RegExp("^(?:" + sensitiveHeaders.concat(options.sensitiveHeaders).map(escapeRegex).join("|") + ")$", "i");
      this._performRequest();
    }
    RedirectableRequest.prototype = Object.create(Writable.prototype);
    RedirectableRequest.prototype.abort = function() {
      destroyRequest(this._currentRequest);
      this._currentRequest.abort();
      this.emit("abort");
    };
    RedirectableRequest.prototype.destroy = function(error) {
      destroyRequest(this._currentRequest, error);
      destroy.call(this, error);
      return this;
    };
    RedirectableRequest.prototype.write = function(data, encoding, callback) {
      if (this._ending) {
        throw new WriteAfterEndError();
      }
      if (!isString(data) && !isBuffer(data)) {
        throw new TypeError("data should be a string, Buffer or Uint8Array");
      }
      if (isFunction(encoding)) {
        callback = encoding;
        encoding = null;
      }
      if (data.length === 0) {
        if (callback) {
          callback();
        }
        return;
      }
      if (this._requestBodyLength + data.length <= this._options.maxBodyLength) {
        this._requestBodyLength += data.length;
        this._requestBodyBuffers.push({ data, encoding });
        this._currentRequest.write(data, encoding, callback);
      } else {
        this.emit("error", new MaxBodyLengthExceededError());
        this.abort();
      }
    };
    RedirectableRequest.prototype.end = function(data, encoding, callback) {
      if (isFunction(data)) {
        callback = data;
        data = encoding = null;
      } else if (isFunction(encoding)) {
        callback = encoding;
        encoding = null;
      }
      if (!data) {
        this._ended = this._ending = true;
        this._currentRequest.end(null, null, callback);
      } else {
        var self2 = this;
        var currentRequest = this._currentRequest;
        this.write(data, encoding, function() {
          self2._ended = true;
          currentRequest.end(null, null, callback);
        });
        this._ending = true;
      }
    };
    RedirectableRequest.prototype.setHeader = function(name, value) {
      this._options.headers[name] = value;
      this._currentRequest.setHeader(name, value);
    };
    RedirectableRequest.prototype.removeHeader = function(name) {
      delete this._options.headers[name];
      this._currentRequest.removeHeader(name);
    };
    RedirectableRequest.prototype.setTimeout = function(msecs, callback) {
      var self2 = this;
      function destroyOnTimeout(socket) {
        socket.setTimeout(msecs);
        socket.removeListener("timeout", socket.destroy);
        socket.addListener("timeout", socket.destroy);
      }
      function startTimer(socket) {
        if (self2._timeout) {
          clearTimeout(self2._timeout);
        }
        self2._timeout = setTimeout(function() {
          self2.emit("timeout");
          clearTimer();
        }, msecs);
        destroyOnTimeout(socket);
      }
      function clearTimer() {
        if (self2._timeout) {
          clearTimeout(self2._timeout);
          self2._timeout = null;
        }
        self2.removeListener("abort", clearTimer);
        self2.removeListener("error", clearTimer);
        self2.removeListener("response", clearTimer);
        self2.removeListener("close", clearTimer);
        if (callback) {
          self2.removeListener("timeout", callback);
        }
        if (!self2.socket) {
          self2._currentRequest.removeListener("socket", startTimer);
        }
      }
      if (callback) {
        this.on("timeout", callback);
      }
      if (this.socket) {
        startTimer(this.socket);
      } else {
        this._currentRequest.once("socket", startTimer);
      }
      this.on("socket", destroyOnTimeout);
      this.on("abort", clearTimer);
      this.on("error", clearTimer);
      this.on("response", clearTimer);
      this.on("close", clearTimer);
      return this;
    };
    [
      "flushHeaders",
      "getHeader",
      "setNoDelay",
      "setSocketKeepAlive"
    ].forEach(function(method) {
      RedirectableRequest.prototype[method] = function(a, b) {
        return this._currentRequest[method](a, b);
      };
    });
    ["aborted", "connection", "socket"].forEach(function(property) {
      Object.defineProperty(RedirectableRequest.prototype, property, {
        get: function() {
          return this._currentRequest[property];
        }
      });
    });
    RedirectableRequest.prototype._sanitizeOptions = function(options) {
      if (!options.headers) {
        options.headers = {};
      }
      if (!isArray(options.sensitiveHeaders)) {
        options.sensitiveHeaders = [];
      }
      if (options.host) {
        if (!options.hostname) {
          options.hostname = options.host;
        }
        delete options.host;
      }
      if (!options.pathname && options.path) {
        var searchPos = options.path.indexOf("?");
        if (searchPos < 0) {
          options.pathname = options.path;
        } else {
          options.pathname = options.path.substring(0, searchPos);
          options.search = options.path.substring(searchPos);
        }
      }
    };
    RedirectableRequest.prototype._performRequest = function() {
      var protocol = this._options.protocol;
      var nativeProtocol = this._options.nativeProtocols[protocol];
      if (!nativeProtocol) {
        throw new TypeError("Unsupported protocol " + protocol);
      }
      if (this._options.agents) {
        var scheme = protocol.slice(0, -1);
        this._options.agent = this._options.agents[scheme];
      }
      var request = this._currentRequest = nativeProtocol.request(this._options, this._onNativeResponse);
      request._redirectable = this;
      for (var event of events) {
        request.on(event, eventHandlers[event]);
      }
      this._currentUrl = /^\//.test(this._options.path) ? url.format(this._options) : (
        // When making a request to a proxy, […]
        // a client MUST send the target URI in absolute-form […].
        this._options.path
      );
      if (this._isRedirect) {
        var i = 0;
        var self2 = this;
        var buffers = this._requestBodyBuffers;
        (function writeNext(error) {
          if (request === self2._currentRequest) {
            if (error) {
              self2.emit("error", error);
            } else if (i < buffers.length) {
              var buffer = buffers[i++];
              if (!request.finished) {
                request.write(buffer.data, buffer.encoding, writeNext);
              }
            } else if (self2._ended) {
              request.end();
            }
          }
        })();
      }
    };
    RedirectableRequest.prototype._processResponse = function(response) {
      var statusCode = response.statusCode;
      if (this._options.trackRedirects) {
        this._redirects.push({
          url: this._currentUrl,
          headers: response.headers,
          statusCode
        });
      }
      var location = response.headers.location;
      if (!location || this._options.followRedirects === false || statusCode < 300 || statusCode >= 400) {
        response.responseUrl = this._currentUrl;
        response.redirects = this._redirects;
        this.emit("response", response);
        this._requestBodyBuffers = [];
        return;
      }
      destroyRequest(this._currentRequest);
      response.destroy();
      if (++this._redirectCount > this._options.maxRedirects) {
        throw new TooManyRedirectsError();
      }
      var requestHeaders;
      var beforeRedirect = this._options.beforeRedirect;
      if (beforeRedirect) {
        requestHeaders = Object.assign({
          // The Host header was set by nativeProtocol.request
          Host: response.req.getHeader("host")
        }, this._options.headers);
      }
      var method = this._options.method;
      if ((statusCode === 301 || statusCode === 302) && this._options.method === "POST" || // RFC7231§6.4.4: The 303 (See Other) status code indicates that
      // the server is redirecting the user agent to a different resource […]
      // A user agent can perform a retrieval request targeting that URI
      // (a GET or HEAD request if using HTTP) […]
      statusCode === 303 && !/^(?:GET|HEAD)$/.test(this._options.method)) {
        this._options.method = "GET";
        this._requestBodyBuffers = [];
        removeMatchingHeaders(/^content-/i, this._options.headers);
      }
      var currentHostHeader = removeMatchingHeaders(/^host$/i, this._options.headers);
      var currentUrlParts = parseUrl(this._currentUrl);
      var currentHost = currentHostHeader || currentUrlParts.host;
      var currentUrl = /^\w+:/.test(location) ? this._currentUrl : url.format(Object.assign(currentUrlParts, { host: currentHost }));
      var redirectUrl = resolveUrl(location, currentUrl);
      debug("redirecting to", redirectUrl.href);
      this._isRedirect = true;
      spreadUrlObject(redirectUrl, this._options);
      if (redirectUrl.protocol !== currentUrlParts.protocol && redirectUrl.protocol !== "https:" || redirectUrl.host !== currentHost && !isSubdomain(redirectUrl.host, currentHost)) {
        removeMatchingHeaders(this._headerFilter, this._options.headers);
      }
      if (isFunction(beforeRedirect)) {
        var responseDetails = {
          headers: response.headers,
          statusCode
        };
        var requestDetails = {
          url: currentUrl,
          method,
          headers: requestHeaders
        };
        beforeRedirect(this._options, responseDetails, requestDetails);
        this._sanitizeOptions(this._options);
      }
      this._performRequest();
    };
    function wrap(protocols) {
      var exports2 = {
        maxRedirects: 21,
        maxBodyLength: 10 * 1024 * 1024
      };
      var nativeProtocols = {};
      Object.keys(protocols).forEach(function(scheme) {
        var protocol = scheme + ":";
        var nativeProtocol = nativeProtocols[protocol] = protocols[scheme];
        var wrappedProtocol = exports2[scheme] = Object.create(nativeProtocol);
        function request(input, options, callback) {
          if (isURL(input)) {
            input = spreadUrlObject(input);
          } else if (isString(input)) {
            input = spreadUrlObject(parseUrl(input));
          } else {
            callback = options;
            options = validateUrl(input);
            input = { protocol };
          }
          if (isFunction(options)) {
            callback = options;
            options = null;
          }
          options = Object.assign({
            maxRedirects: exports2.maxRedirects,
            maxBodyLength: exports2.maxBodyLength
          }, input, options);
          options.nativeProtocols = nativeProtocols;
          if (!isString(options.host) && !isString(options.hostname)) {
            options.hostname = "::1";
          }
          assert.equal(options.protocol, protocol, "protocol mismatch");
          debug("options", options);
          return new RedirectableRequest(options, callback);
        }
        function get(input, options, callback) {
          var wrappedRequest = wrappedProtocol.request(input, options, callback);
          wrappedRequest.end();
          return wrappedRequest;
        }
        Object.defineProperties(wrappedProtocol, {
          request: { value: request, configurable: true, enumerable: true, writable: true },
          get: { value: get, configurable: true, enumerable: true, writable: true }
        });
      });
      return exports2;
    }
    function noop() {
    }
    function parseUrl(input) {
      var parsed;
      if (useNativeURL) {
        parsed = new URL2(input);
      } else {
        parsed = validateUrl(url.parse(input));
        if (!isString(parsed.protocol)) {
          throw new InvalidUrlError({ input });
        }
      }
      return parsed;
    }
    function resolveUrl(relative, base) {
      return useNativeURL ? new URL2(relative, base) : parseUrl(url.resolve(base, relative));
    }
    function validateUrl(input) {
      if (/^\[/.test(input.hostname) && !/^\[[:0-9a-f]+\]$/i.test(input.hostname)) {
        throw new InvalidUrlError({ input: input.href || input });
      }
      if (/^\[/.test(input.host) && !/^\[[:0-9a-f]+\](:\d+)?$/i.test(input.host)) {
        throw new InvalidUrlError({ input: input.href || input });
      }
      return input;
    }
    function spreadUrlObject(urlObject, target) {
      var spread = target || {};
      for (var key of preservedUrlFields) {
        spread[key] = urlObject[key];
      }
      if (spread.hostname.startsWith("[")) {
        spread.hostname = spread.hostname.slice(1, -1);
      }
      if (spread.port !== "") {
        spread.port = Number(spread.port);
      }
      spread.path = spread.search ? spread.pathname + spread.search : spread.pathname;
      return spread;
    }
    function removeMatchingHeaders(regex, headers) {
      var lastValue;
      for (var header in headers) {
        if (regex.test(header)) {
          lastValue = headers[header];
          delete headers[header];
        }
      }
      return lastValue === null || typeof lastValue === "undefined" ? void 0 : String(lastValue).trim();
    }
    function createErrorType(code, message, baseClass) {
      function CustomError(properties) {
        if (isFunction(Error.captureStackTrace)) {
          Error.captureStackTrace(this, this.constructor);
        }
        Object.assign(this, properties || {});
        this.code = code;
        this.message = this.cause ? message + ": " + this.cause.message : message;
      }
      CustomError.prototype = new (baseClass || Error)();
      Object.defineProperties(CustomError.prototype, {
        constructor: {
          value: CustomError,
          enumerable: false
        },
        name: {
          value: "Error [" + code + "]",
          enumerable: false
        }
      });
      return CustomError;
    }
    function destroyRequest(request, error) {
      for (var event of events) {
        request.removeListener(event, eventHandlers[event]);
      }
      request.on("error", noop);
      request.destroy(error);
    }
    function isSubdomain(subdomain, domain) {
      assert(isString(subdomain) && isString(domain));
      var dot = subdomain.length - domain.length - 1;
      return dot > 0 && subdomain[dot] === "." && subdomain.endsWith(domain);
    }
    function isArray(value) {
      return value instanceof Array;
    }
    function isString(value) {
      return typeof value === "string" || value instanceof String;
    }
    function isFunction(value) {
      return typeof value === "function";
    }
    function isBuffer(value) {
      return typeof value === "object" && "length" in value;
    }
    function isURL(value) {
      return URL2 && value instanceof URL2;
    }
    function escapeRegex(regex) {
      return regex.replace(/[\]\\/()*+?.$]/g, "\\$&");
    }
    module.exports = wrap({ http, https });
    module.exports.wrap = wrap;
  }
});

// node_modules/axios/dist/node/axios.cjs
var require_axios = __commonJS({
  "node_modules/axios/dist/node/axios.cjs"(exports, module) {
    "use strict";
    var FormData$1 = require_form_data();
    var crypto = __require("crypto");
    var url = __require("url");
    var http = __require("http");
    var https = __require("https");
    var http2 = __require("http2");
    var util = __require("util");
    var followRedirects = require_follow_redirects();
    var zlib = __require("zlib");
    var stream = __require("stream");
    var events = __require("events");
    function bind(fn, thisArg) {
      return function wrap() {
        return fn.apply(thisArg, arguments);
      };
    }
    var {
      toString
    } = Object.prototype;
    var {
      getPrototypeOf
    } = Object;
    var {
      iterator,
      toStringTag
    } = Symbol;
    var kindOf = /* @__PURE__ */ ((cache) => (thing) => {
      const str = toString.call(thing);
      return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
    })(/* @__PURE__ */ Object.create(null));
    var kindOfTest = (type) => {
      type = type.toLowerCase();
      return (thing) => kindOf(thing) === type;
    };
    var typeOfTest = (type) => (thing) => typeof thing === type;
    var {
      isArray
    } = Array;
    var isUndefined = typeOfTest("undefined");
    function isBuffer(val) {
      return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor) && isFunction$1(val.constructor.isBuffer) && val.constructor.isBuffer(val);
    }
    var isArrayBuffer = kindOfTest("ArrayBuffer");
    function isArrayBufferView(val) {
      let result;
      if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) {
        result = ArrayBuffer.isView(val);
      } else {
        result = val && val.buffer && isArrayBuffer(val.buffer);
      }
      return result;
    }
    var isString = typeOfTest("string");
    var isFunction$1 = typeOfTest("function");
    var isNumber = typeOfTest("number");
    var isObject = (thing) => thing !== null && typeof thing === "object";
    var isBoolean = (thing) => thing === true || thing === false;
    var isPlainObject = (val) => {
      if (kindOf(val) !== "object") {
        return false;
      }
      const prototype2 = getPrototypeOf(val);
      return (prototype2 === null || prototype2 === Object.prototype || Object.getPrototypeOf(prototype2) === null) && !(toStringTag in val) && !(iterator in val);
    };
    var isEmptyObject = (val) => {
      if (!isObject(val) || isBuffer(val)) {
        return false;
      }
      try {
        return Object.keys(val).length === 0 && Object.getPrototypeOf(val) === Object.prototype;
      } catch (e) {
        return false;
      }
    };
    var isDate = kindOfTest("Date");
    var isFile = kindOfTest("File");
    var isReactNativeBlob = (value) => {
      return !!(value && typeof value.uri !== "undefined");
    };
    var isReactNative = (formData) => formData && typeof formData.getParts !== "undefined";
    var isBlob = kindOfTest("Blob");
    var isFileList = kindOfTest("FileList");
    var isStream = (val) => isObject(val) && isFunction$1(val.pipe);
    function getGlobal() {
      if (typeof globalThis !== "undefined") return globalThis;
      if (typeof self !== "undefined") return self;
      if (typeof window !== "undefined") return window;
      if (typeof global !== "undefined") return global;
      return {};
    }
    var G = getGlobal();
    var FormDataCtor = typeof G.FormData !== "undefined" ? G.FormData : void 0;
    var isFormData = (thing) => {
      let kind;
      return thing && (FormDataCtor && thing instanceof FormDataCtor || isFunction$1(thing.append) && ((kind = kindOf(thing)) === "formdata" || // detect form-data instance
      kind === "object" && isFunction$1(thing.toString) && thing.toString() === "[object FormData]"));
    };
    var isURLSearchParams = kindOfTest("URLSearchParams");
    var [isReadableStream, isRequest, isResponse, isHeaders] = ["ReadableStream", "Request", "Response", "Headers"].map(kindOfTest);
    var trim = (str) => {
      return str.trim ? str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
    };
    function forEach(obj, fn, {
      allOwnKeys = false
    } = {}) {
      if (obj === null || typeof obj === "undefined") {
        return;
      }
      let i;
      let l;
      if (typeof obj !== "object") {
        obj = [obj];
      }
      if (isArray(obj)) {
        for (i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        if (isBuffer(obj)) {
          return;
        }
        const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
        const len = keys.length;
        let key;
        for (i = 0; i < len; i++) {
          key = keys[i];
          fn.call(null, obj[key], key, obj);
        }
      }
    }
    function findKey(obj, key) {
      if (isBuffer(obj)) {
        return null;
      }
      key = key.toLowerCase();
      const keys = Object.keys(obj);
      let i = keys.length;
      let _key;
      while (i-- > 0) {
        _key = keys[i];
        if (key === _key.toLowerCase()) {
          return _key;
        }
      }
      return null;
    }
    var _global = (() => {
      if (typeof globalThis !== "undefined") return globalThis;
      return typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : global;
    })();
    var isContextDefined = (context) => !isUndefined(context) && context !== _global;
    function merge() {
      const {
        caseless,
        skipUndefined
      } = isContextDefined(this) && this || {};
      const result = {};
      const assignValue = (val, key) => {
        if (key === "__proto__" || key === "constructor" || key === "prototype") {
          return;
        }
        const targetKey = caseless && findKey(result, key) || key;
        if (isPlainObject(result[targetKey]) && isPlainObject(val)) {
          result[targetKey] = merge(result[targetKey], val);
        } else if (isPlainObject(val)) {
          result[targetKey] = merge({}, val);
        } else if (isArray(val)) {
          result[targetKey] = val.slice();
        } else if (!skipUndefined || !isUndefined(val)) {
          result[targetKey] = val;
        }
      };
      for (let i = 0, l = arguments.length; i < l; i++) {
        arguments[i] && forEach(arguments[i], assignValue);
      }
      return result;
    }
    var extend = (a, b, thisArg, {
      allOwnKeys
    } = {}) => {
      forEach(b, (val, key) => {
        if (thisArg && isFunction$1(val)) {
          Object.defineProperty(a, key, {
            value: bind(val, thisArg),
            writable: true,
            enumerable: true,
            configurable: true
          });
        } else {
          Object.defineProperty(a, key, {
            value: val,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }, {
        allOwnKeys
      });
      return a;
    };
    var stripBOM = (content) => {
      if (content.charCodeAt(0) === 65279) {
        content = content.slice(1);
      }
      return content;
    };
    var inherits = (constructor, superConstructor, props, descriptors) => {
      constructor.prototype = Object.create(superConstructor.prototype, descriptors);
      Object.defineProperty(constructor.prototype, "constructor", {
        value: constructor,
        writable: true,
        enumerable: false,
        configurable: true
      });
      Object.defineProperty(constructor, "super", {
        value: superConstructor.prototype
      });
      props && Object.assign(constructor.prototype, props);
    };
    var toFlatObject = (sourceObj, destObj, filter, propFilter) => {
      let props;
      let i;
      let prop;
      const merged = {};
      destObj = destObj || {};
      if (sourceObj == null) return destObj;
      do {
        props = Object.getOwnPropertyNames(sourceObj);
        i = props.length;
        while (i-- > 0) {
          prop = props[i];
          if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
            destObj[prop] = sourceObj[prop];
            merged[prop] = true;
          }
        }
        sourceObj = filter !== false && getPrototypeOf(sourceObj);
      } while (sourceObj && (!filter || filter(sourceObj, destObj)) && sourceObj !== Object.prototype);
      return destObj;
    };
    var endsWith = (str, searchString, position) => {
      str = String(str);
      if (position === void 0 || position > str.length) {
        position = str.length;
      }
      position -= searchString.length;
      const lastIndex = str.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
    };
    var toArray = (thing) => {
      if (!thing) return null;
      if (isArray(thing)) return thing;
      let i = thing.length;
      if (!isNumber(i)) return null;
      const arr = new Array(i);
      while (i-- > 0) {
        arr[i] = thing[i];
      }
      return arr;
    };
    var isTypedArray = /* @__PURE__ */ ((TypedArray) => {
      return (thing) => {
        return TypedArray && thing instanceof TypedArray;
      };
    })(typeof Uint8Array !== "undefined" && getPrototypeOf(Uint8Array));
    var forEachEntry = (obj, fn) => {
      const generator = obj && obj[iterator];
      const _iterator = generator.call(obj);
      let result;
      while ((result = _iterator.next()) && !result.done) {
        const pair = result.value;
        fn.call(obj, pair[0], pair[1]);
      }
    };
    var matchAll = (regExp, str) => {
      let matches;
      const arr = [];
      while ((matches = regExp.exec(str)) !== null) {
        arr.push(matches);
      }
      return arr;
    };
    var isHTMLForm = kindOfTest("HTMLFormElement");
    var toCamelCase = (str) => {
      return str.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g, function replacer(m, p1, p2) {
        return p1.toUpperCase() + p2;
      });
    };
    var hasOwnProperty = (({
      hasOwnProperty: hasOwnProperty2
    }) => (obj, prop) => hasOwnProperty2.call(obj, prop))(Object.prototype);
    var isRegExp = kindOfTest("RegExp");
    var reduceDescriptors = (obj, reducer) => {
      const descriptors = Object.getOwnPropertyDescriptors(obj);
      const reducedDescriptors = {};
      forEach(descriptors, (descriptor, name) => {
        let ret;
        if ((ret = reducer(descriptor, name, obj)) !== false) {
          reducedDescriptors[name] = ret || descriptor;
        }
      });
      Object.defineProperties(obj, reducedDescriptors);
    };
    var freezeMethods = (obj) => {
      reduceDescriptors(obj, (descriptor, name) => {
        if (isFunction$1(obj) && ["arguments", "caller", "callee"].indexOf(name) !== -1) {
          return false;
        }
        const value = obj[name];
        if (!isFunction$1(value)) return;
        descriptor.enumerable = false;
        if ("writable" in descriptor) {
          descriptor.writable = false;
          return;
        }
        if (!descriptor.set) {
          descriptor.set = () => {
            throw Error("Can not rewrite read-only method '" + name + "'");
          };
        }
      });
    };
    var toObjectSet = (arrayOrString, delimiter) => {
      const obj = {};
      const define = (arr) => {
        arr.forEach((value) => {
          obj[value] = true;
        });
      };
      isArray(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter));
      return obj;
    };
    var noop = () => {
    };
    var toFiniteNumber = (value, defaultValue) => {
      return value != null && Number.isFinite(value = +value) ? value : defaultValue;
    };
    function isSpecCompliantForm(thing) {
      return !!(thing && isFunction$1(thing.append) && thing[toStringTag] === "FormData" && thing[iterator]);
    }
    var toJSONObject = (obj) => {
      const stack = new Array(10);
      const visit = (source, i) => {
        if (isObject(source)) {
          if (stack.indexOf(source) >= 0) {
            return;
          }
          if (isBuffer(source)) {
            return source;
          }
          if (!("toJSON" in source)) {
            stack[i] = source;
            const target = isArray(source) ? [] : {};
            forEach(source, (value, key) => {
              const reducedValue = visit(value, i + 1);
              !isUndefined(reducedValue) && (target[key] = reducedValue);
            });
            stack[i] = void 0;
            return target;
          }
        }
        return source;
      };
      return visit(obj, 0);
    };
    var isAsyncFn = kindOfTest("AsyncFunction");
    var isThenable = (thing) => thing && (isObject(thing) || isFunction$1(thing)) && isFunction$1(thing.then) && isFunction$1(thing.catch);
    var _setImmediate = ((setImmediateSupported, postMessageSupported) => {
      if (setImmediateSupported) {
        return setImmediate;
      }
      return postMessageSupported ? ((token, callbacks) => {
        _global.addEventListener("message", ({
          source,
          data
        }) => {
          if (source === _global && data === token) {
            callbacks.length && callbacks.shift()();
          }
        }, false);
        return (cb) => {
          callbacks.push(cb);
          _global.postMessage(token, "*");
        };
      })(`axios@${Math.random()}`, []) : (cb) => setTimeout(cb);
    })(typeof setImmediate === "function", isFunction$1(_global.postMessage));
    var asap = typeof queueMicrotask !== "undefined" ? queueMicrotask.bind(_global) : typeof process !== "undefined" && process.nextTick || _setImmediate;
    var isIterable = (thing) => thing != null && isFunction$1(thing[iterator]);
    var utils$1 = {
      isArray,
      isArrayBuffer,
      isBuffer,
      isFormData,
      isArrayBufferView,
      isString,
      isNumber,
      isBoolean,
      isObject,
      isPlainObject,
      isEmptyObject,
      isReadableStream,
      isRequest,
      isResponse,
      isHeaders,
      isUndefined,
      isDate,
      isFile,
      isReactNativeBlob,
      isReactNative,
      isBlob,
      isRegExp,
      isFunction: isFunction$1,
      isStream,
      isURLSearchParams,
      isTypedArray,
      isFileList,
      forEach,
      merge,
      extend,
      trim,
      stripBOM,
      inherits,
      toFlatObject,
      kindOf,
      kindOfTest,
      endsWith,
      toArray,
      forEachEntry,
      matchAll,
      isHTMLForm,
      hasOwnProperty,
      hasOwnProp: hasOwnProperty,
      // an alias to avoid ESLint no-prototype-builtins detection
      reduceDescriptors,
      freezeMethods,
      toObjectSet,
      toCamelCase,
      noop,
      toFiniteNumber,
      findKey,
      global: _global,
      isContextDefined,
      isSpecCompliantForm,
      toJSONObject,
      isAsyncFn,
      isThenable,
      setImmediate: _setImmediate,
      asap,
      isIterable
    };
    var AxiosError = class _AxiosError extends Error {
      static from(error, code, config, request, response, customProps) {
        const axiosError = new _AxiosError(error.message, code || error.code, config, request, response);
        axiosError.cause = error;
        axiosError.name = error.name;
        if (error.status != null && axiosError.status == null) {
          axiosError.status = error.status;
        }
        customProps && Object.assign(axiosError, customProps);
        return axiosError;
      }
      /**
       * Create an Error with the specified message, config, error code, request and response.
       *
       * @param {string} message The error message.
       * @param {string} [code] The error code (for example, 'ECONNABORTED').
       * @param {Object} [config] The config.
       * @param {Object} [request] The request.
       * @param {Object} [response] The response.
       *
       * @returns {Error} The created error.
       */
      constructor(message, code, config, request, response) {
        super(message);
        Object.defineProperty(this, "message", {
          value: message,
          enumerable: true,
          writable: true,
          configurable: true
        });
        this.name = "AxiosError";
        this.isAxiosError = true;
        code && (this.code = code);
        config && (this.config = config);
        request && (this.request = request);
        if (response) {
          this.response = response;
          this.status = response.status;
        }
      }
      toJSON() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: utils$1.toJSONObject(this.config),
          code: this.code,
          status: this.status
        };
      }
    };
    AxiosError.ERR_BAD_OPTION_VALUE = "ERR_BAD_OPTION_VALUE";
    AxiosError.ERR_BAD_OPTION = "ERR_BAD_OPTION";
    AxiosError.ECONNABORTED = "ECONNABORTED";
    AxiosError.ETIMEDOUT = "ETIMEDOUT";
    AxiosError.ERR_NETWORK = "ERR_NETWORK";
    AxiosError.ERR_FR_TOO_MANY_REDIRECTS = "ERR_FR_TOO_MANY_REDIRECTS";
    AxiosError.ERR_DEPRECATED = "ERR_DEPRECATED";
    AxiosError.ERR_BAD_RESPONSE = "ERR_BAD_RESPONSE";
    AxiosError.ERR_BAD_REQUEST = "ERR_BAD_REQUEST";
    AxiosError.ERR_CANCELED = "ERR_CANCELED";
    AxiosError.ERR_NOT_SUPPORT = "ERR_NOT_SUPPORT";
    AxiosError.ERR_INVALID_URL = "ERR_INVALID_URL";
    function isVisitable(thing) {
      return utils$1.isPlainObject(thing) || utils$1.isArray(thing);
    }
    function removeBrackets(key) {
      return utils$1.endsWith(key, "[]") ? key.slice(0, -2) : key;
    }
    function renderKey(path, key, dots) {
      if (!path) return key;
      return path.concat(key).map(function each(token, i) {
        token = removeBrackets(token);
        return !dots && i ? "[" + token + "]" : token;
      }).join(dots ? "." : "");
    }
    function isFlatArray(arr) {
      return utils$1.isArray(arr) && !arr.some(isVisitable);
    }
    var predicates = utils$1.toFlatObject(utils$1, {}, null, function filter(prop) {
      return /^is[A-Z]/.test(prop);
    });
    function toFormData(obj, formData, options) {
      if (!utils$1.isObject(obj)) {
        throw new TypeError("target must be an object");
      }
      formData = formData || new (FormData$1 || FormData)();
      options = utils$1.toFlatObject(options, {
        metaTokens: true,
        dots: false,
        indexes: false
      }, false, function defined(option, source) {
        return !utils$1.isUndefined(source[option]);
      });
      const metaTokens = options.metaTokens;
      const visitor = options.visitor || defaultVisitor;
      const dots = options.dots;
      const indexes = options.indexes;
      const _Blob = options.Blob || typeof Blob !== "undefined" && Blob;
      const useBlob = _Blob && utils$1.isSpecCompliantForm(formData);
      if (!utils$1.isFunction(visitor)) {
        throw new TypeError("visitor must be a function");
      }
      function convertValue(value) {
        if (value === null) return "";
        if (utils$1.isDate(value)) {
          return value.toISOString();
        }
        if (utils$1.isBoolean(value)) {
          return value.toString();
        }
        if (!useBlob && utils$1.isBlob(value)) {
          throw new AxiosError("Blob is not supported. Use a Buffer instead.");
        }
        if (utils$1.isArrayBuffer(value) || utils$1.isTypedArray(value)) {
          return useBlob && typeof Blob === "function" ? new Blob([value]) : Buffer.from(value);
        }
        return value;
      }
      function defaultVisitor(value, key, path) {
        let arr = value;
        if (utils$1.isReactNative(formData) && utils$1.isReactNativeBlob(value)) {
          formData.append(renderKey(path, key, dots), convertValue(value));
          return false;
        }
        if (value && !path && typeof value === "object") {
          if (utils$1.endsWith(key, "{}")) {
            key = metaTokens ? key : key.slice(0, -2);
            value = JSON.stringify(value);
          } else if (utils$1.isArray(value) && isFlatArray(value) || (utils$1.isFileList(value) || utils$1.endsWith(key, "[]")) && (arr = utils$1.toArray(value))) {
            key = removeBrackets(key);
            arr.forEach(function each(el, index) {
              !(utils$1.isUndefined(el) || el === null) && formData.append(
                // eslint-disable-next-line no-nested-ternary
                indexes === true ? renderKey([key], index, dots) : indexes === null ? key : key + "[]",
                convertValue(el)
              );
            });
            return false;
          }
        }
        if (isVisitable(value)) {
          return true;
        }
        formData.append(renderKey(path, key, dots), convertValue(value));
        return false;
      }
      const stack = [];
      const exposedHelpers = Object.assign(predicates, {
        defaultVisitor,
        convertValue,
        isVisitable
      });
      function build(value, path) {
        if (utils$1.isUndefined(value)) return;
        if (stack.indexOf(value) !== -1) {
          throw Error("Circular reference detected in " + path.join("."));
        }
        stack.push(value);
        utils$1.forEach(value, function each(el, key) {
          const result = !(utils$1.isUndefined(el) || el === null) && visitor.call(formData, el, utils$1.isString(key) ? key.trim() : key, path, exposedHelpers);
          if (result === true) {
            build(el, path ? path.concat(key) : [key]);
          }
        });
        stack.pop();
      }
      if (!utils$1.isObject(obj)) {
        throw new TypeError("data must be an object");
      }
      build(obj);
      return formData;
    }
    function encode$1(str) {
      const charMap = {
        "!": "%21",
        "'": "%27",
        "(": "%28",
        ")": "%29",
        "~": "%7E",
        "%20": "+",
        "%00": "\0"
      };
      return encodeURIComponent(str).replace(/[!'()~]|%20|%00/g, function replacer(match) {
        return charMap[match];
      });
    }
    function AxiosURLSearchParams(params, options) {
      this._pairs = [];
      params && toFormData(params, this, options);
    }
    var prototype = AxiosURLSearchParams.prototype;
    prototype.append = function append(name, value) {
      this._pairs.push([name, value]);
    };
    prototype.toString = function toString2(encoder) {
      const _encode = encoder ? function(value) {
        return encoder.call(this, value, encode$1);
      } : encode$1;
      return this._pairs.map(function each(pair) {
        return _encode(pair[0]) + "=" + _encode(pair[1]);
      }, "").join("&");
    };
    function encode(val) {
      return encodeURIComponent(val).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+");
    }
    function buildURL(url2, params, options) {
      if (!params) {
        return url2;
      }
      const _encode = options && options.encode || encode;
      const _options = utils$1.isFunction(options) ? {
        serialize: options
      } : options;
      const serializeFn = _options && _options.serialize;
      let serializedParams;
      if (serializeFn) {
        serializedParams = serializeFn(params, _options);
      } else {
        serializedParams = utils$1.isURLSearchParams(params) ? params.toString() : new AxiosURLSearchParams(params, _options).toString(_encode);
      }
      if (serializedParams) {
        const hashmarkIndex = url2.indexOf("#");
        if (hashmarkIndex !== -1) {
          url2 = url2.slice(0, hashmarkIndex);
        }
        url2 += (url2.indexOf("?") === -1 ? "?" : "&") + serializedParams;
      }
      return url2;
    }
    var InterceptorManager = class {
      constructor() {
        this.handlers = [];
      }
      /**
       * Add a new interceptor to the stack
       *
       * @param {Function} fulfilled The function to handle `then` for a `Promise`
       * @param {Function} rejected The function to handle `reject` for a `Promise`
       * @param {Object} options The options for the interceptor, synchronous and runWhen
       *
       * @return {Number} An ID used to remove interceptor later
       */
      use(fulfilled, rejected, options) {
        this.handlers.push({
          fulfilled,
          rejected,
          synchronous: options ? options.synchronous : false,
          runWhen: options ? options.runWhen : null
        });
        return this.handlers.length - 1;
      }
      /**
       * Remove an interceptor from the stack
       *
       * @param {Number} id The ID that was returned by `use`
       *
       * @returns {void}
       */
      eject(id) {
        if (this.handlers[id]) {
          this.handlers[id] = null;
        }
      }
      /**
       * Clear all interceptors from the stack
       *
       * @returns {void}
       */
      clear() {
        if (this.handlers) {
          this.handlers = [];
        }
      }
      /**
       * Iterate over all the registered interceptors
       *
       * This method is particularly useful for skipping over any
       * interceptors that may have become `null` calling `eject`.
       *
       * @param {Function} fn The function to call for each interceptor
       *
       * @returns {void}
       */
      forEach(fn) {
        utils$1.forEach(this.handlers, function forEachHandler(h) {
          if (h !== null) {
            fn(h);
          }
        });
      }
    };
    var transitionalDefaults = {
      silentJSONParsing: true,
      forcedJSONParsing: true,
      clarifyTimeoutError: false,
      legacyInterceptorReqResOrdering: true
    };
    var URLSearchParams = url.URLSearchParams;
    var ALPHA = "abcdefghijklmnopqrstuvwxyz";
    var DIGIT = "0123456789";
    var ALPHABET = {
      DIGIT,
      ALPHA,
      ALPHA_DIGIT: ALPHA + ALPHA.toUpperCase() + DIGIT
    };
    var generateString = (size = 16, alphabet = ALPHABET.ALPHA_DIGIT) => {
      let str = "";
      const {
        length
      } = alphabet;
      const randomValues = new Uint32Array(size);
      crypto.randomFillSync(randomValues);
      for (let i = 0; i < size; i++) {
        str += alphabet[randomValues[i] % length];
      }
      return str;
    };
    var platform$1 = {
      isNode: true,
      classes: {
        URLSearchParams,
        FormData: FormData$1,
        Blob: typeof Blob !== "undefined" && Blob || null
      },
      ALPHABET,
      generateString,
      protocols: ["http", "https", "file", "data"]
    };
    var hasBrowserEnv = typeof window !== "undefined" && typeof document !== "undefined";
    var _navigator = typeof navigator === "object" && navigator || void 0;
    var hasStandardBrowserEnv = hasBrowserEnv && (!_navigator || ["ReactNative", "NativeScript", "NS"].indexOf(_navigator.product) < 0);
    var hasStandardBrowserWebWorkerEnv = (() => {
      return typeof WorkerGlobalScope !== "undefined" && // eslint-disable-next-line no-undef
      self instanceof WorkerGlobalScope && typeof self.importScripts === "function";
    })();
    var origin = hasBrowserEnv && window.location.href || "http://localhost";
    var utils = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      hasBrowserEnv,
      hasStandardBrowserEnv,
      hasStandardBrowserWebWorkerEnv,
      navigator: _navigator,
      origin
    });
    var platform = {
      ...utils,
      ...platform$1
    };
    function toURLEncodedForm(data, options) {
      return toFormData(data, new platform.classes.URLSearchParams(), {
        visitor: function(value, key, path, helpers) {
          if (platform.isNode && utils$1.isBuffer(value)) {
            this.append(key, value.toString("base64"));
            return false;
          }
          return helpers.defaultVisitor.apply(this, arguments);
        },
        ...options
      });
    }
    function parsePropPath(name) {
      return utils$1.matchAll(/\w+|\[(\w*)]/g, name).map((match) => {
        return match[0] === "[]" ? "" : match[1] || match[0];
      });
    }
    function arrayToObject(arr) {
      const obj = {};
      const keys = Object.keys(arr);
      let i;
      const len = keys.length;
      let key;
      for (i = 0; i < len; i++) {
        key = keys[i];
        obj[key] = arr[key];
      }
      return obj;
    }
    function formDataToJSON(formData) {
      function buildPath(path, value, target, index) {
        let name = path[index++];
        if (name === "__proto__") return true;
        const isNumericKey = Number.isFinite(+name);
        const isLast = index >= path.length;
        name = !name && utils$1.isArray(target) ? target.length : name;
        if (isLast) {
          if (utils$1.hasOwnProp(target, name)) {
            target[name] = [target[name], value];
          } else {
            target[name] = value;
          }
          return !isNumericKey;
        }
        if (!target[name] || !utils$1.isObject(target[name])) {
          target[name] = [];
        }
        const result = buildPath(path, value, target[name], index);
        if (result && utils$1.isArray(target[name])) {
          target[name] = arrayToObject(target[name]);
        }
        return !isNumericKey;
      }
      if (utils$1.isFormData(formData) && utils$1.isFunction(formData.entries)) {
        const obj = {};
        utils$1.forEachEntry(formData, (name, value) => {
          buildPath(parsePropPath(name), value, obj, 0);
        });
        return obj;
      }
      return null;
    }
    function stringifySafely(rawValue, parser, encoder) {
      if (utils$1.isString(rawValue)) {
        try {
          (parser || JSON.parse)(rawValue);
          return utils$1.trim(rawValue);
        } catch (e) {
          if (e.name !== "SyntaxError") {
            throw e;
          }
        }
      }
      return (encoder || JSON.stringify)(rawValue);
    }
    var defaults = {
      transitional: transitionalDefaults,
      adapter: ["xhr", "http", "fetch"],
      transformRequest: [function transformRequest(data, headers) {
        const contentType = headers.getContentType() || "";
        const hasJSONContentType = contentType.indexOf("application/json") > -1;
        const isObjectPayload = utils$1.isObject(data);
        if (isObjectPayload && utils$1.isHTMLForm(data)) {
          data = new FormData(data);
        }
        const isFormData2 = utils$1.isFormData(data);
        if (isFormData2) {
          return hasJSONContentType ? JSON.stringify(formDataToJSON(data)) : data;
        }
        if (utils$1.isArrayBuffer(data) || utils$1.isBuffer(data) || utils$1.isStream(data) || utils$1.isFile(data) || utils$1.isBlob(data) || utils$1.isReadableStream(data)) {
          return data;
        }
        if (utils$1.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils$1.isURLSearchParams(data)) {
          headers.setContentType("application/x-www-form-urlencoded;charset=utf-8", false);
          return data.toString();
        }
        let isFileList2;
        if (isObjectPayload) {
          if (contentType.indexOf("application/x-www-form-urlencoded") > -1) {
            return toURLEncodedForm(data, this.formSerializer).toString();
          }
          if ((isFileList2 = utils$1.isFileList(data)) || contentType.indexOf("multipart/form-data") > -1) {
            const _FormData = this.env && this.env.FormData;
            return toFormData(isFileList2 ? {
              "files[]": data
            } : data, _FormData && new _FormData(), this.formSerializer);
          }
        }
        if (isObjectPayload || hasJSONContentType) {
          headers.setContentType("application/json", false);
          return stringifySafely(data);
        }
        return data;
      }],
      transformResponse: [function transformResponse(data) {
        const transitional = this.transitional || defaults.transitional;
        const forcedJSONParsing = transitional && transitional.forcedJSONParsing;
        const JSONRequested = this.responseType === "json";
        if (utils$1.isResponse(data) || utils$1.isReadableStream(data)) {
          return data;
        }
        if (data && utils$1.isString(data) && (forcedJSONParsing && !this.responseType || JSONRequested)) {
          const silentJSONParsing = transitional && transitional.silentJSONParsing;
          const strictJSONParsing = !silentJSONParsing && JSONRequested;
          try {
            return JSON.parse(data, this.parseReviver);
          } catch (e) {
            if (strictJSONParsing) {
              if (e.name === "SyntaxError") {
                throw AxiosError.from(e, AxiosError.ERR_BAD_RESPONSE, this, null, this.response);
              }
              throw e;
            }
          }
        }
        return data;
      }],
      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,
      xsrfCookieName: "XSRF-TOKEN",
      xsrfHeaderName: "X-XSRF-TOKEN",
      maxContentLength: -1,
      maxBodyLength: -1,
      env: {
        FormData: platform.classes.FormData,
        Blob: platform.classes.Blob
      },
      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      },
      headers: {
        common: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": void 0
        }
      }
    };
    utils$1.forEach(["delete", "get", "head", "post", "put", "patch"], (method) => {
      defaults.headers[method] = {};
    });
    var ignoreDuplicateOf = utils$1.toObjectSet(["age", "authorization", "content-length", "content-type", "etag", "expires", "from", "host", "if-modified-since", "if-unmodified-since", "last-modified", "location", "max-forwards", "proxy-authorization", "referer", "retry-after", "user-agent"]);
    var parseHeaders = (rawHeaders) => {
      const parsed = {};
      let key;
      let val;
      let i;
      rawHeaders && rawHeaders.split("\n").forEach(function parser(line) {
        i = line.indexOf(":");
        key = line.substring(0, i).trim().toLowerCase();
        val = line.substring(i + 1).trim();
        if (!key || parsed[key] && ignoreDuplicateOf[key]) {
          return;
        }
        if (key === "set-cookie") {
          if (parsed[key]) {
            parsed[key].push(val);
          } else {
            parsed[key] = [val];
          }
        } else {
          parsed[key] = parsed[key] ? parsed[key] + ", " + val : val;
        }
      });
      return parsed;
    };
    var $internals = /* @__PURE__ */ Symbol("internals");
    var isValidHeaderValue = (value) => !/[\r\n]/.test(value);
    function assertValidHeaderValue(value, header) {
      if (value === false || value == null) {
        return;
      }
      if (utils$1.isArray(value)) {
        value.forEach((v) => assertValidHeaderValue(v, header));
        return;
      }
      if (!isValidHeaderValue(String(value))) {
        throw new Error(`Invalid character in header content ["${header}"]`);
      }
    }
    function normalizeHeader(header) {
      return header && String(header).trim().toLowerCase();
    }
    function stripTrailingCRLF(str) {
      let end = str.length;
      while (end > 0) {
        const charCode = str.charCodeAt(end - 1);
        if (charCode !== 10 && charCode !== 13) {
          break;
        }
        end -= 1;
      }
      return end === str.length ? str : str.slice(0, end);
    }
    function normalizeValue(value) {
      if (value === false || value == null) {
        return value;
      }
      return utils$1.isArray(value) ? value.map(normalizeValue) : stripTrailingCRLF(String(value));
    }
    function parseTokens(str) {
      const tokens = /* @__PURE__ */ Object.create(null);
      const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
      let match;
      while (match = tokensRE.exec(str)) {
        tokens[match[1]] = match[2];
      }
      return tokens;
    }
    var isValidHeaderName = (str) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(str.trim());
    function matchHeaderValue(context, value, header, filter, isHeaderNameFilter) {
      if (utils$1.isFunction(filter)) {
        return filter.call(this, value, header);
      }
      if (isHeaderNameFilter) {
        value = header;
      }
      if (!utils$1.isString(value)) return;
      if (utils$1.isString(filter)) {
        return value.indexOf(filter) !== -1;
      }
      if (utils$1.isRegExp(filter)) {
        return filter.test(value);
      }
    }
    function formatHeader(header) {
      return header.trim().toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
        return char.toUpperCase() + str;
      });
    }
    function buildAccessors(obj, header) {
      const accessorName = utils$1.toCamelCase(" " + header);
      ["get", "set", "has"].forEach((methodName) => {
        Object.defineProperty(obj, methodName + accessorName, {
          value: function(arg1, arg2, arg3) {
            return this[methodName].call(this, header, arg1, arg2, arg3);
          },
          configurable: true
        });
      });
    }
    var AxiosHeaders = class {
      constructor(headers) {
        headers && this.set(headers);
      }
      set(header, valueOrRewrite, rewrite) {
        const self2 = this;
        function setHeader(_value, _header, _rewrite) {
          const lHeader = normalizeHeader(_header);
          if (!lHeader) {
            throw new Error("header name must be a non-empty string");
          }
          const key = utils$1.findKey(self2, lHeader);
          if (!key || self2[key] === void 0 || _rewrite === true || _rewrite === void 0 && self2[key] !== false) {
            assertValidHeaderValue(_value, _header);
            self2[key || _header] = normalizeValue(_value);
          }
        }
        const setHeaders = (headers, _rewrite) => utils$1.forEach(headers, (_value, _header) => setHeader(_value, _header, _rewrite));
        if (utils$1.isPlainObject(header) || header instanceof this.constructor) {
          setHeaders(header, valueOrRewrite);
        } else if (utils$1.isString(header) && (header = header.trim()) && !isValidHeaderName(header)) {
          setHeaders(parseHeaders(header), valueOrRewrite);
        } else if (utils$1.isObject(header) && utils$1.isIterable(header)) {
          let obj = {}, dest, key;
          for (const entry of header) {
            if (!utils$1.isArray(entry)) {
              throw TypeError("Object iterator must return a key-value pair");
            }
            obj[key = entry[0]] = (dest = obj[key]) ? utils$1.isArray(dest) ? [...dest, entry[1]] : [dest, entry[1]] : entry[1];
          }
          setHeaders(obj, valueOrRewrite);
        } else {
          header != null && setHeader(valueOrRewrite, header, rewrite);
        }
        return this;
      }
      get(header, parser) {
        header = normalizeHeader(header);
        if (header) {
          const key = utils$1.findKey(this, header);
          if (key) {
            const value = this[key];
            if (!parser) {
              return value;
            }
            if (parser === true) {
              return parseTokens(value);
            }
            if (utils$1.isFunction(parser)) {
              return parser.call(this, value, key);
            }
            if (utils$1.isRegExp(parser)) {
              return parser.exec(value);
            }
            throw new TypeError("parser must be boolean|regexp|function");
          }
        }
      }
      has(header, matcher) {
        header = normalizeHeader(header);
        if (header) {
          const key = utils$1.findKey(this, header);
          return !!(key && this[key] !== void 0 && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
        }
        return false;
      }
      delete(header, matcher) {
        const self2 = this;
        let deleted = false;
        function deleteHeader(_header) {
          _header = normalizeHeader(_header);
          if (_header) {
            const key = utils$1.findKey(self2, _header);
            if (key && (!matcher || matchHeaderValue(self2, self2[key], key, matcher))) {
              delete self2[key];
              deleted = true;
            }
          }
        }
        if (utils$1.isArray(header)) {
          header.forEach(deleteHeader);
        } else {
          deleteHeader(header);
        }
        return deleted;
      }
      clear(matcher) {
        const keys = Object.keys(this);
        let i = keys.length;
        let deleted = false;
        while (i--) {
          const key = keys[i];
          if (!matcher || matchHeaderValue(this, this[key], key, matcher, true)) {
            delete this[key];
            deleted = true;
          }
        }
        return deleted;
      }
      normalize(format) {
        const self2 = this;
        const headers = {};
        utils$1.forEach(this, (value, header) => {
          const key = utils$1.findKey(headers, header);
          if (key) {
            self2[key] = normalizeValue(value);
            delete self2[header];
            return;
          }
          const normalized = format ? formatHeader(header) : String(header).trim();
          if (normalized !== header) {
            delete self2[header];
          }
          self2[normalized] = normalizeValue(value);
          headers[normalized] = true;
        });
        return this;
      }
      concat(...targets) {
        return this.constructor.concat(this, ...targets);
      }
      toJSON(asStrings) {
        const obj = /* @__PURE__ */ Object.create(null);
        utils$1.forEach(this, (value, header) => {
          value != null && value !== false && (obj[header] = asStrings && utils$1.isArray(value) ? value.join(", ") : value);
        });
        return obj;
      }
      [Symbol.iterator]() {
        return Object.entries(this.toJSON())[Symbol.iterator]();
      }
      toString() {
        return Object.entries(this.toJSON()).map(([header, value]) => header + ": " + value).join("\n");
      }
      getSetCookie() {
        return this.get("set-cookie") || [];
      }
      get [Symbol.toStringTag]() {
        return "AxiosHeaders";
      }
      static from(thing) {
        return thing instanceof this ? thing : new this(thing);
      }
      static concat(first, ...targets) {
        const computed = new this(first);
        targets.forEach((target) => computed.set(target));
        return computed;
      }
      static accessor(header) {
        const internals = this[$internals] = this[$internals] = {
          accessors: {}
        };
        const accessors = internals.accessors;
        const prototype2 = this.prototype;
        function defineAccessor(_header) {
          const lHeader = normalizeHeader(_header);
          if (!accessors[lHeader]) {
            buildAccessors(prototype2, _header);
            accessors[lHeader] = true;
          }
        }
        utils$1.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);
        return this;
      }
    };
    AxiosHeaders.accessor(["Content-Type", "Content-Length", "Accept", "Accept-Encoding", "User-Agent", "Authorization"]);
    utils$1.reduceDescriptors(AxiosHeaders.prototype, ({
      value
    }, key) => {
      let mapped = key[0].toUpperCase() + key.slice(1);
      return {
        get: () => value,
        set(headerValue) {
          this[mapped] = headerValue;
        }
      };
    });
    utils$1.freezeMethods(AxiosHeaders);
    function transformData(fns, response) {
      const config = this || defaults;
      const context = response || config;
      const headers = AxiosHeaders.from(context.headers);
      let data = context.data;
      utils$1.forEach(fns, function transform(fn) {
        data = fn.call(config, data, headers.normalize(), response ? response.status : void 0);
      });
      headers.normalize();
      return data;
    }
    function isCancel(value) {
      return !!(value && value.__CANCEL__);
    }
    var CanceledError = class extends AxiosError {
      /**
       * A `CanceledError` is an object that is thrown when an operation is canceled.
       *
       * @param {string=} message The message.
       * @param {Object=} config The config.
       * @param {Object=} request The request.
       *
       * @returns {CanceledError} The created error.
       */
      constructor(message, config, request) {
        super(message == null ? "canceled" : message, AxiosError.ERR_CANCELED, config, request);
        this.name = "CanceledError";
        this.__CANCEL__ = true;
      }
    };
    function settle(resolve, reject, response) {
      const validateStatus = response.config.validateStatus;
      if (!response.status || !validateStatus || validateStatus(response.status)) {
        resolve(response);
      } else {
        reject(new AxiosError("Request failed with status code " + response.status, [AxiosError.ERR_BAD_REQUEST, AxiosError.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4], response.config, response.request, response));
      }
    }
    function isAbsoluteURL(url2) {
      if (typeof url2 !== "string") {
        return false;
      }
      return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url2);
    }
    function combineURLs(baseURL, relativeURL) {
      return relativeURL ? baseURL.replace(/\/?\/$/, "") + "/" + relativeURL.replace(/^\/+/, "") : baseURL;
    }
    function buildFullPath(baseURL, requestedURL, allowAbsoluteUrls) {
      let isRelativeUrl = !isAbsoluteURL(requestedURL);
      if (baseURL && (isRelativeUrl || allowAbsoluteUrls == false)) {
        return combineURLs(baseURL, requestedURL);
      }
      return requestedURL;
    }
    var DEFAULT_PORTS$1 = {
      ftp: 21,
      gopher: 70,
      http: 80,
      https: 443,
      ws: 80,
      wss: 443
    };
    function parseUrl(urlString) {
      try {
        return new URL(urlString);
      } catch {
        return null;
      }
    }
    function getProxyForUrl(url2) {
      var parsedUrl = (typeof url2 === "string" ? parseUrl(url2) : url2) || {};
      var proto = parsedUrl.protocol;
      var hostname = parsedUrl.host;
      var port = parsedUrl.port;
      if (typeof hostname !== "string" || !hostname || typeof proto !== "string") {
        return "";
      }
      proto = proto.split(":", 1)[0];
      hostname = hostname.replace(/:\d*$/, "");
      port = parseInt(port) || DEFAULT_PORTS$1[proto] || 0;
      if (!shouldProxy(hostname, port)) {
        return "";
      }
      var proxy = getEnv(proto + "_proxy") || getEnv("all_proxy");
      if (proxy && proxy.indexOf("://") === -1) {
        proxy = proto + "://" + proxy;
      }
      return proxy;
    }
    function shouldProxy(hostname, port) {
      var NO_PROXY = getEnv("no_proxy").toLowerCase();
      if (!NO_PROXY) {
        return true;
      }
      if (NO_PROXY === "*") {
        return false;
      }
      return NO_PROXY.split(/[,\s]/).every(function(proxy) {
        if (!proxy) {
          return true;
        }
        var parsedProxy = proxy.match(/^(.+):(\d+)$/);
        var parsedProxyHostname = parsedProxy ? parsedProxy[1] : proxy;
        var parsedProxyPort = parsedProxy ? parseInt(parsedProxy[2]) : 0;
        if (parsedProxyPort && parsedProxyPort !== port) {
          return true;
        }
        if (!/^[.*]/.test(parsedProxyHostname)) {
          return hostname !== parsedProxyHostname;
        }
        if (parsedProxyHostname.charAt(0) === "*") {
          parsedProxyHostname = parsedProxyHostname.slice(1);
        }
        return !hostname.endsWith(parsedProxyHostname);
      });
    }
    function getEnv(key) {
      return process.env[key.toLowerCase()] || process.env[key.toUpperCase()] || "";
    }
    var VERSION = "1.15.0";
    function parseProtocol(url2) {
      const match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url2);
      return match && match[1] || "";
    }
    var DATA_URL_PATTERN = /^(?:([^;]+);)?(?:[^;]+;)?(base64|),([\s\S]*)$/;
    function fromDataURI(uri, asBlob, options) {
      const _Blob = options && options.Blob || platform.classes.Blob;
      const protocol = parseProtocol(uri);
      if (asBlob === void 0 && _Blob) {
        asBlob = true;
      }
      if (protocol === "data") {
        uri = protocol.length ? uri.slice(protocol.length + 1) : uri;
        const match = DATA_URL_PATTERN.exec(uri);
        if (!match) {
          throw new AxiosError("Invalid URL", AxiosError.ERR_INVALID_URL);
        }
        const mime = match[1];
        const isBase64 = match[2];
        const body = match[3];
        const buffer = Buffer.from(decodeURIComponent(body), isBase64 ? "base64" : "utf8");
        if (asBlob) {
          if (!_Blob) {
            throw new AxiosError("Blob is not supported", AxiosError.ERR_NOT_SUPPORT);
          }
          return new _Blob([buffer], {
            type: mime
          });
        }
        return buffer;
      }
      throw new AxiosError("Unsupported protocol " + protocol, AxiosError.ERR_NOT_SUPPORT);
    }
    var kInternals = /* @__PURE__ */ Symbol("internals");
    var AxiosTransformStream = class extends stream.Transform {
      constructor(options) {
        options = utils$1.toFlatObject(options, {
          maxRate: 0,
          chunkSize: 64 * 1024,
          minChunkSize: 100,
          timeWindow: 500,
          ticksRate: 2,
          samplesCount: 15
        }, null, (prop, source) => {
          return !utils$1.isUndefined(source[prop]);
        });
        super({
          readableHighWaterMark: options.chunkSize
        });
        const internals = this[kInternals] = {
          timeWindow: options.timeWindow,
          chunkSize: options.chunkSize,
          maxRate: options.maxRate,
          minChunkSize: options.minChunkSize,
          bytesSeen: 0,
          isCaptured: false,
          notifiedBytesLoaded: 0,
          ts: Date.now(),
          bytes: 0,
          onReadCallback: null
        };
        this.on("newListener", (event) => {
          if (event === "progress") {
            if (!internals.isCaptured) {
              internals.isCaptured = true;
            }
          }
        });
      }
      _read(size) {
        const internals = this[kInternals];
        if (internals.onReadCallback) {
          internals.onReadCallback();
        }
        return super._read(size);
      }
      _transform(chunk, encoding, callback) {
        const internals = this[kInternals];
        const maxRate = internals.maxRate;
        const readableHighWaterMark = this.readableHighWaterMark;
        const timeWindow = internals.timeWindow;
        const divider = 1e3 / timeWindow;
        const bytesThreshold = maxRate / divider;
        const minChunkSize = internals.minChunkSize !== false ? Math.max(internals.minChunkSize, bytesThreshold * 0.01) : 0;
        const pushChunk = (_chunk, _callback) => {
          const bytes = Buffer.byteLength(_chunk);
          internals.bytesSeen += bytes;
          internals.bytes += bytes;
          internals.isCaptured && this.emit("progress", internals.bytesSeen);
          if (this.push(_chunk)) {
            process.nextTick(_callback);
          } else {
            internals.onReadCallback = () => {
              internals.onReadCallback = null;
              process.nextTick(_callback);
            };
          }
        };
        const transformChunk = (_chunk, _callback) => {
          const chunkSize = Buffer.byteLength(_chunk);
          let chunkRemainder = null;
          let maxChunkSize = readableHighWaterMark;
          let bytesLeft;
          let passed = 0;
          if (maxRate) {
            const now = Date.now();
            if (!internals.ts || (passed = now - internals.ts) >= timeWindow) {
              internals.ts = now;
              bytesLeft = bytesThreshold - internals.bytes;
              internals.bytes = bytesLeft < 0 ? -bytesLeft : 0;
              passed = 0;
            }
            bytesLeft = bytesThreshold - internals.bytes;
          }
          if (maxRate) {
            if (bytesLeft <= 0) {
              return setTimeout(() => {
                _callback(null, _chunk);
              }, timeWindow - passed);
            }
            if (bytesLeft < maxChunkSize) {
              maxChunkSize = bytesLeft;
            }
          }
          if (maxChunkSize && chunkSize > maxChunkSize && chunkSize - maxChunkSize > minChunkSize) {
            chunkRemainder = _chunk.subarray(maxChunkSize);
            _chunk = _chunk.subarray(0, maxChunkSize);
          }
          pushChunk(_chunk, chunkRemainder ? () => {
            process.nextTick(_callback, null, chunkRemainder);
          } : _callback);
        };
        transformChunk(chunk, function transformNextChunk(err, _chunk) {
          if (err) {
            return callback(err);
          }
          if (_chunk) {
            transformChunk(_chunk, transformNextChunk);
          } else {
            callback(null);
          }
        });
      }
    };
    var {
      asyncIterator
    } = Symbol;
    var readBlob = async function* (blob) {
      if (blob.stream) {
        yield* blob.stream();
      } else if (blob.arrayBuffer) {
        yield await blob.arrayBuffer();
      } else if (blob[asyncIterator]) {
        yield* blob[asyncIterator]();
      } else {
        yield blob;
      }
    };
    var BOUNDARY_ALPHABET = platform.ALPHABET.ALPHA_DIGIT + "-_";
    var textEncoder = typeof TextEncoder === "function" ? new TextEncoder() : new util.TextEncoder();
    var CRLF = "\r\n";
    var CRLF_BYTES = textEncoder.encode(CRLF);
    var CRLF_BYTES_COUNT = 2;
    var FormDataPart = class {
      constructor(name, value) {
        const {
          escapeName
        } = this.constructor;
        const isStringValue = utils$1.isString(value);
        let headers = `Content-Disposition: form-data; name="${escapeName(name)}"${!isStringValue && value.name ? `; filename="${escapeName(value.name)}"` : ""}${CRLF}`;
        if (isStringValue) {
          value = textEncoder.encode(String(value).replace(/\r?\n|\r\n?/g, CRLF));
        } else {
          headers += `Content-Type: ${value.type || "application/octet-stream"}${CRLF}`;
        }
        this.headers = textEncoder.encode(headers + CRLF);
        this.contentLength = isStringValue ? value.byteLength : value.size;
        this.size = this.headers.byteLength + this.contentLength + CRLF_BYTES_COUNT;
        this.name = name;
        this.value = value;
      }
      async *encode() {
        yield this.headers;
        const {
          value
        } = this;
        if (utils$1.isTypedArray(value)) {
          yield value;
        } else {
          yield* readBlob(value);
        }
        yield CRLF_BYTES;
      }
      static escapeName(name) {
        return String(name).replace(/[\r\n"]/g, (match) => ({
          "\r": "%0D",
          "\n": "%0A",
          '"': "%22"
        })[match]);
      }
    };
    var formDataToStream = (form, headersHandler, options) => {
      const {
        tag = "form-data-boundary",
        size = 25,
        boundary = tag + "-" + platform.generateString(size, BOUNDARY_ALPHABET)
      } = options || {};
      if (!utils$1.isFormData(form)) {
        throw TypeError("FormData instance required");
      }
      if (boundary.length < 1 || boundary.length > 70) {
        throw Error("boundary must be 10-70 characters long");
      }
      const boundaryBytes = textEncoder.encode("--" + boundary + CRLF);
      const footerBytes = textEncoder.encode("--" + boundary + "--" + CRLF);
      let contentLength = footerBytes.byteLength;
      const parts = Array.from(form.entries()).map(([name, value]) => {
        const part = new FormDataPart(name, value);
        contentLength += part.size;
        return part;
      });
      contentLength += boundaryBytes.byteLength * parts.length;
      contentLength = utils$1.toFiniteNumber(contentLength);
      const computedHeaders = {
        "Content-Type": `multipart/form-data; boundary=${boundary}`
      };
      if (Number.isFinite(contentLength)) {
        computedHeaders["Content-Length"] = contentLength;
      }
      headersHandler && headersHandler(computedHeaders);
      return stream.Readable.from((async function* () {
        for (const part of parts) {
          yield boundaryBytes;
          yield* part.encode();
        }
        yield footerBytes;
      })());
    };
    var ZlibHeaderTransformStream = class extends stream.Transform {
      __transform(chunk, encoding, callback) {
        this.push(chunk);
        callback();
      }
      _transform(chunk, encoding, callback) {
        if (chunk.length !== 0) {
          this._transform = this.__transform;
          if (chunk[0] !== 120) {
            const header = Buffer.alloc(2);
            header[0] = 120;
            header[1] = 156;
            this.push(header, encoding);
          }
        }
        this.__transform(chunk, encoding, callback);
      }
    };
    var callbackify = (fn, reducer) => {
      return utils$1.isAsyncFn(fn) ? function(...args) {
        const cb = args.pop();
        fn.apply(this, args).then((value) => {
          try {
            reducer ? cb(null, ...reducer(value)) : cb(null, value);
          } catch (err) {
            cb(err);
          }
        }, cb);
      } : fn;
    };
    var DEFAULT_PORTS = {
      http: 80,
      https: 443,
      ws: 80,
      wss: 443,
      ftp: 21
    };
    var parseNoProxyEntry = (entry) => {
      let entryHost = entry;
      let entryPort = 0;
      if (entryHost.charAt(0) === "[") {
        const bracketIndex = entryHost.indexOf("]");
        if (bracketIndex !== -1) {
          const host = entryHost.slice(1, bracketIndex);
          const rest = entryHost.slice(bracketIndex + 1);
          if (rest.charAt(0) === ":" && /^\d+$/.test(rest.slice(1))) {
            entryPort = Number.parseInt(rest.slice(1), 10);
          }
          return [host, entryPort];
        }
      }
      const firstColon = entryHost.indexOf(":");
      const lastColon = entryHost.lastIndexOf(":");
      if (firstColon !== -1 && firstColon === lastColon && /^\d+$/.test(entryHost.slice(lastColon + 1))) {
        entryPort = Number.parseInt(entryHost.slice(lastColon + 1), 10);
        entryHost = entryHost.slice(0, lastColon);
      }
      return [entryHost, entryPort];
    };
    var normalizeNoProxyHost = (hostname) => {
      if (!hostname) {
        return hostname;
      }
      if (hostname.charAt(0) === "[" && hostname.charAt(hostname.length - 1) === "]") {
        hostname = hostname.slice(1, -1);
      }
      return hostname.replace(/\.+$/, "");
    };
    function shouldBypassProxy(location) {
      let parsed;
      try {
        parsed = new URL(location);
      } catch (_err) {
        return false;
      }
      const noProxy = (process.env.no_proxy || process.env.NO_PROXY || "").toLowerCase();
      if (!noProxy) {
        return false;
      }
      if (noProxy === "*") {
        return true;
      }
      const port = Number.parseInt(parsed.port, 10) || DEFAULT_PORTS[parsed.protocol.split(":", 1)[0]] || 0;
      const hostname = normalizeNoProxyHost(parsed.hostname.toLowerCase());
      return noProxy.split(/[\s,]+/).some((entry) => {
        if (!entry) {
          return false;
        }
        let [entryHost, entryPort] = parseNoProxyEntry(entry);
        entryHost = normalizeNoProxyHost(entryHost);
        if (!entryHost) {
          return false;
        }
        if (entryPort && entryPort !== port) {
          return false;
        }
        if (entryHost.charAt(0) === "*") {
          entryHost = entryHost.slice(1);
        }
        if (entryHost.charAt(0) === ".") {
          return hostname.endsWith(entryHost);
        }
        return hostname === entryHost;
      });
    }
    function speedometer(samplesCount, min) {
      samplesCount = samplesCount || 10;
      const bytes = new Array(samplesCount);
      const timestamps = new Array(samplesCount);
      let head = 0;
      let tail = 0;
      let firstSampleTS;
      min = min !== void 0 ? min : 1e3;
      return function push(chunkLength) {
        const now = Date.now();
        const startedAt = timestamps[tail];
        if (!firstSampleTS) {
          firstSampleTS = now;
        }
        bytes[head] = chunkLength;
        timestamps[head] = now;
        let i = tail;
        let bytesCount = 0;
        while (i !== head) {
          bytesCount += bytes[i++];
          i = i % samplesCount;
        }
        head = (head + 1) % samplesCount;
        if (head === tail) {
          tail = (tail + 1) % samplesCount;
        }
        if (now - firstSampleTS < min) {
          return;
        }
        const passed = startedAt && now - startedAt;
        return passed ? Math.round(bytesCount * 1e3 / passed) : void 0;
      };
    }
    function throttle(fn, freq) {
      let timestamp = 0;
      let threshold = 1e3 / freq;
      let lastArgs;
      let timer;
      const invoke = (args, now = Date.now()) => {
        timestamp = now;
        lastArgs = null;
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        fn(...args);
      };
      const throttled = (...args) => {
        const now = Date.now();
        const passed = now - timestamp;
        if (passed >= threshold) {
          invoke(args, now);
        } else {
          lastArgs = args;
          if (!timer) {
            timer = setTimeout(() => {
              timer = null;
              invoke(lastArgs);
            }, threshold - passed);
          }
        }
      };
      const flush = () => lastArgs && invoke(lastArgs);
      return [throttled, flush];
    }
    var progressEventReducer = (listener, isDownloadStream, freq = 3) => {
      let bytesNotified = 0;
      const _speedometer = speedometer(50, 250);
      return throttle((e) => {
        const loaded = e.loaded;
        const total = e.lengthComputable ? e.total : void 0;
        const progressBytes = loaded - bytesNotified;
        const rate = _speedometer(progressBytes);
        const inRange = loaded <= total;
        bytesNotified = loaded;
        const data = {
          loaded,
          total,
          progress: total ? loaded / total : void 0,
          bytes: progressBytes,
          rate: rate ? rate : void 0,
          estimated: rate && total && inRange ? (total - loaded) / rate : void 0,
          event: e,
          lengthComputable: total != null,
          [isDownloadStream ? "download" : "upload"]: true
        };
        listener(data);
      }, freq);
    };
    var progressEventDecorator = (total, throttled) => {
      const lengthComputable = total != null;
      return [(loaded) => throttled[0]({
        lengthComputable,
        total,
        loaded
      }), throttled[1]];
    };
    var asyncDecorator = (fn) => (...args) => utils$1.asap(() => fn(...args));
    function estimateDataURLDecodedBytes(url2) {
      if (!url2 || typeof url2 !== "string") return 0;
      if (!url2.startsWith("data:")) return 0;
      const comma = url2.indexOf(",");
      if (comma < 0) return 0;
      const meta = url2.slice(5, comma);
      const body = url2.slice(comma + 1);
      const isBase64 = /;base64/i.test(meta);
      if (isBase64) {
        let effectiveLen = body.length;
        const len = body.length;
        for (let i = 0; i < len; i++) {
          if (body.charCodeAt(i) === 37 && i + 2 < len) {
            const a = body.charCodeAt(i + 1);
            const b = body.charCodeAt(i + 2);
            const isHex = (a >= 48 && a <= 57 || a >= 65 && a <= 70 || a >= 97 && a <= 102) && (b >= 48 && b <= 57 || b >= 65 && b <= 70 || b >= 97 && b <= 102);
            if (isHex) {
              effectiveLen -= 2;
              i += 2;
            }
          }
        }
        let pad = 0;
        let idx = len - 1;
        const tailIsPct3D = (j) => j >= 2 && body.charCodeAt(j - 2) === 37 && // '%'
        body.charCodeAt(j - 1) === 51 && // '3'
        (body.charCodeAt(j) === 68 || body.charCodeAt(j) === 100);
        if (idx >= 0) {
          if (body.charCodeAt(idx) === 61) {
            pad++;
            idx--;
          } else if (tailIsPct3D(idx)) {
            pad++;
            idx -= 3;
          }
        }
        if (pad === 1 && idx >= 0) {
          if (body.charCodeAt(idx) === 61) {
            pad++;
          } else if (tailIsPct3D(idx)) {
            pad++;
          }
        }
        const groups = Math.floor(effectiveLen / 4);
        const bytes = groups * 3 - (pad || 0);
        return bytes > 0 ? bytes : 0;
      }
      return Buffer.byteLength(body, "utf8");
    }
    var zlibOptions = {
      flush: zlib.constants.Z_SYNC_FLUSH,
      finishFlush: zlib.constants.Z_SYNC_FLUSH
    };
    var brotliOptions = {
      flush: zlib.constants.BROTLI_OPERATION_FLUSH,
      finishFlush: zlib.constants.BROTLI_OPERATION_FLUSH
    };
    var isBrotliSupported = utils$1.isFunction(zlib.createBrotliDecompress);
    var {
      http: httpFollow,
      https: httpsFollow
    } = followRedirects;
    var isHttps = /https:?/;
    var supportedProtocols = platform.protocols.map((protocol) => {
      return protocol + ":";
    });
    var flushOnFinish = (stream2, [throttled, flush]) => {
      stream2.on("end", flush).on("error", flush);
      return throttled;
    };
    var Http2Sessions = class {
      constructor() {
        this.sessions = /* @__PURE__ */ Object.create(null);
      }
      getSession(authority, options) {
        options = Object.assign({
          sessionTimeout: 1e3
        }, options);
        let authoritySessions = this.sessions[authority];
        if (authoritySessions) {
          let len = authoritySessions.length;
          for (let i = 0; i < len; i++) {
            const [sessionHandle, sessionOptions] = authoritySessions[i];
            if (!sessionHandle.destroyed && !sessionHandle.closed && util.isDeepStrictEqual(sessionOptions, options)) {
              return sessionHandle;
            }
          }
        }
        const session = http2.connect(authority, options);
        let removed;
        const removeSession = () => {
          if (removed) {
            return;
          }
          removed = true;
          let entries = authoritySessions, len = entries.length, i = len;
          while (i--) {
            if (entries[i][0] === session) {
              if (len === 1) {
                delete this.sessions[authority];
              } else {
                entries.splice(i, 1);
              }
              if (!session.closed) {
                session.close();
              }
              return;
            }
          }
        };
        const originalRequestFn = session.request;
        const {
          sessionTimeout
        } = options;
        if (sessionTimeout != null) {
          let timer;
          let streamsCount = 0;
          session.request = function() {
            const stream2 = originalRequestFn.apply(this, arguments);
            streamsCount++;
            if (timer) {
              clearTimeout(timer);
              timer = null;
            }
            stream2.once("close", () => {
              if (!--streamsCount) {
                timer = setTimeout(() => {
                  timer = null;
                  removeSession();
                }, sessionTimeout);
              }
            });
            return stream2;
          };
        }
        session.once("close", removeSession);
        let entry = [session, options];
        authoritySessions ? authoritySessions.push(entry) : authoritySessions = this.sessions[authority] = [entry];
        return session;
      }
    };
    var http2Sessions = new Http2Sessions();
    function dispatchBeforeRedirect(options, responseDetails) {
      if (options.beforeRedirects.proxy) {
        options.beforeRedirects.proxy(options);
      }
      if (options.beforeRedirects.config) {
        options.beforeRedirects.config(options, responseDetails);
      }
    }
    function setProxy(options, configProxy, location) {
      let proxy = configProxy;
      if (!proxy && proxy !== false) {
        const proxyUrl = getProxyForUrl(location);
        if (proxyUrl) {
          if (!shouldBypassProxy(location)) {
            proxy = new URL(proxyUrl);
          }
        }
      }
      if (proxy) {
        if (proxy.username) {
          proxy.auth = (proxy.username || "") + ":" + (proxy.password || "");
        }
        if (proxy.auth) {
          const validProxyAuth = Boolean(proxy.auth.username || proxy.auth.password);
          if (validProxyAuth) {
            proxy.auth = (proxy.auth.username || "") + ":" + (proxy.auth.password || "");
          } else if (typeof proxy.auth === "object") {
            throw new AxiosError("Invalid proxy authorization", AxiosError.ERR_BAD_OPTION, {
              proxy
            });
          }
          const base64 = Buffer.from(proxy.auth, "utf8").toString("base64");
          options.headers["Proxy-Authorization"] = "Basic " + base64;
        }
        options.headers.host = options.hostname + (options.port ? ":" + options.port : "");
        const proxyHost = proxy.hostname || proxy.host;
        options.hostname = proxyHost;
        options.host = proxyHost;
        options.port = proxy.port;
        options.path = location;
        if (proxy.protocol) {
          options.protocol = proxy.protocol.includes(":") ? proxy.protocol : `${proxy.protocol}:`;
        }
      }
      options.beforeRedirects.proxy = function beforeRedirect(redirectOptions) {
        setProxy(redirectOptions, configProxy, redirectOptions.href);
      };
    }
    var isHttpAdapterSupported = typeof process !== "undefined" && utils$1.kindOf(process) === "process";
    var wrapAsync = (asyncExecutor) => {
      return new Promise((resolve, reject) => {
        let onDone;
        let isDone;
        const done = (value, isRejected) => {
          if (isDone) return;
          isDone = true;
          onDone && onDone(value, isRejected);
        };
        const _resolve = (value) => {
          done(value);
          resolve(value);
        };
        const _reject = (reason) => {
          done(reason, true);
          reject(reason);
        };
        asyncExecutor(_resolve, _reject, (onDoneHandler) => onDone = onDoneHandler).catch(_reject);
      });
    };
    var resolveFamily = ({
      address,
      family
    }) => {
      if (!utils$1.isString(address)) {
        throw TypeError("address must be a string");
      }
      return {
        address,
        family: family || (address.indexOf(".") < 0 ? 6 : 4)
      };
    };
    var buildAddressEntry = (address, family) => resolveFamily(utils$1.isObject(address) ? address : {
      address,
      family
    });
    var http2Transport = {
      request(options, cb) {
        const authority = options.protocol + "//" + options.hostname + ":" + (options.port || (options.protocol === "https:" ? 443 : 80));
        const {
          http2Options,
          headers
        } = options;
        const session = http2Sessions.getSession(authority, http2Options);
        const {
          HTTP2_HEADER_SCHEME,
          HTTP2_HEADER_METHOD,
          HTTP2_HEADER_PATH,
          HTTP2_HEADER_STATUS
        } = http2.constants;
        const http2Headers = {
          [HTTP2_HEADER_SCHEME]: options.protocol.replace(":", ""),
          [HTTP2_HEADER_METHOD]: options.method,
          [HTTP2_HEADER_PATH]: options.path
        };
        utils$1.forEach(headers, (header, name) => {
          name.charAt(0) !== ":" && (http2Headers[name] = header);
        });
        const req = session.request(http2Headers);
        req.once("response", (responseHeaders) => {
          const response = req;
          responseHeaders = Object.assign({}, responseHeaders);
          const status = responseHeaders[HTTP2_HEADER_STATUS];
          delete responseHeaders[HTTP2_HEADER_STATUS];
          response.headers = responseHeaders;
          response.statusCode = +status;
          cb(response);
        });
        return req;
      }
    };
    var httpAdapter = isHttpAdapterSupported && function httpAdapter2(config) {
      return wrapAsync(async function dispatchHttpRequest(resolve, reject, onDone) {
        let {
          data,
          lookup,
          family,
          httpVersion = 1,
          http2Options
        } = config;
        const {
          responseType,
          responseEncoding
        } = config;
        const method = config.method.toUpperCase();
        let isDone;
        let rejected = false;
        let req;
        httpVersion = +httpVersion;
        if (Number.isNaN(httpVersion)) {
          throw TypeError(`Invalid protocol version: '${config.httpVersion}' is not a number`);
        }
        if (httpVersion !== 1 && httpVersion !== 2) {
          throw TypeError(`Unsupported protocol version '${httpVersion}'`);
        }
        const isHttp2 = httpVersion === 2;
        if (lookup) {
          const _lookup = callbackify(lookup, (value) => utils$1.isArray(value) ? value : [value]);
          lookup = (hostname, opt, cb) => {
            _lookup(hostname, opt, (err, arg0, arg1) => {
              if (err) {
                return cb(err);
              }
              const addresses = utils$1.isArray(arg0) ? arg0.map((addr) => buildAddressEntry(addr)) : [buildAddressEntry(arg0, arg1)];
              opt.all ? cb(err, addresses) : cb(err, addresses[0].address, addresses[0].family);
            });
          };
        }
        const abortEmitter = new events.EventEmitter();
        function abort(reason) {
          try {
            abortEmitter.emit("abort", !reason || reason.type ? new CanceledError(null, config, req) : reason);
          } catch (err) {
            console.warn("emit error", err);
          }
        }
        abortEmitter.once("abort", reject);
        const onFinished = () => {
          if (config.cancelToken) {
            config.cancelToken.unsubscribe(abort);
          }
          if (config.signal) {
            config.signal.removeEventListener("abort", abort);
          }
          abortEmitter.removeAllListeners();
        };
        if (config.cancelToken || config.signal) {
          config.cancelToken && config.cancelToken.subscribe(abort);
          if (config.signal) {
            config.signal.aborted ? abort() : config.signal.addEventListener("abort", abort);
          }
        }
        onDone((response, isRejected) => {
          isDone = true;
          if (isRejected) {
            rejected = true;
            onFinished();
            return;
          }
          const {
            data: data2
          } = response;
          if (data2 instanceof stream.Readable || data2 instanceof stream.Duplex) {
            const offListeners = stream.finished(data2, () => {
              offListeners();
              onFinished();
            });
          } else {
            onFinished();
          }
        });
        const fullPath = buildFullPath(config.baseURL, config.url, config.allowAbsoluteUrls);
        const parsed = new URL(fullPath, platform.hasBrowserEnv ? platform.origin : void 0);
        const protocol = parsed.protocol || supportedProtocols[0];
        if (protocol === "data:") {
          if (config.maxContentLength > -1) {
            const dataUrl = String(config.url || fullPath || "");
            const estimated = estimateDataURLDecodedBytes(dataUrl);
            if (estimated > config.maxContentLength) {
              return reject(new AxiosError("maxContentLength size of " + config.maxContentLength + " exceeded", AxiosError.ERR_BAD_RESPONSE, config));
            }
          }
          let convertedData;
          if (method !== "GET") {
            return settle(resolve, reject, {
              status: 405,
              statusText: "method not allowed",
              headers: {},
              config
            });
          }
          try {
            convertedData = fromDataURI(config.url, responseType === "blob", {
              Blob: config.env && config.env.Blob
            });
          } catch (err) {
            throw AxiosError.from(err, AxiosError.ERR_BAD_REQUEST, config);
          }
          if (responseType === "text") {
            convertedData = convertedData.toString(responseEncoding);
            if (!responseEncoding || responseEncoding === "utf8") {
              convertedData = utils$1.stripBOM(convertedData);
            }
          } else if (responseType === "stream") {
            convertedData = stream.Readable.from(convertedData);
          }
          return settle(resolve, reject, {
            data: convertedData,
            status: 200,
            statusText: "OK",
            headers: new AxiosHeaders(),
            config
          });
        }
        if (supportedProtocols.indexOf(protocol) === -1) {
          return reject(new AxiosError("Unsupported protocol " + protocol, AxiosError.ERR_BAD_REQUEST, config));
        }
        const headers = AxiosHeaders.from(config.headers).normalize();
        headers.set("User-Agent", "axios/" + VERSION, false);
        const {
          onUploadProgress,
          onDownloadProgress
        } = config;
        const maxRate = config.maxRate;
        let maxUploadRate = void 0;
        let maxDownloadRate = void 0;
        if (utils$1.isSpecCompliantForm(data)) {
          const userBoundary = headers.getContentType(/boundary=([-_\w\d]{10,70})/i);
          data = formDataToStream(data, (formHeaders) => {
            headers.set(formHeaders);
          }, {
            tag: `axios-${VERSION}-boundary`,
            boundary: userBoundary && userBoundary[1] || void 0
          });
        } else if (utils$1.isFormData(data) && utils$1.isFunction(data.getHeaders)) {
          headers.set(data.getHeaders());
          if (!headers.hasContentLength()) {
            try {
              const knownLength = await util.promisify(data.getLength).call(data);
              Number.isFinite(knownLength) && knownLength >= 0 && headers.setContentLength(knownLength);
            } catch (e) {
            }
          }
        } else if (utils$1.isBlob(data) || utils$1.isFile(data)) {
          data.size && headers.setContentType(data.type || "application/octet-stream");
          headers.setContentLength(data.size || 0);
          data = stream.Readable.from(readBlob(data));
        } else if (data && !utils$1.isStream(data)) {
          if (Buffer.isBuffer(data)) ;
          else if (utils$1.isArrayBuffer(data)) {
            data = Buffer.from(new Uint8Array(data));
          } else if (utils$1.isString(data)) {
            data = Buffer.from(data, "utf-8");
          } else {
            return reject(new AxiosError("Data after transformation must be a string, an ArrayBuffer, a Buffer, or a Stream", AxiosError.ERR_BAD_REQUEST, config));
          }
          headers.setContentLength(data.length, false);
          if (config.maxBodyLength > -1 && data.length > config.maxBodyLength) {
            return reject(new AxiosError("Request body larger than maxBodyLength limit", AxiosError.ERR_BAD_REQUEST, config));
          }
        }
        const contentLength = utils$1.toFiniteNumber(headers.getContentLength());
        if (utils$1.isArray(maxRate)) {
          maxUploadRate = maxRate[0];
          maxDownloadRate = maxRate[1];
        } else {
          maxUploadRate = maxDownloadRate = maxRate;
        }
        if (data && (onUploadProgress || maxUploadRate)) {
          if (!utils$1.isStream(data)) {
            data = stream.Readable.from(data, {
              objectMode: false
            });
          }
          data = stream.pipeline([data, new AxiosTransformStream({
            maxRate: utils$1.toFiniteNumber(maxUploadRate)
          })], utils$1.noop);
          onUploadProgress && data.on("progress", flushOnFinish(data, progressEventDecorator(contentLength, progressEventReducer(asyncDecorator(onUploadProgress), false, 3))));
        }
        let auth = void 0;
        if (config.auth) {
          const username = config.auth.username || "";
          const password = config.auth.password || "";
          auth = username + ":" + password;
        }
        if (!auth && parsed.username) {
          const urlUsername = parsed.username;
          const urlPassword = parsed.password;
          auth = urlUsername + ":" + urlPassword;
        }
        auth && headers.delete("authorization");
        let path;
        try {
          path = buildURL(parsed.pathname + parsed.search, config.params, config.paramsSerializer).replace(/^\?/, "");
        } catch (err) {
          const customErr = new Error(err.message);
          customErr.config = config;
          customErr.url = config.url;
          customErr.exists = true;
          return reject(customErr);
        }
        headers.set("Accept-Encoding", "gzip, compress, deflate" + (isBrotliSupported ? ", br" : ""), false);
        const options = {
          path,
          method,
          headers: headers.toJSON(),
          agents: {
            http: config.httpAgent,
            https: config.httpsAgent
          },
          auth,
          protocol,
          family,
          beforeRedirect: dispatchBeforeRedirect,
          beforeRedirects: {},
          http2Options
        };
        !utils$1.isUndefined(lookup) && (options.lookup = lookup);
        if (config.socketPath) {
          options.socketPath = config.socketPath;
        } else {
          options.hostname = parsed.hostname.startsWith("[") ? parsed.hostname.slice(1, -1) : parsed.hostname;
          options.port = parsed.port;
          setProxy(options, config.proxy, protocol + "//" + parsed.hostname + (parsed.port ? ":" + parsed.port : "") + options.path);
        }
        let transport;
        const isHttpsRequest = isHttps.test(options.protocol);
        options.agent = isHttpsRequest ? config.httpsAgent : config.httpAgent;
        if (isHttp2) {
          transport = http2Transport;
        } else {
          if (config.transport) {
            transport = config.transport;
          } else if (config.maxRedirects === 0) {
            transport = isHttpsRequest ? https : http;
          } else {
            if (config.maxRedirects) {
              options.maxRedirects = config.maxRedirects;
            }
            if (config.beforeRedirect) {
              options.beforeRedirects.config = config.beforeRedirect;
            }
            transport = isHttpsRequest ? httpsFollow : httpFollow;
          }
        }
        if (config.maxBodyLength > -1) {
          options.maxBodyLength = config.maxBodyLength;
        } else {
          options.maxBodyLength = Infinity;
        }
        if (config.insecureHTTPParser) {
          options.insecureHTTPParser = config.insecureHTTPParser;
        }
        req = transport.request(options, function handleResponse(res) {
          if (req.destroyed) return;
          const streams = [res];
          const responseLength = utils$1.toFiniteNumber(res.headers["content-length"]);
          if (onDownloadProgress || maxDownloadRate) {
            const transformStream = new AxiosTransformStream({
              maxRate: utils$1.toFiniteNumber(maxDownloadRate)
            });
            onDownloadProgress && transformStream.on("progress", flushOnFinish(transformStream, progressEventDecorator(responseLength, progressEventReducer(asyncDecorator(onDownloadProgress), true, 3))));
            streams.push(transformStream);
          }
          let responseStream = res;
          const lastRequest = res.req || req;
          if (config.decompress !== false && res.headers["content-encoding"]) {
            if (method === "HEAD" || res.statusCode === 204) {
              delete res.headers["content-encoding"];
            }
            switch ((res.headers["content-encoding"] || "").toLowerCase()) {
              /*eslint default-case:0*/
              case "gzip":
              case "x-gzip":
              case "compress":
              case "x-compress":
                streams.push(zlib.createUnzip(zlibOptions));
                delete res.headers["content-encoding"];
                break;
              case "deflate":
                streams.push(new ZlibHeaderTransformStream());
                streams.push(zlib.createUnzip(zlibOptions));
                delete res.headers["content-encoding"];
                break;
              case "br":
                if (isBrotliSupported) {
                  streams.push(zlib.createBrotliDecompress(brotliOptions));
                  delete res.headers["content-encoding"];
                }
            }
          }
          responseStream = streams.length > 1 ? stream.pipeline(streams, utils$1.noop) : streams[0];
          const response = {
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: new AxiosHeaders(res.headers),
            config,
            request: lastRequest
          };
          if (responseType === "stream") {
            response.data = responseStream;
            settle(resolve, reject, response);
          } else {
            const responseBuffer = [];
            let totalResponseBytes = 0;
            responseStream.on("data", function handleStreamData(chunk) {
              responseBuffer.push(chunk);
              totalResponseBytes += chunk.length;
              if (config.maxContentLength > -1 && totalResponseBytes > config.maxContentLength) {
                rejected = true;
                responseStream.destroy();
                abort(new AxiosError("maxContentLength size of " + config.maxContentLength + " exceeded", AxiosError.ERR_BAD_RESPONSE, config, lastRequest));
              }
            });
            responseStream.on("aborted", function handlerStreamAborted() {
              if (rejected) {
                return;
              }
              const err = new AxiosError("stream has been aborted", AxiosError.ERR_BAD_RESPONSE, config, lastRequest);
              responseStream.destroy(err);
              reject(err);
            });
            responseStream.on("error", function handleStreamError(err) {
              if (req.destroyed) return;
              reject(AxiosError.from(err, null, config, lastRequest));
            });
            responseStream.on("end", function handleStreamEnd() {
              try {
                let responseData = responseBuffer.length === 1 ? responseBuffer[0] : Buffer.concat(responseBuffer);
                if (responseType !== "arraybuffer") {
                  responseData = responseData.toString(responseEncoding);
                  if (!responseEncoding || responseEncoding === "utf8") {
                    responseData = utils$1.stripBOM(responseData);
                  }
                }
                response.data = responseData;
              } catch (err) {
                return reject(AxiosError.from(err, null, config, response.request, response));
              }
              settle(resolve, reject, response);
            });
          }
          abortEmitter.once("abort", (err) => {
            if (!responseStream.destroyed) {
              responseStream.emit("error", err);
              responseStream.destroy();
            }
          });
        });
        abortEmitter.once("abort", (err) => {
          if (req.close) {
            req.close();
          } else {
            req.destroy(err);
          }
        });
        req.on("error", function handleRequestError(err) {
          reject(AxiosError.from(err, null, config, req));
        });
        req.on("socket", function handleRequestSocket(socket) {
          socket.setKeepAlive(true, 1e3 * 60);
        });
        if (config.timeout) {
          const timeout = parseInt(config.timeout, 10);
          if (Number.isNaN(timeout)) {
            abort(new AxiosError("error trying to parse `config.timeout` to int", AxiosError.ERR_BAD_OPTION_VALUE, config, req));
            return;
          }
          req.setTimeout(timeout, function handleRequestTimeout() {
            if (isDone) return;
            let timeoutErrorMessage = config.timeout ? "timeout of " + config.timeout + "ms exceeded" : "timeout exceeded";
            const transitional = config.transitional || transitionalDefaults;
            if (config.timeoutErrorMessage) {
              timeoutErrorMessage = config.timeoutErrorMessage;
            }
            abort(new AxiosError(timeoutErrorMessage, transitional.clarifyTimeoutError ? AxiosError.ETIMEDOUT : AxiosError.ECONNABORTED, config, req));
          });
        } else {
          req.setTimeout(0);
        }
        if (utils$1.isStream(data)) {
          let ended = false;
          let errored = false;
          data.on("end", () => {
            ended = true;
          });
          data.once("error", (err) => {
            errored = true;
            req.destroy(err);
          });
          data.on("close", () => {
            if (!ended && !errored) {
              abort(new CanceledError("Request stream has been aborted", config, req));
            }
          });
          data.pipe(req);
        } else {
          data && req.write(data);
          req.end();
        }
      });
    };
    var isURLSameOrigin = platform.hasStandardBrowserEnv ? /* @__PURE__ */ ((origin2, isMSIE) => (url2) => {
      url2 = new URL(url2, platform.origin);
      return origin2.protocol === url2.protocol && origin2.host === url2.host && (isMSIE || origin2.port === url2.port);
    })(new URL(platform.origin), platform.navigator && /(msie|trident)/i.test(platform.navigator.userAgent)) : () => true;
    var cookies = platform.hasStandardBrowserEnv ? (
      // Standard browser envs support document.cookie
      {
        write(name, value, expires, path, domain, secure, sameSite) {
          if (typeof document === "undefined") return;
          const cookie = [`${name}=${encodeURIComponent(value)}`];
          if (utils$1.isNumber(expires)) {
            cookie.push(`expires=${new Date(expires).toUTCString()}`);
          }
          if (utils$1.isString(path)) {
            cookie.push(`path=${path}`);
          }
          if (utils$1.isString(domain)) {
            cookie.push(`domain=${domain}`);
          }
          if (secure === true) {
            cookie.push("secure");
          }
          if (utils$1.isString(sameSite)) {
            cookie.push(`SameSite=${sameSite}`);
          }
          document.cookie = cookie.join("; ");
        },
        read(name) {
          if (typeof document === "undefined") return null;
          const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
          return match ? decodeURIComponent(match[1]) : null;
        },
        remove(name) {
          this.write(name, "", Date.now() - 864e5, "/");
        }
      }
    ) : (
      // Non-standard browser env (web workers, react-native) lack needed support.
      {
        write() {
        },
        read() {
          return null;
        },
        remove() {
        }
      }
    );
    var headersToObject = (thing) => thing instanceof AxiosHeaders ? {
      ...thing
    } : thing;
    function mergeConfig(config1, config2) {
      config2 = config2 || {};
      const config = {};
      function getMergedValue(target, source, prop, caseless) {
        if (utils$1.isPlainObject(target) && utils$1.isPlainObject(source)) {
          return utils$1.merge.call({
            caseless
          }, target, source);
        } else if (utils$1.isPlainObject(source)) {
          return utils$1.merge({}, source);
        } else if (utils$1.isArray(source)) {
          return source.slice();
        }
        return source;
      }
      function mergeDeepProperties(a, b, prop, caseless) {
        if (!utils$1.isUndefined(b)) {
          return getMergedValue(a, b, prop, caseless);
        } else if (!utils$1.isUndefined(a)) {
          return getMergedValue(void 0, a, prop, caseless);
        }
      }
      function valueFromConfig2(a, b) {
        if (!utils$1.isUndefined(b)) {
          return getMergedValue(void 0, b);
        }
      }
      function defaultToConfig2(a, b) {
        if (!utils$1.isUndefined(b)) {
          return getMergedValue(void 0, b);
        } else if (!utils$1.isUndefined(a)) {
          return getMergedValue(void 0, a);
        }
      }
      function mergeDirectKeys(a, b, prop) {
        if (prop in config2) {
          return getMergedValue(a, b);
        } else if (prop in config1) {
          return getMergedValue(void 0, a);
        }
      }
      const mergeMap = {
        url: valueFromConfig2,
        method: valueFromConfig2,
        data: valueFromConfig2,
        baseURL: defaultToConfig2,
        transformRequest: defaultToConfig2,
        transformResponse: defaultToConfig2,
        paramsSerializer: defaultToConfig2,
        timeout: defaultToConfig2,
        timeoutMessage: defaultToConfig2,
        withCredentials: defaultToConfig2,
        withXSRFToken: defaultToConfig2,
        adapter: defaultToConfig2,
        responseType: defaultToConfig2,
        xsrfCookieName: defaultToConfig2,
        xsrfHeaderName: defaultToConfig2,
        onUploadProgress: defaultToConfig2,
        onDownloadProgress: defaultToConfig2,
        decompress: defaultToConfig2,
        maxContentLength: defaultToConfig2,
        maxBodyLength: defaultToConfig2,
        beforeRedirect: defaultToConfig2,
        transport: defaultToConfig2,
        httpAgent: defaultToConfig2,
        httpsAgent: defaultToConfig2,
        cancelToken: defaultToConfig2,
        socketPath: defaultToConfig2,
        responseEncoding: defaultToConfig2,
        validateStatus: mergeDirectKeys,
        headers: (a, b, prop) => mergeDeepProperties(headersToObject(a), headersToObject(b), prop, true)
      };
      utils$1.forEach(Object.keys({
        ...config1,
        ...config2
      }), function computeConfigValue(prop) {
        if (prop === "__proto__" || prop === "constructor" || prop === "prototype") return;
        const merge2 = utils$1.hasOwnProp(mergeMap, prop) ? mergeMap[prop] : mergeDeepProperties;
        const configValue = merge2(config1[prop], config2[prop], prop);
        utils$1.isUndefined(configValue) && merge2 !== mergeDirectKeys || (config[prop] = configValue);
      });
      return config;
    }
    var resolveConfig = (config) => {
      const newConfig = mergeConfig({}, config);
      let {
        data,
        withXSRFToken,
        xsrfHeaderName,
        xsrfCookieName,
        headers,
        auth
      } = newConfig;
      newConfig.headers = headers = AxiosHeaders.from(headers);
      newConfig.url = buildURL(buildFullPath(newConfig.baseURL, newConfig.url, newConfig.allowAbsoluteUrls), config.params, config.paramsSerializer);
      if (auth) {
        headers.set("Authorization", "Basic " + btoa((auth.username || "") + ":" + (auth.password ? unescape(encodeURIComponent(auth.password)) : "")));
      }
      if (utils$1.isFormData(data)) {
        if (platform.hasStandardBrowserEnv || platform.hasStandardBrowserWebWorkerEnv) {
          headers.setContentType(void 0);
        } else if (utils$1.isFunction(data.getHeaders)) {
          const formHeaders = data.getHeaders();
          const allowedHeaders = ["content-type", "content-length"];
          Object.entries(formHeaders).forEach(([key, val]) => {
            if (allowedHeaders.includes(key.toLowerCase())) {
              headers.set(key, val);
            }
          });
        }
      }
      if (platform.hasStandardBrowserEnv) {
        withXSRFToken && utils$1.isFunction(withXSRFToken) && (withXSRFToken = withXSRFToken(newConfig));
        if (withXSRFToken || withXSRFToken !== false && isURLSameOrigin(newConfig.url)) {
          const xsrfValue = xsrfHeaderName && xsrfCookieName && cookies.read(xsrfCookieName);
          if (xsrfValue) {
            headers.set(xsrfHeaderName, xsrfValue);
          }
        }
      }
      return newConfig;
    };
    var isXHRAdapterSupported = typeof XMLHttpRequest !== "undefined";
    var xhrAdapter = isXHRAdapterSupported && function(config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        const _config = resolveConfig(config);
        let requestData = _config.data;
        const requestHeaders = AxiosHeaders.from(_config.headers).normalize();
        let {
          responseType,
          onUploadProgress,
          onDownloadProgress
        } = _config;
        let onCanceled;
        let uploadThrottled, downloadThrottled;
        let flushUpload, flushDownload;
        function done() {
          flushUpload && flushUpload();
          flushDownload && flushDownload();
          _config.cancelToken && _config.cancelToken.unsubscribe(onCanceled);
          _config.signal && _config.signal.removeEventListener("abort", onCanceled);
        }
        let request = new XMLHttpRequest();
        request.open(_config.method.toUpperCase(), _config.url, true);
        request.timeout = _config.timeout;
        function onloadend() {
          if (!request) {
            return;
          }
          const responseHeaders = AxiosHeaders.from("getAllResponseHeaders" in request && request.getAllResponseHeaders());
          const responseData = !responseType || responseType === "text" || responseType === "json" ? request.responseText : request.response;
          const response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config,
            request
          };
          settle(function _resolve(value) {
            resolve(value);
            done();
          }, function _reject(err) {
            reject(err);
            done();
          }, response);
          request = null;
        }
        if ("onloadend" in request) {
          request.onloadend = onloadend;
        } else {
          request.onreadystatechange = function handleLoad() {
            if (!request || request.readyState !== 4) {
              return;
            }
            if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf("file:") === 0)) {
              return;
            }
            setTimeout(onloadend);
          };
        }
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }
          reject(new AxiosError("Request aborted", AxiosError.ECONNABORTED, config, request));
          request = null;
        };
        request.onerror = function handleError(event) {
          const msg = event && event.message ? event.message : "Network Error";
          const err = new AxiosError(msg, AxiosError.ERR_NETWORK, config, request);
          err.event = event || null;
          reject(err);
          request = null;
        };
        request.ontimeout = function handleTimeout() {
          let timeoutErrorMessage = _config.timeout ? "timeout of " + _config.timeout + "ms exceeded" : "timeout exceeded";
          const transitional = _config.transitional || transitionalDefaults;
          if (_config.timeoutErrorMessage) {
            timeoutErrorMessage = _config.timeoutErrorMessage;
          }
          reject(new AxiosError(timeoutErrorMessage, transitional.clarifyTimeoutError ? AxiosError.ETIMEDOUT : AxiosError.ECONNABORTED, config, request));
          request = null;
        };
        requestData === void 0 && requestHeaders.setContentType(null);
        if ("setRequestHeader" in request) {
          utils$1.forEach(requestHeaders.toJSON(), function setRequestHeader(val, key) {
            request.setRequestHeader(key, val);
          });
        }
        if (!utils$1.isUndefined(_config.withCredentials)) {
          request.withCredentials = !!_config.withCredentials;
        }
        if (responseType && responseType !== "json") {
          request.responseType = _config.responseType;
        }
        if (onDownloadProgress) {
          [downloadThrottled, flushDownload] = progressEventReducer(onDownloadProgress, true);
          request.addEventListener("progress", downloadThrottled);
        }
        if (onUploadProgress && request.upload) {
          [uploadThrottled, flushUpload] = progressEventReducer(onUploadProgress);
          request.upload.addEventListener("progress", uploadThrottled);
          request.upload.addEventListener("loadend", flushUpload);
        }
        if (_config.cancelToken || _config.signal) {
          onCanceled = (cancel) => {
            if (!request) {
              return;
            }
            reject(!cancel || cancel.type ? new CanceledError(null, config, request) : cancel);
            request.abort();
            request = null;
          };
          _config.cancelToken && _config.cancelToken.subscribe(onCanceled);
          if (_config.signal) {
            _config.signal.aborted ? onCanceled() : _config.signal.addEventListener("abort", onCanceled);
          }
        }
        const protocol = parseProtocol(_config.url);
        if (protocol && platform.protocols.indexOf(protocol) === -1) {
          reject(new AxiosError("Unsupported protocol " + protocol + ":", AxiosError.ERR_BAD_REQUEST, config));
          return;
        }
        request.send(requestData || null);
      });
    };
    var composeSignals = (signals, timeout) => {
      const {
        length
      } = signals = signals ? signals.filter(Boolean) : [];
      if (timeout || length) {
        let controller = new AbortController();
        let aborted;
        const onabort = function(reason) {
          if (!aborted) {
            aborted = true;
            unsubscribe();
            const err = reason instanceof Error ? reason : this.reason;
            controller.abort(err instanceof AxiosError ? err : new CanceledError(err instanceof Error ? err.message : err));
          }
        };
        let timer = timeout && setTimeout(() => {
          timer = null;
          onabort(new AxiosError(`timeout of ${timeout}ms exceeded`, AxiosError.ETIMEDOUT));
        }, timeout);
        const unsubscribe = () => {
          if (signals) {
            timer && clearTimeout(timer);
            timer = null;
            signals.forEach((signal2) => {
              signal2.unsubscribe ? signal2.unsubscribe(onabort) : signal2.removeEventListener("abort", onabort);
            });
            signals = null;
          }
        };
        signals.forEach((signal2) => signal2.addEventListener("abort", onabort));
        const {
          signal
        } = controller;
        signal.unsubscribe = () => utils$1.asap(unsubscribe);
        return signal;
      }
    };
    var streamChunk = function* (chunk, chunkSize) {
      let len = chunk.byteLength;
      if (len < chunkSize) {
        yield chunk;
        return;
      }
      let pos = 0;
      let end;
      while (pos < len) {
        end = pos + chunkSize;
        yield chunk.slice(pos, end);
        pos = end;
      }
    };
    var readBytes = async function* (iterable, chunkSize) {
      for await (const chunk of readStream(iterable)) {
        yield* streamChunk(chunk, chunkSize);
      }
    };
    var readStream = async function* (stream2) {
      if (stream2[Symbol.asyncIterator]) {
        yield* stream2;
        return;
      }
      const reader = stream2.getReader();
      try {
        for (; ; ) {
          const {
            done,
            value
          } = await reader.read();
          if (done) {
            break;
          }
          yield value;
        }
      } finally {
        await reader.cancel();
      }
    };
    var trackStream = (stream2, chunkSize, onProgress, onFinish) => {
      const iterator2 = readBytes(stream2, chunkSize);
      let bytes = 0;
      let done;
      let _onFinish = (e) => {
        if (!done) {
          done = true;
          onFinish && onFinish(e);
        }
      };
      return new ReadableStream({
        async pull(controller) {
          try {
            const {
              done: done2,
              value
            } = await iterator2.next();
            if (done2) {
              _onFinish();
              controller.close();
              return;
            }
            let len = value.byteLength;
            if (onProgress) {
              let loadedBytes = bytes += len;
              onProgress(loadedBytes);
            }
            controller.enqueue(new Uint8Array(value));
          } catch (err) {
            _onFinish(err);
            throw err;
          }
        },
        cancel(reason) {
          _onFinish(reason);
          return iterator2.return();
        }
      }, {
        highWaterMark: 2
      });
    };
    var DEFAULT_CHUNK_SIZE = 64 * 1024;
    var {
      isFunction
    } = utils$1;
    var globalFetchAPI = (({
      Request,
      Response
    }) => ({
      Request,
      Response
    }))(utils$1.global);
    var {
      ReadableStream: ReadableStream$1,
      TextEncoder: TextEncoder$1
    } = utils$1.global;
    var test = (fn, ...args) => {
      try {
        return !!fn(...args);
      } catch (e) {
        return false;
      }
    };
    var factory = (env) => {
      env = utils$1.merge.call({
        skipUndefined: true
      }, globalFetchAPI, env);
      const {
        fetch: envFetch,
        Request,
        Response
      } = env;
      const isFetchSupported = envFetch ? isFunction(envFetch) : typeof fetch === "function";
      const isRequestSupported = isFunction(Request);
      const isResponseSupported = isFunction(Response);
      if (!isFetchSupported) {
        return false;
      }
      const isReadableStreamSupported = isFetchSupported && isFunction(ReadableStream$1);
      const encodeText = isFetchSupported && (typeof TextEncoder$1 === "function" ? /* @__PURE__ */ ((encoder) => (str) => encoder.encode(str))(new TextEncoder$1()) : async (str) => new Uint8Array(await new Request(str).arrayBuffer()));
      const supportsRequestStream = isRequestSupported && isReadableStreamSupported && test(() => {
        let duplexAccessed = false;
        const body = new ReadableStream$1();
        const hasContentType = new Request(platform.origin, {
          body,
          method: "POST",
          get duplex() {
            duplexAccessed = true;
            return "half";
          }
        }).headers.has("Content-Type");
        body.cancel();
        return duplexAccessed && !hasContentType;
      });
      const supportsResponseStream = isResponseSupported && isReadableStreamSupported && test(() => utils$1.isReadableStream(new Response("").body));
      const resolvers = {
        stream: supportsResponseStream && ((res) => res.body)
      };
      isFetchSupported && (() => {
        ["text", "arrayBuffer", "blob", "formData", "stream"].forEach((type) => {
          !resolvers[type] && (resolvers[type] = (res, config) => {
            let method = res && res[type];
            if (method) {
              return method.call(res);
            }
            throw new AxiosError(`Response type '${type}' is not supported`, AxiosError.ERR_NOT_SUPPORT, config);
          });
        });
      })();
      const getBodyLength = async (body) => {
        if (body == null) {
          return 0;
        }
        if (utils$1.isBlob(body)) {
          return body.size;
        }
        if (utils$1.isSpecCompliantForm(body)) {
          const _request = new Request(platform.origin, {
            method: "POST",
            body
          });
          return (await _request.arrayBuffer()).byteLength;
        }
        if (utils$1.isArrayBufferView(body) || utils$1.isArrayBuffer(body)) {
          return body.byteLength;
        }
        if (utils$1.isURLSearchParams(body)) {
          body = body + "";
        }
        if (utils$1.isString(body)) {
          return (await encodeText(body)).byteLength;
        }
      };
      const resolveBodyLength = async (headers, body) => {
        const length = utils$1.toFiniteNumber(headers.getContentLength());
        return length == null ? getBodyLength(body) : length;
      };
      return async (config) => {
        let {
          url: url2,
          method,
          data,
          signal,
          cancelToken,
          timeout,
          onDownloadProgress,
          onUploadProgress,
          responseType,
          headers,
          withCredentials = "same-origin",
          fetchOptions
        } = resolveConfig(config);
        let _fetch = envFetch || fetch;
        responseType = responseType ? (responseType + "").toLowerCase() : "text";
        let composedSignal = composeSignals([signal, cancelToken && cancelToken.toAbortSignal()], timeout);
        let request = null;
        const unsubscribe = composedSignal && composedSignal.unsubscribe && (() => {
          composedSignal.unsubscribe();
        });
        let requestContentLength;
        try {
          if (onUploadProgress && supportsRequestStream && method !== "get" && method !== "head" && (requestContentLength = await resolveBodyLength(headers, data)) !== 0) {
            let _request = new Request(url2, {
              method: "POST",
              body: data,
              duplex: "half"
            });
            let contentTypeHeader;
            if (utils$1.isFormData(data) && (contentTypeHeader = _request.headers.get("content-type"))) {
              headers.setContentType(contentTypeHeader);
            }
            if (_request.body) {
              const [onProgress, flush] = progressEventDecorator(requestContentLength, progressEventReducer(asyncDecorator(onUploadProgress)));
              data = trackStream(_request.body, DEFAULT_CHUNK_SIZE, onProgress, flush);
            }
          }
          if (!utils$1.isString(withCredentials)) {
            withCredentials = withCredentials ? "include" : "omit";
          }
          const isCredentialsSupported = isRequestSupported && "credentials" in Request.prototype;
          const resolvedOptions = {
            ...fetchOptions,
            signal: composedSignal,
            method: method.toUpperCase(),
            headers: headers.normalize().toJSON(),
            body: data,
            duplex: "half",
            credentials: isCredentialsSupported ? withCredentials : void 0
          };
          request = isRequestSupported && new Request(url2, resolvedOptions);
          let response = await (isRequestSupported ? _fetch(request, fetchOptions) : _fetch(url2, resolvedOptions));
          const isStreamResponse = supportsResponseStream && (responseType === "stream" || responseType === "response");
          if (supportsResponseStream && (onDownloadProgress || isStreamResponse && unsubscribe)) {
            const options = {};
            ["status", "statusText", "headers"].forEach((prop) => {
              options[prop] = response[prop];
            });
            const responseContentLength = utils$1.toFiniteNumber(response.headers.get("content-length"));
            const [onProgress, flush] = onDownloadProgress && progressEventDecorator(responseContentLength, progressEventReducer(asyncDecorator(onDownloadProgress), true)) || [];
            response = new Response(trackStream(response.body, DEFAULT_CHUNK_SIZE, onProgress, () => {
              flush && flush();
              unsubscribe && unsubscribe();
            }), options);
          }
          responseType = responseType || "text";
          let responseData = await resolvers[utils$1.findKey(resolvers, responseType) || "text"](response, config);
          !isStreamResponse && unsubscribe && unsubscribe();
          return await new Promise((resolve, reject) => {
            settle(resolve, reject, {
              data: responseData,
              headers: AxiosHeaders.from(response.headers),
              status: response.status,
              statusText: response.statusText,
              config,
              request
            });
          });
        } catch (err) {
          unsubscribe && unsubscribe();
          if (err && err.name === "TypeError" && /Load failed|fetch/i.test(err.message)) {
            throw Object.assign(new AxiosError("Network Error", AxiosError.ERR_NETWORK, config, request, err && err.response), {
              cause: err.cause || err
            });
          }
          throw AxiosError.from(err, err && err.code, config, request, err && err.response);
        }
      };
    };
    var seedCache = /* @__PURE__ */ new Map();
    var getFetch = (config) => {
      let env = config && config.env || {};
      const {
        fetch: fetch2,
        Request,
        Response
      } = env;
      const seeds = [Request, Response, fetch2];
      let len = seeds.length, i = len, seed, target, map = seedCache;
      while (i--) {
        seed = seeds[i];
        target = map.get(seed);
        target === void 0 && map.set(seed, target = i ? /* @__PURE__ */ new Map() : factory(env));
        map = target;
      }
      return target;
    };
    getFetch();
    var knownAdapters = {
      http: httpAdapter,
      xhr: xhrAdapter,
      fetch: {
        get: getFetch
      }
    };
    utils$1.forEach(knownAdapters, (fn, value) => {
      if (fn) {
        try {
          Object.defineProperty(fn, "name", {
            value
          });
        } catch (e) {
        }
        Object.defineProperty(fn, "adapterName", {
          value
        });
      }
    });
    var renderReason = (reason) => `- ${reason}`;
    var isResolvedHandle = (adapter) => utils$1.isFunction(adapter) || adapter === null || adapter === false;
    function getAdapter(adapters2, config) {
      adapters2 = utils$1.isArray(adapters2) ? adapters2 : [adapters2];
      const {
        length
      } = adapters2;
      let nameOrAdapter;
      let adapter;
      const rejectedReasons = {};
      for (let i = 0; i < length; i++) {
        nameOrAdapter = adapters2[i];
        let id;
        adapter = nameOrAdapter;
        if (!isResolvedHandle(nameOrAdapter)) {
          adapter = knownAdapters[(id = String(nameOrAdapter)).toLowerCase()];
          if (adapter === void 0) {
            throw new AxiosError(`Unknown adapter '${id}'`);
          }
        }
        if (adapter && (utils$1.isFunction(adapter) || (adapter = adapter.get(config)))) {
          break;
        }
        rejectedReasons[id || "#" + i] = adapter;
      }
      if (!adapter) {
        const reasons = Object.entries(rejectedReasons).map(([id, state]) => `adapter ${id} ` + (state === false ? "is not supported by the environment" : "is not available in the build"));
        let s = length ? reasons.length > 1 ? "since :\n" + reasons.map(renderReason).join("\n") : " " + renderReason(reasons[0]) : "as no adapter specified";
        throw new AxiosError(`There is no suitable adapter to dispatch the request ` + s, "ERR_NOT_SUPPORT");
      }
      return adapter;
    }
    var adapters = {
      /**
       * Resolve an adapter from a list of adapter names or functions.
       * @type {Function}
       */
      getAdapter,
      /**
       * Exposes all known adapters
       * @type {Object<string, Function|Object>}
       */
      adapters: knownAdapters
    };
    function throwIfCancellationRequested(config) {
      if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
      }
      if (config.signal && config.signal.aborted) {
        throw new CanceledError(null, config);
      }
    }
    function dispatchRequest(config) {
      throwIfCancellationRequested(config);
      config.headers = AxiosHeaders.from(config.headers);
      config.data = transformData.call(config, config.transformRequest);
      if (["post", "put", "patch"].indexOf(config.method) !== -1) {
        config.headers.setContentType("application/x-www-form-urlencoded", false);
      }
      const adapter = adapters.getAdapter(config.adapter || defaults.adapter, config);
      return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);
        response.data = transformData.call(config, config.transformResponse, response);
        response.headers = AxiosHeaders.from(response.headers);
        return response;
      }, function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
          throwIfCancellationRequested(config);
          if (reason && reason.response) {
            reason.response.data = transformData.call(config, config.transformResponse, reason.response);
            reason.response.headers = AxiosHeaders.from(reason.response.headers);
          }
        }
        return Promise.reject(reason);
      });
    }
    var validators$1 = {};
    ["object", "boolean", "number", "function", "string", "symbol"].forEach((type, i) => {
      validators$1[type] = function validator2(thing) {
        return typeof thing === type || "a" + (i < 1 ? "n " : " ") + type;
      };
    });
    var deprecatedWarnings = {};
    validators$1.transitional = function transitional(validator2, version, message) {
      function formatMessage(opt, desc) {
        return "[Axios v" + VERSION + "] Transitional option '" + opt + "'" + desc + (message ? ". " + message : "");
      }
      return (value, opt, opts) => {
        if (validator2 === false) {
          throw new AxiosError(formatMessage(opt, " has been removed" + (version ? " in " + version : "")), AxiosError.ERR_DEPRECATED);
        }
        if (version && !deprecatedWarnings[opt]) {
          deprecatedWarnings[opt] = true;
          console.warn(formatMessage(opt, " has been deprecated since v" + version + " and will be removed in the near future"));
        }
        return validator2 ? validator2(value, opt, opts) : true;
      };
    };
    validators$1.spelling = function spelling(correctSpelling) {
      return (value, opt) => {
        console.warn(`${opt} is likely a misspelling of ${correctSpelling}`);
        return true;
      };
    };
    function assertOptions(options, schema, allowUnknown) {
      if (typeof options !== "object") {
        throw new AxiosError("options must be an object", AxiosError.ERR_BAD_OPTION_VALUE);
      }
      const keys = Object.keys(options);
      let i = keys.length;
      while (i-- > 0) {
        const opt = keys[i];
        const validator2 = schema[opt];
        if (validator2) {
          const value = options[opt];
          const result = value === void 0 || validator2(value, opt, options);
          if (result !== true) {
            throw new AxiosError("option " + opt + " must be " + result, AxiosError.ERR_BAD_OPTION_VALUE);
          }
          continue;
        }
        if (allowUnknown !== true) {
          throw new AxiosError("Unknown option " + opt, AxiosError.ERR_BAD_OPTION);
        }
      }
    }
    var validator = {
      assertOptions,
      validators: validators$1
    };
    var validators = validator.validators;
    var Axios = class {
      constructor(instanceConfig) {
        this.defaults = instanceConfig || {};
        this.interceptors = {
          request: new InterceptorManager(),
          response: new InterceptorManager()
        };
      }
      /**
       * Dispatch a request
       *
       * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
       * @param {?Object} config
       *
       * @returns {Promise} The Promise to be fulfilled
       */
      async request(configOrUrl, config) {
        try {
          return await this._request(configOrUrl, config);
        } catch (err) {
          if (err instanceof Error) {
            let dummy = {};
            Error.captureStackTrace ? Error.captureStackTrace(dummy) : dummy = new Error();
            const stack = (() => {
              if (!dummy.stack) {
                return "";
              }
              const firstNewlineIndex = dummy.stack.indexOf("\n");
              return firstNewlineIndex === -1 ? "" : dummy.stack.slice(firstNewlineIndex + 1);
            })();
            try {
              if (!err.stack) {
                err.stack = stack;
              } else if (stack) {
                const firstNewlineIndex = stack.indexOf("\n");
                const secondNewlineIndex = firstNewlineIndex === -1 ? -1 : stack.indexOf("\n", firstNewlineIndex + 1);
                const stackWithoutTwoTopLines = secondNewlineIndex === -1 ? "" : stack.slice(secondNewlineIndex + 1);
                if (!String(err.stack).endsWith(stackWithoutTwoTopLines)) {
                  err.stack += "\n" + stack;
                }
              }
            } catch (e) {
            }
          }
          throw err;
        }
      }
      _request(configOrUrl, config) {
        if (typeof configOrUrl === "string") {
          config = config || {};
          config.url = configOrUrl;
        } else {
          config = configOrUrl || {};
        }
        config = mergeConfig(this.defaults, config);
        const {
          transitional,
          paramsSerializer,
          headers
        } = config;
        if (transitional !== void 0) {
          validator.assertOptions(transitional, {
            silentJSONParsing: validators.transitional(validators.boolean),
            forcedJSONParsing: validators.transitional(validators.boolean),
            clarifyTimeoutError: validators.transitional(validators.boolean),
            legacyInterceptorReqResOrdering: validators.transitional(validators.boolean)
          }, false);
        }
        if (paramsSerializer != null) {
          if (utils$1.isFunction(paramsSerializer)) {
            config.paramsSerializer = {
              serialize: paramsSerializer
            };
          } else {
            validator.assertOptions(paramsSerializer, {
              encode: validators.function,
              serialize: validators.function
            }, true);
          }
        }
        if (config.allowAbsoluteUrls !== void 0) ;
        else if (this.defaults.allowAbsoluteUrls !== void 0) {
          config.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls;
        } else {
          config.allowAbsoluteUrls = true;
        }
        validator.assertOptions(config, {
          baseUrl: validators.spelling("baseURL"),
          withXsrfToken: validators.spelling("withXSRFToken")
        }, true);
        config.method = (config.method || this.defaults.method || "get").toLowerCase();
        let contextHeaders = headers && utils$1.merge(headers.common, headers[config.method]);
        headers && utils$1.forEach(["delete", "get", "head", "post", "put", "patch", "common"], (method) => {
          delete headers[method];
        });
        config.headers = AxiosHeaders.concat(contextHeaders, headers);
        const requestInterceptorChain = [];
        let synchronousRequestInterceptors = true;
        this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
          if (typeof interceptor.runWhen === "function" && interceptor.runWhen(config) === false) {
            return;
          }
          synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;
          const transitional2 = config.transitional || transitionalDefaults;
          const legacyInterceptorReqResOrdering = transitional2 && transitional2.legacyInterceptorReqResOrdering;
          if (legacyInterceptorReqResOrdering) {
            requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
          } else {
            requestInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
          }
        });
        const responseInterceptorChain = [];
        this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
          responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
        });
        let promise;
        let i = 0;
        let len;
        if (!synchronousRequestInterceptors) {
          const chain = [dispatchRequest.bind(this), void 0];
          chain.unshift(...requestInterceptorChain);
          chain.push(...responseInterceptorChain);
          len = chain.length;
          promise = Promise.resolve(config);
          while (i < len) {
            promise = promise.then(chain[i++], chain[i++]);
          }
          return promise;
        }
        len = requestInterceptorChain.length;
        let newConfig = config;
        while (i < len) {
          const onFulfilled = requestInterceptorChain[i++];
          const onRejected = requestInterceptorChain[i++];
          try {
            newConfig = onFulfilled(newConfig);
          } catch (error) {
            onRejected.call(this, error);
            break;
          }
        }
        try {
          promise = dispatchRequest.call(this, newConfig);
        } catch (error) {
          return Promise.reject(error);
        }
        i = 0;
        len = responseInterceptorChain.length;
        while (i < len) {
          promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
        }
        return promise;
      }
      getUri(config) {
        config = mergeConfig(this.defaults, config);
        const fullPath = buildFullPath(config.baseURL, config.url, config.allowAbsoluteUrls);
        return buildURL(fullPath, config.params, config.paramsSerializer);
      }
    };
    utils$1.forEach(["delete", "get", "head", "options"], function forEachMethodNoData(method) {
      Axios.prototype[method] = function(url2, config) {
        return this.request(mergeConfig(config || {}, {
          method,
          url: url2,
          data: (config || {}).data
        }));
      };
    });
    utils$1.forEach(["post", "put", "patch"], function forEachMethodWithData(method) {
      function generateHTTPMethod(isForm) {
        return function httpMethod(url2, data, config) {
          return this.request(mergeConfig(config || {}, {
            method,
            headers: isForm ? {
              "Content-Type": "multipart/form-data"
            } : {},
            url: url2,
            data
          }));
        };
      }
      Axios.prototype[method] = generateHTTPMethod();
      Axios.prototype[method + "Form"] = generateHTTPMethod(true);
    });
    var CancelToken = class _CancelToken {
      constructor(executor) {
        if (typeof executor !== "function") {
          throw new TypeError("executor must be a function.");
        }
        let resolvePromise;
        this.promise = new Promise(function promiseExecutor(resolve) {
          resolvePromise = resolve;
        });
        const token = this;
        this.promise.then((cancel) => {
          if (!token._listeners) return;
          let i = token._listeners.length;
          while (i-- > 0) {
            token._listeners[i](cancel);
          }
          token._listeners = null;
        });
        this.promise.then = (onfulfilled) => {
          let _resolve;
          const promise = new Promise((resolve) => {
            token.subscribe(resolve);
            _resolve = resolve;
          }).then(onfulfilled);
          promise.cancel = function reject() {
            token.unsubscribe(_resolve);
          };
          return promise;
        };
        executor(function cancel(message, config, request) {
          if (token.reason) {
            return;
          }
          token.reason = new CanceledError(message, config, request);
          resolvePromise(token.reason);
        });
      }
      /**
       * Throws a `CanceledError` if cancellation has been requested.
       */
      throwIfRequested() {
        if (this.reason) {
          throw this.reason;
        }
      }
      /**
       * Subscribe to the cancel signal
       */
      subscribe(listener) {
        if (this.reason) {
          listener(this.reason);
          return;
        }
        if (this._listeners) {
          this._listeners.push(listener);
        } else {
          this._listeners = [listener];
        }
      }
      /**
       * Unsubscribe from the cancel signal
       */
      unsubscribe(listener) {
        if (!this._listeners) {
          return;
        }
        const index = this._listeners.indexOf(listener);
        if (index !== -1) {
          this._listeners.splice(index, 1);
        }
      }
      toAbortSignal() {
        const controller = new AbortController();
        const abort = (err) => {
          controller.abort(err);
        };
        this.subscribe(abort);
        controller.signal.unsubscribe = () => this.unsubscribe(abort);
        return controller.signal;
      }
      /**
       * Returns an object that contains a new `CancelToken` and a function that, when called,
       * cancels the `CancelToken`.
       */
      static source() {
        let cancel;
        const token = new _CancelToken(function executor(c) {
          cancel = c;
        });
        return {
          token,
          cancel
        };
      }
    };
    function spread(callback) {
      return function wrap(arr) {
        return callback.apply(null, arr);
      };
    }
    function isAxiosError(payload) {
      return utils$1.isObject(payload) && payload.isAxiosError === true;
    }
    var HttpStatusCode = {
      Continue: 100,
      SwitchingProtocols: 101,
      Processing: 102,
      EarlyHints: 103,
      Ok: 200,
      Created: 201,
      Accepted: 202,
      NonAuthoritativeInformation: 203,
      NoContent: 204,
      ResetContent: 205,
      PartialContent: 206,
      MultiStatus: 207,
      AlreadyReported: 208,
      ImUsed: 226,
      MultipleChoices: 300,
      MovedPermanently: 301,
      Found: 302,
      SeeOther: 303,
      NotModified: 304,
      UseProxy: 305,
      Unused: 306,
      TemporaryRedirect: 307,
      PermanentRedirect: 308,
      BadRequest: 400,
      Unauthorized: 401,
      PaymentRequired: 402,
      Forbidden: 403,
      NotFound: 404,
      MethodNotAllowed: 405,
      NotAcceptable: 406,
      ProxyAuthenticationRequired: 407,
      RequestTimeout: 408,
      Conflict: 409,
      Gone: 410,
      LengthRequired: 411,
      PreconditionFailed: 412,
      PayloadTooLarge: 413,
      UriTooLong: 414,
      UnsupportedMediaType: 415,
      RangeNotSatisfiable: 416,
      ExpectationFailed: 417,
      ImATeapot: 418,
      MisdirectedRequest: 421,
      UnprocessableEntity: 422,
      Locked: 423,
      FailedDependency: 424,
      TooEarly: 425,
      UpgradeRequired: 426,
      PreconditionRequired: 428,
      TooManyRequests: 429,
      RequestHeaderFieldsTooLarge: 431,
      UnavailableForLegalReasons: 451,
      InternalServerError: 500,
      NotImplemented: 501,
      BadGateway: 502,
      ServiceUnavailable: 503,
      GatewayTimeout: 504,
      HttpVersionNotSupported: 505,
      VariantAlsoNegotiates: 506,
      InsufficientStorage: 507,
      LoopDetected: 508,
      NotExtended: 510,
      NetworkAuthenticationRequired: 511,
      WebServerIsDown: 521,
      ConnectionTimedOut: 522,
      OriginIsUnreachable: 523,
      TimeoutOccurred: 524,
      SslHandshakeFailed: 525,
      InvalidSslCertificate: 526
    };
    Object.entries(HttpStatusCode).forEach(([key, value]) => {
      HttpStatusCode[value] = key;
    });
    function createInstance(defaultConfig) {
      const context = new Axios(defaultConfig);
      const instance = bind(Axios.prototype.request, context);
      utils$1.extend(instance, Axios.prototype, context, {
        allOwnKeys: true
      });
      utils$1.extend(instance, context, null, {
        allOwnKeys: true
      });
      instance.create = function create(instanceConfig) {
        return createInstance(mergeConfig(defaultConfig, instanceConfig));
      };
      return instance;
    }
    var axios = createInstance(defaults);
    axios.Axios = Axios;
    axios.CanceledError = CanceledError;
    axios.CancelToken = CancelToken;
    axios.isCancel = isCancel;
    axios.VERSION = VERSION;
    axios.toFormData = toFormData;
    axios.AxiosError = AxiosError;
    axios.Cancel = axios.CanceledError;
    axios.all = function all(promises) {
      return Promise.all(promises);
    };
    axios.spread = spread;
    axios.isAxiosError = isAxiosError;
    axios.mergeConfig = mergeConfig;
    axios.AxiosHeaders = AxiosHeaders;
    axios.formToJSON = (thing) => formDataToJSON(utils$1.isHTMLForm(thing) ? new FormData(thing) : thing);
    axios.getAdapter = adapters.getAdapter;
    axios.HttpStatusCode = HttpStatusCode;
    axios.default = axios;
    module.exports = axios;
  }
});

// node_modules/punycode/punycode.js
var require_punycode = __commonJS({
  "node_modules/punycode/punycode.js"(exports, module) {
    "use strict";
    var maxInt = 2147483647;
    var base = 36;
    var tMin = 1;
    var tMax = 26;
    var skew = 38;
    var damp = 700;
    var initialBias = 72;
    var initialN = 128;
    var delimiter = "-";
    var regexPunycode = /^xn--/;
    var regexNonASCII = /[^\0-\x7F]/;
    var regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g;
    var errors = {
      "overflow": "Overflow: input needs wider integers to process",
      "not-basic": "Illegal input >= 0x80 (not a basic code point)",
      "invalid-input": "Invalid input"
    };
    var baseMinusTMin = base - tMin;
    var floor = Math.floor;
    var stringFromCharCode = String.fromCharCode;
    function error(type) {
      throw new RangeError(errors[type]);
    }
    function map(array, callback) {
      const result = [];
      let length = array.length;
      while (length--) {
        result[length] = callback(array[length]);
      }
      return result;
    }
    function mapDomain(domain, callback) {
      const parts = domain.split("@");
      let result = "";
      if (parts.length > 1) {
        result = parts[0] + "@";
        domain = parts[1];
      }
      domain = domain.replace(regexSeparators, ".");
      const labels = domain.split(".");
      const encoded = map(labels, callback).join(".");
      return result + encoded;
    }
    function ucs2decode(string) {
      const output = [];
      let counter = 0;
      const length = string.length;
      while (counter < length) {
        const value = string.charCodeAt(counter++);
        if (value >= 55296 && value <= 56319 && counter < length) {
          const extra = string.charCodeAt(counter++);
          if ((extra & 64512) == 56320) {
            output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
          } else {
            output.push(value);
            counter--;
          }
        } else {
          output.push(value);
        }
      }
      return output;
    }
    var ucs2encode = (codePoints) => String.fromCodePoint(...codePoints);
    var basicToDigit = function(codePoint) {
      if (codePoint >= 48 && codePoint < 58) {
        return 26 + (codePoint - 48);
      }
      if (codePoint >= 65 && codePoint < 91) {
        return codePoint - 65;
      }
      if (codePoint >= 97 && codePoint < 123) {
        return codePoint - 97;
      }
      return base;
    };
    var digitToBasic = function(digit, flag) {
      return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
    };
    var adapt = function(delta, numPoints, firstTime) {
      let k = 0;
      delta = firstTime ? floor(delta / damp) : delta >> 1;
      delta += floor(delta / numPoints);
      for (; delta > baseMinusTMin * tMax >> 1; k += base) {
        delta = floor(delta / baseMinusTMin);
      }
      return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
    };
    var decode = function(input) {
      const output = [];
      const inputLength = input.length;
      let i = 0;
      let n = initialN;
      let bias = initialBias;
      let basic = input.lastIndexOf(delimiter);
      if (basic < 0) {
        basic = 0;
      }
      for (let j = 0; j < basic; ++j) {
        if (input.charCodeAt(j) >= 128) {
          error("not-basic");
        }
        output.push(input.charCodeAt(j));
      }
      for (let index = basic > 0 ? basic + 1 : 0; index < inputLength; ) {
        const oldi = i;
        for (let w = 1, k = base; ; k += base) {
          if (index >= inputLength) {
            error("invalid-input");
          }
          const digit = basicToDigit(input.charCodeAt(index++));
          if (digit >= base) {
            error("invalid-input");
          }
          if (digit > floor((maxInt - i) / w)) {
            error("overflow");
          }
          i += digit * w;
          const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
          if (digit < t) {
            break;
          }
          const baseMinusT = base - t;
          if (w > floor(maxInt / baseMinusT)) {
            error("overflow");
          }
          w *= baseMinusT;
        }
        const out = output.length + 1;
        bias = adapt(i - oldi, out, oldi == 0);
        if (floor(i / out) > maxInt - n) {
          error("overflow");
        }
        n += floor(i / out);
        i %= out;
        output.splice(i++, 0, n);
      }
      return String.fromCodePoint(...output);
    };
    var encode = function(input) {
      const output = [];
      input = ucs2decode(input);
      const inputLength = input.length;
      let n = initialN;
      let delta = 0;
      let bias = initialBias;
      for (const currentValue of input) {
        if (currentValue < 128) {
          output.push(stringFromCharCode(currentValue));
        }
      }
      const basicLength = output.length;
      let handledCPCount = basicLength;
      if (basicLength) {
        output.push(delimiter);
      }
      while (handledCPCount < inputLength) {
        let m = maxInt;
        for (const currentValue of input) {
          if (currentValue >= n && currentValue < m) {
            m = currentValue;
          }
        }
        const handledCPCountPlusOne = handledCPCount + 1;
        if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
          error("overflow");
        }
        delta += (m - n) * handledCPCountPlusOne;
        n = m;
        for (const currentValue of input) {
          if (currentValue < n && ++delta > maxInt) {
            error("overflow");
          }
          if (currentValue === n) {
            let q = delta;
            for (let k = base; ; k += base) {
              const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
              if (q < t) {
                break;
              }
              const qMinusT = q - t;
              const baseMinusT = base - t;
              output.push(
                stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
              );
              q = floor(qMinusT / baseMinusT);
            }
            output.push(stringFromCharCode(digitToBasic(q, 0)));
            bias = adapt(delta, handledCPCountPlusOne, handledCPCount === basicLength);
            delta = 0;
            ++handledCPCount;
          }
        }
        ++delta;
        ++n;
      }
      return output.join("");
    };
    var toUnicode = function(input) {
      return mapDomain(input, function(string) {
        return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
      });
    };
    var toASCII = function(input) {
      return mapDomain(input, function(string) {
        return regexNonASCII.test(string) ? "xn--" + encode(string) : string;
      });
    };
    var punycode = {
      /**
       * A string representing the current Punycode.js version number.
       * @memberOf punycode
       * @type String
       */
      "version": "2.3.1",
      /**
       * An object of methods to convert from JavaScript's internal character
       * representation (UCS-2) to Unicode code points, and back.
       * @see <https://mathiasbynens.be/notes/javascript-encoding>
       * @memberOf punycode
       * @type Object
       */
      "ucs2": {
        "decode": ucs2decode,
        "encode": ucs2encode
      },
      "decode": decode,
      "encode": encode,
      "toASCII": toASCII,
      "toUnicode": toUnicode
    };
    module.exports = punycode;
  }
});

// node_modules/requires-port/index.js
var require_requires_port = __commonJS({
  "node_modules/requires-port/index.js"(exports, module) {
    "use strict";
    module.exports = function required(port, protocol) {
      protocol = protocol.split(":")[0];
      port = +port;
      if (!port) return false;
      switch (protocol) {
        case "http":
        case "ws":
          return port !== 80;
        case "https":
        case "wss":
          return port !== 443;
        case "ftp":
          return port !== 21;
        case "gopher":
          return port !== 70;
        case "file":
          return false;
      }
      return port !== 0;
    };
  }
});

// node_modules/querystringify/index.js
var require_querystringify = __commonJS({
  "node_modules/querystringify/index.js"(exports) {
    "use strict";
    var has = Object.prototype.hasOwnProperty;
    var undef;
    function decode(input) {
      try {
        return decodeURIComponent(input.replace(/\+/g, " "));
      } catch (e) {
        return null;
      }
    }
    function encode(input) {
      try {
        return encodeURIComponent(input);
      } catch (e) {
        return null;
      }
    }
    function querystring(query) {
      var parser = /([^=?#&]+)=?([^&]*)/g, result = {}, part;
      while (part = parser.exec(query)) {
        var key = decode(part[1]), value = decode(part[2]);
        if (key === null || value === null || key in result) continue;
        result[key] = value;
      }
      return result;
    }
    function querystringify(obj, prefix) {
      prefix = prefix || "";
      var pairs = [], value, key;
      if ("string" !== typeof prefix) prefix = "?";
      for (key in obj) {
        if (has.call(obj, key)) {
          value = obj[key];
          if (!value && (value === null || value === undef || isNaN(value))) {
            value = "";
          }
          key = encode(key);
          value = encode(value);
          if (key === null || value === null) continue;
          pairs.push(key + "=" + value);
        }
      }
      return pairs.length ? prefix + pairs.join("&") : "";
    }
    exports.stringify = querystringify;
    exports.parse = querystring;
  }
});

// node_modules/url-parse/index.js
var require_url_parse = __commonJS({
  "node_modules/url-parse/index.js"(exports, module) {
    "use strict";
    var required = require_requires_port();
    var qs = require_querystringify();
    var controlOrWhitespace = /^[\x00-\x20\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+/;
    var CRHTLF = /[\n\r\t]/g;
    var slashes = /^[A-Za-z][A-Za-z0-9+-.]*:\/\//;
    var port = /:\d+$/;
    var protocolre = /^([a-z][a-z0-9.+-]*:)?(\/\/)?([\\/]+)?([\S\s]*)/i;
    var windowsDriveLetter = /^[a-zA-Z]:/;
    function trimLeft(str) {
      return (str ? str : "").toString().replace(controlOrWhitespace, "");
    }
    var rules = [
      ["#", "hash"],
      // Extract from the back.
      ["?", "query"],
      // Extract from the back.
      function sanitize(address, url) {
        return isSpecial(url.protocol) ? address.replace(/\\/g, "/") : address;
      },
      ["/", "pathname"],
      // Extract from the back.
      ["@", "auth", 1],
      // Extract from the front.
      [NaN, "host", void 0, 1, 1],
      // Set left over value.
      [/:(\d*)$/, "port", void 0, 1],
      // RegExp the back.
      [NaN, "hostname", void 0, 1, 1]
      // Set left over.
    ];
    var ignore = { hash: 1, query: 1 };
    function lolcation(loc) {
      var globalVar;
      if (typeof window !== "undefined") globalVar = window;
      else if (typeof global !== "undefined") globalVar = global;
      else if (typeof self !== "undefined") globalVar = self;
      else globalVar = {};
      var location = globalVar.location || {};
      loc = loc || location;
      var finaldestination = {}, type = typeof loc, key;
      if ("blob:" === loc.protocol) {
        finaldestination = new Url(unescape(loc.pathname), {});
      } else if ("string" === type) {
        finaldestination = new Url(loc, {});
        for (key in ignore) delete finaldestination[key];
      } else if ("object" === type) {
        for (key in loc) {
          if (key in ignore) continue;
          finaldestination[key] = loc[key];
        }
        if (finaldestination.slashes === void 0) {
          finaldestination.slashes = slashes.test(loc.href);
        }
      }
      return finaldestination;
    }
    function isSpecial(scheme) {
      return scheme === "file:" || scheme === "ftp:" || scheme === "http:" || scheme === "https:" || scheme === "ws:" || scheme === "wss:";
    }
    function extractProtocol(address, location) {
      address = trimLeft(address);
      address = address.replace(CRHTLF, "");
      location = location || {};
      var match = protocolre.exec(address);
      var protocol = match[1] ? match[1].toLowerCase() : "";
      var forwardSlashes = !!match[2];
      var otherSlashes = !!match[3];
      var slashesCount = 0;
      var rest;
      if (forwardSlashes) {
        if (otherSlashes) {
          rest = match[2] + match[3] + match[4];
          slashesCount = match[2].length + match[3].length;
        } else {
          rest = match[2] + match[4];
          slashesCount = match[2].length;
        }
      } else {
        if (otherSlashes) {
          rest = match[3] + match[4];
          slashesCount = match[3].length;
        } else {
          rest = match[4];
        }
      }
      if (protocol === "file:") {
        if (slashesCount >= 2) {
          rest = rest.slice(2);
        }
      } else if (isSpecial(protocol)) {
        rest = match[4];
      } else if (protocol) {
        if (forwardSlashes) {
          rest = rest.slice(2);
        }
      } else if (slashesCount >= 2 && isSpecial(location.protocol)) {
        rest = match[4];
      }
      return {
        protocol,
        slashes: forwardSlashes || isSpecial(protocol),
        slashesCount,
        rest
      };
    }
    function resolve(relative, base) {
      if (relative === "") return base;
      var path = (base || "/").split("/").slice(0, -1).concat(relative.split("/")), i = path.length, last = path[i - 1], unshift = false, up = 0;
      while (i--) {
        if (path[i] === ".") {
          path.splice(i, 1);
        } else if (path[i] === "..") {
          path.splice(i, 1);
          up++;
        } else if (up) {
          if (i === 0) unshift = true;
          path.splice(i, 1);
          up--;
        }
      }
      if (unshift) path.unshift("");
      if (last === "." || last === "..") path.push("");
      return path.join("/");
    }
    function Url(address, location, parser) {
      address = trimLeft(address);
      address = address.replace(CRHTLF, "");
      if (!(this instanceof Url)) {
        return new Url(address, location, parser);
      }
      var relative, extracted, parse, instruction, index, key, instructions = rules.slice(), type = typeof location, url = this, i = 0;
      if ("object" !== type && "string" !== type) {
        parser = location;
        location = null;
      }
      if (parser && "function" !== typeof parser) parser = qs.parse;
      location = lolcation(location);
      extracted = extractProtocol(address || "", location);
      relative = !extracted.protocol && !extracted.slashes;
      url.slashes = extracted.slashes || relative && location.slashes;
      url.protocol = extracted.protocol || location.protocol || "";
      address = extracted.rest;
      if (extracted.protocol === "file:" && (extracted.slashesCount !== 2 || windowsDriveLetter.test(address)) || !extracted.slashes && (extracted.protocol || extracted.slashesCount < 2 || !isSpecial(url.protocol))) {
        instructions[3] = [/(.*)/, "pathname"];
      }
      for (; i < instructions.length; i++) {
        instruction = instructions[i];
        if (typeof instruction === "function") {
          address = instruction(address, url);
          continue;
        }
        parse = instruction[0];
        key = instruction[1];
        if (parse !== parse) {
          url[key] = address;
        } else if ("string" === typeof parse) {
          index = parse === "@" ? address.lastIndexOf(parse) : address.indexOf(parse);
          if (~index) {
            if ("number" === typeof instruction[2]) {
              url[key] = address.slice(0, index);
              address = address.slice(index + instruction[2]);
            } else {
              url[key] = address.slice(index);
              address = address.slice(0, index);
            }
          }
        } else if (index = parse.exec(address)) {
          url[key] = index[1];
          address = address.slice(0, index.index);
        }
        url[key] = url[key] || (relative && instruction[3] ? location[key] || "" : "");
        if (instruction[4]) url[key] = url[key].toLowerCase();
      }
      if (parser) url.query = parser(url.query);
      if (relative && location.slashes && url.pathname.charAt(0) !== "/" && (url.pathname !== "" || location.pathname !== "")) {
        url.pathname = resolve(url.pathname, location.pathname);
      }
      if (url.pathname.charAt(0) !== "/" && isSpecial(url.protocol)) {
        url.pathname = "/" + url.pathname;
      }
      if (!required(url.port, url.protocol)) {
        url.host = url.hostname;
        url.port = "";
      }
      url.username = url.password = "";
      if (url.auth) {
        index = url.auth.indexOf(":");
        if (~index) {
          url.username = url.auth.slice(0, index);
          url.username = encodeURIComponent(decodeURIComponent(url.username));
          url.password = url.auth.slice(index + 1);
          url.password = encodeURIComponent(decodeURIComponent(url.password));
        } else {
          url.username = encodeURIComponent(decodeURIComponent(url.auth));
        }
        url.auth = url.password ? url.username + ":" + url.password : url.username;
      }
      url.origin = url.protocol !== "file:" && isSpecial(url.protocol) && url.host ? url.protocol + "//" + url.host : "null";
      url.href = url.toString();
    }
    function set(part, value, fn) {
      var url = this;
      switch (part) {
        case "query":
          if ("string" === typeof value && value.length) {
            value = (fn || qs.parse)(value);
          }
          url[part] = value;
          break;
        case "port":
          url[part] = value;
          if (!required(value, url.protocol)) {
            url.host = url.hostname;
            url[part] = "";
          } else if (value) {
            url.host = url.hostname + ":" + value;
          }
          break;
        case "hostname":
          url[part] = value;
          if (url.port) value += ":" + url.port;
          url.host = value;
          break;
        case "host":
          url[part] = value;
          if (port.test(value)) {
            value = value.split(":");
            url.port = value.pop();
            url.hostname = value.join(":");
          } else {
            url.hostname = value;
            url.port = "";
          }
          break;
        case "protocol":
          url.protocol = value.toLowerCase();
          url.slashes = !fn;
          break;
        case "pathname":
        case "hash":
          if (value) {
            var char = part === "pathname" ? "/" : "#";
            url[part] = value.charAt(0) !== char ? char + value : value;
          } else {
            url[part] = value;
          }
          break;
        case "username":
        case "password":
          url[part] = encodeURIComponent(value);
          break;
        case "auth":
          var index = value.indexOf(":");
          if (~index) {
            url.username = value.slice(0, index);
            url.username = encodeURIComponent(decodeURIComponent(url.username));
            url.password = value.slice(index + 1);
            url.password = encodeURIComponent(decodeURIComponent(url.password));
          } else {
            url.username = encodeURIComponent(decodeURIComponent(value));
          }
      }
      for (var i = 0; i < rules.length; i++) {
        var ins = rules[i];
        if (ins[4]) url[ins[1]] = url[ins[1]].toLowerCase();
      }
      url.auth = url.password ? url.username + ":" + url.password : url.username;
      url.origin = url.protocol !== "file:" && isSpecial(url.protocol) && url.host ? url.protocol + "//" + url.host : "null";
      url.href = url.toString();
      return url;
    }
    function toString(stringify) {
      if (!stringify || "function" !== typeof stringify) stringify = qs.stringify;
      var query, url = this, host = url.host, protocol = url.protocol;
      if (protocol && protocol.charAt(protocol.length - 1) !== ":") protocol += ":";
      var result = protocol + (url.protocol && url.slashes || isSpecial(url.protocol) ? "//" : "");
      if (url.username) {
        result += url.username;
        if (url.password) result += ":" + url.password;
        result += "@";
      } else if (url.password) {
        result += ":" + url.password;
        result += "@";
      } else if (url.protocol !== "file:" && isSpecial(url.protocol) && !host && url.pathname !== "/") {
        result += "@";
      }
      if (host[host.length - 1] === ":" || port.test(url.hostname) && !url.port) {
        host += ":";
      }
      result += host + url.pathname;
      query = "object" === typeof url.query ? stringify(url.query) : url.query;
      if (query) result += "?" !== query.charAt(0) ? "?" + query : query;
      if (url.hash) result += url.hash;
      return result;
    }
    Url.prototype = { set, toString };
    Url.extractProtocol = extractProtocol;
    Url.location = lolcation;
    Url.trimLeft = trimLeft;
    Url.qs = qs;
    module.exports = Url;
  }
});

// node_modules/psl/dist/psl.cjs
var require_psl = __commonJS({
  "node_modules/psl/dist/psl.cjs"(exports) {
    "use strict";
    Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
    function K(e) {
      return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
    }
    var O;
    var F;
    function Q() {
      if (F) return O;
      F = 1;
      const e = 2147483647, s = 36, c = 1, o = 26, t = 38, d = 700, z = 72, y = 128, g = "-", P = /^xn--/, V = /[^\0-\x7F]/, G = /[\x2E\u3002\uFF0E\uFF61]/g, W = { overflow: "Overflow: input needs wider integers to process", "not-basic": "Illegal input >= 0x80 (not a basic code point)", "invalid-input": "Invalid input" }, C = s - c, h = Math.floor, I = String.fromCharCode;
      function v(a) {
        throw new RangeError(W[a]);
      }
      function U(a, i) {
        const m = [];
        let n = a.length;
        for (; n--; ) m[n] = i(a[n]);
        return m;
      }
      function S(a, i) {
        const m = a.split("@");
        let n = "";
        m.length > 1 && (n = m[0] + "@", a = m[1]), a = a.replace(G, ".");
        const r = a.split("."), p = U(r, i).join(".");
        return n + p;
      }
      function L(a) {
        const i = [];
        let m = 0;
        const n = a.length;
        for (; m < n; ) {
          const r = a.charCodeAt(m++);
          if (r >= 55296 && r <= 56319 && m < n) {
            const p = a.charCodeAt(m++);
            (p & 64512) == 56320 ? i.push(((r & 1023) << 10) + (p & 1023) + 65536) : (i.push(r), m--);
          } else i.push(r);
        }
        return i;
      }
      const $ = (a) => String.fromCodePoint(...a), J = function(a) {
        return a >= 48 && a < 58 ? 26 + (a - 48) : a >= 65 && a < 91 ? a - 65 : a >= 97 && a < 123 ? a - 97 : s;
      }, D = function(a, i) {
        return a + 22 + 75 * (a < 26) - ((i != 0) << 5);
      }, T = function(a, i, m) {
        let n = 0;
        for (a = m ? h(a / d) : a >> 1, a += h(a / i); a > C * o >> 1; n += s) a = h(a / C);
        return h(n + (C + 1) * a / (a + t));
      }, E = function(a) {
        const i = [], m = a.length;
        let n = 0, r = y, p = z, j = a.lastIndexOf(g);
        j < 0 && (j = 0);
        for (let u = 0; u < j; ++u) a.charCodeAt(u) >= 128 && v("not-basic"), i.push(a.charCodeAt(u));
        for (let u = j > 0 ? j + 1 : 0; u < m; ) {
          const k = n;
          for (let l = 1, b = s; ; b += s) {
            u >= m && v("invalid-input");
            const w = J(a.charCodeAt(u++));
            w >= s && v("invalid-input"), w > h((e - n) / l) && v("overflow"), n += w * l;
            const x = b <= p ? c : b >= p + o ? o : b - p;
            if (w < x) break;
            const q = s - x;
            l > h(e / q) && v("overflow"), l *= q;
          }
          const f = i.length + 1;
          p = T(n - k, f, k == 0), h(n / f) > e - r && v("overflow"), r += h(n / f), n %= f, i.splice(n++, 0, r);
        }
        return String.fromCodePoint(...i);
      }, B = function(a) {
        const i = [];
        a = L(a);
        const m = a.length;
        let n = y, r = 0, p = z;
        for (const k of a) k < 128 && i.push(I(k));
        const j = i.length;
        let u = j;
        for (j && i.push(g); u < m; ) {
          let k = e;
          for (const l of a) l >= n && l < k && (k = l);
          const f = u + 1;
          k - n > h((e - r) / f) && v("overflow"), r += (k - n) * f, n = k;
          for (const l of a) if (l < n && ++r > e && v("overflow"), l === n) {
            let b = r;
            for (let w = s; ; w += s) {
              const x = w <= p ? c : w >= p + o ? o : w - p;
              if (b < x) break;
              const q = b - x, M = s - x;
              i.push(I(D(x + q % M, 0))), b = h(q / M);
            }
            i.push(I(D(b, 0))), p = T(r, f, u === j), r = 0, ++u;
          }
          ++r, ++n;
        }
        return i.join("");
      };
      return O = { version: "2.3.1", ucs2: { decode: L, encode: $ }, decode: E, encode: B, toASCII: function(a) {
        return S(a, function(i) {
          return V.test(i) ? "xn--" + B(i) : i;
        });
      }, toUnicode: function(a) {
        return S(a, function(i) {
          return P.test(i) ? E(i.slice(4).toLowerCase()) : i;
        });
      } }, O;
    }
    var X = Q();
    var A = K(X);
    var Y = ["ac", "com.ac", "edu.ac", "gov.ac", "mil.ac", "net.ac", "org.ac", "ad", "ae", "ac.ae", "co.ae", "gov.ae", "mil.ae", "net.ae", "org.ae", "sch.ae", "aero", "airline.aero", "airport.aero", "accident-investigation.aero", "accident-prevention.aero", "aerobatic.aero", "aeroclub.aero", "aerodrome.aero", "agents.aero", "air-surveillance.aero", "air-traffic-control.aero", "aircraft.aero", "airtraffic.aero", "ambulance.aero", "association.aero", "author.aero", "ballooning.aero", "broker.aero", "caa.aero", "cargo.aero", "catering.aero", "certification.aero", "championship.aero", "charter.aero", "civilaviation.aero", "club.aero", "conference.aero", "consultant.aero", "consulting.aero", "control.aero", "council.aero", "crew.aero", "design.aero", "dgca.aero", "educator.aero", "emergency.aero", "engine.aero", "engineer.aero", "entertainment.aero", "equipment.aero", "exchange.aero", "express.aero", "federation.aero", "flight.aero", "freight.aero", "fuel.aero", "gliding.aero", "government.aero", "groundhandling.aero", "group.aero", "hanggliding.aero", "homebuilt.aero", "insurance.aero", "journal.aero", "journalist.aero", "leasing.aero", "logistics.aero", "magazine.aero", "maintenance.aero", "marketplace.aero", "media.aero", "microlight.aero", "modelling.aero", "navigation.aero", "parachuting.aero", "paragliding.aero", "passenger-association.aero", "pilot.aero", "press.aero", "production.aero", "recreation.aero", "repbody.aero", "res.aero", "research.aero", "rotorcraft.aero", "safety.aero", "scientist.aero", "services.aero", "show.aero", "skydiving.aero", "software.aero", "student.aero", "taxi.aero", "trader.aero", "trading.aero", "trainer.aero", "union.aero", "workinggroup.aero", "works.aero", "af", "com.af", "edu.af", "gov.af", "net.af", "org.af", "ag", "co.ag", "com.ag", "net.ag", "nom.ag", "org.ag", "ai", "com.ai", "net.ai", "off.ai", "org.ai", "al", "com.al", "edu.al", "gov.al", "mil.al", "net.al", "org.al", "am", "co.am", "com.am", "commune.am", "net.am", "org.am", "ao", "co.ao", "ed.ao", "edu.ao", "gov.ao", "gv.ao", "it.ao", "og.ao", "org.ao", "pb.ao", "aq", "ar", "bet.ar", "com.ar", "coop.ar", "edu.ar", "gob.ar", "gov.ar", "int.ar", "mil.ar", "musica.ar", "mutual.ar", "net.ar", "org.ar", "senasa.ar", "tur.ar", "arpa", "e164.arpa", "home.arpa", "in-addr.arpa", "ip6.arpa", "iris.arpa", "uri.arpa", "urn.arpa", "as", "gov.as", "asia", "at", "ac.at", "sth.ac.at", "co.at", "gv.at", "or.at", "au", "asn.au", "com.au", "edu.au", "gov.au", "id.au", "net.au", "org.au", "conf.au", "oz.au", "act.au", "nsw.au", "nt.au", "qld.au", "sa.au", "tas.au", "vic.au", "wa.au", "act.edu.au", "catholic.edu.au", "nsw.edu.au", "nt.edu.au", "qld.edu.au", "sa.edu.au", "tas.edu.au", "vic.edu.au", "wa.edu.au", "qld.gov.au", "sa.gov.au", "tas.gov.au", "vic.gov.au", "wa.gov.au", "schools.nsw.edu.au", "aw", "com.aw", "ax", "az", "biz.az", "com.az", "edu.az", "gov.az", "info.az", "int.az", "mil.az", "name.az", "net.az", "org.az", "pp.az", "pro.az", "ba", "com.ba", "edu.ba", "gov.ba", "mil.ba", "net.ba", "org.ba", "bb", "biz.bb", "co.bb", "com.bb", "edu.bb", "gov.bb", "info.bb", "net.bb", "org.bb", "store.bb", "tv.bb", "*.bd", "be", "ac.be", "bf", "gov.bf", "bg", "0.bg", "1.bg", "2.bg", "3.bg", "4.bg", "5.bg", "6.bg", "7.bg", "8.bg", "9.bg", "a.bg", "b.bg", "c.bg", "d.bg", "e.bg", "f.bg", "g.bg", "h.bg", "i.bg", "j.bg", "k.bg", "l.bg", "m.bg", "n.bg", "o.bg", "p.bg", "q.bg", "r.bg", "s.bg", "t.bg", "u.bg", "v.bg", "w.bg", "x.bg", "y.bg", "z.bg", "bh", "com.bh", "edu.bh", "gov.bh", "net.bh", "org.bh", "bi", "co.bi", "com.bi", "edu.bi", "or.bi", "org.bi", "biz", "bj", "africa.bj", "agro.bj", "architectes.bj", "assur.bj", "avocats.bj", "co.bj", "com.bj", "eco.bj", "econo.bj", "edu.bj", "info.bj", "loisirs.bj", "money.bj", "net.bj", "org.bj", "ote.bj", "restaurant.bj", "resto.bj", "tourism.bj", "univ.bj", "bm", "com.bm", "edu.bm", "gov.bm", "net.bm", "org.bm", "bn", "com.bn", "edu.bn", "gov.bn", "net.bn", "org.bn", "bo", "com.bo", "edu.bo", "gob.bo", "int.bo", "mil.bo", "net.bo", "org.bo", "tv.bo", "web.bo", "academia.bo", "agro.bo", "arte.bo", "blog.bo", "bolivia.bo", "ciencia.bo", "cooperativa.bo", "democracia.bo", "deporte.bo", "ecologia.bo", "economia.bo", "empresa.bo", "indigena.bo", "industria.bo", "info.bo", "medicina.bo", "movimiento.bo", "musica.bo", "natural.bo", "nombre.bo", "noticias.bo", "patria.bo", "plurinacional.bo", "politica.bo", "profesional.bo", "pueblo.bo", "revista.bo", "salud.bo", "tecnologia.bo", "tksat.bo", "transporte.bo", "wiki.bo", "br", "9guacu.br", "abc.br", "adm.br", "adv.br", "agr.br", "aju.br", "am.br", "anani.br", "aparecida.br", "app.br", "arq.br", "art.br", "ato.br", "b.br", "barueri.br", "belem.br", "bet.br", "bhz.br", "bib.br", "bio.br", "blog.br", "bmd.br", "boavista.br", "bsb.br", "campinagrande.br", "campinas.br", "caxias.br", "cim.br", "cng.br", "cnt.br", "com.br", "contagem.br", "coop.br", "coz.br", "cri.br", "cuiaba.br", "curitiba.br", "def.br", "des.br", "det.br", "dev.br", "ecn.br", "eco.br", "edu.br", "emp.br", "enf.br", "eng.br", "esp.br", "etc.br", "eti.br", "far.br", "feira.br", "flog.br", "floripa.br", "fm.br", "fnd.br", "fortal.br", "fot.br", "foz.br", "fst.br", "g12.br", "geo.br", "ggf.br", "goiania.br", "gov.br", "ac.gov.br", "al.gov.br", "am.gov.br", "ap.gov.br", "ba.gov.br", "ce.gov.br", "df.gov.br", "es.gov.br", "go.gov.br", "ma.gov.br", "mg.gov.br", "ms.gov.br", "mt.gov.br", "pa.gov.br", "pb.gov.br", "pe.gov.br", "pi.gov.br", "pr.gov.br", "rj.gov.br", "rn.gov.br", "ro.gov.br", "rr.gov.br", "rs.gov.br", "sc.gov.br", "se.gov.br", "sp.gov.br", "to.gov.br", "gru.br", "imb.br", "ind.br", "inf.br", "jab.br", "jampa.br", "jdf.br", "joinville.br", "jor.br", "jus.br", "leg.br", "leilao.br", "lel.br", "log.br", "londrina.br", "macapa.br", "maceio.br", "manaus.br", "maringa.br", "mat.br", "med.br", "mil.br", "morena.br", "mp.br", "mus.br", "natal.br", "net.br", "niteroi.br", "*.nom.br", "not.br", "ntr.br", "odo.br", "ong.br", "org.br", "osasco.br", "palmas.br", "poa.br", "ppg.br", "pro.br", "psc.br", "psi.br", "pvh.br", "qsl.br", "radio.br", "rec.br", "recife.br", "rep.br", "ribeirao.br", "rio.br", "riobranco.br", "riopreto.br", "salvador.br", "sampa.br", "santamaria.br", "santoandre.br", "saobernardo.br", "saogonca.br", "seg.br", "sjc.br", "slg.br", "slz.br", "sorocaba.br", "srv.br", "taxi.br", "tc.br", "tec.br", "teo.br", "the.br", "tmp.br", "trd.br", "tur.br", "tv.br", "udi.br", "vet.br", "vix.br", "vlog.br", "wiki.br", "zlg.br", "bs", "com.bs", "edu.bs", "gov.bs", "net.bs", "org.bs", "bt", "com.bt", "edu.bt", "gov.bt", "net.bt", "org.bt", "bv", "bw", "co.bw", "org.bw", "by", "gov.by", "mil.by", "com.by", "of.by", "bz", "co.bz", "com.bz", "edu.bz", "gov.bz", "net.bz", "org.bz", "ca", "ab.ca", "bc.ca", "mb.ca", "nb.ca", "nf.ca", "nl.ca", "ns.ca", "nt.ca", "nu.ca", "on.ca", "pe.ca", "qc.ca", "sk.ca", "yk.ca", "gc.ca", "cat", "cc", "cd", "gov.cd", "cf", "cg", "ch", "ci", "ac.ci", "a\xE9roport.ci", "asso.ci", "co.ci", "com.ci", "ed.ci", "edu.ci", "go.ci", "gouv.ci", "int.ci", "net.ci", "or.ci", "org.ci", "*.ck", "!www.ck", "cl", "co.cl", "gob.cl", "gov.cl", "mil.cl", "cm", "co.cm", "com.cm", "gov.cm", "net.cm", "cn", "ac.cn", "com.cn", "edu.cn", "gov.cn", "mil.cn", "net.cn", "org.cn", "\u516C\u53F8.cn", "\u7DB2\u7D61.cn", "\u7F51\u7EDC.cn", "ah.cn", "bj.cn", "cq.cn", "fj.cn", "gd.cn", "gs.cn", "gx.cn", "gz.cn", "ha.cn", "hb.cn", "he.cn", "hi.cn", "hk.cn", "hl.cn", "hn.cn", "jl.cn", "js.cn", "jx.cn", "ln.cn", "mo.cn", "nm.cn", "nx.cn", "qh.cn", "sc.cn", "sd.cn", "sh.cn", "sn.cn", "sx.cn", "tj.cn", "tw.cn", "xj.cn", "xz.cn", "yn.cn", "zj.cn", "co", "com.co", "edu.co", "gov.co", "mil.co", "net.co", "nom.co", "org.co", "com", "coop", "cr", "ac.cr", "co.cr", "ed.cr", "fi.cr", "go.cr", "or.cr", "sa.cr", "cu", "com.cu", "edu.cu", "gob.cu", "inf.cu", "nat.cu", "net.cu", "org.cu", "cv", "com.cv", "edu.cv", "id.cv", "int.cv", "net.cv", "nome.cv", "org.cv", "publ.cv", "cw", "com.cw", "edu.cw", "net.cw", "org.cw", "cx", "gov.cx", "cy", "ac.cy", "biz.cy", "com.cy", "ekloges.cy", "gov.cy", "ltd.cy", "mil.cy", "net.cy", "org.cy", "press.cy", "pro.cy", "tm.cy", "cz", "de", "dj", "dk", "dm", "co.dm", "com.dm", "edu.dm", "gov.dm", "net.dm", "org.dm", "do", "art.do", "com.do", "edu.do", "gob.do", "gov.do", "mil.do", "net.do", "org.do", "sld.do", "web.do", "dz", "art.dz", "asso.dz", "com.dz", "edu.dz", "gov.dz", "net.dz", "org.dz", "pol.dz", "soc.dz", "tm.dz", "ec", "com.ec", "edu.ec", "fin.ec", "gob.ec", "gov.ec", "info.ec", "k12.ec", "med.ec", "mil.ec", "net.ec", "org.ec", "pro.ec", "edu", "ee", "aip.ee", "com.ee", "edu.ee", "fie.ee", "gov.ee", "lib.ee", "med.ee", "org.ee", "pri.ee", "riik.ee", "eg", "ac.eg", "com.eg", "edu.eg", "eun.eg", "gov.eg", "info.eg", "me.eg", "mil.eg", "name.eg", "net.eg", "org.eg", "sci.eg", "sport.eg", "tv.eg", "*.er", "es", "com.es", "edu.es", "gob.es", "nom.es", "org.es", "et", "biz.et", "com.et", "edu.et", "gov.et", "info.et", "name.et", "net.et", "org.et", "eu", "fi", "aland.fi", "fj", "ac.fj", "biz.fj", "com.fj", "gov.fj", "info.fj", "mil.fj", "name.fj", "net.fj", "org.fj", "pro.fj", "*.fk", "fm", "com.fm", "edu.fm", "net.fm", "org.fm", "fo", "fr", "asso.fr", "com.fr", "gouv.fr", "nom.fr", "prd.fr", "tm.fr", "avoues.fr", "cci.fr", "greta.fr", "huissier-justice.fr", "ga", "gb", "gd", "edu.gd", "gov.gd", "ge", "com.ge", "edu.ge", "gov.ge", "net.ge", "org.ge", "pvt.ge", "school.ge", "gf", "gg", "co.gg", "net.gg", "org.gg", "gh", "com.gh", "edu.gh", "gov.gh", "mil.gh", "org.gh", "gi", "com.gi", "edu.gi", "gov.gi", "ltd.gi", "mod.gi", "org.gi", "gl", "co.gl", "com.gl", "edu.gl", "net.gl", "org.gl", "gm", "gn", "ac.gn", "com.gn", "edu.gn", "gov.gn", "net.gn", "org.gn", "gov", "gp", "asso.gp", "com.gp", "edu.gp", "mobi.gp", "net.gp", "org.gp", "gq", "gr", "com.gr", "edu.gr", "gov.gr", "net.gr", "org.gr", "gs", "gt", "com.gt", "edu.gt", "gob.gt", "ind.gt", "mil.gt", "net.gt", "org.gt", "gu", "com.gu", "edu.gu", "gov.gu", "guam.gu", "info.gu", "net.gu", "org.gu", "web.gu", "gw", "gy", "co.gy", "com.gy", "edu.gy", "gov.gy", "net.gy", "org.gy", "hk", "com.hk", "edu.hk", "gov.hk", "idv.hk", "net.hk", "org.hk", "\u4E2A\u4EBA.hk", "\u500B\u4EBA.hk", "\u516C\u53F8.hk", "\u653F\u5E9C.hk", "\u654E\u80B2.hk", "\u6559\u80B2.hk", "\u7B87\u4EBA.hk", "\u7D44\u7E54.hk", "\u7D44\u7EC7.hk", "\u7DB2\u7D61.hk", "\u7DB2\u7EDC.hk", "\u7EC4\u7E54.hk", "\u7EC4\u7EC7.hk", "\u7F51\u7D61.hk", "\u7F51\u7EDC.hk", "hm", "hn", "com.hn", "edu.hn", "gob.hn", "mil.hn", "net.hn", "org.hn", "hr", "com.hr", "from.hr", "iz.hr", "name.hr", "ht", "adult.ht", "art.ht", "asso.ht", "com.ht", "coop.ht", "edu.ht", "firm.ht", "gouv.ht", "info.ht", "med.ht", "net.ht", "org.ht", "perso.ht", "pol.ht", "pro.ht", "rel.ht", "shop.ht", "hu", "2000.hu", "agrar.hu", "bolt.hu", "casino.hu", "city.hu", "co.hu", "erotica.hu", "erotika.hu", "film.hu", "forum.hu", "games.hu", "hotel.hu", "info.hu", "ingatlan.hu", "jogasz.hu", "konyvelo.hu", "lakas.hu", "media.hu", "news.hu", "org.hu", "priv.hu", "reklam.hu", "sex.hu", "shop.hu", "sport.hu", "suli.hu", "szex.hu", "tm.hu", "tozsde.hu", "utazas.hu", "video.hu", "id", "ac.id", "biz.id", "co.id", "desa.id", "go.id", "mil.id", "my.id", "net.id", "or.id", "ponpes.id", "sch.id", "web.id", "ie", "gov.ie", "il", "ac.il", "co.il", "gov.il", "idf.il", "k12.il", "muni.il", "net.il", "org.il", "\u05D9\u05E9\u05E8\u05D0\u05DC", "\u05D0\u05E7\u05D3\u05DE\u05D9\u05D4.\u05D9\u05E9\u05E8\u05D0\u05DC", "\u05D9\u05E9\u05D5\u05D1.\u05D9\u05E9\u05E8\u05D0\u05DC", "\u05E6\u05D4\u05DC.\u05D9\u05E9\u05E8\u05D0\u05DC", "\u05DE\u05DE\u05E9\u05DC.\u05D9\u05E9\u05E8\u05D0\u05DC", "im", "ac.im", "co.im", "ltd.co.im", "plc.co.im", "com.im", "net.im", "org.im", "tt.im", "tv.im", "in", "5g.in", "6g.in", "ac.in", "ai.in", "am.in", "bihar.in", "biz.in", "business.in", "ca.in", "cn.in", "co.in", "com.in", "coop.in", "cs.in", "delhi.in", "dr.in", "edu.in", "er.in", "firm.in", "gen.in", "gov.in", "gujarat.in", "ind.in", "info.in", "int.in", "internet.in", "io.in", "me.in", "mil.in", "net.in", "nic.in", "org.in", "pg.in", "post.in", "pro.in", "res.in", "travel.in", "tv.in", "uk.in", "up.in", "us.in", "info", "int", "eu.int", "io", "co.io", "com.io", "edu.io", "gov.io", "mil.io", "net.io", "nom.io", "org.io", "iq", "com.iq", "edu.iq", "gov.iq", "mil.iq", "net.iq", "org.iq", "ir", "ac.ir", "co.ir", "gov.ir", "id.ir", "net.ir", "org.ir", "sch.ir", "\u0627\u06CC\u0631\u0627\u0646.ir", "\u0627\u064A\u0631\u0627\u0646.ir", "is", "it", "edu.it", "gov.it", "abr.it", "abruzzo.it", "aosta-valley.it", "aostavalley.it", "bas.it", "basilicata.it", "cal.it", "calabria.it", "cam.it", "campania.it", "emilia-romagna.it", "emiliaromagna.it", "emr.it", "friuli-v-giulia.it", "friuli-ve-giulia.it", "friuli-vegiulia.it", "friuli-venezia-giulia.it", "friuli-veneziagiulia.it", "friuli-vgiulia.it", "friuliv-giulia.it", "friulive-giulia.it", "friulivegiulia.it", "friulivenezia-giulia.it", "friuliveneziagiulia.it", "friulivgiulia.it", "fvg.it", "laz.it", "lazio.it", "lig.it", "liguria.it", "lom.it", "lombardia.it", "lombardy.it", "lucania.it", "mar.it", "marche.it", "mol.it", "molise.it", "piedmont.it", "piemonte.it", "pmn.it", "pug.it", "puglia.it", "sar.it", "sardegna.it", "sardinia.it", "sic.it", "sicilia.it", "sicily.it", "taa.it", "tos.it", "toscana.it", "trentin-sud-tirol.it", "trentin-s\xFCd-tirol.it", "trentin-sudtirol.it", "trentin-s\xFCdtirol.it", "trentin-sued-tirol.it", "trentin-suedtirol.it", "trentino.it", "trentino-a-adige.it", "trentino-aadige.it", "trentino-alto-adige.it", "trentino-altoadige.it", "trentino-s-tirol.it", "trentino-stirol.it", "trentino-sud-tirol.it", "trentino-s\xFCd-tirol.it", "trentino-sudtirol.it", "trentino-s\xFCdtirol.it", "trentino-sued-tirol.it", "trentino-suedtirol.it", "trentinoa-adige.it", "trentinoaadige.it", "trentinoalto-adige.it", "trentinoaltoadige.it", "trentinos-tirol.it", "trentinostirol.it", "trentinosud-tirol.it", "trentinos\xFCd-tirol.it", "trentinosudtirol.it", "trentinos\xFCdtirol.it", "trentinosued-tirol.it", "trentinosuedtirol.it", "trentinsud-tirol.it", "trentins\xFCd-tirol.it", "trentinsudtirol.it", "trentins\xFCdtirol.it", "trentinsued-tirol.it", "trentinsuedtirol.it", "tuscany.it", "umb.it", "umbria.it", "val-d-aosta.it", "val-daosta.it", "vald-aosta.it", "valdaosta.it", "valle-aosta.it", "valle-d-aosta.it", "valle-daosta.it", "valleaosta.it", "valled-aosta.it", "valledaosta.it", "vallee-aoste.it", "vall\xE9e-aoste.it", "vallee-d-aoste.it", "vall\xE9e-d-aoste.it", "valleeaoste.it", "vall\xE9eaoste.it", "valleedaoste.it", "vall\xE9edaoste.it", "vao.it", "vda.it", "ven.it", "veneto.it", "ag.it", "agrigento.it", "al.it", "alessandria.it", "alto-adige.it", "altoadige.it", "an.it", "ancona.it", "andria-barletta-trani.it", "andria-trani-barletta.it", "andriabarlettatrani.it", "andriatranibarletta.it", "ao.it", "aosta.it", "aoste.it", "ap.it", "aq.it", "aquila.it", "ar.it", "arezzo.it", "ascoli-piceno.it", "ascolipiceno.it", "asti.it", "at.it", "av.it", "avellino.it", "ba.it", "balsan.it", "balsan-sudtirol.it", "balsan-s\xFCdtirol.it", "balsan-suedtirol.it", "bari.it", "barletta-trani-andria.it", "barlettatraniandria.it", "belluno.it", "benevento.it", "bergamo.it", "bg.it", "bi.it", "biella.it", "bl.it", "bn.it", "bo.it", "bologna.it", "bolzano.it", "bolzano-altoadige.it", "bozen.it", "bozen-sudtirol.it", "bozen-s\xFCdtirol.it", "bozen-suedtirol.it", "br.it", "brescia.it", "brindisi.it", "bs.it", "bt.it", "bulsan.it", "bulsan-sudtirol.it", "bulsan-s\xFCdtirol.it", "bulsan-suedtirol.it", "bz.it", "ca.it", "cagliari.it", "caltanissetta.it", "campidano-medio.it", "campidanomedio.it", "campobasso.it", "carbonia-iglesias.it", "carboniaiglesias.it", "carrara-massa.it", "carraramassa.it", "caserta.it", "catania.it", "catanzaro.it", "cb.it", "ce.it", "cesena-forli.it", "cesena-forl\xEC.it", "cesenaforli.it", "cesenaforl\xEC.it", "ch.it", "chieti.it", "ci.it", "cl.it", "cn.it", "co.it", "como.it", "cosenza.it", "cr.it", "cremona.it", "crotone.it", "cs.it", "ct.it", "cuneo.it", "cz.it", "dell-ogliastra.it", "dellogliastra.it", "en.it", "enna.it", "fc.it", "fe.it", "fermo.it", "ferrara.it", "fg.it", "fi.it", "firenze.it", "florence.it", "fm.it", "foggia.it", "forli-cesena.it", "forl\xEC-cesena.it", "forlicesena.it", "forl\xECcesena.it", "fr.it", "frosinone.it", "ge.it", "genoa.it", "genova.it", "go.it", "gorizia.it", "gr.it", "grosseto.it", "iglesias-carbonia.it", "iglesiascarbonia.it", "im.it", "imperia.it", "is.it", "isernia.it", "kr.it", "la-spezia.it", "laquila.it", "laspezia.it", "latina.it", "lc.it", "le.it", "lecce.it", "lecco.it", "li.it", "livorno.it", "lo.it", "lodi.it", "lt.it", "lu.it", "lucca.it", "macerata.it", "mantova.it", "massa-carrara.it", "massacarrara.it", "matera.it", "mb.it", "mc.it", "me.it", "medio-campidano.it", "mediocampidano.it", "messina.it", "mi.it", "milan.it", "milano.it", "mn.it", "mo.it", "modena.it", "monza.it", "monza-brianza.it", "monza-e-della-brianza.it", "monzabrianza.it", "monzaebrianza.it", "monzaedellabrianza.it", "ms.it", "mt.it", "na.it", "naples.it", "napoli.it", "no.it", "novara.it", "nu.it", "nuoro.it", "og.it", "ogliastra.it", "olbia-tempio.it", "olbiatempio.it", "or.it", "oristano.it", "ot.it", "pa.it", "padova.it", "padua.it", "palermo.it", "parma.it", "pavia.it", "pc.it", "pd.it", "pe.it", "perugia.it", "pesaro-urbino.it", "pesarourbino.it", "pescara.it", "pg.it", "pi.it", "piacenza.it", "pisa.it", "pistoia.it", "pn.it", "po.it", "pordenone.it", "potenza.it", "pr.it", "prato.it", "pt.it", "pu.it", "pv.it", "pz.it", "ra.it", "ragusa.it", "ravenna.it", "rc.it", "re.it", "reggio-calabria.it", "reggio-emilia.it", "reggiocalabria.it", "reggioemilia.it", "rg.it", "ri.it", "rieti.it", "rimini.it", "rm.it", "rn.it", "ro.it", "roma.it", "rome.it", "rovigo.it", "sa.it", "salerno.it", "sassari.it", "savona.it", "si.it", "siena.it", "siracusa.it", "so.it", "sondrio.it", "sp.it", "sr.it", "ss.it", "s\xFCdtirol.it", "suedtirol.it", "sv.it", "ta.it", "taranto.it", "te.it", "tempio-olbia.it", "tempioolbia.it", "teramo.it", "terni.it", "tn.it", "to.it", "torino.it", "tp.it", "tr.it", "trani-andria-barletta.it", "trani-barletta-andria.it", "traniandriabarletta.it", "tranibarlettaandria.it", "trapani.it", "trento.it", "treviso.it", "trieste.it", "ts.it", "turin.it", "tv.it", "ud.it", "udine.it", "urbino-pesaro.it", "urbinopesaro.it", "va.it", "varese.it", "vb.it", "vc.it", "ve.it", "venezia.it", "venice.it", "verbania.it", "vercelli.it", "verona.it", "vi.it", "vibo-valentia.it", "vibovalentia.it", "vicenza.it", "viterbo.it", "vr.it", "vs.it", "vt.it", "vv.it", "je", "co.je", "net.je", "org.je", "*.jm", "jo", "agri.jo", "ai.jo", "com.jo", "edu.jo", "eng.jo", "fm.jo", "gov.jo", "mil.jo", "net.jo", "org.jo", "per.jo", "phd.jo", "sch.jo", "tv.jo", "jobs", "jp", "ac.jp", "ad.jp", "co.jp", "ed.jp", "go.jp", "gr.jp", "lg.jp", "ne.jp", "or.jp", "aichi.jp", "akita.jp", "aomori.jp", "chiba.jp", "ehime.jp", "fukui.jp", "fukuoka.jp", "fukushima.jp", "gifu.jp", "gunma.jp", "hiroshima.jp", "hokkaido.jp", "hyogo.jp", "ibaraki.jp", "ishikawa.jp", "iwate.jp", "kagawa.jp", "kagoshima.jp", "kanagawa.jp", "kochi.jp", "kumamoto.jp", "kyoto.jp", "mie.jp", "miyagi.jp", "miyazaki.jp", "nagano.jp", "nagasaki.jp", "nara.jp", "niigata.jp", "oita.jp", "okayama.jp", "okinawa.jp", "osaka.jp", "saga.jp", "saitama.jp", "shiga.jp", "shimane.jp", "shizuoka.jp", "tochigi.jp", "tokushima.jp", "tokyo.jp", "tottori.jp", "toyama.jp", "wakayama.jp", "yamagata.jp", "yamaguchi.jp", "yamanashi.jp", "\u4E09\u91CD.jp", "\u4EAC\u90FD.jp", "\u4F50\u8CC0.jp", "\u5175\u5EAB.jp", "\u5317\u6D77\u9053.jp", "\u5343\u8449.jp", "\u548C\u6B4C\u5C71.jp", "\u57FC\u7389.jp", "\u5927\u5206.jp", "\u5927\u962A.jp", "\u5948\u826F.jp", "\u5BAE\u57CE.jp", "\u5BAE\u5D0E.jp", "\u5BCC\u5C71.jp", "\u5C71\u53E3.jp", "\u5C71\u5F62.jp", "\u5C71\u68A8.jp", "\u5C90\u961C.jp", "\u5CA1\u5C71.jp", "\u5CA9\u624B.jp", "\u5CF6\u6839.jp", "\u5E83\u5CF6.jp", "\u5FB3\u5CF6.jp", "\u611B\u5A9B.jp", "\u611B\u77E5.jp", "\u65B0\u6F5F.jp", "\u6771\u4EAC.jp", "\u6803\u6728.jp", "\u6C96\u7E04.jp", "\u6ECB\u8CC0.jp", "\u718A\u672C.jp", "\u77F3\u5DDD.jp", "\u795E\u5948\u5DDD.jp", "\u798F\u4E95.jp", "\u798F\u5CA1.jp", "\u798F\u5CF6.jp", "\u79CB\u7530.jp", "\u7FA4\u99AC.jp", "\u8328\u57CE.jp", "\u9577\u5D0E.jp", "\u9577\u91CE.jp", "\u9752\u68EE.jp", "\u9759\u5CA1.jp", "\u9999\u5DDD.jp", "\u9AD8\u77E5.jp", "\u9CE5\u53D6.jp", "\u9E7F\u5150\u5CF6.jp", "*.kawasaki.jp", "!city.kawasaki.jp", "*.kitakyushu.jp", "!city.kitakyushu.jp", "*.kobe.jp", "!city.kobe.jp", "*.nagoya.jp", "!city.nagoya.jp", "*.sapporo.jp", "!city.sapporo.jp", "*.sendai.jp", "!city.sendai.jp", "*.yokohama.jp", "!city.yokohama.jp", "aisai.aichi.jp", "ama.aichi.jp", "anjo.aichi.jp", "asuke.aichi.jp", "chiryu.aichi.jp", "chita.aichi.jp", "fuso.aichi.jp", "gamagori.aichi.jp", "handa.aichi.jp", "hazu.aichi.jp", "hekinan.aichi.jp", "higashiura.aichi.jp", "ichinomiya.aichi.jp", "inazawa.aichi.jp", "inuyama.aichi.jp", "isshiki.aichi.jp", "iwakura.aichi.jp", "kanie.aichi.jp", "kariya.aichi.jp", "kasugai.aichi.jp", "kira.aichi.jp", "kiyosu.aichi.jp", "komaki.aichi.jp", "konan.aichi.jp", "kota.aichi.jp", "mihama.aichi.jp", "miyoshi.aichi.jp", "nishio.aichi.jp", "nisshin.aichi.jp", "obu.aichi.jp", "oguchi.aichi.jp", "oharu.aichi.jp", "okazaki.aichi.jp", "owariasahi.aichi.jp", "seto.aichi.jp", "shikatsu.aichi.jp", "shinshiro.aichi.jp", "shitara.aichi.jp", "tahara.aichi.jp", "takahama.aichi.jp", "tobishima.aichi.jp", "toei.aichi.jp", "togo.aichi.jp", "tokai.aichi.jp", "tokoname.aichi.jp", "toyoake.aichi.jp", "toyohashi.aichi.jp", "toyokawa.aichi.jp", "toyone.aichi.jp", "toyota.aichi.jp", "tsushima.aichi.jp", "yatomi.aichi.jp", "akita.akita.jp", "daisen.akita.jp", "fujisato.akita.jp", "gojome.akita.jp", "hachirogata.akita.jp", "happou.akita.jp", "higashinaruse.akita.jp", "honjo.akita.jp", "honjyo.akita.jp", "ikawa.akita.jp", "kamikoani.akita.jp", "kamioka.akita.jp", "katagami.akita.jp", "kazuno.akita.jp", "kitaakita.akita.jp", "kosaka.akita.jp", "kyowa.akita.jp", "misato.akita.jp", "mitane.akita.jp", "moriyoshi.akita.jp", "nikaho.akita.jp", "noshiro.akita.jp", "odate.akita.jp", "oga.akita.jp", "ogata.akita.jp", "semboku.akita.jp", "yokote.akita.jp", "yurihonjo.akita.jp", "aomori.aomori.jp", "gonohe.aomori.jp", "hachinohe.aomori.jp", "hashikami.aomori.jp", "hiranai.aomori.jp", "hirosaki.aomori.jp", "itayanagi.aomori.jp", "kuroishi.aomori.jp", "misawa.aomori.jp", "mutsu.aomori.jp", "nakadomari.aomori.jp", "noheji.aomori.jp", "oirase.aomori.jp", "owani.aomori.jp", "rokunohe.aomori.jp", "sannohe.aomori.jp", "shichinohe.aomori.jp", "shingo.aomori.jp", "takko.aomori.jp", "towada.aomori.jp", "tsugaru.aomori.jp", "tsuruta.aomori.jp", "abiko.chiba.jp", "asahi.chiba.jp", "chonan.chiba.jp", "chosei.chiba.jp", "choshi.chiba.jp", "chuo.chiba.jp", "funabashi.chiba.jp", "futtsu.chiba.jp", "hanamigawa.chiba.jp", "ichihara.chiba.jp", "ichikawa.chiba.jp", "ichinomiya.chiba.jp", "inzai.chiba.jp", "isumi.chiba.jp", "kamagaya.chiba.jp", "kamogawa.chiba.jp", "kashiwa.chiba.jp", "katori.chiba.jp", "katsuura.chiba.jp", "kimitsu.chiba.jp", "kisarazu.chiba.jp", "kozaki.chiba.jp", "kujukuri.chiba.jp", "kyonan.chiba.jp", "matsudo.chiba.jp", "midori.chiba.jp", "mihama.chiba.jp", "minamiboso.chiba.jp", "mobara.chiba.jp", "mutsuzawa.chiba.jp", "nagara.chiba.jp", "nagareyama.chiba.jp", "narashino.chiba.jp", "narita.chiba.jp", "noda.chiba.jp", "oamishirasato.chiba.jp", "omigawa.chiba.jp", "onjuku.chiba.jp", "otaki.chiba.jp", "sakae.chiba.jp", "sakura.chiba.jp", "shimofusa.chiba.jp", "shirako.chiba.jp", "shiroi.chiba.jp", "shisui.chiba.jp", "sodegaura.chiba.jp", "sosa.chiba.jp", "tako.chiba.jp", "tateyama.chiba.jp", "togane.chiba.jp", "tohnosho.chiba.jp", "tomisato.chiba.jp", "urayasu.chiba.jp", "yachimata.chiba.jp", "yachiyo.chiba.jp", "yokaichiba.chiba.jp", "yokoshibahikari.chiba.jp", "yotsukaido.chiba.jp", "ainan.ehime.jp", "honai.ehime.jp", "ikata.ehime.jp", "imabari.ehime.jp", "iyo.ehime.jp", "kamijima.ehime.jp", "kihoku.ehime.jp", "kumakogen.ehime.jp", "masaki.ehime.jp", "matsuno.ehime.jp", "matsuyama.ehime.jp", "namikata.ehime.jp", "niihama.ehime.jp", "ozu.ehime.jp", "saijo.ehime.jp", "seiyo.ehime.jp", "shikokuchuo.ehime.jp", "tobe.ehime.jp", "toon.ehime.jp", "uchiko.ehime.jp", "uwajima.ehime.jp", "yawatahama.ehime.jp", "echizen.fukui.jp", "eiheiji.fukui.jp", "fukui.fukui.jp", "ikeda.fukui.jp", "katsuyama.fukui.jp", "mihama.fukui.jp", "minamiechizen.fukui.jp", "obama.fukui.jp", "ohi.fukui.jp", "ono.fukui.jp", "sabae.fukui.jp", "sakai.fukui.jp", "takahama.fukui.jp", "tsuruga.fukui.jp", "wakasa.fukui.jp", "ashiya.fukuoka.jp", "buzen.fukuoka.jp", "chikugo.fukuoka.jp", "chikuho.fukuoka.jp", "chikujo.fukuoka.jp", "chikushino.fukuoka.jp", "chikuzen.fukuoka.jp", "chuo.fukuoka.jp", "dazaifu.fukuoka.jp", "fukuchi.fukuoka.jp", "hakata.fukuoka.jp", "higashi.fukuoka.jp", "hirokawa.fukuoka.jp", "hisayama.fukuoka.jp", "iizuka.fukuoka.jp", "inatsuki.fukuoka.jp", "kaho.fukuoka.jp", "kasuga.fukuoka.jp", "kasuya.fukuoka.jp", "kawara.fukuoka.jp", "keisen.fukuoka.jp", "koga.fukuoka.jp", "kurate.fukuoka.jp", "kurogi.fukuoka.jp", "kurume.fukuoka.jp", "minami.fukuoka.jp", "miyako.fukuoka.jp", "miyama.fukuoka.jp", "miyawaka.fukuoka.jp", "mizumaki.fukuoka.jp", "munakata.fukuoka.jp", "nakagawa.fukuoka.jp", "nakama.fukuoka.jp", "nishi.fukuoka.jp", "nogata.fukuoka.jp", "ogori.fukuoka.jp", "okagaki.fukuoka.jp", "okawa.fukuoka.jp", "oki.fukuoka.jp", "omuta.fukuoka.jp", "onga.fukuoka.jp", "onojo.fukuoka.jp", "oto.fukuoka.jp", "saigawa.fukuoka.jp", "sasaguri.fukuoka.jp", "shingu.fukuoka.jp", "shinyoshitomi.fukuoka.jp", "shonai.fukuoka.jp", "soeda.fukuoka.jp", "sue.fukuoka.jp", "tachiarai.fukuoka.jp", "tagawa.fukuoka.jp", "takata.fukuoka.jp", "toho.fukuoka.jp", "toyotsu.fukuoka.jp", "tsuiki.fukuoka.jp", "ukiha.fukuoka.jp", "umi.fukuoka.jp", "usui.fukuoka.jp", "yamada.fukuoka.jp", "yame.fukuoka.jp", "yanagawa.fukuoka.jp", "yukuhashi.fukuoka.jp", "aizubange.fukushima.jp", "aizumisato.fukushima.jp", "aizuwakamatsu.fukushima.jp", "asakawa.fukushima.jp", "bandai.fukushima.jp", "date.fukushima.jp", "fukushima.fukushima.jp", "furudono.fukushima.jp", "futaba.fukushima.jp", "hanawa.fukushima.jp", "higashi.fukushima.jp", "hirata.fukushima.jp", "hirono.fukushima.jp", "iitate.fukushima.jp", "inawashiro.fukushima.jp", "ishikawa.fukushima.jp", "iwaki.fukushima.jp", "izumizaki.fukushima.jp", "kagamiishi.fukushima.jp", "kaneyama.fukushima.jp", "kawamata.fukushima.jp", "kitakata.fukushima.jp", "kitashiobara.fukushima.jp", "koori.fukushima.jp", "koriyama.fukushima.jp", "kunimi.fukushima.jp", "miharu.fukushima.jp", "mishima.fukushima.jp", "namie.fukushima.jp", "nango.fukushima.jp", "nishiaizu.fukushima.jp", "nishigo.fukushima.jp", "okuma.fukushima.jp", "omotego.fukushima.jp", "ono.fukushima.jp", "otama.fukushima.jp", "samegawa.fukushima.jp", "shimogo.fukushima.jp", "shirakawa.fukushima.jp", "showa.fukushima.jp", "soma.fukushima.jp", "sukagawa.fukushima.jp", "taishin.fukushima.jp", "tamakawa.fukushima.jp", "tanagura.fukushima.jp", "tenei.fukushima.jp", "yabuki.fukushima.jp", "yamato.fukushima.jp", "yamatsuri.fukushima.jp", "yanaizu.fukushima.jp", "yugawa.fukushima.jp", "anpachi.gifu.jp", "ena.gifu.jp", "gifu.gifu.jp", "ginan.gifu.jp", "godo.gifu.jp", "gujo.gifu.jp", "hashima.gifu.jp", "hichiso.gifu.jp", "hida.gifu.jp", "higashishirakawa.gifu.jp", "ibigawa.gifu.jp", "ikeda.gifu.jp", "kakamigahara.gifu.jp", "kani.gifu.jp", "kasahara.gifu.jp", "kasamatsu.gifu.jp", "kawaue.gifu.jp", "kitagata.gifu.jp", "mino.gifu.jp", "minokamo.gifu.jp", "mitake.gifu.jp", "mizunami.gifu.jp", "motosu.gifu.jp", "nakatsugawa.gifu.jp", "ogaki.gifu.jp", "sakahogi.gifu.jp", "seki.gifu.jp", "sekigahara.gifu.jp", "shirakawa.gifu.jp", "tajimi.gifu.jp", "takayama.gifu.jp", "tarui.gifu.jp", "toki.gifu.jp", "tomika.gifu.jp", "wanouchi.gifu.jp", "yamagata.gifu.jp", "yaotsu.gifu.jp", "yoro.gifu.jp", "annaka.gunma.jp", "chiyoda.gunma.jp", "fujioka.gunma.jp", "higashiagatsuma.gunma.jp", "isesaki.gunma.jp", "itakura.gunma.jp", "kanna.gunma.jp", "kanra.gunma.jp", "katashina.gunma.jp", "kawaba.gunma.jp", "kiryu.gunma.jp", "kusatsu.gunma.jp", "maebashi.gunma.jp", "meiwa.gunma.jp", "midori.gunma.jp", "minakami.gunma.jp", "naganohara.gunma.jp", "nakanojo.gunma.jp", "nanmoku.gunma.jp", "numata.gunma.jp", "oizumi.gunma.jp", "ora.gunma.jp", "ota.gunma.jp", "shibukawa.gunma.jp", "shimonita.gunma.jp", "shinto.gunma.jp", "showa.gunma.jp", "takasaki.gunma.jp", "takayama.gunma.jp", "tamamura.gunma.jp", "tatebayashi.gunma.jp", "tomioka.gunma.jp", "tsukiyono.gunma.jp", "tsumagoi.gunma.jp", "ueno.gunma.jp", "yoshioka.gunma.jp", "asaminami.hiroshima.jp", "daiwa.hiroshima.jp", "etajima.hiroshima.jp", "fuchu.hiroshima.jp", "fukuyama.hiroshima.jp", "hatsukaichi.hiroshima.jp", "higashihiroshima.hiroshima.jp", "hongo.hiroshima.jp", "jinsekikogen.hiroshima.jp", "kaita.hiroshima.jp", "kui.hiroshima.jp", "kumano.hiroshima.jp", "kure.hiroshima.jp", "mihara.hiroshima.jp", "miyoshi.hiroshima.jp", "naka.hiroshima.jp", "onomichi.hiroshima.jp", "osakikamijima.hiroshima.jp", "otake.hiroshima.jp", "saka.hiroshima.jp", "sera.hiroshima.jp", "seranishi.hiroshima.jp", "shinichi.hiroshima.jp", "shobara.hiroshima.jp", "takehara.hiroshima.jp", "abashiri.hokkaido.jp", "abira.hokkaido.jp", "aibetsu.hokkaido.jp", "akabira.hokkaido.jp", "akkeshi.hokkaido.jp", "asahikawa.hokkaido.jp", "ashibetsu.hokkaido.jp", "ashoro.hokkaido.jp", "assabu.hokkaido.jp", "atsuma.hokkaido.jp", "bibai.hokkaido.jp", "biei.hokkaido.jp", "bifuka.hokkaido.jp", "bihoro.hokkaido.jp", "biratori.hokkaido.jp", "chippubetsu.hokkaido.jp", "chitose.hokkaido.jp", "date.hokkaido.jp", "ebetsu.hokkaido.jp", "embetsu.hokkaido.jp", "eniwa.hokkaido.jp", "erimo.hokkaido.jp", "esan.hokkaido.jp", "esashi.hokkaido.jp", "fukagawa.hokkaido.jp", "fukushima.hokkaido.jp", "furano.hokkaido.jp", "furubira.hokkaido.jp", "haboro.hokkaido.jp", "hakodate.hokkaido.jp", "hamatonbetsu.hokkaido.jp", "hidaka.hokkaido.jp", "higashikagura.hokkaido.jp", "higashikawa.hokkaido.jp", "hiroo.hokkaido.jp", "hokuryu.hokkaido.jp", "hokuto.hokkaido.jp", "honbetsu.hokkaido.jp", "horokanai.hokkaido.jp", "horonobe.hokkaido.jp", "ikeda.hokkaido.jp", "imakane.hokkaido.jp", "ishikari.hokkaido.jp", "iwamizawa.hokkaido.jp", "iwanai.hokkaido.jp", "kamifurano.hokkaido.jp", "kamikawa.hokkaido.jp", "kamishihoro.hokkaido.jp", "kamisunagawa.hokkaido.jp", "kamoenai.hokkaido.jp", "kayabe.hokkaido.jp", "kembuchi.hokkaido.jp", "kikonai.hokkaido.jp", "kimobetsu.hokkaido.jp", "kitahiroshima.hokkaido.jp", "kitami.hokkaido.jp", "kiyosato.hokkaido.jp", "koshimizu.hokkaido.jp", "kunneppu.hokkaido.jp", "kuriyama.hokkaido.jp", "kuromatsunai.hokkaido.jp", "kushiro.hokkaido.jp", "kutchan.hokkaido.jp", "kyowa.hokkaido.jp", "mashike.hokkaido.jp", "matsumae.hokkaido.jp", "mikasa.hokkaido.jp", "minamifurano.hokkaido.jp", "mombetsu.hokkaido.jp", "moseushi.hokkaido.jp", "mukawa.hokkaido.jp", "muroran.hokkaido.jp", "naie.hokkaido.jp", "nakagawa.hokkaido.jp", "nakasatsunai.hokkaido.jp", "nakatombetsu.hokkaido.jp", "nanae.hokkaido.jp", "nanporo.hokkaido.jp", "nayoro.hokkaido.jp", "nemuro.hokkaido.jp", "niikappu.hokkaido.jp", "niki.hokkaido.jp", "nishiokoppe.hokkaido.jp", "noboribetsu.hokkaido.jp", "numata.hokkaido.jp", "obihiro.hokkaido.jp", "obira.hokkaido.jp", "oketo.hokkaido.jp", "okoppe.hokkaido.jp", "otaru.hokkaido.jp", "otobe.hokkaido.jp", "otofuke.hokkaido.jp", "otoineppu.hokkaido.jp", "oumu.hokkaido.jp", "ozora.hokkaido.jp", "pippu.hokkaido.jp", "rankoshi.hokkaido.jp", "rebun.hokkaido.jp", "rikubetsu.hokkaido.jp", "rishiri.hokkaido.jp", "rishirifuji.hokkaido.jp", "saroma.hokkaido.jp", "sarufutsu.hokkaido.jp", "shakotan.hokkaido.jp", "shari.hokkaido.jp", "shibecha.hokkaido.jp", "shibetsu.hokkaido.jp", "shikabe.hokkaido.jp", "shikaoi.hokkaido.jp", "shimamaki.hokkaido.jp", "shimizu.hokkaido.jp", "shimokawa.hokkaido.jp", "shinshinotsu.hokkaido.jp", "shintoku.hokkaido.jp", "shiranuka.hokkaido.jp", "shiraoi.hokkaido.jp", "shiriuchi.hokkaido.jp", "sobetsu.hokkaido.jp", "sunagawa.hokkaido.jp", "taiki.hokkaido.jp", "takasu.hokkaido.jp", "takikawa.hokkaido.jp", "takinoue.hokkaido.jp", "teshikaga.hokkaido.jp", "tobetsu.hokkaido.jp", "tohma.hokkaido.jp", "tomakomai.hokkaido.jp", "tomari.hokkaido.jp", "toya.hokkaido.jp", "toyako.hokkaido.jp", "toyotomi.hokkaido.jp", "toyoura.hokkaido.jp", "tsubetsu.hokkaido.jp", "tsukigata.hokkaido.jp", "urakawa.hokkaido.jp", "urausu.hokkaido.jp", "uryu.hokkaido.jp", "utashinai.hokkaido.jp", "wakkanai.hokkaido.jp", "wassamu.hokkaido.jp", "yakumo.hokkaido.jp", "yoichi.hokkaido.jp", "aioi.hyogo.jp", "akashi.hyogo.jp", "ako.hyogo.jp", "amagasaki.hyogo.jp", "aogaki.hyogo.jp", "asago.hyogo.jp", "ashiya.hyogo.jp", "awaji.hyogo.jp", "fukusaki.hyogo.jp", "goshiki.hyogo.jp", "harima.hyogo.jp", "himeji.hyogo.jp", "ichikawa.hyogo.jp", "inagawa.hyogo.jp", "itami.hyogo.jp", "kakogawa.hyogo.jp", "kamigori.hyogo.jp", "kamikawa.hyogo.jp", "kasai.hyogo.jp", "kasuga.hyogo.jp", "kawanishi.hyogo.jp", "miki.hyogo.jp", "minamiawaji.hyogo.jp", "nishinomiya.hyogo.jp", "nishiwaki.hyogo.jp", "ono.hyogo.jp", "sanda.hyogo.jp", "sannan.hyogo.jp", "sasayama.hyogo.jp", "sayo.hyogo.jp", "shingu.hyogo.jp", "shinonsen.hyogo.jp", "shiso.hyogo.jp", "sumoto.hyogo.jp", "taishi.hyogo.jp", "taka.hyogo.jp", "takarazuka.hyogo.jp", "takasago.hyogo.jp", "takino.hyogo.jp", "tamba.hyogo.jp", "tatsuno.hyogo.jp", "toyooka.hyogo.jp", "yabu.hyogo.jp", "yashiro.hyogo.jp", "yoka.hyogo.jp", "yokawa.hyogo.jp", "ami.ibaraki.jp", "asahi.ibaraki.jp", "bando.ibaraki.jp", "chikusei.ibaraki.jp", "daigo.ibaraki.jp", "fujishiro.ibaraki.jp", "hitachi.ibaraki.jp", "hitachinaka.ibaraki.jp", "hitachiomiya.ibaraki.jp", "hitachiota.ibaraki.jp", "ibaraki.ibaraki.jp", "ina.ibaraki.jp", "inashiki.ibaraki.jp", "itako.ibaraki.jp", "iwama.ibaraki.jp", "joso.ibaraki.jp", "kamisu.ibaraki.jp", "kasama.ibaraki.jp", "kashima.ibaraki.jp", "kasumigaura.ibaraki.jp", "koga.ibaraki.jp", "miho.ibaraki.jp", "mito.ibaraki.jp", "moriya.ibaraki.jp", "naka.ibaraki.jp", "namegata.ibaraki.jp", "oarai.ibaraki.jp", "ogawa.ibaraki.jp", "omitama.ibaraki.jp", "ryugasaki.ibaraki.jp", "sakai.ibaraki.jp", "sakuragawa.ibaraki.jp", "shimodate.ibaraki.jp", "shimotsuma.ibaraki.jp", "shirosato.ibaraki.jp", "sowa.ibaraki.jp", "suifu.ibaraki.jp", "takahagi.ibaraki.jp", "tamatsukuri.ibaraki.jp", "tokai.ibaraki.jp", "tomobe.ibaraki.jp", "tone.ibaraki.jp", "toride.ibaraki.jp", "tsuchiura.ibaraki.jp", "tsukuba.ibaraki.jp", "uchihara.ibaraki.jp", "ushiku.ibaraki.jp", "yachiyo.ibaraki.jp", "yamagata.ibaraki.jp", "yawara.ibaraki.jp", "yuki.ibaraki.jp", "anamizu.ishikawa.jp", "hakui.ishikawa.jp", "hakusan.ishikawa.jp", "kaga.ishikawa.jp", "kahoku.ishikawa.jp", "kanazawa.ishikawa.jp", "kawakita.ishikawa.jp", "komatsu.ishikawa.jp", "nakanoto.ishikawa.jp", "nanao.ishikawa.jp", "nomi.ishikawa.jp", "nonoichi.ishikawa.jp", "noto.ishikawa.jp", "shika.ishikawa.jp", "suzu.ishikawa.jp", "tsubata.ishikawa.jp", "tsurugi.ishikawa.jp", "uchinada.ishikawa.jp", "wajima.ishikawa.jp", "fudai.iwate.jp", "fujisawa.iwate.jp", "hanamaki.iwate.jp", "hiraizumi.iwate.jp", "hirono.iwate.jp", "ichinohe.iwate.jp", "ichinoseki.iwate.jp", "iwaizumi.iwate.jp", "iwate.iwate.jp", "joboji.iwate.jp", "kamaishi.iwate.jp", "kanegasaki.iwate.jp", "karumai.iwate.jp", "kawai.iwate.jp", "kitakami.iwate.jp", "kuji.iwate.jp", "kunohe.iwate.jp", "kuzumaki.iwate.jp", "miyako.iwate.jp", "mizusawa.iwate.jp", "morioka.iwate.jp", "ninohe.iwate.jp", "noda.iwate.jp", "ofunato.iwate.jp", "oshu.iwate.jp", "otsuchi.iwate.jp", "rikuzentakata.iwate.jp", "shiwa.iwate.jp", "shizukuishi.iwate.jp", "sumita.iwate.jp", "tanohata.iwate.jp", "tono.iwate.jp", "yahaba.iwate.jp", "yamada.iwate.jp", "ayagawa.kagawa.jp", "higashikagawa.kagawa.jp", "kanonji.kagawa.jp", "kotohira.kagawa.jp", "manno.kagawa.jp", "marugame.kagawa.jp", "mitoyo.kagawa.jp", "naoshima.kagawa.jp", "sanuki.kagawa.jp", "tadotsu.kagawa.jp", "takamatsu.kagawa.jp", "tonosho.kagawa.jp", "uchinomi.kagawa.jp", "utazu.kagawa.jp", "zentsuji.kagawa.jp", "akune.kagoshima.jp", "amami.kagoshima.jp", "hioki.kagoshima.jp", "isa.kagoshima.jp", "isen.kagoshima.jp", "izumi.kagoshima.jp", "kagoshima.kagoshima.jp", "kanoya.kagoshima.jp", "kawanabe.kagoshima.jp", "kinko.kagoshima.jp", "kouyama.kagoshima.jp", "makurazaki.kagoshima.jp", "matsumoto.kagoshima.jp", "minamitane.kagoshima.jp", "nakatane.kagoshima.jp", "nishinoomote.kagoshima.jp", "satsumasendai.kagoshima.jp", "soo.kagoshima.jp", "tarumizu.kagoshima.jp", "yusui.kagoshima.jp", "aikawa.kanagawa.jp", "atsugi.kanagawa.jp", "ayase.kanagawa.jp", "chigasaki.kanagawa.jp", "ebina.kanagawa.jp", "fujisawa.kanagawa.jp", "hadano.kanagawa.jp", "hakone.kanagawa.jp", "hiratsuka.kanagawa.jp", "isehara.kanagawa.jp", "kaisei.kanagawa.jp", "kamakura.kanagawa.jp", "kiyokawa.kanagawa.jp", "matsuda.kanagawa.jp", "minamiashigara.kanagawa.jp", "miura.kanagawa.jp", "nakai.kanagawa.jp", "ninomiya.kanagawa.jp", "odawara.kanagawa.jp", "oi.kanagawa.jp", "oiso.kanagawa.jp", "sagamihara.kanagawa.jp", "samukawa.kanagawa.jp", "tsukui.kanagawa.jp", "yamakita.kanagawa.jp", "yamato.kanagawa.jp", "yokosuka.kanagawa.jp", "yugawara.kanagawa.jp", "zama.kanagawa.jp", "zushi.kanagawa.jp", "aki.kochi.jp", "geisei.kochi.jp", "hidaka.kochi.jp", "higashitsuno.kochi.jp", "ino.kochi.jp", "kagami.kochi.jp", "kami.kochi.jp", "kitagawa.kochi.jp", "kochi.kochi.jp", "mihara.kochi.jp", "motoyama.kochi.jp", "muroto.kochi.jp", "nahari.kochi.jp", "nakamura.kochi.jp", "nankoku.kochi.jp", "nishitosa.kochi.jp", "niyodogawa.kochi.jp", "ochi.kochi.jp", "okawa.kochi.jp", "otoyo.kochi.jp", "otsuki.kochi.jp", "sakawa.kochi.jp", "sukumo.kochi.jp", "susaki.kochi.jp", "tosa.kochi.jp", "tosashimizu.kochi.jp", "toyo.kochi.jp", "tsuno.kochi.jp", "umaji.kochi.jp", "yasuda.kochi.jp", "yusuhara.kochi.jp", "amakusa.kumamoto.jp", "arao.kumamoto.jp", "aso.kumamoto.jp", "choyo.kumamoto.jp", "gyokuto.kumamoto.jp", "kamiamakusa.kumamoto.jp", "kikuchi.kumamoto.jp", "kumamoto.kumamoto.jp", "mashiki.kumamoto.jp", "mifune.kumamoto.jp", "minamata.kumamoto.jp", "minamioguni.kumamoto.jp", "nagasu.kumamoto.jp", "nishihara.kumamoto.jp", "oguni.kumamoto.jp", "ozu.kumamoto.jp", "sumoto.kumamoto.jp", "takamori.kumamoto.jp", "uki.kumamoto.jp", "uto.kumamoto.jp", "yamaga.kumamoto.jp", "yamato.kumamoto.jp", "yatsushiro.kumamoto.jp", "ayabe.kyoto.jp", "fukuchiyama.kyoto.jp", "higashiyama.kyoto.jp", "ide.kyoto.jp", "ine.kyoto.jp", "joyo.kyoto.jp", "kameoka.kyoto.jp", "kamo.kyoto.jp", "kita.kyoto.jp", "kizu.kyoto.jp", "kumiyama.kyoto.jp", "kyotamba.kyoto.jp", "kyotanabe.kyoto.jp", "kyotango.kyoto.jp", "maizuru.kyoto.jp", "minami.kyoto.jp", "minamiyamashiro.kyoto.jp", "miyazu.kyoto.jp", "muko.kyoto.jp", "nagaokakyo.kyoto.jp", "nakagyo.kyoto.jp", "nantan.kyoto.jp", "oyamazaki.kyoto.jp", "sakyo.kyoto.jp", "seika.kyoto.jp", "tanabe.kyoto.jp", "uji.kyoto.jp", "ujitawara.kyoto.jp", "wazuka.kyoto.jp", "yamashina.kyoto.jp", "yawata.kyoto.jp", "asahi.mie.jp", "inabe.mie.jp", "ise.mie.jp", "kameyama.mie.jp", "kawagoe.mie.jp", "kiho.mie.jp", "kisosaki.mie.jp", "kiwa.mie.jp", "komono.mie.jp", "kumano.mie.jp", "kuwana.mie.jp", "matsusaka.mie.jp", "meiwa.mie.jp", "mihama.mie.jp", "minamiise.mie.jp", "misugi.mie.jp", "miyama.mie.jp", "nabari.mie.jp", "shima.mie.jp", "suzuka.mie.jp", "tado.mie.jp", "taiki.mie.jp", "taki.mie.jp", "tamaki.mie.jp", "toba.mie.jp", "tsu.mie.jp", "udono.mie.jp", "ureshino.mie.jp", "watarai.mie.jp", "yokkaichi.mie.jp", "furukawa.miyagi.jp", "higashimatsushima.miyagi.jp", "ishinomaki.miyagi.jp", "iwanuma.miyagi.jp", "kakuda.miyagi.jp", "kami.miyagi.jp", "kawasaki.miyagi.jp", "marumori.miyagi.jp", "matsushima.miyagi.jp", "minamisanriku.miyagi.jp", "misato.miyagi.jp", "murata.miyagi.jp", "natori.miyagi.jp", "ogawara.miyagi.jp", "ohira.miyagi.jp", "onagawa.miyagi.jp", "osaki.miyagi.jp", "rifu.miyagi.jp", "semine.miyagi.jp", "shibata.miyagi.jp", "shichikashuku.miyagi.jp", "shikama.miyagi.jp", "shiogama.miyagi.jp", "shiroishi.miyagi.jp", "tagajo.miyagi.jp", "taiwa.miyagi.jp", "tome.miyagi.jp", "tomiya.miyagi.jp", "wakuya.miyagi.jp", "watari.miyagi.jp", "yamamoto.miyagi.jp", "zao.miyagi.jp", "aya.miyazaki.jp", "ebino.miyazaki.jp", "gokase.miyazaki.jp", "hyuga.miyazaki.jp", "kadogawa.miyazaki.jp", "kawaminami.miyazaki.jp", "kijo.miyazaki.jp", "kitagawa.miyazaki.jp", "kitakata.miyazaki.jp", "kitaura.miyazaki.jp", "kobayashi.miyazaki.jp", "kunitomi.miyazaki.jp", "kushima.miyazaki.jp", "mimata.miyazaki.jp", "miyakonojo.miyazaki.jp", "miyazaki.miyazaki.jp", "morotsuka.miyazaki.jp", "nichinan.miyazaki.jp", "nishimera.miyazaki.jp", "nobeoka.miyazaki.jp", "saito.miyazaki.jp", "shiiba.miyazaki.jp", "shintomi.miyazaki.jp", "takaharu.miyazaki.jp", "takanabe.miyazaki.jp", "takazaki.miyazaki.jp", "tsuno.miyazaki.jp", "achi.nagano.jp", "agematsu.nagano.jp", "anan.nagano.jp", "aoki.nagano.jp", "asahi.nagano.jp", "azumino.nagano.jp", "chikuhoku.nagano.jp", "chikuma.nagano.jp", "chino.nagano.jp", "fujimi.nagano.jp", "hakuba.nagano.jp", "hara.nagano.jp", "hiraya.nagano.jp", "iida.nagano.jp", "iijima.nagano.jp", "iiyama.nagano.jp", "iizuna.nagano.jp", "ikeda.nagano.jp", "ikusaka.nagano.jp", "ina.nagano.jp", "karuizawa.nagano.jp", "kawakami.nagano.jp", "kiso.nagano.jp", "kisofukushima.nagano.jp", "kitaaiki.nagano.jp", "komagane.nagano.jp", "komoro.nagano.jp", "matsukawa.nagano.jp", "matsumoto.nagano.jp", "miasa.nagano.jp", "minamiaiki.nagano.jp", "minamimaki.nagano.jp", "minamiminowa.nagano.jp", "minowa.nagano.jp", "miyada.nagano.jp", "miyota.nagano.jp", "mochizuki.nagano.jp", "nagano.nagano.jp", "nagawa.nagano.jp", "nagiso.nagano.jp", "nakagawa.nagano.jp", "nakano.nagano.jp", "nozawaonsen.nagano.jp", "obuse.nagano.jp", "ogawa.nagano.jp", "okaya.nagano.jp", "omachi.nagano.jp", "omi.nagano.jp", "ookuwa.nagano.jp", "ooshika.nagano.jp", "otaki.nagano.jp", "otari.nagano.jp", "sakae.nagano.jp", "sakaki.nagano.jp", "saku.nagano.jp", "sakuho.nagano.jp", "shimosuwa.nagano.jp", "shinanomachi.nagano.jp", "shiojiri.nagano.jp", "suwa.nagano.jp", "suzaka.nagano.jp", "takagi.nagano.jp", "takamori.nagano.jp", "takayama.nagano.jp", "tateshina.nagano.jp", "tatsuno.nagano.jp", "togakushi.nagano.jp", "togura.nagano.jp", "tomi.nagano.jp", "ueda.nagano.jp", "wada.nagano.jp", "yamagata.nagano.jp", "yamanouchi.nagano.jp", "yasaka.nagano.jp", "yasuoka.nagano.jp", "chijiwa.nagasaki.jp", "futsu.nagasaki.jp", "goto.nagasaki.jp", "hasami.nagasaki.jp", "hirado.nagasaki.jp", "iki.nagasaki.jp", "isahaya.nagasaki.jp", "kawatana.nagasaki.jp", "kuchinotsu.nagasaki.jp", "matsuura.nagasaki.jp", "nagasaki.nagasaki.jp", "obama.nagasaki.jp", "omura.nagasaki.jp", "oseto.nagasaki.jp", "saikai.nagasaki.jp", "sasebo.nagasaki.jp", "seihi.nagasaki.jp", "shimabara.nagasaki.jp", "shinkamigoto.nagasaki.jp", "togitsu.nagasaki.jp", "tsushima.nagasaki.jp", "unzen.nagasaki.jp", "ando.nara.jp", "gose.nara.jp", "heguri.nara.jp", "higashiyoshino.nara.jp", "ikaruga.nara.jp", "ikoma.nara.jp", "kamikitayama.nara.jp", "kanmaki.nara.jp", "kashiba.nara.jp", "kashihara.nara.jp", "katsuragi.nara.jp", "kawai.nara.jp", "kawakami.nara.jp", "kawanishi.nara.jp", "koryo.nara.jp", "kurotaki.nara.jp", "mitsue.nara.jp", "miyake.nara.jp", "nara.nara.jp", "nosegawa.nara.jp", "oji.nara.jp", "ouda.nara.jp", "oyodo.nara.jp", "sakurai.nara.jp", "sango.nara.jp", "shimoichi.nara.jp", "shimokitayama.nara.jp", "shinjo.nara.jp", "soni.nara.jp", "takatori.nara.jp", "tawaramoto.nara.jp", "tenkawa.nara.jp", "tenri.nara.jp", "uda.nara.jp", "yamatokoriyama.nara.jp", "yamatotakada.nara.jp", "yamazoe.nara.jp", "yoshino.nara.jp", "aga.niigata.jp", "agano.niigata.jp", "gosen.niigata.jp", "itoigawa.niigata.jp", "izumozaki.niigata.jp", "joetsu.niigata.jp", "kamo.niigata.jp", "kariwa.niigata.jp", "kashiwazaki.niigata.jp", "minamiuonuma.niigata.jp", "mitsuke.niigata.jp", "muika.niigata.jp", "murakami.niigata.jp", "myoko.niigata.jp", "nagaoka.niigata.jp", "niigata.niigata.jp", "ojiya.niigata.jp", "omi.niigata.jp", "sado.niigata.jp", "sanjo.niigata.jp", "seiro.niigata.jp", "seirou.niigata.jp", "sekikawa.niigata.jp", "shibata.niigata.jp", "tagami.niigata.jp", "tainai.niigata.jp", "tochio.niigata.jp", "tokamachi.niigata.jp", "tsubame.niigata.jp", "tsunan.niigata.jp", "uonuma.niigata.jp", "yahiko.niigata.jp", "yoita.niigata.jp", "yuzawa.niigata.jp", "beppu.oita.jp", "bungoono.oita.jp", "bungotakada.oita.jp", "hasama.oita.jp", "hiji.oita.jp", "himeshima.oita.jp", "hita.oita.jp", "kamitsue.oita.jp", "kokonoe.oita.jp", "kuju.oita.jp", "kunisaki.oita.jp", "kusu.oita.jp", "oita.oita.jp", "saiki.oita.jp", "taketa.oita.jp", "tsukumi.oita.jp", "usa.oita.jp", "usuki.oita.jp", "yufu.oita.jp", "akaiwa.okayama.jp", "asakuchi.okayama.jp", "bizen.okayama.jp", "hayashima.okayama.jp", "ibara.okayama.jp", "kagamino.okayama.jp", "kasaoka.okayama.jp", "kibichuo.okayama.jp", "kumenan.okayama.jp", "kurashiki.okayama.jp", "maniwa.okayama.jp", "misaki.okayama.jp", "nagi.okayama.jp", "niimi.okayama.jp", "nishiawakura.okayama.jp", "okayama.okayama.jp", "satosho.okayama.jp", "setouchi.okayama.jp", "shinjo.okayama.jp", "shoo.okayama.jp", "soja.okayama.jp", "takahashi.okayama.jp", "tamano.okayama.jp", "tsuyama.okayama.jp", "wake.okayama.jp", "yakage.okayama.jp", "aguni.okinawa.jp", "ginowan.okinawa.jp", "ginoza.okinawa.jp", "gushikami.okinawa.jp", "haebaru.okinawa.jp", "higashi.okinawa.jp", "hirara.okinawa.jp", "iheya.okinawa.jp", "ishigaki.okinawa.jp", "ishikawa.okinawa.jp", "itoman.okinawa.jp", "izena.okinawa.jp", "kadena.okinawa.jp", "kin.okinawa.jp", "kitadaito.okinawa.jp", "kitanakagusuku.okinawa.jp", "kumejima.okinawa.jp", "kunigami.okinawa.jp", "minamidaito.okinawa.jp", "motobu.okinawa.jp", "nago.okinawa.jp", "naha.okinawa.jp", "nakagusuku.okinawa.jp", "nakijin.okinawa.jp", "nanjo.okinawa.jp", "nishihara.okinawa.jp", "ogimi.okinawa.jp", "okinawa.okinawa.jp", "onna.okinawa.jp", "shimoji.okinawa.jp", "taketomi.okinawa.jp", "tarama.okinawa.jp", "tokashiki.okinawa.jp", "tomigusuku.okinawa.jp", "tonaki.okinawa.jp", "urasoe.okinawa.jp", "uruma.okinawa.jp", "yaese.okinawa.jp", "yomitan.okinawa.jp", "yonabaru.okinawa.jp", "yonaguni.okinawa.jp", "zamami.okinawa.jp", "abeno.osaka.jp", "chihayaakasaka.osaka.jp", "chuo.osaka.jp", "daito.osaka.jp", "fujiidera.osaka.jp", "habikino.osaka.jp", "hannan.osaka.jp", "higashiosaka.osaka.jp", "higashisumiyoshi.osaka.jp", "higashiyodogawa.osaka.jp", "hirakata.osaka.jp", "ibaraki.osaka.jp", "ikeda.osaka.jp", "izumi.osaka.jp", "izumiotsu.osaka.jp", "izumisano.osaka.jp", "kadoma.osaka.jp", "kaizuka.osaka.jp", "kanan.osaka.jp", "kashiwara.osaka.jp", "katano.osaka.jp", "kawachinagano.osaka.jp", "kishiwada.osaka.jp", "kita.osaka.jp", "kumatori.osaka.jp", "matsubara.osaka.jp", "minato.osaka.jp", "minoh.osaka.jp", "misaki.osaka.jp", "moriguchi.osaka.jp", "neyagawa.osaka.jp", "nishi.osaka.jp", "nose.osaka.jp", "osakasayama.osaka.jp", "sakai.osaka.jp", "sayama.osaka.jp", "sennan.osaka.jp", "settsu.osaka.jp", "shijonawate.osaka.jp", "shimamoto.osaka.jp", "suita.osaka.jp", "tadaoka.osaka.jp", "taishi.osaka.jp", "tajiri.osaka.jp", "takaishi.osaka.jp", "takatsuki.osaka.jp", "tondabayashi.osaka.jp", "toyonaka.osaka.jp", "toyono.osaka.jp", "yao.osaka.jp", "ariake.saga.jp", "arita.saga.jp", "fukudomi.saga.jp", "genkai.saga.jp", "hamatama.saga.jp", "hizen.saga.jp", "imari.saga.jp", "kamimine.saga.jp", "kanzaki.saga.jp", "karatsu.saga.jp", "kashima.saga.jp", "kitagata.saga.jp", "kitahata.saga.jp", "kiyama.saga.jp", "kouhoku.saga.jp", "kyuragi.saga.jp", "nishiarita.saga.jp", "ogi.saga.jp", "omachi.saga.jp", "ouchi.saga.jp", "saga.saga.jp", "shiroishi.saga.jp", "taku.saga.jp", "tara.saga.jp", "tosu.saga.jp", "yoshinogari.saga.jp", "arakawa.saitama.jp", "asaka.saitama.jp", "chichibu.saitama.jp", "fujimi.saitama.jp", "fujimino.saitama.jp", "fukaya.saitama.jp", "hanno.saitama.jp", "hanyu.saitama.jp", "hasuda.saitama.jp", "hatogaya.saitama.jp", "hatoyama.saitama.jp", "hidaka.saitama.jp", "higashichichibu.saitama.jp", "higashimatsuyama.saitama.jp", "honjo.saitama.jp", "ina.saitama.jp", "iruma.saitama.jp", "iwatsuki.saitama.jp", "kamiizumi.saitama.jp", "kamikawa.saitama.jp", "kamisato.saitama.jp", "kasukabe.saitama.jp", "kawagoe.saitama.jp", "kawaguchi.saitama.jp", "kawajima.saitama.jp", "kazo.saitama.jp", "kitamoto.saitama.jp", "koshigaya.saitama.jp", "kounosu.saitama.jp", "kuki.saitama.jp", "kumagaya.saitama.jp", "matsubushi.saitama.jp", "minano.saitama.jp", "misato.saitama.jp", "miyashiro.saitama.jp", "miyoshi.saitama.jp", "moroyama.saitama.jp", "nagatoro.saitama.jp", "namegawa.saitama.jp", "niiza.saitama.jp", "ogano.saitama.jp", "ogawa.saitama.jp", "ogose.saitama.jp", "okegawa.saitama.jp", "omiya.saitama.jp", "otaki.saitama.jp", "ranzan.saitama.jp", "ryokami.saitama.jp", "saitama.saitama.jp", "sakado.saitama.jp", "satte.saitama.jp", "sayama.saitama.jp", "shiki.saitama.jp", "shiraoka.saitama.jp", "soka.saitama.jp", "sugito.saitama.jp", "toda.saitama.jp", "tokigawa.saitama.jp", "tokorozawa.saitama.jp", "tsurugashima.saitama.jp", "urawa.saitama.jp", "warabi.saitama.jp", "yashio.saitama.jp", "yokoze.saitama.jp", "yono.saitama.jp", "yorii.saitama.jp", "yoshida.saitama.jp", "yoshikawa.saitama.jp", "yoshimi.saitama.jp", "aisho.shiga.jp", "gamo.shiga.jp", "higashiomi.shiga.jp", "hikone.shiga.jp", "koka.shiga.jp", "konan.shiga.jp", "kosei.shiga.jp", "koto.shiga.jp", "kusatsu.shiga.jp", "maibara.shiga.jp", "moriyama.shiga.jp", "nagahama.shiga.jp", "nishiazai.shiga.jp", "notogawa.shiga.jp", "omihachiman.shiga.jp", "otsu.shiga.jp", "ritto.shiga.jp", "ryuoh.shiga.jp", "takashima.shiga.jp", "takatsuki.shiga.jp", "torahime.shiga.jp", "toyosato.shiga.jp", "yasu.shiga.jp", "akagi.shimane.jp", "ama.shimane.jp", "gotsu.shimane.jp", "hamada.shimane.jp", "higashiizumo.shimane.jp", "hikawa.shimane.jp", "hikimi.shimane.jp", "izumo.shimane.jp", "kakinoki.shimane.jp", "masuda.shimane.jp", "matsue.shimane.jp", "misato.shimane.jp", "nishinoshima.shimane.jp", "ohda.shimane.jp", "okinoshima.shimane.jp", "okuizumo.shimane.jp", "shimane.shimane.jp", "tamayu.shimane.jp", "tsuwano.shimane.jp", "unnan.shimane.jp", "yakumo.shimane.jp", "yasugi.shimane.jp", "yatsuka.shimane.jp", "arai.shizuoka.jp", "atami.shizuoka.jp", "fuji.shizuoka.jp", "fujieda.shizuoka.jp", "fujikawa.shizuoka.jp", "fujinomiya.shizuoka.jp", "fukuroi.shizuoka.jp", "gotemba.shizuoka.jp", "haibara.shizuoka.jp", "hamamatsu.shizuoka.jp", "higashiizu.shizuoka.jp", "ito.shizuoka.jp", "iwata.shizuoka.jp", "izu.shizuoka.jp", "izunokuni.shizuoka.jp", "kakegawa.shizuoka.jp", "kannami.shizuoka.jp", "kawanehon.shizuoka.jp", "kawazu.shizuoka.jp", "kikugawa.shizuoka.jp", "kosai.shizuoka.jp", "makinohara.shizuoka.jp", "matsuzaki.shizuoka.jp", "minamiizu.shizuoka.jp", "mishima.shizuoka.jp", "morimachi.shizuoka.jp", "nishiizu.shizuoka.jp", "numazu.shizuoka.jp", "omaezaki.shizuoka.jp", "shimada.shizuoka.jp", "shimizu.shizuoka.jp", "shimoda.shizuoka.jp", "shizuoka.shizuoka.jp", "susono.shizuoka.jp", "yaizu.shizuoka.jp", "yoshida.shizuoka.jp", "ashikaga.tochigi.jp", "bato.tochigi.jp", "haga.tochigi.jp", "ichikai.tochigi.jp", "iwafune.tochigi.jp", "kaminokawa.tochigi.jp", "kanuma.tochigi.jp", "karasuyama.tochigi.jp", "kuroiso.tochigi.jp", "mashiko.tochigi.jp", "mibu.tochigi.jp", "moka.tochigi.jp", "motegi.tochigi.jp", "nasu.tochigi.jp", "nasushiobara.tochigi.jp", "nikko.tochigi.jp", "nishikata.tochigi.jp", "nogi.tochigi.jp", "ohira.tochigi.jp", "ohtawara.tochigi.jp", "oyama.tochigi.jp", "sakura.tochigi.jp", "sano.tochigi.jp", "shimotsuke.tochigi.jp", "shioya.tochigi.jp", "takanezawa.tochigi.jp", "tochigi.tochigi.jp", "tsuga.tochigi.jp", "ujiie.tochigi.jp", "utsunomiya.tochigi.jp", "yaita.tochigi.jp", "aizumi.tokushima.jp", "anan.tokushima.jp", "ichiba.tokushima.jp", "itano.tokushima.jp", "kainan.tokushima.jp", "komatsushima.tokushima.jp", "matsushige.tokushima.jp", "mima.tokushima.jp", "minami.tokushima.jp", "miyoshi.tokushima.jp", "mugi.tokushima.jp", "nakagawa.tokushima.jp", "naruto.tokushima.jp", "sanagochi.tokushima.jp", "shishikui.tokushima.jp", "tokushima.tokushima.jp", "wajiki.tokushima.jp", "adachi.tokyo.jp", "akiruno.tokyo.jp", "akishima.tokyo.jp", "aogashima.tokyo.jp", "arakawa.tokyo.jp", "bunkyo.tokyo.jp", "chiyoda.tokyo.jp", "chofu.tokyo.jp", "chuo.tokyo.jp", "edogawa.tokyo.jp", "fuchu.tokyo.jp", "fussa.tokyo.jp", "hachijo.tokyo.jp", "hachioji.tokyo.jp", "hamura.tokyo.jp", "higashikurume.tokyo.jp", "higashimurayama.tokyo.jp", "higashiyamato.tokyo.jp", "hino.tokyo.jp", "hinode.tokyo.jp", "hinohara.tokyo.jp", "inagi.tokyo.jp", "itabashi.tokyo.jp", "katsushika.tokyo.jp", "kita.tokyo.jp", "kiyose.tokyo.jp", "kodaira.tokyo.jp", "koganei.tokyo.jp", "kokubunji.tokyo.jp", "komae.tokyo.jp", "koto.tokyo.jp", "kouzushima.tokyo.jp", "kunitachi.tokyo.jp", "machida.tokyo.jp", "meguro.tokyo.jp", "minato.tokyo.jp", "mitaka.tokyo.jp", "mizuho.tokyo.jp", "musashimurayama.tokyo.jp", "musashino.tokyo.jp", "nakano.tokyo.jp", "nerima.tokyo.jp", "ogasawara.tokyo.jp", "okutama.tokyo.jp", "ome.tokyo.jp", "oshima.tokyo.jp", "ota.tokyo.jp", "setagaya.tokyo.jp", "shibuya.tokyo.jp", "shinagawa.tokyo.jp", "shinjuku.tokyo.jp", "suginami.tokyo.jp", "sumida.tokyo.jp", "tachikawa.tokyo.jp", "taito.tokyo.jp", "tama.tokyo.jp", "toshima.tokyo.jp", "chizu.tottori.jp", "hino.tottori.jp", "kawahara.tottori.jp", "koge.tottori.jp", "kotoura.tottori.jp", "misasa.tottori.jp", "nanbu.tottori.jp", "nichinan.tottori.jp", "sakaiminato.tottori.jp", "tottori.tottori.jp", "wakasa.tottori.jp", "yazu.tottori.jp", "yonago.tottori.jp", "asahi.toyama.jp", "fuchu.toyama.jp", "fukumitsu.toyama.jp", "funahashi.toyama.jp", "himi.toyama.jp", "imizu.toyama.jp", "inami.toyama.jp", "johana.toyama.jp", "kamiichi.toyama.jp", "kurobe.toyama.jp", "nakaniikawa.toyama.jp", "namerikawa.toyama.jp", "nanto.toyama.jp", "nyuzen.toyama.jp", "oyabe.toyama.jp", "taira.toyama.jp", "takaoka.toyama.jp", "tateyama.toyama.jp", "toga.toyama.jp", "tonami.toyama.jp", "toyama.toyama.jp", "unazuki.toyama.jp", "uozu.toyama.jp", "yamada.toyama.jp", "arida.wakayama.jp", "aridagawa.wakayama.jp", "gobo.wakayama.jp", "hashimoto.wakayama.jp", "hidaka.wakayama.jp", "hirogawa.wakayama.jp", "inami.wakayama.jp", "iwade.wakayama.jp", "kainan.wakayama.jp", "kamitonda.wakayama.jp", "katsuragi.wakayama.jp", "kimino.wakayama.jp", "kinokawa.wakayama.jp", "kitayama.wakayama.jp", "koya.wakayama.jp", "koza.wakayama.jp", "kozagawa.wakayama.jp", "kudoyama.wakayama.jp", "kushimoto.wakayama.jp", "mihama.wakayama.jp", "misato.wakayama.jp", "nachikatsuura.wakayama.jp", "shingu.wakayama.jp", "shirahama.wakayama.jp", "taiji.wakayama.jp", "tanabe.wakayama.jp", "wakayama.wakayama.jp", "yuasa.wakayama.jp", "yura.wakayama.jp", "asahi.yamagata.jp", "funagata.yamagata.jp", "higashine.yamagata.jp", "iide.yamagata.jp", "kahoku.yamagata.jp", "kaminoyama.yamagata.jp", "kaneyama.yamagata.jp", "kawanishi.yamagata.jp", "mamurogawa.yamagata.jp", "mikawa.yamagata.jp", "murayama.yamagata.jp", "nagai.yamagata.jp", "nakayama.yamagata.jp", "nanyo.yamagata.jp", "nishikawa.yamagata.jp", "obanazawa.yamagata.jp", "oe.yamagata.jp", "oguni.yamagata.jp", "ohkura.yamagata.jp", "oishida.yamagata.jp", "sagae.yamagata.jp", "sakata.yamagata.jp", "sakegawa.yamagata.jp", "shinjo.yamagata.jp", "shirataka.yamagata.jp", "shonai.yamagata.jp", "takahata.yamagata.jp", "tendo.yamagata.jp", "tozawa.yamagata.jp", "tsuruoka.yamagata.jp", "yamagata.yamagata.jp", "yamanobe.yamagata.jp", "yonezawa.yamagata.jp", "yuza.yamagata.jp", "abu.yamaguchi.jp", "hagi.yamaguchi.jp", "hikari.yamaguchi.jp", "hofu.yamaguchi.jp", "iwakuni.yamaguchi.jp", "kudamatsu.yamaguchi.jp", "mitou.yamaguchi.jp", "nagato.yamaguchi.jp", "oshima.yamaguchi.jp", "shimonoseki.yamaguchi.jp", "shunan.yamaguchi.jp", "tabuse.yamaguchi.jp", "tokuyama.yamaguchi.jp", "toyota.yamaguchi.jp", "ube.yamaguchi.jp", "yuu.yamaguchi.jp", "chuo.yamanashi.jp", "doshi.yamanashi.jp", "fuefuki.yamanashi.jp", "fujikawa.yamanashi.jp", "fujikawaguchiko.yamanashi.jp", "fujiyoshida.yamanashi.jp", "hayakawa.yamanashi.jp", "hokuto.yamanashi.jp", "ichikawamisato.yamanashi.jp", "kai.yamanashi.jp", "kofu.yamanashi.jp", "koshu.yamanashi.jp", "kosuge.yamanashi.jp", "minami-alps.yamanashi.jp", "minobu.yamanashi.jp", "nakamichi.yamanashi.jp", "nanbu.yamanashi.jp", "narusawa.yamanashi.jp", "nirasaki.yamanashi.jp", "nishikatsura.yamanashi.jp", "oshino.yamanashi.jp", "otsuki.yamanashi.jp", "showa.yamanashi.jp", "tabayama.yamanashi.jp", "tsuru.yamanashi.jp", "uenohara.yamanashi.jp", "yamanakako.yamanashi.jp", "yamanashi.yamanashi.jp", "ke", "ac.ke", "co.ke", "go.ke", "info.ke", "me.ke", "mobi.ke", "ne.ke", "or.ke", "sc.ke", "kg", "com.kg", "edu.kg", "gov.kg", "mil.kg", "net.kg", "org.kg", "*.kh", "ki", "biz.ki", "com.ki", "edu.ki", "gov.ki", "info.ki", "net.ki", "org.ki", "km", "ass.km", "com.km", "edu.km", "gov.km", "mil.km", "nom.km", "org.km", "prd.km", "tm.km", "asso.km", "coop.km", "gouv.km", "medecin.km", "notaires.km", "pharmaciens.km", "presse.km", "veterinaire.km", "kn", "edu.kn", "gov.kn", "net.kn", "org.kn", "kp", "com.kp", "edu.kp", "gov.kp", "org.kp", "rep.kp", "tra.kp", "kr", "ac.kr", "co.kr", "es.kr", "go.kr", "hs.kr", "kg.kr", "mil.kr", "ms.kr", "ne.kr", "or.kr", "pe.kr", "re.kr", "sc.kr", "busan.kr", "chungbuk.kr", "chungnam.kr", "daegu.kr", "daejeon.kr", "gangwon.kr", "gwangju.kr", "gyeongbuk.kr", "gyeonggi.kr", "gyeongnam.kr", "incheon.kr", "jeju.kr", "jeonbuk.kr", "jeonnam.kr", "seoul.kr", "ulsan.kr", "kw", "com.kw", "edu.kw", "emb.kw", "gov.kw", "ind.kw", "net.kw", "org.kw", "ky", "com.ky", "edu.ky", "net.ky", "org.ky", "kz", "com.kz", "edu.kz", "gov.kz", "mil.kz", "net.kz", "org.kz", "la", "com.la", "edu.la", "gov.la", "info.la", "int.la", "net.la", "org.la", "per.la", "lb", "com.lb", "edu.lb", "gov.lb", "net.lb", "org.lb", "lc", "co.lc", "com.lc", "edu.lc", "gov.lc", "net.lc", "org.lc", "li", "lk", "ac.lk", "assn.lk", "com.lk", "edu.lk", "gov.lk", "grp.lk", "hotel.lk", "int.lk", "ltd.lk", "net.lk", "ngo.lk", "org.lk", "sch.lk", "soc.lk", "web.lk", "lr", "com.lr", "edu.lr", "gov.lr", "net.lr", "org.lr", "ls", "ac.ls", "biz.ls", "co.ls", "edu.ls", "gov.ls", "info.ls", "net.ls", "org.ls", "sc.ls", "lt", "gov.lt", "lu", "lv", "asn.lv", "com.lv", "conf.lv", "edu.lv", "gov.lv", "id.lv", "mil.lv", "net.lv", "org.lv", "ly", "com.ly", "edu.ly", "gov.ly", "id.ly", "med.ly", "net.ly", "org.ly", "plc.ly", "sch.ly", "ma", "ac.ma", "co.ma", "gov.ma", "net.ma", "org.ma", "press.ma", "mc", "asso.mc", "tm.mc", "md", "me", "ac.me", "co.me", "edu.me", "gov.me", "its.me", "net.me", "org.me", "priv.me", "mg", "co.mg", "com.mg", "edu.mg", "gov.mg", "mil.mg", "nom.mg", "org.mg", "prd.mg", "mh", "mil", "mk", "com.mk", "edu.mk", "gov.mk", "inf.mk", "name.mk", "net.mk", "org.mk", "ml", "com.ml", "edu.ml", "gouv.ml", "gov.ml", "net.ml", "org.ml", "presse.ml", "*.mm", "mn", "edu.mn", "gov.mn", "org.mn", "mo", "com.mo", "edu.mo", "gov.mo", "net.mo", "org.mo", "mobi", "mp", "mq", "mr", "gov.mr", "ms", "com.ms", "edu.ms", "gov.ms", "net.ms", "org.ms", "mt", "com.mt", "edu.mt", "net.mt", "org.mt", "mu", "ac.mu", "co.mu", "com.mu", "gov.mu", "net.mu", "or.mu", "org.mu", "museum", "mv", "aero.mv", "biz.mv", "com.mv", "coop.mv", "edu.mv", "gov.mv", "info.mv", "int.mv", "mil.mv", "museum.mv", "name.mv", "net.mv", "org.mv", "pro.mv", "mw", "ac.mw", "biz.mw", "co.mw", "com.mw", "coop.mw", "edu.mw", "gov.mw", "int.mw", "net.mw", "org.mw", "mx", "com.mx", "edu.mx", "gob.mx", "net.mx", "org.mx", "my", "biz.my", "com.my", "edu.my", "gov.my", "mil.my", "name.my", "net.my", "org.my", "mz", "ac.mz", "adv.mz", "co.mz", "edu.mz", "gov.mz", "mil.mz", "net.mz", "org.mz", "na", "alt.na", "co.na", "com.na", "gov.na", "net.na", "org.na", "name", "nc", "asso.nc", "nom.nc", "ne", "net", "nf", "arts.nf", "com.nf", "firm.nf", "info.nf", "net.nf", "other.nf", "per.nf", "rec.nf", "store.nf", "web.nf", "ng", "com.ng", "edu.ng", "gov.ng", "i.ng", "mil.ng", "mobi.ng", "name.ng", "net.ng", "org.ng", "sch.ng", "ni", "ac.ni", "biz.ni", "co.ni", "com.ni", "edu.ni", "gob.ni", "in.ni", "info.ni", "int.ni", "mil.ni", "net.ni", "nom.ni", "org.ni", "web.ni", "nl", "no", "fhs.no", "folkebibl.no", "fylkesbibl.no", "idrett.no", "museum.no", "priv.no", "vgs.no", "dep.no", "herad.no", "kommune.no", "mil.no", "stat.no", "aa.no", "ah.no", "bu.no", "fm.no", "hl.no", "hm.no", "jan-mayen.no", "mr.no", "nl.no", "nt.no", "of.no", "ol.no", "oslo.no", "rl.no", "sf.no", "st.no", "svalbard.no", "tm.no", "tr.no", "va.no", "vf.no", "gs.aa.no", "gs.ah.no", "gs.bu.no", "gs.fm.no", "gs.hl.no", "gs.hm.no", "gs.jan-mayen.no", "gs.mr.no", "gs.nl.no", "gs.nt.no", "gs.of.no", "gs.ol.no", "gs.oslo.no", "gs.rl.no", "gs.sf.no", "gs.st.no", "gs.svalbard.no", "gs.tm.no", "gs.tr.no", "gs.va.no", "gs.vf.no", "akrehamn.no", "\xE5krehamn.no", "algard.no", "\xE5lg\xE5rd.no", "arna.no", "bronnoysund.no", "br\xF8nn\xF8ysund.no", "brumunddal.no", "bryne.no", "drobak.no", "dr\xF8bak.no", "egersund.no", "fetsund.no", "floro.no", "flor\xF8.no", "fredrikstad.no", "hokksund.no", "honefoss.no", "h\xF8nefoss.no", "jessheim.no", "jorpeland.no", "j\xF8rpeland.no", "kirkenes.no", "kopervik.no", "krokstadelva.no", "langevag.no", "langev\xE5g.no", "leirvik.no", "mjondalen.no", "mj\xF8ndalen.no", "mo-i-rana.no", "mosjoen.no", "mosj\xF8en.no", "nesoddtangen.no", "orkanger.no", "osoyro.no", "os\xF8yro.no", "raholt.no", "r\xE5holt.no", "sandnessjoen.no", "sandnessj\xF8en.no", "skedsmokorset.no", "slattum.no", "spjelkavik.no", "stathelle.no", "stavern.no", "stjordalshalsen.no", "stj\xF8rdalshalsen.no", "tananger.no", "tranby.no", "vossevangen.no", "aarborte.no", "aejrie.no", "afjord.no", "\xE5fjord.no", "agdenes.no", "nes.akershus.no", "aknoluokta.no", "\xE1k\u014Boluokta.no", "al.no", "\xE5l.no", "alaheadju.no", "\xE1laheadju.no", "alesund.no", "\xE5lesund.no", "alstahaug.no", "alta.no", "\xE1lt\xE1.no", "alvdal.no", "amli.no", "\xE5mli.no", "amot.no", "\xE5mot.no", "andasuolo.no", "andebu.no", "andoy.no", "and\xF8y.no", "ardal.no", "\xE5rdal.no", "aremark.no", "arendal.no", "\xE5s.no", "aseral.no", "\xE5seral.no", "asker.no", "askim.no", "askoy.no", "ask\xF8y.no", "askvoll.no", "asnes.no", "\xE5snes.no", "audnedaln.no", "aukra.no", "aure.no", "aurland.no", "aurskog-holand.no", "aurskog-h\xF8land.no", "austevoll.no", "austrheim.no", "averoy.no", "aver\xF8y.no", "badaddja.no", "b\xE5d\xE5ddj\xE5.no", "b\xE6rum.no", "bahcavuotna.no", "b\xE1hcavuotna.no", "bahccavuotna.no", "b\xE1hccavuotna.no", "baidar.no", "b\xE1id\xE1r.no", "bajddar.no", "b\xE1jddar.no", "balat.no", "b\xE1l\xE1t.no", "balestrand.no", "ballangen.no", "balsfjord.no", "bamble.no", "bardu.no", "barum.no", "batsfjord.no", "b\xE5tsfjord.no", "bearalvahki.no", "bearalv\xE1hki.no", "beardu.no", "beiarn.no", "berg.no", "bergen.no", "berlevag.no", "berlev\xE5g.no", "bievat.no", "biev\xE1t.no", "bindal.no", "birkenes.no", "bjarkoy.no", "bjark\xF8y.no", "bjerkreim.no", "bjugn.no", "bodo.no", "bod\xF8.no", "bokn.no", "bomlo.no", "b\xF8mlo.no", "bremanger.no", "bronnoy.no", "br\xF8nn\xF8y.no", "budejju.no", "nes.buskerud.no", "bygland.no", "bykle.no", "cahcesuolo.no", "\u010D\xE1hcesuolo.no", "davvenjarga.no", "davvenj\xE1rga.no", "davvesiida.no", "deatnu.no", "dielddanuorri.no", "divtasvuodna.no", "divttasvuotna.no", "donna.no", "d\xF8nna.no", "dovre.no", "drammen.no", "drangedal.no", "dyroy.no", "dyr\xF8y.no", "eid.no", "eidfjord.no", "eidsberg.no", "eidskog.no", "eidsvoll.no", "eigersund.no", "elverum.no", "enebakk.no", "engerdal.no", "etne.no", "etnedal.no", "evenassi.no", "even\xE1\u0161\u0161i.no", "evenes.no", "evje-og-hornnes.no", "farsund.no", "fauske.no", "fedje.no", "fet.no", "finnoy.no", "finn\xF8y.no", "fitjar.no", "fjaler.no", "fjell.no", "fla.no", "fl\xE5.no", "flakstad.no", "flatanger.no", "flekkefjord.no", "flesberg.no", "flora.no", "folldal.no", "forde.no", "f\xF8rde.no", "forsand.no", "fosnes.no", "fr\xE6na.no", "frana.no", "frei.no", "frogn.no", "froland.no", "frosta.no", "froya.no", "fr\xF8ya.no", "fuoisku.no", "fuossko.no", "fusa.no", "fyresdal.no", "gaivuotna.no", "g\xE1ivuotna.no", "galsa.no", "g\xE1ls\xE1.no", "gamvik.no", "gangaviika.no", "g\xE1\u014Bgaviika.no", "gaular.no", "gausdal.no", "giehtavuoatna.no", "gildeskal.no", "gildesk\xE5l.no", "giske.no", "gjemnes.no", "gjerdrum.no", "gjerstad.no", "gjesdal.no", "gjovik.no", "gj\xF8vik.no", "gloppen.no", "gol.no", "gran.no", "grane.no", "granvin.no", "gratangen.no", "grimstad.no", "grong.no", "grue.no", "gulen.no", "guovdageaidnu.no", "ha.no", "h\xE5.no", "habmer.no", "h\xE1bmer.no", "hadsel.no", "h\xE6gebostad.no", "hagebostad.no", "halden.no", "halsa.no", "hamar.no", "hamaroy.no", "hammarfeasta.no", "h\xE1mm\xE1rfeasta.no", "hammerfest.no", "hapmir.no", "h\xE1pmir.no", "haram.no", "hareid.no", "harstad.no", "hasvik.no", "hattfjelldal.no", "haugesund.no", "os.hedmark.no", "valer.hedmark.no", "v\xE5ler.hedmark.no", "hemne.no", "hemnes.no", "hemsedal.no", "hitra.no", "hjartdal.no", "hjelmeland.no", "hobol.no", "hob\xF8l.no", "hof.no", "hol.no", "hole.no", "holmestrand.no", "holtalen.no", "holt\xE5len.no", "os.hordaland.no", "hornindal.no", "horten.no", "hoyanger.no", "h\xF8yanger.no", "hoylandet.no", "h\xF8ylandet.no", "hurdal.no", "hurum.no", "hvaler.no", "hyllestad.no", "ibestad.no", "inderoy.no", "inder\xF8y.no", "iveland.no", "ivgu.no", "jevnaker.no", "jolster.no", "j\xF8lster.no", "jondal.no", "kafjord.no", "k\xE5fjord.no", "karasjohka.no", "k\xE1r\xE1\u0161johka.no", "karasjok.no", "karlsoy.no", "karmoy.no", "karm\xF8y.no", "kautokeino.no", "klabu.no", "kl\xE6bu.no", "klepp.no", "kongsberg.no", "kongsvinger.no", "kraanghke.no", "kr\xE5anghke.no", "kragero.no", "krager\xF8.no", "kristiansand.no", "kristiansund.no", "krodsherad.no", "kr\xF8dsherad.no", "kv\xE6fjord.no", "kv\xE6nangen.no", "kvafjord.no", "kvalsund.no", "kvam.no", "kvanangen.no", "kvinesdal.no", "kvinnherad.no", "kviteseid.no", "kvitsoy.no", "kvits\xF8y.no", "laakesvuemie.no", "l\xE6rdal.no", "lahppi.no", "l\xE1hppi.no", "lardal.no", "larvik.no", "lavagis.no", "lavangen.no", "leangaviika.no", "lea\u014Bgaviika.no", "lebesby.no", "leikanger.no", "leirfjord.no", "leka.no", "leksvik.no", "lenvik.no", "lerdal.no", "lesja.no", "levanger.no", "lier.no", "lierne.no", "lillehammer.no", "lillesand.no", "lindas.no", "lind\xE5s.no", "lindesnes.no", "loabat.no", "loab\xE1t.no", "lodingen.no", "l\xF8dingen.no", "lom.no", "loppa.no", "lorenskog.no", "l\xF8renskog.no", "loten.no", "l\xF8ten.no", "lund.no", "lunner.no", "luroy.no", "lur\xF8y.no", "luster.no", "lyngdal.no", "lyngen.no", "malatvuopmi.no", "m\xE1latvuopmi.no", "malselv.no", "m\xE5lselv.no", "malvik.no", "mandal.no", "marker.no", "marnardal.no", "masfjorden.no", "masoy.no", "m\xE5s\xF8y.no", "matta-varjjat.no", "m\xE1tta-v\xE1rjjat.no", "meland.no", "meldal.no", "melhus.no", "meloy.no", "mel\xF8y.no", "meraker.no", "mer\xE5ker.no", "midsund.no", "midtre-gauldal.no", "moareke.no", "mo\xE5reke.no", "modalen.no", "modum.no", "molde.no", "heroy.more-og-romsdal.no", "sande.more-og-romsdal.no", "her\xF8y.m\xF8re-og-romsdal.no", "sande.m\xF8re-og-romsdal.no", "moskenes.no", "moss.no", "mosvik.no", "muosat.no", "muos\xE1t.no", "naamesjevuemie.no", "n\xE5\xE5mesjevuemie.no", "n\xE6r\xF8y.no", "namdalseid.no", "namsos.no", "namsskogan.no", "nannestad.no", "naroy.no", "narviika.no", "narvik.no", "naustdal.no", "navuotna.no", "n\xE1vuotna.no", "nedre-eiker.no", "nesna.no", "nesodden.no", "nesseby.no", "nesset.no", "nissedal.no", "nittedal.no", "nord-aurdal.no", "nord-fron.no", "nord-odal.no", "norddal.no", "nordkapp.no", "bo.nordland.no", "b\xF8.nordland.no", "heroy.nordland.no", "her\xF8y.nordland.no", "nordre-land.no", "nordreisa.no", "nore-og-uvdal.no", "notodden.no", "notteroy.no", "n\xF8tter\xF8y.no", "odda.no", "oksnes.no", "\xF8ksnes.no", "omasvuotna.no", "oppdal.no", "oppegard.no", "oppeg\xE5rd.no", "orkdal.no", "orland.no", "\xF8rland.no", "orskog.no", "\xF8rskog.no", "orsta.no", "\xF8rsta.no", "osen.no", "osteroy.no", "oster\xF8y.no", "valer.ostfold.no", "v\xE5ler.\xF8stfold.no", "ostre-toten.no", "\xF8stre-toten.no", "overhalla.no", "ovre-eiker.no", "\xF8vre-eiker.no", "oyer.no", "\xF8yer.no", "oygarden.no", "\xF8ygarden.no", "oystre-slidre.no", "\xF8ystre-slidre.no", "porsanger.no", "porsangu.no", "pors\xE1\u014Bgu.no", "porsgrunn.no", "rade.no", "r\xE5de.no", "radoy.no", "rad\xF8y.no", "r\xE6lingen.no", "rahkkeravju.no", "r\xE1hkker\xE1vju.no", "raisa.no", "r\xE1isa.no", "rakkestad.no", "ralingen.no", "rana.no", "randaberg.no", "rauma.no", "rendalen.no", "rennebu.no", "rennesoy.no", "rennes\xF8y.no", "rindal.no", "ringebu.no", "ringerike.no", "ringsaker.no", "risor.no", "ris\xF8r.no", "rissa.no", "roan.no", "rodoy.no", "r\xF8d\xF8y.no", "rollag.no", "romsa.no", "romskog.no", "r\xF8mskog.no", "roros.no", "r\xF8ros.no", "rost.no", "r\xF8st.no", "royken.no", "r\xF8yken.no", "royrvik.no", "r\xF8yrvik.no", "ruovat.no", "rygge.no", "salangen.no", "salat.no", "s\xE1lat.no", "s\xE1l\xE1t.no", "saltdal.no", "samnanger.no", "sandefjord.no", "sandnes.no", "sandoy.no", "sand\xF8y.no", "sarpsborg.no", "sauda.no", "sauherad.no", "sel.no", "selbu.no", "selje.no", "seljord.no", "siellak.no", "sigdal.no", "siljan.no", "sirdal.no", "skanit.no", "sk\xE1nit.no", "skanland.no", "sk\xE5nland.no", "skaun.no", "skedsmo.no", "ski.no", "skien.no", "skierva.no", "skierv\xE1.no", "skiptvet.no", "skjak.no", "skj\xE5k.no", "skjervoy.no", "skjerv\xF8y.no", "skodje.no", "smola.no", "sm\xF8la.no", "snaase.no", "sn\xE5ase.no", "snasa.no", "sn\xE5sa.no", "snillfjord.no", "snoasa.no", "sogndal.no", "sogne.no", "s\xF8gne.no", "sokndal.no", "sola.no", "solund.no", "somna.no", "s\xF8mna.no", "sondre-land.no", "s\xF8ndre-land.no", "songdalen.no", "sor-aurdal.no", "s\xF8r-aurdal.no", "sor-fron.no", "s\xF8r-fron.no", "sor-odal.no", "s\xF8r-odal.no", "sor-varanger.no", "s\xF8r-varanger.no", "sorfold.no", "s\xF8rfold.no", "sorreisa.no", "s\xF8rreisa.no", "sortland.no", "sorum.no", "s\xF8rum.no", "spydeberg.no", "stange.no", "stavanger.no", "steigen.no", "steinkjer.no", "stjordal.no", "stj\xF8rdal.no", "stokke.no", "stor-elvdal.no", "stord.no", "stordal.no", "storfjord.no", "strand.no", "stranda.no", "stryn.no", "sula.no", "suldal.no", "sund.no", "sunndal.no", "surnadal.no", "sveio.no", "svelvik.no", "sykkylven.no", "tana.no", "bo.telemark.no", "b\xF8.telemark.no", "time.no", "tingvoll.no", "tinn.no", "tjeldsund.no", "tjome.no", "tj\xF8me.no", "tokke.no", "tolga.no", "tonsberg.no", "t\xF8nsberg.no", "torsken.no", "tr\xE6na.no", "trana.no", "tranoy.no", "tran\xF8y.no", "troandin.no", "trogstad.no", "tr\xF8gstad.no", "tromsa.no", "tromso.no", "troms\xF8.no", "trondheim.no", "trysil.no", "tvedestrand.no", "tydal.no", "tynset.no", "tysfjord.no", "tysnes.no", "tysv\xE6r.no", "tysvar.no", "ullensaker.no", "ullensvang.no", "ulvik.no", "unjarga.no", "unj\xE1rga.no", "utsira.no", "vaapste.no", "vadso.no", "vads\xF8.no", "v\xE6r\xF8y.no", "vaga.no", "v\xE5g\xE5.no", "vagan.no", "v\xE5gan.no", "vagsoy.no", "v\xE5gs\xF8y.no", "vaksdal.no", "valle.no", "vang.no", "vanylven.no", "vardo.no", "vard\xF8.no", "varggat.no", "v\xE1rgg\xE1t.no", "varoy.no", "vefsn.no", "vega.no", "vegarshei.no", "veg\xE5rshei.no", "vennesla.no", "verdal.no", "verran.no", "vestby.no", "sande.vestfold.no", "vestnes.no", "vestre-slidre.no", "vestre-toten.no", "vestvagoy.no", "vestv\xE5g\xF8y.no", "vevelstad.no", "vik.no", "vikna.no", "vindafjord.no", "voagat.no", "volda.no", "voss.no", "*.np", "nr", "biz.nr", "com.nr", "edu.nr", "gov.nr", "info.nr", "net.nr", "org.nr", "nu", "nz", "ac.nz", "co.nz", "cri.nz", "geek.nz", "gen.nz", "govt.nz", "health.nz", "iwi.nz", "kiwi.nz", "maori.nz", "m\u0101ori.nz", "mil.nz", "net.nz", "org.nz", "parliament.nz", "school.nz", "om", "co.om", "com.om", "edu.om", "gov.om", "med.om", "museum.om", "net.om", "org.om", "pro.om", "onion", "org", "pa", "abo.pa", "ac.pa", "com.pa", "edu.pa", "gob.pa", "ing.pa", "med.pa", "net.pa", "nom.pa", "org.pa", "sld.pa", "pe", "com.pe", "edu.pe", "gob.pe", "mil.pe", "net.pe", "nom.pe", "org.pe", "pf", "com.pf", "edu.pf", "org.pf", "*.pg", "ph", "com.ph", "edu.ph", "gov.ph", "i.ph", "mil.ph", "net.ph", "ngo.ph", "org.ph", "pk", "ac.pk", "biz.pk", "com.pk", "edu.pk", "fam.pk", "gkp.pk", "gob.pk", "gog.pk", "gok.pk", "gon.pk", "gop.pk", "gos.pk", "gov.pk", "net.pk", "org.pk", "web.pk", "pl", "com.pl", "net.pl", "org.pl", "agro.pl", "aid.pl", "atm.pl", "auto.pl", "biz.pl", "edu.pl", "gmina.pl", "gsm.pl", "info.pl", "mail.pl", "media.pl", "miasta.pl", "mil.pl", "nieruchomosci.pl", "nom.pl", "pc.pl", "powiat.pl", "priv.pl", "realestate.pl", "rel.pl", "sex.pl", "shop.pl", "sklep.pl", "sos.pl", "szkola.pl", "targi.pl", "tm.pl", "tourism.pl", "travel.pl", "turystyka.pl", "gov.pl", "ap.gov.pl", "griw.gov.pl", "ic.gov.pl", "is.gov.pl", "kmpsp.gov.pl", "konsulat.gov.pl", "kppsp.gov.pl", "kwp.gov.pl", "kwpsp.gov.pl", "mup.gov.pl", "mw.gov.pl", "oia.gov.pl", "oirm.gov.pl", "oke.gov.pl", "oow.gov.pl", "oschr.gov.pl", "oum.gov.pl", "pa.gov.pl", "pinb.gov.pl", "piw.gov.pl", "po.gov.pl", "pr.gov.pl", "psp.gov.pl", "psse.gov.pl", "pup.gov.pl", "rzgw.gov.pl", "sa.gov.pl", "sdn.gov.pl", "sko.gov.pl", "so.gov.pl", "sr.gov.pl", "starostwo.gov.pl", "ug.gov.pl", "ugim.gov.pl", "um.gov.pl", "umig.gov.pl", "upow.gov.pl", "uppo.gov.pl", "us.gov.pl", "uw.gov.pl", "uzs.gov.pl", "wif.gov.pl", "wiih.gov.pl", "winb.gov.pl", "wios.gov.pl", "witd.gov.pl", "wiw.gov.pl", "wkz.gov.pl", "wsa.gov.pl", "wskr.gov.pl", "wsse.gov.pl", "wuoz.gov.pl", "wzmiuw.gov.pl", "zp.gov.pl", "zpisdn.gov.pl", "augustow.pl", "babia-gora.pl", "bedzin.pl", "beskidy.pl", "bialowieza.pl", "bialystok.pl", "bielawa.pl", "bieszczady.pl", "boleslawiec.pl", "bydgoszcz.pl", "bytom.pl", "cieszyn.pl", "czeladz.pl", "czest.pl", "dlugoleka.pl", "elblag.pl", "elk.pl", "glogow.pl", "gniezno.pl", "gorlice.pl", "grajewo.pl", "ilawa.pl", "jaworzno.pl", "jelenia-gora.pl", "jgora.pl", "kalisz.pl", "karpacz.pl", "kartuzy.pl", "kaszuby.pl", "katowice.pl", "kazimierz-dolny.pl", "kepno.pl", "ketrzyn.pl", "klodzko.pl", "kobierzyce.pl", "kolobrzeg.pl", "konin.pl", "konskowola.pl", "kutno.pl", "lapy.pl", "lebork.pl", "legnica.pl", "lezajsk.pl", "limanowa.pl", "lomza.pl", "lowicz.pl", "lubin.pl", "lukow.pl", "malbork.pl", "malopolska.pl", "mazowsze.pl", "mazury.pl", "mielec.pl", "mielno.pl", "mragowo.pl", "naklo.pl", "nowaruda.pl", "nysa.pl", "olawa.pl", "olecko.pl", "olkusz.pl", "olsztyn.pl", "opoczno.pl", "opole.pl", "ostroda.pl", "ostroleka.pl", "ostrowiec.pl", "ostrowwlkp.pl", "pila.pl", "pisz.pl", "podhale.pl", "podlasie.pl", "polkowice.pl", "pomorskie.pl", "pomorze.pl", "prochowice.pl", "pruszkow.pl", "przeworsk.pl", "pulawy.pl", "radom.pl", "rawa-maz.pl", "rybnik.pl", "rzeszow.pl", "sanok.pl", "sejny.pl", "skoczow.pl", "slask.pl", "slupsk.pl", "sosnowiec.pl", "stalowa-wola.pl", "starachowice.pl", "stargard.pl", "suwalki.pl", "swidnica.pl", "swiebodzin.pl", "swinoujscie.pl", "szczecin.pl", "szczytno.pl", "tarnobrzeg.pl", "tgory.pl", "turek.pl", "tychy.pl", "ustka.pl", "walbrzych.pl", "warmia.pl", "warszawa.pl", "waw.pl", "wegrow.pl", "wielun.pl", "wlocl.pl", "wloclawek.pl", "wodzislaw.pl", "wolomin.pl", "wroclaw.pl", "zachpomor.pl", "zagan.pl", "zarow.pl", "zgora.pl", "zgorzelec.pl", "pm", "pn", "co.pn", "edu.pn", "gov.pn", "net.pn", "org.pn", "post", "pr", "biz.pr", "com.pr", "edu.pr", "gov.pr", "info.pr", "isla.pr", "name.pr", "net.pr", "org.pr", "pro.pr", "ac.pr", "est.pr", "prof.pr", "pro", "aaa.pro", "aca.pro", "acct.pro", "avocat.pro", "bar.pro", "cpa.pro", "eng.pro", "jur.pro", "law.pro", "med.pro", "recht.pro", "ps", "com.ps", "edu.ps", "gov.ps", "net.ps", "org.ps", "plo.ps", "sec.ps", "pt", "com.pt", "edu.pt", "gov.pt", "int.pt", "net.pt", "nome.pt", "org.pt", "publ.pt", "pw", "belau.pw", "co.pw", "ed.pw", "go.pw", "or.pw", "py", "com.py", "coop.py", "edu.py", "gov.py", "mil.py", "net.py", "org.py", "qa", "com.qa", "edu.qa", "gov.qa", "mil.qa", "name.qa", "net.qa", "org.qa", "sch.qa", "re", "asso.re", "com.re", "ro", "arts.ro", "com.ro", "firm.ro", "info.ro", "nom.ro", "nt.ro", "org.ro", "rec.ro", "store.ro", "tm.ro", "www.ro", "rs", "ac.rs", "co.rs", "edu.rs", "gov.rs", "in.rs", "org.rs", "ru", "rw", "ac.rw", "co.rw", "coop.rw", "gov.rw", "mil.rw", "net.rw", "org.rw", "sa", "com.sa", "edu.sa", "gov.sa", "med.sa", "net.sa", "org.sa", "pub.sa", "sch.sa", "sb", "com.sb", "edu.sb", "gov.sb", "net.sb", "org.sb", "sc", "com.sc", "edu.sc", "gov.sc", "net.sc", "org.sc", "sd", "com.sd", "edu.sd", "gov.sd", "info.sd", "med.sd", "net.sd", "org.sd", "tv.sd", "se", "a.se", "ac.se", "b.se", "bd.se", "brand.se", "c.se", "d.se", "e.se", "f.se", "fh.se", "fhsk.se", "fhv.se", "g.se", "h.se", "i.se", "k.se", "komforb.se", "kommunalforbund.se", "komvux.se", "l.se", "lanbib.se", "m.se", "n.se", "naturbruksgymn.se", "o.se", "org.se", "p.se", "parti.se", "pp.se", "press.se", "r.se", "s.se", "t.se", "tm.se", "u.se", "w.se", "x.se", "y.se", "z.se", "sg", "com.sg", "edu.sg", "gov.sg", "net.sg", "org.sg", "sh", "com.sh", "gov.sh", "mil.sh", "net.sh", "org.sh", "si", "sj", "sk", "sl", "com.sl", "edu.sl", "gov.sl", "net.sl", "org.sl", "sm", "sn", "art.sn", "com.sn", "edu.sn", "gouv.sn", "org.sn", "perso.sn", "univ.sn", "so", "com.so", "edu.so", "gov.so", "me.so", "net.so", "org.so", "sr", "ss", "biz.ss", "co.ss", "com.ss", "edu.ss", "gov.ss", "me.ss", "net.ss", "org.ss", "sch.ss", "st", "co.st", "com.st", "consulado.st", "edu.st", "embaixada.st", "mil.st", "net.st", "org.st", "principe.st", "saotome.st", "store.st", "su", "sv", "com.sv", "edu.sv", "gob.sv", "org.sv", "red.sv", "sx", "gov.sx", "sy", "com.sy", "edu.sy", "gov.sy", "mil.sy", "net.sy", "org.sy", "sz", "ac.sz", "co.sz", "org.sz", "tc", "td", "tel", "tf", "tg", "th", "ac.th", "co.th", "go.th", "in.th", "mi.th", "net.th", "or.th", "tj", "ac.tj", "biz.tj", "co.tj", "com.tj", "edu.tj", "go.tj", "gov.tj", "int.tj", "mil.tj", "name.tj", "net.tj", "nic.tj", "org.tj", "test.tj", "web.tj", "tk", "tl", "gov.tl", "tm", "co.tm", "com.tm", "edu.tm", "gov.tm", "mil.tm", "net.tm", "nom.tm", "org.tm", "tn", "com.tn", "ens.tn", "fin.tn", "gov.tn", "ind.tn", "info.tn", "intl.tn", "mincom.tn", "nat.tn", "net.tn", "org.tn", "perso.tn", "tourism.tn", "to", "com.to", "edu.to", "gov.to", "mil.to", "net.to", "org.to", "tr", "av.tr", "bbs.tr", "bel.tr", "biz.tr", "com.tr", "dr.tr", "edu.tr", "gen.tr", "gov.tr", "info.tr", "k12.tr", "kep.tr", "mil.tr", "name.tr", "net.tr", "org.tr", "pol.tr", "tel.tr", "tsk.tr", "tv.tr", "web.tr", "nc.tr", "gov.nc.tr", "tt", "biz.tt", "co.tt", "com.tt", "edu.tt", "gov.tt", "info.tt", "mil.tt", "name.tt", "net.tt", "org.tt", "pro.tt", "tv", "tw", "club.tw", "com.tw", "ebiz.tw", "edu.tw", "game.tw", "gov.tw", "idv.tw", "mil.tw", "net.tw", "org.tw", "tz", "ac.tz", "co.tz", "go.tz", "hotel.tz", "info.tz", "me.tz", "mil.tz", "mobi.tz", "ne.tz", "or.tz", "sc.tz", "tv.tz", "ua", "com.ua", "edu.ua", "gov.ua", "in.ua", "net.ua", "org.ua", "cherkassy.ua", "cherkasy.ua", "chernigov.ua", "chernihiv.ua", "chernivtsi.ua", "chernovtsy.ua", "ck.ua", "cn.ua", "cr.ua", "crimea.ua", "cv.ua", "dn.ua", "dnepropetrovsk.ua", "dnipropetrovsk.ua", "donetsk.ua", "dp.ua", "if.ua", "ivano-frankivsk.ua", "kh.ua", "kharkiv.ua", "kharkov.ua", "kherson.ua", "khmelnitskiy.ua", "khmelnytskyi.ua", "kiev.ua", "kirovograd.ua", "km.ua", "kr.ua", "kropyvnytskyi.ua", "krym.ua", "ks.ua", "kv.ua", "kyiv.ua", "lg.ua", "lt.ua", "lugansk.ua", "luhansk.ua", "lutsk.ua", "lv.ua", "lviv.ua", "mk.ua", "mykolaiv.ua", "nikolaev.ua", "od.ua", "odesa.ua", "odessa.ua", "pl.ua", "poltava.ua", "rivne.ua", "rovno.ua", "rv.ua", "sb.ua", "sebastopol.ua", "sevastopol.ua", "sm.ua", "sumy.ua", "te.ua", "ternopil.ua", "uz.ua", "uzhgorod.ua", "uzhhorod.ua", "vinnica.ua", "vinnytsia.ua", "vn.ua", "volyn.ua", "yalta.ua", "zakarpattia.ua", "zaporizhzhe.ua", "zaporizhzhia.ua", "zhitomir.ua", "zhytomyr.ua", "zp.ua", "zt.ua", "ug", "ac.ug", "co.ug", "com.ug", "go.ug", "ne.ug", "or.ug", "org.ug", "sc.ug", "uk", "ac.uk", "co.uk", "gov.uk", "ltd.uk", "me.uk", "net.uk", "nhs.uk", "org.uk", "plc.uk", "police.uk", "*.sch.uk", "us", "dni.us", "fed.us", "isa.us", "kids.us", "nsn.us", "ak.us", "al.us", "ar.us", "as.us", "az.us", "ca.us", "co.us", "ct.us", "dc.us", "de.us", "fl.us", "ga.us", "gu.us", "hi.us", "ia.us", "id.us", "il.us", "in.us", "ks.us", "ky.us", "la.us", "ma.us", "md.us", "me.us", "mi.us", "mn.us", "mo.us", "ms.us", "mt.us", "nc.us", "nd.us", "ne.us", "nh.us", "nj.us", "nm.us", "nv.us", "ny.us", "oh.us", "ok.us", "or.us", "pa.us", "pr.us", "ri.us", "sc.us", "sd.us", "tn.us", "tx.us", "ut.us", "va.us", "vi.us", "vt.us", "wa.us", "wi.us", "wv.us", "wy.us", "k12.ak.us", "k12.al.us", "k12.ar.us", "k12.as.us", "k12.az.us", "k12.ca.us", "k12.co.us", "k12.ct.us", "k12.dc.us", "k12.fl.us", "k12.ga.us", "k12.gu.us", "k12.ia.us", "k12.id.us", "k12.il.us", "k12.in.us", "k12.ks.us", "k12.ky.us", "k12.la.us", "k12.ma.us", "k12.md.us", "k12.me.us", "k12.mi.us", "k12.mn.us", "k12.mo.us", "k12.ms.us", "k12.mt.us", "k12.nc.us", "k12.ne.us", "k12.nh.us", "k12.nj.us", "k12.nm.us", "k12.nv.us", "k12.ny.us", "k12.oh.us", "k12.ok.us", "k12.or.us", "k12.pa.us", "k12.pr.us", "k12.sc.us", "k12.tn.us", "k12.tx.us", "k12.ut.us", "k12.va.us", "k12.vi.us", "k12.vt.us", "k12.wa.us", "k12.wi.us", "cc.ak.us", "lib.ak.us", "cc.al.us", "lib.al.us", "cc.ar.us", "lib.ar.us", "cc.as.us", "lib.as.us", "cc.az.us", "lib.az.us", "cc.ca.us", "lib.ca.us", "cc.co.us", "lib.co.us", "cc.ct.us", "lib.ct.us", "cc.dc.us", "lib.dc.us", "cc.de.us", "cc.fl.us", "cc.ga.us", "cc.gu.us", "cc.hi.us", "cc.ia.us", "cc.id.us", "cc.il.us", "cc.in.us", "cc.ks.us", "cc.ky.us", "cc.la.us", "cc.ma.us", "cc.md.us", "cc.me.us", "cc.mi.us", "cc.mn.us", "cc.mo.us", "cc.ms.us", "cc.mt.us", "cc.nc.us", "cc.nd.us", "cc.ne.us", "cc.nh.us", "cc.nj.us", "cc.nm.us", "cc.nv.us", "cc.ny.us", "cc.oh.us", "cc.ok.us", "cc.or.us", "cc.pa.us", "cc.pr.us", "cc.ri.us", "cc.sc.us", "cc.sd.us", "cc.tn.us", "cc.tx.us", "cc.ut.us", "cc.va.us", "cc.vi.us", "cc.vt.us", "cc.wa.us", "cc.wi.us", "cc.wv.us", "cc.wy.us", "k12.wy.us", "lib.fl.us", "lib.ga.us", "lib.gu.us", "lib.hi.us", "lib.ia.us", "lib.id.us", "lib.il.us", "lib.in.us", "lib.ks.us", "lib.ky.us", "lib.la.us", "lib.ma.us", "lib.md.us", "lib.me.us", "lib.mi.us", "lib.mn.us", "lib.mo.us", "lib.ms.us", "lib.mt.us", "lib.nc.us", "lib.nd.us", "lib.ne.us", "lib.nh.us", "lib.nj.us", "lib.nm.us", "lib.nv.us", "lib.ny.us", "lib.oh.us", "lib.ok.us", "lib.or.us", "lib.pa.us", "lib.pr.us", "lib.ri.us", "lib.sc.us", "lib.sd.us", "lib.tn.us", "lib.tx.us", "lib.ut.us", "lib.va.us", "lib.vi.us", "lib.vt.us", "lib.wa.us", "lib.wi.us", "lib.wy.us", "chtr.k12.ma.us", "paroch.k12.ma.us", "pvt.k12.ma.us", "ann-arbor.mi.us", "cog.mi.us", "dst.mi.us", "eaton.mi.us", "gen.mi.us", "mus.mi.us", "tec.mi.us", "washtenaw.mi.us", "uy", "com.uy", "edu.uy", "gub.uy", "mil.uy", "net.uy", "org.uy", "uz", "co.uz", "com.uz", "net.uz", "org.uz", "va", "vc", "com.vc", "edu.vc", "gov.vc", "mil.vc", "net.vc", "org.vc", "ve", "arts.ve", "bib.ve", "co.ve", "com.ve", "e12.ve", "edu.ve", "firm.ve", "gob.ve", "gov.ve", "info.ve", "int.ve", "mil.ve", "net.ve", "nom.ve", "org.ve", "rar.ve", "rec.ve", "store.ve", "tec.ve", "web.ve", "vg", "vi", "co.vi", "com.vi", "k12.vi", "net.vi", "org.vi", "vn", "ac.vn", "ai.vn", "biz.vn", "com.vn", "edu.vn", "gov.vn", "health.vn", "id.vn", "info.vn", "int.vn", "io.vn", "name.vn", "net.vn", "org.vn", "pro.vn", "angiang.vn", "bacgiang.vn", "backan.vn", "baclieu.vn", "bacninh.vn", "baria-vungtau.vn", "bentre.vn", "binhdinh.vn", "binhduong.vn", "binhphuoc.vn", "binhthuan.vn", "camau.vn", "cantho.vn", "caobang.vn", "daklak.vn", "daknong.vn", "danang.vn", "dienbien.vn", "dongnai.vn", "dongthap.vn", "gialai.vn", "hagiang.vn", "haiduong.vn", "haiphong.vn", "hanam.vn", "hanoi.vn", "hatinh.vn", "haugiang.vn", "hoabinh.vn", "hungyen.vn", "khanhhoa.vn", "kiengiang.vn", "kontum.vn", "laichau.vn", "lamdong.vn", "langson.vn", "laocai.vn", "longan.vn", "namdinh.vn", "nghean.vn", "ninhbinh.vn", "ninhthuan.vn", "phutho.vn", "phuyen.vn", "quangbinh.vn", "quangnam.vn", "quangngai.vn", "quangninh.vn", "quangtri.vn", "soctrang.vn", "sonla.vn", "tayninh.vn", "thaibinh.vn", "thainguyen.vn", "thanhhoa.vn", "thanhphohochiminh.vn", "thuathienhue.vn", "tiengiang.vn", "travinh.vn", "tuyenquang.vn", "vinhlong.vn", "vinhphuc.vn", "yenbai.vn", "vu", "com.vu", "edu.vu", "net.vu", "org.vu", "wf", "ws", "com.ws", "edu.ws", "gov.ws", "net.ws", "org.ws", "yt", "\u0627\u0645\u0627\u0631\u0627\u062A", "\u0570\u0561\u0575", "\u09AC\u09BE\u0982\u09B2\u09BE", "\u0431\u0433", "\u0627\u0644\u0628\u062D\u0631\u064A\u0646", "\u0431\u0435\u043B", "\u4E2D\u56FD", "\u4E2D\u570B", "\u0627\u0644\u062C\u0632\u0627\u0626\u0631", "\u0645\u0635\u0631", "\u0435\u044E", "\u03B5\u03C5", "\u0645\u0648\u0631\u064A\u062A\u0627\u0646\u064A\u0627", "\u10D2\u10D4", "\u03B5\u03BB", "\u9999\u6E2F", "\u500B\u4EBA.\u9999\u6E2F", "\u516C\u53F8.\u9999\u6E2F", "\u653F\u5E9C.\u9999\u6E2F", "\u6559\u80B2.\u9999\u6E2F", "\u7D44\u7E54.\u9999\u6E2F", "\u7DB2\u7D61.\u9999\u6E2F", "\u0CAD\u0CBE\u0CB0\u0CA4", "\u0B2D\u0B3E\u0B30\u0B24", "\u09AD\u09BE\u09F0\u09A4", "\u092D\u093E\u0930\u0924\u092E\u094D", "\u092D\u093E\u0930\u094B\u0924", "\u0680\u0627\u0631\u062A", "\u0D2D\u0D3E\u0D30\u0D24\u0D02", "\u092D\u093E\u0930\u0924", "\u0628\u0627\u0631\u062A", "\u0628\u06BE\u0627\u0631\u062A", "\u0C2D\u0C3E\u0C30\u0C24\u0C4D", "\u0AAD\u0ABE\u0AB0\u0AA4", "\u0A2D\u0A3E\u0A30\u0A24", "\u09AD\u09BE\u09B0\u09A4", "\u0B87\u0BA8\u0BCD\u0BA4\u0BBF\u0BAF\u0BBE", "\u0627\u06CC\u0631\u0627\u0646", "\u0627\u064A\u0631\u0627\u0646", "\u0639\u0631\u0627\u0642", "\u0627\u0644\u0627\u0631\u062F\u0646", "\uD55C\uAD6D", "\u049B\u0430\u0437", "\u0EA5\u0EB2\u0EA7", "\u0DBD\u0D82\u0D9A\u0DCF", "\u0B87\u0BB2\u0B99\u0BCD\u0B95\u0BC8", "\u0627\u0644\u0645\u063A\u0631\u0628", "\u043C\u043A\u0434", "\u043C\u043E\u043D", "\u6FB3\u9580", "\u6FB3\u95E8", "\u0645\u0644\u064A\u0633\u064A\u0627", "\u0639\u0645\u0627\u0646", "\u067E\u0627\u06A9\u0633\u062A\u0627\u0646", "\u067E\u0627\u0643\u0633\u062A\u0627\u0646", "\u0641\u0644\u0633\u0637\u064A\u0646", "\u0441\u0440\u0431", "\u0430\u043A.\u0441\u0440\u0431", "\u043E\u0431\u0440.\u0441\u0440\u0431", "\u043E\u0434.\u0441\u0440\u0431", "\u043E\u0440\u0433.\u0441\u0440\u0431", "\u043F\u0440.\u0441\u0440\u0431", "\u0443\u043F\u0440.\u0441\u0440\u0431", "\u0440\u0444", "\u0642\u0637\u0631", "\u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629", "\u0627\u0644\u0633\u0639\u0648\u062F\u06CC\u0629", "\u0627\u0644\u0633\u0639\u0648\u062F\u06CC\u06C3", "\u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0647", "\u0633\u0648\u062F\u0627\u0646", "\u65B0\u52A0\u5761", "\u0B9A\u0BBF\u0B99\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0BC2\u0BB0\u0BCD", "\u0633\u0648\u0631\u064A\u0629", "\u0633\u0648\u0631\u064A\u0627", "\u0E44\u0E17\u0E22", "\u0E17\u0E2B\u0E32\u0E23.\u0E44\u0E17\u0E22", "\u0E18\u0E38\u0E23\u0E01\u0E34\u0E08.\u0E44\u0E17\u0E22", "\u0E40\u0E19\u0E47\u0E15.\u0E44\u0E17\u0E22", "\u0E23\u0E31\u0E10\u0E1A\u0E32\u0E25.\u0E44\u0E17\u0E22", "\u0E28\u0E36\u0E01\u0E29\u0E32.\u0E44\u0E17\u0E22", "\u0E2D\u0E07\u0E04\u0E4C\u0E01\u0E23.\u0E44\u0E17\u0E22", "\u062A\u0648\u0646\u0633", "\u53F0\u7063", "\u53F0\u6E7E", "\u81FA\u7063", "\u0443\u043A\u0440", "\u0627\u0644\u064A\u0645\u0646", "xxx", "ye", "com.ye", "edu.ye", "gov.ye", "mil.ye", "net.ye", "org.ye", "ac.za", "agric.za", "alt.za", "co.za", "edu.za", "gov.za", "grondar.za", "law.za", "mil.za", "net.za", "ngo.za", "nic.za", "nis.za", "nom.za", "org.za", "school.za", "tm.za", "web.za", "zm", "ac.zm", "biz.zm", "co.zm", "com.zm", "edu.zm", "gov.zm", "info.zm", "mil.zm", "net.zm", "org.zm", "sch.zm", "zw", "ac.zw", "co.zw", "gov.zw", "mil.zw", "org.zw", "aaa", "aarp", "abb", "abbott", "abbvie", "abc", "able", "abogado", "abudhabi", "academy", "accenture", "accountant", "accountants", "aco", "actor", "ads", "adult", "aeg", "aetna", "afl", "africa", "agakhan", "agency", "aig", "airbus", "airforce", "airtel", "akdn", "alibaba", "alipay", "allfinanz", "allstate", "ally", "alsace", "alstom", "amazon", "americanexpress", "americanfamily", "amex", "amfam", "amica", "amsterdam", "analytics", "android", "anquan", "anz", "aol", "apartments", "app", "apple", "aquarelle", "arab", "aramco", "archi", "army", "art", "arte", "asda", "associates", "athleta", "attorney", "auction", "audi", "audible", "audio", "auspost", "author", "auto", "autos", "aws", "axa", "azure", "baby", "baidu", "banamex", "band", "bank", "bar", "barcelona", "barclaycard", "barclays", "barefoot", "bargains", "baseball", "basketball", "bauhaus", "bayern", "bbc", "bbt", "bbva", "bcg", "bcn", "beats", "beauty", "beer", "bentley", "berlin", "best", "bestbuy", "bet", "bharti", "bible", "bid", "bike", "bing", "bingo", "bio", "black", "blackfriday", "blockbuster", "blog", "bloomberg", "blue", "bms", "bmw", "bnpparibas", "boats", "boehringer", "bofa", "bom", "bond", "boo", "book", "booking", "bosch", "bostik", "boston", "bot", "boutique", "box", "bradesco", "bridgestone", "broadway", "broker", "brother", "brussels", "build", "builders", "business", "buy", "buzz", "bzh", "cab", "cafe", "cal", "call", "calvinklein", "cam", "camera", "camp", "canon", "capetown", "capital", "capitalone", "car", "caravan", "cards", "care", "career", "careers", "cars", "casa", "case", "cash", "casino", "catering", "catholic", "cba", "cbn", "cbre", "center", "ceo", "cern", "cfa", "cfd", "chanel", "channel", "charity", "chase", "chat", "cheap", "chintai", "christmas", "chrome", "church", "cipriani", "circle", "cisco", "citadel", "citi", "citic", "city", "claims", "cleaning", "click", "clinic", "clinique", "clothing", "cloud", "club", "clubmed", "coach", "codes", "coffee", "college", "cologne", "commbank", "community", "company", "compare", "computer", "comsec", "condos", "construction", "consulting", "contact", "contractors", "cooking", "cool", "corsica", "country", "coupon", "coupons", "courses", "cpa", "credit", "creditcard", "creditunion", "cricket", "crown", "crs", "cruise", "cruises", "cuisinella", "cymru", "cyou", "dad", "dance", "data", "date", "dating", "datsun", "day", "dclk", "dds", "deal", "dealer", "deals", "degree", "delivery", "dell", "deloitte", "delta", "democrat", "dental", "dentist", "desi", "design", "dev", "dhl", "diamonds", "diet", "digital", "direct", "directory", "discount", "discover", "dish", "diy", "dnp", "docs", "doctor", "dog", "domains", "dot", "download", "drive", "dtv", "dubai", "dunlop", "dupont", "durban", "dvag", "dvr", "earth", "eat", "eco", "edeka", "education", "email", "emerck", "energy", "engineer", "engineering", "enterprises", "epson", "equipment", "ericsson", "erni", "esq", "estate", "eurovision", "eus", "events", "exchange", "expert", "exposed", "express", "extraspace", "fage", "fail", "fairwinds", "faith", "family", "fan", "fans", "farm", "farmers", "fashion", "fast", "fedex", "feedback", "ferrari", "ferrero", "fidelity", "fido", "film", "final", "finance", "financial", "fire", "firestone", "firmdale", "fish", "fishing", "fit", "fitness", "flickr", "flights", "flir", "florist", "flowers", "fly", "foo", "food", "football", "ford", "forex", "forsale", "forum", "foundation", "fox", "free", "fresenius", "frl", "frogans", "frontier", "ftr", "fujitsu", "fun", "fund", "furniture", "futbol", "fyi", "gal", "gallery", "gallo", "gallup", "game", "games", "gap", "garden", "gay", "gbiz", "gdn", "gea", "gent", "genting", "george", "ggee", "gift", "gifts", "gives", "giving", "glass", "gle", "global", "globo", "gmail", "gmbh", "gmo", "gmx", "godaddy", "gold", "goldpoint", "golf", "goo", "goodyear", "goog", "google", "gop", "got", "grainger", "graphics", "gratis", "green", "gripe", "grocery", "group", "gucci", "guge", "guide", "guitars", "guru", "hair", "hamburg", "hangout", "haus", "hbo", "hdfc", "hdfcbank", "health", "healthcare", "help", "helsinki", "here", "hermes", "hiphop", "hisamitsu", "hitachi", "hiv", "hkt", "hockey", "holdings", "holiday", "homedepot", "homegoods", "homes", "homesense", "honda", "horse", "hospital", "host", "hosting", "hot", "hotels", "hotmail", "house", "how", "hsbc", "hughes", "hyatt", "hyundai", "ibm", "icbc", "ice", "icu", "ieee", "ifm", "ikano", "imamat", "imdb", "immo", "immobilien", "inc", "industries", "infiniti", "ing", "ink", "institute", "insurance", "insure", "international", "intuit", "investments", "ipiranga", "irish", "ismaili", "ist", "istanbul", "itau", "itv", "jaguar", "java", "jcb", "jeep", "jetzt", "jewelry", "jio", "jll", "jmp", "jnj", "joburg", "jot", "joy", "jpmorgan", "jprs", "juegos", "juniper", "kaufen", "kddi", "kerryhotels", "kerrylogistics", "kerryproperties", "kfh", "kia", "kids", "kim", "kindle", "kitchen", "kiwi", "koeln", "komatsu", "kosher", "kpmg", "kpn", "krd", "kred", "kuokgroup", "kyoto", "lacaixa", "lamborghini", "lamer", "lancaster", "land", "landrover", "lanxess", "lasalle", "lat", "latino", "latrobe", "law", "lawyer", "lds", "lease", "leclerc", "lefrak", "legal", "lego", "lexus", "lgbt", "lidl", "life", "lifeinsurance", "lifestyle", "lighting", "like", "lilly", "limited", "limo", "lincoln", "link", "lipsy", "live", "living", "llc", "llp", "loan", "loans", "locker", "locus", "lol", "london", "lotte", "lotto", "love", "lpl", "lplfinancial", "ltd", "ltda", "lundbeck", "luxe", "luxury", "madrid", "maif", "maison", "makeup", "man", "management", "mango", "map", "market", "marketing", "markets", "marriott", "marshalls", "mattel", "mba", "mckinsey", "med", "media", "meet", "melbourne", "meme", "memorial", "men", "menu", "merck", "merckmsd", "miami", "microsoft", "mini", "mint", "mit", "mitsubishi", "mlb", "mls", "mma", "mobile", "moda", "moe", "moi", "mom", "monash", "money", "monster", "mormon", "mortgage", "moscow", "moto", "motorcycles", "mov", "movie", "msd", "mtn", "mtr", "music", "nab", "nagoya", "navy", "nba", "nec", "netbank", "netflix", "network", "neustar", "new", "news", "next", "nextdirect", "nexus", "nfl", "ngo", "nhk", "nico", "nike", "nikon", "ninja", "nissan", "nissay", "nokia", "norton", "now", "nowruz", "nowtv", "nra", "nrw", "ntt", "nyc", "obi", "observer", "office", "okinawa", "olayan", "olayangroup", "ollo", "omega", "one", "ong", "onl", "online", "ooo", "open", "oracle", "orange", "organic", "origins", "osaka", "otsuka", "ott", "ovh", "page", "panasonic", "paris", "pars", "partners", "parts", "party", "pay", "pccw", "pet", "pfizer", "pharmacy", "phd", "philips", "phone", "photo", "photography", "photos", "physio", "pics", "pictet", "pictures", "pid", "pin", "ping", "pink", "pioneer", "pizza", "place", "play", "playstation", "plumbing", "plus", "pnc", "pohl", "poker", "politie", "porn", "pramerica", "praxi", "press", "prime", "prod", "productions", "prof", "progressive", "promo", "properties", "property", "protection", "pru", "prudential", "pub", "pwc", "qpon", "quebec", "quest", "racing", "radio", "read", "realestate", "realtor", "realty", "recipes", "red", "redstone", "redumbrella", "rehab", "reise", "reisen", "reit", "reliance", "ren", "rent", "rentals", "repair", "report", "republican", "rest", "restaurant", "review", "reviews", "rexroth", "rich", "richardli", "ricoh", "ril", "rio", "rip", "rocks", "rodeo", "rogers", "room", "rsvp", "rugby", "ruhr", "run", "rwe", "ryukyu", "saarland", "safe", "safety", "sakura", "sale", "salon", "samsclub", "samsung", "sandvik", "sandvikcoromant", "sanofi", "sap", "sarl", "sas", "save", "saxo", "sbi", "sbs", "scb", "schaeffler", "schmidt", "scholarships", "school", "schule", "schwarz", "science", "scot", "search", "seat", "secure", "security", "seek", "select", "sener", "services", "seven", "sew", "sex", "sexy", "sfr", "shangrila", "sharp", "shell", "shia", "shiksha", "shoes", "shop", "shopping", "shouji", "show", "silk", "sina", "singles", "site", "ski", "skin", "sky", "skype", "sling", "smart", "smile", "sncf", "soccer", "social", "softbank", "software", "sohu", "solar", "solutions", "song", "sony", "soy", "spa", "space", "sport", "spot", "srl", "stada", "staples", "star", "statebank", "statefarm", "stc", "stcgroup", "stockholm", "storage", "store", "stream", "studio", "study", "style", "sucks", "supplies", "supply", "support", "surf", "surgery", "suzuki", "swatch", "swiss", "sydney", "systems", "tab", "taipei", "talk", "taobao", "target", "tatamotors", "tatar", "tattoo", "tax", "taxi", "tci", "tdk", "team", "tech", "technology", "temasek", "tennis", "teva", "thd", "theater", "theatre", "tiaa", "tickets", "tienda", "tips", "tires", "tirol", "tjmaxx", "tjx", "tkmaxx", "tmall", "today", "tokyo", "tools", "top", "toray", "toshiba", "total", "tours", "town", "toyota", "toys", "trade", "trading", "training", "travel", "travelers", "travelersinsurance", "trust", "trv", "tube", "tui", "tunes", "tushu", "tvs", "ubank", "ubs", "unicom", "university", "uno", "uol", "ups", "vacations", "vana", "vanguard", "vegas", "ventures", "verisign", "versicherung", "vet", "viajes", "video", "vig", "viking", "villas", "vin", "vip", "virgin", "visa", "vision", "viva", "vivo", "vlaanderen", "vodka", "volvo", "vote", "voting", "voto", "voyage", "wales", "walmart", "walter", "wang", "wanggou", "watch", "watches", "weather", "weatherchannel", "webcam", "weber", "website", "wed", "wedding", "weibo", "weir", "whoswho", "wien", "wiki", "williamhill", "win", "windows", "wine", "winners", "wme", "wolterskluwer", "woodside", "work", "works", "world", "wow", "wtc", "wtf", "xbox", "xerox", "xihuan", "xin", "\u0915\u0949\u092E", "\u30BB\u30FC\u30EB", "\u4F5B\u5C71", "\u6148\u5584", "\u96C6\u56E2", "\u5728\u7EBF", "\u70B9\u770B", "\u0E04\u0E2D\u0E21", "\u516B\u5366", "\u0645\u0648\u0642\u0639", "\u516C\u76CA", "\u516C\u53F8", "\u9999\u683C\u91CC\u62C9", "\u7F51\u7AD9", "\u79FB\u52A8", "\u6211\u7231\u4F60", "\u043C\u043E\u0441\u043A\u0432\u0430", "\u043A\u0430\u0442\u043E\u043B\u0438\u043A", "\u043E\u043D\u043B\u0430\u0439\u043D", "\u0441\u0430\u0439\u0442", "\u8054\u901A", "\u05E7\u05D5\u05DD", "\u65F6\u5C1A", "\u5FAE\u535A", "\u6DE1\u9A6C\u9521", "\u30D5\u30A1\u30C3\u30B7\u30E7\u30F3", "\u043E\u0440\u0433", "\u0928\u0947\u091F", "\u30B9\u30C8\u30A2", "\u30A2\u30DE\u30BE\u30F3", "\uC0BC\uC131", "\u5546\u6807", "\u5546\u5E97", "\u5546\u57CE", "\u0434\u0435\u0442\u0438", "\u30DD\u30A4\u30F3\u30C8", "\u65B0\u95FB", "\u5BB6\u96FB", "\u0643\u0648\u0645", "\u4E2D\u6587\u7F51", "\u4E2D\u4FE1", "\u5A31\u4E50", "\u8C37\u6B4C", "\u96FB\u8A0A\u76C8\u79D1", "\u8D2D\u7269", "\u30AF\u30E9\u30A6\u30C9", "\u901A\u8CA9", "\u7F51\u5E97", "\u0938\u0902\u0917\u0920\u0928", "\u9910\u5385", "\u7F51\u7EDC", "\u043A\u043E\u043C", "\u4E9A\u9A6C\u900A", "\u98DF\u54C1", "\u98DE\u5229\u6D66", "\u624B\u673A", "\u0627\u0631\u0627\u0645\u0643\u0648", "\u0627\u0644\u0639\u0644\u064A\u0627\u0646", "\u0628\u0627\u0632\u0627\u0631", "\u0627\u0628\u0648\u0638\u0628\u064A", "\u0643\u0627\u062B\u0648\u0644\u064A\u0643", "\u0647\u0645\u0631\u0627\u0647", "\uB2F7\uCEF4", "\u653F\u5E9C", "\u0634\u0628\u0643\u0629", "\u0628\u064A\u062A\u0643", "\u0639\u0631\u0628", "\u673A\u6784", "\u7EC4\u7EC7\u673A\u6784", "\u5065\u5EB7", "\u62DB\u8058", "\u0440\u0443\u0441", "\u5927\u62FF", "\u307F\u3093\u306A", "\u30B0\u30FC\u30B0\u30EB", "\u4E16\u754C", "\u66F8\u7C4D", "\u7F51\u5740", "\uB2F7\uB137", "\u30B3\u30E0", "\u5929\u4E3B\u6559", "\u6E38\u620F", "verm\xF6gensberater", "verm\xF6gensberatung", "\u4F01\u4E1A", "\u4FE1\u606F", "\u5609\u91CC\u5927\u9152\u5E97", "\u5609\u91CC", "\u5E7F\u4E1C", "\u653F\u52A1", "xyz", "yachts", "yahoo", "yamaxun", "yandex", "yodobashi", "yoga", "yokohama", "you", "youtube", "yun", "zappos", "zara", "zero", "zip", "zone", "zuerich", "co.krd", "edu.krd", "art.pl", "gliwice.pl", "krakow.pl", "poznan.pl", "wroc.pl", "zakopane.pl", "lib.de.us", "12chars.dev", "12chars.it", "12chars.pro", "cc.ua", "inf.ua", "ltd.ua", "611.to", "a2hosted.com", "cpserver.com", "aaa.vodka", "*.on-acorn.io", "activetrail.biz", "adaptable.app", "adobeaemcloud.com", "*.dev.adobeaemcloud.com", "aem.live", "hlx.live", "adobeaemcloud.net", "aem.page", "hlx.page", "hlx3.page", "adobeio-static.net", "adobeioruntime.net", "africa.com", "beep.pl", "airkitapps.com", "airkitapps-au.com", "airkitapps.eu", "aivencloud.com", "akadns.net", "akamai.net", "akamai-staging.net", "akamaiedge.net", "akamaiedge-staging.net", "akamaihd.net", "akamaihd-staging.net", "akamaiorigin.net", "akamaiorigin-staging.net", "akamaized.net", "akamaized-staging.net", "edgekey.net", "edgekey-staging.net", "edgesuite.net", "edgesuite-staging.net", "barsy.ca", "*.compute.estate", "*.alces.network", "kasserver.com", "altervista.org", "alwaysdata.net", "myamaze.net", "execute-api.cn-north-1.amazonaws.com.cn", "execute-api.cn-northwest-1.amazonaws.com.cn", "execute-api.af-south-1.amazonaws.com", "execute-api.ap-east-1.amazonaws.com", "execute-api.ap-northeast-1.amazonaws.com", "execute-api.ap-northeast-2.amazonaws.com", "execute-api.ap-northeast-3.amazonaws.com", "execute-api.ap-south-1.amazonaws.com", "execute-api.ap-south-2.amazonaws.com", "execute-api.ap-southeast-1.amazonaws.com", "execute-api.ap-southeast-2.amazonaws.com", "execute-api.ap-southeast-3.amazonaws.com", "execute-api.ap-southeast-4.amazonaws.com", "execute-api.ap-southeast-5.amazonaws.com", "execute-api.ca-central-1.amazonaws.com", "execute-api.ca-west-1.amazonaws.com", "execute-api.eu-central-1.amazonaws.com", "execute-api.eu-central-2.amazonaws.com", "execute-api.eu-north-1.amazonaws.com", "execute-api.eu-south-1.amazonaws.com", "execute-api.eu-south-2.amazonaws.com", "execute-api.eu-west-1.amazonaws.com", "execute-api.eu-west-2.amazonaws.com", "execute-api.eu-west-3.amazonaws.com", "execute-api.il-central-1.amazonaws.com", "execute-api.me-central-1.amazonaws.com", "execute-api.me-south-1.amazonaws.com", "execute-api.sa-east-1.amazonaws.com", "execute-api.us-east-1.amazonaws.com", "execute-api.us-east-2.amazonaws.com", "execute-api.us-gov-east-1.amazonaws.com", "execute-api.us-gov-west-1.amazonaws.com", "execute-api.us-west-1.amazonaws.com", "execute-api.us-west-2.amazonaws.com", "cloudfront.net", "auth.af-south-1.amazoncognito.com", "auth.ap-east-1.amazoncognito.com", "auth.ap-northeast-1.amazoncognito.com", "auth.ap-northeast-2.amazoncognito.com", "auth.ap-northeast-3.amazoncognito.com", "auth.ap-south-1.amazoncognito.com", "auth.ap-south-2.amazoncognito.com", "auth.ap-southeast-1.amazoncognito.com", "auth.ap-southeast-2.amazoncognito.com", "auth.ap-southeast-3.amazoncognito.com", "auth.ap-southeast-4.amazoncognito.com", "auth.ca-central-1.amazoncognito.com", "auth.ca-west-1.amazoncognito.com", "auth.eu-central-1.amazoncognito.com", "auth.eu-central-2.amazoncognito.com", "auth.eu-north-1.amazoncognito.com", "auth.eu-south-1.amazoncognito.com", "auth.eu-south-2.amazoncognito.com", "auth.eu-west-1.amazoncognito.com", "auth.eu-west-2.amazoncognito.com", "auth.eu-west-3.amazoncognito.com", "auth.il-central-1.amazoncognito.com", "auth.me-central-1.amazoncognito.com", "auth.me-south-1.amazoncognito.com", "auth.sa-east-1.amazoncognito.com", "auth.us-east-1.amazoncognito.com", "auth-fips.us-east-1.amazoncognito.com", "auth.us-east-2.amazoncognito.com", "auth-fips.us-east-2.amazoncognito.com", "auth-fips.us-gov-west-1.amazoncognito.com", "auth.us-west-1.amazoncognito.com", "auth-fips.us-west-1.amazoncognito.com", "auth.us-west-2.amazoncognito.com", "auth-fips.us-west-2.amazoncognito.com", "*.compute.amazonaws.com.cn", "*.compute.amazonaws.com", "*.compute-1.amazonaws.com", "us-east-1.amazonaws.com", "emrappui-prod.cn-north-1.amazonaws.com.cn", "emrnotebooks-prod.cn-north-1.amazonaws.com.cn", "emrstudio-prod.cn-north-1.amazonaws.com.cn", "emrappui-prod.cn-northwest-1.amazonaws.com.cn", "emrnotebooks-prod.cn-northwest-1.amazonaws.com.cn", "emrstudio-prod.cn-northwest-1.amazonaws.com.cn", "emrappui-prod.af-south-1.amazonaws.com", "emrnotebooks-prod.af-south-1.amazonaws.com", "emrstudio-prod.af-south-1.amazonaws.com", "emrappui-prod.ap-east-1.amazonaws.com", "emrnotebooks-prod.ap-east-1.amazonaws.com", "emrstudio-prod.ap-east-1.amazonaws.com", "emrappui-prod.ap-northeast-1.amazonaws.com", "emrnotebooks-prod.ap-northeast-1.amazonaws.com", "emrstudio-prod.ap-northeast-1.amazonaws.com", "emrappui-prod.ap-northeast-2.amazonaws.com", "emrnotebooks-prod.ap-northeast-2.amazonaws.com", "emrstudio-prod.ap-northeast-2.amazonaws.com", "emrappui-prod.ap-northeast-3.amazonaws.com", "emrnotebooks-prod.ap-northeast-3.amazonaws.com", "emrstudio-prod.ap-northeast-3.amazonaws.com", "emrappui-prod.ap-south-1.amazonaws.com", "emrnotebooks-prod.ap-south-1.amazonaws.com", "emrstudio-prod.ap-south-1.amazonaws.com", "emrappui-prod.ap-south-2.amazonaws.com", "emrnotebooks-prod.ap-south-2.amazonaws.com", "emrstudio-prod.ap-south-2.amazonaws.com", "emrappui-prod.ap-southeast-1.amazonaws.com", "emrnotebooks-prod.ap-southeast-1.amazonaws.com", "emrstudio-prod.ap-southeast-1.amazonaws.com", "emrappui-prod.ap-southeast-2.amazonaws.com", "emrnotebooks-prod.ap-southeast-2.amazonaws.com", "emrstudio-prod.ap-southeast-2.amazonaws.com", "emrappui-prod.ap-southeast-3.amazonaws.com", "emrnotebooks-prod.ap-southeast-3.amazonaws.com", "emrstudio-prod.ap-southeast-3.amazonaws.com", "emrappui-prod.ap-southeast-4.amazonaws.com", "emrnotebooks-prod.ap-southeast-4.amazonaws.com", "emrstudio-prod.ap-southeast-4.amazonaws.com", "emrappui-prod.ca-central-1.amazonaws.com", "emrnotebooks-prod.ca-central-1.amazonaws.com", "emrstudio-prod.ca-central-1.amazonaws.com", "emrappui-prod.ca-west-1.amazonaws.com", "emrnotebooks-prod.ca-west-1.amazonaws.com", "emrstudio-prod.ca-west-1.amazonaws.com", "emrappui-prod.eu-central-1.amazonaws.com", "emrnotebooks-prod.eu-central-1.amazonaws.com", "emrstudio-prod.eu-central-1.amazonaws.com", "emrappui-prod.eu-central-2.amazonaws.com", "emrnotebooks-prod.eu-central-2.amazonaws.com", "emrstudio-prod.eu-central-2.amazonaws.com", "emrappui-prod.eu-north-1.amazonaws.com", "emrnotebooks-prod.eu-north-1.amazonaws.com", "emrstudio-prod.eu-north-1.amazonaws.com", "emrappui-prod.eu-south-1.amazonaws.com", "emrnotebooks-prod.eu-south-1.amazonaws.com", "emrstudio-prod.eu-south-1.amazonaws.com", "emrappui-prod.eu-south-2.amazonaws.com", "emrnotebooks-prod.eu-south-2.amazonaws.com", "emrstudio-prod.eu-south-2.amazonaws.com", "emrappui-prod.eu-west-1.amazonaws.com", "emrnotebooks-prod.eu-west-1.amazonaws.com", "emrstudio-prod.eu-west-1.amazonaws.com", "emrappui-prod.eu-west-2.amazonaws.com", "emrnotebooks-prod.eu-west-2.amazonaws.com", "emrstudio-prod.eu-west-2.amazonaws.com", "emrappui-prod.eu-west-3.amazonaws.com", "emrnotebooks-prod.eu-west-3.amazonaws.com", "emrstudio-prod.eu-west-3.amazonaws.com", "emrappui-prod.il-central-1.amazonaws.com", "emrnotebooks-prod.il-central-1.amazonaws.com", "emrstudio-prod.il-central-1.amazonaws.com", "emrappui-prod.me-central-1.amazonaws.com", "emrnotebooks-prod.me-central-1.amazonaws.com", "emrstudio-prod.me-central-1.amazonaws.com", "emrappui-prod.me-south-1.amazonaws.com", "emrnotebooks-prod.me-south-1.amazonaws.com", "emrstudio-prod.me-south-1.amazonaws.com", "emrappui-prod.sa-east-1.amazonaws.com", "emrnotebooks-prod.sa-east-1.amazonaws.com", "emrstudio-prod.sa-east-1.amazonaws.com", "emrappui-prod.us-east-1.amazonaws.com", "emrnotebooks-prod.us-east-1.amazonaws.com", "emrstudio-prod.us-east-1.amazonaws.com", "emrappui-prod.us-east-2.amazonaws.com", "emrnotebooks-prod.us-east-2.amazonaws.com", "emrstudio-prod.us-east-2.amazonaws.com", "emrappui-prod.us-gov-east-1.amazonaws.com", "emrnotebooks-prod.us-gov-east-1.amazonaws.com", "emrstudio-prod.us-gov-east-1.amazonaws.com", "emrappui-prod.us-gov-west-1.amazonaws.com", "emrnotebooks-prod.us-gov-west-1.amazonaws.com", "emrstudio-prod.us-gov-west-1.amazonaws.com", "emrappui-prod.us-west-1.amazonaws.com", "emrnotebooks-prod.us-west-1.amazonaws.com", "emrstudio-prod.us-west-1.amazonaws.com", "emrappui-prod.us-west-2.amazonaws.com", "emrnotebooks-prod.us-west-2.amazonaws.com", "emrstudio-prod.us-west-2.amazonaws.com", "*.cn-north-1.airflow.amazonaws.com.cn", "*.cn-northwest-1.airflow.amazonaws.com.cn", "*.af-south-1.airflow.amazonaws.com", "*.ap-east-1.airflow.amazonaws.com", "*.ap-northeast-1.airflow.amazonaws.com", "*.ap-northeast-2.airflow.amazonaws.com", "*.ap-northeast-3.airflow.amazonaws.com", "*.ap-south-1.airflow.amazonaws.com", "*.ap-south-2.airflow.amazonaws.com", "*.ap-southeast-1.airflow.amazonaws.com", "*.ap-southeast-2.airflow.amazonaws.com", "*.ap-southeast-3.airflow.amazonaws.com", "*.ap-southeast-4.airflow.amazonaws.com", "*.ca-central-1.airflow.amazonaws.com", "*.ca-west-1.airflow.amazonaws.com", "*.eu-central-1.airflow.amazonaws.com", "*.eu-central-2.airflow.amazonaws.com", "*.eu-north-1.airflow.amazonaws.com", "*.eu-south-1.airflow.amazonaws.com", "*.eu-south-2.airflow.amazonaws.com", "*.eu-west-1.airflow.amazonaws.com", "*.eu-west-2.airflow.amazonaws.com", "*.eu-west-3.airflow.amazonaws.com", "*.il-central-1.airflow.amazonaws.com", "*.me-central-1.airflow.amazonaws.com", "*.me-south-1.airflow.amazonaws.com", "*.sa-east-1.airflow.amazonaws.com", "*.us-east-1.airflow.amazonaws.com", "*.us-east-2.airflow.amazonaws.com", "*.us-west-1.airflow.amazonaws.com", "*.us-west-2.airflow.amazonaws.com", "s3.dualstack.cn-north-1.amazonaws.com.cn", "s3-accesspoint.dualstack.cn-north-1.amazonaws.com.cn", "s3-website.dualstack.cn-north-1.amazonaws.com.cn", "s3.cn-north-1.amazonaws.com.cn", "s3-accesspoint.cn-north-1.amazonaws.com.cn", "s3-deprecated.cn-north-1.amazonaws.com.cn", "s3-object-lambda.cn-north-1.amazonaws.com.cn", "s3-website.cn-north-1.amazonaws.com.cn", "s3.dualstack.cn-northwest-1.amazonaws.com.cn", "s3-accesspoint.dualstack.cn-northwest-1.amazonaws.com.cn", "s3.cn-northwest-1.amazonaws.com.cn", "s3-accesspoint.cn-northwest-1.amazonaws.com.cn", "s3-object-lambda.cn-northwest-1.amazonaws.com.cn", "s3-website.cn-northwest-1.amazonaws.com.cn", "s3.dualstack.af-south-1.amazonaws.com", "s3-accesspoint.dualstack.af-south-1.amazonaws.com", "s3-website.dualstack.af-south-1.amazonaws.com", "s3.af-south-1.amazonaws.com", "s3-accesspoint.af-south-1.amazonaws.com", "s3-object-lambda.af-south-1.amazonaws.com", "s3-website.af-south-1.amazonaws.com", "s3.dualstack.ap-east-1.amazonaws.com", "s3-accesspoint.dualstack.ap-east-1.amazonaws.com", "s3.ap-east-1.amazonaws.com", "s3-accesspoint.ap-east-1.amazonaws.com", "s3-object-lambda.ap-east-1.amazonaws.com", "s3-website.ap-east-1.amazonaws.com", "s3.dualstack.ap-northeast-1.amazonaws.com", "s3-accesspoint.dualstack.ap-northeast-1.amazonaws.com", "s3-website.dualstack.ap-northeast-1.amazonaws.com", "s3.ap-northeast-1.amazonaws.com", "s3-accesspoint.ap-northeast-1.amazonaws.com", "s3-object-lambda.ap-northeast-1.amazonaws.com", "s3-website.ap-northeast-1.amazonaws.com", "s3.dualstack.ap-northeast-2.amazonaws.com", "s3-accesspoint.dualstack.ap-northeast-2.amazonaws.com", "s3-website.dualstack.ap-northeast-2.amazonaws.com", "s3.ap-northeast-2.amazonaws.com", "s3-accesspoint.ap-northeast-2.amazonaws.com", "s3-object-lambda.ap-northeast-2.amazonaws.com", "s3-website.ap-northeast-2.amazonaws.com", "s3.dualstack.ap-northeast-3.amazonaws.com", "s3-accesspoint.dualstack.ap-northeast-3.amazonaws.com", "s3-website.dualstack.ap-northeast-3.amazonaws.com", "s3.ap-northeast-3.amazonaws.com", "s3-accesspoint.ap-northeast-3.amazonaws.com", "s3-object-lambda.ap-northeast-3.amazonaws.com", "s3-website.ap-northeast-3.amazonaws.com", "s3.dualstack.ap-south-1.amazonaws.com", "s3-accesspoint.dualstack.ap-south-1.amazonaws.com", "s3-website.dualstack.ap-south-1.amazonaws.com", "s3.ap-south-1.amazonaws.com", "s3-accesspoint.ap-south-1.amazonaws.com", "s3-object-lambda.ap-south-1.amazonaws.com", "s3-website.ap-south-1.amazonaws.com", "s3.dualstack.ap-south-2.amazonaws.com", "s3-accesspoint.dualstack.ap-south-2.amazonaws.com", "s3-website.dualstack.ap-south-2.amazonaws.com", "s3.ap-south-2.amazonaws.com", "s3-accesspoint.ap-south-2.amazonaws.com", "s3-object-lambda.ap-south-2.amazonaws.com", "s3-website.ap-south-2.amazonaws.com", "s3.dualstack.ap-southeast-1.amazonaws.com", "s3-accesspoint.dualstack.ap-southeast-1.amazonaws.com", "s3-website.dualstack.ap-southeast-1.amazonaws.com", "s3.ap-southeast-1.amazonaws.com", "s3-accesspoint.ap-southeast-1.amazonaws.com", "s3-object-lambda.ap-southeast-1.amazonaws.com", "s3-website.ap-southeast-1.amazonaws.com", "s3.dualstack.ap-southeast-2.amazonaws.com", "s3-accesspoint.dualstack.ap-southeast-2.amazonaws.com", "s3-website.dualstack.ap-southeast-2.amazonaws.com", "s3.ap-southeast-2.amazonaws.com", "s3-accesspoint.ap-southeast-2.amazonaws.com", "s3-object-lambda.ap-southeast-2.amazonaws.com", "s3-website.ap-southeast-2.amazonaws.com", "s3.dualstack.ap-southeast-3.amazonaws.com", "s3-accesspoint.dualstack.ap-southeast-3.amazonaws.com", "s3-website.dualstack.ap-southeast-3.amazonaws.com", "s3.ap-southeast-3.amazonaws.com", "s3-accesspoint.ap-southeast-3.amazonaws.com", "s3-object-lambda.ap-southeast-3.amazonaws.com", "s3-website.ap-southeast-3.amazonaws.com", "s3.dualstack.ap-southeast-4.amazonaws.com", "s3-accesspoint.dualstack.ap-southeast-4.amazonaws.com", "s3-website.dualstack.ap-southeast-4.amazonaws.com", "s3.ap-southeast-4.amazonaws.com", "s3-accesspoint.ap-southeast-4.amazonaws.com", "s3-object-lambda.ap-southeast-4.amazonaws.com", "s3-website.ap-southeast-4.amazonaws.com", "s3.dualstack.ap-southeast-5.amazonaws.com", "s3-accesspoint.dualstack.ap-southeast-5.amazonaws.com", "s3-website.dualstack.ap-southeast-5.amazonaws.com", "s3.ap-southeast-5.amazonaws.com", "s3-accesspoint.ap-southeast-5.amazonaws.com", "s3-deprecated.ap-southeast-5.amazonaws.com", "s3-object-lambda.ap-southeast-5.amazonaws.com", "s3-website.ap-southeast-5.amazonaws.com", "s3.dualstack.ca-central-1.amazonaws.com", "s3-accesspoint.dualstack.ca-central-1.amazonaws.com", "s3-accesspoint-fips.dualstack.ca-central-1.amazonaws.com", "s3-fips.dualstack.ca-central-1.amazonaws.com", "s3-website.dualstack.ca-central-1.amazonaws.com", "s3.ca-central-1.amazonaws.com", "s3-accesspoint.ca-central-1.amazonaws.com", "s3-accesspoint-fips.ca-central-1.amazonaws.com", "s3-fips.ca-central-1.amazonaws.com", "s3-object-lambda.ca-central-1.amazonaws.com", "s3-website.ca-central-1.amazonaws.com", "s3.dualstack.ca-west-1.amazonaws.com", "s3-accesspoint.dualstack.ca-west-1.amazonaws.com", "s3-accesspoint-fips.dualstack.ca-west-1.amazonaws.com", "s3-fips.dualstack.ca-west-1.amazonaws.com", "s3-website.dualstack.ca-west-1.amazonaws.com", "s3.ca-west-1.amazonaws.com", "s3-accesspoint.ca-west-1.amazonaws.com", "s3-accesspoint-fips.ca-west-1.amazonaws.com", "s3-fips.ca-west-1.amazonaws.com", "s3-object-lambda.ca-west-1.amazonaws.com", "s3-website.ca-west-1.amazonaws.com", "s3.dualstack.eu-central-1.amazonaws.com", "s3-accesspoint.dualstack.eu-central-1.amazonaws.com", "s3-website.dualstack.eu-central-1.amazonaws.com", "s3.eu-central-1.amazonaws.com", "s3-accesspoint.eu-central-1.amazonaws.com", "s3-object-lambda.eu-central-1.amazonaws.com", "s3-website.eu-central-1.amazonaws.com", "s3.dualstack.eu-central-2.amazonaws.com", "s3-accesspoint.dualstack.eu-central-2.amazonaws.com", "s3-website.dualstack.eu-central-2.amazonaws.com", "s3.eu-central-2.amazonaws.com", "s3-accesspoint.eu-central-2.amazonaws.com", "s3-object-lambda.eu-central-2.amazonaws.com", "s3-website.eu-central-2.amazonaws.com", "s3.dualstack.eu-north-1.amazonaws.com", "s3-accesspoint.dualstack.eu-north-1.amazonaws.com", "s3.eu-north-1.amazonaws.com", "s3-accesspoint.eu-north-1.amazonaws.com", "s3-object-lambda.eu-north-1.amazonaws.com", "s3-website.eu-north-1.amazonaws.com", "s3.dualstack.eu-south-1.amazonaws.com", "s3-accesspoint.dualstack.eu-south-1.amazonaws.com", "s3-website.dualstack.eu-south-1.amazonaws.com", "s3.eu-south-1.amazonaws.com", "s3-accesspoint.eu-south-1.amazonaws.com", "s3-object-lambda.eu-south-1.amazonaws.com", "s3-website.eu-south-1.amazonaws.com", "s3.dualstack.eu-south-2.amazonaws.com", "s3-accesspoint.dualstack.eu-south-2.amazonaws.com", "s3-website.dualstack.eu-south-2.amazonaws.com", "s3.eu-south-2.amazonaws.com", "s3-accesspoint.eu-south-2.amazonaws.com", "s3-object-lambda.eu-south-2.amazonaws.com", "s3-website.eu-south-2.amazonaws.com", "s3.dualstack.eu-west-1.amazonaws.com", "s3-accesspoint.dualstack.eu-west-1.amazonaws.com", "s3-website.dualstack.eu-west-1.amazonaws.com", "s3.eu-west-1.amazonaws.com", "s3-accesspoint.eu-west-1.amazonaws.com", "s3-deprecated.eu-west-1.amazonaws.com", "s3-object-lambda.eu-west-1.amazonaws.com", "s3-website.eu-west-1.amazonaws.com", "s3.dualstack.eu-west-2.amazonaws.com", "s3-accesspoint.dualstack.eu-west-2.amazonaws.com", "s3.eu-west-2.amazonaws.com", "s3-accesspoint.eu-west-2.amazonaws.com", "s3-object-lambda.eu-west-2.amazonaws.com", "s3-website.eu-west-2.amazonaws.com", "s3.dualstack.eu-west-3.amazonaws.com", "s3-accesspoint.dualstack.eu-west-3.amazonaws.com", "s3-website.dualstack.eu-west-3.amazonaws.com", "s3.eu-west-3.amazonaws.com", "s3-accesspoint.eu-west-3.amazonaws.com", "s3-object-lambda.eu-west-3.amazonaws.com", "s3-website.eu-west-3.amazonaws.com", "s3.dualstack.il-central-1.amazonaws.com", "s3-accesspoint.dualstack.il-central-1.amazonaws.com", "s3-website.dualstack.il-central-1.amazonaws.com", "s3.il-central-1.amazonaws.com", "s3-accesspoint.il-central-1.amazonaws.com", "s3-object-lambda.il-central-1.amazonaws.com", "s3-website.il-central-1.amazonaws.com", "s3.dualstack.me-central-1.amazonaws.com", "s3-accesspoint.dualstack.me-central-1.amazonaws.com", "s3-website.dualstack.me-central-1.amazonaws.com", "s3.me-central-1.amazonaws.com", "s3-accesspoint.me-central-1.amazonaws.com", "s3-object-lambda.me-central-1.amazonaws.com", "s3-website.me-central-1.amazonaws.com", "s3.dualstack.me-south-1.amazonaws.com", "s3-accesspoint.dualstack.me-south-1.amazonaws.com", "s3.me-south-1.amazonaws.com", "s3-accesspoint.me-south-1.amazonaws.com", "s3-object-lambda.me-south-1.amazonaws.com", "s3-website.me-south-1.amazonaws.com", "s3.amazonaws.com", "s3-1.amazonaws.com", "s3-ap-east-1.amazonaws.com", "s3-ap-northeast-1.amazonaws.com", "s3-ap-northeast-2.amazonaws.com", "s3-ap-northeast-3.amazonaws.com", "s3-ap-south-1.amazonaws.com", "s3-ap-southeast-1.amazonaws.com", "s3-ap-southeast-2.amazonaws.com", "s3-ca-central-1.amazonaws.com", "s3-eu-central-1.amazonaws.com", "s3-eu-north-1.amazonaws.com", "s3-eu-west-1.amazonaws.com", "s3-eu-west-2.amazonaws.com", "s3-eu-west-3.amazonaws.com", "s3-external-1.amazonaws.com", "s3-fips-us-gov-east-1.amazonaws.com", "s3-fips-us-gov-west-1.amazonaws.com", "mrap.accesspoint.s3-global.amazonaws.com", "s3-me-south-1.amazonaws.com", "s3-sa-east-1.amazonaws.com", "s3-us-east-2.amazonaws.com", "s3-us-gov-east-1.amazonaws.com", "s3-us-gov-west-1.amazonaws.com", "s3-us-west-1.amazonaws.com", "s3-us-west-2.amazonaws.com", "s3-website-ap-northeast-1.amazonaws.com", "s3-website-ap-southeast-1.amazonaws.com", "s3-website-ap-southeast-2.amazonaws.com", "s3-website-eu-west-1.amazonaws.com", "s3-website-sa-east-1.amazonaws.com", "s3-website-us-east-1.amazonaws.com", "s3-website-us-gov-west-1.amazonaws.com", "s3-website-us-west-1.amazonaws.com", "s3-website-us-west-2.amazonaws.com", "s3.dualstack.sa-east-1.amazonaws.com", "s3-accesspoint.dualstack.sa-east-1.amazonaws.com", "s3-website.dualstack.sa-east-1.amazonaws.com", "s3.sa-east-1.amazonaws.com", "s3-accesspoint.sa-east-1.amazonaws.com", "s3-object-lambda.sa-east-1.amazonaws.com", "s3-website.sa-east-1.amazonaws.com", "s3.dualstack.us-east-1.amazonaws.com", "s3-accesspoint.dualstack.us-east-1.amazonaws.com", "s3-accesspoint-fips.dualstack.us-east-1.amazonaws.com", "s3-fips.dualstack.us-east-1.amazonaws.com", "s3-website.dualstack.us-east-1.amazonaws.com", "s3.us-east-1.amazonaws.com", "s3-accesspoint.us-east-1.amazonaws.com", "s3-accesspoint-fips.us-east-1.amazonaws.com", "s3-deprecated.us-east-1.amazonaws.com", "s3-fips.us-east-1.amazonaws.com", "s3-object-lambda.us-east-1.amazonaws.com", "s3-website.us-east-1.amazonaws.com", "s3.dualstack.us-east-2.amazonaws.com", "s3-accesspoint.dualstack.us-east-2.amazonaws.com", "s3-accesspoint-fips.dualstack.us-east-2.amazonaws.com", "s3-fips.dualstack.us-east-2.amazonaws.com", "s3-website.dualstack.us-east-2.amazonaws.com", "s3.us-east-2.amazonaws.com", "s3-accesspoint.us-east-2.amazonaws.com", "s3-accesspoint-fips.us-east-2.amazonaws.com", "s3-deprecated.us-east-2.amazonaws.com", "s3-fips.us-east-2.amazonaws.com", "s3-object-lambda.us-east-2.amazonaws.com", "s3-website.us-east-2.amazonaws.com", "s3.dualstack.us-gov-east-1.amazonaws.com", "s3-accesspoint.dualstack.us-gov-east-1.amazonaws.com", "s3-accesspoint-fips.dualstack.us-gov-east-1.amazonaws.com", "s3-fips.dualstack.us-gov-east-1.amazonaws.com", "s3.us-gov-east-1.amazonaws.com", "s3-accesspoint.us-gov-east-1.amazonaws.com", "s3-accesspoint-fips.us-gov-east-1.amazonaws.com", "s3-fips.us-gov-east-1.amazonaws.com", "s3-object-lambda.us-gov-east-1.amazonaws.com", "s3-website.us-gov-east-1.amazonaws.com", "s3.dualstack.us-gov-west-1.amazonaws.com", "s3-accesspoint.dualstack.us-gov-west-1.amazonaws.com", "s3-accesspoint-fips.dualstack.us-gov-west-1.amazonaws.com", "s3-fips.dualstack.us-gov-west-1.amazonaws.com", "s3.us-gov-west-1.amazonaws.com", "s3-accesspoint.us-gov-west-1.amazonaws.com", "s3-accesspoint-fips.us-gov-west-1.amazonaws.com", "s3-fips.us-gov-west-1.amazonaws.com", "s3-object-lambda.us-gov-west-1.amazonaws.com", "s3-website.us-gov-west-1.amazonaws.com", "s3.dualstack.us-west-1.amazonaws.com", "s3-accesspoint.dualstack.us-west-1.amazonaws.com", "s3-accesspoint-fips.dualstack.us-west-1.amazonaws.com", "s3-fips.dualstack.us-west-1.amazonaws.com", "s3-website.dualstack.us-west-1.amazonaws.com", "s3.us-west-1.amazonaws.com", "s3-accesspoint.us-west-1.amazonaws.com", "s3-accesspoint-fips.us-west-1.amazonaws.com", "s3-fips.us-west-1.amazonaws.com", "s3-object-lambda.us-west-1.amazonaws.com", "s3-website.us-west-1.amazonaws.com", "s3.dualstack.us-west-2.amazonaws.com", "s3-accesspoint.dualstack.us-west-2.amazonaws.com", "s3-accesspoint-fips.dualstack.us-west-2.amazonaws.com", "s3-fips.dualstack.us-west-2.amazonaws.com", "s3-website.dualstack.us-west-2.amazonaws.com", "s3.us-west-2.amazonaws.com", "s3-accesspoint.us-west-2.amazonaws.com", "s3-accesspoint-fips.us-west-2.amazonaws.com", "s3-deprecated.us-west-2.amazonaws.com", "s3-fips.us-west-2.amazonaws.com", "s3-object-lambda.us-west-2.amazonaws.com", "s3-website.us-west-2.amazonaws.com", "labeling.ap-northeast-1.sagemaker.aws", "labeling.ap-northeast-2.sagemaker.aws", "labeling.ap-south-1.sagemaker.aws", "labeling.ap-southeast-1.sagemaker.aws", "labeling.ap-southeast-2.sagemaker.aws", "labeling.ca-central-1.sagemaker.aws", "labeling.eu-central-1.sagemaker.aws", "labeling.eu-west-1.sagemaker.aws", "labeling.eu-west-2.sagemaker.aws", "labeling.us-east-1.sagemaker.aws", "labeling.us-east-2.sagemaker.aws", "labeling.us-west-2.sagemaker.aws", "notebook.af-south-1.sagemaker.aws", "notebook.ap-east-1.sagemaker.aws", "notebook.ap-northeast-1.sagemaker.aws", "notebook.ap-northeast-2.sagemaker.aws", "notebook.ap-northeast-3.sagemaker.aws", "notebook.ap-south-1.sagemaker.aws", "notebook.ap-south-2.sagemaker.aws", "notebook.ap-southeast-1.sagemaker.aws", "notebook.ap-southeast-2.sagemaker.aws", "notebook.ap-southeast-3.sagemaker.aws", "notebook.ap-southeast-4.sagemaker.aws", "notebook.ca-central-1.sagemaker.aws", "notebook-fips.ca-central-1.sagemaker.aws", "notebook.ca-west-1.sagemaker.aws", "notebook-fips.ca-west-1.sagemaker.aws", "notebook.eu-central-1.sagemaker.aws", "notebook.eu-central-2.sagemaker.aws", "notebook.eu-north-1.sagemaker.aws", "notebook.eu-south-1.sagemaker.aws", "notebook.eu-south-2.sagemaker.aws", "notebook.eu-west-1.sagemaker.aws", "notebook.eu-west-2.sagemaker.aws", "notebook.eu-west-3.sagemaker.aws", "notebook.il-central-1.sagemaker.aws", "notebook.me-central-1.sagemaker.aws", "notebook.me-south-1.sagemaker.aws", "notebook.sa-east-1.sagemaker.aws", "notebook.us-east-1.sagemaker.aws", "notebook-fips.us-east-1.sagemaker.aws", "notebook.us-east-2.sagemaker.aws", "notebook-fips.us-east-2.sagemaker.aws", "notebook.us-gov-east-1.sagemaker.aws", "notebook-fips.us-gov-east-1.sagemaker.aws", "notebook.us-gov-west-1.sagemaker.aws", "notebook-fips.us-gov-west-1.sagemaker.aws", "notebook.us-west-1.sagemaker.aws", "notebook-fips.us-west-1.sagemaker.aws", "notebook.us-west-2.sagemaker.aws", "notebook-fips.us-west-2.sagemaker.aws", "notebook.cn-north-1.sagemaker.com.cn", "notebook.cn-northwest-1.sagemaker.com.cn", "studio.af-south-1.sagemaker.aws", "studio.ap-east-1.sagemaker.aws", "studio.ap-northeast-1.sagemaker.aws", "studio.ap-northeast-2.sagemaker.aws", "studio.ap-northeast-3.sagemaker.aws", "studio.ap-south-1.sagemaker.aws", "studio.ap-southeast-1.sagemaker.aws", "studio.ap-southeast-2.sagemaker.aws", "studio.ap-southeast-3.sagemaker.aws", "studio.ca-central-1.sagemaker.aws", "studio.eu-central-1.sagemaker.aws", "studio.eu-north-1.sagemaker.aws", "studio.eu-south-1.sagemaker.aws", "studio.eu-south-2.sagemaker.aws", "studio.eu-west-1.sagemaker.aws", "studio.eu-west-2.sagemaker.aws", "studio.eu-west-3.sagemaker.aws", "studio.il-central-1.sagemaker.aws", "studio.me-central-1.sagemaker.aws", "studio.me-south-1.sagemaker.aws", "studio.sa-east-1.sagemaker.aws", "studio.us-east-1.sagemaker.aws", "studio.us-east-2.sagemaker.aws", "studio.us-gov-east-1.sagemaker.aws", "studio-fips.us-gov-east-1.sagemaker.aws", "studio.us-gov-west-1.sagemaker.aws", "studio-fips.us-gov-west-1.sagemaker.aws", "studio.us-west-1.sagemaker.aws", "studio.us-west-2.sagemaker.aws", "studio.cn-north-1.sagemaker.com.cn", "studio.cn-northwest-1.sagemaker.com.cn", "*.experiments.sagemaker.aws", "analytics-gateway.ap-northeast-1.amazonaws.com", "analytics-gateway.ap-northeast-2.amazonaws.com", "analytics-gateway.ap-south-1.amazonaws.com", "analytics-gateway.ap-southeast-1.amazonaws.com", "analytics-gateway.ap-southeast-2.amazonaws.com", "analytics-gateway.eu-central-1.amazonaws.com", "analytics-gateway.eu-west-1.amazonaws.com", "analytics-gateway.us-east-1.amazonaws.com", "analytics-gateway.us-east-2.amazonaws.com", "analytics-gateway.us-west-2.amazonaws.com", "amplifyapp.com", "*.awsapprunner.com", "webview-assets.aws-cloud9.af-south-1.amazonaws.com", "vfs.cloud9.af-south-1.amazonaws.com", "webview-assets.cloud9.af-south-1.amazonaws.com", "webview-assets.aws-cloud9.ap-east-1.amazonaws.com", "vfs.cloud9.ap-east-1.amazonaws.com", "webview-assets.cloud9.ap-east-1.amazonaws.com", "webview-assets.aws-cloud9.ap-northeast-1.amazonaws.com", "vfs.cloud9.ap-northeast-1.amazonaws.com", "webview-assets.cloud9.ap-northeast-1.amazonaws.com", "webview-assets.aws-cloud9.ap-northeast-2.amazonaws.com", "vfs.cloud9.ap-northeast-2.amazonaws.com", "webview-assets.cloud9.ap-northeast-2.amazonaws.com", "webview-assets.aws-cloud9.ap-northeast-3.amazonaws.com", "vfs.cloud9.ap-northeast-3.amazonaws.com", "webview-assets.cloud9.ap-northeast-3.amazonaws.com", "webview-assets.aws-cloud9.ap-south-1.amazonaws.com", "vfs.cloud9.ap-south-1.amazonaws.com", "webview-assets.cloud9.ap-south-1.amazonaws.com", "webview-assets.aws-cloud9.ap-southeast-1.amazonaws.com", "vfs.cloud9.ap-southeast-1.amazonaws.com", "webview-assets.cloud9.ap-southeast-1.amazonaws.com", "webview-assets.aws-cloud9.ap-southeast-2.amazonaws.com", "vfs.cloud9.ap-southeast-2.amazonaws.com", "webview-assets.cloud9.ap-southeast-2.amazonaws.com", "webview-assets.aws-cloud9.ca-central-1.amazonaws.com", "vfs.cloud9.ca-central-1.amazonaws.com", "webview-assets.cloud9.ca-central-1.amazonaws.com", "webview-assets.aws-cloud9.eu-central-1.amazonaws.com", "vfs.cloud9.eu-central-1.amazonaws.com", "webview-assets.cloud9.eu-central-1.amazonaws.com", "webview-assets.aws-cloud9.eu-north-1.amazonaws.com", "vfs.cloud9.eu-north-1.amazonaws.com", "webview-assets.cloud9.eu-north-1.amazonaws.com", "webview-assets.aws-cloud9.eu-south-1.amazonaws.com", "vfs.cloud9.eu-south-1.amazonaws.com", "webview-assets.cloud9.eu-south-1.amazonaws.com", "webview-assets.aws-cloud9.eu-west-1.amazonaws.com", "vfs.cloud9.eu-west-1.amazonaws.com", "webview-assets.cloud9.eu-west-1.amazonaws.com", "webview-assets.aws-cloud9.eu-west-2.amazonaws.com", "vfs.cloud9.eu-west-2.amazonaws.com", "webview-assets.cloud9.eu-west-2.amazonaws.com", "webview-assets.aws-cloud9.eu-west-3.amazonaws.com", "vfs.cloud9.eu-west-3.amazonaws.com", "webview-assets.cloud9.eu-west-3.amazonaws.com", "webview-assets.aws-cloud9.il-central-1.amazonaws.com", "vfs.cloud9.il-central-1.amazonaws.com", "webview-assets.aws-cloud9.me-south-1.amazonaws.com", "vfs.cloud9.me-south-1.amazonaws.com", "webview-assets.cloud9.me-south-1.amazonaws.com", "webview-assets.aws-cloud9.sa-east-1.amazonaws.com", "vfs.cloud9.sa-east-1.amazonaws.com", "webview-assets.cloud9.sa-east-1.amazonaws.com", "webview-assets.aws-cloud9.us-east-1.amazonaws.com", "vfs.cloud9.us-east-1.amazonaws.com", "webview-assets.cloud9.us-east-1.amazonaws.com", "webview-assets.aws-cloud9.us-east-2.amazonaws.com", "vfs.cloud9.us-east-2.amazonaws.com", "webview-assets.cloud9.us-east-2.amazonaws.com", "webview-assets.aws-cloud9.us-west-1.amazonaws.com", "vfs.cloud9.us-west-1.amazonaws.com", "webview-assets.cloud9.us-west-1.amazonaws.com", "webview-assets.aws-cloud9.us-west-2.amazonaws.com", "vfs.cloud9.us-west-2.amazonaws.com", "webview-assets.cloud9.us-west-2.amazonaws.com", "awsapps.com", "cn-north-1.eb.amazonaws.com.cn", "cn-northwest-1.eb.amazonaws.com.cn", "elasticbeanstalk.com", "af-south-1.elasticbeanstalk.com", "ap-east-1.elasticbeanstalk.com", "ap-northeast-1.elasticbeanstalk.com", "ap-northeast-2.elasticbeanstalk.com", "ap-northeast-3.elasticbeanstalk.com", "ap-south-1.elasticbeanstalk.com", "ap-southeast-1.elasticbeanstalk.com", "ap-southeast-2.elasticbeanstalk.com", "ap-southeast-3.elasticbeanstalk.com", "ca-central-1.elasticbeanstalk.com", "eu-central-1.elasticbeanstalk.com", "eu-north-1.elasticbeanstalk.com", "eu-south-1.elasticbeanstalk.com", "eu-west-1.elasticbeanstalk.com", "eu-west-2.elasticbeanstalk.com", "eu-west-3.elasticbeanstalk.com", "il-central-1.elasticbeanstalk.com", "me-south-1.elasticbeanstalk.com", "sa-east-1.elasticbeanstalk.com", "us-east-1.elasticbeanstalk.com", "us-east-2.elasticbeanstalk.com", "us-gov-east-1.elasticbeanstalk.com", "us-gov-west-1.elasticbeanstalk.com", "us-west-1.elasticbeanstalk.com", "us-west-2.elasticbeanstalk.com", "*.elb.amazonaws.com.cn", "*.elb.amazonaws.com", "awsglobalaccelerator.com", "*.private.repost.aws", "eero.online", "eero-stage.online", "apigee.io", "panel.dev", "siiites.com", "appspacehosted.com", "appspaceusercontent.com", "appudo.net", "on-aptible.com", "f5.si", "arvanedge.ir", "user.aseinet.ne.jp", "gv.vc", "d.gv.vc", "user.party.eus", "pimienta.org", "poivron.org", "potager.org", "sweetpepper.org", "myasustor.com", "cdn.prod.atlassian-dev.net", "translated.page", "myfritz.link", "myfritz.net", "onavstack.net", "*.awdev.ca", "*.advisor.ws", "ecommerce-shop.pl", "b-data.io", "balena-devices.com", "base.ec", "official.ec", "buyshop.jp", "fashionstore.jp", "handcrafted.jp", "kawaiishop.jp", "supersale.jp", "theshop.jp", "shopselect.net", "base.shop", "beagleboard.io", "*.beget.app", "pages.gay", "bnr.la", "bitbucket.io", "blackbaudcdn.net", "of.je", "bluebite.io", "boomla.net", "boutir.com", "boxfuse.io", "square7.ch", "bplaced.com", "bplaced.de", "square7.de", "bplaced.net", "square7.net", "*.s.brave.io", "shop.brendly.hr", "shop.brendly.rs", "browsersafetymark.io", "radio.am", "radio.fm", "uk0.bigv.io", "dh.bytemark.co.uk", "vm.bytemark.co.uk", "cafjs.com", "canva-apps.cn", "*.my.canvasite.cn", "canva-apps.com", "*.my.canva.site", "drr.ac", "uwu.ai", "carrd.co", "crd.co", "ju.mp", "api.gov.uk", "cdn77-storage.com", "rsc.contentproxy9.cz", "r.cdn77.net", "cdn77-ssl.net", "c.cdn77.org", "rsc.cdn77.org", "ssl.origin.cdn77-secure.org", "za.bz", "br.com", "cn.com", "de.com", "eu.com", "jpn.com", "mex.com", "ru.com", "sa.com", "uk.com", "us.com", "za.com", "com.de", "gb.net", "hu.net", "jp.net", "se.net", "uk.net", "ae.org", "com.se", "cx.ua", "discourse.group", "discourse.team", "clerk.app", "clerkstage.app", "*.lcl.dev", "*.lclstage.dev", "*.stg.dev", "*.stgstage.dev", "cleverapps.cc", "*.services.clever-cloud.com", "cleverapps.io", "cleverapps.tech", "clickrising.net", "cloudns.asia", "cloudns.be", "cloud-ip.biz", "cloudns.biz", "cloudns.cc", "cloudns.ch", "cloudns.cl", "cloudns.club", "dnsabr.com", "ip-ddns.com", "cloudns.cx", "cloudns.eu", "cloudns.in", "cloudns.info", "ddns-ip.net", "dns-cloud.net", "dns-dynamic.net", "cloudns.nz", "cloudns.org", "ip-dynamic.org", "cloudns.ph", "cloudns.pro", "cloudns.pw", "cloudns.us", "c66.me", "cloud66.ws", "cloud66.zone", "jdevcloud.com", "wpdevcloud.com", "cloudaccess.host", "freesite.host", "cloudaccess.net", "*.cloudera.site", "cf-ipfs.com", "cloudflare-ipfs.com", "trycloudflare.com", "pages.dev", "r2.dev", "workers.dev", "cloudflare.net", "cdn.cloudflare.net", "cdn.cloudflareanycast.net", "cdn.cloudflarecn.net", "cdn.cloudflareglobal.net", "cust.cloudscale.ch", "objects.lpg.cloudscale.ch", "objects.rma.cloudscale.ch", "wnext.app", "cnpy.gdn", "*.otap.co", "co.ca", "co.com", "codeberg.page", "csb.app", "preview.csb.app", "co.nl", "co.no", "webhosting.be", "hosting-cluster.nl", "ctfcloud.net", "convex.site", "ac.ru", "edu.ru", "gov.ru", "int.ru", "mil.ru", "test.ru", "dyn.cosidns.de", "dnsupdater.de", "dynamisches-dns.de", "internet-dns.de", "l-o-g-i-n.de", "dynamic-dns.info", "feste-ip.net", "knx-server.net", "static-access.net", "craft.me", "realm.cz", "on.crisp.email", "*.cryptonomic.net", "curv.dev", "cfolks.pl", "cyon.link", "cyon.site", "platform0.app", "fnwk.site", "folionetwork.site", "biz.dk", "co.dk", "firm.dk", "reg.dk", "store.dk", "dyndns.dappnode.io", "builtwithdark.com", "darklang.io", "demo.datadetect.com", "instance.datadetect.com", "edgestack.me", "dattolocal.com", "dattorelay.com", "dattoweb.com", "mydatto.com", "dattolocal.net", "mydatto.net", "ddnss.de", "dyn.ddnss.de", "dyndns.ddnss.de", "dyn-ip24.de", "dyndns1.de", "home-webserver.de", "dyn.home-webserver.de", "myhome-server.de", "ddnss.org", "debian.net", "definima.io", "definima.net", "deno.dev", "deno-staging.dev", "dedyn.io", "deta.app", "deta.dev", "dfirma.pl", "dkonto.pl", "you2.pl", "ondigitalocean.app", "*.digitaloceanspaces.com", "us.kg", "rss.my.id", "diher.solutions", "discordsays.com", "discordsez.com", "jozi.biz", "dnshome.de", "online.th", "shop.th", "drayddns.com", "shoparena.pl", "dreamhosters.com", "durumis.com", "mydrobo.com", "drud.io", "drud.us", "duckdns.org", "dy.fi", "tunk.org", "dyndns.biz", "for-better.biz", "for-more.biz", "for-some.biz", "for-the.biz", "selfip.biz", "webhop.biz", "ftpaccess.cc", "game-server.cc", "myphotos.cc", "scrapping.cc", "blogdns.com", "cechire.com", "dnsalias.com", "dnsdojo.com", "doesntexist.com", "dontexist.com", "doomdns.com", "dyn-o-saur.com", "dynalias.com", "dyndns-at-home.com", "dyndns-at-work.com", "dyndns-blog.com", "dyndns-free.com", "dyndns-home.com", "dyndns-ip.com", "dyndns-mail.com", "dyndns-office.com", "dyndns-pics.com", "dyndns-remote.com", "dyndns-server.com", "dyndns-web.com", "dyndns-wiki.com", "dyndns-work.com", "est-a-la-maison.com", "est-a-la-masion.com", "est-le-patron.com", "est-mon-blogueur.com", "from-ak.com", "from-al.com", "from-ar.com", "from-ca.com", "from-ct.com", "from-dc.com", "from-de.com", "from-fl.com", "from-ga.com", "from-hi.com", "from-ia.com", "from-id.com", "from-il.com", "from-in.com", "from-ks.com", "from-ky.com", "from-ma.com", "from-md.com", "from-mi.com", "from-mn.com", "from-mo.com", "from-ms.com", "from-mt.com", "from-nc.com", "from-nd.com", "from-ne.com", "from-nh.com", "from-nj.com", "from-nm.com", "from-nv.com", "from-oh.com", "from-ok.com", "from-or.com", "from-pa.com", "from-pr.com", "from-ri.com", "from-sc.com", "from-sd.com", "from-tn.com", "from-tx.com", "from-ut.com", "from-va.com", "from-vt.com", "from-wa.com", "from-wi.com", "from-wv.com", "from-wy.com", "getmyip.com", "gotdns.com", "hobby-site.com", "homelinux.com", "homeunix.com", "iamallama.com", "is-a-anarchist.com", "is-a-blogger.com", "is-a-bookkeeper.com", "is-a-bulls-fan.com", "is-a-caterer.com", "is-a-chef.com", "is-a-conservative.com", "is-a-cpa.com", "is-a-cubicle-slave.com", "is-a-democrat.com", "is-a-designer.com", "is-a-doctor.com", "is-a-financialadvisor.com", "is-a-geek.com", "is-a-green.com", "is-a-guru.com", "is-a-hard-worker.com", "is-a-hunter.com", "is-a-landscaper.com", "is-a-lawyer.com", "is-a-liberal.com", "is-a-libertarian.com", "is-a-llama.com", "is-a-musician.com", "is-a-nascarfan.com", "is-a-nurse.com", "is-a-painter.com", "is-a-personaltrainer.com", "is-a-photographer.com", "is-a-player.com", "is-a-republican.com", "is-a-rockstar.com", "is-a-socialist.com", "is-a-student.com", "is-a-teacher.com", "is-a-techie.com", "is-a-therapist.com", "is-an-accountant.com", "is-an-actor.com", "is-an-actress.com", "is-an-anarchist.com", "is-an-artist.com", "is-an-engineer.com", "is-an-entertainer.com", "is-certified.com", "is-gone.com", "is-into-anime.com", "is-into-cars.com", "is-into-cartoons.com", "is-into-games.com", "is-leet.com", "is-not-certified.com", "is-slick.com", "is-uberleet.com", "is-with-theband.com", "isa-geek.com", "isa-hockeynut.com", "issmarterthanyou.com", "likes-pie.com", "likescandy.com", "neat-url.com", "saves-the-whales.com", "selfip.com", "sells-for-less.com", "sells-for-u.com", "servebbs.com", "simple-url.com", "space-to-rent.com", "teaches-yoga.com", "writesthisblog.com", "ath.cx", "fuettertdasnetz.de", "isteingeek.de", "istmein.de", "lebtimnetz.de", "leitungsen.de", "traeumtgerade.de", "barrel-of-knowledge.info", "barrell-of-knowledge.info", "dyndns.info", "for-our.info", "groks-the.info", "groks-this.info", "here-for-more.info", "knowsitall.info", "selfip.info", "webhop.info", "forgot.her.name", "forgot.his.name", "at-band-camp.net", "blogdns.net", "broke-it.net", "buyshouses.net", "dnsalias.net", "dnsdojo.net", "does-it.net", "dontexist.net", "dynalias.net", "dynathome.net", "endofinternet.net", "from-az.net", "from-co.net", "from-la.net", "from-ny.net", "gets-it.net", "ham-radio-op.net", "homeftp.net", "homeip.net", "homelinux.net", "homeunix.net", "in-the-band.net", "is-a-chef.net", "is-a-geek.net", "isa-geek.net", "kicks-ass.net", "office-on-the.net", "podzone.net", "scrapper-site.net", "selfip.net", "sells-it.net", "servebbs.net", "serveftp.net", "thruhere.net", "webhop.net", "merseine.nu", "mine.nu", "shacknet.nu", "blogdns.org", "blogsite.org", "boldlygoingnowhere.org", "dnsalias.org", "dnsdojo.org", "doesntexist.org", "dontexist.org", "doomdns.org", "dvrdns.org", "dynalias.org", "dyndns.org", "go.dyndns.org", "home.dyndns.org", "endofinternet.org", "endoftheinternet.org", "from-me.org", "game-host.org", "gotdns.org", "hobby-site.org", "homedns.org", "homeftp.org", "homelinux.org", "homeunix.org", "is-a-bruinsfan.org", "is-a-candidate.org", "is-a-celticsfan.org", "is-a-chef.org", "is-a-geek.org", "is-a-knight.org", "is-a-linux-user.org", "is-a-patsfan.org", "is-a-soxfan.org", "is-found.org", "is-lost.org", "is-saved.org", "is-very-bad.org", "is-very-evil.org", "is-very-good.org", "is-very-nice.org", "is-very-sweet.org", "isa-geek.org", "kicks-ass.org", "misconfused.org", "podzone.org", "readmyblog.org", "selfip.org", "sellsyourhome.org", "servebbs.org", "serveftp.org", "servegame.org", "stuff-4-sale.org", "webhop.org", "better-than.tv", "dyndns.tv", "on-the-web.tv", "worse-than.tv", "is-by.us", "land-4-sale.us", "stuff-4-sale.us", "dyndns.ws", "mypets.ws", "ddnsfree.com", "ddnsgeek.com", "giize.com", "gleeze.com", "kozow.com", "loseyourip.com", "ooguy.com", "theworkpc.com", "casacam.net", "dynu.net", "accesscam.org", "camdvr.org", "freeddns.org", "mywire.org", "webredirect.org", "myddns.rocks", "dynv6.net", "e4.cz", "easypanel.app", "easypanel.host", "*.ewp.live", "twmail.cc", "twmail.net", "twmail.org", "mymailer.com.tw", "url.tw", "at.emf.camp", "rt.ht", "elementor.cloud", "elementor.cool", "en-root.fr", "mytuleap.com", "tuleap-partners.com", "encr.app", "encoreapi.com", "eu.encoway.cloud", "eu.org", "al.eu.org", "asso.eu.org", "at.eu.org", "au.eu.org", "be.eu.org", "bg.eu.org", "ca.eu.org", "cd.eu.org", "ch.eu.org", "cn.eu.org", "cy.eu.org", "cz.eu.org", "de.eu.org", "dk.eu.org", "edu.eu.org", "ee.eu.org", "es.eu.org", "fi.eu.org", "fr.eu.org", "gr.eu.org", "hr.eu.org", "hu.eu.org", "ie.eu.org", "il.eu.org", "in.eu.org", "int.eu.org", "is.eu.org", "it.eu.org", "jp.eu.org", "kr.eu.org", "lt.eu.org", "lu.eu.org", "lv.eu.org", "me.eu.org", "mk.eu.org", "mt.eu.org", "my.eu.org", "net.eu.org", "ng.eu.org", "nl.eu.org", "no.eu.org", "nz.eu.org", "pl.eu.org", "pt.eu.org", "ro.eu.org", "ru.eu.org", "se.eu.org", "si.eu.org", "sk.eu.org", "tr.eu.org", "uk.eu.org", "us.eu.org", "eurodir.ru", "eu-1.evennode.com", "eu-2.evennode.com", "eu-3.evennode.com", "eu-4.evennode.com", "us-1.evennode.com", "us-2.evennode.com", "us-3.evennode.com", "us-4.evennode.com", "relay.evervault.app", "relay.evervault.dev", "expo.app", "staging.expo.app", "onfabrica.com", "ru.net", "adygeya.ru", "bashkiria.ru", "bir.ru", "cbg.ru", "com.ru", "dagestan.ru", "grozny.ru", "kalmykia.ru", "kustanai.ru", "marine.ru", "mordovia.ru", "msk.ru", "mytis.ru", "nalchik.ru", "nov.ru", "pyatigorsk.ru", "spb.ru", "vladikavkaz.ru", "vladimir.ru", "abkhazia.su", "adygeya.su", "aktyubinsk.su", "arkhangelsk.su", "armenia.su", "ashgabad.su", "azerbaijan.su", "balashov.su", "bashkiria.su", "bryansk.su", "bukhara.su", "chimkent.su", "dagestan.su", "east-kazakhstan.su", "exnet.su", "georgia.su", "grozny.su", "ivanovo.su", "jambyl.su", "kalmykia.su", "kaluga.su", "karacol.su", "karaganda.su", "karelia.su", "khakassia.su", "krasnodar.su", "kurgan.su", "kustanai.su", "lenug.su", "mangyshlak.su", "mordovia.su", "msk.su", "murmansk.su", "nalchik.su", "navoi.su", "north-kazakhstan.su", "nov.su", "obninsk.su", "penza.su", "pokrovsk.su", "sochi.su", "spb.su", "tashkent.su", "termez.su", "togliatti.su", "troitsk.su", "tselinograd.su", "tula.su", "tuva.su", "vladikavkaz.su", "vladimir.su", "vologda.su", "channelsdvr.net", "u.channelsdvr.net", "edgecompute.app", "fastly-edge.com", "fastly-terrarium.com", "freetls.fastly.net", "map.fastly.net", "a.prod.fastly.net", "global.prod.fastly.net", "a.ssl.fastly.net", "b.ssl.fastly.net", "global.ssl.fastly.net", "fastlylb.net", "map.fastlylb.net", "*.user.fm", "fastvps-server.com", "fastvps.host", "myfast.host", "fastvps.site", "myfast.space", "conn.uk", "copro.uk", "hosp.uk", "fedorainfracloud.org", "fedorapeople.org", "cloud.fedoraproject.org", "app.os.fedoraproject.org", "app.os.stg.fedoraproject.org", "mydobiss.com", "fh-muenster.io", "filegear.me", "firebaseapp.com", "fldrv.com", "flutterflow.app", "fly.dev", "shw.io", "edgeapp.net", "forgeblocks.com", "id.forgerock.io", "framer.ai", "framer.app", "framercanvas.com", "framer.media", "framer.photos", "framer.website", "framer.wiki", "0e.vc", "freebox-os.com", "freeboxos.com", "fbx-os.fr", "fbxos.fr", "freebox-os.fr", "freeboxos.fr", "freedesktop.org", "freemyip.com", "*.frusky.de", "wien.funkfeuer.at", "daemon.asia", "dix.asia", "mydns.bz", "0am.jp", "0g0.jp", "0j0.jp", "0t0.jp", "mydns.jp", "pgw.jp", "wjg.jp", "keyword-on.net", "live-on.net", "server-on.net", "mydns.tw", "mydns.vc", "*.futurecms.at", "*.ex.futurecms.at", "*.in.futurecms.at", "futurehosting.at", "futuremailing.at", "*.ex.ortsinfo.at", "*.kunden.ortsinfo.at", "*.statics.cloud", "aliases121.com", "campaign.gov.uk", "service.gov.uk", "independent-commission.uk", "independent-inquest.uk", "independent-inquiry.uk", "independent-panel.uk", "independent-review.uk", "public-inquiry.uk", "royal-commission.uk", "gehirn.ne.jp", "usercontent.jp", "gentapps.com", "gentlentapis.com", "lab.ms", "cdn-edges.net", "localcert.net", "localhostcert.net", "gsj.bz", "githubusercontent.com", "githubpreview.dev", "github.io", "gitlab.io", "gitapp.si", "gitpage.si", "glitch.me", "nog.community", "co.ro", "shop.ro", "lolipop.io", "angry.jp", "babyblue.jp", "babymilk.jp", "backdrop.jp", "bambina.jp", "bitter.jp", "blush.jp", "boo.jp", "boy.jp", "boyfriend.jp", "but.jp", "candypop.jp", "capoo.jp", "catfood.jp", "cheap.jp", "chicappa.jp", "chillout.jp", "chips.jp", "chowder.jp", "chu.jp", "ciao.jp", "cocotte.jp", "coolblog.jp", "cranky.jp", "cutegirl.jp", "daa.jp", "deca.jp", "deci.jp", "digick.jp", "egoism.jp", "fakefur.jp", "fem.jp", "flier.jp", "floppy.jp", "fool.jp", "frenchkiss.jp", "girlfriend.jp", "girly.jp", "gloomy.jp", "gonna.jp", "greater.jp", "hacca.jp", "heavy.jp", "her.jp", "hiho.jp", "hippy.jp", "holy.jp", "hungry.jp", "icurus.jp", "itigo.jp", "jellybean.jp", "kikirara.jp", "kill.jp", "kilo.jp", "kuron.jp", "littlestar.jp", "lolipopmc.jp", "lolitapunk.jp", "lomo.jp", "lovepop.jp", "lovesick.jp", "main.jp", "mods.jp", "mond.jp", "mongolian.jp", "moo.jp", "namaste.jp", "nikita.jp", "nobushi.jp", "noor.jp", "oops.jp", "parallel.jp", "parasite.jp", "pecori.jp", "peewee.jp", "penne.jp", "pepper.jp", "perma.jp", "pigboat.jp", "pinoko.jp", "punyu.jp", "pupu.jp", "pussycat.jp", "pya.jp", "raindrop.jp", "readymade.jp", "sadist.jp", "schoolbus.jp", "secret.jp", "staba.jp", "stripper.jp", "sub.jp", "sunnyday.jp", "thick.jp", "tonkotsu.jp", "under.jp", "upper.jp", "velvet.jp", "verse.jp", "versus.jp", "vivian.jp", "watson.jp", "weblike.jp", "whitesnow.jp", "zombie.jp", "heteml.net", "graphic.design", "goip.de", "blogspot.ae", "blogspot.al", "blogspot.am", "*.hosted.app", "*.run.app", "web.app", "blogspot.com.ar", "blogspot.co.at", "blogspot.com.au", "blogspot.ba", "blogspot.be", "blogspot.bg", "blogspot.bj", "blogspot.com.br", "blogspot.com.by", "blogspot.ca", "blogspot.cf", "blogspot.ch", "blogspot.cl", "blogspot.com.co", "*.0emm.com", "appspot.com", "*.r.appspot.com", "blogspot.com", "codespot.com", "googleapis.com", "googlecode.com", "pagespeedmobilizer.com", "withgoogle.com", "withyoutube.com", "blogspot.cv", "blogspot.com.cy", "blogspot.cz", "blogspot.de", "*.gateway.dev", "blogspot.dk", "blogspot.com.ee", "blogspot.com.eg", "blogspot.com.es", "blogspot.fi", "blogspot.fr", "cloud.goog", "translate.goog", "*.usercontent.goog", "blogspot.gr", "blogspot.hk", "blogspot.hr", "blogspot.hu", "blogspot.co.id", "blogspot.ie", "blogspot.co.il", "blogspot.in", "blogspot.is", "blogspot.it", "blogspot.jp", "blogspot.co.ke", "blogspot.kr", "blogspot.li", "blogspot.lt", "blogspot.lu", "blogspot.md", "blogspot.mk", "blogspot.com.mt", "blogspot.mx", "blogspot.my", "cloudfunctions.net", "blogspot.com.ng", "blogspot.nl", "blogspot.no", "blogspot.co.nz", "blogspot.pe", "blogspot.pt", "blogspot.qa", "blogspot.re", "blogspot.ro", "blogspot.rs", "blogspot.ru", "blogspot.se", "blogspot.sg", "blogspot.si", "blogspot.sk", "blogspot.sn", "blogspot.td", "blogspot.com.tr", "blogspot.tw", "blogspot.ug", "blogspot.co.uk", "blogspot.com.uy", "blogspot.vn", "blogspot.co.za", "goupile.fr", "pymnt.uk", "cloudapps.digital", "london.cloudapps.digital", "gov.nl", "grafana-dev.net", "grayjayleagues.com", "g\xFCnstigbestellen.de", "g\xFCnstigliefern.de", "fin.ci", "free.hr", "caa.li", "ua.rs", "conf.se", "h\xE4kkinen.fi", "hrsn.dev", "hashbang.sh", "hasura.app", "hasura-app.io", "hatenablog.com", "hatenadiary.com", "hateblo.jp", "hatenablog.jp", "hatenadiary.jp", "hatenadiary.org", "pages.it.hs-heilbronn.de", "pages-research.it.hs-heilbronn.de", "heiyu.space", "helioho.st", "heliohost.us", "hepforge.org", "herokuapp.com", "herokussl.com", "heyflow.page", "heyflow.site", "ravendb.cloud", "ravendb.community", "development.run", "ravendb.run", "homesklep.pl", "*.kin.one", "*.id.pub", "*.kin.pub", "secaas.hk", "hoplix.shop", "orx.biz", "biz.gl", "biz.ng", "co.biz.ng", "dl.biz.ng", "go.biz.ng", "lg.biz.ng", "on.biz.ng", "col.ng", "firm.ng", "gen.ng", "ltd.ng", "ngo.ng", "plc.ng", "ie.ua", "hostyhosting.io", "hf.space", "static.hf.space", "hypernode.io", "iobb.net", "co.cz", "*.moonscale.io", "moonscale.net", "gr.com", "iki.fi", "ibxos.it", "iliadboxos.it", "smushcdn.com", "wphostedmail.com", "wpmucdn.com", "tempurl.host", "wpmudev.host", "dyn-berlin.de", "in-berlin.de", "in-brb.de", "in-butter.de", "in-dsl.de", "in-vpn.de", "in-dsl.net", "in-vpn.net", "in-dsl.org", "in-vpn.org", "biz.at", "info.at", "info.cx", "ac.leg.br", "al.leg.br", "am.leg.br", "ap.leg.br", "ba.leg.br", "ce.leg.br", "df.leg.br", "es.leg.br", "go.leg.br", "ma.leg.br", "mg.leg.br", "ms.leg.br", "mt.leg.br", "pa.leg.br", "pb.leg.br", "pe.leg.br", "pi.leg.br", "pr.leg.br", "rj.leg.br", "rn.leg.br", "ro.leg.br", "rr.leg.br", "rs.leg.br", "sc.leg.br", "se.leg.br", "sp.leg.br", "to.leg.br", "pixolino.com", "na4u.ru", "apps-1and1.com", "live-website.com", "apps-1and1.net", "websitebuilder.online", "app-ionos.space", "iopsys.se", "*.dweb.link", "ipifony.net", "ir.md", "is-a-good.dev", "is-a.dev", "iservschule.de", "mein-iserv.de", "schulplattform.de", "schulserver.de", "test-iserv.de", "iserv.dev", "mel.cloudlets.com.au", "cloud.interhostsolutions.be", "alp1.ae.flow.ch", "appengine.flow.ch", "es-1.axarnet.cloud", "diadem.cloud", "vip.jelastic.cloud", "jele.cloud", "it1.eur.aruba.jenv-aruba.cloud", "it1.jenv-aruba.cloud", "keliweb.cloud", "cs.keliweb.cloud", "oxa.cloud", "tn.oxa.cloud", "uk.oxa.cloud", "primetel.cloud", "uk.primetel.cloud", "ca.reclaim.cloud", "uk.reclaim.cloud", "us.reclaim.cloud", "ch.trendhosting.cloud", "de.trendhosting.cloud", "jele.club", "dopaas.com", "paas.hosted-by-previder.com", "rag-cloud.hosteur.com", "rag-cloud-ch.hosteur.com", "jcloud.ik-server.com", "jcloud-ver-jpc.ik-server.com", "demo.jelastic.com", "paas.massivegrid.com", "jed.wafaicloud.com", "ryd.wafaicloud.com", "j.scaleforce.com.cy", "jelastic.dogado.eu", "fi.cloudplatform.fi", "demo.datacenter.fi", "paas.datacenter.fi", "jele.host", "mircloud.host", "paas.beebyte.io", "sekd1.beebyteapp.io", "jele.io", "jc.neen.it", "jcloud.kz", "cloudjiffy.net", "fra1-de.cloudjiffy.net", "west1-us.cloudjiffy.net", "jls-sto1.elastx.net", "jls-sto2.elastx.net", "jls-sto3.elastx.net", "fr-1.paas.massivegrid.net", "lon-1.paas.massivegrid.net", "lon-2.paas.massivegrid.net", "ny-1.paas.massivegrid.net", "ny-2.paas.massivegrid.net", "sg-1.paas.massivegrid.net", "jelastic.saveincloud.net", "nordeste-idc.saveincloud.net", "j.scaleforce.net", "sdscloud.pl", "unicloud.pl", "mircloud.ru", "enscaled.sg", "jele.site", "jelastic.team", "orangecloud.tn", "j.layershift.co.uk", "phx.enscaled.us", "mircloud.us", "myjino.ru", "*.hosting.myjino.ru", "*.landing.myjino.ru", "*.spectrum.myjino.ru", "*.vps.myjino.ru", "jotelulu.cloud", "webadorsite.com", "jouwweb.site", "*.cns.joyent.com", "*.triton.zone", "js.org", "kaas.gg", "khplay.nl", "kapsi.fi", "ezproxy.kuleuven.be", "kuleuven.cloud", "keymachine.de", "kinghost.net", "uni5.net", "knightpoint.systems", "koobin.events", "webthings.io", "krellian.net", "oya.to", "git-repos.de", "lcube-server.de", "svn-repos.de", "leadpages.co", "lpages.co", "lpusercontent.com", "lelux.site", "libp2p.direct", "runcontainers.dev", "co.business", "co.education", "co.events", "co.financial", "co.network", "co.place", "co.technology", "linkyard-cloud.ch", "linkyard.cloud", "members.linode.com", "*.nodebalancer.linode.com", "*.linodeobjects.com", "ip.linodeusercontent.com", "we.bs", "filegear-sg.me", "ggff.net", "*.user.localcert.dev", "lodz.pl", "pabianice.pl", "plock.pl", "sieradz.pl", "skierniewice.pl", "zgierz.pl", "loginline.app", "loginline.dev", "loginline.io", "loginline.services", "loginline.site", "lohmus.me", "servers.run", "krasnik.pl", "leczna.pl", "lubartow.pl", "lublin.pl", "poniatowa.pl", "swidnik.pl", "glug.org.uk", "lug.org.uk", "lugs.org.uk", "barsy.bg", "barsy.club", "barsycenter.com", "barsyonline.com", "barsy.de", "barsy.dev", "barsy.eu", "barsy.gr", "barsy.in", "barsy.info", "barsy.io", "barsy.me", "barsy.menu", "barsyonline.menu", "barsy.mobi", "barsy.net", "barsy.online", "barsy.org", "barsy.pro", "barsy.pub", "barsy.ro", "barsy.rs", "barsy.shop", "barsyonline.shop", "barsy.site", "barsy.store", "barsy.support", "barsy.uk", "barsy.co.uk", "barsyonline.co.uk", "*.magentosite.cloud", "hb.cldmail.ru", "matlab.cloud", "modelscape.com", "mwcloudnonprod.com", "polyspace.com", "mayfirst.info", "mayfirst.org", "mazeplay.com", "mcdir.me", "mcdir.ru", "vps.mcdir.ru", "mcpre.ru", "mediatech.by", "mediatech.dev", "hra.health", "medusajs.app", "miniserver.com", "memset.net", "messerli.app", "atmeta.com", "apps.fbsbx.com", "*.cloud.metacentrum.cz", "custom.metacentrum.cz", "flt.cloud.muni.cz", "usr.cloud.muni.cz", "meteorapp.com", "eu.meteorapp.com", "co.pl", "*.azurecontainer.io", "azure-api.net", "azure-mobile.net", "azureedge.net", "azurefd.net", "azurestaticapps.net", "1.azurestaticapps.net", "2.azurestaticapps.net", "3.azurestaticapps.net", "4.azurestaticapps.net", "5.azurestaticapps.net", "6.azurestaticapps.net", "7.azurestaticapps.net", "centralus.azurestaticapps.net", "eastasia.azurestaticapps.net", "eastus2.azurestaticapps.net", "westeurope.azurestaticapps.net", "westus2.azurestaticapps.net", "azurewebsites.net", "cloudapp.net", "trafficmanager.net", "blob.core.windows.net", "servicebus.windows.net", "routingthecloud.com", "sn.mynetname.net", "routingthecloud.net", "routingthecloud.org", "csx.cc", "mydbserver.com", "webspaceconfig.de", "mittwald.info", "mittwaldserver.info", "typo3server.info", "project.space", "modx.dev", "bmoattachments.org", "net.ru", "org.ru", "pp.ru", "hostedpi.com", "caracal.mythic-beasts.com", "customer.mythic-beasts.com", "fentiger.mythic-beasts.com", "lynx.mythic-beasts.com", "ocelot.mythic-beasts.com", "oncilla.mythic-beasts.com", "onza.mythic-beasts.com", "sphinx.mythic-beasts.com", "vs.mythic-beasts.com", "x.mythic-beasts.com", "yali.mythic-beasts.com", "cust.retrosnub.co.uk", "ui.nabu.casa", "cloud.nospamproxy.com", "netfy.app", "netlify.app", "4u.com", "nfshost.com", "ipfs.nftstorage.link", "ngo.us", "ngrok.app", "ngrok-free.app", "ngrok.dev", "ngrok-free.dev", "ngrok.io", "ap.ngrok.io", "au.ngrok.io", "eu.ngrok.io", "in.ngrok.io", "jp.ngrok.io", "sa.ngrok.io", "us.ngrok.io", "ngrok.pizza", "ngrok.pro", "torun.pl", "nh-serv.co.uk", "nimsite.uk", "mmafan.biz", "myftp.biz", "no-ip.biz", "no-ip.ca", "fantasyleague.cc", "gotdns.ch", "3utilities.com", "blogsyte.com", "ciscofreak.com", "damnserver.com", "ddnsking.com", "ditchyourip.com", "dnsiskinky.com", "dynns.com", "geekgalaxy.com", "health-carereform.com", "homesecuritymac.com", "homesecuritypc.com", "myactivedirectory.com", "mysecuritycamera.com", "myvnc.com", "net-freaks.com", "onthewifi.com", "point2this.com", "quicksytes.com", "securitytactics.com", "servebeer.com", "servecounterstrike.com", "serveexchange.com", "serveftp.com", "servegame.com", "servehalflife.com", "servehttp.com", "servehumour.com", "serveirc.com", "servemp3.com", "servep2p.com", "servepics.com", "servequake.com", "servesarcasm.com", "stufftoread.com", "unusualperson.com", "workisboring.com", "dvrcam.info", "ilovecollege.info", "no-ip.info", "brasilia.me", "ddns.me", "dnsfor.me", "hopto.me", "loginto.me", "noip.me", "webhop.me", "bounceme.net", "ddns.net", "eating-organic.net", "mydissent.net", "myeffect.net", "mymediapc.net", "mypsx.net", "mysecuritycamera.net", "nhlfan.net", "no-ip.net", "pgafan.net", "privatizehealthinsurance.net", "redirectme.net", "serveblog.net", "serveminecraft.net", "sytes.net", "cable-modem.org", "collegefan.org", "couchpotatofries.org", "hopto.org", "mlbfan.org", "myftp.org", "mysecuritycamera.org", "nflfan.org", "no-ip.org", "read-books.org", "ufcfan.org", "zapto.org", "no-ip.co.uk", "golffan.us", "noip.us", "pointto.us", "stage.nodeart.io", "*.developer.app", "noop.app", "*.northflank.app", "*.build.run", "*.code.run", "*.database.run", "*.migration.run", "noticeable.news", "notion.site", "dnsking.ch", "mypi.co", "n4t.co", "001www.com", "myiphost.com", "forumz.info", "soundcast.me", "tcp4.me", "dnsup.net", "hicam.net", "now-dns.net", "ownip.net", "vpndns.net", "dynserv.org", "now-dns.org", "x443.pw", "now-dns.top", "ntdll.top", "freeddns.us", "nsupdate.info", "nerdpol.ovh", "nyc.mn", "prvcy.page", "obl.ong", "observablehq.cloud", "static.observableusercontent.com", "omg.lol", "cloudycluster.net", "omniwe.site", "123webseite.at", "123website.be", "simplesite.com.br", "123website.ch", "simplesite.com", "123webseite.de", "123hjemmeside.dk", "123miweb.es", "123kotisivu.fi", "123siteweb.fr", "simplesite.gr", "123homepage.it", "123website.lu", "123website.nl", "123hjemmeside.no", "service.one", "simplesite.pl", "123paginaweb.pt", "123minsida.se", "is-a-fullstack.dev", "is-cool.dev", "is-not-a.dev", "localplayer.dev", "is-local.org", "opensocial.site", "opencraft.hosting", "16-b.it", "32-b.it", "64-b.it", "orsites.com", "operaunite.com", "*.customer-oci.com", "*.oci.customer-oci.com", "*.ocp.customer-oci.com", "*.ocs.customer-oci.com", "*.oraclecloudapps.com", "*.oraclegovcloudapps.com", "*.oraclegovcloudapps.uk", "tech.orange", "can.re", "authgear-staging.com", "authgearapps.com", "skygearapp.com", "outsystemscloud.com", "*.hosting.ovh.net", "*.webpaas.ovh.net", "ownprovider.com", "own.pm", "*.owo.codes", "ox.rs", "oy.lc", "pgfog.com", "pagexl.com", "gotpantheon.com", "pantheonsite.io", "*.paywhirl.com", "*.xmit.co", "xmit.dev", "madethis.site", "srv.us", "gh.srv.us", "gl.srv.us", "lk3.ru", "mypep.link", "perspecta.cloud", "on-web.fr", "*.upsun.app", "upsunapp.com", "ent.platform.sh", "eu.platform.sh", "us.platform.sh", "*.platformsh.site", "*.tst.site", "platter-app.com", "platter-app.dev", "platterp.us", "pley.games", "onporter.run", "co.bn", "postman-echo.com", "pstmn.io", "mock.pstmn.io", "httpbin.org", "prequalifyme.today", "xen.prgmr.com", "priv.at", "protonet.io", "chirurgiens-dentistes-en-france.fr", "byen.site", "pubtls.org", "pythonanywhere.com", "eu.pythonanywhere.com", "qa2.com", "qcx.io", "*.sys.qcx.io", "myqnapcloud.cn", "alpha-myqnapcloud.com", "dev-myqnapcloud.com", "mycloudnas.com", "mynascloud.com", "myqnapcloud.com", "qoto.io", "qualifioapp.com", "ladesk.com", "qbuser.com", "*.quipelements.com", "vapor.cloud", "vaporcloud.io", "rackmaze.com", "rackmaze.net", "cloudsite.builders", "myradweb.net", "servername.us", "web.in", "in.net", "myrdbx.io", "site.rb-hosting.io", "*.on-rancher.cloud", "*.on-k3s.io", "*.on-rio.io", "ravpage.co.il", "readthedocs-hosted.com", "readthedocs.io", "rhcloud.com", "instances.spawn.cc", "onrender.com", "app.render.com", "replit.app", "id.replit.app", "firewalledreplit.co", "id.firewalledreplit.co", "repl.co", "id.repl.co", "replit.dev", "archer.replit.dev", "bones.replit.dev", "canary.replit.dev", "global.replit.dev", "hacker.replit.dev", "id.replit.dev", "janeway.replit.dev", "kim.replit.dev", "kira.replit.dev", "kirk.replit.dev", "odo.replit.dev", "paris.replit.dev", "picard.replit.dev", "pike.replit.dev", "prerelease.replit.dev", "reed.replit.dev", "riker.replit.dev", "sisko.replit.dev", "spock.replit.dev", "staging.replit.dev", "sulu.replit.dev", "tarpit.replit.dev", "teams.replit.dev", "tucker.replit.dev", "wesley.replit.dev", "worf.replit.dev", "repl.run", "resindevice.io", "devices.resinstaging.io", "hzc.io", "adimo.co.uk", "itcouldbewor.se", "aus.basketball", "nz.basketball", "git-pages.rit.edu", "rocky.page", "rub.de", "ruhr-uni-bochum.de", "io.noc.ruhr-uni-bochum.de", "\u0431\u0438\u0437.\u0440\u0443\u0441", "\u043A\u043E\u043C.\u0440\u0443\u0441", "\u043A\u0440\u044B\u043C.\u0440\u0443\u0441", "\u043C\u0438\u0440.\u0440\u0443\u0441", "\u043C\u0441\u043A.\u0440\u0443\u0441", "\u043E\u0440\u0433.\u0440\u0443\u0441", "\u0441\u0430\u043C\u0430\u0440\u0430.\u0440\u0443\u0441", "\u0441\u043E\u0447\u0438.\u0440\u0443\u0441", "\u0441\u043F\u0431.\u0440\u0443\u0441", "\u044F.\u0440\u0443\u0441", "ras.ru", "nyat.app", "180r.com", "dojin.com", "sakuratan.com", "sakuraweb.com", "x0.com", "2-d.jp", "bona.jp", "crap.jp", "daynight.jp", "eek.jp", "flop.jp", "halfmoon.jp", "jeez.jp", "matrix.jp", "mimoza.jp", "ivory.ne.jp", "mail-box.ne.jp", "mints.ne.jp", "mokuren.ne.jp", "opal.ne.jp", "sakura.ne.jp", "sumomo.ne.jp", "topaz.ne.jp", "netgamers.jp", "nyanta.jp", "o0o0.jp", "rdy.jp", "rgr.jp", "rulez.jp", "s3.isk01.sakurastorage.jp", "s3.isk02.sakurastorage.jp", "saloon.jp", "sblo.jp", "skr.jp", "tank.jp", "uh-oh.jp", "undo.jp", "rs.webaccel.jp", "user.webaccel.jp", "websozai.jp", "xii.jp", "squares.net", "jpn.org", "kirara.st", "x0.to", "from.tv", "sakura.tv", "*.builder.code.com", "*.dev-builder.code.com", "*.stg-builder.code.com", "*.001.test.code-builder-stg.platform.salesforce.com", "*.d.crm.dev", "*.w.crm.dev", "*.wa.crm.dev", "*.wb.crm.dev", "*.wc.crm.dev", "*.wd.crm.dev", "*.we.crm.dev", "*.wf.crm.dev", "sandcats.io", "logoip.com", "logoip.de", "fr-par-1.baremetal.scw.cloud", "fr-par-2.baremetal.scw.cloud", "nl-ams-1.baremetal.scw.cloud", "cockpit.fr-par.scw.cloud", "fnc.fr-par.scw.cloud", "functions.fnc.fr-par.scw.cloud", "k8s.fr-par.scw.cloud", "nodes.k8s.fr-par.scw.cloud", "s3.fr-par.scw.cloud", "s3-website.fr-par.scw.cloud", "whm.fr-par.scw.cloud", "priv.instances.scw.cloud", "pub.instances.scw.cloud", "k8s.scw.cloud", "cockpit.nl-ams.scw.cloud", "k8s.nl-ams.scw.cloud", "nodes.k8s.nl-ams.scw.cloud", "s3.nl-ams.scw.cloud", "s3-website.nl-ams.scw.cloud", "whm.nl-ams.scw.cloud", "cockpit.pl-waw.scw.cloud", "k8s.pl-waw.scw.cloud", "nodes.k8s.pl-waw.scw.cloud", "s3.pl-waw.scw.cloud", "s3-website.pl-waw.scw.cloud", "scalebook.scw.cloud", "smartlabeling.scw.cloud", "dedibox.fr", "schokokeks.net", "gov.scot", "service.gov.scot", "scrysec.com", "client.scrypted.io", "firewall-gateway.com", "firewall-gateway.de", "my-gateway.de", "my-router.de", "spdns.de", "spdns.eu", "firewall-gateway.net", "my-firewall.org", "myfirewall.org", "spdns.org", "seidat.net", "sellfy.store", "minisite.ms", "senseering.net", "servebolt.cloud", "biz.ua", "co.ua", "pp.ua", "as.sh.cn", "sheezy.games", "shiftedit.io", "myshopblocks.com", "myshopify.com", "shopitsite.com", "shopware.shop", "shopware.store", "mo-siemens.io", "1kapp.com", "appchizi.com", "applinzi.com", "sinaapp.com", "vipsinaapp.com", "siteleaf.net", "small-web.org", "aeroport.fr", "avocat.fr", "chambagri.fr", "chirurgiens-dentistes.fr", "experts-comptables.fr", "medecin.fr", "notaires.fr", "pharmacien.fr", "port.fr", "veterinaire.fr", "vp4.me", "*.snowflake.app", "*.privatelink.snowflake.app", "streamlit.app", "streamlitapp.com", "try-snowplow.com", "mafelo.net", "playstation-cloud.com", "srht.site", "apps.lair.io", "*.stolos.io", "spacekit.io", "ind.mom", "customer.speedpartner.de", "myspreadshop.at", "myspreadshop.com.au", "myspreadshop.be", "myspreadshop.ca", "myspreadshop.ch", "myspreadshop.com", "myspreadshop.de", "myspreadshop.dk", "myspreadshop.es", "myspreadshop.fi", "myspreadshop.fr", "myspreadshop.ie", "myspreadshop.it", "myspreadshop.net", "myspreadshop.nl", "myspreadshop.no", "myspreadshop.pl", "myspreadshop.se", "myspreadshop.co.uk", "w-corp-staticblitz.com", "w-credentialless-staticblitz.com", "w-staticblitz.com", "stackhero-network.com", "runs.onstackit.cloud", "stackit.gg", "stackit.rocks", "stackit.run", "stackit.zone", "musician.io", "novecore.site", "api.stdlib.com", "feedback.ac", "forms.ac", "assessments.cx", "calculators.cx", "funnels.cx", "paynow.cx", "quizzes.cx", "researched.cx", "tests.cx", "surveys.so", "storebase.store", "storipress.app", "storj.farm", "strapiapp.com", "media.strapiapp.com", "vps-host.net", "atl.jelastic.vps-host.net", "njs.jelastic.vps-host.net", "ric.jelastic.vps-host.net", "streak-link.com", "streaklinks.com", "streakusercontent.com", "soc.srcf.net", "user.srcf.net", "utwente.io", "temp-dns.com", "supabase.co", "supabase.in", "supabase.net", "syncloud.it", "dscloud.biz", "direct.quickconnect.cn", "dsmynas.com", "familyds.com", "diskstation.me", "dscloud.me", "i234.me", "myds.me", "synology.me", "dscloud.mobi", "dsmynas.net", "familyds.net", "dsmynas.org", "familyds.org", "direct.quickconnect.to", "vpnplus.to", "mytabit.com", "mytabit.co.il", "tabitorder.co.il", "taifun-dns.de", "ts.net", "*.c.ts.net", "gda.pl", "gdansk.pl", "gdynia.pl", "med.pl", "sopot.pl", "taveusercontent.com", "p.tawk.email", "p.tawkto.email", "site.tb-hosting.com", "edugit.io", "s3.teckids.org", "telebit.app", "telebit.io", "*.telebit.xyz", "*.firenet.ch", "*.svc.firenet.ch", "reservd.com", "thingdustdata.com", "cust.dev.thingdust.io", "reservd.dev.thingdust.io", "cust.disrec.thingdust.io", "reservd.disrec.thingdust.io", "cust.prod.thingdust.io", "cust.testing.thingdust.io", "reservd.testing.thingdust.io", "tickets.io", "arvo.network", "azimuth.network", "tlon.network", "torproject.net", "pages.torproject.net", "townnews-staging.com", "12hp.at", "2ix.at", "4lima.at", "lima-city.at", "12hp.ch", "2ix.ch", "4lima.ch", "lima-city.ch", "trafficplex.cloud", "de.cool", "12hp.de", "2ix.de", "4lima.de", "lima-city.de", "1337.pictures", "clan.rip", "lima-city.rocks", "webspace.rocks", "lima.zone", "*.transurl.be", "*.transurl.eu", "site.transip.me", "*.transurl.nl", "tuxfamily.org", "dd-dns.de", "dray-dns.de", "draydns.de", "dyn-vpn.de", "dynvpn.de", "mein-vigor.de", "my-vigor.de", "my-wan.de", "syno-ds.de", "synology-diskstation.de", "synology-ds.de", "diskstation.eu", "diskstation.org", "typedream.app", "pro.typeform.com", "*.uberspace.de", "uber.space", "hk.com", "inc.hk", "ltd.hk", "hk.org", "it.com", "unison-services.cloud", "virtual-user.de", "virtualuser.de", "name.pm", "sch.tf", "biz.wf", "sch.wf", "org.yt", "rs.ba", "bielsko.pl", "upli.io", "urown.cloud", "dnsupdate.info", "us.org", "v.ua", "express.val.run", "web.val.run", "vercel.app", "v0.build", "vercel.dev", "vusercontent.net", "now.sh", "2038.io", "router.management", "v-info.info", "voorloper.cloud", "*.vultrobjects.com", "wafflecell.com", "webflow.io", "webflowtest.io", "*.webhare.dev", "bookonline.app", "hotelwithflight.com", "reserve-online.com", "reserve-online.net", "cprapid.com", "pleskns.com", "wp2.host", "pdns.page", "plesk.page", "wpsquared.site", "*.wadl.top", "remotewd.com", "box.ca", "pages.wiardweb.com", "toolforge.org", "wmcloud.org", "wmflabs.org", "wdh.app", "panel.gg", "daemon.panel.gg", "wixsite.com", "wixstudio.com", "editorx.io", "wixstudio.io", "wix.run", "messwithdns.com", "woltlab-demo.com", "myforum.community", "community-pro.de", "diskussionsbereich.de", "community-pro.net", "meinforum.net", "affinitylottery.org.uk", "raffleentry.org.uk", "weeklylottery.org.uk", "wpenginepowered.com", "js.wpenginepowered.com", "half.host", "xnbay.com", "u2.xnbay.com", "u2-local.xnbay.com", "cistron.nl", "demon.nl", "xs4all.space", "yandexcloud.net", "storage.yandexcloud.net", "website.yandexcloud.net", "official.academy", "yolasite.com", "yombo.me", "ynh.fr", "nohost.me", "noho.st", "za.net", "za.org", "zap.cloud", "zeabur.app", "bss.design", "basicserver.io", "virtualserver.io", "enterprisecloud.nu"];
    var Z = Y.reduce((e, s) => {
      const c = s.replace(/^(\*\.|\!)/, ""), o = A.toASCII(c), t = s.charAt(0);
      if (e.has(o)) throw new Error(`Multiple rules found for ${s} (${o})`);
      return e.set(o, { rule: s, suffix: c, punySuffix: o, wildcard: t === "*", exception: t === "!" }), e;
    }, /* @__PURE__ */ new Map());
    var aa = (e) => {
      const c = A.toASCII(e).split(".");
      for (let o = 0; o < c.length; o++) {
        const t = c.slice(o).join("."), d = Z.get(t);
        if (d) return d;
      }
      return null;
    };
    var H = { DOMAIN_TOO_SHORT: "Domain name too short.", DOMAIN_TOO_LONG: "Domain name too long. It should be no more than 255 chars.", LABEL_STARTS_WITH_DASH: "Domain name label can not start with a dash.", LABEL_ENDS_WITH_DASH: "Domain name label can not end with a dash.", LABEL_TOO_LONG: "Domain name label should be at most 63 chars long.", LABEL_TOO_SHORT: "Domain name label should be at least 1 character long.", LABEL_INVALID_CHARS: "Domain name label can only contain alphanumeric characters or dashes." };
    var oa = (e) => {
      const s = A.toASCII(e);
      if (s.length < 1) return "DOMAIN_TOO_SHORT";
      if (s.length > 255) return "DOMAIN_TOO_LONG";
      const c = s.split(".");
      let o;
      for (let t = 0; t < c.length; ++t) {
        if (o = c[t], !o.length) return "LABEL_TOO_SHORT";
        if (o.length > 63) return "LABEL_TOO_LONG";
        if (o.charAt(0) === "-") return "LABEL_STARTS_WITH_DASH";
        if (o.charAt(o.length - 1) === "-") return "LABEL_ENDS_WITH_DASH";
        if (!/^[a-z0-9\-_]+$/.test(o)) return "LABEL_INVALID_CHARS";
      }
    };
    var _ = (e) => {
      if (typeof e != "string") throw new TypeError("Domain name must be a string.");
      let s = e.slice(0).toLowerCase();
      s.charAt(s.length - 1) === "." && (s = s.slice(0, s.length - 1));
      const c = oa(s);
      if (c) return { input: e, error: { message: H[c], code: c } };
      const o = { input: e, tld: null, sld: null, domain: null, subdomain: null, listed: false }, t = s.split(".");
      if (t[t.length - 1] === "local") return o;
      const d = () => (/xn--/.test(s) && (o.domain && (o.domain = A.toASCII(o.domain)), o.subdomain && (o.subdomain = A.toASCII(o.subdomain))), o), z = aa(s);
      if (!z) return t.length < 2 ? o : (o.tld = t.pop(), o.sld = t.pop(), o.domain = [o.sld, o.tld].join("."), t.length && (o.subdomain = t.pop()), d());
      o.listed = true;
      const y = z.suffix.split("."), g = t.slice(0, t.length - y.length);
      return z.exception && g.push(y.shift()), o.tld = y.join("."), !g.length || (z.wildcard && (y.unshift(g.pop()), o.tld = y.join(".")), !g.length) || (o.sld = g.pop(), o.domain = [o.sld, o.tld].join("."), g.length && (o.subdomain = g.join("."))), d();
    };
    var N = (e) => e && _(e).domain || null;
    var R = (e) => {
      const s = _(e);
      return !!(s.domain && s.listed);
    };
    var sa = { parse: _, get: N, isValid: R };
    exports.default = sa;
    exports.errorCodes = H;
    exports.get = N;
    exports.isValid = R;
    exports.parse = _;
  }
});

// node_modules/tough-cookie/lib/pubsuffix-psl.js
var require_pubsuffix_psl = __commonJS({
  "node_modules/tough-cookie/lib/pubsuffix-psl.js"(exports) {
    "use strict";
    var psl = require_psl();
    var SPECIAL_USE_DOMAINS = [
      "local",
      "example",
      "invalid",
      "localhost",
      "test"
    ];
    var SPECIAL_TREATMENT_DOMAINS = ["localhost", "invalid"];
    function getPublicSuffix(domain, options = {}) {
      const domainParts = domain.split(".");
      const topLevelDomain = domainParts[domainParts.length - 1];
      const allowSpecialUseDomain = !!options.allowSpecialUseDomain;
      const ignoreError = !!options.ignoreError;
      if (allowSpecialUseDomain && SPECIAL_USE_DOMAINS.includes(topLevelDomain)) {
        if (domainParts.length > 1) {
          const secondLevelDomain = domainParts[domainParts.length - 2];
          return `${secondLevelDomain}.${topLevelDomain}`;
        } else if (SPECIAL_TREATMENT_DOMAINS.includes(topLevelDomain)) {
          return `${topLevelDomain}`;
        }
      }
      if (!ignoreError && SPECIAL_USE_DOMAINS.includes(topLevelDomain)) {
        throw new Error(
          `Cookie has domain set to the public suffix "${topLevelDomain}" which is a special use domain. To allow this, configure your CookieJar with {allowSpecialUseDomain:true, rejectPublicSuffixes: false}.`
        );
      }
      return psl.get(domain);
    }
    exports.getPublicSuffix = getPublicSuffix;
  }
});

// node_modules/tough-cookie/lib/store.js
var require_store = __commonJS({
  "node_modules/tough-cookie/lib/store.js"(exports) {
    "use strict";
    var Store = class {
      constructor() {
        this.synchronous = false;
      }
      findCookie(domain, path, key, cb) {
        throw new Error("findCookie is not implemented");
      }
      findCookies(domain, path, allowSpecialUseDomain, cb) {
        throw new Error("findCookies is not implemented");
      }
      putCookie(cookie, cb) {
        throw new Error("putCookie is not implemented");
      }
      updateCookie(oldCookie, newCookie, cb) {
        throw new Error("updateCookie is not implemented");
      }
      removeCookie(domain, path, key, cb) {
        throw new Error("removeCookie is not implemented");
      }
      removeCookies(domain, path, cb) {
        throw new Error("removeCookies is not implemented");
      }
      removeAllCookies(cb) {
        throw new Error("removeAllCookies is not implemented");
      }
      getAllCookies(cb) {
        throw new Error(
          "getAllCookies is not implemented (therefore jar cannot be serialized)"
        );
      }
    };
    exports.Store = Store;
  }
});

// node_modules/universalify/index.js
var require_universalify = __commonJS({
  "node_modules/universalify/index.js"(exports) {
    "use strict";
    exports.fromCallback = function(fn) {
      return Object.defineProperty(function() {
        if (typeof arguments[arguments.length - 1] === "function") fn.apply(this, arguments);
        else {
          return new Promise((resolve, reject) => {
            arguments[arguments.length] = (err, res) => {
              if (err) return reject(err);
              resolve(res);
            };
            arguments.length++;
            fn.apply(this, arguments);
          });
        }
      }, "name", { value: fn.name });
    };
    exports.fromPromise = function(fn) {
      return Object.defineProperty(function() {
        const cb = arguments[arguments.length - 1];
        if (typeof cb !== "function") return fn.apply(this, arguments);
        else {
          delete arguments[arguments.length - 1];
          arguments.length--;
          fn.apply(this, arguments).then((r) => cb(null, r), cb);
        }
      }, "name", { value: fn.name });
    };
  }
});

// node_modules/tough-cookie/lib/permuteDomain.js
var require_permuteDomain = __commonJS({
  "node_modules/tough-cookie/lib/permuteDomain.js"(exports) {
    "use strict";
    var pubsuffix = require_pubsuffix_psl();
    function permuteDomain(domain, allowSpecialUseDomain) {
      const pubSuf = pubsuffix.getPublicSuffix(domain, {
        allowSpecialUseDomain
      });
      if (!pubSuf) {
        return null;
      }
      if (pubSuf == domain) {
        return [domain];
      }
      if (domain.slice(-1) == ".") {
        domain = domain.slice(0, -1);
      }
      const prefix = domain.slice(0, -(pubSuf.length + 1));
      const parts = prefix.split(".").reverse();
      let cur = pubSuf;
      const permutations = [cur];
      while (parts.length) {
        cur = `${parts.shift()}.${cur}`;
        permutations.push(cur);
      }
      return permutations;
    }
    exports.permuteDomain = permuteDomain;
  }
});

// node_modules/tough-cookie/lib/pathMatch.js
var require_pathMatch = __commonJS({
  "node_modules/tough-cookie/lib/pathMatch.js"(exports) {
    "use strict";
    function pathMatch(reqPath, cookiePath) {
      if (cookiePath === reqPath) {
        return true;
      }
      const idx = reqPath.indexOf(cookiePath);
      if (idx === 0) {
        if (cookiePath.substr(-1) === "/") {
          return true;
        }
        if (reqPath.substr(cookiePath.length, 1) === "/") {
          return true;
        }
      }
      return false;
    }
    exports.pathMatch = pathMatch;
  }
});

// node_modules/tough-cookie/lib/utilHelper.js
var require_utilHelper = __commonJS({
  "node_modules/tough-cookie/lib/utilHelper.js"(exports) {
    function requireUtil() {
      try {
        return __require("util");
      } catch (e) {
        return null;
      }
    }
    function lookupCustomInspectSymbol() {
      return /* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom");
    }
    function tryReadingCustomSymbolFromUtilInspect(options) {
      const _requireUtil = options.requireUtil || requireUtil;
      const util = _requireUtil();
      return util ? util.inspect.custom : null;
    }
    exports.getUtilInspect = function getUtilInspect(fallback, options = {}) {
      const _requireUtil = options.requireUtil || requireUtil;
      const util = _requireUtil();
      return function inspect(value, showHidden, depth) {
        return util ? util.inspect(value, showHidden, depth) : fallback(value);
      };
    };
    exports.getCustomInspectSymbol = function getCustomInspectSymbol(options = {}) {
      const _lookupCustomInspectSymbol = options.lookupCustomInspectSymbol || lookupCustomInspectSymbol;
      return _lookupCustomInspectSymbol() || tryReadingCustomSymbolFromUtilInspect(options);
    };
  }
});

// node_modules/tough-cookie/lib/memstore.js
var require_memstore = __commonJS({
  "node_modules/tough-cookie/lib/memstore.js"(exports) {
    "use strict";
    var { fromCallback } = require_universalify();
    var Store = require_store().Store;
    var permuteDomain = require_permuteDomain().permuteDomain;
    var pathMatch = require_pathMatch().pathMatch;
    var { getCustomInspectSymbol, getUtilInspect } = require_utilHelper();
    var MemoryCookieStore = class extends Store {
      constructor() {
        super();
        this.synchronous = true;
        this.idx = /* @__PURE__ */ Object.create(null);
        const customInspectSymbol = getCustomInspectSymbol();
        if (customInspectSymbol) {
          this[customInspectSymbol] = this.inspect;
        }
      }
      inspect() {
        const util = { inspect: getUtilInspect(inspectFallback) };
        return `{ idx: ${util.inspect(this.idx, false, 2)} }`;
      }
      findCookie(domain, path, key, cb) {
        if (!this.idx[domain]) {
          return cb(null, void 0);
        }
        if (!this.idx[domain][path]) {
          return cb(null, void 0);
        }
        return cb(null, this.idx[domain][path][key] || null);
      }
      findCookies(domain, path, allowSpecialUseDomain, cb) {
        const results = [];
        if (typeof allowSpecialUseDomain === "function") {
          cb = allowSpecialUseDomain;
          allowSpecialUseDomain = true;
        }
        if (!domain) {
          return cb(null, []);
        }
        let pathMatcher;
        if (!path) {
          pathMatcher = function matchAll(domainIndex) {
            for (const curPath in domainIndex) {
              const pathIndex = domainIndex[curPath];
              for (const key in pathIndex) {
                results.push(pathIndex[key]);
              }
            }
          };
        } else {
          pathMatcher = function matchRFC(domainIndex) {
            Object.keys(domainIndex).forEach((cookiePath) => {
              if (pathMatch(path, cookiePath)) {
                const pathIndex = domainIndex[cookiePath];
                for (const key in pathIndex) {
                  results.push(pathIndex[key]);
                }
              }
            });
          };
        }
        const domains = permuteDomain(domain, allowSpecialUseDomain) || [domain];
        const idx = this.idx;
        domains.forEach((curDomain) => {
          const domainIndex = idx[curDomain];
          if (!domainIndex) {
            return;
          }
          pathMatcher(domainIndex);
        });
        cb(null, results);
      }
      putCookie(cookie, cb) {
        if (!this.idx[cookie.domain]) {
          this.idx[cookie.domain] = /* @__PURE__ */ Object.create(null);
        }
        if (!this.idx[cookie.domain][cookie.path]) {
          this.idx[cookie.domain][cookie.path] = /* @__PURE__ */ Object.create(null);
        }
        this.idx[cookie.domain][cookie.path][cookie.key] = cookie;
        cb(null);
      }
      updateCookie(oldCookie, newCookie, cb) {
        this.putCookie(newCookie, cb);
      }
      removeCookie(domain, path, key, cb) {
        if (this.idx[domain] && this.idx[domain][path] && this.idx[domain][path][key]) {
          delete this.idx[domain][path][key];
        }
        cb(null);
      }
      removeCookies(domain, path, cb) {
        if (this.idx[domain]) {
          if (path) {
            delete this.idx[domain][path];
          } else {
            delete this.idx[domain];
          }
        }
        return cb(null);
      }
      removeAllCookies(cb) {
        this.idx = /* @__PURE__ */ Object.create(null);
        return cb(null);
      }
      getAllCookies(cb) {
        const cookies = [];
        const idx = this.idx;
        const domains = Object.keys(idx);
        domains.forEach((domain) => {
          const paths = Object.keys(idx[domain]);
          paths.forEach((path) => {
            const keys = Object.keys(idx[domain][path]);
            keys.forEach((key) => {
              if (key !== null) {
                cookies.push(idx[domain][path][key]);
              }
            });
          });
        });
        cookies.sort((a, b) => {
          return (a.creationIndex || 0) - (b.creationIndex || 0);
        });
        cb(null, cookies);
      }
    };
    [
      "findCookie",
      "findCookies",
      "putCookie",
      "updateCookie",
      "removeCookie",
      "removeCookies",
      "removeAllCookies",
      "getAllCookies"
    ].forEach((name) => {
      MemoryCookieStore.prototype[name] = fromCallback(
        MemoryCookieStore.prototype[name]
      );
    });
    exports.MemoryCookieStore = MemoryCookieStore;
    function inspectFallback(val) {
      const domains = Object.keys(val);
      if (domains.length === 0) {
        return "[Object: null prototype] {}";
      }
      let result = "[Object: null prototype] {\n";
      Object.keys(val).forEach((domain, i) => {
        result += formatDomain(domain, val[domain]);
        if (i < domains.length - 1) {
          result += ",";
        }
        result += "\n";
      });
      result += "}";
      return result;
    }
    function formatDomain(domainName, domainValue) {
      const indent = "  ";
      let result = `${indent}'${domainName}': [Object: null prototype] {
`;
      Object.keys(domainValue).forEach((path, i, paths) => {
        result += formatPath(path, domainValue[path]);
        if (i < paths.length - 1) {
          result += ",";
        }
        result += "\n";
      });
      result += `${indent}}`;
      return result;
    }
    function formatPath(pathName, pathValue) {
      const indent = "    ";
      let result = `${indent}'${pathName}': [Object: null prototype] {
`;
      Object.keys(pathValue).forEach((cookieName, i, cookieNames) => {
        const cookie = pathValue[cookieName];
        result += `      ${cookieName}: ${cookie.inspect()}`;
        if (i < cookieNames.length - 1) {
          result += ",";
        }
        result += "\n";
      });
      result += `${indent}}`;
      return result;
    }
    exports.inspectFallback = inspectFallback;
  }
});

// node_modules/tough-cookie/lib/validators.js
var require_validators = __commonJS({
  "node_modules/tough-cookie/lib/validators.js"(exports) {
    "use strict";
    var toString = Object.prototype.toString;
    function isFunction(data) {
      return typeof data === "function";
    }
    function isNonEmptyString(data) {
      return isString(data) && data !== "";
    }
    function isDate(data) {
      return isInstanceStrict(data, Date) && isInteger(data.getTime());
    }
    function isEmptyString(data) {
      return data === "" || data instanceof String && data.toString() === "";
    }
    function isString(data) {
      return typeof data === "string" || data instanceof String;
    }
    function isObject(data) {
      return toString.call(data) === "[object Object]";
    }
    function isInstanceStrict(data, prototype) {
      try {
        return data instanceof prototype;
      } catch (error) {
        return false;
      }
    }
    function isUrlStringOrObject(data) {
      return isNonEmptyString(data) || isObject(data) && "hostname" in data && "pathname" in data && "protocol" in data || isInstanceStrict(data, URL);
    }
    function isInteger(data) {
      return typeof data === "number" && data % 1 === 0;
    }
    function validate(bool, cb, options) {
      if (!isFunction(cb)) {
        options = cb;
        cb = null;
      }
      if (!isObject(options)) options = { Error: "Failed Check" };
      if (!bool) {
        if (cb) {
          cb(new ParameterError(options));
        } else {
          throw new ParameterError(options);
        }
      }
    }
    var ParameterError = class extends Error {
      constructor(...params) {
        super(...params);
      }
    };
    exports.ParameterError = ParameterError;
    exports.isFunction = isFunction;
    exports.isNonEmptyString = isNonEmptyString;
    exports.isDate = isDate;
    exports.isEmptyString = isEmptyString;
    exports.isString = isString;
    exports.isObject = isObject;
    exports.isUrlStringOrObject = isUrlStringOrObject;
    exports.validate = validate;
  }
});

// node_modules/tough-cookie/lib/version.js
var require_version = __commonJS({
  "node_modules/tough-cookie/lib/version.js"(exports, module) {
    module.exports = "4.1.4";
  }
});

// node_modules/tough-cookie/lib/cookie.js
var require_cookie = __commonJS({
  "node_modules/tough-cookie/lib/cookie.js"(exports) {
    "use strict";
    var punycode = require_punycode();
    var urlParse = require_url_parse();
    var pubsuffix = require_pubsuffix_psl();
    var Store = require_store().Store;
    var MemoryCookieStore = require_memstore().MemoryCookieStore;
    var pathMatch = require_pathMatch().pathMatch;
    var validators = require_validators();
    var VERSION = require_version();
    var { fromCallback } = require_universalify();
    var { getCustomInspectSymbol } = require_utilHelper();
    var COOKIE_OCTETS = /^[\x21\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E]+$/;
    var CONTROL_CHARS = /[\x00-\x1F]/;
    var TERMINATORS = ["\n", "\r", "\0"];
    var PATH_VALUE = /[\x20-\x3A\x3C-\x7E]+/;
    var DATE_DELIM = /[\x09\x20-\x2F\x3B-\x40\x5B-\x60\x7B-\x7E]/;
    var MONTH_TO_NUM = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11
    };
    var MAX_TIME = 2147483647e3;
    var MIN_TIME = 0;
    var SAME_SITE_CONTEXT_VAL_ERR = 'Invalid sameSiteContext option for getCookies(); expected one of "strict", "lax", or "none"';
    function checkSameSiteContext(value) {
      validators.validate(validators.isNonEmptyString(value), value);
      const context = String(value).toLowerCase();
      if (context === "none" || context === "lax" || context === "strict") {
        return context;
      } else {
        return null;
      }
    }
    var PrefixSecurityEnum = Object.freeze({
      SILENT: "silent",
      STRICT: "strict",
      DISABLED: "unsafe-disabled"
    });
    var IP_REGEX_LOWERCASE = /(?:^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$)|(?:^(?:(?:[a-f\d]{1,4}:){7}(?:[a-f\d]{1,4}|:)|(?:[a-f\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|:[a-f\d]{1,4}|:)|(?:[a-f\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-f\d]{1,4}){1,2}|:)|(?:[a-f\d]{1,4}:){4}(?:(?::[a-f\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-f\d]{1,4}){1,3}|:)|(?:[a-f\d]{1,4}:){3}(?:(?::[a-f\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-f\d]{1,4}){1,4}|:)|(?:[a-f\d]{1,4}:){2}(?:(?::[a-f\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-f\d]{1,4}){1,5}|:)|(?:[a-f\d]{1,4}:){1}(?:(?::[a-f\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-f\d]{1,4}){1,6}|:)|(?::(?:(?::[a-f\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-f\d]{1,4}){1,7}|:)))$)/;
    var IP_V6_REGEX = `
\\[?(?:
(?:[a-fA-F\\d]{1,4}:){7}(?:[a-fA-F\\d]{1,4}|:)|
(?:[a-fA-F\\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|:[a-fA-F\\d]{1,4}|:)|
(?:[a-fA-F\\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|(?::[a-fA-F\\d]{1,4}){1,2}|:)|
(?:[a-fA-F\\d]{1,4}:){4}(?:(?::[a-fA-F\\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|(?::[a-fA-F\\d]{1,4}){1,3}|:)|
(?:[a-fA-F\\d]{1,4}:){3}(?:(?::[a-fA-F\\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|(?::[a-fA-F\\d]{1,4}){1,4}|:)|
(?:[a-fA-F\\d]{1,4}:){2}(?:(?::[a-fA-F\\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|(?::[a-fA-F\\d]{1,4}){1,5}|:)|
(?:[a-fA-F\\d]{1,4}:){1}(?:(?::[a-fA-F\\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|(?::[a-fA-F\\d]{1,4}){1,6}|:)|
(?::(?:(?::[a-fA-F\\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}|(?::[a-fA-F\\d]{1,4}){1,7}|:))
)(?:%[0-9a-zA-Z]{1,})?\\]?
`.replace(/\s*\/\/.*$/gm, "").replace(/\n/g, "").trim();
    var IP_V6_REGEX_OBJECT = new RegExp(`^${IP_V6_REGEX}$`);
    function parseDigits(token, minDigits, maxDigits, trailingOK) {
      let count = 0;
      while (count < token.length) {
        const c = token.charCodeAt(count);
        if (c <= 47 || c >= 58) {
          break;
        }
        count++;
      }
      if (count < minDigits || count > maxDigits) {
        return null;
      }
      if (!trailingOK && count != token.length) {
        return null;
      }
      return parseInt(token.substr(0, count), 10);
    }
    function parseTime(token) {
      const parts = token.split(":");
      const result = [0, 0, 0];
      if (parts.length !== 3) {
        return null;
      }
      for (let i = 0; i < 3; i++) {
        const trailingOK = i == 2;
        const num = parseDigits(parts[i], 1, 2, trailingOK);
        if (num === null) {
          return null;
        }
        result[i] = num;
      }
      return result;
    }
    function parseMonth(token) {
      token = String(token).substr(0, 3).toLowerCase();
      const num = MONTH_TO_NUM[token];
      return num >= 0 ? num : null;
    }
    function parseDate(str) {
      if (!str) {
        return;
      }
      const tokens = str.split(DATE_DELIM);
      if (!tokens) {
        return;
      }
      let hour = null;
      let minute = null;
      let second = null;
      let dayOfMonth = null;
      let month = null;
      let year = null;
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i].trim();
        if (!token.length) {
          continue;
        }
        let result;
        if (second === null) {
          result = parseTime(token);
          if (result) {
            hour = result[0];
            minute = result[1];
            second = result[2];
            continue;
          }
        }
        if (dayOfMonth === null) {
          result = parseDigits(token, 1, 2, true);
          if (result !== null) {
            dayOfMonth = result;
            continue;
          }
        }
        if (month === null) {
          result = parseMonth(token);
          if (result !== null) {
            month = result;
            continue;
          }
        }
        if (year === null) {
          result = parseDigits(token, 2, 4, true);
          if (result !== null) {
            year = result;
            if (year >= 70 && year <= 99) {
              year += 1900;
            } else if (year >= 0 && year <= 69) {
              year += 2e3;
            }
          }
        }
      }
      if (dayOfMonth === null || month === null || year === null || second === null || dayOfMonth < 1 || dayOfMonth > 31 || year < 1601 || hour > 23 || minute > 59 || second > 59) {
        return;
      }
      return new Date(Date.UTC(year, month, dayOfMonth, hour, minute, second));
    }
    function formatDate(date) {
      validators.validate(validators.isDate(date), date);
      return date.toUTCString();
    }
    function canonicalDomain(str) {
      if (str == null) {
        return null;
      }
      str = str.trim().replace(/^\./, "");
      if (IP_V6_REGEX_OBJECT.test(str)) {
        str = str.replace("[", "").replace("]", "");
      }
      if (punycode && /[^\u0001-\u007f]/.test(str)) {
        str = punycode.toASCII(str);
      }
      return str.toLowerCase();
    }
    function domainMatch(str, domStr, canonicalize) {
      if (str == null || domStr == null) {
        return null;
      }
      if (canonicalize !== false) {
        str = canonicalDomain(str);
        domStr = canonicalDomain(domStr);
      }
      if (str == domStr) {
        return true;
      }
      const idx = str.lastIndexOf(domStr);
      if (idx <= 0) {
        return false;
      }
      if (str.length !== domStr.length + idx) {
        return false;
      }
      if (str.substr(idx - 1, 1) !== ".") {
        return false;
      }
      if (IP_REGEX_LOWERCASE.test(str)) {
        return false;
      }
      return true;
    }
    function defaultPath(path) {
      if (!path || path.substr(0, 1) !== "/") {
        return "/";
      }
      if (path === "/") {
        return path;
      }
      const rightSlash = path.lastIndexOf("/");
      if (rightSlash === 0) {
        return "/";
      }
      return path.slice(0, rightSlash);
    }
    function trimTerminator(str) {
      if (validators.isEmptyString(str)) return str;
      for (let t = 0; t < TERMINATORS.length; t++) {
        const terminatorIdx = str.indexOf(TERMINATORS[t]);
        if (terminatorIdx !== -1) {
          str = str.substr(0, terminatorIdx);
        }
      }
      return str;
    }
    function parseCookiePair(cookiePair, looseMode) {
      cookiePair = trimTerminator(cookiePair);
      validators.validate(validators.isString(cookiePair), cookiePair);
      let firstEq = cookiePair.indexOf("=");
      if (looseMode) {
        if (firstEq === 0) {
          cookiePair = cookiePair.substr(1);
          firstEq = cookiePair.indexOf("=");
        }
      } else {
        if (firstEq <= 0) {
          return;
        }
      }
      let cookieName, cookieValue;
      if (firstEq <= 0) {
        cookieName = "";
        cookieValue = cookiePair.trim();
      } else {
        cookieName = cookiePair.substr(0, firstEq).trim();
        cookieValue = cookiePair.substr(firstEq + 1).trim();
      }
      if (CONTROL_CHARS.test(cookieName) || CONTROL_CHARS.test(cookieValue)) {
        return;
      }
      const c = new Cookie();
      c.key = cookieName;
      c.value = cookieValue;
      return c;
    }
    function parse(str, options) {
      if (!options || typeof options !== "object") {
        options = {};
      }
      if (validators.isEmptyString(str) || !validators.isString(str)) {
        return null;
      }
      str = str.trim();
      const firstSemi = str.indexOf(";");
      const cookiePair = firstSemi === -1 ? str : str.substr(0, firstSemi);
      const c = parseCookiePair(cookiePair, !!options.loose);
      if (!c) {
        return;
      }
      if (firstSemi === -1) {
        return c;
      }
      const unparsed = str.slice(firstSemi + 1).trim();
      if (unparsed.length === 0) {
        return c;
      }
      const cookie_avs = unparsed.split(";");
      while (cookie_avs.length) {
        const av = cookie_avs.shift().trim();
        if (av.length === 0) {
          continue;
        }
        const av_sep = av.indexOf("=");
        let av_key, av_value;
        if (av_sep === -1) {
          av_key = av;
          av_value = null;
        } else {
          av_key = av.substr(0, av_sep);
          av_value = av.substr(av_sep + 1);
        }
        av_key = av_key.trim().toLowerCase();
        if (av_value) {
          av_value = av_value.trim();
        }
        switch (av_key) {
          case "expires":
            if (av_value) {
              const exp = parseDate(av_value);
              if (exp) {
                c.expires = exp;
              }
            }
            break;
          case "max-age":
            if (av_value) {
              if (/^-?[0-9]+$/.test(av_value)) {
                const delta = parseInt(av_value, 10);
                c.setMaxAge(delta);
              }
            }
            break;
          case "domain":
            if (av_value) {
              const domain = av_value.trim().replace(/^\./, "");
              if (domain) {
                c.domain = domain.toLowerCase();
              }
            }
            break;
          case "path":
            c.path = av_value && av_value[0] === "/" ? av_value : null;
            break;
          case "secure":
            c.secure = true;
            break;
          case "httponly":
            c.httpOnly = true;
            break;
          case "samesite":
            const enforcement = av_value ? av_value.toLowerCase() : "";
            switch (enforcement) {
              case "strict":
                c.sameSite = "strict";
                break;
              case "lax":
                c.sameSite = "lax";
                break;
              case "none":
                c.sameSite = "none";
                break;
              default:
                c.sameSite = void 0;
                break;
            }
            break;
          default:
            c.extensions = c.extensions || [];
            c.extensions.push(av);
            break;
        }
      }
      return c;
    }
    function isSecurePrefixConditionMet(cookie) {
      validators.validate(validators.isObject(cookie), cookie);
      return !cookie.key.startsWith("__Secure-") || cookie.secure;
    }
    function isHostPrefixConditionMet(cookie) {
      validators.validate(validators.isObject(cookie));
      return !cookie.key.startsWith("__Host-") || cookie.secure && cookie.hostOnly && cookie.path != null && cookie.path === "/";
    }
    function jsonParse(str) {
      let obj;
      try {
        obj = JSON.parse(str);
      } catch (e) {
        return e;
      }
      return obj;
    }
    function fromJSON(str) {
      if (!str || validators.isEmptyString(str)) {
        return null;
      }
      let obj;
      if (typeof str === "string") {
        obj = jsonParse(str);
        if (obj instanceof Error) {
          return null;
        }
      } else {
        obj = str;
      }
      const c = new Cookie();
      for (let i = 0; i < Cookie.serializableProperties.length; i++) {
        const prop = Cookie.serializableProperties[i];
        if (obj[prop] === void 0 || obj[prop] === cookieDefaults[prop]) {
          continue;
        }
        if (prop === "expires" || prop === "creation" || prop === "lastAccessed") {
          if (obj[prop] === null) {
            c[prop] = null;
          } else {
            c[prop] = obj[prop] == "Infinity" ? "Infinity" : new Date(obj[prop]);
          }
        } else {
          c[prop] = obj[prop];
        }
      }
      return c;
    }
    function cookieCompare(a, b) {
      validators.validate(validators.isObject(a), a);
      validators.validate(validators.isObject(b), b);
      let cmp = 0;
      const aPathLen = a.path ? a.path.length : 0;
      const bPathLen = b.path ? b.path.length : 0;
      cmp = bPathLen - aPathLen;
      if (cmp !== 0) {
        return cmp;
      }
      const aTime = a.creation ? a.creation.getTime() : MAX_TIME;
      const bTime = b.creation ? b.creation.getTime() : MAX_TIME;
      cmp = aTime - bTime;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = a.creationIndex - b.creationIndex;
      return cmp;
    }
    function permutePath(path) {
      validators.validate(validators.isString(path));
      if (path === "/") {
        return ["/"];
      }
      const permutations = [path];
      while (path.length > 1) {
        const lindex = path.lastIndexOf("/");
        if (lindex === 0) {
          break;
        }
        path = path.substr(0, lindex);
        permutations.push(path);
      }
      permutations.push("/");
      return permutations;
    }
    function getCookieContext(url) {
      if (url instanceof Object) {
        return url;
      }
      try {
        url = decodeURI(url);
      } catch (err) {
      }
      return urlParse(url);
    }
    var cookieDefaults = {
      // the order in which the RFC has them:
      key: "",
      value: "",
      expires: "Infinity",
      maxAge: null,
      domain: null,
      path: null,
      secure: false,
      httpOnly: false,
      extensions: null,
      // set by the CookieJar:
      hostOnly: null,
      pathIsDefault: null,
      creation: null,
      lastAccessed: null,
      sameSite: void 0
    };
    var Cookie = class _Cookie {
      constructor(options = {}) {
        const customInspectSymbol = getCustomInspectSymbol();
        if (customInspectSymbol) {
          this[customInspectSymbol] = this.inspect;
        }
        Object.assign(this, cookieDefaults, options);
        this.creation = this.creation || /* @__PURE__ */ new Date();
        Object.defineProperty(this, "creationIndex", {
          configurable: false,
          enumerable: false,
          // important for assert.deepEqual checks
          writable: true,
          value: ++_Cookie.cookiesCreated
        });
      }
      inspect() {
        const now = Date.now();
        const hostOnly = this.hostOnly != null ? this.hostOnly : "?";
        const createAge = this.creation ? `${now - this.creation.getTime()}ms` : "?";
        const accessAge = this.lastAccessed ? `${now - this.lastAccessed.getTime()}ms` : "?";
        return `Cookie="${this.toString()}; hostOnly=${hostOnly}; aAge=${accessAge}; cAge=${createAge}"`;
      }
      toJSON() {
        const obj = {};
        for (const prop of _Cookie.serializableProperties) {
          if (this[prop] === cookieDefaults[prop]) {
            continue;
          }
          if (prop === "expires" || prop === "creation" || prop === "lastAccessed") {
            if (this[prop] === null) {
              obj[prop] = null;
            } else {
              obj[prop] = this[prop] == "Infinity" ? "Infinity" : this[prop].toISOString();
            }
          } else if (prop === "maxAge") {
            if (this[prop] !== null) {
              obj[prop] = this[prop] == Infinity || this[prop] == -Infinity ? this[prop].toString() : this[prop];
            }
          } else {
            if (this[prop] !== cookieDefaults[prop]) {
              obj[prop] = this[prop];
            }
          }
        }
        return obj;
      }
      clone() {
        return fromJSON(this.toJSON());
      }
      validate() {
        if (!COOKIE_OCTETS.test(this.value)) {
          return false;
        }
        if (this.expires != Infinity && !(this.expires instanceof Date) && !parseDate(this.expires)) {
          return false;
        }
        if (this.maxAge != null && this.maxAge <= 0) {
          return false;
        }
        if (this.path != null && !PATH_VALUE.test(this.path)) {
          return false;
        }
        const cdomain = this.cdomain();
        if (cdomain) {
          if (cdomain.match(/\.$/)) {
            return false;
          }
          const suffix = pubsuffix.getPublicSuffix(cdomain);
          if (suffix == null) {
            return false;
          }
        }
        return true;
      }
      setExpires(exp) {
        if (exp instanceof Date) {
          this.expires = exp;
        } else {
          this.expires = parseDate(exp) || "Infinity";
        }
      }
      setMaxAge(age) {
        if (age === Infinity || age === -Infinity) {
          this.maxAge = age.toString();
        } else {
          this.maxAge = age;
        }
      }
      cookieString() {
        let val = this.value;
        if (val == null) {
          val = "";
        }
        if (this.key === "") {
          return val;
        }
        return `${this.key}=${val}`;
      }
      // gives Set-Cookie header format
      toString() {
        let str = this.cookieString();
        if (this.expires != Infinity) {
          if (this.expires instanceof Date) {
            str += `; Expires=${formatDate(this.expires)}`;
          } else {
            str += `; Expires=${this.expires}`;
          }
        }
        if (this.maxAge != null && this.maxAge != Infinity) {
          str += `; Max-Age=${this.maxAge}`;
        }
        if (this.domain && !this.hostOnly) {
          str += `; Domain=${this.domain}`;
        }
        if (this.path) {
          str += `; Path=${this.path}`;
        }
        if (this.secure) {
          str += "; Secure";
        }
        if (this.httpOnly) {
          str += "; HttpOnly";
        }
        if (this.sameSite && this.sameSite !== "none") {
          const ssCanon = _Cookie.sameSiteCanonical[this.sameSite.toLowerCase()];
          str += `; SameSite=${ssCanon ? ssCanon : this.sameSite}`;
        }
        if (this.extensions) {
          this.extensions.forEach((ext) => {
            str += `; ${ext}`;
          });
        }
        return str;
      }
      // TTL() partially replaces the "expiry-time" parts of S5.3 step 3 (setCookie()
      // elsewhere)
      // S5.3 says to give the "latest representable date" for which we use Infinity
      // For "expired" we use 0
      TTL(now) {
        if (this.maxAge != null) {
          return this.maxAge <= 0 ? 0 : this.maxAge * 1e3;
        }
        let expires = this.expires;
        if (expires != Infinity) {
          if (!(expires instanceof Date)) {
            expires = parseDate(expires) || Infinity;
          }
          if (expires == Infinity) {
            return Infinity;
          }
          return expires.getTime() - (now || Date.now());
        }
        return Infinity;
      }
      // expiryTime() replaces the "expiry-time" parts of S5.3 step 3 (setCookie()
      // elsewhere)
      expiryTime(now) {
        if (this.maxAge != null) {
          const relativeTo = now || this.creation || /* @__PURE__ */ new Date();
          const age = this.maxAge <= 0 ? -Infinity : this.maxAge * 1e3;
          return relativeTo.getTime() + age;
        }
        if (this.expires == Infinity) {
          return Infinity;
        }
        return this.expires.getTime();
      }
      // expiryDate() replaces the "expiry-time" parts of S5.3 step 3 (setCookie()
      // elsewhere), except it returns a Date
      expiryDate(now) {
        const millisec = this.expiryTime(now);
        if (millisec == Infinity) {
          return new Date(MAX_TIME);
        } else if (millisec == -Infinity) {
          return new Date(MIN_TIME);
        } else {
          return new Date(millisec);
        }
      }
      // This replaces the "persistent-flag" parts of S5.3 step 3
      isPersistent() {
        return this.maxAge != null || this.expires != Infinity;
      }
      // Mostly S5.1.2 and S5.2.3:
      canonicalizedDomain() {
        if (this.domain == null) {
          return null;
        }
        return canonicalDomain(this.domain);
      }
      cdomain() {
        return this.canonicalizedDomain();
      }
    };
    Cookie.cookiesCreated = 0;
    Cookie.parse = parse;
    Cookie.fromJSON = fromJSON;
    Cookie.serializableProperties = Object.keys(cookieDefaults);
    Cookie.sameSiteLevel = {
      strict: 3,
      lax: 2,
      none: 1
    };
    Cookie.sameSiteCanonical = {
      strict: "Strict",
      lax: "Lax"
    };
    function getNormalizedPrefixSecurity(prefixSecurity) {
      if (prefixSecurity != null) {
        const normalizedPrefixSecurity = prefixSecurity.toLowerCase();
        switch (normalizedPrefixSecurity) {
          case PrefixSecurityEnum.STRICT:
          case PrefixSecurityEnum.SILENT:
          case PrefixSecurityEnum.DISABLED:
            return normalizedPrefixSecurity;
        }
      }
      return PrefixSecurityEnum.SILENT;
    }
    var CookieJar = class _CookieJar {
      constructor(store, options = { rejectPublicSuffixes: true }) {
        if (typeof options === "boolean") {
          options = { rejectPublicSuffixes: options };
        }
        validators.validate(validators.isObject(options), options);
        this.rejectPublicSuffixes = options.rejectPublicSuffixes;
        this.enableLooseMode = !!options.looseMode;
        this.allowSpecialUseDomain = typeof options.allowSpecialUseDomain === "boolean" ? options.allowSpecialUseDomain : true;
        this.store = store || new MemoryCookieStore();
        this.prefixSecurity = getNormalizedPrefixSecurity(options.prefixSecurity);
        this._cloneSync = syncWrap("clone");
        this._importCookiesSync = syncWrap("_importCookies");
        this.getCookiesSync = syncWrap("getCookies");
        this.getCookieStringSync = syncWrap("getCookieString");
        this.getSetCookieStringsSync = syncWrap("getSetCookieStrings");
        this.removeAllCookiesSync = syncWrap("removeAllCookies");
        this.setCookieSync = syncWrap("setCookie");
        this.serializeSync = syncWrap("serialize");
      }
      setCookie(cookie, url, options, cb) {
        validators.validate(validators.isUrlStringOrObject(url), cb, options);
        let err;
        if (validators.isFunction(url)) {
          cb = url;
          return cb(new Error("No URL was specified"));
        }
        const context = getCookieContext(url);
        if (validators.isFunction(options)) {
          cb = options;
          options = {};
        }
        validators.validate(validators.isFunction(cb), cb);
        if (!validators.isNonEmptyString(cookie) && !validators.isObject(cookie) && cookie instanceof String && cookie.length == 0) {
          return cb(null);
        }
        const host = canonicalDomain(context.hostname);
        const loose = options.loose || this.enableLooseMode;
        let sameSiteContext = null;
        if (options.sameSiteContext) {
          sameSiteContext = checkSameSiteContext(options.sameSiteContext);
          if (!sameSiteContext) {
            return cb(new Error(SAME_SITE_CONTEXT_VAL_ERR));
          }
        }
        if (typeof cookie === "string" || cookie instanceof String) {
          cookie = Cookie.parse(cookie, { loose });
          if (!cookie) {
            err = new Error("Cookie failed to parse");
            return cb(options.ignoreError ? null : err);
          }
        } else if (!(cookie instanceof Cookie)) {
          err = new Error(
            "First argument to setCookie must be a Cookie object or string"
          );
          return cb(options.ignoreError ? null : err);
        }
        const now = options.now || /* @__PURE__ */ new Date();
        if (this.rejectPublicSuffixes && cookie.domain) {
          const suffix = pubsuffix.getPublicSuffix(cookie.cdomain(), {
            allowSpecialUseDomain: this.allowSpecialUseDomain,
            ignoreError: options.ignoreError
          });
          if (suffix == null && !IP_V6_REGEX_OBJECT.test(cookie.domain)) {
            err = new Error("Cookie has domain set to a public suffix");
            return cb(options.ignoreError ? null : err);
          }
        }
        if (cookie.domain) {
          if (!domainMatch(host, cookie.cdomain(), false)) {
            err = new Error(
              `Cookie not in this host's domain. Cookie:${cookie.cdomain()} Request:${host}`
            );
            return cb(options.ignoreError ? null : err);
          }
          if (cookie.hostOnly == null) {
            cookie.hostOnly = false;
          }
        } else {
          cookie.hostOnly = true;
          cookie.domain = host;
        }
        if (!cookie.path || cookie.path[0] !== "/") {
          cookie.path = defaultPath(context.pathname);
          cookie.pathIsDefault = true;
        }
        if (options.http === false && cookie.httpOnly) {
          err = new Error("Cookie is HttpOnly and this isn't an HTTP API");
          return cb(options.ignoreError ? null : err);
        }
        if (cookie.sameSite !== "none" && cookie.sameSite !== void 0 && sameSiteContext) {
          if (sameSiteContext === "none") {
            err = new Error(
              "Cookie is SameSite but this is a cross-origin request"
            );
            return cb(options.ignoreError ? null : err);
          }
        }
        const ignoreErrorForPrefixSecurity = this.prefixSecurity === PrefixSecurityEnum.SILENT;
        const prefixSecurityDisabled = this.prefixSecurity === PrefixSecurityEnum.DISABLED;
        if (!prefixSecurityDisabled) {
          let errorFound = false;
          let errorMsg;
          if (!isSecurePrefixConditionMet(cookie)) {
            errorFound = true;
            errorMsg = "Cookie has __Secure prefix but Secure attribute is not set";
          } else if (!isHostPrefixConditionMet(cookie)) {
            errorFound = true;
            errorMsg = "Cookie has __Host prefix but either Secure or HostOnly attribute is not set or Path is not '/'";
          }
          if (errorFound) {
            return cb(
              options.ignoreError || ignoreErrorForPrefixSecurity ? null : new Error(errorMsg)
            );
          }
        }
        const store = this.store;
        if (!store.updateCookie) {
          store.updateCookie = function(oldCookie, newCookie, cb2) {
            this.putCookie(newCookie, cb2);
          };
        }
        function withCookie(err2, oldCookie) {
          if (err2) {
            return cb(err2);
          }
          const next = function(err3) {
            if (err3) {
              return cb(err3);
            } else {
              cb(null, cookie);
            }
          };
          if (oldCookie) {
            if (options.http === false && oldCookie.httpOnly) {
              err2 = new Error("old Cookie is HttpOnly and this isn't an HTTP API");
              return cb(options.ignoreError ? null : err2);
            }
            cookie.creation = oldCookie.creation;
            cookie.creationIndex = oldCookie.creationIndex;
            cookie.lastAccessed = now;
            store.updateCookie(oldCookie, cookie, next);
          } else {
            cookie.creation = cookie.lastAccessed = now;
            store.putCookie(cookie, next);
          }
        }
        store.findCookie(cookie.domain, cookie.path, cookie.key, withCookie);
      }
      // RFC6365 S5.4
      getCookies(url, options, cb) {
        validators.validate(validators.isUrlStringOrObject(url), cb, url);
        const context = getCookieContext(url);
        if (validators.isFunction(options)) {
          cb = options;
          options = {};
        }
        validators.validate(validators.isObject(options), cb, options);
        validators.validate(validators.isFunction(cb), cb);
        const host = canonicalDomain(context.hostname);
        const path = context.pathname || "/";
        let secure = options.secure;
        if (secure == null && context.protocol && (context.protocol == "https:" || context.protocol == "wss:")) {
          secure = true;
        }
        let sameSiteLevel = 0;
        if (options.sameSiteContext) {
          const sameSiteContext = checkSameSiteContext(options.sameSiteContext);
          sameSiteLevel = Cookie.sameSiteLevel[sameSiteContext];
          if (!sameSiteLevel) {
            return cb(new Error(SAME_SITE_CONTEXT_VAL_ERR));
          }
        }
        let http = options.http;
        if (http == null) {
          http = true;
        }
        const now = options.now || Date.now();
        const expireCheck = options.expire !== false;
        const allPaths = !!options.allPaths;
        const store = this.store;
        function matchingCookie(c) {
          if (c.hostOnly) {
            if (c.domain != host) {
              return false;
            }
          } else {
            if (!domainMatch(host, c.domain, false)) {
              return false;
            }
          }
          if (!allPaths && !pathMatch(path, c.path)) {
            return false;
          }
          if (c.secure && !secure) {
            return false;
          }
          if (c.httpOnly && !http) {
            return false;
          }
          if (sameSiteLevel) {
            const cookieLevel = Cookie.sameSiteLevel[c.sameSite || "none"];
            if (cookieLevel > sameSiteLevel) {
              return false;
            }
          }
          if (expireCheck && c.expiryTime() <= now) {
            store.removeCookie(c.domain, c.path, c.key, () => {
            });
            return false;
          }
          return true;
        }
        store.findCookies(
          host,
          allPaths ? null : path,
          this.allowSpecialUseDomain,
          (err, cookies) => {
            if (err) {
              return cb(err);
            }
            cookies = cookies.filter(matchingCookie);
            if (options.sort !== false) {
              cookies = cookies.sort(cookieCompare);
            }
            const now2 = /* @__PURE__ */ new Date();
            for (const cookie of cookies) {
              cookie.lastAccessed = now2;
            }
            cb(null, cookies);
          }
        );
      }
      getCookieString(...args) {
        const cb = args.pop();
        validators.validate(validators.isFunction(cb), cb);
        const next = function(err, cookies) {
          if (err) {
            cb(err);
          } else {
            cb(
              null,
              cookies.sort(cookieCompare).map((c) => c.cookieString()).join("; ")
            );
          }
        };
        args.push(next);
        this.getCookies.apply(this, args);
      }
      getSetCookieStrings(...args) {
        const cb = args.pop();
        validators.validate(validators.isFunction(cb), cb);
        const next = function(err, cookies) {
          if (err) {
            cb(err);
          } else {
            cb(
              null,
              cookies.map((c) => {
                return c.toString();
              })
            );
          }
        };
        args.push(next);
        this.getCookies.apply(this, args);
      }
      serialize(cb) {
        validators.validate(validators.isFunction(cb), cb);
        let type = this.store.constructor.name;
        if (validators.isObject(type)) {
          type = null;
        }
        const serialized = {
          // The version of tough-cookie that serialized this jar. Generally a good
          // practice since future versions can make data import decisions based on
          // known past behavior. When/if this matters, use `semver`.
          version: `tough-cookie@${VERSION}`,
          // add the store type, to make humans happy:
          storeType: type,
          // CookieJar configuration:
          rejectPublicSuffixes: !!this.rejectPublicSuffixes,
          enableLooseMode: !!this.enableLooseMode,
          allowSpecialUseDomain: !!this.allowSpecialUseDomain,
          prefixSecurity: getNormalizedPrefixSecurity(this.prefixSecurity),
          // this gets filled from getAllCookies:
          cookies: []
        };
        if (!(this.store.getAllCookies && typeof this.store.getAllCookies === "function")) {
          return cb(
            new Error(
              "store does not support getAllCookies and cannot be serialized"
            )
          );
        }
        this.store.getAllCookies((err, cookies) => {
          if (err) {
            return cb(err);
          }
          serialized.cookies = cookies.map((cookie) => {
            cookie = cookie instanceof Cookie ? cookie.toJSON() : cookie;
            delete cookie.creationIndex;
            return cookie;
          });
          return cb(null, serialized);
        });
      }
      toJSON() {
        return this.serializeSync();
      }
      // use the class method CookieJar.deserialize instead of calling this directly
      _importCookies(serialized, cb) {
        let cookies = serialized.cookies;
        if (!cookies || !Array.isArray(cookies)) {
          return cb(new Error("serialized jar has no cookies array"));
        }
        cookies = cookies.slice();
        const putNext = (err) => {
          if (err) {
            return cb(err);
          }
          if (!cookies.length) {
            return cb(err, this);
          }
          let cookie;
          try {
            cookie = fromJSON(cookies.shift());
          } catch (e) {
            return cb(e);
          }
          if (cookie === null) {
            return putNext(null);
          }
          this.store.putCookie(cookie, putNext);
        };
        putNext();
      }
      clone(newStore, cb) {
        if (arguments.length === 1) {
          cb = newStore;
          newStore = null;
        }
        this.serialize((err, serialized) => {
          if (err) {
            return cb(err);
          }
          _CookieJar.deserialize(serialized, newStore, cb);
        });
      }
      cloneSync(newStore) {
        if (arguments.length === 0) {
          return this._cloneSync();
        }
        if (!newStore.synchronous) {
          throw new Error(
            "CookieJar clone destination store is not synchronous; use async API instead."
          );
        }
        return this._cloneSync(newStore);
      }
      removeAllCookies(cb) {
        validators.validate(validators.isFunction(cb), cb);
        const store = this.store;
        if (typeof store.removeAllCookies === "function" && store.removeAllCookies !== Store.prototype.removeAllCookies) {
          return store.removeAllCookies(cb);
        }
        store.getAllCookies((err, cookies) => {
          if (err) {
            return cb(err);
          }
          if (cookies.length === 0) {
            return cb(null);
          }
          let completedCount = 0;
          const removeErrors = [];
          function removeCookieCb(removeErr) {
            if (removeErr) {
              removeErrors.push(removeErr);
            }
            completedCount++;
            if (completedCount === cookies.length) {
              return cb(removeErrors.length ? removeErrors[0] : null);
            }
          }
          cookies.forEach((cookie) => {
            store.removeCookie(
              cookie.domain,
              cookie.path,
              cookie.key,
              removeCookieCb
            );
          });
        });
      }
      static deserialize(strOrObj, store, cb) {
        if (arguments.length !== 3) {
          cb = store;
          store = null;
        }
        validators.validate(validators.isFunction(cb), cb);
        let serialized;
        if (typeof strOrObj === "string") {
          serialized = jsonParse(strOrObj);
          if (serialized instanceof Error) {
            return cb(serialized);
          }
        } else {
          serialized = strOrObj;
        }
        const jar = new _CookieJar(store, {
          rejectPublicSuffixes: serialized.rejectPublicSuffixes,
          looseMode: serialized.enableLooseMode,
          allowSpecialUseDomain: serialized.allowSpecialUseDomain,
          prefixSecurity: serialized.prefixSecurity
        });
        jar._importCookies(serialized, (err) => {
          if (err) {
            return cb(err);
          }
          cb(null, jar);
        });
      }
      static deserializeSync(strOrObj, store) {
        const serialized = typeof strOrObj === "string" ? JSON.parse(strOrObj) : strOrObj;
        const jar = new _CookieJar(store, {
          rejectPublicSuffixes: serialized.rejectPublicSuffixes,
          looseMode: serialized.enableLooseMode
        });
        if (!jar.store.synchronous) {
          throw new Error(
            "CookieJar store is not synchronous; use async API instead."
          );
        }
        jar._importCookiesSync(serialized);
        return jar;
      }
    };
    CookieJar.fromJSON = CookieJar.deserializeSync;
    [
      "_importCookies",
      "clone",
      "getCookies",
      "getCookieString",
      "getSetCookieStrings",
      "removeAllCookies",
      "serialize",
      "setCookie"
    ].forEach((name) => {
      CookieJar.prototype[name] = fromCallback(CookieJar.prototype[name]);
    });
    CookieJar.deserialize = fromCallback(CookieJar.deserialize);
    function syncWrap(method) {
      return function(...args) {
        if (!this.store.synchronous) {
          throw new Error(
            "CookieJar store is not synchronous; use async API instead."
          );
        }
        let syncErr, syncResult;
        this[method](...args, (err, result) => {
          syncErr = err;
          syncResult = result;
        });
        if (syncErr) {
          throw syncErr;
        }
        return syncResult;
      };
    }
    exports.version = VERSION;
    exports.CookieJar = CookieJar;
    exports.Cookie = Cookie;
    exports.Store = Store;
    exports.MemoryCookieStore = MemoryCookieStore;
    exports.parseDate = parseDate;
    exports.formatDate = formatDate;
    exports.parse = parse;
    exports.fromJSON = fromJSON;
    exports.domainMatch = domainMatch;
    exports.defaultPath = defaultPath;
    exports.pathMatch = pathMatch;
    exports.getPublicSuffix = pubsuffix.getPublicSuffix;
    exports.cookieCompare = cookieCompare;
    exports.permuteDomain = require_permuteDomain().permuteDomain;
    exports.permutePath = permutePath;
    exports.canonicalDomain = canonicalDomain;
    exports.PrefixSecurityEnum = PrefixSecurityEnum;
    exports.ParameterError = validators.ParameterError;
  }
});

// node_modules/oauth-1.0a/oauth-1.0a.js
var require_oauth_1_0a = __commonJS({
  "node_modules/oauth-1.0a/oauth-1.0a.js"(exports, module) {
    if (typeof module !== "undefined" && typeof exports !== "undefined") {
      module.exports = OAuth;
    }
    function OAuth(opts) {
      if (!(this instanceof OAuth)) {
        return new OAuth(opts);
      }
      if (!opts) {
        opts = {};
      }
      if (!opts.consumer) {
        throw new Error("consumer option is required");
      }
      this.consumer = opts.consumer;
      this.nonce_length = opts.nonce_length || 32;
      this.version = opts.version || "1.0";
      this.parameter_seperator = opts.parameter_seperator || ", ";
      this.realm = opts.realm;
      if (typeof opts.last_ampersand === "undefined") {
        this.last_ampersand = true;
      } else {
        this.last_ampersand = opts.last_ampersand;
      }
      this.signature_method = opts.signature_method || "PLAINTEXT";
      if (this.signature_method == "PLAINTEXT" && !opts.hash_function) {
        opts.hash_function = function(base_string, key) {
          return key;
        };
      }
      if (!opts.hash_function) {
        throw new Error("hash_function option is required");
      }
      this.hash_function = opts.hash_function;
      this.body_hash_function = opts.body_hash_function || this.hash_function;
    }
    OAuth.prototype.authorize = function(request, token) {
      var oauth_data = {
        oauth_consumer_key: this.consumer.key,
        oauth_nonce: this.getNonce(),
        oauth_signature_method: this.signature_method,
        oauth_timestamp: this.getTimeStamp(),
        oauth_version: this.version
      };
      if (!token) {
        token = {};
      }
      if (token.key !== void 0) {
        oauth_data.oauth_token = token.key;
      }
      if (!request.data) {
        request.data = {};
      }
      if (request.includeBodyHash) {
        oauth_data.oauth_body_hash = this.getBodyHash(request, token.secret);
      }
      oauth_data.oauth_signature = this.getSignature(request, token.secret, oauth_data);
      return oauth_data;
    };
    OAuth.prototype.getSignature = function(request, token_secret, oauth_data) {
      return this.hash_function(this.getBaseString(request, oauth_data), this.getSigningKey(token_secret));
    };
    OAuth.prototype.getBodyHash = function(request, token_secret) {
      var body = typeof request.data === "string" ? request.data : JSON.stringify(request.data);
      if (!this.body_hash_function) {
        throw new Error("body_hash_function option is required");
      }
      return this.body_hash_function(body, this.getSigningKey(token_secret));
    };
    OAuth.prototype.getBaseString = function(request, oauth_data) {
      return request.method.toUpperCase() + "&" + this.percentEncode(this.getBaseUrl(request.url)) + "&" + this.percentEncode(this.getParameterString(request, oauth_data));
    };
    OAuth.prototype.getParameterString = function(request, oauth_data) {
      var base_string_data;
      if (oauth_data.oauth_body_hash) {
        base_string_data = this.sortObject(this.percentEncodeData(this.mergeObject(oauth_data, this.deParamUrl(request.url))));
      } else {
        base_string_data = this.sortObject(this.percentEncodeData(this.mergeObject(oauth_data, this.mergeObject(request.data, this.deParamUrl(request.url)))));
      }
      var data_str = "";
      for (var i = 0; i < base_string_data.length; i++) {
        var key = base_string_data[i].key;
        var value = base_string_data[i].value;
        if (value && Array.isArray(value)) {
          value.sort();
          var valString = "";
          value.forEach((function(item, i2) {
            valString += key + "=" + item;
            if (i2 < value.length) {
              valString += "&";
            }
          }).bind(this));
          data_str += valString;
        } else {
          data_str += key + "=" + value + "&";
        }
      }
      data_str = data_str.substr(0, data_str.length - 1);
      return data_str;
    };
    OAuth.prototype.getSigningKey = function(token_secret) {
      token_secret = token_secret || "";
      if (!this.last_ampersand && !token_secret) {
        return this.percentEncode(this.consumer.secret);
      }
      return this.percentEncode(this.consumer.secret) + "&" + this.percentEncode(token_secret);
    };
    OAuth.prototype.getBaseUrl = function(url) {
      return url.split("?")[0];
    };
    OAuth.prototype.deParam = function(string) {
      var arr = string.split("&");
      var data = {};
      for (var i = 0; i < arr.length; i++) {
        var item = arr[i].split("=");
        item[1] = item[1] || "";
        if (data[item[0]]) {
          if (!Array.isArray(data[item[0]])) {
            data[item[0]] = [data[item[0]]];
          }
          data[item[0]].push(decodeURIComponent(item[1]));
        } else {
          data[item[0]] = decodeURIComponent(item[1]);
        }
      }
      return data;
    };
    OAuth.prototype.deParamUrl = function(url) {
      var tmp = url.split("?");
      if (tmp.length === 1)
        return {};
      return this.deParam(tmp[1]);
    };
    OAuth.prototype.percentEncode = function(str) {
      return encodeURIComponent(str).replace(/\!/g, "%21").replace(/\*/g, "%2A").replace(/\'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29");
    };
    OAuth.prototype.percentEncodeData = function(data) {
      var result = {};
      for (var key in data) {
        var value = data[key];
        if (value && Array.isArray(value)) {
          var newValue = [];
          value.forEach((function(val) {
            newValue.push(this.percentEncode(val));
          }).bind(this));
          value = newValue;
        } else {
          value = this.percentEncode(value);
        }
        result[this.percentEncode(key)] = value;
      }
      return result;
    };
    OAuth.prototype.toHeader = function(oauth_data) {
      var sorted = this.sortObject(oauth_data);
      var header_value = "OAuth ";
      if (this.realm) {
        header_value += 'realm="' + this.realm + '"' + this.parameter_seperator;
      }
      for (var i = 0; i < sorted.length; i++) {
        if (sorted[i].key.indexOf("oauth_") !== 0)
          continue;
        header_value += this.percentEncode(sorted[i].key) + '="' + this.percentEncode(sorted[i].value) + '"' + this.parameter_seperator;
      }
      return {
        Authorization: header_value.substr(0, header_value.length - this.parameter_seperator.length)
        //cut the last chars
      };
    };
    OAuth.prototype.getNonce = function() {
      var word_characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      var result = "";
      for (var i = 0; i < this.nonce_length; i++) {
        result += word_characters[parseInt(Math.random() * word_characters.length, 10)];
      }
      return result;
    };
    OAuth.prototype.getTimeStamp = function() {
      return parseInt((/* @__PURE__ */ new Date()).getTime() / 1e3, 10);
    };
    OAuth.prototype.mergeObject = function(obj1, obj2) {
      obj1 = obj1 || {};
      obj2 = obj2 || {};
      var merged_obj = obj1;
      for (var key in obj2) {
        merged_obj[key] = obj2[key];
      }
      return merged_obj;
    };
    OAuth.prototype.sortObject = function(data) {
      var keys = Object.keys(data);
      var result = [];
      keys.sort();
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        result.push({
          key,
          value: data[key]
        });
      }
      return result;
    };
  }
});

// node_modules/mwn/build/wikitext.js
var require_wikitext = __commonJS({
  "node_modules/mwn/build/wikitext.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Unbinder = exports.Parameter = exports.Template = void 0;
    exports.parseTemplates = parseTemplates;
    exports.parseTable = parseTable;
    exports.parseSections = parseSections;
    exports.default = default_1;
    var Template = class {
      /**
       * @param {String} wikitext Wikitext of a template transclusion,
       * starting with '{{' and ending with '}}'.
       */
      constructor(wikitext) {
        this.wikitext = wikitext;
        this.parameters = [];
      }
      addParam(name, val, wikitext) {
        this.parameters.push(new Parameter(name, val, wikitext));
      }
      getParam(paramName) {
        return this.parameters.find((p) => {
          return p.name == paramName;
        });
      }
      getValue(paramName) {
        let param = this.getParam(paramName);
        return param ? param.value : null;
      }
      setName(name) {
        name = name.trim();
        this.name = name[0] ? name[0].toUpperCase() + name.slice(1) : name;
      }
    };
    exports.Template = Template;
    var Parameter = class {
      constructor(name, val, wikitext) {
        this.name = name;
        this.value = val;
        this.wikitext = "|" + wikitext;
      }
    };
    exports.Parameter = Parameter;
    function parseTemplates(wikitext, config) {
      config = config || {
        recursive: false,
        namePredicate: null,
        templatePredicate: null,
        count: null
      };
      const result = [];
      const n = wikitext.length;
      let numUnclosed = 0;
      let inComment = false;
      let inNowiki = false;
      let inParameter = false;
      let startIdx, endIdx;
      for (let i = 0; i < n; i++) {
        if (!inComment && !inNowiki && !inParameter) {
          if (wikitext[i] === "{" && wikitext[i + 1] === "{" && wikitext[i + 2] === "{" && wikitext[i + 3] !== "{") {
            inParameter = true;
            i += 2;
          } else if (wikitext[i] === "{" && wikitext[i + 1] === "{") {
            if (numUnclosed === 0) {
              startIdx = i + 2;
            }
            numUnclosed += 2;
            i++;
          } else if (wikitext[i] === "}" && wikitext[i + 1] === "}") {
            if (numUnclosed === 2) {
              endIdx = i;
              let templateWikitext = wikitext.slice(startIdx, endIdx);
              let processed = processTemplateText(templateWikitext, config.namePredicate, config.templatePredicate);
              if (processed) {
                result.push(processed);
              }
              if (config.count && result.length === config.count) {
                return result;
              }
            }
            numUnclosed -= 2;
            i++;
          } else if (wikitext[i] === "|" && numUnclosed > 2) {
            wikitext = strReplaceAt(wikitext, i, "");
          } else if (/^<!--/.test(wikitext.slice(i, i + 4))) {
            inComment = true;
            i += 3;
          } else if (/^<nowiki ?>/.test(wikitext.slice(i, i + 9))) {
            inNowiki = true;
            i += 7;
          }
        } else {
          if (wikitext[i] === "|") {
            wikitext = strReplaceAt(wikitext, i, "");
          } else if (/^-->/.test(wikitext.slice(i, i + 3))) {
            inComment = false;
            i += 2;
          } else if (/^<\/nowiki ?>/.test(wikitext.slice(i, i + 10))) {
            inNowiki = false;
            i += 8;
          } else if (wikitext[i] === "}" && wikitext[i + 1] === "}" && wikitext[i + 2] === "}") {
            inParameter = false;
            i += 2;
          }
        }
      }
      if (config.recursive) {
        let subtemplates = result.map((template) => {
          return template.wikitext.slice(2, -2);
        }).filter((templateWikitext) => {
          return /\{\{.*\}\}/s.test(templateWikitext);
        }).map((templateWikitext) => {
          return parseTemplates(templateWikitext, config);
        });
        return result.concat(...subtemplates);
      }
      return result;
    }
    function processTemplateText(text, namePredicate, templatePredicate) {
      const template = new Template("{{" + text.replace(/\x01/g, "|") + "}}");
      while (/(\[\[[^\]]*?)\|(.*?\]\])/g.test(text)) {
        text = text.replace(/(\[\[[^\]]*?)\|(.*?\]\])/g, "$1$2");
      }
      const [name, ...parameterChunks] = text.split("|").map((chunk) => {
        return chunk.replace(/\x01/g, "|");
      });
      template.setName(name);
      if (namePredicate && !namePredicate(template.name)) {
        return null;
      }
      let unnamedIdx = 1;
      parameterChunks.forEach(function(chunk) {
        let indexOfEqualTo = chunk.indexOf("=");
        let indexOfOpenBraces = chunk.indexOf("{{");
        let isWithoutEquals = !chunk.includes("=");
        let hasBracesBeforeEquals = chunk.includes("{{") && indexOfOpenBraces < indexOfEqualTo;
        let isUnnamedParam = isWithoutEquals || hasBracesBeforeEquals;
        let pName, pNum, pVal;
        if (isUnnamedParam) {
          while (template.getParam(unnamedIdx)) {
            unnamedIdx++;
          }
          pNum = unnamedIdx;
          pVal = chunk.trim();
        } else {
          pName = chunk.slice(0, indexOfEqualTo).trim();
          pVal = chunk.slice(indexOfEqualTo + 1).trim();
        }
        template.addParam(pName || pNum, pVal, chunk);
      });
      if (templatePredicate && !templatePredicate(template)) {
        return null;
      }
      return template;
    }
    function parseTable(text) {
      text = text.trim();
      const indexOfRawPipe = function(text2) {
        let tlevel = 0, llevel = 0;
        let n = text2.length;
        for (let i = 0; i < n; i++) {
          if (text2[i] === "{" && text2[i + 1] === "{") {
            tlevel++;
            i++;
          } else if (text2[i] === "[" && text2[i + 1] === "[") {
            llevel++;
            i++;
          } else if (text2[i] === "}" && text2[i + 1] === "}") {
            tlevel--;
            i++;
          } else if (text2[i] === "]" && text2[i + 1] === "]") {
            llevel--;
            i++;
          } else if (text2[i] === "|" && tlevel === 0 && llevel === 0) {
            return i;
          }
        }
      };
      if (!text.startsWith("{|") || !text.endsWith("|}")) {
        throw new Error("failed to parse table. Unexpected starting or ending");
      }
      text = text.replace(/^\{\|.*$((\n\|-)?\n\|\+.*$)?(\n\|-)?/m, "").replace(/^\|\}$/m, "");
      let [header, ...rows] = text.split(/^\|-/m).map((r) => r.trim());
      const extractData = (cell) => {
        return cell.slice(indexOfRawPipe(cell) + 1).trim();
      };
      let cols = header.split("\n").map((e) => e.replace(/^!/, ""));
      if (cols.length === 1) {
        cols = cols[0].split("!!");
      }
      cols = cols.map(extractData);
      let numcols = cols.length;
      let output = new Array(rows.length);
      rows.forEach((row, idx) => {
        let cells = row.split(/^\|/m).slice(1);
        if (cells.length === 1) {
          cells = cells[0].replace(/^\|/, "").split("||");
        }
        cells = cells.map(extractData);
        if (cells.length !== numcols) {
          throw new Error(`failed to parse table: found ${cells.length} cells on row ${idx}, expected ${numcols}`);
        }
        output[idx] = {};
        for (let i = 0; i < numcols; i++) {
          output[idx][cols[i]] = cells[i];
        }
      });
      return output;
    }
    function parseSections(text) {
      const rgx = /^(=+)(.*?)\1/gm;
      let sections = [
        {
          level: 1,
          header: null,
          index: 0
        }
      ];
      let match;
      while (match = rgx.exec(text)) {
        sections.push({
          level: match[1].length,
          header: match[2].trim(),
          index: match.index
        });
      }
      let n = sections.length;
      for (let i = 0; i < n - 1; i++) {
        sections[i].content = text.slice(sections[i].index, sections[i + 1].index);
      }
      sections[n - 1].content = text.slice(sections[n - 1].index);
      return sections;
    }
    var Unbinder = class {
      constructor(text) {
        this.text = text;
      }
      /**
       * Temporarily hide a part of the string while processing the rest of it.
       *
       * eg.  let u = new bot.Wikitext("Hello world <!-- world --> world");
       *      u.unbind('<!--','-->');
       *      u.content = u.content.replace(/world/g, 'earth');
       *      u.rebind(); // gives "Hello earth <!-- world --> earth"
       *
       * Text within the 'unbinded' part (in this case, the HTML comment) remains intact
       * unbind() can be called multiple times to unbind multiple parts of the string.
       *
       * @param {string} prefix
       * @param {string} postfix
       */
      unbind(prefix, postfix) {
        if (!this.unbinder) {
          this.unbinder = {
            counter: 0,
            history: {},
            prefix: "%UNIQ::" + Math.random() + "::",
            postfix: "::UNIQ%"
          };
        }
        let re = new RegExp(prefix + "([\\s\\S]*?)" + postfix, "g");
        this.text = this.text.replace(re, (match) => {
          let current = this.unbinder.prefix + this.unbinder.counter + this.unbinder.postfix;
          this.unbinder.history[current] = match;
          ++this.unbinder.counter;
          return current;
        });
      }
      /**
       * Rebind after unbinding.
       */
      rebind() {
        let content = this.text;
        for (let [current, replacement] of Object.entries(this.unbinder.history)) {
          content = content.replace(current, replacement);
        }
        this.text = content;
        return this.text;
      }
      /** Get the updated text */
      getText() {
        return this.text;
      }
    };
    exports.Unbinder = Unbinder;
    function default_1(bot) {
      class Wikitext extends Unbinder {
        constructor(wikitext) {
          if (typeof wikitext !== "string") {
            throw new Error("non-string constructor for wikitext class");
          }
          super(wikitext);
        }
        /** @inheritDoc */
        parseLinks() {
          this.links = [];
          this.files = [];
          this.categories = [];
          let n = this.text.length;
          let stack = new Stack();
          for (let i = 0; i < n; i++) {
            if (this.text[i] === "[" && this.text[i + 1] === "[") {
              stack.push({
                startIdx: i
              });
              i++;
            } else if (this.text[i] === "]" && this.text[i + 1] === "]" && stack.top()) {
              stack.top().endIdx = i + 1;
              processLink(this, stack.top().startIdx, stack.top().endIdx);
              stack.pop();
              i++;
            }
          }
        }
        /** @inheritDoc */
        parseTemplates(config) {
          return this.templates = parseTemplates(this.text, config);
        }
        /** @inheritDoc */
        removeEntity(entity) {
          this.text = this.text.replace(entity.wikitext, "");
        }
        /** @inheritDoc */
        apiParse(options) {
          return bot.parseWikitext(this.text, options);
        }
        /** @inheritDoc */
        parseSections() {
          return this.sections = parseSections(this.text);
        }
      }
      Wikitext.parseTemplates = parseTemplates;
      Wikitext.parseTable = parseTable;
      Wikitext.parseSections = parseSections;
      function processLink(self2, startIdx, endIdx) {
        let linktext = self2.text.slice(startIdx, endIdx + 1);
        let [target, displaytext] = linktext.slice(2, -2).split("|");
        let noSortkey = false;
        if (!displaytext) {
          displaytext = target[0] === ":" ? target.slice(1) : target;
          noSortkey = true;
        }
        let title = bot.Title.newFromText(target);
        if (!title) {
          return;
        }
        if (target[0] !== ":") {
          if (title.namespace === 6) {
            self2.files.push({
              wikitext: linktext,
              target: title,
              props: linktext.slice(linktext.indexOf("|") + 1, -2)
            });
            return;
          } else if (title.namespace === 14) {
            self2.categories.push({
              wikitext: linktext,
              target: title,
              sortkey: noSortkey ? "" : displaytext
            });
            return;
          }
        }
        self2.links.push({
          wikitext: linktext,
          target: title,
          displaytext
        });
      }
      return Wikitext;
    }
    var Stack = class extends Array {
      top() {
        return this[this.length - 1];
      }
    };
    function strReplaceAt(string, index, char) {
      return string.slice(0, index) + char + string.slice(index + 1);
    }
  }
});

// node_modules/mwn/build/date.js
var require_date = __commonJS({
  "node_modules/mwn/build/date.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = default_1;
    var wikitext_1 = require_wikitext();
    function default_1(bot) {
      class XDate extends Date {
        constructor(...args) {
          if (args.length === 1 && typeof args[0] === "string") {
            if (/^\d{14}$/.test(args[0])) {
              let match = /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/.exec(args[0]);
              let dateParts = match.slice(1).map((e) => parseInt(e));
              super(Date.UTC(
                dateParts[0],
                dateParts[1] - 1,
                // fix month
                dateParts[2],
                dateParts[3],
                dateParts[4],
                dateParts[5]
              ));
            } else {
              args[0] = args[0].replace(/(\d\d:\d\d),/, "$1").replace(/\(UTC\)/, "UTC");
              super(args[0]);
            }
          } else {
            super(...args);
          }
          if (isNaN(this.getTime()) && !bot.options.suppressInvalidDateWarning) {
            console.warn("Invalid initialisation of MwnDate object: ", args);
          }
        }
        isValid() {
          return !isNaN(this.getTime());
        }
        isBefore(date) {
          return this.getTime() < date.getTime();
        }
        isAfter(date) {
          return this.getTime() > date.getTime();
        }
        getUTCMonthName() {
          return XDate.localeData.months[this.getUTCMonth()];
        }
        getUTCMonthNameAbbrev() {
          return XDate.localeData.monthsShort[this.getUTCMonth()];
        }
        getMonthName() {
          return XDate.localeData.months[this.getMonth()];
        }
        getMonthNameAbbrev() {
          return XDate.localeData.monthsShort[this.getMonth()];
        }
        getUTCDayName() {
          return XDate.localeData.days[this.getUTCDay()];
        }
        getUTCDayNameAbbrev() {
          return XDate.localeData.daysShort[this.getUTCDay()];
        }
        getDayName() {
          return XDate.localeData.days[this.getDay()];
        }
        getDayNameAbbrev() {
          return XDate.localeData.daysShort[this.getDay()];
        }
        /** @inheritDoc */
        add(number, unit) {
          let unitNorm = unitMap[unit] || unitMap[unit + "s"];
          if (unitNorm) {
            this["set" + unitNorm](this["get" + unitNorm]() + number);
            return this;
          }
          throw new Error('Invalid unit "' + unit + '": Only ' + Object.keys(unitMap).join(", ") + " are allowed.");
        }
        /** @inheritDoc */
        subtract(number, unit) {
          return this.add(-number, unit);
        }
        /** @inheritDoc */
        format(formatstr, zone = "utc") {
          if (!this.isValid()) {
            return "";
          }
          let udate = this;
          if (!zone || zone === "utc") {
            udate = new XDate(this.getTime()).add(this.getTimezoneOffset(), "minutes");
          } else if (typeof zone === "number") {
            udate = new XDate(this.getTime()).add(this.getTimezoneOffset() + zone, "minutes");
          }
          const pad = function(num) {
            return String(num < 10 ? "0" + num : num);
          };
          const h24 = udate.getHours(), m = udate.getMinutes(), s = udate.getSeconds();
          const D = udate.getDate(), M = udate.getMonth() + 1, Y = udate.getFullYear();
          const h12 = h24 % 12 || 12, amOrPm = h24 >= 12 ? "PM" : "AM";
          const replacementMap = {
            HH: pad(h24),
            H: h24,
            hh: pad(h12),
            h: h12,
            A: amOrPm,
            mm: pad(m),
            m,
            ss: pad(s),
            s,
            dddd: udate.getDayName(),
            ddd: udate.getDayNameAbbrev(),
            d: udate.getDay(),
            DD: pad(D),
            D,
            MMMM: udate.getMonthName(),
            MMM: udate.getMonthNameAbbrev(),
            MM: pad(M),
            M,
            YYYY: Y,
            YY: pad(Y % 100),
            Y
          };
          let unbinder = new wikitext_1.Unbinder(formatstr);
          unbinder.unbind("\\[", "\\]");
          unbinder.text = unbinder.text.replace(
            /* Regex notes:
             * d(d{2,3})? matches exactly 1, 3 or 4 occurrences of 'd' ('dd' is treated as a double match of 'd')
             * Y{1,2}(Y{2})? matches exactly 1, 2 or 4 occurrences of 'Y'
             */
            /H{1,2}|h{1,2}|m{1,2}|s{1,2}|d(d{2,3})?|D{1,2}|M{1,4}|Y{1,2}(Y{2})?|A/g,
            function(match) {
              return replacementMap[match];
            }
          );
          return unbinder.rebind().replace(/\[(.*?)\]/g, "$1");
        }
        /** @inheritDoc */
        calendar(zone = "utc") {
          const dateDiff = ((/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0) - new Date(this).setHours(0, 0, 0, 0)) / 864e5;
          switch (true) {
            case dateDiff === 0:
              return this.format(XDate.localeData.relativeTimes.thisDay, zone);
            case dateDiff === 1:
              return this.format(XDate.localeData.relativeTimes.prevDay, zone);
            case (dateDiff > 0 && dateDiff < 7):
              return this.format(XDate.localeData.relativeTimes.pastWeek, zone);
            case dateDiff === -1:
              return this.format(XDate.localeData.relativeTimes.nextDay, zone);
            case (dateDiff < 0 && dateDiff > -7):
              return this.format(XDate.localeData.relativeTimes.thisWeek, zone);
            default:
              return this.format(XDate.localeData.relativeTimes.other, zone);
          }
        }
        toString() {
          return this.format("D MMMM YYYY, HH:mm:ss (UTC)", "utc");
        }
        /** @inheritDoc */
        static async populateLocaleData(lang) {
          const monthsKeys = "january|february|march|april|may_long|june|july|august|september|october|november|december".split("|");
          const monthsShortKeys = "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec".split("|");
          const daysKeys = "sunday|monday|tuesday|wednesday|thursday|friday|saturday".split("|");
          const daysShortKeys = "sun|mon|tue|wed|thu|fri|sat".split("|");
          const messages = await bot.getMessages([...monthsKeys, ...monthsShortKeys, ...daysKeys, ...daysShortKeys], {
            amlang: lang || "content"
          });
          this.localeData.months = monthsKeys.map((key) => messages[key]);
          this.localeData.monthsShort = monthsShortKeys.map((key) => messages[key]);
          this.localeData.days = daysKeys.map((key) => messages[key]);
          this.localeData.daysShort = daysShortKeys.map((key) => messages[key]);
        }
        /** @inheritDoc */
        static getMonthName(monthNum) {
          return XDate.localeData.months[monthNum - 1];
        }
        /** @inheritDoc */
        static getMonthNameAbbrev(monthNum) {
          return XDate.localeData.monthsShort[monthNum - 1];
        }
        /** @inheritDoc */
        static getDayName(dayNum) {
          return XDate.localeData.days[dayNum - 1];
        }
        /** @inheritDoc */
        static getDayNameAbbrev(dayNum) {
          return XDate.localeData.daysShort[dayNum - 1];
        }
      }
      XDate.localeData = {
        months: [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December"
        ],
        monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        relativeTimes: {
          thisDay: "[Today at] h:mm A",
          prevDay: "[Yesterday at] h:mm A",
          nextDay: "[Tomorrow at] h:mm A",
          thisWeek: "dddd [at] h:mm A",
          pastWeek: "[Last] dddd [at] h:mm A",
          other: "YYYY-MM-DD"
        }
      };
      return XDate;
    }
    var unitMap = {
      seconds: "Seconds",
      minutes: "Minutes",
      hours: "Hours",
      days: "Date",
      months: "Month",
      years: "FullYear"
    };
  }
});

// node_modules/mwn/build/title.js
var require_title = __commonJS({
  "node_modules/mwn/build/title.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = default_1;
    function default_1() {
      let NS_MAIN = 0;
      let NS_TALK = 1;
      let NS_SPECIAL = -1;
      class Title {
        static processNamespaceData(json) {
          let namespaceNorm = (ns) => (ns || "").toLowerCase().replace(/ /g, "_");
          Title.idNameMap = {};
          Title.nameIdMap = {};
          Object.values(json.query.namespaces).forEach((ns) => {
            Title.idNameMap[ns.id] = ns.name;
            Title.nameIdMap[namespaceNorm(ns.name)] = ns.id;
            Title.nameIdMap[namespaceNorm(ns.canonical)] = ns.id;
          });
          json.query.namespacealiases.forEach((ns) => {
            Title.nameIdMap[namespaceNorm(ns.alias)] = ns.id;
          });
          Title.legaltitlechars = json.query.general.legaltitlechars;
          Title.caseSensitiveNamespaces = Object.values(json.query.namespaces).filter((ns) => ns.case === "case-sensitive").map((ns) => ns.id);
        }
        static checkData() {
          if (!Title.nameIdMap || !Title.idNameMap || !Title.legaltitlechars) {
            throw new Error("namespace data unavailable: run getSiteInfo() or login() first on the mwn object");
          }
        }
        constructor(title, namespace) {
          let parsed = parse(title, namespace);
          if (!parsed) {
            throw new Error("Unable to parse title");
          }
          this.namespace = parsed.namespace;
          this.title = parsed.title;
          this.fragment = parsed.fragment;
        }
        /** @inheritDoc */
        getNamespaceId() {
          return this.namespace;
        }
        /** @inheritDoc */
        getNamespacePrefix() {
          return getNamespacePrefix(this.namespace);
        }
        /** @inheritDoc */
        getMain() {
          if (Title.caseSensitiveNamespaces.indexOf(this.namespace) !== -1 || !this.title.length) {
            return this.title;
          }
          return Title.phpCharToUpper(this.title[0]) + this.title.slice(1);
        }
        /** @inheritDoc */
        getMainText() {
          return this.getMain().replace(/_/g, " ");
        }
        /** @inheritDoc */
        getPrefixedDb() {
          return this.getNamespacePrefix() + this.getMain();
        }
        /** @inheritDoc */
        getPrefixedText() {
          return this.getPrefixedDb().replace(/_/g, " ");
        }
        /** @inheritDoc */
        getFragment() {
          return this.fragment;
        }
        /** @inheritDoc */
        isTalkPage() {
          return Title.isTalkNamespace(this.getNamespaceId());
        }
        /** @inheritDoc */
        getTalkPage() {
          if (!this.canHaveTalkPage()) {
            return null;
          }
          return this.isTalkPage() ? this : Title.makeTitle(this.getNamespaceId() + 1, this.getMainText());
        }
        /** @inheritDoc */
        getSubjectPage() {
          return this.isTalkPage() ? Title.makeTitle(this.getNamespaceId() - 1, this.getMainText()) : this;
        }
        /** @inheritDoc */
        canHaveTalkPage() {
          return this.getNamespaceId() >= NS_MAIN;
        }
        /** @inheritDoc */
        getExtension() {
          let lastDot = this.title.lastIndexOf(".");
          if (lastDot === -1) {
            return null;
          }
          return this.title.slice(lastDot + 1) || null;
        }
        /** @inheritDoc */
        getDotExtension() {
          let ext = this.getExtension();
          return ext === null ? "" : "." + ext;
        }
        /**
         * Constructor for Title objects with a null return instead of an exception for invalid titles.
         *
         * Note that `namespace` is the **default** namespace only, and can be overridden by a namespace
         * prefix in `title`. If you do not want this behavior, use #makeTitle. See #constructor for
         * details.
         * @return {Title|null} A valid Title object or null if the title is invalid
         */
        static newFromText(title, namespace = 0) {
          let t, parsed = parse(title, namespace);
          if (!parsed) {
            return null;
          }
          t = Object.create(Title.prototype);
          t.namespace = parsed.namespace;
          t.title = parsed.title;
          t.fragment = parsed.fragment;
          return t;
        }
        /**
         * Constructor for Title objects with predefined namespace.
         *
         * Unlike #newFromText or #constructor, this function doesn't allow the given `namespace` to be
         * overridden by a namespace prefix in `title`. See #constructor for details about this behavior.
         *
         * The single exception to this is when `namespace` is 0, indicating the main namespace. The
         * function behaves like #newFromText in that case.
         * @return {Title|null} A valid Title object or null if the title is invalid
         */
        static makeTitle(namespace, title) {
          return Title.newFromText(getNamespacePrefix(namespace) + title);
        }
        /**
         * Check if a given namespace is a talk namespace
         */
        static isTalkNamespace(namespaceId) {
          return !!(namespaceId > NS_MAIN && namespaceId % 2);
        }
        /**
         * PHP's strtoupper differs from String.toUpperCase in a number of cases (T147646).
         *
         * @param {string} chr Unicode character
         * @return {string} Unicode character, in upper case, according to the same rules as in PHP
         */
        static phpCharToUpper(chr) {
          if (toUpperMap[chr] === "") {
            return chr;
          }
          return toUpperMap[chr] || chr.toUpperCase();
        }
        /** @inheritDoc */
        toString() {
          return this.getPrefixedDb();
        }
        /** @inheritDoc */
        toText() {
          return this.getPrefixedText();
        }
      }
      let parse = function(title, defaultNamespace) {
        Title.checkData();
        let namespace, m, id, i, fragment;
        let rUnicodeBidi = /[\u200E\u200F\u202A-\u202E]+/g, rWhitespace = /[ _\u00A0\u1680\u180E\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]+/g, rUnderscoreTrim = /^_+|_+$/g, rSplit = /^(.+?)_*:_*(.*)$/, rInvalid = new RegExp("[^ %!\"$&'()*,\\-./0-9:;=?@A-Z\\\\\\^_`a-z~+\\u0080-\\uFFFF]|%[\\dA-Fa-f]{2}|&[\\dA-Za-z\x80-\uFFFF]+;|&#\\d+;|&#x[\\dA-Fa-f]+;");
        namespace = defaultNamespace === void 0 ? NS_MAIN : defaultNamespace;
        title = title.replace(rUnicodeBidi, "").replace(rWhitespace, "_").replace(rUnderscoreTrim, "");
        if (title !== "" && title[0] === ":") {
          namespace = NS_MAIN;
          title = title.slice(1).replace(rUnderscoreTrim, "");
        }
        if (title === "") {
          return false;
        }
        m = title.match(rSplit);
        if (m) {
          id = getNsIdByName(m[1]);
          if (id !== false) {
            namespace = id;
            title = m[2];
            if (namespace === NS_TALK && (m = title.match(rSplit))) {
              if (getNsIdByName(m[1]) !== false) {
                return false;
              }
            }
          }
        }
        i = title.indexOf("#");
        if (i === -1) {
          fragment = null;
        } else {
          fragment = title.slice(i + 1).replace(/_/g, " ");
          title = title.slice(0, i).replace(rUnderscoreTrim, "");
        }
        if (rInvalid.test(title)) {
          return false;
        }
        if (title.indexOf(".") !== -1 && (title === "." || title === ".." || title.indexOf("./") === 0 || title.indexOf("../") === 0 || title.indexOf("/./") !== -1 || title.indexOf("/../") !== -1 || title.slice(-2) === "/." || title.slice(-3) === "/..")) {
          return false;
        }
        if (title.indexOf("~~~") !== -1) {
          return false;
        }
        if (namespace !== NS_SPECIAL && byteLength(title) > 255) {
          return false;
        }
        if (title === "" && namespace !== NS_MAIN) {
          return false;
        }
        if (title[0] === ":") {
          return false;
        }
        return {
          namespace,
          title,
          fragment
        };
      };
      let getNamespacePrefix = function(namespace) {
        return namespace === NS_MAIN ? "" : Title.idNameMap[namespace].replace(/ /g, "_") + ":";
      };
      let getNsIdByName = function(ns) {
        let id;
        if (typeof ns !== "string") {
          return false;
        }
        id = Title.nameIdMap[ns.toLowerCase()];
        if (id === void 0) {
          return false;
        }
        return id;
      };
      let byteLength = function(str) {
        return str.replace(/[\u0080-\u07FF\uD800-\uDFFF]/g, "**").replace(/[\u0800-\uD7FF\uE000-\uFFFF]/g, "***").length;
      };
      let toUpperMap = {
        "\xDF": "",
        "\u0149": "",
        "\u0180": "",
        "\u019A": "",
        "\u01C5": "",
        "\u01C6": "\u01C5",
        "\u01C8": "",
        "\u01C9": "\u01C8",
        "\u01CB": "",
        "\u01CC": "\u01CB",
        "\u01F0": "",
        "\u01F2": "",
        "\u01F3": "\u01F2",
        "\u023C": "",
        "\u023F": "",
        "\u0240": "",
        "\u0242": "",
        "\u0247": "",
        "\u0249": "",
        "\u024B": "",
        "\u024D": "",
        "\u024F": "",
        "\u0250": "",
        "\u0251": "",
        "\u0252": "",
        "\u025C": "",
        "\u0261": "",
        "\u0265": "",
        "\u0266": "",
        "\u026A": "",
        "\u026B": "",
        "\u026C": "",
        "\u0271": "",
        "\u027D": "",
        "\u0282": "",
        "\u0287": "",
        "\u0289": "",
        "\u028C": "",
        "\u029D": "",
        "\u029E": "",
        "\u0345": "",
        "\u0371": "",
        "\u0373": "",
        "\u0377": "",
        "\u037B": "",
        "\u037C": "",
        "\u037D": "",
        "\u0390": "",
        "\u03B0": "",
        "\u03D7": "",
        "\u03F2": "\u03A3",
        "\u03F3": "",
        "\u03F8": "",
        "\u03FB": "",
        "\u04CF": "",
        "\u04F7": "",
        "\u04FB": "",
        "\u04FD": "",
        "\u04FF": "",
        "\u0511": "",
        "\u0513": "",
        "\u0515": "",
        "\u0517": "",
        "\u0519": "",
        "\u051B": "",
        "\u051D": "",
        "\u051F": "",
        "\u0521": "",
        "\u0523": "",
        "\u0525": "",
        "\u0527": "",
        "\u0529": "",
        "\u052B": "",
        "\u052D": "",
        "\u052F": "",
        "\u0587": "",
        "\u10D0": "",
        "\u10D1": "",
        "\u10D2": "",
        "\u10D3": "",
        "\u10D4": "",
        "\u10D5": "",
        "\u10D6": "",
        "\u10D7": "",
        "\u10D8": "",
        "\u10D9": "",
        "\u10DA": "",
        "\u10DB": "",
        "\u10DC": "",
        "\u10DD": "",
        "\u10DE": "",
        "\u10DF": "",
        "\u10E0": "",
        "\u10E1": "",
        "\u10E2": "",
        "\u10E3": "",
        "\u10E4": "",
        "\u10E5": "",
        "\u10E6": "",
        "\u10E7": "",
        "\u10E8": "",
        "\u10E9": "",
        "\u10EA": "",
        "\u10EB": "",
        "\u10EC": "",
        "\u10ED": "",
        "\u10EE": "",
        "\u10EF": "",
        "\u10F0": "",
        "\u10F1": "",
        "\u10F2": "",
        "\u10F3": "",
        "\u10F4": "",
        "\u10F5": "",
        "\u10F6": "",
        "\u10F7": "",
        "\u10F8": "",
        "\u10F9": "",
        "\u10FA": "",
        "\u10FD": "",
        "\u10FE": "",
        "\u10FF": "",
        "\u13F8": "",
        "\u13F9": "",
        "\u13FA": "",
        "\u13FB": "",
        "\u13FC": "",
        "\u13FD": "",
        "\u1C80": "",
        "\u1C81": "",
        "\u1C82": "",
        "\u1C83": "",
        "\u1C84": "",
        "\u1C85": "",
        "\u1C86": "",
        "\u1C87": "",
        "\u1C88": "",
        "\u1D79": "",
        "\u1D7D": "",
        "\u1D8E": "",
        "\u1E96": "",
        "\u1E97": "",
        "\u1E98": "",
        "\u1E99": "",
        "\u1E9A": "",
        "\u1EFB": "",
        "\u1EFD": "",
        "\u1EFF": "",
        "\u1F50": "",
        "\u1F52": "",
        "\u1F54": "",
        "\u1F56": "",
        "\u1F80": "\u1F88",
        "\u1F81": "\u1F89",
        "\u1F82": "\u1F8A",
        "\u1F83": "\u1F8B",
        "\u1F84": "\u1F8C",
        "\u1F85": "\u1F8D",
        "\u1F86": "\u1F8E",
        "\u1F87": "\u1F8F",
        "\u1F88": "",
        "\u1F89": "",
        "\u1F8A": "",
        "\u1F8B": "",
        "\u1F8C": "",
        "\u1F8D": "",
        "\u1F8E": "",
        "\u1F8F": "",
        "\u1F90": "\u1F98",
        "\u1F91": "\u1F99",
        "\u1F92": "\u1F9A",
        "\u1F93": "\u1F9B",
        "\u1F94": "\u1F9C",
        "\u1F95": "\u1F9D",
        "\u1F96": "\u1F9E",
        "\u1F97": "\u1F9F",
        "\u1F98": "",
        "\u1F99": "",
        "\u1F9A": "",
        "\u1F9B": "",
        "\u1F9C": "",
        "\u1F9D": "",
        "\u1F9E": "",
        "\u1F9F": "",
        "\u1FA0": "\u1FA8",
        "\u1FA1": "\u1FA9",
        "\u1FA2": "\u1FAA",
        "\u1FA3": "\u1FAB",
        "\u1FA4": "\u1FAC",
        "\u1FA5": "\u1FAD",
        "\u1FA6": "\u1FAE",
        "\u1FA7": "\u1FAF",
        "\u1FA8": "",
        "\u1FA9": "",
        "\u1FAA": "",
        "\u1FAB": "",
        "\u1FAC": "",
        "\u1FAD": "",
        "\u1FAE": "",
        "\u1FAF": "",
        "\u1FB2": "",
        "\u1FB3": "\u1FBC",
        "\u1FB4": "",
        "\u1FB6": "",
        "\u1FB7": "",
        "\u1FBC": "",
        "\u1FC2": "",
        "\u1FC3": "\u1FCC",
        "\u1FC4": "",
        "\u1FC6": "",
        "\u1FC7": "",
        "\u1FCC": "",
        "\u1FD2": "",
        "\u1FD3": "",
        "\u1FD6": "",
        "\u1FD7": "",
        "\u1FE2": "",
        "\u1FE3": "",
        "\u1FE4": "",
        "\u1FE6": "",
        "\u1FE7": "",
        "\u1FF2": "",
        "\u1FF3": "\u1FFC",
        "\u1FF4": "",
        "\u1FF6": "",
        "\u1FF7": "",
        "\u1FFC": "",
        "\u214E": "",
        "\u2170": "",
        "\u2171": "",
        "\u2172": "",
        "\u2173": "",
        "\u2174": "",
        "\u2175": "",
        "\u2176": "",
        "\u2177": "",
        "\u2178": "",
        "\u2179": "",
        "\u217A": "",
        "\u217B": "",
        "\u217C": "",
        "\u217D": "",
        "\u217E": "",
        "\u217F": "",
        "\u2184": "",
        "\u24D0": "",
        "\u24D1": "",
        "\u24D2": "",
        "\u24D3": "",
        "\u24D4": "",
        "\u24D5": "",
        "\u24D6": "",
        "\u24D7": "",
        "\u24D8": "",
        "\u24D9": "",
        "\u24DA": "",
        "\u24DB": "",
        "\u24DC": "",
        "\u24DD": "",
        "\u24DE": "",
        "\u24DF": "",
        "\u24E0": "",
        "\u24E1": "",
        "\u24E2": "",
        "\u24E3": "",
        "\u24E4": "",
        "\u24E5": "",
        "\u24E6": "",
        "\u24E7": "",
        "\u24E8": "",
        "\u24E9": "",
        "\u2C30": "",
        "\u2C31": "",
        "\u2C32": "",
        "\u2C33": "",
        "\u2C34": "",
        "\u2C35": "",
        "\u2C36": "",
        "\u2C37": "",
        "\u2C38": "",
        "\u2C39": "",
        "\u2C3A": "",
        "\u2C3B": "",
        "\u2C3C": "",
        "\u2C3D": "",
        "\u2C3E": "",
        "\u2C3F": "",
        "\u2C40": "",
        "\u2C41": "",
        "\u2C42": "",
        "\u2C43": "",
        "\u2C44": "",
        "\u2C45": "",
        "\u2C46": "",
        "\u2C47": "",
        "\u2C48": "",
        "\u2C49": "",
        "\u2C4A": "",
        "\u2C4B": "",
        "\u2C4C": "",
        "\u2C4D": "",
        "\u2C4E": "",
        "\u2C4F": "",
        "\u2C50": "",
        "\u2C51": "",
        "\u2C52": "",
        "\u2C53": "",
        "\u2C54": "",
        "\u2C55": "",
        "\u2C56": "",
        "\u2C57": "",
        "\u2C58": "",
        "\u2C59": "",
        "\u2C5A": "",
        "\u2C5B": "",
        "\u2C5C": "",
        "\u2C5D": "",
        "\u2C5E": "",
        "\u2C61": "",
        "\u2C65": "",
        "\u2C66": "",
        "\u2C68": "",
        "\u2C6A": "",
        "\u2C6C": "",
        "\u2C73": "",
        "\u2C76": "",
        "\u2C81": "",
        "\u2C83": "",
        "\u2C85": "",
        "\u2C87": "",
        "\u2C89": "",
        "\u2C8B": "",
        "\u2C8D": "",
        "\u2C8F": "",
        "\u2C91": "",
        "\u2C93": "",
        "\u2C95": "",
        "\u2C97": "",
        "\u2C99": "",
        "\u2C9B": "",
        "\u2C9D": "",
        "\u2C9F": "",
        "\u2CA1": "",
        "\u2CA3": "",
        "\u2CA5": "",
        "\u2CA7": "",
        "\u2CA9": "",
        "\u2CAB": "",
        "\u2CAD": "",
        "\u2CAF": "",
        "\u2CB1": "",
        "\u2CB3": "",
        "\u2CB5": "",
        "\u2CB7": "",
        "\u2CB9": "",
        "\u2CBB": "",
        "\u2CBD": "",
        "\u2CBF": "",
        "\u2CC1": "",
        "\u2CC3": "",
        "\u2CC5": "",
        "\u2CC7": "",
        "\u2CC9": "",
        "\u2CCB": "",
        "\u2CCD": "",
        "\u2CCF": "",
        "\u2CD1": "",
        "\u2CD3": "",
        "\u2CD5": "",
        "\u2CD7": "",
        "\u2CD9": "",
        "\u2CDB": "",
        "\u2CDD": "",
        "\u2CDF": "",
        "\u2CE1": "",
        "\u2CE3": "",
        "\u2CEC": "",
        "\u2CEE": "",
        "\u2CF3": "",
        "\u2D00": "",
        "\u2D01": "",
        "\u2D02": "",
        "\u2D03": "",
        "\u2D04": "",
        "\u2D05": "",
        "\u2D06": "",
        "\u2D07": "",
        "\u2D08": "",
        "\u2D09": "",
        "\u2D0A": "",
        "\u2D0B": "",
        "\u2D0C": "",
        "\u2D0D": "",
        "\u2D0E": "",
        "\u2D0F": "",
        "\u2D10": "",
        "\u2D11": "",
        "\u2D12": "",
        "\u2D13": "",
        "\u2D14": "",
        "\u2D15": "",
        "\u2D16": "",
        "\u2D17": "",
        "\u2D18": "",
        "\u2D19": "",
        "\u2D1A": "",
        "\u2D1B": "",
        "\u2D1C": "",
        "\u2D1D": "",
        "\u2D1E": "",
        "\u2D1F": "",
        "\u2D20": "",
        "\u2D21": "",
        "\u2D22": "",
        "\u2D23": "",
        "\u2D24": "",
        "\u2D25": "",
        "\u2D27": "",
        "\u2D2D": "",
        "\uA641": "",
        "\uA643": "",
        "\uA645": "",
        "\uA647": "",
        "\uA649": "",
        "\uA64B": "",
        "\uA64D": "",
        "\uA64F": "",
        "\uA651": "",
        "\uA653": "",
        "\uA655": "",
        "\uA657": "",
        "\uA659": "",
        "\uA65B": "",
        "\uA65D": "",
        "\uA65F": "",
        "\uA661": "",
        "\uA663": "",
        "\uA665": "",
        "\uA667": "",
        "\uA669": "",
        "\uA66B": "",
        "\uA66D": "",
        "\uA681": "",
        "\uA683": "",
        "\uA685": "",
        "\uA687": "",
        "\uA689": "",
        "\uA68B": "",
        "\uA68D": "",
        "\uA68F": "",
        "\uA691": "",
        "\uA693": "",
        "\uA695": "",
        "\uA697": "",
        "\uA699": "",
        "\uA69B": "",
        "\uA723": "",
        "\uA725": "",
        "\uA727": "",
        "\uA729": "",
        "\uA72B": "",
        "\uA72D": "",
        "\uA72F": "",
        "\uA733": "",
        "\uA735": "",
        "\uA737": "",
        "\uA739": "",
        "\uA73B": "",
        "\uA73D": "",
        "\uA73F": "",
        "\uA741": "",
        "\uA743": "",
        "\uA745": "",
        "\uA747": "",
        "\uA749": "",
        "\uA74B": "",
        "\uA74D": "",
        "\uA74F": "",
        "\uA751": "",
        "\uA753": "",
        "\uA755": "",
        "\uA757": "",
        "\uA759": "",
        "\uA75B": "",
        "\uA75D": "",
        "\uA75F": "",
        "\uA761": "",
        "\uA763": "",
        "\uA765": "",
        "\uA767": "",
        "\uA769": "",
        "\uA76B": "",
        "\uA76D": "",
        "\uA76F": "",
        "\uA77A": "",
        "\uA77C": "",
        "\uA77F": "",
        "\uA781": "",
        "\uA783": "",
        "\uA785": "",
        "\uA787": "",
        "\uA78C": "",
        "\uA791": "",
        "\uA793": "",
        "\uA794": "",
        "\uA797": "",
        "\uA799": "",
        "\uA79B": "",
        "\uA79D": "",
        "\uA79F": "",
        "\uA7A1": "",
        "\uA7A3": "",
        "\uA7A5": "",
        "\uA7A7": "",
        "\uA7A9": "",
        "\uA7B5": "",
        "\uA7B7": "",
        "\uA7B9": "",
        "\uA7BB": "",
        "\uA7BD": "",
        "\uA7BF": "",
        "\uA7C3": "",
        "\uAB53": "",
        "\uAB70": "",
        "\uAB71": "",
        "\uAB72": "",
        "\uAB73": "",
        "\uAB74": "",
        "\uAB75": "",
        "\uAB76": "",
        "\uAB77": "",
        "\uAB78": "",
        "\uAB79": "",
        "\uAB7A": "",
        "\uAB7B": "",
        "\uAB7C": "",
        "\uAB7D": "",
        "\uAB7E": "",
        "\uAB7F": "",
        "\uAB80": "",
        "\uAB81": "",
        "\uAB82": "",
        "\uAB83": "",
        "\uAB84": "",
        "\uAB85": "",
        "\uAB86": "",
        "\uAB87": "",
        "\uAB88": "",
        "\uAB89": "",
        "\uAB8A": "",
        "\uAB8B": "",
        "\uAB8C": "",
        "\uAB8D": "",
        "\uAB8E": "",
        "\uAB8F": "",
        "\uAB90": "",
        "\uAB91": "",
        "\uAB92": "",
        "\uAB93": "",
        "\uAB94": "",
        "\uAB95": "",
        "\uAB96": "",
        "\uAB97": "",
        "\uAB98": "",
        "\uAB99": "",
        "\uAB9A": "",
        "\uAB9B": "",
        "\uAB9C": "",
        "\uAB9D": "",
        "\uAB9E": "",
        "\uAB9F": "",
        "\uABA0": "",
        "\uABA1": "",
        "\uABA2": "",
        "\uABA3": "",
        "\uABA4": "",
        "\uABA5": "",
        "\uABA6": "",
        "\uABA7": "",
        "\uABA8": "",
        "\uABA9": "",
        "\uABAA": "",
        "\uABAB": "",
        "\uABAC": "",
        "\uABAD": "",
        "\uABAE": "",
        "\uABAF": "",
        "\uABB0": "",
        "\uABB1": "",
        "\uABB2": "",
        "\uABB3": "",
        "\uABB4": "",
        "\uABB5": "",
        "\uABB6": "",
        "\uABB7": "",
        "\uABB8": "",
        "\uABB9": "",
        "\uABBA": "",
        "\uABBB": "",
        "\uABBC": "",
        "\uABBD": "",
        "\uABBE": "",
        "\uABBF": "",
        "\uFB00": "",
        "\uFB01": "",
        "\uFB02": "",
        "\uFB03": "",
        "\uFB04": "",
        "\uFB05": "",
        "\uFB06": "",
        "\uFB13": "",
        "\uFB14": "",
        "\uFB15": "",
        "\uFB16": "",
        "\uFB17": "",
        "\u{1044E}": "",
        "\u{1044F}": "",
        "\u{104D8}": "",
        "\u{104D9}": "",
        "\u{104DA}": "",
        "\u{104DB}": "",
        "\u{104DC}": "",
        "\u{104DD}": "",
        "\u{104DE}": "",
        "\u{104DF}": "",
        "\u{104E0}": "",
        "\u{104E1}": "",
        "\u{104E2}": "",
        "\u{104E3}": "",
        "\u{104E4}": "",
        "\u{104E5}": "",
        "\u{104E6}": "",
        "\u{104E7}": "",
        "\u{104E8}": "",
        "\u{104E9}": "",
        "\u{104EA}": "",
        "\u{104EB}": "",
        "\u{104EC}": "",
        "\u{104ED}": "",
        "\u{104EE}": "",
        "\u{104EF}": "",
        "\u{104F0}": "",
        "\u{104F1}": "",
        "\u{104F2}": "",
        "\u{104F3}": "",
        "\u{104F4}": "",
        "\u{104F5}": "",
        "\u{104F6}": "",
        "\u{104F7}": "",
        "\u{104F8}": "",
        "\u{104F9}": "",
        "\u{104FA}": "",
        "\u{104FB}": "",
        "\u{10CC0}": "",
        "\u{10CC1}": "",
        "\u{10CC2}": "",
        "\u{10CC3}": "",
        "\u{10CC4}": "",
        "\u{10CC5}": "",
        "\u{10CC6}": "",
        "\u{10CC7}": "",
        "\u{10CC8}": "",
        "\u{10CC9}": "",
        "\u{10CCA}": "",
        "\u{10CCB}": "",
        "\u{10CCC}": "",
        "\u{10CCD}": "",
        "\u{10CCE}": "",
        "\u{10CCF}": "",
        "\u{10CD0}": "",
        "\u{10CD1}": "",
        "\u{10CD2}": "",
        "\u{10CD3}": "",
        "\u{10CD4}": "",
        "\u{10CD5}": "",
        "\u{10CD6}": "",
        "\u{10CD7}": "",
        "\u{10CD8}": "",
        "\u{10CD9}": "",
        "\u{10CDA}": "",
        "\u{10CDB}": "",
        "\u{10CDC}": "",
        "\u{10CDD}": "",
        "\u{10CDE}": "",
        "\u{10CDF}": "",
        "\u{10CE0}": "",
        "\u{10CE1}": "",
        "\u{10CE2}": "",
        "\u{10CE3}": "",
        "\u{10CE4}": "",
        "\u{10CE5}": "",
        "\u{10CE6}": "",
        "\u{10CE7}": "",
        "\u{10CE8}": "",
        "\u{10CE9}": "",
        "\u{10CEA}": "",
        "\u{10CEB}": "",
        "\u{10CEC}": "",
        "\u{10CED}": "",
        "\u{10CEE}": "",
        "\u{10CEF}": "",
        "\u{10CF0}": "",
        "\u{10CF1}": "",
        "\u{10CF2}": "",
        "\u{118C0}": "",
        "\u{118C1}": "",
        "\u{118C2}": "",
        "\u{118C3}": "",
        "\u{118C4}": "",
        "\u{118C5}": "",
        "\u{118C6}": "",
        "\u{118C7}": "",
        "\u{118C8}": "",
        "\u{118C9}": "",
        "\u{118CA}": "",
        "\u{118CB}": "",
        "\u{118CC}": "",
        "\u{118CD}": "",
        "\u{118CE}": "",
        "\u{118CF}": "",
        "\u{118D0}": "",
        "\u{118D1}": "",
        "\u{118D2}": "",
        "\u{118D3}": "",
        "\u{118D4}": "",
        "\u{118D5}": "",
        "\u{118D6}": "",
        "\u{118D7}": "",
        "\u{118D8}": "",
        "\u{118D9}": "",
        "\u{118DA}": "",
        "\u{118DB}": "",
        "\u{118DC}": "",
        "\u{118DD}": "",
        "\u{118DE}": "",
        "\u{118DF}": "",
        "\u{16E60}": "",
        "\u{16E61}": "",
        "\u{16E62}": "",
        "\u{16E63}": "",
        "\u{16E64}": "",
        "\u{16E65}": "",
        "\u{16E66}": "",
        "\u{16E67}": "",
        "\u{16E68}": "",
        "\u{16E69}": "",
        "\u{16E6A}": "",
        "\u{16E6B}": "",
        "\u{16E6C}": "",
        "\u{16E6D}": "",
        "\u{16E6E}": "",
        "\u{16E6F}": "",
        "\u{16E70}": "",
        "\u{16E71}": "",
        "\u{16E72}": "",
        "\u{16E73}": "",
        "\u{16E74}": "",
        "\u{16E75}": "",
        "\u{16E76}": "",
        "\u{16E77}": "",
        "\u{16E78}": "",
        "\u{16E79}": "",
        "\u{16E7A}": "",
        "\u{16E7B}": "",
        "\u{16E7C}": "",
        "\u{16E7D}": "",
        "\u{16E7E}": "",
        "\u{16E7F}": "",
        "\u{1E922}": "",
        "\u{1E923}": "",
        "\u{1E924}": "",
        "\u{1E925}": "",
        "\u{1E926}": "",
        "\u{1E927}": "",
        "\u{1E928}": "",
        "\u{1E929}": "",
        "\u{1E92A}": "",
        "\u{1E92B}": "",
        "\u{1E92C}": "",
        "\u{1E92D}": "",
        "\u{1E92E}": "",
        "\u{1E92F}": "",
        "\u{1E930}": "",
        "\u{1E931}": "",
        "\u{1E932}": "",
        "\u{1E933}": "",
        "\u{1E934}": "",
        "\u{1E935}": "",
        "\u{1E936}": "",
        "\u{1E937}": "",
        "\u{1E938}": "",
        "\u{1E939}": "",
        "\u{1E93A}": "",
        "\u{1E93B}": "",
        "\u{1E93C}": "",
        "\u{1E93D}": "",
        "\u{1E93E}": "",
        "\u{1E93F}": "",
        "\u{1E940}": "",
        "\u{1E941}": "",
        "\u{1E942}": "",
        "\u{1E943}": ""
      };
      return Title;
    }
  }
});

// node_modules/mwn/build/error.js
var require_error = __commonJS({
  "node_modules/mwn/build/error.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MwnMissingPageError = exports.MwnError = void 0;
    exports.rejectWithErrorCode = rejectWithErrorCode;
    exports.rejectWithError = rejectWithError;
    var MwnError = class extends Error {
      /**
       * @param {Object} config
       */
      constructor(config) {
        if (config instanceof Error) {
          return config;
        }
        const code = !config.code || config.code.startsWith("mwn") ? "" : config.code + ": ";
        const info = config.info || config.text || config.html || "";
        super(code + info);
        Object.assign(this, config);
        this.info = info;
      }
    };
    exports.MwnError = MwnError;
    var MwnMissingPageError = class extends MwnError {
      constructor(config = {}) {
        super({
          code: "missingtitle",
          info: "The page you specified doesn't exist.",
          ...config
        });
      }
    };
    exports.MwnMissingPageError = MwnMissingPageError;
    function rejectWithErrorCode(errorCode) {
      return rejectWithError({
        code: errorCode
      });
    }
    function rejectWithError(errorConfig) {
      return Promise.reject(new MwnError(errorConfig));
    }
  }
});

// node_modules/mwn/build/page.js
var require_page = __commonJS({
  "node_modules/mwn/build/page.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = default_1;
    var error_1 = require_error();
    function default_1(bot) {
      class Page extends bot.Title {
        constructor(title, namespace) {
          if (typeof title === "string") {
            super(title, namespace);
          } else if (title.title && title.namespace) {
            super(title.title, title.namespace);
          } else {
            throw new Error("unknown constructor type for mwn Page");
          }
        }
        /**
         * @override
         */
        getTalkPage() {
          return new Page(super.getTalkPage());
        }
        /**
         * @override
         */
        getSubjectPage() {
          return new Page(super.getSubjectPage());
        }
        /**** Get operations *****/
        /** @inheritDoc */
        exists() {
          return bot.query({
            titles: this.toString()
          }).then((data) => {
            return data.query.pages[0].missing !== true;
          });
        }
        /** @inheritDoc */
        text() {
          return bot.query({
            titles: this.toString(),
            prop: "revisions",
            rvprop: "content",
            rvslots: "main"
          }).then((data) => {
            this.throwIfPageMissing(data);
            return data.query.pages[0].revisions[0].slots.main.content;
          });
        }
        /** @inheritDoc */
        categories() {
          return bot.query({
            titles: this.toString(),
            prop: "categories",
            cllimit: "max"
          }).then((data) => {
            this.throwIfPageMissing(data);
            return data.query.pages[0].categories.map((e) => e.title);
          });
        }
        /** @inheritDoc */
        templates() {
          return bot.query({
            titles: this.toString(),
            prop: "templates",
            tllimit: "max"
          }).then((data) => {
            this.throwIfPageMissing(data);
            return data.query.pages[0].templates.map((e) => e.title);
          });
        }
        /** @inheritDoc */
        links() {
          return bot.query({
            titles: this.toString(),
            prop: "links",
            pllimit: "max"
          }).then((data) => {
            this.throwIfPageMissing(data);
            return data.query.pages[0].links.map((e) => e.title);
          });
        }
        /** @inheritDoc */
        backlinks() {
          return bot.continuedQuery({
            action: "query",
            prop: "linkshere",
            titles: this.toString(),
            lhprop: "title",
            lhlimit: "max"
          }).then((jsons) => {
            let pages = jsons.reduce((pages2, json) => pages2.concat(json.query.pages), []);
            return (pages[0].linkshere || []).map((pg) => pg.title);
          });
        }
        /** @inheritDoc */
        transclusions() {
          return bot.continuedQuery({
            action: "query",
            prop: "transcludedin",
            titles: this.toString(),
            tiprop: "title",
            tilimit: "max"
          }).then((jsons) => {
            let pages = jsons.reduce((pages2, json) => pages2.concat(json.query.pages), []);
            return (pages[0].transcludedin || []).map((pg) => pg.title);
          });
        }
        /** @inheritDoc */
        images() {
          return bot.query({
            titles: this.toString(),
            prop: "images",
            imlimit: "max"
          }).then((data) => {
            this.throwIfPageMissing(data);
            return data.query.pages[0].images.map((e) => e.title);
          });
        }
        /** @inheritDoc */
        externallinks() {
          return bot.query({
            titles: this.toString(),
            prop: "extlinks",
            ellimit: "max"
          }).then((data) => {
            this.throwIfPageMissing(data);
            return data.query.pages[0].extlinks.map((e) => e.url);
          });
        }
        /** @inheritDoc */
        subpages(options) {
          return bot.query({
            list: "allpages",
            apprefix: this.title + "/",
            apnamespace: this.namespace,
            aplimit: "max",
            ...options
          }).then((data) => {
            return data.query.allpages.map((pg) => pg.title);
          });
        }
        /** @inheritDoc */
        isRedirect() {
          return this.getRedirectTarget().then((target) => {
            return this.toText() !== target;
          });
        }
        /** @inheritDoc */
        getRedirectTarget() {
          return bot.query({
            titles: this.toString(),
            redirects: true
          }).then((data) => {
            this.throwIfPageMissing(data);
            return data.query.pages[0].title;
          });
        }
        /** @inheritDoc */
        getCreator() {
          return bot.query({
            titles: this.toString(),
            prop: "revisions",
            rvprop: "user",
            rvlimit: 1,
            rvdir: "newer"
          }).then((data) => {
            this.throwIfPageMissing(data);
            return data.query.pages[0].revisions[0].user;
          });
        }
        /** @inheritDoc */
        getDeletingAdmin() {
          return bot.request({
            action: "query",
            list: "logevents",
            leaction: "delete/delete",
            letitle: this.toString(),
            lelimit: 1
          }).then((data) => {
            let logs = data.query.logevents;
            if (logs.length === 0) {
              return null;
            }
            return logs[0].user;
          });
        }
        /** @inheritDoc */
        getDescription(customOptions) {
          return bot.query({
            prop: "description",
            titles: this.toString(),
            ...customOptions
          }).then((data) => {
            this.throwIfPageMissing(data);
            return data.query.pages[0].description;
          });
        }
        /** @inheritDoc */
        history(props, limit = 50, customOptions) {
          return bot.query({
            prop: "revisions",
            titles: this.toString(),
            rvprop: props || "ids|timestamp|flags|comment|user",
            rvlimit: limit || 50,
            ...customOptions
          }).then((data) => {
            this.throwIfPageMissing(data);
            return data.query.pages[0].revisions;
          });
        }
        async *historyGen(props, customOptions) {
          let continuedQuery = bot.continuedQueryGen({
            action: "query",
            prop: "revisions",
            titles: this.toString(),
            rvprop: props || "ids|timestamp|flags|comment|user",
            rvlimit: 50,
            ...customOptions
          });
          for await (let json of continuedQuery) {
            for (let edit of json.query.pages[0].revisions) {
              yield edit;
            }
          }
        }
        /** @inheritDoc */
        logs(props, limit, type, customOptions) {
          let logtypeObj = {};
          if (type) {
            logtypeObj = { [type.includes("/") ? "leaction" : "letype"]: type };
          }
          return bot.request({
            action: "query",
            list: "logevents",
            ...logtypeObj,
            leprop: props || "title|type|user|timestamp|comment",
            letitle: this.toString(),
            lelimit: limit || 50,
            ...customOptions
          }).then((data) => {
            return data.query.logevents;
          });
        }
        async *logsGen(props, type, customOptions) {
          let logtypeObj = {};
          if (type) {
            logtypeObj = { [type.includes("/") ? "leaction" : "letype"]: type };
          }
          let continuedQuery = bot.continuedQueryGen({
            action: "query",
            list: "logevents",
            ...logtypeObj,
            leprop: props || "title|type|user|timestamp|comment",
            letitle: this.toString(),
            lelimit: 50,
            ...customOptions
          });
          for await (let json of continuedQuery) {
            for (let event of json.query.logevents) {
              yield event;
            }
          }
        }
        throwIfPageMissing(data) {
          if (data.query.pages[0].missing || data.query.pages[0].invalid) {
            throw new error_1.MwnMissingPageError();
          }
        }
        /** @inheritDoc */
        async pageViews(options = {}) {
          let project = bot.options.apiUrl.match(/.*\/(.*?)\.(?:org|com|net)/)?.[1];
          if (!project) {
            throw new Error("Invalid API URL for using pageViews(). Only Wikimedia wikis are supported.");
          }
          let { access, agent, granularity, start, end } = options;
          access = access || "all-access";
          agent = agent || "all-agents";
          granularity = granularity || "monthly";
          if (granularity === "daily") {
            let date = new bot.Date();
            date.setUTCDate(date.getUTCDate() - 1);
            start = start || date;
            end = end || new bot.Date();
          } else if (granularity === "monthly") {
            let date = new bot.Date();
            date.setUTCDate(1);
            date.setUTCMonth(date.getUTCMonth() - 1);
            start = start || date;
            end = end || (function() {
              let d = new bot.Date();
              d.setUTCDate(1);
              return d;
            })();
          }
          let startString = new bot.Date(start).format("YYYYMMDD"), endString = new bot.Date(end).format("YYYYMMDD");
          return bot.rawRequest({
            url: `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${project}/${access}/${agent}/${encodeURIComponent(this.toString())}/${granularity}/${startString}/${endString}`,
            headers: {
              "User-Agent": bot.options.userAgent
            }
          }).then((response) => {
            return response.data.items;
          });
        }
        /** @inheritDoc */
        async queryAuthors() {
          let langcodematch = bot.options.apiUrl.match(/([^/]*?)\.wikipedia\.org/);
          if (!langcodematch || !langcodematch[1]) {
            throw new Error("WikiWho API is not supported for bot API URL. Re-check.");
          }
          let json;
          try {
            json = await bot.rawRequest({
              url: `https://wikiwho.wmflabs.org/${langcodematch[1]}/api/v1.0.0-beta/latest_rev_content/${encodeURIComponent(this.toString())}/?editor=true`,
              headers: {
                "User-Agent": bot.options.userAgent
              }
            }).then((response) => response.data);
          } catch (err) {
            throw new Error(err && err.response && err.response.data && err.response.data.Error);
          }
          const tokens = Object.values(json.revisions[0])[0].tokens;
          let data = {
            totalBytes: 0,
            users: []
          };
          let userdata = {};
          for (let token of tokens) {
            data.totalBytes += token.str.length;
            let editor = token["editor"];
            if (!userdata[editor]) {
              userdata[editor] = { bytes: 0 };
            }
            userdata[editor].bytes += token.str.length;
            if (editor.startsWith("0|")) {
              userdata[editor].name = editor.slice(2);
            }
          }
          Object.entries(userdata).map(([userid, { bytes }]) => {
            userdata[userid].percent = bytes / data.totalBytes;
            if (userdata[userid].percent < 0.02) {
              delete userdata[userid];
            }
          });
          await bot.request({
            action: "query",
            list: "users",
            ususerids: Object.keys(userdata).filter((us) => !us.startsWith("0|"))
            // don't lookup IPs
          }).then((json2) => {
            json2.query.users.forEach((us) => {
              userdata[us.userid].name = us.name;
            });
          });
          data.users = Object.entries(userdata).map(([userid, { bytes, name, percent }]) => {
            return {
              id: Number(userid),
              name,
              bytes,
              percent
            };
          }).sort((a, b) => {
            return a.bytes < b.bytes ? 1 : -1;
          });
          return data;
        }
        /**** Post operations *****/
        // Defined in bot.js
        edit(transform) {
          return bot.edit(this.toString(), transform);
        }
        save(text, summary, options) {
          return bot.save(this.toString(), text, summary, options);
        }
        newSection(header, message, additionalParams) {
          return bot.newSection(this.toString(), header, message, additionalParams);
        }
        move(target, summary, options) {
          return bot.move(this.toString(), target, summary, options);
        }
        delete(summary, options) {
          return bot.delete(this.toString(), summary, options);
        }
        undelete(summary, options) {
          return bot.undelete(this.toString(), summary, options);
        }
        purge(options) {
          return bot.purge(this.toString(), options);
        }
      }
      return Page;
    }
  }
});

// node_modules/mwn/build/user.js
var require_user = __commonJS({
  "node_modules/mwn/build/user.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = default_1;
    var error_1 = require_error();
    function default_1(bot) {
      class User {
        /**
         * @constructor
         * @param {string} name - username
         */
        constructor(name) {
          this.username = name;
        }
        get userpage() {
          return new bot.Page("User:" + this.username);
        }
        get talkpage() {
          return new bot.Page("User talk:" + this.username);
        }
        // XXX: should these yield rather than return?
        /** @inheritDoc */
        contribs(options) {
          return bot.request({
            action: "query",
            list: "usercontribs",
            ucuser: this.username,
            uclimit: "max",
            ...options
          }).then((data) => data.query.usercontribs);
        }
        async *contribsGen(options) {
          let continuedQuery = bot.continuedQueryGen({
            action: "query",
            list: "usercontribs",
            ucuser: this.username,
            uclimit: "max",
            ...options
          });
          for await (let json of continuedQuery) {
            for (let edit of json.query.usercontribs) {
              yield edit;
            }
          }
        }
        /** @inheritDoc */
        logs(options) {
          return bot.request({
            action: "query",
            list: "logevents",
            leuser: this.username,
            lelimit: "max",
            ...options
          }).then((data) => data.query.logevents);
        }
        async *logsGen(options) {
          let continuedQuery = bot.continuedQueryGen({
            action: "query",
            list: "logevents",
            leuser: this.username,
            lelimit: "max",
            ...options
          });
          for await (let json of continuedQuery) {
            for (let action of json.query.logevents) {
              yield action;
            }
          }
        }
        /** @inheritDoc */
        info(props) {
          return bot.request({
            action: "query",
            list: "users",
            ususers: this.username,
            usprop: props || "editcount|registration|blockinfo|emailable|gender|rights|groups|groupmemberships|implicitgroups"
          }).then((data) => data.query.users[0]);
        }
        /** @inheritDoc */
        globalinfo(props) {
          return bot.request({
            action: "query",
            meta: "globaluserinfo",
            guiuser: this.username,
            guiprop: props || ""
          }).then((data) => {
            return data.query.globaluserinfo;
          });
        }
        /** @inheritDoc */
        sendMessage(header, message) {
          return this.talkpage.newSection(header, message);
        }
        /** @inheritDoc */
        email(subject, message, options) {
          return bot.request({
            action: "emailuser",
            target: this.username,
            subject,
            text: message,
            token: bot.csrfToken,
            ...options
          }).then((response) => {
            let data = response.emailuser;
            if (data.result === "Success") {
              return data;
            } else {
              return (0, error_1.rejectWithError)({
                // try to get an error code and info
                code: data.errors?.[0]?.code,
                info: data.errors?.[0]?.info,
                ...data
              });
            }
          });
        }
        /** @inheritDoc */
        block(options) {
          return bot.request({
            action: "block",
            user: this.username,
            token: bot.csrfToken,
            ...options
          }).then((data) => data.block);
        }
        /** @inheritDoc */
        unblock(options) {
          return bot.request({
            action: "unblock",
            user: this.username,
            token: bot.csrfToken,
            ...options
          }).then((data) => data.unblock);
        }
      }
      return User;
    }
  }
});

// node_modules/mwn/build/category.js
var require_category = __commonJS({
  "node_modules/mwn/build/category.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = default_1;
    function default_1(bot) {
      class Category extends bot.Page {
        /** @inheritDoc */
        constructor(name) {
          super(name, 14);
          if (this.namespace !== 14) {
            throw new Error("not a category page");
          }
        }
        // TODO: Add recursive modes
        /** @inheritDoc */
        members(options) {
          return bot.query({
            list: "categorymembers",
            cmtitle: "Category:" + this.title,
            cmlimit: "max",
            ...options
          }).then((data) => data.query.categorymembers);
        }
        async *membersGen(options) {
          let continuedQuery = bot.continuedQueryGen({
            action: "query",
            list: "categorymembers",
            cmtitle: "Category:" + this.title,
            cmlimit: "max",
            ...options
          });
          for await (let json of continuedQuery) {
            for (let result of json.query.categorymembers) {
              yield result;
            }
          }
        }
        /** @inheritDoc */
        pages(options) {
          return this.members({ cmtype: ["page"], ...options });
        }
        /** @inheritDoc */
        subcats(options) {
          return this.members({ cmtype: ["subcat"], ...options });
        }
        /** @inheritDoc */
        files(options) {
          return this.members({ cmtype: ["file"], ...options });
        }
      }
      return Category;
    }
  }
});

// node_modules/mwn/build/file.js
var require_file = __commonJS({
  "node_modules/mwn/build/file.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = default_1;
    function default_1(bot) {
      class File extends bot.Page {
        /** @inheritDoc */
        constructor(name) {
          super(name, 6);
          if (this.namespace !== 6) {
            throw new Error("not a file");
          }
        }
        /** @inheritDoc */
        getName() {
          let ext = this.getExtension();
          if (ext === null) {
            return this.getMain();
          }
          return this.getMain().slice(0, -ext.length - 1);
        }
        /** @inheritDoc */
        getNameText() {
          return this.getName().replace(/_/g, " ");
        }
        /** @inheritDoc */
        usages(options) {
          return bot.query({
            titles: this.toString(),
            prop: "fileusage",
            fuprop: "pageid|title|redirect",
            ...options
          }).then((data) => {
            return data.query.pages[0].fileusage || [];
          });
        }
        // TODO: Add wrapper for prop=imageinfo
        /** @inheritDoc */
        download(localname) {
          return bot.download(this.toString(), localname);
        }
      }
      return File;
    }
  }
});

// node_modules/color-name/index.js
var require_color_name = __commonJS({
  "node_modules/color-name/index.js"(exports, module) {
    "use strict";
    module.exports = {
      "aliceblue": [240, 248, 255],
      "antiquewhite": [250, 235, 215],
      "aqua": [0, 255, 255],
      "aquamarine": [127, 255, 212],
      "azure": [240, 255, 255],
      "beige": [245, 245, 220],
      "bisque": [255, 228, 196],
      "black": [0, 0, 0],
      "blanchedalmond": [255, 235, 205],
      "blue": [0, 0, 255],
      "blueviolet": [138, 43, 226],
      "brown": [165, 42, 42],
      "burlywood": [222, 184, 135],
      "cadetblue": [95, 158, 160],
      "chartreuse": [127, 255, 0],
      "chocolate": [210, 105, 30],
      "coral": [255, 127, 80],
      "cornflowerblue": [100, 149, 237],
      "cornsilk": [255, 248, 220],
      "crimson": [220, 20, 60],
      "cyan": [0, 255, 255],
      "darkblue": [0, 0, 139],
      "darkcyan": [0, 139, 139],
      "darkgoldenrod": [184, 134, 11],
      "darkgray": [169, 169, 169],
      "darkgreen": [0, 100, 0],
      "darkgrey": [169, 169, 169],
      "darkkhaki": [189, 183, 107],
      "darkmagenta": [139, 0, 139],
      "darkolivegreen": [85, 107, 47],
      "darkorange": [255, 140, 0],
      "darkorchid": [153, 50, 204],
      "darkred": [139, 0, 0],
      "darksalmon": [233, 150, 122],
      "darkseagreen": [143, 188, 143],
      "darkslateblue": [72, 61, 139],
      "darkslategray": [47, 79, 79],
      "darkslategrey": [47, 79, 79],
      "darkturquoise": [0, 206, 209],
      "darkviolet": [148, 0, 211],
      "deeppink": [255, 20, 147],
      "deepskyblue": [0, 191, 255],
      "dimgray": [105, 105, 105],
      "dimgrey": [105, 105, 105],
      "dodgerblue": [30, 144, 255],
      "firebrick": [178, 34, 34],
      "floralwhite": [255, 250, 240],
      "forestgreen": [34, 139, 34],
      "fuchsia": [255, 0, 255],
      "gainsboro": [220, 220, 220],
      "ghostwhite": [248, 248, 255],
      "gold": [255, 215, 0],
      "goldenrod": [218, 165, 32],
      "gray": [128, 128, 128],
      "green": [0, 128, 0],
      "greenyellow": [173, 255, 47],
      "grey": [128, 128, 128],
      "honeydew": [240, 255, 240],
      "hotpink": [255, 105, 180],
      "indianred": [205, 92, 92],
      "indigo": [75, 0, 130],
      "ivory": [255, 255, 240],
      "khaki": [240, 230, 140],
      "lavender": [230, 230, 250],
      "lavenderblush": [255, 240, 245],
      "lawngreen": [124, 252, 0],
      "lemonchiffon": [255, 250, 205],
      "lightblue": [173, 216, 230],
      "lightcoral": [240, 128, 128],
      "lightcyan": [224, 255, 255],
      "lightgoldenrodyellow": [250, 250, 210],
      "lightgray": [211, 211, 211],
      "lightgreen": [144, 238, 144],
      "lightgrey": [211, 211, 211],
      "lightpink": [255, 182, 193],
      "lightsalmon": [255, 160, 122],
      "lightseagreen": [32, 178, 170],
      "lightskyblue": [135, 206, 250],
      "lightslategray": [119, 136, 153],
      "lightslategrey": [119, 136, 153],
      "lightsteelblue": [176, 196, 222],
      "lightyellow": [255, 255, 224],
      "lime": [0, 255, 0],
      "limegreen": [50, 205, 50],
      "linen": [250, 240, 230],
      "magenta": [255, 0, 255],
      "maroon": [128, 0, 0],
      "mediumaquamarine": [102, 205, 170],
      "mediumblue": [0, 0, 205],
      "mediumorchid": [186, 85, 211],
      "mediumpurple": [147, 112, 219],
      "mediumseagreen": [60, 179, 113],
      "mediumslateblue": [123, 104, 238],
      "mediumspringgreen": [0, 250, 154],
      "mediumturquoise": [72, 209, 204],
      "mediumvioletred": [199, 21, 133],
      "midnightblue": [25, 25, 112],
      "mintcream": [245, 255, 250],
      "mistyrose": [255, 228, 225],
      "moccasin": [255, 228, 181],
      "navajowhite": [255, 222, 173],
      "navy": [0, 0, 128],
      "oldlace": [253, 245, 230],
      "olive": [128, 128, 0],
      "olivedrab": [107, 142, 35],
      "orange": [255, 165, 0],
      "orangered": [255, 69, 0],
      "orchid": [218, 112, 214],
      "palegoldenrod": [238, 232, 170],
      "palegreen": [152, 251, 152],
      "paleturquoise": [175, 238, 238],
      "palevioletred": [219, 112, 147],
      "papayawhip": [255, 239, 213],
      "peachpuff": [255, 218, 185],
      "peru": [205, 133, 63],
      "pink": [255, 192, 203],
      "plum": [221, 160, 221],
      "powderblue": [176, 224, 230],
      "purple": [128, 0, 128],
      "rebeccapurple": [102, 51, 153],
      "red": [255, 0, 0],
      "rosybrown": [188, 143, 143],
      "royalblue": [65, 105, 225],
      "saddlebrown": [139, 69, 19],
      "salmon": [250, 128, 114],
      "sandybrown": [244, 164, 96],
      "seagreen": [46, 139, 87],
      "seashell": [255, 245, 238],
      "sienna": [160, 82, 45],
      "silver": [192, 192, 192],
      "skyblue": [135, 206, 235],
      "slateblue": [106, 90, 205],
      "slategray": [112, 128, 144],
      "slategrey": [112, 128, 144],
      "snow": [255, 250, 250],
      "springgreen": [0, 255, 127],
      "steelblue": [70, 130, 180],
      "tan": [210, 180, 140],
      "teal": [0, 128, 128],
      "thistle": [216, 191, 216],
      "tomato": [255, 99, 71],
      "turquoise": [64, 224, 208],
      "violet": [238, 130, 238],
      "wheat": [245, 222, 179],
      "white": [255, 255, 255],
      "whitesmoke": [245, 245, 245],
      "yellow": [255, 255, 0],
      "yellowgreen": [154, 205, 50]
    };
  }
});

// node_modules/color-convert/conversions.js
var require_conversions = __commonJS({
  "node_modules/color-convert/conversions.js"(exports, module) {
    var cssKeywords = require_color_name();
    var reverseKeywords = {};
    for (const key of Object.keys(cssKeywords)) {
      reverseKeywords[cssKeywords[key]] = key;
    }
    var convert = {
      rgb: { channels: 3, labels: "rgb" },
      hsl: { channels: 3, labels: "hsl" },
      hsv: { channels: 3, labels: "hsv" },
      hwb: { channels: 3, labels: "hwb" },
      cmyk: { channels: 4, labels: "cmyk" },
      xyz: { channels: 3, labels: "xyz" },
      lab: { channels: 3, labels: "lab" },
      lch: { channels: 3, labels: "lch" },
      hex: { channels: 1, labels: ["hex"] },
      keyword: { channels: 1, labels: ["keyword"] },
      ansi16: { channels: 1, labels: ["ansi16"] },
      ansi256: { channels: 1, labels: ["ansi256"] },
      hcg: { channels: 3, labels: ["h", "c", "g"] },
      apple: { channels: 3, labels: ["r16", "g16", "b16"] },
      gray: { channels: 1, labels: ["gray"] }
    };
    module.exports = convert;
    for (const model of Object.keys(convert)) {
      if (!("channels" in convert[model])) {
        throw new Error("missing channels property: " + model);
      }
      if (!("labels" in convert[model])) {
        throw new Error("missing channel labels property: " + model);
      }
      if (convert[model].labels.length !== convert[model].channels) {
        throw new Error("channel and label counts mismatch: " + model);
      }
      const { channels, labels } = convert[model];
      delete convert[model].channels;
      delete convert[model].labels;
      Object.defineProperty(convert[model], "channels", { value: channels });
      Object.defineProperty(convert[model], "labels", { value: labels });
    }
    convert.rgb.hsl = function(rgb) {
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const min = Math.min(r, g, b);
      const max = Math.max(r, g, b);
      const delta = max - min;
      let h;
      let s;
      if (max === min) {
        h = 0;
      } else if (r === max) {
        h = (g - b) / delta;
      } else if (g === max) {
        h = 2 + (b - r) / delta;
      } else if (b === max) {
        h = 4 + (r - g) / delta;
      }
      h = Math.min(h * 60, 360);
      if (h < 0) {
        h += 360;
      }
      const l = (min + max) / 2;
      if (max === min) {
        s = 0;
      } else if (l <= 0.5) {
        s = delta / (max + min);
      } else {
        s = delta / (2 - max - min);
      }
      return [h, s * 100, l * 100];
    };
    convert.rgb.hsv = function(rgb) {
      let rdif;
      let gdif;
      let bdif;
      let h;
      let s;
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const v = Math.max(r, g, b);
      const diff = v - Math.min(r, g, b);
      const diffc = function(c) {
        return (v - c) / 6 / diff + 1 / 2;
      };
      if (diff === 0) {
        h = 0;
        s = 0;
      } else {
        s = diff / v;
        rdif = diffc(r);
        gdif = diffc(g);
        bdif = diffc(b);
        if (r === v) {
          h = bdif - gdif;
        } else if (g === v) {
          h = 1 / 3 + rdif - bdif;
        } else if (b === v) {
          h = 2 / 3 + gdif - rdif;
        }
        if (h < 0) {
          h += 1;
        } else if (h > 1) {
          h -= 1;
        }
      }
      return [
        h * 360,
        s * 100,
        v * 100
      ];
    };
    convert.rgb.hwb = function(rgb) {
      const r = rgb[0];
      const g = rgb[1];
      let b = rgb[2];
      const h = convert.rgb.hsl(rgb)[0];
      const w = 1 / 255 * Math.min(r, Math.min(g, b));
      b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));
      return [h, w * 100, b * 100];
    };
    convert.rgb.cmyk = function(rgb) {
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const k = Math.min(1 - r, 1 - g, 1 - b);
      const c = (1 - r - k) / (1 - k) || 0;
      const m = (1 - g - k) / (1 - k) || 0;
      const y = (1 - b - k) / (1 - k) || 0;
      return [c * 100, m * 100, y * 100, k * 100];
    };
    function comparativeDistance(x, y) {
      return (x[0] - y[0]) ** 2 + (x[1] - y[1]) ** 2 + (x[2] - y[2]) ** 2;
    }
    convert.rgb.keyword = function(rgb) {
      const reversed = reverseKeywords[rgb];
      if (reversed) {
        return reversed;
      }
      let currentClosestDistance = Infinity;
      let currentClosestKeyword;
      for (const keyword of Object.keys(cssKeywords)) {
        const value = cssKeywords[keyword];
        const distance = comparativeDistance(rgb, value);
        if (distance < currentClosestDistance) {
          currentClosestDistance = distance;
          currentClosestKeyword = keyword;
        }
      }
      return currentClosestKeyword;
    };
    convert.keyword.rgb = function(keyword) {
      return cssKeywords[keyword];
    };
    convert.rgb.xyz = function(rgb) {
      let r = rgb[0] / 255;
      let g = rgb[1] / 255;
      let b = rgb[2] / 255;
      r = r > 0.04045 ? ((r + 0.055) / 1.055) ** 2.4 : r / 12.92;
      g = g > 0.04045 ? ((g + 0.055) / 1.055) ** 2.4 : g / 12.92;
      b = b > 0.04045 ? ((b + 0.055) / 1.055) ** 2.4 : b / 12.92;
      const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
      const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
      const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
      return [x * 100, y * 100, z * 100];
    };
    convert.rgb.lab = function(rgb) {
      const xyz = convert.rgb.xyz(rgb);
      let x = xyz[0];
      let y = xyz[1];
      let z = xyz[2];
      x /= 95.047;
      y /= 100;
      z /= 108.883;
      x = x > 8856e-6 ? x ** (1 / 3) : 7.787 * x + 16 / 116;
      y = y > 8856e-6 ? y ** (1 / 3) : 7.787 * y + 16 / 116;
      z = z > 8856e-6 ? z ** (1 / 3) : 7.787 * z + 16 / 116;
      const l = 116 * y - 16;
      const a = 500 * (x - y);
      const b = 200 * (y - z);
      return [l, a, b];
    };
    convert.hsl.rgb = function(hsl) {
      const h = hsl[0] / 360;
      const s = hsl[1] / 100;
      const l = hsl[2] / 100;
      let t2;
      let t3;
      let val;
      if (s === 0) {
        val = l * 255;
        return [val, val, val];
      }
      if (l < 0.5) {
        t2 = l * (1 + s);
      } else {
        t2 = l + s - l * s;
      }
      const t1 = 2 * l - t2;
      const rgb = [0, 0, 0];
      for (let i = 0; i < 3; i++) {
        t3 = h + 1 / 3 * -(i - 1);
        if (t3 < 0) {
          t3++;
        }
        if (t3 > 1) {
          t3--;
        }
        if (6 * t3 < 1) {
          val = t1 + (t2 - t1) * 6 * t3;
        } else if (2 * t3 < 1) {
          val = t2;
        } else if (3 * t3 < 2) {
          val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
        } else {
          val = t1;
        }
        rgb[i] = val * 255;
      }
      return rgb;
    };
    convert.hsl.hsv = function(hsl) {
      const h = hsl[0];
      let s = hsl[1] / 100;
      let l = hsl[2] / 100;
      let smin = s;
      const lmin = Math.max(l, 0.01);
      l *= 2;
      s *= l <= 1 ? l : 2 - l;
      smin *= lmin <= 1 ? lmin : 2 - lmin;
      const v = (l + s) / 2;
      const sv = l === 0 ? 2 * smin / (lmin + smin) : 2 * s / (l + s);
      return [h, sv * 100, v * 100];
    };
    convert.hsv.rgb = function(hsv) {
      const h = hsv[0] / 60;
      const s = hsv[1] / 100;
      let v = hsv[2] / 100;
      const hi = Math.floor(h) % 6;
      const f = h - Math.floor(h);
      const p = 255 * v * (1 - s);
      const q = 255 * v * (1 - s * f);
      const t = 255 * v * (1 - s * (1 - f));
      v *= 255;
      switch (hi) {
        case 0:
          return [v, t, p];
        case 1:
          return [q, v, p];
        case 2:
          return [p, v, t];
        case 3:
          return [p, q, v];
        case 4:
          return [t, p, v];
        case 5:
          return [v, p, q];
      }
    };
    convert.hsv.hsl = function(hsv) {
      const h = hsv[0];
      const s = hsv[1] / 100;
      const v = hsv[2] / 100;
      const vmin = Math.max(v, 0.01);
      let sl;
      let l;
      l = (2 - s) * v;
      const lmin = (2 - s) * vmin;
      sl = s * vmin;
      sl /= lmin <= 1 ? lmin : 2 - lmin;
      sl = sl || 0;
      l /= 2;
      return [h, sl * 100, l * 100];
    };
    convert.hwb.rgb = function(hwb) {
      const h = hwb[0] / 360;
      let wh = hwb[1] / 100;
      let bl = hwb[2] / 100;
      const ratio = wh + bl;
      let f;
      if (ratio > 1) {
        wh /= ratio;
        bl /= ratio;
      }
      const i = Math.floor(6 * h);
      const v = 1 - bl;
      f = 6 * h - i;
      if ((i & 1) !== 0) {
        f = 1 - f;
      }
      const n = wh + f * (v - wh);
      let r;
      let g;
      let b;
      switch (i) {
        default:
        case 6:
        case 0:
          r = v;
          g = n;
          b = wh;
          break;
        case 1:
          r = n;
          g = v;
          b = wh;
          break;
        case 2:
          r = wh;
          g = v;
          b = n;
          break;
        case 3:
          r = wh;
          g = n;
          b = v;
          break;
        case 4:
          r = n;
          g = wh;
          b = v;
          break;
        case 5:
          r = v;
          g = wh;
          b = n;
          break;
      }
      return [r * 255, g * 255, b * 255];
    };
    convert.cmyk.rgb = function(cmyk) {
      const c = cmyk[0] / 100;
      const m = cmyk[1] / 100;
      const y = cmyk[2] / 100;
      const k = cmyk[3] / 100;
      const r = 1 - Math.min(1, c * (1 - k) + k);
      const g = 1 - Math.min(1, m * (1 - k) + k);
      const b = 1 - Math.min(1, y * (1 - k) + k);
      return [r * 255, g * 255, b * 255];
    };
    convert.xyz.rgb = function(xyz) {
      const x = xyz[0] / 100;
      const y = xyz[1] / 100;
      const z = xyz[2] / 100;
      let r;
      let g;
      let b;
      r = x * 3.2406 + y * -1.5372 + z * -0.4986;
      g = x * -0.9689 + y * 1.8758 + z * 0.0415;
      b = x * 0.0557 + y * -0.204 + z * 1.057;
      r = r > 31308e-7 ? 1.055 * r ** (1 / 2.4) - 0.055 : r * 12.92;
      g = g > 31308e-7 ? 1.055 * g ** (1 / 2.4) - 0.055 : g * 12.92;
      b = b > 31308e-7 ? 1.055 * b ** (1 / 2.4) - 0.055 : b * 12.92;
      r = Math.min(Math.max(0, r), 1);
      g = Math.min(Math.max(0, g), 1);
      b = Math.min(Math.max(0, b), 1);
      return [r * 255, g * 255, b * 255];
    };
    convert.xyz.lab = function(xyz) {
      let x = xyz[0];
      let y = xyz[1];
      let z = xyz[2];
      x /= 95.047;
      y /= 100;
      z /= 108.883;
      x = x > 8856e-6 ? x ** (1 / 3) : 7.787 * x + 16 / 116;
      y = y > 8856e-6 ? y ** (1 / 3) : 7.787 * y + 16 / 116;
      z = z > 8856e-6 ? z ** (1 / 3) : 7.787 * z + 16 / 116;
      const l = 116 * y - 16;
      const a = 500 * (x - y);
      const b = 200 * (y - z);
      return [l, a, b];
    };
    convert.lab.xyz = function(lab) {
      const l = lab[0];
      const a = lab[1];
      const b = lab[2];
      let x;
      let y;
      let z;
      y = (l + 16) / 116;
      x = a / 500 + y;
      z = y - b / 200;
      const y2 = y ** 3;
      const x2 = x ** 3;
      const z2 = z ** 3;
      y = y2 > 8856e-6 ? y2 : (y - 16 / 116) / 7.787;
      x = x2 > 8856e-6 ? x2 : (x - 16 / 116) / 7.787;
      z = z2 > 8856e-6 ? z2 : (z - 16 / 116) / 7.787;
      x *= 95.047;
      y *= 100;
      z *= 108.883;
      return [x, y, z];
    };
    convert.lab.lch = function(lab) {
      const l = lab[0];
      const a = lab[1];
      const b = lab[2];
      let h;
      const hr = Math.atan2(b, a);
      h = hr * 360 / 2 / Math.PI;
      if (h < 0) {
        h += 360;
      }
      const c = Math.sqrt(a * a + b * b);
      return [l, c, h];
    };
    convert.lch.lab = function(lch) {
      const l = lch[0];
      const c = lch[1];
      const h = lch[2];
      const hr = h / 360 * 2 * Math.PI;
      const a = c * Math.cos(hr);
      const b = c * Math.sin(hr);
      return [l, a, b];
    };
    convert.rgb.ansi16 = function(args, saturation = null) {
      const [r, g, b] = args;
      let value = saturation === null ? convert.rgb.hsv(args)[2] : saturation;
      value = Math.round(value / 50);
      if (value === 0) {
        return 30;
      }
      let ansi = 30 + (Math.round(b / 255) << 2 | Math.round(g / 255) << 1 | Math.round(r / 255));
      if (value === 2) {
        ansi += 60;
      }
      return ansi;
    };
    convert.hsv.ansi16 = function(args) {
      return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
    };
    convert.rgb.ansi256 = function(args) {
      const r = args[0];
      const g = args[1];
      const b = args[2];
      if (r === g && g === b) {
        if (r < 8) {
          return 16;
        }
        if (r > 248) {
          return 231;
        }
        return Math.round((r - 8) / 247 * 24) + 232;
      }
      const ansi = 16 + 36 * Math.round(r / 255 * 5) + 6 * Math.round(g / 255 * 5) + Math.round(b / 255 * 5);
      return ansi;
    };
    convert.ansi16.rgb = function(args) {
      let color = args % 10;
      if (color === 0 || color === 7) {
        if (args > 50) {
          color += 3.5;
        }
        color = color / 10.5 * 255;
        return [color, color, color];
      }
      const mult = (~~(args > 50) + 1) * 0.5;
      const r = (color & 1) * mult * 255;
      const g = (color >> 1 & 1) * mult * 255;
      const b = (color >> 2 & 1) * mult * 255;
      return [r, g, b];
    };
    convert.ansi256.rgb = function(args) {
      if (args >= 232) {
        const c = (args - 232) * 10 + 8;
        return [c, c, c];
      }
      args -= 16;
      let rem;
      const r = Math.floor(args / 36) / 5 * 255;
      const g = Math.floor((rem = args % 36) / 6) / 5 * 255;
      const b = rem % 6 / 5 * 255;
      return [r, g, b];
    };
    convert.rgb.hex = function(args) {
      const integer = ((Math.round(args[0]) & 255) << 16) + ((Math.round(args[1]) & 255) << 8) + (Math.round(args[2]) & 255);
      const string = integer.toString(16).toUpperCase();
      return "000000".substring(string.length) + string;
    };
    convert.hex.rgb = function(args) {
      const match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
      if (!match) {
        return [0, 0, 0];
      }
      let colorString = match[0];
      if (match[0].length === 3) {
        colorString = colorString.split("").map((char) => {
          return char + char;
        }).join("");
      }
      const integer = parseInt(colorString, 16);
      const r = integer >> 16 & 255;
      const g = integer >> 8 & 255;
      const b = integer & 255;
      return [r, g, b];
    };
    convert.rgb.hcg = function(rgb) {
      const r = rgb[0] / 255;
      const g = rgb[1] / 255;
      const b = rgb[2] / 255;
      const max = Math.max(Math.max(r, g), b);
      const min = Math.min(Math.min(r, g), b);
      const chroma = max - min;
      let grayscale;
      let hue;
      if (chroma < 1) {
        grayscale = min / (1 - chroma);
      } else {
        grayscale = 0;
      }
      if (chroma <= 0) {
        hue = 0;
      } else if (max === r) {
        hue = (g - b) / chroma % 6;
      } else if (max === g) {
        hue = 2 + (b - r) / chroma;
      } else {
        hue = 4 + (r - g) / chroma;
      }
      hue /= 6;
      hue %= 1;
      return [hue * 360, chroma * 100, grayscale * 100];
    };
    convert.hsl.hcg = function(hsl) {
      const s = hsl[1] / 100;
      const l = hsl[2] / 100;
      const c = l < 0.5 ? 2 * s * l : 2 * s * (1 - l);
      let f = 0;
      if (c < 1) {
        f = (l - 0.5 * c) / (1 - c);
      }
      return [hsl[0], c * 100, f * 100];
    };
    convert.hsv.hcg = function(hsv) {
      const s = hsv[1] / 100;
      const v = hsv[2] / 100;
      const c = s * v;
      let f = 0;
      if (c < 1) {
        f = (v - c) / (1 - c);
      }
      return [hsv[0], c * 100, f * 100];
    };
    convert.hcg.rgb = function(hcg) {
      const h = hcg[0] / 360;
      const c = hcg[1] / 100;
      const g = hcg[2] / 100;
      if (c === 0) {
        return [g * 255, g * 255, g * 255];
      }
      const pure = [0, 0, 0];
      const hi = h % 1 * 6;
      const v = hi % 1;
      const w = 1 - v;
      let mg = 0;
      switch (Math.floor(hi)) {
        case 0:
          pure[0] = 1;
          pure[1] = v;
          pure[2] = 0;
          break;
        case 1:
          pure[0] = w;
          pure[1] = 1;
          pure[2] = 0;
          break;
        case 2:
          pure[0] = 0;
          pure[1] = 1;
          pure[2] = v;
          break;
        case 3:
          pure[0] = 0;
          pure[1] = w;
          pure[2] = 1;
          break;
        case 4:
          pure[0] = v;
          pure[1] = 0;
          pure[2] = 1;
          break;
        default:
          pure[0] = 1;
          pure[1] = 0;
          pure[2] = w;
      }
      mg = (1 - c) * g;
      return [
        (c * pure[0] + mg) * 255,
        (c * pure[1] + mg) * 255,
        (c * pure[2] + mg) * 255
      ];
    };
    convert.hcg.hsv = function(hcg) {
      const c = hcg[1] / 100;
      const g = hcg[2] / 100;
      const v = c + g * (1 - c);
      let f = 0;
      if (v > 0) {
        f = c / v;
      }
      return [hcg[0], f * 100, v * 100];
    };
    convert.hcg.hsl = function(hcg) {
      const c = hcg[1] / 100;
      const g = hcg[2] / 100;
      const l = g * (1 - c) + 0.5 * c;
      let s = 0;
      if (l > 0 && l < 0.5) {
        s = c / (2 * l);
      } else if (l >= 0.5 && l < 1) {
        s = c / (2 * (1 - l));
      }
      return [hcg[0], s * 100, l * 100];
    };
    convert.hcg.hwb = function(hcg) {
      const c = hcg[1] / 100;
      const g = hcg[2] / 100;
      const v = c + g * (1 - c);
      return [hcg[0], (v - c) * 100, (1 - v) * 100];
    };
    convert.hwb.hcg = function(hwb) {
      const w = hwb[1] / 100;
      const b = hwb[2] / 100;
      const v = 1 - b;
      const c = v - w;
      let g = 0;
      if (c < 1) {
        g = (v - c) / (1 - c);
      }
      return [hwb[0], c * 100, g * 100];
    };
    convert.apple.rgb = function(apple) {
      return [apple[0] / 65535 * 255, apple[1] / 65535 * 255, apple[2] / 65535 * 255];
    };
    convert.rgb.apple = function(rgb) {
      return [rgb[0] / 255 * 65535, rgb[1] / 255 * 65535, rgb[2] / 255 * 65535];
    };
    convert.gray.rgb = function(args) {
      return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
    };
    convert.gray.hsl = function(args) {
      return [0, 0, args[0]];
    };
    convert.gray.hsv = convert.gray.hsl;
    convert.gray.hwb = function(gray) {
      return [0, 100, gray[0]];
    };
    convert.gray.cmyk = function(gray) {
      return [0, 0, 0, gray[0]];
    };
    convert.gray.lab = function(gray) {
      return [gray[0], 0, 0];
    };
    convert.gray.hex = function(gray) {
      const val = Math.round(gray[0] / 100 * 255) & 255;
      const integer = (val << 16) + (val << 8) + val;
      const string = integer.toString(16).toUpperCase();
      return "000000".substring(string.length) + string;
    };
    convert.rgb.gray = function(rgb) {
      const val = (rgb[0] + rgb[1] + rgb[2]) / 3;
      return [val / 255 * 100];
    };
  }
});

// node_modules/color-convert/route.js
var require_route = __commonJS({
  "node_modules/color-convert/route.js"(exports, module) {
    var conversions = require_conversions();
    function buildGraph() {
      const graph = {};
      const models = Object.keys(conversions);
      for (let len = models.length, i = 0; i < len; i++) {
        graph[models[i]] = {
          // http://jsperf.com/1-vs-infinity
          // micro-opt, but this is simple.
          distance: -1,
          parent: null
        };
      }
      return graph;
    }
    function deriveBFS(fromModel) {
      const graph = buildGraph();
      const queue = [fromModel];
      graph[fromModel].distance = 0;
      while (queue.length) {
        const current = queue.pop();
        const adjacents = Object.keys(conversions[current]);
        for (let len = adjacents.length, i = 0; i < len; i++) {
          const adjacent = adjacents[i];
          const node = graph[adjacent];
          if (node.distance === -1) {
            node.distance = graph[current].distance + 1;
            node.parent = current;
            queue.unshift(adjacent);
          }
        }
      }
      return graph;
    }
    function link(from, to) {
      return function(args) {
        return to(from(args));
      };
    }
    function wrapConversion(toModel, graph) {
      const path = [graph[toModel].parent, toModel];
      let fn = conversions[graph[toModel].parent][toModel];
      let cur = graph[toModel].parent;
      while (graph[cur].parent) {
        path.unshift(graph[cur].parent);
        fn = link(conversions[graph[cur].parent][cur], fn);
        cur = graph[cur].parent;
      }
      fn.conversion = path;
      return fn;
    }
    module.exports = function(fromModel) {
      const graph = deriveBFS(fromModel);
      const conversion = {};
      const models = Object.keys(graph);
      for (let len = models.length, i = 0; i < len; i++) {
        const toModel = models[i];
        const node = graph[toModel];
        if (node.parent === null) {
          continue;
        }
        conversion[toModel] = wrapConversion(toModel, graph);
      }
      return conversion;
    };
  }
});

// node_modules/color-convert/index.js
var require_color_convert = __commonJS({
  "node_modules/color-convert/index.js"(exports, module) {
    var conversions = require_conversions();
    var route = require_route();
    var convert = {};
    var models = Object.keys(conversions);
    function wrapRaw(fn) {
      const wrappedFn = function(...args) {
        const arg0 = args[0];
        if (arg0 === void 0 || arg0 === null) {
          return arg0;
        }
        if (arg0.length > 1) {
          args = arg0;
        }
        return fn(args);
      };
      if ("conversion" in fn) {
        wrappedFn.conversion = fn.conversion;
      }
      return wrappedFn;
    }
    function wrapRounded(fn) {
      const wrappedFn = function(...args) {
        const arg0 = args[0];
        if (arg0 === void 0 || arg0 === null) {
          return arg0;
        }
        if (arg0.length > 1) {
          args = arg0;
        }
        const result = fn(args);
        if (typeof result === "object") {
          for (let len = result.length, i = 0; i < len; i++) {
            result[i] = Math.round(result[i]);
          }
        }
        return result;
      };
      if ("conversion" in fn) {
        wrappedFn.conversion = fn.conversion;
      }
      return wrappedFn;
    }
    models.forEach((fromModel) => {
      convert[fromModel] = {};
      Object.defineProperty(convert[fromModel], "channels", { value: conversions[fromModel].channels });
      Object.defineProperty(convert[fromModel], "labels", { value: conversions[fromModel].labels });
      const routes = route(fromModel);
      const routeModels = Object.keys(routes);
      routeModels.forEach((toModel) => {
        const fn = routes[toModel];
        convert[fromModel][toModel] = wrapRounded(fn);
        convert[fromModel][toModel].raw = wrapRaw(fn);
      });
    });
    module.exports = convert;
  }
});

// node_modules/ansi-styles/index.js
var require_ansi_styles = __commonJS({
  "node_modules/ansi-styles/index.js"(exports, module) {
    "use strict";
    var wrapAnsi16 = (fn, offset) => (...args) => {
      const code = fn(...args);
      return `\x1B[${code + offset}m`;
    };
    var wrapAnsi256 = (fn, offset) => (...args) => {
      const code = fn(...args);
      return `\x1B[${38 + offset};5;${code}m`;
    };
    var wrapAnsi16m = (fn, offset) => (...args) => {
      const rgb = fn(...args);
      return `\x1B[${38 + offset};2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
    };
    var ansi2ansi = (n) => n;
    var rgb2rgb = (r, g, b) => [r, g, b];
    var setLazyProperty = (object, property, get) => {
      Object.defineProperty(object, property, {
        get: () => {
          const value = get();
          Object.defineProperty(object, property, {
            value,
            enumerable: true,
            configurable: true
          });
          return value;
        },
        enumerable: true,
        configurable: true
      });
    };
    var colorConvert;
    var makeDynamicStyles = (wrap, targetSpace, identity, isBackground) => {
      if (colorConvert === void 0) {
        colorConvert = require_color_convert();
      }
      const offset = isBackground ? 10 : 0;
      const styles = {};
      for (const [sourceSpace, suite] of Object.entries(colorConvert)) {
        const name = sourceSpace === "ansi16" ? "ansi" : sourceSpace;
        if (sourceSpace === targetSpace) {
          styles[name] = wrap(identity, offset);
        } else if (typeof suite === "object") {
          styles[name] = wrap(suite[targetSpace], offset);
        }
      }
      return styles;
    };
    function assembleStyles() {
      const codes = /* @__PURE__ */ new Map();
      const styles = {
        modifier: {
          reset: [0, 0],
          // 21 isn't widely supported and 22 does the same thing
          bold: [1, 22],
          dim: [2, 22],
          italic: [3, 23],
          underline: [4, 24],
          inverse: [7, 27],
          hidden: [8, 28],
          strikethrough: [9, 29]
        },
        color: {
          black: [30, 39],
          red: [31, 39],
          green: [32, 39],
          yellow: [33, 39],
          blue: [34, 39],
          magenta: [35, 39],
          cyan: [36, 39],
          white: [37, 39],
          // Bright color
          blackBright: [90, 39],
          redBright: [91, 39],
          greenBright: [92, 39],
          yellowBright: [93, 39],
          blueBright: [94, 39],
          magentaBright: [95, 39],
          cyanBright: [96, 39],
          whiteBright: [97, 39]
        },
        bgColor: {
          bgBlack: [40, 49],
          bgRed: [41, 49],
          bgGreen: [42, 49],
          bgYellow: [43, 49],
          bgBlue: [44, 49],
          bgMagenta: [45, 49],
          bgCyan: [46, 49],
          bgWhite: [47, 49],
          // Bright color
          bgBlackBright: [100, 49],
          bgRedBright: [101, 49],
          bgGreenBright: [102, 49],
          bgYellowBright: [103, 49],
          bgBlueBright: [104, 49],
          bgMagentaBright: [105, 49],
          bgCyanBright: [106, 49],
          bgWhiteBright: [107, 49]
        }
      };
      styles.color.gray = styles.color.blackBright;
      styles.bgColor.bgGray = styles.bgColor.bgBlackBright;
      styles.color.grey = styles.color.blackBright;
      styles.bgColor.bgGrey = styles.bgColor.bgBlackBright;
      for (const [groupName, group] of Object.entries(styles)) {
        for (const [styleName, style] of Object.entries(group)) {
          styles[styleName] = {
            open: `\x1B[${style[0]}m`,
            close: `\x1B[${style[1]}m`
          };
          group[styleName] = styles[styleName];
          codes.set(style[0], style[1]);
        }
        Object.defineProperty(styles, groupName, {
          value: group,
          enumerable: false
        });
      }
      Object.defineProperty(styles, "codes", {
        value: codes,
        enumerable: false
      });
      styles.color.close = "\x1B[39m";
      styles.bgColor.close = "\x1B[49m";
      setLazyProperty(styles.color, "ansi", () => makeDynamicStyles(wrapAnsi16, "ansi16", ansi2ansi, false));
      setLazyProperty(styles.color, "ansi256", () => makeDynamicStyles(wrapAnsi256, "ansi256", ansi2ansi, false));
      setLazyProperty(styles.color, "ansi16m", () => makeDynamicStyles(wrapAnsi16m, "rgb", rgb2rgb, false));
      setLazyProperty(styles.bgColor, "ansi", () => makeDynamicStyles(wrapAnsi16, "ansi16", ansi2ansi, true));
      setLazyProperty(styles.bgColor, "ansi256", () => makeDynamicStyles(wrapAnsi256, "ansi256", ansi2ansi, true));
      setLazyProperty(styles.bgColor, "ansi16m", () => makeDynamicStyles(wrapAnsi16m, "rgb", rgb2rgb, true));
      return styles;
    }
    Object.defineProperty(module, "exports", {
      enumerable: true,
      get: assembleStyles
    });
  }
});

// node_modules/chalk/source/util.js
var require_util = __commonJS({
  "node_modules/chalk/source/util.js"(exports, module) {
    "use strict";
    var stringReplaceAll = (string, substring, replacer) => {
      let index = string.indexOf(substring);
      if (index === -1) {
        return string;
      }
      const substringLength = substring.length;
      let endIndex = 0;
      let returnValue = "";
      do {
        returnValue += string.substr(endIndex, index - endIndex) + substring + replacer;
        endIndex = index + substringLength;
        index = string.indexOf(substring, endIndex);
      } while (index !== -1);
      returnValue += string.substr(endIndex);
      return returnValue;
    };
    var stringEncaseCRLFWithFirstIndex = (string, prefix, postfix, index) => {
      let endIndex = 0;
      let returnValue = "";
      do {
        const gotCR = string[index - 1] === "\r";
        returnValue += string.substr(endIndex, (gotCR ? index - 1 : index) - endIndex) + prefix + (gotCR ? "\r\n" : "\n") + postfix;
        endIndex = index + 1;
        index = string.indexOf("\n", endIndex);
      } while (index !== -1);
      returnValue += string.substr(endIndex);
      return returnValue;
    };
    module.exports = {
      stringReplaceAll,
      stringEncaseCRLFWithFirstIndex
    };
  }
});

// node_modules/chalk/source/templates.js
var require_templates = __commonJS({
  "node_modules/chalk/source/templates.js"(exports, module) {
    "use strict";
    var TEMPLATE_REGEX = /(?:\\(u(?:[a-f\d]{4}|\{[a-f\d]{1,6}\})|x[a-f\d]{2}|.))|(?:\{(~)?(\w+(?:\([^)]*\))?(?:\.\w+(?:\([^)]*\))?)*)(?:[ \t]|(?=\r?\n)))|(\})|((?:.|[\r\n\f])+?)/gi;
    var STYLE_REGEX = /(?:^|\.)(\w+)(?:\(([^)]*)\))?/g;
    var STRING_REGEX = /^(['"])((?:\\.|(?!\1)[^\\])*)\1$/;
    var ESCAPE_REGEX = /\\(u(?:[a-f\d]{4}|{[a-f\d]{1,6}})|x[a-f\d]{2}|.)|([^\\])/gi;
    var ESCAPES = /* @__PURE__ */ new Map([
      ["n", "\n"],
      ["r", "\r"],
      ["t", "	"],
      ["b", "\b"],
      ["f", "\f"],
      ["v", "\v"],
      ["0", "\0"],
      ["\\", "\\"],
      ["e", "\x1B"],
      ["a", "\x07"]
    ]);
    function unescape2(c) {
      const u = c[0] === "u";
      const bracket = c[1] === "{";
      if (u && !bracket && c.length === 5 || c[0] === "x" && c.length === 3) {
        return String.fromCharCode(parseInt(c.slice(1), 16));
      }
      if (u && bracket) {
        return String.fromCodePoint(parseInt(c.slice(2, -1), 16));
      }
      return ESCAPES.get(c) || c;
    }
    function parseArguments(name, arguments_) {
      const results = [];
      const chunks = arguments_.trim().split(/\s*,\s*/g);
      let matches;
      for (const chunk of chunks) {
        const number = Number(chunk);
        if (!Number.isNaN(number)) {
          results.push(number);
        } else if (matches = chunk.match(STRING_REGEX)) {
          results.push(matches[2].replace(ESCAPE_REGEX, (m, escape, character) => escape ? unescape2(escape) : character));
        } else {
          throw new Error(`Invalid Chalk template style argument: ${chunk} (in style '${name}')`);
        }
      }
      return results;
    }
    function parseStyle(style) {
      STYLE_REGEX.lastIndex = 0;
      const results = [];
      let matches;
      while ((matches = STYLE_REGEX.exec(style)) !== null) {
        const name = matches[1];
        if (matches[2]) {
          const args = parseArguments(name, matches[2]);
          results.push([name].concat(args));
        } else {
          results.push([name]);
        }
      }
      return results;
    }
    function buildStyle(chalk, styles) {
      const enabled = {};
      for (const layer of styles) {
        for (const style of layer.styles) {
          enabled[style[0]] = layer.inverse ? null : style.slice(1);
        }
      }
      let current = chalk;
      for (const [styleName, styles2] of Object.entries(enabled)) {
        if (!Array.isArray(styles2)) {
          continue;
        }
        if (!(styleName in current)) {
          throw new Error(`Unknown Chalk style: ${styleName}`);
        }
        current = styles2.length > 0 ? current[styleName](...styles2) : current[styleName];
      }
      return current;
    }
    module.exports = (chalk, temporary) => {
      const styles = [];
      const chunks = [];
      let chunk = [];
      temporary.replace(TEMPLATE_REGEX, (m, escapeCharacter, inverse, style, close, character) => {
        if (escapeCharacter) {
          chunk.push(unescape2(escapeCharacter));
        } else if (style) {
          const string = chunk.join("");
          chunk = [];
          chunks.push(styles.length === 0 ? string : buildStyle(chalk, styles)(string));
          styles.push({ inverse, styles: parseStyle(style) });
        } else if (close) {
          if (styles.length === 0) {
            throw new Error("Found extraneous } in Chalk template literal");
          }
          chunks.push(buildStyle(chalk, styles)(chunk.join("")));
          chunk = [];
          styles.pop();
        } else {
          chunk.push(character);
        }
      });
      chunks.push(chunk.join(""));
      if (styles.length > 0) {
        const errMessage = `Chalk template literal is missing ${styles.length} closing bracket${styles.length === 1 ? "" : "s"} (\`}\`)`;
        throw new Error(errMessage);
      }
      return chunks.join("");
    };
  }
});

// node_modules/chalk/source/index.js
var require_source = __commonJS({
  "node_modules/chalk/source/index.js"(exports, module) {
    "use strict";
    var ansiStyles = require_ansi_styles();
    var { stdout: stdoutColor, stderr: stderrColor } = require_supports_color();
    var {
      stringReplaceAll,
      stringEncaseCRLFWithFirstIndex
    } = require_util();
    var { isArray } = Array;
    var levelMapping = [
      "ansi",
      "ansi",
      "ansi256",
      "ansi16m"
    ];
    var styles = /* @__PURE__ */ Object.create(null);
    var applyOptions = (object, options = {}) => {
      if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) {
        throw new Error("The `level` option should be an integer from 0 to 3");
      }
      const colorLevel = stdoutColor ? stdoutColor.level : 0;
      object.level = options.level === void 0 ? colorLevel : options.level;
    };
    var ChalkClass = class {
      constructor(options) {
        return chalkFactory(options);
      }
    };
    var chalkFactory = (options) => {
      const chalk2 = {};
      applyOptions(chalk2, options);
      chalk2.template = (...arguments_) => chalkTag(chalk2.template, ...arguments_);
      Object.setPrototypeOf(chalk2, Chalk.prototype);
      Object.setPrototypeOf(chalk2.template, chalk2);
      chalk2.template.constructor = () => {
        throw new Error("`chalk.constructor()` is deprecated. Use `new chalk.Instance()` instead.");
      };
      chalk2.template.Instance = ChalkClass;
      return chalk2.template;
    };
    function Chalk(options) {
      return chalkFactory(options);
    }
    for (const [styleName, style] of Object.entries(ansiStyles)) {
      styles[styleName] = {
        get() {
          const builder = createBuilder(this, createStyler(style.open, style.close, this._styler), this._isEmpty);
          Object.defineProperty(this, styleName, { value: builder });
          return builder;
        }
      };
    }
    styles.visible = {
      get() {
        const builder = createBuilder(this, this._styler, true);
        Object.defineProperty(this, "visible", { value: builder });
        return builder;
      }
    };
    var usedModels = ["rgb", "hex", "keyword", "hsl", "hsv", "hwb", "ansi", "ansi256"];
    for (const model of usedModels) {
      styles[model] = {
        get() {
          const { level } = this;
          return function(...arguments_) {
            const styler = createStyler(ansiStyles.color[levelMapping[level]][model](...arguments_), ansiStyles.color.close, this._styler);
            return createBuilder(this, styler, this._isEmpty);
          };
        }
      };
    }
    for (const model of usedModels) {
      const bgModel = "bg" + model[0].toUpperCase() + model.slice(1);
      styles[bgModel] = {
        get() {
          const { level } = this;
          return function(...arguments_) {
            const styler = createStyler(ansiStyles.bgColor[levelMapping[level]][model](...arguments_), ansiStyles.bgColor.close, this._styler);
            return createBuilder(this, styler, this._isEmpty);
          };
        }
      };
    }
    var proto = Object.defineProperties(() => {
    }, {
      ...styles,
      level: {
        enumerable: true,
        get() {
          return this._generator.level;
        },
        set(level) {
          this._generator.level = level;
        }
      }
    });
    var createStyler = (open, close, parent) => {
      let openAll;
      let closeAll;
      if (parent === void 0) {
        openAll = open;
        closeAll = close;
      } else {
        openAll = parent.openAll + open;
        closeAll = close + parent.closeAll;
      }
      return {
        open,
        close,
        openAll,
        closeAll,
        parent
      };
    };
    var createBuilder = (self2, _styler, _isEmpty) => {
      const builder = (...arguments_) => {
        if (isArray(arguments_[0]) && isArray(arguments_[0].raw)) {
          return applyStyle(builder, chalkTag(builder, ...arguments_));
        }
        return applyStyle(builder, arguments_.length === 1 ? "" + arguments_[0] : arguments_.join(" "));
      };
      Object.setPrototypeOf(builder, proto);
      builder._generator = self2;
      builder._styler = _styler;
      builder._isEmpty = _isEmpty;
      return builder;
    };
    var applyStyle = (self2, string) => {
      if (self2.level <= 0 || !string) {
        return self2._isEmpty ? "" : string;
      }
      let styler = self2._styler;
      if (styler === void 0) {
        return string;
      }
      const { openAll, closeAll } = styler;
      if (string.indexOf("\x1B") !== -1) {
        while (styler !== void 0) {
          string = stringReplaceAll(string, styler.close, styler.open);
          styler = styler.parent;
        }
      }
      const lfIndex = string.indexOf("\n");
      if (lfIndex !== -1) {
        string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
      }
      return openAll + string + closeAll;
    };
    var template;
    var chalkTag = (chalk2, ...strings) => {
      const [firstString] = strings;
      if (!isArray(firstString) || !isArray(firstString.raw)) {
        return strings.join(" ");
      }
      const arguments_ = strings.slice(1);
      const parts = [firstString.raw[0]];
      for (let i = 1; i < firstString.length; i++) {
        parts.push(
          String(arguments_[i - 1]).replace(/[{}\\]/g, "\\$&"),
          String(firstString.raw[i])
        );
      }
      if (template === void 0) {
        template = require_templates();
      }
      return template(chalk2, parts.join(""));
    };
    Object.defineProperties(Chalk.prototype, styles);
    var chalk = Chalk();
    chalk.supportsColor = stdoutColor;
    chalk.stderr = Chalk({ level: stderrColor ? stderrColor.level : 0 });
    chalk.stderr.supportsColor = stderrColor;
    module.exports = chalk;
  }
});

// node_modules/mwn/build/log.js
var require_log = __commonJS({
  "node_modules/mwn/build/log.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.updateLoggingConfig = updateLoggingConfig;
    exports.log = log;
    exports.message = message;
    exports.debug = debug;
    exports.error = error;
    exports.colorize = colorize;
    exports.pad = pad;
    exports.getDateArray = getDateArray;
    exports.humanDate = humanDate;
    var util = __require("node:util");
    var chalk = require_source();
    var logConfig = {
      printDebug: true,
      printVerbose: true,
      stream: process.stdout
    };
    function updateLoggingConfig(options) {
      Object.assign(logConfig, options);
    }
    function log(obj) {
      if (obj && obj instanceof Error) {
        error(obj);
      } else if (obj && typeof obj === "object") {
        debug(obj);
      } else {
        message(obj);
      }
    }
    function message(msg) {
      if (typeof msg !== "string") {
        try {
          msg = "" + JSON.stringify(msg);
        } catch (e) {
          msg = `[E] [Logger] Could not stringify given parameter: ${e.message}`;
        }
      }
      msg = colorize(msg);
      if (msg.trim && msg.trim().length > 0) {
        msg = colorize("[" + humanDate() + "] ", "gray") + msg;
      }
      if (!logConfig.printVerbose && msg.indexOf("[V]") >= 0) {
      } else if (!logConfig.printDebug && msg.indexOf("[D]") >= 0) {
      } else {
        writeToLog(msg);
      }
    }
    function debug(obj) {
      let msg = JSON.stringify(obj, null, 4);
      writeToLog(colorize(msg, "gray"));
    }
    function error(obj) {
      writeToLog(colorize("[E] " + obj.message, "red"));
      let stringified;
      try {
        stringified = JSON.stringify(obj, null, 4);
      } catch (e) {
        stringified = `Failed to stringify error: ${e.message}`;
      }
      writeToLog(colorize(stringified, "gray"));
      if (obj.stack) {
        writeToLog(colorize(obj.stack, "gray"));
      }
    }
    var colorMap = {
      "[E]": "red",
      // ERROR
      "[W]": "yellow",
      // WARNING
      "[?]": "yellow",
      // MISSING
      "[S]": "green",
      // SUCCESS
      "[i]": "blue",
      // INFO
      "[+]": "green",
      // ADDED
      "[-]": "red",
      // REMOVED
      "[C]": "cyan",
      // CHANGED
      "[U]": "gray",
      // UNCHANGED
      "[=]": "gray",
      // EQUAL
      "[/]": "gray",
      // SKIPPED
      "[V]": "magenta",
      // VERBOSE
      "[D]": "magenta",
      // DEBUG
      "[T]": "magenta",
      // TO-DO
      "[TODO]": "magenta"
      // TO-DO
    };
    function colorize(msg, colorName) {
      if (logConfig.stream !== process.stdout) {
        return msg;
      }
      if (colorName) {
        return chalk[colorName](msg);
      }
      for (let [code, color] of Object.entries(colorMap)) {
        if (msg && msg.indexOf && msg.startsWith(code)) {
          return chalk[color](msg);
        }
      }
      return msg;
    }
    function writeToLog(message2) {
      if (logConfig.stream === process.stdout) {
        console.log(message2);
      } else {
        logConfig.stream.write(util.format.apply(null, [message2]) + "\n");
      }
    }
    function pad(number, digits) {
      return new Array(Math.max(digits - String(number).length + 1, 0)).join("0") + number;
    }
    function getDateArray(date) {
      date = date || /* @__PURE__ */ new Date();
      return [
        date.getFullYear(),
        pad(date.getMonth() + 1, 2),
        pad(date.getDate(), 2),
        pad(date.getHours(), 2),
        pad(date.getMinutes(), 2),
        pad(date.getSeconds(), 2),
        pad(date.getMilliseconds(), 2)
      ];
    }
    function humanDate(date) {
      date = date || /* @__PURE__ */ new Date();
      let d = getDateArray(date);
      return d[0] + "-" + d[1] + "-" + d[2] + " " + d[3] + ":" + d[4] + ":" + d[5];
    }
  }
});

// node_modules/mwn/build/utils.js
var require_utils = __commonJS({
  "node_modules/mwn/build/utils.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ispromise = ispromise;
    exports.isplainobject = isplainobject;
    exports.merge = merge;
    exports.mergeDeep1 = mergeDeep1;
    exports.arrayChunk = arrayChunk;
    exports.sleep = sleep;
    exports.makeTitles = makeTitles;
    exports.makeTitle = makeTitle;
    function ispromise(obj) {
      return !!obj && (typeof obj === "object" || typeof obj === "function") && typeof obj.then === "function";
    }
    function isplainobject(value) {
      if (Object.prototype.toString.call(value) !== "[object Object]") {
        return false;
      }
      const prototype = Object.getPrototypeOf(value);
      return prototype === null || prototype === Object.prototype;
    }
    function merge(...objects) {
      return Object.assign({}, ...objects);
    }
    function mergeDeep1(...objects) {
      let args = [...objects].filter((e) => e);
      for (let options of args.slice(1)) {
        for (let [key, val] of Object.entries(options)) {
          if (isplainobject(val)) {
            args[0][key] = merge(args[0][key], val);
          } else {
            args[0][key] = val;
          }
        }
      }
      return args[0];
    }
    function arrayChunk(arr, size) {
      const numChunks = Math.ceil(arr.length / size);
      let result = new Array(numChunks);
      for (let i = 0; i < numChunks; i++) {
        result[i] = arr.slice(i * size, (i + 1) * size);
      }
      return result;
    }
    function sleep(duration) {
      return new Promise((resolve) => {
        setTimeout(resolve, duration);
      });
    }
    function makeTitles(pages) {
      let pagesArray = Array.isArray(pages) ? pages : [pages];
      if (typeof pagesArray[0] === "number") {
        return { pageids: pagesArray };
      } else {
        return { titles: pagesArray };
      }
    }
    function makeTitle(page) {
      if (typeof page === "number") {
        return { pageid: page };
      } else {
        return { title: String(page) };
      }
    }
  }
});

// node_modules/mwn/build/core.js
var require_core = __commonJS({
  "node_modules/mwn/build/core.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Response = exports.Request = void 0;
    var FormData2 = require_form_data();
    var log_1 = require_log();
    var error_1 = require_error();
    var utils_1 = require_utils();
    var Request = class {
      constructor(bot, apiParams, requestParams) {
        this.MULTIPART_THRESHOLD = 8e3;
        this.hasLongFields = false;
        this.bot = bot;
        this.apiParams = apiParams;
        this.requestParams = requestParams;
      }
      async process() {
        this.apiParams = (0, utils_1.merge)(this.bot.options.defaultParams, this.apiParams);
        this.preprocessParams();
        await this.fillRequestOptions();
      }
      getMethod() {
        if (this.requestParams.method) {
          return this.requestParams.method;
        }
        if (this.apiParams.action === "query") {
          return "get";
        }
        if (this.apiParams.action === "parse" && !this.apiParams.text) {
          return "get";
        }
        return "post";
      }
      preprocessParams() {
        let params = this.apiParams;
        Object.entries(params).forEach(([key, val]) => {
          if (Array.isArray(val)) {
            if (!val.join("").includes("|")) {
              params[key] = val.join("|");
            } else {
              params[key] = "" + val.join("");
            }
          }
          if (val === false || val === void 0) {
            delete params[key];
          } else if (val === true) {
            params[key] = "1";
          } else if (val instanceof Date) {
            params[key] = val.toISOString();
          } else if (String(params[key]).length > this.MULTIPART_THRESHOLD) {
            this.hasLongFields = true;
          }
        });
      }
      async fillRequestOptions() {
        let method = this.getMethod();
        this.requestParams = (0, utils_1.mergeDeep1)({
          url: this.bot.options.apiUrl,
          method,
          // retryNumber isn't actually used by the API, but this is
          // included here for tracking our maxlag retry count.
          retryNumber: 0
        }, this.bot.requestOptions, this.requestParams);
        if (method === "get") {
          this.handleGet();
        } else {
          await this.handlePost();
        }
        this.applyAuthentication();
      }
      applyAuthentication() {
        let requestOptions = this.requestParams;
        if (this.bot.usingOAuth2) {
          requestOptions.headers["Authorization"] = `Bearer ${this.bot.options.OAuth2AccessToken}`;
        } else if (this.bot.usingOAuth) {
          requestOptions.headers = {
            ...requestOptions.headers,
            ...this.makeOAuthHeader({
              url: requestOptions.url,
              method: requestOptions.method,
              data: requestOptions.data instanceof FormData2 ? {} : this.apiParams
            })
          };
        } else {
          requestOptions.withCredentials = true;
        }
      }
      /**
       * Get OAuth Authorization header
       */
      makeOAuthHeader(params) {
        return this.bot.oauth.toHeader(this.bot.oauth.authorize(params, {
          key: this.bot.options.OAuthCredentials.accessToken,
          secret: this.bot.options.OAuthCredentials.accessSecret
        }));
      }
      handleGet() {
        this.requestParams.params = this.apiParams;
      }
      async handlePost() {
        let params = this.apiParams;
        if (params.token) {
          let token = params.token;
          delete params.token;
          params.token = token;
        }
        if (params.action === "query" || params.action === "parse") {
          this.requestParams.headers["Promise-Non-Write-API-Action"] = "true";
        }
        if (this.useMultipartFormData()) {
          await this.handlePostMultipartFormData();
        } else {
          this.requestParams.data = Object.entries(params).map(([key, val]) => {
            return encodeURIComponent(key) + "=" + encodeURIComponent(val);
          }).join("&");
        }
      }
      useMultipartFormData() {
        let ctype = this.requestParams?.headers?.["Content-Type"];
        if (ctype === "multipart/form-data") {
          return true;
        } else if (this.hasLongFields && ctype === void 0) {
          return true;
        }
        return false;
      }
      async handlePostMultipartFormData() {
        let params = this.apiParams, requestOptions = this.requestParams;
        let form = new FormData2();
        for (let [key, val] of Object.entries(params)) {
          if (val instanceof Object && "stream" in val) {
            form.append(key, val.stream, val.name);
          } else {
            form.append(key, val);
          }
        }
        requestOptions.data = form;
        requestOptions.headers = await new Promise((resolve, reject) => {
          form.getLength((err, length) => {
            if (err) {
              reject(err);
            }
            resolve({
              ...requestOptions.headers,
              ...form.getHeaders(),
              "Content-Length": length
            });
          });
        });
      }
    };
    exports.Request = Request;
    var Response = class {
      constructor(bot, params, requestOptions) {
        this.bot = bot;
        this.params = params;
        this.requestOptions = requestOptions;
      }
      async process(rawResponse) {
        this.rawResponse = rawResponse;
        this.response = rawResponse.data;
        await this.initialCheck();
        this.showWarnings();
        return await this.handleErrors() || this.response;
      }
      async initialCheck() {
        if (typeof this.response !== "object") {
          if (this.params.format !== "json") {
            return (0, error_1.rejectWithError)({
              code: "mwn_invalidformat",
              info: "Must use format=json!",
              response: this.response
            });
          }
          return (0, error_1.rejectWithError)({
            code: "invalidjson",
            info: "No valid JSON response",
            response: this.response
          });
        }
      }
      showWarnings() {
        if (this.response.warnings && !this.bot.options.suppressAPIWarnings) {
          if (Array.isArray(this.response.warnings)) {
            for (let { code, module: module2, info, html, text } of this.response.warnings) {
              if (code === "deprecation-help") {
                continue;
              }
              const msg = info || // errorformat=bc
              text || // errorformat=wikitext/plaintext
              html;
              (0, log_1.log)(`[W] Warning received from API: ${module2}: ${msg}`);
            }
          } else {
            for (let [key, info] of Object.entries(this.response.warnings)) {
              (0, log_1.log)(`[W] Warning received from API: ${key}: ${info.warnings}`);
            }
          }
        }
      }
      async handleErrors() {
        let error = this.response.error || // errorformat=bc (default)
        this.response.errors?.[0];
        if (error) {
          error = new error_1.MwnError(error);
          if (this.requestOptions.retryNumber < this.bot.options.maxRetries) {
            switch (error.code) {
              // This will not work if the token type to be used is defined by an
              // extension, and not a part of mediawiki core
              case "badtoken":
                (0, log_1.log)(`[W] Encountered badtoken error, fetching new token and retrying`);
                return Promise.all([
                  this.bot.getTokenType(this.params.action),
                  this.bot.getTokens()
                ]).then(([tokentype]) => {
                  if (!tokentype || !this.bot.state[tokentype + "token"]) {
                    return this.dieWithError(error);
                  }
                  this.params.token = this.bot.state[tokentype + "token"];
                  return this.retry();
                });
              case "readonly":
                (0, log_1.log)(`[W] Encountered readonly error, waiting for ${this.bot.options.retryPause / 1e3} seconds before retrying`);
                return (0, utils_1.sleep)(this.bot.options.retryPause).then(() => {
                  return this.retry();
                });
              case "maxlag":
                let pause = parseInt(this.rawResponse.headers["retry-after"]);
                if (isNaN(pause)) {
                  pause = this.bot.options.retryPause / 1e3;
                }
                (0, log_1.log)(`[W] Encountered maxlag: ${error.lag} seconds lagged. Waiting for ${pause} seconds before retrying`);
                return (0, utils_1.sleep)(pause * 1e3).then(() => {
                  return this.retry();
                });
              case "assertbotfailed":
              case "assertuserfailed":
                if (this.bot.usingOAuth) {
                  return this.dieWithError(error);
                }
                (0, log_1.log)(`[W] Received ${error.code}, attempting to log in and retry`);
                return this.bot.login().then(() => {
                  return this.retry();
                });
              case "mwoauth-invalid-authorization":
                if (error.info.includes("Nonce already used")) {
                  (0, log_1.log)(`[W] Retrying failed OAuth authentication in ${this.bot.options.retryPause / 1e3} seconds`);
                  return (0, utils_1.sleep)(this.bot.options.retryPause).then(() => {
                    return this.retry();
                  });
                } else {
                  return this.dieWithError(error);
                }
              default:
                return this.dieWithError(error);
            }
          } else {
            return this.dieWithError(error);
          }
        }
      }
      retry() {
        this.requestOptions.retryNumber += 1;
        return this.bot.request(this.params, this.requestOptions);
      }
      dieWithError(error) {
        let response = this.rawResponse, requestOptions = this.requestOptions;
        let errorData = Object.assign({}, error, {
          // Enhance error object with additional information:
          // the full API response: everything in AxiosResponse object except
          // config (not needed) and request (included as errorData.request instead)
          response: {
            data: response.data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          },
          // the original request, should the client want to retry the request
          request: requestOptions
        });
        return (0, error_1.rejectWithError)(errorData);
      }
      /**
       * This handles errors at the network level
       * @param {Object} error
       */
      handleRequestFailure(error) {
        if (!error.disableRetry && !(error instanceof TypeError) && this.requestOptions.retryNumber < this.bot.options.maxRetries && // ENOTFOUND usually means bad apiUrl is provided, retrying is pointless and annoying
        error.code !== "ENOTFOUND" && (!error.response?.status || // Vaguely retriable error codes
        [408, 409, 425, 429, 500, 502, 503, 504].includes(error.response.status))) {
          this.logError(error);
          return (0, utils_1.sleep)(this.bot.options.retryPause).then(() => {
            return this.retry();
          });
        }
        error.request = this.requestOptions;
        return (0, error_1.rejectWithError)(error);
      }
      logError(err) {
        (0, log_1.log)(`[W] Retrying in ${this.bot.options.retryPause / 1e3} seconds: encountered ${err}`);
        const errorData = {
          request: {
            method: err?.request?.method,
            path: err?.request?.path
          },
          response: {
            status: err?.response?.status,
            statusText: err?.response?.statusText,
            headers: err?.response?.headers,
            data: err?.response?.data
          }
        };
        console.log(errorData);
      }
    };
    exports.Response = Response;
  }
});

// node_modules/mwn/build/static_utils.js
var require_static_utils = __commonJS({
  "node_modules/mwn/build/static_utils.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.util = exports.Table = void 0;
    exports.link = link;
    exports.template = template;
    function link(target, displaytext) {
      if (typeof target === "string") {
        return "[[" + target + (displaytext ? "|" + displaytext : "") + "]]";
      }
      return "[[" + target.toText() + (target.fragment ? "#" + target.fragment : "") + (displaytext ? "|" + displaytext : "") + "]]";
    }
    function template(title, parameters = {}) {
      if (typeof title !== "string") {
        if (title.namespace === 10) {
          title = title.getMainText();
        } else if (title.namespace === 0) {
          title = ":" + title.toText();
        } else {
          title = title.toText();
        }
      }
      return "{{" + title + Object.entries(parameters).filter(([, value]) => !!value).map(([name, value]) => `|${name}=${value}`).join("") + "}}";
    }
    var Table = class {
      constructor(config = {}) {
        this.numRows = 0;
        let classes = new Set(config.classes);
        if (!config.plain) {
          classes.add("wikitable");
        }
        if (config.sortable !== false) {
          classes.add("sortable");
        }
        if (config.multiline !== false) {
          this.multiline = true;
        }
        this.text = `{|`;
        if (classes.size) {
          this.text += ` class="${[...classes].join(" ")}"`;
        }
        if (config.style) {
          this.text += ` style="${config.style}"`;
        }
        this.text += "\n";
      }
      _makecell(cell, isHeader) {
        if (cell && typeof cell === "object") {
          let text = isHeader ? `scope="col"` : ``;
          for (let [key, value] of Object.entries(cell)) {
            if (key === "label") {
              continue;
            }
            text += ` ${key}="${value}"`;
          }
          text += ` | ${cell.label}`;
          return text;
        }
        return String(cell);
      }
      /**
       * Add the headers
       * @param headers - array of header items
       */
      addHeaders(headers) {
        this.text += `|-
`;
        if (this.multiline) {
          this.text += headers.map((e) => `! ${this._makecell(e, true)} 
`).join("");
        } else {
          this.text += `! ` + headers.map((e) => this._makecell(e, true)).join(" !! ") + "\n";
        }
      }
      /**
       * Add a row to the table
       * @param fields - array of items on the row,
       * @param attributes - row attributes
       */
      addRow(fields, attributes = {}) {
        this.numRows++;
        let attributetext = "";
        Object.entries(attributes).forEach(([key, value]) => {
          attributetext += ` ${key}="${value}"`;
        });
        this.text += `|-${attributetext}
`;
        if (this.multiline) {
          this.text += fields.map((e) => `| ${this._makecell(e)} 
`).join("");
        } else {
          this.text += `| ` + fields.map((f) => this._makecell(f)).join(" || ") + "\n";
        }
      }
      getNumRows() {
        return this.numRows;
      }
      /** Returns the final table wikitext */
      getText() {
        return this.text + `|}`;
      }
    };
    exports.Table = Table;
    function rawurlencode(str) {
      return encodeURIComponent(String(str)).replace(/!/g, "%21").replace(/'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/\*/g, "%2A").replace(/~/g, "%7E");
    }
    function isIPv4Address(address, allowBlock) {
      let block, RE_IP_BYTE = "(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|0?[0-9]?[0-9])", RE_IP_ADD = "(?:" + RE_IP_BYTE + "\\.){3}" + RE_IP_BYTE;
      if (typeof address !== "string") {
        return false;
      }
      block = allowBlock ? "(?:\\/(?:3[0-2]|[12]?\\d))?" : "";
      return new RegExp("^" + RE_IP_ADD + block + "$").test(address);
    }
    function isIPv6Address(address, allowBlock) {
      let block, RE_IPV6_ADD;
      if (typeof address !== "string") {
        return false;
      }
      block = allowBlock ? "(?:\\/(?:12[0-8]|1[01][0-9]|[1-9]?\\d))?" : "";
      RE_IPV6_ADD = "(?::(?::|(?::[0-9A-Fa-f]{1,4}){1,7})|[0-9A-Fa-f]{1,4}(?::[0-9A-Fa-f]{1,4}){0,6}::|[0-9A-Fa-f]{1,4}(?::[0-9A-Fa-f]{1,4}){7})";
      if (new RegExp("^" + RE_IPV6_ADD + block + "$").test(address)) {
        return true;
      }
      RE_IPV6_ADD = "[0-9A-Fa-f]{1,4}(?:::?[0-9A-Fa-f]{1,4}){1,6}";
      return new RegExp("^" + RE_IPV6_ADD + block + "$").test(address) && /::/.test(address) && !/::.*::/.test(address);
    }
    function escapeRegExp(str) {
      return str.replace(/([\\{}()|.?*+\-^$\[\]])/g, "\\$1");
    }
    function escapeHtml(s) {
      return s.replace(/['"<>&]/g, function escapeCallback(s2) {
        switch (s2) {
          case "'":
            return "&#039;";
          case '"':
            return "&quot;";
          case "<":
            return "&lt;";
          case ">":
            return "&gt;";
          case "&":
            return "&amp;";
        }
      });
    }
    function wikiUrlencode(str) {
      return rawurlencode(str).replace(/%20/g, "_").replace(/%3B/g, ";").replace(/%40/g, "@").replace(/%24/g, "$").replace(/%21/g, "!").replace(/%2A/g, "*").replace(/%28/g, "(").replace(/%29/g, ")").replace(/%2C/g, ",").replace(/%2F/g, "/").replace(/%7E/g, "~").replace(/%3A/g, ":");
    }
    function isIPAddress(address, allowBlock) {
      return isIPv4Address(address, allowBlock) || isIPv6Address(address, allowBlock);
    }
    exports.util = {
      escapeRegExp,
      escapeHtml,
      rawurlencode,
      wikiUrlencode,
      isIPv4Address,
      isIPv6Address,
      isIPAddress
    };
  }
});

// node_modules/mwn/build/bot.js
var require_bot = __commonJS({
  "node_modules/mwn/build/bot.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Mwn = void 0;
    var fs = __require("node:fs");
    var path = __require("node:path");
    var crypto = __require("node:crypto");
    var http = __require("node:http");
    var https = __require("node:https");
    var axios_1 = require_axios();
    var tough = require_cookie();
    var OAuth = require_oauth_1_0a();
    var date_1 = require_date();
    var title_1 = require_title();
    var page_1 = require_page();
    var wikitext_1 = require_wikitext();
    var user_1 = require_user();
    var category_1 = require_category();
    var file_1 = require_file();
    var core_1 = require_core();
    var log_1 = require_log();
    var error_1 = require_error();
    var static_utils_1 = require_static_utils();
    var utils_1 = require_utils();
    var Mwn2 = class _Mwn {
      /**
       * Constructs a new bot instance. Recommended usage is one bot instance for every wiki and user.
       * A bot instance has its own state (e.g. tokens) that is necessary for some operations.
       *
       * @param [customOptions] - Custom options
       */
      constructor(customOptions) {
        this.state = {};
        this.loggedIn = false;
        this.csrfToken = "%notoken%";
        this.defaultOptions = {
          silent: false,
          apiUrl: null,
          userAgent: "mwn",
          username: null,
          password: null,
          OAuthCredentials: {
            consumerToken: null,
            consumerSecret: null,
            accessToken: null,
            accessSecret: null
          },
          OAuth2AccessToken: null,
          maxRetries: 3,
          retryPause: 5e3,
          shutoff: {
            intervalDuration: 1e4,
            page: null,
            condition: /^\s*$/,
            onShutoff() {
            }
          },
          defaultParams: {
            format: "json",
            formatversion: "2",
            maxlag: 5
          },
          suppressAPIWarnings: false,
          editConfig: {
            conflictRetries: 2,
            suppressNochangeWarning: false,
            exclusionRegex: null
          },
          suppressInvalidDateWarning: false
        };
        this.cookieJar = new tough.CookieJar();
        this.axiosInstance = axios_1.default.create();
        this.requestOptions = (0, utils_1.mergeDeep1)({
          responseType: "json"
        }, _Mwn.requestDefaults);
        this.shutoff = {
          state: false,
          hook: null
        };
        this.hasApiHighLimit = false;
        this.Title = (0, title_1.default)();
        this.Page = (0, page_1.default)(this);
        this.Category = (0, category_1.default)(this);
        this.File = (0, file_1.default)(this);
        this.User = (0, user_1.default)(this);
        this.Wikitext = (0, wikitext_1.default)(this);
        this.Date = (0, date_1.default)(this);
        this.loginInProgress = null;
        this.sleep = utils_1.sleep;
        if (process.versions.node) {
          let majorVersion = parseInt(process.versions.node);
          if (majorVersion < 14) {
            (0, log_1.log)(`[W] Detected node version v${process.versions.node}, but mwn is supported only on node v14.x and above`);
          }
        }
        if (typeof customOptions === "string") {
          try {
            customOptions = JSON.parse(fs.readFileSync(customOptions).toString());
          } catch (err) {
            throw new Error(`Failed to read or parse JSON config file: ` + err);
          }
        }
        this.options = (0, utils_1.mergeDeep1)(this.defaultOptions, customOptions);
        this.axiosInstance.interceptors.request.use(async (config) => {
          const cookieHeader = await this.cookieJar.getCookieString(config.url);
          if (cookieHeader) {
            config.headers.Cookie = cookieHeader;
          }
          return config;
        });
        this.axiosInstance.interceptors.response.use(async (response) => {
          const setCookieHeaders = response.headers["set-cookie"];
          if (setCookieHeaders) {
            for (const cookie of setCookieHeaders) {
              await this.cookieJar.setCookie(cookie, response.config.url);
            }
          }
          return response;
        });
      }
      /**
       * Initialize a bot object. Login to the wiki and fetch editing tokens. If OAuth
       * credentials are provided, they will be used over BotPassword credentials.
       * Also fetches the site data needed for parsing and constructing title objects.
       * @param {Object} config - Bot configurations, including apiUrl, and either the
       * username and password or the OAuth credentials
       * @returns {Promise<Mwn>} bot object
       */
      static async init(config) {
        const bot = new _Mwn(config);
        if (bot.options.OAuth2AccessToken || bot._usingOAuth()) {
          bot.initOAuth();
          await bot.getTokensAndSiteInfo();
        } else {
          await bot.login();
        }
        return bot;
      }
      /**
       * Set and overwrite mwn options
       * @param {Object} customOptions
       */
      setOptions(customOptions) {
        this.options = (0, utils_1.mergeDeep1)(this.options, customOptions);
      }
      /**
       * Sets the API URL for MediaWiki requests
       * This can be uses instead of a login, if no actions are used that require login.
       * @param {string} apiUrl - API url to MediaWiki, e.g. https://en.wikipedia.org/w/api.php
       */
      setApiUrl(apiUrl) {
        this.options.apiUrl = apiUrl;
      }
      /**
       * Sets and overwrites the raw request options, used by the axios library
       * See https://www.npmjs.com/package/axios
       */
      setRequestOptions(customRequestOptions) {
        (0, utils_1.mergeDeep1)(this.requestOptions, customRequestOptions);
      }
      /**
       * Set the default parameters to be sent in API calls.
       * @param {Object} params - default parameters
       */
      setDefaultParams(params) {
        this.options.defaultParams = (0, utils_1.merge)(this.options.defaultParams, params);
      }
      /**
       * Set your API user agent. See https://meta.wikimedia.org/wiki/User-Agent_policy
       * Required for WMF wikis.
       * @param {string} userAgent
       */
      setUserAgent(userAgent) {
        this.options.userAgent = userAgent;
      }
      /**
       * @private
       * Determine if we're going to use OAuth for authentication
       */
      _usingOAuth() {
        const creds = this.options.OAuthCredentials;
        if (typeof creds !== "object") {
          return false;
        }
        if (!creds.consumerToken || !creds.consumerSecret || !creds.accessToken || !creds.accessSecret) {
          return false;
        }
        return true;
      }
      /**
       * Initialize OAuth instance
       */
      initOAuth() {
        if (this.options.OAuth2AccessToken) {
          this.usingOAuth2 = true;
          return;
        }
        if (!this._usingOAuth()) {
          throw new Error("[mwn] Invalid OAuth config");
        }
        try {
          this.oauth = new OAuth({
            consumer: {
              key: this.options.OAuthCredentials.consumerToken,
              secret: this.options.OAuthCredentials.consumerSecret
            },
            signature_method: "HMAC-SHA1",
            // based on example at https://www.npmjs.com/package/oauth-1.0a
            hash_function(base_string, key) {
              return crypto.createHmac("sha1", key).update(base_string).digest("base64");
            }
          });
          this.usingOAuth = true;
        } catch (err) {
          throw new Error("Failed to construct OAuth object. " + err);
        }
      }
      /************ CORE REQUESTS ***************/
      /**
       * Executes a raw request
       * Uses the axios library
       * @param {Object} requestOptions
       * @returns {Promise}
       */
      async rawRequest(requestOptions) {
        if (!requestOptions.url) {
          return (0, error_1.rejectWithError)({
            code: "mwn_nourl",
            info: "No URL provided for API request!",
            disableRetry: true,
            request: requestOptions
          });
        }
        const config = (0, utils_1.mergeDeep1)({}, _Mwn.requestDefaults, {
          method: "get",
          headers: {
            "User-Agent": this.options.userAgent
          }
        }, requestOptions);
        return this.axiosInstance(config);
      }
      /**
       * Executes a request with the ability to use custom parameters and custom
       * request options
       * @param {Object} params
       * @param {Object} [customRequestOptions={}]
       * @returns {Promise}
       */
      async request(params, customRequestOptions = {}) {
        if (this.shutoff.state) {
          return (0, error_1.rejectWithError)({
            code: "bot-shutoff",
            info: `Bot was shut off (check ${this.options.shutoff.page})`
          });
        }
        const req = new core_1.Request(this, params, customRequestOptions);
        await req.process();
        return this.rawRequest(req.requestParams).then((fullResponse) => new core_1.Response(this, req.apiParams, req.requestParams).process(fullResponse), (error) => new core_1.Response(this, req.apiParams, req.requestParams).handleRequestFailure(error));
      }
      async query(params, customRequestOptions = {}) {
        return this.request(Object.assign({ action: "query" }, params), customRequestOptions);
      }
      /**
       * Executes a Login
       * @see https://www.mediawiki.org/wiki/API:Login
       * @returns {Promise}
       */
      async login(loginOptions) {
        Object.assign(this.options, loginOptions);
        if (!this.loginInProgress) {
          const loginPromise = this.loginInternal();
          this.loginInProgress = [this.options.username, loginPromise];
          loginPromise.finally(() => {
            this.loginInProgress = null;
          });
        } else if (this.loginInProgress[0] !== this.options.username) {
          return (0, error_1.rejectWithError)({
            code: "mwn_invalidlogin",
            info: "Detected concurrent login with a different username"
          });
        }
        return this.loginInProgress[1];
      }
      async loginInternal() {
        if (!this.options.username || !this.options.password || !this.options.apiUrl) {
          return (0, error_1.rejectWithError)({
            code: "mwn_nologincredentials",
            info: "Incomplete login credentials!"
          });
        }
        let loginString = this.options.username + "@" + this.options.apiUrl;
        const loginTokenResponse = await this.request({
          action: "query",
          meta: "tokens",
          type: "login",
          // Unset the assert parameter (in case it's given by the user as a default
          // option), as it will invariably fail until login is performed.
          assert: void 0,
          // Also unset the maxlag parameter, not required for logins.
          // This also avoids infinite recursion when assert and maxlag are both provided and replicas are lagged.
          maxlag: void 0
        });
        if (!loginTokenResponse?.query?.tokens?.logintoken) {
          (0, log_1.log)("[E] [mwn] Login failed with invalid response: " + loginString);
          return (0, error_1.rejectWithError)({
            code: "mwn_notoken",
            info: "Failed to get login token",
            response: loginTokenResponse
          });
        }
        Object.assign(this.state, loginTokenResponse.query.tokens);
        const loginResponse = await this.request({
          action: "login",
          lgname: this.options.username,
          lgpassword: this.options.password,
          lgtoken: loginTokenResponse.query.tokens.logintoken,
          assert: void 0,
          // as above, assert won't work till the user is logged in
          maxlag: void 0
          // as above, to avoid infinite recursions in error handling
        });
        let reason;
        let data = loginResponse.login;
        if (data) {
          if (data.result === "Success") {
            Object.assign(this.state, data);
            this.loggedIn = true;
            if (!this.options.silent) {
              (0, log_1.log)("[S] [mwn] Login successful: " + loginString);
            }
            await this.getTokensAndSiteInfo().catch((err) => {
              (0, log_1.log)(`[W] Failed fetching tokens and siteinfo: ${err}`);
            });
            return data;
          } else if (data.result === "Aborted") {
            if (data.reason === "Cannot log in when using MediaWiki\\Session\\BotPasswordSessionProvider sessions.") {
              reason = `Already logged in as ${this.options.username}, logout first to re-login`;
            } else if (data.reason === "Cannot log in when using MediaWiki\\Extension\\OAuth\\SessionProvider sessions.") {
              reason = `Cannot use login/logout while using OAuth`;
            } else if (data.reason) {
              reason = data.result + ": " + data.reason;
            }
          } else if (data.result && data.reason) {
            reason = data.result + ": " + data.reason;
          }
        }
        return (0, error_1.rejectWithError)({
          code: "mwn_failedlogin",
          info: reason || "Login failed",
          response: loginResponse
        });
      }
      /**
       * Log out of the account. Flushes the cookie jar and clears the saved tokens.
       * Should not be used if authenticating via OAuth.
       * @returns {Promise<void>}
       */
      async logout() {
        if (this.usingOAuth) {
          throw new Error("Can't use logout() while using OAuth");
        }
        return this.request({
          action: "logout",
          token: this.csrfToken
        }).then(() => {
          this.loggedIn = false;
          this.state = {};
          this.csrfToken = "%notoken%";
          return this.cookieJar.removeAllCookies();
        });
      }
      /**
       * Create an account. Only works on wikis without extensions like
       * ConfirmEdit enabled (hence doesn't work on WMF wikis).
       * @param username
       * @param password
       */
      async createAccount(username, password) {
        if (!this.state.createaccounttoken) {
          await this.getTokens();
        }
        return this.request({
          action: "createaccount",
          createreturnurl: "https://example.com",
          createtoken: this.state.createaccounttoken,
          username,
          password,
          retype: password
        }).then((json) => {
          let data = json.createaccount;
          if (data.status === "FAIL") {
            return (0, error_1.rejectWithError)({
              code: data.messagecode,
              info: data.message,
              ...data
            });
          } else {
            return data;
          }
        });
      }
      /**
       * Get basic info about the logged-in user
       * @param [options]
       * @returns {Promise}
       */
      async userinfo(options = {}) {
        return this.request({
          action: "query",
          meta: "userinfo",
          ...options
        }).then((response) => response.query.userinfo);
      }
      /**
       * Gets namespace-related information for use in title nested class.
       * This need not be used if login() is being used. This is for cases
       * where mwn needs to be used without logging in.
       * @returns {Promise<void>}
       */
      async getSiteInfo() {
        return this.request({
          action: "query",
          meta: "siteinfo",
          siprop: "general|namespaces|namespacealiases"
        }).then((result) => {
          this.Title.processNamespaceData(result);
        });
      }
      /**
       * Get tokens and saves them in this.state
       * @returns {Promise<void>}
       */
      async getTokens() {
        return this.request({
          action: "query",
          meta: "tokens",
          type: "csrf|createaccount|login|patrol|rollback|userrights|watch"
        }).then((response) => {
          if (response.query && response.query.tokens) {
            this.csrfToken = response.query.tokens.csrftoken;
            this.state = (0, utils_1.merge)(this.state, response.query.tokens);
          } else {
            return (0, error_1.rejectWithError)({
              code: "mwn_notoken",
              info: "Could not get token",
              response
            });
          }
        });
      }
      /**
       * Gets an edit token (also used for most other actions
       * such as moving and deleting)
       * This is only compatible with MW >= 1.24
       * @returns {Promise<string>}
       */
      async getCsrfToken() {
        return this.getTokens().then(() => this.csrfToken);
      }
      /**
       * Get tokens and siteinfo (using a single API request) and save them in the bot state.
       * @returns {Promise<void>}
       */
      async getTokensAndSiteInfo() {
        return this.request({
          action: "query",
          meta: "tokens|siteinfo|userinfo",
          type: "csrf|createaccount|login|patrol|rollback|userrights|watch",
          siprop: "general|namespaces|namespacealiases",
          uiprop: "rights",
          maxlag: void 0
        }).then((response) => {
          this.Title.processNamespaceData(response);
          if (response.query.userinfo.rights.includes("apihighlimits")) {
            this.hasApiHighLimit = true;
          }
          if (response.query && response.query.tokens) {
            this.csrfToken = response.query.tokens.csrftoken;
            this.state = (0, utils_1.merge)(this.state, response.query.tokens);
          } else {
            return (0, error_1.rejectWithError)({
              code: "mwn_notoken",
              info: "Could not get token",
              response
            });
          }
        });
      }
      /**
       * Get type of token to be used with an API action
       * @param {string} action - API action parameter
       * @returns {Promise<string>}
       */
      async getTokenType(action) {
        return this.request({
          action: "paraminfo",
          modules: action
        }).then((response) => {
          return response.paraminfo.modules[0].parameters.find((p) => p.name === "token").tokentype;
        });
      }
      /**
       * Get the wiki's server time
       * @returns {Promise<string>}
       */
      async getServerTime() {
        return this.request({
          action: "query",
          curtimestamp: true
        }).then((data) => {
          return data.curtimestamp;
        });
      }
      /**
       * Fetch and parse a JSON wikipage
       * @param {string} title - page title
       * @returns {Promise<Object>} parsed JSON object
       */
      async parseJsonPage(title) {
        return this.read(title).then((data) => {
          try {
            return JSON.parse(data.revisions[0].content);
          } catch {
            return (0, error_1.rejectWithErrorCode)("invalidjson");
          }
        });
      }
      /**
       * Fetch MediaWiki messages
       * @param messages
       * @param options
       */
      async getMessages(messages, options = {}) {
        return this.request({
          action: "query",
          meta: "allmessages",
          ammessages: messages,
          ...options
        }).then((data) => {
          let result = {};
          data.query.allmessages.forEach((obj) => {
            if (!obj.missing) {
              result[obj.name] = obj.content;
            }
          });
          return result;
        });
      }
      /**
       * Enable bot emergency shutoff
       */
      enableEmergencyShutoff(shutoffOptions) {
        Object.assign(this.options.shutoff, shutoffOptions);
        this.shutoff.hook = setInterval(async () => {
          let text = await new this.Page(this.options.shutoff.page).text();
          let cond = this.options.shutoff.condition;
          if (cond instanceof RegExp && !cond.test(text) || cond instanceof Function && !cond(text)) {
            this.shutoff.state = true;
            this.disableEmergencyShutoff();
            this.options.shutoff.onShutoff(text);
          }
        }, this.options.shutoff.intervalDuration);
      }
      /**
       * Disable emergency shutoff detection.
       * Use this only if it was ever enabled.
       */
      disableEmergencyShutoff() {
        clearInterval(this.shutoff.hook);
      }
      read(titles, options) {
        let pages = Array.isArray(titles) ? titles : [titles];
        let batchFieldName = typeof pages[0] === "number" ? "pageids" : "titles";
        return this.massQuery({
          action: "query",
          ...(0, utils_1.makeTitles)(titles),
          prop: "revisions",
          rvprop: "content|timestamp",
          rvslots: "main",
          redirects: true,
          ...options
        }, batchFieldName).then((jsons) => {
          let data = jsons.reduce((data2, json) => {
            json.query.pages.forEach((pg) => {
              if (pg.revisions) {
                pg.revisions.forEach((rev) => {
                  Object.assign(rev, rev.slots.main);
                });
              }
            });
            return data2.concat(json.query.pages);
          }, []);
          return data.length === 1 ? data[0] : data;
        });
      }
      async *readGen(titles, options, batchSize) {
        let massQueryResponses = this.massQueryGen({
          action: "query",
          ...(0, utils_1.makeTitles)(titles),
          prop: "revisions",
          rvprop: "content|timestamp",
          rvslots: "main",
          redirects: true,
          ...options
        }, typeof titles[0] === "number" ? "pageids" : "titles", batchSize);
        for await (let response of massQueryResponses) {
          if (response && response.query && response.query.pages) {
            for (let pg of response.query.pages) {
              if (pg.revisions) {
                pg.revisions.forEach((rev) => {
                  Object.assign(rev, rev.slots.main);
                });
              }
              yield pg;
            }
          }
        }
      }
      // adapted from mw.Api().edit
      /**
       * @param {string|number|MwnTitle} title - Page title or page ID or MwnTitle object
       * @param {Function} transform - Callback that prepares the edit. It takes one
       * argument that is an { content: 'string: page content', timestamp: 'string:
       * time of last edit' } object. This function should return an object with
       * edit API parameters or just the updated text, or a promise providing one of
       * those.
       * @param {Object} [editConfig] - Overridden edit options. Available options:
       * conflictRetries, suppressNochangeWarning, exclusionRegex
       * @return {Promise<Object>} Edit API response
       */
      async edit(title, transform, editConfig) {
        editConfig = editConfig || this.options.editConfig;
        let basetimestamp, curtimestamp;
        return this.request({
          action: "query",
          ...(0, utils_1.makeTitles)(title),
          prop: "revisions",
          rvprop: ["content", "timestamp"],
          rvslots: "main",
          formatversion: "2",
          curtimestamp: true
        }).then((data) => {
          let page, revision, revisionContent;
          if (!data.query || !data.query.pages) {
            return (0, error_1.rejectWithErrorCode)("unknown");
          }
          page = data.query.pages[0];
          if (!page || page.invalid) {
            return (0, error_1.rejectWithErrorCode)("invalidtitle");
          }
          if (page.missing) {
            return Promise.reject(new error_1.MwnMissingPageError());
          }
          revision = page.revisions[0];
          try {
            revisionContent = revision.slots.main.content;
          } catch {
            return (0, error_1.rejectWithErrorCode)("unknown");
          }
          basetimestamp = revision.timestamp;
          curtimestamp = data.curtimestamp;
          if (editConfig.exclusionRegex && editConfig.exclusionRegex.test(revisionContent)) {
            return (0, error_1.rejectWithErrorCode)("bot-denied");
          }
          return transform({
            timestamp: revision.timestamp,
            content: revisionContent
          });
        }).then((returnVal) => {
          if (typeof returnVal !== "string" && !returnVal) {
            return { edit: { result: "aborted" } };
          }
          const editParams = typeof returnVal === "object" ? returnVal : {
            text: String(returnVal)
          };
          return this.request({
            action: "edit",
            ...(0, utils_1.makeTitle)(title),
            formatversion: "2",
            basetimestamp,
            starttimestamp: curtimestamp,
            nocreate: true,
            bot: true,
            token: this.csrfToken,
            ...editParams
          });
        }).then((data) => {
          if (data.edit && data.edit.nochange && !editConfig.suppressNochangeWarning) {
            (0, log_1.log)(`[W] No change from edit to ${data.edit.title}`);
          }
          return data.edit;
        }, (err) => {
          if (err.code === "editconflict" && editConfig.conflictRetries > 0) {
            editConfig.conflictRetries--;
            return this.edit(title, transform, editConfig);
          } else {
            return (0, error_1.rejectWithError)(err);
          }
        });
      }
      /**
       * Edit a page without loading it first. Straightforward version of `edit`.
       * No edit conflict detection.
       *
       * @param {string|number}  title - title or pageid (as number)
       * @param {string}  content
       * @param {string}  [summary]
       * @param {object}  [options]
       * @returns {Promise}
       */
      async save(title, content, summary, options) {
        return this.request({
          action: "edit",
          ...(0, utils_1.makeTitle)(title),
          text: content,
          summary,
          bot: true,
          token: this.csrfToken,
          ...options
        }).then((data) => data.edit);
      }
      /**
       * Creates a new pages. Does not edit existing ones
       *
       * @param {string}  title
       * @param {string}  content
       * @param {string}  [summary]
       * @param {object}  [options]
       *
       * @returns {Promise}
       */
      async create(title, content, summary, options) {
        return this.request({
          action: "edit",
          title: String(title),
          text: content,
          summary,
          createonly: true,
          bot: true,
          token: this.csrfToken,
          ...options
        }).then((data) => data.edit);
      }
      /**
       * Post a new section to the page.
       *
       * @param {string|number} title - title or pageid (as number)
       * @param {string} header
       * @param {string} message wikitext message
       * @param {Object} [additionalParams] Additional API parameters, e.g. `{ redirect: true }`
       */
      async newSection(title, header, message, additionalParams) {
        return this.request({
          action: "edit",
          ...(0, utils_1.makeTitle)(title),
          section: "new",
          summary: header,
          text: message,
          bot: true,
          token: this.csrfToken,
          ...additionalParams
        }).then((data) => data.edit);
      }
      /**
       * Deletes a page
       *
       * @param {string|number}  title - title or pageid (as number)
       * @param {string}  [summary]
       * @param {object}  [options]
       * @returns {Promise}
       */
      async delete(title, summary, options) {
        return this.request({
          action: "delete",
          ...(0, utils_1.makeTitle)(title),
          reason: summary,
          token: this.csrfToken,
          ...options
        }).then((data) => data.delete);
      }
      /**
       * Undeletes a page.
       * Note: all deleted revisions of the page will be restored.
       *
       * @param {string}  title
       * @param {string}  [summary]
       * @param {object}  [options]
       * @returns {Promise}
       */
      async undelete(title, summary, options) {
        return this.request({
          action: "undelete",
          title: String(title),
          reason: summary,
          token: this.csrfToken,
          ...options
        }).then((data) => data.undelete);
      }
      /**
       * Moves a new page
       *
       * @param {string}  fromtitle
       * @param {string}  totitle
       * @param {string}  [summary]
       * @param {object}  [options]
       */
      async move(fromtitle, totitle, summary, options) {
        return this.request({
          action: "move",
          from: fromtitle,
          to: totitle,
          reason: summary,
          movetalk: true,
          token: this.csrfToken,
          ...options
        }).then((data) => data.move);
      }
      /**
       * Parse wikitext. Convenience method for 'action=parse'.
       *
       * @param {string} content Content to parse.
       * @param {Object} additionalParams Parameters object to set custom settings, e.g.
       *   redirects, sectionpreview.  prop should not be overridden.
       * @return {Promise<string>}
       */
      async parseWikitext(content, additionalParams) {
        return this.request({
          action: "parse",
          text: String(content),
          contentmodel: "wikitext",
          disablelimitreport: true,
          disableeditsection: true,
          formatversion: 2,
          ...additionalParams
        }).then(function(data) {
          return data.parse.text;
        });
      }
      /**
       * Parse a given page. Convenience method for 'action=parse'.
       *
       * @param {string} title Title of the page to parse
       * @param {Object} additionalParams Parameters object to set custom settings, e.g.
       *   redirects, sectionpreview.  prop should not be overridden.
       * @return {Promise<string>}
       */
      async parseTitle(title, additionalParams) {
        return this.request({
          page: String(title),
          formatversion: 2,
          action: "parse",
          contentmodel: "wikitext",
          ...additionalParams
        }).then(function(data) {
          return data.parse.text;
        });
      }
      /**
       * Upload an image from the local disk to the wiki.
       * If a file with the same name exists, it will be over-written.
       * @param {string} filepath
       * @param {string} title
       * @param {string} text
       * @param {object} options
       * @returns {Promise<Object>}
       */
      async upload(filepath, title, text, options) {
        return this.request({
          action: "upload",
          file: {
            stream: fs.createReadStream(filepath),
            name: path.basename(filepath)
          },
          filename: title,
          text,
          ignorewarnings: true,
          token: this.csrfToken,
          ...options
        }, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }).then((data) => {
          if (data.upload.warnings) {
            (0, log_1.log)(`[W] The API returned warnings while uploading to ${title}:`);
            (0, log_1.log)(data.upload.warnings);
          }
          return data.upload;
        });
      }
      /**
       * Upload an image from a web URL to the wiki
       * If a file with the same name exists, it will be over-written,
       * to disable this behaviour, use `ignorewarning: false` in options.
       * @param {string} url
       * @param {string} title
       * @param {string} text
       * @param {Object} options
       * @returns {Promise<Object>}
       */
      async uploadFromUrl(url, title, text, options) {
        return this.request({
          action: "upload",
          url,
          filename: title || path.basename(url),
          text,
          ignorewarnings: true,
          token: this.csrfToken,
          ...options
        }).then((data) => {
          if (data.upload.warnings) {
            (0, log_1.log)("[W] The API returned warnings while uploading to " + title + ":");
            (0, log_1.log)(data.upload.warnings);
          }
          return data.upload;
        });
      }
      /**
       * Download an image from the wiki.
       * If you're downloading multiple images, then for better efficiency, you may want
       * to query the API for the urls of all images in one request, and follow that with
       * running downloadFromUrl for each one.
       * @param {string|number} file - title or page ID
       * @param {string} [localname] - local path (with file name) to download to,
       * defaults to current directory with same file name as on the wiki.
       * @returns {Promise<void>}
       */
      async download(file, localname) {
        return this.request({
          action: "query",
          ...(0, utils_1.makeTitles)(file),
          prop: "imageinfo",
          iiprop: "url"
        }).then((data) => {
          const url = data.query.pages[0].imageinfo[0].url;
          const name = new this.Title(data.query.pages[0].title).getMainText();
          return this.downloadFromUrl(url, localname || name);
        });
      }
      /**
       * Download an image from a URL.
       * @param {string} url
       * @param {string} [localname] - local path (with file name) to download to,
       * defaults to current directory with same file name as that of the web image.
       * @returns {Promise<void>}
       */
      async downloadFromUrl(url, localname) {
        return this.rawRequest({
          method: "get",
          url,
          responseType: "stream"
        }).then((response) => {
          const writeStream = response.data.pipe(fs.createWriteStream(localname || path.basename(url)));
          return new Promise((resolve, reject) => {
            writeStream.on("finish", () => {
              resolve();
            });
            writeStream.on("error", (err) => {
              reject(err);
            });
          });
        });
      }
      async saveOption(option, value) {
        return this.saveOptions({ [option]: value });
      }
      async saveOptions(options) {
        return this.request({
          action: "options",
          change: Object.entries(options).map(([key, val]) => key + "=" + val),
          token: this.csrfToken
        });
      }
      /**
       * Convenience method for `action=rollback`.
       *
       * @param {string|number} page - page title or page id as number or MwnTitle object
       * @param {string} user
       * @param {Object} [params] Additional parameters
       * @return {Promise}
       */
      async rollback(page, user, params) {
        return this.request({
          action: "rollback",
          ...(0, utils_1.makeTitle)(page),
          user,
          token: this.state.rollbacktoken,
          ...params
        }).then((data) => {
          return data.rollback;
        });
      }
      /**
       * Purge one or more pages (max 500 for bots, 50 for others)
       *
       * @param {String[]|String|number[]|number} titles - page titles or page ids
       * @param {Object} options
       * @returns {Promise}
       */
      async purge(titles, options) {
        return this.request({
          action: "purge",
          ...(0, utils_1.makeTitles)(titles),
          ...options
        }).then((data) => data.purge);
      }
      /**
       * Get pages with names beginning with a given prefix
       * @param {string} prefix
       * @param {Object} otherParams
       *
       * @returns {Promise<string[]>} - array of page titles (upto 5000 or 500)
       */
      async getPagesByPrefix(prefix, otherParams) {
        const title = this.Title.newFromText(prefix);
        if (!title) {
          throw new Error("invalid prefix for getPagesByPrefix");
        }
        return this.request({
          action: "query",
          list: "allpages",
          apprefix: title.title,
          apnamespace: title.namespace,
          aplimit: "max",
          ...otherParams
        }).then((data) => {
          return data.query.allpages.map((pg) => pg.title);
        });
      }
      /**
       * Get pages in a category
       * @param {string} category - name of category, with or without namespace prefix
       * @param {Object} [otherParams]
       * @returns {Promise<string[]>}
       */
      async getPagesInCategory(category, otherParams) {
        const title = this.Title.newFromText(category, 14);
        return this.request({
          action: "query",
          list: "categorymembers",
          cmtitle: title.toText(),
          cmlimit: "max",
          ...otherParams
        }).then((data) => {
          return data.query.categorymembers.map((pg) => pg.title);
        });
      }
      /**
       * Search the wiki.
       * @param {string} searchTerm
       * @param {number} limit
       * @param {("size"|"timestamp"|"wordcount"|"snippet"|"redirectitle"|"sectiontitle"|
       * "redirectsnippet"|"titlesnippet"|"sectionsnippet"|"categorysnippet")[]} props
       * @param {Object} otherParams
       * @returns {Promise<Object>}
       */
      async search(searchTerm, limit = 50, props, otherParams) {
        return this.request({
          action: "query",
          list: "search",
          srsearch: searchTerm,
          srlimit: limit,
          srprop: props || ["size", "wordcount", "timestamp"],
          ...otherParams
        }).then((data) => {
          return data.query.search;
        });
      }
      /************* BULK PROCESSING FUNCTIONS ************/
      /**
       * Send an API query that automatically continues till the limit is reached.
       *
       * @param {Object} query - The API query
       * @param {number} [limit=10] - limit on the maximum number of API calls to go through
       * @returns {Promise<Object[]>} - resolved with an array of responses of individual calls.
       */
      continuedQuery(query, limit = 10) {
        let responses = [];
        let callApi = (query2, count) => {
          return this.request(query2).then((response) => {
            if (!this.options.silent) {
              (0, log_1.log)(`[+] Got part ${count} of continuous API query`);
            }
            responses.push(response);
            if (response.continue && count < limit) {
              return callApi((0, utils_1.merge)(query2, response.continue), count + 1);
            } else {
              return responses;
            }
          });
        };
        return callApi(query, 1);
      }
      /**
       * Generator to iterate through API response continuations.
       * @generator
       * @param {Object} query
       * @param {number} [limit=Infinity]
       * @yields {Object} a single page of the response
       */
      async *continuedQueryGen(query, limit = Infinity) {
        let response = { continue: {} };
        for (let i = 0; i < limit; i++) {
          if (response.continue) {
            response = await this.request((0, utils_1.merge)(query, response.continue));
            yield response;
          } else {
            break;
          }
        }
      }
      /**
       * Function for using API action=query with more than 50/500 items in multi-
       * input fields.
       *
       * Multi-value fields in the query API take multiple inputs as an array
       * (internally converted to a pipe-delimted string) but with a limit of 500
       * (or 50 for users without apihighlimits).
       * Example: the fields titles, pageids and revids in any query, ususers in
       * list=users.
       *
       * This function allows you to send a query as if this limit didn't exist.
       * The array given to the multi-input field is split into batches and individual
       * queries are sent sequentially for each batch.
       * A promise is returned finally resolved with the array of responses of each
       * API call.
       *
       * The API calls are made via POST instead of GET to avoid potential 414 (URI
       * too long) errors.
       *
       * @param {Object} query - the query object, the multi-input field should
       * be an array
       * @param {string} [batchFieldName=titles] - the name of the multi-input field
       *
       * @returns {Promise<Object[]>} - promise resolved when all the API queries have
       * settled, with the array of responses.
       */
      massQuery(query, batchFieldName = "titles") {
        let batchValues = query[batchFieldName];
        if (!Array.isArray(batchValues)) {
          throw new Error(`massQuery: batch field in query must be an array`);
        }
        const limit = this.hasApiHighLimit ? 500 : 50;
        const numBatches = Math.ceil(batchValues.length / limit);
        let batches = new Array(numBatches);
        for (let i = 0; i < numBatches - 1; i++) {
          batches[i] = new Array(limit);
        }
        batches[numBatches - 1] = new Array(batchValues.length % limit);
        for (let i = 0; i < batchValues.length; i++) {
          batches[Math.floor(i / limit)][i % limit] = batchValues[i];
        }
        let responses = new Array(numBatches);
        return new Promise((resolve) => {
          const sendQuery = (idx) => {
            if (idx === numBatches) {
              return resolve(responses);
            }
            query[batchFieldName] = batches[idx];
            this.request(query, { method: "post" }).then((response) => {
              responses[idx] = response;
            }, (err) => {
              responses[idx] = err;
            }).finally(() => {
              sendQuery(idx + 1);
            });
          };
          sendQuery(0);
        });
      }
      /**
       * Generator version of massQuery(). Iterate through pages of API results.
       * @param {Object} query
       * @param {string} [batchFieldName=titles]
       * @param {number} [batchSize]
       */
      async *massQueryGen(query, batchFieldName = "titles", batchSize) {
        let batchValues = query[batchFieldName];
        if (!Array.isArray(batchValues)) {
          throw new Error(`massQuery: batch field in query must be an array`);
        }
        const limit = batchSize || (this.hasApiHighLimit ? 500 : 50);
        const batches = (0, utils_1.arrayChunk)(batchValues, limit);
        const numBatches = batches.length;
        for (let i = 0; i < numBatches; i++) {
          query[batchFieldName] = batches[i];
          yield await this.request(query, { method: "post" });
        }
      }
      /**
       * Execute an asynchronous function on a large number of pages (or other arbitrary
       * items). Designed for working with promises.
       *
       * @param {Array} list - list of items to execute actions upon. The array would
       * usually be of page names (strings).
       * @param {Function} worker - function to execute upon each item in the list. Must
       * return a promise.
       * @param {number} [concurrency=5] - number of concurrent operations to take place.
       * Set this to 1 for sequential operations. Default 5. Set this according to how
       * expensive the API calls made by worker are.
       * @param {number} [retries=0] - max number of times failing actions should be retried.
       * @returns {Promise<Object>} - resolved when all API calls have finished, with object
       * { failures: [ ...list of failed items... ] }
       */
      batchOperation(list, worker, concurrency = 5, retries = 0) {
        if (!list.length) {
          return Promise.resolve({ failures: {} });
        }
        let counts = {
          successes: 0,
          failures: 0
        };
        let failures = [];
        let incrementSuccesses = () => {
          counts.successes++;
        };
        const incrementFailures = (item, error) => {
          counts.failures++;
          failures.push({ item, error });
        };
        const updateStatusText = () => {
          const percentageFinished = Math.round((counts.successes + counts.failures) / list.length * 100);
          const percentageSuccesses = Math.round(counts.successes / (counts.successes + counts.failures) * 100);
          const statusText = `[+] Finished ${counts.successes + counts.failures}/${list.length} (${percentageFinished}%) tasks, of which ${counts.successes} (${percentageSuccesses}%) were successful, and ${counts.failures} failed.`;
          if (!this.options.silent) {
            (0, log_1.log)(statusText);
          }
        };
        const numBatches = Math.ceil(list.length / concurrency);
        return new Promise((resolve) => {
          const sendBatch = (batchIdx) => {
            if (batchIdx === numBatches - 1) {
              const numItemsInLastBatch = list.length - batchIdx * concurrency;
              const finalBatchPromises = new Array(numItemsInLastBatch);
              let finalBatchSettledPromises = new Array(numItemsInLastBatch);
              for (let i = 0; i < numItemsInLastBatch; i++) {
                let idx = batchIdx * concurrency + i;
                finalBatchPromises[i] = worker(list[idx], idx);
                if (!(0, utils_1.ispromise)(finalBatchPromises[i])) {
                  throw new Error("batchOperation worker function must return a promise");
                }
                finalBatchSettledPromises[i] = new Promise((resolve2) => {
                  return finalBatchPromises[i].then(resolve2, resolve2);
                });
                finalBatchPromises[i].then(incrementSuccesses, (err) => {
                  incrementFailures(list[idx], err);
                }).finally(function() {
                  updateStatusText();
                  finalBatchSettledPromises[i] = Promise.resolve();
                });
              }
              Promise.all(finalBatchSettledPromises).then(() => {
                if (counts.failures !== 0 && retries > 0) {
                  resolve(this.batchOperation(failures.map((f) => f.item), worker, concurrency, retries - 1));
                } else {
                  let keyedFailuresObject = {};
                  for (let { item, error } of failures) {
                    keyedFailuresObject[String(item)] = error;
                  }
                  resolve({ failures: keyedFailuresObject });
                }
              });
              return;
            }
            for (let i = 0; i < concurrency; i++) {
              let idx = batchIdx * concurrency + i;
              const promise = worker(list[idx], idx);
              if (!(0, utils_1.ispromise)(promise)) {
                throw new Error("batchOperation worker function must return a promise");
              }
              promise.then(incrementSuccesses, (err) => {
                incrementFailures(list[idx], err);
              }).finally(() => {
                updateStatusText();
                if (i === concurrency - 1) {
                  sendBatch(batchIdx + 1);
                }
              });
            }
          };
          sendBatch(0);
        });
      }
      /**
       * Execute an asynchronous function on a number of pages (or other arbitrary items)
       * sequentially, with a time delay between actions.
       * Using this with delay=0 is same as using batchOperation with batchSize=1
       * Use of seriesBatchOperation() is not recommended for MediaWiki API actions. Use the
       * normal mwn methods with async-await in a for loop. The request() method has the better
       * retry functionality (only network errors are retried, other errors are unlikely to go
       * away on retries).
       * @param {Array} list
       * @param {Function} worker - must return a promise
       * @param {number} [delay=5000] - number of milliseconds of delay
       * @param {number} [retries=0] - max number of times failing actions should be retried.
       * @returns {Promise<Object>} - resolved when all API calls have finished, with object
       * { failures: { failed item: error, failed item2: error2, ... } }
       */
      async seriesBatchOperation(list, worker, delay = 5e3, retries = 0) {
        let counts = {
          successes: 0,
          failures: 0
        };
        let failures = [];
        const incrementSuccesses = () => {
          counts.successes++;
        };
        const incrementFailures = (item, err) => {
          counts.failures++;
          failures.push({ item, err });
        };
        const updateStatusText = () => {
          const percentageFinished = Math.round((counts.successes + counts.failures) / list.length * 100);
          const percentageSuccesses = Math.round(counts.successes / (counts.successes + counts.failures) * 100);
          const statusText = `[+] Finished ${counts.successes + counts.failures}/${list.length} (${percentageFinished}%) tasks, of which ${counts.successes} (${percentageSuccesses}%) were successful, and ${counts.failures} failed.`;
          if (!this.options.silent) {
            (0, log_1.log)(statusText);
          }
        };
        let worklist = list;
        for (let r = 0; r <= retries; r++) {
          if (r !== 0) {
            if (counts.failures === 0) {
              break;
            }
            worklist = failures.map((f) => f.item);
            failures = [];
            counts.successes = 0;
            counts.failures = 0;
          }
          for (let idx = 0; idx < worklist.length; idx++) {
            await worker(worklist[idx], idx).then(incrementSuccesses, function(err) {
              incrementFailures(worklist[idx], err);
            });
            updateStatusText();
            if (delay !== 0) {
              await (0, utils_1.sleep)(delay);
            }
          }
        }
        let errors = {};
        for (let { item, err } of failures) {
          errors[String(item)] = err;
        }
        return { failures: errors };
      }
      /********** SUPPLEMENTARY FUNCTIONS **************/
      /**
       * Execute an ASK Query
       * On a wiki that supports them, like semantic-mediawiki
       *
       * @param {string} query
       * @param {string} [apiUrl]
       * @param {object} [customRequestOptions]
       *
       * @returns {Promise}
       */
      askQuery(query, apiUrl, customRequestOptions) {
        apiUrl = apiUrl || this.options.apiUrl;
        let requestOptions = (0, utils_1.merge)({
          method: "get",
          url: apiUrl,
          responseType: "json",
          params: {
            action: "ask",
            format: "json",
            query
          }
        }, customRequestOptions);
        return this.rawRequest(requestOptions).then((response) => response.data);
      }
      /**
       * Executes a SPARQL Query
       * On a wiki that supports them, like wikidata
       *
       * @param {string} query
       * @param {string} [endpointUrl]
       * @param {object} [customRequestOptions]
       *
       * @returns {Promise}
       */
      sparqlQuery(query, endpointUrl, customRequestOptions) {
        endpointUrl = endpointUrl || this.options.apiUrl;
        let requestOptions = (0, utils_1.merge)({
          method: "get",
          url: endpointUrl,
          responseType: "json",
          params: {
            format: "json",
            query
          }
        }, customRequestOptions);
        return this.rawRequest(requestOptions).then((response) => response.data);
      }
    };
    exports.Mwn = Mwn2;
    Mwn2.requestDefaults = {
      headers: {
        "Accept-Encoding": "gzip"
      },
      // keep-alive pools and reuses TCP connections, for better performance
      httpAgent: new http.Agent({ keepAlive: true }),
      httpsAgent: new https.Agent({ keepAlive: true }),
      timeout: 6e4
      // 60 seconds
    };
    Mwn2.Error = error_1.MwnError;
    Mwn2.MissingPageError = error_1.MwnMissingPageError;
    Mwn2.log = log_1.log;
    Mwn2.setLoggingConfig = log_1.updateLoggingConfig;
    Mwn2.link = static_utils_1.link;
    Mwn2.template = static_utils_1.template;
    Mwn2.Table = static_utils_1.Table;
    Mwn2.util = static_utils_1.util;
  }
});

// node_modules/mwn/build/api_response_types.js
var require_api_response_types = __commonJS({
  "node_modules/mwn/build/api_response_types.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// node_modules/mwn/build/index.js
var require_build = __commonJS({
  "node_modules/mwn/build/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MwnMissingPageError = exports.MwnError = exports.Template = exports.Mwn = void 0;
    var bot_1 = require_bot();
    Object.defineProperty(exports, "Mwn", { enumerable: true, get: function() {
      return bot_1.Mwn;
    } });
    var wikitext_1 = require_wikitext();
    Object.defineProperty(exports, "Template", { enumerable: true, get: function() {
      return wikitext_1.Template;
    } });
    var error_1 = require_error();
    Object.defineProperty(exports, "MwnError", { enumerable: true, get: function() {
      return error_1.MwnError;
    } });
    Object.defineProperty(exports, "MwnMissingPageError", { enumerable: true, get: function() {
      return error_1.MwnMissingPageError;
    } });
    __exportStar(require_api_response_types(), exports);
  }
});

// src/index.ts
import process3 from "node:process";
import { pathToFileURL } from "node:url";

// src/client.ts
var import_mwn = __toESM(require_build(), 1);
import process2 from "node:process";

// package.json
var package_default = {
  name: "openclaw-skill-moegirlpedia-mediawiki-api",
  version: "0.4.0",
  description: "OpenClaw skill runtime for authenticated Moegirlpedia MediaWiki API access",
  license: "Apache-2.0",
  private: true,
  type: "module",
  bin: {
    "moegirlpedia-mediawiki-api": "./dist/index.js"
  },
  files: [
    "dist/**",
    "scripts/run.sh",
    "SKILL.md"
  ],
  scripts: {
    build: "bash scripts/build-release.sh",
    lint: "eslint .",
    release: "bash scripts/release.sh",
    start: "node dist/index.js",
    test: "vitest run",
    "test:watch": "vitest"
  },
  engines: {
    node: "^24.11"
  },
  dependencies: {
    mwn: "^3.0.1"
  },
  devDependencies: {
    "@annangela/eslint-config": "^11.0.0",
    "@types/node": "^24.10.1",
    esbuild: "^0.28.0",
    typescript: "^6.0.2",
    vitest: "^4.1.4"
  }
};

// src/helpers.ts
import { Buffer as Buffer2 } from "node:buffer";
import { isIP } from "node:net";
var UsageError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "UsageError";
  }
};
var addOptionValue = (options, key, value) => {
  const currentValue = options[key];
  if (currentValue === void 0) {
    options[key] = value;
    return;
  }
  if (Array.isArray(currentValue)) {
    currentValue.push(String(value));
    return;
  }
  options[key] = [String(currentValue), String(value)];
};
var parseCliArguments = (argv) => {
  if (argv.length === 0) {
    return { command: null, options: {}, positionals: [] };
  }
  const [firstArgument, ...restArguments] = argv;
  const command = firstArgument.startsWith("--") ? null : firstArgument;
  const argumentList = command ? restArguments : [...argv];
  const options = {};
  const positionals = [];
  for (let index = 0; index < argumentList.length; index += 1) {
    const argument = argumentList[index];
    if (argument === "--") {
      positionals.push(...argumentList.slice(index + 1));
      break;
    }
    if (!argument.startsWith("--")) {
      positionals.push(argument);
      continue;
    }
    const optionText = argument.slice(2);
    const equalsIndex = optionText.indexOf("=");
    if (equalsIndex >= 0) {
      const key = optionText.slice(0, equalsIndex);
      const value = optionText.slice(equalsIndex + 1);
      addOptionValue(options, key, value);
      continue;
    }
    const nextArgument = argumentList.at(index + 1);
    if (nextArgument !== void 0 && !nextArgument.startsWith("--")) {
      addOptionValue(options, optionText, nextArgument);
      index += 1;
      continue;
    }
    options[optionText] = true;
  }
  return { command, options, positionals };
};
var asArray = (value) => Array.isArray(value) ? value : [];
var asBoolean = (value) => value === true;
var asNumber = (value) => typeof value === "number" && Number.isFinite(value) ? value : null;
var asRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value) ? value : null;
var asString = (value) => typeof value === "string" ? value : null;
var asStringArray = (value) => asArray(value).map((item) => asString(item)).filter((item) => item !== null);
var getSingleOptionValue = (options, key) => {
  const optionValue = options[key];
  if (Array.isArray(optionValue)) {
    if (optionValue.length > 1) {
      throw new UsageError(`Option --${key} may only be provided once.`);
    }
    return optionValue[0];
  }
  return optionValue;
};
var getStringOption = (options, key) => {
  const optionValue = getSingleOptionValue(options, key);
  if (optionValue === void 0) {
    return void 0;
  }
  if (typeof optionValue !== "string") {
    throw new UsageError(`Option --${key} requires a value.`);
  }
  return optionValue;
};
var getStringValues = (options, key) => {
  const optionValue = options[key];
  if (optionValue === void 0) {
    return [];
  }
  if (typeof optionValue === "boolean") {
    throw new UsageError(`Option --${key} requires a value.`);
  }
  return Array.isArray(optionValue) ? optionValue : [optionValue];
};
var parseDelimitedOption = (options, key) => {
  const values = getStringValues(options, key).flatMap((item) => item.split(/[|,]/u)).map((item) => item.trim()).filter((item) => item.length > 0);
  return values.length > 0 ? values.join("|") : void 0;
};
var parseIntegerOption = (options, key, defaultValue, constraints = {}) => {
  const optionValue = getStringOption(options, key);
  if (optionValue === void 0) {
    return defaultValue;
  }
  const parsedValue = Number.parseInt(optionValue, 10);
  if (!Number.isInteger(parsedValue)) {
    throw new UsageError(`Option --${key} must be an integer.`);
  }
  if (constraints.min !== void 0 && parsedValue < constraints.min) {
    throw new UsageError(`Option --${key} must be at least ${constraints.min}.`);
  }
  if (constraints.max !== void 0 && parsedValue > constraints.max) {
    throw new UsageError(`Option --${key} must be at most ${constraints.max}.`);
  }
  return parsedValue;
};
var requirePositional = (positionals, index, name) => {
  const value = positionals.at(index);
  if (value === void 0) {
    throw new UsageError(`Missing required positional argument <${name}>.`);
  }
  return value;
};
var parseDateOption = (value, key) => {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new UsageError(`Option --${key} must be a valid ISO-8601 date/time.`);
  }
  return parsedDate;
};
var resolveTimeRange = (options, defaultHours) => {
  const fromOption = getStringOption(options, "from");
  const toOption = getStringOption(options, "to");
  const hours = parseIntegerOption(options, "hours", defaultHours, { min: 1, max: 24 * 30 });
  const endDate = toOption ? parseDateOption(toOption, "to") : /* @__PURE__ */ new Date();
  let startDate = fromOption ? parseDateOption(fromOption, "from") : new Date(endDate.getTime() - hours * 60 * 60 * 1e3);
  let mode = fromOption || toOption ? "explicit" : "default";
  if (!fromOption && getStringOption(options, "hours") !== void 0) {
    startDate = new Date(endDate.getTime() - hours * 60 * 60 * 1e3);
    mode = "hours";
  }
  if (startDate.getTime() > endDate.getTime()) {
    throw new UsageError("The --from value must be earlier than --to.");
  }
  return {
    from: startDate.toISOString(),
    mode,
    to: endDate.toISOString()
  };
};
var encodeContinueToken = (continueValue) => {
  const continueRecord = asRecord(continueValue);
  if (!continueRecord) {
    return null;
  }
  return Buffer2.from(JSON.stringify(continueRecord), "utf8").toString("base64url");
};
var decodeContinueToken = (token) => {
  if (!token) {
    return void 0;
  }
  try {
    const decoded = JSON.parse(Buffer2.from(token, "base64url").toString("utf8"));
    const record = asRecord(decoded);
    if (!record) {
      throw new Error("Decoded continue token is not an object.");
    }
    return record;
  } catch {
    throw new UsageError("Invalid --continue-token value.");
  }
};
var buildPagination = (continueValue) => {
  const continueRecord = asRecord(continueValue);
  return {
    "continue": continueRecord,
    continueToken: encodeContinueToken(continueRecord),
    hasMore: continueRecord !== null
  };
};
var ensureCategoryTitle = (value) => value.startsWith("Category:") ? value : `Category:${value}`;
var isIpAddress = (value) => value !== null && isIP(value) !== 0;
var stripHtmlTags = (value) => {
  if (!value) {
    return value;
  }
  return value.replace(/<[^>]+>/gu, " ").replace(/\s+/gu, " ").trim();
};
var uniqueStrings = (values) => [...new Set(values.filter((value) => value.length > 0))];

// src/client.ts
var MOEGIRLPEDIA_API_URL = "https://mzh.moegirl.org.cn/api.php";
var initializeWithMwn = async (config) => await import_mwn.Mwn.init(config);
var packageMetadata = package_default;
var packageName = asString(asRecord(packageMetadata)?.name) ?? "openclaw-skill-moegirlpedia-mediawiki-api";
var packageVersion = asString(asRecord(packageMetadata)?.version) ?? "0.0.0";
var getDefaultUserAgent = () => `${packageName}/${packageVersion} (https://github.com/AnnAngela/openclaw-skill-moegirlpedia-mediawiki-api)`;
var getClientConfigFromEnv = (env = process2.env) => {
  const username = env.MOEGIRLPEDIA_USERNAME?.trim();
  const password = env.MOEGIRLPEDIA_BOT_PASSWORD?.trim();
  if (!username) {
    throw new UsageError("Missing environment variable MOEGIRLPEDIA_USERNAME.");
  }
  if (!password) {
    throw new UsageError("Missing environment variable MOEGIRLPEDIA_BOT_PASSWORD.");
  }
  return {
    apiUrl: MOEGIRLPEDIA_API_URL,
    username,
    password,
    userAgent: getDefaultUserAgent(),
    defaultParams: {
      assert: "user",
      formatversion: 2
    },
    maxRetries: 3,
    retryPause: 5e3,
    silent: true,
    suppressAPIWarnings: true
  };
};
var createClientFromEnv = async (env = process2.env, initializer = initializeWithMwn) => await initializer(getClientConfigFromEnv(env));

// src/operations/getCategories.ts
var getCategoriesOperation = {
  description: "List categories attached to a page.",
  name: "get-categories",
  usage: "get-categories <title> [--limit 50] [--continue-token TOKEN]",
  run: async ({ client, options, positionals }) => {
    const title = requirePositional(positionals, 0, "title");
    const limit = parseIntegerOption(options, "limit", 50, { max: 500, min: 1 });
    const continueToken = decodeContinueToken(asString(options["continue-token"]) ?? void 0);
    const response = await client.request({
      action: "query",
      cllimit: limit,
      clprop: "hidden|timestamp",
      prop: "categories",
      titles: title,
      ...continueToken
    });
    const page = asRecord(asArray(response.query?.pages)[0]);
    const categories = asArray(page?.categories).map((item) => asRecord(item)).filter((item) => item !== null).map((item) => ({
      hidden: asBoolean(item.hidden),
      timestamp: asString(item.timestamp),
      title: asString(item.title)
    }));
    return {
      categories,
      operation: "get-categories",
      pageTitle: asString(page?.title) ?? title,
      pagination: buildPagination(response.continue),
      requestedTitle: title
    };
  }
};

// src/operations/getCategoryMembers.ts
var getCategoryMembersOperation = {
  description: "List pages in a category.",
  name: "get-category-members",
  usage: "get-category-members <category> [--type page|subcat|file] [--limit 50] [--continue-token TOKEN]",
  run: async ({ client, options, positionals }) => {
    const category = ensureCategoryTitle(requirePositional(positionals, 0, "category"));
    const limit = parseIntegerOption(options, "limit", 50, { max: 500, min: 1 });
    const memberType = parseDelimitedOption(options, "type");
    const continueToken = decodeContinueToken(asString(options["continue-token"]) ?? void 0);
    const response = await client.request({
      action: "query",
      cmlimit: limit,
      cmprop: "ids|title|type|timestamp|sortkeyprefix",
      cmtitle: category,
      ...memberType ? { cmtype: memberType } : {},
      list: "categorymembers",
      ...continueToken
    });
    const members = asArray(response.query?.categorymembers).map((item) => asRecord(item)).filter((item) => item !== null).map((item) => ({
      namespace: asNumber(item.ns),
      pageId: asNumber(item.pageid),
      sortKeyPrefix: asString(item.sortkeyprefix),
      timestamp: asString(item.timestamp),
      title: asString(item.title),
      type: asString(item.type)
    }));
    return {
      category,
      members,
      operation: "get-category-members",
      pagination: buildPagination(response.continue)
    };
  }
};

// src/operations/getPage.ts
var SUPPORTED_FORMATS = /* @__PURE__ */ new Set(["html", "wikitext"]);
var getPageOperation = {
  description: "Read a page as HTML or raw wikitext.",
  name: "get-page",
  usage: "get-page <title> [--format wikitext|html]",
  run: async ({ client, options, positionals }) => {
    const title = requirePositional(positionals, 0, "title");
    const formatOption = asString(options.format);
    if (formatOption && !SUPPORTED_FORMATS.has(formatOption)) {
      throw new UsageError("Option --format must be either 'wikitext' or 'html'.");
    }
    const format = formatOption === "html" ? "html" : "wikitext";
    const response = await client.request({
      action: "parse",
      page: title,
      prop: format === "html" ? "text|displaytitle|revid|sections" : "wikitext|displaytitle|revid|sections",
      redirects: true
    });
    const parseData = asRecord(response.parse);
    if (!parseData) {
      throw new Error("Unexpected response from action=parse.");
    }
    const sections = asArray(parseData.sections).map((section) => asRecord(section)).filter((section) => section !== null).map((section) => ({
      anchor: asString(section.anchor),
      byteOffset: asNumber(section.byteoffset),
      index: asString(section.index),
      line: asString(section.line),
      level: asString(section.level),
      number: asString(section.number),
      tocLevel: asNumber(section.toclevel)
    }));
    return {
      content: asString(parseData[format === "html" ? "text" : "wikitext"]),
      displayTitle: asString(parseData.displaytitle),
      format,
      operation: "get-page",
      revid: asNumber(parseData.revid),
      sections,
      title
    };
  }
};

// src/operations/getPageInfo.ts
var getPageInfoOperation = {
  description: "Get a page summary and basic metadata.",
  name: "get-page-info",
  usage: "get-page-info <title>",
  run: async ({ client, positionals }) => {
    const title = requirePositional(positionals, 0, "title");
    const response = await client.request({
      action: "query",
      explaintext: true,
      exintro: true,
      inprop: "displaytitle|url|protection",
      prop: "info|extracts",
      titles: title
    });
    const page = asRecord(asArray(response.query?.pages)[0]);
    const protection = asArray(page?.protection).map((item) => asRecord(item)).filter((item) => item !== null).map((item) => ({
      expiry: asString(item.expiry),
      level: asString(item.level),
      type: asString(item.type)
    }));
    return {
      displayTitle: asString(page?.displaytitle),
      editUrl: asString(page?.editurl),
      extract: asString(page?.extract),
      fullUrl: asString(page?.fullurl),
      operation: "get-page-info",
      pageId: asNumber(page?.pageid),
      protection,
      requestedTitle: title,
      title: asString(page?.title) ?? title
    };
  }
};

// src/operations/recentChangesBrief.ts
var DEFAULT_SUSPICIOUS_KEYWORDS = ["spam", "test", "\u5E7F\u544A", "\u4FB5\u6743", "\u5916\u94FE", "\u6E05\u7A7A", "\u5220\u9664", "copyvio"];
var RECENT_CHANGES_FLAG_KEYS = ["anon", "autopatrolled", "bot", "minor", "new", "patrolled", "redirect", "unpatrolled"];
var WATCHED_LOG_TYPES = /* @__PURE__ */ new Set(["abusefilter", "block", "delete", "import", "move", "protect", "rights", "upload"]);
var parseKeywordList = (rawValue) => rawValue ? uniqueStrings(rawValue.split(/[|,]/u).map((item) => item.trim()).filter((item) => item.length > 0)) : DEFAULT_SUSPICIOUS_KEYWORDS;
var collectReasons = (item, largeEditThreshold, largeDeleteThreshold, suspiciousKeywords) => {
  const reasons = [];
  const oldSize = asNumber(item.oldlen);
  const newSize = asNumber(item.newlen);
  const sizeDelta = oldSize !== null && newSize !== null ? newSize - oldSize : null;
  const user = asString(item.user);
  const comment = asString(item.comment)?.toLowerCase() ?? "";
  const tags = asStringArray(item.tags).map((tag) => tag.toLowerCase());
  const logInfo = asRecord(item.loginfo);
  const logType = asString(logInfo?.type);
  if (sizeDelta !== null && sizeDelta >= largeEditThreshold) {
    reasons.push("large-addition");
  }
  if (sizeDelta !== null && -sizeDelta >= largeDeleteThreshold) {
    reasons.push("large-deletion");
  }
  if (asBoolean(item.new)) {
    reasons.push("new-page");
  }
  if (isIpAddress(user)) {
    reasons.push("anonymous-editor");
  }
  if (asBoolean(item.unpatrolled)) {
    reasons.push("unpatrolled");
  }
  if (logType && WATCHED_LOG_TYPES.has(logType)) {
    reasons.push(`log:${logType}`);
  }
  const hasSuspiciousKeyword = suspiciousKeywords.some((keyword) => {
    const normalizedKeyword = keyword.toLowerCase();
    return comment.includes(normalizedKeyword) || tags.some((tag) => tag.includes(normalizedKeyword));
  });
  if (hasSuspiciousKeyword) {
    reasons.push("suspicious-keyword");
  }
  return uniqueStrings(reasons);
};
var normaliseAlert = (item, largeEditThreshold, largeDeleteThreshold, suspiciousKeywords) => {
  const reasons = collectReasons(item, largeEditThreshold, largeDeleteThreshold, suspiciousKeywords);
  if (reasons.length === 0) {
    return null;
  }
  const oldSize = asNumber(item.oldlen);
  const newSize = asNumber(item.newlen);
  return {
    comment: asString(item.comment),
    flags: RECENT_CHANGES_FLAG_KEYS.filter((key) => asBoolean(item[key])),
    logInfo: asRecord(item.loginfo),
    newSize,
    oldRevisionId: asNumber(item.old_revid),
    oldSize,
    pageId: asNumber(item.pageid),
    reasons,
    revisionId: asNumber(item.revid),
    sizeDelta: oldSize !== null && newSize !== null ? newSize - oldSize : null,
    tags: asStringArray(item.tags),
    timestamp: asString(item.timestamp),
    title: asString(item.title) ?? "<unknown title>",
    type: asString(item.type),
    user: asString(item.user),
    userId: asNumber(item.userid)
  };
};
var createPageSummary = (alerts) => {
  const sortedAlerts = [...alerts].sort((left, right) => (right.timestamp ?? "").localeCompare(left.timestamp ?? ""));
  const firstAlert = sortedAlerts.at(0);
  return {
    alertCount: sortedAlerts.length,
    alerts: sortedAlerts,
    latestTimestamp: firstAlert?.timestamp ?? null,
    pageId: firstAlert?.pageId ?? null,
    reasons: uniqueStrings(sortedAlerts.flatMap((alert) => alert.reasons)),
    title: firstAlert?.title ?? "<unknown title>",
    users: uniqueStrings(sortedAlerts.map((alert) => alert.user ?? ""))
  };
};
var recentChangesBriefOperation = {
  description: "Summarise recent changes that match attention-worthy heuristics.",
  name: "recent-changes-brief",
  usage: "recent-changes-brief [--hours 24] [--from ISO] [--to ISO] [--large-edit-threshold 5000] [--large-delete-threshold 2000] [--continue-token TOKEN]",
  run: async ({ client, options }) => {
    const limit = parseIntegerOption(options, "limit", 100, { max: 500, min: 1 });
    const timeRange = resolveTimeRange(options, 24);
    const continueToken = decodeContinueToken(asString(options["continue-token"]) ?? void 0);
    const namespace = parseDelimitedOption(options, "namespace");
    const changeType = parseDelimitedOption(options, "type");
    const showFilter = parseDelimitedOption(options, "show");
    const user = asString(options.user);
    const excludeUser = asString(options["exclude-user"]);
    const tag = asString(options.tag);
    const largeEditThreshold = parseIntegerOption(options, "large-edit-threshold", 5e3, { max: 1e6, min: 1 });
    const largeDeleteThreshold = parseIntegerOption(options, "large-delete-threshold", 2e3, { max: 1e6, min: 1 });
    const suspiciousKeywords = parseKeywordList(asString(options["suspicious-keywords"]));
    const requestParams = {
      action: "query",
      list: "recentchanges",
      rcdir: "newer",
      rcend: timeRange.to,
      rclimit: limit,
      rcprop: "user|userid|comment|flags|timestamp|title|ids|sizes|redirect|patrolled|loginfo|tags",
      rcstart: timeRange.from
    };
    if (changeType) {
      requestParams.rctype = changeType;
    }
    if (excludeUser) {
      requestParams.rcexcludeuser = excludeUser;
    }
    if (namespace) {
      requestParams.rcnamespace = namespace;
    }
    if (showFilter) {
      requestParams.rcshow = showFilter;
    }
    if (tag) {
      requestParams.rctag = tag;
    }
    if (user) {
      requestParams.rcuser = user;
    }
    const response = await client.request({
      ...requestParams,
      ...continueToken
    });
    const alerts = asArray(response.query?.recentchanges).map((item) => asRecord(item)).filter((item) => item !== null).map((item) => normaliseAlert(item, largeEditThreshold, largeDeleteThreshold, suspiciousKeywords)).filter((item) => item !== null);
    const groupedPages = /* @__PURE__ */ new Map();
    for (const alert of alerts) {
      const pageKey = `${alert.pageId ?? "missing"}:${alert.title}`;
      const currentAlerts = groupedPages.get(pageKey) ?? [];
      currentAlerts.push(alert);
      groupedPages.set(pageKey, currentAlerts);
    }
    const pages = [...groupedPages.values()].map((pageAlerts) => createPageSummary(pageAlerts)).sort((left, right) => (right.latestTimestamp ?? "").localeCompare(left.latestTimestamp ?? ""));
    const reasonCounts = /* @__PURE__ */ new Map();
    for (const alert of alerts) {
      for (const reason of alert.reasons) {
        const currentCount = reasonCounts.get(reason) ?? 0;
        reasonCounts.set(reason, currentCount + 1);
      }
    }
    const summaryLine = pages.length > 0 ? `\u6700\u8FD1\u66F4\u6539\u5728 ${timeRange.from} \u5230 ${timeRange.to} \u4E4B\u95F4\u5171\u6709 ${alerts.length} \u6761\u9700\u5173\u6CE8\u6539\u52A8\uFF0C\u6D89\u53CA ${pages.length} \u4E2A\u9875\u9762\u3002` : `\u6700\u8FD1\u66F4\u6539\u5728 ${timeRange.from} \u5230 ${timeRange.to} \u4E4B\u95F4\u6CA1\u6709\u547D\u4E2D\u5F53\u524D\u89C4\u5219\u7684\u6539\u52A8\u3002`;
    const pageLines = pages.map((page) => `${page.title}: ${page.alertCount} \u6761\u9700\u5173\u6CE8\u6539\u52A8\uFF0C\u539F\u56E0 ${page.reasons.join(", ")}\uFF0C\u6700\u8FD1\u65F6\u95F4 ${page.latestTimestamp ?? "\u672A\u77E5"}\u3002`);
    return {
      brief: [summaryLine, ...pageLines],
      filters: {
        excludeUser,
        limit,
        namespace,
        show: showFilter,
        tag,
        type: changeType,
        user
      },
      operation: "recent-changes-brief",
      pages,
      pagination: buildPagination(response.continue),
      ruleSet: {
        largeDeleteThreshold,
        largeEditThreshold,
        suspiciousKeywords
      },
      summary: {
        reasonCounts: Object.fromEntries(reasonCounts.entries()),
        totalAlertedChanges: alerts.length,
        totalPages: pages.length,
        uniqueUsers: uniqueStrings(alerts.map((alert) => alert.user ?? ""))
      },
      timeRange
    };
  }
};

// src/operations/search.ts
var searchOperation = {
  description: "Search Moegirlpedia pages.",
  name: "search",
  usage: "search <query> [--limit 10] [--continue-token TOKEN]",
  run: async ({ client, options, positionals }) => {
    const query = requirePositional(positionals, 0, "query");
    const limit = parseIntegerOption(options, "limit", 10, { max: 50, min: 1 });
    const continueToken = decodeContinueToken(asString(options["continue-token"]) ?? void 0);
    const response = await client.request({
      action: "query",
      list: "search",
      srsearch: query,
      srlimit: limit,
      srprop: "snippet|size|timestamp|sectiontitle|wordcount",
      ...continueToken
    });
    const searchInfo = asRecord(response.query?.searchinfo);
    const items = asArray(response.query?.search).map((item) => asRecord(item)).filter((item) => item !== null).map((item) => ({
      pageId: asNumber(item.pageid),
      sectionTitle: asString(item.sectiontitle),
      size: asNumber(item.size),
      snippetHtml: asString(item.snippet),
      snippetText: stripHtmlTags(asString(item.snippet)),
      timestamp: asString(item.timestamp),
      title: asString(item.title),
      wordCount: asNumber(item.wordcount)
    }));
    return {
      items,
      operation: "search",
      pagination: buildPagination(response.continue),
      query,
      totalHits: asNumber(searchInfo?.totalhits)
    };
  }
};

// src/operations/watchlistBrief.ts
var WATCHLIST_FLAG_KEYS = ["anon", "autopatrolled", "bot", "minor", "new", "patrolled", "redirect", "unread"];
var normaliseWatchlistChange = (item) => {
  const oldSize = asNumber(item.oldlen);
  const newSize = asNumber(item.newlen);
  const logInfo = asRecord(item.loginfo);
  const title = asString(item.title) ?? "<unknown title>";
  return {
    comment: asString(item.comment),
    expiry: asString(item.expiry),
    flags: WATCHLIST_FLAG_KEYS.filter((key) => asBoolean(item[key])),
    logInfo,
    newSize,
    notificationTimestamp: asString(item.notificationtimestamp),
    oldRevisionId: asNumber(item.old_revid),
    oldSize,
    pageId: asNumber(item.pageid),
    revisionId: asNumber(item.revid),
    sizeDelta: oldSize !== null && newSize !== null ? newSize - oldSize : null,
    tags: asStringArray(item.tags),
    timestamp: asString(item.timestamp),
    title,
    type: logInfo ? "log" : asBoolean(item.new) ? "new" : "edit",
    user: asString(item.user),
    userId: asNumber(item.userid)
  };
};
var createPageSummary2 = (changes) => {
  const sortedChanges = [...changes].sort((left, right) => (right.timestamp ?? "").localeCompare(left.timestamp ?? ""));
  const firstChange = sortedChanges.at(0);
  const sizeDeltas = sortedChanges.map((change) => change.sizeDelta).filter((value) => value !== null);
  return {
    changeCount: sortedChanges.length,
    changes: sortedChanges,
    latestTimestamp: firstChange?.timestamp ?? null,
    netSizeDelta: sizeDeltas.length > 0 ? sizeDeltas.reduce((total, value) => total + value, 0) : null,
    pageId: firstChange?.pageId ?? null,
    title: firstChange?.title ?? "<unknown title>",
    users: uniqueStrings(sortedChanges.map((change) => change.user ?? ""))
  };
};
var watchlistBriefOperation = {
  description: "Summarise recent changes on the authenticated user's watchlist, grouped by page.",
  name: "watchlist-brief",
  usage: "watchlist-brief [--hours 24] [--from ISO] [--to ISO] [--limit 50] [--namespace 0,14] [--continue-token TOKEN]",
  run: async ({ client, options }) => {
    const limit = parseIntegerOption(options, "limit", 50, { max: 500, min: 1 });
    const timeRange = resolveTimeRange(options, 24);
    const continueToken = decodeContinueToken(asString(options["continue-token"]) ?? void 0);
    const namespace = parseDelimitedOption(options, "namespace");
    const changeType = parseDelimitedOption(options, "type");
    const showFilter = parseDelimitedOption(options, "show");
    const user = asString(options.user);
    const excludeUser = asString(options["exclude-user"]);
    const requestParams = {
      action: "query",
      list: "watchlist",
      wlallrev: true,
      wldir: "newer",
      wlend: timeRange.to,
      wllimit: limit,
      wlprop: "ids|title|user|userid|comment|timestamp|sizes|flags|tags|loginfo|notificationtimestamp|patrol|expiry",
      wlstart: timeRange.from
    };
    if (changeType) {
      requestParams.wltype = changeType;
    }
    if (excludeUser) {
      requestParams.wlexcludeuser = excludeUser;
    }
    if (namespace) {
      requestParams.wlnamespace = namespace;
    }
    if (showFilter) {
      requestParams.wlshow = showFilter;
    }
    if (user) {
      requestParams.wluser = user;
    }
    const response = await client.request({
      ...requestParams,
      ...continueToken
    });
    const changes = asArray(response.query?.watchlist).map((item) => asRecord(item)).filter((item) => item !== null).map((item) => normaliseWatchlistChange(item));
    const groupedPages = /* @__PURE__ */ new Map();
    for (const change of changes) {
      const pageKey = `${change.pageId ?? "missing"}:${change.title}`;
      const currentChanges = groupedPages.get(pageKey) ?? [];
      currentChanges.push(change);
      groupedPages.set(pageKey, currentChanges);
    }
    const pages = [...groupedPages.values()].map((pageChanges) => createPageSummary2(pageChanges)).sort((left, right) => (right.latestTimestamp ?? "").localeCompare(left.latestTimestamp ?? ""));
    const uniqueUsers = uniqueStrings(changes.map((change) => change.user ?? ""));
    const summaryLine = pages.length > 0 ? `\u76D1\u89C6\u5217\u8868\u5728 ${timeRange.from} \u5230 ${timeRange.to} \u4E4B\u95F4\u5171\u6709 ${changes.length} \u6B21\u6539\u52A8\uFF0C\u6D89\u53CA ${pages.length} \u4E2A\u9875\u9762\uFF0C\u6765\u81EA ${uniqueUsers.length} \u4F4D\u7F16\u8F91\u8005\u3002` : `\u76D1\u89C6\u5217\u8868\u5728 ${timeRange.from} \u5230 ${timeRange.to} \u4E4B\u95F4\u6CA1\u6709\u5339\u914D\u7684\u6539\u52A8\u3002`;
    const pageLines = pages.map((page) => {
      const deltaText = page.netSizeDelta === null ? "\u5927\u5C0F\u53D8\u5316\u672A\u77E5" : `\u51C0\u53D8\u5316 ${page.netSizeDelta >= 0 ? "+" : ""}${page.netSizeDelta} \u5B57\u8282`;
      return `${page.title}: ${page.changeCount} \u6B21\u6539\u52A8\uFF0C\u6700\u8FD1\u65F6\u95F4 ${page.latestTimestamp ?? "\u672A\u77E5"}\uFF0C${deltaText}\uFF0C\u7F16\u8F91\u8005 ${page.users.join(", ") || "\u672A\u77E5"}\u3002`;
    });
    return {
      brief: [summaryLine, ...pageLines],
      filters: {
        excludeUser,
        limit,
        namespace,
        show: showFilter,
        type: changeType,
        user
      },
      operation: "watchlist-brief",
      pages,
      pagination: buildPagination(response.continue),
      summary: {
        totalChanges: changes.length,
        totalPages: pages.length,
        uniqueUsers
      },
      timeRange
    };
  }
};

// src/operations/index.ts
var operations = [
  searchOperation,
  getPageOperation,
  getCategoriesOperation,
  getCategoryMembersOperation,
  getPageInfoOperation,
  watchlistBriefOperation,
  recentChangesBriefOperation
];

// src/index.ts
var renderHelp = (operationList) => {
  const lines = [
    "Usage: moegirlpedia-mediawiki-api <operation> [arguments] [--options]",
    "",
    "Available operations:",
    ...operationList.map((operation) => `  ${operation.usage}
    ${operation.description}`)
  ];
  return `${lines.join("\n")}
`;
};
var renderUsageError = (error, operation) => {
  if (!operation) {
    return `${error.message}
`;
  }
  return `${error.message}
Usage: ${operation.usage}
`;
};
var writeJson = (stdout, value) => {
  stdout.write(`${JSON.stringify(value, null, 2)}
`);
};
var runCli = async (argv = process3.argv.slice(2), dependencies = {}) => {
  const parsedArguments = parseCliArguments(argv);
  const stdout = dependencies.stdout ?? process3.stdout;
  const stderr = dependencies.stderr ?? process3.stderr;
  const env = dependencies.env ?? process3.env;
  const operationList = dependencies.operationList ?? operations;
  if (!parsedArguments.command || parsedArguments.command === "help" || parsedArguments.command === "--help") {
    stdout.write(renderHelp(operationList));
    return 0;
  }
  const operation = operationList.find((item) => item.name === parsedArguments.command);
  if (!operation) {
    stderr.write(`Unknown operation: ${parsedArguments.command}

`);
    stderr.write(renderHelp(operationList));
    return 1;
  }
  try {
    const createClient = dependencies.createClient ?? createClientFromEnv;
    const client = await createClient(env);
    const result = await operation.run({
      client,
      options: parsedArguments.options,
      positionals: parsedArguments.positionals
    });
    writeJson(stdout, result);
    return 0;
  } catch (error) {
    if (error instanceof UsageError) {
      stderr.write(renderUsageError(error, operation));
      return 2;
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    stderr.write(`${message}
`);
    return 1;
  }
};
if (process3.argv[1] && import.meta.url === pathToFileURL(process3.argv[1]).href) {
  process3.exitCode = await runCli();
}
export {
  runCli
};
/*! Bundled license information:

mime-db/index.js:
  (*!
   * mime-db
   * Copyright(c) 2014 Jonathan Ong
   * Copyright(c) 2015-2022 Douglas Christopher Wilson
   * MIT Licensed
   *)

mime-types/index.js:
  (*!
   * mime-types
   * Copyright(c) 2014 Jonathan Ong
   * Copyright(c) 2015 Douglas Christopher Wilson
   * MIT Licensed
   *)

axios/dist/node/axios.cjs:
  (*! Axios v1.15.0 Copyright (c) 2026 Matt Zabriskie and contributors *)

tough-cookie/lib/pubsuffix-psl.js:
  (*!
   * Copyright (c) 2018, Salesforce.com, Inc.
   * All rights reserved.
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice,
   * this list of conditions and the following disclaimer.
   *
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   * this list of conditions and the following disclaimer in the documentation
   * and/or other materials provided with the distribution.
   *
   * 3. Neither the name of Salesforce.com nor the names of its contributors may
   * be used to endorse or promote products derived from this software without
   * specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
   * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
   * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
   * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
   * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
   * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
   * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
   * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
   * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
   * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
   * POSSIBILITY OF SUCH DAMAGE.
   *)

tough-cookie/lib/store.js:
tough-cookie/lib/permuteDomain.js:
tough-cookie/lib/pathMatch.js:
tough-cookie/lib/memstore.js:
  (*!
   * Copyright (c) 2015, Salesforce.com, Inc.
   * All rights reserved.
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice,
   * this list of conditions and the following disclaimer.
   *
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   * this list of conditions and the following disclaimer in the documentation
   * and/or other materials provided with the distribution.
   *
   * 3. Neither the name of Salesforce.com nor the names of its contributors may
   * be used to endorse or promote products derived from this software without
   * specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
   * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
   * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
   * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
   * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
   * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
   * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
   * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
   * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
   * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
   * POSSIBILITY OF SUCH DAMAGE.
   *)

tough-cookie/lib/cookie.js:
  (*!
   * Copyright (c) 2015-2020, Salesforce.com, Inc.
   * All rights reserved.
   *
   * Redistribution and use in source and binary forms, with or without
   * modification, are permitted provided that the following conditions are met:
   *
   * 1. Redistributions of source code must retain the above copyright notice,
   * this list of conditions and the following disclaimer.
   *
   * 2. Redistributions in binary form must reproduce the above copyright notice,
   * this list of conditions and the following disclaimer in the documentation
   * and/or other materials provided with the distribution.
   *
   * 3. Neither the name of Salesforce.com nor the names of its contributors may
   * be used to endorse or promote products derived from this software without
   * specific prior written permission.
   *
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
   * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
   * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
   * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
   * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
   * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
   * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
   * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
   * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
   * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
   * POSSIBILITY OF SUCH DAMAGE.
   *)
*/
