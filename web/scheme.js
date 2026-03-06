

// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof Module != 'undefined' ? Module : {};

// See https://caniuse.com/mdn-javascript_builtins_object_assign

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)

  if (!Module.expectedDataFileDownloads) {
    Module.expectedDataFileDownloads = 0;
  }

  Module.expectedDataFileDownloads++;
  (function() {
    // When running as a pthread, FS operations are proxied to the main thread, so we don't need to
    // fetch the .data bundle on the worker
    if (Module['ENVIRONMENT_IS_PTHREAD']) return;
    var loadPackage = function(metadata) {

    function runWithFS() {

      function assert(check, msg) {
        if (!check) throw msg + new Error().stack;
      }
      var start32 = Module['___emscripten_embedded_file_data'] >> 2;
      do {
        var name_addr = HEAPU32[start32++];
        var len = HEAPU32[start32++];
        var content = HEAPU32[start32++];
        var name = UTF8ToString(name_addr)
        // canOwn this data in the filesystem, it is a slice of wasm memory that will never change
        Module['FS_createDataFile'](name, null, HEAP8.subarray(content, content + len), true, true, true);
      } while (HEAPU32[start32]);
    }
    if (Module['calledRun']) {
      runWithFS();
    } else {
      if (!Module['preRun']) Module['preRun'] = [];
      Module["preRun"].push(runWithFS); // FS is not initialized yet, wait for it
    }

    }
    loadPackage({"files": []});

  })();


    // All the pre-js content up to here must remain later on, we need to run
    // it.
    if (Module['ENVIRONMENT_IS_PTHREAD']) Module['preRun'] = [];
    var necessaryPreJSTasks = Module['preRun'].slice();
  
    if (!Module['preRun']) throw 'Module.preRun should exist because file support used it; did a pre-js delete it?';
    necessaryPreJSTasks.forEach(function(task) {
      if (Module['preRun'].indexOf(task) < 0) throw 'All preRun tasks that exist before user pre-js code should remain after; did you replace Module or modify Module.preRun?';
    });
  

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = Object.assign({}, Module);

var arguments_ = [];
var thisProgram = './this.program';
var quit_ = (status, toThrow) => {
  throw toThrow;
};

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

// Attempt to auto-detect the environment
var ENVIRONMENT_IS_WEB = typeof window == 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts == 'function';
// N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.
var ENVIRONMENT_IS_NODE = typeof process == 'object' && typeof process.versions == 'object' && typeof process.versions.node == 'string';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (Module['ENVIRONMENT']) {
  throw new Error('Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -s ENVIRONMENT=web or -s ENVIRONMENT=node)');
}

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var read_,
    readAsync,
    readBinary,
    setWindowTitle;

// Normally we don't log exceptions but instead let them bubble out the top
// level where the embedding environment (e.g. the browser) can handle
// them.
// However under v8 and node we sometimes exit the process direcly in which case
// its up to use us to log the exception before exiting.
// If we fix https://github.com/emscripten-core/emscripten/issues/15080
// this may no longer be needed under node.
function logExceptionOnExit(e) {
  if (e instanceof ExitStatus) return;
  let toLog = e;
  if (e && typeof e == 'object' && e.stack) {
    toLog = [e, e.stack];
  }
  err('exiting due to exception: ' + toLog);
}

var fs;
var nodePath;
var requireNodeFS;

if (ENVIRONMENT_IS_NODE) {
  if (!(typeof process == 'object' && typeof require == 'function')) throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');
  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = require('path').dirname(scriptDirectory) + '/';
  } else {
    scriptDirectory = __dirname + '/';
  }

// include: node_shell_read.js


requireNodeFS = () => {
  // Use nodePath as the indicator for these not being initialized,
  // since in some environments a global fs may have already been
  // created.
  if (!nodePath) {
    fs = require('fs');
    nodePath = require('path');
  }
};

read_ = function shell_read(filename, binary) {
  var ret = tryParseAsDataURI(filename);
  if (ret) {
    return binary ? ret : ret.toString();
  }
  requireNodeFS();
  filename = nodePath['normalize'](filename);
  return fs.readFileSync(filename, binary ? undefined : 'utf8');
};

readBinary = (filename) => {
  var ret = read_(filename, true);
  if (!ret.buffer) {
    ret = new Uint8Array(ret);
  }
  assert(ret.buffer);
  return ret;
};

readAsync = (filename, onload, onerror) => {
  var ret = tryParseAsDataURI(filename);
  if (ret) {
    onload(ret);
  }
  requireNodeFS();
  filename = nodePath['normalize'](filename);
  fs.readFile(filename, function(err, data) {
    if (err) onerror(err);
    else onload(data.buffer);
  });
};

// end include: node_shell_read.js
  if (process['argv'].length > 1) {
    thisProgram = process['argv'][1].replace(/\\/g, '/');
  }

  arguments_ = process['argv'].slice(2);

  if (typeof module != 'undefined') {
    module['exports'] = Module;
  }

  process['on']('uncaughtException', function(ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });

  // Without this older versions of node (< v15) will log unhandled rejections
  // but return 0, which is not normally the desired behaviour.  This is
  // not be needed with node v15 and about because it is now the default
  // behaviour:
  // See https://nodejs.org/api/cli.html#cli_unhandled_rejections_mode
  process['on']('unhandledRejection', function(reason) { throw reason; });

  quit_ = (status, toThrow) => {
    if (keepRuntimeAlive()) {
      process['exitCode'] = status;
      throw toThrow;
    }
    logExceptionOnExit(toThrow);
    process['exit'](status);
  };

  Module['inspect'] = function () { return '[Emscripten Module object]'; };

} else
if (ENVIRONMENT_IS_SHELL) {

  if ((typeof process == 'object' && typeof require === 'function') || typeof window == 'object' || typeof importScripts == 'function') throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  if (typeof read != 'undefined') {
    read_ = function shell_read(f) {
      const data = tryParseAsDataURI(f);
      if (data) {
        return intArrayToString(data);
      }
      return read(f);
    };
  }

  readBinary = function readBinary(f) {
    let data;
    data = tryParseAsDataURI(f);
    if (data) {
      return data;
    }
    if (typeof readbuffer == 'function') {
      return new Uint8Array(readbuffer(f));
    }
    data = read(f, 'binary');
    assert(typeof data == 'object');
    return data;
  };

  readAsync = function readAsync(f, onload, onerror) {
    setTimeout(() => onload(readBinary(f)), 0);
  };

  if (typeof scriptArgs != 'undefined') {
    arguments_ = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    arguments_ = arguments;
  }

  if (typeof quit == 'function') {
    quit_ = (status, toThrow) => {
      logExceptionOnExit(toThrow);
      quit(status);
    };
  }

  if (typeof print != 'undefined') {
    // Prefer to use print/printErr where they exist, as they usually work better.
    if (typeof console == 'undefined') console = /** @type{!Console} */({});
    console.log = /** @type{!function(this:Console, ...*): undefined} */ (print);
    console.warn = console.error = /** @type{!function(this:Console, ...*): undefined} */ (typeof printErr != 'undefined' ? printErr : print);
  }

} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) { // Check worker, not web, since window could be polyfilled
    scriptDirectory = self.location.href;
  } else if (typeof document != 'undefined' && document.currentScript) { // web
    scriptDirectory = document.currentScript.src;
  }
  // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
  // otherwise, slice off the final part of the url to find the script directory.
  // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
  // and scriptDirectory will correctly be replaced with an empty string.
  // If scriptDirectory contains a query (starting with ?) or a fragment (starting with #),
  // they are removed because they could contain a slash.
  if (scriptDirectory.indexOf('blob:') !== 0) {
    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf('/')+1);
  } else {
    scriptDirectory = '';
  }

  if (!(typeof window == 'object' || typeof importScripts == 'function')) throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  // Differentiate the Web Worker from the Node Worker case, as reading must
  // be done differently.
  {
// include: web_or_worker_shell_read.js


  read_ = (url) => {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.send(null);
      return xhr.responseText;
    } catch (err) {
      var data = tryParseAsDataURI(url);
      if (data) {
        return intArrayToString(data);
      }
      throw err;
    }
  }

  if (ENVIRONMENT_IS_WORKER) {
    readBinary = (url) => {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.responseType = 'arraybuffer';
        xhr.send(null);
        return new Uint8Array(/** @type{!ArrayBuffer} */(xhr.response));
      } catch (err) {
        var data = tryParseAsDataURI(url);
        if (data) {
          return data;
        }
        throw err;
      }
    };
  }

  readAsync = (url, onload, onerror) => {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = () => {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
        onload(xhr.response);
        return;
      }
      var data = tryParseAsDataURI(url);
      if (data) {
        onload(data.buffer);
        return;
      }
      onerror();
    };
    xhr.onerror = onerror;
    xhr.send(null);
  }

// end include: web_or_worker_shell_read.js
  }

  setWindowTitle = (title) => document.title = title;
} else
{
  throw new Error('environment detection error');
}

var out = Module['print'] || console.log.bind(console);
var err = Module['printErr'] || console.warn.bind(console);

// Merge back in the overrides
Object.assign(Module, moduleOverrides);
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = null;

// Emit code to handle expected values on the Module object. This applies Module.x
// to the proper local x. This has two benefits: first, we only emit it if it is
// expected to arrive, and second, by using a local everywhere else that can be
// minified.

if (Module['arguments']) arguments_ = Module['arguments'];
if (!Object.getOwnPropertyDescriptor(Module, 'arguments')) {
  Object.defineProperty(Module, 'arguments', {
    configurable: true,
    get: function() {
      abort('Module.arguments has been replaced with plain arguments_ (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)')
    }
  });
}

if (Module['thisProgram']) thisProgram = Module['thisProgram'];
if (!Object.getOwnPropertyDescriptor(Module, 'thisProgram')) {
  Object.defineProperty(Module, 'thisProgram', {
    configurable: true,
    get: function() {
      abort('Module.thisProgram has been replaced with plain thisProgram (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)')
    }
  });
}

if (Module['quit']) quit_ = Module['quit'];
if (!Object.getOwnPropertyDescriptor(Module, 'quit')) {
  Object.defineProperty(Module, 'quit', {
    configurable: true,
    get: function() {
      abort('Module.quit has been replaced with plain quit_ (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)')
    }
  });
}

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message
// Assertions on removed incoming Module JS APIs.
assert(typeof Module['memoryInitializerPrefixURL'] == 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['pthreadMainPrefixURL'] == 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['cdInitializerPrefixURL'] == 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['filePackagePrefixURL'] == 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['read'] == 'undefined', 'Module.read option was removed (modify read_ in JS)');
assert(typeof Module['readAsync'] == 'undefined', 'Module.readAsync option was removed (modify readAsync in JS)');
assert(typeof Module['readBinary'] == 'undefined', 'Module.readBinary option was removed (modify readBinary in JS)');
assert(typeof Module['setWindowTitle'] == 'undefined', 'Module.setWindowTitle option was removed (modify setWindowTitle in JS)');
assert(typeof Module['TOTAL_MEMORY'] == 'undefined', 'Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY');

if (!Object.getOwnPropertyDescriptor(Module, 'read')) {
  Object.defineProperty(Module, 'read', {
    configurable: true,
    get: function() {
      abort('Module.read has been replaced with plain read_ (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)')
    }
  });
}

if (!Object.getOwnPropertyDescriptor(Module, 'readAsync')) {
  Object.defineProperty(Module, 'readAsync', {
    configurable: true,
    get: function() {
      abort('Module.readAsync has been replaced with plain readAsync (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)')
    }
  });
}

if (!Object.getOwnPropertyDescriptor(Module, 'readBinary')) {
  Object.defineProperty(Module, 'readBinary', {
    configurable: true,
    get: function() {
      abort('Module.readBinary has been replaced with plain readBinary (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)')
    }
  });
}

if (!Object.getOwnPropertyDescriptor(Module, 'setWindowTitle')) {
  Object.defineProperty(Module, 'setWindowTitle', {
    configurable: true,
    get: function() {
      abort('Module.setWindowTitle has been replaced with plain setWindowTitle (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)')
    }
  });
}
var IDBFS = 'IDBFS is no longer included by default; build with -lidbfs.js';
var PROXYFS = 'PROXYFS is no longer included by default; build with -lproxyfs.js';
var WORKERFS = 'WORKERFS is no longer included by default; build with -lworkerfs.js';
var NODEFS = 'NODEFS is no longer included by default; build with -lnodefs.js';


assert(!ENVIRONMENT_IS_SHELL, "shell environment detected but not enabled at build time.  Add 'shell' to `-s ENVIRONMENT` to enable.");




var STACK_ALIGN = 16;
var POINTER_SIZE = 4;

function getNativeTypeSize(type) {
  switch (type) {
    case 'i1': case 'i8': return 1;
    case 'i16': return 2;
    case 'i32': return 4;
    case 'i64': return 8;
    case 'float': return 4;
    case 'double': return 8;
    default: {
      if (type[type.length - 1] === '*') {
        return POINTER_SIZE;
      } else if (type[0] === 'i') {
        const bits = Number(type.substr(1));
        assert(bits % 8 === 0, 'getNativeTypeSize invalid bits ' + bits + ', type ' + type);
        return bits / 8;
      } else {
        return 0;
      }
    }
  }
}

function warnOnce(text) {
  if (!warnOnce.shown) warnOnce.shown = {};
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    err(text);
  }
}

// include: runtime_functions.js


// Wraps a JS function as a wasm function with a given signature.
function convertJsFunctionToWasm(func, sig) {

  // If the type reflection proposal is available, use the new
  // "WebAssembly.Function" constructor.
  // Otherwise, construct a minimal wasm module importing the JS function and
  // re-exporting it.
  if (typeof WebAssembly.Function == "function") {
    var typeNames = {
      'i': 'i32',
      'j': 'i64',
      'f': 'f32',
      'd': 'f64'
    };
    var type = {
      parameters: [],
      results: sig[0] == 'v' ? [] : [typeNames[sig[0]]]
    };
    for (var i = 1; i < sig.length; ++i) {
      type.parameters.push(typeNames[sig[i]]);
    }
    return new WebAssembly.Function(type, func);
  }

  // The module is static, with the exception of the type section, which is
  // generated based on the signature passed in.
  var typeSection = [
    0x01, // id: section,
    0x00, // length: 0 (placeholder)
    0x01, // count: 1
    0x60, // form: func
  ];
  var sigRet = sig.slice(0, 1);
  var sigParam = sig.slice(1);
  var typeCodes = {
    'i': 0x7f, // i32
    'j': 0x7e, // i64
    'f': 0x7d, // f32
    'd': 0x7c, // f64
  };

  // Parameters, length + signatures
  typeSection.push(sigParam.length);
  for (var i = 0; i < sigParam.length; ++i) {
    typeSection.push(typeCodes[sigParam[i]]);
  }

  // Return values, length + signatures
  // With no multi-return in MVP, either 0 (void) or 1 (anything else)
  if (sigRet == 'v') {
    typeSection.push(0x00);
  } else {
    typeSection = typeSection.concat([0x01, typeCodes[sigRet]]);
  }

  // Write the overall length of the type section back into the section header
  // (excepting the 2 bytes for the section id and length)
  typeSection[1] = typeSection.length - 2;

  // Rest of the module is static
  var bytes = new Uint8Array([
    0x00, 0x61, 0x73, 0x6d, // magic ("\0asm")
    0x01, 0x00, 0x00, 0x00, // version: 1
  ].concat(typeSection, [
    0x02, 0x07, // import section
      // (import "e" "f" (func 0 (type 0)))
      0x01, 0x01, 0x65, 0x01, 0x66, 0x00, 0x00,
    0x07, 0x05, // export section
      // (export "f" (func 0 (type 0)))
      0x01, 0x01, 0x66, 0x00, 0x00,
  ]));

   // We can compile this wasm module synchronously because it is very small.
  // This accepts an import (at "e.f"), that it reroutes to an export (at "f")
  var module = new WebAssembly.Module(bytes);
  var instance = new WebAssembly.Instance(module, {
    'e': {
      'f': func
    }
  });
  var wrappedFunc = instance.exports['f'];
  return wrappedFunc;
}

var freeTableIndexes = [];

// Weak map of functions in the table to their indexes, created on first use.
var functionsInTableMap;

function getEmptyTableSlot() {
  // Reuse a free index if there is one, otherwise grow.
  if (freeTableIndexes.length) {
    return freeTableIndexes.pop();
  }
  // Grow the table
  try {
    wasmTable.grow(1);
  } catch (err) {
    if (!(err instanceof RangeError)) {
      throw err;
    }
    throw 'Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.';
  }
  return wasmTable.length - 1;
}

function updateTableMap(offset, count) {
  for (var i = offset; i < offset + count; i++) {
    var item = getWasmTableEntry(i);
    // Ignore null values.
    if (item) {
      functionsInTableMap.set(item, i);
    }
  }
}

/**
 * Add a function to the table.
 * 'sig' parameter is required if the function being added is a JS function.
 * @param {string=} sig
 */
function addFunction(func, sig) {
  assert(typeof func != 'undefined');

  // Check if the function is already in the table, to ensure each function
  // gets a unique index. First, create the map if this is the first use.
  if (!functionsInTableMap) {
    functionsInTableMap = new WeakMap();
    updateTableMap(0, wasmTable.length);
  }
  if (functionsInTableMap.has(func)) {
    return functionsInTableMap.get(func);
  }

  // It's not in the table, add it now.

  var ret = getEmptyTableSlot();

  // Set the new value.
  try {
    // Attempting to call this with JS function will cause of table.set() to fail
    setWasmTableEntry(ret, func);
  } catch (err) {
    if (!(err instanceof TypeError)) {
      throw err;
    }
    assert(typeof sig != 'undefined', 'Missing signature argument to addFunction: ' + func);
    var wrapped = convertJsFunctionToWasm(func, sig);
    setWasmTableEntry(ret, wrapped);
  }

  functionsInTableMap.set(func, ret);

  return ret;
}

function removeFunction(index) {
  functionsInTableMap.delete(getWasmTableEntry(index));
  freeTableIndexes.push(index);
}

// end include: runtime_functions.js
// include: runtime_debug.js


// end include: runtime_debug.js
var tempRet0 = 0;
var setTempRet0 = (value) => { tempRet0 = value; };
var getTempRet0 = () => tempRet0;



// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

var wasmBinary;
if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];
if (!Object.getOwnPropertyDescriptor(Module, 'wasmBinary')) {
  Object.defineProperty(Module, 'wasmBinary', {
    configurable: true,
    get: function() {
      abort('Module.wasmBinary has been replaced with plain wasmBinary (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)')
    }
  });
}
var noExitRuntime = Module['noExitRuntime'] || true;
if (!Object.getOwnPropertyDescriptor(Module, 'noExitRuntime')) {
  Object.defineProperty(Module, 'noExitRuntime', {
    configurable: true,
    get: function() {
      abort('Module.noExitRuntime has been replaced with plain noExitRuntime (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)')
    }
  });
}

if (typeof WebAssembly != 'object') {
  abort('no native wasm support detected');
}

// include: runtime_safe_heap.js


// In MINIMAL_RUNTIME, setValue() and getValue() are only available when building with safe heap enabled, for heap safety checking.
// In traditional runtime, setValue() and getValue() are always available (although their use is highly discouraged due to perf penalties)

/** @param {number} ptr
    @param {number} value
    @param {string} type
    @param {number|boolean=} noSafe */
function setValue(ptr, value, type = 'i8', noSafe) {
  if (type.charAt(type.length-1) === '*') type = 'i32';
    switch (type) {
      case 'i1': HEAP8[((ptr)>>0)] = value; break;
      case 'i8': HEAP8[((ptr)>>0)] = value; break;
      case 'i16': HEAP16[((ptr)>>1)] = value; break;
      case 'i32': HEAP32[((ptr)>>2)] = value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)] = tempI64[0],HEAP32[(((ptr)+(4))>>2)] = tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)] = value; break;
      case 'double': HEAPF64[((ptr)>>3)] = value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}

/** @param {number} ptr
    @param {string} type
    @param {number|boolean=} noSafe */
function getValue(ptr, type = 'i8', noSafe) {
  if (type.charAt(type.length-1) === '*') type = 'i32';
    switch (type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return Number(HEAPF64[((ptr)>>3)]);
      default: abort('invalid type for getValue: ' + type);
    }
  return null;
}

// end include: runtime_safe_heap.js
// Wasm globals

var wasmMemory;

//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed' + (text ? ': ' + text : ''));
  }
}

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  assert(func, 'Cannot call unknown function ' + ident + ', make sure it is exported');
  return func;
}

// C calling interface.
/** @param {string|null=} returnType
    @param {Array=} argTypes
    @param {Arguments|Array=} args
    @param {Object=} opts */
function ccall(ident, returnType, argTypes, args, opts) {
  // For fast lookup of conversion functions
  var toC = {
    'string': function(str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) { // null string
        // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
        var len = (str.length << 2) + 1;
        ret = stackAlloc(len);
        stringToUTF8(str, ret, len);
      }
      return ret;
    },
    'array': function(arr) {
      var ret = stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    }
  };

  function convertReturnValue(ret) {
    if (returnType === 'string') return UTF8ToString(ret);
    if (returnType === 'boolean') return Boolean(ret);
    return ret;
  }

  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  assert(returnType !== 'array', 'Return type should not be "array".');
  if (args) {
    for (var i = 0; i < args.length; i++) {
      var converter = toC[argTypes[i]];
      if (converter) {
        if (stack === 0) stack = stackSave();
        cArgs[i] = converter(args[i]);
      } else {
        cArgs[i] = args[i];
      }
    }
  }
  var ret = func.apply(null, cArgs);
  function onDone(ret) {
    if (stack !== 0) stackRestore(stack);
    return convertReturnValue(ret);
  }

  ret = onDone(ret);
  return ret;
}

/** @param {string=} returnType
    @param {Array=} argTypes
    @param {Object=} opts */
function cwrap(ident, returnType, argTypes, opts) {
  return function() {
    return ccall(ident, returnType, argTypes, arguments, opts);
  }
}

// We used to include malloc/free by default in the past. Show a helpful error in
// builds with assertions.

// include: runtime_legacy.js


var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call

/**
 * allocate(): This function is no longer used by emscripten but is kept around to avoid
 *             breaking external users.
 *             You should normally not use allocate(), and instead allocate
 *             memory using _malloc()/stackAlloc(), initialize it with
 *             setValue(), and so forth.
 * @param {(Uint8Array|Array<number>)} slab: An array of data.
 * @param {number=} allocator : How to allocate memory, see ALLOC_*
 */
function allocate(slab, allocator) {
  var ret;
  assert(typeof allocator == 'number', 'allocate no longer takes a type argument')
  assert(typeof slab != 'number', 'allocate no longer takes a number as arg0')

  if (allocator == ALLOC_STACK) {
    ret = stackAlloc(slab.length);
  } else {
    ret = _malloc(slab.length);
  }

  if (!slab.subarray && !slab.slice) {
    slab = new Uint8Array(slab);
  }
  HEAPU8.set(slab, ret);
  return ret;
}

// end include: runtime_legacy.js
// include: runtime_strings.js


// runtime_strings.js: Strings related runtime functions that are part of both MINIMAL_RUNTIME and regular runtime.

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.

var UTF8Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder('utf8') : undefined;

