

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
  wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAABjIKAgAAoYAN/f38Bf2ABfwF/YAJ/fwF/YAF/AGAAAX9gAABgAn9/AGADf35/AX5gBH9/f38Bf2AFf35+fn4AYAV/f39/fwF/YAV/f39/fwBgBH9/f38AYAN/f38AYAZ/f39/f38Bf2AEf35+fwBgA39+fwF/YAF/AX5gAnx/AXxgBn98f39/fwF/YAJ+fwF/YAR+fn5+AX9gAX8BfGABfAF/YAJ/fgBgAn5+AX9gA39+fgBgBn9/f39/fwBgB39/f39/f38AYAJ/fwF+YAJ/fwF8YAR/f39+AX5gB39/f39/f38Bf2ADfn9/AX9gAXwBfmACf3wAYAJ/fQBgAn5+AXxgBH9/fn8BfmAEf35/fwF/Aq6EgIAAFwNlbnYEZXhpdAADA2VudgppbnZva2VfaWlpAAADZW52C3NldFRlbXBSZXQwAAMDZW52C2dldFRlbXBSZXQwAAQDZW52C2ludm9rZV9paWlpAAgDZW52CWludm9rZV9paQACA2VudghpbnZva2VfaQABA2Vudg1pbnZva2VfaWlpaWlpAA4DZW52C2ludm9rZV92aWlpAAwDZW52CGludm9rZV92AAMDZW52FWVtc2NyaXB0ZW5fbWVtY3B5X2JpZwAAA2Vudg5fX3N5c2NhbGxfb3BlbgAAA2VudhFfX3N5c2NhbGxfZmNudGw2NAAAA2Vudg9fX3N5c2NhbGxfaW9jdGwAABZ3YXNpX3NuYXBzaG90X3ByZXZpZXcxCGZkX3dyaXRlAAgWd2FzaV9zbmFwc2hvdF9wcmV2aWV3MQdmZF9yZWFkAAgWd2FzaV9zbmFwc2hvdF9wcmV2aWV3MQhmZF9jbG9zZQABA2Vudg5fX3N5c2NhbGxfZHVwMwAAFndhc2lfc25hcHNob3RfcHJldmlldzERZW52aXJvbl9zaXplc19nZXQAAhZ3YXNpX3NuYXBzaG90X3ByZXZpZXcxC2Vudmlyb25fZ2V0AAIDZW52FmVtc2NyaXB0ZW5fcmVzaXplX2hlYXAAAQNlbnYZX2Vtc2NyaXB0ZW5fdGhyb3dfbG9uZ2ptcAAFFndhc2lfc25hcHNob3RfcHJldmlldzEHZmRfc2VlawAKA6SCgIAAogIFAQICAgAAAgIBFgoDCwsGAgYIAgsLCwMFBQMDBgEFAwUCCg4CDAEBAQMGAA0A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DAgLIAUoApwBIZsBQfEQIZwBQQAhnQEgmwEgnAEgnQEQuQEaDAcLIAUoApwBIZ4BIAUoApgBIZ8BIJ8BKAIQIaABIAUgoAE2AnBBhAohoQFB8AAhogEgBSCiAWohowEgngEgoQEgowEQuQEaDAYLIAUoApwBIaQBQfUQIaUBQQAhpgEgpAEgpQEgpgEQuQEaAkADQCAFKAKYASGnASCnARCPASGoAUEBIakBIKgBIKkBcSGqASCqAUUNASAFKAKcASGrASAFKAKYASGsASCsASgCECGtASAFLQCXASGuAUEBIa8BIK4BIK8BcSGwASCrASCtASCwARCOASAFKAKYASGxASCxASgCFCGyASAFILIBNgKYASAFKAKYASGzASCzARCPASG0AUEBIbUBILQBILUBcSG2AQJAILYBRQ0AIAUoApwBIbcBQZ4RIbgBQQAhuQEgtwEguAEguQEQuQEaCwwACwALIAUoApgBIboBILoBEJABIbsBQQEhvAEguwEgvAFxIb0BAkAgvQENACAFKAKcASG+AUGcESG/AUEAIcABIL4BIL8BIMABELkBGiAFKAKcASHBASAFKAKYASHCASAFLQCXASHDAUEBIcQBIMMBIMQBcSHFASDBASDCASDFARCOAQsgBSgCnAEhxgFB8hAhxwFBACHIASDGASDHASDIARC5ARoMBQsgBSgCnAEhyQFBkxAhygFBACHLASDJASDKASDLARC5ARoMBAsgBSgCnAEhzAFBnhAhzQFBACHOASDMASDNASDOARC5ARoMAwsgBSgCnAEhzwFBhhAh0AFBACHRASDPASDQASDRARC5ARoMAgsgBSgCnAEh0gFB9g8h0wFBACHUASDSASDTASDUARC5ARoMAQsgBSgCnAEh1QEgBSgCmAEh1gEg1gEoAhAh1wEgBSDXATYCgAFB4w8h2AFBgAEh2QEgBSDZAWoh2gEg1QEg2AEg2gEQuQEaC0GgASHbASAFINsBaiHcASDcASQADwuGAQEVfyMAIQFBECECIAEgAmshAyADIAA2AgwgAygCDCEEQQAhBSAEIQYgBSEHIAYgB0chCEEAIQlBASEKIAggCnEhCyAJIQwCQCALRQ0AIAMoAgwhDSANKAIAIQ5BBCEPIA4hECAPIREgECARRiESIBIhDAsgDCETQQEhFCATIBRxIRUgFQ8LhgEBFX8j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ArwBAkADQCAEKAK8ASGVASAEKALMASGWASCVASGXASCWASGYASCXASCYAUghmQFBASGaASCZASCaAXEhmwEgmwFFDQEgBCgCwAEhnAEgnAEoAhQhnQEgBCCdATYCwAEgBCgCvAEhngFBASGfASCeASCfAWohoAEgBCCgATYCvAEMAAsACyAEKALAASGhASChASgCECGiASAEIKIBNgK4AUEAIaMBIAQgowE2ArQBAkADQCAEKAK0ASGkASAEKALIASGlASCkASGmASClASGnASCmASCnAUghqAFBASGpASCoASCpAXEhqgEgqgFFDQEgBCgCuAEhqwEgqwEoAhQhrAEgBCCsATYCuAEgBCgCtAEhrQFBASGuASCtASCuAWohrwEgBCCvATYCtAEMAAsACyAEKALEASGwASAEKAK4ASGxASCxASCwATYCECAEKAL4ASGyASAEKALEASGzASCyASCzARCjAQwOCyAEKAL4ASG0ASC0ASgCFCG1ASC1AS0AACG2AUH/ASG3ASC2ASC3AXEhuAFBCCG5ASC4ASC5AXQhugEgBCgC+AEhuwEguwEoAhQhvAEgvAEtAAEhvQFB/wEhvgEgvQEgvgFxIb8BILoBIL8BciHAASAEIMABNgKwASAEKAL4ASHBASDBASgCFCHCAUECIcMBIMIBIMMBaiHEASDBASDEATYCFCAEKAL4ASHFASDFASgCHCHGASDGASgCGCHHASAEKAKwASHIAUECIckBIMgBIMkBdCHKASDHASDKAWohywEgywEoAgAhzAEgBCDMATYCrAEgBCgC+AEhzQEgBCgCrAEhzgEgzQEgzgEQnwEhzwEgBCDPATYCqAEgBCgCqAEh0AFBACHRASDQASHSASDRASHTASDSASDTAUch1AFBASHVASDUASDVAXEh1gECQCDWAQ0AIAQoAvgBIdcBIAQoAqwBIdgBINgBKAIQIdkBIAQg2QE2AhBB8gkh2gFBECHbASAEINsBaiHcASDXASDaASDcARCeAQsgBCgC+AEh3QEgBCgCqAEh3gEg3QEg3gEQowEMDQsgBCgC+AEh3wEg3wEoAhQh4AEg4AEtAAAh4QFB/wEh4gEg4QEg4gFxIeMBQQgh5AEg4wEg5AF0IeUBIAQoAvgBIeYBIOYBKAIUIecBIOcBLQABIegBQf8BIekBIOgBIOkBcSHqASDl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CyAAIQIDQCACIAEtAAA6AAAgAUEBaiEBIAJBAWoiAkEDcUUNASACIANJDQALCwJAIANBfHEiBEHAAEkNACACIARBQGoiBUsNAANAIAIgASgCADYCACACIAEoAgQ2AgQgAiABKAIINgIIIAIgASgCDDYCDCACIAEoAhA2AhAgAiABKAIUNgIUIAIgASgCGDYCGCACIAEoAhw2AhwgAiABKAIgNgIgIAIgASgCJDYCJCACIAEoAig2AiggAiABKAIsNgIsIAIgASgCMDYCMCACIAEoAjQ2AjQgAiABKAI4NgI4IAIgASgCPDYCPCABQcAAaiEBIAJBwABqIgIgBU0NAAsLIAIgBE8NAQNAIAIgASgCADYCACABQQRqIQEgAkEEaiICIARJDQAMAgsACwJAIANBBE8NACAAIQIMAQsCQCADQXxqIgQgAE8NACAAIQIMAQsgACECA0AgAiABLQAAOgAAIAIgAS0AAToAASACIAEtAAI6AAIgAiABLQADOgADIAFBBGohASACQQRqIgIgBE0NAAsLAkAgAiADTw0AA0AgAiABLQAAOgAAIAFBAWohASACQQFqIgIgA0cNAAsLIAAL8gICA38BfgJAIAJFDQAgACABOgAAIAIgAGoiA0F/aiABOgAAIAJBA0kNACAAIAE6AAIgACABOgABIANBfWogAToAACADQX5qIAE6AAAgAkEHSQ0AIAAgAToAAyADQXxqIAE6AAAgAkEJSQ0AIABBACAAa0EDcSIEaiIDIAFB/wFxQYGChAhsIgE2AgAgAyACIARrQXxxIgRqIgJBfGogATYCACAEQQlJDQAgAyABNgIIIAMgATYCBCACQXhqIAE2AgAgAkF0aiABNgIAIARBGUkNACADIAE2AhggAyABNgIUIAMgATYCECADIAE2AgwgAkFwaiABNgIAIAJBbGogATYCACACQWhqIAE2AgAgAkFkaiABNgIAIAQgA0EEcUEYciIFayICQSBJDQAgAa1CgYCAgBB+IQYgAyAFaiEBA0AgASAGNwMYIAEgBjcDECABIAY3AwggASAGNwMAIAFBIGohASACQWBqIgJBH0sNAAsLIAALBABBAQsCAAsCAAusAQEFfwJAAkAgACgCTEEATg0AQQEhAQwBCyAAEKwBRSEBCyAAELABIQIgACAAKAIMEQEAIQMCQCABDQAgABCtAQsCQCAALQAAQQFxDQAgABCuARDQASEBAkAgACgCNCIERQ0AIAQgACgCODYCOAsCQCAAKAI4IgVFDQAgBSAENgI0CwJAIAEoAgAgAEcNACABIAU2AgALENEBIAAoAmAQlAIgABCUAgsgAyACcgu5AgEDfwJAIAANAEEAIQECQEEAKALQYkUNAEEAKALQYhCwASEBCwJAQQAoArhhRQ0AQQAoArhhELABIAFyIQELAkAQ0AEoAgAiAEUNAANAQQAhAgJAIAAoAkxBAEgNACAAEKwBIQILAkAgACgCFCAAKAIcRg0AIAAQsAEgAXIhAQsCQCACRQ0AIAAQrQELIAAoAjgiAA0ACwsQ0QEgAQ8LQQAhAgJAIAAoAkxBAEgNACAAEKwBIQILAkACQAJAIAAoAhQgACgCHEYNACAAQQBBACAAKAIkEQAAGiAAKAIUDQBBfyEBIAINAQwCCwJAIAAoAgQiASAAKAIIIgNGDQAgACABIANrrEEBIAAoAigRBwAaC0EAIQEgAEEANgIcIABCADcDECAAQgA3AgQgAkUNAQsgABCtAQsgAQt0AQF/QQIhAQJAIABBKxDbAQ0AIAAtAABB8gBHIQELIAFBgAFyIAEgAEH4ABDbARsiAUGAgCByIAEgAEHlABDbARsiASABQcAAciAALQAAIgBB8gBGGyIBQYAEciABIABB9wBGGyIBQYAIciABIABB4QBGGwsOACAAKAI8IAEgAhDNAQvYAgEHfyMAQSBrIgMkACADIAAoAhwiBDYCECAAKAIUIQUgAyACNgIcIAMgATYCGCADIAUgBGsiATYCFCABIAJqIQZBAiEHIANBEGohAQJAAkACQAJAIAAoAjwgA0EQakECIANBDGoQDhCMAg0AA0AgBiADKAIMIgRGDQIgBEF/TA0DIAEgBCABKAIEIghLIgVBA3RqIgkgCSgCACAEIAhBACAFG2siCGo2AgAgAUEMQQQgBRtqIgkgCSgCACAIazYCACAGIARrIQYgACgCPCABQQhqIAEgBRsiASAHIAVrIgcgA0EMahAOEIwCRQ0ACwsgBkF/Rw0BCyAAIAAoAiwiATYCHCAAIAE2AhQgACABIAAoAjBqNgIQIAIhBAwBC0EAIQQgAEEANgIcIABCADcDECAAIAAoAgBBIHI2AgAgB0ECRg0AIAIgASgCBGshBAsgA0EgaiQAIAQL6AEBBH8jAEEgayIDJAAgAyABNgIQQQAhBCADIAIgACgCMCIFQQBHazYCFCAAKAIsIQYgAyAFNgIcIAMgBjYCGEEgIQUCQAJAAkAgACgCPCADQRBqQQIgA0EMahAPEIwCDQAgAygCDCIFQQBKDQFBIEEQIAUbIQULIAAgACgCACAFcjYCAAwBCwJAIAUgAygCFCIGSw0AIAUhBAwBCyAAIAAoAiwiBDYCBCAAIAQgBSAGa2o2AggCQCAAKAIwRQ0AIAAgBEEBajYCBCACIAFqQX9qIAQtAAA6AAALIAIhBAsgA0EgaiQAIAQLBAAgAAsMACAAKAI8ELUBEBALxgIBAn8jAEEgayICJAACQAJAAkACQEGkDiABLAAAENsBDQAQqQFBHDYCAAwBC0GYCRCTAiIDDQELQQAhAwwBCyADQQBBkAEQqwEaAkAgAUErENsBDQAgA0EIQQQgAS0AAEHyAEYbNgIACwJAAkAgAS0AAEHhAEYNACADKAIAIQEMAQsCQCAAQQNBABAMIgFBgAhxDQAgAiABQYAIcjYCECAAQQQgAkEQahAMGgsgAyADKAIAQYABciIBNgIACyADQX82AlAgA0GACDYCMCADIAA2AjwgAyADQZgBajYCLAJAIAFBCHENACACIAJBGGo2AgAgAEGTqAEgAhANDQAgA0EKNgJQCyADQT02AiggA0E+NgIkIANBPzYCICADQcAANgIMAkBBAC0A5eQIDQAgA0F/NgJMCyADENIBIQMLIAJBIGokACADC3QBA38jAEEQayICJAACQAJAAkBBpA4gASwAABDbAQ0AEKkBQRw2AgAMAQsgARCxASEDIAJBtgM2AgBBACEEIAAgA0GAgAJyIAIQCxD2ASIAQQBIDQEgACABELcBIgQNASAAEBAaC0EAIQQLIAJBEGokACAECygBAX8jAEEQayIDJAAgAyACNgIMIAAgASACEIUCIQIgA0EQaiQAIAILPwEBfwJAENABKAIAIgBFDQADQCAAELsBIAAoAjgiAA0ACwtBACgC3OQIELsBQQAoAtBiELsBQQAoArhhELsBC2IBAn8CQCAARQ0AAkAgACgCTEEASA0AIAAQrAEaCwJAIAAoAhQgACgCHEYNACAAQQBBACAAKAIkEQAAGgsgACgCBCIBIAAoAggiAkYNACAAIAEgAmusQQEgACgCKBEHABoLC4EBAQJ/IAAgACgCSCIBQX9qIAFyNgJIAkAgACgCFCAAKAIcRg0AIABBAEEAIAAoAiQRAAAaCyAAQQA2AhwgAEIANwMQAkAgACgCACIBQQRxRQ0AIAAgAUEgcjYCAEF/DwsgACAAKAIsIAAoAjBqIgI2AgggACACNgIEIAFBG3RBH3UL7gEBBH9BACEEAkAgAygCTEEASA0AIAMQrAEhBAsgAiABbCEFIAMgAygCSCIGQX9qIAZyNgJIAkACQCADKAIEIgYgAygCCCIHRw0AIAUhBgwBCyAAIAYgByAGayIHIAUgByAFSRsiBxCqARogAyADKAIEIAdqNgIEIAUgB2shBiAAIAdqIQALAkAgBkUNAANAAkACQCADELwBDQAgAyAAIAYgAygCIBEAACIHDQELAkAgBEUNACADEK0BCyAFIAZrIAFuDwsgACAHaiEAIAYgB2siBg0ACwsgAkEAIAEbIQACQCAERQ0AIAMQrQELIAALGwEBfwNAIAAgASACEBEiA0F2Rg0ACyADEPYBC48CAQR/IwBBEGsiAyQAIAEQsQEhBEEAIQUCQCACKAJMQQBIDQAgAhCsASEFCyACELABGgJAAkACQAJAAkAgAA0AIAIoAjwhACADIARBv/5fcTYCACAAQQQgAxAMEPYBQQBODQEMAwsgACABELgBIgBFDQICQAJAIAAoAjwiASACKAI8IgZHDQAgAEF/NgI8DAELIAEgBiAEQYCAIHEQvgFBAEgNAgsgAiACKAIAQQFxIAAoAgByNgIAIAIgACgCIDYCICACIAAoAiQ2AiQgAiAAKAIoNgIoIAIgACgCDDYCDCAAEK8BGgsgBUUNAiACEK0BDAILIAAQrwEaCyACEK8BGkEAIQILIANBEGokACACC4oBAQF/AkAgAkEBRw0AIAAoAggiA0UNACABIAMgACgCBGusfSEBCwJAAkAgACgCFCAAKAIcRg0AIABBAEEAIAAoAiQRAAAaIAAoAhRFDQELIABBADYCHCAAQgA3AxAgACABIAIgACgCKBEHAEIAUw0AIABCADcCBCAAIAAoAgBBb3E2AgBBAA8LQX8LPAEBfwJAIAAoAkxBf0oNACAAIAEgAhDAAQ8LIAAQrAEhAyAAIAEgAhDAASECAkAgA0UNACAAEK0BCyACCwwAIAAgAawgAhDBAQuBAQICfwF+IAAoAighAUEBIQICQCAALQAAQYABcUUNAEEBQQIgACgCFCAAKAIcRhshAgsCQCAAQgAgAiABEQcAIgNCAFMNAAJAAkAgACgCCCICRQ0AIABBBGohAAwBCyAAKAIcIgJFDQEgAEEUaiEACyADIAAoAgAgAmusfCEDCyADCzYCAX8BfgJAIAAoAkxBf0oNACAAEMMBDwsgABCsASEBIAAQwwEhAgJAIAFFDQAgABCtAQsgAgslAQF+AkAgABDEASIBQoCAgIAIUw0AEKkBQT02AgBBfw8LIAGnC30BAn8jAEEQayIAJAACQCAAQQxqIABBCGoQEg0AQQAgACgCDEECdEEEahCTAiIBNgLg5AggAUUNAAJAIAAoAggQkwIiAUUNAEEAKALg5AggACgCDEECdGpBADYCAEEAKALg5AggARATRQ0BC0EAQQA2AuDkCAsgAEEQaiQAC4MBAQR/AkAgAEE9ENwBIABrIgENAEEADwtBACECAkAgACABai0AAA0AQQAoAuDkCCIDRQ0AIAMoAgAiBEUNAAJAA0ACQCAAIAQgARDgAQ0AIAMoAgAgAWoiBC0AAEE9Rg0CCyADKAIEIQQgA0EEaiEDIAQNAAwCCwALIARBAWohAgsgAgsOACAAQSByQZ9/akEaSQsKACAAQVBqQQpJCwsAIABBn39qQRpJCxAAIABBIEYgAEF3akEFSXILCwAgAEG/f2pBGkkLOQEBfyMAQRBrIgMkACAAIAEgAkH/AXEgA0EIahC4AhCMAiEAIAMpAwghASADQRBqJABCfyABIAAbCwIACwIACw0AQZzlCBDOAUGg5QgLCQBBnOUIEM8BCzEBAn8gABDQASIBKAIANgI4AkAgASgCACICRQ0AIAIgADYCNAsgASAANgIAENEBIAAL7AEBA39BACECAkBBqAkQkwIiA0UNAAJAQQEQkwIiAg0AIAMQlAJBAA8LIANBAEGQARCrARogA0GQAWoiBEEAQRgQqwEaIAMgATYClAEgAyAANgKQASADIAQ2AlQgAUEANgIAIANCADcDoAEgA0EANgKYASAAIAI2AgAgAyACNgKcASACQQA6AAAgA0F/NgI8IANBBDYCACADQX82AlAgA0GACDYCMCADIANBqAFqNgIsIANBwQA2AiggA0HCADYCJCADQX82AkggA0HDADYCDAJAQQAtAOXkCA0AIANBfzYCTAsgAxDSASECCyACC40BAQF/IwBBEGsiAyQAAkACQCACQQNPDQAgACgCVCEAIANBADYCBCADIAAoAgg2AgggAyAAKAIQNgIMQQAgA0EEaiACQQJ0aigCACICa6wgAVUNAEH/////ByACa60gAVMNACAAIAIgAadqIgI2AgggAq0hAQwBCxCpAUEcNgIAQn8hAQsgA0EQaiQAIAEL8QEBBH8gACgCVCEDAkACQCAAKAIUIAAoAhwiBGsiBUUNACAAIAQ2AhRBACEGIAAgBCAFENUBIAVJDQELAkAgAygCCCIAIAJqIgQgAygCFCIFSQ0AAkAgAygCDCAEQQFqIAVBAXRyQQFyIgAQlQIiBA0AQQAPCyADIAQ2AgwgAygCACAENgIAIAMoAgwgAygCFCIEakEAIAAgBGsQqwEaIAMgADYCFCADKAIIIQALIAMoAgwgAGogASACEKoBGiADIAMoAgggAmoiADYCCAJAIAAgAygCEEkNACADIAA2AhALIAMoAgQgADYCACACIQYLIAYLBABBAAsqAQF/IwBBEGsiAiQAIAIgATYCDEHA4QAgACABEIUCIQEgAkEQaiQAIAELKAEBfyMAQRBrIgMkACADIAI2AgwgACABIAIQiwIhAiADQRBqJAAgAgsEAEEACwQAQgALGgAgACABENwBIgBBACAALQAAIAFB/wFxRhsL5AEBAn8CQAJAIAFB/wFxIgJFDQACQCAAQQNxRQ0AA0AgAC0AACIDRQ0DIAMgAUH/AXFGDQMgAEEBaiIAQQNxDQALCwJAIAAoAgAiA0F/cyADQf/9+3dqcUGAgYKEeHENACACQYGChAhsIQIDQCADIAJzIgNBf3MgA0H//ft3anFBgIGChHhxDQEgACgCBCEDIABBBGohACADQX9zIANB//37d2pxQYCBgoR4cUUNAAsLAkADQCAAIgMtAAAiAkUNASADQQFqIQAgAiABQf8BcUcNAAsLIAMPCyAAIAAQ3wFqDwsgAAtZAQJ/IAEtAAAhAgJAIAAtAAAiA0UNACADIAJB/wFxRw0AA0AgAS0AASECIAAtAAEiA0UNASABQQFqIQEgAEEBaiEAIAMgAkH/AXFGDQALCyADIAJB/wFxawskAQJ/AkAgABDfAUEBaiIBEJMCIgINAEEADwsgAiAAIAEQqgELhwEBA38gACEBAkACQCAAQQNxRQ0AIAAhAQNAIAEtAABFDQIgAUEBaiIBQQNxDQALCwNAIAEiAkEEaiEBIAIoAgAiA0F/cyADQf/9+3dqcUGAgYKEeHFFDQALAkAgA0H/AXENACACIABrDwsDQCACLQABIQMgAkEBaiIBIQIgAw0ACwsgASAAawtwAQN/AkAgAg0AQQAPC0EAIQMCQCAALQAAIgRFDQACQANAIAEtAAAiBUUNASACQX9qIgJFDQEgBEH/AXEgBUcNASABQQFqIQEgAC0AASEEIABBAWohACAEDQAMAgsACyAEIQMLIANB/wFxIAEtAABrC/oBAQF/AkACQAJAIAEgAHNBA3ENACACQQBHIQMCQCABQQNxRQ0AIAJFDQADQCAAIAEtAAAiAzoAACADRQ0EIABBAWohACACQX9qIgJBAEchAyABQQFqIgFBA3FFDQEgAg0ACwsgA0UNASABLQAARQ0CIAJBBEkNAANAIAEoAgAiA0F/cyADQf/9+3dqcUGAgYKEeHENASAAIAM2AgAgAEEEaiEAIAFBBGohASACQXxqIgJBA0sNAAsLIAJFDQADQCAAIAEtAAAiAzoAACADRQ0CIABBAWohACABQQFqIQEgAkF/aiICDQALC0EAIQILIABBACACEKsBGiAACw4AIAAgASACEOEBGiAACy8BAX8gAUH/AXEhAQNAAkAgAg0AQQAPCyAAIAJBf2oiAmoiAy0AACABRw0ACyADCxEAIAAgASAAEN8BQQFqEOMBC0EBAn8jAEEQayIBJABBfyECAkAgABC8AQ0AIAAgAUEPakEBIAAoAiARAABBAUcNACABLQAPIQILIAFBEGokACACC0cBAn8gACABNwNwIAAgACgCLCAAKAIEIgJrrDcDeCAAKAIIIQMCQCABUA0AIAMgAmusIAFXDQAgAiABp2ohAwsgACADNgJoC90BAgN/An4gACkDeCAAKAIEIgEgACgCLCICa6x8IQQCQAJAAkAgACkDcCIFUA0AIAQgBVkNAQsgABDlASICQX9KDQEgACgCBCEBIAAoAiwhAgsgAEJ/NwNwIAAgATYCaCAAIAQgAiABa6x8NwN4QX8PCyAEQgF8IQQgACgCBCEBIAAoAgghAwJAIAApA3AiBUIAUQ0AIAUgBH0iBSADIAFrrFkNACABIAWnaiEDCyAAIAM2AmggACAEIAAoAiwiAyABa6x8NwN4AkAgASADSw0AIAFBf2ogAjoAAAsgAguuAQACQAJAIAFBgAhIDQAgAEQAAAAAAADgf6IhAAJAIAFB/w9ODQAgAUGBeGohAQwCCyAARAAAAAAAAOB/oiEAIAFB/RcgAUH9F0gbQYJwaiEBDAELIAFBgXhKDQAgAEQAAAAAAABgA6IhAAJAIAFBuHBMDQAgAUHJB2ohAQwBCyAARAAAAAAAAGADoiEAIAFB8GggAUHwaEobQZIPaiEBCyAAIAFB/wdqrUI0hr+iCzUAIAAgATcDACAAIARCMIinQYCAAnEgAkIwiKdB//8BcXKtQjCGIAJC////////P4OENwMIC+cCAQF/IwBB0ABrIgQkAAJAAkAgA0GAgAFIDQAgBEEgaiABIAJCAEKAgICAgICA//8AEKsCIARBIGpBCGopAwAhAiAEKQMgIQECQCADQf//AU4NACADQYGAf2ohAwwCCyAEQRBqIAEgAkIAQoCAgICAgID//wAQqwIgA0H9/wIgA0H9/wJIG0GCgH5qIQMgBEEQakEIaikDACECIAQpAxAhAQwBCyADQYGAf0oNACAEQcAAaiABIAJCAEKAgICAgICAORCrAiAEQcAAakEIaikDACECIAQpA0AhAQJAIANB9IB+TA0AIANBjf8AaiEDDAELIARBMGogASACQgBCgICAgICAgDkQqwIgA0HogX0gA0HogX1KG0Ga/gFqIQMgBEEwakEIaikDACECIAQpAzAhAQsgBCABIAJCACADQf//AGqtQjCGEKsCIAAgBEEIaikDADcDCCAAIAQpAwA3AwAgBEHQAGokAAtLAgF+An8gAUL///////8/gyECAkACQCABQjCIp0H//wFxIgNB//8BRg0AQQQhBCADDQFBAkEDIAIgAIRQGw8LIAIgAIRQIQQLIAQL2AYCBH8DfiMAQYABayIFJAACQAJAAkAgAyAEQgBCABCdAkUNACADIAQQ6wFFDQAgAkIwiKciBkH//wFxIgdB//8BRw0BCyAFQRBqIAEgAiADIAQQqwIgBSAFKQMQIgQgBUEQakEIaikDACIDIAQgAxCfAiAFQQhqKQMAIQIgBSkDACEEDAELAkAgASAHrUIwhiACQv///////z+DhCIJIAMgBEIwiKdB//8BcSIIrUIwhiAEQv///////z+DhCIKEJ0CQQBKDQACQCABIAkgAyAKEJ0CRQ0AIAEhBAwCCyAFQfAAaiABIAJCAEIAEKsCIAVB+ABqKQMAIQIgBSkDcCEEDAELAkACQCAHRQ0AIAEhBAwBCyAFQeAAaiABIAlCAEKAgICAgIDAu8AAEKsCIAVB6ABqKQMAIglCMIinQYh/aiEHIAUpA2AhBAsCQCAIDQAgBUHQAGogAyAKQgBCgICAgICAwLvAABCrAiAFQdgAaikDACIKQjCIp0GIf2ohCCAFKQNQIQMLIApC////////P4NCgICAgICAwACEIQsgCUL///////8/g0KAgICAgIDAAIQhCQJAIAcgCEwNAANAAkACQCAJIAt9IAQgA1StfSIKQgBTDQACQCAKIAQgA30iBIRCAFINACAFQSBqIAEgAkIAQgAQqwIgBUEoaikDACECIAUpAyAhBAwFCyAKQgGGIARCP4iEIQkMAQsgCUIBhiAEQj+IhCEJCyAEQgGGIQQgB0F/aiIHIAhKDQALIAghBwsCQAJAIAkgC30gBCADVK19IgpCAFkNACAJIQoMAQsgCiAEIAN9IgSEQgBSDQAgBUEwaiABIAJCAEIAEKsCIAVBOGopAwAhAiAFKQMwIQQMAQsCQCAKQv///////z9WDQADQCAEQj+IIQMgB0F/aiEHIARCAYYhBCADIApCAYaEIgpCgICAgICAwABUDQALCyAGQYCAAnEhCAJAIAdBAEoNACAFQcAAaiAEIApC////////P4MgB0H4AGogCHKtQjCGhEIAQoCAgICAgMDDPxCrAiAFQcgAaikDACECIAUpA0AhBAwBCyAKQv///////z+DIAcgCHKtQjCGhCECCyAAIAQ3AwAgACACNwMIIAVBgAFqJAALHAAgACACQv///////////wCDNwMIIAAgATcDAAuOCQIGfwN+IwBBMGsiBCQAQgAhCgJAAkAgAkECSw0AIAFBBGohBSACQQJ0IgJBrNwAaigCACEGIAJBoNwAaigCACEHA0ACQAJAIAEoAgQiAiABKAJoRg0AIAUgAkEBajYCACACLQAAIQIMAQsgARDnASECCyACEMsBDQALQQEhCAJAAkAgAkFVag4DAAEAAQtBf0EBIAJBLUYbIQgCQCABKAIEIgIgASgCaEYNACAFIAJBAWo2AgAgAi0AACECDAELIAEQ5wEhAgtBACEJAkACQAJAA0AgAkEgciAJQYAIaiwAAEcNAQJAIAlBBksNAAJAIAEoAgQiAiABKAJoRg0AIAUgAkEBajYCACACLQAAIQIMAQsgARDnASECCyAJQQFqIglBCEcNAAwCCwALAkAgCUEDRg0AIAlBCEYNASAJQQRJDQIgA0UNAiAJQQhGDQELAkAgASkDcCIKQgBTDQAgBSAFKAIAQX9qNgIACyADRQ0AIAlBBEkNACAKQgBTIQEDQAJAIAENACAFIAUoAgBBf2o2AgALIAlBf2oiCUEDSw0ACwsgBCAIskMAAIB/lBClAiAEQQhqKQMAIQsgBCkDACEKDAILAkACQAJAIAkNAEEAIQkDQCACQSByIAlB/gpqLAAARw0BAkAgCUEBSw0AAkAgASgCBCICIAEoAmhGDQAgBSACQQFqNgIAIAItAAAhAgwBCyABEOcBIQILIAlBAWoiCUEDRw0ADAILAAsCQAJAIAkOBAABAQIBCwJAIAJBMEcNAAJAAkAgASgCBCIJIAEoAmhGDQAgBSAJQQFqNgIAIAktAAAhCQwBCyABEOcBIQkLAkAgCUFfcUHYAEcNACAEQRBqIAEgByAGIAggAxDvASAEQRhqKQMAIQsgBCkDECEKDAYLIAEpA3BCAFMNACAFIAUoAgBBf2o2AgALIARBIGogASACIAcgBiAIIAMQ8AEgBEEoaikDACELIAQpAyAhCgwEC0IAIQoCQCABKQNwQgBTDQAgBSAFKAIAQX9qNgIACxCpAUEcNgIADAELAkACQCABKAIEIgIgASgCaEYNACAFIAJBAWo2AgAgAi0AACECDAELIAEQ5wEhAgsCQAJAIAJBKEcNAEEBIQkMAQtCACEKQoCAgICAgOD//wAhCyABKQNwQgBTDQMgBSAFKAIAQX9qNgIADAMLA0ACQAJAIAEoAgQiAiABKAJoRg0AIAUgAkEBajYCACACLQAAIQIMAQsgARDnASECCyACQb9/aiEIAkACQCACQVBqQQpJDQAgCEEaSQ0AIAJBn39qIQggAkHfAEYNACAIQRpPDQELIAlBAWohCQwBCwtCgICAgICA4P//ACELIAJBKUYNAgJAIAEpA3AiDEIAUw0AIAUgBSgCAEF/ajYCAAsCQAJAIANFDQAgCQ0BQgAhCgwECxCpAUEcNgIAQgAhCgwBCwNAIAlBf2ohCQJAIAxCAFMNACAFIAUoAgBBf2o2AgALQgAhCiAJDQAMAwsACyABIAoQ5gELQgAhCwsgACAKNwMAIAAgCzcDCCAEQTBqJAALzA8CCH8HfiMAQbADayIGJAACQAJAIAEoAgQiByABKAJoRg0AIAEgB0EBajYCBCAHLQAAIQcMAQsgARDnASEHC0EAIQhCACEOQQAhCQJAAkACQANAAkAgB0EwRg0AIAdBLkcNBCABKAIEIgcgASgCaEYNAiABIAdBAWo2AgQgBy0AACEHDAMLAkAgASgCBCIHIAEoAmhGDQBBASEJIAEgB0EBajYCBCAHLQAAIQcMAQtBASEJIAEQ5wEhBwwACwALIAEQ5wEhBwtBASEIQgAhDiAHQTBHDQADQAJAAkAgASgCBCIHIAEoAmhGDQAgASAHQQFqNgIEIActAAAhBwwBCyABEOcBIQcLIA5Cf3whDiAHQTBGDQALQQEhCEEBIQkLQoCAgICAgMD/PyEPQQAhCkIAIRBCACERQgAhEkEAIQtCACETAkACQANAIAdBIHIhDAJAAkAgB0FQaiINQQpJDQACQCAMQZ9/akEGSQ0AIAdBLkcNBQsgB0EuRw0AIAgNA0EBIQggEyEODAELIAxBqX9qIA0gB0E5ShshBwJAAkAgE0IHVQ0AIAcgCkEEdGohCgwBCwJAIBNCHFUNACAGQTBqIAcQpgIgBkEgaiASIA9CAEKAgICAgIDA/T8QqwIgBkEQaiAGKQMgIhIgBkEgakEIaikDACIPIAYpAzAgBkEwakEIaikDABCrAiAGIBAgESAGKQMQIAZBEGpBCGopAwAQmwIgBkEIaikDACERIAYpAwAhEAwBCyAHRQ0AIAsNACAGQdAAaiASIA9CAEKAgICAgICA/z8QqwIgBkHAAGogECARIAYpA1AgBkHQAGpBCGopAwAQmwIgBkHAAGpBCGopAwAhEUEBIQsgBikDQCEQCyATQgF8IRNBASEJCwJAIAEoAgQiByABKAJoRg0AIAEgB0EBajYCBCAHLQAAIQcMAQsgARDnASEHDAALAAtBLiEHCwJAAkAgCQ0AAkACQAJAIAEpA3BCAFMNACABIAEoAgQiB0F/ajYCBCAFRQ0BIAEgB0F+ajYCBCAIRQ0CIAEgB0F9ajYCBAwCCyAFDQELIAFCABDmAQsgBkHgAGogBLdEAAAAAAAAAACiEKQCIAZB6ABqKQMAIRMgBikDYCEQDAELAkAgE0IHVQ0AIBMhDwNAIApBBHQhCiAPQgF8Ig9CCFINAAsLAkACQAJAAkAgB0FfcUHQAEcNACABIAUQ8QEiD0KAgICAgICAgIB/Ug0DAkAgBUUNACABKQNwQn9VDQIMAwtCACEQIAFCABDmAUIAIRMMBAtCACEPIAEpA3BCAFMNAgsgASABKAIEQX9qNgIEC0IAIQ8LAkAgCg0AIAZB8ABqIAS3RAAAAAAAAAAAohCkAiAGQfgAaikDACETIAYpA3AhEAwBCwJAIA4gEyAIG0IChiAPfEJgfCITQQAgA2utVw0AEKkBQcQANgIAIAZBoAFqIAQQpgIgBkGQAWogBikDoAEgBkGgAWpBCGopAwBCf0L///////+///8AEKsCIAZBgAFqIAYpA5ABIAZBkAFqQQhqKQMAQn9C////////v///ABCrAiAGQYABakEIaikDACETIAYpA4ABIRAMAQsCQCATIANBnn5qrFMNAAJAIApBf0wNAANAIAZBoANqIBAgEUIAQoCAgICAgMD/v38QmwIgECARQgBCgICAgICAgP8/EJ4CIQcgBkGQA2ogECARIBAgBikDoAMgB0EASCIBGyARIAZBoANqQQhqKQMAIAEbEJsCIBNCf3whEyAGQZADakEIaikDACERIAYpA5ADIRAgCkEBdCAHQX9KciIKQX9KDQALCwJAAkAgEyADrH1CIHwiDqciB0EAIAdBAEobIAIgDiACrVMbIgdB8QBIDQAgBkGAA2ogBBCmAiAGQYgDaikDACEOQgAhDyAGKQOAAyESQgAhFAwBCyAGQeACakQAAAAAAADwP0GQASAHaxDoARCkAiAGQdACaiAEEKYCIAZB8AJqIAYpA+ACIAZB4AJqQQhqKQMAIAYpA9ACIhIgBkHQAmpBCGopAwAiDhDpASAGQfACakEIaikDACEUIAYpA/ACIQ8LIAZBwAJqIAogB0EgSCAQIBFCAEIAEJ0CQQBHcSAKQQFxRXEiB2oQpwIgBkGwAmogEiAOIAYpA8ACIAZBwAJqQQhqKQMAEKsCIAZBkAJqIAYpA7ACIAZBsAJqQQhqKQMAIA8gFBCbAiAGQaACakIAIBAgBxtCACARIAcbIBIgDhCrAiAGQYACaiAGKQOgAiAGQaACakEIaikDACAGKQOQAiAGQZACakEIaikDABCbAiAGQfABaiAGKQOAAiAGQYACakEIaikDACAPIBQQrQICQCAGKQPwASIQIAZB8AFqQQhqKQMAIhFCAEIAEJ0CDQAQqQFBxAA2AgALIAZB4AFqIBAgESATpxDqASAGQeABakEIaikDACETIAYpA+ABIRAMAQsQqQFBxAA2AgAgBkHQAWogBBCmAiAGQcABaiAGKQPQASAGQdABakEIaikDAEIAQoCAgICAgMAAEKsCIAZBsAFqIAYpA8ABIAZBwAFqQQhqKQMAQgBCgICAgICAwAAQqwIgBkGwAWpBCGopAwAhEyAGKQOwASEQCyAAIBA3AwAgACATNwMIIAZBsANqJAALlyADDH8GfgF8IwBBkMYAayIHJABBACEIQQAgBCADaiIJayEKQgAhE0EAIQsCQAJAAkADQAJAIAJBMEYNACACQS5HDQQgASgCBCICIAEoAmhGDQIgASACQQFqNgIEIAItAAAhAgwDCwJAIAEoAgQiAiABKAJoRg0AQQEhCyABIAJBAWo2AgQgAi0AACECDAELQQEhCyABEOcBIQIMAAsACyABEOcBIQILQQEhCEIAIRMgAkEwRw0AA0ACQAJAIAEoAgQiAiABKAJoRg0AIAEgAkEBajYCBCACLQAAIQIMAQsgARDnASECCyATQn98IRMgAkEwRg0AC0EBIQtBASEIC0EAIQwgB0EANgKQBiACQVBqIQ1CACEUAkACQAJAAkACQAJAAkACQAJAIAJBLkYiDkUNAEEAIQ9BACEQDAELQQAhD0EAIRAgDUEJSw0BCwNAAkACQCAOQQFxRQ0AAkAgCA0AIBQhE0EBIQgMAgsgC0UhDgwECyAUQgF8IRQCQCAPQfwPSg0AIAJBMEYhCyAUpyERIAdBkAZqIA9BAnRqIQ4CQCAMRQ0AIAIgDigCAEEKbGpBUGohDQsgECARIAsbIRAgDiANNgIAQQEhC0EAIAxBAWoiAiACQQlGIgIbIQwgDyACaiEPDAELIAJBMEYNACAHIAcoAoBGQQFyNgKARkHcjwEhEAsCQAJAIAEoAgQiAiABKAJoRg0AIAEgAkEBajYCBCACLQAAIQIMAQsgARDnASECCyACQVBqIQ0gAkEuRiIODQAgDUEKSQ0ACwsgEyAUIAgbIRMCQCALRQ0AIAJBX3FBxQBHDQACQCABIAYQ8QEiFUKAgICAgICAgIB/Ug0AIAZFDQVCACEVIAEpA3BCAFMNACABIAEoAgRBf2o2AgQLIAtFDQMgFSATfCETDAULIAtFIQ4gAkEASA0BCyABKQNwQgBTDQAgASABKAIEQX9qNgIECyAORQ0CCxCpAUEcNgIAC0IAIRQgAUIAEOYBQgAhEwwBCwJAIAcoApAGIgENACAHIAW3RAAAAAAAAAAAohCkAiAHQQhqKQMAIRMgBykDACEUDAELAkAgFEIJVQ0AIBMgFFINAAJAIANBHkoNACABIAN2DQELIAdBMGogBRCmAiAHQSBqIAEQpwIgB0EQaiAHKQMwIAdBMGpBCGopAwAgBykDICAHQSBqQQhqKQMAEKsCIAdBEGpBCGopAwAhEyAHKQMQIRQMAQsCQCATIARBfm2tVw0AEKkBQcQANgIAIAdB4ABqIAUQpgIgB0HQAGogBykDYCAHQeAAakEIaikDAEJ/Qv///////7///wAQqwIgB0HAAGogBykDUCAHQdAAakEIaikDAEJ/Qv///////7///wAQqwIgB0HAAGpBCGopAwAhEyAHKQNAIRQMAQsCQCATIARBnn5qrFkNABCpAUHEADYCACAHQZABaiAFEKYCIAdBgAFqIAcpA5ABIAdBkAFqQQhqKQMAQgBCgICAgICAwAAQqwIgB0HwAGogBykDgAEgB0GAAWpBCGopAwBCAEKAgICAgIDAABCrAiAHQfAAakEIaikDACETIAcpA3AhFAwBCwJAIAxFDQACQCAMQQhKDQAgB0GQBmogD0ECdGoiAigCACEBA0AgAUEKbCEBIAxBAWoiDEEJRw0ACyACIAE2AgALIA9BAWohDwsgE6chCAJAIBBBCU4NACAQIAhKDQAgCEERSg0AAkAgCEEJRw0AIAdBwAFqIAUQpgIgB0GwAWogBygCkAYQpwIgB0GgAWogBykDwAEgB0HAAWpBCGopAwAgBykDsAEgB0GwAWpBCGopAwAQqwIgB0GgAWpBCGopAwAhEyAHKQOgASEUDAILAkAgCEEISg0AIAdBkAJqIAUQpgIgB0GAAmogBygCkAYQpwIgB0HwAWogBykDkAIgB0GQAmpBCGopAwAgBykDgAIgB0GAAmpBCGopAwAQqwIgB0HgAWpBCCAIa0ECdEGA3ABqKAIAEKYCIAdB0AFqIAcpA/ABIAdB8AFqQQhqKQMAIAcpA+ABIAdB4AFqQQhqKQMAEJ8CIAdB0AFqQQhqKQMAIRMgBykD0AEhFAwCCyAHKAKQBiEBAkAgAyAIQX1sakEbaiICQR5KDQAgASACdg0BCyAHQeACaiAFEKYCIAdB0AJqIAEQpwIgB0HAAmogBykD4AIgB0HgAmpBCGopAwAgBykD0AIgB0HQAmpBCGopAwAQqwIgB0GwAmogCEECdEHY2wBqKAIAEKYCIAdBoAJqIAcpA8ACIAdBwAJqQQhqKQMAIAcpA7ACIAdBsAJqQQhqKQMAEKsCIAdBoAJqQQhqKQMAIRMgBykDoAIhFAwBCwNAIAdBkAZqIA8iAkF/aiIPQQJ0aigCAEUNAAtBACEMAkACQCAIQQlvIgENAEEAIQ4MAQsgASABQQlqIAhBf0obIQYCQAJAIAINAEEAIQ5BACECDAELQYCU69wDQQggBmtBAnRBgNwAaigCACILbSERQQAhDUEAIQFBACEOA0AgB0GQBmogAUECdGoiDyAPKAIAIg8gC24iECANaiINNgIAIA5BAWpB/w9xIA4gASAORiANRXEiDRshDiAIQXdqIAggDRshCCARIA8gECALbGtsIQ0gAUEBaiIBIAJHDQALIA1FDQAgB0GQBmogAkECdGogDTYCACACQQFqIQILIAggBmtBCWohCAsDQCAHQZAGaiAOQQJ0aiEQAkADQAJAIAhBJEgNACAIQSRHDQIgECgCAEHR6fkETw0CCyACQf8PaiELQQAhDQNAAkACQCAHQZAGaiALQf8PcSIBQQJ0aiILNQIAQh2GIA2tfCITQoGU69wDWg0AQQAhDQwBCyATIBNCgJTr3AOAIhRCgJTr3AN+fSETIBSnIQ0LIAsgE6ciDzYCACACIAIgAiABIA8bIAEgDkYbIAEgAkF/akH/D3FHGyECIAFBf2ohCyABIA5HDQALIAxBY2ohDCANRQ0ACwJAIA5Bf2pB/w9xIg4gAkcNACAHQZAGaiACQf4PakH/D3FBAnRqIgEgASgCACAHQZAGaiACQX9qQf8PcSIBQQJ0aigCAHI2AgAgASECCyAIQQlqIQggB0GQBmogDkECdGogDTYCAAwBCwsCQANAIAJBAWpB/w9xIQYgB0GQBmogAkF/akH/D3FBAnRqIRIDQEEJQQEgCEEtShshDwJAA0AgDiELQQAhAQJAAkADQCABIAtqQf8PcSIOIAJGDQEgB0GQBmogDkECdGooAgAiDiABQQJ0QfDbAGooAgAiDUkNASAOIA1LDQIgAUEBaiIBQQRHDQALCyAIQSRHDQBCACETQQAhAUIAIRQDQAJAIAEgC2pB/w9xIg4gAkcNACACQQFqQf8PcSICQQJ0IAdBkAZqakF8akEANgIACyAHQYAGaiATIBRCAEKAgICA5Zq3jsAAEKsCIAdB8AVqIAdBkAZqIA5BAnRqKAIAEKcCIAdB4AVqIAcpA4AGIAdBgAZqQQhqKQMAIAcpA/AFIAdB8AVqQQhqKQMAEJsCIAdB4AVqQQhqKQMAIRQgBykD4AUhEyABQQFqIgFBBEcNAAsgB0HQBWogBRCmAiAHQcAFaiATIBQgBykD0AUgB0HQBWpBCGopAwAQqwIgB0HABWpBCGopAwAhFEIAIRMgBykDwAUhFSAMQfEAaiINIARrIgFBACABQQBKGyADIAEgA0giCBsiDkHwAEwNAkIAIRZCACEXQgAhGAwFCyAPIAxqIQwgAiEOIAsgAkYNAAtBgJTr3AMgD3YhEEF/IA90QX9zIRFBACEBIAshDgNAIAdBkAZqIAtBAnRqIg0gDSgCACINIA92IAFqIgE2AgAgDkEBakH/D3EgDiALIA5GIAFFcSIBGyEOIAhBd2ogCCABGyEIIA0gEXEgEGwhASALQQFqQf8PcSILIAJHDQALIAFFDQECQCAGIA5GDQAgB0GQBmogAkECdGogATYCACAGIQIMAwsgEiASKAIAQQFyNgIAIAYhDgwBCwsLIAdBkAVqRAAAAAAAAPA/QeEBIA5rEOgBEKQCIAdBsAVqIAcpA5AFIAdBkAVqQQhqKQMAIBUgFBDpASAHQbAFakEIaikDACEYIAcpA7AFIRcgB0GABWpEAAAAAAAA8D9B8QAgDmsQ6AEQpAIgB0GgBWogFSAUIAcpA4AFIAdBgAVqQQhqKQMAEOwBIAdB8ARqIBUgFCAHKQOgBSITIAdBoAVqQQhqKQMAIhYQrQIgB0HgBGogFyAYIAcpA/AEIAdB8ARqQQhqKQMAEJsCIAdB4ARqQQhqKQMAIRQgBykD4AQhFQsCQCALQQRqQf8PcSIPIAJGDQACQAJAIAdBkAZqIA9BAnRqKAIAIg9B/8m17gFLDQACQCAPDQAgC0EFakH/D3EgAkYNAgsgB0HwA2ogBbdEAAAAAAAA0D+iEKQCIAdB4ANqIBMgFiAHKQPwAyAHQfADakEIaikDABCbAiAHQeADakEIaikDACEWIAcpA+ADIRMMAQsCQCAPQYDKte4BRg0AIAdB0ARqIAW3RAAAAAAAAOg/ohCkAiAHQcAEaiATIBYgBykD0AQgB0HQBGpBCGopAwAQmwIgB0HABGpBCGopAwAhFiAHKQPABCETDAELIAW3IRkCQCALQQVqQf8PcSACRw0AIAdBkARqIBlEAAAAAAAA4D+iEKQCIAdBgARqIBMgFiAHKQOQBCAHQZAEakEIaikDABCbAiAHQYAEakEIaikDACEWIAcpA4AEIRMMAQsgB0GwBGogGUQAAAAAAADoP6IQpAIgB0GgBGogEyAWIAcpA7AEIAdBsARqQQhqKQMAEJsCIAdBoARqQQhqKQMAIRYgBykDoAQhEwsgDkHvAEoNACAHQdADaiATIBZCAEKAgICAgIDA/z8Q7AEgBykD0AMgB0HQA2pBCGopAwBCAEIAEJ0CDQAgB0HAA2ogEyAWQgBCgICAgICAwP8/EJsCIAdBwANqQQhqKQMAIRYgBykDwAMhEwsgB0GwA2ogFSAUIBMgFhCbAiAHQaADaiAHKQOwAyAHQbADakEIaikDACAXIBgQrQIgB0GgA2pBCGopAwAhFCAHKQOgAyEVAkAgDUH/////B3FBfiAJa0wNACAHQZADaiAVIBQQ7QEgB0GAA2ogFSAUQgBCgICAgICAgP8/EKsCIAcpA5ADIhcgB0GQA2pBCGopAwAiGEIAQoCAgICAgIC4wAAQngIhAiAUIAdBgANqQQhqKQMAIAJBAEgiDRshFCAVIAcpA4ADIA0bIRUCQCAMIAJBf0pqIgxB7gBqIApKDQAgCCAIIA4gAUdxIBcgGEIAQoCAgICAgIC4wAAQngJBAEgbQQFHDQEgEyAWQgBCABCdAkUNAQsQqQFBxAA2AgALIAdB8AJqIBUgFCAMEOoBIAdB8AJqQQhqKQMAIRMgBykD8AIhFAsgACAUNwMAIAAgEzcDCCAHQZDGAGokAAu3BAIEfwF+AkACQCAAKAIEIgIgACgCaEYNACAAIAJBAWo2AgQgAi0AACECDAELIAAQ5wEhAgsCQAJAAkAgAkFVag4DAQABAAsgAkFQaiEDQQAhBAwBCwJAAkAgACgCBCIFIAAoAmhGDQAgACAFQQFqNgIEIAUtAAAhBQwBCyAAEOcBIQULIAJBLUYhBAJAIAVBUGoiA0EKSQ0AIAFFDQAgACkDcEIAUw0AIAAgACgCBEF/ajYCBAsgBSECCwJAAkAgA0EKTw0AQQAhBQNAIAIgBUEKbGohBQJAAkAgACgCBCICIAAoAmhGDQAgACACQQFqNgIEIAItAAAhAgwBCyAAEOcBIQILIAVBUGohBQJAIAJBUGoiA0EJSw0AIAVBzJmz5gBIDQELCyAFrCEGAkAgA0EKTw0AA0AgAq0gBkIKfnwhBgJAAkAgACgCBCICIAAoAmhGDQAgACACQQFqNgIEIAItAAAhAgwBCyAAEOcBIQILIAZCUHwhBiACQVBqIgNBCUsNASAGQq6PhdfHwuujAVMNAAsLAkAgA0EKTw0AA0ACQAJAIAAoAgQiAiAAKAJoRg0AIAAgAkEBajYCBCACLQAAIQIMAQsgABDnASECCyACQVBqQQpJDQALCwJAIAApA3BCAFMNACAAIAAoAgRBf2o2AgQLQgAgBn0gBiAEGyEGDAELQoCAgICAgICAgH8hBiAAKQNwQgBTDQAgACAAKAIEQX9qNgIEQoCAgICAgICAgH8PCyAGC4YBAgF/An4jAEGgAWsiBCQAIAQgATYCPCAEIAE2AhQgBEF/NgIYIARBEGpCABDmASAEIARBEGogA0EBEO4BIARBCGopAwAhBSAEKQMAIQYCQCACRQ0AIAIgASAEKAIUIAQoAogBaiAEKAI8a2o2AgALIAAgBjcDACAAIAU3AwggBEGgAWokAAs1AgF/AXwjAEEQayICJAAgAiAAIAFBARDyASACKQMAIAJBCGopAwAQrgIhAyACQRBqJAAgAwu3BAIHfwR+IwBBEGsiBCQAAkACQAJAAkAgAkEkSg0AQQAhBSAALQAAIgYNASAAIQcMAgsQqQFBHDYCAEIAIQMMAgsgACEHAkADQCAGQRh0QRh1EMsBRQ0BIActAAEhBiAHQQFqIgghByAGDQALIAghBwwBCwJAIActAAAiBkFVag4DAAEAAQtBf0EAIAZBLUYbIQUgB0EBaiEHCwJAAkAgAkFvcQ0AIActAABBMEcNAEEBIQkCQCAHLQABQd8BcUHYAEcNACAHQQJqIQdBECEKDAILIAdBAWohByACQQggAhshCgwBCyACQQogAhshCkEAIQkLIAqsIQtBACECQgAhDAJAA0BBUCEGAkAgBywAACIIQVBqQf8BcUEKSQ0AQal/IQYgCEGff2pB/wFxQRpJDQBBSSEGIAhBv39qQf8BcUEZSw0CCyAGIAhqIgggCk4NASAEIAtCACAMQgAQrAJBASEGAkAgBCkDCEIAUg0AIAwgC34iDSAIrCIOQn+FVg0AIA0gDnwhDEEBIQkgAiEGCyAHQQFqIQcgBiECDAALAAsCQCABRQ0AIAEgByAAIAkbNgIACwJAAkACQCACRQ0AEKkBQcQANgIAIAVBACADQgGDIgtQGyEFIAMhDAwBCyAMIANUDQEgA0IBgyELCwJAIAtCAFINACAFDQAQqQFBxAA2AgAgA0J/fCEDDAILIAwgA1gNABCpAUHEADYCAAwBCyAMIAWsIguFIAt9IQMLIARBEGokACADCxIAIAAgASACQoCAgIAIEPQBpwseAAJAIABBgWBJDQAQqQFBACAAazYCAEF/IQALIAALXAEBfyAAIAAoAkgiAUF/aiABcjYCSAJAIAAoAgAiAUEIcUUNACAAIAFBIHI2AgBBfw8LIABCADcCBCAAIAAoAiwiATYCHCAAIAE2AhQgACABIAAoAjBqNgIQQQAL5QEBAn8gAkEARyEDAkACQAJAIABBA3FFDQAgAkUNACABQf8BcSEEA0AgAC0AACAERg0CIAJBf2oiAkEARyEDIABBAWoiAEEDcUUNASACDQALCyADRQ0BCwJAIAAtAAAgAUH/AXFGDQAgAkEESQ0AIAFB/wFxQYGChAhsIQQDQCAAKAIAIARzIgNBf3MgA0H//ft3anFBgIGChHhxDQEgAEEEaiEAIAJBfGoiAkEDSw0ACwsgAkUNACABQf8BcSEDA0ACQCAALQAAIANHDQAgAA8LIABBAWohACACQX9qIgINAAsLQQALFwEBfyAAQQAgARD4ASICIABrIAEgAhsLjwECAX4BfwJAIAC9IgJCNIinQf8PcSIDQf8PRg0AAkAgAw0AAkACQCAARAAAAAAAAAAAYg0AQQAhAwwBCyAARAAAAAAAAPBDoiABEPoBIQAgASgCAEFAaiEDCyABIAM2AgAgAA8LIAEgA0GCeGo2AgAgAkL/////////h4B/g0KAgICAgICA8D+EvyEACyAAC84BAQN/AkACQCACKAIQIgMNAEEAIQQgAhD3AQ0BIAIoAhAhAwsCQCADIAIoAhQiBWsgAU8NACACIAAgASACKAIkEQAADwsCQAJAIAIoAlBBAE4NAEEAIQMMAQsgASEEA0ACQCAEIgMNAEEAIQMMAgsgACADQX9qIgRqLQAAQQpHDQALIAIgACADIAIoAiQRAAAiBCADSQ0BIAAgA2ohACABIANrIQEgAigCFCEFCyAFIAAgARCqARogAiACKAIUIAFqNgIUIAMgAWohBAsgBAuCAwEEfyMAQdABayIFJAAgBSACNgLMAUEAIQYgBUGgAWpBAEEoEKsBGiAFIAUoAswBNgLIAQJAAkBBACABIAVByAFqIAVB0ABqIAVBoAFqIAMgBBD9AUEATg0AQX8hAQwBCwJAIAAoAkxBAEgNACAAEKwBIQYLIAAoAgAhBwJAIAAoAkhBAEoNACAAIAdBX3E2AgALAkACQAJAAkAgACgCMA0AIABB0AA2AjAgAEEANgIcIABCADcDECAAKAIsIQggACAFNgIsDAELQQAhCCAAKAIQDQELQX8hAiAAEPcBDQELIAAgASAFQcgBaiAFQdAAaiAFQaABaiADIAQQ/QEhAgsgB0EgcSEBAkAgCEUNACAAQQBBACAAKAIkEQAAGiAAQQA2AjAgACAINgIsIABBADYCHCAAQQA2AhAgACgCFCEDIABBADYCFCACQX8gAxshAgsgACAAKAIAIgMgAXI2AgBBfyACIANBIHEbIQEgBkUNACAAEK0BCyAFQdABaiQAIAELnRMCEX8BfiMAQdAAayIHJAAgByABNgJMIAdBN2ohCCAHQThqIQlBACEKQQAhC0EAIQECQAJAAkACQANAIAFB/////wcgC2tKDQEgASALaiELIAcoAkwiDCEBAkACQAJAAkACQCAMLQAAIg1FDQADQAJAAkACQCANQf8BcSINDQAgASENDAELIA1BJUcNASABIQ0DQCABLQABQSVHDQEgByABQQJqIg42AkwgDUEBaiENIAEtAAIhDyAOIQEgD0ElRg0ACwsgDSAMayIBQf////8HIAtrIg1KDQgCQCAARQ0AIAAgDCABEP4BCyABDQdBfyEQQQEhDiAHKAJMLAABEMkBIQ8gBygCTCEBAkAgD0UNACABLQACQSRHDQAgASwAAUFQaiEQQQEhCkEDIQ4LIAcgASAOaiIBNgJMQQAhEQJAAkAgASwAACISQWBqIg9BH00NACABIQ4MAQtBACERIAEhDkEBIA90Ig9BidEEcUUNAANAIAcgAUEBaiIONgJMIA8gEXIhESABLAABIhJBYGoiD0EgTw0BIA4hAUEBIA90Ig9BidEEcQ0ACwsCQAJAIBJBKkcNAAJAAkAgDiwAARDJAUUNACAHKAJMIg4tAAJBJEcNACAOLAABQQJ0IARqQcB+akEKNgIAIA5BA2ohASAOLAABQQN0IANqQYB9aigCACETQQEhCgwBCyAKDQZBACEKQQAhEwJAIABFDQAgAiACKAIAIgFBBGo2AgAgASgCACETCyAHKAJMQQFqIQELIAcgATYCTCATQX9KDQFBACATayETIBFBgMAAciERDAELIAdBzABqEP8BIhNBAEgNCSAHKAJMIQELQQAhDkF/IRQCQAJAIAEtAABBLkYNAEEAIRUMAQsCQCABLQABQSpHDQACQAJAIAEsAAIQyQFFDQAgBygCTCIPLQADQSRHDQAgDywAAkECdCAEakHAfmpBCjYCACAPQQRqIQEgDywAAkEDdCADakGAfWooAgAhFAwBCyAKDQYCQAJAIAANAEEAIRQMAQsgAiACKAIAIgFBBGo2AgAgASgCACEUCyAHKAJMQQJqIQELIAcgATYCTCAUQX9zQR92IRUMAQsgByABQQFqNgJMQQEhFSAHQcwAahD/ASEUIAcoAkwhAQsDQCAOIQ9BHCEWIAEsAABBv39qQTlLDQogByABQQFqIhI2AkwgASwAACEOIBIhASAOIA9BOmxqQf/bAGotAAAiDkF/akEISQ0ACwJAAkACQCAOQRtGDQAgDkUNDAJAIBBBAEgNACAEIBBBAnRqIA42AgAgByADIBBBA3RqKQMANwNADAILIABFDQkgB0HAAGogDiACIAYQgAIgBygCTCESDAILIBBBf0oNCwtBACEBIABFDQgLIBFB//97cSIXIBEgEUGAwABxGyEOQQAhEUHGCCEQIAkhFgJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAIBJBf2osAAAiAUFfcSABIAFBD3FBA0YbIAEgDxsiAUGof2oOIQQVFRUVFRUVFQ4VDwYODg4VBhUVFRUCBQMVFQkVARUVBAALIAkhFgJAIAFBv39qDgcOFQsVDg4OAAsgAUHTAEYNCQwTC0EAIRFBxgghECAHKQNAIRgMBQtBACEBAkACQAJAAkACQAJAAkAgD0H/AXEOCAABAgMEGwUGGwsgBygCQCALNgIADBoLIAcoAkAgCzYCAAwZCyAHKAJAIAusNwMADBgLIAcoAkAgCzsBAAwXCyAHKAJAIAs6AAAMFgsgBygCQCALNgIADBULIAcoAkAgC6w3AwAMFAsgFEEIIBRBCEsbIRQgDkEIciEOQfgAIQELIAcpA0AgCSABQSBxEIECIQxBACERQcYIIRAgBykDQFANAyAOQQhxRQ0DIAFBBHZBxghqIRBBAiERDAMLQQAhEUHGCCEQIAcpA0AgCRCCAiEMIA5BCHFFDQIgFCAJIAxrIgFBAWogFCABShshFAwCCwJAIAcpA0AiGEJ/VQ0AIAdCACAYfSIYNwNAQQEhEUHGCCEQDAELAkAgDkGAEHFFDQBBASERQccIIRAMAQtByAhBxgggDkEBcSIRGyEQCyAYIAkQgwIhDAsCQCAVRQ0AIBRBAEgNEAsgDkH//3txIA4gFRshDgJAIAcpA0AiGEIAUg0AIBQNACAJIQwgCSEWQQAhFAwNCyAUIAkgDGsgGFBqIgEgFCABShshFAwLC0EAIREgBygCQCIBQeoQIAEbIQwgDCAMQf////8HIBQgFEEASBsQ+QEiAWohFgJAIBRBf0wNACAXIQ4gASEUDAwLIBchDiABIRQgFi0AAA0ODAsLAkAgFEUNACAHKAJAIQ0MAgtBACEBIABBICATQQAgDhCEAgwCCyAHQQA2AgwgByAHKQNAPgIIIAcgB0EIajYCQEF/IRQgB0EIaiENC0EAIQECQANAIA0oAgAiD0UNAQJAIAdBBGogDxCSAiIPQQBIIgwNACAPIBQgAWtLDQAgDUEEaiENIBQgDyABaiIBSw0BDAILCyAMDQ4LQT0hFiABQQBIDQwgAEEgIBMgASAOEIQCAkAgAQ0AQQAhAQwBC0EAIQ8gBygCQCENA0AgDSgCACIMRQ0BIAdBBGogDBCSAiIMIA9qIg8gAUsNASAAIAdBBGogDBD+ASANQQRqIQ0gDyABSQ0ACwsgAEEgIBMgASAOQYDAAHMQhAIgEyABIBMgAUobIQEMCQsCQCAVRQ0AIBRBAEgNCgtBPSEWIAAgBysDQCATIBQgDiABIAUREwAiAUEATg0IDAoLIAcgBykDQDwAN0EBIRQgCCEMIAkhFiAXIQ4MBQsgByABQQFqIg42AkwgAS0AASENIA4hAQwACwALIAANCCAKRQ0DQQEhAQJAA0AgBCABQQJ0aigCACINRQ0BIAMgAUEDdGogDSACIAYQgAJBASELIAFBAWoiAUEKRw0ADAoLAAtBASELIAFBCk8NCANAIAQgAUECdGooAgANAUEBIQsgAUEBaiIBQQpGDQkMAAsAC0EcIRYMBQsgCSEWCyAWIAxrIhIgFCAUIBJIGyIUQf////8HIBFrSg0CQT0hFiARIBRqIg8gEyATIA9IGyIBIA1KDQMgAEEgIAEgDyAOEIQCIAAgECAREP4BIABBMCABIA8gDkGAgARzEIQCIABBMCAUIBJBABCEAiAAIAwgEhD+ASAAQSAgASAPIA5BgMAAcxCEAgwBCwtBACELDAMLQT0hFgsQqQEgFjYCAAtBfyELCyAHQdAAaiQAIAsLGQACQCAALQAAQSBxDQAgASACIAAQ+wEaCwt0AQN/QQAhAQJAIAAoAgAsAAAQyQENAEEADwsDQCAAKAIAIQJBfyEDAkAgAUHMmbPmAEsNAEF/IAIsAABBUGoiAyABQQpsIgFqIANB/////wcgAWtKGyEDCyAAIAJBAWo2AgAgAyEBIAIsAAEQyQENAAsgAwu2BAACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQCABQXdqDhIAAQIFAwQGBwgJCgsMDQ4PEBESCyACIAIoAgAiAUEEajYCACAAIAEoAgA2AgAPCyACIAIoAgAiAUEEajYCACAAIAE0AgA3AwAPCyACIAIoAgAiAUEEajYCACAAIAE1AgA3AwAPCyACIAIoAgAiAUEEajYCACAAIAE0AgA3AwAPCyACIAIoAgAiAUEEajYCACAAIAE1AgA3AwAPCyACIAIoAgBBB2pBeHEiAUEIajYCACAAIAEpAwA3AwAPCyACIAIoAgAiAUEEajYCACAAIAEyAQA3AwAPCyACIAIoAgAiAUEEajYCACAAIAEzAQA3AwAPCyACIAIoAgAiAUEEajYCACAAIAEwAAA3AwAPCyACIAIoAgAiAUEEajYCACAAIAExAAA3AwAPCyACIAIoAgBBB2pBeHEiAUEIajYCACAAIAEpAwA3AwAPCyACIAIoAgAiAUEEajYCACAAIAE1AgA3AwAPCyACIAIoAgBBB2pBeHEiAUEIajYCACAAIAEpAwA3AwAPCyACIAIoAgBBB2pBeHEiAUEIajYCACAAIAEpAwA3AwAPCyACIAIoAgAiAUEEajYCACAAIAE0AgA3AwAPCyACIAIoAgAiAUEEajYCACAAIAE1AgA3AwAPCyACIAIoAgBBB2pBeHEiAUEIajYCACAAIAErAwA5AwAPCyAAIAIgAxEGAAsLPgEBfwJAIABQDQADQCABQX9qIgEgAKdBD3FBkOAAai0AACACcjoAACAAQg9WIQMgAEIEiCEAIAMNAAsLIAELNgEBfwJAIABQDQADQCABQX9qIgEgAKdBB3FBMHI6AAAgAEIHViECIABCA4ghACACDQALCyABC4gBAgF+A38CQAJAIABCgICAgBBaDQAgACECDAELA0AgAUF/aiIBIAAgAEIKgCICQgp+fadBMHI6AAAgAEL/////nwFWIQMgAiEAIAMNAAsLAkAgAqciA0UNAANAIAFBf2oiASADIANBCm4iBEEKbGtBMHI6AAAgA0EJSyEFIAQhAyAFDQALCyABC3MBAX8jAEGAAmsiBSQAAkAgBEGAwARxDQAgAiADTA0AIAUgAUH/AXEgAiADayICQYACIAJBgAJJIgMbEKsBGgJAIAMNAANAIAAgBUGAAhD+ASACQYB+aiICQf8BSw0ACwsgACAFIAIQ/gELIAVBgAJqJAALEQAgACABIAJBxgBBxwAQ/AELpxkDEX8CfgF8IwBBsARrIgYkAEEAIQcgBkEANgIsAkACQCABEIgCIhdCf1UNAEEBIQhB0AghCSABmiIBEIgCIRcMAQsCQCAEQYAQcUUNAEEBIQhB0wghCQwBC0HWCEHRCCAEQQFxIggbIQkgCEUhBwsCQAJAIBdCgICAgICAgPj/AINCgICAgICAgPj/AFINACAAQSAgAiAIQQNqIgogBEH//3txEIQCIAAgCSAIEP4BIABB/gpBww4gBUEgcSILG0G9DEHMDiALGyABIAFiG0EDEP4BIABBICACIAogBEGAwABzEIQCIAIgCiAKIAJIGyEMDAELIAZBEGohDQJAAkACQAJAIAEgBkEsahD6ASIBIAGgIgFEAAAAAAAAAABhDQAgBiAGKAIsIgpBf2o2AiwgBUEgciIOQeEARw0BDAMLIAVBIHIiDkHhAEYNAkEGIAMgA0EASBshDyAGKAIsIRAMAQsgBiAKQWNqIhA2AixBBiADIANBAEgbIQ8gAUQAAAAAAACwQaIhAQsgBkEwaiAGQdACaiAQQQBIGyIRIQsDQAJAAkAgAUQAAAAAAADwQWMgAUQAAAAAAAAAAGZxRQ0AIAGrIQoMAQtBACEKCyALIAo2AgAgC0EEaiELIAEgCrihRAAAAABlzc1BoiIBRAAAAAAAAAAAYg0ACwJAAkAgEEEBTg0AIAshCiARIRIMAQsgESESA0AgEEEdIBBBHUgbIRACQCALQXxqIgogEkkNACAQrSEYQgAhFwNAIAogCjUCACAYhiAXQv////8Pg3wiFyAXQoCU69wDgCIXQoCU69wDfn0+AgAgCkF8aiIKIBJPDQALIBenIgpFDQAgEkF8aiISIAo2AgALAkADQCALIgogEk0NASAKQXxqIgsoAgBFDQALCyAGIAYoAiwgEGsiEDYCLCAKIQsgEEEASg0ACwsgD0EZakEJbiELAkAgEEF/Sg0AIAtBAWohEyAOQeYARiEUA0BBCUEAIBBrIBBBd0gbIQwCQAJAIBIgCk8NAEGAlOvcAyAMdiEVQX8gDHRBf3MhFkEAIRAgEiELA0AgCyALKAIAIgMgDHYgEGo2AgAgAyAWcSAVbCEQIAtBBGoiCyAKSQ0ACyASKAIAIQsgEEUNASAKIBA2AgAgCkEEaiEKDAELIBIoAgAhCwsgBiAGKAIsIAxqIhA2AiwgESASIAtFQQJ0aiISIBQbIgsgE0ECdGogCiAKIAtrQQJ1IBNKGyEKIBBBAEgNAAsLQQAhEAJAIBIgCk8NACARIBJrQQJ1QQlsIRBBCiELIBIoAgAiA0EKSQ0AA0AgEEEBaiEQIAMgC0EKbCILTw0ACwsCQCAPQQAgECAOQeYARhtrIA5B5wBGIA9BAEdxayILIAogEWtBAnVBCWxBd2pODQAgC0GAyABqIgNBCW0iFUECdCARakGEYGohDEEKIQsCQCADIBVBCWxrIgNBB0oNAANAIAtBCmwhCyADQQFqIgNBCEcNAAsLIAxBBGohFgJAAkAgDCgCACIDIAMgC24iEyALbGsiFQ0AIBYgCkYNAQsCQAJAIBNBAXENAEQAAAAAAABAQyEBIAtBgJTr3ANHDQEgDCASTQ0BIAxBfGotAABBAXFFDQELRAEAAAAAAEBDIQELRAAAAAAAAOA/RAAAAAAAAPA/RAAAAAAAAPg/IBYgCkYbRAAAAAAAAPg/IBUgC0EBdiIWRhsgFSAWSRshGQJAIAcNACAJLQAAQS1HDQAgGZohGSABmiEBCyAMIAMgFWsiAzYCACABIBmgIAFhDQAgDCADIAtqIgs2AgACQCALQYCU69wDSQ0AA0AgDEEANgIAAkAgDEF8aiIMIBJPDQAgEkF8aiISQQA2AgALIAwgDCgCAEEBaiILNgIAIAtB/5Pr3ANLDQALCyARIBJrQQJ1QQlsIRBBCiELIBIoAgAiA0EKSQ0AA0AgEEEBaiEQIAMgC0EKbCILTw0ACwsgDEEEaiILIAogCiALSxshCgsCQANAIAoiCyASTSIDDQEgC0F8aiIKKAIARQ0ACwsCQAJAIA5B5wBGDQAgBEEIcSEVDAELIBBBf3NBfyAPQQEgDxsiCiAQSiAQQXtKcSIMGyAKaiEPQX9BfiAMGyAFaiEFIARBCHEiFQ0AQXchCgJAIAMNACALQXxqKAIAIgxFDQBBCiEDQQAhCiAMQQpwDQADQCAKIhVBAWohCiAMIANBCmwiA3BFDQALIBVBf3MhCgsgCyARa0ECdUEJbCEDAkAgBUFfcUHGAEcNAEEAIRUgDyADIApqQXdqIgpBACAKQQBKGyIKIA8gCkgbIQ8MAQtBACEVIA8gECADaiAKakF3aiIKQQAgCkEAShsiCiAPIApIGyEPC0F/IQwgD0H9////B0H+////ByAPIBVyIgobSg0BIA8gCkEARyIUakEBaiEDAkACQCAFQV9xIhNBxgBHDQAgEEH/////ByADa0oNAyAQQQAgEEEAShshCgwBCwJAIA0gECAQQR91IgpqIApzrSANEIMCIgprQQFKDQADQCAKQX9qIgpBMDoAACANIAprQQJIDQALCyAKQX5qIhYgBToAAEF/IQwgCkF/akEtQSsgEEEASBs6AAAgDSAWayIKQf////8HIANrSg0CC0F/IQwgCiADaiIKIAhB/////wdzSg0BIABBICACIAogCGoiBSAEEIQCIAAgCSAIEP4BIABBMCACIAUgBEGAgARzEIQCAkACQAJAAkAgE0HGAEcNACAGQRBqQQhyIQwgBkEQakEJciEQIBEgEiASIBFLGyIDIRIDQCASNQIAIBAQgwIhCgJAAkAgEiADRg0AIAogBkEQak0NAQNAIApBf2oiCkEwOgAAIAogBkEQaksNAAwCCwALIAogEEcNACAGQTA6ABggDCEKCyAAIAogECAKaxD+ASASQQRqIhIgEU0NAAtBACEKIBRFDQIgAEHbEEEBEP4BIBIgC08NASAPQQFIDQEDQAJAIBI1AgAgEBCDAiIKIAZBEGpNDQADQCAKQX9qIgpBMDoAACAKIAZBEGpLDQALCyAAIAogD0EJIA9BCUgbEP4BIA9Bd2ohCiASQQRqIhIgC08NAyAPQQlKIQMgCiEPIAMNAAwDCwALAkAgD0EASA0AIAsgEkEEaiALIBJLGyEMIAZBEGpBCXIhECAGQRBqQQhyIRMgEiELA0ACQCALNQIAIBAQgwIiCiAQRw0AIAZBMDoAGCATIQoLAkACQCALIBJGDQAgCiAGQRBqTQ0BA0AgCkF/aiIKQTA6AAAgCiAGQRBqSw0ADAILAAsgACAKQQEQ/gEgCkEBaiEKAkAgD0EASg0AIBVFDQELIABB2xBBARD+AQsgACAKIBAgCmsiAyAPIA8gA0obEP4BIA8gA2shDyALQQRqIgsgDE8NASAPQX9KDQALCyAAQTAgD0ESakESQQAQhAIgACAWIA0gFmsQ/gEMAgsgDyEKCyAAQTAgCkEJakEJQQAQhAILIABBICACIAUgBEGAwABzEIQCIAIgBSAFIAJIGyEMDAELIAkgBUEadEEfdUEJcWohEwJAIANBC0sNAEEMIANrIgpFDQBEAAAAAAAAMEAhGQNAIBlEAAAAAAAAMECiIRkgCkF/aiIKDQALAkAgEy0AAEEtRw0AIBkgAZogGaGgmiEBDAELIAEgGaAgGaEhAQsCQCAGKAIsIgogCkEfdSIKaiAKc60gDRCDAiIKIA1HDQAgBkEwOgAPIAZBD2ohCgsgCEECciEVIAVBIHEhEiAGKAIsIQsgCkF+aiIWIAVBD2o6AAAgCkF/akEtQSsgC0EASBs6AAAgBEEIcSEQIAZBEGohCwNAIAshCgJAAkAgAZlEAAAAAAAA4EFjRQ0AIAGqIQsMAQtBgICAgHghCwsgCiALQZDgAGotAAAgEnI6AAAgASALt6FEAAAAAAAAMECiIQECQCAKQQFqIgsgBkEQamtBAUcNAAJAIAFEAAAAAAAAAABiDQAgA0EASg0AIBBFDQELIApBLjoAASAKQQJqIQsLIAFEAAAAAAAAAABiDQALQX8hDEH9////ByAVIA0gFmsiEGoiCmsgA0gNAAJAAkAgA0UNACALIAZBEGprIhJBfmogA04NACADQQJqIQsMAQsgCyAGQRBqayISIQsLIABBICACIAogC2oiCiAEEIQCIAAgEyAVEP4BIABBMCACIAogBEGAgARzEIQCIAAgBkEQaiASEP4BIABBMCALIBJrQQBBABCEAiAAIBYgEBD+ASAAQSAgAiAKIARBgMAAcxCEAiACIAogCiACSBshDAsgBkGwBGokACAMCy4BAX8gASABKAIAQQdqQXhxIgJBEGo2AgAgACACKQMAIAJBCGopAwAQrgI5AwALBQAgAL0LngEBAn8jAEGgAWsiBCQAQX8hBSAEIAFBf2pBACABGzYClAEgBCAAIARBngFqIAEbIgA2ApABIARBAEGQARCrASIEQX82AkwgBEHIADYCJCAEQX82AlAgBCAEQZ8BajYCLCAEIARBkAFqNgJUAkACQCABQX9KDQAQqQFBPTYCAAwBCyAAQQA6AAAgBCACIAMQhQIhBQsgBEGgAWokACAFC7EBAQR/AkAgACgCVCIDKAIEIgQgACgCFCAAKAIcIgVrIgYgBCAGSRsiBkUNACADKAIAIAUgBhCqARogAyADKAIAIAZqNgIAIAMgAygCBCAGayIENgIECyADKAIAIQYCQCAEIAIgBCACSRsiBEUNACAGIAEgBBCqARogAyADKAIAIARqIgY2AgAgAyADKAIEIARrNgIECyAGQQA6AAAgACAAKAIsIgM2AhwgACADNgIUIAILEQAgAEH/////ByABIAIQiQILFgACQCAADQBBAA8LEKkBIAA2AgBBfwsEAEEqCwUAEI0CCwYAQbjtCAsXAEEAQYTlCDYCkO4IQQAQjgI2AsjtCAujAgEBf0EBIQMCQAJAIABFDQAgAUH/AE0NAQJAAkAQjwIoAlgoAgANACABQYB/cUGAvwNGDQMQqQFBGTYCAAwBCwJAIAFB/w9LDQAgACABQT9xQYABcjoAASAAIAFBBnZBwAFyOgAAQQIPCwJAAkAgAUGAsANJDQAgAUGAQHFBgMADRw0BCyAAIAFBP3FBgAFyOgACIAAgAUEMdkHgAXI6AAAgACABQQZ2QT9xQYABcjoAAUEDDwsCQCABQYCAfGpB//8/Sw0AIAAgAUE/cUGAAXI6AAMgACABQRJ2QfABcjoAACAAIAFBBnZBP3FBgAFyOgACIAAgAUEMdkE/cUGAAXI6AAFBBA8LEKkBQRk2AgALQX8hAwsgAw8LIAAgAToAAEEBCxUAAkAgAA0AQQAPCyAAIAFBABCRAguVMAELfyMAQRBrIgEkAAJAAkACQAJAAkACQAJAAkACQAJAAkACQCAAQfQBSw0AAkBBACgCqO4IIgJBECAAQQtqQXhxIABBC0kbIgNBA3YiBHYiAEEDcUUNACAAQX9zQQFxIARqIgVBA3QiBkHY7ghqKAIAIgRBCGohAAJAAkAgBCgCCCIDIAZB0O4IaiIGRw0AQQAgAkF+IAV3cTYCqO4IDAELIAMgBjYCDCAGIAM2AggLIAQgBUEDdCIFQQNyNgIEIAQgBWpBBGoiBCAEKAIAQQFyNgIADAwLIANBACgCsO4IIgdNDQECQCAARQ0AAkACQCAAIAR0QQIgBHQiAEEAIABrcnEiAEEAIABrcUF/aiIAIABBDHZBEHEiAHYiBEEFdkEIcSIFIAByIAQgBXYiAEECdkEEcSIEciAAIAR2IgBBAXZBAnEiBHIgACAEdiIAQQF2QQFxIgRyIAAgBHZqIgVBA3QiBkHY7ghqKAIAIgQoAggiACAGQdDuCGoiBkcNAEEAIAJBfiAFd3EiAjYCqO4IDAELIAAgBjYCDCAGIAA2AggLIARBCGohACAEIANBA3I2AgQgBCADaiIGIAVBA3QiCCADayIFQQFyNgIEIAQgCGogBTYCAAJAIAdFDQAgB0EDdiIIQQN0QdDuCGohA0EAKAK87gghBAJAAkAgAkEBIAh0IghxDQBBACACIAhyNgKo7gggAyEIDAELIAMoAgghCAsgAyAENgIIIAggBDYCDCAEIAM2AgwgBCAINgIIC0EAIAY2ArzuCEEAIAU2ArDuCAwMC0EAKAKs7ggiCUUNASAJQQAgCWtxQX9qIgAgAEEMdkEQcSIAdiIEQQV2QQhxIgUgAHIgBCAFdiIAQQJ2QQRxIgRyIAAgBHYiAEEBdkECcSIEciAAIAR2IgBBAXZBAXEiBHIgACAEdmpBAnRB2PAIaigCACIGKAIEQXhxIANrIQQgBiEFAkADQAJAIAUoAhAiAA0AIAVBFGooAgAiAEUNAgsgACgCBEF4cSADayIFIAQgBSAESSIFGyEEIAAgBiAFGyEGIAAhBQwACwALIAYoAhghCgJAIAYoAgwiCCAGRg0AQQAoArjuCCAGKAIIIgBLGiAAIAg2AgwgCCAANgIIDAsLAkAgBkEUaiIFKAIAIgANACAGKAIQIgBFDQMgBkEQaiEFCwNAIAUhCyAAIghBFGoiBSgCACIADQAgCEEQaiEFIAgoAhAiAA0ACyALQQA2AgAMCgtBfyEDIABBv39LDQAgAEELaiIAQXhxIQNBACgCrO4IIgdFDQBBACELAkAgA0GAAkkNAEEfIQsgA0H///8HSw0AIABBCHYiACAAQYD+P2pBEHZBCHEiAHQiBCAEQYDgH2pBEHZBBHEiBHQiBSAFQYCAD2pBEHZBAnEiBXRBD3YgACAEciAFcmsiAEEBdCADIABBFWp2QQFxckEcaiELC0EAIANrIQQCQAJAAkACQCALQQJ0QdjwCGooAgAiBQ0AQQAhAEEAIQgMAQtBACEAIANBAEEZIAtBAXZrIAtBH0YbdCEGQQAhCANAAkAgBSgCBEF4cSADayICIARPDQAgAiEEIAUhCCACDQBBACEEIAUhCCAFIQAMAwsgACAFQRRqKAIAIgIgAiAFIAZBHXZBBHFqQRBqKAIAIgVGGyAAIAIbIQAgBkEBdCEGIAUNAAsLAkAgACAIcg0AQQAhCEECIAt0IgBBACAAa3IgB3EiAEUNAyAAQQAgAGtxQX9qIgAgAEEMdkEQcSIAdiIFQQV2QQhxIgYgAHIgBSAGdiIAQQJ2QQRxIgVyIAAgBXYiAEEBdkECcSIFciAAIAV2IgBBAXZBAXEiBXIgACAFdmpBAnRB2PAIaigCACEACyAARQ0BCwNAIAAoAgRBeHEgA2siAiAESSEGAkAgACgCECIFDQAgAEEUaigCACEFCyACIAQgBhshBCAAIAggBhshCCAFIQAgBQ0ACwsgCEUNACAEQQAoArDuCCADa08NACAIKAIYIQsCQCAIKAIMIgYgCEYNAEEAKAK47gggCCgCCCIASxogACAGNgIMIAYgADYCCAwJCwJAIAhBFGoiBSgCACIADQAgCCgCECIARQ0DIAhBEGohBQsDQCAFIQIgACIGQRRqIgUoAgAiAA0AIAZBEGohBSAGKAIQIgANAAsgAkEANgIADAgLAkBBACgCsO4IIgAgA0kNAEEAKAK87gghBAJAAkAgACADayIFQRBJDQBBACAFNgKw7ghBACAEIANqIgY2ArzuCCAGIAVBAXI2AgQgBCAAaiAFNgIAIAQgA0EDcjYCBAwBC0EAQQA2ArzuCEEAQQA2ArDuCCAEIABBA3I2AgQgACAEakEEaiIAIAAoAgBBAXI2AgALIARBCGohAAwKCwJAQQAoArTuCCIGIANNDQBBACAGIANrIgQ2ArTuCEEAQQAoAsDuCCIAIANqIgU2AsDuCCAFIARBAXI2AgQgACADQQNyNgIEIABBCGohAAwKCwJAAkBBACgCgPIIRQ0AQQAoAojyCCEEDAELQQBCfzcCjPIIQQBCgKCAgICABDcChPIIQQAgAUEMakFwcUHYqtWqBXM2AoDyCEEAQQA2ApTyCEEAQQA2AuTxCEGAICEEC0EAIQAgBCADQS9qIgdqIgJBACAEayILcSIIIANNDQlBACEAAkBBACgC4PEIIgRFDQBBACgC2PEIIgUgCGoiCSAFTQ0KIAkgBEsNCgtBAC0A5PEIQQRxDQQCQAJAAkBBACgCwO4IIgRFDQBB6PEIIQADQAJAIAAoAgAiBSAESw0AIAUgACgCBGogBEsNAwsgACgCCCIADQALC0EAEJoCIgZBf0YNBSAIIQICQEEAKAKE8ggiAEF/aiIEIAZxRQ0AIAggBmsgBCAGakEAIABrcWohAgsgAiADTQ0FIAJB/v///wdLDQUCQEEAKALg8QgiAEUNAEEAKALY8QgiBCACaiIFIARNDQYgBSAASw0GCyACEJoCIgAgBkcNAQwHCyACIAZrIAtxIgJB/v///wdLDQQgAhCaAiIGIAAoAgAgACgCBGpGDQMgBiEACwJAIABBf0YNACADQTBqIAJNDQACQCAHIAJrQQAoAojyCCIEakEAIARrcSIEQf7///8HTQ0AIAAhBgwHCwJAIAQQmgJBf0YNACAEIAJqIQIgACEGDAcLQQAgAmsQmgIaDAQLIAAhBiAAQX9HDQUMAwtBACEIDAcLQQAhBgwFCyAGQX9HDQILQQBBACgC5PEIQQRyNgLk8QgLIAhB/v///wdLDQEgCBCaAiEGQQAQmgIhACAGQX9GDQEgAEF/Rg0BIAYgAE8NASAAIAZrIgIgA0Eoak0NAQtBAEEAKALY8QggAmoiADYC2PEIAkAgAEEAKALc8QhNDQBBACAANgLc8QgLAkACQAJAAkBBACgCwO4IIgRFDQBB6PEIIQADQCAGIAAoAgAiBSAAKAIEIghqRg0CIAAoAggiAA0ADAMLAAsCQAJAQQAoArjuCCIARQ0AIAYgAE8NAQtBACAGNgK47ggLQQAhAEEAIAI2AuzxCEEAIAY2AujxCEEAQX82AsjuCEEAQQAoAoDyCDYCzO4IQQBBADYC9PEIA0AgAEEDdCIEQdjuCGogBEHQ7ghqIgU2AgAgBEHc7ghqIAU2AgAgAEEBaiIAQSBHDQALQQAgBkF4IAZrQQdxQQAgBkEIakEHcRsiAGoiBDYCwO4IQQAgAiAAa0FYaiIANgK07gggBCAAQQFyNgIEIAIgBmpBXGpBKDYCAEEAQQAoApDyCDYCxO4IDAILIAAtAAxBCHENACAFIARLDQAgBiAETQ0AIAAgCCACajYCBEEAIARBeCAEa0EHcUEAIARBCGpBB3EbIgBqIgU2AsDuCEEAQQAoArTuCCACaiIGIABrIgA2ArTuCCAFIABBAXI2AgQgBiAEakEEakEoNgIAQQBBACgCkPIINgLE7ggMAQsCQCAGQQAoArjuCCILTw0AQQAgBjYCuO4IIAYhCwsgBiACaiEIQejxCCEAAkACQAJAAkACQAJAAkADQCAAKAIAIAhGDQEgACgCCCIADQAMAgsACyAALQAMQQhxRQ0BC0Ho8QghAANAAkAgACgCACIFIARLDQAgBSAAKAIEaiIFIARLDQMLIAAoAgghAAwACwALIAAgBjYCACAAIAAoAgQgAmo2AgQgBkF4IAZrQQdxQQAgBkEIakEHcRtqIgIgA0EDcjYCBCAIQXggCGtBB3FBACAIQQhqQQdxG2oiCCACIANqIgNrIQUCQCAEIAhHDQBBACADNgLA7ghBAEEAKAK07gggBWoiADYCtO4IIAMgAEEBcjYCBAwDCwJAQQAoArzuCCAIRw0AQQAgAzYCvO4IQQBBACgCsO4IIAVqIgA2ArDuCCADIABBAXI2AgQgAyAAaiAANgIADAMLAkAgCCgCBCIAQQNxQQFHDQAgAEF4cSEHAkACQCAAQf8BSw0AIAgoAggiBCAAQQN2IgtBA3RB0O4IaiIGRhoCQCAIKAIMIgAgBEcNAEEAQQAoAqjuCEF+IAt3cTYCqO4IDAILIAAgBkYaIAQgADYCDCAAIAQ2AggMAQsgCCgCGCEJAkACQCAIKAIMIgYgCEYNACALIAgoAggiAEsaIAAgBjYCDCAGIAA2AggMAQsCQCAIQRRqIgAoAgAiBA0AIAhBEGoiACgCACIEDQBBACEGDAELA0AgACELIAQiBkEUaiIAKAIAIgQNACAGQRBqIQAgBigCECIEDQALIAtBADYCAAsgCUUNAAJAAkAgCCgCHCIEQQJ0QdjwCGoiACgCACAIRw0AIAAgBjYCACAGDQFBAEEAKAKs7ghBfiAEd3E2AqzuCAwCCyAJQRBBFCAJKAIQIAhGG2ogBjYCACAGRQ0BCyAGIAk2AhgCQCAIKAIQIgBFDQAgBiAANgIQIAAgBjYCGAsgCCgCFCIARQ0AIAZBFGogADYCACAAIAY2AhgLIAcgBWohBSAIIAdqIQgLIAggCCgCBEF+cTYCBCADIAVBAXI2AgQgAyAFaiAFNgIAAkAgBUH/AUsNACAFQQN2IgRBA3RB0O4IaiEAAkACQEEAKAKo7ggiBUEBIAR0IgRxDQBBACAFIARyNgKo7gggACEEDAELIAAoAgghBAsgACADNgIIIAQgAzYCDCADIAA2AgwgAyAENgIIDAMLQR8hAAJAIAVB////B0sNACAFQQh2IgAgAEGA/j9qQRB2QQhxIgB0IgQgBEGA4B9qQRB2QQRxIgR0IgYgBkGAgA9qQRB2QQJxIgZ0QQ92IAAgBHIgBnJrIgBBAXQgBSAAQRVqdkEBcXJBHGohAAsgAyAANgIcIANCADcCECAAQQJ0QdjwCGohBAJAAkBBACgCrO4IIgZBASAAdCIIcQ0AQQAgBiAIcjYCrO4IIAQgAzYCACADIAQ2AhgMAQsgBUEAQRkgAEEBdmsgAEEfRht0IQAgBCgCACEGA0AgBiIEKAIEQXhxIAVGDQMgAEEddiEGIABBAXQhACAEIAZBBHFqQRBqIggoAgAiBg0ACyAIIAM2AgAgAyAENgIYCyADIAM2AgwgAyADNgIIDAILQQAgBkF4IAZrQQdxQQAgBkEIakEHcRsiAGoiCzYCwO4IQQAgAiAAa0FYaiIANgK07gggCyAAQQFyNgIEIAhBXGpBKDYCAEEAQQAoApDyCDYCxO4IIAQgBUEnIAVrQQdxQQAgBUFZakEHcRtqQVFqIgAgACAEQRBqSRsiCEEbNgIEIAhBEGpBACkC8PEINwIAIAhBACkC6PEINwIIQQAgCEEIajYC8PEIQQAgAjYC7PEIQQAgBjYC6PEIQQBBADYC9PEIIAhBGGohAANAIABBBzYCBCAAQQhqIQYgAEEEaiEAIAUgBksNAAsgCCAERg0DIAggCCgCBEF+cTYCBCAEIAggBGsiAkEBcjYCBCAIIAI2AgACQCACQf8BSw0AIAJBA3YiBUEDdEHQ7ghqIQACQAJAQQAoAqjuCCIGQQEgBXQiBXENAEEAIAYgBXI2AqjuCCAAIQUMAQsgACgCCCEFCyAAIAQ2AgggBSAENgIMIAQgADYCDCAEIAU2AggMBAtBHyEAAkAgAkH///8HSw0AIAJBCHYiACAAQYD+P2pBEHZBCHEiAHQiBSAFQYDgH2pBEHZBBHEiBXQiBiAGQYCAD2pBEHZBAnEiBnRBD3YgACAFciAGcmsiAEEBdCACIABBFWp2QQFxckEcaiEACyAEQgA3AhAgBEEcaiAANgIAIABBAnRB2PAIaiEFAkACQEEAKAKs7ggiBkEBIAB0IghxDQBBACAGIAhyNgKs7gggBSAENgIAIARBGGogBTYCAAwBCyACQQBBGSAAQQF2ayAAQR9GG3QhACAFKAIAIQYDQCAGIgUoAgRBeHEgAkYNBCAAQR12IQYgAEEBdCEAIAUgBkEEcWpBEGoiCCgCACIGDQALIAggBDYCACAEQRhqIAU2AgALIAQgBDYCDCAEIAQ2AggMAwsgBCgCCCIAIAM2AgwgBCADNgIIIANBADYCGCADIAQ2AgwgAyAANgIICyACQQhqIQAMBQsgBSgCCCIAIAQ2AgwgBSAENgIIIARBGGpBADYCACAEIAU2AgwgBCAANgIIC0EAKAK07ggiACADTQ0AQQAgACADayIENgK07ghBAEEAKALA7ggiACADaiIFNgLA7gggBSAEQQFyNgIEIAAgA0EDcjYCBCAAQQhqIQAMAwsQqQFBMDYCAEEAIQAMAgsCQCALRQ0AAkACQCAIIAgoAhwiBUECdEHY8AhqIgAoAgBHDQAgACAGNgIAIAYNAUEAIAdBfiAFd3EiBzYCrO4IDAILIAtBEEEUIAsoAhAgCEYbaiAGNgIAIAZFDQELIAYgCzYCGAJAIAgoAhAiAEUNACAGIAA2AhAgACAGNgIYCyAIQRRqKAIAIgBFDQAgBkEUaiAANgIAIAAgBjYCGAsCQAJAIARBD0sNACAIIAQgA2oiAEEDcjYCBCAAIAhqQQRqIgAgACgCAEEBcjYCAAwBCyAIIANBA3I2AgQgCCADaiIGIARBAXI2AgQgBiAEaiAENgIAAkAgBEH/AUsNACAEQQN2IgRBA3RB0O4IaiEAAkACQEEAKAKo7ggiBUEBIAR0IgRxDQBBACAFIARyNgKo7gggACEEDAELIAAoAgghBAsgACAGNgIIIAQgBjYCDCAGIAA2AgwgBiAENgIIDAELQR8hAAJAIARB////B0sNACAEQQh2IgAgAEGA/j9qQRB2QQhxIgB0IgUgBUGA4B9qQRB2QQRxIgV0IgMgA0GAgA9qQRB2QQJxIgN0QQ92IAAgBXIgA3JrIgBBAXQgBCAAQRVqdkEBcXJBHGohAAsgBiAANgIcIAZCADcCECAAQQJ0QdjwCGohBQJAAkACQCAHQQEgAHQiA3ENAEEAIAcgA3I2AqzuCCAFIAY2AgAgBiAFNgIYDAELIARBAEEZIABBAXZrIABBH0YbdCEAIAUoAgAhAwNAIAMiBSgCBEF4cSAERg0CIABBHXYhAyAAQQF0IQAgBSADQQRxakEQaiICKAIAIgMNAAsgAiAGNgIAIAYgBTYCGAsgBiAGNgIMIAYgBjYCCAwBCyAFKAIIIgAgBjYCDCAFIAY2AgggBkEANgIYIAYgBTYCDCAGIAA2AggLIAhBCGohAAwBCwJAIApFDQACQAJAIAYgBigCHCIFQQJ0QdjwCGoiACgCAEcNACAAIAg2AgAgCA0BQQAgCUF+IAV3cTYCrO4IDAILIApBEEEUIAooAhAgBkYbaiAINgIAIAhFDQELIAggCjYCGAJAIAYoAhAiAEUNACAIIAA2AhAgACAINgIYCyAGQRRqKAIAIgBFDQAgCEEUaiAANgIAIAAgCDYCGAsCQAJAIARBD0sNACAGIAQgA2oiAEEDcjYCBCAAIAZqQQRqIgAgACgCAEEBcjYCAAwBCyAGIANBA3I2AgQgBiADaiIFIARBAXI2AgQgBSAEaiAENgIAAkAgB0UNACAHQQN2IghBA3RB0O4IaiEDQQAoArzuCCEAAkACQEEBIAh0IgggAnENAEEAIAggAnI2AqjuCCADIQgMAQsgAygCCCEICyADIAA2AgggCCAANgIMIAAgAzYCDCAAIAg2AggLQQAgBTYCvO4IQQAgBDYCsO4ICyAGQQhqIQALIAFBEGokACAAC5sNAQd/AkAgAEUNACAAQXhqIgEgAEF8aigCACICQXhxIgBqIQMCQCACQQFxDQAgAkEDcUUNASABIAEoAgAiAmsiAUEAKAK47ggiBEkNASACIABqIQACQEEAKAK87gggAUYNAAJAIAJB/wFLDQAgASgCCCIEIAJBA3YiBUEDdEHQ7ghqIgZGGgJAIAEoAgwiAiAERw0AQQBBACgCqO4IQX4gBXdxNgKo7ggMAwsgAiAGRhogBCACNgIMIAIgBDYCCAwCCyABKAIYIQcCQAJAIAEoAgwiBiABRg0AIAQgASgCCCICSxogAiAGNgIMIAYgAjYCCAwBCwJAIAFBFGoiAigCACIEDQAgAUEQaiICKAIAIgQNAEEAIQYMAQsDQCACIQUgBCIGQRRqIgIoAgAiBA0AIAZBEGohAiAGKAIQIgQNAAsgBUEANgIACyAHRQ0BAkACQCABKAIcIgRBAnRB2PAIaiICKAIAIAFHDQAgAiAGNgIAIAYNAUEAQQAoAqzuCEF+IAR3cTYCrO4IDAMLIAdBEEEUIAcoAhAgAUYbaiAGNgIAIAZFDQILIAYgBzYCGAJAIAEoAhAiAkUNACAGIAI2AhAgAiAGNgIYCyABKAIUIgJFDQEgBkEUaiACNgIAIAIgBjYCGAwBCyADKAIEIgJBA3FBA0cNAEEAIAA2ArDuCCADIAJBfnE2AgQgASAAQQFyNgIEIAEgAGogADYCAA8LIAMgAU0NACADKAIEIgJBAXFFDQACQAJAIAJBAnENAAJAQQAoAsDuCCADRw0AQQAgATYCwO4IQQBBACgCtO4IIABqIgA2ArTuCCABIABBAXI2AgQgAUEAKAK87ghHDQNBAEEANgKw7ghBAEEANgK87ggPCwJAQQAoArzuCCADRw0AQQAgATYCvO4IQQBBACgCsO4IIABqIgA2ArDuCCABIABBAXI2AgQgASAAaiAANgIADwsgAkF4cSAAaiEAAkACQCACQf8BSw0AIAMoAggiBCACQQN2IgVBA3RB0O4IaiIGRhoCQCADKAIMIgIgBEcNAEEAQQAoAqjuCEF+IAV3cTYCqO4IDAILIAIgBkYaIAQgAjYCDCACIAQ2AggMAQsgAygCGCEHAkACQCADKAIMIgYgA0YNAEEAKAK47gggAygCCCICSxogAiAGNgIMIAYgAjYCCAwBCwJAIANBFGoiAigCACIEDQAgA0EQaiICKAIAIgQNAEEAIQYMAQsDQCACIQUgBCIGQRRqIgIoAgAiBA0AIAZBEGohAiAGKAIQIgQNAAsgBUEANgIACyAHRQ0AAkACQCADKAIcIgRBAnRB2PAIaiICKAIAIANHDQAgAiAGNgIAIAYNAUEAQQAoAqzuCEF+IAR3cTYCrO4IDAILIAdBEEEUIAcoAhAgA0YbaiAGNgIAIAZFDQELIAYgBzYCGAJAIAMoAhAiAkUNACAGIAI2AhAgAiAGNgIYCyADKAIUIgJFDQAgBkEUaiACNgIAIAIgBjYCGAsgASAAQQFyNgIEIAEgAGogADYCACABQQAoArzuCEcNAUEAIAA2ArDuCA8LIAMgAkF+cTYCBCABIABBAXI2AgQgASAAaiAANgIACwJAIABB/wFLDQAgAEEDdiICQQN0QdDuCGohAAJAAkBBACgCqO4IIgRBASACdCICcQ0AQQAgBCACcjYCqO4IIAAhAgwBCyAAKAIIIQILIAAgATYCCCACIAE2AgwgASAANgIMIAEgAjYCCA8LQR8hAgJAIABB////B0sNACAAQQh2IgIgAkGA/j9qQRB2QQhxIgJ0IgQgBEGA4B9qQRB2QQRxIgR0IgYgBkGAgA9qQRB2QQJxIgZ0QQ92IAIgBHIgBnJrIgJBAXQgACACQRVqdkEBcXJBHGohAgsgAUIANwIQIAFBHGogAjYCACACQQJ0QdjwCGohBAJAAkACQAJAQQAoAqzuCCIGQQEgAnQiA3ENAEEAIAYgA3I2AqzuCCAEIAE2AgAgAUEYaiAENgIADAELIABBAEEZIAJBAXZrIAJBH0YbdCECIAQoAgAhBgNAIAYiBCgCBEF4cSAARg0CIAJBHXYhBiACQQF0IQIgBCAGQQRxakEQaiIDKAIAIgYNAAsgAyABNgIAIAFBGGogBDYCAAsgASABNgIMIAEgATYCCAwBCyAEKAIIIgAgATYCDCAEIAE2AgggAUEYakEANgIAIAEgBDYCDCABIAA2AggLQQBBACgCyO4IQX9qIgFBfyABGzYCyO4ICwuMAQECfwJAIAANACABEJMCDwsCQCABQUBJDQAQqQFBMDYCAEEADwsCQCAAQXhqQRAgAUELakF4cSABQQtJGxCWAiICRQ0AIAJBCGoPCwJAIAEQkwIiAg0AQQAPCyACIABBfEF4IABBfGooAgAiA0EDcRsgA0F4cWoiAyABIAMgAUkbEKoBGiAAEJQCIAIL3AcBCX8gACgCBCICQXhxIQMCQAJAIAJBA3ENAAJAIAFBgAJPDQBBAA8LAkAgAyABQQRqSQ0AIAAhBCADIAFrQQAoAojyCEEBdE0NAgtBAA8LAkACQCADIAFJDQAgAyABayIEQRBJDQEgACACQQFxIAFyQQJyNgIEIAAgAWoiASAEQQNyNgIEIAAgA0EEcmoiAyADKAIAQQFyNgIAIAEgBBCXAgwBC0EAIQQCQEEAKALA7gggACADaiIFRw0AQQAoArTuCCADaiIDIAFNDQIgACACQQFxIAFyQQJyNgIEIAAgAWoiAiADIAFrIgFBAXI2AgRBACABNgK07ghBACACNgLA7ggMAQsCQEEAKAK87gggBUcNAEEAIQRBACgCsO4IIANqIgMgAUkNAgJAAkAgAyABayIEQRBJDQAgACACQQFxIAFyQQJyNgIEIAAgAWoiASAEQQFyNgIEIAAgA2oiAyAENgIAIAMgAygCBEF+cTYCBAwBCyAAIAJBAXEgA3JBAnI2AgQgAyAAakEEaiIBIAEoAgBBAXI2AgBBACEEQQAhAQtBACABNgK87ghBACAENgKw7ggMAQtBACEEIAUoAgQiBkECcQ0BIAZBeHEgA2oiByABSQ0BIAcgAWshCAJAAkAgBkH/AUsNACAFKAIIIgMgBkEDdiIJQQN0QdDuCGoiBkYaAkAgBSgCDCIEIANHDQBBAEEAKAKo7ghBfiAJd3E2AqjuCAwCCyAEIAZGGiADIAQ2AgwgBCADNgIIDAELIAUoAhghCgJAAkAgBSgCDCIGIAVGDQBBACgCuO4IIAUoAggiA0saIAMgBjYCDCAGIAM2AggMAQsCQCAFQRRqIgMoAgAiBA0AIAVBEGoiAygCACIEDQBBACEGDAELA0AgAyEJIAQiBkEUaiIDKAIAIgQNACAGQRBqIQMgBigCECIEDQALIAlBADYCAAsgCkUNAAJAAkAgBSgCHCIEQQJ0QdjwCGoiAygCACAFRw0AIAMgBjYCACAGDQFBAEEAKAKs7ghBfiAEd3E2AqzuCAwCCyAKQRBBFCAKKAIQIAVGG2ogBjYCACAGRQ0BCyAGIAo2AhgCQCAFKAIQIgNFDQAgBiADNgIQIAMgBjYCGAsgBSgCFCIDRQ0AIAZBFGogAzYCACADIAY2AhgLAkAgCEEPSw0AIAAgAkEBcSAHckECcjYCBCAAIAdBBHJqIgEgASgCAEEBcjYCAAwBCyAAIAJBAXEgAXJBAnI2AgQgACABaiIBIAhBA3I2AgQgACAHQQRyaiIDIAMoAgBBAXI2AgAgASAIEJcCCyAAIQQLIAQL0AwBBn8gACABaiECAkACQCAAKAIEIgNBAXENACADQQNxRQ0BIAAoAgAiAyABaiEBAkACQEEAKAK87gggACADayIARg0AAkAgA0H/AUsNACAAKAIIIgQgA0EDdiIFQQN0QdDuCGoiBkYaIAAoAgwiAyAERw0CQQBBACgCqO4IQX4gBXdxNgKo7ggMAwsgACgCGCEHAkACQCAAKAIMIgYgAEYNAEEAKAK47gggACgCCCIDSxogAyAGNgIMIAYgAzYCCAwBCwJAIABBFGoiAygCACIEDQAgAEEQaiIDKAIAIgQNAEEAIQYMAQsDQCADIQUgBCIGQRRqIgMoAgAiBA0AIAZBEGohAyAGKAIQIgQNAAsgBUEANgIACyAHRQ0CAkACQCAAKAIcIgRBAnRB2PAIaiIDKAIAIABHDQAgAyAGNgIAIAYNAUEAQQAoAqzuCEF+IAR3cTYCrO4IDAQLIAdBEEEUIAcoAhAgAEYbaiAGNgIAIAZFDQMLIAYgBzYCGAJAIAAoAhAiA0UNACAGIAM2AhAgAyAGNgIYCyAAKAIUIgNFDQIgBkEUaiADNgIAIAMgBjYCGAwCCyACKAIEIgNBA3FBA0cNAUEAIAE2ArDuCCACIANBfnE2AgQgACABQQFyNgIEIAIgATYCAA8LIAMgBkYaIAQgAzYCDCADIAQ2AggLAkACQCACKAIEIgNBAnENAAJAQQAoAsDuCCACRw0AQQAgADYCwO4IQQBBACgCtO4IIAFqIgE2ArTuCCAAIAFBAXI2AgQgAEEAKAK87ghHDQNBAEEANgKw7ghBAEEANgK87ggPCwJAQQAoArzuCCACRw0AQQAgADYCvO4IQQBBACgCsO4IIAFqIgE2ArDuCCAAIAFBAXI2AgQgACABaiABNgIADwsgA0F4cSABaiEBAkACQCADQf8BSw0AIAIoAggiBCADQQN2IgVBA3RB0O4IaiIGRhoCQCACKAIMIgMgBEcNAEEAQQAoAqjuCEF+IAV3cTYCqO4IDAILIAMgBkYaIAQgAzYCDCADIAQ2AggMAQsgAigCGCEHAkACQCACKAIMIgYgAkYNAEEAKAK47gggAigCCCIDSxogAyAGNgIMIAYgAzYCCAwBCwJAIAJBFGoiBCgCACIDDQAgAkEQaiIEKAIAIgMNAEEAIQYMAQsDQCAEIQUgAyIGQRRqIgQoAgAiAw0AIAZBEGohBCAGKAIQIgMNAAsgBUEANgIACyAHRQ0AAkACQCACKAIcIgRBAnRB2PAIaiIDKAIAIAJHDQAgAyAGNgIAIAYNAUEAQQAoAqzuCEF+IAR3cTYCrO4IDAILIAdBEEEUIAcoAhAgAkYbaiAGNgIAIAZFDQELIAYgBzYCGAJAIAIoAhAiA0UNACAGIAM2AhAgAyAGNgIYCyACKAIUIgNFDQAgBkEUaiADNgIAIAMgBjYCGAsgACABQQFyNgIEIAAgAWogATYCACAAQQAoArzuCEcNAUEAIAE2ArDuCA8LIAIgA0F+cTYCBCAAIAFBAXI2AgQgACABaiABNgIACwJAIAFB/wFLDQAgAUEDdiIDQQN0QdDuCGohAQJAAkBBACgCqO4IIgRBASADdCIDcQ0AQQAgBCADcjYCqO4IIAEhAwwBCyABKAIIIQMLIAEgADYCCCADIAA2AgwgACABNgIMIAAgAzYCCA8LQR8hAwJAIAFB////B0sNACABQQh2IgMgA0GA/j9qQRB2QQhxIgN0IgQgBEGA4B9qQRB2QQRxIgR0IgYgBkGAgA9qQRB2QQJxIgZ0QQ92IAMgBHIgBnJrIgNBAXQgASADQRVqdkEBcXJBHGohAwsgAEIANwIQIABBHGogAzYCACADQQJ0QdjwCGohBAJAAkACQEEAKAKs7ggiBkEBIAN0IgJxDQBBACAGIAJyNgKs7gggBCAANgIAIABBGGogBDYCAAwBCyABQQBBGSADQQF2ayADQR9GG3QhAyAEKAIAIQYDQCAGIgQoAgRBeHEgAUYNAiADQR12IQYgA0EBdCEDIAQgBkEEcWpBEGoiAigCACIGDQALIAIgADYCACAAQRhqIAQ2AgALIAAgADYCDCAAIAA2AggPCyAEKAIIIgEgADYCDCAEIAA2AgggAEEYakEANgIAIAAgBDYCDCAAIAE2AggLC2UCAX8BfgJAAkAgAA0AQQAhAgwBCyAArSABrX4iA6chAiABIAByQYCABEkNAEF/IAIgA0IgiKdBAEcbIQILAkAgAhCTAiIARQ0AIABBfGotAABBA3FFDQAgAEEAIAIQqwEaCyAACwcAPwBBEHQLUgECf0EAKALUYiIBIABBA2pBfHEiAmohAAJAAkAgAkUNACAAIAFNDQELAkAgABCZAk0NACAAEBRFDQELQQAgADYC1GIgAQ8LEKkBQTA2AgBBfwv4CgIEfwR+IwBB8ABrIgUkACAEQv///////////wCDIQkCQAJAAkAgAUJ/fCIKQn9RIAJC////////////AIMiCyAKIAFUrXxCf3wiCkL///////+///8AViAKQv///////7///wBRGw0AIANCf3wiCkJ/UiAJIAogA1StfEJ/fCIKQv///////7///wBUIApC////////v///AFEbDQELAkAgAVAgC0KAgICAgIDA//8AVCALQoCAgICAgMD//wBRGw0AIAJCgICAgICAIIQhBCABIQMMAgsCQCADUCAJQoCAgICAgMD//wBUIAlCgICAgICAwP//AFEbDQAgBEKAgICAgIAghCEEDAILAkAgASALQoCAgICAgMD//wCFhEIAUg0AQoCAgICAgOD//wAgAiADIAGFIAQgAoVCgICAgICAgICAf4WEUCIGGyEEQgAgASAGGyEDDAILIAMgCUKAgICAgIDA//8AhYRQDQECQCABIAuEQgBSDQAgAyAJhEIAUg0CIAMgAYMhAyAEIAKDIQQMAgsgAyAJhFBFDQAgASEDIAIhBAwBCyADIAEgAyABViAJIAtWIAkgC1EbIgcbIQkgBCACIAcbIgtC////////P4MhCiACIAQgBxsiAkIwiKdB//8BcSEIAkAgC0IwiKdB//8BcSIGDQAgBUHgAGogCSAKIAkgCiAKUCIGG3kgBkEGdK18pyIGQXFqEJwCQRAgBmshBiAFQegAaikDACEKIAUpA2AhCQsgASADIAcbIQMgAkL///////8/gyEEAkAgCA0AIAVB0ABqIAMgBCADIAQgBFAiBxt5IAdBBnStfKciB0FxahCcAkEQIAdrIQggBUHYAGopAwAhBCAFKQNQIQMLIARCA4YgA0I9iIRCgICAgICAgASEIQQgCkIDhiAJQj2IhCEBIANCA4YhAyALIAKFIQoCQCAGIAhrIgdFDQACQCAHQf8ATQ0AQgAhBEIBIQMMAQsgBUHAAGogAyAEQYABIAdrEJwCIAVBMGogAyAEIAcQqgIgBSkDMCAFKQNAIAVBwABqQQhqKQMAhEIAUq2EIQMgBUEwakEIaikDACEECyABQoCAgICAgIAEhCEMIAlCA4YhAgJAAkAgCkJ/VQ0AAkAgAiADfSIBIAwgBH0gAiADVK19IgSEUEUNAEIAIQNCACEEDAMLIARC/////////wNWDQEgBUEgaiABIAQgASAEIARQIgcbeSAHQQZ0rXynQXRqIgcQnAIgBiAHayEGIAVBKGopAwAhBCAFKQMgIQEMAQsgBCAMfCADIAJ8IgEgA1StfCIEQoCAgICAgIAIg1ANACABQgGIIARCP4aEIAFCAYOEIQEgBkEBaiEGIARCAYghBAsgC0KAgICAgICAgIB/gyECAkAgBkH//wFIDQAgAkKAgICAgIDA//8AhCEEQgAhAwwBC0EAIQcCQAJAIAZBAEwNACAGIQcMAQsgBUEQaiABIAQgBkH/AGoQnAIgBSABIARBASAGaxCqAiAFKQMAIAUpAxAgBUEQakEIaikDAIRCAFKthCEBIAVBCGopAwAhBAsgAUIDiCAEQj2GhCEDIAetQjCGIARCA4hC////////P4OEIAKEIQQgAadBB3EhBgJAAkACQAJAAkAQqAIOAwABAgMLIAQgAyAGQQRLrXwiASADVK18IQQCQCAGQQRGDQAgASEDDAMLIAQgAUIBgyICIAF8IgMgAlStfCEEDAMLIAQgAyACQgBSIAZBAEdxrXwiASADVK18IQQgASEDDAELIAQgAyACUCAGQQBHca18IgEgA1StfCEEIAEhAwsgBkUNAQsQqQIaCyAAIAM3AwAgACAENwMIIAVB8ABqJAALUwEBfgJAAkAgA0HAAHFFDQAgASADQUBqrYYhAkIAIQEMAQsgA0UNACABQcAAIANrrYggAiADrSIEhoQhAiABIASGIQELIAAgATcDACAAIAI3AwgL4AECAX8CfkEBIQQCQCAAQgBSIAFC////////////AIMiBUKAgICAgIDA//8AViAFQoCAgICAgMD//wBRGw0AIAJCAFIgA0L///////////8AgyIGQoCAgICAgMD//wBWIAZCgICAgICAwP//AFEbDQACQCACIACEIAYgBYSEUEUNAEEADwsCQCADIAGDQgBTDQBBfyEEIAAgAlQgASADUyABIANRGw0BIAAgAoUgASADhYRCAFIPC0F/IQQgACACViABIANVIAEgA1EbDQAgACAChSABIAOFhEIAUiEECyAEC9gBAgF/An5BfyEEAkAgAEIAUiABQv///////////wCDIgVCgICAgICAwP//AFYgBUKAgICAgIDA//8AURsNACACQgBSIANC////////////AIMiBkKAgICAgIDA//8AViAGQoCAgICAgMD//wBRGw0AAkAgAiAAhCAGIAWEhFBFDQBBAA8LAkAgAyABg0IAUw0AIAAgAlQgASADUyABIANRGw0BIAAgAoUgASADhYRCAFIPCyAAIAJWIAEgA1UgASADURsNACAAIAKFIAEgA4WEQgBSIQQLIAQL7xACBX8OfiMAQdACayIFJAAgBEL///////8/gyEKIAJC////////P4MhCyAEIAKFQoCAgICAgICAgH+DIQwgBEIwiKdB//8BcSEGAkACQAJAIAJCMIinQf//AXEiB0F/akH9/wFLDQBBACEIIAZBf2pB/v8BSQ0BCwJAIAFQIAJC////////////AIMiDUKAgICAgIDA//8AVCANQoCAgICAgMD//wBRGw0AIAJCgICAgICAIIQhDAwCCwJAIANQIARC////////////AIMiAkKAgICAgIDA//8AVCACQoCAgICAgMD//wBRGw0AIARCgICAgICAIIQhDCADIQEMAgsCQCABIA1CgICAgICAwP//AIWEQgBSDQACQCADIAJCgICAgICAwP//AIWEUEUNAEIAIQFCgICAgICA4P//ACEMDAMLIAxCgICAgICAwP//AIQhDEIAIQEMAgsCQCADIAJCgICAgICAwP//AIWEQgBSDQBCACEBDAILAkAgASANhEIAUg0AQoCAgICAgOD//wAgDCADIAKEUBshDEIAIQEMAgsCQCADIAKEQgBSDQAgDEKAgICAgIDA//8AhCEMQgAhAQwCC0EAIQgCQCANQv///////z9WDQAgBUHAAmogASALIAEgCyALUCIIG3kgCEEGdK18pyIIQXFqEJwCQRAgCGshCCAFQcgCaikDACELIAUpA8ACIQELIAJC////////P1YNACAFQbACaiADIAogAyAKIApQIgkbeSAJQQZ0rXynIglBcWoQnAIgCSAIakFwaiEIIAVBuAJqKQMAIQogBSkDsAIhAwsgBUGgAmogA0IxiCAKQoCAgICAgMAAhCIOQg+GhCICQgBCgICAgLDmvIL1ACACfSIEQgAQrAIgBUGQAmpCACAFQaACakEIaikDAH1CACAEQgAQrAIgBUGAAmogBSkDkAJCP4ggBUGQAmpBCGopAwBCAYaEIgRCACAC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IARCPIYhBiAEQgSIQoCAgICAgMD//wCEIQUMAQsCQCAFUEUNAEIAIQZCACEFDAELIAIgBUIAIASnZ0EgaiAFQiCIp2cgBUKAgICAEFQbIgNBMWoQnAIgAkEIaikDAEKAgICAgIDAAIVBjPgAIANrrUIwhoQhBSACKQMAIQYLIAAgBjcDACAAIAUgBEKAgICAgICAgIB/g4Q3AwggAkEQaiQAC+EBAgN/An4jAEEQayICJAACQAJAIAG8IgNB/////wdxIgRBgICAfGpB////9wdLDQAgBK1CGYZCgICAgICAgMA/fCEFQgAhBgwBCwJAIARBgICA/AdJDQAgA61CGYZCgICAgICAwP//AIQhBUIAIQYMAQsCQCAEDQBCACEGQgAhBQwBCyACIAStQgAgBGciBEHRAGoQnAIgAkEIaikDAEKAgICAgIDAAIVBif8AIARrrUIwhoQhBSACKQMAIQYLIAAgBjcDACAAIAUgA0GAgICAeHGtQiCGhDcDCCACQRBqJAALjQECAn8CfiMAQRBrIgIkAAJAAkAgAQ0AQgAhBEIAIQUMAQsgAiABIAFBH3UiA2ogA3MiA61CACADZyIDQdEAahCcAiACQQhqKQMAQoCAgICAgMAAhUGegAEgA2utQjCGfCABQYCAgIB4ca1CIIaEIQUgAikDACEECyAAIAQ3AwAgACAFNwMIIAJBEGokAAtyAgF/An4jAEEQayICJAACQAJAIAENAEIAIQNCACEEDAELIAIgAa1CACABZyIBQdEAahCcAiACQQhqKQMAQoCAgICAgMAAhUGegAEgAWutQjCGfCEEIAIpAwAhAwsgACADNwMAIAAgBDcDCCACQRBqJAALBABBAAsEAEEAC1MBAX4CQAJAIANBwABxRQ0AIAIgA0FAaq2IIQFCACECDAELIANFDQAgAkHAACADa62GIAEgA60iBIiEIQEgAiAEiCECCyAAIAE3AwAgACACNwMIC+sLAgV/D34jAEHgAGsiBSQAIAFCIIggAkIghoQhCiADQhGIIARCL4aEIQsgA0IxiCAEQv///////z+DIgxCD4aEIQ0gBCAChUKAgICAgICAgIB/gyEOIAJC////////P4MiD0IgiCEQIAxCEYghESAEQjCIp0H//wFxIQYCQAJAAkAgAkIwiKdB//8BcSIHQX9qQf3/AUsNAEEAIQggBkF/akH+/wFJDQELAkAgAVAgAkL///////////8AgyISQoCAgICAgMD//wBUIBJCgICAgICAwP//AFEbDQAgAkKAgICAgIAghCEODAILAkAgA1AgBEL///////////8AgyICQoCAgICAgMD//wBUIAJCgICAgICAwP//AFEbDQAgBEKAgICAgIAghCEOIAMhAQwCCwJAIAEgEkKAgICAgIDA//8AhYRCAFINAAJAIAMgAoRQRQ0AQoCAgICAgOD//wAhDkIAIQEMAwsgDkKAgICAgIDA//8AhCEOQgAhAQwCCwJAIAMgAkKAgICAgIDA//8AhYRCAFINACABIBKEIQJCACEBAkAgAlBFDQBCgICAgICA4P//ACEODAMLIA5CgICAgICAwP//AIQhDgwCCwJAIAEgEoRCAFINAEIAIQEMAgsCQCADIAKEQgBSDQBCACEBDAILQQAhCAJAIBJC////////P1YNACAFQdAAaiABIA8gASAPIA9QIggbeSAIQQZ0rXynIghBcWoQnAJBECAIayEIIAUpA1AiAUIgiCAFQdgAaikDACIPQiCGhCEKIA9CIIghEAsgAkL///////8/Vg0AIAVBwABqIAMgDCADIAwgDFAiCRt5IAlBBnStfKciCUFxahCcAiAIIAlrQRBqIQggBSkDQCIDQjGIIAVByABqKQMAIgJCD4aEIQ0gA0IRiCACQi+GhCELIAJCEYghEQsgC0L/////D4MiAiABQv////8PgyIEfiITIANCD4ZCgID+/w+DIgEgCkL/////D4MiA358IgpCIIYiDCABIAR+fCILIAxUrSACIAN+IhQgASAPQv////8PgyIMfnwiEiANQv////8PgyIPIAR+fCINIApCIIggCiATVK1CIIaEfCITIAIgDH4iFSABIBBCgIAEhCIKfnwiECAPIAN+fCIWIBFC/////weDQoCAgIAIhCIBIAR+fCIRQiCGfCIXfCEEIAcgBmogCGpBgYB/aiEGAkACQCAPIAx+IhggAiAKfnwiAiAYVK0gAiABIAN+fCIDIAJUrXwgAyASIBRUrSANIBJUrXx8IgIgA1StfCABIAp+fCABIAx+IgMgDyAKfnwiASADVK1CIIYgAUIgiIR8IAIgAUIghnwiASACVK18IAEgEUIgiCAQIBVUrSAWIBBUrXwgESAWVK18QiCGhHwiAyABVK18IAMgEyANVK0gFyATVK18fCICIANUrXwiAUKAgICAgIDAAINQDQAgBkEBaiEGDAELIAtCP4ghAyABQgGGIAJCP4iEIQEgAkIBhiAEQj+IhCECIAtCAYYhCyADIARCAYaEIQQLAkAgBkH//wFIDQAgDkKAgICAgIDA//8AhCEOQgAhAQwBCwJAAkAgBkEASg0AAkBBASAGayIHQYABSQ0AQgAhAQwDCyAFQTBqIAsgBCAGQf8AaiIGEJwCIAVBIGogAiABIAYQnAIgBUEQaiALIAQgBxCqAiAFIAIgASAHEKoCIAUpAyAgBSkDEIQgBSkDMCAFQTBqQQhqKQMAhEIAUq2EIQsgBUEgakEIaikDACAFQRBqQQhqKQMAhCEEIAVBCGopAwAhASAFKQMAIQIMAQsgBq1CMIYgAUL///////8/g4QhAQsgASAOhCEOAkAgC1AgBEJ/VSAEQoCAgICAgICAgH9RGw0AIA4gAkIBfCIBIAJUrXwhDgwBCwJAIAsgBEKAgICAgICAgIB/hYRCAFENACACIQEMAQsgDiACIAJCAYN8IgEgAlStfCEOCyAAIAE3AwAgACAONwMIIAVB4ABqJAALdQEBfiAAIAQgAX4gAiADfnwgA0IgiCIEIAFCIIgiAn58IANC/////w+DIgMgAUL/////D4MiAX4iBUIgiCADIAJ+fCIDQiCIfCADQv////8PgyAEIAF+fCIDQiCIfDcDCCAAIANCIIYgBUL/////D4OENwMAC0gBAX8jAEEQayIFJAAgBSABIAIgAyAEQoCAgICAgICAgH+FEJsCIAUpAwAhASAAIAVBCGopAwA3AwggACABNwMAIAVBEGokAAvqAwICfwJ+IwBBIGsiAiQAAkACQCABQv///////////wCDIgRCgICAgICAwP9DfCAEQoCAgICAgMCAvH98Wg0AIABCPIggAUIEhoQhBAJAIABC//////////8PgyIAQoGAgICAgICACFQNACAEQoGAgICAgICAwAB8IQUMAgsgBEKAgICAgICAgMAAfCEFIABCgICAgICAgIAIhUIAUg0BIAUgBEIBg3whBQwBCwJAIABQIARCgICAgICAwP//AFQgBEKAgICAgIDA//8AURsNACAAQjyIIAFCBIaEQv////////8Dg0KAgICAgICA/P8AhCEFDAELQoCAgICAgID4/wAhBSAEQv///////7//wwBWDQBCACEFIARCMIinIgNBkfcASQ0AIAJBEGogACABQv///////z+DQoCAgICAgMAAhCIEIANB/4h/ahCcAiACIAAgBEGB+AAgA2sQqgIgAikDACIEQjyIIAJBCGopAwBCBIaEIQUCQCAEQv//////////D4MgAikDECACQRBqQQhqKQMAhEIAUq2EIgRCgYCAgICAgIAIVA0AIAVCAXwhBQwBCyAEQoCAgICAgICACIVCAFINACAFQgGDIAV8IQULIAJBIGokACAFIAFCgICAgICAgICAf4OEvwsEACMACwYAIAAkAAsSAQJ/IwAgAGtBcHEiASQAIAELFQBBsPLIAiQCQaTyCEEPakFwcSQBCwcAIwAjAWsLBAAjAgsEACMBCw0AIAEgAiADIAARBwALJAEBfiAAIAEgAq0gA61CIIaEIAQQtgIhBSAFQiCIpxACIAWnCxMAIAAgAacgAUIgiKcgAiADEBYLC+jagIAAAgBBgAgLoFhpbmZpbml0eQBPdXQgb2YgbWVtb3J5AGRpc3BsYXkAbGV0LXN5bnRheABkZWZpbmUtc3ludGF4AGxldHJlYy1zeW50YXgALSsgICAwWDB4AC0wWCswWCAwWC0weCsweCAweAB3AG1lbXYAJTA5dQAldQAvc3Rkb3V0LnR4dABsaXN0AG5vdABDb250aW51YXRpb24gZXhwZWN0cyAxIGFyZ3VtZW50AHF1b3RpZW50AGxldAAjdABjb25zAGVxPyBleHBlY3RzIDIgYXJncwBlcXVhbD8gZXhwZWN0cyAyIGFyZ3MAc3ludGF4LXJ1bGVzAFVuZGVmaW5lZCBnbG9iYWw6ICVzAG1ha2UtdmVjdG9yAGNoYXItPmludGVnZXIAcmVtYWluZGVyAGNkcgBpbnRlZ2VyLT5jaGFyAGNhcgBtZW1xACUlY2FzZS10ZW1wAG1vZHVsbwBjYWxsLXdpdGgtY3VycmVudC1jb250aW51YXRpb24AYmVnaW4AbmFuAEVycm9yOiBmYWlsZWQgdG8gb3BlbiBtZW1zdHJlYW0Ac3RyaW5nLT5zeW1ib2wAc3ltYm9sLT5zdHJpbmcgZXhwZWN0cyAxIHN5bWJvbAB2ZWN0b3ItbGVuZ3RoAHN0cmluZy1sZW5ndGgAbm90IGV4cGVjdHMgMSBhcmcAc3ltYm9sLT5zdHJpbmcAbWFrZS1zdHJpbmcAc3RyaW5nLT5zeW1ib2wgZXhwZWN0cyAxIHN0cmluZwAlZwBpbmYAaWYAdmVjdG9yLXJlZgBzdHJpbmctcmVmACNmAHF1b3RlAHdyaXRlAGVsc2UAY2FzZQBDYW5ub3QgY2FsbCBub24tcHJvY2VkdXJlAGNhbGwvY2MgZXhwZWN0cyBwcm9jZWR1cmUAI1xuZXdsaW5lAGRlZmluZQAjXHNwYWNlAGNvbmQAYXBwZW5kAGFuZABTdGFjayB1bmRlcmZsb3cgYXQgUEMgb2Zmc2V0ICVsZAAlJWdlbi0lcy0lZABVbmtub3duIG9wY29kZTogJWQAbGV0cmVjAGNhbGwvY2MAI1wlYwByd2EAbGFtYmRhAF8AVk1fREVCVUdfQ09NUElMRVIATkFOAE5VTEwASU5GAGVxdj8AcGFpcj8AbnVtYmVyPwBjaGFyPwBlcT8AemVybz8AYm9vbGVhbj8Ac3ltYm9sPwBudWxsPwBlcXVhbD8AY2hhci1sb3dlci1jYXNlPwBjaGFyLXVwcGVyLWNhc2U/AGNoYXItd2hpdGVzcGFjZT8AY2hhci1hbHBoYWJldGljPwBjaGFyLW51bWVyaWM/ACM8cmF3ICVwPgAjPG1hY3JvPgAjPGNvbnRpbnVhdGlvbj4AIzxwcmltaXRpdmU+ACM8Y2xvc3VyZT4AIzxwcm90b3R5cGU+AD0+AD49ADw9ADwALwBFcnJvciBvY2N1cnJlZCBkdXJpbmcgZXhlY3V0aW9uLgAuLi4AJWdlbi0AKwBsZXQqAChudWxsKQAoKQAjKAAiJXMiAHZlY3Rvci1zZXQhAHN0cmluZy1zZXQhAEVycm9yOiAAIC4gAEdDIFByb3RlY3Rpb24gU3RhY2sgT3ZlcmZsb3cKAENvbXBpbGluZyBzeW1ib2w6ICVzCgAAAAAAAAAAAAAAAABBBgAAsQYAAI8IAAAoBwAAXQYAAHgFAAAXBwAAWQUAALAEAABlCAAAEAcAAMAGAADMBgAAEAUAAG4GAAAqBAAAHwQAADgEAAB+BAAAAAAAAC9wcmVsdWRlLnNjbQA7OzsgUjVSUyBTdGFuZGFyZCBMaWJyYXJ5IFByZWx1ZGUKCjs7OyBTdGFuZGFyZCBwcm9jZWR1cmVzCihkZWZpbmUgKG5vdCB4KSAoaWYgeCAjZiAjdCkpCgooZGVmaW5lIChjYWxsLXdpdGgtY3VycmVudC1jb250aW51YXRpb24gcHJvYykgKGNhbGwtd2l0aC1jdXJyZW50LWNvbnRpbnVhdGlvbiBwcm9jKSkKKGRlZmluZSBjYWxsL2NjIGNhbGwtd2l0aC1jdXJyZW50LWNvbnRpbnVhdGlvbikKCihkZWZpbmUgKGxpc3Q/IHgpCiAgKGxldCBsb29wICgoeCB4KSAoc2xvdyB4KSkKICAgIChpZiAobnVsbD8geCkgI3QKICAgICAgICAoaWYgKG5vdCAocGFpcj8geCkpICNmCiAgICAgICAgICAgIChsZXQgKCh4IChjZHIgeCkpKQogICAgICAgICAgICAgIChpZiAobnVsbD8geCkgI3QKICAgICAgICAgICAgICAgICAgKGlmIChub3QgKHBhaXI/IHgpKSAjZgogICAgICAgICAgICAgICAgICAgICAgKGlmIChlcT8geCBzbG93KSAjZgogICAgICAgICAgICAgICAgICAgICAgICAgIChsb29wIChjZHIgeCkgKGNkciBzbG93KSkpKSkpKSkpKQoKOzs7IFBhaXJzIGFuZCBsaXN0cwooZGVmaW5lIChjYWFyIHgpIChjYXIgKGNhciB4KSkpCihkZWZpbmUgKGNhZHIgeCkgKGNhciAoY2RyIHgpKSkKKGRlZmluZSAoY2RhciB4KSAoY2RyIChjYXIgeCkpKQooZGVmaW5lIChjZGRyIHgpIChjZHIgKGNkciB4KSkpCihkZWZpbmUgKGNhYWFyIHgpIChjYXIgKGNhYXIgeCkpKQooZGVmaW5lIChjYWFkciB4KSAoY2FyIChjYWRyIHgpKSkKKGRlZmluZSAoY2FkYXIgeCkgKGNhciAoY2RhciB4KSkpCihkZWZpbmUgKGNhZGRyIHgpIChjYXIgKGNkZHIgeCkpKQooZGVmaW5lIChjZGFhciB4KSAoY2RyIChjYWFyIHgpKSkKKGRlZmluZSAoY2RhZHIgeCkgKGNkciAoY2FkciB4KSkpCihkZWZpbmUgKGNkZGFyIHgpIChjZHIgKGNkYXIgeCkpKQooZGVmaW5lIChjZGRkciB4KSAoY2RyIChjZGRyIHgpKSkKKGRlZmluZSAoY2FhYWFyIHgpIChjYXIgKGNhYWFyIHgpKSkKKGRlZmluZSAoY2FhYWRyIHgpIChjYXIgKGNhYWRyIHgpKSkKKGRlZmluZSAoY2FhZGFyIHgpIChjYXIgKGNhZGFyIHgpKSkKKGRlZmluZSAoY2FhZGRyIHgpIChjYXIgKGNhZGRyIHgpKSkKKGRlZmluZSAoY2FkYWFyIHgpIChjYXIgKGNkYWFyIHgpKSkKKGRlZmluZSAoY2FkYWRyIHgpIChjYXIgKGNkYWRyIHgpKSkKKGRlZmluZSAoY2FkZGFyIHgpIChjYXIgKGNkZGFyIHgpKSkKKGRlZmluZSAoY2FkZGRyIHgpIChjYXIgKGNkZGRyIHgpKSkKKGRlZmluZSAoY2RhYWFyIHgpIChjZHIgKGNhYWFyIHgpKSkKKGRlZmluZSAoY2RhYWRyIHgpIChjZHIgKGNhYWRyIHgpKSkKKGRlZmluZSAoY2RhZGFyIHgpIChjZHIgKGNhZGFyIHgpKSkKKGRlZmluZSAoY2RhZGRyIHgpIChjZHIgKGNhZGRyIHgpKSkKKGRlZmluZSAoY2RkYWFyIHgpIChjZHIgKGNkYWFyIHgpKSkKKGRlZmluZSAoY2RkYWRyIHgpIChjZHIgKGNkYWRyIHgpKSkKKGRlZmluZSAoY2RkZGFyIHgpIChjZHIgKGNkZGFyIHgpKSkKKGRlZmluZSAoY2RkZGRyIHgpIChjZHIgKGNkZGRyIHgpKSkKCihkZWZpbmUgKGxlbmd0aCBsc3QpCiAgKGxldCBsb29wICgobCBsc3QpIChuIDApKQogICAgKGlmIChudWxsPyBsKSBuCiAgICAgICAgKGxvb3AgKGNkciBsKSAoKyBuIDEpKSkpKQoKKGRlZmluZSAoYXBwZW5kIC4gbGlzdHMpCiAgKGNvbmQgKChudWxsPyBsaXN0cykgJygpKQogICAgICAgICgobnVsbD8gKGNkciBsaXN0cykpIChjYXIgbGlzdHMpKQogICAgICAgIChlbHNlCiAgICAgICAgIChsZXRyZWMgKChhcHBlbmQtMiAobGFtYmRhIChsMSBsMikKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGlmIChudWxsPyBsMSkgbDIKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChjb25zIChjYXIgbDEpIChhcHBlbmQtMiAoY2RyIGwxKSBsMikpKSkpKQogICAgICAgICAgIChhcHBlbmQtMiAoY2FyIGxpc3RzKSAoYXBwbHkgYXBwZW5kIChjZHIgbGlzdHMpKSkpKSkpCgooZGVmaW5lIChyZXZlcnNlIGxzdCkKICAobGV0IGxvb3AgKChsIGxzdCkgKHJlcyAnKCkpKQogICAgKGlmIChudWxsPyBsKSByZXMKICAgICAgICAobG9vcCAoY2RyIGwpIChjb25zIChjYXIgbCkgcmVzKSkpKSkKCihkZWZpbmUgKGxpc3QtcmVmIGxzdCBrKQogIChpZiAoemVybz8gaykgKGNhciBsc3QpCiAgICAgIChsaXN0LXJlZiAoY2RyIGxzdCkgKC0gayAxKSkpKQoKKGRlZmluZSAobGlzdC10YWlsIGxzdCBrKQogIChpZiAoemVybz8gaykgbHN0CiAgICAgIChsaXN0LXRhaWwgKGNkciBsc3QpICgtIGsgMSkpKSkKCjs7OyBBc3NvY2lhdGlvbiBsaXN0cyBhbmQgbWVtYmVycwooZGVmaW5lIChtZW1xIG9iaiBsc3QpCiAgKGNvbmQgKChudWxsPyBsc3QpICNmKQogICAgICAgICgoZXE/IG9iaiAoY2FyIGxzdCkpIGxzdCkKICAgICAgICAoZWxzZSAobWVtcSBvYmogKGNkciBsc3QpKSkpKQoKKGRlZmluZSAobWVtYmVyIG9iaiBsc3QpCiAgKGNvbmQgKChudWxsPyBsc3QpICNmKQogICAgICAgICgoZXF1YWw/IG9iaiAoY2FyIGxzdCkpIGxzdCkKICAgICAgICAoZWxzZSAobWVtYmVyIG9iaiAoY2RyIGxzdCkpKSkpCgooZGVmaW5lIChhc3NxIG9iaiBhbGlzdCkKICAoY29uZCAoKG51bGw/IGFsaXN0KSAjZikKICAgICAgICAoKGVxPyBvYmogKGNhciAoY2FyIGFsaXN0KSkpIChjYXIgYWxpc3QpKQogICAgICAgIChlbHNlIChhc3NxIG9iaiAoY2RyIGFsaXN0KSkpKSkKCihkZWZpbmUgKGFzc29jIG9iaiBhbGlzdCkKICAoY29uZCAoKG51bGw/IGFsaXN0KSAjZikKICAgICAgICAoKGVxdWFsPyBvYmogKGNhciAoY2FyIGFsaXN0KSkpIChjYXIgYWxpc3QpKQogICAgICAgIChlbHNlIChhc3NvYyBvYmogKGNkciBhbGlzdCkpKSkpCgooZGVmaW5lIChhc3N2IG9iaiBhbGlzdCkKICAoY29uZCAoKG51bGw/IGFsaXN0KSAjZikKICAgICAgICAoKGVxdj8gb2JqIChjYXIgKGNhciBhbGlzdCkpKSAoY2FyIGFsaXN0KSkKICAgICAgICAoZWxzZSAoYXNzdiBvYmogKGNkciBhbGlzdCkpKSkpCgo7OzsgTnVtZXJpYyBwcmVkaWNhdGVzIGFuZCBmdW5jdGlvbnMKKGRlZmluZSAocG9zaXRpdmU/IHgpICg+IHggMCkpCihkZWZpbmUgKG5lZ2F0aXZlPyB4KSAoPCB4IDApKQooZGVmaW5lIChvZGQ/IHgpIChub3QgKGV2ZW4/IHgpKSkKKGRlZmluZSAoZXZlbj8geCkgKD0gKHJlbWFpbmRlciB4IDIpIDApKQoKKGRlZmluZSAoYWJzIHgpIChpZiAoPCB4IDApICgtIHgpIHgpKQoKKGRlZmluZSAobWF4IHggLiByZXN0KQogIChsZXQgbG9vcCAoKG0geCkgKHIgcmVzdCkpCiAgICAoaWYgKG51bGw/IHIpIG0KICAgICAgICAobG9vcCAoaWYgKD4gKGNhciByKSBtKSAoY2FyIHIpIG0pIChjZHIgcikpKSkpCgooZGVmaW5lIChtaW4geCAuIHJlc3QpCiAgKGxldCBsb29wICgobSB4KSAociByZXN0KSkKICAgIChpZiAobnVsbD8gcikgbQogICAgICAgIChsb29wIChpZiAoPCAoY2FyIHIpIG0pIChjYXIgcikgbSkgKGNkciByKSkpKSkKCjs7OyBFcXVhbGl0aWVzCihkZWZpbmUgKGVxPyBhIGIpIChlcXY/IGEgYikpCgooZGVmaW5lIChlcXVhbD8gYSBiKQogIChjb25kICgoZXF2PyBhIGIpICN0KQogICAgICAgICgoYW5kIChwYWlyPyBhKSAocGFpcj8gYikpCiAgICAgICAgIChhbmQgKGVxdWFsPyAoY2FyIGEpIChjYXIgYikpIChlcXVhbD8gKGNkciBhKSAoY2RyIGIpKSkpCiAgICAgICAgKChhbmQgKHN0cmluZz8gYSkgKHN0cmluZz8gYikpCiAgICAgICAgIChzdHJpbmc9PyBhIGIpKQogICAgICAgICgoYW5kICh2ZWN0b3I/IGEpICh2ZWN0b3I/IGIpKQogICAgICAgICAobGV0ICgobGVuICh2ZWN0b3ItbGVuZ3RoIGEpKSkKICAgICAgICAgICAoYW5kICg9IGxlbiAodmVjdG9yLWxlbmd0aCBiKSkKICAgICAgICAgICAgICAgIChsZXQgbG9vcCAoKGkgMCkpCiAgICAgICAgICAgICAgICAgIChpZiAoPSBpIGxlbikgI3QKICAgICAgICAgICAgICAgICAgICAgIChhbmQgKGVxdWFsPyAodmVjdG9yLXJlZiBhIGkpICh2ZWN0b3ItcmVmIGIgaSkpCiAgICAgICAgICAgICAgICAgICAgICAgICAgIChsb29wICgrIGkgMSkpKSkpKSkpCiAgICAgICAgKGVsc2UgI2YpKSkKCjs7OyBDaGFyYWN0ZXIgcHJvY2VkdXJlcwooZGVmaW5lIChjaGFyPT8gYSBiKSAoZXF2PyBhIGIpKQooZGVmaW5lIChjaGFyPD8gYSBiKSAoPCAoY2hhci0+aW50ZWdlciBhKSAoY2hhci0+aW50ZWdlciBiKSkpCihkZWZpbmUgKGNoYXI+PyBhIGIpICg+IChjaGFyLT5pbnRlZ2VyIGEpIChjaGFyLT5pbnRlZ2VyIGIpKSkKKGRlZmluZSAoY2hhcjw9PyBhIGIpICg8PSAoY2hhci0+aW50ZWdlciBhKSAoY2hhci0+aW50ZWdlciBiKSkpCihkZWZpbmUgKGNoYXI+PT8gYSBiKSAoPj0gKGNoYXItPmludGVnZXIgYSkgKGNoYXItPmludGVnZXIgYikpKQoKKGRlZmluZSAoY2hhci1jaT0/IGEgYikgKGNoYXI9PyAoY2hhci1kb3duY2FzZSBhKSAoY2hhci1kb3duY2FzZSBiKSkpCihkZWZpbmUgKGNoYXItY2k8PyBhIGIpIChjaGFyPD8gKGNoYXItZG93bmNhc2UgYSkgKGNoYXItZG93bmNhc2UgYikpKQooZGVmaW5lIChjaGFyLWNpPj8gYSBiKSAoY2hhcj4/IChjaGFyLWRvd25jYXNlIGEpIChjaGFyLWRvd25jYXNlIGIpKSkKKGRlZmluZSAoY2hhci1jaTw9PyBhIGIpIChjaGFyPD0/IChjaGFyLWRvd25jYXNlIGEpIChjaGFyLWRvd25jYXNlIGIpKSkKKGRlZmluZSAoY2hhci1jaT49PyBhIGIpIChjaGFyPj0/IChjaGFyLWRvd25jYXNlIGEpIChjaGFyLWRvd25jYXNlIGIpKSkKCjs7OyBTdHJpbmcgcHJvY2VkdXJlcwooZGVmaW5lIChzdHJpbmc9PyBhIGIpCiAgKGxldCAoKGxlbiAoc3RyaW5nLWxlbmd0aCBhKSkpCiAgICAoYW5kICg9IGxlbiAoc3RyaW5nLWxlbmd0aCBiKSkKICAgICAgICAgKGxldCBsb29wICgoaSAwKSkKICAgICAgICAgICAoaWYgKD0gaSBsZW4pICN0CiAgICAgICAgICAgICAgIChhbmQgKGNoYXI9PyAoc3RyaW5nLXJlZiBhIGkpIChzdHJpbmctcmVmIGIgaSkpCiAgICAgICAgICAgICAgICAgICAgKGxvb3AgKCsgaSAxKSkpKSkpKSkKCihkZWZpbmUgKHN0cmluZy1jaT0/IGEgYikKICAobGV0ICgobGVuIChzdHJpbmctbGVuZ3RoIGEpKSkKICAgIChhbmQgKD0gbGVuIChzdHJpbmctbGVuZ3RoIGIpKQogICAgICAgICAobGV0IGxvb3AgKChpIDApKQogICAgICAgICAgIChpZiAoPSBpIGxlbikgI3QKICAgICAgICAgICAgICAgKGFuZCAoY2hhci1jaT0/IChzdHJpbmctcmVmIGEgaSkgKHN0cmluZy1yZWYgYiBpKSkKICAgICAgICAgICAgICAgICAgICAobG9vcCAoKyBpIDEpKSkpKSkpKQoKKGRlZmluZSAoc3RyaW5nPD8gYSBiKQogIChsZXQgKChsZW4xIChzdHJpbmctbGVuZ3RoIGEpKQogICAgICAgIChsZW4yIChzdHJpbmctbGVuZ3RoIGIpKSkKICAgIChsZXQgbG9vcCAoKGkgMCkpCiAgICAgIChjb25kICgoPSBpIGxlbjEpICg8IGkgbGVuMikpCiAgICAgICAgICAgICgoPSBpIGxlbjIpICNmKQogICAgICAgICAgICAoKGNoYXI9PyAoc3RyaW5nLXJlZiBhIGkpIChzdHJpbmctcmVmIGIgaSkpIChsb29wICgrIGkgMSkpKQogICAgICAgICAgICAoZWxzZSAoY2hhcjw/IChzdHJpbmctcmVmIGEgaSkgKHN0cmluZy1yZWYgYiBpKSkpKSkpKQoKKGRlZmluZSAoc3RyaW5nLWNpPD8gYSBiKQogIChsZXQgKChsZW4xIChzdHJpbmctbGVuZ3RoIGEpKQogICAgICAgIChsZW4yIChzdHJpbmctbGVuZ3RoIGIpKSkKICAgIChsZXQgbG9vcCAoKGkgMCkpCiAgICAgIChjb25kICgoPSBpIGxlbjEpICg8IGkgbGVuMikpCiAgICAgICAgICAgICgoPSBpIGxlbjIpICNmKQogICAgICAgICAgICAoKGNoYXItY2k9PyAoc3RyaW5nLXJlZiBhIGkpIChzdHJpbmctcmVmIGIgaSkpIChsb29wICgrIGkgMSkpKQogICAgICAgICAgICAoZWxzZSAoY2hhci1jaTw/IChzdHJpbmctcmVmIGEgaSkgKHN0cmluZy1yZWYgYiBpKSkpKSkpKQoKKGRlZmluZSAoc3RyaW5nPj8gYSBiKSAoc3RyaW5nPD8gYiBhKSkKKGRlZmluZSAoc3RyaW5nPD0/IGEgYikgKG5vdCAoc3RyaW5nPj8gYSBiKSkpCihkZWZpbmUgKHN0cmluZz49PyBhIGIpIChub3QgKHN0cmluZzw/IGEgYikpKQoKKGRlZmluZSAoc3RyaW5nLWNpPj8gYSBiKSAoc3RyaW5nLWNpPD8gYiBhKSkKKGRlZmluZSAoc3RyaW5nLWNpPD0/IGEgYikgKG5vdCAoc3RyaW5nLWNpPj8gYSBiKSkpCihkZWZpbmUgKHN0cmluZy1jaT49PyBhIGIpIChub3QgKHN0cmluZy1jaTw/IGEgYikpKQoKKGRlZmluZSAoc3RyaW5nLWFwcGVuZCAuIHN0cmluZ3MpCiAgKGxldCogKCh0b3RhbC1sZW4gKGFwcGx5ICsgKG1hcCBzdHJpbmctbGVuZ3RoIHN0cmluZ3MpKSkKICAgICAgICAgKG5ldy1zdHIgKG1ha2Utc3RyaW5nIHRvdGFsLWxlbikpKQogICAgKGxldCBsb29wICgoc3Mgc3RyaW5ncykgKHBvcyAwKSkKICAgICAgKGlmIChudWxsPyBzcykgbmV3LXN0cgogICAgICAgICAgKGxldCogKChzIChjYXIgc3MpKQogICAgICAgICAgICAgICAgIChsZW4gKHN0cmluZy1sZW5ndGggcykpKQogICAgICAgICAgICAobGV0IGNvcHkgKChpIDApKQogICAgICAgICAgICAgIChpZiAoPSBpIGxlbikKICAgICAgICAgICAgICAgICAgKGxvb3AgKGNkciBzcykgKCsgcG9zIGxlbikpCiAgICAgICAgICAgICAgICAgIChiZWdpbiAoc3RyaW5nLXNldCEgbmV3LXN0ciAoKyBwb3MgaSkgKHN0cmluZy1yZWYgcyBpKSkKICAgICAgICAgICAgICAgICAgICAgICAgIChjb3B5ICgrIGkgMSkpKSkpKSkpKSkKCihkZWZpbmUgKHN1YnN0cmluZyBzIHN0YXJ0IGVuZCkKICAobGV0KiAoKGxlbiAoLSBlbmQgc3RhcnQpKQogICAgICAgICAobmV3LXN0ciAobWFrZS1zdHJpbmcgbGVuKSkpCiAgICAobGV0IGxvb3AgKChpIDApKQogICAgICAoaWYgKD0gaSBsZW4pIG5ldy1zdHIKICAgICAgICAgIChiZWdpbiAoc3RyaW5nLXNldCEgbmV3LXN0ciBpIChzdHJpbmctcmVmIHMgKCsgc3RhcnQgaSkpKQogICAgICAgICAgICAgICAgIChsb29wICgrIGkgMSkpKSkpKSkKCihkZWZpbmUgKHN0cmluZy1jb3B5IHMpIChzdWJzdHJpbmcgcyAwIChzdHJpbmctbGVuZ3RoIHMpKSkKCihkZWZpbmUgKHN0cmluZy1maWxsISBzIGMpCiAgKGxldCAoKGxlbiAoc3RyaW5nLWxlbmd0aCBzKSkpCiAgICAobGV0IGxvb3AgKChpIDApKQogICAgICAoaWYgKD0gaSBsZW4pIHMKICAgICAgICAgIChiZWdpbiAoc3RyaW5nLXNldCEgcyBpIGMpCiAgICAgICAgICAgICAgICAgKGxvb3AgKCsgaSAxKSkpKSkpKQoKOzs7IFZlY3RvciBwcm9jZWR1cmVzCihkZWZpbmUgKHZlY3Rvci1maWxsISB2IGZpbGwpCiAgKGxldCAoKGxlbiAodmVjdG9yLWxlbmd0aCB2KSkpCiAgICAobGV0IGxvb3AgKChpIDApKQogICAgICAoaWYgKD0gaSBsZW4pIHYKICAgICAgICAgIChiZWdpbiAodmVjdG9yLXNldCEgdiBpIGZpbGwpCiAgICAgICAgICAgICAgICAgKGxvb3AgKCsgaSAxKSkpKSkpKQoKKGRlZmluZSAodmVjdG9yLT5saXN0IHYpCiAgKGxldCAoKGxlbiAodmVjdG9yLWxlbmd0aCB2KSkpCiAgICAobGV0IGxvb3AgKChpICgtIGxlbiAxKSkgKHJlcyAnKCkpKQogICAgICAoaWYgKDwgaSAwKSByZXMKICAgICAgICAgIChsb29wICgtIGkgMSkgKGNvbnMgKHZlY3Rvci1yZWYgdiBpKSByZXMpKSkpKSkKCihkZWZpbmUgKGxpc3QtPnZlY3RvciBsc3QpCiAgKGxldCogKChsZW4gKGxlbmd0aCBsc3QpKQogICAgICAgICAodiAobWFrZS12ZWN0b3IgbGVuKSkpCiAgICAobGV0IGxvb3AgKChsIGxzdCkgKGkgMCkpCiAgICAgIChpZiAobnVsbD8gbCkgdgogICAgICAgICAgKGJlZ2luICh2ZWN0b3Itc2V0ISB2IGkgKGNhciBsKSkKICAgICAgICAgICAgICAgICAobG9vcCAoY2RyIGwpICgrIGkgMSkpKSkpKSkKCihkZWZpbmUgKHN0cmluZy0+bGlzdCBzKQogIChsZXQgKChsZW4gKHN0cmluZy1sZW5ndGggcykpKQogICAgKGxldCBsb29wICgoaSAoLSBsZW4gMSkpIChyZXMgJygpKSkKICAgICAgKGlmICg8IGkgMCkgcmVzCiAgICAgICAgICAobG9vcCAoLSBpIDEpIChjb25zIChzdHJpbmctcmVmIHMgaSkgcmVzKSkpKSkpCgooZGVmaW5lIChsaXN0LT5zdHJpbmcgbHN0KQogIChsZXQqICgobGVuIChsZW5ndGggbHN0KSkKICAgICAgICAgKHMgKG1ha2Utc3RyaW5nIGxlbikpKQogICAgKGxldCBsb29wICgobCBsc3QpIChpIDApKQogICAgICAoaWYgKG51bGw/IGwpIHMKICAgICAgICAgIChiZWdpbiAoc3RyaW5nLXNldCEgaSAoY2FyIGwpKQogICAgICAgICAgICAgICAgIChsb29wIChjZHIgbCkgKCsgaSAxKSkpKSkpKQoKOzs7IEhpZ2hlci1vcmRlciBmdW5jdGlvbnMKKGRlZmluZSAobWFwIHByb2MgbGlzdDEgLiBsaXN0cykKICAoaWYgKG51bGw/IGxpc3RzKQogICAgICAobGV0IGxvb3AgKChsIGxpc3QxKSkKICAgICAgICAoaWYgKG51bGw/IGwpICcoKQogICAgICAgICAgICAoY29ucyAocHJvYyAoY2FyIGwpKSAobG9vcCAoY2RyIGwpKSkpKQogICAgICAobGV0IGxvb3AgKChscyAoY29ucyBsaXN0MSBsaXN0cykpKQogICAgICAgIChpZiAobnVsbD8gKGNhciBscykpICcoKQogICAgICAgICAgICAoY29ucyAoYXBwbHkgcHJvYyAobGV0IG1hcC1jYXIgKChsIGxzKSkKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoaWYgKG51bGw/IGwpICcoKQogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoY29ucyAoY2FyIChjYXIgbCkpIChtYXAtY2FyIChjZHIgbCkpKSkpKQogICAgICAgICAgICAgICAgICAobG9vcCAobGV0IG1hcC1jZHIgKChsIGxzKSkKICAgICAgICAgICAgICAgICAgICAgICAgICAoaWYgKG51bGw/IGwpICcoKQogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoY29ucyAoY2RyIChjYXIgbCkpIChtYXAtY2RyIChjZHIgbCkpKSkpKSkpKSkpCgooZGVmaW5lIChmb3ItZWFjaCBwcm9jIGxpc3QxIC4gbGlzdHMpCiAgKGlmIChudWxsPyBsaXN0cykKICAgICAgKGxldCBsb29wICgobCBsaXN0MSkpCiAgICAgICAgKGlmIChudWxsPyBsKSAjdAogICAgICAgICAgICAoYmVnaW4gKHByb2MgKGNhciBsKSkgKGxvb3AgKGNkciBsKSkpKSkKICAgICAgKGxldCBsb29wICgobHMgKGNvbnMgbGlzdDEgbGlzdHMpKSkKICAgICAgICAoaWYgKG51bGw/IChjYXIgbHMpKSAjdAogICAgICAgICAgICAoYmVnaW4gKGFwcGx5IHByb2MgKGxldCBtYXAtY2FyICgobCBscykpCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChpZiAobnVsbD8gbCkgJygpCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoY29ucyAoY2FyIChjYXIgbCkpIChtYXAtY2FyIChjZHIgbCkpKSkpKQogICAgICAgICAgICAgICAgICAgKGxvb3AgKGxldCBtYXAtY2RyICgobCBscykpCiAgICAgICAgICAgICAgICAgICAgICAgICAgIChpZiAobnVsbD8gbCkgJygpCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoY29ucyAoY2RyIChjYXIgbCkpIChtYXAtY2RyIChjZHIgbCkpKSkpKSkpKSkpCjAJAACbJAAAPQkAAAAAAAAoMAAAwDAAANF0ngBXnb0qgHBSD///PicKAAAAZAAAAOgDAAAQJwAAoIYBAEBCDwCAlpgAAOH1BRgAAAA1AAAAcQAAAGv////O+///kr///wAAAAAAAAAAGQAKABkZGQAAAAAFAAAAAAAACQAAAAALAAAAAAAAAAAZABEKGRkZAwoHAAEACQsYAAAJBgsAAAsABhkAAAAZGRkAAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAAGQAKDRkZGQANAAACAAkOAAAACQAOAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAABMAAAAAEwAAAAAJDAAAAAAADAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAPAAAABA8AAAAACRAAAAAAABAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgAAAAAAAAAAAAAAEQAAAAARAAAAAAkSAAAAAAASAAASAAAaAAAAGhoaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABoAAAAaGhoAAAAAAAAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAXAAAAABcAAAAACRQAAAAAABQAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFgAAAAAAAAAAAAAAFQAAAAAVAAAAAAkWAAAAAAAWAAAWAAAwMTIzNDU2Nzg5QUJDREVGAEGg4AALuAKMMQIAAAAAAAUAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4AAAA9AAAArDICAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAD//////////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgwAAAAAAAABQAAAAAAAAAAAAAARAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPgAAAEUAAAC4MgIAAAQAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAP////8KAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwDAAADA5UgA=';
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
  function ___syscall_dup3(fd, suggestFD, flags) {
  try {
  
      var old = SYSCALLS.getStreamFromFD(fd);
      assert(!flags);
      if (old.fd === suggestFD) return -28;
      return SYSCALLS.doDup(old.path, old.flags, suggestFD);
    } catch (e) {
    if (typeof FS == 'undefined' || !(e instanceof FS.ErrnoError)) throw e;
    return -e.errno;
  }
  }

  function setErrNo(value) {
      HEAP32[((___errno_location())>>2)] = value;
      return value;
    }
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
  "__syscall_dup3": ___syscall_dup3,
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
var _get_output = Module["_get_output"] = createExportWrapper("get_output");

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

var ___emscripten_embedded_file_data = Module['___emscripten_embedded_file_data'] = 11736;
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