/**
 * @param {number} idx
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ArrayToString(heap, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  // (As a tiny code save trick, compare endPtr against endIdx using a negation, so that undefined means Infinity)
  while (heap[endPtr] && !(endPtr >= endIdx)) ++endPtr;

  if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(heap.subarray(idx, endPtr));
  } else {
    var str = '';
    // If building with TextDecoder, we have already computed the string length above, so test loop end condition against that
    while (idx < endPtr) {
      // For UTF8 byte structure, see:
      // http://en.wikipedia.org/wiki/UTF-8#Description
      // https://www.ietf.org/rfc/rfc2279.txt
      // https://tools.ietf.org/html/rfc3629
      var u0 = heap[idx++];
      if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
      var u1 = heap[idx++] & 63;
      if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
      var u2 = heap[idx++] & 63;
      if ((u0 & 0xF0) == 0xE0) {
        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
      } else {
        if ((u0 & 0xF8) != 0xF0) warnOnce('Invalid UTF-8 leading byte 0x' + u0.toString(16) + ' encountered when deserializing a UTF-8 string in wasm memory to a JS string!');
        u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heap[idx++] & 63);
      }

      if (u0 < 0x10000) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 0x10000;
        str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
      }
    }
  }
  return str;
}

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns a
// copy of that string as a Javascript String object.
// maxBytesToRead: an optional length that specifies the maximum number of bytes to read. You can omit
//                 this parameter to scan the string until the first \0 byte. If maxBytesToRead is
//                 passed, and the string at [ptr, ptr+maxBytesToReadr[ contains a null byte in the
//                 middle, then the string will cut short at that byte index (i.e. maxBytesToRead will
//                 not produce a string of exact length [ptr, ptr+maxBytesToRead[)
//                 N.B. mixing frequent uses of UTF8ToString() with and without maxBytesToRead may
//                 throw JS JIT optimizations off, so it is worth to consider consistently using one
//                 style or the other.
/**
 * @param {number} ptr
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ToString(ptr, maxBytesToRead) {
  ;
  return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
}

// Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
// encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   heap: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array.
//                    This count should include the null terminator,
//                    i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
    return 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) {
      var u1 = str.charCodeAt(++i);
      u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
    }
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      heap[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      heap[outIdx++] = 0xC0 | (u >> 6);
      heap[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      heap[outIdx++] = 0xE0 | (u >> 12);
      heap[outIdx++] = 0x80 | ((u >> 6) & 63);
      heap[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      if (u > 0x10FFFF) warnOnce('Invalid Unicode code point 0x' + u.toString(16) + ' encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).');
      heap[outIdx++] = 0xF0 | (u >> 18);
      heap[outIdx++] = 0x80 | ((u >> 12) & 63);
      heap[outIdx++] = 0x80 | ((u >> 6) & 63);
      heap[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  heap[outIdx] = 0;
  return outIdx - startIdx;
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.
function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) ++len;
    else if (u <= 0x7FF) len += 2;
    else if (u <= 0xFFFF) len += 3;
    else len += 4;
  }
  return len;
}

// end include: runtime_strings.js
// include: runtime_strings_extra.js


// runtime_strings_extra.js: Strings related runtime functions that are available only in regular runtime.

// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function AsciiToString(ptr) {
  var str = '';
  while (1) {
    var ch = HEAPU8[((ptr++)>>0)];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

var UTF16Decoder = typeof TextDecoder != 'undefined' ? new TextDecoder('utf-16le') : undefined;

function UTF16ToString(ptr, maxBytesToRead) {
  assert(ptr % 2 == 0, 'Pointer passed to UTF16ToString must be aligned to two bytes!');
  var endPtr = ptr;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  var idx = endPtr >> 1;
  var maxIdx = idx + maxBytesToRead / 2;
  // If maxBytesToRead is not passed explicitly, it will be undefined, and this
  // will always evaluate to true. This saves on code size.
  while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
  endPtr = idx << 1;

  if (endPtr - ptr > 32 && UTF16Decoder) {
    return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  } else {
    var str = '';

    // If maxBytesToRead is not passed explicitly, it will be undefined, and the for-loop's condition
    // will always evaluate to true. The loop is then terminated on the first null char.
    for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
      var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
      if (codeUnit == 0) break;
      // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
      str += String.fromCharCode(codeUnit);
    }

    return str;
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
// Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF16(str, outPtr, maxBytesToWrite) {
  assert(outPtr % 2 == 0, 'Pointer passed to stringToUTF16 must be aligned to two bytes!');
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2; // Null terminator.
  var startPtr = outPtr;
  var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[((outPtr)>>1)] = codeUnit;
    outPtr += 2;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[((outPtr)>>1)] = 0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF16(str) {
  return str.length*2;
}

function UTF32ToString(ptr, maxBytesToRead) {
  assert(ptr % 4 == 0, 'Pointer passed to UTF32ToString must be aligned to four bytes!');
  var i = 0;

  var str = '';
  // If maxBytesToRead is not passed explicitly, it will be undefined, and this
  // will always evaluate to true. This saves on code size.
  while (!(i >= maxBytesToRead / 4)) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0) break;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
  return str;
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
// Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF32(str, outPtr, maxBytesToWrite) {
  assert(outPtr % 4 == 0, 'Pointer passed to stringToUTF32 must be aligned to four bytes!');
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[((outPtr)>>2)] = codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[((outPtr)>>2)] = 0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF32(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
    len += 4;
  }

  return len;
}

// Allocate heap space for a JS string, and write it there.
// It is the responsibility of the caller to free() that memory.
function allocateUTF8(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = _malloc(size);
  if (ret) stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

// Allocate stack space for a JS string, and write it there.
function allocateUTF8OnStack(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

// Deprecated: This function should not be called because it is unsafe and does not provide
// a maximum length limit of how many bytes it is allowed to write. Prefer calling the
// function stringToUTF8Array() instead, which takes in a maximum length that can be used
// to be secure from out of bounds writes.
/** @deprecated
    @param {boolean=} dontAddNull */
function writeStringToMemory(string, buffer, dontAddNull) {
  warnOnce('writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!');

  var /** @type {number} */ lastChar, /** @type {number} */ end;
  if (dontAddNull) {
    // stringToUTF8Array always appends null. If we don't want to do that, remember the
    // character that existed at the location where the null will be placed, and restore
    // that after the write (below).
    end = buffer + lengthBytesUTF8(string);
    lastChar = HEAP8[end];
  }
  stringToUTF8(string, buffer, Infinity);
  if (dontAddNull) HEAP8[end] = lastChar; // Restore the value under the null character.
}

function writeArrayToMemory(array, buffer) {
  assert(array.length >= 0, 'writeArrayToMemory array must have a length (should be an array or typed array)')
  HEAP8.set(array, buffer);
}

/** @param {boolean=} dontAddNull */
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    assert(str.charCodeAt(i) === (str.charCodeAt(i) & 0xff));
    HEAP8[((buffer++)>>0)] = str.charCodeAt(i);
  }
  // Null-terminate the pointer to the HEAP.
  if (!dontAddNull) HEAP8[((buffer)>>0)] = 0;
}

// end include: runtime_strings_extra.js
// Memory management

function alignUp(x, multiple) {
  if (x % multiple > 0) {
    x += multiple - (x % multiple);
  }
  return x;
}

var HEAP,
/** @type {ArrayBuffer} */
  buffer,
/** @type {Int8Array} */
  HEAP8,
/** @type {Uint8Array} */
  HEAPU8,
/** @type {Int16Array} */
  HEAP16,
/** @type {Uint16Array} */
  HEAPU16,
/** @type {Int32Array} */
  HEAP32,
/** @type {Uint32Array} */
  HEAPU32,
/** @type {Float32Array} */
  HEAPF32,
/** @type {Float64Array} */
  HEAPF64;

function updateGlobalBufferAndViews(buf) {
  buffer = buf;
  Module['HEAP8'] = HEAP8 = new Int8Array(buf);
  Module['HEAP16'] = HEAP16 = new Int16Array(buf);
  Module['HEAP32'] = HEAP32 = new Int32Array(buf);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(buf);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(buf);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(buf);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(buf);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(buf);
}

var TOTAL_STACK = 5242880;
if (Module['TOTAL_STACK']) assert(TOTAL_STACK === Module['TOTAL_STACK'], 'the stack size can no longer be determined at runtime')

var INITIAL_MEMORY = Module['INITIAL_MEMORY'] || 16777216;
if (!Object.getOwnPropertyDescriptor(Module, 'INITIAL_MEMORY')) {
  Object.defineProperty(Module, 'INITIAL_MEMORY', {
    configurable: true,
    get: function() {
      abort('Module.INITIAL_MEMORY has been replaced with plain INITIAL_MEMORY (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)')
    }
  });
}

assert(INITIAL_MEMORY >= TOTAL_STACK, 'INITIAL_MEMORY should be larger than TOTAL_STACK, was ' + INITIAL_MEMORY + '! (TOTAL_STACK=' + TOTAL_STACK + ')');

// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array != 'undefined' && typeof Float64Array !== 'undefined' && Int32Array.prototype.subarray != undefined && Int32Array.prototype.set != undefined,
       'JS engine does not provide full typed array support');

// If memory is defined in wasm, the user can't provide it.
assert(!Module['wasmMemory'], 'Use of `wasmMemory` detected.  Use -s IMPORTED_MEMORY to define wasmMemory externally');
assert(INITIAL_MEMORY == 16777216, 'Detected runtime INITIAL_MEMORY setting.  Use -s IMPORTED_MEMORY to define wasmMemory dynamically');

// include: runtime_init_table.js
// In regular non-RELOCATABLE mode the table is exported
// from the wasm module and this will be assigned once
// the exports are available.
var wasmTable;

// end include: runtime_init_table.js
// include: runtime_stack_check.js


// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  var max = _emscripten_stack_get_end();
  assert((max & 3) == 0);
  // The stack grows downwards
  HEAP32[((max + 4)>>2)] = 0x2135467;
  HEAP32[((max + 8)>>2)] = 0x89BACDFE;
  // Also test the global address 0 for integrity.
  HEAP32[0] = 0x63736d65; /* 'emsc' */
}

function checkStackCookie() {
  if (ABORT) return;
  var max = _emscripten_stack_get_end();
  var cookie1 = HEAPU32[((max + 4)>>2)];
  var cookie2 = HEAPU32[((max + 8)>>2)];
  if (cookie1 != 0x2135467 || cookie2 != 0x89BACDFE) {
    abort('Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x2135467, but received 0x' + cookie2.toString(16) + ' 0x' + cookie1.toString(16));
  }
  // Also test the global address 0 for integrity.
  if (HEAP32[0] !== 0x63736d65 /* 'emsc' */) abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
}

// end include: runtime_stack_check.js
// include: runtime_assertions.js


// Endianness check
(function() {
  var h16 = new Int16Array(1);
  var h8 = new Int8Array(h16.buffer);
  h16[0] = 0x6373;
  if (h8[0] !== 0x73 || h8[1] !== 0x63) throw 'Runtime error: expected the system to be little-endian! (Run with -s SUPPORT_BIG_ENDIAN=1 to bypass)';
})();

// end include: runtime_assertions.js
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the main() is called

var runtimeInitialized = false;
var runtimeExited = false;
var runtimeKeepaliveCounter = 0;

function keepRuntimeAlive() {
  return noExitRuntime || runtimeKeepaliveCounter > 0;
}

function preRun() {

  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
  checkStackCookie();
  assert(!runtimeInitialized);
  runtimeInitialized = true;

  
if (!Module["noFSInit"] && !FS.init.initialized)
  FS.init();
FS.ignorePermissions = false;

TTY.init();
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  checkStackCookie();
  
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  checkStackCookie();
  runtimeExited = true;
}

function postRun() {
  checkStackCookie();

  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}

function addOnExit(cb) {
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

// include: runtime_math.js


// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc

assert(Math.imul, 'This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.fround, 'This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.clz32, 'This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.trunc, 'This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');

// end include: runtime_math.js
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};

function getUniqueRunDependency(id) {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
}

function addRunDependency(id) {
  runDependencies++;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval != 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            err('still waiting on run dependencies:');
          }
          err('dependency: ' + dep);
        }
        if (shown) {
          err('(end of list)');
        }
      }, 10000);
    }
  } else {
    err('warning: run dependency added without ID');
  }
}

function removeRunDependency(id) {
  runDependencies--;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    err('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data

/** @param {string|number=} what */
function abort(what) {
  {
    if (Module['onAbort']) {
      Module['onAbort'](what);
    }
  }

  what = 'Aborted(' + what + ')';
  // TODO(sbc): Should we remove printing and leave it up to whoever
  // catches the exception?
  err(what);

  ABORT = true;
  EXITSTATUS = 1;

  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.

  // Suppress closure compiler warning here. Closure compiler's builtin extern
  // defintion for WebAssembly.RuntimeError claims it takes no arguments even
  // though it can.
  // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure gets fixed.

  /** @suppress {checkTypes} */
  var e = new WebAssembly.RuntimeError(what);

  // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.
  throw e;
}

// {{MEM_INITIALIZER}}

// include: memoryprofiler.js


// end include: memoryprofiler.js
// include: URIUtils.js


// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';

// Indicates whether filename is a base64 data URI.
function isDataURI(filename) {
  // Prefix of data URIs emitted by SINGLE_FILE and related options.
  return filename.startsWith(dataURIPrefix);
}

// Indicates whether filename is delivered via file protocol (as opposed to http/https)
function isFileURI(filename) {
  return filename.startsWith('file://');
}

// end include: URIUtils.js
/** @param {boolean=} fixedasm */
function createExportWrapper(name, fixedasm) {
  return function() {
    var displayName = name;
    var asm = fixedasm;
    if (!fixedasm) {
      asm = Module['asm'];
    }
    assert(runtimeInitialized, 'native function `' + displayName + '` called before runtime initialization');
    assert(!runtimeExited, 'native function `' + displayName + '` called after runtime exit (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    if (!asm[name]) {
      assert(asm[name], 'exported native function `' + displayName + '` not found');
    }
    return asm[name].apply(null, arguments);
  };
}

var wasmBinaryFile;
  wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAABgIKAgAAmYAN/f38Bf2ABfwF/YAJ/fwF/YAF/AGAAAX9gAABgAn9/AGADf35/AX5gBX9+fn5+AGAEf39/fwF/YAV/f39/fwF/YAV/f39/fwBgBH9/f38AYAN/f38AYAZ/f39/f38Bf2AEf35+fwBgAnx/AXxgBn98f39/fwF/YAJ+fwF/YAR+fn5+AX9gAX8BfGABfAF/YAJ/fgBgAn5+AX9gA39+fgBgBn9/f39/fwBgB39/f39/f38AYAJ/fwF+YAJ/fwF8YAR/f39+AX5gB39/f39/f38Bf2ADfn9/AX9gAXwBfmACf3wAYAJ/fQBgAn5+AXxgBH9/fn8BfmAEf35/fwF/ApmEgIAAFgNlbnYEZXhpdAADA2VudgppbnZva2VfaWlpAAADZW52C3NldFRlbXBSZXQwAAMDZW52C2dldFRlbXBSZXQwAAQDZW52C2ludm9rZV9paWlpAAkDZW52CWludm9rZV9paQACA2VudghpbnZva2VfaQABA2Vudg1pbnZva2VfaWlpaWlpAA4DZW52C2ludm9rZV92aWlpAAwDZW52CGludm9rZV92AAMDZW52FWVtc2NyaXB0ZW5fbWVtY3B5X2JpZwAAA2Vudg5fX3N5c2NhbGxfb3BlbgAAA2VudhFfX3N5c2NhbGxfZmNudGw2NAAAA2Vudg9fX3N5c2NhbGxfaW9jdGwAABZ3YXNpX3NuYXBzaG90X3ByZXZpZXcxCGZkX3dyaXRlAAkWd2FzaV9zbmFwc2hvdF9wcmV2aWV3MQdmZF9yZWFkAAkWd2FzaV9zbmFwc2hvdF9wcmV2aWV3MQhmZF9jbG9zZQABFndhc2lfc25hcHNob3RfcHJldmlldzERZW52aXJvbl9zaXplc19nZXQAAhZ3YXNpX3NuYXBzaG90X3ByZXZpZXcxC2Vudmlyb25fZ2V0AAIDZW52FmVtc2NyaXB0ZW5fcmVzaXplX2hlYXAAAQNlbnYZX2Vtc2NyaXB0ZW5fdGhyb3dfbG9uZ2ptcAAFFndhc2lfc25hcHNob3RfcHJldmlldzEHZmRfc2VlawAKA5uCgIAAmQIFAQICAgAAAgIBFAoDCwsGAgYJAgsLCwMFBQMDBgEFAwUCCg4CDAEBAQMGAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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IHogfWohfiB+IHg6AAAgBygCbCF/QQwhgAFB/wEhgQEggAEggQFxIYIBIH8gggEQJSAHKAJsIYMBIAcoAlQhhAEgBygCZCGFASAHKAJgIYYBQQAhhwFBASGIASCHASCIAXEhiQEggwEghAEghQEghgEgiQEQLCAHKAJsIYoBIIoBKAIEIYsBIAcgiwE2AjggBygCOCGMASAHKAJAIY0BIIwBII0BayGOAUECIY8BII4BII8BayGQAUEIIZEBIJABIJEBdSGSASAHKAJsIZMBIJMBKAIAIZQBIAcoAkAhlQEglAEglQFqIZYBIJYBIJIBOgAAIAcoAjghlwEgBygCQCGYASCXASCYAWshmQFBAiGaASCZASCaAWshmwFB/wEhnAEgmwEgnAFxIZ0BIAcoAmwhngEgngEoAgAhnwEgBygCQCGgAUEBIaEBIKABIKEBaiGiASCfASCiAWohowEgowEgnQE6AAAMAgsgBygCbCGkASCkASgCBCGlASAHIKUBNgI0IAcoAjQhpgEgBygCRCGnASCmASCnAWshqAFBAiGpASCoASCpAWshqgFBCCGrASCqASCrAXUhrAEgBygCbCGtASCtASgCACGuASAHKAJEIa8BIK4BIK8BaiGwASCwASCsAToAACAHKAI0IbEBIAcoAkQhsgEgsQEgsgFrIbMBQQIhtAEgswEgtAFrIbUBQf8BIbYBILUBILYBcSG3ASAHKAJsIbgBILgBKAIAIbkBIAcoAkQhugFBASG7ASC6ASC7AWohvAEguQEgvAFqIb0BIL0BILcBOgAAIAcoAmwhvgFBDCG/AUH/ASHAASC/ASDAAXEhwQEgvgEgwQEQJSAHKAJsIcIBIAcoAlQhwwEgBygCZCHEASAHKAJgIcUBQQEhxgFBASHHASDGASDHAXEhyAEgwgEgwwEgxAEgxQEgyAEQLAwBCyAHKAJMIckBIMkBEI8BIcoBQQEhywEgygEgywFxIcwBAkAgzAFFDQAgBygCTCHNASDNASgCECHOASDOARCZASHPAUEBIdABIM8BINABcSHRASDRAUUNACAHKAJMIdIBINIBKAIQIdMBINMBKAIQIdQBQYkQIdUBINQBINUBENABIdYBINYBDQAgBygCTCHXASDXASgCFCHYASDYASgCECHZASAHINkBNgIwIAcoAmwh2gEgBygCUCHbASAH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uAEaDAgLIAUoApwBIZsBQc8QIZwBQQAhnQEgmwEgnAEgnQEQuAEaDAcLIAUoApwBIZ4BIAUoApgBIZ8BIJ8BKAIQIaABIAUgoAE2AnBB9gkhoQFB8AAhogEgBSCiAWohowEgngEgoQEgowEQuAEaDAYLIAUoApwBIaQBQdMQIaUBQQAhpgEgpAEgpQEgpgEQuAEaAkADQCAFKAKYASGnASCnARCPASGoAUEBIakBIKgBIKkBcSGqASCqAUUNASAFKAKcASGrASAFKAKYASGsASCsASgCECGtASAFLQCXASGuAUEBIa8BIK4BIK8BcSGwASCrASCtASCwARCOASAFKAKYASGxASCxASgCFCGyASAFILIBNgKYASAFKAKYASGzASCzARCPASG0AUEBIbUBILQBILUBcSG2AQJAILYBRQ0AIAUoApwBIbcBQfwQIbgBQQAhuQEgtwEguAEguQEQuAEaCwwACwALIAUoApgBIboBILoBEJABIbsBQQEhvAEguwEgvAFxIb0BAkAgvQENACAFKAKcASG+AUH6ECG/AUEAIcABIL4BIL8BIMABELgBGiAFKAKcASHBASAFKAKYASHCASAFLQCXASHDAUEBIcQBIMMBIMQBcSHFASDBASDCASDFARCOAQsgBSgCnAEhxgFB0BAhxwFBACHIASDGASDHASDIARC4ARoMBQsgBSgCnAEhyQFB8Q8hygFBACHLASDJASDKASDLARC4ARoMBAsgBSgCnAEhzAFB/A8hzQFBACHOASDMASDNASDOARC4ARoMAwsgBSgCnAEhzwFB5A8h0AFBACHRASDPASDQASDRARC4ARoMAgsgBSgCnAEh0gFB1A8h0wFBACHUASDSASDTASDUARC4ARoMAQsgBSgCnAEh1QEgBSgCmAEh1gEg1gEoAhAh1wEgBSDXATYCgAFBwQ8h2AFBgAEh2QEgBSDZAWoh2gEg1QEg2AEg2gEQuAEaC0GgASHbASAFINsBaiHcASDcASQADwuGAQEVfyMAIQFBECECIAEgAmshAyADIAA2AgwgAygCDCEEQQAhBSAEIQYgBSEHIAYgB0chCEEAIQlBASEKIAggCnEhCyAJIQwCQCALRQ0AIAMoAgwhDSANKAIAIQ5BBCEPIA4hECAPIREgECARRiESIBIhDAsgDCETQQEhFCATIBRxIRUgFQ8LhgEB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lAE2ArwBAkADQCAEKAK8ASGVASAEKALMASGWASCVASGXASCWASGYASCXASCYAUghmQFBASGaASCZASCaAXEhmwEgmwFFDQEgBCgCwAEhnAEgnAEoAhQhnQEgBCCdATYCwAEgBCgCvAEhngFBASGfASCeASCfAWohoAEgBCCgATYCvAEMAAsACyAEKALAASGhASChASgCECGiASAEIKIBNgK4AUEAIaMBIAQgowE2ArQBAkADQCAEKAK0ASGkASAEKALIASGlASCkASGmASClASGnASCmASCnAUghqAFBASGpASCoASCpAXEhqgEgqgFFDQEgBCgCuAEhqwEgqwEoAhQhrAEgBCCsATYCuAEgBCgCtAEhrQFBASGuASCtASCuAWohrwEgBCCvATYCtAEMAAsACyAEKALEASGwASAEKAK4ASGxASCxASCwATYCECAEKAL4ASGyASAEKALEASGzASCyASCzARCjAQwOCyAEKAL4ASG0ASC0ASgCFCG1ASC1AS0AACG2AUH/ASG3ASC2ASC3AXEhuAFBCCG5ASC4ASC5AXQhugEgBCgC+AEhuwEguwEoAhQhvAEgvAEtAAEhvQFB/wEhvgEgvQEgvgFxIb8BILoBIL8BciHAASAEIMABNgKwASAEKAL4ASHBASDBASgCFCHCAUECIcMBIMIBIMMBaiHEASDBASDEATYCFCAEKAL4ASHFASDFASgCHCHGASDGASgCGCHHASAEKAKwASHIAUECIckBIMgBIMkBdCHKASDHASDKAWohywEgywEoAgAhzAEgBCDMATYCrAEgBCgC+AEhzQEgBCgCrAEhzgEgzQEgzgEQnwEhzwEgBCDPATYCqAEgBCgCqAEh0AFBACHRASDQASHSASDRASHTASDSASDTAUch1AFBASHVASDUASDVAXEh1gECQCDWAQ0AIAQoAvgBIdcBIAQoAqwBIdgBINgBKAIQIdkBIAQg2QE2AhBB5Akh2gFBECHbASAEINsBaiHcASDXASDaASDcARCeAQsgBCgC+AEh3QEgBCgCqAEh3gEg3QEg3gEQowEMDQsgBCgC+AEh3wEg3wEoAhQh4AEg4AEtAAAh4QFB/wEh4gEg4QEg4gFxIeMBQQgh5AEg4wEg5AF0IeUBIAQoAvgBIeYBIOYBKAIUIecBIOcBLQABIegBQf8BIekBIOgBIOkBcSHq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D2pBASAAKAIgEQAAQQFHDQAgAS0ADyECCyABQRBqJAAgAgtHAQJ/IAAgATcDcCAAIAAoAiwgACgCBCICa6w3A3ggACgCCCEDAkAgAVANACADIAJrrCABVw0AIAIgAadqIQMLIAAgAzYCaAvdAQIDfwJ+IAApA3ggACgCBCIBIAAoAiwiAmusfCEEAkACQAJAIAApA3AiBVANACAEIAVZDQELIAAQ2wEiAkF/Sg0BIAAoAgQhASAAKAIsIQILIABCfzcDcCAAIAE2AmggACAEIAIgAWusfDcDeEF/DwsgBEIBfCEEIAAoAgQhASAAKAIIIQMCQCAAKQNwIgVCAFENACAFIAR9IgUgAyABa6xZDQAgASAFp2ohAwsgACADNgJoIAAgBCAAKAIsIgMgAWusfDcDeAJAIAEgA0sNACABQX9qIAI6AAALIAILrgEAAkACQCABQYAISA0AIABEAAAAAAAA4H+iIQACQCABQf8PTg0AIAFBgXhqIQEMAgsgAEQAAAAAAADgf6IhACABQf0XIAFB/RdIG0GCcGohAQwBCyABQYF4Sg0AIABEAAAAAAAAYAOiIQACQCABQbhwTA0AIAFByQdqIQEMAQsgAEQAAAAAAABgA6IhACABQfBoIAFB8GhKG0GSD2ohAQsgACABQf8Haq1CNIa/ogs1ACAAIAE3AwAgACAEQjCIp0GAgAJxIAJCMIinQf//AXFyrUIwhiACQv///////z+DhDcDCAvnAgEBfyMAQdAAayIEJAACQAJAIANBgIABSA0AIARBIGogASACQgBCgICAgICAgP//ABChAiAEQSBqQQhqKQMAIQIgBCkDICEBAkAgA0H//wFODQAgA0GBgH9qIQMMAgsgBEEQaiABIAJCAEKAgICAgICA//8AEKECIANB/f8CIANB/f8CSBtBgoB+aiEDIARBEGpBCGopAwAhAiAEKQMQIQEMAQsgA0GBgH9KDQAgBEHAAGogASACQgBCgICAgICAgDkQoQIgBEHAAGpBCGopAwAhAiAEKQNAIQECQCADQfSAfkwNACADQY3/AGohAwwBCyAEQTBqIAEgAkIAQoCAgICAgIA5EKECIANB6IF9IANB6IF9ShtBmv4BaiEDIARBMGpBCGopAwAhAiAEKQMwIQELIAQgASACQgAgA0H//wBqrUIwhhChAiAAIARBCGopAwA3AwggACAEKQMANwMAIARB0ABqJAALSwIBfgJ/IAFC////////P4MhAgJAAkAgAUIwiKdB//8BcSIDQf//AUYNAEEEIQQgAw0BQQJBAyACIACEUBsPCyACIACEUCEECyAEC9gGAgR/A34jAEGAAWsiBSQAAkACQAJAIAMgBEIAQgAQkwJFDQAgAyAEEOEBRQ0AIAJCMIinIgZB//8BcSIHQf//AUcNAQsgBUEQaiABIAIgAyAEEKECIAUgBSkDECIEIAVBEGpBCGopAwAiAyAEIAMQlQIgBUEIaikDACECIAUpAwAhBAwBCwJAIAEgB61CMIYgAkL///////8/g4QiCSADIARCMIinQf//AXEiCK1CMIYgBEL///////8/g4QiChCTAkEASg0AAkAgASAJIAMgChCTAkUNACABIQQMAgsgBUHwAGogASACQgBCABChAiAFQfgAaikDACECIAUpA3AhBAwBCwJAAkAgB0UNACABIQQMAQsgBUHgAGogASAJQgBCgICAgICAwLvAABChAiAFQegAaikDACIJQjCIp0GIf2ohByAFKQNgIQQLAkAgCA0AIAVB0ABqIAMgCkIAQoCAgICAgMC7wAAQoQIgBUHYAGopAwAiCkIwiKdBiH9qIQggBSkDUCEDCyAKQv///////z+DQoCAgICAgMAAhCELIAlC////////P4NCgICAgICAwACEIQkCQCAHIAhMDQADQAJAAkAgCSALfSAEIANUrX0iCkIAUw0AAkAgCiAEIAN9IgSEQgBSDQAgBUEgaiABIAJCAEIAEKECIAVBKGopAwAhAiAFKQMgIQQMBQsgCkIBhiAEQj+IhCEJDAELIAlCAYYgBEI/iIQhCQsgBEIBhiEEIAdBf2oiByAISg0ACyAIIQcLAkACQCAJIAt9IAQgA1StfSIKQgBZDQAgCSEKDAELIAogBCADfSIEhEIAUg0AIAVBMGogASACQgBCABChAiAFQThqKQMAIQIgBSkDMCEEDAELAkAgCkL///////8/Vg0AA0AgBEI/iCEDIAdBf2ohByAEQgGGIQQgAyAKQgGGhCIKQoCAgICAgMAAVA0ACwsgBkGAgAJxIQgCQCAHQQBKDQAgBUHAAGogBCAKQv///////z+DIAdB+ABqIAhyrUIwhoRCAEKAgICAgIDAwz8QoQIgBUHIAGopAwAhAiAF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IgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABMgEANwMADwsgAiACKAIAIgFBBGo2AgAgACABMwEANwMADwsgAiACKAIAIgFBBGo2AgAgACABMAAANwMADwsgAiACKAIAIgFBBGo2AgAgACABMQAANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKQMANwMADwsgAiACKAIAIgFBBGo2AgAgACABNAIANwMADwsgAiACKAIAIgFBBGo2AgAgACABNQIANwMADwsgAiACKAIAQQdqQXhxIgFBCGo2AgAgACABKwMAOQMADwsgACACIAMRBgALCz4BAX8CQCAAUA0AA0AgAUF/aiIBIACnQQ9xQfDfAGotAAAgAnI6AAAgAEIPViEDIABCBIghACADDQALCyABCzYBAX8CQCAAUA0AA0AgAUF/aiIBIACnQQdxQTByOgAAIABCB1YhAiAAQgOIIQAgAg0ACwsgAQuIAQIBfgN/AkACQCAAQoCAgIAQWg0AIAAhAgwBCwNAIAFBf2oiASAAIABCCoAiAkIKfn2nQTByOgAAIABC/////58BViEDIAIhACADDQALCwJAIAKnIgNFDQADQCABQX9qIgEgAyADQQpuIgRBCmxrQTByOgAAIANBCUshBSAEIQMgBQ0ACwsgAQtzAQF/IwBBgAJrIgUkAAJAIARBgMAEcQ0AIAIgA0wNACAFIAFB/wFxIAIgA2siAkGAAiACQYACSSIDGxCqARoCQCADDQADQCAAIAVBgAIQ9AEgAkGAfmoiAkH/AUsNAAsLIAAgBSACEPQBCyAFQYACaiQACxEAIAAgASACQcYAQccAEPIBC6cZAxF/An4BfCMAQbAEayIGJABBACEHIAZBADYCLAJAAkAgARD+ASIXQn9VDQBBASEIQdAIIQkgAZoiARD+ASEXDAELAkAgBEGAEHFFDQBBASEIQdMIIQkMAQtB1ghB0Qgg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Rht0IQMgBCgCACEGA0AgBiIEKAIEQXhxIAFGDQIgA0EddiEGIANBAXQhAyAEIAZBBHFqQRBqIgIoAgAiBg0ACyACIAA2AgAgAEEYaiAENgIACyAAIAA2AgwgACAANgIIDwsgBCgCCCIBIAA2AgwgBCAANgIIIABBGGpBADYCACAAIAQ2AgwgACABNgIICwtlAgF/AX4CQAJAIAANAEEAIQIMAQsgAK0gAa1+IgOnIQIgASAAckGAgARJDQBBfyACIANCIIinQQBHGyECCwJAIAIQiQIiAEUNACAAQXxqLQAAQQNxRQ0AIABBACACEKoBGgsgAAsHAD8AQRB0C1IBAn9BACgCtGIiASAAQQNqQXxxIgJqIQACQAJAIAJFDQAgACABTQ0BCwJAIAAQjwJNDQAgABATRQ0BC0EAIAA2ArRiIAEPCxCoAUEwNgIAQX8L+AoCBH8EfiMAQfAAayIFJAAgBEL///////////8AgyEJAkACQAJAIAFCf3wiCkJ/USACQv///////////wCDIgsgCiABVK18Qn98IgpC////////v///AFYgCkL///////+///8AURsNACADQn98IgpCf1IgCSAKIANUrXxCf3wiCkL///////+///8AVCAKQv///////7///wBRGw0BCwJAIAFQIAtCgICAgICAwP//AFQgC0KAgICAgIDA//8AURsNACACQoCAgICAgCCEIQQgASEDDAILAkAgA1AgCUKAgICAgIDA//8AVCAJQoCAgICAgMD//wBRGw0AIARCgICAgICAIIQhBAwCCwJAIAEgC0KAgICAgIDA//8AhYRCAFINAEKAgICAgIDg//8AIAIgAyABhSAEIAKFQoCAgICAgICAgH+FhFAiBhshBEIAIAEgBhshAwwCCyADIAlCgICAgICAwP//AIWEUA0BAkAgASALhEIAUg0AIAMgCYRCAFINAiADIAGDIQMgBCACgyEEDAILIAMgCYRQRQ0AIAEhAyACIQQMAQsgAyABIAMgAVYgCSALViAJIAtRGyIHGyEJIAQgAiAHGyILQv///////z+DIQogAiAEIAcbIgJCMIinQf//AXEhCAJAIAtCMIinQf//AXEiBg0AIAVB4ABqIAkgCiAJIAogClAiBht5IAZBBnStfKciBkFxahCSAkEQIAZrIQYgBUHoAGopAwAhCiAFKQNgIQkLIAEgAyAHGyEDIAJC////////P4MhBAJAIAgNACAFQdAAaiADIAQgAyAEIARQIgcbeSAHQQZ0rXynIgdBcWoQkgJBECAHayEIIAVB2ABqKQMAIQQgBSkDUCEDCyAEQgOGIANCPYiEQoCAgICAgIAEhCEEIApCA4YgCUI9iIQhASADQgOGIQMgCyAChSEKAkAgBiAIayIHRQ0AAkAgB0H/AE0NAEIAIQRCASEDDAELIAVBwABqIAMgBEGAASAHaxCSAiAFQTBqIAMgBCAHEKACIAUpAzAgBSkDQCAFQcAAakEIaikDAIRCAFKthCEDIAVBMGpBCGopAwAhBAsgAUKAgICAgICABIQhDCAJQgOGIQICQAJAIApCf1UNAAJAIAIgA30iASAMIAR9IAIgA1StfSIEhFBFDQBCACEDQgAhBAwDCyAEQv////////8DVg0BIAVBIGogASAEIAEgBCAEUCIHG3kgB0EGdK18p0F0aiIHEJICIAYgB2shBiAFQShqKQMAIQQgBSkDICEBDAELIAQgDHwgAyACfCIBIANUrXwiBEKAgICAgICACINQDQAgAUIBiCAEQj+GhCABQgGDhCEBIAZBAWohBiAEQgGIIQQLIAtCgICAgICAgICAf4MhAgJAIAZB//8BSA0AIAJCgICAgICAwP//AIQhBEIAIQMMAQtBACEHAkACQCAGQQBMDQAgBiEHDAELIAVBEGogASAEIAZB/wBqEJICIAUgASAEQQEgBmsQoAIgBSkDACAFKQMQIAVBEGpBCGopAwCEQgBSrYQhASAFQQhqKQMAIQQLIAFCA4ggBEI9hoQhAyAHrUIwhiAEQgOIQv///////z+DhCAChCEEIAGnQQdxIQYCQAJAAkACQAJAEJ4CDgMAAQIDCyAEIAMgBkEES618IgEgA1StfCEEAkAgBkEERg0AIAEhAwwDCyAEIAFCAYMiAiABfCIDIAJUrXwhBAwDCyAEIAMgAkIAUiAGQQBHca18IgEgA1StfCEEIAEhAwwBCyAEIAMgAlAgBkEAR3GtfCIBIANUrXwhBCABIQMLIAZFDQELEJ8CGgsgACADNwMAIAAgBDcDCCAFQfAAaiQAC1MBAX4CQAJAIANBwABxRQ0AIAEgA0FAaq2GIQJCACEBDAELIANFDQAgAUHAACADa62IIAIgA60iBIaEIQIgASAEhiEBCyAAIAE3AwAgACACNwMIC+ABAgF/An5BASEEAkAgAEIAUiABQv///////////wCDIgVCgICAgICAwP//AFYgBUKAgICAgIDA//8AURsNACACQgBSIANC////////////AIMiBkKAgICAgIDA//8AViAGQoCAgICAgMD//wBRGw0AAkAgAiAAhCAGIAWEhFBFDQBBAA8LAkAgAyABg0IAUw0AQX8hBCAAIAJUIAEgA1MgASADURsNASAAIAKFIAEgA4WEQgBSDwtBfyEEIAAgAlYgASADVSABIANRGw0AIAAgAoUgASADhYRCAFIhBAsgBAvYAQIBfwJ+QX8hBAJAIABCAFIgAUL///////////8AgyIFQoCAgICAgMD//wBWIAVCgICAgICAwP//AFEbDQAgAkIAUiADQv///////////wCDIgZCgICAgICAwP//AFYgBkKAgICAgIDA//8AURsNAAJAIAIgAIQgBiAFhIRQRQ0AQQAPCwJAIAMgAYNCAFMNACAAIAJUIAEgA1MgASADURsNASAAIAKFIAEgA4WEQgBSDwsgACACViABIANVIAEgA1EbDQAgACAChSABIAOFhEIAUiEECyAEC+8QAgV/Dn4jAEHQAmsiBSQAIARC////////P4MhCiACQv///////z+DIQsgBCAChUKAgICAgICAgIB/gyEMIARCMIinQf//AXEhBgJAAkACQCACQjCIp0H//wFxIgdBf2pB/f8BSw0AQQAhCCAGQX9qQf7/AUkNAQsCQCABUCACQv///////////wCDIg1CgICAgICAwP//AFQgDUKAgICAgIDA//8AURsNACACQoCAgICAgCCEIQwMAgsCQCADUCAEQv///////////wCDIgJCgICAgICAwP//AFQgAkKAgICAgIDA//8AURsNACAEQoCAgICAgCCEIQwgAyEBDAILAkAgASANQoCAgICAgMD//wCFhEIAUg0AAkAgAyACQoCAgICAgMD//wCFhFBFDQBCACEBQoCAgICAgOD//wAhDAwDCyAMQoCAgICAgMD//wCEIQxCACEBDAILAkAgAyACQoCAgICAgMD//wCFhEIAUg0AQgAhAQwCCwJAIAEgDYRCAFINAEKAgICAgIDg//8AIAwgAyAChFAbIQxCACEBDAILAkAgAyAChEIAUg0AIAxC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DQADQAJAIAIgBEEDdGoiBigCAA0AIAYgBTYCACACIARBA3RqIgQgATYCBCAEQQhqQQA2AgAgAxACIAIPCyAEQQFqIgQgA0cNAAsLIAAgASACIANBBHRBCHIQiwIgA0EBdCIEEJcCIQMgBBACIAMLRwECfwJAIAJFDQBBACEDA0AgASADQQN0aigCACIERQ0BAkAgBCAARw0AIAEgA0EDdGooAgQPCyADQQFqIgMgAkcNAAsLQQALCwAgACABEJYCEBQLjgICAn8DfiMAQRBrIgIkAAJAAkAgAb0iBEL///////////8AgyIFQoCAgICAgIB4fEL/////////7/8AVg0AIAVCPIYhBiAFQgSIQoCAgICAgICAPHwhBQwBCwJAIAVCgICAgICAgPj/AFQNACAEQjyGIQYgBEIEiEKAgICAgIDA//8AhCEFDAELAkAgBVBFDQBCACEGQgAhBQwBCyACIAVCACAEp2dBIGogBUIgiKdnIAVCgICAgBBUGyIDQTFqEJICIAJBCGopAwBCgICAgICAwACFQYz4ACADa61CMIaEIQUgAikDACEGCyAAIAY3AwAgACAFIARCgICAgICAgICAf4OENwMIIAJBEGokAAvhAQIDfwJ+IwBBEGsiAiQAAkACQCABvCIDQf////8HcSIEQYCAgHxqQf////cHSw0AIAStQhmGQoCAgICAgIDAP3whBUIAIQYMAQsCQCAEQYCAgPwHSQ0AIAOtQhmGQoCAgICAgMD//wCEIQVCACEGDAELAkAgBA0AQgAhBkIAIQUMAQsgAiAErUIAIARnIgRB0QBqEJICIAJBCGopAwBCgICAgICAwACFQYn/ACAEa61CMIaEIQUgAikDACEGCyAAIAY3AwAgACAFIANBgICAgHhxrUIghoQ3AwggAkEQaiQAC40BAgJ/An4jAEEQayICJAACQAJAIAENAEIAIQRCACEFDAELIAIgASABQR91IgNqIANzIgOtQgAgA2ciA0HRAGoQkgIgAkEIaikDAEKAgICAgIDAAIVBnoABIANrrUIwhnwgAUGAgICAeHGtQiCGhCEFIAIpAwAhBAsgACAENwMAIAAgBTcDCCACQRBqJAALcgIBfwJ+IwBBEGsiAiQAAkACQCABDQBCACEDQgAhBAwBCyACIAGtQgAgAWciAUHRAGoQkgIgAkEIaikDAEKAgICAgIDAAIVBnoABIAFrrUIwhnwhBCACKQMAIQMLIAAgAzcDACAAIAQ3AwggAkEQaiQACwQAQQALBABBAAtTAQF+AkACQCADQcAAcUUNACACIANBQGqtiCEBQgAhAgwBCyADRQ0AIAJBwAAgA2uthiABIAOtIgSIhCEBIAIgBIghAgsgACABNwMAIAAgAjcDCAvrCwIFfw9+IwBB4ABrIgUkACABQiCIIAJCIIaEIQogA0IRiCAEQi+GhCELIANCMYggBEL///////8/gyIMQg+GhCENIAQgAoVCgICAgICAgICAf4MhDiACQv///////z+DIg9CIIghECAMQhGIIREgBEIwiKdB//8BcSEGAkACQAJAIAJCMIinQf//AXEiB0F/akH9/wFLDQBBACEIIAZBf2pB/v8BSQ0BCwJAIAFQIAJC////////////AIMiEkKAgICAgIDA//8AVCASQoCAgICAgMD//wBRGw0AIAJCgICAgICAIIQhDgwCCwJAIANQIARC////////////AIMiAkKAgICAgIDA//8AVCACQoCAgICAgMD//wBRGw0AIARCgICAgICAIIQhDiADIQEMAgsCQCABIBJCgICAgICAwP//AIWEQgBSDQACQCADIAKEUEUNAEKAgICAgIDg//8AIQ5CACEBDAMLIA5CgICAgICAwP//AIQhDkIAIQEMAgsCQCADIAJCgICAgICAwP//AIWEQgBSDQAgASAShCECQgAhAQJAIAJQRQ0AQoCAgICAgOD//wAhDgwDCyAOQoCAgICAgMD//wCEIQ4MAgsCQCABIBKEQgBSDQBCACEBDAILAkAgAyAChEIAUg0AQgAhAQwCC0EAIQgCQCASQv///////z9WDQAgBUHQAGogASAPIAEgDyAPUCIIG3kgCEEGdK18pyIIQXFqEJICQRAgCGshCCAFKQNQIgFCIIggBUHYAGopAwAiD0IghoQhCiAPQiCIIRALIAJC////////P1YNACAFQcAAaiADIAwgAyAMIAxQIgkbeSAJQQZ0rXynIglBcWoQkgIgCCAJa0EQaiEIIAUpA0AiA0IxiCAFQcgAaikDACICQg+GhCENIANCEYggAkIvhoQhCyACQhGIIRELIAtC/////w+DIgIgAUL/////D4MiBH4iEyADQg+GQoCA/v8PgyIBIApC/////w+DIgN+fCIKQiCGIgwgASAEfnwiCyAMVK0gAiADfiIUIAEgD0L/////D4MiDH58IhIgDUL/////D4MiDyAEfnwiDSAKQiCIIAogE1StQiCGhHwiEyACIAx+IhUgASAQQoCABIQiCn58IhAgDyADfnwiFiARQv////8Hg0KAgICACIQiASAEfnwiEUIghnwiF3whBCAHIAZqIAhqQYGAf2ohBgJAAkAgDyAMfiIYIAIgCn58IgIgGFStIAIgASADfnwiAyACVK18IAMgEiAUVK0gDSASVK18fCICIANUrXwgASAKfnwgASAMfiIDIA8gCn58IgEgA1StQiCGIAFCIIiEfCACIAFCIIZ8IgEgAlStfCABIBFCIIggECAVVK0gFiAQVK18IBEgFlStfEIghoR8IgMgAVStfCADIBMgDVStIBcgE1StfHwiAiADVK18IgFCgICAgICAwACDUA0AIAZBAWohBgwBCyALQj+IIQMgAUIBhiACQj+IhCEBIAJCAYYgBEI/iIQhAiALQgGGIQsgAyAEQgGGhCEECwJAIAZB//8BSA0AIA5CgICAgICAwP//AIQhDkIAIQEMAQsCQAJAIAZBAEoNAAJAQQEgBmsiB0GAAUkNAEIAIQEMAwsgBUEwaiALIAQgBkH/AGoiBhCSAiAFQSBqIAIgASAGEJICIAVBEGogCyAEIAcQoAIgBSACIAEgBxCgAiAFKQMgIAUpAxCEIAUpAzAgBUEwakEIaikDAIRCAFKthCELIAVBIGpBCGopAwAgBUEQakEIaikDAIQhBCAFQQhqKQMAIQEgBSkDACECDAELIAatQjCGIAFC////////P4OEIQELIAEgDoQhDgJAIAtQIARCf1UgBEKAgICAgICAgIB/URsNACAOIAJCAXwiASACVK18IQ4MAQsCQCALIARCgICAgICAgICAf4WEQgBRDQAgAiEBDAELIA4gAiACQgGDfCIBIAJUrXwhDgsgACABNwMAIAAgDjcDCCAFQeAAaiQAC3UBAX4gACAEIAF+IAIgA358IANCIIgiBCABQiCIIgJ+fCADQv////8PgyIDIAFC/////w+DIgF+IgVCIIggAyACfnwiA0IgiHwgA0L/////D4MgBCABfnwiA0IgiHw3AwggACADQiCGIAVC/////w+DhDcDAAtIAQF/IwBBEGsiBSQAIAUgASACIAMgBEKAgICAgICAgIB/hRCRAiAFKQMAIQEgACAFQQhqKQMANwMIIAAgATcDACAFQRBqJAAL6gMCAn8CfiMAQSBrIgIkAAJAAkAgAUL///////////8AgyIEQoCAgICAgMD/Q3wgBEKAgICAgIDAgLx/fFoNACAAQjyIIAFCBIaEIQQCQCAAQv//////////D4MiAEKBgICAgICAgAhUDQAgBEKBgICAgICAgMAAfCEFDAILIARCgICAgICAgIDAAHwhBSAAQoCAgICAgICACIVCAFINASAFIARCAYN8IQUMAQsCQCAAUCAEQoCAgICAgMD//wBUIARCgICAgICAwP//AFEbDQAgAEI8iCABQgSGhEL/////////A4NCgICAgICAgPz/AIQhBQwBC0KAgICAgICA+P8AIQUgBEL///////+//8MAVg0AQgAhBSAEQjCIpyIDQZH3AEkNACACQRBqIAAgAUL///////8/g0KAgICAgIDAAIQiBCADQf+If2oQkgIgAiAAIARBgfgAIANrEKACIAIpAwAiBEI8iCACQQhqKQMAQgSGhCEFAkAgBEL//////////w+DIAIpAxAgAkEQakEIaikDAIRCAFKthCIEQoGAgICAgICACFQNACAFQgF8IQUMAQsgBEKAgICAgICAgAiFQgBSDQAgBUIBgyAFfCEFCyACQSBqJAAgBSABQoCAgICAgICAgH+DhL8LBAAjAAsGACAAJAALEgECfyMAIABrQXBxIgEkACABCxUAQZDyyAIkAkGI8ghBD2pBcHEkAQsHACMAIwFrCwQAIwILBAAjAQsNACABIAIgAyAAEQcACyQBAX4gACABIAKtIAOtQiCGhCAEEKwCIQUgBUIgiKcQAiAFpwsTACAAIAGnIAFCIIinIAIgAxAVCwvI2oCAAAIAQYAIC4BYaW5maW5pdHkAT3V0IG9mIG1lbW9yeQBkaXNwbGF5AGxldC1zeW50YXgAZGVmaW5lLXN5bnRheABsZXRyZWMtc3ludGF4AC0rICAgMFgweAAtMFgrMFggMFgtMHgrMHggMHgAbWVtdgAlMDl1ACV1AGxpc3QAbm90AENvbnRpbnVhdGlvbiBleHBlY3RzIDEgYXJndW1lbnQAcXVvdGllbnQAbGV0ACN0AGNvbnMAZXE/IGV4cGVjdHMgMiBhcmdzAGVxdWFsPyBleHBlY3RzIDIgYXJncwBzeW50YXgtcnVsZXMAVW5kZWZpbmVkIGdsb2JhbDogJXMAbWFrZS12ZWN0b3IAY2hhci0+aW50ZWdlcgByZW1haW5kZXIAY2RyAGludGVnZXItPmNoYXIAY2FyAG1lbXEAJSVjYXNlLXRlbXAAbW9kdWxvAGNhbGwtd2l0aC1jdXJyZW50LWNvbnRpbnVhdGlvbgBiZWdpbgBuYW4AcHJlbHVkZS5zY20Ac3RyaW5nLT5zeW1ib2wAc3ltYm9sLT5zdHJpbmcgZXhwZWN0cyAxIHN5bWJvbAB2ZWN0b3ItbGVuZ3RoAHN0cmluZy1sZW5ndGgAbm90IGV4cGVjdHMgMSBhcmcAc3ltYm9sLT5zdHJpbmcAbWFrZS1zdHJpbmcAc3RyaW5nLT5zeW1ib2wgZXhwZWN0cyAxIHN0cmluZwAlZwBpbmYAaWYAdmVjdG9yLXJlZgBzdHJpbmctcmVmACNmAHF1b3RlAHdyaXRlAGVsc2UAY2FzZQBDYW5ub3QgY2FsbCBub24tcHJvY2VkdXJlAGNhbGwvY2MgZXhwZWN0cyBwcm9jZWR1cmUAI1xuZXdsaW5lAGRlZmluZQAjXHNwYWNlAGNvbmQAYXBwZW5kAGFuZABTdGFjayB1bmRlcmZsb3cgYXQgUEMgb2Zmc2V0ICVsZAAlJWdlbi0lcy0lZABVbmtub3duIG9wY29kZTogJWQAbGV0cmVjAGNhbGwvY2MAI1wlYwByd2EAbGFtYmRhAF8AVk1fREVCVUdfQ09NUElMRVIATkFOAE5VTEwASU5GAGVxdj8AcGFpcj8AbnVtYmVyPwBjaGFyPwBlcT8AemVybz8AYm9vbGVhbj8Ac3ltYm9sPwBudWxsPwBlcXVhbD8AY2hhci1sb3dlci1jYXNlPwBjaGFyLXVwcGVyLWNhc2U/AGNoYXItd2hpdGVzcGFjZT8AY2hhci1hbHBoYWJldGljPwBjaGFyLW51bWVyaWM/ACM8cmF3ICVwPgAjPG1hY3JvPgAjPGNvbnRpbnVhdGlvbj4AIzxwcmltaXRpdmU+ACM8Y2xvc3VyZT4AIzxwcm90b3R5cGU+AD0+AD49ADw9ADwALwBFcnJvciBvY2N1cnJlZCBkdXJpbmcgZXhlY3V0aW9uLgAuLi4AJWdlbi0AKwBsZXQqAChudWxsKQAoKQAjKAAiJXMiAHZlY3Rvci1zZXQhAHN0cmluZy1zZXQhAEVycm9yOiAAIC4gAEdDIFByb3RlY3Rpb24gU3RhY2sgT3ZlcmZsb3cKAENvbXBpbGluZyBzeW1ib2w6ICVzCgAAAAAAAAAAAAAAAAAAAB8GAACPBgAAbQgAAAYHAAA7BgAAagUAAPUGAABLBQAAogQAAEMIAADuBgAAngYAAKoGAAACBQAATAYAACoEAAAfBAAAOAQAAHAEAAAAAAAAL3ByZWx1ZGUuc2NtADs7OyBSNVJTIFN0YW5kYXJkIExpYnJhcnkgUHJlbHVkZQoKOzs7IFN0YW5kYXJkIHByb2NlZHVyZXMKKGRlZmluZSAobm90IHgpIChpZiB4ICNmICN0KSkKCihkZWZpbmUgKGNhbGwtd2l0aC1jdXJyZW50LWNvbnRpbnVhdGlvbiBwcm9jKSAoY2FsbC13aXRoLWN1cnJlbnQtY29udGludWF0aW9uIHByb2MpKQooZGVmaW5lIGNhbGwvY2MgY2FsbC13aXRoLWN1cnJlbnQtY29udGludWF0aW9uKQoKKGRlZmluZSAobGlzdD8geCkKICAobGV0IGxvb3AgKCh4IHgpIChzbG93IHgpKQogICAgKGlmIChudWxsPyB4KSAjdAogICAgICAgIChpZiAobm90IChwYWlyPyB4KSkgI2YKICAgICAgICAgICAgKGxldCAoKHggKGNkciB4KSkpCiAgICAgICAgICAgICAgKGlmIChudWxsPyB4KSAjdAogICAgICAgICAgICAgICAgICAoaWYgKG5vdCAocGFpcj8geCkpICNmCiAgICAgICAgICAgICAgICAgICAgICAoaWYgKGVxPyB4IHNsb3cpICNmCiAgICAgICAgICAgICAgICAgICAgICAgICAgKGxvb3AgKGNkciB4KSAoY2RyIHNsb3cpKSkpKSkpKSkpCgo7OzsgUGFpcnMgYW5kIGxpc3RzCihkZWZpbmUgKGNhYXIgeCkgKGNhciAoY2FyIHgpKSkKKGRlZmluZSAoY2FkciB4KSAoY2FyIChjZHIgeCkpKQooZGVmaW5lIChjZGFyIHgpIChjZHIgKGNhciB4KSkpCihkZWZpbmUgKGNkZHIgeCkgKGNkciAoY2RyIHgpKSkKKGRlZmluZSAoY2FhYXIgeCkgKGNhciAoY2FhciB4KSkpCihkZWZpbmUgKGNhYWRyIHgpIChjYXIgKGNhZHIgeCkpKQooZGVmaW5lIChjYWRhciB4KSAoY2FyIChjZGFyIHgpKSkKKGRlZmluZSAoY2FkZHIgeCkgKGNhciAoY2RkciB4KSkpCihkZWZpbmUgKGNkYWFyIHgpIChjZHIgKGNhYXIgeCkpKQooZGVmaW5lIChjZGFkciB4KSAoY2RyIChjYWRyIHgpKSkKKGRlZmluZSAoY2RkYXIgeCkgKGNkciAoY2RhciB4KSkpCihkZWZpbmUgKGNkZGRyIHgpIChjZHIgKGNkZHIgeCkpKQooZGVmaW5lIChjYWFhYXIgeCkgKGNhciAoY2FhYXIgeCkpKQooZGVmaW5lIChjYWFhZHIgeCkgKGNhciAoY2FhZHIgeCkpKQooZGVmaW5lIChjYWFkYXIgeCkgKGNhciAoY2FkYXIgeCkpKQooZGVmaW5lIChjYWFkZHIgeCkgKGNhciAoY2FkZHIgeCkpKQooZGVmaW5lIChjYWRhYXIgeCkgKGNhciAoY2RhYXIgeCkpKQooZGVmaW5lIChjYWRhZHIgeCkgKGNhciAoY2RhZHIgeCkpKQooZGVmaW5lIChjYWRkYXIgeCkgKGNhciAoY2RkYXIgeCkpKQooZGVmaW5lIChjYWRkZHIgeCkgKGNhciAoY2RkZHIgeCkpKQooZGVmaW5lIChjZGFhYXIgeCkgKGNkciAoY2FhYXIgeCkpKQooZGVmaW5lIChjZGFhZHIgeCkgKGNkciAoY2FhZHIgeCkpKQooZGVmaW5lIChjZGFkYXIgeCkgKGNkciAoY2FkYXIgeCkpKQooZGVmaW5lIChjZGFkZHIgeCkgKGNkciAoY2FkZHIgeCkpKQooZGVmaW5lIChjZGRhYXIgeCkgKGNkciAoY2RhYXIgeCkpKQooZGVmaW5lIChjZGRhZHIgeCkgKGNkciAoY2RhZHIgeCkpKQooZGVmaW5lIChjZGRkYXIgeCkgKGNkciAoY2RkYXIgeCkpKQooZGVmaW5lIChjZGRkZHIgeCkgKGNkciAoY2RkZHIgeCkpKQoKKGRlZmluZSAobGVuZ3RoIGxzdCkKICAobGV0IGxvb3AgKChsIGxzdCkgKG4gMCkpCiAgICAoaWYgKG51bGw/IGwpIG4KICAgICAgICAobG9vcCAoY2RyIGwpICgrIG4gMSkpKSkpCgooZGVmaW5lIChhcHBlbmQgLiBsaXN0cykKICAoY29uZCAoKG51bGw/IGxpc3RzKSAnKCkpCiAgICAgICAgKChudWxsPyAoY2RyIGxpc3RzKSkgKGNhciBsaXN0cykpCiAgICAgICAgKGVsc2UKICAgICAgICAgKGxldHJlYyAoKGFwcGVuZC0yIChsYW1iZGEgKGwxIGwyKQogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoaWYgKG51bGw/IGwxKSBsMgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGNvbnMgKGNhciBsMSkgKGFwcGVuZC0yIChjZHIgbDEpIGwyKSkpKSkpCiAgICAgICAgICAgKGFwcGVuZC0yIChjYXIgbGlzdHMpIChhcHBseSBhcHBlbmQgKGNkciBsaXN0cykpKSkpKSkKCihkZWZpbmUgKHJldmVyc2UgbHN0KQogIChsZXQgbG9vcCAoKGwgbHN0KSAocmVzICcoKSkpCiAgICAoaWYgKG51bGw/IGwpIHJlcwogICAgICAgIChsb29wIChjZHIgbCkgKGNvbnMgKGNhciBsKSByZXMpKSkpKQoKKGRlZmluZSAobGlzdC1yZWYgbHN0IGspCiAgKGlmICh6ZXJvPyBrKSAoY2FyIGxzdCkKICAgICAgKGxpc3QtcmVmIChjZHIgbHN0KSAoLSBrIDEpKSkpCgooZGVmaW5lIChsaXN0LXRhaWwgbHN0IGspCiAgKGlmICh6ZXJvPyBrKSBsc3QKICAgICAgKGxpc3QtdGFpbCAoY2RyIGxzdCkgKC0gayAxKSkpKQoKOzs7IEFzc29jaWF0aW9uIGxpc3RzIGFuZCBtZW1iZXJzCihkZWZpbmUgKG1lbXEgb2JqIGxzdCkKICAoY29uZCAoKG51bGw/IGxzdCkgI2YpCiAgICAgICAgKChlcT8gb2JqIChjYXIgbHN0KSkgbHN0KQogICAgICAgIChlbHNlIChtZW1xIG9iaiAoY2RyIGxzdCkpKSkpCgooZGVmaW5lIChtZW1iZXIgb2JqIGxzdCkKICAoY29uZCAoKG51bGw/IGxzdCkgI2YpCiAgICAgICAgKChlcXVhbD8gb2JqIChjYXIgbHN0KSkgbHN0KQogICAgICAgIChlbHNlIChtZW1iZXIgb2JqIChjZHIgbHN0KSkpKSkKCihkZWZpbmUgKGFzc3Egb2JqIGFsaXN0KQogIChjb25kICgobnVsbD8gYWxpc3QpICNmKQogICAgICAgICgoZXE/IG9iaiAoY2FyIChjYXIgYWxpc3QpKSkgKGNhciBhbGlzdCkpCiAgICAgICAgKGVsc2UgKGFzc3Egb2JqIChjZHIgYWxpc3QpKSkpKQoKKGRlZmluZSAoYXNzb2Mgb2JqIGFsaXN0KQogIChjb25kICgobnVsbD8gYWxpc3QpICNmKQogICAgICAgICgoZXF1YWw/IG9iaiAoY2FyIChjYXIgYWxpc3QpKSkgKGNhciBhbGlzdCkpCiAgICAgICAgKGVsc2UgKGFzc29jIG9iaiAoY2RyIGFsaXN0KSkpKSkKCihkZWZpbmUgKGFzc3Ygb2JqIGFsaXN0KQogIChjb25kICgobnVsbD8gYWxpc3QpICNmKQogICAgICAgICgoZXF2PyBvYmogKGNhciAoY2FyIGFsaXN0KSkpIChjYXIgYWxpc3QpKQogICAgICAgIChlbHNlIChhc3N2IG9iaiAoY2RyIGFsaXN0KSkpKSkKCjs7OyBOdW1lcmljIHByZWRpY2F0ZXMgYW5kIGZ1bmN0aW9ucwooZGVmaW5lIChwb3NpdGl2ZT8geCkgKD4geCAwKSkKKGRlZmluZSAobmVnYXRpdmU/IHgpICg8IHggMCkpCihkZWZpbmUgKG9kZD8geCkgKG5vdCAoZXZlbj8geCkpKQooZGVmaW5lIChldmVuPyB4KSAoPSAocmVtYWluZGVyIHggMikgMCkpCgooZGVmaW5lIChhYnMgeCkgKGlmICg8IHggMCkgKC0geCkgeCkpCgooZGVmaW5lIChtYXggeCAuIHJlc3QpCiAgKGxldCBsb29wICgobSB4KSAociByZXN0KSkKICAgIChpZiAobnVsbD8gcikgbQogICAgICAgIChsb29wIChpZiAoPiAoY2FyIHIpIG0pIChjYXIgcikgbSkgKGNkciByKSkpKSkKCihkZWZpbmUgKG1pbiB4IC4gcmVzdCkKICAobGV0IGxvb3AgKChtIHgpIChyIHJlc3QpKQogICAgKGlmIChudWxsPyByKSBtCiAgICAgICAgKGxvb3AgKGlmICg8IChjYXIgcikgbSkgKGNhciByKSBtKSAoY2RyIHIpKSkpKQoKOzs7IEVxdWFsaXRpZXMKKGRlZmluZSAoZXE/IGEgYikgKGVxdj8gYSBiKSkKCihkZWZpbmUgKGVxdWFsPyBhIGIpCiAgKGNvbmQgKChlcXY/IGEgYikgI3QpCiAgICAgICAgKChhbmQgKHBhaXI/IGEpIChwYWlyPyBiKSkKICAgICAgICAgKGFuZCAoZXF1YWw/IChjYXIgYSkgKGNhciBiKSkgKGVxdWFsPyAoY2RyIGEpIChjZHIgYikpKSkKICAgICAgICAoKGFuZCAoc3RyaW5nPyBhKSAoc3RyaW5nPyBiKSkKICAgICAgICAgKHN0cmluZz0/IGEgYikpCiAgICAgICAgKChhbmQgKHZlY3Rvcj8gYSkgKHZlY3Rvcj8gYikpCiAgICAgICAgIChsZXQgKChsZW4gKHZlY3Rvci1sZW5ndGggYSkpKQogICAgICAgICAgIChhbmQgKD0gbGVuICh2ZWN0b3ItbGVuZ3RoIGIpKQogICAgICAgICAgICAgICAgKGxldCBsb29wICgoaSAwKSkKICAgICAgICAgICAgICAgICAgKGlmICg9IGkgbGVuKSAjdAogICAgICAgICAgICAgICAgICAgICAgKGFuZCAoZXF1YWw/ICh2ZWN0b3ItcmVmIGEgaSkgKHZlY3Rvci1yZWYgYiBpKSkKICAgICAgICAgICAgICAgICAgICAgICAgICAgKGxvb3AgKCsgaSAxKSkpKSkpKSkKICAgICAgICAoZWxzZSAjZikpKQoKOzs7IENoYXJhY3RlciBwcm9jZWR1cmVzCihkZWZpbmUgKGNoYXI9PyBhIGIpIChlcXY/IGEgYikpCihkZWZpbmUgKGNoYXI8PyBhIGIpICg8IChjaGFyLT5pbnRlZ2VyIGEpIChjaGFyLT5pbnRlZ2VyIGIpKSkKKGRlZmluZSAoY2hhcj4/IGEgYikgKD4gKGNoYXItPmludGVnZXIgYSkgKGNoYXItPmludGVnZXIgYikpKQooZGVmaW5lIChjaGFyPD0/IGEgYikgKDw9IChjaGFyLT5pbnRlZ2VyIGEpIChjaGFyLT5pbnRlZ2VyIGIpKSkKKGRlZmluZSAoY2hhcj49PyBhIGIpICg+PSAoY2hhci0+aW50ZWdlciBhKSAoY2hhci0+aW50ZWdlciBiKSkpCgooZGVmaW5lIChjaGFyLWNpPT8gYSBiKSAoY2hhcj0/IChjaGFyLWRvd25jYXNlIGEpIChjaGFyLWRvd25jYXNlIGIpKSkKKGRlZmluZSAoY2hhci1jaTw/IGEgYikgKGNoYXI8PyAoY2hhci1kb3duY2FzZSBhKSAoY2hhci1kb3duY2FzZSBiKSkpCihkZWZpbmUgKGNoYXItY2k+PyBhIGIpIChjaGFyPj8gKGNoYXItZG93bmNhc2UgYSkgKGNoYXItZG93bmNhc2UgYikpKQooZGVmaW5lIChjaGFyLWNpPD0/IGEgYikgKGNoYXI8PT8gKGNoYXItZG93bmNhc2UgYSkgKGNoYXItZG93bmNhc2UgYikpKQooZGVmaW5lIChjaGFyLWNpPj0/IGEgYikgKGNoYXI+PT8gKGNoYXItZG93bmNhc2UgYSkgKGNoYXItZG93bmNhc2UgYikpKQoKOzs7IFN0cmluZyBwcm9jZWR1cmVzCihkZWZpbmUgKHN0cmluZz0/IGEgYikKICAobGV0ICgobGVuIChzdHJpbmctbGVuZ3RoIGEpKSkKICAgIChhbmQgKD0gbGVuIChzdHJpbmctbGVuZ3RoIGIpKQogICAgICAgICAobGV0IGxvb3AgKChpIDApKQogICAgICAgICAgIChpZiAoPSBpIGxlbikgI3QKICAgICAgICAgICAgICAgKGFuZCAoY2hhcj0/IChzdHJpbmctcmVmIGEgaSkgKHN0cmluZy1yZWYgYiBpKSkKICAgICAgICAgICAgICAgICAgICAobG9vcCAoKyBpIDEpKSkpKSkpKQoKKGRlZmluZSAoc3RyaW5nLWNpPT8gYSBiKQogIChsZXQgKChsZW4gKHN0cmluZy1sZW5ndGggYSkpKQogICAgKGFuZCAoPSBsZW4gKHN0cmluZy1sZW5ndGggYikpCiAgICAgICAgIChsZXQgbG9vcCAoKGkgMCkpCiAgICAgICAgICAgKGlmICg9IGkgbGVuKSAjdAogICAgICAgICAgICAgICAoYW5kIChjaGFyLWNpPT8gKHN0cmluZy1yZWYgYSBpKSAoc3RyaW5nLXJlZiBiIGkpKQogICAgICAgICAgICAgICAgICAgIChsb29wICgrIGkgMSkpKSkpKSkpCgooZGVmaW5lIChzdHJpbmc8PyBhIGIpCiAgKGxldCAoKGxlbjEgKHN0cmluZy1sZW5ndGggYSkpCiAgICAgICAgKGxlbjIgKHN0cmluZy1sZW5ndGggYikpKQogICAgKGxldCBsb29wICgoaSAwKSkKICAgICAgKGNvbmQgKCg9IGkgbGVuMSkgKDwgaSBsZW4yKSkKICAgICAgICAgICAgKCg9IGkgbGVuMikgI2YpCiAgICAgICAgICAgICgoY2hhcj0/IChzdHJpbmctcmVmIGEgaSkgKHN0cmluZy1yZWYgYiBpKSkgKGxvb3AgKCsgaSAxKSkpCiAgICAgICAgICAgIChlbHNlIChjaGFyPD8gKHN0cmluZy1yZWYgYSBpKSAoc3RyaW5nLXJlZiBiIGkpKSkpKSkpCgooZGVmaW5lIChzdHJpbmctY2k8PyBhIGIpCiAgKGxldCAoKGxlbjEgKHN0cmluZy1sZW5ndGggYSkpCiAgICAgICAgKGxlbjIgKHN0cmluZy1sZW5ndGggYikpKQogICAgKGxldCBsb29wICgoaSAwKSkKICAgICAgKGNvbmQgKCg9IGkgbGVuMSkgKDwgaSBsZW4yKSkKICAgICAgICAgICAgKCg9IGkgbGVuMikgI2YpCiAgICAgICAgICAgICgoY2hhci1jaT0/IChzdHJpbmctcmVmIGEgaSkgKHN0cmluZy1yZWYgYiBpKSkgKGxvb3AgKCsgaSAxKSkpCiAgICAgICAgICAgIChlbHNlIChjaGFyLWNpPD8gKHN0cmluZy1yZWYgYSBpKSAoc3RyaW5nLXJlZiBiIGkpKSkpKSkpCgooZGVmaW5lIChzdHJpbmc+PyBhIGIpIChzdHJpbmc8PyBiIGEpKQooZGVmaW5lIChzdHJpbmc8PT8gYSBiKSAobm90IChzdHJpbmc+PyBhIGIpKSkKKGRlZmluZSAoc3RyaW5nPj0/IGEgYikgKG5vdCAoc3RyaW5nPD8gYSBiKSkpCgooZGVmaW5lIChzdHJpbmctY2k+PyBhIGIpIChzdHJpbmctY2k8PyBiIGEpKQooZGVmaW5lIChzdHJpbmctY2k8PT8gYSBiKSAobm90IChzdHJpbmctY2k+PyBhIGIpKSkKKGRlZmluZSAoc3RyaW5nLWNpPj0/IGEgYikgKG5vdCAoc3RyaW5nLWNpPD8gYSBiKSkpCgooZGVmaW5lIChzdHJpbmctYXBwZW5kIC4gc3RyaW5ncykKICAobGV0KiAoKHRvdGFsLWxlbiAoYXBwbHkgKyAobWFwIHN0cmluZy1sZW5ndGggc3RyaW5ncykpKQogICAgICAgICAobmV3LXN0ciAobWFrZS1zdHJpbmcgdG90YWwtbGVuKSkpCiAgICAobGV0IGxvb3AgKChzcyBzdHJpbmdzKSAocG9zIDApKQogICAgICAoaWYgKG51bGw/IHNzKSBuZXctc3RyCiAgICAgICAgICAobGV0KiAoKHMgKGNhciBzcykpCiAgICAgICAgICAgICAgICAgKGxlbiAoc3RyaW5nLWxlbmd0aCBzKSkpCiAgICAgICAgICAgIChsZXQgY29weSAoKGkgMCkpCiAgICAgICAgICAgICAgKGlmICg9IGkgbGVuKQogICAgICAgICAgICAgICAgICAobG9vcCAoY2RyIHNzKSAoKyBwb3MgbGVuKSkKICAgICAgICAgICAgICAgICAgKGJlZ2luIChzdHJpbmctc2V0ISBuZXctc3RyICgrIHBvcyBpKSAoc3RyaW5nLXJlZiBzIGkpKQogICAgICAgICAgICAgICAgICAgICAgICAgKGNvcHkgKCsgaSAxKSkpKSkpKSkpKQoKKGRlZmluZSAoc3Vic3RyaW5nIHMgc3RhcnQgZW5kKQogIChsZXQqICgobGVuICgtIGVuZCBzdGFydCkpCiAgICAgICAgIChuZXctc3RyIChtYWtlLXN0cmluZyBsZW4pKSkKICAgIChsZXQgbG9vcCAoKGkgMCkpCiAgICAgIChpZiAoPSBpIGxlbikgbmV3LXN0cgogICAgICAgICAgKGJlZ2luIChzdHJpbmctc2V0ISBuZXctc3RyIGkgKHN0cmluZy1yZWYgcyAoKyBzdGFydCBpKSkpCiAgICAgICAgICAgICAgICAgKGxvb3AgKCsgaSAxKSkpKSkpKQoKKGRlZmluZSAoc3RyaW5nLWNvcHkgcykgKHN1YnN0cmluZyBzIDAgKHN0cmluZy1sZW5ndGggcykpKQoKKGRlZmluZSAoc3RyaW5nLWZpbGwhIHMgYykKICAobGV0ICgobGVuIChzdHJpbmctbGVuZ3RoIHMpKSkKICAgIChsZXQgbG9vcCAoKGkgMCkpCiAgICAgIChpZiAoPSBpIGxlbikgcwogICAgICAgICAgKGJlZ2luIChzdHJpbmctc2V0ISBzIGkgYykKICAgICAgICAgICAgICAgICAobG9vcCAoKyBpIDEpKSkpKSkpCgo7OzsgVmVjdG9yIHByb2NlZHVyZXMKKGRlZmluZSAodmVjdG9yLWZpbGwhIHYgZmlsbCkKICAobGV0ICgobGVuICh2ZWN0b3ItbGVuZ3RoIHYpKSkKICAgIChsZXQgbG9vcCAoKGkgMCkpCiAgICAgIChpZiAoPSBpIGxlbikgdgogICAgICAgICAgKGJlZ2luICh2ZWN0b3Itc2V0ISB2IGkgZmlsbCkKICAgICAgICAgICAgICAgICAobG9vcCAoKyBpIDEpKSkpKSkpCgooZGVmaW5lICh2ZWN0b3ItPmxpc3QgdikKICAobGV0ICgobGVuICh2ZWN0b3ItbGVuZ3RoIHYpKSkKICAgIChsZXQgbG9vcCAoKGkgKC0gbGVuIDEpKSAocmVzICcoKSkpCiAgICAgIChpZiAoPCBpIDApIHJlcwogICAgICAgICAgKGxvb3AgKC0gaSAxKSAoY29ucyAodmVjdG9yLXJlZiB2IGkpIHJlcykpKSkpKQoKKGRlZmluZSAobGlzdC0+dmVjdG9yIGxzdCkKICAobGV0KiAoKGxlbiAobGVuZ3RoIGxzdCkpCiAgICAgICAgICh2IChtYWtlLXZlY3RvciBsZW4pKSkKICAgIChsZXQgbG9vcCAoKGwgbHN0KSAoaSAwKSkKICAgICAgKGlmIChudWxsPyBsKSB2CiAgICAgICAgICAoYmVnaW4gKHZlY3Rvci1zZXQhIHYgaSAoY2FyIGwpKQogICAgICAgICAgICAgICAgIChsb29wIChjZHIgbCkgKCsgaSAxKSkpKSkpKQoKKGRlZmluZSAoc3RyaW5nLT5saXN0IHMpCiAgKGxldCAoKGxlbiAoc3RyaW5nLWxlbmd0aCBzKSkpCiAgICAobGV0IGxvb3AgKChpICgtIGxlbiAxKSkgKHJlcyAnKCkpKQogICAgICAoaWYgKDwgaSAwKSByZXMKICAgICAgICAgIChsb29wICgtIGkgMSkgKGNvbnMgKHN0cmluZy1yZWYgcyBpKSByZXMpKSkpKSkKCihkZWZpbmUgKGxpc3QtPnN0cmluZyBsc3QpCiAgKGxldCogKChsZW4gKGxlbmd0aCBsc3QpKQogICAgICAgICAocyAobWFrZS1zdHJpbmcgbGVuKSkpCiAgICAobGV0IGxvb3AgKChsIGxzdCkgKGkgMCkpCiAgICAgIChpZiAobnVsbD8gbCkgcwogICAgICAgICAgKGJlZ2luIChzdHJpbmctc2V0ISBpIChjYXIgbCkpCiAgICAgICAgICAgICAgICAgKGxvb3AgKGNkciBsKSAoKyBpIDEpKSkpKSkpCgo7OzsgSGlnaGVyLW9yZGVyIGZ1bmN0aW9ucwooZGVmaW5lIChtYXAgcHJvYyBsaXN0MSAuIGxpc3RzKQogIChpZiAobnVsbD8gbGlzdHMpCiAgICAgIChsZXQgbG9vcCAoKGwgbGlzdDEpKQogICAgICAgIChpZiAobnVsbD8gbCkgJygpCiAgICAgICAgICAgIChjb25zIChwcm9jIChjYXIgbCkpIChsb29wIChjZHIgbCkpKSkpCiAgICAgIChsZXQgbG9vcCAoKGxzIChjb25zIGxpc3QxIGxpc3RzKSkpCiAgICAgICAgKGlmIChudWxsPyAoY2FyIGxzKSkgJygpCiAgICAgICAgICAgIChjb25zIChhcHBseSBwcm9jIChsZXQgbWFwLWNhciAoKGwgbHMpKQogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChpZiAobnVsbD8gbCkgJygpCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChjb25zIChjYXIgKGNhciBsKSkgKG1hcC1jYXIgKGNkciBsKSkpKSkpCiAgICAgICAgICAgICAgICAgIChsb29wIChsZXQgbWFwLWNkciAoKGwgbHMpKQogICAgICAgICAgICAgICAgICAgICAgICAgIChpZiAobnVsbD8gbCkgJygpCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChjb25zIChjZHIgKGNhciBsKSkgKG1hcC1jZHIgKGNkciBsKSkpKSkpKSkpKSkKCihkZWZpbmUgKGZvci1lYWNoIHByb2MgbGlzdDEgLiBsaXN0cykKICAoaWYgKG51bGw/IGxpc3RzKQogICAgICAobGV0IGxvb3AgKChsIGxpc3QxKSkKICAgICAgICAoaWYgKG51bGw/IGwpICN0CiAgICAgICAgICAgIChiZWdpbiAocHJvYyAoY2FyIGwpKSAobG9vcCAoY2RyIGwpKSkpKQogICAgICAobGV0IGxvb3AgKChscyAoY29ucyBsaXN0MSBsaXN0cykpKQogICAgICAgIChpZiAobnVsbD8gKGNhciBscykpICN0CiAgICAgICAgICAgIChiZWdpbiAoYXBwbHkgcHJvYyAobGV0IG1hcC1jYXIgKChsIGxzKSkKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGlmIChudWxsPyBsKSAnKCkKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChjb25zIChjYXIgKGNhciBsKSkgKG1hcC1jYXIgKGNkciBsKSkpKSkpCiAgICAgICAgICAgICAgICAgICAobG9vcCAobGV0IG1hcC1jZHIgKChsIGxzKSkKICAgICAgICAgICAgICAgICAgICAgICAgICAgKGlmIChudWxsPyBsKSAnKCkKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChjb25zIChjZHIgKGNhciBsKSkgKG1hcC1jZHIgKGNkciBsKSkpKSkpKSkpKSkKEAkAAJskAAAdCQAAAAAAAAgwAACgMAAA0XSeAFedvSqAcFIP//8+JwoAAABkAAAA6AMAABAnAACghgEAQEIPAICWmAAA4fUFGAAAADUAAABxAAAAa////877//+Sv///AAAAAAAAAAAZAAoAGRkZAAAAAAUAAAAAAAAJAAAAAAsAAAAAAAAAABkAEQoZGRkDCgcAAQAJCxgAAAkGCwAACwAGGQAAABkZGQAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAZAAoNGRkZAA0AAAIACQ4AAAAJAA4AAA4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAEwAAAAATAAAAAAkMAAAAAAAMAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAA8AAAAEDwAAAAAJEAAAAAAAEAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASAAAAAAAAAAAAAAARAAAAABEAAAAACRIAAAAAABIAABIAABoAAAAaGhoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGgAAABoaGgAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAABcAAAAAFwAAAAAJFAAAAAAAFAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWAAAAAAAAAAAAAAAVAAAAABUAAAAACRYAAAAAABYAABYAADAxMjM0NTY3ODlBQkNERUYAQYDgAAu4AmwxAgAAAAAABQAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgAAAD0AAACEMgIAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAP//////////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACDAAAAAAAAAFAAAAAAAAAAAAAABEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AAAARQAAAJgyAgAABAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAA/////woAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgMAAAEDlSAA==';
  if (!isDataURI(wasmBinaryFile)) {
    wasmBinaryFile = locateFile(wasmBinaryFile);
  }

function getBinary(file) {
  try {
    if (file == wasmBinaryFile && wasmBinary) {
      return new Uint8Array(wasmBinary);
    }
    var binary = tryParseAsDataURI(file);
    if (binary) {
      return binary;
    }
    if (readBinary) {
      return readBinary(file);
    } else {
      throw "both async and sync fetching of the wasm failed";
    }
  }
  catch (err) {
    abort(err);
  }
}

function getBinaryPromise() {
  // If we don't have the binary yet, try to to load it asynchronously.
  // Fetch has some additional restrictions over XHR, like it can't be used on a file:// url.
  // See https://github.com/github/fetch/pull/92#issuecomment-140665932
  // Cordova or Electron apps are typically loaded from a file:// url.
  // So use fetch if it is available and the url is not a file, otherwise fall back to XHR.
  if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
    if (typeof fetch == 'function'
      && !isFileURI(wasmBinaryFile)
    ) {
      return fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function(response) {
        if (!response['ok']) {
          throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
        }
        return response['arrayBuffer']();
      }).catch(function () {
          return getBinary(wasmBinaryFile);
      });
    }
    else {
      if (readAsync) {
        // fetch is not available or url is file => try XHR (readAsync uses XHR internally)
        return new Promise(function(resolve, reject) {
          readAsync(wasmBinaryFile, function(response) { resolve(new Uint8Array(/** @type{!ArrayBuffer} */(response))) }, reject)
        });
      }
    }
  }

  // Otherwise, getBinary should be able to get it synchronously
  return Promise.resolve().then(function() { return getBinary(wasmBinaryFile); });
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
function createWasm() {
  // prepare imports
  var info = {
    'env': asmLibraryArg,
    'wasi_snapshot_preview1': asmLibraryArg,
  };
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  /** @param {WebAssembly.Module=} module*/
  function receiveInstance(instance, module) {
    var exports = instance.exports;

    Module['asm'] = exports;

    wasmMemory = Module['asm']['memory'];
    assert(wasmMemory, "memory not found in wasm exports");
    // This assertion doesn't hold when emscripten is run in --post-link
    // mode.
    // TODO(sbc): Read INITIAL_MEMORY out of the wasm file in post-link mode.
    //assert(wasmMemory.buffer.byteLength === 16777216);
    updateGlobalBufferAndViews(wasmMemory.buffer);

    wasmTable = Module['asm']['__indirect_function_table'];
    assert(wasmTable, "table not found in wasm exports");

    addOnInit(Module['asm']['__wasm_call_ctors']);

    removeRunDependency('wasm-instantiate');
  }
  // we can't run yet (except in a pthread, where we have a custom sync instantiator)
  addRunDependency('wasm-instantiate');

  // Prefer streaming instantiation if available.
  // Async compilation can be confusing when an error on the page overwrites Module
  // (for example, if the order of elements is wrong, and the one defining Module is
  // later), so we save Module and check it later.
  var trueModule = Module;
  function receiveInstantiationResult(result) {
    // 'result' is a ResultObject object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    assert(Module === trueModule, 'the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?');
    trueModule = null;
    // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
    // When the regression is fixed, can restore the above USE_PTHREADS-enabled path.
    receiveInstance(result['instance']);
  }

  function instantiateArrayBuffer(receiver) {
    return getBinaryPromise().then(function(binary) {
      return WebAssembly.instantiate(binary, info);
    }).then(function (instance) {
      return instance;
    }).then(receiver, function(reason) {
      err('failed to asynchronously prepare wasm: ' + reason);

      // Warn on some common problems.
      if (isFileURI(wasmBinaryFile)) {
        err('warning: Loading from a file URI (' + wasmBinaryFile + ') is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing');
      }
      abort(reason);
    });
  }

  function instantiateAsync() {
    if (!wasmBinary &&
        typeof WebAssembly.instantiateStreaming == 'function' &&
        !isDataURI(wasmBinaryFile) &&
        // Don't use streaming for file:// delivered objects in a webview, fetch them synchronously.
        !isFileURI(wasmBinaryFile) &&
        typeof fetch == 'function') {
      return fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function (response) {
        // Suppress closure warning here since the upstream definition for
        // instantiateStreaming only allows Promise<Repsponse> rather than
        // an actual Response.
        // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure is fixed.
        /** @suppress {checkTypes} */
        var result = WebAssembly.instantiateStreaming(response, info);

        return result.then(
          receiveInstantiationResult,
          function(reason) {
            // We expect the most common failure cause to be a bad MIME type for the binary,
            // in which case falling back to ArrayBuffer instantiation should work.
            err('wasm streaming compile failed: ' + reason);
            err('falling back to ArrayBuffer instantiation');
            return instantiateArrayBuffer(receiveInstantiationResult);
          });
      });
    } else {
      return instantiateArrayBuffer(receiveInstantiationResult);
    }
  }

  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to run the instantiation parallel
  // to any other async startup actions they are performing.
  if (Module['instantiateWasm']) {
    try {
      var exports = Module['instantiateWasm'](info, receiveInstance);
      return exports;
    } catch(e) {
      err('Module.instantiateWasm callback failed with error: ' + e);
      return false;
    }
  }

  instantiateAsync();
  return {}; // no exports yet; we'll fill them in later
}

// Globals used by JS i64 conversions (see makeSetValue)
var tempDouble;
var tempI64;

// === Body ===

var ASM_CONSTS = {
  
};






  function callRuntimeCallbacks(callbacks) {
      while (callbacks.length > 0) {
        var callback = callbacks.shift();
        if (typeof callback == 'function') {
          callback(Module); // Pass the module as the first argument.
          continue;
        }
        var func = callback.func;
        if (typeof func == 'number') {
          if (callback.arg === undefined) {
            getWasmTableEntry(func)();
          } else {
            getWasmTableEntry(func)(callback.arg);
          }
        } else {
          func(callback.arg === undefined ? null : callback.arg);
        }
      }
    }

  function withStackSave(f) {
      var stack = stackSave();
      var ret = f();
      stackRestore(stack);
      return ret;
    }
  function demangle(func) {
      warnOnce('warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
      return func;
    }

  function demangleAll(text) {
      var regex =
        /\b_Z[\w\d_]+/g;
      return text.replace(regex,
        function(x) {
          var y = demangle(x);
          return x === y ? x : (y + ' [' + x + ']');
        });
    }

  var wasmTableMirror = [];
  function getWasmTableEntry(funcPtr) {
      var func = wasmTableMirror[funcPtr];
      if (!func) {
        if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
        wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
      }
      assert(wasmTable.get(funcPtr) == func, "JavaScript-side Wasm function table mirror is out of date!");
      return func;
    }

  function handleException(e) {
      // Certain exception types we do not treat as errors since they are used for
      // internal control flow.
      // 1. ExitStatus, which is thrown by exit()
      // 2. "unwind", which is thrown by emscripten_unwind_to_js_event_loop() and others
      //    that wish to return to JS event loop.
      if (e instanceof ExitStatus || e == 'unwind') {
        return EXITSTATUS;
      }
      quit_(1, e);
    }

  function jsStackTrace() {
      var error = new Error();
      if (!error.stack) {
        // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
        // so try that as a special-case.
        try {
          throw new Error();
        } catch(e) {
          error = e;
        }
        if (!error.stack) {
          return '(no stack trace available)';
        }
      }
      return error.stack.toString();
    }

  function setWasmTableEntry(idx, func) {
      wasmTable.set(idx, func);
      wasmTableMirror[idx] = func;
    }

  function stackTrace() {
      var js = jsStackTrace();
      if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
      return demangleAll(js);
    }

  function setErrNo(value) {
      HEAP32[((___errno_location())>>2)] = value;
      return value;
    }
  
  var PATH = {splitPath:function(filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function(parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up; up--) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function(path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function(path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function(path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        path = PATH.normalize(path);
        path = path.replace(/\/$/, "");
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function(path) {
        return PATH.splitPath(path)[3];
      },join:function() {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function(l, r) {
        return PATH.normalize(l + '/' + r);
      }};
  
  function getRandomDevice() {
      if (typeof crypto == 'object' && typeof crypto['getRandomValues'] == 'function') {
        // for modern web browsers
        var randomBuffer = new Uint8Array(1);
        return function() { crypto.getRandomValues(randomBuffer); return randomBuffer[0]; };
      } else
      if (ENVIRONMENT_IS_NODE) {
        // for nodejs with or without crypto support included
        try {
          var crypto_module = require('crypto');
          // nodejs has crypto support
          return function() { return crypto_module['randomBytes'](1)[0]; };
        } catch (e) {
          // nodejs doesn't have crypto support
        }
      }
      // we couldn't find a proper implementation, as Math.random() is not suitable for /dev/random, see emscripten-core/emscripten/pull/7096
      return function() { abort("no cryptographic support found for randomDevice. consider polyfilling it if you want to use something insecure like Math.random(), e.g. put this in a --pre-js: var crypto = { getRandomValues: function(array) { for (var i = 0; i < array.length; i++) array[i] = (Math.random()*256)|0 } };"); };
    }
  
  var PATH_FS = {resolve:function() {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path != 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            return ''; // an invalid portion invalidates the whole thing
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function(from, to) {
        from = PATH_FS.resolve(from).substr(1);
        to = PATH_FS.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  var TTY = {ttys:[],init:function () {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function() {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function(dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function(stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(43);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function(stream) {
          // flush any pending line data
          stream.tty.ops.flush(stream.tty);
        },flush:function(stream) {
          stream.tty.ops.flush(stream.tty);
        },read:function(stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(60);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(29);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(6);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function(stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(60);
          }
          try {
            for (var i = 0; i < length; i++) {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            }
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function(tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              // we will read data by chunks of BUFSIZE
              var BUFSIZE = 256;
              var buf = Buffer.alloc(BUFSIZE);
              var bytesRead = 0;
  
              try {
                bytesRead = fs.readSync(process.stdin.fd, buf, 0, BUFSIZE, -1);
              } catch(e) {
                // Cross-platform differences: on Windows, reading EOF throws an exception, but on other OSes,
                // reading EOF returns 0. Uniformize behavior by treating the EOF exception to return 0.
                if (e.toString().includes('EOF')) bytesRead = 0;
                else throw e;
              }
  
              if (bytesRead > 0) {
                result = buf.slice(0, bytesRead).toString('utf-8');
              } else {
                result = null;
              }
            } else
            if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function(tty, val) {
          if (val === null || val === 10) {
            out(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val); // val == 0 would cut text output off in the middle.
          }
        },flush:function(tty) {
          if (tty.output && tty.output.length > 0) {
            out(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }},default_tty1_ops:{put_char:function(tty, val) {
          if (val === null || val === 10) {
            err(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },flush:function(tty) {
          if (tty.output && tty.output.length > 0) {
            err(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }}};
  
  function zeroMemory(address, size) {
      HEAPU8.fill(0, address, address + size);
    }
  
  function alignMemory(size, alignment) {
      assert(alignment, "alignment argument is required");
      return Math.ceil(size / alignment) * alignment;
    }
  function mmapAlloc(size) {
      abort('internal error: mmapAlloc called but `emscripten_builtin_memalign` native symbol not exported');
    }
  var MEMFS = {ops_table:null,mount:function(mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(63);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap,
                msync: MEMFS.stream_ops.msync
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            }
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.usedBytes = 0; // The actual number of bytes used in the typed array, as opposed to contents.length which gives the whole capacity.
          // When the byte data of the file is populated, this will point to either a typed array, or a normal JS array. Typed arrays are preferred
          // for performance, and used by default. However, typed arrays are not resizable like normal JS arrays are, so there is a small disk size
          // penalty involved for appending file writes that continuously grow a file similar to std::vector capacity vs used -scheme.
          node.contents = null; 
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
          parent.timestamp = node.timestamp;
        }
        return node;
      },getFileDataAsTypedArray:function(node) {
        if (!node.contents) return new Uint8Array(0);
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
        return new Uint8Array(node.contents);
      },expandFileStorage:function(node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
        // Don't expand strictly to the given requested limit if it's only a very small increase, but instead geometrically grow capacity.
        // For small filesizes (<1MB), perform size*2 geometric increase, but for large sizes, do a much more conservative size*1.125 increase to
        // avoid overshooting the allocation cap by a very large margin.
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) >>> 0);
        if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity); // Allocate new storage.
        if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0); // Copy old data over to the new storage.
      },resizeFileStorage:function(node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
          node.contents = null; // Fully decommit when requesting a resize to zero.
          node.usedBytes = 0;
        } else {
          var oldContents = node.contents;
          node.contents = new Uint8Array(newSize); // Allocate new storage.
          if (oldContents) {
            node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
          }
          node.usedBytes = newSize;
        }
      },node_ops:{getattr:function(node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function(node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },lookup:function(parent, name) {
          throw FS.genericErrors[44];
        },mknod:function(parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function(old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(55);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.parent.timestamp = Date.now()
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          new_dir.timestamp = old_node.parent.timestamp;
          old_node.parent = new_dir;
        },unlink:function(parent, name) {
          delete parent.contents[name];
          parent.timestamp = Date.now();
        },rmdir:function(parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(55);
          }
          delete parent.contents[name];
          parent.timestamp = Date.now();
        },readdir:function(node) {
          var entries = ['.', '..'];
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function(parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function(node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(28);
          }
          return node.link;
        }},stream_ops:{read:function(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else {
            for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
          }
          return size;
        },write:function(stream, buffer, offset, length, position, canOwn) {
          // The data buffer should be a typed array view
          assert(!(buffer instanceof ArrayBuffer));
  
          if (!length) return 0;
          var node = stream.node;
          node.timestamp = Date.now();
  
          if (buffer.subarray && (!node.contents || node.contents.subarray)) { // This write is from a typed array to a typed array?
            if (canOwn) {
              assert(position === 0, 'canOwn must imply no weird position inside the file');
              node.contents = buffer.subarray(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (node.usedBytes === 0 && position === 0) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
              node.contents = buffer.slice(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (position + length <= node.usedBytes) { // Writing to an already allocated and used subrange of the file?
              node.contents.set(buffer.subarray(offset, offset + length), position);
              return length;
            }
          }
  
          // Appending to an existing file and we need to reallocate, or source data did not come as a typed array.
          MEMFS.expandFileStorage(node, position+length);
          if (node.contents.subarray && buffer.subarray) {
            // Use typed array write which is available.
            node.contents.set(buffer.subarray(offset, offset + length), position);
          } else {
            for (var i = 0; i < length; i++) {
             node.contents[position + i] = buffer[offset + i]; // Or fall back to manual write if not.
            }
          }
          node.usedBytes = Math.max(node.usedBytes, position + length);
          return length;
        },llseek:function(stream, offset, whence) {
          var position = offset;
          if (whence === 1) {
            position += stream.position;
          } else if (whence === 2) {
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(28);
          }
          return position;
        },allocate:function(stream, offset, length) {
          MEMFS.expandFileStorage(stream.node, offset + length);
          stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        },mmap:function(stream, address, length, position, prot, flags) {
          if (address !== 0) {
            // We don't currently support location hints for the address of the mapping
            throw new FS.ErrnoError(28);
          }
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if (!(flags & 2) && contents.buffer === buffer) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = mmapAlloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(48);
            }
            HEAP8.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        },msync:function(stream, buffer, offset, length, mmapFlags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          if (mmapFlags & 2) {
            // MAP_PRIVATE calls need not to be synced back to underlying fs
            return 0;
          }
  
          var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
          // should we check if bytesWritten and length are the same?
          return 0;
        }}};
  
  /** @param {boolean=} noRunDep */
  function asyncLoad(url, onload, onerror, noRunDep) {
      var dep = !noRunDep ? getUniqueRunDependency('al ' + url) : '';
      readAsync(url, function(arrayBuffer) {
        assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
        onload(new Uint8Array(arrayBuffer));
        if (dep) removeRunDependency(dep);
      }, function(event) {
        if (onerror) {
          onerror();
        } else {
          throw 'Loading data file "' + url + '" failed.';
        }
      });
      if (dep) addRunDependency(dep);
    }
  
  var ERRNO_MESSAGES = {0:"Success",1:"Arg list too long",2:"Permission denied",3:"Address already in use",4:"Address not available",5:"Address family not supported by protocol family",6:"No more processes",7:"Socket already connected",8:"Bad file number",9:"Trying to read unreadable message",10:"Mount device busy",11:"Operation canceled",12:"No children",13:"Connection aborted",14:"Connection refused",15:"Connection reset by peer",16:"File locking deadlock error",17:"Destination address required",18:"Math arg out of domain of func",19:"Quota exceeded",20:"File exists",21:"Bad address",22:"File too large",23:"Host is unreachable",24:"Identifier removed",25:"Illegal byte sequence",26:"Connection already in progress",27:"Interrupted system call",28:"Invalid argument",29:"I/O error",30:"Socket is already connected",31:"Is a directory",32:"Too many symbolic links",33:"Too many open files",34:"Too many links",35:"Message too long",36:"Multihop attempted",37:"File or path name too long",38:"Network interface is not configured",39:"Connection reset by network",40:"Network is unreachable",41:"Too many open files in system",42:"No buffer space available",43:"No such device",44:"No such file or directory",45:"Exec format error",46:"No record locks available",47:"The link has been severed",48:"Not enough core",49:"No message of desired type",50:"Protocol not available",51:"No space left on device",52:"Function not implemented",53:"Socket is not connected",54:"Not a directory",55:"Directory not empty",56:"State not recoverable",57:"Socket operation on non-socket",59:"Not a typewriter",60:"No such device or address",61:"Value too large for defined data type",62:"Previous owner died",63:"Not super-user",64:"Broken pipe",65:"Protocol error",66:"Unknown protocol",67:"Protocol wrong type for socket",68:"Math result not representable",69:"Read only file system",70:"Illegal seek",71:"No such process",72:"Stale file handle",73:"Connection timed out",74:"Text file busy",75:"Cross-device link",100:"Device not a stream",101:"Bad font file fmt",102:"Invalid slot",103:"Invalid request code",104:"No anode",105:"Block device required",106:"Channel number out of range",107:"Level 3 halted",108:"Level 3 reset",109:"Link number out of range",110:"Protocol driver not attached",111:"No CSI structure available",112:"Level 2 halted",113:"Invalid exchange",114:"Invalid request descriptor",115:"Exchange full",116:"No data (for no delay io)",117:"Timer expired",118:"Out of streams resources",119:"Machine is not on the network",120:"Package not installed",121:"The object is remote",122:"Advertise error",123:"Srmount error",124:"Communication error on send",125:"Cross mount point (not really error)",126:"Given log. name not unique",127:"f.d. invalid for this operation",128:"Remote address changed",129:"Can   access a needed shared lib",130:"Accessing a corrupted shared lib",131:".lib section in a.out corrupted",132:"Attempting to link in too many libs",133:"Attempting to exec a shared library",135:"Streams pipe error",136:"Too many users",137:"Socket type not supported",138:"Not supported",139:"Protocol family not supported",140:"Can't send after socket shutdown",141:"Too many references",142:"Host is down",148:"No medium (in tape drive)",156:"Level 2 not synchronized"};
  
  var ERRNO_CODES = {};
  var FS = {root:null,mounts:[],devices:{},streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},filesystems:null,syncFSRequests:0,lookupPath:(path, opts = {}) => {
        path = PATH_FS.resolve(FS.cwd(), path);
  
        if (!path) return { path: '', node: null };
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(32);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter((p) => !!p), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
  
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(32);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:(node) => {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:(parentid, name) => {
        var hash = 0;
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:(node) => {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:(node) => {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:(parent, name) => {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
          throw new FS.ErrnoError(errCode, parent);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:(parent, name, mode, rdev) => {
        assert(typeof parent == 'object')
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:(node) => {
        FS.hashRemoveNode(node);
      },isRoot:(node) => {
        return node === node.parent;
      },isMountpoint:(node) => {
        return !!node.mounted;
      },isFile:(mode) => {
        return (mode & 61440) === 32768;
      },isDir:(mode) => {
        return (mode & 61440) === 16384;
      },isLink:(mode) => {
        return (mode & 61440) === 40960;
      },isChrdev:(mode) => {
        return (mode & 61440) === 8192;
      },isBlkdev:(mode) => {
        return (mode & 61440) === 24576;
      },isFIFO:(mode) => {
        return (mode & 61440) === 4096;
      },isSocket:(mode) => {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"r+":2,"w":577,"w+":578,"a":1089,"a+":1090},modeStringToFlags:(str) => {
        var flags = FS.flagModes[str];
        if (typeof flags == 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:(flag) => {
        var perms = ['r', 'w', 'rw'][flag & 3];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:(node, perms) => {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.includes('r') && !(node.mode & 292)) {
          return 2;
        } else if (perms.includes('w') && !(node.mode & 146)) {
          return 2;
        } else if (perms.includes('x') && !(node.mode & 73)) {
          return 2;
        }
        return 0;
      },mayLookup:(dir) => {
        var errCode = FS.nodePermissions(dir, 'x');
        if (errCode) return errCode;
        if (!dir.node_ops.lookup) return 2;
        return 0;
      },mayCreate:(dir, name) => {
        try {
          var node = FS.lookupNode(dir, name);
          return 20;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:(dir, name, isdir) => {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var errCode = FS.nodePermissions(dir, 'wx');
        if (errCode) {
          return errCode;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return 54;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return 10;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return 31;
          }
        }
        return 0;
      },mayOpen:(node, flags) => {
        if (!node) {
          return 44;
        }
        if (FS.isLink(node.mode)) {
          return 32;
        } else if (FS.isDir(node.mode)) {
          if (FS.flagsToPermissionString(flags) !== 'r' || // opening for write
              (flags & 512)) { // TODO: check for O_SEARCH? (== search for dir only)
            return 31;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:(fd_start = 0, fd_end = FS.MAX_OPEN_FDS) => {
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(33);
      },getStream:(fd) => FS.streams[fd],createStream:(stream, fd_start, fd_end) => {
        if (!FS.FSStream) {
          FS.FSStream = /** @constructor */ function(){};
          FS.FSStream.prototype = {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          };
        }
        // clone it, so we can return an instance of FSStream
        stream = Object.assign(new FS.FSStream(), stream);
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:(fd) => {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:(stream) => {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:() => {
          throw new FS.ErrnoError(70);
        }},major:(dev) => ((dev) >> 8),minor:(dev) => ((dev) & 0xff),makedev:(ma, mi) => ((ma) << 8 | (mi)),registerDevice:(dev, ops) => {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:(dev) => FS.devices[dev],getMounts:(mount) => {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:(populate, callback) => {
        if (typeof populate == 'function') {
          callback = populate;
          populate = false;
        }
  
        FS.syncFSRequests++;
  
        if (FS.syncFSRequests > 1) {
          err('warning: ' + FS.syncFSRequests + ' FS.syncfs operations in flight at once, probably just doing extra work');
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function doCallback(errCode) {
          assert(FS.syncFSRequests > 0);
          FS.syncFSRequests--;
          return callback(errCode);
        }
  
        function done(errCode) {
          if (errCode) {
            if (!done.errored) {
              done.errored = true;
              return doCallback(errCode);
            }
            return;
          }
          if (++completed >= mounts.length) {
            doCallback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach((mount) => {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:(type, opts, mountpoint) => {
        if (typeof type == 'string') {
          // The filesystem was not included, and instead we have an error
          // message stored in the variable.
          throw type;
        }
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(10);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:(mountpoint) => {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(28);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach((hash) => {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.includes(current.mount)) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },lookup:(parent, name) => {
        return parent.node_ops.lookup(parent, name);
      },mknod:(path, mode, dev) => {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === '.' || name === '..') {
          throw new FS.ErrnoError(28);
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:(path, mode) => {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:(path, mode) => {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdirTree:(path, mode) => {
        var dirs = path.split('/');
        var d = '';
        for (var i = 0; i < dirs.length; ++i) {
          if (!dirs[i]) continue;
          d += '/' + dirs[i];
          try {
            FS.mkdir(d, mode);
          } catch(e) {
            if (e.errno != 20) throw e;
          }
        }
      },mkdev:(path, mode, dev) => {
        if (typeof dev == 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:(oldpath, newpath) => {
        if (!PATH_FS.resolve(oldpath)) {
          throw new FS.ErrnoError(44);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:(old_path, new_path) => {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
  
        // let the errors from non existant directories percolate up
        lookup = FS.lookupPath(old_path, { parent: true });
        old_dir = lookup.node;
        lookup = FS.lookupPath(new_path, { parent: true });
        new_dir = lookup.node;
  
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(75);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(28);
        }
        // new path should not be an ancestor of the old path
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(55);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        errCode = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(10);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          errCode = FS.nodePermissions(old_dir, 'w');
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:(path) => {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:(path) => {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(54);
        }
        return node.node_ops.readdir(node);
      },unlink:(path) => {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
          // According to POSIX, we should map EISDIR to EPERM, but
          // we instead do what Linux does (and we must, as we use
          // the musl linux libc).
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:(path) => {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(44);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(28);
        }
        return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
      },stat:(path, dontFollow) => {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(63);
        }
        return node.node_ops.getattr(node);
      },lstat:(path) => {
        return FS.stat(path, true);
      },chmod:(path, mode, dontFollow) => {
        var node;
        if (typeof path == 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:(path, mode) => {
        FS.chmod(path, mode, true);
      },fchmod:(fd, mode) => {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        FS.chmod(stream.node, mode);
      },chown:(path, uid, gid, dontFollow) => {
        var node;
        if (typeof path == 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:(path, uid, gid) => {
        FS.chown(path, uid, gid, true);
      },fchown:(fd, uid, gid) => {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:(path, len) => {
        if (len < 0) {
          throw new FS.ErrnoError(28);
        }
        var node;
        if (typeof path == 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(28);
        }
        var errCode = FS.nodePermissions(node, 'w');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:(fd, len) => {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(28);
        }
        FS.truncate(stream.node, len);
      },utime:(path, atime, mtime) => {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:(path, flags, mode, fd_start, fd_end) => {
        if (path === "") {
          throw new FS.ErrnoError(44);
        }
        flags = typeof flags == 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode == 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path == 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        var created = false;
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(20);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // if asked only for a directory, then this must be one
        if ((flags & 65536) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(54);
        }
        // check permissions, if this is not a file we just created now (it is ok to
        // create and write to a file with read-only permissions; it is read-only
        // for later use)
        if (!created) {
          var errCode = FS.mayOpen(node, flags);
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512 | 131072);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
          }
        }
        return stream;
      },close:(stream) => {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (stream.getdents) stream.getdents = null; // free readdir state
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
        stream.fd = null;
      },isClosed:(stream) => {
        return stream.fd === null;
      },llseek:(stream, offset, whence) => {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(70);
        }
        if (whence != 0 && whence != 1 && whence != 2) {
          throw new FS.ErrnoError(28);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      },read:(stream, buffer, offset, length, position) => {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(28);
        }
        var seeking = typeof position != 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:(stream, buffer, offset, length, position, canOwn) => {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(28);
        }
        if (stream.seekable && stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var seeking = typeof position != 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:(stream, offset, length) => {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(28);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(43);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(138);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:(stream, address, length, position, prot, flags) => {
        // User requests writing to file (prot & PROT_WRITE != 0).
        // Checking if we have permissions to write to the file unless
        // MAP_PRIVATE flag is set. According to POSIX spec it is possible
        // to write to file opened in read-only mode with MAP_PRIVATE flag,
        // as all modifications will be visible only in the memory of
        // the current process.
        if ((prot & 2) !== 0
            && (flags & 2) === 0
            && (stream.flags & 2097155) !== 2) {
          throw new FS.ErrnoError(2);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(2);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(43);
        }
        return stream.stream_ops.mmap(stream, address, length, position, prot, flags);
      },msync:(stream, buffer, offset, length, mmapFlags) => {
        if (!stream || !stream.stream_ops.msync) {
          return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
      },munmap:(stream) => 0,ioctl:(stream, cmd, arg) => {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(59);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:(path, opts = {}) => {
        opts.flags = opts.flags || 0;
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = UTF8ArrayToString(buf, 0);
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:(path, data, opts = {}) => {
        opts.flags = opts.flags || 577;
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data == 'string') {
          var buf = new Uint8Array(lengthBytesUTF8(data)+1);
          var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
          FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
        } else if (ArrayBuffer.isView(data)) {
          FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
        } else {
          throw new Error('Unsupported data type');
        }
        FS.close(stream);
      },cwd:() => FS.currentPath,chdir:(path) => {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
          throw new FS.ErrnoError(44);
        }
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(54);
        }
        var errCode = FS.nodePermissions(lookup.node, 'x');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:() => {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
      },createDefaultDevices:() => {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: () => 0,
          write: (stream, buffer, offset, length, pos) => length,
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using err() rather than out()
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // setup /dev/[u]random
        var random_device = getRandomDevice();
        FS.createDevice('/dev', 'random', random_device);
        FS.createDevice('/dev', 'urandom', random_device);
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createSpecialDirectories:() => {
        // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the
        // name of the stream for fd 6 (see test_unistd_ttyname)
        FS.mkdir('/proc');
        var proc_self = FS.mkdir('/proc/self');
        FS.mkdir('/proc/self/fd');
        FS.mount({
          mount: () => {
            var node = FS.createNode(proc_self, 'fd', 16384 | 511 /* 0777 */, 73);
            node.node_ops = {
              lookup: (parent, name) => {
                var fd = +name;
                var stream = FS.getStream(fd);
                if (!stream) throw new FS.ErrnoError(8);
                var ret = {
                  parent: null,
                  mount: { mountpoint: 'fake' },
                  node_ops: { readlink: () => stream.path },
                };
                ret.parent = ret; // make it look like a simple root node
                return ret;
              }
            };
            return node;
          }
        }, {}, '/proc/self/fd');
      },createStandardStreams:() => {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 0);
        var stdout = FS.open('/dev/stdout', 1);
        var stderr = FS.open('/dev/stderr', 1);
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:() => {
        if (FS.ErrnoError) return;
        FS.ErrnoError = /** @this{Object} */ function ErrnoError(errno, node) {
          this.node = node;
          this.setErrno = /** @this{Object} */ function(errno) {
            this.errno = errno;
            for (var key in ERRNO_CODES) {
              if (ERRNO_CODES[key] === errno) {
                this.code = key;
                break;
              }
            }
          };
          this.setErrno(errno);
          this.message = ERRNO_MESSAGES[errno];
  
          // Try to get a maximally helpful stack trace. On Node.js, getting Error.stack
          // now ensures it shows what we want.
          if (this.stack) {
            // Define the stack property for Node.js 4, which otherwise errors on the next line.
            Object.defineProperty(this, "stack", { value: (new Error).stack, writable: true });
            this.stack = demangleAll(this.stack);
          }
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [44].forEach((code) => {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:() => {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
  
        FS.filesystems = {
          'MEMFS': MEMFS,
        };
      },init:(input, output, error) => {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:() => {
        FS.init.initialized = false;
        // Call musl-internal function to close all stdio streams, so nothing is
        // left in internal buffers.
        ___stdio_exit();
        // close all of our streams
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:(canRead, canWrite) => {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },findObject:(path, dontResolveLastLink) => {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          return null;
        }
      },analyzePath:(path, dontResolveLastLink) => {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createPath:(parent, path, canRead, canWrite) => {
        parent = typeof parent == 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:(parent, name, properties, canRead, canWrite) => {
        var path = PATH.join2(typeof parent == 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:(parent, name, data, canRead, canWrite, canOwn) => {
        var path = name;
        if (parent) {
          parent = typeof parent == 'string' ? parent : FS.getPath(parent);
          path = name ? PATH.join2(parent, name) : parent;
        }
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data == 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 577);
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:(parent, name, input, output) => {
        var path = PATH.join2(typeof parent == 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: (stream) => {
            stream.seekable = false;
          },
          close: (stream) => {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: (stream, buffer, offset, length, pos /* ignored */) => {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(6);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: (stream, buffer, offset, length, pos) => {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },forceLoadFile:(obj) => {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        if (typeof XMLHttpRequest != 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (read_) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(read_(obj.url), true);
            obj.usedBytes = obj.contents.length;
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
      },createLazyFile:(parent, name, url, canRead, canWrite) => {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        /** @constructor */
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = /** @this{Object} */ function LazyUint8Array_get(idx) {
          if (idx > this.length-1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = (idx / this.chunkSize)|0;
          return this.getter(chunkNum)[chunkOffset];
        };
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        };
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
  
          var chunkSize = 1024*1024; // Chunk size in bytes
  
          if (!hasByteServing) chunkSize = datalength;
  
          // Function to get a range from the remote URL.
          var doXHR = (from, to) => {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
            // Some hints to the browser that we want binary data.
            xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
  
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(/** @type{Array<number>} */(xhr.response || []));
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          };
          var lazyArray = this;
          lazyArray.setDataGetter((chunkNum) => {
            var start = chunkNum * chunkSize;
            var end = (chunkNum+1) * chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof lazyArray.chunks[chunkNum] == 'undefined') {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof lazyArray.chunks[chunkNum] == 'undefined') throw new Error('doXHR failed!');
            return lazyArray.chunks[chunkNum];
          });
  
          if (usesGzip || !datalength) {
            // if the server uses gzip or doesn't supply the length, we have to download the whole file to get the (uncompressed) length
            chunkSize = datalength = 1; // this will force getter(0)/doXHR do download the whole file
            datalength = this.getter(0).length;
            chunkSize = datalength;
            out("LazyFiles on gzip forces download of the whole file when length is accessed");
          }
  
          this._length = datalength;
          this._chunkSize = chunkSize;
          this.lengthKnown = true;
        };
        if (typeof XMLHttpRequest != 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          Object.defineProperties(lazyArray, {
            length: {
              get: /** @this{Object} */ function() {
                if (!this.lengthKnown) {
                  this.cacheLength();
                }
                return this._length;
              }
            },
            chunkSize: {
              get: /** @this{Object} */ function() {
                if (!this.lengthKnown) {
                  this.cacheLength();
                }
                return this._chunkSize;
              }
            }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // Add a function that defers querying the file size until it is asked the first time.
        Object.defineProperties(node, {
          usedBytes: {
            get: /** @this {FSNode} */ function() { return this.contents.length; }
          }
        });
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach((key) => {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            FS.forceLoadFile(node);
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = (stream, buffer, offset, length, position) => {
          FS.forceLoadFile(node);
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
        var dep = getUniqueRunDependency('cp ' + fullname); // might have several active requests for the same fullname
        function processData(byteArray) {
          function finish(byteArray) {
            if (preFinish) preFinish();
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency(dep);
          }
          if (Browser.handledByPreloadPlugin(byteArray, fullname, finish, () => {
            if (onerror) onerror();
            removeRunDependency(dep);
          })) {
            return;
          }
          finish(byteArray);
        }
        addRunDependency(dep);
        if (typeof url == 'string') {
          asyncLoad(url, (byteArray) => processData(byteArray), onerror);
        } else {
          processData(url);
        }
      },indexedDB:() => {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:() => {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:(paths, onload, onerror) => {
        onload = onload || (() => {});
        onerror = onerror || (() => {});
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = () => {
          out('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = () => {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach((path) => {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = () => { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = () => { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:(paths, onload, onerror) => {
        onload = onload || (() => {});
        onerror = onerror || (() => {});
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = () => {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach((path) => {
            var getRequest = files.get(path);
            getRequest.onsuccess = () => {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = () => { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },absolutePath:() => {
        abort('FS.absolutePath has been removed; use PATH_FS.resolve instead');
      },createFolder:() => {
        abort('FS.createFolder has been removed; use FS.mkdir instead');
      },createLink:() => {
        abort('FS.createLink has been removed; use FS.symlink instead');
      },joinPath:() => {
        abort('FS.joinPath has been removed; use PATH.join instead');
      },mmapAlloc:() => {
        abort('FS.mmapAlloc has been replaced by the top level function mmapAlloc');
      },standardizePath:() => {
        abort('FS.standardizePath has been removed; use PATH.normalize instead');
      }};
  var SYSCALLS = {DEFAULT_POLLMASK:5,calculateAt:function(dirfd, path, allowEmpty) {
        if (path[0] === '/') {
          return path;
        }
        // relative path
        var dir;
        if (dirfd === -100) {
          dir = FS.cwd();
        } else {
          var dirstream = FS.getStream(dirfd);
          if (!dirstream) throw new FS.ErrnoError(8);
          dir = dirstream.path;
        }
        if (path.length == 0) {
          if (!allowEmpty) {
            throw new FS.ErrnoError(44);;
          }
          return dir;
        }
        return PATH.join2(dir, path);
      },doStat:function(func, path, buf) {
        try {
          var stat = func(path);
        } catch (e) {
          if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
            // an error occurred while trying to look up the path; we should just report ENOTDIR
            return -54;
          }
          throw e;
        }
        HEAP32[((buf)>>2)] = stat.dev;
        HEAP32[(((buf)+(4))>>2)] = 0;
        HEAP32[(((buf)+(8))>>2)] = stat.ino;
        HEAP32[(((buf)+(12))>>2)] = stat.mode;
        HEAP32[(((buf)+(16))>>2)] = stat.nlink;
        HEAP32[(((buf)+(20))>>2)] = stat.uid;
        HEAP32[(((buf)+(24))>>2)] = stat.gid;
        HEAP32[(((buf)+(28))>>2)] = stat.rdev;
        HEAP32[(((buf)+(32))>>2)] = 0;
        (tempI64 = [stat.size>>>0,(tempDouble=stat.size,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((buf)+(40))>>2)] = tempI64[0],HEAP32[(((buf)+(44))>>2)] = tempI64[1]);
        HEAP32[(((buf)+(48))>>2)] = 4096;
        HEAP32[(((buf)+(52))>>2)] = stat.blocks;
        HEAP32[(((buf)+(56))>>2)] = (stat.atime.getTime() / 1000)|0;
        HEAP32[(((buf)+(60))>>2)] = 0;
        HEAP32[(((buf)+(64))>>2)] = (stat.mtime.getTime() / 1000)|0;
        HEAP32[(((buf)+(68))>>2)] = 0;
        HEAP32[(((buf)+(72))>>2)] = (stat.ctime.getTime() / 1000)|0;
        HEAP32[(((buf)+(76))>>2)] = 0;
        (tempI64 = [stat.ino>>>0,(tempDouble=stat.ino,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[(((buf)+(80))>>2)] = tempI64[0],HEAP32[(((buf)+(84))>>2)] = tempI64[1]);
        return 0;
      },doMsync:function(addr, stream, len, flags, offset) {
        var buffer = HEAPU8.slice(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags);
      },doMkdir:function(path, mode) {
        // remove a trailing slash, if one - /a/b/ has basename of '', but
        // we want to create b in the context of this function
        path = PATH.normalize(path);
        if (path[path.length-1] === '/') path = path.substr(0, path.length-1);
        FS.mkdir(path, mode, 0);
        return 0;
      },doMknod:function(path, mode, dev) {
        // we don't want this in the JS API as it uses mknod to create all nodes.
        switch (mode & 61440) {
          case 32768:
          case 8192:
          case 24576:
          case 4096:
          case 49152:
            break;
          default: return -28;
        }
        FS.mknod(path, mode, dev);
        return 0;
      },doReadlink:function(path, buf, bufsize) {
        if (bufsize <= 0) return -28;
        var ret = FS.readlink(path);
  
        var len = Math.min(bufsize, lengthBytesUTF8(ret));
        var endChar = HEAP8[buf+len];
        stringToUTF8(ret, buf, bufsize+1);
        // readlink is one of the rare functions that write out a C string, but does never append a null to the output buffer(!)
        // stringToUTF8() always appends a null byte, so restore the character under the null byte after the write.
        HEAP8[buf+len] = endChar;
  
        return len;
      },doAccess:function(path, amode) {
        if (amode & ~7) {
          // need a valid mode
          return -28;
        }
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node) {
          return -44;
        }
        var perms = '';
        if (amode & 4) perms += 'r';
        if (amode & 2) perms += 'w';
        if (amode & 1) perms += 'x';
        if (perms /* otherwise, they've just passed F_OK */ && FS.nodePermissions(node, perms)) {
          return -2;
        }
        return 0;
      },doDup:function(path, flags, suggestFD) {
        var suggest = FS.getStream(suggestFD);
        if (suggest) FS.close(suggest);
        return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
      },doReadv:function(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
          var ptr = HEAP32[(((iov)+(i*8))>>2)];
          var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
          var curr = FS.read(stream, HEAP8,ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
          if (curr < len) break; // nothing more to read
        }
        return ret;
      },doWritev:function(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
          var ptr = HEAP32[(((iov)+(i*8))>>2)];
          var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
          var curr = FS.write(stream, HEAP8,ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
        }
        return ret;
      },varargs:undefined,get:function() {
        assert(SYSCALLS.varargs != undefined);
        SYSCALLS.varargs += 4;
        var ret = HEAP32[(((SYSCALLS.varargs)-(4))>>2)];
        return ret;
      },getStr:function(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
      },getStreamFromFD:function(fd) {
        var stream = FS.getStream(fd);
        if (!stream) throw new FS.ErrnoError(8);
        return stream;
      },get64:function(low, high) {
        if (low >= 0) assert(high === 0);
        else assert(high === -1);
        return low;
      }};
  function ___syscall_fcntl64(fd, cmd, varargs) {
  SYSCALLS.varargs = varargs;
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      switch (cmd) {
        case 0: {
          var arg = SYSCALLS.get();
          if (arg < 0) {
            return -28;
          }
          var newStream;
          newStream = FS.open(stream.path, stream.flags, 0, arg);
          return newStream.fd;
        }
        case 1:
        case 2:
          return 0;  // FD_CLOEXEC makes no sense for a single process.
        case 3:
          return stream.flags;
        case 4: {
          var arg = SYSCALLS.get();
          stream.flags |= arg;
          return 0;
        }
        case 5:
        /* case 5: Currently in musl F_GETLK64 has same value as F_GETLK, so omitted to avoid duplicate case blocks. If that changes, uncomment this */ {
          
          var arg = SYSCALLS.get();
          var offset = 0;
          // We're always unlocked.
          HEAP16[(((arg)+(offset))>>1)] = 2;
          return 0;
        }
        case 6:
        case 7:
        /* case 6: Currently in musl F_SETLK64 has same value as F_SETLK, so omitted to avoid duplicate case blocks. If that changes, uncomment this */
        /* case 7: Currently in musl F_SETLKW64 has same value as F_SETLKW, so omitted to avoid duplicate case blocks. If that changes, uncomment this */
          
          
          return 0; // Pretend that the locking is successful.
        case 16:
        case 8:
          return -28; // These are for sockets. We don't have them fully implemented yet.
        case 9:
          // musl trusts getown return values, due to a bug where they must be, as they overlap with errors. just return -1 here, so fnctl() returns that, and we set errno ourselves.
          setErrNo(28);
          return -1;
        default: {
          return -28;
        }
      }
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return -e.errno;
  }
  }

  function ___syscall_ioctl(fd, op, varargs) {
  SYSCALLS.varargs = varargs;
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      switch (op) {
        case 21509:
        case 21505: {
          if (!stream.tty) return -59;
          return 0;
        }
        case 21510:
        case 21511:
        case 21512:
        case 21506:
        case 21507:
        case 21508: {
          if (!stream.tty) return -59;
          return 0; // no-op, not actually adjusting terminal settings
        }
        case 21519: {
          if (!stream.tty) return -59;
          var argp = SYSCALLS.get();
          HEAP32[((argp)>>2)] = 0;
          return 0;
        }
        case 21520: {
          if (!stream.tty) return -59;
          return -28; // not supported
        }
        case 21531: {
          var argp = SYSCALLS.get();
          return FS.ioctl(stream, op, argp);
        }
        case 21523: {
          // TODO: in theory we should write to the winsize struct that gets
          // passed in, but for now musl doesn't read anything on it
          if (!stream.tty) return -59;
          return 0;
        }
        case 21524: {
          // TODO: technically, this ioctl call should change the window size.
          // but, since emscripten doesn't have any concept of a terminal window
          // yet, we'll just silently throw it away as we do TIOCGWINSZ
          if (!stream.tty) return -59;
          return 0;
        }
        default: abort('bad ioctl syscall ' + op);
      }
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return -e.errno;
  }
  }

  function ___syscall_open(path, flags, varargs) {
  SYSCALLS.varargs = varargs;
  try {
  
      var pathname = SYSCALLS.getStr(path);
      var mode = varargs ? SYSCALLS.get() : 0;
      var stream = FS.open(pathname, flags, mode);
      return stream.fd;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return -e.errno;
  }
  }

  function __emscripten_throw_longjmp() { throw 'longjmp'; }

  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.copyWithin(dest, src, src + num);
    }

  function _emscripten_get_heap_max() {
      return HEAPU8.length;
    }
  
  function abortOnCannotGrowMemory(requestedSize) {
      abort('Cannot enlarge memory arrays to size ' + requestedSize + ' bytes (OOM). Either (1) compile with  -s INITIAL_MEMORY=X  with X higher than the current value ' + HEAP8.length + ', (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ');
    }
  function _emscripten_resize_heap(requestedSize) {
      var oldSize = HEAPU8.length;
      requestedSize = requestedSize >>> 0;
      abortOnCannotGrowMemory(requestedSize);
    }

  var ENV = {};
  
  function getExecutableName() {
      return thisProgram || './this.program';
    }
  function getEnvStrings() {
      if (!getEnvStrings.strings) {
        // Default values.
        // Browser language detection #8751
        var lang = ((typeof navigator == 'object' && navigator.languages && navigator.languages[0]) || 'C').replace('-', '_') + '.UTF-8';
        var env = {
          'USER': 'web_user',
          'LOGNAME': 'web_user',
          'PATH': '/',
          'PWD': '/',
          'HOME': '/home/web_user',
          'LANG': lang,
          '_': getExecutableName()
        };
        // Apply the user-provided values, if any.
        for (var x in ENV) {
          // x is a key in ENV; if ENV[x] is undefined, that means it was
          // explicitly set to be so. We allow user code to do that to
          // force variables with default values to remain unset.
          if (ENV[x] === undefined) delete env[x];
          else env[x] = ENV[x];
        }
        var strings = [];
        for (var x in env) {
          strings.push(x + '=' + env[x]);
        }
        getEnvStrings.strings = strings;
      }
      return getEnvStrings.strings;
    }
  function _environ_get(__environ, environ_buf) {
      var bufSize = 0;
      getEnvStrings().forEach(function(string, i) {
        var ptr = environ_buf + bufSize;
        HEAP32[(((__environ)+(i * 4))>>2)] = ptr;
        writeAsciiToMemory(string, ptr);
        bufSize += string.length + 1;
      });
      return 0;
    }

  function _environ_sizes_get(penviron_count, penviron_buf_size) {
      var strings = getEnvStrings();
      HEAP32[((penviron_count)>>2)] = strings.length;
      var bufSize = 0;
      strings.forEach(function(string) {
        bufSize += string.length + 1;
      });
      HEAP32[((penviron_buf_size)>>2)] = bufSize;
      return 0;
    }

  function _exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      exit(status);
    }

  function _fd_close(fd) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.close(stream);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return e.errno;
  }
  }

  function _fd_read(fd, iov, iovcnt, pnum) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = SYSCALLS.doReadv(stream, iov, iovcnt);
      HEAP32[((pnum)>>2)] = num;
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return e.errno;
  }
  }

  function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
  try {
  
      
      var stream = SYSCALLS.getStreamFromFD(fd);
      var HIGH_OFFSET = 0x100000000; // 2^32
      // use an unsigned operator on low and shift high by 32-bits
      var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
  
      var DOUBLE_LIMIT = 0x20000000000000; // 2^53
      // we also check for equality since DOUBLE_LIMIT + 1 == DOUBLE_LIMIT
      if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
        return -61;
      }
  
      FS.llseek(stream, offset, whence);
      (tempI64 = [stream.position>>>0,(tempDouble=stream.position,(+(Math.abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math.min((+(Math.floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((newOffset)>>2)] = tempI64[0],HEAP32[(((newOffset)+(4))>>2)] = tempI64[1]);
      if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return e.errno;
  }
  }

  function _fd_write(fd, iov, iovcnt, pnum) {
  try {
  
      ;
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = SYSCALLS.doWritev(stream, iov, iovcnt);
      HEAP32[((pnum)>>2)] = num;
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return e.errno;
  }
  }

  function _getTempRet0() {
      return getTempRet0();
    }

  function _setTempRet0(val) {
      setTempRet0(val);
    }


  var FSNode = /** @constructor */ function(parent, name, mode, rdev) {
    if (!parent) {
      parent = this;  // root node sets parent to itself
    }
    this.parent = parent;
    this.mount = parent.mount;
    this.mounted = null;
    this.id = FS.nextInode++;
    this.name = name;
    this.mode = mode;
    this.node_ops = {};
    this.stream_ops = {};
    this.rdev = rdev;
  };
  var readMode = 292/*292*/ | 73/*73*/;
  var writeMode = 146/*146*/;
  Object.defineProperties(FSNode.prototype, {
   read: {
    get: /** @this{FSNode} */function() {
     return (this.mode & readMode) === readMode;
    },
    set: /** @this{FSNode} */function(val) {
     val ? this.mode |= readMode : this.mode &= ~readMode;
    }
   },
   write: {
    get: /** @this{FSNode} */function() {
     return (this.mode & writeMode) === writeMode;
    },
    set: /** @this{FSNode} */function(val) {
     val ? this.mode |= writeMode : this.mode &= ~writeMode;
    }
   },
   isFolder: {
    get: /** @this{FSNode} */function() {
     return FS.isDir(this.mode);
    }
   },
   isDevice: {
    get: /** @this{FSNode} */function() {
     return FS.isChrdev(this.mode);
    }
   }
  });
  FS.FSNode = FSNode;
  FS.staticInit();Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createDevice"] = FS.createDevice;Module["FS_unlink"] = FS.unlink;;
ERRNO_CODES = {
      'EPERM': 63,
      'ENOENT': 44,
      'ESRCH': 71,
      'EINTR': 27,
      'EIO': 29,
      'ENXIO': 60,
      'E2BIG': 1,
      'ENOEXEC': 45,
      'EBADF': 8,
      'ECHILD': 12,
      'EAGAIN': 6,
      'EWOULDBLOCK': 6,
      'ENOMEM': 48,
      'EACCES': 2,
      'EFAULT': 21,
      'ENOTBLK': 105,
      'EBUSY': 10,
      'EEXIST': 20,
      'EXDEV': 75,
      'ENODEV': 43,
      'ENOTDIR': 54,
      'EISDIR': 31,
      'EINVAL': 28,
      'ENFILE': 41,
      'EMFILE': 33,
      'ENOTTY': 59,
      'ETXTBSY': 74,
      'EFBIG': 22,
      'ENOSPC': 51,
      'ESPIPE': 70,
      'EROFS': 69,
      'EMLINK': 34,
      'EPIPE': 64,
      'EDOM': 18,
      'ERANGE': 68,
      'ENOMSG': 49,
      'EIDRM': 24,
      'ECHRNG': 106,
      'EL2NSYNC': 156,
      'EL3HLT': 107,
      'EL3RST': 108,
      'ELNRNG': 109,
      'EUNATCH': 110,
      'ENOCSI': 111,
      'EL2HLT': 112,
      'EDEADLK': 16,
      'ENOLCK': 46,
      'EBADE': 113,
      'EBADR': 114,
      'EXFULL': 115,
      'ENOANO': 104,
      'EBADRQC': 103,
      'EBADSLT': 102,
      'EDEADLOCK': 16,
      'EBFONT': 101,
      'ENOSTR': 100,
      'ENODATA': 116,
      'ETIME': 117,
      'ENOSR': 118,
      'ENONET': 119,
      'ENOPKG': 120,
      'EREMOTE': 121,
      'ENOLINK': 47,
      'EADV': 122,
      'ESRMNT': 123,
      'ECOMM': 124,
      'EPROTO': 65,
      'EMULTIHOP': 36,
      'EDOTDOT': 125,
      'EBADMSG': 9,
      'ENOTUNIQ': 126,
      'EBADFD': 127,
      'EREMCHG': 128,
      'ELIBACC': 129,
      'ELIBBAD': 130,
      'ELIBSCN': 131,
      'ELIBMAX': 132,
      'ELIBEXEC': 133,
      'ENOSYS': 52,
      'ENOTEMPTY': 55,
      'ENAMETOOLONG': 37,
      'ELOOP': 32,
      'EOPNOTSUPP': 138,
      'EPFNOSUPPORT': 139,
      'ECONNRESET': 15,
      'ENOBUFS': 42,
      'EAFNOSUPPORT': 5,
      'EPROTOTYPE': 67,
      'ENOTSOCK': 57,
      'ENOPROTOOPT': 50,
      'ESHUTDOWN': 140,
      'ECONNREFUSED': 14,
      'EADDRINUSE': 3,
      'ECONNABORTED': 13,
      'ENETUNREACH': 40,
      'ENETDOWN': 38,
      'ETIMEDOUT': 73,
      'EHOSTDOWN': 142,
      'EHOSTUNREACH': 23,
      'EINPROGRESS': 26,
      'EALREADY': 7,
      'EDESTADDRREQ': 17,
      'EMSGSIZE': 35,
      'EPROTONOSUPPORT': 66,
      'ESOCKTNOSUPPORT': 137,
      'EADDRNOTAVAIL': 4,
      'ENETRESET': 39,
      'EISCONN': 30,
      'ENOTCONN': 53,
      'ETOOMANYREFS': 141,
      'EUSERS': 136,
      'EDQUOT': 19,
      'ESTALE': 72,
      'ENOTSUP': 138,
      'ENOMEDIUM': 148,
      'EILSEQ': 25,
      'EOVERFLOW': 61,
      'ECANCELED': 11,
      'ENOTRECOVERABLE': 56,
      'EOWNERDEAD': 62,
      'ESTRPIPE': 135,
    };;
var ASSERTIONS = true;



/** @type {function(string, boolean=, number=)} */
function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      if (ASSERTIONS) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      }
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}


// Copied from https://github.com/strophe/strophejs/blob/e06d027/src/polyfills.js#L149

// This code was written by Tyler Akins and has been placed in the
// public domain.  It would be nice if you left this header intact.
// Base64 code from Tyler Akins -- http://rumkin.com

/**
 * Decodes a base64 string.
 * @param {string} input The string to decode.
 */
var decodeBase64 = typeof atob == 'function' ? atob : function (input) {
  var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  var output = '';
  var chr1, chr2, chr3;
  var enc1, enc2, enc3, enc4;
  var i = 0;
  // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');
  do {
    enc1 = keyStr.indexOf(input.charAt(i++));
    enc2 = keyStr.indexOf(input.charAt(i++));
    enc3 = keyStr.indexOf(input.charAt(i++));
    enc4 = keyStr.indexOf(input.charAt(i++));

    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

    output = output + String.fromCharCode(chr1);

    if (enc3 !== 64) {
      output = output + String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      output = output + String.fromCharCode(chr3);
    }
  } while (i < input.length);
  return output;
};

// Converts a string of base64 into a byte array.
// Throws error on invalid input.
function intArrayFromBase64(s) {
  if (typeof ENVIRONMENT_IS_NODE == 'boolean' && ENVIRONMENT_IS_NODE) {
    var buf = Buffer.from(s, 'base64');
    return new Uint8Array(buf['buffer'], buf['byteOffset'], buf['byteLength']);
  }

  try {
    var decoded = decodeBase64(s);
    var bytes = new Uint8Array(decoded.length);
    for (var i = 0 ; i < decoded.length ; ++i) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
  } catch (_) {
    throw new Error('Converting base64 string to bytes failed.');
  }
}

// If filename is a base64 data URI, parses and returns data (Buffer on node,
// Uint8Array otherwise). If filename is not a base64 data URI, returns undefined.
function tryParseAsDataURI(filename) {
  if (!isDataURI(filename)) {
    return;
  }

  return intArrayFromBase64(filename.slice(dataURIPrefix.length));
}


var asmLibraryArg = {
  "__syscall_fcntl64": ___syscall_fcntl64,
  "__syscall_ioctl": ___syscall_ioctl,
  "__syscall_open": ___syscall_open,
  "_emscripten_throw_longjmp": __emscripten_throw_longjmp,
  "emscripten_memcpy_big": _emscripten_memcpy_big,
  "emscripten_resize_heap": _emscripten_resize_heap,
  "environ_get": _environ_get,
  "environ_sizes_get": _environ_sizes_get,
  "exit": _exit,
  "fd_close": _fd_close,
  "fd_read": _fd_read,
  "fd_seek": _fd_seek,
  "fd_write": _fd_write,
  "getTempRet0": _getTempRet0,
  "invoke_i": invoke_i,
  "invoke_ii": invoke_ii,
  "invoke_iii": invoke_iii,
  "invoke_iiii": invoke_iiii,
  "invoke_iiiiii": invoke_iiiiii,
  "invoke_v": invoke_v,
  "invoke_viii": invoke_viii,
  "setTempRet0": _setTempRet0
};
var asm = createWasm();
/** @type {function(...*):?} */
var ___wasm_call_ctors = Module["___wasm_call_ctors"] = createExportWrapper("__wasm_call_ctors");

/** @type {function(...*):?} */
var _malloc = Module["_malloc"] = createExportWrapper("malloc");

/** @type {function(...*):?} */
var _free = Module["_free"] = createExportWrapper("free");

/** @type {function(...*):?} */
var ___errno_location = Module["___errno_location"] = createExportWrapper("__errno_location");

/** @type {function(...*):?} */
var _init_scheme = Module["_init_scheme"] = createExportWrapper("init_scheme");

/** @type {function(...*):?} */
var _exec_scheme = Module["_exec_scheme"] = createExportWrapper("exec_scheme");

/** @type {function(...*):?} */
var _saveSetjmp = Module["_saveSetjmp"] = createExportWrapper("saveSetjmp");

/** @type {function(...*):?} */
var _main = Module["_main"] = createExportWrapper("main");

/** @type {function(...*):?} */
var ___stdio_exit = Module["___stdio_exit"] = createExportWrapper("__stdio_exit");

/** @type {function(...*):?} */
var _setThrew = Module["_setThrew"] = createExportWrapper("setThrew");

/** @type {function(...*):?} */
var _emscripten_stack_init = Module["_emscripten_stack_init"] = function() {
  return (_emscripten_stack_init = Module["_emscripten_stack_init"] = Module["asm"]["emscripten_stack_init"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _emscripten_stack_get_free = Module["_emscripten_stack_get_free"] = function() {
  return (_emscripten_stack_get_free = Module["_emscripten_stack_get_free"] = Module["asm"]["emscripten_stack_get_free"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _emscripten_stack_get_base = Module["_emscripten_stack_get_base"] = function() {
  return (_emscripten_stack_get_base = Module["_emscripten_stack_get_base"] = Module["asm"]["emscripten_stack_get_base"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var _emscripten_stack_get_end = Module["_emscripten_stack_get_end"] = function() {
  return (_emscripten_stack_get_end = Module["_emscripten_stack_get_end"] = Module["asm"]["emscripten_stack_get_end"]).apply(null, arguments);
};

/** @type {function(...*):?} */
var stackSave = Module["stackSave"] = createExportWrapper("stackSave");

/** @type {function(...*):?} */
var stackRestore = Module["stackRestore"] = createExportWrapper("stackRestore");

/** @type {function(...*):?} */
var stackAlloc = Module["stackAlloc"] = createExportWrapper("stackAlloc");

/** @type {function(...*):?} */
var dynCall_jiji = Module["dynCall_jiji"] = createExportWrapper("dynCall_jiji");

var ___emscripten_embedded_file_data = Module['___emscripten_embedded_file_data'] = 11704;
function invoke_iii(index,a1,a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0 && e !== 'longjmp') throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0 && e !== 'longjmp') throw e;
    _setThrew(1, 0);
  }
}

function invoke_ii(index,a1) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0 && e !== 'longjmp') throw e;
    _setThrew(1, 0);
  }
}

function invoke_i(index) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)();
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0 && e !== 'longjmp') throw e;
    _setThrew(1, 0);
  }
}

function invoke_iiiiii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(index)(a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0 && e !== 'longjmp') throw e;
    _setThrew(1, 0);
  }
}

function invoke_viii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)(a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0 && e !== 'longjmp') throw e;
    _setThrew(1, 0);
  }
}

function invoke_v(index) {
  var sp = stackSave();
  try {
    getWasmTableEntry(index)();
  } catch(e) {
    stackRestore(sp);
    if (e !== e+0 && e !== 'longjmp') throw e;
    _setThrew(1, 0);
  }
}




// === Auto-generated postamble setup entry stuff ===

if (!Object.getOwnPropertyDescriptor(Module, "intArrayFromString")) Module["intArrayFromString"] = () => abort("'intArrayFromString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "intArrayToString")) Module["intArrayToString"] = () => abort("'intArrayToString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
Module["ccall"] = ccall;
Module["cwrap"] = cwrap;
if (!Object.getOwnPropertyDescriptor(Module, "setValue")) Module["setValue"] = () => abort("'setValue' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "getValue")) Module["getValue"] = () => abort("'getValue' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "allocate")) Module["allocate"] = () => abort("'allocate' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "UTF8ArrayToString")) Module["UTF8ArrayToString"] = () => abort("'UTF8ArrayToString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "UTF8ToString")) Module["UTF8ToString"] = () => abort("'UTF8ToString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF8Array")) Module["stringToUTF8Array"] = () => abort("'stringToUTF8Array' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF8")) Module["stringToUTF8"] = () => abort("'stringToUTF8' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF8")) Module["lengthBytesUTF8"] = () => abort("'lengthBytesUTF8' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "stackTrace")) Module["stackTrace"] = () => abort("'stackTrace' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "addOnPreRun")) Module["addOnPreRun"] = () => abort("'addOnPreRun' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "addOnInit")) Module["addOnInit"] = () => abort("'addOnInit' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "addOnPreMain")) Module["addOnPreMain"] = () => abort("'addOnPreMain' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "addOnExit")) Module["addOnExit"] = () => abort("'addOnExit' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "addOnPostRun")) Module["addOnPostRun"] = () => abort("'addOnPostRun' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "writeStringToMemory")) Module["writeStringToMemory"] = () => abort("'writeStringToMemory' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "writeArrayToMemory")) Module["writeArrayToMemory"] = () => abort("'writeArrayToMemory' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "writeAsciiToMemory")) Module["writeAsciiToMemory"] = () => abort("'writeAsciiToMemory' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
Module["addRunDependency"] = addRunDependency;
Module["removeRunDependency"] = removeRunDependency;
if (!Object.getOwnPropertyDescriptor(Module, "FS_createFolder")) Module["FS_createFolder"] = () => abort("'FS_createFolder' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
Module["FS_createPath"] = FS.createPath;
Module["FS_createDataFile"] = FS.createDataFile;
Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
Module["FS_createLazyFile"] = FS.createLazyFile;
if (!Object.getOwnPropertyDescriptor(Module, "FS_createLink")) Module["FS_createLink"] = () => abort("'FS_createLink' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
Module["FS_createDevice"] = FS.createDevice;
Module["FS_unlink"] = FS.unlink;
if (!Object.getOwnPropertyDescriptor(Module, "getLEB")) Module["getLEB"] = () => abort("'getLEB' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "getFunctionTables")) Module["getFunctionTables"] = () => abort("'getFunctionTables' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "alignFunctionTables")) Module["alignFunctionTables"] = () => abort("'alignFunctionTables' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "registerFunctions")) Module["registerFunctions"] = () => abort("'registerFunctions' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "addFunction")) Module["addFunction"] = () => abort("'addFunction' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "removeFunction")) Module["removeFunction"] = () => abort("'removeFunction' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "getFuncWrapper")) Module["getFuncWrapper"] = () => abort("'getFuncWrapper' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "prettyPrint")) Module["prettyPrint"] = () => abort("'prettyPrint' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "dynCall")) Module["dynCall"] = () => abort("'dynCall' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "getCompilerSetting")) Module["getCompilerSetting"] = () => abort("'getCompilerSetting' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "print")) Module["print"] = () => abort("'print' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "printErr")) Module["printErr"] = () => abort("'printErr' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "getTempRet0")) Module["getTempRet0"] = () => abort("'getTempRet0' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "setTempRet0")) Module["setTempRet0"] = () => abort("'setTempRet0' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "callMain")) Module["callMain"] = () => abort("'callMain' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "abort")) Module["abort"] = () => abort("'abort' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "keepRuntimeAlive")) Module["keepRuntimeAlive"] = () => abort("'keepRuntimeAlive' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "zeroMemory")) Module["zeroMemory"] = () => abort("'zeroMemory' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "stringToNewUTF8")) Module["stringToNewUTF8"] = () => abort("'stringToNewUTF8' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "abortOnCannotGrowMemory")) Module["abortOnCannotGrowMemory"] = () => abort("'abortOnCannotGrowMemory' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "emscripten_realloc_buffer")) Module["emscripten_realloc_buffer"] = () => abort("'emscripten_realloc_buffer' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "ENV")) Module["ENV"] = () => abort("'ENV' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "withStackSave")) Module["withStackSave"] = () => abort("'withStackSave' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "ERRNO_CODES")) Module["ERRNO_CODES"] = () => abort("'ERRNO_CODES' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "ERRNO_MESSAGES")) Module["ERRNO_MESSAGES"] = () => abort("'ERRNO_MESSAGES' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "setErrNo")) Module["setErrNo"] = () => abort("'setErrNo' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "inetPton4")) Module["inetPton4"] = () => abort("'inetPton4' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "inetNtop4")) Module["inetNtop4"] = () => abort("'inetNtop4' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "inetPton6")) Module["inetPton6"] = () => abort("'inetPton6' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "inetNtop6")) Module["inetNtop6"] = () => abort("'inetNtop6' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "readSockaddr")) Module["readSockaddr"] = () => abort("'readSockaddr' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "writeSockaddr")) Module["writeSockaddr"] = () => abort("'writeSockaddr' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "DNS")) Module["DNS"] = () => abort("'DNS' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "getHostByName")) Module["getHostByName"] = () => abort("'getHostByName' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "Protocols")) Module["Protocols"] = () => abort("'Protocols' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "Sockets")) Module["Sockets"] = () => abort("'Sockets' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "getRandomDevice")) Module["getRandomDevice"] = () => abort("'getRandomDevice' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "traverseStack")) Module["traverseStack"] = () => abort("'traverseStack' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "convertFrameToPC")) Module["convertFrameToPC"] = () => abort("'convertFrameToPC' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "UNWIND_CACHE")) Module["UNWIND_CACHE"] = () => abort("'UNWIND_CACHE' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "saveInUnwindCache")) Module["saveInUnwindCache"] = () => abort("'saveInUnwindCache' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "convertPCtoSourceLocation")) Module["convertPCtoSourceLocation"] = () => abort("'convertPCtoSourceLocation' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "readAsmConstArgsArray")) Module["readAsmConstArgsArray"] = () => abort("'readAsmConstArgsArray' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "readAsmConstArgs")) Module["readAsmConstArgs"] = () => abort("'readAsmConstArgs' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "mainThreadEM_ASM")) Module["mainThreadEM_ASM"] = () => abort("'mainThreadEM_ASM' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "jstoi_q")) Module["jstoi_q"] = () => abort("'jstoi_q' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "jstoi_s")) Module["jstoi_s"] = () => abort("'jstoi_s' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "getExecutableName")) Module["getExecutableName"] = () => abort("'getExecutableName' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "listenOnce")) Module["listenOnce"] = () => abort("'listenOnce' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "autoResumeAudioContext")) Module["autoResumeAudioContext"] = () => abort("'autoResumeAudioContext' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "dynCallLegacy")) Module["dynCallLegacy"] = () => abort("'dynCallLegacy' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "getDynCaller")) Module["getDynCaller"] = () => abort("'getDynCaller' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "dynCall")) Module["dynCall"] = () => abort("'dynCall' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "callRuntimeCallbacks")) Module["callRuntimeCallbacks"] = () => abort("'callRuntimeCallbacks' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "wasmTableMirror")) Module["wasmTableMirror"] = () => abort("'wasmTableMirror' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "setWasmTableEntry")) Module["setWasmTableEntry"] = () => abort("'setWasmTableEntry' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "getWasmTableEntry")) Module["getWasmTableEntry"] = () => abort("'getWasmTableEntry' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "handleException")) Module["handleException"] = () => abort("'handleException' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "runtimeKeepalivePush")) Module["runtimeKeepalivePush"] = () => abort("'runtimeKeepalivePush' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "runtimeKeepalivePop")) Module["runtimeKeepalivePop"] = () => abort("'runtimeKeepalivePop' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "callUserCallback")) Module["callUserCallback"] = () => abort("'callUserCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "maybeExit")) Module["maybeExit"] = () => abort("'maybeExit' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "safeSetTimeout")) Module["safeSetTimeout"] = () => abort("'safeSetTimeout' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "asmjsMangle")) Module["asmjsMangle"] = () => abort("'asmjsMangle' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "asyncLoad")) Module["asyncLoad"] = () => abort("'asyncLoad' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "alignMemory")) Module["alignMemory"] = () => abort("'alignMemory' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "mmapAlloc")) Module["mmapAlloc"] = () => abort("'mmapAlloc' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "reallyNegative")) Module["reallyNegative"] = () => abort("'reallyNegative' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "unSign")) Module["unSign"] = () => abort("'unSign' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "reSign")) Module["reSign"] = () => abort("'reSign' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "formatString")) Module["formatString"] = () => abort("'formatString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "PATH")) Module["PATH"] = () => abort("'PATH' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "PATH_FS")) Module["PATH_FS"] = () => abort("'PATH_FS' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "SYSCALLS")) Module["SYSCALLS"] = () => abort("'SYSCALLS' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "getSocketFromFD")) Module["getSocketFromFD"] = () => abort("'getSocketFromFD' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "getSocketAddress")) Module["getSocketAddress"] = () => abort("'getSocketAddress' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "JSEvents")) Module["JSEvents"] = () => abort("'JSEvents' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "registerKeyEventCallback")) Module["registerKeyEventCallback"] = () => abort("'registerKeyEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "specialHTMLTargets")) Module["specialHTMLTargets"] = () => abort("'specialHTMLTargets' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "maybeCStringToJsString")) Module["maybeCStringToJsString"] = () => abort("'maybeCStringToJsString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "findEventTarget")) Module["findEventTarget"] = () => abort("'findEventTarget' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "findCanvasEventTarget")) Module["findCanvasEventTarget"] = () => abort("'findCanvasEventTarget' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "getBoundingClientRect")) Module["getBoundingClientRect"] = () => abort("'getBoundingClientRect' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "fillMouseEventData")) Module["fillMouseEventData"] = () => abort("'fillMouseEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "registerMouseEventCallback")) Module["registerMouseEventCallback"] = () => abort("'registerMouseEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "registerWheelEventCallback")) Module["registerWheelEventCallback"] = () => abort("'registerWheelEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "registerUiEventCallback")) Module["registerUiEventCallback"] = () => abort("'registerUiEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "registerFocusEventCallback")) Module["registerFocusEventCallback"] = () => abort("'registerFocusEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "fillDeviceOrientationEventData")) Module["fillDeviceOrientationEventData"] = () => abort("'fillDeviceOrientationEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "registerDeviceOrientationEventCallback")) Module["registerDeviceOrientationEventCallback"] = () => abort("'registerDeviceOrientationEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "fillDeviceMotionEventData")) Module["fillDeviceMotionEventData"] = () => abort("'fillDeviceMotionEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "registerDeviceMotionEventCallback")) Module["registerDeviceMotionEventCallback"] = () => abort("'registerDeviceMotionEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "screenOrientation")) Module["screenOrientation"] = () => abort("'screenOrientation' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "fillOrientationChangeEventData")) Module["fillOrientationChangeEventData"] = () => abort("'fillOrientationChangeEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "registerOrientationChangeEventCallback")) Module["registerOrientationChangeEventCallback"] = () => abort("'registerOrientationChangeEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "fillFullscreenChangeEventData")) Module["fillFullscreenChangeEventData"] = () => abort("'fillFullscreenChangeEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "registerFullscreenChangeEventCallback")) Module["registerFullscreenChangeEventCallback"] = () => abort("'registerFullscreenChangeEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "registerRestoreOldStyle")) Module["registerRestoreOldStyle"] = () => abort("'registerRestoreOldStyle' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "hideEverythingExceptGivenElement")) Module["hideEverythingExceptGivenElement"] = () => abort("'hideEverythingExceptGivenElement' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "restoreHiddenElements")) Module["restoreHiddenElements"] = () => abort("'restoreHiddenElements' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "setLetterbox")) Module["setLetterbox"] = () => abort("'setLetterbox' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "currentFullscreenStrategy")) Module["currentFullscreenStrategy"] = () => abort("'currentFullscreenStrategy' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "restoreOldWindowedStyle")) Module["restoreOldWindowedStyle"] = () => abort("'restoreOldWindowedStyle' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "softFullscreenResizeWebGLRenderTarget")) Module["softFullscreenResizeWebGLRenderTarget"] = () => abort("'softFullscreenResizeWebGLRenderTarget' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "doRequestFullscreen")) Module["doRequestFullscreen"] = () => abort("'doRequestFullscreen' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "fillPointerlockChangeEventData")) Module["fillPointerlockChangeEventData"] = () => abort("'fillPointerlockChangeEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "registerPointerlockChangeEventCallback")) Module["registerPointerlockChangeEventCallback"] = () => abort("'registerPointerlockChangeEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "registerPointerlockErrorEventCallback")) Module["registerPointerlockErrorEventCallback"] = () => abort("'registerPointerlockErrorEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "requestPointerLock")) Module["requestPointerLock"] = () => abort("'requestPointerLock' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "fillVisibilityChangeEventData")) Module["fillVisibilityChangeEventData"] = () => abort("'fillVisibilityChangeEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "registerVisibilityChangeEventCallback")) Module["registerVisibilityChangeEventCallback"] = () => abort("'registerVisibilityChangeEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "registerTouchEventCallback")) Module["registerTouchEventCallback"] = () => abort("'registerTouchEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "fillGamepadEventData")) Module["fillGamepadEventData"] = () => abort("'fillGamepadEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "registerGamepadEventCallback")) Module["registerGamepadEventCallback"] = () => abort("'registerGamepadEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "registerBeforeUnloadEventCallback")) Module["registerBeforeUnloadEventCallback"] = () => abort("'registerBeforeUnloadEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "fillBatteryEventData")) Module["fillBatteryEventData"] = () => abort("'fillBatteryEventData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "battery")) Module["battery"] = () => abort("'battery' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "registerBatteryEventCallback")) Module["registerBatteryEventCallback"] = () => abort("'registerBatteryEventCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "setCanvasElementSize")) Module["setCanvasElementSize"] = () => abort("'setCanvasElementSize' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "getCanvasElementSize")) Module["getCanvasElementSize"] = () => abort("'getCanvasElementSize' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "demangle")) Module["demangle"] = () => abort("'demangle' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "demangleAll")) Module["demangleAll"] = () => abort("'demangleAll' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "jsStackTrace")) Module["jsStackTrace"] = () => abort("'jsStackTrace' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "stackTrace")) Module["stackTrace"] = () => abort("'stackTrace' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "getEnvStrings")) Module["getEnvStrings"] = () => abort("'getEnvStrings' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "checkWasiClock")) Module["checkWasiClock"] = () => abort("'checkWasiClock' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64")) Module["writeI53ToI64"] = () => abort("'writeI53ToI64' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64Clamped")) Module["writeI53ToI64Clamped"] = () => abort("'writeI53ToI64Clamped' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64Signaling")) Module["writeI53ToI64Signaling"] = () => abort("'writeI53ToI64Signaling' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToU64Clamped")) Module["writeI53ToU64Clamped"] = () => abort("'writeI53ToU64Clamped' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToU64Signaling")) Module["writeI53ToU64Signaling"] = () => abort("'writeI53ToU64Signaling' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "readI53FromI64")) Module["readI53FromI64"] = () => abort("'readI53FromI64' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "readI53FromU64")) Module["readI53FromU64"] = () => abort("'readI53FromU64' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "convertI32PairToI53")) Module["convertI32PairToI53"] = () => abort("'convertI32PairToI53' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "convertU32PairToI53")) Module["convertU32PairToI53"] = () => abort("'convertU32PairToI53' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "setImmediateWrapped")) Module["setImmediateWrapped"] = () => abort("'setImmediateWrapped' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "clearImmediateWrapped")) Module["clearImmediateWrapped"] = () => abort("'clearImmediateWrapped' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "polyfillSetImmediate")) Module["polyfillSetImmediate"] = () => abort("'polyfillSetImmediate' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "uncaughtExceptionCount")) Module["uncaughtExceptionCount"] = () => abort("'uncaughtExceptionCount' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "exceptionLast")) Module["exceptionLast"] = () => abort("'exceptionLast' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "exceptionCaught")) Module["exceptionCaught"] = () => abort("'exceptionCaught' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "ExceptionInfo")) Module["ExceptionInfo"] = () => abort("'ExceptionInfo' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "CatchInfo")) Module["CatchInfo"] = () => abort("'CatchInfo' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "exception_addRef")) Module["exception_addRef"] = () => abort("'exception_addRef' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "exception_decRef")) Module["exception_decRef"] = () => abort("'exception_decRef' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "Browser")) Module["Browser"] = () => abort("'Browser' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "funcWrappers")) Module["funcWrappers"] = () => abort("'funcWrappers' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "getFuncWrapper")) Module["getFuncWrapper"] = () => abort("'getFuncWrapper' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "setMainLoop")) Module["setMainLoop"] = () => abort("'setMainLoop' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "wget")) Module["wget"] = () => abort("'wget' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "FS")) Module["FS"] = () => abort("'FS' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "MEMFS")) Module["MEMFS"] = () => abort("'MEMFS' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "TTY")) Module["TTY"] = () => abort("'TTY' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "PIPEFS")) Module["PIPEFS"] = () => abort("'PIPEFS' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "SOCKFS")) Module["SOCKFS"] = () => abort("'SOCKFS' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "_setNetworkCallback")) Module["_setNetworkCallback"] = () => abort("'_setNetworkCallback' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "tempFixedLengthArray")) Module["tempFixedLengthArray"] = () => abort("'tempFixedLengthArray' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "miniTempWebGLFloatBuffers")) Module["miniTempWebGLFloatBuffers"] = () => abort("'miniTempWebGLFloatBuffers' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "heapObjectForWebGLType")) Module["heapObjectForWebGLType"] = () => abort("'heapObjectForWebGLType' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "heapAccessShiftForWebGLHeap")) Module["heapAccessShiftForWebGLHeap"] = () => abort("'heapAccessShiftForWebGLHeap' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "GL")) Module["GL"] = () => abort("'GL' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGet")) Module["emscriptenWebGLGet"] = () => abort("'emscriptenWebGLGet' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "computeUnpackAlignedImageSize")) Module["computeUnpackAlignedImageSize"] = () => abort("'computeUnpackAlignedImageSize' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetTexPixelData")) Module["emscriptenWebGLGetTexPixelData"] = () => abort("'emscriptenWebGLGetTexPixelData' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetUniform")) Module["emscriptenWebGLGetUniform"] = () => abort("'emscriptenWebGLGetUniform' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "webglGetUniformLocation")) Module["webglGetUniformLocation"] = () => abort("'webglGetUniformLocation' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "webglPrepareUniformLocationsBeforeFirstUse")) Module["webglPrepareUniformLocationsBeforeFirstUse"] = () => abort("'webglPrepareUniformLocationsBeforeFirstUse' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "webglGetLeftBracePos")) Module["webglGetLeftBracePos"] = () => abort("'webglGetLeftBracePos' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetVertexAttrib")) Module["emscriptenWebGLGetVertexAttrib"] = () => abort("'emscriptenWebGLGetVertexAttrib' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "writeGLArray")) Module["writeGLArray"] = () => abort("'writeGLArray' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "AL")) Module["AL"] = () => abort("'AL' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "SDL_unicode")) Module["SDL_unicode"] = () => abort("'SDL_unicode' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "SDL_ttfContext")) Module["SDL_ttfContext"] = () => abort("'SDL_ttfContext' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "SDL_audio")) Module["SDL_audio"] = () => abort("'SDL_audio' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "SDL")) Module["SDL"] = () => abort("'SDL' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "SDL_gfx")) Module["SDL_gfx"] = () => abort("'SDL_gfx' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "GLUT")) Module["GLUT"] = () => abort("'GLUT' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "EGL")) Module["EGL"] = () => abort("'EGL' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "GLFW_Window")) Module["GLFW_Window"] = () => abort("'GLFW_Window' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "GLFW")) Module["GLFW"] = () => abort("'GLFW' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "GLEW")) Module["GLEW"] = () => abort("'GLEW' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "IDBStore")) Module["IDBStore"] = () => abort("'IDBStore' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "runAndAbortIfError")) Module["runAndAbortIfError"] = () => abort("'runAndAbortIfError' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "warnOnce")) Module["warnOnce"] = () => abort("'warnOnce' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "stackSave")) Module["stackSave"] = () => abort("'stackSave' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "stackRestore")) Module["stackRestore"] = () => abort("'stackRestore' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "stackAlloc")) Module["stackAlloc"] = () => abort("'stackAlloc' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "AsciiToString")) Module["AsciiToString"] = () => abort("'AsciiToString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "stringToAscii")) Module["stringToAscii"] = () => abort("'stringToAscii' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "UTF16ToString")) Module["UTF16ToString"] = () => abort("'UTF16ToString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF16")) Module["stringToUTF16"] = () => abort("'stringToUTF16' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF16")) Module["lengthBytesUTF16"] = () => abort("'lengthBytesUTF16' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "UTF32ToString")) Module["UTF32ToString"] = () => abort("'UTF32ToString' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF32")) Module["stringToUTF32"] = () => abort("'stringToUTF32' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF32")) Module["lengthBytesUTF32"] = () => abort("'lengthBytesUTF32' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "allocateUTF8")) Module["allocateUTF8"] = () => abort("'allocateUTF8' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "allocateUTF8OnStack")) Module["allocateUTF8OnStack"] = () => abort("'allocateUTF8OnStack' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
Module["writeStackCookie"] = writeStackCookie;
Module["checkStackCookie"] = checkStackCookie;
if (!Object.getOwnPropertyDescriptor(Module, "intArrayFromBase64")) Module["intArrayFromBase64"] = () => abort("'intArrayFromBase64' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "tryParseAsDataURI")) Module["tryParseAsDataURI"] = () => abort("'tryParseAsDataURI' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)");
if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_NORMAL")) Object.defineProperty(Module, "ALLOC_NORMAL", { configurable: true, get: function() { abort("'ALLOC_NORMAL' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") } });
if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_STACK")) Object.defineProperty(Module, "ALLOC_STACK", { configurable: true, get: function() { abort("'ALLOC_STACK' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)") } });

var calledRun;

/**
 * @constructor
 * @this {ExitStatus}
 */
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
}

var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!calledRun) run();
  if (!calledRun) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
};

function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on Module["onRuntimeInitialized"])');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  var entryFunction = Module['_main'];

  args = args || [];

  var argc = args.length+1;
  var argv = stackAlloc((argc + 1) * 4);
  HEAP32[argv >> 2] = allocateUTF8OnStack(thisProgram);
  for (var i = 1; i < argc; i++) {
    HEAP32[(argv >> 2) + i] = allocateUTF8OnStack(args[i - 1]);
  }
  HEAP32[(argv >> 2) + argc] = 0;

  try {

    var ret = entryFunction(argc, argv);

    // In PROXY_TO_PTHREAD builds, we should never exit the runtime below, as
    // execution is asynchronously handed off to a pthread.
    // if we're not running an evented main loop, it's time to exit
    exit(ret, /* implicit = */ true);
    return ret;
  }
  catch (e) {
    return handleException(e);
  } finally {
    calledMain = true;

  }
}

function stackCheckInit() {
  // This is normally called automatically during __wasm_call_ctors but need to
  // get these values before even running any of the ctors so we call it redundantly
  // here.
  // TODO(sbc): Move writeStackCookie to native to to avoid this.
  _emscripten_stack_init();
  writeStackCookie();
}

/** @type {function(Array=)} */
function run(args) {
  args = args || arguments_;

  if (runDependencies > 0) {
    return;
  }

  stackCheckInit();

  preRun();

  // a preRun added a dependency, run will be called later
  if (runDependencies > 0) {
    return;
  }

  function doRun() {
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    if (calledRun) return;
    calledRun = true;
    Module['calledRun'] = true;

    if (ABORT) return;

    initRuntime();

    preMain();

    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

    if (shouldRunNow) callMain(args);

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else
  {
    doRun();
  }
  checkStackCookie();
}
Module['run'] = run;

function checkUnflushedContent() {
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var oldOut = out;
  var oldErr = err;
  var has = false;
  out = err = (x) => {
    has = true;
  }
  try { // it doesn't matter if it fails
    ___stdio_exit();
    // also flush in the JS FS layer
    ['stdout', 'stderr'].forEach(function(name) {
      var info = FS.analyzePath('/dev/' + name);
      if (!info) return;
      var stream = info.object;
      var rdev = stream.rdev;
      var tty = TTY.ttys[rdev];
      if (tty && tty.output && tty.output.length) {
        has = true;
      }
    });
  } catch(e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.');
  }
}

/** @param {boolean|number=} implicit */
function exit(status, implicit) {
  EXITSTATUS = status;

  // Skip this check if the runtime is being kept alive deliberately.
  // For example if `exit_with_live_runtime` is called.
  if (!runtimeKeepaliveCounter) {
    checkUnflushedContent();
  }

  if (keepRuntimeAlive()) {
    // if exit() was called, we may warn the user if the runtime isn't actually being shut down
    if (!implicit) {
      var msg = 'program exited (with status: ' + status + '), but EXIT_RUNTIME is not set, so halting execution but not exiting the runtime or preventing further async execution (build with EXIT_RUNTIME=1, if you want a true shutdown)';
      err(msg);
    }
  } else {
    exitRuntime();
  }

  procExit(status);
}

function procExit(code) {
  EXITSTATUS = code;
  if (!keepRuntimeAlive()) {
    if (Module['onExit']) Module['onExit'](code);
    ABORT = true;
  }
  quit_(code, new ExitStatus(code));
}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;

if (Module['noInitialRun']) shouldRunNow = false;

run();





