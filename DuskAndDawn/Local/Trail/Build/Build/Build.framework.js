function unityFramework(Module) {
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
var Module = typeof Module !== 'undefined' ? Module : {};

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)
;

var stackTraceReference = "(^|\\n)(\\s+at\\s+|)jsStackTrace(\\s+\\(|@)([^\\n]+):\\d+:\\d+(\\)|)(\\n|$)";
var stackTraceReferenceMatch = jsStackTrace().match(new RegExp(stackTraceReference));
if (stackTraceReferenceMatch)
  Module.stackTraceRegExp = new RegExp(stackTraceReference.replace("([^\\n]+)", stackTraceReferenceMatch[4].replace(/[\\^${}[\]().*+?|]/g,"\\$&")).replace("jsStackTrace", "[^\\n]+"));

var abort = function (what) {
  if (ABORT)
    return;
  ABORT = true;
  EXITSTATUS = 1;
  if (typeof ENVIRONMENT_IS_PTHREAD !== "undefined" && ENVIRONMENT_IS_PTHREAD)
    console.error("Pthread aborting at " + new Error().stack);
  if (what !== undefined) {
    out(what);
    err(what);
    what = JSON.stringify(what)
  } else {
    what = "";
  }
  var message = "abort(" + what + ") at " + stackTrace();
  if (Module.abortHandler && Module.abortHandler(message))
    return;
  throw message;
}

if (typeof ENVIRONMENT_IS_PTHREAD === "undefined" || !ENVIRONMENT_IS_PTHREAD) {
  Module['preRun'].push(function () {
    // Initialize the IndexedDB based file system. Module['unityFileSystemInit'] allows
    // developers to override this with their own function, when they want to do cloud storage
    // instead.
    var unityFileSystemInit = Module['unityFileSystemInit'] || function () {
      FS.mkdir('/idbfs');
      FS.mount(IDBFS, {}, '/idbfs');
      Module.addRunDependency('JS_FileSystem_Mount');
      FS.syncfs(true, function (err) {
        if (err)
          console.log('IndexedDB is not available. Data will not persist in cache and PlayerPrefs will not be saved.');
        Module.removeRunDependency('JS_FileSystem_Mount');
      });
    };
    unityFileSystemInit();
  });
}

Module["SetFullscreen"] = function (fullscreen) {
  if (typeof runtimeInitialized === 'undefined' || !runtimeInitialized) {
    console.log ("Runtime not initialized yet.");
  } else if (typeof JSEvents === 'undefined') {
    console.log ("Player not loaded yet.");
  } else {
    var tmp = JSEvents.canPerformEventHandlerRequests;
    JSEvents.canPerformEventHandlerRequests = function () { return 1; };
    Module.ccall("SetFullscreen", null, ["number"], [fullscreen]);
    JSEvents.canPerformEventHandlerRequests = tmp;
  }
};
var MediaDevices = [];

if (typeof ENVIRONMENT_IS_PTHREAD === "undefined" || !ENVIRONMENT_IS_PTHREAD) {
  Module['preRun'].push(function () {

		var enumerateMediaDevices = function ()
		{

			var getMedia  = navigator.getUserMedia ||
							navigator.webkitGetUserMedia ||
							navigator.mozGetUserMedia ||
							navigator.msGetUserMedia;

			if (!getMedia) 
				return;

			function addDevice(label) 
			{
				label = label ? label : ("device #" + MediaDevices.length);

				var device = 
				{
					deviceName: label,
					refCount: 0,
					video: null
				};

				MediaDevices.push(device);
			}

			// try MediaDevices.enumerateDevices, if available
			if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) 
			{
				if (typeof MediaStreamTrack == 'undefined' ||
					typeof MediaStreamTrack.getSources == 'undefined') 
				{
					console.log("Media Devices cannot be enumerated on this browser.");
					return;
				}

				function gotSources(sourceInfos) 
				{

					for (var i = 0; i !== sourceInfos.length; ++i) 
					{
						var sourceInfo = sourceInfos[i];
						if (sourceInfo.kind === 'video') 
							addDevice(sourceInfo.label);
					}
				}

				// MediaStreamTrack.getSources asynchronously returns a list of objects that identify devices
				// and for privacy purposes the .label properties are not filled in unless the user has consented to
				// device access through getUserMedia.
				MediaStreamTrack.getSources(gotSources);
			}

			// List cameras and microphones.
			navigator.mediaDevices.enumerateDevices().then(function(devices) 
			{
				devices.forEach(function(device) 
				{
				  	// device: kind, label, deviceId
					if (device.kind == 'videoinput')
						addDevice(device.label);
				});
			})
			.catch(function(err) 
			{
				console.log(err.name + ": " + error.message);
			});
		};
		enumerateMediaDevices();
  });
}

function SendMessage(gameObject, func, param)
{
    if (param === undefined)
        Module.ccall("SendMessage", null, ["string", "string"], [gameObject, func]);
    else if (typeof param === "string")
        Module.ccall("SendMessageString", null, ["string", "string", "string"], [gameObject, func, param]);
    else if (typeof param === "number")
        Module.ccall("SendMessageFloat", null, ["string", "string", "number"], [gameObject, func, param]);
    else
        throw "" + param + " is does not have a type which is supported by SendMessage.";
}
Module["SendMessage"] = SendMessage; // to avoid emscripten stripping


// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
var key;
for (key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

Module['arguments'] = [];
Module['thisProgram'] = './this.program';
Module['quit'] = function(status, toThrow) {
  throw toThrow;
};
Module['preRun'] = [];
Module['postRun'] = [];

// The environment setup code below is customized to use Module.
// *** Environment setup code ***

var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
ENVIRONMENT_IS_WEB = typeof window === 'object';
ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function' && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;


// Three configurations we can be running in:
// 1) We could be the application main() thread running in the main JS UI thread. (ENVIRONMENT_IS_WORKER == false and ENVIRONMENT_IS_PTHREAD == false)
// 2) We could be the application main() thread proxied to worker. (with Emscripten -s PROXY_TO_WORKER=1) (ENVIRONMENT_IS_WORKER == true, ENVIRONMENT_IS_PTHREAD == false)
// 3) We could be an application pthread running in a worker. (ENVIRONMENT_IS_WORKER == true and ENVIRONMENT_IS_PTHREAD == true)


// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  } else {
    return scriptDirectory + path;
  }
}

if (ENVIRONMENT_IS_NODE) {
  scriptDirectory = __dirname + '/';

  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  var nodeFS;
  var nodePath;

  Module['read'] = function shell_read(filename, binary) {
    var ret;
      if (!nodeFS) nodeFS = require('fs');
      if (!nodePath) nodePath = require('path');
      filename = nodePath['normalize'](filename);
      ret = nodeFS['readFileSync'](filename);
    return binary ? ret : ret.toString();
  };

  Module['readBinary'] = function readBinary(filename) {
    var ret = Module['read'](filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }
    assert(ret.buffer);
    return ret;
  };

  if (process['argv'].length > 1) {
    Module['thisProgram'] = process['argv'][1].replace(/\\/g, '/');
  }

  Module['arguments'] = process['argv'].slice(2);

  if (typeof module !== 'undefined') {
    module['exports'] = Module;
  }

  process['on']('uncaughtException', function(ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });
  // Currently node will swallow unhandled rejections, but this behavior is
  // deprecated, and in the future it will exit with error status.
  process['on']('unhandledRejection', function(reason, p) {
    process['exit'](1);
  });

  Module['quit'] = function(status) {
    process['exit'](status);
  };

  Module['inspect'] = function () { return '[Emscripten Module object]'; };
} else
if (ENVIRONMENT_IS_SHELL) {


  if (typeof read != 'undefined') {
    Module['read'] = function shell_read(f) {
      return read(f);
    };
  }

  Module['readBinary'] = function readBinary(f) {
    var data;
    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f));
    }
    data = read(f, 'binary');
    assert(typeof data === 'object');
    return data;
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof quit === 'function') {
    Module['quit'] = function(status) {
      quit(status);
    }
  }
} else
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WEB) {
    if (document.currentScript) {
      scriptDirectory = document.currentScript.src;
    }
  } else { // worker
    scriptDirectory = self.location.href;
  }
  // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
  // otherwise, slice off the final part of the url to find the script directory.
  if (scriptDirectory.indexOf('blob:') !== 0) {
    scriptDirectory = scriptDirectory.split('/').slice(0, -1).join('/') + '/';
  } else {
    scriptDirectory = '';
  }


  Module['read'] = function shell_read(url) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.send(null);
      return xhr.responseText;
  };

  if (ENVIRONMENT_IS_WORKER) {
    Module['readBinary'] = function readBinary(url) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.responseType = 'arraybuffer';
        xhr.send(null);
        return new Uint8Array(xhr.response);
    };
  }

  Module['readAsync'] = function readAsync(url, onload, onerror) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function xhr_onload() {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
        onload(xhr.response);
        return;
      }
      onerror();
    };
    xhr.onerror = onerror;
    xhr.send(null);
  };

  Module['setWindowTitle'] = function(title) { document.title = title };
} else
{
}

// Set up the out() and err() hooks, which are how we can print to stdout or
// stderr, respectively.
// If the user provided Module.print or printErr, use that. Otherwise,
// console.log is checked first, as 'print' on the web will open a print dialogue
// printErr is preferable to console.warn (works better in shells)
// bind(console) is necessary to fix IE/Edge closed dev tools panel behavior.
var out = Module['print'] || (typeof console !== 'undefined' ? console.log.bind(console) : (typeof print !== 'undefined' ? print : null));
var err = Module['printErr'] || (typeof printErr !== 'undefined' ? printErr : ((typeof console !== 'undefined' && console.warn.bind(console)) || out));

// *** Environment setup code ***

// Merge back in the overrides
for (key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = undefined;



// {{PREAMBLE_ADDITIONS}}

var STACK_ALIGN = 16;


function staticAlloc(size) {
  var ret = STATICTOP;
  STATICTOP = (STATICTOP + size + 15) & -16;
  return ret;
}

function dynamicAlloc(size) {
  var ret = HEAP32[DYNAMICTOP_PTR>>2];
  var end = (ret + size + 15) & -16;
  HEAP32[DYNAMICTOP_PTR>>2] = end;
  if (end >= TOTAL_MEMORY) {
    var success = enlargeMemory();
    if (!success) {
      HEAP32[DYNAMICTOP_PTR>>2] = ret;
      return 0;
    }
  }
  return ret;
}

function alignMemory(size, factor) {
  if (!factor) factor = STACK_ALIGN; // stack alignment (16-byte) by default
  var ret = size = Math.ceil(size / factor) * factor;
  return ret;
}

function getNativeTypeSize(type) {
  switch (type) {
    case 'i1': case 'i8': return 1;
    case 'i16': return 2;
    case 'i32': return 4;
    case 'i64': return 8;
    case 'float': return 4;
    case 'double': return 8;
    default: {
      if (type[type.length-1] === '*') {
        return 4; // A pointer
      } else if (type[0] === 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 === 0);
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

var asm2wasmImports = { // special asm2wasm imports
    "f64-rem": function(x, y) {
        return x % y;
    },
    "debugger": function() {
        debugger;
    }
};



var jsCallStartIndex = 1;
var functionPointers = new Array(0);

// 'sig' parameter is only used on LLVM wasm backend
function addFunction(func, sig) {
  var base = 0;
  for (var i = base; i < base + 0; i++) {
    if (!functionPointers[i]) {
      functionPointers[i] = func;
      return jsCallStartIndex + i;
    }
  }
  throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
}

function removeFunction(index) {
  functionPointers[index-jsCallStartIndex] = null;
}

var funcWrappers = {};

function getFuncWrapper(func, sig) {
  if (!func) return; // on null pointer, return undefined
  assert(sig);
  if (!funcWrappers[sig]) {
    funcWrappers[sig] = {};
  }
  var sigCache = funcWrappers[sig];
  if (!sigCache[func]) {
    // optimize away arguments usage in common cases
    if (sig.length === 1) {
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func);
      };
    } else if (sig.length === 2) {
      sigCache[func] = function dynCall_wrapper(arg) {
        return dynCall(sig, func, [arg]);
      };
    } else {
      // general case
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func, Array.prototype.slice.call(arguments));
      };
    }
  }
  return sigCache[func];
}


function makeBigInt(low, high, unsigned) {
  return unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0));
}

function dynCall(sig, ptr, args) {
  if (args && args.length) {
    return Module['dynCall_' + sig].apply(null, [ptr].concat(args));
  } else {
    return Module['dynCall_' + sig].call(null, ptr);
  }
}



var Runtime = {
  // FIXME backwards compatibility layer for ports. Support some Runtime.*
  //       for now, fix it there, then remove it from here. That way we
  //       can minimize any period of breakage.
  dynCall: dynCall, // for SDL2 port
};

// The address globals begin at. Very low in memory, for code size and optimization opportunities.
// Above 0 is static memory, starting with globals.
// Then the stack.
// Then 'dynamic' memory for sbrk.
var GLOBAL_BASE = 1024;


// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html



//========================================
// Runtime essentials
//========================================

var ABORT = 0; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  assert(func, 'Cannot call unknown function ' + ident + ', make sure it is exported');
  return func;
}

var JSfuncs = {
  // Helpers for cwrap -- it can't refer to Runtime directly because it might
  // be renamed by closure, instead it calls JSfuncs['stackSave'].body to find
  // out what the minified function name is.
  'stackSave': function() {
    stackSave()
  },
  'stackRestore': function() {
    stackRestore()
  },
  // type conversion from js to c
  'arrayToC' : function(arr) {
    var ret = stackAlloc(arr.length);
    writeArrayToMemory(arr, ret);
    return ret;
  },
  'stringToC' : function(str) {
    var ret = 0;
    if (str !== null && str !== undefined && str !== 0) { // null string
      // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
      var len = (str.length << 2) + 1;
      ret = stackAlloc(len);
      stringToUTF8(str, ret, len);
    }
    return ret;
  }
};

// For fast lookup of conversion functions
var toC = {
  'string': JSfuncs['stringToC'], 'array': JSfuncs['arrayToC']
};


// C calling interface.
function ccall(ident, returnType, argTypes, args, opts) {
  function convertReturnValue(ret) {
    if (returnType === 'string') return Pointer_stringify(ret);
    if (returnType === 'boolean') return Boolean(ret);
    return ret;
  }

  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
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
  ret = convertReturnValue(ret);
  if (stack !== 0) stackRestore(stack);
  return ret;
}

function cwrap(ident, returnType, argTypes, opts) {
  argTypes = argTypes || [];
  // When the function takes numbers and returns a number, we can just return
  // the original function
  var numericArgs = argTypes.every(function(type){ return type === 'number'});
  var numericRet = returnType !== 'string';
  if (numericRet && numericArgs && !opts) {
    return getCFunc(ident);
  }
  return function() {
    return ccall(ident, returnType, argTypes, arguments, opts);
  }
}

/** @type {function(number, number, string, boolean=)} */
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[((ptr)>>0)]=value; break;
      case 'i8': HEAP8[((ptr)>>0)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}

/** @type {function(number, string, boolean=)} */
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for getValue: ' + type);
    }
  return null;
}

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
/** @type {function((TypedArray|Array<number>|number), string, number, number=)} */
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [typeof _malloc === 'function' ? _malloc : staticAlloc, stackAlloc, staticAlloc, dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var stop;
    ptr = ret;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)>>0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(/** @type {!Uint8Array} */ (slab), ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}

// Allocate memory during any stage of startup - static memory early on, dynamic memory later, malloc when ready
function getMemory(size) {
  if (!staticSealed) return staticAlloc(size);
  if (!runtimeInitialized) return dynamicAlloc(size);
  return _malloc(size);
}

/** @type {function(number, number=)} */
function Pointer_stringify(ptr, length) {
  if (length === 0 || !ptr) return '';
  // Find the length, and check for UTF while doing so
  var hasUtf = 0;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))>>0)];
    hasUtf |= t;
    if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (hasUtf < 128) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  return UTF8ToString(ptr);
}

// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function AsciiToString(ptr) {
  var str = '';
  while (1) {
    var ch = HEAP8[((ptr++)>>0)];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.

var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;
function UTF8ArrayToString(u8Array, idx) {
  var endPtr = idx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  while (u8Array[endPtr]) ++endPtr;

  if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
  } else {
    var u0, u1, u2, u3, u4, u5;

    var str = '';
    while (1) {
      // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
      u0 = u8Array[idx++];
      if (!u0) return str;
      if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
      u1 = u8Array[idx++] & 63;
      if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
      u2 = u8Array[idx++] & 63;
      if ((u0 & 0xF0) == 0xE0) {
        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
      } else {
        u3 = u8Array[idx++] & 63;
        if ((u0 & 0xF8) == 0xF0) {
          u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | u3;
        } else {
          u4 = u8Array[idx++] & 63;
          if ((u0 & 0xFC) == 0xF8) {
            u0 = ((u0 & 3) << 24) | (u1 << 18) | (u2 << 12) | (u3 << 6) | u4;
          } else {
            u5 = u8Array[idx++] & 63;
            u0 = ((u0 & 1) << 30) | (u1 << 24) | (u2 << 18) | (u3 << 12) | (u4 << 6) | u5;
          }
        }
      }
      if (u0 < 0x10000) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 0x10000;
        str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
      }
    }
  }
}

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function UTF8ToString(ptr) {
  return UTF8ArrayToString(HEAPU8,ptr);
}

// Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
// encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outU8Array: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array.
//                    This count should include the null terminator,
//                    i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
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
      outU8Array[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      outU8Array[outIdx++] = 0xC0 | (u >> 6);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      outU8Array[outIdx++] = 0xE0 | (u >> 12);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0x1FFFFF) {
      if (outIdx + 3 >= endIdx) break;
      outU8Array[outIdx++] = 0xF0 | (u >> 18);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0x3FFFFFF) {
      if (outIdx + 4 >= endIdx) break;
      outU8Array[outIdx++] = 0xF8 | (u >> 24);
      outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 5 >= endIdx) break;
      outU8Array[outIdx++] = 0xFC | (u >> 30);
      outU8Array[outIdx++] = 0x80 | ((u >> 24) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  outU8Array[outIdx] = 0;
  return outIdx - startIdx;
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8(str, outPtr, maxBytesToWrite) {
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
    if (u <= 0x7F) {
      ++len;
    } else if (u <= 0x7FF) {
      len += 2;
    } else if (u <= 0xFFFF) {
      len += 3;
    } else if (u <= 0x1FFFFF) {
      len += 4;
    } else if (u <= 0x3FFFFFF) {
      len += 5;
    } else {
      len += 6;
    }
  }
  return len;
}

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

var UTF16Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined;
function UTF16ToString(ptr) {
  var endPtr = ptr;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  var idx = endPtr >> 1;
  while (HEAP16[idx]) ++idx;
  endPtr = idx << 1;

  if (endPtr - ptr > 32 && UTF16Decoder) {
    return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  } else {
    var i = 0;

    var str = '';
    while (1) {
      var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
      if (codeUnit == 0) return str;
      ++i;
      // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
      str += String.fromCharCode(codeUnit);
    }
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
    HEAP16[((outPtr)>>1)]=codeUnit;
    outPtr += 2;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[((outPtr)>>1)]=0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF16(str) {
  return str.length*2;
}

function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
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
    HEAP32[((outPtr)>>2)]=codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[((outPtr)>>2)]=0;
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

function demangle(func) {
  return func;
}

function demangleAll(text) {
  var regex =
    /__Z[\w\d_]+/g;
  return text.replace(regex,
    function(x) {
      var y = demangle(x);
      return x === y ? x : (x + ' [' + y + ']');
    });
}

function jsStackTrace() {
  var err = new Error();
  if (!err.stack) {
    // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
    // so try that as a special-case.
    try {
      throw new Error(0);
    } catch(e) {
      err = e;
    }
    if (!err.stack) {
      return '(no stack trace available)';
    }
  }
  return err.stack.toString();
}

function stackTrace() {
  var js = jsStackTrace();
  if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
  return demangleAll(js);
}

// Memory management

var PAGE_SIZE = 16384;
var WASM_PAGE_SIZE = 65536;
var ASMJS_PAGE_SIZE = 16777216;
var MIN_TOTAL_MEMORY = 16777216;

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

function updateGlobalBuffer(buf) {
  Module['buffer'] = buffer = buf;
}

function updateGlobalBufferViews() {
  Module['HEAP8'] = HEAP8 = new Int8Array(buffer);
  Module['HEAP16'] = HEAP16 = new Int16Array(buffer);
  Module['HEAP32'] = HEAP32 = new Int32Array(buffer);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(buffer);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(buffer);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(buffer);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(buffer);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(buffer);
}

var STATIC_BASE, STATICTOP, staticSealed; // static area
var STACK_BASE, STACKTOP, STACK_MAX; // stack area
var DYNAMIC_BASE, DYNAMICTOP_PTR; // dynamic area handled by sbrk

  STATIC_BASE = STATICTOP = STACK_BASE = STACKTOP = STACK_MAX = DYNAMIC_BASE = DYNAMICTOP_PTR = 0;
  staticSealed = false;



function establishStackSpaceInModule(stackBase, stackMax) {
  STACK_BASE = STACKTOP = stackBase;
  STACK_MAX = stackMax;
}


function abortOnCannotGrowMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ');
}

if (!Module['reallocBuffer']) Module['reallocBuffer'] = function(size) {
  var ret;
  try {
    if (ArrayBuffer.transfer) {
      ret = ArrayBuffer.transfer(buffer, size);
    } else {
      var oldHEAP8 = HEAP8;
      ret = new ArrayBuffer(size);
      var temp = new Int8Array(ret);
      temp.set(oldHEAP8);
    }
  } catch(e) {
    return false;
  }
  var success = _emscripten_replace_memory(ret);
  if (!success) return false;
  return ret;
};

function enlargeMemory() {
  // TOTAL_MEMORY is the current size of the actual array, and DYNAMICTOP is the new top.


  var PAGE_MULTIPLE = Module["usingWasm"] ? WASM_PAGE_SIZE : ASMJS_PAGE_SIZE; // In wasm, heap size must be a multiple of 64KB. In asm.js, they need to be multiples of 16MB.
  var LIMIT = 2147483648 - PAGE_MULTIPLE; // We can do one page short of 2GB as theoretical maximum.

  if (HEAP32[DYNAMICTOP_PTR>>2] > LIMIT) {
    return false;
  }

  var OLD_TOTAL_MEMORY = TOTAL_MEMORY;
  TOTAL_MEMORY = Math.max(TOTAL_MEMORY, MIN_TOTAL_MEMORY); // So the loop below will not be infinite, and minimum asm.js memory size is 16MB.

  while (TOTAL_MEMORY < HEAP32[DYNAMICTOP_PTR>>2]) { // Keep incrementing the heap size as long as it's less than what is requested.
    if (TOTAL_MEMORY <= 536870912) {
      TOTAL_MEMORY = alignUp(2 * TOTAL_MEMORY, PAGE_MULTIPLE); // Simple heuristic: double until 1GB...
    } else {
      // ..., but after that, add smaller increments towards 2GB, which we cannot reach
      TOTAL_MEMORY = Math.min(alignUp((3 * TOTAL_MEMORY + 2147483648) / 4, PAGE_MULTIPLE), LIMIT);
    }
  }


  var replacement = Module['reallocBuffer'](TOTAL_MEMORY);
  if (!replacement || replacement.byteLength != TOTAL_MEMORY) {
    // restore the state to before this call, we failed
    TOTAL_MEMORY = OLD_TOTAL_MEMORY;
    return false;
  }

  // everything worked

  updateGlobalBuffer(replacement);
  updateGlobalBufferViews();



  return true;
}

var byteLength;
try {
  byteLength = Function.prototype.call.bind(Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength').get);
  byteLength(new ArrayBuffer(4)); // can fail on older ie
} catch(e) { // can fail on older node/v8
  byteLength = function(buffer) { return buffer.byteLength; };
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 33554432;
if (TOTAL_MEMORY < TOTAL_STACK) err('TOTAL_MEMORY should be larger than TOTAL_STACK, was ' + TOTAL_MEMORY + '! (TOTAL_STACK=' + TOTAL_STACK + ')');

// Initialize the runtime's memory



// Use a provided buffer, if there is one, or else allocate a new one
if (Module['buffer']) {
  buffer = Module['buffer'];
} else {
  // Use a WebAssembly memory where available
  if (typeof WebAssembly === 'object' && typeof WebAssembly.Memory === 'function') {
    Module['wasmMemory'] = new WebAssembly.Memory({ 'initial': TOTAL_MEMORY / WASM_PAGE_SIZE });
    buffer = Module['wasmMemory'].buffer;
  } else
  {
    buffer = new ArrayBuffer(TOTAL_MEMORY);
  }
  Module['buffer'] = buffer;
}
updateGlobalBufferViews();


function getTotalMemory() {
  return TOTAL_MEMORY;
}

// Endianness check (note: assumes compiler arch was little-endian)

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Module['dynCall_v'](func);
      } else {
        Module['dynCall_vi'](func, callback.arg);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the main() is called

var runtimeInitialized = false;
var runtimeExited = false;


function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
  runtimeExited = true;
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
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
  __ATEXIT__.unshift(cb);
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

// Deprecated: This function should not be called because it is unsafe and does not provide
// a maximum length limit of how many bytes it is allowed to write. Prefer calling the
// function stringToUTF8Array() instead, which takes in a maximum length that can be used
// to be secure from out of bounds writes.
/** @deprecated */
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
  HEAP8.set(array, buffer);
}

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    HEAP8[((buffer++)>>0)]=str.charCodeAt(i);
  }
  // Null-terminate the pointer to the HEAP.
  if (!dontAddNull) HEAP8[((buffer)>>0)]=0;
}

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_round = Math.round;
var Math_min = Math.min;
var Math_max = Math.max;
var Math_clz32 = Math.clz32;
var Math_trunc = Math.trunc;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function getUniqueRunDependency(id) {
  return id;
}

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}

function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
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



var memoryInitializer = null;






// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';

// Indicates whether filename is a base64 data URI.
function isDataURI(filename) {
  return String.prototype.startsWith ?
      filename.startsWith(dataURIPrefix) :
      filename.indexOf(dataURIPrefix) === 0;
}




function integrateWasmJS() {
  // wasm.js has several methods for creating the compiled code module here:
  //  * 'native-wasm' : use native WebAssembly support in the browser
  //  * 'interpret-s-expr': load s-expression code from a .wast and interpret
  //  * 'interpret-binary': load binary wasm and interpret
  //  * 'interpret-asm2wasm': load asm.js code, translate to wasm, and interpret
  //  * 'asmjs': no wasm, just load the asm.js code and use that (good for testing)
  // The method is set at compile time (BINARYEN_METHOD)
  // The method can be a comma-separated list, in which case, we will try the
  // options one by one. Some of them can fail gracefully, and then we can try
  // the next.

  // inputs

  var method = 'native-wasm';

  var wasmTextFile = 'build.wast';
  var wasmBinaryFile = 'build.wasm';
  var asmjsCodeFile = 'build.temp.asm.js';

  if (!isDataURI(wasmTextFile)) {
    wasmTextFile = locateFile(wasmTextFile);
  }
  if (!isDataURI(wasmBinaryFile)) {
    wasmBinaryFile = locateFile(wasmBinaryFile);
  }
  if (!isDataURI(asmjsCodeFile)) {
    asmjsCodeFile = locateFile(asmjsCodeFile);
  }

  // utilities

  var wasmPageSize = 64*1024;

  var info = {
    'global': null,
    'env': null,
    'asm2wasm': asm2wasmImports,
    'parent': Module // Module inside wasm-js.cpp refers to wasm-js.cpp; this allows access to the outside program.
  };

  var exports = null;


  function mergeMemory(newBuffer) {
    // The wasm instance creates its memory. But static init code might have written to
    // buffer already, including the mem init file, and we must copy it over in a proper merge.
    // TODO: avoid this copy, by avoiding such static init writes
    // TODO: in shorter term, just copy up to the last static init write
    var oldBuffer = Module['buffer'];
    if (newBuffer.byteLength < oldBuffer.byteLength) {
      err('the new buffer in mergeMemory is smaller than the previous one. in native wasm, we should grow memory here');
    }
    var oldView = new Int8Array(oldBuffer);
    var newView = new Int8Array(newBuffer);


    newView.set(oldView);
    updateGlobalBuffer(newBuffer);
    updateGlobalBufferViews();
  }

  function fixImports(imports) {
    return imports;
  }

  function getBinary() {
    try {
      if (Module['wasmBinary']) {
        return new Uint8Array(Module['wasmBinary']);
      }
      if (Module['readBinary']) {
        return Module['readBinary'](wasmBinaryFile);
      } else {
        throw "both async and sync fetching of the wasm failed";
      }
    }
    catch (err) {
      abort(err);
    }
  }

  function getBinaryPromise() {
    // if we don't have the binary yet, and have the Fetch api, use that
    // in some environments, like Electron's render process, Fetch api may be present, but have a different context than expected, let's only use it on the Web
    if (!Module['wasmBinary'] && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === 'function') {
      return fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function(response) {
        if (!response['ok']) {
          throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
        }
        return response['arrayBuffer']();
      }).catch(function () {
        return getBinary();
      });
    }
    // Otherwise, getBinary should be able to get it synchronously
    return new Promise(function(resolve, reject) {
      resolve(getBinary());
    });
  }

  // do-method functions


  function doNativeWasm(global, env, providedBuffer) {
    if (typeof WebAssembly !== 'object') {
      err('no native wasm support detected');
      return false;
    }
    // prepare memory import
    if (!(Module['wasmMemory'] instanceof WebAssembly.Memory)) {
      err('no native wasm Memory in use');
      return false;
    }
    env['memory'] = Module['wasmMemory'];
    // Load the wasm module and create an instance of using native support in the JS engine.
    info['global'] = {
      'NaN': NaN,
      'Infinity': Infinity
    };
    info['global.Math'] = Math;
    info['env'] = env;
    // handle a generated wasm instance, receiving its exports and
    // performing other necessary setup
    function receiveInstance(instance, module) {
      exports = instance.exports;
      if (exports.memory) mergeMemory(exports.memory);
      Module['asm'] = exports;
      Module["usingWasm"] = true;
      removeRunDependency('wasm-instantiate');
    }
    addRunDependency('wasm-instantiate');

    // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
    // to manually instantiate the Wasm module themselves. This allows pages to run the instantiation parallel
    // to any other async startup actions they are performing.
    if (Module['instantiateWasm']) {
      try {
        return Module['instantiateWasm'](info, receiveInstance);
      } catch(e) {
        err('Module.instantiateWasm callback failed with error: ' + e);
        return false;
      }
    }

    function receiveInstantiatedSource(output) {
      // 'output' is a WebAssemblyInstantiatedSource object which has both the module and instance.
      // receiveInstance() will swap in the exports (to Module.asm) so they can be called
      receiveInstance(output['instance'], output['module']);
    }
    function instantiateArrayBuffer(receiver) {
      getBinaryPromise().then(function(binary) {
        return WebAssembly.instantiate(binary, info);
      }).then(receiver).catch(function(reason) {
        err('failed to asynchronously prepare wasm: ' + reason);
        abort(reason);
      });
    }
    // Prefer streaming instantiation if available.
    if (!Module['wasmBinary'] &&
        typeof WebAssembly.instantiateStreaming === 'function' &&
        !isDataURI(wasmBinaryFile) &&
        typeof fetch === 'function') {
      WebAssembly.instantiateStreaming(fetch(wasmBinaryFile, { credentials: 'same-origin' }), info)
        .then(receiveInstantiatedSource)
        .catch(function(reason) {
          // We expect the most common failure cause to be a bad MIME type for the binary,
          // in which case falling back to ArrayBuffer instantiation should work.
          err('wasm streaming compile failed: ' + reason);
          err('falling back to ArrayBuffer instantiation');
          instantiateArrayBuffer(receiveInstantiatedSource);
        });
    } else {
      instantiateArrayBuffer(receiveInstantiatedSource);
    }
    return {}; // no exports yet; we'll fill them in later
  }


  // We may have a preloaded value in Module.asm, save it
  Module['asmPreload'] = Module['asm'];

  // Memory growth integration code

  var asmjsReallocBuffer = Module['reallocBuffer'];

  var wasmReallocBuffer = function(size) {
    var PAGE_MULTIPLE = Module["usingWasm"] ? WASM_PAGE_SIZE : ASMJS_PAGE_SIZE; // In wasm, heap size must be a multiple of 64KB. In asm.js, they need to be multiples of 16MB.
    size = alignUp(size, PAGE_MULTIPLE); // round up to wasm page size
    var old = Module['buffer'];
    var oldSize = old.byteLength;
    if (Module["usingWasm"]) {
      // native wasm support
      try {
        var result = Module['wasmMemory'].grow((size - oldSize) / wasmPageSize); // .grow() takes a delta compared to the previous size
        if (result !== (-1 | 0)) {
          // success in native wasm memory growth, get the buffer from the memory
          return Module['buffer'] = Module['wasmMemory'].buffer;
        } else {
          return null;
        }
      } catch(e) {
        return null;
      }
    }
  };

  Module['reallocBuffer'] = function(size) {
    if (finalMethod === 'asmjs') {
      return asmjsReallocBuffer(size);
    } else {
      return wasmReallocBuffer(size);
    }
  };

  // we may try more than one; this is the final one, that worked and we are using
  var finalMethod = '';

  // Provide an "asm.js function" for the application, called to "link" the asm.js module. We instantiate
  // the wasm module at that time, and it receives imports and provides exports and so forth, the app
  // doesn't need to care that it is wasm or olyfilled wasm or asm.js.

  Module['asm'] = function(global, env, providedBuffer) {
    env = fixImports(env);

    // import table
    if (!env['table']) {
      var TABLE_SIZE = Module['wasmTableSize'];
      if (TABLE_SIZE === undefined) TABLE_SIZE = 1024; // works in binaryen interpreter at least
      var MAX_TABLE_SIZE = Module['wasmMaxTableSize'];
      if (typeof WebAssembly === 'object' && typeof WebAssembly.Table === 'function') {
        if (MAX_TABLE_SIZE !== undefined) {
          env['table'] = new WebAssembly.Table({ 'initial': TABLE_SIZE, 'maximum': MAX_TABLE_SIZE, 'element': 'anyfunc' });
        } else {
          env['table'] = new WebAssembly.Table({ 'initial': TABLE_SIZE, element: 'anyfunc' });
        }
      } else {
        env['table'] = new Array(TABLE_SIZE); // works in binaryen interpreter at least
      }
      Module['wasmTable'] = env['table'];
    }

    if (!env['memoryBase']) {
      env['memoryBase'] = Module['STATIC_BASE']; // tell the memory segments where to place themselves
    }
    if (!env['tableBase']) {
      env['tableBase'] = 0; // table starts at 0 by default, in dynamic linking this will change
    }

    // try the methods. each should return the exports if it succeeded

    var exports;
    exports = doNativeWasm(global, env, providedBuffer);

    assert(exports, 'no binaryen method succeeded.');


    return exports;
  };

  var methodHandler = Module['asm']; // note our method handler, as we may modify Module['asm'] later
}

integrateWasmJS();

// === Body ===

var ASM_CONSTS = [function() { return Module.webglContextAttributes.premultipliedAlpha; },
 function() { return Module.webglContextAttributes.preserveDrawingBuffer; },
 function($0) { throw new Error("Internal Unity error: gles::GetProcAddress(\"" + Pointer_stringify($0) + "\") was called but gles::GetProcAddress() is not implemented on Unity WebGL. Please report a bug.") },
 function() { return typeof Module.shouldQuit != "undefined" },
 function() { for (var id in Module.intervals) { window.clearInterval(id); } Module.intervals = {}; for (var i = 0; i < Module.deinitializers.length; i++) { Module.deinitializers[i](); } Module.deinitializers = []; if (typeof Module.onQuit == "function") Module.onQuit(); },
 function($0, $1) { __trail.string.jsToCpp(__trail.instrument.gpu.getRenderer(), $0, $1); },
 function() { return screen.width; },
 function() { return screen.height; },
 function() { return Module.canvas.width; },
 function() { return Module.canvas.height; },
 function() { __trail.instrument.gpu.beginMeasurement() },
 function() { return __trail.instrument.gpu.hasMoreMeasurements() },
 function() { return __trail.instrument.gpu.getOldestMeasurement() },
 function() { __trail.instrument.gpu.resetMeasurements() },
 function() { __trail.instrument.gpu.endMeasurement() },
 function($0, $1) { trail.sdk.v1.sendGameMessage(new Uint8Array(HEAPU8.buffer, $0, $1).slice()); },
 function($0) { trail.sdk.v1.setMessageHandler(function(msg) { var instance = $0; if (!(msg instanceof Uint8Array)) { throw new Error('received message that is not an Uint8Array, but ' + msg); } var buffer = Module._malloc(msg.byteLength); HEAPU8.set(msg, buffer); Module._trail__bridge_on_message(instance, buffer, msg.byteLength); Module._free(buffer); }); },
 function() { return __trail.renderLoop.unsetRenderLoopCallbacks(); },
 function() { trail.sdk.v1.setMessageHandler(undefined); },
 function($0, $1, $2, $3, $4) { var trailsdkJS = $0; var trailsdkJSLen = $1; var trailVersion = $2; var trailGitCommit = $3; var trailGitBranch = $4; var array = HEAPU8.subarray(trailsdkJS, trailsdkJS + trailsdkJSLen); var source = ""; for (var i = 0; i < array.byteLength; i++) { source += String.fromCharCode(array[i]); } eval(source); __trail.sdkVersion = __trail.string.cppToJS(trailVersion); __trail.sdkCommit = __trail.string.cppToJS(trailGitCommit); __trail.sdkBranch = __trail.string.cppToJS(trailGitBranch); __trail.crash = _trail__sdk_crash; },
 function() { return performance.now() - trail.sdk.v1.getBootTime(); },
 function($0) { var instance = $0; return __trail.renderLoop.setRenderLoopCallbacks( instance, _trail__sdk_pre_frame, _trail__sdk_post_frame ); },
 function($0) { window.addEventListener("keydown", function(e) { if (e.code === "Period") { if (e.ctrlKey && (e.altKey || e.metaKey)) { Module._trail__instrument_fps_ontoggle($0); } else { Module._trail__instrument_fps_onpause($0); } } }); },
 function() { var state = trail.sdk.v1.getCloudSaveState(); if (state === undefined) { return; } for (var i = 0; i < state.files.length; ++i) { var file = state.files[i]; var parts = file.path.split("/"); var fullPath = "/trail/cloud_storage"; var skip = false; for (var j = 0; j < parts.length - 1; ++j) { fullPath += "/" + parts[j]; var res = FS.analyzePath(fullPath, false); if (!res.exists) { FS.mkdir(fullPath); } else if (!FS.isDir(res.object.mode)) { console.warn("failed to create cloud storage directory " + fullPath + ", already exists"); skip = true; break; } } if (skip) { continue; } var path = "/trail/cloud_storage/" + file.path; var res = FS.analyzePath(path, false); if (res.exists) { console.warn(path + " already exists while writing cloud storage file, skipping"); break; } FS.writeFile(path, file.data); FS.utime(path, file.timestamp, file.timestamp); } },
 function() { var trace = new Error().stack; var buffer = Module._malloc(trace.length + 1); __trail.string.jsToCpp(trace, buffer, trace.length + 1); return buffer; },
 function($0, $1) { var filepath = $0; var filepath_length = $1; var id = trail.sdk.v1.getFileID(__trail.string.cppToJS(filepath, filepath_length)); if (!id) { return -1; } return trail.sdk.v1.getFileSize(id); },
 function($0, $1, $2, $3, $4, $5) { var filepath = $0; var filepath_length = $1; var buffer = $2; var buffer_size = $3; var callback = $4; var data = $5; var id = trail.sdk.v1.getFileID(__trail.string.cppToJS(filepath, filepath_length)); if (!id) { setTimeout(function() { Module._trail_flk_dispatch_read_file_callback(1, callback, data); }, 0); return; } var size = trail.sdk.v1.getFileSize(id); if (size > buffer_size) { setTimeout(function() { Module._trail_flk_dispatch_read_file_callback(2, callback, data); }, 0); return; } trail.sdk.v1.readFile(id).then(function(ab) { Module.HEAPU8.set(ab, buffer); _trail__flk_dispatch_read_file_callback(0, callback, data); }).catch(function() { _trail__flk_dispatch_read_file_callback(3, callback, data); }); },
 function($0, $1) { var filepath = $0; var filepath_length = $1; var id = trail.sdk.v1.getFileID(__trail.string.cppToJS(filepath, filepath_length)); if (!id) { return false; } trail.sdk.v1.preloadFile(id); return true; },
 function($0, $1) { var lookup = FS.lookupPath("/trail/cloud_storage"); var node = lookup.node; var files = []; function walkDirectory(node, path) { for (var fileName in node.contents) { var newNode = node.contents[fileName]; if (newNode.isFolder) { walkDirectory(newNode, path + newNode.name + "/"); } else { var data = FS.readFile("/trail/cloud_storage/" + path + newNode.name); files.push({ path: path + newNode.name, data: data, timestamp: newNode.timestamp, }); } } } walkDirectory(lookup.node, ""); trail.sdk.v1.syncCloudStorage(files).then(() => { _trail__flk_dispatch_sync_cloud_storage_callback(0, $0, $1); }).catch((error) => { if (error instanceof trail.sdk.v1.CloudStorageConflictError) { _trail__flk_dispatch_sync_cloud_storage_callback(2, $0, $1); } else { console.warn("unexpected error syncing cloud storage", error); _trail__flk_dispatch_sync_cloud_storage_callback(1, $0, $1); } }); },
 function($0, $1) { Module.canvas.width = $0; Module.canvas.height = $1; },
 function() { __trail.renderLoop.skipCurrentFrame() }];

function _emscripten_asm_const_i(code) {
  return ASM_CONSTS[code]();
}

function _emscripten_asm_const_d(code) {
  return ASM_CONSTS[code]();
}

function _emscripten_asm_const_iii(code, a0, a1) {
  return ASM_CONSTS[code](a0, a1);
}

function _emscripten_asm_const_sync_on_main_thread_i(code) {
  return ASM_CONSTS[code]();
}

function _emscripten_asm_const_ii(code, a0) {
  return ASM_CONSTS[code](a0);
}

function _emscripten_asm_const_iiiiiii(code, a0, a1, a2, a3, a4, a5) {
  return ASM_CONSTS[code](a0, a1, a2, a3, a4, a5);
}

function _emscripten_asm_const_iiiiii(code, a0, a1, a2, a3, a4) {
  return ASM_CONSTS[code](a0, a1, a2, a3, a4);
}




STATIC_BASE = GLOBAL_BASE;

STATICTOP = STATIC_BASE + 3546016;
/* global initializers */  __ATINIT__.push({ func: function() { __GLOBAL__I_000101() } }, { func: function() { __GLOBAL__sub_I_AIScriptingClasses_cpp() } }, { func: function() { ___cxx_global_var_init() } }, { func: function() { __GLOBAL__sub_I_AndroidJNIScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_AnimationScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Animation_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Animation_2_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Animation_7_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Animation_Constraints_0_cpp() } }, { func: function() { __GLOBAL__sub_I_clipmuscle_cpp() } }, { func: function() { __GLOBAL__sub_I_AnimationClip_cpp() } }, { func: function() { __GLOBAL__sub_I_AssetBundleScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_AssetBundle_Public_0_cpp() } }, { func: function() { __GLOBAL__sub_I_AudioScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Video_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Audio_Public_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Audio_Public_1_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Audio_Public_2_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Audio_Public_3_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Audio_Public_ScriptBindings_1_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Audio_Public_sound_0_cpp() } }, { func: function() { __GLOBAL__sub_I_ClothScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Cloth_0_cpp() } }, { func: function() { ___cxx_global_var_init_18() } }, { func: function() { __GLOBAL__sub_I_nvcloth_src_0_cpp() } }, { func: function() { __GLOBAL__sub_I_nvcloth_src_1_cpp() } }, { func: function() { __GLOBAL__sub_I_SwInterCollision_cpp() } }, { func: function() { __GLOBAL__sub_I_SwSolverKernel_cpp() } }, { func: function() { __GLOBAL__sub_I_artifacts_WebGL_codegenerator_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_GfxDevice_opengles_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_VirtualFileSystem_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Input_0_cpp() } }, { func: function() { __GLOBAL__sub_I_GfxDeviceNull_cpp() } }, { func: function() { __GLOBAL__sub_I_External_ProphecySDK_BlitOperations_1_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_2D_Renderer_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_2D_Sorting_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_2D_SpriteAtlas_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Allocator_1_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Allocator_2_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Application_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_BaseClasses_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_BaseClasses_1_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_BaseClasses_2_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_BaseClasses_3_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Bootstrap_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Burst_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Camera_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Camera_1_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Camera_2_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Camera_6_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Camera_7_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Camera_8_cpp() } }, { func: function() { __GLOBAL__sub_I_Shadows_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Camera_Culling_0_cpp() } }, { func: function() { __GLOBAL__sub_I_GUITexture_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Camera_RenderLoops_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Camera_RenderLoops_2_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Containers_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Core_Callbacks_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_File_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Geometry_2_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Graphics_0_cpp() } }, { func: function() { ___cxx_global_var_init_104() } }, { func: function() { __GLOBAL__sub_I_Runtime_Graphics_1_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Graphics_2_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Graphics_4_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Graphics_5_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Graphics_6_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Graphics_8_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Graphics_9_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Graphics_10_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Graphics_11_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Graphics_12_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Graphics_Billboard_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Graphics_CommandBuffer_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Graphics_LOD_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Graphics_Mesh_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Graphics_Mesh_1_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Graphics_Mesh_2_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Graphics_Mesh_4_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Graphics_Mesh_5_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Graphics_ScriptableRenderLoop_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Interfaces_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Interfaces_1_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Interfaces_2_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Jobs_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Jobs_1_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Jobs_2_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Jobs_Internal_1_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Jobs_ScriptBindings_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Math_2_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Math_Random_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Misc_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Misc_2_cpp() } }, { func: function() { ___cxx_global_var_init_130() } }, { func: function() { __GLOBAL__sub_I_Runtime_Misc_3_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Misc_4_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Misc_5_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_PreloadManager_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Profiler_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Profiler_2_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Profiler_ExternalGPUProfiler_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Profiler_ScriptBindings_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_SceneManager_0_cpp() } }, { func: function() { ___cxx_global_var_init_7638() } }, { func: function() { __GLOBAL__sub_I_Runtime_Shaders_1_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Shaders_3_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Shaders_GpuPrograms_0_cpp() } }, { func: function() { ___cxx_global_var_init_8611() } }, { func: function() { __GLOBAL__sub_I_Runtime_Shaders_ShaderImpl_2_cpp() } }, { func: function() { ___cxx_global_var_init_8792() } }, { func: function() { __GLOBAL__sub_I_Runtime_Transform_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Transform_1_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Utilities_2_cpp() } }, { func: function() { ___cxx_global_var_init_9187() } }, { func: function() { __GLOBAL__sub_I_Runtime_Utilities_5_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Utilities_6_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Utilities_7_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Utilities_9_cpp() } }, { func: function() { __GLOBAL__sub_I_AssetBundleFileSystem_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Modules_0_cpp() } }, { func: function() { ___cxx_global_var_init_17() } }, { func: function() { ___cxx_global_var_init_18_1167() } }, { func: function() { ___cxx_global_var_init_19() } }, { func: function() { __GLOBAL__sub_I_Modules_Profiler_Public_1_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Profiler_Runtime_1_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Export_Unsafe_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_GfxDevice_1_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_GfxDevice_2_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_GfxDevice_3_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_GfxDevice_4_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_GfxDevice_5_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_PluginInterface_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Director_Core_1_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_ScriptingBackend_Il2Cpp_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Scripting_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Scripting_2_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Scripting_3_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Mono_SerializationBackend_DirectMemoryAccess_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Mono_SerializationBackend_DirectMemoryAccess_1_cpp() } }, { func: function() { __GLOBAL__sub_I_TemplateInstantiations_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Scripting_APIUpdating_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Serialize_1_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Serialize_2_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Serialize_TransferFunctions_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Runtime_Serialize_TransferFunctions_1_cpp() } }, { func: function() { __GLOBAL__sub_I_PlatformDependent_WebGL_Source_0_cpp() } }, { func: function() { __GLOBAL__sub_I_PlatformDependent_WebGL_Source_2_cpp() } }, { func: function() { __GLOBAL__sub_I_Mesh_cpp() } }, { func: function() { __GLOBAL__sub_I_LogAssert_cpp() } }, { func: function() { __GLOBAL__sub_I_Shader_cpp() } }, { func: function() { __GLOBAL__sub_I_External_baselib_builds_Source_0_cpp() } }, { func: function() { __GLOBAL__sub_I_PlatformDependent_WebGL_External_baselib_builds_Source_0_cpp() } }, { func: function() { __GLOBAL__sub_I_DirectorScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_DSPGraph_Public_1_cpp() } }, { func: function() { __GLOBAL__sub_I_GridScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Grid_Public_0_cpp() } }, { func: function() { ___cxx_global_var_init_3773() } }, { func: function() { __GLOBAL__sub_I_IMGUIScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_IMGUI_0_cpp() } }, { func: function() { ___cxx_global_var_init_22() } }, { func: function() { __GLOBAL__sub_I_Modules_IMGUI_1_cpp() } }, { func: function() { __GLOBAL__sub_I_InputLegacyScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_InputScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Input_Private_0_cpp() } }, { func: function() { __GLOBAL__sub_I_ParticleSystemScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_ParticleSystem_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_ParticleSystem_1_cpp() } }, { func: function() { __GLOBAL__sub_I_ParticleSystemGeometryJob_cpp() } }, { func: function() { __GLOBAL__sub_I_ShapeModule_cpp() } }, { func: function() { __GLOBAL__sub_I_UVModule_cpp() } }, { func: function() { __GLOBAL__sub_I_Physics2DScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Physics2D_Public_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Physics2D_Public_1_cpp() } }, { func: function() { __GLOBAL__sub_I_PhysicsScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Physics_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Physics_2_cpp() } }, { func: function() { __GLOBAL__sub_I_PhysicsQuery_cpp() } }, { func: function() { __GLOBAL__sub_I_physx_source_physxextensions_src_2_cpp() } }, { func: function() { __GLOBAL__sub_I_SubsystemsScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Subsystems_0_cpp() } }, { func: function() { __GLOBAL__sub_I_TerrainScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Terrain_Public_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Terrain_Public_1_cpp() } }, { func: function() { ___cxx_global_var_init_89() } }, { func: function() { __GLOBAL__sub_I_Modules_Terrain_Public_2_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Terrain_Public_3_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Terrain_VR_0_cpp() } }, { func: function() { __GLOBAL__sub_I_TextCoreScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_TextCore_Native_FontEngine_0_cpp() } }, { func: function() { __GLOBAL__sub_I_TextRenderingScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_TextRendering_Public_0_cpp() } }, { func: function() { __GLOBAL__sub_I_TilemapScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Tilemap_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Tilemap_Public_0_cpp() } }, { func: function() { __GLOBAL__sub_I_TLS_cpp() } }, { func: function() { __GLOBAL__sub_I_UIElementsNativeScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_External_Yoga_Yoga_0_cpp() } }, { func: function() { __GLOBAL__sub_I_UIScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_UI_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_UI_1_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_UI_2_cpp() } }, { func: function() { __GLOBAL__sub_I_umbra_cpp() } }, { func: function() { __GLOBAL__sub_I_UnityAnalyticsScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_UnityAdsSettings_cpp() } }, { func: function() { __GLOBAL__sub_I_UnityWebRequestScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_UnityWebRequest_Public_0_cpp() } }, { func: function() { __GLOBAL__sub_I_VFXScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_VFX_Public_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_VFX_Public_1_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_VFX_Public_Systems_0_cpp() } }, { func: function() { __GLOBAL__sub_I_VisualEffectAsset_cpp() } }, { func: function() { __GLOBAL__sub_I_VideoScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Video_Public_Base_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_Video_Public_Base_1_cpp() } }, { func: function() { __GLOBAL__sub_I_VideoYUV420Convert_cpp() } }, { func: function() { __GLOBAL__sub_I_VRScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_VR_0_cpp() } }, { func: function() { __GLOBAL__sub_I_PluginInterfaceVR_cpp() } }, { func: function() { __GLOBAL__sub_I_Wind_cpp() } }, { func: function() { __GLOBAL__sub_I_XRScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_Modules_XR_Subsystems_Input_Public_1_cpp() } }, { func: function() { __GLOBAL__sub_I_External_il2cpp_builds_external_baselib_Source_0_cpp() } }, { func: function() { __GLOBAL__sub_I_External_il2cpp_builds_external_baselib_Platforms_WebGL_Source_0_cpp() } }, { func: function() { __GLOBAL__sub_I_Lump_libil2cpp_os_cpp() } }, { func: function() { __GLOBAL__sub_I_Lump_libil2cpp_icalls_cpp() } }, { func: function() { __GLOBAL__sub_I_Lump_libil2cpp_vm_cpp() } }, { func: function() { __GLOBAL__sub_I_Lump_libil2cpp_metadata_cpp() } }, { func: function() { __GLOBAL__sub_I_Lump_libil2cpp_utils_cpp() } }, { func: function() { __GLOBAL__sub_I_Lump_libil2cpp_vm_utils_cpp() } }, { func: function() { __GLOBAL__sub_I_Lump_libil2cpp_mono_cpp() } }, { func: function() { __GLOBAL__sub_I_Lump_libil2cpp_gc_cpp() } }, { func: function() { __GLOBAL__sub_I_status_cc() } }, { func: function() { ___emscripten_environ_constructor() } }, { func: function() { __GLOBAL__sub_I_AccessibilityScriptingClasses_cpp() } }, { func: function() { __GLOBAL__sub_I_iostream_cpp() } });







var STATIC_BUMP = 3546016;
Module["STATIC_BASE"] = STATIC_BASE;
Module["STATIC_BUMP"] = STATIC_BUMP;

/* no memory initializer */
var tempDoublePtr = STATICTOP; STATICTOP += 16;

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}

// {{PRE_LIBRARY}}


  function _JS_Cursor_SetImage(ptr, length) {
      var binary = "";
      for (var i = 0; i < length; i++)
        binary += String.fromCharCode(HEAPU8[ptr + i]);
      Module.canvas.style.cursor = "url(data:image/cur;base64," + btoa(binary) + "),default";
    }

  function _JS_Cursor_SetShow(show) {
      Module.canvas.style.cursor = show ? "default" : "none";
    }

  function _JS_Eval_ClearInterval(id)
  {
  	window.clearInterval(id);
  }

  function _JS_Eval_SetInterval(func, arg, millis)
  {
      Module['noExitRuntime'] = true;
  
      function wrapper() {
        getFuncWrapper(func, 'vi')(arg);
      }
  
  	return Browser.safeSetInterval(wrapper, millis);
  }

  
  var fs={numPendingSync:0,syncInternal:1000,syncInProgress:false,sync:function (onlyPendingSync)
  	{
  		if (onlyPendingSync) {
  			if (fs.numPendingSync == 0)
  				return;
  		}
  		else if (fs.syncInProgress) {
  			// this is to avoid indexedDB memory leak when FS.syncfs is executed before the previous one completed.
  			fs.numPendingSync++;
  			return;
  		}
  
  		fs.syncInProgress = true;
  		FS.syncfs(false, (function(err) {
  			fs.syncInProgress = false;
  		}));
  		fs.numPendingSync = 0;
  	}};function _JS_FileSystem_Initialize()
  {
  	Module.setInterval(function(){
  		fs.sync(true);
  	}, fs.syncInternal);
  }

  function _JS_FileSystem_Sync()
  {
  	fs.sync(false);
  }

  function _JS_Log_Dump(ptr, type)
  {
  	var str = Pointer_stringify(ptr);
  	if (typeof dump == 'function')
  		dump (str);
  	switch (type)
  	{
  		case 0: //LogType_Error
  		case 1: //LogType_Assert
  		case 4: //LogType_Exception
  			console.error (str);
  			return;
  
  		case 2: //LogType_Warning
  			console.warn (str);
  			return;
  
  		case 3: //LogType_Log
  		case 5: //LogType_Debug
  			console.log (str);
  			return;			
  
  		default:
  			console.error ("Unknown console message type!")
  			console.error (str);
  	}
  }

  function _JS_Log_StackTrace(buffer, bufferSize)
  {
  	var trace = stackTrace();
  	if (buffer)
  		stringToUTF8(trace, buffer, bufferSize);
  	return lengthBytesUTF8(trace);	
  }

  
  var WEBAudio={audioInstances:[],audioContext:{},audioWebEnabled:0};function _JS_Sound_Create_Channel(callback, userData)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return; 
  
  	var channel = {
  		gain: WEBAudio.audioContext.createGain(),
  		panner: WEBAudio.audioContext.createPanner(),
  		threeD: false,
  		playBuffer: function(delay, buffer, offset)
  		{			
  			this.source.buffer = buffer;
  			var chan = this;
  			this.source.onended = function()
  			{
  				if (callback)
  					dynCall('vi', callback, [userData]);
  
  				// recreate channel for future use.
  				chan.setup();
  			};
  			this.source.start(delay, offset);
  		},
  		setup: function()
  		{
  			this.source = WEBAudio.audioContext.createBufferSource();
  			this.setupPanning();
  		},
  		setupPanning: function()
  		{
  			if(this.threeD)
  			{
  				this.source.disconnect();
  				this.source.connect(this.panner);
  				this.panner.connect(this.gain);		
  			}
  			else
  			{
  				this.panner.disconnect();
  				this.source.connect(this.gain);
  			}
  		}
  	};
  	channel.panner.rolloffFactor = 0; // We calculate rolloff ourselves.
  	channel.gain.connect ( WEBAudio.audioContext.destination);				
  	channel.setup();
  	return WEBAudio.audioInstances.push(channel) - 1;
  }

  function _JS_Sound_GetLength(bufferInstance)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return 0;
  
  	var sound = WEBAudio.audioInstances[bufferInstance];
  
  	// Fakemod assumes sample rate is 44100, though that's not necessarily the case,
  	// depending on OS, if the audio file was not imported by our pipeline.
  	// Therefore we need to recalculate the length based on the actual samplerate.
  	var sampleRateRatio = 44100 / sound.buffer.sampleRate;
  	return sound.buffer.length * sampleRateRatio;
  }

  function _JS_Sound_GetLoadState(bufferInstance)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return 2;
  
  	var sound = WEBAudio.audioInstances[bufferInstance];
  	if (sound.error)
  		return 2;
  	if (sound.buffer)
  		return 0;
  	return 1;
  }

  function _JS_Sound_Init()
  {
  	try {
  		window.AudioContext = window.AudioContext||window.webkitAudioContext;
  		WEBAudio.audioContext = new AudioContext();
  		
  		var tryToResumeAudioContext = function() {
  			if (WEBAudio.audioContext.state === 'suspended')
  				WEBAudio.audioContext.resume();
  			else
  				Module.clearInterval(resumeInterval);
  		};
  		var resumeInterval = Module.setInterval(tryToResumeAudioContext, 400);
  		
  		WEBAudio.audioWebEnabled = 1;
  	}
  	catch(e) {
  		alert('Web Audio API is not supported in this browser');
  	}
  }

  function _JS_Sound_Load(ptr, length)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return 0;
  
  	var sound = {
  		buffer: null, 
  		error: false
  	};
  	var instance = WEBAudio.audioInstances.push(sound) - 1;
  	var audioData = HEAPU8.buffer.slice(ptr, ptr+length);
  	WEBAudio.audioContext.decodeAudioData(
  		audioData,
  		function(buffer) 
  		{
  			sound.buffer = buffer;
  		}, 
  		function () 
  		{
  			sound.error = true;
  			console.log ("Decode error.");
  		}
      );
  	return instance;
  }

  function _JS_Sound_Load_PCM(channels, length, sampleRate, ptr)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return 0;
  
  	var sound = {
  		buffer: WEBAudio.audioContext.createBuffer(channels, length, sampleRate), 
  		error: false
  	};
  	for (var i = 0; i < channels; i++)
  	{
  		var offs = (ptr>>2) + length * i;
  		var buffer = sound.buffer;
  		var copyToChannel = buffer['copyToChannel'] || function (source, channelNumber, startInChannel) 
  		{
  			// Shim for copyToChannel on browsers which don't support it like Safari.
  			var clipped = source.subarray(0, Math.min(source.length, this.length - (startInChannel | 0)));
  			this.getChannelData(channelNumber | 0).set(clipped, startInChannel | 0);
  		};
  		copyToChannel.apply(buffer, [HEAPF32.subarray(offs, offs + length),i, 0]);
  	}
  	var instance = WEBAudio.audioInstances.push(sound) - 1;
  	return instance;
  }

  function _JS_Sound_Play(bufferInstance, channelInstance, offset, delay)
  {
  	// stop sound which is playing in the channel currently.
  	_JS_Sound_Stop (channelInstance, 0);
  
  	if (WEBAudio.audioWebEnabled == 0)
  		return;
  
  	var sound = WEBAudio.audioInstances[bufferInstance];
  	var channel = WEBAudio.audioInstances[channelInstance];
  
  	if (sound.buffer) {
  		try {
  			channel.playBuffer (WEBAudio.audioContext.currentTime + delay, sound.buffer, offset);
  		}
  		catch(e) {
  			// Need to catch exception, otherwise execution will stop on Safari if audio output is missing/broken
  			console.error("playBuffer error. Exception: " + e);
  		}
  	}
  	else
  		console.log ("Trying to play sound which is not loaded.")
  }

  function _JS_Sound_ReleaseInstance(instance)
  {
  	WEBAudio.audioInstances[instance] = null;
  }

  function _JS_Sound_ResumeIfNeeded()
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return;
  
  	if (WEBAudio.audioContext.state === 'suspended')
  		WEBAudio.audioContext.resume();
  
  }

  function _JS_Sound_Set3D(channelInstance, threeD)
  {
  	var channel = WEBAudio.audioInstances[channelInstance];
  	if (channel.threeD != threeD)
  	{
  		channel.threeD = threeD;
  		channel.setupPanning();
  	}
  }

  function _JS_Sound_SetListenerOrientation(x, y, z, xUp, yUp, zUp)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return;
  
  	// Web Audio uses a RHS coordinate system, Unity uses LHS, causing orientations to be flipped.
  	// So we pass a negative direction here to compensate, otherwise channels will be flipped.
  	if(WEBAudio.audioContext.listener.forwardX) {
  		WEBAudio.audioContext.listener.forwardX.setValueAtTime(-x, WEBAudio.audioContext.currentTime);
  		WEBAudio.audioContext.listener.forwardY.setValueAtTime(-y, WEBAudio.audioContext.currentTime);
  		WEBAudio.audioContext.listener.forwardZ.setValueAtTime(-z, WEBAudio.audioContext.currentTime);
  		WEBAudio.audioContext.listener.upX.setValueAtTime(xUp, WEBAudio.audioContext.currentTime);
  		WEBAudio.audioContext.listener.upY.setValueAtTime(yUp, WEBAudio.audioContext.currentTime);
  		WEBAudio.audioContext.listener.upZ.setValueAtTime(zUp, WEBAudio.audioContext.currentTime);
  	}
  	else {
  		// use setOrientation if new properties are not supported
  		WEBAudio.audioContext.listener.setOrientation(-x, -y, -z, xUp, yUp, zUp);
  	}
  }

  function _JS_Sound_SetListenerPosition(x, y, z)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return;
  
  	if(WEBAudio.audioContext.listener.positionX) {
  		WEBAudio.audioContext.listener.positionX.setValueAtTime(x, WEBAudio.audioContext.currentTime);
  	 	WEBAudio.audioContext.listener.positionY.setValueAtTime(y, WEBAudio.audioContext.currentTime);
  	 	WEBAudio.audioContext.listener.positionZ.setValueAtTime(z, WEBAudio.audioContext.currentTime);
  	}
  	else {
  		// use setPosition if new properties are not supported
  	 	WEBAudio.audioContext.listener.setPosition(x, y, z);
  	}
  }

  function _JS_Sound_SetLoop(channelInstance, loop)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return;
  
  	WEBAudio.audioInstances[channelInstance].source.loop = loop;
  }

  function _JS_Sound_SetLoopPoints(channelInstance, loopStart, loopEnd)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return;
  	var channel = WEBAudio.audioInstances[channelInstance];
  	channel.source.loopStart = loopStart;
  	channel.source.loopEnd = loopEnd;
  }

  function _JS_Sound_SetPitch(channelInstance, v)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return;
  
  	try {
  		WEBAudio.audioInstances[channelInstance].source.playbackRate.setValueAtTime(v, WEBAudio.audioContext.currentTime);
  	} catch(e) {
  		console.error('Invalid audio pitch ' + v + ' specified to WebAudio backend!');
  	}
  }

  function _JS_Sound_SetPosition(channelInstance, x, y, z)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return;
  
  	WEBAudio.audioInstances[channelInstance].panner.setPosition(x, y, z);
  }

  function _JS_Sound_SetVolume(channelInstance, v)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return;
  
  	try {
  		WEBAudio.audioInstances[channelInstance].gain.gain.setValueAtTime(v, WEBAudio.audioContext.currentTime);
  	} catch(e) {
  		console.error('Invalid audio volume ' + v + ' specified to WebAudio backend!');
  	}
  }

  function _JS_Sound_Stop(channelInstance, delay)
  {
  	if (WEBAudio.audioWebEnabled == 0)
  		return;
  
  	var channel = WEBAudio.audioInstances[channelInstance];
  	
  	// stop sound currently playing.
  	if (channel.source.buffer)
  	{
  		try {
  			channel.source.stop(WEBAudio.audioContext.currentTime + delay);
  		} catch (e) {
  			// when stop() is used more than once for the same source in Safari it causes the following exception:
  			// InvalidStateError: DOM Exception 11: An attempt was made to use an object that is not, or is no longer, usable.
  			channel.source.disconnect();
  		}
  
  		if (delay == 0)
  		{
  			// disable callback for this channel when manually stopped.
  			channel.source.onended = function(){};
  
  			// recreate channel for future use.
  			channel.setup();
  		}
  	}
  }

  function _JS_SystemInfo_GetCanvasClientSize(domElementSelector, outWidth, outHeight)
  	{
  		var selector = UTF8ToString(domElementSelector);
  		var canvas = (selector == '#canvas') ? Module['canvas'] : document.querySelector(selector);
  		HEAPF64[outWidth >> 3] = canvas ? canvas.clientWidth : 0;
  		HEAPF64[outHeight >> 3] = canvas ? canvas.clientHeight : 0;
  	}

  function _JS_SystemInfo_GetDocumentURL(buffer, bufferSize) 
  	{
  		if (buffer)
  			stringToUTF8(document.URL, buffer, bufferSize);
  		return lengthBytesUTF8(document.URL);
  	}

  function _JS_SystemInfo_GetGPUInfo(buffer, bufferSize)
  	{
  		var gpuinfo = Module.SystemInfo.gpu;
  		if (buffer)
  			stringToUTF8(gpuinfo, buffer, bufferSize);
  		return lengthBytesUTF8(gpuinfo);
  	}

  function _JS_SystemInfo_GetMemory() 
  	{
  		return TOTAL_MEMORY/(1024*1024);
  	}

  function _JS_SystemInfo_GetOS(buffer, bufferSize) 
  	{
  		var browser = Module.SystemInfo.os + " " + Module.SystemInfo.osVersion;
  		if (buffer)
  			stringToUTF8(browser, buffer, bufferSize);
  		return lengthBytesUTF8(browser);
  	}

  function _JS_SystemInfo_GetPreferredDevicePixelRatio()
  	{
  		return Module.devicePixelRatio || window.devicePixelRatio || 1;
  	}

  function _JS_SystemInfo_GetScreenSize(outWidth, outHeight)
  	{
  		HEAPF64[outWidth >> 3] = Module.SystemInfo.width;
  		HEAPF64[outHeight >> 3] = Module.SystemInfo.height;
  	}

  function _JS_SystemInfo_HasCursorLock() 
  	{
  		return Module.SystemInfo.hasCursorLock;
  	}

  function _JS_SystemInfo_HasFullscreen() 
  	{
  		return Module.SystemInfo.hasFullscreen;
  	}

  function _JS_SystemInfo_HasWebGL() 
  	{
  		return Module.SystemInfo.hasWebGL;
  	}

  function _JS_SystemInfo_IsMobile() 
  	{
  		return Module.SystemInfo.mobile;
  	}

  
  var videoInstances=[];function _JS_Video_CanPlayFormat(format)
  {
  	var str = Pointer_stringify(format);
  	var video = document.createElement('video');
  	return video.canPlayType(str) != '';
  }

  function _JS_Video_Create(url)
  {
  	var str = Pointer_stringify(url);
  	var video = document.createElement('video');
  	video.style.display = 'none';
  	video.src = str;
  
  	// Managing the fact that the application has detached from the video object
  	// so we can prune out callbacks arriving afterwards.
  	video.detached = false;
  	video.muted = true;
  
  	// Enable CORS on the request fetching the video so the browser accepts
  	// playing it.  This is needed since the data is fetched and used
  	// programmatically - rendering into a canvas - and not displayed normally.
  	video.crossOrigin = "anonymous";
  
  	// Implementing looping ourselves instead of using the native 'loop'
  	// property so we can get one 'ended' event per loop, which triggers the
  	// wanted callback (and not just when the playback actually stops, as
  	// HTML5's player does).
  	video.looping = false;
  
  	video.addEventListener("ended", function(evt)
  	{
  		if (video.looping && !video.detached)
  		{
  			video.play();
  		}
  	});
  
  	return videoInstances.push(video) - 1;
  }

  function _JS_Video_Destroy(video)
  {
  	videoInstances[video].detached = true;
  	videoInstances[video] = null;
  	// GC will take care of the rest.
  }

  function _JS_Video_Duration(video)
  {
  	return videoInstances[video].duration;
  }

  function _JS_Video_EnableAudioTrack(video, trackIndex, enabled)
  {
  	var tracks = videoInstances[video].audioTracks;
  	if (!tracks)
  		return;
  	var track = tracks[trackIndex];
  	if (track)
  		track.enabled = enabled ? true : false;
  }

  function _JS_Video_GetAudioLanguageCode(video, trackIndex)
  {
  	var tracks = videoInstances[video].audioTracks;
  	if (!tracks)
  		return "";
  	var track = tracks[trackIndex];
  	return track ? track.language : "";
  }

  function _JS_Video_GetNumAudioTracks(video)
  {
  	var tracks = videoInstances[video].audioTracks;
  	// For browsers that don't support the audioTracks property, let's assume
  	// there is one.
  	return tracks ? tracks.length : 1;
  }

  function _JS_Video_Height(video)
  {
  	return videoInstances[video].videoHeight;
  }

  function _JS_Video_IsPlaying(video)
  {
  	var element = videoInstances[video];
  	return !element.paused && !element.ended;
  }

  function _JS_Video_IsReady(video)
  {
  	// If the ready state is HAVE_ENOUGH_DATA or higher, we can start playing.
  	if (!videoInstances[video].isReady &&
  		videoInstances[video].readyState >= videoInstances[video].HAVE_ENOUGH_DATA)
  		videoInstances[video].isReady = true;
  	return videoInstances[video].isReady;
  }

  function _JS_Video_Pause(video)
  {
  	videoInstances[video].pause();
  }

  function _JS_Video_Play(video)
  {
  	videoInstances[video].play();
  }

  function _JS_Video_Seek(video, time)
  {
  	videoInstances[video].currentTime = time;
  }

  function _JS_Video_SetEndedHandler(video, ref, onended)
  {
  	var instance = videoInstances[video];
  	instance.addEventListener("ended", function(evt)
  	{
  		if (!instance.detached)
  		{
  			dynCall('vi', onended, [ref]);
  		}
  	});
  }

  function _JS_Video_SetErrorHandler(video, ref, onerror)
  {
  	var instance = videoInstances[video];
  	instance.onerror = function(evt)
  	{
  		if (!instance.detached)
  		{
  			dynCall('vii', onerror, [ref, evt.target.error.code]);
  		}
  	};
  }

  function _JS_Video_SetLoop(video, loop)
  {
  	// See note in JS_Video_Create for why we use .looping instead of .loop.
  	videoInstances[video].looping = loop;
  }

  function _JS_Video_SetMute(video, muted)
  {
  	videoInstances[video].muted = muted;
  }

  function _JS_Video_SetPlaybackRate(video, rate)
  {
  	videoInstances[video].playbackRate = rate;
  }

  function _JS_Video_SetReadyHandler(video, ref, onready)
  {
  	var instance = videoInstances[video];
  	instance.addEventListener("canplay", function(evt)
  	{
  		if (!instance.detached)
  		{
  			dynCall('vi', onready, [ref]);
  		}
  	});
  }

  function _JS_Video_SetSeekedOnceHandler(video, ref, onseeked)
  {
  	var instance = videoInstances[video];
  	instance.addEventListener("seeked", function listener(evt)
  	{
  		instance.removeEventListener("seeked", listener);
  		if (!instance.detached)
  		{
  			dynCall('vi', onseeked, [ref]);
  		}
  	});
  }

  function _JS_Video_SetVolume(video, volume)
  {
  	videoInstances[video].volume = volume;
  }

  function _JS_Video_Time(video)
  {
  	return videoInstances[video].currentTime;
  }

  function _JS_Video_UpdateToTexture(video, tex)
  {
  	var v = videoInstances[video];
  
  	// If the source video has not yet loaded (size is reported as 0), ignore uploading
  	if (!(v.videoWidth > 0 && v.videoHeight > 0))
  		return false;
  
  	// If video is still going on the same video frame as before, ignore reuploading as well
  	if (v.lastUpdateTextureTime === v.currentTime)
  		return false;
  
  	v.lastUpdateTextureTime = v.currentTime;
  
  	GLctx.pixelStorei(GLctx.UNPACK_FLIP_Y_WEBGL, true);
  
  	// It is not possible to get the source pixel aspect ratio of the video from
  	// HTMLViewElement, which is problematic when we get anamorphic content. The videoWidth &
  	// videoHeight properties report the frame size _after_ the pixel aspect ratio stretch has
  	// been applied, but without this ratio ever being exposed. The caller has presumably
  	// created the destination texture using the width/height advertized with the
  	// post-pixel-aspect-ratio info (from JS_Video_Width and JS_Video_Height), which means it
  	// may be incorrectly sized. As a workaround, we re-create the texture _without_
  	// initializing its storage. The call to texImage2D ends up creating the appropriately-sized
  	// storage. This may break the caller's assumption if the texture was created with properties
  	// other than what is selected below. But for the specific (and currently dominant) case of
  	// using Video.js with the VideoPlayer, this provides a workable solution.
  	//
  	// We do this texture re-creation every time we notice the videoWidth/Height has changed in
  	// case the stream changes resolution.
  	//
  	// We could constantly call texImage2D instead of using texSubImage2D on subsequent calls,
  	// but texSubImage2D has less overhead because it does not reallocate the storage.
  	if (v.previousUploadedWidth != v.videoWidth || v.previousUploadedHeight != v.videoHeight)
  	{
  		GLctx.deleteTexture(GL.textures[tex]);
  		var t = GLctx.createTexture();
  		t.name = tex;
  		GL.textures[tex] = t;
  		GLctx.bindTexture(GLctx.TEXTURE_2D, t);
  		GLctx.texParameteri(GLctx.TEXTURE_2D, GLctx.TEXTURE_WRAP_S, GLctx.CLAMP_TO_EDGE);
  		GLctx.texParameteri(GLctx.TEXTURE_2D, GLctx.TEXTURE_WRAP_T, GLctx.CLAMP_TO_EDGE);
  		GLctx.texParameteri(GLctx.TEXTURE_2D, GLctx.TEXTURE_MIN_FILTER, GLctx.LINEAR);
  		GLctx.texImage2D(GLctx.TEXTURE_2D, 0, GLctx.RGBA, GLctx.RGBA, GLctx.UNSIGNED_BYTE, v);
  		v.previousUploadedWidth = v.videoWidth;
  		v.previousUploadedHeight = v.videoHeight;
  	}
  	else
  	{
  		GLctx.bindTexture(GLctx.TEXTURE_2D, GL.textures[tex]);
  		GLctx.texImage2D(GLctx.TEXTURE_2D, 0, GLctx.RGBA, GLctx.RGBA, GLctx.UNSIGNED_BYTE, v);
  	}
  
  	GLctx.pixelStorei(GLctx.UNPACK_FLIP_Y_WEBGL, false);
  	return true;
  }

  function _JS_Video_Width(video)
  {
  	return videoInstances[video].videoWidth;
  }

  function ___atomic_compare_exchange_8(ptr, expected, desiredl, desiredh, weak, success_memmodel, failure_memmodel) {
      var pl = HEAP32[((ptr)>>2)];
      var ph = HEAP32[(((ptr)+(4))>>2)];
      var el = HEAP32[((expected)>>2)];
      var eh = HEAP32[(((expected)+(4))>>2)];
      if (pl === el && ph === eh) {
        HEAP32[((ptr)>>2)]=desiredl;
        HEAP32[(((ptr)+(4))>>2)]=desiredh;
        return 1;
      } else {
        HEAP32[((expected)>>2)]=pl;
        HEAP32[(((expected)+(4))>>2)]=ph;
        return 0;
      }
    }

  
   function ___atomic_fetch_add_8(ptr, vall, valh, memmodel) {
      var l = HEAP32[((ptr)>>2)];
      var h = HEAP32[(((ptr)+(4))>>2)];
      HEAP32[((ptr)>>2)]=_i64Add(l, h, vall, valh);
      HEAP32[(((ptr)+(4))>>2)]=getTempRet0();
      return ((setTempRet0(h),l)|0);
    }

  
  var ENV={};function ___buildEnvironment(environ) {
      // WARNING: Arbitrary limit!
      var MAX_ENV_VALUES = 64;
      var TOTAL_ENV_SIZE = 1024;
  
      // Statically allocate memory for the environment.
      var poolPtr;
      var envPtr;
      if (!___buildEnvironment.called) {
        ___buildEnvironment.called = true;
        // Set default values. Use string keys for Closure Compiler compatibility.
        ENV['USER'] = ENV['LOGNAME'] = 'web_user';
        ENV['PATH'] = '/';
        ENV['PWD'] = '/';
        ENV['HOME'] = '/home/web_user';
        ENV['LANG'] = 'C.UTF-8';
        ENV['_'] = Module['thisProgram'];
        // Allocate memory.
        poolPtr = getMemory(TOTAL_ENV_SIZE);
        envPtr = getMemory(MAX_ENV_VALUES * 4);
        HEAP32[((envPtr)>>2)]=poolPtr;
        HEAP32[((environ)>>2)]=envPtr;
      } else {
        envPtr = HEAP32[((environ)>>2)];
        poolPtr = HEAP32[((envPtr)>>2)];
      }
  
      // Collect key=value lines.
      var strings = [];
      var totalSize = 0;
      for (var key in ENV) {
        if (typeof ENV[key] === 'string') {
          var line = key + '=' + ENV[key];
          strings.push(line);
          totalSize += line.length;
        }
      }
      if (totalSize > TOTAL_ENV_SIZE) {
        throw new Error('Environment size exceeded TOTAL_ENV_SIZE!');
      }
  
      // Make new.
      var ptrSize = 4;
      for (var i = 0; i < strings.length; i++) {
        var line = strings[i];
        writeAsciiToMemory(line, poolPtr);
        HEAP32[(((envPtr)+(i * ptrSize))>>2)]=poolPtr;
        poolPtr += line.length + 1;
      }
      HEAP32[(((envPtr)+(strings.length * ptrSize))>>2)]=0;
    }

  function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }

  
  var EXCEPTIONS={last:0,caught:[],infos:{},deAdjust:function (adjusted) {
        if (!adjusted || EXCEPTIONS.infos[adjusted]) return adjusted;
        for (var key in EXCEPTIONS.infos) {
          var ptr = +key; // the iteration key is a string, and if we throw this, it must be an integer as that is what we look for
          var info = EXCEPTIONS.infos[ptr];
          if (info.adjusted === adjusted) {
            return ptr;
          }
        }
        return adjusted;
      },addRef:function (ptr) {
        if (!ptr) return;
        var info = EXCEPTIONS.infos[ptr];
        info.refcount++;
      },decRef:function (ptr) {
        if (!ptr) return;
        var info = EXCEPTIONS.infos[ptr];
        assert(info.refcount > 0);
        info.refcount--;
        // A rethrown exception can reach refcount 0; it must not be discarded
        // Its next handler will clear the rethrown flag and addRef it, prior to
        // final decRef and destruction here
        if (info.refcount === 0 && !info.rethrown) {
          if (info.destructor) {
            Module['dynCall_vi'](info.destructor, ptr);
          }
          delete EXCEPTIONS.infos[ptr];
          ___cxa_free_exception(ptr);
        }
      },clearRef:function (ptr) {
        if (!ptr) return;
        var info = EXCEPTIONS.infos[ptr];
        info.refcount = 0;
      }};function ___cxa_begin_catch(ptr) {
      var info = EXCEPTIONS.infos[ptr];
      if (info && !info.caught) {
        info.caught = true;
        __ZSt18uncaught_exceptionv.uncaught_exception--;
      }
      if (info) info.rethrown = false;
      EXCEPTIONS.caught.push(ptr);
      EXCEPTIONS.addRef(EXCEPTIONS.deAdjust(ptr));
      return ptr;
    }

  
  function ___cxa_free_exception(ptr) {
      try {
        return _free(ptr);
      } catch(e) { // XXX FIXME
      }
    }function ___cxa_end_catch() {
      // Clear state flag.
      Module['setThrew'](0);
      // Call destructor if one is registered then clear it.
      var ptr = EXCEPTIONS.caught.pop();
      if (ptr) {
        EXCEPTIONS.decRef(EXCEPTIONS.deAdjust(ptr));
        EXCEPTIONS.last = 0; // XXX in decRef?
      }
    }

  function ___cxa_find_matching_catch_2() {
          return ___cxa_find_matching_catch.apply(null, arguments);
        }

  function ___cxa_find_matching_catch_3() {
          return ___cxa_find_matching_catch.apply(null, arguments);
        }

  function ___cxa_find_matching_catch_4() {
          return ___cxa_find_matching_catch.apply(null, arguments);
        }


  function ___cxa_pure_virtual() {
      ABORT = true;
      throw 'Pure virtual function called!';
    }

  function ___cxa_rethrow() {
      var ptr = EXCEPTIONS.caught.pop();
      ptr = EXCEPTIONS.deAdjust(ptr);
      if (!EXCEPTIONS.infos[ptr].rethrown) {
        // Only pop if the corresponding push was through rethrow_primary_exception
        EXCEPTIONS.caught.push(ptr)
        EXCEPTIONS.infos[ptr].rethrown = true;
      }
      EXCEPTIONS.last = ptr;
      throw ptr;
    }

  
  
  function ___resumeException(ptr) {
      if (!EXCEPTIONS.last) { EXCEPTIONS.last = ptr; }
      throw ptr;
    }function ___cxa_find_matching_catch() {
      var thrown = EXCEPTIONS.last;
      if (!thrown) {
        // just pass through the null ptr
        return ((setTempRet0(0),0)|0);
      }
      var info = EXCEPTIONS.infos[thrown];
      var throwntype = info.type;
      if (!throwntype) {
        // just pass through the thrown ptr
        return ((setTempRet0(0),thrown)|0);
      }
      var typeArray = Array.prototype.slice.call(arguments);
  
      var pointer = Module['___cxa_is_pointer_type'](throwntype);
      // can_catch receives a **, add indirection
      if (!___cxa_find_matching_catch.buffer) ___cxa_find_matching_catch.buffer = _malloc(4);
      HEAP32[((___cxa_find_matching_catch.buffer)>>2)]=thrown;
      thrown = ___cxa_find_matching_catch.buffer;
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (typeArray[i] && Module['___cxa_can_catch'](typeArray[i], throwntype, thrown)) {
          thrown = HEAP32[((thrown)>>2)]; // undo indirection
          info.adjusted = thrown;
          return ((setTempRet0(typeArray[i]),thrown)|0);
        }
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      thrown = HEAP32[((thrown)>>2)]; // undo indirection
      return ((setTempRet0(throwntype),thrown)|0);
    }function ___cxa_throw(ptr, type, destructor) {
      EXCEPTIONS.infos[ptr] = {
        ptr: ptr,
        adjusted: ptr,
        type: type,
        destructor: destructor,
        refcount: 0,
        caught: false,
        rethrown: false
      };
      EXCEPTIONS.last = ptr;
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr;
    }

  function ___cxa_uncaught_exception() {
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }

  function ___gxx_personality_v0() {
    }

  function ___lock() {}

  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  
  function ___setErrNo(value) {
      if (Module['___errno_location']) HEAP32[((Module['___errno_location']())>>2)]=value;
      return value;
    }function ___map_file(pathname, size) {
      ___setErrNo(ERRNO_CODES.EPERM);
      return -1;
    }


  
  
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
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
      },normalize:function (path) {
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
      },dirname:function (path) {
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
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
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
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
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
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          stream.tty.ops.flush(stream.tty);
        },flush:function (stream) {
          stream.tty.ops.flush(stream.tty);
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              // we will read data by chunks of BUFSIZE
              var BUFSIZE = 256;
              var buf = new Buffer(BUFSIZE);
              var bytesRead = 0;
  
              var isPosixPlatform = (process.platform != 'win32'); // Node doesn't offer a direct check, so test by exclusion
  
              var fd = process.stdin.fd;
              if (isPosixPlatform) {
                // Linux and Mac cannot use process.stdin.fd (which isn't set up as sync)
                var usingDevice = false;
                try {
                  fd = fs.openSync('/dev/stdin', 'r');
                  usingDevice = true;
                } catch (e) {}
              }
  
              try {
                bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, null);
              } catch(e) {
                // Cross-platform differences: on Windows, reading EOF throws an exception, but on other OSes,
                // reading EOF returns 0. Uniformize behavior by treating the EOF exception to return 0.
                if (e.toString().indexOf('EOF') != -1) bytesRead = 0;
                else throw e;
              }
  
              if (usingDevice) { fs.closeSync(fd); }
              if (bytesRead > 0) {
                result = buf.slice(0, bytesRead).toString('utf-8');
              } else {
                result = null;
              }
  
            } else if (typeof window != 'undefined' &&
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
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            out(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val); // val == 0 would cut text output off in the middle.
          }
        },flush:function (tty) {
          if (tty.output && tty.output.length > 0) {
            out(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            err(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },flush:function (tty) {
          if (tty.output && tty.output.length > 0) {
            err(UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }}};
  
  var MEMFS={ops_table:null,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
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
        }
        return node;
      },getFileDataAsRegularArray:function (node) {
        if (node.contents && node.contents.subarray) {
          var arr = [];
          for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
          return arr; // Returns a copy of the original data.
        }
        return node.contents; // No-op, the file contents are already in a JS array. Return as-is.
      },getFileDataAsTypedArray:function (node) {
        if (!node.contents) return new Uint8Array;
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
        return new Uint8Array(node.contents);
      },expandFileStorage:function (node, newCapacity) {
        // If we are asked to expand the size of a file that already exists, revert to using a standard JS array to store the file
        // instead of a typed array. This makes resizing the array more flexible because we can just .push() elements at the back to
        // increase the size.
        if (node.contents && node.contents.subarray && newCapacity > node.contents.length) {
          node.contents = MEMFS.getFileDataAsRegularArray(node);
          node.usedBytes = node.contents.length; // We might be writing to a lazy-loaded file which had overridden this property, so force-reset it.
        }
  
        if (!node.contents || node.contents.subarray) { // Keep using a typed array if creating a new storage, or if old one was a typed array as well.
          var prevCapacity = node.contents ? node.contents.length : 0;
          if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
          // Don't expand strictly to the given requested limit if it's only a very small increase, but instead geometrically grow capacity.
          // For small filesizes (<1MB), perform size*2 geometric increase, but for large sizes, do a much more conservative size*1.125 increase to
          // avoid overshooting the allocation cap by a very large margin.
          var CAPACITY_DOUBLING_MAX = 1024 * 1024;
          newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) | 0);
          if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
          var oldContents = node.contents;
          node.contents = new Uint8Array(newCapacity); // Allocate new storage.
          if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0); // Copy old data over to the new storage.
          return;
        }
        // Not using a typed array to back the file storage. Use a standard JS array instead.
        if (!node.contents && newCapacity > 0) node.contents = [];
        while (node.contents.length < newCapacity) node.contents.push(0);
      },resizeFileStorage:function (node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
          node.contents = null; // Fully decommit when requesting a resize to zero.
          node.usedBytes = 0;
          return;
        }
        if (!node.contents || node.contents.subarray) { // Resize a typed array if that is being used as the backing store.
          var oldContents = node.contents;
          node.contents = new Uint8Array(new ArrayBuffer(newSize)); // Allocate new storage.
          if (oldContents) {
            node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
          }
          node.usedBytes = newSize;
          return;
        }
        // Backing with a JS array.
        if (!node.contents) node.contents = [];
        if (node.contents.length > newSize) node.contents.length = newSize;
        else while (node.contents.length < newSize) node.contents.push(0);
        node.usedBytes = newSize;
      },node_ops:{getattr:function (node) {
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
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
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
        },write:function (stream, buffer, offset, length, position, canOwn) {
          if (!length) return 0;
          var node = stream.node;
          node.timestamp = Date.now();
  
          if (buffer.subarray && (!node.contents || node.contents.subarray)) { // This write is from a typed array to a typed array?
            if (canOwn) {
              node.contents = buffer.subarray(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (node.usedBytes === 0 && position === 0) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
              node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
              node.usedBytes = length;
              return length;
            } else if (position + length <= node.usedBytes) { // Writing to an already allocated and used subrange of the file?
              node.contents.set(buffer.subarray(offset, offset + length), position);
              return length;
            }
          }
  
          // Appending to an existing file and we need to reallocate, or source data did not come as a typed array.
          MEMFS.expandFileStorage(node, position+length);
          if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position); // Use typed array write if available.
          else {
            for (var i = 0; i < length; i++) {
             node.contents[position + i] = buffer[offset + i]; // Or fall back to manual write if not.
            }
          }
          node.usedBytes = Math.max(node.usedBytes, position+length);
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.expandFileStorage(stream.node, offset + length);
          stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < stream.node.usedBytes) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        },msync:function (stream, buffer, offset, length, mmapFlags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          if (mmapFlags & 2) {
            // MAP_PRIVATE calls need not to be synced back to underlying fs
            return 0;
          }
  
          var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
          // should we check if bytesWritten and length are the same?
          return 0;
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        if (typeof indexedDB !== 'undefined') return indexedDB;
        var ret = null;
        if (typeof window === 'object') ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        assert(ret, 'IDBFS used, but indexedDB not supported');
        return ret;
      },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        // reuse all of the core MEMFS functionality
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },getDB:function (name, callback) {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
  
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        if (!req) {
          return callback("Unable to connect to IndexedDB");
        }
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          var transaction = e.target.transaction;
  
          var fileStore;
  
          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }
  
          if (!fileStore.indexNames.contains('timestamp')) {
            fileStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
        req.onsuccess = function() {
          db = req.result;
  
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },getLocalSet:function (mount, callback) {
        var entries = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat;
  
          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }
  
          entries[path] = { timestamp: stat.mtime };
        }
  
        return callback(null, { type: 'local', entries: entries });
      },getRemoteSet:function (mount, callback) {
        var entries = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          try {
            var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
            transaction.onerror = function(e) {
              callback(this.error);
              e.preventDefault();
            };
  
            var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
            var index = store.index('timestamp');
  
            index.openKeyCursor().onsuccess = function(event) {
              var cursor = event.target.result;
  
              if (!cursor) {
                return callback(null, { type: 'remote', db: db, entries: entries });
              }
  
              entries[cursor.primaryKey] = { timestamp: cursor.key };
  
              cursor.continue();
            };
          } catch (e) {
            return callback(e);
          }
        });
      },loadLocalEntry:function (path, callback) {
        var stat, node;
  
        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }
  
        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          // Performance consideration: storing a normal JavaScript array to a IndexedDB is much slower than storing a typed array.
          // Therefore always convert the file contents to a typed array first before writing the data to IndexedDB.
          node.contents = MEMFS.getFileDataAsTypedArray(node);
          return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      },storeLocalEntry:function (path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }
  
          FS.chmod(path, entry.mode);
          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },removeLocalEntry:function (path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);
  
          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },loadRemoteEntry:function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) { callback(null, event.target.result); };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },storeRemoteEntry:function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },removeRemoteEntry:function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = [];
        Object.keys(src.entries).forEach(function (key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });
  
        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });
  
        if (!total) {
          return callback(null);
        }
  
        var errored = false;
        var completed = 0;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        transaction.onerror = function(e) {
          done(this.error);
          e.preventDefault();
        };
  
        // sort paths in ascending order so directory entries are created
        // before the files inside them
        create.sort().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });
  
        // sort paths in descending order so files are deleted before their
        // parent directories
        remove.sort().reverse().forEach(function(path) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
        var flags = process["binding"]("constants");
        // Node.js 4 compatibility: it has no namespaces for constants
        if (flags["fs"]) {
          flags = flags["fs"];
        }
        NODEFS.flagsForNodeMap = {
          "1024": flags["O_APPEND"],
          "64": flags["O_CREAT"],
          "128": flags["O_EXCL"],
          "0": flags["O_RDONLY"],
          "2": flags["O_RDWR"],
          "4096": flags["O_SYNC"],
          "512": flags["O_TRUNC"],
          "1": flags["O_WRONLY"]
        };
      },bufferFrom:function (arrayBuffer) {
        // Node.js < 4.5 compatibility: Buffer.from does not support ArrayBuffer
        // Buffer.from before 4.5 was just a method inherited from Uint8Array
        // Buffer.alloc has been added with Buffer.from together, so check it instead
        return Buffer.alloc ? Buffer.from(arrayBuffer) : new Buffer(arrayBuffer);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // Node.js on Windows never represents permission bit 'x', so
            // propagate read bits to execute bits
            stat.mode = stat.mode | ((stat.mode & 292) >> 2);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsForNode:function (flags) {
        flags &= ~0x200000 /*O_PATH*/; // Ignore this flag from musl, otherwise node.js fails to open the file.
        flags &= ~0x800 /*O_NONBLOCK*/; // Ignore this flag from musl, otherwise node.js fails to open the file.
        flags &= ~0x8000 /*O_LARGEFILE*/; // Ignore this flag from musl, otherwise node.js fails to open the file.
        flags &= ~0x80000 /*O_CLOEXEC*/; // Some applications may pass it; it makes no sense for a single process.
        var newFlags = 0;
        for (var k in NODEFS.flagsForNodeMap) {
          if (flags & k) {
            newFlags |= NODEFS.flagsForNodeMap[k];
            flags ^= k;
          }
        }
  
        if (!flags) {
          return newFlags;
        } else {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            path = fs.readlinkSync(path);
            path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
            return path;
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsForNode(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // Node.js < 6 compatibility: node errors on 0 length reads
          if (length === 0) return 0;
          try {
            return fs.readSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },write:function (stream, buffer, offset, length, position) {
          try {
            return fs.writeSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          return position;
        }}};
  
  var WORKERFS={DIR_MODE:16895,FILE_MODE:33279,reader:null,mount:function (mount) {
        assert(ENVIRONMENT_IS_WORKER);
        if (!WORKERFS.reader) WORKERFS.reader = new FileReaderSync();
        var root = WORKERFS.createNode(null, '/', WORKERFS.DIR_MODE, 0);
        var createdParents = {};
        function ensureParent(path) {
          // return the parent node, creating subdirs as necessary
          var parts = path.split('/');
          var parent = root;
          for (var i = 0; i < parts.length-1; i++) {
            var curr = parts.slice(0, i+1).join('/');
            // Issue 4254: Using curr as a node name will prevent the node
            // from being found in FS.nameTable when FS.open is called on
            // a path which holds a child of this node,
            // given that all FS functions assume node names
            // are just their corresponding parts within their given path,
            // rather than incremental aggregates which include their parent's
            // directories.
            if (!createdParents[curr]) {
              createdParents[curr] = WORKERFS.createNode(parent, parts[i], WORKERFS.DIR_MODE, 0);
            }
            parent = createdParents[curr];
          }
          return parent;
        }
        function base(path) {
          var parts = path.split('/');
          return parts[parts.length-1];
        }
        // We also accept FileList here, by using Array.prototype
        Array.prototype.forEach.call(mount.opts["files"] || [], function(file) {
          WORKERFS.createNode(ensureParent(file.name), base(file.name), WORKERFS.FILE_MODE, 0, file, file.lastModifiedDate);
        });
        (mount.opts["blobs"] || []).forEach(function(obj) {
          WORKERFS.createNode(ensureParent(obj["name"]), base(obj["name"]), WORKERFS.FILE_MODE, 0, obj["data"]);
        });
        (mount.opts["packages"] || []).forEach(function(pack) {
          pack['metadata'].files.forEach(function(file) {
            var name = file.filename.substr(1); // remove initial slash
            WORKERFS.createNode(ensureParent(name), base(name), WORKERFS.FILE_MODE, 0, pack['blob'].slice(file.start, file.end));
          });
        });
        return root;
      },createNode:function (parent, name, mode, dev, contents, mtime) {
        var node = FS.createNode(parent, name, mode);
        node.mode = mode;
        node.node_ops = WORKERFS.node_ops;
        node.stream_ops = WORKERFS.stream_ops;
        node.timestamp = (mtime || new Date).getTime();
        assert(WORKERFS.FILE_MODE !== WORKERFS.DIR_MODE);
        if (mode === WORKERFS.FILE_MODE) {
          node.size = contents.size;
          node.contents = contents;
        } else {
          node.size = 4096;
          node.contents = {};
        }
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },node_ops:{getattr:function (node) {
          return {
            dev: 1,
            ino: undefined,
            mode: node.mode,
            nlink: 1,
            uid: 0,
            gid: 0,
            rdev: undefined,
            size: node.size,
            atime: new Date(node.timestamp),
            mtime: new Date(node.timestamp),
            ctime: new Date(node.timestamp),
            blksize: 4096,
            blocks: Math.ceil(node.size / 4096),
          };
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
        },lookup:function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        },mknod:function (parent, name, mode, dev) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },rename:function (oldNode, newDir, newName) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },unlink:function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },rmdir:function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },readdir:function (node) {
          var entries = ['.', '..'];
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newName, oldPath) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        },readlink:function (node) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          if (position >= stream.node.size) return 0;
          var chunk = stream.node.contents.slice(position, position + length);
          var ab = WORKERFS.reader.readAsArrayBuffer(chunk);
          buffer.set(new Uint8Array(ab), offset);
          return chunk.size;
        },write:function (stream, buffer, offset, length, position) {
          throw new FS.ErrnoError(ERRNO_CODES.EIO);
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.size;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return position;
        }}};
  
  var _stdin=STATICTOP; STATICTOP += 16;;
  
  var _stdout=STATICTOP; STATICTOP += 16;;
  
  var _stderr=STATICTOP; STATICTOP += 16;;var FS={root:null,mounts:[],devices:{},streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,trackingDelegate:{},tracking:{openFlags:{READ:1,WRITE:2}},ErrnoError:null,genericErrors:{},filesystems:null,syncFSRequests:0,handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
  
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
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
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
              current_path = PATH.resolve(PATH.dirname(current_path), link);
  
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
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
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
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
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err, parent);
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
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
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
  
          FS.FSNode.prototype = {};
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); }
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); }
            }
          });
        }
  
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return !!node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var perms = ['r', 'w', 'rw'][flag & 3];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        var err = FS.nodePermissions(dir, 'x');
        if (err) return err;
        if (!dir.node_ops.lookup) return ERRNO_CODES.EACCES;
        return 0;
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if (FS.flagsToPermissionString(flags) !== 'r' || // opening for write
              (flags & 512)) { // TODO: check for O_SEARCH? (== search for dir only)
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
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
          });
        }
        // clone it, so we can return an instance of FSStream
        var newStream = new FS.FSStream();
        for (var p in stream) {
          newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },getMounts:function (mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        FS.syncFSRequests++;
  
        if (FS.syncFSRequests > 1) {
          console.log('warning: ' + FS.syncFSRequests + ' FS.syncfs operations in flight at once, probably just doing extra work');
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function doCallback(err) {
          assert(FS.syncFSRequests > 0);
          FS.syncFSRequests--;
          return callback(err);
        }
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return doCallback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            doCallback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
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
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
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
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === '.' || name === '..') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdirTree:function (path, mode) {
        var dirs = path.split('/');
        var d = '';
        for (var i = 0; i < dirs.length; ++i) {
          if (!dirs[i]) continue;
          d += '/' + dirs[i];
          try {
            FS.mkdir(d, mode);
          } catch(e) {
            if (e.errno != ERRNO_CODES.EEXIST) throw e;
          }
        }
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        if (!PATH.resolve(oldpath)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        if (!old_dir || !new_dir) throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
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
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        try {
          if (FS.trackingDelegate['willMovePath']) {
            FS.trackingDelegate['willMovePath'](old_path, new_path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
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
        try {
          if (FS.trackingDelegate['onMovePath']) FS.trackingDelegate['onMovePath'](old_path, new_path);
        } catch(e) {
          console.log("FS.trackingDelegate['onMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // According to POSIX, we should map EISDIR to EPERM, but
          // we instead do what Linux does (and we must, as we use
          // the musl linux libc).
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readlink:function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return PATH.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        if (path === "") {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
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
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // if asked only for a directory, then this must be one
        if ((flags & 65536) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        // check permissions, if this is not a file we just created now (it is ok to
        // create and write to a file with read-only permissions; it is read-only
        // for later use)
        if (!created) {
          var err = FS.mayOpen(node, flags);
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
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
            err('read file: ' + path);
          }
        }
        try {
          if (FS.trackingDelegate['onOpenFile']) {
            var trackingFlags = 0;
            if ((flags & 2097155) !== 1) {
              trackingFlags |= FS.tracking.openFlags.READ;
            }
            if ((flags & 2097155) !== 0) {
              trackingFlags |= FS.tracking.openFlags.WRITE;
            }
            FS.trackingDelegate['onOpenFile'](path, trackingFlags);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['onOpenFile']('"+path+"', flags) threw an exception: " + e.message);
        }
        return stream;
      },close:function (stream) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
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
      },isClosed:function (stream) {
        return stream.fd === null;
      },llseek:function (stream, offset, whence) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = typeof position !== 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var seeking = typeof position !== 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        try {
          if (stream.path && FS.trackingDelegate['onWriteToFile']) FS.trackingDelegate['onWriteToFile'](stream.path);
        } catch(e) {
          console.log("FS.trackingDelegate['onWriteToFile']('"+path+"') threw an exception: " + e.message);
        }
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },msync:function (stream, buffer, offset, length, mmapFlags) {
        if (!stream || !stream.stream_ops.msync) {
          return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
      },munmap:function (stream) {
        return 0;
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
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
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data === 'string') {
          var buf = new Uint8Array(lengthBytesUTF8(data)+1);
          var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
          FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
        } else if (ArrayBuffer.isView(data)) {
          FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
        } else {
          throw new Error('Unsupported data type');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function(stream, buffer, offset, length, pos) { return length; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // setup /dev/[u]random
        var random_device;
        if (typeof crypto !== 'undefined') {
          // for modern web browsers
          var randomBuffer = new Uint8Array(1);
          random_device = function() { crypto.getRandomValues(randomBuffer); return randomBuffer[0]; };
        } else if (ENVIRONMENT_IS_NODE) {
          // for nodejs
          random_device = function() { return require('crypto')['randomBytes'](1)[0]; };
        } else {
          // default for ES5 platforms
          random_device = function() { return (Math.random()*256)|0; };
        }
        FS.createDevice('/dev', 'random', random_device);
        FS.createDevice('/dev', 'urandom', random_device);
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createSpecialDirectories:function () {
        // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the name of the stream for fd 6 (see test_unistd_ttyname)
        FS.mkdir('/proc');
        FS.mkdir('/proc/self');
        FS.mkdir('/proc/self/fd');
        FS.mount({
          mount: function() {
            var node = FS.createNode('/proc/self', 'fd', 16384 | 511 /* 0777 */, 73);
            node.node_ops = {
              lookup: function(parent, name) {
                var fd = +name;
                var stream = FS.getStream(fd);
                if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
                var ret = {
                  parent: null,
                  mount: { mountpoint: 'fake' },
                  node_ops: { readlink: function() { return stream.path } }
                };
                ret.parent = ret; // make it look like a simple root node
                return ret;
              }
            };
            return node;
          }
        }, {}, '/proc/self/fd');
      },createStandardStreams:function () {
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
        var stdin = FS.open('/dev/stdin', 'r');
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno, node) {
          //err(stackTrace()); // useful for debugging
          this.node = node;
          this.setErrno = function(errno) {
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
          // Node.js compatibility: assigning on this.stack fails on Node 4 (but fixed on Node 8)
          if (this.stack) Object.defineProperty(this, "stack", { value: (new Error).stack, writable: true });
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
  
        FS.filesystems = {
          'MEMFS': MEMFS,
          'IDBFS': IDBFS,
          'NODEFS': NODEFS,
          'WORKERFS': WORKERFS,
        };
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        // force-flush all streams, so we get musl std streams printed out
        var fflush = Module['_fflush'];
        if (fflush) fflush(0);
        // close all of our streams
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
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
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
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
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
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
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
            obj.usedBytes = obj.contents.length;
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
          if (idx > this.length-1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = (idx / this.chunkSize)|0;
          return this.getter(chunkNum)[chunkOffset];
        }
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        }
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
          var doXHR = (function(from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
  
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
          var lazyArray = this;
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * chunkSize;
            var end = (chunkNum+1) * chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
  
          if (usesGzip || !datalength) {
            // if the server uses gzip or doesn't supply the length, we have to download the whole file to get the (uncompressed) length
            chunkSize = datalength = 1; // this will force getter(0)/doXHR do download the whole file
            datalength = this.getter(0).length;
            chunkSize = datalength;
            console.log("LazyFiles on gzip forces download of the whole file when length is accessed");
          }
  
          this._length = datalength;
          this._chunkSize = chunkSize;
          this.lengthKnown = true;
        }
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          Object.defineProperties(lazyArray, {
            length: {
              get: function() {
                if(!this.lengthKnown) {
                  this.cacheLength();
                }
                return this._length;
              }
            },
            chunkSize: {
              get: function() {
                if(!this.lengthKnown) {
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
            get: function() { return this.contents.length; }
          }
        });
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
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
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
        Browser.init(); // XXX perhaps this method should move onto Browser?
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
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
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency(dep);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency(dep);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
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
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};var SYSCALLS={DEFAULT_POLLMASK:5,mappings:{},umask:511,calculateAt:function (dirfd, path) {
        if (path[0] !== '/') {
          // relative path
          var dir;
          if (dirfd === -100) {
            dir = FS.cwd();
          } else {
            var dirstream = FS.getStream(dirfd);
            if (!dirstream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
            dir = dirstream.path;
          }
          path = PATH.join2(dir, path);
        }
        return path;
      },doStat:function (func, path, buf) {
        try {
          var stat = func(path);
        } catch (e) {
          if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
            // an error occurred while trying to look up the path; we should just report ENOTDIR
            return -ERRNO_CODES.ENOTDIR;
          }
          throw e;
        }
        HEAP32[((buf)>>2)]=stat.dev;
        HEAP32[(((buf)+(4))>>2)]=0;
        HEAP32[(((buf)+(8))>>2)]=stat.ino;
        HEAP32[(((buf)+(12))>>2)]=stat.mode;
        HEAP32[(((buf)+(16))>>2)]=stat.nlink;
        HEAP32[(((buf)+(20))>>2)]=stat.uid;
        HEAP32[(((buf)+(24))>>2)]=stat.gid;
        HEAP32[(((buf)+(28))>>2)]=stat.rdev;
        HEAP32[(((buf)+(32))>>2)]=0;
        HEAP32[(((buf)+(36))>>2)]=stat.size;
        HEAP32[(((buf)+(40))>>2)]=4096;
        HEAP32[(((buf)+(44))>>2)]=stat.blocks;
        HEAP32[(((buf)+(48))>>2)]=(stat.atime.getTime() / 1000)|0;
        HEAP32[(((buf)+(52))>>2)]=0;
        HEAP32[(((buf)+(56))>>2)]=(stat.mtime.getTime() / 1000)|0;
        HEAP32[(((buf)+(60))>>2)]=0;
        HEAP32[(((buf)+(64))>>2)]=(stat.ctime.getTime() / 1000)|0;
        HEAP32[(((buf)+(68))>>2)]=0;
        HEAP32[(((buf)+(72))>>2)]=stat.ino;
        return 0;
      },doMsync:function (addr, stream, len, flags) {
        var buffer = new Uint8Array(HEAPU8.subarray(addr, addr + len));
        FS.msync(stream, buffer, 0, len, flags);
      },doMkdir:function (path, mode) {
        // remove a trailing slash, if one - /a/b/ has basename of '', but
        // we want to create b in the context of this function
        path = PATH.normalize(path);
        if (path[path.length-1] === '/') path = path.substr(0, path.length-1);
        FS.mkdir(path, mode, 0);
        return 0;
      },doMknod:function (path, mode, dev) {
        // we don't want this in the JS API as it uses mknod to create all nodes.
        switch (mode & 61440) {
          case 32768:
          case 8192:
          case 24576:
          case 4096:
          case 49152:
            break;
          default: return -ERRNO_CODES.EINVAL;
        }
        FS.mknod(path, mode, dev);
        return 0;
      },doReadlink:function (path, buf, bufsize) {
        if (bufsize <= 0) return -ERRNO_CODES.EINVAL;
        var ret = FS.readlink(path);
  
        var len = Math.min(bufsize, lengthBytesUTF8(ret));
        var endChar = HEAP8[buf+len];
        stringToUTF8(ret, buf, bufsize+1);
        // readlink is one of the rare functions that write out a C string, but does never append a null to the output buffer(!)
        // stringToUTF8() always appends a null byte, so restore the character under the null byte after the write.
        HEAP8[buf+len] = endChar;
  
        return len;
      },doAccess:function (path, amode) {
        if (amode & ~7) {
          // need a valid mode
          return -ERRNO_CODES.EINVAL;
        }
        var node;
        var lookup = FS.lookupPath(path, { follow: true });
        node = lookup.node;
        var perms = '';
        if (amode & 4) perms += 'r';
        if (amode & 2) perms += 'w';
        if (amode & 1) perms += 'x';
        if (perms /* otherwise, they've just passed F_OK */ && FS.nodePermissions(node, perms)) {
          return -ERRNO_CODES.EACCES;
        }
        return 0;
      },doDup:function (path, flags, suggestFD) {
        var suggest = FS.getStream(suggestFD);
        if (suggest) FS.close(suggest);
        return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
      },doReadv:function (stream, iov, iovcnt, offset) {
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
      },doWritev:function (stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
          var ptr = HEAP32[(((iov)+(i*8))>>2)];
          var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
          var curr = FS.write(stream, HEAP8,ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
        }
        return ret;
      },varargs:0,get:function (varargs) {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[(((SYSCALLS.varargs)-(4))>>2)];
        return ret;
      },getStr:function () {
        var ret = Pointer_stringify(SYSCALLS.get());
        return ret;
      },getStreamFromFD:function () {
        var stream = FS.getStream(SYSCALLS.get());
        if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        return stream;
      },getSocketFromFD:function () {
        var socket = SOCKFS.getSocket(SYSCALLS.get());
        if (!socket) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        return socket;
      },getSocketAddress:function (allowNull) {
        var addrp = SYSCALLS.get(), addrlen = SYSCALLS.get();
        if (allowNull && addrp === 0) return null;
        var info = __read_sockaddr(addrp, addrlen);
        if (info.errno) throw new FS.ErrnoError(info.errno);
        info.addr = DNS.lookup_addr(info.addr) || info.addr;
        return info;
      },get64:function () {
        var low = SYSCALLS.get(), high = SYSCALLS.get();
        if (low >= 0) assert(high === 0);
        else assert(high === -1);
        return low;
      },getZero:function () {
        assert(SYSCALLS.get() === 0);
      }};function ___syscall10(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // unlink
      var path = SYSCALLS.getStr();
      FS.unlink(path);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  
  var SOCKFS={mount:function (mount) {
        // If Module['websocket'] has already been defined (e.g. for configuring
        // the subprotocol/url) use that, if not initialise it to a new object.
        Module['websocket'] = (Module['websocket'] && 
                               ('object' === typeof Module['websocket'])) ? Module['websocket'] : {};
  
        // Add the Event registration mechanism to the exported websocket configuration
        // object so we can register network callbacks from native JavaScript too.
        // For more documentation see system/include/emscripten/emscripten.h
        Module['websocket']._callbacks = {};
        Module['websocket']['on'] = function(event, callback) {
  	    if ('function' === typeof callback) {
  		  this._callbacks[event] = callback;
          }
  	    return this;
        };
  
        Module['websocket'].emit = function(event, param) {
  	    if ('function' === typeof this._callbacks[event]) {
  		  this._callbacks[event].call(this, param);
          }
        };
  
        // If debug is enabled register simple default logging callbacks for each Event.
  
        return FS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
  
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          error: null, // Used in getsockopt for SOL_SOCKET/SO_ERROR test
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
  
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
  
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
  
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
  
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
  
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
  
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              // runtimeConfig gets set to true if WebSocket runtime configuration is available.
              var runtimeConfig = (Module['websocket'] && ('object' === typeof Module['websocket']));
  
              // The default value is 'ws://' the replace is needed because the compiler replaces '//' comments with '#'
              // comments without checking context, so we'd end up with ws:#, the replace swaps the '#' for '//' again.
              var url = 'ws:#'.replace('#', '//');
  
              if (runtimeConfig) {
                if ('string' === typeof Module['websocket']['url']) {
                  url = Module['websocket']['url']; // Fetch runtime WebSocket URL config.
                }
              }
  
              if (url === 'ws://' || url === 'wss://') { // Is the supplied URL config just a prefix, if so complete it.
                var parts = addr.split('/');
                url = url + parts[0] + ":" + port + "/" + parts.slice(1).join('/');
              }
  
              // Make the WebSocket subprotocol (Sec-WebSocket-Protocol) default to binary if no configuration is set.
              var subProtocols = 'binary'; // The default value is 'binary'
  
              if (runtimeConfig) {
                if ('string' === typeof Module['websocket']['subprotocol']) {
                  subProtocols = Module['websocket']['subprotocol']; // Fetch runtime WebSocket subprotocol config.
                }
              }
  
              // The regex trims the string (removes spaces at the beginning and end, then splits the string by
              // <any space>,<any space> into an Array. Whitespace removal is important for Websockify and ws.
              subProtocols = subProtocols.replace(/^ +| +$/g,"").split(/ *, */);
  
              // The node ws library API for specifying optional subprotocol is slightly different than the browser's.
              var opts = ENVIRONMENT_IS_NODE ? {'protocol': subProtocols.toString()} : subProtocols;
  
              // some webservers (azure) does not support subprotocol header
              if (runtimeConfig && null === Module['websocket']['subprotocol']) {
                subProtocols = 'null';
                opts = undefined;
              }
  
              // If node we use the ws library.
              var WebSocketConstructor;
              if (ENVIRONMENT_IS_NODE) {
                WebSocketConstructor = require('ws');
              } else if (ENVIRONMENT_IS_WEB) {
                WebSocketConstructor = window['WebSocket'];
              } else {
                WebSocketConstructor = WebSocket;
              }
              ws = new WebSocketConstructor(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
  
  
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
  
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
  
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
  
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
  
          var handleOpen = function () {
  
            Module['websocket'].emit('open', sock.stream.fd);
  
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
  
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
  
            // An empty ArrayBuffer will emit a pseudo disconnect event
            // as recv/recvmsg will return zero which indicates that a socket
            // has performed a shutdown although the connection has not been disconnected yet.
            if (data.byteLength == 0) {
              return;
            }
            data = new Uint8Array(data);  // make a typed array view on the array buffer
  
  
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
  
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
            Module['websocket'].emit('message', sock.stream.fd);
          };
  
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('close', function() {
              Module['websocket'].emit('close', sock.stream.fd);
            });
            peer.socket.on('error', function(error) {
              // Although the ws library may pass errors that may be more descriptive than
              // ECONNREFUSED they are not necessarily the expected error code e.g. 
              // ENOTFOUND on getaddrinfo seems to be node.js specific, so using ECONNREFUSED
              // is still probably the most useful thing to do.
              sock.error = ERRNO_CODES.ECONNREFUSED; // Used in getsockopt for SOL_SOCKET/SO_ERROR test.
              Module['websocket'].emit('error', [sock.stream.fd, sock.error, 'ECONNREFUSED: Connection refused']);
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onclose = function() {
              Module['websocket'].emit('close', sock.stream.fd);
            };
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
            peer.socket.onerror = function(error) {
              // The WebSocket spec only allows a 'simple event' to be thrown on error,
              // so we only really know as much as ECONNREFUSED.
              sock.error = ERRNO_CODES.ECONNREFUSED; // Used in getsockopt for SOL_SOCKET/SO_ERROR test.
              Module['websocket'].emit('error', [sock.stream.fd, sock.error, 'ECONNREFUSED: Connection refused']);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
  
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
  
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
  
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
  
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
  
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port;
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
  
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
  
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
  
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
  
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
          Module['websocket'].emit('listen', sock.stream.fd); // Send Event with listen fd.
  
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
  
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
  
              // push to queue for accept to pick up
              sock.pending.push(newsock);
              Module['websocket'].emit('connection', newsock.stream.fd);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
              Module['websocket'].emit('connection', sock.stream.fd);
            }
          });
          sock.server.on('closed', function() {
            Module['websocket'].emit('close', sock.stream.fd);
            sock.server = null;
          });
          sock.server.on('error', function(error) {
            // Although the ws library may pass errors that may be more descriptive than
            // ECONNREFUSED they are not necessarily the expected error code e.g. 
            // ENOTFOUND on getaddrinfo seems to be node.js specific, so using EHOSTUNREACH
            // is still probably the most useful thing to do. This error shouldn't
            // occur in a well written app as errors should get trapped in the compiled
            // app's own getaddrinfo call.
            sock.error = ERRNO_CODES.EHOSTUNREACH; // Used in getsockopt for SOL_SOCKET/SO_ERROR test.
            Module['websocket'].emit('error', [sock.stream.fd, sock.error, 'EHOSTUNREACH: Host is unreachable']);
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
  
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
  
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          if (ArrayBuffer.isView(buffer)) {
            offset += buffer.byteOffset;
            buffer = buffer.buffer;
          }
  
          var data;
            data = buffer.slice(offset, offset + length);
  
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
  
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
  
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
  
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
  
  
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
  
          return res;
        }}};
  
  
  function __inet_pton4_raw(str) {
      var b = str.split('.');
      for (var i = 0; i < 4; i++) {
        var tmp = Number(b[i]);
        if (isNaN(tmp)) return null;
        b[i] = tmp;
      }
      return (b[0] | (b[1] << 8) | (b[2] << 16) | (b[3] << 24)) >>> 0;
    }
  
  function __inet_pton6_raw(str) {
      var words;
      var w, offset, z, i;
      /* http://home.deds.nl/~aeron/regex/ */
      var valid6regx = /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i
      var parts = [];
      if (!valid6regx.test(str)) {
        return null;
      }
      if (str === "::") {
        return [0, 0, 0, 0, 0, 0, 0, 0];
      }
      // Z placeholder to keep track of zeros when splitting the string on ":"
      if (str.indexOf("::") === 0) {
        str = str.replace("::", "Z:"); // leading zeros case
      } else {
        str = str.replace("::", ":Z:");
      }
  
      if (str.indexOf(".") > 0) {
        // parse IPv4 embedded stress
        str = str.replace(new RegExp('[.]', 'g'), ":");
        words = str.split(":");
        words[words.length-4] = parseInt(words[words.length-4]) + parseInt(words[words.length-3])*256;
        words[words.length-3] = parseInt(words[words.length-2]) + parseInt(words[words.length-1])*256;
        words = words.slice(0, words.length-2);
      } else {
        words = str.split(":");
      }
  
      offset = 0; z = 0;
      for (w=0; w < words.length; w++) {
        if (typeof words[w] === 'string') {
          if (words[w] === 'Z') {
            // compressed zeros - write appropriate number of zero words
            for (z = 0; z < (8 - words.length+1); z++) {
              parts[w+z] = 0;
            }
            offset = z-1;
          } else {
            // parse hex to field to 16-bit value and write it in network byte-order
            parts[w+offset] = _htons(parseInt(words[w],16));
          }
        } else {
          // parsed IPv4 words
          parts[w+offset] = words[w];
        }
      }
      return [
        (parts[1] << 16) | parts[0],
        (parts[3] << 16) | parts[2],
        (parts[5] << 16) | parts[4],
        (parts[7] << 16) | parts[6]
      ];
    }var DNS={address_map:{id:1,addrs:{},names:{}},lookup_name:function (name) {
        // If the name is already a valid ipv4 / ipv6 address, don't generate a fake one.
        var res = __inet_pton4_raw(name);
        if (res !== null) {
          return name;
        }
        res = __inet_pton6_raw(name);
        if (res !== null) {
          return name;
        }
  
        // See if this name is already mapped.
        var addr;
  
        if (DNS.address_map.addrs[name]) {
          addr = DNS.address_map.addrs[name];
        } else {
          var id = DNS.address_map.id++;
          assert(id < 65535, 'exceeded max address mappings of 65535');
  
          addr = '172.29.' + (id & 0xff) + '.' + (id & 0xff00);
  
          DNS.address_map.names[addr] = name;
          DNS.address_map.addrs[name] = addr;
        }
  
        return addr;
      },lookup_addr:function (addr) {
        if (DNS.address_map.names[addr]) {
          return DNS.address_map.names[addr];
        }
  
        return null;
      }};
  
  
  var Sockets={BUFFER_SIZE:10240,MAX_BUFFER_SIZE:10485760,nextFd:1,fds:{},nextport:1,maxport:65535,peer:null,connections:{},portmap:{},localAddr:4261412874,addrPool:[33554442,50331658,67108874,83886090,100663306,117440522,134217738,150994954,167772170,184549386,201326602,218103818,234881034]};
  
  function __inet_ntop4_raw(addr) {
      return (addr & 0xff) + '.' + ((addr >> 8) & 0xff) + '.' + ((addr >> 16) & 0xff) + '.' + ((addr >> 24) & 0xff)
    }
  
  function __inet_ntop6_raw(ints) {
      //  ref:  http://www.ietf.org/rfc/rfc2373.txt - section 2.5.4
      //  Format for IPv4 compatible and mapped  128-bit IPv6 Addresses
      //  128-bits are split into eight 16-bit words
      //  stored in network byte order (big-endian)
      //  |                80 bits               | 16 |      32 bits        |
      //  +-----------------------------------------------------------------+
      //  |               10 bytes               |  2 |      4 bytes        |
      //  +--------------------------------------+--------------------------+
      //  +               5 words                |  1 |      2 words        |
      //  +--------------------------------------+--------------------------+
      //  |0000..............................0000|0000|    IPv4 ADDRESS     | (compatible)
      //  +--------------------------------------+----+---------------------+
      //  |0000..............................0000|FFFF|    IPv4 ADDRESS     | (mapped)
      //  +--------------------------------------+----+---------------------+
      var str = "";
      var word = 0;
      var longest = 0;
      var lastzero = 0;
      var zstart = 0;
      var len = 0;
      var i = 0;
      var parts = [
        ints[0] & 0xffff,
        (ints[0] >> 16),
        ints[1] & 0xffff,
        (ints[1] >> 16),
        ints[2] & 0xffff,
        (ints[2] >> 16),
        ints[3] & 0xffff,
        (ints[3] >> 16)
      ];
  
      // Handle IPv4-compatible, IPv4-mapped, loopback and any/unspecified addresses
  
      var hasipv4 = true;
      var v4part = "";
      // check if the 10 high-order bytes are all zeros (first 5 words)
      for (i = 0; i < 5; i++) {
        if (parts[i] !== 0) { hasipv4 = false; break; }
      }
  
      if (hasipv4) {
        // low-order 32-bits store an IPv4 address (bytes 13 to 16) (last 2 words)
        v4part = __inet_ntop4_raw(parts[6] | (parts[7] << 16));
        // IPv4-mapped IPv6 address if 16-bit value (bytes 11 and 12) == 0xFFFF (6th word)
        if (parts[5] === -1) {
          str = "::ffff:";
          str += v4part;
          return str;
        }
        // IPv4-compatible IPv6 address if 16-bit value (bytes 11 and 12) == 0x0000 (6th word)
        if (parts[5] === 0) {
          str = "::";
          //special case IPv6 addresses
          if(v4part === "0.0.0.0") v4part = ""; // any/unspecified address
          if(v4part === "0.0.0.1") v4part = "1";// loopback address
          str += v4part;
          return str;
        }
      }
  
      // Handle all other IPv6 addresses
  
      // first run to find the longest contiguous zero words
      for (word = 0; word < 8; word++) {
        if (parts[word] === 0) {
          if (word - lastzero > 1) {
            len = 0;
          }
          lastzero = word;
          len++;
        }
        if (len > longest) {
          longest = len;
          zstart = word - longest + 1;
        }
      }
  
      for (word = 0; word < 8; word++) {
        if (longest > 1) {
          // compress contiguous zeros - to produce "::"
          if (parts[word] === 0 && word >= zstart && word < (zstart + longest) ) {
            if (word === zstart) {
              str += ":";
              if (zstart === 0) str += ":"; //leading zeros case
            }
            continue;
          }
        }
        // converts 16-bit words from big-endian to little-endian before converting to hex string
        str += Number(_ntohs(parts[word] & 0xffff)).toString(16);
        str += word < 7 ? ":" : "";
      }
      return str;
    }function __read_sockaddr(sa, salen) {
      // family / port offsets are common to both sockaddr_in and sockaddr_in6
      var family = HEAP16[((sa)>>1)];
      var port = _ntohs(HEAP16[(((sa)+(2))>>1)]);
      var addr;
  
      switch (family) {
        case 2:
          if (salen !== 16) {
            return { errno: ERRNO_CODES.EINVAL };
          }
          addr = HEAP32[(((sa)+(4))>>2)];
          addr = __inet_ntop4_raw(addr);
          break;
        case 10:
          if (salen !== 28) {
            return { errno: ERRNO_CODES.EINVAL };
          }
          addr = [
            HEAP32[(((sa)+(8))>>2)],
            HEAP32[(((sa)+(12))>>2)],
            HEAP32[(((sa)+(16))>>2)],
            HEAP32[(((sa)+(20))>>2)]
          ];
          addr = __inet_ntop6_raw(addr);
          break;
        default:
          return { errno: ERRNO_CODES.EAFNOSUPPORT };
      }
  
      return { family: family, addr: addr, port: port };
    }
  
  function __write_sockaddr(sa, family, addr, port) {
      switch (family) {
        case 2:
          addr = __inet_pton4_raw(addr);
          HEAP16[((sa)>>1)]=family;
          HEAP32[(((sa)+(4))>>2)]=addr;
          HEAP16[(((sa)+(2))>>1)]=_htons(port);
          break;
        case 10:
          addr = __inet_pton6_raw(addr);
          HEAP32[((sa)>>2)]=family;
          HEAP32[(((sa)+(8))>>2)]=addr[0];
          HEAP32[(((sa)+(12))>>2)]=addr[1];
          HEAP32[(((sa)+(16))>>2)]=addr[2];
          HEAP32[(((sa)+(20))>>2)]=addr[3];
          HEAP16[(((sa)+(2))>>1)]=_htons(port);
          HEAP32[(((sa)+(4))>>2)]=0;
          HEAP32[(((sa)+(24))>>2)]=0;
          break;
        default:
          return { errno: ERRNO_CODES.EAFNOSUPPORT };
      }
      // kind of lame, but let's match _read_sockaddr's interface
      return {};
    }function ___syscall102(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // socketcall
      var call = SYSCALLS.get(), socketvararg = SYSCALLS.get();
      // socketcalls pass the rest of the arguments in a struct
      SYSCALLS.varargs = socketvararg;
      switch (call) {
        case 1: { // socket
          var domain = SYSCALLS.get(), type = SYSCALLS.get(), protocol = SYSCALLS.get();
          var sock = SOCKFS.createSocket(domain, type, protocol);
          assert(sock.stream.fd < 64); // XXX ? select() assumes socket fd values are in 0..63
          return sock.stream.fd;
        }
        case 2: { // bind
          var sock = SYSCALLS.getSocketFromFD(), info = SYSCALLS.getSocketAddress();
          sock.sock_ops.bind(sock, info.addr, info.port);
          return 0;
        }
        case 3: { // connect
          var sock = SYSCALLS.getSocketFromFD(), info = SYSCALLS.getSocketAddress();
          sock.sock_ops.connect(sock, info.addr, info.port);
          return 0;
        }
        case 4: { // listen
          var sock = SYSCALLS.getSocketFromFD(), backlog = SYSCALLS.get();
          sock.sock_ops.listen(sock, backlog);
          return 0;
        }
        case 5: { // accept
          var sock = SYSCALLS.getSocketFromFD(), addr = SYSCALLS.get(), addrlen = SYSCALLS.get();
          var newsock = sock.sock_ops.accept(sock);
          if (addr) {
            var res = __write_sockaddr(addr, newsock.family, DNS.lookup_name(newsock.daddr), newsock.dport);
            assert(!res.errno);
          }
          return newsock.stream.fd;
        }
        case 6: { // getsockname
          var sock = SYSCALLS.getSocketFromFD(), addr = SYSCALLS.get(), addrlen = SYSCALLS.get();
          // TODO: sock.saddr should never be undefined, see TODO in websocket_sock_ops.getname
          var res = __write_sockaddr(addr, sock.family, DNS.lookup_name(sock.saddr || '0.0.0.0'), sock.sport);
          assert(!res.errno);
          return 0;
        }
        case 7: { // getpeername
          var sock = SYSCALLS.getSocketFromFD(), addr = SYSCALLS.get(), addrlen = SYSCALLS.get();
          if (!sock.daddr) {
            return -ERRNO_CODES.ENOTCONN; // The socket is not connected.
          }
          var res = __write_sockaddr(addr, sock.family, DNS.lookup_name(sock.daddr), sock.dport);
          assert(!res.errno);
          return 0;
        }
        case 11: { // sendto
          var sock = SYSCALLS.getSocketFromFD(), message = SYSCALLS.get(), length = SYSCALLS.get(), flags = SYSCALLS.get(), dest = SYSCALLS.getSocketAddress(true);
          if (!dest) {
            // send, no address provided
            return FS.write(sock.stream, HEAP8,message, length);
          } else {
            // sendto an address
            return sock.sock_ops.sendmsg(sock, HEAP8,message, length, dest.addr, dest.port);
          }
        }
        case 12: { // recvfrom
          var sock = SYSCALLS.getSocketFromFD(), buf = SYSCALLS.get(), len = SYSCALLS.get(), flags = SYSCALLS.get(), addr = SYSCALLS.get(), addrlen = SYSCALLS.get();
          var msg = sock.sock_ops.recvmsg(sock, len);
          if (!msg) return 0; // socket is closed
          if (addr) {
            var res = __write_sockaddr(addr, sock.family, DNS.lookup_name(msg.addr), msg.port);
            assert(!res.errno);
          }
          HEAPU8.set(msg.buffer, buf);
          return msg.buffer.byteLength;
        }
        case 14: { // setsockopt
          return -ERRNO_CODES.ENOPROTOOPT; // The option is unknown at the level indicated.
        }
        case 15: { // getsockopt
          var sock = SYSCALLS.getSocketFromFD(), level = SYSCALLS.get(), optname = SYSCALLS.get(), optval = SYSCALLS.get(), optlen = SYSCALLS.get();
          // Minimal getsockopt aimed at resolving https://github.com/kripken/emscripten/issues/2211
          // so only supports SOL_SOCKET with SO_ERROR.
          if (level === 1) {
            if (optname === 4) {
              HEAP32[((optval)>>2)]=sock.error;
              HEAP32[((optlen)>>2)]=4;
              sock.error = null; // Clear the error (The SO_ERROR option obtains and then clears this field).
              return 0;
            }
          }
          return -ERRNO_CODES.ENOPROTOOPT; // The option is unknown at the level indicated.
        }
        case 16: { // sendmsg
          var sock = SYSCALLS.getSocketFromFD(), message = SYSCALLS.get(), flags = SYSCALLS.get();
          var iov = HEAP32[(((message)+(8))>>2)];
          var num = HEAP32[(((message)+(12))>>2)];
          // read the address and port to send to
          var addr, port;
          var name = HEAP32[((message)>>2)];
          var namelen = HEAP32[(((message)+(4))>>2)];
          if (name) {
            var info = __read_sockaddr(name, namelen);
            if (info.errno) return -info.errno;
            port = info.port;
            addr = DNS.lookup_addr(info.addr) || info.addr;
          }
          // concatenate scatter-gather arrays into one message buffer
          var total = 0;
          for (var i = 0; i < num; i++) {
            total += HEAP32[(((iov)+((8 * i) + 4))>>2)];
          }
          var view = new Uint8Array(total);
          var offset = 0;
          for (var i = 0; i < num; i++) {
            var iovbase = HEAP32[(((iov)+((8 * i) + 0))>>2)];
            var iovlen = HEAP32[(((iov)+((8 * i) + 4))>>2)];
            for (var j = 0; j < iovlen; j++) {  
              view[offset++] = HEAP8[(((iovbase)+(j))>>0)];
            }
          }
          // write the buffer
          return sock.sock_ops.sendmsg(sock, view, 0, total, addr, port);
        }
        case 17: { // recvmsg
          var sock = SYSCALLS.getSocketFromFD(), message = SYSCALLS.get(), flags = SYSCALLS.get();
          var iov = HEAP32[(((message)+(8))>>2)];
          var num = HEAP32[(((message)+(12))>>2)];
          // get the total amount of data we can read across all arrays
          var total = 0;
          for (var i = 0; i < num; i++) {
            total += HEAP32[(((iov)+((8 * i) + 4))>>2)];
          }
          // try to read total data
          var msg = sock.sock_ops.recvmsg(sock, total);
          if (!msg) return 0; // socket is closed
  
          // TODO honor flags:
          // MSG_OOB
          // Requests out-of-band data. The significance and semantics of out-of-band data are protocol-specific.
          // MSG_PEEK
          // Peeks at the incoming message.
          // MSG_WAITALL
          // Requests that the function block until the full amount of data requested can be returned. The function may return a smaller amount of data if a signal is caught, if the connection is terminated, if MSG_PEEK was specified, or if an error is pending for the socket.
  
          // write the source address out
          var name = HEAP32[((message)>>2)];
          if (name) {
            var res = __write_sockaddr(name, sock.family, DNS.lookup_name(msg.addr), msg.port);
            assert(!res.errno);
          }
          // write the buffer out to the scatter-gather arrays
          var bytesRead = 0;
          var bytesRemaining = msg.buffer.byteLength;
          for (var i = 0; bytesRemaining > 0 && i < num; i++) {
            var iovbase = HEAP32[(((iov)+((8 * i) + 0))>>2)];
            var iovlen = HEAP32[(((iov)+((8 * i) + 4))>>2)];
            if (!iovlen) {
              continue;
            }
            var length = Math.min(iovlen, bytesRemaining);
            var buf = msg.buffer.subarray(bytesRead, bytesRead + length);
            HEAPU8.set(buf, iovbase + bytesRead);
            bytesRead += length;
            bytesRemaining -= length;
          }
  
          // TODO set msghdr.msg_flags
          // MSG_EOR
          // End of record was received (if supported by the protocol).
          // MSG_OOB
          // Out-of-band data was received.
          // MSG_TRUNC
          // Normal data was truncated.
          // MSG_CTRUNC
  
          return bytesRead;
        }
        default: abort('unsupported socketcall syscall ' + call);
      }
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall122(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // uname
      var buf = SYSCALLS.get();
      if (!buf) return -ERRNO_CODES.EFAULT
      var layout = {"sysname":0,"nodename":65,"domainname":325,"machine":260,"version":195,"release":130,"__size__":390};
      function copyString(element, value) {
        var offset = layout[element];
        writeAsciiToMemory(value, buf + offset);
      }
      copyString('sysname', 'Emscripten');
      copyString('nodename', 'emscripten');
      copyString('release', '1.0');
      copyString('version', '#1');
      copyString('machine', 'x86-JS');
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall140(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // llseek
      var stream = SYSCALLS.getStreamFromFD(), offset_high = SYSCALLS.get(), offset_low = SYSCALLS.get(), result = SYSCALLS.get(), whence = SYSCALLS.get();
      // NOTE: offset_high is unused - Emscripten's off_t is 32-bit
      var offset = offset_low;
      FS.llseek(stream, offset, whence);
      HEAP32[((result)>>2)]=stream.position;
      if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall142(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // newselect
      // readfds are supported,
      // writefds checks socket open status
      // exceptfds not supported
      // timeout is always 0 - fully async
      var nfds = SYSCALLS.get(), readfds = SYSCALLS.get(), writefds = SYSCALLS.get(), exceptfds = SYSCALLS.get(), timeout = SYSCALLS.get();
  
      assert(nfds <= 64, 'nfds must be less than or equal to 64');  // fd sets have 64 bits // TODO: this could be 1024 based on current musl headers
      assert(!exceptfds, 'exceptfds not supported');
  
      var total = 0;
      
      var srcReadLow = (readfds ? HEAP32[((readfds)>>2)] : 0),
          srcReadHigh = (readfds ? HEAP32[(((readfds)+(4))>>2)] : 0);
      var srcWriteLow = (writefds ? HEAP32[((writefds)>>2)] : 0),
          srcWriteHigh = (writefds ? HEAP32[(((writefds)+(4))>>2)] : 0);
      var srcExceptLow = (exceptfds ? HEAP32[((exceptfds)>>2)] : 0),
          srcExceptHigh = (exceptfds ? HEAP32[(((exceptfds)+(4))>>2)] : 0);
  
      var dstReadLow = 0,
          dstReadHigh = 0;
      var dstWriteLow = 0,
          dstWriteHigh = 0;
      var dstExceptLow = 0,
          dstExceptHigh = 0;
  
      var allLow = (readfds ? HEAP32[((readfds)>>2)] : 0) |
                   (writefds ? HEAP32[((writefds)>>2)] : 0) |
                   (exceptfds ? HEAP32[((exceptfds)>>2)] : 0);
      var allHigh = (readfds ? HEAP32[(((readfds)+(4))>>2)] : 0) |
                    (writefds ? HEAP32[(((writefds)+(4))>>2)] : 0) |
                    (exceptfds ? HEAP32[(((exceptfds)+(4))>>2)] : 0);
  
      function check(fd, low, high, val) {
        return (fd < 32 ? (low & val) : (high & val));
      }
  
      for (var fd = 0; fd < nfds; fd++) {
        var mask = 1 << (fd % 32);
        if (!(check(fd, allLow, allHigh, mask))) {
          continue;  // index isn't in the set
        }
  
        var stream = FS.getStream(fd);
        if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  
        var flags = SYSCALLS.DEFAULT_POLLMASK;
  
        if (stream.stream_ops.poll) {
          flags = stream.stream_ops.poll(stream);
        }
  
        if ((flags & 1) && check(fd, srcReadLow, srcReadHigh, mask)) {
          fd < 32 ? (dstReadLow = dstReadLow | mask) : (dstReadHigh = dstReadHigh | mask);
          total++;
        }
        if ((flags & 4) && check(fd, srcWriteLow, srcWriteHigh, mask)) {
          fd < 32 ? (dstWriteLow = dstWriteLow | mask) : (dstWriteHigh = dstWriteHigh | mask);
          total++;
        }
        if ((flags & 2) && check(fd, srcExceptLow, srcExceptHigh, mask)) {
          fd < 32 ? (dstExceptLow = dstExceptLow | mask) : (dstExceptHigh = dstExceptHigh | mask);
          total++;
        }
      }
  
      if (readfds) {
        HEAP32[((readfds)>>2)]=dstReadLow;
        HEAP32[(((readfds)+(4))>>2)]=dstReadHigh;
      }
      if (writefds) {
        HEAP32[((writefds)>>2)]=dstWriteLow;
        HEAP32[(((writefds)+(4))>>2)]=dstWriteHigh;
      }
      if (exceptfds) {
        HEAP32[((exceptfds)>>2)]=dstExceptLow;
        HEAP32[(((exceptfds)+(4))>>2)]=dstExceptHigh;
      }
      
      return total;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall145(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // readv
      var stream = SYSCALLS.getStreamFromFD(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
      return SYSCALLS.doReadv(stream, iov, iovcnt);
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall146(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // writev
      var stream = SYSCALLS.getStreamFromFD(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
      return SYSCALLS.doWritev(stream, iov, iovcnt);
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall15(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // chmod
      var path = SYSCALLS.getStr(), mode = SYSCALLS.get();
      FS.chmod(path, mode);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall183(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // getcwd
      var buf = SYSCALLS.get(), size = SYSCALLS.get();
      if (size === 0) return -ERRNO_CODES.EINVAL;
      var cwd = FS.cwd();
      var cwdLengthInBytes = lengthBytesUTF8(cwd);
      if (size < cwdLengthInBytes + 1) return -ERRNO_CODES.ERANGE;
      stringToUTF8(cwd, buf, size);
      return buf;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall192(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // mmap2
      var addr = SYSCALLS.get(), len = SYSCALLS.get(), prot = SYSCALLS.get(), flags = SYSCALLS.get(), fd = SYSCALLS.get(), off = SYSCALLS.get()
      off <<= 12; // undo pgoffset
      var ptr;
      var allocated = false;
      if (fd === -1) {
        ptr = _memalign(PAGE_SIZE, len);
        if (!ptr) return -ERRNO_CODES.ENOMEM;
        _memset(ptr, 0, len);
        allocated = true;
      } else {
        var info = FS.getStream(fd);
        if (!info) return -ERRNO_CODES.EBADF;
        var res = FS.mmap(info, HEAPU8, addr, len, off, prot, flags);
        ptr = res.ptr;
        allocated = res.allocated;
      }
      SYSCALLS.mappings[ptr] = { malloc: ptr, len: len, allocated: allocated, fd: fd, flags: flags };
      return ptr;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall193(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // truncate64
      var path = SYSCALLS.getStr(), zero = SYSCALLS.getZero(), length = SYSCALLS.get64();
      FS.truncate(path, length);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall195(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // SYS_stat64
      var path = SYSCALLS.getStr(), buf = SYSCALLS.get();
      return SYSCALLS.doStat(FS.stat, path, buf);
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall196(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // SYS_lstat64
      var path = SYSCALLS.getStr(), buf = SYSCALLS.get();
      return SYSCALLS.doStat(FS.lstat, path, buf);
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall197(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // SYS_fstat64
      var stream = SYSCALLS.getStreamFromFD(), buf = SYSCALLS.get();
      return SYSCALLS.doStat(FS.stat, stream.path, buf);
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  
  function ___syscall202(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // getgid32
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }function ___syscall199() {
  return ___syscall202.apply(null, arguments)
  }

  function ___syscall220(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // SYS_getdents64
      var stream = SYSCALLS.getStreamFromFD(), dirp = SYSCALLS.get(), count = SYSCALLS.get();
      if (!stream.getdents) {
        stream.getdents = FS.readdir(stream.path);
      }
      var pos = 0;
      while (stream.getdents.length > 0 && pos + 268 <= count) {
        var id;
        var type;
        var name = stream.getdents.pop();
        if (name[0] === '.') {
          id = 1;
          type = 4; // DT_DIR
        } else {
          var child = FS.lookupNode(stream.node, name);
          id = child.id;
          type = FS.isChrdev(child.mode) ? 2 :  // DT_CHR, character device.
                 FS.isDir(child.mode) ? 4 :     // DT_DIR, directory.
                 FS.isLink(child.mode) ? 10 :   // DT_LNK, symbolic link.
                 8;                             // DT_REG, regular file.
        }
        HEAP32[((dirp + pos)>>2)]=id;
        HEAP32[(((dirp + pos)+(4))>>2)]=stream.position;
        HEAP16[(((dirp + pos)+(8))>>1)]=268;
        HEAP8[(((dirp + pos)+(10))>>0)]=type;
        stringToUTF8(name, dirp + pos + 11, 256);
        pos += 268;
      }
      return pos;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall221(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // fcntl64
      var stream = SYSCALLS.getStreamFromFD(), cmd = SYSCALLS.get();
      switch (cmd) {
        case 0: {
          var arg = SYSCALLS.get();
          if (arg < 0) {
            return -ERRNO_CODES.EINVAL;
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
        case 12:
        case 12: {
          var arg = SYSCALLS.get();
          var offset = 0;
          // We're always unlocked.
          HEAP16[(((arg)+(offset))>>1)]=2;
          return 0;
        }
        case 13:
        case 14:
        case 13:
        case 14:
          return 0; // Pretend that the locking is successful.
        case 16:
        case 8:
          return -ERRNO_CODES.EINVAL; // These are for sockets. We don't have them fully implemented yet.
        case 9:
          // musl trusts getown return values, due to a bug where they must be, as they overlap with errors. just return -1 here, so fnctl() returns that, and we set errno ourselves.
          ___setErrNo(ERRNO_CODES.EINVAL);
          return -1;
        default: {
          return -ERRNO_CODES.EINVAL;
        }
      }
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall268(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // statfs64
      var path = SYSCALLS.getStr(), size = SYSCALLS.get(), buf = SYSCALLS.get();
      assert(size === 64);
      // NOTE: None of the constants here are true. We're just returning safe and
      //       sane values.
      HEAP32[(((buf)+(4))>>2)]=4096;
      HEAP32[(((buf)+(40))>>2)]=4096;
      HEAP32[(((buf)+(8))>>2)]=1000000;
      HEAP32[(((buf)+(12))>>2)]=500000;
      HEAP32[(((buf)+(16))>>2)]=500000;
      HEAP32[(((buf)+(20))>>2)]=FS.nextInode;
      HEAP32[(((buf)+(24))>>2)]=1000000;
      HEAP32[(((buf)+(28))>>2)]=42;
      HEAP32[(((buf)+(44))>>2)]=2;  // ST_NOSUID
      HEAP32[(((buf)+(36))>>2)]=255;
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall3(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // read
      var stream = SYSCALLS.getStreamFromFD(), buf = SYSCALLS.get(), count = SYSCALLS.get();
      return FS.read(stream, HEAP8,buf, count);
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall33(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // access
      var path = SYSCALLS.getStr(), amode = SYSCALLS.get();
      return SYSCALLS.doAccess(path, amode);
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall38(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // rename
      var old_path = SYSCALLS.getStr(), new_path = SYSCALLS.getStr();
      FS.rename(old_path, new_path);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall39(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // mkdir
      var path = SYSCALLS.getStr(), mode = SYSCALLS.get();
      return SYSCALLS.doMkdir(path, mode);
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall4(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // write
      var stream = SYSCALLS.getStreamFromFD(), buf = SYSCALLS.get(), count = SYSCALLS.get();
      return FS.write(stream, HEAP8,buf, count);
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall40(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // rmdir
      var path = SYSCALLS.getStr();
      FS.rmdir(path);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall5(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // open
      var pathname = SYSCALLS.getStr(), flags = SYSCALLS.get(), mode = SYSCALLS.get() // optional TODO
      var stream = FS.open(pathname, flags, mode);
      return stream.fd;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall54(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // ioctl
      var stream = SYSCALLS.getStreamFromFD(), op = SYSCALLS.get();
      switch (op) {
        case 21509:
        case 21505: {
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          return 0;
        }
        case 21510:
        case 21511:
        case 21512:
        case 21506:
        case 21507:
        case 21508: {
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          return 0; // no-op, not actually adjusting terminal settings
        }
        case 21519: {
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          var argp = SYSCALLS.get();
          HEAP32[((argp)>>2)]=0;
          return 0;
        }
        case 21520: {
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          return -ERRNO_CODES.EINVAL; // not supported
        }
        case 21531: {
          var argp = SYSCALLS.get();
          return FS.ioctl(stream, op, argp);
        }
        case 21523: {
          // TODO: in theory we should write to the winsize struct that gets
          // passed in, but for now musl doesn't read anything on it
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          return 0;
        }
        case 21524: {
          // TODO: technically, this ioctl call should change the window size.
          // but, since emscripten doesn't have any concept of a terminal window
          // yet, we'll just silently throw it away as we do TIOCGWINSZ
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          return 0;
        }
        default: abort('bad ioctl syscall ' + op);
      }
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall6(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // close
      var stream = SYSCALLS.getStreamFromFD();
      FS.close(stream);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall77(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // getrusage
      var who = SYSCALLS.get(), usage = SYSCALLS.get();
      _memset(usage, 0, 136);
      HEAP32[((usage)>>2)]=1; // fake some values
      HEAP32[(((usage)+(4))>>2)]=2;
      HEAP32[(((usage)+(8))>>2)]=3;
      HEAP32[(((usage)+(12))>>2)]=4;
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall85(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // readlink
      var path = SYSCALLS.getStr(), buf = SYSCALLS.get(), bufsize = SYSCALLS.get();
      return SYSCALLS.doReadlink(path, buf, bufsize);
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall91(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // munmap
      var addr = SYSCALLS.get(), len = SYSCALLS.get();
      // TODO: support unmmap'ing parts of allocations
      var info = SYSCALLS.mappings[addr];
      if (!info) return 0;
      if (len === info.len) {
        var stream = FS.getStream(info.fd);
        SYSCALLS.doMsync(addr, stream, len, info.flags)
        FS.munmap(stream);
        SYSCALLS.mappings[addr] = null;
        if (info.allocated) {
          _free(info.malloc);
        }
      }
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___unlock() {}

  function _abort() {
      Module['abort']();
    }

  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }

  function _clock() {
      if (_clock.start === undefined) _clock.start = Date.now();
      return ((Date.now() - _clock.start) * (1000000 / 1000))|0;
    }

  
  function _emscripten_get_now_res() { // return resolution of get_now, in nanoseconds
      if (ENVIRONMENT_IS_NODE) {
        return 1; // nanoseconds
      } else if (typeof dateNow !== 'undefined' ||
                 ((ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && self['performance'] && self['performance']['now'])) {
        return 1000; // microseconds (1/1000 of a millisecond)
      } else {
        return 1000*1000; // milliseconds
      }
    }
  
  
  function _emscripten_get_now() { abort() }function _emscripten_get_now_is_monotonic() {
      // return whether emscripten_get_now is guaranteed monotonic; the Date.now
      // implementation is not :(
      return ENVIRONMENT_IS_NODE || (typeof dateNow !== 'undefined') ||
          ((ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && self['performance'] && self['performance']['now']);
    }function _clock_getres(clk_id, res) {
      // int clock_getres(clockid_t clk_id, struct timespec *res);
      var nsec;
      if (clk_id === 0) {
        nsec = 1000 * 1000; // educated guess that it's milliseconds
      } else if (clk_id === 1 && _emscripten_get_now_is_monotonic()) {
        nsec = _emscripten_get_now_res();
      } else {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      }
      HEAP32[((res)>>2)]=(nsec/1000000000)|0;
      HEAP32[(((res)+(4))>>2)]=nsec // resolution is nanoseconds
      return 0;
    }

  function _clock_gettime(clk_id, tp) {
      // int clock_gettime(clockid_t clk_id, struct timespec *tp);
      var now;
      if (clk_id === 0) {
        now = Date.now();
      } else if (clk_id === 1 && _emscripten_get_now_is_monotonic()) {
        now = _emscripten_get_now();
      } else {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      }
      HEAP32[((tp)>>2)]=(now/1000)|0; // seconds
      HEAP32[(((tp)+(4))>>2)]=((now % 1000)*1000*1000)|0; // nanoseconds
      return 0;
    }

  function _difftime(time1, time0) {
      return time1 - time0;
    }

  
  var DLFCN={error:null,errorMsg:null,loadedLibs:{},loadedLibNames:{}};function _dlclose(handle) {
      // int dlclose(void *handle);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/dlclose.html
      if (!DLFCN.loadedLibs[handle]) {
        DLFCN.errorMsg = 'Tried to dlclose() unopened handle: ' + handle;
        return 1;
      } else {
        var lib_record = DLFCN.loadedLibs[handle];
        if (--lib_record.refcount == 0) {
          if (lib_record.module.cleanups) {
            lib_record.module.cleanups.forEach(function(cleanup) { cleanup() });
          }
          delete DLFCN.loadedLibNames[lib_record.name];
          delete DLFCN.loadedLibs[handle];
        }
        return 0;
      }
    }

  function _dlopen(filename, flag) {
      abort("To use dlopen, you need to use Emscripten's linking support, see https://github.com/kripken/emscripten/wiki/Linking");
      // void *dlopen(const char *file, int mode);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/dlopen.html
      var searchpaths = [];
      if (filename === 0) {
        filename = '__self__';
      } else {
        var strfilename = Pointer_stringify(filename);
        var isValidFile = function (filename) {
          var target = FS.findObject(filename);
          return target && !target.isFolder && !target.isDevice;
        };
  
        if (isValidFile(strfilename)) {
          filename = strfilename;
        } else {
          if (ENV['LD_LIBRARY_PATH']) {
            searchpaths = ENV['LD_LIBRARY_PATH'].split(':');
          }
  
          for (var ident in searchpaths) {
            var searchfile = PATH.join2(searchpaths[ident],strfilename);
            if (isValidFile(searchfile)) {
              filename = searchfile;
              break;
            }
          }
        }
      }
  
      if (DLFCN.loadedLibNames[filename]) {
        // Already loaded; increment ref count and return.
        var handle = DLFCN.loadedLibNames[filename];
        DLFCN.loadedLibs[handle].refcount++;
        return handle;
      }
  
      var lib_module;
      if (filename === '__self__') {
        var handle = -1;
        lib_module = Module;
      } else {
        if (Module['preloadedWasm'] !== undefined &&
            Module['preloadedWasm'][filename] !== undefined) {
          lib_module = Module['preloadedWasm'][filename];
        } else {
          var target = FS.findObject(filename);
          if (!target || target.isFolder || target.isDevice) {
            DLFCN.errorMsg = 'Could not find dynamic lib: ' + filename;
            return 0;
          }
          FS.forceLoadFile(target);
  
          try {
            // the shared library is a shared wasm library (see tools/shared.py WebAssembly.make_shared_library)
            var lib_data = FS.readFile(filename, { encoding: 'binary' });
            if (!(lib_data instanceof Uint8Array)) lib_data = new Uint8Array(lib_data);
            //err('libfile ' + filename + ' size: ' + lib_data.length);
            lib_module = loadWebAssemblyModule(lib_data);
          } catch (e) {
            DLFCN.errorMsg = 'Could not evaluate dynamic lib: ' + filename + '\n' + e;
            return 0;
          }
        }
  
        // Not all browsers support Object.keys().
        var handle = 1;
        for (var key in DLFCN.loadedLibs) {
          if (DLFCN.loadedLibs.hasOwnProperty(key)) handle++;
        }
  
        // We don't care about RTLD_NOW and RTLD_LAZY.
        if (flag & 256) { // RTLD_GLOBAL
          for (var ident in lib_module) {
            if (lib_module.hasOwnProperty(ident)) {
              // When RTLD_GLOBAL is enable, the symbols defined by this shared object will be made
              // available for symbol resolution of subsequently loaded shared objects.
              //
              // We should copy the symbols (which include methods and variables) from SIDE_MODULE to MAIN_MODULE.
              //
              // Module of SIDE_MODULE has not only the symbols (which should be copied)
              // but also others (print*, asmGlobal*, FUNCTION_TABLE_**, NAMED_GLOBALS, and so on).
              //
              // When the symbol (which should be copied) is method, Module._* 's type becomes function.
              // When the symbol (which should be copied) is variable, Module._* 's type becomes number.
              //
              // Except for the symbol prefix (_), there is no difference in the symbols (which should be copied) and others.
              // So this just copies over compiled symbols (which start with _).
              if (ident[0] == '_') {
                Module[ident] = lib_module[ident];
              }
            }
          }
        }
      }
      DLFCN.loadedLibs[handle] = {
        refcount: 1,
        name: filename,
        module: lib_module
      };
      DLFCN.loadedLibNames[filename] = handle;
  
      return handle;
    }

  function _dlsym(handle, symbol) {
      // void *dlsym(void *restrict handle, const char *restrict name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/dlsym.html
      symbol = Pointer_stringify(symbol);
  
      if (!DLFCN.loadedLibs[handle]) {
        DLFCN.errorMsg = 'Tried to dlsym() from an unopened handle: ' + handle;
        return 0;
      } else {
        var lib = DLFCN.loadedLibs[handle];
        symbol = '_' + symbol;
        if (!lib.module.hasOwnProperty(symbol)) {
          DLFCN.errorMsg = ('Tried to lookup unknown symbol "' + symbol +
                                 '" in dynamic lib: ' + lib.name);
          return 0;
        } else {
          var result = lib.module[symbol];
          if (typeof result === 'function') {
            // convert the exported function into a function pointer using our generic
            // JS mechanism.
            return addFunction(result);
          }
          return result;
        }
      }
    }

  var _emscripten_asm_const_double=true;

  var _emscripten_asm_const_int=true;

  var _emscripten_asm_const_int_sync_on_main_thread=true;

  
  
  
  function _emscripten_set_main_loop_timing(mode, value) {
      Browser.mainLoop.timingMode = mode;
      Browser.mainLoop.timingValue = value;
  
      if (!Browser.mainLoop.func) {
        return 1; // Return non-zero on failure, can't set timing mode when there is no main loop.
      }
  
      if (mode == 0 /*EM_TIMING_SETTIMEOUT*/) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
          var timeUntilNextTick = Math.max(0, Browser.mainLoop.tickStartTime + value - _emscripten_get_now())|0;
          setTimeout(Browser.mainLoop.runner, timeUntilNextTick); // doing this each time means that on exception, we stop
        };
        Browser.mainLoop.method = 'timeout';
      } else if (mode == 1 /*EM_TIMING_RAF*/) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
          Browser.requestAnimationFrame(Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = 'rAF';
      } else if (mode == 2 /*EM_TIMING_SETIMMEDIATE*/) {
        if (typeof setImmediate === 'undefined') {
          // Emulate setImmediate. (note: not a complete polyfill, we don't emulate clearImmediate() to keep code size to minimum, since not needed)
          var setImmediates = [];
          var emscriptenMainLoopMessageId = 'setimmediate';
          function Browser_setImmediate_messageHandler(event) {
            // When called in current thread or Worker, the main loop ID is structured slightly different to accommodate for --proxy-to-worker runtime listening to Worker events,
            // so check for both cases.
            if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
              event.stopPropagation();
              setImmediates.shift()();
            }
          }
          addEventListener("message", Browser_setImmediate_messageHandler, true);
          setImmediate = function Browser_emulated_setImmediate(func) {
            setImmediates.push(func);
            if (ENVIRONMENT_IS_WORKER) {
              if (Module['setImmediates'] === undefined) Module['setImmediates'] = [];
              Module['setImmediates'].push(func);
              postMessage({target: emscriptenMainLoopMessageId}); // In --proxy-to-worker, route the message via proxyClient.js
            } else postMessage(emscriptenMainLoopMessageId, "*"); // On the main thread, can just send the message to itself.
          }
        }
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
          setImmediate(Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = 'immediate';
      }
      return 0;
    }function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop, arg, noSetTiming) {
      Module['noExitRuntime'] = true;
  
      assert(!Browser.mainLoop.func, 'emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.');
  
      Browser.mainLoop.func = func;
      Browser.mainLoop.arg = arg;
  
      var browserIterationFunc;
      if (typeof arg !== 'undefined') {
        browserIterationFunc = function() {
          Module['dynCall_vi'](func, arg);
        };
      } else {
        browserIterationFunc = function() {
          Module['dynCall_v'](func);
        };
      }
  
      var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
  
      Browser.mainLoop.runner = function Browser_mainLoop_runner() {
        if (ABORT) return;
        if (Browser.mainLoop.queue.length > 0) {
          var start = Date.now();
          var blocker = Browser.mainLoop.queue.shift();
          blocker.func(blocker.arg);
          if (Browser.mainLoop.remainingBlockers) {
            var remaining = Browser.mainLoop.remainingBlockers;
            var next = remaining%1 == 0 ? remaining-1 : Math.floor(remaining);
            if (blocker.counted) {
              Browser.mainLoop.remainingBlockers = next;
            } else {
              // not counted, but move the progress along a tiny bit
              next = next + 0.5; // do not steal all the next one's progress
              Browser.mainLoop.remainingBlockers = (8*remaining + next)/9;
            }
          }
          console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + ' ms'); //, left: ' + Browser.mainLoop.remainingBlockers);
          Browser.mainLoop.updateStatus();
  
          // catches pause/resume main loop from blocker execution
          if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  
          setTimeout(Browser.mainLoop.runner, 0);
          return;
        }
  
        // catch pauses from non-main loop sources
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  
        // Implement very basic swap interval control
        Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
        if (Browser.mainLoop.timingMode == 1/*EM_TIMING_RAF*/ && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
          // Not the scheduled time to render this frame - skip.
          Browser.mainLoop.scheduler();
          return;
        } else if (Browser.mainLoop.timingMode == 0/*EM_TIMING_SETTIMEOUT*/) {
          Browser.mainLoop.tickStartTime = _emscripten_get_now();
        }
  
        // Signal GL rendering layer that processing of a new frame is about to start. This helps it optimize
        // VBO double-buffering and reduce GPU stalls.
  
  
  
        if (Browser.mainLoop.method === 'timeout' && Module.ctx) {
          err('Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!');
          Browser.mainLoop.method = ''; // just warn once per call to set main loop
        }
  
        Browser.mainLoop.runIter(browserIterationFunc);
  
  
        // catch pauses from the main loop itself
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  
        // Queue new audio data. This is important to be right after the main loop invocation, so that we will immediately be able
        // to queue the newest produced audio samples.
        // TODO: Consider adding pre- and post- rAF callbacks so that GL.newRenderingFrameStarted() and SDL.audio.queueNewAudioData()
        //       do not need to be hardcoded into this function, but can be more generic.
        if (typeof SDL === 'object' && SDL.audio && SDL.audio.queueNewAudioData) SDL.audio.queueNewAudioData();
  
        Browser.mainLoop.scheduler();
      }
  
      if (!noSetTiming) {
        if (fps && fps > 0) _emscripten_set_main_loop_timing(0/*EM_TIMING_SETTIMEOUT*/, 1000.0 / fps);
        else _emscripten_set_main_loop_timing(1/*EM_TIMING_RAF*/, 1); // Do rAF by rendering each frame (no decimating)
  
        Browser.mainLoop.scheduler();
      }
  
      if (simulateInfiniteLoop) {
        throw 'SimulateInfiniteLoop';
      }
    }var Browser={mainLoop:{scheduler:null,method:"",currentlyRunningMainloop:0,func:null,arg:0,timingMode:0,timingValue:0,currentFrameNumber:0,queue:[],pause:function () {
          Browser.mainLoop.scheduler = null;
          Browser.mainLoop.currentlyRunningMainloop++; // Incrementing this signals the previous main loop that it's now become old, and it must return.
        },resume:function () {
          Browser.mainLoop.currentlyRunningMainloop++;
          var timingMode = Browser.mainLoop.timingMode;
          var timingValue = Browser.mainLoop.timingValue;
          var func = Browser.mainLoop.func;
          Browser.mainLoop.func = null;
          _emscripten_set_main_loop(func, 0, false, Browser.mainLoop.arg, true /* do not set timing and call scheduler, we will do it on the next lines */);
          _emscripten_set_main_loop_timing(timingMode, timingValue);
          Browser.mainLoop.scheduler();
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        },runIter:function (func) {
          if (ABORT) return;
          if (Module['preMainLoop']) {
            var preRet = Module['preMainLoop']();
            if (preRet === false) {
              return; // |return false| skips a frame
            }
          }
          try {
            func();
          } catch (e) {
            if (e instanceof ExitStatus) {
              return;
            } else {
              if (e && typeof e === 'object' && e.stack) err('exception thrown: ' + [e, e.stack]);
              throw e;
            }
          }
          if (Module['postMainLoop']) Module['postMainLoop']();
        }},isFullscreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
  
        // Canvas event setup
  
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === Module['canvas'] ||
                                document['mozPointerLockElement'] === Module['canvas'] ||
                                document['webkitPointerLockElement'] === Module['canvas'] ||
                                document['msPointerLockElement'] === Module['canvas'];
        }
        var canvas = Module['canvas'];
        if (canvas) {
          // forced aspect ratio can be enabled by defining 'forcedAspectRatio' on Module
          // Module['forcedAspectRatio'] = 4 / 3;
  
          canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                      canvas['mozRequestPointerLock'] ||
                                      canvas['webkitRequestPointerLock'] ||
                                      canvas['msRequestPointerLock'] ||
                                      function(){};
          canvas.exitPointerLock = document['exitPointerLock'] ||
                                   document['mozExitPointerLock'] ||
                                   document['webkitExitPointerLock'] ||
                                   document['msExitPointerLock'] ||
                                   function(){}; // no-op if function does not exist
          canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
          document.addEventListener('pointerlockchange', pointerLockChange, false);
          document.addEventListener('mozpointerlockchange', pointerLockChange, false);
          document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
          document.addEventListener('mspointerlockchange', pointerLockChange, false);
  
          if (Module['elementPointerLock']) {
            canvas.addEventListener("click", function(ev) {
              if (!Browser.pointerLock && Module['canvas'].requestPointerLock) {
                Module['canvas'].requestPointerLock();
                ev.preventDefault();
              }
            }, false);
          }
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx; // no need to recreate GL context if it's already been created for this canvas.
  
        var ctx;
        var contextHandle;
        if (useWebGL) {
          // For GLES2/desktop GL compatibility, adjust a few defaults to be different to WebGL defaults, so that they align better with the desktop defaults.
          var contextAttributes = {
            antialias: false,
            alpha: false
          };
  
          if (webGLContextAttributes) {
            for (var attribute in webGLContextAttributes) {
              contextAttributes[attribute] = webGLContextAttributes[attribute];
            }
          }
  
          contextHandle = GL.createContext(canvas, contextAttributes);
          if (contextHandle) {
            ctx = GL.getContext(contextHandle).GLctx;
          }
        } else {
          ctx = canvas.getContext('2d');
        }
  
        if (!ctx) return null;
  
        if (setInModule) {
          if (!useWebGL) assert(typeof GLctx === 'undefined', 'cannot set in module if GLctx is used, but we are a non-GL context that would replace it');
  
          Module.ctx = ctx;
          if (useWebGL) GL.makeContextCurrent(contextHandle);
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullscreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullscreen:function (lockPointer, resizeCanvas, vrDevice) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        Browser.vrDevice = vrDevice;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        if (typeof Browser.vrDevice === 'undefined') Browser.vrDevice = null;
  
        var canvas = Module['canvas'];
        function fullscreenChange() {
          Browser.isFullscreen = false;
          var canvasContainer = canvas.parentNode;
          if ((document['fullscreenElement'] || document['mozFullScreenElement'] ||
               document['msFullscreenElement'] || document['webkitFullscreenElement'] ||
               document['webkitCurrentFullScreenElement']) === canvasContainer) {
            canvas.exitFullscreen = document['exitFullscreen'] ||
                                    document['cancelFullScreen'] ||
                                    document['mozCancelFullScreen'] ||
                                    document['msExitFullscreen'] ||
                                    document['webkitCancelFullScreen'] ||
                                    function() {};
            canvas.exitFullscreen = canvas.exitFullscreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullscreen = true;
            if (Browser.resizeCanvas) {
              Browser.setFullscreenCanvasSize();
            } else {
              Browser.updateCanvasDimensions(canvas);
            }
          } else {
            // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
            canvasContainer.parentNode.removeChild(canvasContainer);
  
            if (Browser.resizeCanvas) {
              Browser.setWindowedCanvasSize();
            } else {
              Browser.updateCanvasDimensions(canvas);
            }
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullscreen);
          if (Module['onFullscreen']) Module['onFullscreen'](Browser.isFullscreen);
        }
  
        if (!Browser.fullscreenHandlersInstalled) {
          Browser.fullscreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullscreenChange, false);
          document.addEventListener('mozfullscreenchange', fullscreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullscreenChange, false);
          document.addEventListener('MSFullscreenChange', fullscreenChange, false);
        }
  
        // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
  
        // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
        canvasContainer.requestFullscreen = canvasContainer['requestFullscreen'] ||
                                            canvasContainer['mozRequestFullScreen'] ||
                                            canvasContainer['msRequestFullscreen'] ||
                                           (canvasContainer['webkitRequestFullscreen'] ? function() { canvasContainer['webkitRequestFullscreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null) ||
                                           (canvasContainer['webkitRequestFullScreen'] ? function() { canvasContainer['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
  
        if (vrDevice) {
          canvasContainer.requestFullscreen({ vrDisplay: vrDevice });
        } else {
          canvasContainer.requestFullscreen();
        }
      },requestFullScreen:function (lockPointer, resizeCanvas, vrDevice) {
          err('Browser.requestFullScreen() is deprecated. Please call Browser.requestFullscreen instead.');
          Browser.requestFullScreen = function(lockPointer, resizeCanvas, vrDevice) {
            return Browser.requestFullscreen(lockPointer, resizeCanvas, vrDevice);
          }
          return Browser.requestFullscreen(lockPointer, resizeCanvas, vrDevice);
      },nextRAF:0,fakeRequestAnimationFrame:function (func) {
        // try to keep 60fps between calls to here
        var now = Date.now();
        if (Browser.nextRAF === 0) {
          Browser.nextRAF = now + 1000/60;
        } else {
          while (now + 2 >= Browser.nextRAF) { // fudge a little, to avoid timer jitter causing us to do lots of delay:0
            Browser.nextRAF += 1000/60;
          }
        }
        var delay = Math.max(Browser.nextRAF - now, 0);
        setTimeout(func, delay);
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          Browser.fakeRequestAnimationFrame(func);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           Browser.fakeRequestAnimationFrame;
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },allowAsyncCallbacks:true,queuedAsyncCallbacks:[],pauseAsyncCallbacks:function () {
        Browser.allowAsyncCallbacks = false;
      },resumeAsyncCallbacks:function () { // marks future callbacks as ok to execute, and synchronously runs any remaining ones right now
        Browser.allowAsyncCallbacks = true;
        if (Browser.queuedAsyncCallbacks.length > 0) {
          var callbacks = Browser.queuedAsyncCallbacks;
          Browser.queuedAsyncCallbacks = [];
          callbacks.forEach(function(func) {
            func();
          });
        }
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } else {
            Browser.queuedAsyncCallbacks.push(func);
          }
        });
      },safeSetTimeout:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setTimeout(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } else {
            Browser.queuedAsyncCallbacks.push(func);
          }
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setInterval(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } // drop it on the floor otherwise, next interval will kick in
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },getMouseWheelDelta:function (event) {
        var delta = 0;
        switch (event.type) {
          case 'DOMMouseScroll':
            delta = event.detail;
            break;
          case 'mousewheel':
            delta = event.wheelDelta;
            break;
          case 'wheel':
            delta = event['deltaY'];
            break;
          default:
            throw 'unrecognized mouse wheel event: ' + event.type;
        }
        return delta;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,touches:{},lastTouches:{},calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
  
          // check if SDL is available
          if (typeof SDL != "undefined") {
            Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
            Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
            // just add the mouse delta to the current absolut mouse position
            // FIXME: ideally this should be clamped against the canvas size and zero
            Browser.mouseX += Browser.mouseMovementX;
            Browser.mouseY += Browser.mouseMovementY;
          }
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
  
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
  
          if (event.type === 'touchstart' || event.type === 'touchend' || event.type === 'touchmove') {
            var touch = event.touch;
            if (touch === undefined) {
              return; // the "touch" property is only defined in SDL
  
            }
            var adjustedX = touch.pageX - (scrollX + rect.left);
            var adjustedY = touch.pageY - (scrollY + rect.top);
  
            adjustedX = adjustedX * (cw / rect.width);
            adjustedY = adjustedY * (ch / rect.height);
  
            var coords = { x: adjustedX, y: adjustedY };
  
            if (event.type === 'touchstart') {
              Browser.lastTouches[touch.identifier] = coords;
              Browser.touches[touch.identifier] = coords;
            } else if (event.type === 'touchend' || event.type === 'touchmove') {
              var last = Browser.touches[touch.identifier];
              if (!last) last = coords;
              Browser.lastTouches[touch.identifier] = last;
              Browser.touches[touch.identifier] = coords;
            }
            return;
          }
  
          var x = event.pageX - (scrollX + rect.left);
          var y = event.pageY - (scrollY + rect.top);
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        var dep = !noRunDep ? getUniqueRunDependency('al ' + url) : '';
        Module['readAsync'](url, function(arrayBuffer) {
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
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullscreenCanvasSize:function () {
        // check if SDL is available
        if (typeof SDL != "undefined") {
          var flags = HEAPU32[((SDL.screen)>>2)];
          flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
          HEAP32[((SDL.screen)>>2)]=flags
        }
        Browser.updateCanvasDimensions(Module['canvas']);
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        // check if SDL is available
        if (typeof SDL != "undefined") {
          var flags = HEAPU32[((SDL.screen)>>2)];
          flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
          HEAP32[((SDL.screen)>>2)]=flags
        }
        Browser.updateCanvasDimensions(Module['canvas']);
        Browser.updateResizeListeners();
      },updateCanvasDimensions:function (canvas, wNative, hNative) {
        if (wNative && hNative) {
          canvas.widthNative = wNative;
          canvas.heightNative = hNative;
        } else {
          wNative = canvas.widthNative;
          hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if (Module['forcedAspectRatio'] && Module['forcedAspectRatio'] > 0) {
          if (w/h < Module['forcedAspectRatio']) {
            w = Math.round(h * Module['forcedAspectRatio']);
          } else {
            h = Math.round(w / Module['forcedAspectRatio']);
          }
        }
        if (((document['fullscreenElement'] || document['mozFullScreenElement'] ||
             document['msFullscreenElement'] || document['webkitFullscreenElement'] ||
             document['webkitCurrentFullScreenElement']) === canvas.parentNode) && (typeof screen != 'undefined')) {
           var factor = Math.min(screen.width / w, screen.height / h);
           w = Math.round(w * factor);
           h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
          if (canvas.width  != w) canvas.width  = w;
          if (canvas.height != h) canvas.height = h;
          if (typeof canvas.style != 'undefined') {
            canvas.style.removeProperty( "width");
            canvas.style.removeProperty("height");
          }
        } else {
          if (canvas.width  != wNative) canvas.width  = wNative;
          if (canvas.height != hNative) canvas.height = hNative;
          if (typeof canvas.style != 'undefined') {
            if (w != wNative || h != hNative) {
              canvas.style.setProperty( "width", w + "px", "important");
              canvas.style.setProperty("height", h + "px", "important");
            } else {
              canvas.style.removeProperty( "width");
              canvas.style.removeProperty("height");
            }
          }
        }
      },wgetRequests:{},nextWgetRequestHandle:0,getNextWgetRequestHandle:function () {
        var handle = Browser.nextWgetRequestHandle;
        Browser.nextWgetRequestHandle++;
        return handle;
      }};function _emscripten_cancel_main_loop() {
      Browser.mainLoop.pause();
      Browser.mainLoop.func = null;
    }

  
  
  
  
  
  function _emscripten_set_canvas_element_size_calling_thread(target, width, height) {
      var canvas = JSEvents.findCanvasEventTarget(target);
      if (!canvas) return -4;
  
      if (canvas.canvasSharedPtr) {
        // N.B. We hold the canvasSharedPtr info structure as the authoritative source for specifying the size of a canvas
        // since the actual canvas size changes are asynchronous if the canvas is owned by an OffscreenCanvas on another thread.
        // Therefore when setting the size, eagerly set the size of the canvas on the calling thread here, though this thread
        // might not be the one that actually ends up specifying the size, but the actual size change may be dispatched
        // as an asynchronous event below.
        HEAP32[((canvas.canvasSharedPtr)>>2)]=width;
        HEAP32[(((canvas.canvasSharedPtr)+(4))>>2)]=height;
      }
  
      if (canvas.offscreenCanvas || !canvas.controlTransferredOffscreen) {
        if (canvas.offscreenCanvas) canvas = canvas.offscreenCanvas;
        var autoResizeViewport = false;
        if (canvas.GLctxObject && canvas.GLctxObject.GLctx) {
          var prevViewport = canvas.GLctxObject.GLctx.getParameter(canvas.GLctxObject.GLctx.VIEWPORT);
          // TODO: Perhaps autoResizeViewport should only be true if FBO 0 is currently active?
          autoResizeViewport = (prevViewport[0] === 0 && prevViewport[1] === 0 && prevViewport[2] === canvas.width && prevViewport[3] === canvas.height);
        }
        canvas.width = width;
        canvas.height = height;
        if (autoResizeViewport) {
          // TODO: Add -s CANVAS_RESIZE_SETS_GL_VIEWPORT=0/1 option (default=1). This is commonly done and several graphics engines depend on this,
          // but this can be quite disruptive.
          canvas.GLctxObject.GLctx.viewport(0, 0, width, height);
        }
      } else {
        return -4;
      }
      return 0;
    }
  
  function _emscripten_set_canvas_element_size_main_thread(target, width, height) { return _emscripten_set_canvas_element_size_calling_thread(target, width, height); }function _emscripten_set_canvas_element_size(target, width, height) {
      var canvas = JSEvents.findCanvasEventTarget(target);
      if (canvas) return _emscripten_set_canvas_element_size_calling_thread(target, width, height);
      else return _emscripten_set_canvas_element_size_main_thread(target, width, height);
    }function emscripten_set_canvas_element_size_js(target, width, height) {
      if (typeof target === 'string') {
        // This function is being called from high-level JavaScript code instead of asm.js/Wasm,
        // and it needs to synchronously proxy over to another thread, so marshal the string onto the heap to do the call.
        var stackTop = stackSave();
        var targetInt = stackAlloc(target.length+1);
        stringToUTF8(target, targetInt, target.length+1);
        var ret = _emscripten_set_canvas_element_size(targetInt, width, height);
        stackRestore(stackTop);
        return ret;
      } else {
        return _emscripten_set_canvas_element_size(target, width, height);
      }
    }
  
  
  
  function _emscripten_get_canvas_element_size_calling_thread(target, width, height) {
      var canvas = JSEvents.findCanvasEventTarget(target);
      if (!canvas) return -4;
  
      if (canvas.canvasSharedPtr) {
        // N.B. Reading the size of the Canvas takes priority from our shared state structure, which is not the actual size.
        // However if is possible that there is a canvas size set event pending on an OffscreenCanvas owned by another thread,
        // so that the real sizes of the canvas have not updated yet. Therefore reading the real values would be racy.
        var w = HEAP32[((canvas.canvasSharedPtr)>>2)];
        var h = HEAP32[(((canvas.canvasSharedPtr)+(4))>>2)];
        HEAP32[((width)>>2)]=w;
        HEAP32[((height)>>2)]=h;
      } else if (canvas.offscreenCanvas) {
        HEAP32[((width)>>2)]=canvas.offscreenCanvas.width;
        HEAP32[((height)>>2)]=canvas.offscreenCanvas.height;
      } else if (!canvas.controlTransferredOffscreen) {
        HEAP32[((width)>>2)]=canvas.width;
        HEAP32[((height)>>2)]=canvas.height;
      } else {
        return -4;
      }
      return 0;
    }
  
  function _emscripten_get_canvas_element_size_main_thread(target, width, height) { return _emscripten_get_canvas_element_size_calling_thread(target, width, height); }function _emscripten_get_canvas_element_size(target, width, height) {
      var canvas = JSEvents.findCanvasEventTarget(target);
      if (canvas) return _emscripten_get_canvas_element_size_calling_thread(target, width, height);
      else return _emscripten_get_canvas_element_size_main_thread(target, width, height);
    }function emscripten_get_canvas_element_size_js(target) {
      var stackTop = stackSave();
      var w = stackAlloc(8);
      var h = w + 4;
  
      if (typeof target === 'string') {
        var targetInt = stackAlloc(target.length+1);
        stringToUTF8(target, targetInt, target.length+1);
        target = targetInt;
      }
      var ret = _emscripten_get_canvas_element_size(target, w, h);
      var size = [HEAP32[((w)>>2)], HEAP32[((h)>>2)]];
      stackRestore(stackTop);
      return size;
    }var JSEvents={keyEvent:0,mouseEvent:0,wheelEvent:0,uiEvent:0,focusEvent:0,deviceOrientationEvent:0,deviceMotionEvent:0,fullscreenChangeEvent:0,pointerlockChangeEvent:0,visibilityChangeEvent:0,touchEvent:0,lastGamepadState:null,lastGamepadStateFrame:null,numGamepadsConnected:0,previousFullscreenElement:null,previousScreenX:null,previousScreenY:null,removeEventListenersRegistered:false,_onGamepadConnected:function () { ++JSEvents.numGamepadsConnected; },_onGamepadDisconnected:function () { --JSEvents.numGamepadsConnected; },staticInit:function () {
        if (typeof window !== 'undefined') {
          window.addEventListener("gamepadconnected", JSEvents._onGamepadConnected);
          window.addEventListener("gamepaddisconnected", JSEvents._onGamepadDisconnected);
          
          // Chromium does not fire the gamepadconnected event on reload, so we need to get the number of gamepads here as a workaround.
          // See https://bugs.chromium.org/p/chromium/issues/detail?id=502824
          var firstState = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : null);
          if (firstState) {
            JSEvents.numGamepadsConnected = firstState.length;
          }
        }
      },removeAllEventListeners:function () {
        for(var i = JSEvents.eventHandlers.length-1; i >= 0; --i) {
          JSEvents._removeHandler(i);
        }
        JSEvents.eventHandlers = [];
        JSEvents.deferredCalls = [];
        window.removeEventListener("gamepadconnected", JSEvents._onGamepadConnected);
        window.removeEventListener("gamepaddisconnected", JSEvents._onGamepadDisconnected);
      },registerRemoveEventListeners:function () {
        if (!JSEvents.removeEventListenersRegistered) {
          __ATEXIT__.push(JSEvents.removeAllEventListeners);
          JSEvents.removeEventListenersRegistered = true;
        }
      },findEventTarget:function (target) {
        try {
          // The sensible "default" target varies between events, but use window as the default
          // since DOM events mostly can default to that. Specific callback registrations
          // override their own defaults.
          if (!target) return window;
          if (typeof target === "number") target = Pointer_stringify(target);
          if (target === '#window') return window;
          else if (target === '#document') return document;
          else if (target === '#screen') return window.screen;
          else if (target === '#canvas') return Module['canvas'];
          return (typeof target === 'string') ? document.getElementById(target) : target;
        } catch(e) {
          // In Web Workers, some objects above, such as '#document' do not exist. Gracefully
          // return null for them.
          return null;
        }
      },findCanvasEventTarget:function (target) {
        if (typeof target === 'number') target = Pointer_stringify(target);
        if (!target || target === '#canvas') {
          if (typeof GL !== 'undefined' && GL.offscreenCanvases['canvas']) return GL.offscreenCanvases['canvas']; // TODO: Remove this line, target '#canvas' should refer only to Module['canvas'], not to GL.offscreenCanvases['canvas'] - but need stricter tests to be able to remove this line.
          return Module['canvas'];
        }
        if (typeof GL !== 'undefined' && GL.offscreenCanvases[target]) return GL.offscreenCanvases[target];
        return JSEvents.findEventTarget(target);
      },deferredCalls:[],deferCall:function (targetFunction, precedence, argsList) {
        function arraysHaveEqualContent(arrA, arrB) {
          if (arrA.length != arrB.length) return false;
  
          for(var i in arrA) {
            if (arrA[i] != arrB[i]) return false;
          }
          return true;
        }
        // Test if the given call was already queued, and if so, don't add it again.
        for(var i in JSEvents.deferredCalls) {
          var call = JSEvents.deferredCalls[i];
          if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
            return;
          }
        }
        JSEvents.deferredCalls.push({
          targetFunction: targetFunction,
          precedence: precedence,
          argsList: argsList
        });
  
        JSEvents.deferredCalls.sort(function(x,y) { return x.precedence < y.precedence; });
      },removeDeferredCalls:function (targetFunction) {
        for(var i = 0; i < JSEvents.deferredCalls.length; ++i) {
          if (JSEvents.deferredCalls[i].targetFunction == targetFunction) {
            JSEvents.deferredCalls.splice(i, 1);
            --i;
          }
        }
      },canPerformEventHandlerRequests:function () {
        return JSEvents.inEventHandler && JSEvents.currentEventHandler.allowsDeferredCalls;
      },runDeferredCalls:function () {
        if (!JSEvents.canPerformEventHandlerRequests()) {
          return;
        }
        for(var i = 0; i < JSEvents.deferredCalls.length; ++i) {
          var call = JSEvents.deferredCalls[i];
          JSEvents.deferredCalls.splice(i, 1);
          --i;
          call.targetFunction.apply(this, call.argsList);
        }
      },inEventHandler:0,currentEventHandler:null,eventHandlers:[],isInternetExplorer:function () { return navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0; },removeAllHandlersOnTarget:function (target, eventTypeString) {
        for(var i = 0; i < JSEvents.eventHandlers.length; ++i) {
          if (JSEvents.eventHandlers[i].target == target && 
            (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)) {
             JSEvents._removeHandler(i--);
           }
        }
      },_removeHandler:function (i) {
        var h = JSEvents.eventHandlers[i];
        h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
        JSEvents.eventHandlers.splice(i, 1);
      },registerOrRemoveHandler:function (eventHandler) {
        var jsEventHandler = function jsEventHandler(event) {
          // Increment nesting count for the event handler.
          ++JSEvents.inEventHandler;
          JSEvents.currentEventHandler = eventHandler;
          // Process any old deferred calls the user has placed.
          JSEvents.runDeferredCalls();
          // Process the actual event, calls back to user C code handler.
          eventHandler.handlerFunc(event);
          // Process any new deferred calls that were placed right now from this event handler.
          JSEvents.runDeferredCalls();
          // Out of event handler - restore nesting count.
          --JSEvents.inEventHandler;
        }
        
        if (eventHandler.callbackfunc) {
          eventHandler.eventListenerFunc = jsEventHandler;
          eventHandler.target.addEventListener(eventHandler.eventTypeString, jsEventHandler, eventHandler.useCapture);
          JSEvents.eventHandlers.push(eventHandler);
          JSEvents.registerRemoveEventListeners();
        } else {
          for(var i = 0; i < JSEvents.eventHandlers.length; ++i) {
            if (JSEvents.eventHandlers[i].target == eventHandler.target
             && JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString) {
               JSEvents._removeHandler(i--);
             }
          }
        }
      },registerKeyEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.keyEvent) JSEvents.keyEvent = _malloc( 164 );
  
        var keyEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          var keyEventData = JSEvents.keyEvent;
          stringToUTF8(e.key ? e.key : "", keyEventData + 0, 32);
          stringToUTF8(e.code ? e.code : "", keyEventData + 32, 32);
          HEAP32[(((keyEventData)+(64))>>2)]=e.location;
          HEAP32[(((keyEventData)+(68))>>2)]=e.ctrlKey;
          HEAP32[(((keyEventData)+(72))>>2)]=e.shiftKey;
          HEAP32[(((keyEventData)+(76))>>2)]=e.altKey;
          HEAP32[(((keyEventData)+(80))>>2)]=e.metaKey;
          HEAP32[(((keyEventData)+(84))>>2)]=e.repeat;
          stringToUTF8(e.locale ? e.locale : "", keyEventData + 88, 32);
          stringToUTF8(e.char ? e.char : "", keyEventData + 120, 32);
          HEAP32[(((keyEventData)+(152))>>2)]=e.charCode;
          HEAP32[(((keyEventData)+(156))>>2)]=e.keyCode;
          HEAP32[(((keyEventData)+(160))>>2)]=e.which;
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, keyEventData, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: JSEvents.findEventTarget(target),
          allowsDeferredCalls: JSEvents.isInternetExplorer() ? false : true, // MSIE doesn't allow fullscreen and pointerlock requests from key handlers, others do.
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: keyEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },getBoundingClientRectOrZeros:function (target) {
        return target.getBoundingClientRect ? target.getBoundingClientRect() : { left: 0, top: 0 };
      },fillMouseEventData:function (eventStruct, e, target) {
        HEAPF64[((eventStruct)>>3)]=JSEvents.tick();
        HEAP32[(((eventStruct)+(8))>>2)]=e.screenX;
        HEAP32[(((eventStruct)+(12))>>2)]=e.screenY;
        HEAP32[(((eventStruct)+(16))>>2)]=e.clientX;
        HEAP32[(((eventStruct)+(20))>>2)]=e.clientY;
        HEAP32[(((eventStruct)+(24))>>2)]=e.ctrlKey;
        HEAP32[(((eventStruct)+(28))>>2)]=e.shiftKey;
        HEAP32[(((eventStruct)+(32))>>2)]=e.altKey;
        HEAP32[(((eventStruct)+(36))>>2)]=e.metaKey;
        HEAP16[(((eventStruct)+(40))>>1)]=e.button;
        HEAP16[(((eventStruct)+(42))>>1)]=e.buttons;
        HEAP32[(((eventStruct)+(44))>>2)]=e["movementX"] || e["mozMovementX"] || e["webkitMovementX"] || (e.screenX-JSEvents.previousScreenX);
        HEAP32[(((eventStruct)+(48))>>2)]=e["movementY"] || e["mozMovementY"] || e["webkitMovementY"] || (e.screenY-JSEvents.previousScreenY);
  
        if (Module['canvas']) {
          var rect = Module['canvas'].getBoundingClientRect();
          HEAP32[(((eventStruct)+(60))>>2)]=e.clientX - rect.left;
          HEAP32[(((eventStruct)+(64))>>2)]=e.clientY - rect.top;
        } else { // Canvas is not initialized, return 0.
          HEAP32[(((eventStruct)+(60))>>2)]=0;
          HEAP32[(((eventStruct)+(64))>>2)]=0;
        }
        if (target) {
          var rect = JSEvents.getBoundingClientRectOrZeros(target);
          HEAP32[(((eventStruct)+(52))>>2)]=e.clientX - rect.left;
          HEAP32[(((eventStruct)+(56))>>2)]=e.clientY - rect.top;
        } else { // No specific target passed, return 0.
          HEAP32[(((eventStruct)+(52))>>2)]=0;
          HEAP32[(((eventStruct)+(56))>>2)]=0;
        }
        // wheel and mousewheel events contain wrong screenX/screenY on chrome/opera
        // https://github.com/kripken/emscripten/pull/4997
        // https://bugs.chromium.org/p/chromium/issues/detail?id=699956
        if (e.type !== 'wheel' && e.type !== 'mousewheel') {
          JSEvents.previousScreenX = e.screenX;
          JSEvents.previousScreenY = e.screenY;
        }
      },registerMouseEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.mouseEvent) JSEvents.mouseEvent = _malloc( 72 );
        target = JSEvents.findEventTarget(target);
  
        var mouseEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          // TODO: Make this access thread safe, or this could update live while app is reading it.
          JSEvents.fillMouseEventData(JSEvents.mouseEvent, e, target);
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, JSEvents.mouseEvent, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: target,
          allowsDeferredCalls: eventTypeString != 'mousemove' && eventTypeString != 'mouseenter' && eventTypeString != 'mouseleave', // Mouse move events do not allow fullscreen/pointer lock requests to be handled in them!
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: mouseEventHandlerFunc,
          useCapture: useCapture
        };
        // In IE, mousedown events don't either allow deferred calls to be run!
        if (JSEvents.isInternetExplorer() && eventTypeString == 'mousedown') eventHandler.allowsDeferredCalls = false;
        JSEvents.registerOrRemoveHandler(eventHandler);
      },registerWheelEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.wheelEvent) JSEvents.wheelEvent = _malloc( 104 );
        target = JSEvents.findEventTarget(target);
  
  
        // The DOM Level 3 events spec event 'wheel'
        var wheelHandlerFunc = function(event) {
          var e = event || window.event;
          var wheelEvent = JSEvents.wheelEvent;
          JSEvents.fillMouseEventData(wheelEvent, e, target);
          HEAPF64[(((wheelEvent)+(72))>>3)]=e["deltaX"];
          HEAPF64[(((wheelEvent)+(80))>>3)]=e["deltaY"];
          HEAPF64[(((wheelEvent)+(88))>>3)]=e["deltaZ"];
          HEAP32[(((wheelEvent)+(96))>>2)]=e["deltaMode"];
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, wheelEvent, userData)) e.preventDefault();
        };
        // The 'mousewheel' event as implemented in Safari 6.0.5
        var mouseWheelHandlerFunc = function(event) {
          var e = event || window.event;
          JSEvents.fillMouseEventData(JSEvents.wheelEvent, e, target);
          HEAPF64[(((JSEvents.wheelEvent)+(72))>>3)]=e["wheelDeltaX"] || 0;
          HEAPF64[(((JSEvents.wheelEvent)+(80))>>3)]=-(e["wheelDeltaY"] ? e["wheelDeltaY"] : e["wheelDelta"]) /* 1. Invert to unify direction with the DOM Level 3 wheel event. 2. MSIE does not provide wheelDeltaY, so wheelDelta is used as a fallback. */;
          HEAPF64[(((JSEvents.wheelEvent)+(88))>>3)]=0 /* Not available */;
          HEAP32[(((JSEvents.wheelEvent)+(96))>>2)]=0 /* DOM_DELTA_PIXEL */;
          var shouldCancel = Module['dynCall_iiii'](callbackfunc, eventTypeId, JSEvents.wheelEvent, userData);
          if (shouldCancel) {
            e.preventDefault();
          }
        };
  
        var eventHandler = {
          target: target,
          allowsDeferredCalls: true,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: (eventTypeString == 'wheel') ? wheelHandlerFunc : mouseWheelHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },pageScrollPos:function () {
        if (window.pageXOffset > 0 || window.pageYOffset > 0) {
          return [window.pageXOffset, window.pageYOffset];
        }
        if (typeof document.documentElement.scrollLeft !== 'undefined' || typeof document.documentElement.scrollTop !== 'undefined') {
          return [document.documentElement.scrollLeft, document.documentElement.scrollTop];
        }
        return [document.body.scrollLeft|0, document.body.scrollTop|0];
      },registerUiEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.uiEvent) JSEvents.uiEvent = _malloc( 36 );
  
        if (eventTypeString == "scroll" && !target) {
          target = document; // By default read scroll events on document rather than window.
        } else {
          target = JSEvents.findEventTarget(target);
        }
  
        var uiEventHandlerFunc = function(event) {
          var e = event || window.event;
          if (e.target != target) {
            // Never take ui events such as scroll via a 'bubbled' route, but always from the direct element that
            // was targeted. Otherwise e.g. if app logs a message in response to a page scroll, the Emscripten log
            // message box could cause to scroll, generating a new (bubbled) scroll message, causing a new log print,
            // causing a new scroll, etc..
            return;
          }
          var scrollPos = JSEvents.pageScrollPos();
  
          var uiEvent = JSEvents.uiEvent;
          HEAP32[((uiEvent)>>2)]=e.detail;
          HEAP32[(((uiEvent)+(4))>>2)]=document.body.clientWidth;
          HEAP32[(((uiEvent)+(8))>>2)]=document.body.clientHeight;
          HEAP32[(((uiEvent)+(12))>>2)]=window.innerWidth;
          HEAP32[(((uiEvent)+(16))>>2)]=window.innerHeight;
          HEAP32[(((uiEvent)+(20))>>2)]=window.outerWidth;
          HEAP32[(((uiEvent)+(24))>>2)]=window.outerHeight;
          HEAP32[(((uiEvent)+(28))>>2)]=scrollPos[0];
          HEAP32[(((uiEvent)+(32))>>2)]=scrollPos[1];
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, uiEvent, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: target,
          allowsDeferredCalls: false, // Neither scroll or resize events allow running requests inside them.
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: uiEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },getNodeNameForTarget:function (target) {
        if (!target) return '';
        if (target == window) return '#window';
        if (target == window.screen) return '#screen';
        return (target && target.nodeName) ? target.nodeName : '';
      },registerFocusEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.focusEvent) JSEvents.focusEvent = _malloc( 256 );
  
        var focusEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          var nodeName = JSEvents.getNodeNameForTarget(e.target);
          var id = e.target.id ? e.target.id : '';
  
          var focusEvent = JSEvents.focusEvent;
          stringToUTF8(nodeName, focusEvent + 0, 128);
          stringToUTF8(id, focusEvent + 128, 128);
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, focusEvent, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: JSEvents.findEventTarget(target),
          allowsDeferredCalls: false,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: focusEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },tick:function () {
        if (window['performance'] && window['performance']['now']) return window['performance']['now']();
        else return Date.now();
      },fillDeviceOrientationEventData:function (eventStruct, e, target) {
        HEAPF64[((eventStruct)>>3)]=JSEvents.tick();
        HEAPF64[(((eventStruct)+(8))>>3)]=e.alpha;
        HEAPF64[(((eventStruct)+(16))>>3)]=e.beta;
        HEAPF64[(((eventStruct)+(24))>>3)]=e.gamma;
        HEAP32[(((eventStruct)+(32))>>2)]=e.absolute;
      },registerDeviceOrientationEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.deviceOrientationEvent) JSEvents.deviceOrientationEvent = _malloc( 40 );
  
        var deviceOrientationEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          JSEvents.fillDeviceOrientationEventData(JSEvents.deviceOrientationEvent, e, target); // TODO: Thread-safety with respect to emscripten_get_deviceorientation_status()
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, JSEvents.deviceOrientationEvent, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: JSEvents.findEventTarget(target),
          allowsDeferredCalls: false,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: deviceOrientationEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },fillDeviceMotionEventData:function (eventStruct, e, target) {
        HEAPF64[((eventStruct)>>3)]=JSEvents.tick();
        HEAPF64[(((eventStruct)+(8))>>3)]=e.acceleration.x;
        HEAPF64[(((eventStruct)+(16))>>3)]=e.acceleration.y;
        HEAPF64[(((eventStruct)+(24))>>3)]=e.acceleration.z;
        HEAPF64[(((eventStruct)+(32))>>3)]=e.accelerationIncludingGravity.x;
        HEAPF64[(((eventStruct)+(40))>>3)]=e.accelerationIncludingGravity.y;
        HEAPF64[(((eventStruct)+(48))>>3)]=e.accelerationIncludingGravity.z;
        HEAPF64[(((eventStruct)+(56))>>3)]=e.rotationRate.alpha;
        HEAPF64[(((eventStruct)+(64))>>3)]=e.rotationRate.beta;
        HEAPF64[(((eventStruct)+(72))>>3)]=e.rotationRate.gamma;
      },registerDeviceMotionEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.deviceMotionEvent) JSEvents.deviceMotionEvent = _malloc( 80 );
  
        var deviceMotionEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          JSEvents.fillDeviceMotionEventData(JSEvents.deviceMotionEvent, e, target); // TODO: Thread-safety with respect to emscripten_get_devicemotion_status()
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, JSEvents.deviceMotionEvent, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: JSEvents.findEventTarget(target),
          allowsDeferredCalls: false,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: deviceMotionEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },screenOrientation:function () {
        if (!window.screen) return undefined;
        return window.screen.orientation || window.screen.mozOrientation || window.screen.webkitOrientation || window.screen.msOrientation;
      },fillOrientationChangeEventData:function (eventStruct, e) {
        var orientations  = ["portrait-primary", "portrait-secondary", "landscape-primary", "landscape-secondary"];
        var orientations2 = ["portrait",         "portrait",           "landscape",         "landscape"];
  
        var orientationString = JSEvents.screenOrientation();
        var orientation = orientations.indexOf(orientationString);
        if (orientation == -1) {
          orientation = orientations2.indexOf(orientationString);
        }
  
        HEAP32[((eventStruct)>>2)]=1 << orientation;
        HEAP32[(((eventStruct)+(4))>>2)]=window.orientation;
      },registerOrientationChangeEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.orientationChangeEvent) JSEvents.orientationChangeEvent = _malloc( 8 );
  
        if (!target) {
          target = window.screen; // Orientation events need to be captured from 'window.screen' instead of 'window'
        } else {
          target = JSEvents.findEventTarget(target);
        }
  
        var orientationChangeEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          var orientationChangeEvent = JSEvents.orientationChangeEvent;
  
          JSEvents.fillOrientationChangeEventData(orientationChangeEvent, e);
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, orientationChangeEvent, userData)) e.preventDefault();
        };
  
        if (eventTypeString == "orientationchange" && window.screen.mozOrientation !== undefined) {
          eventTypeString = "mozorientationchange";
        }
  
        var eventHandler = {
          target: target,
          allowsDeferredCalls: false,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: orientationChangeEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },fullscreenEnabled:function () {
        return document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled || document.msFullscreenEnabled;
      },fillFullscreenChangeEventData:function (eventStruct, e) {
        var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
        var isFullscreen = !!fullscreenElement;
        HEAP32[((eventStruct)>>2)]=isFullscreen;
        HEAP32[(((eventStruct)+(4))>>2)]=JSEvents.fullscreenEnabled();
        // If transitioning to fullscreen, report info about the element that is now fullscreen.
        // If transitioning to windowed mode, report info about the element that just was fullscreen.
        var reportedElement = isFullscreen ? fullscreenElement : JSEvents.previousFullscreenElement;
        var nodeName = JSEvents.getNodeNameForTarget(reportedElement);
        var id = (reportedElement && reportedElement.id) ? reportedElement.id : '';
        stringToUTF8(nodeName, eventStruct + 8, 128);
        stringToUTF8(id, eventStruct + 136, 128);
        HEAP32[(((eventStruct)+(264))>>2)]=reportedElement ? reportedElement.clientWidth : 0;
        HEAP32[(((eventStruct)+(268))>>2)]=reportedElement ? reportedElement.clientHeight : 0;
        HEAP32[(((eventStruct)+(272))>>2)]=screen.width;
        HEAP32[(((eventStruct)+(276))>>2)]=screen.height;
        if (isFullscreen) {
          JSEvents.previousFullscreenElement = fullscreenElement;
        }
      },registerFullscreenChangeEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.fullscreenChangeEvent) JSEvents.fullscreenChangeEvent = _malloc( 280 );
  
        if (!target) target = document; // Fullscreen change events need to be captured from 'document' by default instead of 'window'
        else target = JSEvents.findEventTarget(target);
  
        var fullscreenChangeEventhandlerFunc = function(event) {
          var e = event || window.event;
  
          var fullscreenChangeEvent = JSEvents.fullscreenChangeEvent;
  
          JSEvents.fillFullscreenChangeEventData(fullscreenChangeEvent, e);
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, fullscreenChangeEvent, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: target,
          allowsDeferredCalls: false,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: fullscreenChangeEventhandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },resizeCanvasForFullscreen:function (target, strategy) {
        var restoreOldStyle = __registerRestoreOldStyle(target);
        var cssWidth = strategy.softFullscreen ? window.innerWidth : screen.width;
        var cssHeight = strategy.softFullscreen ? window.innerHeight : screen.height;
        var rect = target.getBoundingClientRect();
        var windowedCssWidth = rect.right - rect.left;
        var windowedCssHeight = rect.bottom - rect.top;
        var canvasSize = emscripten_get_canvas_element_size_js(target.id);
        var windowedRttWidth = canvasSize[0];
        var windowedRttHeight = canvasSize[1];
  
        if (strategy.scaleMode == 3) {
          __setLetterbox(target, (cssHeight - windowedCssHeight) / 2, (cssWidth - windowedCssWidth) / 2);
          cssWidth = windowedCssWidth;
          cssHeight = windowedCssHeight;
        } else if (strategy.scaleMode == 2) {
          if (cssWidth*windowedRttHeight < windowedRttWidth*cssHeight) {
            var desiredCssHeight = windowedRttHeight * cssWidth / windowedRttWidth;
            __setLetterbox(target, (cssHeight - desiredCssHeight) / 2, 0);
            cssHeight = desiredCssHeight;
          } else {
            var desiredCssWidth = windowedRttWidth * cssHeight / windowedRttHeight;
            __setLetterbox(target, 0, (cssWidth - desiredCssWidth) / 2);
            cssWidth = desiredCssWidth;
          }
        }
  
        // If we are adding padding, must choose a background color or otherwise Chrome will give the
        // padding a default white color. Do it only if user has not customized their own background color.
        if (!target.style.backgroundColor) target.style.backgroundColor = 'black';
        // IE11 does the same, but requires the color to be set in the document body.
        if (!document.body.style.backgroundColor) document.body.style.backgroundColor = 'black'; // IE11
        // Firefox always shows black letterboxes independent of style color.
  
        target.style.width = cssWidth + 'px';
        target.style.height = cssHeight + 'px';
  
        if (strategy.filteringMode == 1) {
          target.style.imageRendering = 'optimizeSpeed';
          target.style.imageRendering = '-moz-crisp-edges';
          target.style.imageRendering = '-o-crisp-edges';
          target.style.imageRendering = '-webkit-optimize-contrast';
          target.style.imageRendering = 'optimize-contrast';
          target.style.imageRendering = 'crisp-edges';
          target.style.imageRendering = 'pixelated';
        }
  
        var dpiScale = (strategy.canvasResolutionScaleMode == 2) ? window.devicePixelRatio : 1;
        if (strategy.canvasResolutionScaleMode != 0) {
          var newWidth = (cssWidth * dpiScale)|0;
          var newHeight = (cssHeight * dpiScale)|0;
  
          if (!target.controlTransferredOffscreen) {
            target.width = newWidth;
            target.height = newHeight;
          } else {
            emscripten_set_canvas_element_size_js(target.id, newWidth, newHeight);
          }
          if (target.GLctxObject) target.GLctxObject.GLctx.viewport(0, 0, newWidth, newHeight);
        }
        return restoreOldStyle;
      },requestFullscreen:function (target, strategy) {
        // EMSCRIPTEN_FULLSCREEN_SCALE_DEFAULT + EMSCRIPTEN_FULLSCREEN_CANVAS_SCALE_NONE is a mode where no extra logic is performed to the DOM elements.
        if (strategy.scaleMode != 0 || strategy.canvasResolutionScaleMode != 0) {
          JSEvents.resizeCanvasForFullscreen(target, strategy);
        }
  
        if (target.requestFullscreen) {
          target.requestFullscreen();
        } else if (target.msRequestFullscreen) {
          target.msRequestFullscreen();
        } else if (target.mozRequestFullScreen) {
          target.mozRequestFullScreen();
        } else if (target.mozRequestFullscreen) {
          target.mozRequestFullscreen();
        } else if (target.webkitRequestFullscreen) {
          target.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        } else {
          if (typeof JSEvents.fullscreenEnabled() === 'undefined') {
            return -1;
          } else {
            return -3;
          }
        }
  
        if (strategy.canvasResizedCallback) {
          Module['dynCall_iiii'](strategy.canvasResizedCallback, 37, 0, strategy.canvasResizedCallbackUserData);
        }
  
        return 0;
      },fillPointerlockChangeEventData:function (eventStruct, e) {
        var pointerLockElement = document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement || document.msPointerLockElement;
        var isPointerlocked = !!pointerLockElement;
        HEAP32[((eventStruct)>>2)]=isPointerlocked;
        var nodeName = JSEvents.getNodeNameForTarget(pointerLockElement);
        var id = (pointerLockElement && pointerLockElement.id) ? pointerLockElement.id : '';
        stringToUTF8(nodeName, eventStruct + 4, 128);
        stringToUTF8(id, eventStruct + 132, 128);
      },registerPointerlockChangeEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.pointerlockChangeEvent) JSEvents.pointerlockChangeEvent = _malloc( 260 );
  
        if (!target) target = document; // Pointer lock change events need to be captured from 'document' by default instead of 'window'
        else target = JSEvents.findEventTarget(target);
  
        var pointerlockChangeEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          var pointerlockChangeEvent = JSEvents.pointerlockChangeEvent;
          JSEvents.fillPointerlockChangeEventData(pointerlockChangeEvent, e);
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, pointerlockChangeEvent, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: target,
          allowsDeferredCalls: false,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: pointerlockChangeEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },registerPointerlockErrorEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString) {
        if (!target) target = document; // Pointer lock events need to be captured from 'document' by default instead of 'window'
        else target = JSEvents.findEventTarget(target);
  
        var pointerlockErrorEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, 0, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: target,
          allowsDeferredCalls: false,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: pointerlockErrorEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },requestPointerLock:function (target) {
        if (target.requestPointerLock) {
          target.requestPointerLock();
        } else if (target.mozRequestPointerLock) {
          target.mozRequestPointerLock();
        } else if (target.webkitRequestPointerLock) {
          target.webkitRequestPointerLock();
        } else if (target.msRequestPointerLock) {
          target.msRequestPointerLock();
        } else {
          // document.body is known to accept pointer lock, so use that to differentiate if the user passed a bad element,
          // or if the whole browser just doesn't support the feature.
          if (document.body.requestPointerLock || document.body.mozRequestPointerLock || document.body.webkitRequestPointerLock || document.body.msRequestPointerLock) {
            return -3;
          } else {
            return -1;
          }
        }
        return 0;
      },fillVisibilityChangeEventData:function (eventStruct, e) {
        var visibilityStates = [ "hidden", "visible", "prerender", "unloaded" ];
        var visibilityState = visibilityStates.indexOf(document.visibilityState);
  
        HEAP32[((eventStruct)>>2)]=document.hidden;
        HEAP32[(((eventStruct)+(4))>>2)]=visibilityState;
      },registerVisibilityChangeEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.visibilityChangeEvent) JSEvents.visibilityChangeEvent = _malloc( 8 );
  
        if (!target) target = document; // Visibility change events need to be captured from 'document' by default instead of 'window'
        else target = JSEvents.findEventTarget(target);
  
        var visibilityChangeEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          var visibilityChangeEvent = JSEvents.visibilityChangeEvent;
  
          JSEvents.fillVisibilityChangeEventData(visibilityChangeEvent, e);
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, visibilityChangeEvent, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: target,
          allowsDeferredCalls: false,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: visibilityChangeEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },registerTouchEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.touchEvent) JSEvents.touchEvent = _malloc( 1684 );
  
        target = JSEvents.findEventTarget(target);
  
        var touchEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          var touches = {};
          for(var i = 0; i < e.touches.length; ++i) {
            var touch = e.touches[i];
            touches[touch.identifier] = touch;
          }
          for(var i = 0; i < e.changedTouches.length; ++i) {
            var touch = e.changedTouches[i];
            touches[touch.identifier] = touch;
            touch.changed = true;
          }
          for(var i = 0; i < e.targetTouches.length; ++i) {
            var touch = e.targetTouches[i];
            touches[touch.identifier].onTarget = true;
          }
  
          var touchEvent = JSEvents.touchEvent;
          var ptr = touchEvent;
          HEAP32[(((ptr)+(4))>>2)]=e.ctrlKey;
          HEAP32[(((ptr)+(8))>>2)]=e.shiftKey;
          HEAP32[(((ptr)+(12))>>2)]=e.altKey;
          HEAP32[(((ptr)+(16))>>2)]=e.metaKey;
          ptr += 20; // Advance to the start of the touch array.
          var canvasRect = Module['canvas'] ? Module['canvas'].getBoundingClientRect() : undefined;
          var targetRect = JSEvents.getBoundingClientRectOrZeros(target);
          var numTouches = 0;
          for(var i in touches) {
            var t = touches[i];
            HEAP32[((ptr)>>2)]=t.identifier;
            HEAP32[(((ptr)+(4))>>2)]=t.screenX;
            HEAP32[(((ptr)+(8))>>2)]=t.screenY;
            HEAP32[(((ptr)+(12))>>2)]=t.clientX;
            HEAP32[(((ptr)+(16))>>2)]=t.clientY;
            HEAP32[(((ptr)+(20))>>2)]=t.pageX;
            HEAP32[(((ptr)+(24))>>2)]=t.pageY;
            HEAP32[(((ptr)+(28))>>2)]=t.changed;
            HEAP32[(((ptr)+(32))>>2)]=t.onTarget;
            if (canvasRect) {
              HEAP32[(((ptr)+(44))>>2)]=t.clientX - canvasRect.left;
              HEAP32[(((ptr)+(48))>>2)]=t.clientY - canvasRect.top;
            } else {
              HEAP32[(((ptr)+(44))>>2)]=0;
              HEAP32[(((ptr)+(48))>>2)]=0;            
            }
            HEAP32[(((ptr)+(36))>>2)]=t.clientX - targetRect.left;
            HEAP32[(((ptr)+(40))>>2)]=t.clientY - targetRect.top;
            
            ptr += 52;
  
            if (++numTouches >= 32) {
              break;
            }
          }
          HEAP32[((touchEvent)>>2)]=numTouches;
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, touchEvent, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: target,
          allowsDeferredCalls: eventTypeString == 'touchstart' || eventTypeString == 'touchend',
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: touchEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },fillGamepadEventData:function (eventStruct, e) {
        HEAPF64[((eventStruct)>>3)]=e.timestamp;
        for(var i = 0; i < e.axes.length; ++i) {
          HEAPF64[(((eventStruct+i*8)+(16))>>3)]=e.axes[i];
        }
        for(var i = 0; i < e.buttons.length; ++i) {
          if (typeof(e.buttons[i]) === 'object') {
            HEAPF64[(((eventStruct+i*8)+(528))>>3)]=e.buttons[i].value;
          } else {
            HEAPF64[(((eventStruct+i*8)+(528))>>3)]=e.buttons[i];
          }
        }
        for(var i = 0; i < e.buttons.length; ++i) {
          if (typeof(e.buttons[i]) === 'object') {
            HEAP32[(((eventStruct+i*4)+(1040))>>2)]=e.buttons[i].pressed;
          } else {
            HEAP32[(((eventStruct+i*4)+(1040))>>2)]=e.buttons[i] == 1.0;
          }
        }
        HEAP32[(((eventStruct)+(1296))>>2)]=e.connected;
        HEAP32[(((eventStruct)+(1300))>>2)]=e.index;
        HEAP32[(((eventStruct)+(8))>>2)]=e.axes.length;
        HEAP32[(((eventStruct)+(12))>>2)]=e.buttons.length;
        stringToUTF8(e.id, eventStruct + 1304, 64);
        stringToUTF8(e.mapping, eventStruct + 1368, 64);
      },registerGamepadEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.gamepadEvent) JSEvents.gamepadEvent = _malloc( 1432 );
  
        var gamepadEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          var gamepadEvent = JSEvents.gamepadEvent;
          JSEvents.fillGamepadEventData(gamepadEvent, e.gamepad);
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, gamepadEvent, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: JSEvents.findEventTarget(target),
          allowsDeferredCalls: true,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: gamepadEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },registerBeforeUnloadEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString) {
        var beforeUnloadEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          // Note: This is always called on the main browser thread, since it needs synchronously return a value!
          var confirmationMessage = Module['dynCall_iiii'](callbackfunc, eventTypeId, 0, userData);
          
          if (confirmationMessage) {
            confirmationMessage = Pointer_stringify(confirmationMessage);
          }
          if (confirmationMessage) {
            e.preventDefault();
            e.returnValue = confirmationMessage;
            return confirmationMessage;
          }
        };
  
        var eventHandler = {
          target: JSEvents.findEventTarget(target),
          allowsDeferredCalls: false,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: beforeUnloadEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },battery:function () { return navigator.battery || navigator.mozBattery || navigator.webkitBattery; },fillBatteryEventData:function (eventStruct, e) {
        HEAPF64[((eventStruct)>>3)]=e.chargingTime;
        HEAPF64[(((eventStruct)+(8))>>3)]=e.dischargingTime;
        HEAPF64[(((eventStruct)+(16))>>3)]=e.level;
        HEAP32[(((eventStruct)+(24))>>2)]=e.charging;
      },registerBatteryEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!JSEvents.batteryEvent) JSEvents.batteryEvent = _malloc( 32 );
  
        var batteryEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          var batteryEvent = JSEvents.batteryEvent;
          JSEvents.fillBatteryEventData(batteryEvent, JSEvents.battery());
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, batteryEvent, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: JSEvents.findEventTarget(target),
          allowsDeferredCalls: false,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: batteryEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      },registerWebGlEventCallback:function (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
        if (!target) target = Module['canvas'];
  
        var webGlEventHandlerFunc = function(event) {
          var e = event || window.event;
  
          if (Module['dynCall_iiii'](callbackfunc, eventTypeId, 0, userData)) e.preventDefault();
        };
  
        var eventHandler = {
          target: JSEvents.findEventTarget(target),
          allowsDeferredCalls: false,
          eventTypeString: eventTypeString,
          callbackfunc: callbackfunc,
          handlerFunc: webGlEventHandlerFunc,
          useCapture: useCapture
        };
        JSEvents.registerOrRemoveHandler(eventHandler);
      }};var __currentFullscreenStrategy={};function _emscripten_exit_fullscreen() {
      if (typeof JSEvents.fullscreenEnabled() === 'undefined') return -1;
      // Make sure no queued up calls will fire after this.
      JSEvents.removeDeferredCalls(JSEvents.requestFullscreen);
  
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else {
        return -1;
      }
  
      if (__currentFullscreenStrategy.canvasResizedCallback) {
        Module['dynCall_iiii'](__currentFullscreenStrategy.canvasResizedCallback, 37, 0, __currentFullscreenStrategy.canvasResizedCallbackUserData);
      }
  
      return 0;
    }

  function _emscripten_exit_pointerlock() {
      // Make sure no queued up calls will fire after this.
      JSEvents.removeDeferredCalls(JSEvents.requestPointerLock);
  
      if (document.exitPointerLock) {
        document.exitPointerLock();
      } else if (document.msExitPointerLock) {
        document.msExitPointerLock();
      } else if (document.mozExitPointerLock) {
        document.mozExitPointerLock();
      } else if (document.webkitExitPointerLock) {
        document.webkitExitPointerLock();
      } else {
        return -1;
      }
      return 0;
    }

  function _emscripten_get_fullscreen_status(fullscreenStatus) {
      if (typeof JSEvents.fullscreenEnabled() === 'undefined') return -1;
      JSEvents.fillFullscreenChangeEventData(fullscreenStatus);
      return 0;
    }

  
  function __emscripten_sample_gamepad_data() {
      // Polling gamepads generates garbage, so don't do it when we know there are no gamepads connected.
      if (!JSEvents.numGamepadsConnected) return;
  
      // Produce a new Gamepad API sample if we are ticking a new game frame, or if not using emscripten_set_main_loop() at all to drive animation.
      if (Browser.mainLoop.currentFrameNumber !== JSEvents.lastGamepadStateFrame || !Browser.mainLoop.currentFrameNumber) {
        JSEvents.lastGamepadState = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : null);
        JSEvents.lastGamepadStateFrame = Browser.mainLoop.currentFrameNumber;
      }
    }function _emscripten_get_gamepad_status(index, gamepadState) {
      __emscripten_sample_gamepad_data();
      if (!JSEvents.lastGamepadState) return -1;
  
      // INVALID_PARAM is returned on a Gamepad index that never was there.
      if (index < 0 || index >= JSEvents.lastGamepadState.length) return -5;
  
      // NO_DATA is returned on a Gamepad index that was removed.
      // For previously disconnected gamepads there should be an empty slot (null/undefined/false) at the index.
      // This is because gamepads must keep their original position in the array.
      // For example, removing the first of two gamepads produces [null/undefined/false, gamepad].
      if (!JSEvents.lastGamepadState[index]) return -7;
  
      JSEvents.fillGamepadEventData(gamepadState, JSEvents.lastGamepadState[index]);
      return 0;
    }

  function _emscripten_get_main_loop_timing(mode, value) {
      if (mode) HEAP32[((mode)>>2)]=Browser.mainLoop.timingMode;
      if (value) HEAP32[((value)>>2)]=Browser.mainLoop.timingValue;
    }


  function _emscripten_get_num_gamepads() {
      // Polling gamepads generates garbage, so don't do it when we know there are no gamepads connected.
      if (!JSEvents.numGamepadsConnected) return 0;
  
      __emscripten_sample_gamepad_data();
      if (!JSEvents.lastGamepadState) return -1;
      return JSEvents.lastGamepadState.length;
    }

  function _emscripten_has_threading_support() {
      return 0;
    }

  function _emscripten_html5_remove_all_event_listeners() {
      JSEvents.removeAllEventListeners();
    }

  function _emscripten_is_webgl_context_lost(target) {
      // TODO: In the future if multiple GL contexts are supported, use the 'target' parameter to find the canvas to query.
      if (!Module.ctx) return true; // No context ~> lost context.
      return Module.ctx.isContextLost();
    }

  
  
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      assert((varargs & 3) === 0);
      var textIndex = format;
      var argIndex = varargs;
      // This must be called before reading a double or i64 vararg. It will bump the pointer properly.
      // It also does an assert on i32 values, so it's nice to call it before all varargs calls.
      function prepVararg(ptr, type) {
        if (type === 'double' || type === 'i64') {
          // move so the load is aligned
          if (ptr & 7) {
            assert((ptr & 7) === 4);
            ptr += 4;
          }
        } else {
          assert((ptr & 3) === 0);
        }
        return ptr;
      }
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        argIndex = prepVararg(argIndex, type);
        if (type === 'double') {
          ret = HEAPF64[((argIndex)>>3)];
          argIndex += 8;
        } else if (type == 'i64') {
          ret = [HEAP32[((argIndex)>>2)],
                 HEAP32[(((argIndex)+(4))>>2)]];
          argIndex += 8;
        } else {
          assert((argIndex & 3) === 0);
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[((argIndex)>>2)];
          argIndex += 4;
        }
        return ret;
      }
  
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[((textIndex)>>0)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)>>0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)>>0)];
          }
  
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)>>0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)>>0)];
            }
          }
  
          // Handle precision.
          var precisionSet = false, precision = -1;
          if (next == 46) {
            precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)>>0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)>>0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)>>0)];
          }
          if (precision < 0) {
            precision = 6; // Standard default.
            precisionSet = false;
          }
  
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)>>0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)>>0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)>>0)];
  
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && typeof i64Math === 'object') argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && typeof i64Math === 'object') argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && typeof i64Math === 'object') {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
  
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
  
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
  
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
  
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
  
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
  
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
  
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
  
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
  
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
  
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
  
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
  
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)>>0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length;
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[((i)>>0)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }
  
  
  
  function __emscripten_traverse_stack(args) {
      if (!args || !args.callee || !args.callee.name) {
        return [null, '', ''];
      }
  
      var funstr = args.callee.toString();
      var funcname = args.callee.name;
      var str = '(';
      var first = true;
      for (var i in args) {
        var a = args[i];
        if (!first) {
          str += ", ";
        }
        first = false;
        if (typeof a === 'number' || typeof a === 'string') {
          str += a;
        } else {
          str += '(' + typeof a + ')';
        }
      }
      str += ')';
      var caller = args.callee.caller;
      args = caller ? caller.arguments : [];
      if (first)
        str = '';
      return [args, funcname, str];
    }function _emscripten_get_callstack_js(flags) {
      var callstack = jsStackTrace();
  
      // Find the symbols in the callstack that corresponds to the functions that report callstack information, and remove everyhing up to these from the output.
      var iThisFunc = callstack.lastIndexOf('_emscripten_log');
      var iThisFunc2 = callstack.lastIndexOf('_emscripten_get_callstack');
      var iNextLine = callstack.indexOf('\n', Math.max(iThisFunc, iThisFunc2))+1;
      callstack = callstack.slice(iNextLine);
  
      // If user requested to see the original source stack, but no source map information is available, just fall back to showing the JS stack.
      if (flags & 8/*EM_LOG_C_STACK*/ && typeof emscripten_source_map === 'undefined') {
        warnOnce('Source map information is not available, emscripten_log with EM_LOG_C_STACK will be ignored. Build with "--pre-js $EMSCRIPTEN/src/emscripten-source-map.min.js" linker flag to add source map loading to code.');
        flags ^= 8/*EM_LOG_C_STACK*/;
        flags |= 16/*EM_LOG_JS_STACK*/;
      }
  
      var stack_args = null;
      if (flags & 128 /*EM_LOG_FUNC_PARAMS*/) {
        // To get the actual parameters to the functions, traverse the stack via the unfortunately deprecated 'arguments.callee' method, if it works:
        stack_args = __emscripten_traverse_stack(arguments);
        while (stack_args[1].indexOf('_emscripten_') >= 0)
          stack_args = __emscripten_traverse_stack(stack_args[0]);
      }
  
      // Process all lines:
      var lines = callstack.split('\n');
      callstack = '';
      var newFirefoxRe = new RegExp('\\s*(.*?)@(.*?):([0-9]+):([0-9]+)'); // New FF30 with column info: extract components of form '       Object._main@http://server.com:4324:12'
      var firefoxRe = new RegExp('\\s*(.*?)@(.*):(.*)(:(.*))?'); // Old FF without column info: extract components of form '       Object._main@http://server.com:4324'
      var chromeRe = new RegExp('\\s*at (.*?) \\\((.*):(.*):(.*)\\\)'); // Extract components of form '    at Object._main (http://server.com/file.html:4324:12)'
  
      for (var l in lines) {
        var line = lines[l];
  
        var jsSymbolName = '';
        var file = '';
        var lineno = 0;
        var column = 0;
  
        var parts = chromeRe.exec(line);
        if (parts && parts.length == 5) {
          jsSymbolName = parts[1];
          file = parts[2];
          lineno = parts[3];
          column = parts[4];
        } else {
          parts = newFirefoxRe.exec(line);
          if (!parts) parts = firefoxRe.exec(line);
          if (parts && parts.length >= 4) {
            jsSymbolName = parts[1];
            file = parts[2];
            lineno = parts[3];
            column = parts[4]|0; // Old Firefox doesn't carry column information, but in new FF30, it is present. See https://bugzilla.mozilla.org/show_bug.cgi?id=762556
          } else {
            // Was not able to extract this line for demangling/sourcemapping purposes. Output it as-is.
            callstack += line + '\n';
            continue;
          }
        }
  
        // Try to demangle the symbol, but fall back to showing the original JS symbol name if not available.
        var cSymbolName = (flags & 32/*EM_LOG_DEMANGLE*/) ? demangle(jsSymbolName) : jsSymbolName;
        if (!cSymbolName) {
          cSymbolName = jsSymbolName;
        }
  
        var haveSourceMap = false;
  
        if (flags & 8/*EM_LOG_C_STACK*/) {
          var orig = emscripten_source_map.originalPositionFor({line: lineno, column: column});
          haveSourceMap = (orig && orig.source);
          if (haveSourceMap) {
            if (flags & 64/*EM_LOG_NO_PATHS*/) {
              orig.source = orig.source.substring(orig.source.replace(/\\/g, "/").lastIndexOf('/')+1);
            }
            callstack += '    at ' + cSymbolName + ' (' + orig.source + ':' + orig.line + ':' + orig.column + ')\n';
          }
        }
        if ((flags & 16/*EM_LOG_JS_STACK*/) || !haveSourceMap) {
          if (flags & 64/*EM_LOG_NO_PATHS*/) {
            file = file.substring(file.replace(/\\/g, "/").lastIndexOf('/')+1);
          }
          callstack += (haveSourceMap ? ('     = '+jsSymbolName) : ('    at '+cSymbolName)) + ' (' + file + ':' + lineno + ':' + column + ')\n';
        }
  
        // If we are still keeping track with the callstack by traversing via 'arguments.callee', print the function parameters as well.
        if (flags & 128 /*EM_LOG_FUNC_PARAMS*/ && stack_args[0]) {
          if (stack_args[1] == jsSymbolName && stack_args[2].length > 0) {
            callstack = callstack.replace(/\s+$/, '');
            callstack += ' with values: ' + stack_args[1] + stack_args[2] + '\n';
          }
          stack_args = __emscripten_traverse_stack(stack_args[0]);
        }
      }
      // Trim extra whitespace at the end of the output.
      callstack = callstack.replace(/\s+$/, '');
      return callstack;
    }function _emscripten_log_js(flags, str) {
      if (flags & 24/*EM_LOG_C_STACK | EM_LOG_JS_STACK*/) {
        str = str.replace(/\s+$/, ''); // Ensure the message and the callstack are joined cleanly with exactly one newline.
        str += (str.length > 0 ? '\n' : '') + _emscripten_get_callstack_js(flags);
      }
  
      if (flags & 1 /*EM_LOG_CONSOLE*/) {
        if (flags & 4 /*EM_LOG_ERROR*/) {
          console.error(str);
        } else if (flags & 2 /*EM_LOG_WARN*/) {
          console.warn(str);
        } else {
          console.log(str);
        }
      } else if (flags & 6 /*EM_LOG_ERROR|EM_LOG_WARN*/) {
        err(str);
      } else {
        out(str);
      }
    }function _emscripten_log(flags, varargs) {
      // Extract the (optionally-existing) printf format specifier field from varargs.
      var format = HEAP32[((varargs)>>2)];
      varargs += 4;
      var str = '';
      if (format) {
        var result = __formatString(format, varargs);
        for(var i = 0 ; i < result.length; ++i) {
          str += String.fromCharCode(result[i]);
        }
      }
      _emscripten_log_js(flags, str);
    }

  function _emscripten_num_logical_cores() {
      return 1;
    }

  
  
  function __setLetterbox(element, topBottom, leftRight) {
      if (JSEvents.isInternetExplorer()) {
        // Cannot use padding on IE11, because IE11 computes padding in addition to the size, unlike
        // other browsers, which treat padding to be part of the size.
        // e.g.
        // FF, Chrome: If CSS size = 1920x1080, padding-leftright = 460, padding-topbottomx40, then content size = (1920 - 2*460) x (1080-2*40) = 1000x1000px, and total element size = 1920x1080px.
        //       IE11: If CSS size = 1920x1080, padding-leftright = 460, padding-topbottomx40, then content size = 1920x1080px and total element size = (1920+2*460) x (1080+2*40)px.
        // IE11  treats margin like Chrome and FF treat padding.
        element.style.marginLeft = element.style.marginRight = leftRight + 'px';
        element.style.marginTop = element.style.marginBottom = topBottom + 'px';
      } else {
        // Cannot use margin to specify letterboxes in FF or Chrome, since those ignore margins in fullscreen mode.
        element.style.paddingLeft = element.style.paddingRight = leftRight + 'px';
        element.style.paddingTop = element.style.paddingBottom = topBottom + 'px';
      }
    }function __emscripten_do_request_fullscreen(target, strategy) {
      if (typeof JSEvents.fullscreenEnabled() === 'undefined') return -1;
      if (!JSEvents.fullscreenEnabled()) return -3;
      if (!target) target = '#canvas';
      target = JSEvents.findEventTarget(target);
      if (!target) return -4;
  
      if (!target.requestFullscreen && !target.msRequestFullscreen && !target.mozRequestFullScreen && !target.mozRequestFullscreen && !target.webkitRequestFullscreen) {
        return -3;
      }
  
      var canPerformRequests = JSEvents.canPerformEventHandlerRequests();
  
      // Queue this function call if we're not currently in an event handler and the user saw it appropriate to do so.
      if (!canPerformRequests) {
        if (strategy.deferUntilInEventHandler) {
          JSEvents.deferCall(JSEvents.requestFullscreen, 1 /* priority over pointer lock */, [target, strategy]);
          return 1;
        } else {
          return -2;
        }
      }
  
      return JSEvents.requestFullscreen(target, strategy);
    }function _emscripten_request_fullscreen(target, deferUntilInEventHandler) {
      var strategy = {};
      // These options perform no added logic, but just bare request fullscreen.
      strategy.scaleMode = 0;
      strategy.canvasResolutionScaleMode = 0;
      strategy.filteringMode = 0;
      strategy.deferUntilInEventHandler = deferUntilInEventHandler;
      strategy.canvasResizedCallbackTargetThread = 2;
  
      return __emscripten_do_request_fullscreen(target, strategy);
    }

  function _emscripten_request_pointerlock(target, deferUntilInEventHandler) {
      if (!target) target = '#canvas';
      target = JSEvents.findEventTarget(target);
      if (!target) return -4;
      if (!target.requestPointerLock && !target.mozRequestPointerLock && !target.webkitRequestPointerLock && !target.msRequestPointerLock) {
        return -1;
      }
  
      var canPerformRequests = JSEvents.canPerformEventHandlerRequests();
  
      // Queue this function call if we're not currently in an event handler and the user saw it appropriate to do so.
      if (!canPerformRequests) {
        if (deferUntilInEventHandler) {
          JSEvents.deferCall(JSEvents.requestPointerLock, 2 /* priority below fullscreen */, [target]);
          return 1;
        } else {
          return -2;
        }
      }
  
      return JSEvents.requestPointerLock(target);
    }

  function _emscripten_set_blur_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
      JSEvents.registerFocusEventCallback(target, userData, useCapture, callbackfunc, 12, "blur", targetThread);
      return 0;
    }


  function _emscripten_set_dblclick_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
      JSEvents.registerMouseEventCallback(target, userData, useCapture, callbackfunc, 7, "dblclick", targetThread);
      return 0;
    }

  function _emscripten_set_devicemotion_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
      JSEvents.registerDeviceMotionEventCallback(window, userData, useCapture, callbackfunc, 17, "devicemotion", targetThread);
      return 0;
    }

  function _emscripten_set_deviceorientation_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
      JSEvents.registerDeviceOrientationEventCallback(window, userData, useCapture, callbackfunc, 16, "deviceorientation", targetThread);
      return 0;
    }

  function _emscripten_set_focus_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
      JSEvents.registerFocusEventCallback(target, userData, useCapture, callbackfunc, 13, "focus", targetThread);
      return 0;
    }

  function _emscripten_set_fullscreenchange_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
      if (typeof JSEvents.fullscreenEnabled() === 'undefined') return -1;
      if (!target) target = document;
      else {
        target = JSEvents.findEventTarget(target);
        if (!target) return -4;
      }
      JSEvents.registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "fullscreenchange", targetThread);
      JSEvents.registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "mozfullscreenchange", targetThread);
      JSEvents.registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "webkitfullscreenchange", targetThread);
      JSEvents.registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, "msfullscreenchange", targetThread);
      return 0;
    }

  function _emscripten_set_gamepadconnected_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
      if (!navigator.getGamepads && !navigator.webkitGetGamepads) return -1;
      JSEvents.registerGamepadEventCallback(window, userData, useCapture, callbackfunc, 26, "gamepadconnected", targetThread);
      return 0;
    }

  function _emscripten_set_gamepaddisconnected_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
      if (!navigator.getGamepads && !navigator.webkitGetGamepads) return -1;
      JSEvents.registerGamepadEventCallback(window, userData, useCapture, callbackfunc, 27, "gamepaddisconnected", targetThread);
      return 0;
   }

  function _emscripten_set_keydown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
      JSEvents.registerKeyEventCallback(target, userData, useCapture, callbackfunc, 2, "keydown", targetThread);
      return 0;
    }

  function _emscripten_set_keypress_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
      JSEvents.registerKeyEventCallback(target, userData, useCapture, callbackfunc, 1, "keypress", targetThread);
      return 0;
    }

  function _emscripten_set_keyup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
      JSEvents.registerKeyEventCallback(target, userData, useCapture, callbackfunc, 3, "keyup", targetThread);
      return 0;
    }



  function _emscripten_set_mousedown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
      JSEvents.registerMouseEventCallback(target, userData, useCapture, callbackfunc, 5, "mousedown", targetThread);
      return 0;
    }

  function _emscripten_set_mousemove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
      JSEvents.registerMouseEventCallback(target, userData, useCapture, callbackfunc, 8, "mousemove", targetThread);
      return 0;
    }

  function _emscripten_set_mouseup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
      JSEvents.registerMouseEventCallback(target, userData, useCapture, callbackfunc, 6, "mouseup", targetThread);
      return 0;
    }

  function _emscripten_set_touchcancel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
      JSEvents.registerTouchEventCallback(target, userData, useCapture, callbackfunc, 25, "touchcancel", targetThread);
      return 0;
    }

  function _emscripten_set_touchend_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
      JSEvents.registerTouchEventCallback(target, userData, useCapture, callbackfunc, 23, "touchend", targetThread);
      return 0;
    }

  function _emscripten_set_touchmove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
      JSEvents.registerTouchEventCallback(target, userData, useCapture, callbackfunc, 24, "touchmove", targetThread);
      return 0;
    }

  function _emscripten_set_touchstart_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
      JSEvents.registerTouchEventCallback(target, userData, useCapture, callbackfunc, 22, "touchstart", targetThread);
      return 0;
    }

  function _emscripten_set_wheel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
      target = JSEvents.findEventTarget(target);
      if (typeof target.onwheel !== 'undefined') {
        JSEvents.registerWheelEventCallback(target, userData, useCapture, callbackfunc, 9, "wheel", targetThread);
        return 0;
      } else if (typeof target.onmousewheel !== 'undefined') {
        JSEvents.registerWheelEventCallback(target, userData, useCapture, callbackfunc, 9, "mousewheel", targetThread);
        return 0;
      } else {
        return -1;
      }
    }

  
  
  var GL={counter:1,lastError:0,buffers:[],mappedBuffers:{},programs:[],framebuffers:[],renderbuffers:[],textures:[],uniforms:[],shaders:[],vaos:[],contexts:[],currentContext:null,offscreenCanvases:{},timerQueriesEXT:[],queries:[],samplers:[],transformFeedbacks:[],syncs:[],byteSizeByTypeRoot:5120,byteSizeByType:[1,1,2,2,4,4,4,2,3,4,8],programInfos:{},stringCache:{},stringiCache:{},tempFixedLengthArray:[],packAlignment:4,unpackAlignment:4,init:function () {
        GL.miniTempBuffer = new Float32Array(GL.MINI_TEMP_BUFFER_SIZE);
        for (var i = 0; i < GL.MINI_TEMP_BUFFER_SIZE; i++) {
          GL.miniTempBufferViews[i] = GL.miniTempBuffer.subarray(0, i+1);
        }
  
        // For functions such as glDrawBuffers, glInvalidateFramebuffer and glInvalidateSubFramebuffer that need to pass a short array to the WebGL API,
        // create a set of short fixed-length arrays to avoid having to generate any garbage when calling those functions.
        for (var i = 0; i < 32; i++) {
          GL.tempFixedLengthArray.push(new Array(i));
        }
      },recordError:function recordError(errorCode) {
        if (!GL.lastError) {
          GL.lastError = errorCode;
        }
      },getNewId:function (table) {
        var ret = GL.counter++;
        for (var i = table.length; i < ret; i++) {
          table[i] = null;
        }
        return ret;
      },MINI_TEMP_BUFFER_SIZE:256,miniTempBuffer:null,miniTempBufferViews:[0],getSource:function (shader, count, string, length) {
        var source = '';
        for (var i = 0; i < count; ++i) {
          var frag;
          if (length) {
            var len = HEAP32[(((length)+(i*4))>>2)];
            if (len < 0) {
              frag = Pointer_stringify(HEAP32[(((string)+(i*4))>>2)]);
            } else {
              frag = Pointer_stringify(HEAP32[(((string)+(i*4))>>2)], len);
            }
          } else {
            frag = Pointer_stringify(HEAP32[(((string)+(i*4))>>2)]);
          }
          source += frag;
        }
        return source;
      },createContext:function (canvas, webGLContextAttributes) {
        if (typeof webGLContextAttributes['majorVersion'] === 'undefined' && typeof webGLContextAttributes['minorVersion'] === 'undefined') {
          // If caller did not specify a context, initialize the best one that is possibly available.
          // To explicitly create a WebGL 1 or a WebGL 2 context, call this function with a specific
          // majorVersion set.
          if (typeof WebGL2RenderingContext !== 'undefined') webGLContextAttributes['majorVersion'] = 2;
          else webGLContextAttributes['majorVersion'] = 1;
          webGLContextAttributes['minorVersion'] = 0;
        }
  
  
  
        var ctx;
        var errorInfo = '?';
        function onContextCreationError(event) {
          errorInfo = event.statusMessage || errorInfo;
        }
        // XX localmod: Always utilize high-performance GPU for Unity builds
        webGLContextAttributes['powerPreference'] = 'high-performance';
        try {
          canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
          try {
            if (webGLContextAttributes['majorVersion'] == 1 && webGLContextAttributes['minorVersion'] == 0) {
              ctx = canvas.getContext("webgl", webGLContextAttributes) || canvas.getContext("experimental-webgl", webGLContextAttributes);
            } else if (webGLContextAttributes['majorVersion'] == 2 && webGLContextAttributes['minorVersion'] == 0) {
              ctx = canvas.getContext("webgl2", webGLContextAttributes);
            } else {
              throw 'Unsupported WebGL context version ' + majorVersion + '.' + minorVersion + '!'
            }
          } finally {
            canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
          }
          if (!ctx) throw ':(';
        } catch (e) {
          out('Could not create canvas: ' + [errorInfo, e, JSON.stringify(webGLContextAttributes)]);
          return 0;
        }
  
        if (!ctx) return 0;
        var context = GL.registerContext(ctx, webGLContextAttributes);
        return context;
      },registerContext:function (ctx, webGLContextAttributes) {
        var handle = _malloc(8); // Make space on the heap to store GL context attributes that need to be accessible as shared between threads.
        HEAP32[((handle)>>2)]=webGLContextAttributes["explicitSwapControl"]; // explicitSwapControl
        var context = {
          handle: handle,
          attributes: webGLContextAttributes,
          version: webGLContextAttributes['majorVersion'],
          GLctx: ctx
        };
  
        // BUG: Workaround Chrome WebGL 2 issue: the first shipped versions of WebGL 2 in Chrome did not actually implement the new WebGL 2 functions.
        //      Those are supported only in Chrome 58 and newer.
        function getChromeVersion() {
          var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
          return raw ? parseInt(raw[2], 10) : false;
        }
        context.supportsWebGL2EntryPoints = (context.version >= 2) && (getChromeVersion() === false || getChromeVersion() >= 58);
  
        // Store the created context object so that we can access the context given a canvas without having to pass the parameters again.
        if (ctx.canvas) ctx.canvas.GLctxObject = context;
        GL.contexts[handle] = context;
        if (typeof webGLContextAttributes['enableExtensionsByDefault'] === 'undefined' || webGLContextAttributes['enableExtensionsByDefault']) {
          GL.initExtensions(context);
        }
  
        if (webGLContextAttributes['renderViaOffscreenBackBuffer']) {
          return 0;
        }
  
        return handle;
      },makeContextCurrent:function (contextHandle) {
        // Deactivating current context?
        if (!contextHandle) {
          GLctx = Module.ctx = GL.currentContext = null;
          return true;
        }
        var context = GL.contexts[contextHandle];
        if (!context) {
          return false;
        }
        GLctx = Module.ctx = context.GLctx; // Active WebGL context object.
        GL.currentContext = context; // Active Emscripten GL layer context object.
        return true;
      },getContext:function (contextHandle) {
        return GL.contexts[contextHandle];
      },deleteContext:function (contextHandle) {
        if (!contextHandle) return;
        if (GL.currentContext === GL.contexts[contextHandle]) GL.currentContext = null;
        if (typeof JSEvents === 'object') JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas); // Release all JS event handlers on the DOM element that the GL context is associated with since the context is now deleted.
        if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas) GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined; // Make sure the canvas object no longer refers to the context object so there are no GC surprises.
        _free(GL.contexts[contextHandle]);
        GL.contexts[contextHandle] = null;
      },initExtensions:function (context) {
        // If this function is called without a specific context object, init the extensions of the currently active context.
        if (!context) context = GL.currentContext;
  
        if (context.initExtensionsDone) return;
        context.initExtensionsDone = true;
  
        var GLctx = context.GLctx;
  
        context.maxVertexAttribs = GLctx.getParameter(GLctx.MAX_VERTEX_ATTRIBS);
  
        // Detect the presence of a few extensions manually, this GL interop layer itself will need to know if they exist.
  
        if (context.version < 2) {
          // Extension available from Firefox 26 and Google Chrome 30
          var instancedArraysExt = GLctx.getExtension('ANGLE_instanced_arrays');
          if (instancedArraysExt) {
            GLctx['vertexAttribDivisor'] = function(index, divisor) { instancedArraysExt['vertexAttribDivisorANGLE'](index, divisor); };
            GLctx['drawArraysInstanced'] = function(mode, first, count, primcount) { instancedArraysExt['drawArraysInstancedANGLE'](mode, first, count, primcount); };
            GLctx['drawElementsInstanced'] = function(mode, count, type, indices, primcount) { instancedArraysExt['drawElementsInstancedANGLE'](mode, count, type, indices, primcount); };
          }
  
          // Extension available from Firefox 25 and WebKit
          var vaoExt = GLctx.getExtension('OES_vertex_array_object');
          if (vaoExt) {
            GLctx['createVertexArray'] = function() { return vaoExt['createVertexArrayOES'](); };
            GLctx['deleteVertexArray'] = function(vao) { vaoExt['deleteVertexArrayOES'](vao); };
            GLctx['bindVertexArray'] = function(vao) { vaoExt['bindVertexArrayOES'](vao); };
            GLctx['isVertexArray'] = function(vao) { return vaoExt['isVertexArrayOES'](vao); };
          }
  
          var drawBuffersExt = GLctx.getExtension('WEBGL_draw_buffers');
          if (drawBuffersExt) {
            GLctx['drawBuffers'] = function(n, bufs) { drawBuffersExt['drawBuffersWEBGL'](n, bufs); };
          }
        }
  
        GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query");
  
        // These are the 'safe' feature-enabling extensions that don't add any performance impact related to e.g. debugging, and
        // should be enabled by default so that client GLES2/GL code will not need to go through extra hoops to get its stuff working.
        // As new extensions are ratified at http://www.khronos.org/registry/webgl/extensions/ , feel free to add your new extensions
        // here, as long as they don't produce a performance impact for users that might not be using those extensions.
        // E.g. debugging-related extensions should probably be off by default.
        // XX localmod: Added EXT_texture_norm16 and WEBKIT_WEBGL_compressed_texture_pvrtc to the list.
        var automaticallyEnabledExtensions = [ // Khronos ratified WebGL extensions ordered by number (no debug extensions):
                                               "OES_texture_float", "OES_texture_half_float", "OES_standard_derivatives",
                                               "OES_vertex_array_object", "WEBGL_compressed_texture_s3tc", "WEBGL_depth_texture",
                                               "OES_element_index_uint", "EXT_texture_filter_anisotropic", "EXT_frag_depth",
                                               "WEBGL_draw_buffers", "ANGLE_instanced_arrays", "OES_texture_float_linear",
                                               "OES_texture_half_float_linear", "EXT_blend_minmax", "EXT_shader_texture_lod",
                                               "EXT_texture_norm16",
                                               // Community approved WebGL extensions ordered by number:
                                               "WEBGL_compressed_texture_pvrtc", "EXT_color_buffer_half_float", "WEBGL_color_buffer_float",
                                               "EXT_sRGB", "WEBGL_compressed_texture_etc1", "EXT_disjoint_timer_query",
                                               "WEBGL_compressed_texture_etc", "WEBGL_compressed_texture_astc", "EXT_color_buffer_float",
                                               "WEBGL_compressed_texture_s3tc_srgb", "EXT_disjoint_timer_query_webgl2",
                                               "WEBKIT_WEBGL_compressed_texture_pvrtc"];
  
        function shouldEnableAutomatically(extension) {
          var ret = false;
          automaticallyEnabledExtensions.forEach(function(include) {
            if (extension.indexOf(include) != -1) {
              ret = true;
            }
          });
          return ret;
        }
  
        var exts = GLctx.getSupportedExtensions();
        if (exts && exts.length > 0) {
          GLctx.getSupportedExtensions().forEach(function(ext) {
            if (automaticallyEnabledExtensions.indexOf(ext) != -1) {
              GLctx.getExtension(ext); // Calling .getExtension enables that extension permanently, no need to store the return value to be enabled.
            }
          });
        }
      },populateUniformTable:function (program) {
        var p = GL.programs[program];
        GL.programInfos[program] = {
          uniforms: {},
          maxUniformLength: 0, // This is eagerly computed below, since we already enumerate all uniforms anyway.
          maxAttributeLength: -1, // This is lazily computed and cached, computed when/if first asked, "-1" meaning not computed yet.
          maxUniformBlockNameLength: -1 // Lazily computed as well
        };
  
        var ptable = GL.programInfos[program];
        var utable = ptable.uniforms;
        // A program's uniform table maps the string name of an uniform to an integer location of that uniform.
        // The global GL.uniforms map maps integer locations to WebGLUniformLocations.
        var numUniforms = GLctx.getProgramParameter(p, GLctx.ACTIVE_UNIFORMS);
        for (var i = 0; i < numUniforms; ++i) {
          var u = GLctx.getActiveUniform(p, i);
  
          var name = u.name;
          ptable.maxUniformLength = Math.max(ptable.maxUniformLength, name.length+1);
  
          // Strip off any trailing array specifier we might have got, e.g. "[0]".
          if (name.indexOf(']', name.length-1) !== -1) {
            var ls = name.lastIndexOf('[');
            name = name.slice(0, ls);
          }
  
          // Optimize memory usage slightly: If we have an array of uniforms, e.g. 'vec3 colors[3];', then
          // only store the string 'colors' in utable, and 'colors[0]', 'colors[1]' and 'colors[2]' will be parsed as 'colors'+i.
          // Note that for the GL.uniforms table, we still need to fetch the all WebGLUniformLocations for all the indices.
          var loc = GLctx.getUniformLocation(p, name);
          if (loc != null)
          {
            var id = GL.getNewId(GL.uniforms);
            utable[name] = [u.size, id];
            GL.uniforms[id] = loc;
  
            for (var j = 1; j < u.size; ++j) {
              var n = name + '['+j+']';
              loc = GLctx.getUniformLocation(p, n);
              id = GL.getNewId(GL.uniforms);
  
              GL.uniforms[id] = loc;
            }
          }
        }
      }};function _emscripten_webgl_do_create_context(target, attributes) {
      var contextAttributes = {};
      contextAttributes['alpha'] = !!HEAP32[((attributes)>>2)];
      contextAttributes['depth'] = !!HEAP32[(((attributes)+(4))>>2)];
      contextAttributes['stencil'] = !!HEAP32[(((attributes)+(8))>>2)];
      contextAttributes['antialias'] = !!HEAP32[(((attributes)+(12))>>2)];
      contextAttributes['premultipliedAlpha'] = !!HEAP32[(((attributes)+(16))>>2)];
      contextAttributes['preserveDrawingBuffer'] = !!HEAP32[(((attributes)+(20))>>2)];
      contextAttributes['preferLowPowerToHighPerformance'] = !!HEAP32[(((attributes)+(24))>>2)];
      contextAttributes['failIfMajorPerformanceCaveat'] = !!HEAP32[(((attributes)+(28))>>2)];
      contextAttributes['majorVersion'] = HEAP32[(((attributes)+(32))>>2)];
      contextAttributes['minorVersion'] = HEAP32[(((attributes)+(36))>>2)];
      var enableExtensionsByDefault = HEAP32[(((attributes)+(40))>>2)];
      contextAttributes['explicitSwapControl'] = HEAP32[(((attributes)+(44))>>2)];
      contextAttributes['proxyContextToMainThread'] = HEAP32[(((attributes)+(48))>>2)];
      contextAttributes['renderViaOffscreenBackBuffer'] = HEAP32[(((attributes)+(52))>>2)];
  
      target = Pointer_stringify(target);
      var canvas;
      if ((!target || target === '#canvas') && Module['canvas']) {
        canvas = (Module['canvas'].id && GL.offscreenCanvases[Module['canvas'].id]) ? (GL.offscreenCanvases[Module['canvas'].id].offscreenCanvas || JSEvents.findEventTarget(Module['canvas'].id)) : Module['canvas'];
      } else {
        canvas = GL.offscreenCanvases[target] ? GL.offscreenCanvases[target].offscreenCanvas : JSEvents.findEventTarget(target);
      }
  
  
      if (!canvas) {
        return 0;
      }
  
      if (contextAttributes['explicitSwapControl']) {
        return 0;
      }
  
  
      var contextHandle = GL.createContext(canvas, contextAttributes);
      return contextHandle;
    }function _emscripten_webgl_create_context() {
  return _emscripten_webgl_do_create_context.apply(null, arguments)
  }

  
  function _emscripten_webgl_destroy_context_calling_thread(contextHandle) {
      GL.deleteContext(contextHandle);
    }function _emscripten_webgl_destroy_context() {
  return _emscripten_webgl_destroy_context_calling_thread.apply(null, arguments)
  }

  
  function _emscripten_webgl_enable_extension_calling_thread(contextHandle, extension) {
      var context = GL.getContext(contextHandle);
      var extString = Pointer_stringify(extension);
      if (extString.indexOf('GL_') == 0) extString = extString.substr(3); // Allow enabling extensions both with "GL_" prefix and without.
      var ext = context.GLctx.getExtension(extString);
      return ext ? 1 : 0;
    }function _emscripten_webgl_enable_extension() {
  return _emscripten_webgl_enable_extension_calling_thread.apply(null, arguments)
  }

  
  function _emscripten_webgl_do_get_current_context() {
      return GL.currentContext ? GL.currentContext.handle : 0;
    }function _emscripten_webgl_get_current_context() {
  return _emscripten_webgl_do_get_current_context.apply(null, arguments)
  }

  function _emscripten_webgl_init_context_attributes(attributes) {
      HEAP32[((attributes)>>2)]=1;
      HEAP32[(((attributes)+(4))>>2)]=1;
      HEAP32[(((attributes)+(8))>>2)]=0;
      HEAP32[(((attributes)+(12))>>2)]=1;
      HEAP32[(((attributes)+(16))>>2)]=1;
      HEAP32[(((attributes)+(20))>>2)]=0;
      HEAP32[(((attributes)+(24))>>2)]=0;
      HEAP32[(((attributes)+(28))>>2)]=0;
      HEAP32[(((attributes)+(32))>>2)]=1;
      HEAP32[(((attributes)+(36))>>2)]=0;
      HEAP32[(((attributes)+(40))>>2)]=1;
      HEAP32[(((attributes)+(44))>>2)]=0;
        HEAP32[(((attributes)+(48))>>2)]=0;
  
      HEAP32[(((attributes)+(52))>>2)]=0;
    }

  function _emscripten_webgl_make_context_current(contextHandle) {
      var success = GL.makeContextCurrent(contextHandle);
      return success ? 0 : -5;
    }

  
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      exit(status);
    }function _exit(status) {
      __exit(status);
    }

  function _flock(fd, operation) {
      // int flock(int fd, int operation);
      // Pretend to succeed
      return 0;
    }

  function _getenv(name) {
      // char *getenv(const char *name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/getenv.html
      if (name === 0) return 0;
      name = Pointer_stringify(name);
      if (!ENV.hasOwnProperty(name)) return 0;
  
      if (_getenv.ret) _free(_getenv.ret);
      _getenv.ret = allocateUTF8(ENV[name]);
      return _getenv.ret;
    }

  
  function _gethostbyname(name) {
      name = Pointer_stringify(name);
  
      // generate hostent
      var ret = _malloc(20); // XXX possibly leaked, as are others here
      var nameBuf = _malloc(name.length+1);
      stringToUTF8(name, nameBuf, name.length+1);
      HEAP32[((ret)>>2)]=nameBuf;
      var aliasesBuf = _malloc(4);
      HEAP32[((aliasesBuf)>>2)]=0;
      HEAP32[(((ret)+(4))>>2)]=aliasesBuf;
      var afinet = 2;
      HEAP32[(((ret)+(8))>>2)]=afinet;
      HEAP32[(((ret)+(12))>>2)]=4;
      var addrListBuf = _malloc(12);
      HEAP32[((addrListBuf)>>2)]=addrListBuf+8;
      HEAP32[(((addrListBuf)+(4))>>2)]=0;
      HEAP32[(((addrListBuf)+(8))>>2)]=__inet_pton4_raw(DNS.lookup_name(name));
      HEAP32[(((ret)+(16))>>2)]=addrListBuf;
      return ret;
    }function _gethostbyaddr(addr, addrlen, type) {
      if (type !== 2) {
        ___setErrNo(ERRNO_CODES.EAFNOSUPPORT);
        // TODO: set h_errno
        return null;
      }
      addr = HEAP32[((addr)>>2)]; // addr is in_addr
      var host = __inet_ntop4_raw(addr);
      var lookup = DNS.lookup_addr(host);
      if (lookup) {
        host = lookup;
      }
      var hostp = allocate(intArrayFromString(host), 'i8', ALLOC_STACK);
      return _gethostbyname(hostp);
    }


  function _getpagesize() {
      // int getpagesize(void);
      return PAGE_SIZE;
    }

  function _getpwuid(uid) {
      return 0; // NULL
    }

  function _gettimeofday(ptr) {
      var now = Date.now();
      HEAP32[((ptr)>>2)]=(now/1000)|0; // seconds
      HEAP32[(((ptr)+(4))>>2)]=((now % 1000)*1000)|0; // microseconds
      return 0;
    }

  function _glActiveTexture(x0) { GLctx['activeTexture'](x0) }

  function _glAttachShader(program, shader) {
      GLctx.attachShader(GL.programs[program],
                              GL.shaders[shader]);
    }

  function _glBeginQuery(target, id) {
      GLctx['beginQuery'](target, id ? GL.queries[id] : null);
    }

  function _glBeginTransformFeedback(x0) { GLctx['beginTransformFeedback'](x0) }

  function _glBindAttribLocation(program, index, name) {
      name = Pointer_stringify(name);
      GLctx.bindAttribLocation(GL.programs[program], index, name);
    }

  function _glBindBuffer(target, buffer) {
      var bufferObj = buffer ? GL.buffers[buffer] : null;
  
  
      if (target == 0x88EB /*GL_PIXEL_PACK_BUFFER*/) {
        // In WebGL 2 glReadPixels entry point, we need to use a different WebGL 2 API function call when a buffer is bound to
        // GL_PIXEL_PACK_BUFFER_BINDING point, so must keep track whether that binding point is non-null to know what is
        // the proper API function to call.
        GLctx.currentPixelPackBufferBinding = buffer;
      } else if (target == 0x88EC /*GL_PIXEL_UNPACK_BUFFER*/) {
        // In WebGL 2 glTexImage2D, glTexSubImage2D, glTexImage3D and glTexSubImage3D entry points, we need to use a different WebGL 2 API function
        // call when a buffer is bound to GL_PIXEL_UNPACK_BUFFER_BINDING point, so must keep track whether that binding point is non-null to know what
        // is the proper API function to call.
        GLctx.currentPixelUnpackBufferBinding = buffer;
      }
      GLctx.bindBuffer(target, bufferObj);
    }

  function _glBindBufferBase(target, index, buffer) {
      var bufferObj = buffer ? GL.buffers[buffer] : null;
      GLctx['bindBufferBase'](target, index, bufferObj);
    }

  function _glBindBufferRange(target, index, buffer, offset, ptrsize) {
      var bufferObj = buffer ? GL.buffers[buffer] : null;
      GLctx['bindBufferRange'](target, index, bufferObj, offset, ptrsize);
    }

  function _glBindFramebuffer(target, framebuffer) {
  
      GLctx.bindFramebuffer(target, framebuffer ? GL.framebuffers[framebuffer] : null);
  
    }

  function _glBindRenderbuffer(target, renderbuffer) {
      GLctx.bindRenderbuffer(target, renderbuffer ? GL.renderbuffers[renderbuffer] : null);
    }

  function _glBindSampler(unit, sampler) {
      GLctx['bindSampler'](unit, sampler ? GL.samplers[sampler] : null);
    }

  function _glBindTexture(target, texture) {
      GLctx.bindTexture(target, texture ? GL.textures[texture] : null);
    }

  function _glBindTransformFeedback(target, id) {
      var transformFeedback = id ? GL.transformFeedbacks[id] : null;
      if (id && !transformFeedback) { // Passing an nonexisting or an already deleted id is an error.
        GL.recordError(0x0502 /* GL_INVALID_OPERATION */);
        return;
      }
      GLctx['bindTransformFeedback'](target, transformFeedback);
    }

  function _glBindVertexArray(vao) {
      GLctx['bindVertexArray'](GL.vaos[vao]);
    }

  function _glBlendEquation(x0) { GLctx['blendEquation'](x0) }

  function _glBlendEquationSeparate(x0, x1) { GLctx['blendEquationSeparate'](x0, x1) }

  function _glBlendFunc(x0, x1) { GLctx['blendFunc'](x0, x1) }

  function _glBlendFuncSeparate(x0, x1, x2, x3) { GLctx['blendFuncSeparate'](x0, x1, x2, x3) }

  function _glBlitFramebuffer(x0, x1, x2, x3, x4, x5, x6, x7, x8, x9) { GLctx['blitFramebuffer'](x0, x1, x2, x3, x4, x5, x6, x7, x8, x9) }

  function _glBufferData(target, size, data, usage) {
      if (!data) {
        GLctx.bufferData(target, size, usage);
      } else {
        if (GL.currentContext.supportsWebGL2EntryPoints) { // WebGL 2 provides new garbage-free entry points to call to WebGL. Use those always when possible.
          GLctx.bufferData(target, HEAPU8, usage, data, size);
          return;
        }
        GLctx.bufferData(target, HEAPU8.subarray(data, data+size), usage);
      }
    }

  function _glBufferSubData(target, offset, size, data) {
      if (GL.currentContext.supportsWebGL2EntryPoints) { // WebGL 2 provides new garbage-free entry points to call to WebGL. Use those always when possible.
        GLctx.bufferSubData(target, offset, HEAPU8, data, size);
        return;
      }
      GLctx.bufferSubData(target, offset, HEAPU8.subarray(data, data+size));
    }

  function _glCheckFramebufferStatus(x0) { return GLctx['checkFramebufferStatus'](x0) }

  function _glClear(x0) { GLctx['clear'](x0) }

  function _glClearBufferfi(x0, x1, x2, x3) { GLctx['clearBufferfi'](x0, x1, x2, x3) }

  function _glClearBufferfv(buffer, drawbuffer, value) {
  
      GLctx['clearBufferfv'](buffer, drawbuffer, HEAPF32, value>>2);
    }

  function _glClearBufferuiv(buffer, drawbuffer, value) {
  
      GLctx['clearBufferuiv'](buffer, drawbuffer, HEAPU32, value>>2);
    }

  function _glClearColor(x0, x1, x2, x3) { GLctx['clearColor'](x0, x1, x2, x3) }

  function _glClearDepthf(x0) { GLctx['clearDepth'](x0) }

  function _glClearStencil(x0) { GLctx['clearStencil'](x0) }

  function _glClientWaitSync(sync, flags, timeoutLo, timeoutHi) {
      // WebGL2 vs GLES3 differences: in GLES3, the timeout parameter is a uint64, where 0xFFFFFFFFFFFFFFFFULL means GL_TIMEOUT_IGNORED.
      // In JS, there's no 64-bit value types, so instead timeout is taken to be signed, and GL_TIMEOUT_IGNORED is given value -1.
      // Inherently the value accepted in the timeout is lossy, and can't take in arbitrary u64 bit pattern (but most likely doesn't matter)
      // See https://www.khronos.org/registry/webgl/specs/latest/2.0/#5.15
      timeoutLo = timeoutLo >>> 0;
      timeoutHi = timeoutHi >>> 0;
      var timeout = (timeoutLo == 0xFFFFFFFF && timeoutHi == 0xFFFFFFFF) ? -1 : makeBigInt(timeoutLo, timeoutHi, true);
      return GLctx.clientWaitSync(GL.syncs[sync], flags, timeout);
    }

  function _glColorMask(red, green, blue, alpha) {
      GLctx.colorMask(!!red, !!green, !!blue, !!alpha);
    }

  function _glCompileShader(shader) {
      GLctx.compileShader(GL.shaders[shader]);
    }

  function _glCompressedTexImage2D(target, level, internalFormat, width, height, border, imageSize, data) {
      if (GL.currentContext.supportsWebGL2EntryPoints) { // WebGL 2 provides new garbage-free entry points to call to WebGL. Use those always when possible.
        GLctx['compressedTexImage2D'](target, level, internalFormat, width, height, border, HEAPU8, data, imageSize);
        return;
      }
      GLctx['compressedTexImage2D'](target, level, internalFormat, width, height, border, data ? HEAPU8.subarray((data),(data+imageSize)) : null);
    }

  function _glCompressedTexImage3D(target, level, internalFormat, width, height, depth, border, imageSize, data) {
      if (GL.currentContext.supportsWebGL2EntryPoints) { // WebGL 2 provides new garbage-free entry points to call to WebGL. Use those always when possible.
        GLctx['compressedTexImage3D'](target, level, internalFormat, width, height, depth, border, HEAPU8, data, imageSize);
      } else {
        GLctx['compressedTexImage3D'](target, level, internalFormat, width, height, depth, border, data ? HEAPU8.subarray((data),(data+imageSize)) : null);
      }
    }

  function _glCompressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, imageSize, data) {
      if (GL.currentContext.supportsWebGL2EntryPoints) { // WebGL 2 provides new garbage-free entry points to call to WebGL. Use those always when possible.
        GLctx['compressedTexSubImage2D'](target, level, xoffset, yoffset, width, height, format, HEAPU8, data, imageSize);
        return;
      }
      GLctx['compressedTexSubImage2D'](target, level, xoffset, yoffset, width, height, format, data ? HEAPU8.subarray((data),(data+imageSize)) : null);
    }

  function _glCompressedTexSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, imageSize, data) {
      if (GL.currentContext.supportsWebGL2EntryPoints) { // WebGL 2 provides new garbage-free entry points to call to WebGL. Use those always when possible.
        GLctx['compressedTexSubImage3D'](target, level, xoffset, yoffset, zoffset, width, height, depth, format, HEAPU8, data, imageSize);
      } else {
        GLctx['compressedTexSubImage3D'](target, level, xoffset, yoffset, zoffset, width, height, depth, format, data ? HEAPU8.subarray((data),(data+imageSize)) : null);
      }
    }

  function _glCopyBufferSubData(x0, x1, x2, x3, x4) { GLctx['copyBufferSubData'](x0, x1, x2, x3, x4) }

  function _glCopyTexImage2D(x0, x1, x2, x3, x4, x5, x6, x7) { GLctx['copyTexImage2D'](x0, x1, x2, x3, x4, x5, x6, x7) }

  function _glCopyTexSubImage2D(x0, x1, x2, x3, x4, x5, x6, x7) { GLctx['copyTexSubImage2D'](x0, x1, x2, x3, x4, x5, x6, x7) }

  function _glCreateProgram() {
      var id = GL.getNewId(GL.programs);
      var program = GLctx.createProgram();
      program.name = id;
      GL.programs[id] = program;
      return id;
    }

  function _glCreateShader(shaderType) {
      var id = GL.getNewId(GL.shaders);
      GL.shaders[id] = GLctx.createShader(shaderType);
      return id;
    }

  function _glCullFace(x0) { GLctx['cullFace'](x0) }

  function _glDeleteBuffers(n, buffers) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((buffers)+(i*4))>>2)];
        var buffer = GL.buffers[id];
  
        // From spec: "glDeleteBuffers silently ignores 0's and names that do not
        // correspond to existing buffer objects."
        if (!buffer) continue;
  
        GLctx.deleteBuffer(buffer);
        buffer.name = 0;
        GL.buffers[id] = null;
  
        if (id == GL.currArrayBuffer) GL.currArrayBuffer = 0;
        if (id == GL.currElementArrayBuffer) GL.currElementArrayBuffer = 0;
      }
    }

  function _glDeleteFramebuffers(n, framebuffers) {
      for (var i = 0; i < n; ++i) {
        var id = HEAP32[(((framebuffers)+(i*4))>>2)];
        var framebuffer = GL.framebuffers[id];
        if (!framebuffer) continue; // GL spec: "glDeleteFramebuffers silently ignores 0s and names that do not correspond to existing framebuffer objects".
        GLctx.deleteFramebuffer(framebuffer);
        framebuffer.name = 0;
        GL.framebuffers[id] = null;
      }
    }

  function _glDeleteProgram(id) {
      if (!id) return;
      var program = GL.programs[id];
      if (!program) { // glDeleteProgram actually signals an error when deleting a nonexisting object, unlike some other GL delete functions.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      GLctx.deleteProgram(program);
      program.name = 0;
      GL.programs[id] = null;
      GL.programInfos[id] = null;
    }

  function _glDeleteQueries(n, ids) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((ids)+(i*4))>>2)];
        var query = GL.queries[id];
        if (!query) continue; // GL spec: "unused names in ids are ignored, as is the name zero."
        GLctx['deleteQuery'](query);
        GL.queries[id] = null;
      }
    }

  function _glDeleteRenderbuffers(n, renderbuffers) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((renderbuffers)+(i*4))>>2)];
        var renderbuffer = GL.renderbuffers[id];
        if (!renderbuffer) continue; // GL spec: "glDeleteRenderbuffers silently ignores 0s and names that do not correspond to existing renderbuffer objects".
        GLctx.deleteRenderbuffer(renderbuffer);
        renderbuffer.name = 0;
        GL.renderbuffers[id] = null;
      }
    }

  function _glDeleteSamplers(n, samplers) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((samplers)+(i*4))>>2)];
        var sampler = GL.samplers[id];
        if (!sampler) continue;
        GLctx['deleteSampler'](sampler);
        sampler.name = 0;
        GL.samplers[id] = null;
      }
    }

  function _glDeleteShader(id) {
      if (!id) return;
      var shader = GL.shaders[id];
      if (!shader) { // glDeleteShader actually signals an error when deleting a nonexisting object, unlike some other GL delete functions.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      GLctx.deleteShader(shader);
      GL.shaders[id] = null;
    }

  function _glDeleteSync(id) {
      if (!id) return;
      var sync = GL.syncs[id];
      if (!sync) { // glDeleteSync signals an error when deleting a nonexisting object, unlike some other GL delete functions.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      GLctx.deleteSync(sync);
      sync.name = 0;
      GL.syncs[id] = null;
    }

  function _glDeleteTextures(n, textures) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((textures)+(i*4))>>2)];
        var texture = GL.textures[id];
        if (!texture) continue; // GL spec: "glDeleteTextures silently ignores 0s and names that do not correspond to existing textures".
        GLctx.deleteTexture(texture);
        texture.name = 0;
        GL.textures[id] = null;
      }
    }

  function _glDeleteTransformFeedbacks(n, ids) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((ids)+(i*4))>>2)];
        var transformFeedback = GL.transformFeedbacks[id];
        if (!transformFeedback) continue; // GL spec: "unused names in ids are ignored, as is the name zero."
        GLctx['deleteTransformFeedback'](transformFeedback);
        transformFeedback.name = 0;
        GL.transformFeedbacks[id] = null;
      }
    }

  function _glDeleteVertexArrays(n, vaos) {
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((vaos)+(i*4))>>2)];
        GLctx['deleteVertexArray'](GL.vaos[id]);
        GL.vaos[id] = null;
      }
    }

  function _glDepthFunc(x0) { GLctx['depthFunc'](x0) }

  function _glDepthMask(flag) {
      GLctx.depthMask(!!flag);
    }

  function _glDetachShader(program, shader) {
      GLctx.detachShader(GL.programs[program],
                              GL.shaders[shader]);
    }

  function _glDisable(x0) { GLctx['disable'](x0) }

  function _glDisableVertexAttribArray(index) {
      GLctx.disableVertexAttribArray(index);
    }

  function _glDrawArrays(mode, first, count) {
  
      GLctx.drawArrays(mode, first, count);
  
    }

  function _glDrawArraysInstanced(mode, first, count, primcount) {
      GLctx['drawArraysInstanced'](mode, first, count, primcount);
    }

  function _glDrawBuffers(n, bufs) {
  
      var bufArray = GL.tempFixedLengthArray[n];
      for (var i = 0; i < n; i++) {
        bufArray[i] = HEAP32[(((bufs)+(i*4))>>2)];
      }
  
      GLctx['drawBuffers'](bufArray);
    }

  function _glDrawElements(mode, count, type, indices) {
  
      GLctx.drawElements(mode, count, type, indices);
  
    }

  function _glDrawElementsInstanced(mode, count, type, indices, primcount) {
      GLctx['drawElementsInstanced'](mode, count, type, indices, primcount);
    }

  function _glEnable(x0) { GLctx['enable'](x0) }

  function _glEnableVertexAttribArray(index) {
      GLctx.enableVertexAttribArray(index);
    }

  function _glEndQuery(x0) { GLctx['endQuery'](x0) }

  function _glEndTransformFeedback() { GLctx['endTransformFeedback']() }

  function _glFenceSync(condition, flags) {
      var sync = GLctx.fenceSync(condition, flags);
      if (sync) {
        var id = GL.getNewId(GL.syncs);
        sync.name = id;
        GL.syncs[id] = sync;
        return id;
      } else {
        return 0; // Failed to create a sync object
      }
    }

  function _glFinish() { GLctx['finish']() }

  function _glFlush() { GLctx['flush']() }

  
  function emscriptenWebGLGetBufferBinding(target) {
      switch(target) {
        case 0x8892 /*GL_ARRAY_BUFFER*/: target = 0x8894 /*GL_ARRAY_BUFFER_BINDING*/; break;
        case 0x8893 /*GL_ELEMENT_ARRAY_BUFFER*/: target = 0x8895 /*GL_ELEMENT_ARRAY_BUFFER_BINDING*/; break;
        case 0x88EB /*GL_PIXEL_PACK_BUFFER*/: target = 0x88ED /*GL_PIXEL_PACK_BUFFER_BINDING*/; break;
        case 0x88EC /*GL_PIXEL_UNPACK_BUFFER*/: target = 0x88EF /*GL_PIXEL_UNPACK_BUFFER_BINDING*/; break;
        case 0x8C8E /*GL_TRANSFORM_FEEDBACK_BUFFER*/: target = 0x8C8F /*GL_TRANSFORM_FEEDBACK_BUFFER_BINDING*/; break;
        case 0x8F36 /*GL_COPY_READ_BUFFER*/: target = 0x8F36 /*GL_COPY_READ_BUFFER_BINDING*/; break;
        case 0x8F37 /*GL_COPY_WRITE_BUFFER*/: target = 0x8F37 /*GL_COPY_WRITE_BUFFER_BINDING*/; break;
        case 0x8A11 /*GL_UNIFORM_BUFFER*/: target = 0x8A28 /*GL_UNIFORM_BUFFER_BINDING*/; break;
        // In default case, fall through and assume passed one of the _BINDING enums directly.
      }
      var buffer = GLctx.getParameter(target);
      if (buffer) return buffer.name|0;
      else return 0;
    }
  
  function emscriptenWebGLValidateMapBufferTarget(target) {
      switch (target) {
        case 0x8892: // GL_ARRAY_BUFFER
        case 0x8893: // GL_ELEMENT_ARRAY_BUFFER
        case 0x8F36: // GL_COPY_READ_BUFFER
        case 0x8F37: // GL_COPY_WRITE_BUFFER
        case 0x88EB: // GL_PIXEL_PACK_BUFFER
        case 0x88EC: // GL_PIXEL_UNPACK_BUFFER
        case 0x8C2A: // GL_TEXTURE_BUFFER
        case 0x8C8E: // GL_TRANSFORM_FEEDBACK_BUFFER
        case 0x8A11: // GL_UNIFORM_BUFFER
          return true;
        default:
          return false;
      }
    }function _glFlushMappedBufferRange(target, offset, length) {
      if (!emscriptenWebGLValidateMapBufferTarget(target)) {
        GL.recordError(0x0500/*GL_INVALID_ENUM*/);
        err('GL_INVALID_ENUM in glFlushMappedBufferRange');
        return;
      }
  
      var mapping = GL.mappedBuffers[emscriptenWebGLGetBufferBinding(target)];
      if (!mapping) {
        GL.recordError(0x0502 /* GL_INVALID_OPERATION */);
        Module.printError('buffer was never mapped in glFlushMappedBufferRange');
        return;
      }
  
      if (!(mapping.access & 0x10)) {
        GL.recordError(0x0502 /* GL_INVALID_OPERATION */);
        Module.printError('buffer was not mapped with GL_MAP_FLUSH_EXPLICIT_BIT in glFlushMappedBufferRange');
        return;
      }
      if (offset < 0 || length < 0 || offset + length > mapping.length) {
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        Module.printError('invalid range in glFlushMappedBufferRange');
        return;
      }
  
      GLctx.bufferSubData(
        target,
        mapping.offset,
        HEAPU8.subarray(mapping.mem + offset, mapping.mem + offset + length));
    }

  function _glFramebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer) {
      GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget,
                                         GL.renderbuffers[renderbuffer]);
    }

  function _glFramebufferTexture2D(target, attachment, textarget, texture, level) {
      GLctx.framebufferTexture2D(target, attachment, textarget,
                                      GL.textures[texture], level);
    }

  function _glFramebufferTextureLayer(target, attachment, texture, level, layer) {
      GLctx.framebufferTextureLayer(target, attachment, GL.textures[texture], level, layer);
    }

  function _glFrontFace(x0) { GLctx['frontFace'](x0) }

  function _glGenBuffers(n, buffers) {
      for (var i = 0; i < n; i++) {
        var buffer = GLctx.createBuffer();
        if (!buffer) {
          GL.recordError(0x0502 /* GL_INVALID_OPERATION */);
          while(i < n) HEAP32[(((buffers)+(i++*4))>>2)]=0;
          return;
        }
        var id = GL.getNewId(GL.buffers);
        buffer.name = id;
        GL.buffers[id] = buffer;
        HEAP32[(((buffers)+(i*4))>>2)]=id;
      }
    }

  function _glGenFramebuffers(n, ids) {
      for (var i = 0; i < n; ++i) {
        var framebuffer = GLctx.createFramebuffer();
        if (!framebuffer) {
          GL.recordError(0x0502 /* GL_INVALID_OPERATION */);
          while(i < n) HEAP32[(((ids)+(i++*4))>>2)]=0;
          return;
        }
        var id = GL.getNewId(GL.framebuffers);
        framebuffer.name = id;
        GL.framebuffers[id] = framebuffer;
        HEAP32[(((ids)+(i*4))>>2)]=id;
      }
    }

  function _glGenQueries(n, ids) {
      for (var i = 0; i < n; i++) {
        var query = GLctx['createQuery']();
        if (!query) {
          GL.recordError(0x0502 /* GL_INVALID_OPERATION */);
          while(i < n) HEAP32[(((ids)+(i++*4))>>2)]=0;
          return;
        }
        var id = GL.getNewId(GL.queries);
        query.name = id;
        GL.queries[id] = query;
        HEAP32[(((ids)+(i*4))>>2)]=id;
      }
    }

  function _glGenRenderbuffers(n, renderbuffers) {
      for (var i = 0; i < n; i++) {
        var renderbuffer = GLctx.createRenderbuffer();
        if (!renderbuffer) {
          GL.recordError(0x0502 /* GL_INVALID_OPERATION */);
          while(i < n) HEAP32[(((renderbuffers)+(i++*4))>>2)]=0;
          return;
        }
        var id = GL.getNewId(GL.renderbuffers);
        renderbuffer.name = id;
        GL.renderbuffers[id] = renderbuffer;
        HEAP32[(((renderbuffers)+(i*4))>>2)]=id;
      }
    }

  function _glGenSamplers(n, samplers) {
      for (var i = 0; i < n; i++) {
        var sampler = GLctx['createSampler']();
        if (!sampler) {
          GL.recordError(0x0502 /* GL_INVALID_OPERATION */);
          while(i < n) HEAP32[(((samplers)+(i++*4))>>2)]=0;
          return;
        }
        var id = GL.getNewId(GL.samplers);
        sampler.name = id;
        GL.samplers[id] = sampler;
        HEAP32[(((samplers)+(i*4))>>2)]=id;
      }
    }

  function _glGenTextures(n, textures) {
      for (var i = 0; i < n; i++) {
        var texture = GLctx.createTexture();
        if (!texture) {
          GL.recordError(0x0502 /* GL_INVALID_OPERATION */); // GLES + EGL specs don't specify what should happen here, so best to issue an error and create IDs with 0.
          while(i < n) HEAP32[(((textures)+(i++*4))>>2)]=0;
          return;
        }
        var id = GL.getNewId(GL.textures);
        texture.name = id;
        GL.textures[id] = texture;
        HEAP32[(((textures)+(i*4))>>2)]=id;
      }
    }

  function _glGenTransformFeedbacks(n, ids) {
      for (var i = 0; i < n; i++) {
        var transformFeedback = GLctx['createTransformFeedback']();
        if (!transformFeedback) {
          GL.recordError(0x0502 /* GL_INVALID_OPERATION */);
          while(i < n) HEAP32[(((ids)+(i++*4))>>2)]=0;
          return;
        }
        var id = GL.getNewId(GL.transformFeedbacks);
        transformFeedback.name = id;
        GL.transformFeedbacks[id] = transformFeedback;
        HEAP32[(((ids)+(i*4))>>2)]=id;
      }
    }

  function _glGenVertexArrays(n, arrays) {
  
      for (var i = 0; i < n; i++) {
        var vao = GLctx['createVertexArray']();
        if (!vao) {
          GL.recordError(0x0502 /* GL_INVALID_OPERATION */);
          while(i < n) HEAP32[(((arrays)+(i++*4))>>2)]=0;
          return;
        }
        var id = GL.getNewId(GL.vaos);
        vao.name = id;
        GL.vaos[id] = vao;
        HEAP32[(((arrays)+(i*4))>>2)]=id;
      }
    }

  function _glGenerateMipmap(x0) { GLctx['generateMipmap'](x0) }

  function _glGetActiveAttrib(program, index, bufSize, length, size, type, name) {
      program = GL.programs[program];
      var info = GLctx.getActiveAttrib(program, index);
      if (!info) return; // If an error occurs, nothing will be written to length, size and type and name.
  
      if (bufSize > 0 && name) {
        var numBytesWrittenExclNull = stringToUTF8(info.name, name, bufSize);
        if (length) HEAP32[((length)>>2)]=numBytesWrittenExclNull;
      } else {
        if (length) HEAP32[((length)>>2)]=0;
      }
  
      if (size) HEAP32[((size)>>2)]=info.size;
      if (type) HEAP32[((type)>>2)]=info.type;
    }

  function _glGetActiveUniform(program, index, bufSize, length, size, type, name) {
      program = GL.programs[program];
      var info = GLctx.getActiveUniform(program, index);
      if (!info) return; // If an error occurs, nothing will be written to length, size, type and name.
  
      if (bufSize > 0 && name) {
        var numBytesWrittenExclNull = stringToUTF8(info.name, name, bufSize);
        if (length) HEAP32[((length)>>2)]=numBytesWrittenExclNull;
      } else {
        if (length) HEAP32[((length)>>2)]=0;
      }
  
      if (size) HEAP32[((size)>>2)]=info.size;
      if (type) HEAP32[((type)>>2)]=info.type;
    }

  function _glGetActiveUniformBlockName(program, uniformBlockIndex, bufSize, length, uniformBlockName) {
      program = GL.programs[program];
  
      var result = GLctx['getActiveUniformBlockName'](program, uniformBlockIndex);
      if (!result) return; // If an error occurs, nothing will be written to uniformBlockName or length.
      if (uniformBlockName && bufSize > 0) {
        var numBytesWrittenExclNull = stringToUTF8(result, uniformBlockName, bufSize);
        if (length) HEAP32[((length)>>2)]=numBytesWrittenExclNull;
      } else {
        if (length) HEAP32[((length)>>2)]=0;
      }
    }

  function _glGetActiveUniformBlockiv(program, uniformBlockIndex, pname, params) {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if params == null, issue a GL error to notify user about it.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      program = GL.programs[program];
  
      switch(pname) {
        case 0x8A41: /* GL_UNIFORM_BLOCK_NAME_LENGTH */
          var name = GLctx['getActiveUniformBlockName'](program, uniformBlockIndex);
          HEAP32[((params)>>2)]=name.length+1;
          return;
        default:
          var result = GLctx['getActiveUniformBlockParameter'](program, uniformBlockIndex, pname);
          if (!result) return; // If an error occurs, nothing will be written to params.
          if (typeof result == 'number') {
            HEAP32[((params)>>2)]=result;
          } else {
            for (var i = 0; i < result.length; i++) {
              HEAP32[(((params)+(i*4))>>2)]=result[i];
            }
          }
      }
    }

  function _glGetActiveUniformsiv(program, uniformCount, uniformIndices, pname, params) {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if params == null, issue a GL error to notify user about it.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      if (uniformCount > 0 && uniformIndices == 0) {
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      program = GL.programs[program];
      var ids = [];
      for (var i = 0; i < uniformCount; i++) {
        ids.push(HEAP32[(((uniformIndices)+(i*4))>>2)]);
      }
  
      var result = GLctx['getActiveUniforms'](program, ids, pname);
      if (!result) return; // GL spec: If an error is generated, nothing is written out to params.
  
      var len = result.length;
      for (var i = 0; i < len; i++) {
        HEAP32[(((params)+(i*4))>>2)]=result[i];
      }
    }

  function _glGetAttribLocation(program, name) {
      return GLctx.getAttribLocation(GL.programs[program], Pointer_stringify(name));
    }

  function _glGetError() {
      // First return any GL error generated by the emscripten library_gl.js interop layer.
      if (GL.lastError) {
        var error = GL.lastError;
        GL.lastError = 0/*GL_NO_ERROR*/;
        return error;
      } else { // If there were none, return the GL error from the browser GL context.
        return GLctx.getError();
      }
    }

  function _glGetFramebufferAttachmentParameteriv(target, attachment, pname, params) {
      var result = GLctx.getFramebufferAttachmentParameter(target, attachment, pname);
      if (result instanceof WebGLRenderbuffer ||
          result instanceof WebGLTexture) {
        result = result.name | 0;
      }
      HEAP32[((params)>>2)]=result;
    }

  
  function emscriptenWebGLGetIndexed(target, index, data, type) {
      if (!data) {
        // GLES2 specification does not specify how to behave if data is a null pointer. Since calling this function does not make sense
        // if data == null, issue a GL error to notify user about it.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      var result = GLctx['getIndexedParameter'](target, index);
      var ret;
      switch (typeof result) {
        case 'boolean':
          ret = result ? 1 : 0;
          break;
        case 'number':
          ret = result;
          break;
        case 'object':
          if (result === null) {
            switch (target) {
              case 0x8C8F: // TRANSFORM_FEEDBACK_BUFFER_BINDING
              case 0x8A28: // UNIFORM_BUFFER_BINDING
                ret = 0;
                break;
              default: {
                GL.recordError(0x0500); // GL_INVALID_ENUM
                return;
              }
            }
          } else if (result instanceof WebGLBuffer) {
            ret = result.name | 0;
          } else {
            GL.recordError(0x0500); // GL_INVALID_ENUM
            return;
          }
          break;
        default:
          GL.recordError(0x0500); // GL_INVALID_ENUM
          return;
      }
  
      switch (type) {
        case 'Integer64': (tempI64 = [ret>>>0,(tempDouble=ret,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((data)>>2)]=tempI64[0],HEAP32[(((data)+(4))>>2)]=tempI64[1]);    break;
        case 'Integer': HEAP32[((data)>>2)]=ret;    break;
        case 'Float':   HEAPF32[((data)>>2)]=ret;  break;
        case 'Boolean': HEAP8[((data)>>0)]=ret ? 1 : 0; break;
        default: throw 'internal emscriptenWebGLGetIndexed() error, bad type: ' + type;
      }
    }function _glGetIntegeri_v(target, index, data) {
      emscriptenWebGLGetIndexed(target, index, data, 'Integer');
    }

  
  function emscriptenWebGLGet(name_, p, type) {
      // Guard against user passing a null pointer.
      // Note that GLES2 spec does not say anything about how passing a null pointer should be treated.
      // Testing on desktop core GL 3, the application crashes on glGetIntegerv to a null pointer, but
      // better to report an error instead of doing anything random.
      if (!p) {
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      var ret = undefined;
      switch(name_) { // Handle a few trivial GLES values
        case 0x8DFA: // GL_SHADER_COMPILER
          ret = 1;
          break;
        case 0x8DF8: // GL_SHADER_BINARY_FORMATS
          if (type !== 'Integer' && type !== 'Integer64') {
            GL.recordError(0x0500); // GL_INVALID_ENUM
          }
          return; // Do not write anything to the out pointer, since no binary formats are supported.
        case 0x87FE: // GL_NUM_PROGRAM_BINARY_FORMATS
        case 0x8DF9: // GL_NUM_SHADER_BINARY_FORMATS
          ret = 0;
          break;
        case 0x86A2: // GL_NUM_COMPRESSED_TEXTURE_FORMATS
          // WebGL doesn't have GL_NUM_COMPRESSED_TEXTURE_FORMATS (it's obsolete since GL_COMPRESSED_TEXTURE_FORMATS returns a JS array that can be queried for length),
          // so implement it ourselves to allow C++ GLES2 code get the length.
          var formats = GLctx.getParameter(0x86A3 /*GL_COMPRESSED_TEXTURE_FORMATS*/);
          ret = formats.length;
          break;
        case 0x821D: // GL_NUM_EXTENSIONS
          if (GLctx.canvas.GLctxObject.version < 2) {
            GL.recordError(0x0502 /* GL_INVALID_OPERATION */); // Calling GLES3/WebGL2 function with a GLES2/WebGL1 context
            return;
          }
          var exts = GLctx.getSupportedExtensions();
          ret = 2*exts.length; // each extension is duplicated, first in unprefixed WebGL form, and then a second time with "GL_" prefix.
          break;
        case 0x821B: // GL_MAJOR_VERSION
        case 0x821C: // GL_MINOR_VERSION
          if (GLctx.canvas.GLctxObject.version < 2) {
            GL.recordError(0x0500); // GL_INVALID_ENUM
            return;
          }
          ret = name_ == 0x821B ? 3 : 0; // return version 3.0
          break;
      }
  
      if (ret === undefined) {
        var result = GLctx.getParameter(name_);
        switch (typeof(result)) {
          case "number":
            ret = result;
            break;
          case "boolean":
            ret = result ? 1 : 0;
            break;
          case "string":
            GL.recordError(0x0500); // GL_INVALID_ENUM
            return;
          case "object":
            if (result === null) {
              // null is a valid result for some (e.g., which buffer is bound - perhaps nothing is bound), but otherwise
              // can mean an invalid name_, which we need to report as an error
              switch(name_) {
                case 0x8894: // ARRAY_BUFFER_BINDING
                case 0x8B8D: // CURRENT_PROGRAM
                case 0x8895: // ELEMENT_ARRAY_BUFFER_BINDING
                case 0x8CA6: // FRAMEBUFFER_BINDING
                case 0x8CA7: // RENDERBUFFER_BINDING
                case 0x8069: // TEXTURE_BINDING_2D
                case 0x85B5: // GL_VERTEX_ARRAY_BINDING
                case 0x8919: // GL_SAMPLER_BINDING
                case 0x8E25: // GL_TRANSFORM_FEEDBACK_BINDING
                case 0x8514: { // TEXTURE_BINDING_CUBE_MAP
                  ret = 0;
                  break;
                }
                default: {
                  GL.recordError(0x0500); // GL_INVALID_ENUM
                  return;
                }
              }
            } else if (result instanceof Float32Array ||
                       result instanceof Uint32Array ||
                       result instanceof Int32Array ||
                       result instanceof Array) {
              for (var i = 0; i < result.length; ++i) {
                switch (type) {
                  case 'Integer': HEAP32[(((p)+(i*4))>>2)]=result[i];   break;
                  case 'Float':   HEAPF32[(((p)+(i*4))>>2)]=result[i]; break;
                  case 'Boolean': HEAP8[(((p)+(i))>>0)]=result[i] ? 1 : 0;    break;
                  default: throw 'internal glGet error, bad type: ' + type;
                }
              }
              return;
            } else if (result instanceof WebGLBuffer ||
                       result instanceof WebGLProgram ||
                       result instanceof WebGLFramebuffer ||
                       result instanceof WebGLRenderbuffer ||
                       result instanceof WebGLQuery ||
                       result instanceof WebGLSampler ||
                       result instanceof WebGLSync ||
                       result instanceof WebGLTransformFeedback ||
                       result instanceof WebGLVertexArrayObject ||
                       result instanceof WebGLTexture) {
              ret = result.name | 0;
            } else {
              GL.recordError(0x0500); // GL_INVALID_ENUM
              return;
            }
            break;
          default:
            GL.recordError(0x0500); // GL_INVALID_ENUM
            return;
        }
      }
  
      switch (type) {
        case 'Integer64': (tempI64 = [ret>>>0,(tempDouble=ret,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((p)>>2)]=tempI64[0],HEAP32[(((p)+(4))>>2)]=tempI64[1]);    break;
        case 'Integer': HEAP32[((p)>>2)]=ret;    break;
        case 'Float':   HEAPF32[((p)>>2)]=ret;  break;
        case 'Boolean': HEAP8[((p)>>0)]=ret ? 1 : 0; break;
        default: throw 'internal glGet error, bad type: ' + type;
      }
    }function _glGetIntegerv(name_, p) {
      emscriptenWebGLGet(name_, p, 'Integer');
    }

  function _glGetInternalformativ(target, internalformat, pname, bufSize, params) {
      if (bufSize < 0) {
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      var samples = GLctx['getInternalformatParameter'](target, internalformat, 0x80A9 /*GL_SAMPLES*/);
      if (!samples) {
        // probably target != GL_RENDERBUFFER or bad internalformat
        GL.recordError(0x0500 /* GL_INVALID_ENUM */);
        return;
      }
      switch(pname) {
        case 0x80A9 /*GL_SAMPLES*/:
          var n = Math.min(bufSize, samples.length);
          for (var i = 0; i < n; i++) {
            var v = samples[i];
            HEAP32[(((params)+(i*4))>>2)]=v;
          }
          break;
        case 0x9380 /*GL_NUM_SAMPLE_COUNTS*/:
          if (bufSize > 1) {
            var v = samples.length;
            HEAP32[((params)>>2)]=v;
          }
          break;
        default:
          GL.recordError(0x0500 /* GL_INVALID_ENUM */);
      }
    }

  function _glGetProgramBinary(program, bufSize, length, binaryFormat, binary) {
      GL.recordError(0x0502/*GL_INVALID_OPERATION*/);
    }

  function _glGetProgramInfoLog(program, maxLength, length, infoLog) {
      var log = GLctx.getProgramInfoLog(GL.programs[program]);
      if (log === null) log = '(unknown error)';
  
      if (maxLength > 0 && infoLog) {
        var numBytesWrittenExclNull = stringToUTF8(log, infoLog, maxLength);
        if (length) HEAP32[((length)>>2)]=numBytesWrittenExclNull;
      } else {
        if (length) HEAP32[((length)>>2)]=0;
      }
    }

  function _glGetProgramiv(program, pname, p) {
      if (!p) {
        // GLES2 specification does not specify how to behave if p is a null pointer. Since calling this function does not make sense
        // if p == null, issue a GL error to notify user about it.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
  
      if (program >= GL.counter) {
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
  
      var ptable = GL.programInfos[program];
      if (!ptable) {
        GL.recordError(0x0502 /* GL_INVALID_OPERATION */);
        return;
      }
  
      if (pname == 0x8B84) { // GL_INFO_LOG_LENGTH
        var log = GLctx.getProgramInfoLog(GL.programs[program]);
        if (log === null) log = '(unknown error)';
        HEAP32[((p)>>2)]=log.length + 1;
      } else if (pname == 0x8B87 /* GL_ACTIVE_UNIFORM_MAX_LENGTH */) {
        HEAP32[((p)>>2)]=ptable.maxUniformLength;
      } else if (pname == 0x8B8A /* GL_ACTIVE_ATTRIBUTE_MAX_LENGTH */) {
        if (ptable.maxAttributeLength == -1) {
          program = GL.programs[program];
          var numAttribs = GLctx.getProgramParameter(program, GLctx.ACTIVE_ATTRIBUTES);
          ptable.maxAttributeLength = 0; // Spec says if there are no active attribs, 0 must be returned.
          for (var i = 0; i < numAttribs; ++i) {
            var activeAttrib = GLctx.getActiveAttrib(program, i);
            ptable.maxAttributeLength = Math.max(ptable.maxAttributeLength, activeAttrib.name.length+1);
          }
        }
        HEAP32[((p)>>2)]=ptable.maxAttributeLength;
      } else if (pname == 0x8A35 /* GL_ACTIVE_UNIFORM_BLOCK_MAX_NAME_LENGTH */) {
        if (ptable.maxUniformBlockNameLength == -1) {
          program = GL.programs[program];
          var numBlocks = GLctx.getProgramParameter(program, GLctx.ACTIVE_UNIFORM_BLOCKS);
          ptable.maxUniformBlockNameLength = 0;
          for (var i = 0; i < numBlocks; ++i) {
            var activeBlockName = GLctx.getActiveUniformBlockName(program, i);
            ptable.maxUniformBlockNameLength = Math.max(ptable.maxUniformBlockNameLength, activeBlockName.length+1);
          }
        }
        HEAP32[((p)>>2)]=ptable.maxUniformBlockNameLength;
      } else {
        HEAP32[((p)>>2)]=GLctx.getProgramParameter(GL.programs[program], pname);
      }
    }

  function _glGetRenderbufferParameteriv(target, pname, params) {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if params == null, issue a GL error to notify user about it.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      HEAP32[((params)>>2)]=GLctx.getRenderbufferParameter(target, pname);
    }

  function _glGetShaderInfoLog(shader, maxLength, length, infoLog) {
      var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
      if (log === null) log = '(unknown error)';
      if (maxLength > 0 && infoLog) {
        var numBytesWrittenExclNull = stringToUTF8(log, infoLog, maxLength);
        if (length) HEAP32[((length)>>2)]=numBytesWrittenExclNull;
      } else {
        if (length) HEAP32[((length)>>2)]=0;
      }
    }

  function _glGetShaderPrecisionFormat(shaderType, precisionType, range, precision) {
      var result = GLctx.getShaderPrecisionFormat(shaderType, precisionType);
      HEAP32[((range)>>2)]=result.rangeMin;
      HEAP32[(((range)+(4))>>2)]=result.rangeMax;
      HEAP32[((precision)>>2)]=result.precision;
    }

  function _glGetShaderSource(shader, bufSize, length, source) {
      var result = GLctx.getShaderSource(GL.shaders[shader]);
      if (!result) return; // If an error occurs, nothing will be written to length or source.
      if (bufSize > 0 && source) {
        var numBytesWrittenExclNull = stringToUTF8(result, source, bufSize);
        if (length) HEAP32[((length)>>2)]=numBytesWrittenExclNull;
      } else {
        if (length) HEAP32[((length)>>2)]=0;
      }
    }

  function _glGetShaderiv(shader, pname, p) {
      if (!p) {
        // GLES2 specification does not specify how to behave if p is a null pointer. Since calling this function does not make sense
        // if p == null, issue a GL error to notify user about it.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      if (pname == 0x8B84) { // GL_INFO_LOG_LENGTH
        var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
        if (log === null) log = '(unknown error)';
        HEAP32[((p)>>2)]=log.length + 1;
      } else if (pname == 0x8B88) { // GL_SHADER_SOURCE_LENGTH
        var source = GLctx.getShaderSource(GL.shaders[shader]);
        var sourceLength = (source === null || source.length == 0) ? 0 : source.length + 1;
        HEAP32[((p)>>2)]=sourceLength;
      } else {
        HEAP32[((p)>>2)]=GLctx.getShaderParameter(GL.shaders[shader], pname);
      }
    }

  function _glGetString(name_) {
      if (GL.stringCache[name_]) return GL.stringCache[name_];
      var ret;
      switch(name_) {
        case 0x1F00 /* GL_VENDOR */:
        case 0x1F01 /* GL_RENDERER */:
        case 0x9245 /* UNMASKED_VENDOR_WEBGL */:
        case 0x9246 /* UNMASKED_RENDERER_WEBGL */:
          ret = allocate(intArrayFromString(GLctx.getParameter(name_)), 'i8', ALLOC_NORMAL);
          break;
        case 0x1F02 /* GL_VERSION */:
          var glVersion = GLctx.getParameter(GLctx.VERSION);
          // return GLES version string corresponding to the version of the WebGL context
          if (GLctx.canvas.GLctxObject.version >= 2) glVersion = 'OpenGL ES 3.0 (' + glVersion + ')';
          else
          {
            glVersion = 'OpenGL ES 2.0 (' + glVersion + ')';
          }
          ret = allocate(intArrayFromString(glVersion), 'i8', ALLOC_NORMAL);
          break;
        case 0x1F03 /* GL_EXTENSIONS */:
          var exts = GLctx.getSupportedExtensions();
          var gl_exts = [];
          for (var i = 0; i < exts.length; ++i) {
            gl_exts.push(exts[i]);
            gl_exts.push("GL_" + exts[i]);
          }
          ret = allocate(intArrayFromString(gl_exts.join(' ')), 'i8', ALLOC_NORMAL);
          break;
        case 0x8B8C /* GL_SHADING_LANGUAGE_VERSION */:
          var glslVersion = GLctx.getParameter(GLctx.SHADING_LANGUAGE_VERSION);
          // extract the version number 'N.M' from the string 'WebGL GLSL ES N.M ...'
          var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
          var ver_num = glslVersion.match(ver_re);
          if (ver_num !== null) {
            if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + '0'; // ensure minor version has 2 digits
            glslVersion = 'OpenGL ES GLSL ES ' + ver_num[1] + ' (' + glslVersion + ')';
          }
          ret = allocate(intArrayFromString(glslVersion), 'i8', ALLOC_NORMAL);
          break;
        default:
          GL.recordError(0x0500/*GL_INVALID_ENUM*/);
          return 0;
      }
      GL.stringCache[name_] = ret;
      return ret;
    }

  function _glGetStringi(name, index) {
      if (GLctx.canvas.GLctxObject.version < 2) {
        GL.recordError(0x0502 /* GL_INVALID_OPERATION */); // Calling GLES3/WebGL2 function with a GLES2/WebGL1 context
        return 0;
      }
      var stringiCache = GL.stringiCache[name];
      if (stringiCache) {
        if (index < 0 || index >= stringiCache.length) {
          GL.recordError(0x0501/*GL_INVALID_VALUE*/);
          return 0;
        }
        return stringiCache[index];
      }
      switch(name) {
        case 0x1F03 /* GL_EXTENSIONS */:
          var exts = GLctx.getSupportedExtensions();
          var gl_exts = [];
          // each extension is duplicated, first in unprefixed WebGL form, and then a second time with "GL_" prefix.
          for (var i = 0; i < exts.length; ++i) {
            gl_exts.push(allocate(intArrayFromString(exts[i]), 'i8', ALLOC_NORMAL));
            gl_exts.push(allocate(intArrayFromString("GL_" + exts[i]), 'i8', ALLOC_NORMAL));
          }
          stringiCache = GL.stringiCache[name] = gl_exts;
          if (index < 0 || index >= stringiCache.length) {
            GL.recordError(0x0501/*GL_INVALID_VALUE*/);
            return 0;
          }
          return stringiCache[index];
        default:
          GL.recordError(0x0500/*GL_INVALID_ENUM*/);
          return 0;
      }
    }

  function _glGetTexParameteriv(target, pname, params) {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if p == null, issue a GL error to notify user about it.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      HEAP32[((params)>>2)]=GLctx.getTexParameter(target, pname);
    }

  function _glGetUniformBlockIndex(program, uniformBlockName) {
      program = GL.programs[program];
      uniformBlockName = Pointer_stringify(uniformBlockName);
      return GLctx['getUniformBlockIndex'](program, uniformBlockName);
    }

  function _glGetUniformIndices(program, uniformCount, uniformNames, uniformIndices) {
      if (!uniformIndices) {
        // GLES2 specification does not specify how to behave if uniformIndices is a null pointer. Since calling this function does not make sense
        // if uniformIndices == null, issue a GL error to notify user about it.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      if (uniformCount > 0 && (uniformNames == 0 || uniformIndices == 0)) {
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      program = GL.programs[program];
      var names = [];
      for (var i = 0; i < uniformCount; i++)
        names.push(Pointer_stringify(HEAP32[(((uniformNames)+(i*4))>>2)]));
  
      var result = GLctx['getUniformIndices'](program, names);
      if (!result) return; // GL spec: If an error is generated, nothing is written out to uniformIndices.
  
      var len = result.length;
      for (var i = 0; i < len; i++) {
        HEAP32[(((uniformIndices)+(i*4))>>2)]=result[i];
      }
    }

  function _glGetUniformLocation(program, name) {
      name = Pointer_stringify(name);
  
      var arrayOffset = 0;
      // If user passed an array accessor "[index]", parse the array index off the accessor.
      if (name.indexOf(']', name.length-1) !== -1) {
        var ls = name.lastIndexOf('[');
        var arrayIndex = name.slice(ls+1, -1);
        if (arrayIndex.length > 0) {
          arrayOffset = parseInt(arrayIndex);
          if (arrayOffset < 0) {
            return -1;
          }
        }
        name = name.slice(0, ls);
      }
  
      var ptable = GL.programInfos[program];
      if (!ptable) {
        return -1;
      }
      var utable = ptable.uniforms;
      var uniformInfo = utable[name]; // returns pair [ dimension_of_uniform_array, uniform_location ]
      if (uniformInfo && arrayOffset < uniformInfo[0]) { // Check if user asked for an out-of-bounds element, i.e. for 'vec4 colors[3];' user could ask for 'colors[10]' which should return -1.
        return uniformInfo[1]+arrayOffset;
      } else {
        return -1;
      }
    }

  
  function emscriptenWebGLGetUniform(program, location, params, type) {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if params == null, issue a GL error to notify user about it.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      var data = GLctx.getUniform(GL.programs[program], GL.uniforms[location]);
      if (typeof data == 'number' || typeof data == 'boolean') {
        switch (type) {
          case 'Integer': HEAP32[((params)>>2)]=data; break;
          case 'Float': HEAPF32[((params)>>2)]=data; break;
          default: throw 'internal emscriptenWebGLGetUniform() error, bad type: ' + type;
        }
      } else {
        for (var i = 0; i < data.length; i++) {
          switch (type) {
            case 'Integer': HEAP32[(((params)+(i*4))>>2)]=data[i]; break;
            case 'Float': HEAPF32[(((params)+(i*4))>>2)]=data[i]; break;
            default: throw 'internal emscriptenWebGLGetUniform() error, bad type: ' + type;
          }
        }
      }
    }function _glGetUniformiv(program, location, params) {
      emscriptenWebGLGetUniform(program, location, params, 'Integer');
    }

  
  function emscriptenWebGLGetVertexAttrib(index, pname, params, type) {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if params == null, issue a GL error to notify user about it.
        GL.recordError(0x0501 /* GL_INVALID_VALUE */);
        return;
      }
      var data = GLctx.getVertexAttrib(index, pname);
      if (pname == 0x889F/*VERTEX_ATTRIB_ARRAY_BUFFER_BINDING*/) {
        HEAP32[((params)>>2)]=data["name"];
      } else if (typeof data == 'number' || typeof data == 'boolean') {
        switch (type) {
          case 'Integer': HEAP32[((params)>>2)]=data; break;
          case 'Float': HEAPF32[((params)>>2)]=data; break;
          case 'FloatToInteger': HEAP32[((params)>>2)]=Math.fround(data); break;
          default: throw 'internal emscriptenWebGLGetVertexAttrib() error, bad type: ' + type;
        }
      } else {
        for (var i = 0; i < data.length; i++) {
          switch (type) {
            case 'Integer': HEAP32[(((params)+(i*4))>>2)]=data[i]; break;
            case 'Float': HEAPF32[(((params)+(i*4))>>2)]=data[i]; break;
            case 'FloatToInteger': HEAP32[(((params)+(i*4))>>2)]=Math.fround(data[i]); break;
            default: throw 'internal emscriptenWebGLGetVertexAttrib() error, bad type: ' + type;
          }
        }
      }
    }function _glGetVertexAttribiv(index, pname, params) {
      // N.B. This function may only be called if the vertex attribute was specified using the function glVertexAttrib*f(),
      // otherwise the results are undefined. (GLES3 spec 6.1.12)
      emscriptenWebGLGetVertexAttrib(index, pname, params, 'FloatToInteger');
    }

  function _glInvalidateFramebuffer(target, numAttachments, attachments) {
      var list = GL.tempFixedLengthArray[numAttachments];
      for (var i = 0; i < numAttachments; i++) {
        list[i] = HEAP32[(((attachments)+(i*4))>>2)];
      }
  
      GLctx['invalidateFramebuffer'](target, list);
    }

  function _glIsEnabled(x0) { return GLctx['isEnabled'](x0) }

  function _glIsVertexArray(array) {
  
      var vao = GL.vaos[array];
      if (!vao) return 0;
      return GLctx['isVertexArray'](vao);
    }

  function _glLinkProgram(program) {
      GLctx.linkProgram(GL.programs[program]);
      GL.programInfos[program] = null; // uniforms no longer keep the same names after linking
      GL.populateUniformTable(program);
    }

  function _glMapBufferRange(target, offset, length, access) {
      if (access != 0x1A && access != 0xA) {
        err("glMapBufferRange is only supported when access is MAP_WRITE|INVALIDATE_BUFFER");
        return 0;
      }
  
      if (!emscriptenWebGLValidateMapBufferTarget(target)) {
        GL.recordError(0x0500/*GL_INVALID_ENUM*/);
        err('GL_INVALID_ENUM in glMapBufferRange');
        return 0;
      }
  
      var mem = _malloc(length);
      if (!mem) return 0;
  
      GL.mappedBuffers[emscriptenWebGLGetBufferBinding(target)] = {
        offset: offset,
        length: length,
        mem: mem,
        access: access,
      };
      return mem;
    }

  function _glPixelStorei(pname, param) {
      if (pname == 0x0D05 /* GL_PACK_ALIGNMENT */) {
        GL.packAlignment = param;
      } else if (pname == 0x0cf5 /* GL_UNPACK_ALIGNMENT */) {
        GL.unpackAlignment = param;
      }
      GLctx.pixelStorei(pname, param);
    }

  function _glPolygonOffset(x0, x1) { GLctx['polygonOffset'](x0, x1) }

  function _glProgramBinary(program, binaryFormat, binary, length) {
      GL.recordError(0x0500/*GL_INVALID_ENUM*/);
    }

  function _glProgramParameteri(program, pname, value) {
      GL.recordError(0x0500/*GL_INVALID_ENUM*/);
    }

  function _glReadBuffer(x0) { GLctx['readBuffer'](x0) }

  
  
  function emscriptenWebGLComputeImageSize(width, height, sizePerPixel, alignment) {
      function roundedToNextMultipleOf(x, y) {
        return Math.floor((x + y - 1) / y) * y
      }
      var plainRowSize = width * sizePerPixel;
      var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
      return (height <= 0) ? 0 :
               ((height - 1) * alignedRowSize + plainRowSize);
    }function emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) {
      var sizePerPixel;
      var numChannels;
      switch(format) {
        case 0x1906 /* GL_ALPHA */:
        case 0x1909 /* GL_LUMINANCE */:
        case 0x1902 /* GL_DEPTH_COMPONENT */:
        case 0x1903 /* GL_RED */:
        case 0x8D94 /* GL_RED_INTEGER */:
          numChannels = 1;
          break;
        case 0x190A /* GL_LUMINANCE_ALPHA */:
        case 0x8227 /* GL_RG */:
        case 0x8228 /* GL_RG_INTEGER*/:
          numChannels = 2;
          break;
        case 0x1907 /* GL_RGB */:
        case 0x8C40 /* GL_SRGB_EXT */:
        case 0x8D98 /* GL_RGB_INTEGER */:
          numChannels = 3;
          break;
        case 0x1908 /* GL_RGBA */:
        case 0x8C42 /* GL_SRGB_ALPHA_EXT */:
        case 0x8D99 /* GL_RGBA_INTEGER */:
          numChannels = 4;
          break;
        default:
          GL.recordError(0x0500); // GL_INVALID_ENUM
          return null;
      }
      switch (type) {
        case 0x1401 /* GL_UNSIGNED_BYTE */:
        case 0x1400 /* GL_BYTE */:
          sizePerPixel = numChannels*1;
          break;
        case 0x1403 /* GL_UNSIGNED_SHORT */:
        case 0x8D61 /* GL_HALF_FLOAT_OES */:
        case 0x140B /* GL_HALF_FLOAT */:
        case 0x1402 /* GL_SHORT */:
          sizePerPixel = numChannels*2;
          break;
        case 0x1405 /* GL_UNSIGNED_INT */:
        case 0x1406 /* GL_FLOAT */:
        case 0x1404 /* GL_INT */:
          sizePerPixel = numChannels*4;
          break;
        case 0x84FA /* GL_UNSIGNED_INT_24_8_WEBGL/GL_UNSIGNED_INT_24_8 */:
        case 0x8C3E /* GL_UNSIGNED_INT_5_9_9_9_REV */:
        case 0x8368 /* GL_UNSIGNED_INT_2_10_10_10_REV */:
        case 0x8C3B /* GL_UNSIGNED_INT_10F_11F_11F_REV */:
        case 0x84FA /* GL_UNSIGNED_INT_24_8 */:
          sizePerPixel = 4;
          break;
        case 0x8363 /* GL_UNSIGNED_SHORT_5_6_5 */:
        case 0x8033 /* GL_UNSIGNED_SHORT_4_4_4_4 */:
        case 0x8034 /* GL_UNSIGNED_SHORT_5_5_5_1 */:
          sizePerPixel = 2;
          break;
        default:
          GL.recordError(0x0500); // GL_INVALID_ENUM
          return null;
      }
      var bytes = emscriptenWebGLComputeImageSize(width, height, sizePerPixel, GL.unpackAlignment);
      switch(type) {
        case 0x1400 /* GL_BYTE */:
          return HEAP8.subarray((pixels),(pixels+bytes));
        case 0x1401 /* GL_UNSIGNED_BYTE */:
          return HEAPU8.subarray((pixels),(pixels+bytes));
        case 0x1402 /* GL_SHORT */:
          return HEAP16.subarray((pixels)>>1,(pixels+bytes)>>1);
        case 0x1404 /* GL_INT */:
          return HEAP32.subarray((pixels)>>2,(pixels+bytes)>>2);
        case 0x1406 /* GL_FLOAT */:
          return HEAPF32.subarray((pixels)>>2,(pixels+bytes)>>2);
        case 0x1405 /* GL_UNSIGNED_INT */:
        case 0x84FA /* GL_UNSIGNED_INT_24_8_WEBGL/GL_UNSIGNED_INT_24_8 */:
        case 0x8C3E /* GL_UNSIGNED_INT_5_9_9_9_REV */:
        case 0x8368 /* GL_UNSIGNED_INT_2_10_10_10_REV */:
        case 0x8C3B /* GL_UNSIGNED_INT_10F_11F_11F_REV */:
        case 0x84FA /* GL_UNSIGNED_INT_24_8 */:
          return HEAPU32.subarray((pixels)>>2,(pixels+bytes)>>2);
        case 0x1403 /* GL_UNSIGNED_SHORT */:
        case 0x8363 /* GL_UNSIGNED_SHORT_5_6_5 */:
        case 0x8033 /* GL_UNSIGNED_SHORT_4_4_4_4 */:
        case 0x8034 /* GL_UNSIGNED_SHORT_5_5_5_1 */:
        case 0x8D61 /* GL_HALF_FLOAT_OES */:
        case 0x140B /* GL_HALF_FLOAT */:
          return HEAPU16.subarray((pixels)>>1,(pixels+bytes)>>1);
        default:
          GL.recordError(0x0500); // GL_INVALID_ENUM
          return null;
      }
    }
  
  function emscriptenWebGLGetHeapForType(type) {
      switch(type) {
        case 0x1400 /* GL_BYTE */:
          return HEAP8;
        case 0x1401 /* GL_UNSIGNED_BYTE */:
          return HEAPU8;
        case 0x1402 /* GL_SHORT */:
          return HEAP16;
        case 0x1403 /* GL_UNSIGNED_SHORT */:
        case 0x8363 /* GL_UNSIGNED_SHORT_5_6_5 */:
        case 0x8033 /* GL_UNSIGNED_SHORT_4_4_4_4 */:
        case 0x8034 /* GL_UNSIGNED_SHORT_5_5_5_1 */:
        case 0x8D61 /* GL_HALF_FLOAT_OES */:
        case 0x140B /* GL_HALF_FLOAT */:
          return HEAPU16;
        case 0x1404 /* GL_INT */:
          return HEAP32;
        case 0x1405 /* GL_UNSIGNED_INT */:
        case 0x84FA /* GL_UNSIGNED_INT_24_8_WEBGL/GL_UNSIGNED_INT_24_8 */:
        case 0x8C3E /* GL_UNSIGNED_INT_5_9_9_9_REV */:
        case 0x8368 /* GL_UNSIGNED_INT_2_10_10_10_REV */:
        case 0x8C3B /* GL_UNSIGNED_INT_10F_11F_11F_REV */:
        case 0x84FA /* GL_UNSIGNED_INT_24_8 */:
          return HEAPU32;
        case 0x1406 /* GL_FLOAT */:
          return HEAPF32;
        default:
          return null;
      }
    }
  
  function emscriptenWebGLGetShiftForType(type) {
      switch(type) {
        case 0x1400 /* GL_BYTE */:
        case 0x1401 /* GL_UNSIGNED_BYTE */:
          return 0;
        case 0x1402 /* GL_SHORT */:
        case 0x1403 /* GL_UNSIGNED_SHORT */:
        case 0x8363 /* GL_UNSIGNED_SHORT_5_6_5 */:
        case 0x8033 /* GL_UNSIGNED_SHORT_4_4_4_4 */:
        case 0x8034 /* GL_UNSIGNED_SHORT_5_5_5_1 */:
        case 0x8D61 /* GL_HALF_FLOAT_OES */:
        case 0x140B /* GL_HALF_FLOAT */:
          return 1;
        case 0x1404 /* GL_INT */:
        case 0x1406 /* GL_FLOAT */:
        case 0x1405 /* GL_UNSIGNED_INT */:
        case 0x84FA /* GL_UNSIGNED_INT_24_8_WEBGL/GL_UNSIGNED_INT_24_8 */:
        case 0x8C3E /* GL_UNSIGNED_INT_5_9_9_9_REV */:
        case 0x8368 /* GL_UNSIGNED_INT_2_10_10_10_REV */:
        case 0x8C3B /* GL_UNSIGNED_INT_10F_11F_11F_REV */:
        case 0x84FA /* GL_UNSIGNED_INT_24_8 */:
          return 2;
        default:
          return 0;
      }
    }function _glReadPixels(x, y, width, height, format, type, pixels) {
      if (GL.currentContext.supportsWebGL2EntryPoints) { // WebGL 2 provides new garbage-free entry points to call to WebGL. Use those always when possible.
        if (GLctx.currentPixelPackBufferBinding) {
          GLctx.readPixels(x, y, width, height, format, type, pixels);
        } else {
          GLctx.readPixels(x, y, width, height, format, type, emscriptenWebGLGetHeapForType(type), pixels >> emscriptenWebGLGetShiftForType(type));
        }
        return;
      }
      var pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, format);
      if (!pixelData) {
        GL.recordError(0x0500/*GL_INVALID_ENUM*/);
        return;
      }
      GLctx.readPixels(x, y, width, height, format, type, pixelData);
    }

  function _glRenderbufferStorage(x0, x1, x2, x3) { GLctx['renderbufferStorage'](x0, x1, x2, x3) }

  function _glRenderbufferStorageMultisample(x0, x1, x2, x3, x4) { GLctx['renderbufferStorageMultisample'](x0, x1, x2, x3, x4) }

  function _glSamplerParameteri(sampler, pname, param) {
      GLctx['samplerParameteri'](sampler ? GL.samplers[sampler] : null, pname, param);
    }

  function _glScissor(x0, x1, x2, x3) { GLctx['scissor'](x0, x1, x2, x3) }

  function _glShaderSource(shader, count, string, length) {
      var source = GL.getSource(shader, count, string, length);
  
  
      GLctx.shaderSource(GL.shaders[shader], source);
    }

  function _glStencilFuncSeparate(x0, x1, x2, x3) { GLctx['stencilFuncSeparate'](x0, x1, x2, x3) }

  function _glStencilMask(x0) { GLctx['stencilMask'](x0) }

  function _glStencilOpSeparate(x0, x1, x2, x3) { GLctx['stencilOpSeparate'](x0, x1, x2, x3) }

  function _glTexImage2D(target, level, internalFormat, width, height, border, format, type, pixels) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        // WebGL 2 provides new garbage-free entry points to call to WebGL. Use those always when possible.
        if (GLctx.currentPixelUnpackBufferBinding) {
          GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels);
        } else if (pixels != 0) {
          GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, emscriptenWebGLGetHeapForType(type), pixels >> emscriptenWebGLGetShiftForType(type));
        } else {
          GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, null);
        }
        return;
      }
  
      var pixelData = null;
      if (pixels) pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat);
      GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixelData);
    }

  function _glTexImage3D(target, level, internalFormat, width, height, depth, border, format, type, pixels) {
      if (GLctx.currentPixelUnpackBufferBinding) {
        GLctx['texImage3D'](target, level, internalFormat, width, height, depth, border, format, type, pixels);
      } else if (pixels != 0) {
        GLctx['texImage3D'](target, level, internalFormat, width, height, depth, border, format, type, emscriptenWebGLGetHeapForType(type), pixels >> emscriptenWebGLGetShiftForType(type));
      } else {
        GLctx['texImage3D'](target, level, internalFormat, width, height, depth, border, format, type, null);
      }
    }

  function _glTexParameterf(x0, x1, x2) { GLctx['texParameterf'](x0, x1, x2) }

  function _glTexParameteri(x0, x1, x2) { GLctx['texParameteri'](x0, x1, x2) }

  function _glTexParameteriv(target, pname, params) {
      var param = HEAP32[((params)>>2)];
      GLctx.texParameteri(target, pname, param);
    }

  function _glTexStorage2D(x0, x1, x2, x3, x4) { GLctx['texStorage2D'](x0, x1, x2, x3, x4) }

  function _glTexStorage3D(x0, x1, x2, x3, x4, x5) { GLctx['texStorage3D'](x0, x1, x2, x3, x4, x5) }

  function _glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels) {
      if (GL.currentContext.supportsWebGL2EntryPoints) {
        // WebGL 2 provides new garbage-free entry points to call to WebGL. Use those always when possible.
        if (GLctx.currentPixelUnpackBufferBinding) {
          GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels);
        } else if (pixels != 0) {
          GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, emscriptenWebGLGetHeapForType(type), pixels >> emscriptenWebGLGetShiftForType(type));
        } else {
          GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, null);
        }
        return;
      }
      var pixelData = null;
      if (pixels) pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, 0);
      GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData);
    }

  function _glTexSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, pixels) {
      if (GLctx.currentPixelUnpackBufferBinding) {
        GLctx['texSubImage3D'](target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, pixels);
      } else if (pixels != 0) {
        GLctx['texSubImage3D'](target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, emscriptenWebGLGetHeapForType(type), pixels >> emscriptenWebGLGetShiftForType(type));
      } else {
        GLctx['texSubImage3D'](target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, null);
      }
    }

  function _glTransformFeedbackVaryings(program, count, varyings, bufferMode) {
      program = GL.programs[program];
      var vars = [];
      for (var i = 0; i < count; i++)
        vars.push(Pointer_stringify(HEAP32[(((varyings)+(i*4))>>2)]));
  
      GLctx['transformFeedbackVaryings'](program, vars, bufferMode);
    }

  function _glUniform1fv(location, count, value) {
  
      if (GL.currentContext.supportsWebGL2EntryPoints) { // WebGL 2 provides new garbage-free entry points to call to WebGL. Use those always when possible.
        GLctx.uniform1fv(GL.uniforms[location], HEAPF32, value>>2, count);
        return;
      }
  
      var view;
      if (count <= GL.MINI_TEMP_BUFFER_SIZE) {
        // avoid allocation when uploading few enough uniforms
        view = GL.miniTempBufferViews[count-1];
        for (var i = 0; i < count; ++i) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
        }
      } else {
        view = HEAPF32.subarray((value)>>2,(value+count*4)>>2);
      }
      GLctx.uniform1fv(GL.uniforms[location], view);
    }

  function _glUniform1i(location, v0) {
      GLctx.uniform1i(GL.uniforms[location], v0);
    }

  function _glUniform1iv(location, count, value) {
  
      if (GL.currentContext.supportsWebGL2EntryPoints) { // WebGL 2 provides new garbage-free entry points to call to WebGL. Use those always when possible.
        GLctx.uniform1iv(GL.uniforms[location], HEAP32, value>>2, count);
        return;
      }
  
      GLctx.uniform1iv(GL.uniforms[location], HEAP32.subarray((value)>>2,(value+count*4)>>2));
    }

  function _glUniform1uiv(location, count, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) { // WebGL 2 provides new garbage-free entry points to call to WebGL. Use those always when possible.
        GLctx.uniform1uiv(GL.uniforms[location], HEAPU32, value>>2, count);
      } else {
        GLctx.uniform1uiv(GL.uniforms[location], HEAPU32.subarray((value)>>2,(value+count*4)>>2));
      }
    }

  function _glUniform2fv(location, count, value) {
  
      if (GL.currentContext.supportsWebGL2EntryPoints) { // WebGL 2 provides new garbage-free entry points to call to WebGL. Use those always when possible.
        GLctx.uniform2fv(GL.uniforms[location], HEAPF32, value>>2, count*2);
        return;
      }
  
      var view;
      if (2*count <= GL.MINI_TEMP_BUFFER_SIZE) {
        // avoid allocation when uploading few enough uniforms
        view = GL.miniTempBufferViews[2*count-1];
        for (var i = 0; i < 2*count; i += 2) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
          view[i+1] = HEAPF32[(((value)+(4*i+4))>>2)];
        }
      } else {
        view = HEAPF32.subarray((value)>>2,(value+count*8)>>2);
      }
      GLctx.uniform2fv(GL.uniforms[location], view);
    }

  function _glUniform2iv(location, count, value) {
  
      if (GL.currentContext.supportsWebGL2EntryPoints) { // WebGL 2 provides new garbage-free entry points to call to WebGL. Use those always when possible.
        GLctx.uniform2iv(GL.uniforms[location], HEAP32, value>>2, count*2);
        return;
      }
  
      GLctx.uniform2iv(GL.uniforms[location], HEAP32.subarray((value)>>2,(value+count*8)>>2));
    }

  function _glUniform2uiv(location, count, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) { // WebGL 2 provides new garbage-free entry points to call to WebGL. Use those always when possible.
        GLctx.uniform2uiv(GL.uniforms[location], HEAPU32, value>>2, count*2);
      } else {
        GLctx.uniform2uiv(GL.uniforms[location], HEAPU32.subarray((value)>>2,(value+count*8)>>2));
      }
    }

  function _glUniform3fv(location, count, value) {
  
      if (GL.currentContext.supportsWebGL2EntryPoints) { // WebGL 2 provides new garbage-free entry points to call to WebGL. Use those always when possible.
        GLctx.uniform3fv(GL.uniforms[location], HEAPF32, value>>2, count*3);
        return;
      }
  
      var view;
      if (3*count <= GL.MINI_TEMP_BUFFER_SIZE) {
        // avoid allocation when uploading few enough uniforms
        view = GL.miniTempBufferViews[3*count-1];
        for (var i = 0; i < 3*count; i += 3) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
          view[i+1] = HEAPF32[(((value)+(4*i+4))>>2)];
          view[i+2] = HEAPF32[(((value)+(4*i+8))>>2)];
        }
      } else {
        view = HEAPF32.subarray((value)>>2,(value+count*12)>>2);
      }
      GLctx.uniform3fv(GL.uniforms[location], view);
    }

  function _glUniform3iv(location, count, value) {
  
      if (GL.currentContext.supportsWebGL2EntryPoints) { // WebGL 2 provides new garbage-free entry points to call to WebGL. Use those always when possible.
        GLctx.uniform3iv(GL.uniforms[location], HEAP32, value>>2, count*3);
        return;
      }
  
      GLctx.uniform3iv(GL.uniforms[location], HEAP32.subarray((value)>>2,(value+count*12)>>2));
    }

  function _glUniform3uiv(location, count, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) { // WebGL 2 provides new garbage-free entry points to call to WebGL. Use those always when possible.
        GLctx.uniform3uiv(GL.uniforms[location], HEAPU32, value>>2, count*3);
      } else {
        GLctx.uniform3uiv(GL.uniforms[location], HEAPU32.subarray((value)>>2,(value+count*12)>>2));
      }
    }

  function _glUniform4fv(location, count, value) {
  
      if (GL.currentContext.supportsWebGL2EntryPoints) { // WebGL 2 provides new garbage-free entry points to call to WebGL. Use those always when possible.
        GLctx.uniform4fv(GL.uniforms[location], HEAPF32, value>>2, count*4);
        return;
      }
  
      var view;
      if (4*count <= GL.MINI_TEMP_BUFFER_SIZE) {
        // avoid allocation when uploading few enough uniforms
        view = GL.miniTempBufferViews[4*count-1];
        for (var i = 0; i < 4*count; i += 4) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
          view[i+1] = HEAPF32[(((value)+(4*i+4))>>2)];
          view[i+2] = HEAPF32[(((value)+(4*i+8))>>2)];
          view[i+3] = HEAPF32[(((value)+(4*i+12))>>2)];
        }
      } else {
        view = HEAPF32.subarray((value)>>2,(value+count*16)>>2);
      }
      GLctx.uniform4fv(GL.uniforms[location], view);
    }

  function _glUniform4iv(location, count, value) {
  
      if (GL.currentContext.supportsWebGL2EntryPoints) { // WebGL 2 provides new garbage-free entry points to call to WebGL. Use those always when possible.
        GLctx.uniform4iv(GL.uniforms[location], HEAP32, value>>2, count*4);
        return;
      }
  
      GLctx.uniform4iv(GL.uniforms[location], HEAP32.subarray((value)>>2,(value+count*16)>>2));
    }

  function _glUniform4uiv(location, count, value) {
      if (GL.currentContext.supportsWebGL2EntryPoints) { // WebGL 2 provides new garbage-free entry points to call to WebGL. Use those always when possible.
        GLctx.uniform4uiv(GL.uniforms[location], HEAPU32, value>>2, count*4);
      } else {
        GLctx.uniform4uiv(GL.uniforms[location], HEAPU32.subarray((value)>>2,(value+count*16)>>2));
      }
    }

  function _glUniformBlockBinding(program, uniformBlockIndex, uniformBlockBinding) {
      program = GL.programs[program];
  
      GLctx['uniformBlockBinding'](program, uniformBlockIndex, uniformBlockBinding);
    }

  function _glUniformMatrix3fv(location, count, transpose, value) {
  
      if (GL.currentContext.supportsWebGL2EntryPoints) { // WebGL 2 provides new garbage-free entry points to call to WebGL. Use those always when possible.
        GLctx.uniformMatrix3fv(GL.uniforms[location], !!transpose, HEAPF32, value>>2, count*9);
        return;
      }
  
      var view;
      if (9*count <= GL.MINI_TEMP_BUFFER_SIZE) {
        // avoid allocation when uploading few enough uniforms
        view = GL.miniTempBufferViews[9*count-1];
        for (var i = 0; i < 9*count; i += 9) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
          view[i+1] = HEAPF32[(((value)+(4*i+4))>>2)];
          view[i+2] = HEAPF32[(((value)+(4*i+8))>>2)];
          view[i+3] = HEAPF32[(((value)+(4*i+12))>>2)];
          view[i+4] = HEAPF32[(((value)+(4*i+16))>>2)];
          view[i+5] = HEAPF32[(((value)+(4*i+20))>>2)];
          view[i+6] = HEAPF32[(((value)+(4*i+24))>>2)];
          view[i+7] = HEAPF32[(((value)+(4*i+28))>>2)];
          view[i+8] = HEAPF32[(((value)+(4*i+32))>>2)];
        }
      } else {
        view = HEAPF32.subarray((value)>>2,(value+count*36)>>2);
      }
      GLctx.uniformMatrix3fv(GL.uniforms[location], !!transpose, view);
    }

  function _glUniformMatrix4fv(location, count, transpose, value) {
  
      if (GL.currentContext.supportsWebGL2EntryPoints) { // WebGL 2 provides new garbage-free entry points to call to WebGL. Use those always when possible.
        GLctx.uniformMatrix4fv(GL.uniforms[location], !!transpose, HEAPF32, value>>2, count*16);
        return;
      }
  
      var view;
      if (16*count <= GL.MINI_TEMP_BUFFER_SIZE) {
        // avoid allocation when uploading few enough uniforms
        view = GL.miniTempBufferViews[16*count-1];
        for (var i = 0; i < 16*count; i += 16) {
          view[i] = HEAPF32[(((value)+(4*i))>>2)];
          view[i+1] = HEAPF32[(((value)+(4*i+4))>>2)];
          view[i+2] = HEAPF32[(((value)+(4*i+8))>>2)];
          view[i+3] = HEAPF32[(((value)+(4*i+12))>>2)];
          view[i+4] = HEAPF32[(((value)+(4*i+16))>>2)];
          view[i+5] = HEAPF32[(((value)+(4*i+20))>>2)];
          view[i+6] = HEAPF32[(((value)+(4*i+24))>>2)];
          view[i+7] = HEAPF32[(((value)+(4*i+28))>>2)];
          view[i+8] = HEAPF32[(((value)+(4*i+32))>>2)];
          view[i+9] = HEAPF32[(((value)+(4*i+36))>>2)];
          view[i+10] = HEAPF32[(((value)+(4*i+40))>>2)];
          view[i+11] = HEAPF32[(((value)+(4*i+44))>>2)];
          view[i+12] = HEAPF32[(((value)+(4*i+48))>>2)];
          view[i+13] = HEAPF32[(((value)+(4*i+52))>>2)];
          view[i+14] = HEAPF32[(((value)+(4*i+56))>>2)];
          view[i+15] = HEAPF32[(((value)+(4*i+60))>>2)];
        }
      } else {
        view = HEAPF32.subarray((value)>>2,(value+count*64)>>2);
      }
      GLctx.uniformMatrix4fv(GL.uniforms[location], !!transpose, view);
    }

  function _glUnmapBuffer(target) {
      if (!emscriptenWebGLValidateMapBufferTarget(target)) {
        GL.recordError(0x0500/*GL_INVALID_ENUM*/);
        err('GL_INVALID_ENUM in glUnmapBuffer');
        return 0;
      }
  
      var buffer = emscriptenWebGLGetBufferBinding(target);
      var mapping = GL.mappedBuffers[buffer];
      if (!mapping) {
        GL.recordError(0x0502 /* GL_INVALID_OPERATION */);
        Module.printError('buffer was never mapped in glUnmapBuffer');
        return 0;
      }
      GL.mappedBuffers[buffer] = null;
  
      if (!(mapping.access & 0x10)) /* GL_MAP_FLUSH_EXPLICIT_BIT */
        if (GL.currentContext.supportsWebGL2EntryPoints) { // WebGL 2 provides new garbage-free entry points to call to WebGL. Use those always when possible.
          GLctx.bufferSubData(target, mapping.offset, HEAPU8, mapping.mem, mapping.length);
        } else {
          GLctx.bufferSubData(target, mapping.offset, HEAPU8.subarray(mapping.mem, mapping.mem+mapping.length));
        }
      _free(mapping.mem);
      return 1;
    }

  function _glUseProgram(program) {
      GLctx.useProgram(program ? GL.programs[program] : null);
    }

  function _glValidateProgram(program) {
      GLctx.validateProgram(GL.programs[program]);
    }

  function _glVertexAttrib4f(x0, x1, x2, x3, x4) { GLctx['vertexAttrib4f'](x0, x1, x2, x3, x4) }

  function _glVertexAttrib4fv(index, v) {
  
      GLctx.vertexAttrib4f(index, HEAPF32[v>>2], HEAPF32[v+4>>2], HEAPF32[v+8>>2], HEAPF32[v+12>>2]);
    }

  function _glVertexAttribIPointer(index, size, type, stride, ptr) {
      var cb = GL.currentContext.clientBuffers[index];
      if (!GL.currArrayBuffer) {
        cb.size = size;
        cb.type = type;
        cb.normalized = false;
        cb.stride = stride;
        cb.ptr = ptr;
        cb.clientside = true;
        return;
      }
      cb.clientside = false;
      GLctx.vertexAttribIPointer(index, size, type, stride, ptr);
    }

  function _glVertexAttribPointer(index, size, type, normalized, stride, ptr) {
      GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr);
    }

  function _glViewport(x0, x1, x2, x3) { GLctx['viewport'](x0, x1, x2, x3) }

  
  var ___tm_current=STATICTOP; STATICTOP += 48;;
  
  
  var ___tm_timezone=allocate(intArrayFromString("GMT"), "i8", ALLOC_STATIC);function _gmtime_r(time, tmPtr) {
      var date = new Date(HEAP32[((time)>>2)]*1000);
      HEAP32[((tmPtr)>>2)]=date.getUTCSeconds();
      HEAP32[(((tmPtr)+(4))>>2)]=date.getUTCMinutes();
      HEAP32[(((tmPtr)+(8))>>2)]=date.getUTCHours();
      HEAP32[(((tmPtr)+(12))>>2)]=date.getUTCDate();
      HEAP32[(((tmPtr)+(16))>>2)]=date.getUTCMonth();
      HEAP32[(((tmPtr)+(20))>>2)]=date.getUTCFullYear()-1900;
      HEAP32[(((tmPtr)+(24))>>2)]=date.getUTCDay();
      HEAP32[(((tmPtr)+(36))>>2)]=0;
      HEAP32[(((tmPtr)+(32))>>2)]=0;
      var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
      var yday = ((date.getTime() - start) / (1000 * 60 * 60 * 24))|0;
      HEAP32[(((tmPtr)+(28))>>2)]=yday;
      HEAP32[(((tmPtr)+(40))>>2)]=___tm_timezone;
  
      return tmPtr;
    }function _gmtime(time) {
      return _gmtime_r(time, ___tm_current);
    }

  function _inet_addr(ptr) {
      var addr = __inet_pton4_raw(Pointer_stringify(ptr));
      if (addr === null) {
        return -1;
      }
      return addr;
    }

   

   

  var _llvm_ceil_f32=Math_ceil;

  var _llvm_ceil_f64=Math_ceil;

  function _llvm_copysign_f64(x, y) {
      return y < 0 || (y === 0 && 1/y < 0) ? -Math_abs(x) : Math_abs(x);
    }

  var _llvm_cos_f32=Math_cos;

  var _llvm_ctlz_i32=true;

   

   

  function _llvm_cttz_i32(x) { // Note: Currently doesn't take isZeroUndef()
      x = x | 0;
      return (x ? (31 - (Math_clz32((x ^ (x - 1))) | 0) | 0) : 32) | 0;
    }

  function _llvm_eh_typeid_for(type) {
      return type;
    }

  function _llvm_exp2_f32(x) {
      return Math.pow(2, x);
    }

  var _llvm_fabs_f32=Math_abs;

  var _llvm_fabs_f64=Math_abs;

  var _llvm_floor_f32=Math_floor;

  var _llvm_floor_f64=Math_floor;

  function _llvm_log10_f32(x) {
      return Math.log(x) / Math.LN10; // TODO: Math.log10, when browser support is there
    }

  function _llvm_log2_f32(x) {
      return Math.log(x) / Math.LN2; // TODO: Math.log2, when browser support is there
    }

   

   

   

  var _llvm_nacl_atomic_cmpxchg_i32=undefined;

  var _llvm_pow_f64=Math_pow;

   

  var _llvm_sin_f32=Math_sin;

  var _llvm_sqrt_f32=Math_sqrt;

  function _llvm_stackrestore(p) {
      var self = _llvm_stacksave;
      var ret = self.LLVM_SAVEDSTACKS[p];
      self.LLVM_SAVEDSTACKS.splice(p, 1);
      stackRestore(ret);
    }

  function _llvm_stacksave() {
      var self = _llvm_stacksave;
      if (!self.LLVM_SAVEDSTACKS) {
        self.LLVM_SAVEDSTACKS = [];
      }
      self.LLVM_SAVEDSTACKS.push(stackSave());
      return self.LLVM_SAVEDSTACKS.length-1;
    }

  function _llvm_trap() {
      abort('trap!');
    }

  var _llvm_trunc_f32=Math_trunc;

  
  
  function _tzset() {
      // TODO: Use (malleable) environment variables instead of system settings.
      if (_tzset.called) return;
      _tzset.called = true;
  
      // timezone is specified as seconds west of UTC ("The external variable
      // `timezone` shall be set to the difference, in seconds, between
      // Coordinated Universal Time (UTC) and local standard time."), the same
      // as returned by getTimezoneOffset().
      // See http://pubs.opengroup.org/onlinepubs/009695399/functions/tzset.html
      HEAP32[((__get_timezone())>>2)]=(new Date()).getTimezoneOffset() * 60;
  
      var currentYear = new Date().getFullYear();
      var winter = new Date(currentYear, 0, 1);
      var summer = new Date(currentYear, 6, 1);
      HEAP32[((__get_daylight())>>2)]=Number(winter.getTimezoneOffset() != summer.getTimezoneOffset());
  
      function extractZone(date) {
        var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
        return match ? match[1] : "GMT";
      };
      var winterName = extractZone(winter);
      var summerName = extractZone(summer);
      var winterNamePtr = allocate(intArrayFromString(winterName), 'i8', ALLOC_NORMAL);
      var summerNamePtr = allocate(intArrayFromString(summerName), 'i8', ALLOC_NORMAL);
      if (summer.getTimezoneOffset() < winter.getTimezoneOffset()) {
        // Northern hemisphere
        HEAP32[((__get_tzname())>>2)]=winterNamePtr;
        HEAP32[(((__get_tzname())+(4))>>2)]=summerNamePtr;
      } else {
        HEAP32[((__get_tzname())>>2)]=summerNamePtr;
        HEAP32[(((__get_tzname())+(4))>>2)]=winterNamePtr;
      }
    }function _localtime_r(time, tmPtr) {
      _tzset();
      var date = new Date(HEAP32[((time)>>2)]*1000);
      HEAP32[((tmPtr)>>2)]=date.getSeconds();
      HEAP32[(((tmPtr)+(4))>>2)]=date.getMinutes();
      HEAP32[(((tmPtr)+(8))>>2)]=date.getHours();
      HEAP32[(((tmPtr)+(12))>>2)]=date.getDate();
      HEAP32[(((tmPtr)+(16))>>2)]=date.getMonth();
      HEAP32[(((tmPtr)+(20))>>2)]=date.getFullYear()-1900;
      HEAP32[(((tmPtr)+(24))>>2)]=date.getDay();
  
      var start = new Date(date.getFullYear(), 0, 1);
      var yday = ((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))|0;
      HEAP32[(((tmPtr)+(28))>>2)]=yday;
      HEAP32[(((tmPtr)+(36))>>2)]=-(date.getTimezoneOffset() * 60);
  
      // Attention: DST is in December in South, and some regions don't have DST at all.
      var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
      var winterOffset = start.getTimezoneOffset();
      var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset))|0;
      HEAP32[(((tmPtr)+(32))>>2)]=dst;
  
      var zonePtr = HEAP32[(((__get_tzname())+(dst ? 4 : 0))>>2)];
      HEAP32[(((tmPtr)+(40))>>2)]=zonePtr;
  
      return tmPtr;
    }function _localtime(time) {
      return _localtime_r(time, ___tm_current);
    }

  
   
  
   function _longjmp(env, value) {
      Module['setThrew'](env, value || 1);
      throw 'longjmp';
    }

  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    } 

   

   

  function _mktime(tmPtr) {
      _tzset();
      var date = new Date(HEAP32[(((tmPtr)+(20))>>2)] + 1900,
                          HEAP32[(((tmPtr)+(16))>>2)],
                          HEAP32[(((tmPtr)+(12))>>2)],
                          HEAP32[(((tmPtr)+(8))>>2)],
                          HEAP32[(((tmPtr)+(4))>>2)],
                          HEAP32[((tmPtr)>>2)],
                          0);
  
      // There's an ambiguous hour when the time goes back; the tm_isdst field is
      // used to disambiguate it.  Date() basically guesses, so we fix it up if it
      // guessed wrong, or fill in tm_isdst with the guess if it's -1.
      var dst = HEAP32[(((tmPtr)+(32))>>2)];
      var guessedOffset = date.getTimezoneOffset();
      var start = new Date(date.getFullYear(), 0, 1);
      var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
      var winterOffset = start.getTimezoneOffset();
      var dstOffset = Math.min(winterOffset, summerOffset); // DST is in December in South
      if (dst < 0) {
        // Attention: some regions don't have DST at all.
        HEAP32[(((tmPtr)+(32))>>2)]=Number(summerOffset != winterOffset && dstOffset == guessedOffset);
      } else if ((dst > 0) != (dstOffset == guessedOffset)) {
        var nonDstOffset = Math.max(winterOffset, summerOffset);
        var trueOffset = dst > 0 ? dstOffset : nonDstOffset;
        // Don't try setMinutes(date.getMinutes() + ...) -- it's messed up.
        date.setTime(date.getTime() + (trueOffset - guessedOffset)*60000);
      }
  
      HEAP32[(((tmPtr)+(24))>>2)]=date.getDay();
      var yday = ((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))|0;
      HEAP32[(((tmPtr)+(28))>>2)]=yday;
  
      return (date.getTime() / 1000)|0;
    }

  
  function _usleep(useconds) {
      // int usleep(useconds_t useconds);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/usleep.html
      // We're single-threaded, so use a busy loop. Super-ugly.
      var msec = useconds / 1000;
      if ((ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && self['performance'] && self['performance']['now']) {
        var start = self['performance']['now']();
        while (self['performance']['now']() - start < msec) {
          // Do nothing.
        }
      } else {
        var start = Date.now();
        while (Date.now() - start < msec) {
          // Do nothing.
        }
      }
      return 0;
    }function _nanosleep(rqtp, rmtp) {
      // int nanosleep(const struct timespec  *rqtp, struct timespec *rmtp);
      var seconds = HEAP32[((rqtp)>>2)];
      var nanoseconds = HEAP32[(((rqtp)+(4))>>2)];
      if (rmtp !== 0) {
        HEAP32[((rmtp)>>2)]=0;
        HEAP32[(((rmtp)+(4))>>2)]=0;
      }
      return _usleep((seconds * 1e6) + (nanoseconds / 1000));
    }

   

  function _pthread_cond_destroy() { return 0; }

  function _pthread_cond_init() { return 0; }

  function _pthread_cond_timedwait() { return 0; }

  function _pthread_cond_wait() { return 0; }

  function _pthread_equal(x, y) { return x == y }

  
  var PTHREAD_SPECIFIC={};function _pthread_getspecific(key) {
      return PTHREAD_SPECIFIC[key] || 0;
    }

  
  var PTHREAD_SPECIFIC_NEXT_KEY=1;function _pthread_key_create(key, destructor) {
      if (key == 0) {
        return ERRNO_CODES.EINVAL;
      }
      HEAP32[((key)>>2)]=PTHREAD_SPECIFIC_NEXT_KEY;
      // values start at 0
      PTHREAD_SPECIFIC[PTHREAD_SPECIFIC_NEXT_KEY] = 0;
      PTHREAD_SPECIFIC_NEXT_KEY++;
      return 0;
    }

  function _pthread_key_delete(key) {
      if (key in PTHREAD_SPECIFIC) {
        delete PTHREAD_SPECIFIC[key];
        return 0;
      }
      return ERRNO_CODES.EINVAL;
    }

  function _pthread_mutex_destroy() {}

  function _pthread_mutex_init() {}

   

   

  function _pthread_mutexattr_destroy() {}

  function _pthread_mutexattr_init() {}

  function _pthread_mutexattr_setprotocol() {}

  function _pthread_mutexattr_settype() {}

  function _pthread_once(ptr, func) {
      if (!_pthread_once.seen) _pthread_once.seen = {};
      if (ptr in _pthread_once.seen) return;
      Module['dynCall_v'](func);
      _pthread_once.seen[ptr] = 1;
    }

  function _pthread_setspecific(key, value) {
      if (!(key in PTHREAD_SPECIFIC)) {
        return ERRNO_CODES.EINVAL;
      }
      PTHREAD_SPECIFIC[key] = value;
      return 0;
    }

   

  function _sched_yield() {
      return 0;
    }

  function _setenv(envname, envval, overwrite) {
      // int setenv(const char *envname, const char *envval, int overwrite);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/setenv.html
      if (envname === 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      }
      var name = Pointer_stringify(envname);
      var val = Pointer_stringify(envval);
      if (name === '' || name.indexOf('=') !== -1) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      }
      if (ENV.hasOwnProperty(name) && !overwrite) return 0;
      ENV[name] = val;
      ___buildEnvironment(__get_environ());
      return 0;
    }

  function _sigaction(signum, act, oldact) {
      //int sigaction(int signum, const struct sigaction *act, struct sigaction *oldact);
      return 0;
    }

  function _sigemptyset(set) {
      HEAP32[((set)>>2)]=0;
      return 0;
    }

  
  function __isLeapYear(year) {
        return year%4 === 0 && (year%100 !== 0 || year%400 === 0);
    }
  
  function __arraySum(array, index) {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]);
      return sum;
    }
  
  
  var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];
  
  var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];function __addDays(date, days) {
      var newDate = new Date(date.getTime());
      while(days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
  
        if (days > daysInCurrentMonth-newDate.getDate()) {
          // we spill over to next month
          days -= (daysInCurrentMonth-newDate.getDate()+1);
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth+1)
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear()+1);
          }
        } else {
          // we stay in current month
          newDate.setDate(newDate.getDate()+days);
          return newDate;
        }
      }
  
      return newDate;
    }function _strftime(s, maxsize, format, tm) {
      // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
  
      var tm_zone = HEAP32[(((tm)+(40))>>2)];
  
      var date = {
        tm_sec: HEAP32[((tm)>>2)],
        tm_min: HEAP32[(((tm)+(4))>>2)],
        tm_hour: HEAP32[(((tm)+(8))>>2)],
        tm_mday: HEAP32[(((tm)+(12))>>2)],
        tm_mon: HEAP32[(((tm)+(16))>>2)],
        tm_year: HEAP32[(((tm)+(20))>>2)],
        tm_wday: HEAP32[(((tm)+(24))>>2)],
        tm_yday: HEAP32[(((tm)+(28))>>2)],
        tm_isdst: HEAP32[(((tm)+(32))>>2)],
        tm_gmtoff: HEAP32[(((tm)+(36))>>2)],
        tm_zone: tm_zone ? Pointer_stringify(tm_zone) : ''
      };
  
      var pattern = Pointer_stringify(format);
  
      // expand format
      var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
        '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
        '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
        '%h': '%b',                       // Equivalent to %b
        '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
        '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
        '%T': '%H:%M:%S',                 // Replaced by the time
        '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
        '%X': '%H:%M:%S'                  // Replaced by the locale's appropriate date representation
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
      }
  
      var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
      function leadingSomething(value, digits, character) {
        var str = typeof value === 'number' ? value.toString() : (value || '');
        while (str.length < digits) {
          str = character[0]+str;
        }
        return str;
      };
  
      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, '0');
      };
  
      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : (value > 0 ? 1 : 0);
        };
  
        var compare;
        if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
            compare = sgn(date1.getDate()-date2.getDate());
          }
        }
        return compare;
      };
  
      function getFirstWeekStartDate(janFourth) {
          switch (janFourth.getDay()) {
            case 0: // Sunday
              return new Date(janFourth.getFullYear()-1, 11, 29);
            case 1: // Monday
              return janFourth;
            case 2: // Tuesday
              return new Date(janFourth.getFullYear(), 0, 3);
            case 3: // Wednesday
              return new Date(janFourth.getFullYear(), 0, 2);
            case 4: // Thursday
              return new Date(janFourth.getFullYear(), 0, 1);
            case 5: // Friday
              return new Date(janFourth.getFullYear()-1, 11, 31);
            case 6: // Saturday
              return new Date(janFourth.getFullYear()-1, 11, 30);
          }
      };
  
      function getWeekBasedYear(date) {
          var thisDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
  
          var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
          var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);
  
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  
          if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            // this date is after the start of the first week of this year
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
              return thisDate.getFullYear()+1;
            } else {
              return thisDate.getFullYear();
            }
          } else {
            return thisDate.getFullYear()-1;
          }
      };
  
      var EXPANSION_RULES_2 = {
        '%a': function(date) {
          return WEEKDAYS[date.tm_wday].substring(0,3);
        },
        '%A': function(date) {
          return WEEKDAYS[date.tm_wday];
        },
        '%b': function(date) {
          return MONTHS[date.tm_mon].substring(0,3);
        },
        '%B': function(date) {
          return MONTHS[date.tm_mon];
        },
        '%C': function(date) {
          var year = date.tm_year+1900;
          return leadingNulls((year/100)|0,2);
        },
        '%d': function(date) {
          return leadingNulls(date.tm_mday, 2);
        },
        '%e': function(date) {
          return leadingSomething(date.tm_mday, 2, ' ');
        },
        '%g': function(date) {
          // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year.
          // In this system, weeks begin on a Monday and week 1 of the year is the week that includes
          // January 4th, which is also the week that includes the first Thursday of the year, and
          // is also the first week that contains at least four days in the year.
          // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of
          // the last week of the preceding year; thus, for Saturday 2nd January 1999,
          // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th,
          // or 31st is a Monday, it and any following days are part of week 1 of the following year.
          // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
  
          return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': function(date) {
          return getWeekBasedYear(date);
        },
        '%H': function(date) {
          return leadingNulls(date.tm_hour, 2);
        },
        '%I': function(date) {
          var twelveHour = date.tm_hour;
          if (twelveHour == 0) twelveHour = 12;
          else if (twelveHour > 12) twelveHour -= 12;
          return leadingNulls(twelveHour, 2);
        },
        '%j': function(date) {
          // Day of the year (001-366)
          return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
        },
        '%m': function(date) {
          return leadingNulls(date.tm_mon+1, 2);
        },
        '%M': function(date) {
          return leadingNulls(date.tm_min, 2);
        },
        '%n': function() {
          return '\n';
        },
        '%p': function(date) {
          if (date.tm_hour >= 0 && date.tm_hour < 12) {
            return 'AM';
          } else {
            return 'PM';
          }
        },
        '%S': function(date) {
          return leadingNulls(date.tm_sec, 2);
        },
        '%t': function() {
          return '\t';
        },
        '%u': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay() || 7;
        },
        '%U': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53].
          // The first Sunday of January is the first day of week 1;
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year+1900, 0, 1);
          var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7-janFirst.getDay());
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
  
          // is target date after the first Sunday?
          if (compareByDay(firstSunday, endDate) < 0) {
            // calculate difference in days between first Sunday and endDate
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstSundayUntilEndJanuary = 31-firstSunday.getDate();
            var days = firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
  
          return compareByDay(firstSunday, janFirst) === 0 ? '01': '00';
        },
        '%V': function(date) {
          // Replaced by the week number of the year (Monday as the first day of the week)
          // as a decimal number [01,53]. If the week containing 1 January has four
          // or more days in the new year, then it is considered week 1.
          // Otherwise, it is the last week of the previous year, and the next week is week 1.
          // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
          var janFourthThisYear = new Date(date.tm_year+1900, 0, 4);
          var janFourthNextYear = new Date(date.tm_year+1901, 0, 4);
  
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  
          var endDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
  
          if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
            // if given date is before this years first week, then it belongs to the 53rd week of last year
            return '53';
          }
  
          if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
            // if given date is after next years first week, then it belongs to the 01th week of next year
            return '01';
          }
  
          // given date is in between CW 01..53 of this calendar year
          var daysDifference;
          if (firstWeekStartThisYear.getFullYear() < date.tm_year+1900) {
            // first CW of this year starts last year
            daysDifference = date.tm_yday+32-firstWeekStartThisYear.getDate()
          } else {
            // first CW of this year starts this year
            daysDifference = date.tm_yday+1-firstWeekStartThisYear.getDate();
          }
          return leadingNulls(Math.ceil(daysDifference/7), 2);
        },
        '%w': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay();
        },
        '%W': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53].
          // The first Monday of January is the first day of week 1;
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year, 0, 1);
          var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7-janFirst.getDay()+1);
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
  
          // is target date after the first Monday?
          if (compareByDay(firstMonday, endDate) < 0) {
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstMondayUntilEndJanuary = 31-firstMonday.getDate();
            var days = firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstMonday, janFirst) === 0 ? '01': '00';
        },
        '%y': function(date) {
          // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
          return (date.tm_year+1900).toString().substring(2);
        },
        '%Y': function(date) {
          // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
          return date.tm_year+1900;
        },
        '%z': function(date) {
          // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ).
          // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich).
          var off = date.tm_gmtoff;
          var ahead = off >= 0;
          off = Math.abs(off) / 60;
          // convert from minutes into hhmm format (which means 60 minutes = 100 units)
          off = (off / 60)*100 + (off % 60);
          return (ahead ? '+' : '-') + String("0000" + off).slice(-4);
        },
        '%Z': function(date) {
          return date.tm_zone;
        },
        '%%': function() {
          return '%';
        }
      };
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
          pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
        }
      }
  
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      }
  
      writeArrayToMemory(bytes, s);
      return bytes.length-1;
    }

  function _strftime_l(s, maxsize, format, tm) {
      return _strftime(s, maxsize, format, tm); // no locale support yet
    }

  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 85:
          var maxHeapSize = 2*1024*1024*1024 - 65536;
          return maxHeapSize / PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 79:
          return 0;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: {
          if (typeof navigator === 'object') return navigator['hardwareConcurrency'] || 1;
          return 1;
        }
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

  function _time(ptr) {
      var ret = (Date.now()/1000)|0;
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }

  function _unsetenv(name) {
      // int unsetenv(const char *name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/unsetenv.html
      if (name === 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      }
      name = Pointer_stringify(name);
      if (name === '' || name.indexOf('=') !== -1) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      }
      if (ENV.hasOwnProperty(name)) {
        delete ENV[name];
        ___buildEnvironment(__get_environ());
      }
      return 0;
    }

  function _utime(path, times) {
      // int utime(const char *path, const struct utimbuf *times);
      // http://pubs.opengroup.org/onlinepubs/009695399/basedefs/utime.h.html
      var time;
      if (times) {
        // NOTE: We don't keep track of access timestamps.
        var offset = 4;
        time = HEAP32[(((times)+(offset))>>2)];
        time *= 1000;
      } else {
        time = Date.now();
      }
      path = Pointer_stringify(path);
      try {
        FS.utime(path, time, time);
        return 0;
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
FS.staticInit();__ATINIT__.unshift(function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() });__ATMAIN__.push(function() { FS.ignorePermissions = false });__ATEXIT__.push(function() { FS.quit() });Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;;
__ATINIT__.unshift(function() { TTY.init() });__ATEXIT__.push(function() { TTY.shutdown() });;
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); var NODEJS_PATH = require("path"); NODEFS.staticInit(); };
__ATINIT__.push(function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); });;
if (ENVIRONMENT_IS_NODE) {
    _emscripten_get_now = function _emscripten_get_now_actual() {
      var t = process['hrtime']();
      return t[0] * 1e3 + t[1] / 1e6;
    };
  } else if (typeof dateNow !== 'undefined') {
    _emscripten_get_now = dateNow;
  } else if (typeof self === 'object' && self['performance'] && typeof self['performance']['now'] === 'function') {
    _emscripten_get_now = function() { return self['performance']['now'](); };
  } else if (typeof performance === 'object' && typeof performance['now'] === 'function') {
    _emscripten_get_now = function() { return performance['now'](); };
  } else {
    _emscripten_get_now = Date.now;
  };
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas, vrDevice) { err("Module.requestFullScreen is deprecated. Please call Module.requestFullscreen instead."); Module["requestFullScreen"] = Module["requestFullscreen"]; Browser.requestFullScreen(lockPointer, resizeCanvas, vrDevice) };
  Module["requestFullscreen"] = function Module_requestFullscreen(lockPointer, resizeCanvas, vrDevice) { Browser.requestFullscreen(lockPointer, resizeCanvas, vrDevice) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
  Module["createContext"] = function Module_createContext(canvas, useWebGL, setInModule, webGLContextAttributes) { return Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes) };
JSEvents.staticInit();;
var GLctx; GL.init();
DYNAMICTOP_PTR = staticAlloc(4);

STACK_BASE = STACKTOP = alignMemory(STATICTOP);

STACK_MAX = STACK_BASE + TOTAL_STACK;

DYNAMIC_BASE = alignMemory(STACK_MAX);

HEAP32[DYNAMICTOP_PTR>>2] = DYNAMIC_BASE;

staticSealed = true; // seal the static portion of memory

var ASSERTIONS = false;

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



Module['wasmTableSize'] = 109917;

Module['wasmMaxTableSize'] = 109917;

function invoke_dddi(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return Module["dynCall_dddi"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_ddi(index,a1,a2) {
  var sp = stackSave();
  try {
    return Module["dynCall_ddi"](index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_ddidi(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_ddidi"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_dfi(index,a1,a2) {
  var sp = stackSave();
  try {
    return Module["dynCall_dfi"](index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_di(index,a1) {
  var sp = stackSave();
  try {
    return Module["dynCall_di"](index,a1);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_diddi(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_diddi"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_didi(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return Module["dynCall_didi"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_dii(index,a1,a2) {
  var sp = stackSave();
  try {
    return Module["dynCall_dii"](index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_diii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return Module["dynCall_diii"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_diiii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_diiii"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_dij(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return Module["dynCall_dij"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_dji(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return Module["dynCall_dji"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_f(index) {
  var sp = stackSave();
  try {
    return Module["dynCall_f"](index);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fdi(index,a1,a2) {
  var sp = stackSave();
  try {
    return Module["dynCall_fdi"](index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_ff(index,a1) {
  var sp = stackSave();
  try {
    return Module["dynCall_ff"](index,a1);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fff(index,a1,a2) {
  var sp = stackSave();
  try {
    return Module["dynCall_fff"](index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_ffffffi(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return Module["dynCall_ffffffi"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_ffffi(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_ffffi"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fffi(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return Module["dynCall_fffi"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fffifffi(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return Module["dynCall_fffifffi"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_ffi(index,a1,a2) {
  var sp = stackSave();
  try {
    return Module["dynCall_ffi"](index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fi(index,a1) {
  var sp = stackSave();
  try {
    return Module["dynCall_fi"](index,a1);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fidi(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return Module["dynCall_fidi"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fif(index,a1,a2) {
  var sp = stackSave();
  try {
    return Module["dynCall_fif"](index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fiff(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return Module["dynCall_fiff"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fifffi(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_fifffi"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fiffi(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_fiffi"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fifi(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return Module["dynCall_fifi"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fifii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_fifii"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fifiii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_fifiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fifiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return Module["dynCall_fifiiiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fii(index,a1,a2) {
  var sp = stackSave();
  try {
    return Module["dynCall_fii"](index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fiifi(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_fiifi"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fiifii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_fiifii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fiii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return Module["dynCall_fiii"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fiiifi(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_fiiifi"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fiiifii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return Module["dynCall_fiiifii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fiiii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_fiiii"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fiiiif(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_fiiiif"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fiiiii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_fiiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fiiiiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return Module["dynCall_fiiiiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fiiiiiifiifif(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12) {
  var sp = stackSave();
  try {
    return Module["dynCall_fiiiiiifiifif"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fiiiiiifiiiif(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12) {
  var sp = stackSave();
  try {
    return Module["dynCall_fiiiiiifiiiif"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_fji(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return Module["dynCall_fji"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_i(index) {
  var sp = stackSave();
  try {
    return Module["dynCall_i"](index);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_idi(index,a1,a2) {
  var sp = stackSave();
  try {
    return Module["dynCall_idi"](index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_idii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return Module["dynCall_idii"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_idiii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_idiii"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iffffi(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_iffffi"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_ifffi(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_ifffi"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iffi(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return Module["dynCall_iffi"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_ifi(index,a1,a2) {
  var sp = stackSave();
  try {
    return Module["dynCall_ifi"](index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_ifiii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_ifiii"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_ii(index,a1) {
  var sp = stackSave();
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiddi(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiddi"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iidi(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return Module["dynCall_iidi"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iidii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_iidii"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iif(index,a1,a2) {
  var sp = stackSave();
  try {
    return Module["dynCall_iif"](index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iifff(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_iifff"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iifffffi(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return Module["dynCall_iifffffi"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiffffi(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiffffi"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiffffiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiffffiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiffffiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiffffiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iifffi(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_iifffi"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iifffiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return Module["dynCall_iifffiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiffi(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiffi"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiffifi(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiffifi"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiffii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiffii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiffiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiffiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiffiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiffiiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iifi(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return Module["dynCall_iifi"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iifii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_iifii"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iifiifffii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    return Module["dynCall_iifiifffii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iifiiffi(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return Module["dynCall_iifiiffi"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iifiifiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    return Module["dynCall_iifiifiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iifiii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_iifiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iifiiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return Module["dynCall_iifiiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iifiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return Module["dynCall_iifiiiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iifiiiijii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) {
  var sp = stackSave();
  try {
    return Module["dynCall_iifiiiijii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iii(index,a1,a2) {
  var sp = stackSave();
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiddi(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiddi"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiidi(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiidi"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiidii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiidii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiidiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiidiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiif(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiif"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiifffiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiifffiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiffiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiffiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiifi(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiifi"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiififii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiififii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiififiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiififiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiififiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiififiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiifii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiifii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiifiifffii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiifiifffii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiifiifii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiifiifii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiifiifiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiifiifiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiifiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiifiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiifiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiifiiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiifffffi(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiifffffi"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiifffffii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiifffffii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiifffiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiifffiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiffiffii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiffiffii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiifi(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiifi"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiifii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiifii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiifiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiifiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiifiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiifiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiifiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiifiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiii"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiid(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiid"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiidii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiidii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiffi(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiffi"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiifi(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiifi"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiifiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiifiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiifiiiiif(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiifiiiiif"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiid(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiid"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiifff(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiifff"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiifffiiifiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiifffiiifiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiiffiiiiiiiiiffffiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17,a18,a19,a20,a21,a22,a23) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiiffiiiiiiiiiffffiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17,a18,a19,a20,a21,a22,a23);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiiffiiiiiiiiiffffiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17,a18,a19,a20,a21,a22,a23,a24) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiiffiiiiiiiiiffffiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17,a18,a19,a20,a21,a22,a23,a24);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiiffiiiiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17,a18,a19,a20,a21,a22) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiiffiiiiiiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17,a18,a19,a20,a21,a22);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiifiif(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiifiif"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiifiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiifiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiiifiif(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiiifiif"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiiiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiiiiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiiiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiiiiiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiiiiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17,a18) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiiiiiiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17,a18);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiiiiiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17,a18,a19) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiiiiiiiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17,a18,a19);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiiiiiiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17,a18,a19,a20) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiiiiiiiiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17,a18,a19,a20);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiij(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiij"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiiji(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiiji"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiij(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiij"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiiji(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiiji"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiijii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiijii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiij(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiij"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiiji(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiiji"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiijii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiijii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiijiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiijiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiijji(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiijji"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iij(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return Module["dynCall_iij"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iiji(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_iiji"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iijii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_iijii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iijiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return Module["dynCall_iijiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iijji(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return Module["dynCall_iijji"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iijjii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return Module["dynCall_iijjii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iijjiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    return Module["dynCall_iijjiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iijjji(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    return Module["dynCall_iijjji"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iijjjji(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) {
  var sp = stackSave();
  try {
    return Module["dynCall_iijjjji"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iijjjjiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12) {
  var sp = stackSave();
  try {
    return Module["dynCall_iijjjjiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_ij(index,a1,a2) {
  var sp = stackSave();
  try {
    return Module["dynCall_ij"](index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_iji(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return Module["dynCall_iji"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_ijii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_ijii"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_ijiii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_ijiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_ijj(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_ijj"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_ijji(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_ijji"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_j(index) {
  var sp = stackSave();
  try {
    return Module["dynCall_j"](index);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_jdi(index,a1,a2) {
  var sp = stackSave();
  try {
    return Module["dynCall_jdi"](index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_jdii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return Module["dynCall_jdii"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_jfi(index,a1,a2) {
  var sp = stackSave();
  try {
    return Module["dynCall_jfi"](index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_ji(index,a1) {
  var sp = stackSave();
  try {
    return Module["dynCall_ji"](index,a1);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_jid(index,a1,a2) {
  var sp = stackSave();
  try {
    return Module["dynCall_jid"](index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_jidi(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return Module["dynCall_jidi"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_jidii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_jidii"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_jii(index,a1,a2) {
  var sp = stackSave();
  try {
    return Module["dynCall_jii"](index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_jiii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return Module["dynCall_jiii"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_jiiii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_jiiii"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_jiiiii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_jiiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_jiiiiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return Module["dynCall_jiiiiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_jiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) {
  var sp = stackSave();
  try {
    return Module["dynCall_jiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_jiiji(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_jiiji"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_jiji(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return Module["dynCall_jiji"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_jijii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_jijii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_jijiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return Module["dynCall_jijiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_jijj(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_jijj"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_jijji(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return Module["dynCall_jijji"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_jji(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return Module["dynCall_jji"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_jjji(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return Module["dynCall_jjji"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_v(index) {
  var sp = stackSave();
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vd(index,a1) {
  var sp = stackSave();
  try {
    Module["dynCall_vd"](index,a1);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vf(index,a1) {
  var sp = stackSave();
  try {
    Module["dynCall_vf"](index,a1);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vff(index,a1,a2) {
  var sp = stackSave();
  try {
    Module["dynCall_vff"](index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vffff(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    Module["dynCall_vffff"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vffffffiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) {
  var sp = stackSave();
  try {
    Module["dynCall_vffffffiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vffffi(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    Module["dynCall_vffffi"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vffffii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    Module["dynCall_vffffii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vfi(index,a1,a2) {
  var sp = stackSave();
  try {
    Module["dynCall_vfi"](index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vfii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    Module["dynCall_vfii"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vfiii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    Module["dynCall_vfiii"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vi(index,a1) {
  var sp = stackSave();
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vid(index,a1,a2) {
  var sp = stackSave();
  try {
    Module["dynCall_vid"](index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vidd(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    Module["dynCall_vidd"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viddi(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    Module["dynCall_viddi"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viddii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    Module["dynCall_viddii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viddiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    Module["dynCall_viddiiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vidi(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    Module["dynCall_vidi"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vidii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    Module["dynCall_vidii"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vidiii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    Module["dynCall_vidiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vif(index,a1,a2) {
  var sp = stackSave();
  try {
    Module["dynCall_vif"](index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viff(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    Module["dynCall_viff"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vifff(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    Module["dynCall_vifff"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viffff(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    Module["dynCall_viffff"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vifffffi(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    Module["dynCall_vifffffi"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viffffi(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    Module["dynCall_viffffi"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viffffii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    Module["dynCall_viffffii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viffffiifffiiiiif(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16) {
  var sp = stackSave();
  try {
    Module["dynCall_viffffiifffiiiiif"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vifffi(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    Module["dynCall_vifffi"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vifffii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    Module["dynCall_vifffii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viffi(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    Module["dynCall_viffi"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viffii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    Module["dynCall_viffii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viffiifffffiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13) {
  var sp = stackSave();
  try {
    Module["dynCall_viffiifffffiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viffiifffiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11) {
  var sp = stackSave();
  try {
    Module["dynCall_viffiifffiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viffiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    Module["dynCall_viffiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viffiiiif(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    Module["dynCall_viffiiiif"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vifi(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    Module["dynCall_vifi"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vifii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    Module["dynCall_vifii"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vifiii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    Module["dynCall_vifiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vifiiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    Module["dynCall_vifiiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vifiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    Module["dynCall_vifiiiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vifiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    Module["dynCall_vifiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vifijii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    Module["dynCall_vifijii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vii(index,a1,a2) {
  var sp = stackSave();
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viid(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    Module["dynCall_viid"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viidd(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    Module["dynCall_viidd"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiddi(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    Module["dynCall_viiddi"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viidi(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    Module["dynCall_viidi"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viidii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    Module["dynCall_viidii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viif(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    Module["dynCall_viif"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiff(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    Module["dynCall_viiff"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viifff(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    Module["dynCall_viifff"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiffffffffi(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11) {
  var sp = stackSave();
  try {
    Module["dynCall_viiffffffffi"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiffffffffiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13) {
  var sp = stackSave();
  try {
    Module["dynCall_viiffffffffiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viifffffffi(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) {
  var sp = stackSave();
  try {
    Module["dynCall_viifffffffi"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiffffffi(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    Module["dynCall_viiffffffi"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viifffffi(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    Module["dynCall_viifffffi"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiffffi(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    Module["dynCall_viiffffi"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viifffi(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    Module["dynCall_viifffi"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiffi(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    Module["dynCall_viiffi"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiffii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    Module["dynCall_viiffii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viifi(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    Module["dynCall_viifi"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viifii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    Module["dynCall_viifii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viifiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    Module["dynCall_viifiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viifiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    Module["dynCall_viifiiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    Module["dynCall_viii"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiidi(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    Module["dynCall_viiidi"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiif(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    Module["dynCall_viiif"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiifffi(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    Module["dynCall_viiifffi"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiffi(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiffi"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiffii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiffii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiifi(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    Module["dynCall_viiifi"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiififfi(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    Module["dynCall_viiififfi"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiififi(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    Module["dynCall_viiififi"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiifii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    Module["dynCall_viiifii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiifiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    Module["dynCall_viiifiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiifiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    Module["dynCall_viiifiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    Module["dynCall_viiii"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiif(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiif"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiffffii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiffffii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiifffi(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiifffi"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiffi(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiffi"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiifi(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiifi"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiifii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiifii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiifiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiifiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiifiiiiif(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiifiiiiif"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiif(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiif"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiifffi(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiifffi"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiifffii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiifffii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiiffi(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiiffi"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiiffii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiiffii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiifi(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiifi"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiiif(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiiif"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiiifi(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiiifi"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiiiifi(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiiiifi"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiiiifiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiiiifiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiiiiiiiifii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiiiiiiiifii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiiiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiiiiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiiiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiiiiiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiiiiiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17,a18) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiiiiiiiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13,a14,a15,a16,a17,a18);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiij(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiij"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiijiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiijiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiiji(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    Module["dynCall_viiiji"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiijji(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  var sp = stackSave();
  try {
    Module["dynCall_viiijji"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viij(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    Module["dynCall_viij"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viiji(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    Module["dynCall_viiji"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viijii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    Module["dynCall_viijii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viijiijiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11) {
  var sp = stackSave();
  try {
    Module["dynCall_viijiijiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viijijii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    Module["dynCall_viijijii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viijijiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) {
  var sp = stackSave();
  try {
    Module["dynCall_viijijiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viijijj(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    Module["dynCall_viijijj"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viijj(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    Module["dynCall_viijj"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viijji(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    Module["dynCall_viijji"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viijjiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    Module["dynCall_viijjiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viijjji(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    Module["dynCall_viijjji"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vij(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    Module["dynCall_vij"](index,a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_viji(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    Module["dynCall_viji"](index,a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vijii(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    Module["dynCall_vijii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vijiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    Module["dynCall_vijiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vijiji(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    Module["dynCall_vijiji"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vijijji(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    Module["dynCall_vijijji"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vijji(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    Module["dynCall_vijji"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vijjii(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    Module["dynCall_vijjii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vjiiii(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    Module["dynCall_vjiiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

function invoke_vjji(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    Module["dynCall_vjji"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    Module["setThrew"](1, 0);
  }
}

Module.asmGlobalArg = {};

Module.asmLibraryArg = { "abort": abort, "assert": assert, "enlargeMemory": enlargeMemory, "getTotalMemory": getTotalMemory, "abortOnCannotGrowMemory": abortOnCannotGrowMemory, "invoke_dddi": invoke_dddi, "invoke_ddi": invoke_ddi, "invoke_ddidi": invoke_ddidi, "invoke_dfi": invoke_dfi, "invoke_di": invoke_di, "invoke_diddi": invoke_diddi, "invoke_didi": invoke_didi, "invoke_dii": invoke_dii, "invoke_diii": invoke_diii, "invoke_diiii": invoke_diiii, "invoke_dij": invoke_dij, "invoke_dji": invoke_dji, "invoke_f": invoke_f, "invoke_fdi": invoke_fdi, "invoke_ff": invoke_ff, "invoke_fff": invoke_fff, "invoke_ffffffi": invoke_ffffffi, "invoke_ffffi": invoke_ffffi, "invoke_fffi": invoke_fffi, "invoke_fffifffi": invoke_fffifffi, "invoke_ffi": invoke_ffi, "invoke_fi": invoke_fi, "invoke_fidi": invoke_fidi, "invoke_fif": invoke_fif, "invoke_fiff": invoke_fiff, "invoke_fifffi": invoke_fifffi, "invoke_fiffi": invoke_fiffi, "invoke_fifi": invoke_fifi, "invoke_fifii": invoke_fifii, "invoke_fifiii": invoke_fifiii, "invoke_fifiiiii": invoke_fifiiiii, "invoke_fii": invoke_fii, "invoke_fiifi": invoke_fiifi, "invoke_fiifii": invoke_fiifii, "invoke_fiii": invoke_fiii, "invoke_fiiifi": invoke_fiiifi, "invoke_fiiifii": invoke_fiiifii, "invoke_fiiii": invoke_fiiii, "invoke_fiiiif": invoke_fiiiif, "invoke_fiiiii": invoke_fiiiii, "invoke_fiiiiii": invoke_fiiiiii, "invoke_fiiiiiifiifif": invoke_fiiiiiifiifif, "invoke_fiiiiiifiiiif": invoke_fiiiiiifiiiif, "invoke_fji": invoke_fji, "invoke_i": invoke_i, "invoke_idi": invoke_idi, "invoke_idii": invoke_idii, "invoke_idiii": invoke_idiii, "invoke_iffffi": invoke_iffffi, "invoke_ifffi": invoke_ifffi, "invoke_iffi": invoke_iffi, "invoke_ifi": invoke_ifi, "invoke_ifiii": invoke_ifiii, "invoke_ii": invoke_ii, "invoke_iiddi": invoke_iiddi, "invoke_iidi": invoke_iidi, "invoke_iidii": invoke_iidii, "invoke_iif": invoke_iif, "invoke_iifff": invoke_iifff, "invoke_iifffffi": invoke_iifffffi, "invoke_iiffffi": invoke_iiffffi, "invoke_iiffffiii": invoke_iiffffiii, "invoke_iiffffiiiiiii": invoke_iiffffiiiiiii, "invoke_iifffi": invoke_iifffi, "invoke_iifffiii": invoke_iifffiii, "invoke_iiffi": invoke_iiffi, "invoke_iiffifi": invoke_iiffifi, "invoke_iiffii": invoke_iiffii, "invoke_iiffiii": invoke_iiffiii, "invoke_iiffiiii": invoke_iiffiiii, "invoke_iifi": invoke_iifi, "invoke_iifii": invoke_iifii, "invoke_iifiifffii": invoke_iifiifffii, "invoke_iifiiffi": invoke_iifiiffi, "invoke_iifiifiii": invoke_iifiifiii, "invoke_iifiii": invoke_iifiii, "invoke_iifiiii": invoke_iifiiii, "invoke_iifiiiii": invoke_iifiiiii, "invoke_iifiiiijii": invoke_iifiiiijii, "invoke_iii": invoke_iii, "invoke_iiiddi": invoke_iiiddi, "invoke_iiidi": invoke_iiidi, "invoke_iiidii": invoke_iiidii, "invoke_iiidiii": invoke_iiidiii, "invoke_iiif": invoke_iiif, "invoke_iiifffiiii": invoke_iiifffiiii, "invoke_iiiffiii": invoke_iiiffiii, "invoke_iiifi": invoke_iiifi, "invoke_iiififii": invoke_iiififii, "invoke_iiififiii": invoke_iiififiii, "invoke_iiififiiii": invoke_iiififiiii, "invoke_iiifii": invoke_iiifii, "invoke_iiifiifffii": invoke_iiifiifffii, "invoke_iiifiifii": invoke_iiifiifii, "invoke_iiifiifiii": invoke_iiifiifiii, "invoke_iiifiii": invoke_iiifiii, "invoke_iiifiiii": invoke_iiifiiii, "invoke_iiii": invoke_iiii, "invoke_iiiifffffi": invoke_iiiifffffi, "invoke_iiiifffffii": invoke_iiiifffffii, "invoke_iiiifffiii": invoke_iiiifffiii, "invoke_iiiiffiffii": invoke_iiiiffiffii, "invoke_iiiifi": invoke_iiiifi, "invoke_iiiifii": invoke_iiiifii, "invoke_iiiifiii": invoke_iiiifiii, "invoke_iiiifiiii": invoke_iiiifiiii, "invoke_iiiifiiiii": invoke_iiiifiiiii, "invoke_iiiii": invoke_iiiii, "invoke_iiiiid": invoke_iiiiid, "invoke_iiiiidii": invoke_iiiiidii, "invoke_iiiiiffi": invoke_iiiiiffi, "invoke_iiiiifi": invoke_iiiiifi, "invoke_iiiiifiii": invoke_iiiiifiii, "invoke_iiiiifiiiiif": invoke_iiiiifiiiiif, "invoke_iiiiii": invoke_iiiiii, "invoke_iiiiiid": invoke_iiiiiid, "invoke_iiiiiifff": invoke_iiiiiifff, "invoke_iiiiiifffiiifiii": invoke_iiiiiifffiiifiii, "invoke_iiiiiiffiiiiiiiiiffffiii": invoke_iiiiiiffiiiiiiiiiffffiii, "invoke_iiiiiiffiiiiiiiiiffffiiii": invoke_iiiiiiffiiiiiiiiiffffiiii, "invoke_iiiiiiffiiiiiiiiiiiiiii": invoke_iiiiiiffiiiiiiiiiiiiiii, "invoke_iiiiiifiif": invoke_iiiiiifiif, "invoke_iiiiiifiii": invoke_iiiiiifiii, "invoke_iiiiiii": invoke_iiiiiii, "invoke_iiiiiiifiif": invoke_iiiiiiifiif, "invoke_iiiiiiii": invoke_iiiiiiii, "invoke_iiiiiiiii": invoke_iiiiiiiii, "invoke_iiiiiiiiii": invoke_iiiiiiiiii, "invoke_iiiiiiiiiii": invoke_iiiiiiiiiii, "invoke_iiiiiiiiiiii": invoke_iiiiiiiiiiii, "invoke_iiiiiiiiiiiii": invoke_iiiiiiiiiiiii, "invoke_iiiiiiiiiiiiii": invoke_iiiiiiiiiiiiii, "invoke_iiiiiiiiiiiiiii": invoke_iiiiiiiiiiiiiii, "invoke_iiiiiiiiiiiiiiii": invoke_iiiiiiiiiiiiiiii, "invoke_iiiiiiiiiiiiiiiii": invoke_iiiiiiiiiiiiiiiii, "invoke_iiiiiiiiiiiiiiiiii": invoke_iiiiiiiiiiiiiiiiii, "invoke_iiiiiiiiiiiiiiiiiii": invoke_iiiiiiiiiiiiiiiiiii, "invoke_iiiiiiiiiiiiiiiiiiii": invoke_iiiiiiiiiiiiiiiiiiii, "invoke_iiiiiiiiiiiiiiiiiiiii": invoke_iiiiiiiiiiiiiiiiiiiii, "invoke_iiiiij": invoke_iiiiij, "invoke_iiiiiji": invoke_iiiiiji, "invoke_iiiij": invoke_iiiij, "invoke_iiiiji": invoke_iiiiji, "invoke_iiiijii": invoke_iiiijii, "invoke_iiij": invoke_iiij, "invoke_iiiji": invoke_iiiji, "invoke_iiijii": invoke_iiijii, "invoke_iiijiii": invoke_iiijiii, "invoke_iiijji": invoke_iiijji, "invoke_iij": invoke_iij, "invoke_iiji": invoke_iiji, "invoke_iijii": invoke_iijii, "invoke_iijiii": invoke_iijiii, "invoke_iijji": invoke_iijji, "invoke_iijjii": invoke_iijjii, "invoke_iijjiii": invoke_iijjiii, "invoke_iijjji": invoke_iijjji, "invoke_iijjjji": invoke_iijjjji, "invoke_iijjjjiii": invoke_iijjjjiii, "invoke_ij": invoke_ij, "invoke_iji": invoke_iji, "invoke_ijii": invoke_ijii, "invoke_ijiii": invoke_ijiii, "invoke_ijj": invoke_ijj, "invoke_ijji": invoke_ijji, "invoke_j": invoke_j, "invoke_jdi": invoke_jdi, "invoke_jdii": invoke_jdii, "invoke_jfi": invoke_jfi, "invoke_ji": invoke_ji, "invoke_jid": invoke_jid, "invoke_jidi": invoke_jidi, "invoke_jidii": invoke_jidii, "invoke_jii": invoke_jii, "invoke_jiii": invoke_jiii, "invoke_jiiii": invoke_jiiii, "invoke_jiiiii": invoke_jiiiii, "invoke_jiiiiii": invoke_jiiiiii, "invoke_jiiiiiiiiii": invoke_jiiiiiiiiii, "invoke_jiiji": invoke_jiiji, "invoke_jiji": invoke_jiji, "invoke_jijii": invoke_jijii, "invoke_jijiii": invoke_jijiii, "invoke_jijj": invoke_jijj, "invoke_jijji": invoke_jijji, "invoke_jji": invoke_jji, "invoke_jjji": invoke_jjji, "invoke_v": invoke_v, "invoke_vd": invoke_vd, "invoke_vf": invoke_vf, "invoke_vff": invoke_vff, "invoke_vffff": invoke_vffff, "invoke_vffffffiiii": invoke_vffffffiiii, "invoke_vffffi": invoke_vffffi, "invoke_vffffii": invoke_vffffii, "invoke_vfi": invoke_vfi, "invoke_vfii": invoke_vfii, "invoke_vfiii": invoke_vfiii, "invoke_vi": invoke_vi, "invoke_vid": invoke_vid, "invoke_vidd": invoke_vidd, "invoke_viddi": invoke_viddi, "invoke_viddii": invoke_viddii, "invoke_viddiiii": invoke_viddiiii, "invoke_vidi": invoke_vidi, "invoke_vidii": invoke_vidii, "invoke_vidiii": invoke_vidiii, "invoke_vif": invoke_vif, "invoke_viff": invoke_viff, "invoke_vifff": invoke_vifff, "invoke_viffff": invoke_viffff, "invoke_vifffffi": invoke_vifffffi, "invoke_viffffi": invoke_viffffi, "invoke_viffffii": invoke_viffffii, "invoke_viffffiifffiiiiif": invoke_viffffiifffiiiiif, "invoke_vifffi": invoke_vifffi, "invoke_vifffii": invoke_vifffii, "invoke_viffi": invoke_viffi, "invoke_viffii": invoke_viffii, "invoke_viffiifffffiii": invoke_viffiifffffiii, "invoke_viffiifffiii": invoke_viffiifffiii, "invoke_viffiii": invoke_viffiii, "invoke_viffiiiif": invoke_viffiiiif, "invoke_vifi": invoke_vifi, "invoke_vifii": invoke_vifii, "invoke_vifiii": invoke_vifiii, "invoke_vifiiii": invoke_vifiiii, "invoke_vifiiiii": invoke_vifiiiii, "invoke_vifiiiiii": invoke_vifiiiiii, "invoke_vifijii": invoke_vifijii, "invoke_vii": invoke_vii, "invoke_viid": invoke_viid, "invoke_viidd": invoke_viidd, "invoke_viiddi": invoke_viiddi, "invoke_viidi": invoke_viidi, "invoke_viidii": invoke_viidii, "invoke_viif": invoke_viif, "invoke_viiff": invoke_viiff, "invoke_viifff": invoke_viifff, "invoke_viiffffffffi": invoke_viiffffffffi, "invoke_viiffffffffiii": invoke_viiffffffffiii, "invoke_viifffffffi": invoke_viifffffffi, "invoke_viiffffffi": invoke_viiffffffi, "invoke_viifffffi": invoke_viifffffi, "invoke_viiffffi": invoke_viiffffi, "invoke_viifffi": invoke_viifffi, "invoke_viiffi": invoke_viiffi, "invoke_viiffii": invoke_viiffii, "invoke_viifi": invoke_viifi, "invoke_viifii": invoke_viifii, "invoke_viifiii": invoke_viifiii, "invoke_viifiiii": invoke_viifiiii, "invoke_viii": invoke_viii, "invoke_viiidi": invoke_viiidi, "invoke_viiif": invoke_viiif, "invoke_viiifffi": invoke_viiifffi, "invoke_viiiffi": invoke_viiiffi, "invoke_viiiffii": invoke_viiiffii, "invoke_viiifi": invoke_viiifi, "invoke_viiififfi": invoke_viiififfi, "invoke_viiififi": invoke_viiififi, "invoke_viiifii": invoke_viiifii, "invoke_viiifiii": invoke_viiifiii, "invoke_viiifiiiii": invoke_viiifiiiii, "invoke_viiii": invoke_viiii, "invoke_viiiif": invoke_viiiif, "invoke_viiiiffffii": invoke_viiiiffffii, "invoke_viiiifffi": invoke_viiiifffi, "invoke_viiiiffi": invoke_viiiiffi, "invoke_viiiifi": invoke_viiiifi, "invoke_viiiifii": invoke_viiiifii, "invoke_viiiifiii": invoke_viiiifiii, "invoke_viiiifiiiiif": invoke_viiiifiiiiif, "invoke_viiiii": invoke_viiiii, "invoke_viiiiif": invoke_viiiiif, "invoke_viiiiifffi": invoke_viiiiifffi, "invoke_viiiiifffii": invoke_viiiiifffii, "invoke_viiiiiffi": invoke_viiiiiffi, "invoke_viiiiiffii": invoke_viiiiiffii, "invoke_viiiiifi": invoke_viiiiifi, "invoke_viiiiii": invoke_viiiiii, "invoke_viiiiiif": invoke_viiiiiif, "invoke_viiiiiifi": invoke_viiiiiifi, "invoke_viiiiiii": invoke_viiiiiii, "invoke_viiiiiiifi": invoke_viiiiiiifi, "invoke_viiiiiiifiii": invoke_viiiiiiifiii, "invoke_viiiiiiii": invoke_viiiiiiii, "invoke_viiiiiiiii": invoke_viiiiiiiii, "invoke_viiiiiiiiii": invoke_viiiiiiiiii, "invoke_viiiiiiiiiii": invoke_viiiiiiiiiii, "invoke_viiiiiiiiiiifii": invoke_viiiiiiiiiiifii, "invoke_viiiiiiiiiiii": invoke_viiiiiiiiiiii, "invoke_viiiiiiiiiiiii": invoke_viiiiiiiiiiiii, "invoke_viiiiiiiiiiiiii": invoke_viiiiiiiiiiiiii, "invoke_viiiiiiiiiiiiiii": invoke_viiiiiiiiiiiiiii, "invoke_viiiiiiiiiiiiiiii": invoke_viiiiiiiiiiiiiiii, "invoke_viiiiiiiiiiiiiiiii": invoke_viiiiiiiiiiiiiiiii, "invoke_viiiiiiiiiiiiiiiiii": invoke_viiiiiiiiiiiiiiiiii, "invoke_viiiij": invoke_viiiij, "invoke_viiiijiiii": invoke_viiiijiiii, "invoke_viiiji": invoke_viiiji, "invoke_viiijji": invoke_viiijji, "invoke_viij": invoke_viij, "invoke_viiji": invoke_viiji, "invoke_viijii": invoke_viijii, "invoke_viijiijiii": invoke_viijiijiii, "invoke_viijijii": invoke_viijijii, "invoke_viijijiii": invoke_viijijiii, "invoke_viijijj": invoke_viijijj, "invoke_viijj": invoke_viijj, "invoke_viijji": invoke_viijji, "invoke_viijjiii": invoke_viijjiii, "invoke_viijjji": invoke_viijjji, "invoke_vij": invoke_vij, "invoke_viji": invoke_viji, "invoke_vijii": invoke_vijii, "invoke_vijiii": invoke_vijiii, "invoke_vijiji": invoke_vijiji, "invoke_vijijji": invoke_vijijji, "invoke_vijji": invoke_vijji, "invoke_vijjii": invoke_vijjii, "invoke_vjiiii": invoke_vjiiii, "invoke_vjji": invoke_vjji, "_JS_Cursor_SetImage": _JS_Cursor_SetImage, "_JS_Cursor_SetShow": _JS_Cursor_SetShow, "_JS_Eval_ClearInterval": _JS_Eval_ClearInterval, "_JS_Eval_SetInterval": _JS_Eval_SetInterval, "_JS_FileSystem_Initialize": _JS_FileSystem_Initialize, "_JS_FileSystem_Sync": _JS_FileSystem_Sync, "_JS_Log_Dump": _JS_Log_Dump, "_JS_Log_StackTrace": _JS_Log_StackTrace, "_JS_Sound_Create_Channel": _JS_Sound_Create_Channel, "_JS_Sound_GetLength": _JS_Sound_GetLength, "_JS_Sound_GetLoadState": _JS_Sound_GetLoadState, "_JS_Sound_Init": _JS_Sound_Init, "_JS_Sound_Load": _JS_Sound_Load, "_JS_Sound_Load_PCM": _JS_Sound_Load_PCM, "_JS_Sound_Play": _JS_Sound_Play, "_JS_Sound_ReleaseInstance": _JS_Sound_ReleaseInstance, "_JS_Sound_ResumeIfNeeded": _JS_Sound_ResumeIfNeeded, "_JS_Sound_Set3D": _JS_Sound_Set3D, "_JS_Sound_SetListenerOrientation": _JS_Sound_SetListenerOrientation, "_JS_Sound_SetListenerPosition": _JS_Sound_SetListenerPosition, "_JS_Sound_SetLoop": _JS_Sound_SetLoop, "_JS_Sound_SetLoopPoints": _JS_Sound_SetLoopPoints, "_JS_Sound_SetPitch": _JS_Sound_SetPitch, "_JS_Sound_SetPosition": _JS_Sound_SetPosition, "_JS_Sound_SetVolume": _JS_Sound_SetVolume, "_JS_Sound_Stop": _JS_Sound_Stop, "_JS_SystemInfo_GetCanvasClientSize": _JS_SystemInfo_GetCanvasClientSize, "_JS_SystemInfo_GetDocumentURL": _JS_SystemInfo_GetDocumentURL, "_JS_SystemInfo_GetGPUInfo": _JS_SystemInfo_GetGPUInfo, "_JS_SystemInfo_GetMemory": _JS_SystemInfo_GetMemory, "_JS_SystemInfo_GetOS": _JS_SystemInfo_GetOS, "_JS_SystemInfo_GetPreferredDevicePixelRatio": _JS_SystemInfo_GetPreferredDevicePixelRatio, "_JS_SystemInfo_GetScreenSize": _JS_SystemInfo_GetScreenSize, "_JS_SystemInfo_HasCursorLock": _JS_SystemInfo_HasCursorLock, "_JS_SystemInfo_HasFullscreen": _JS_SystemInfo_HasFullscreen, "_JS_SystemInfo_HasWebGL": _JS_SystemInfo_HasWebGL, "_JS_SystemInfo_IsMobile": _JS_SystemInfo_IsMobile, "_JS_Video_CanPlayFormat": _JS_Video_CanPlayFormat, "_JS_Video_Create": _JS_Video_Create, "_JS_Video_Destroy": _JS_Video_Destroy, "_JS_Video_Duration": _JS_Video_Duration, "_JS_Video_EnableAudioTrack": _JS_Video_EnableAudioTrack, "_JS_Video_GetAudioLanguageCode": _JS_Video_GetAudioLanguageCode, "_JS_Video_GetNumAudioTracks": _JS_Video_GetNumAudioTracks, "_JS_Video_Height": _JS_Video_Height, "_JS_Video_IsPlaying": _JS_Video_IsPlaying, "_JS_Video_IsReady": _JS_Video_IsReady, "_JS_Video_Pause": _JS_Video_Pause, "_JS_Video_Play": _JS_Video_Play, "_JS_Video_Seek": _JS_Video_Seek, "_JS_Video_SetEndedHandler": _JS_Video_SetEndedHandler, "_JS_Video_SetErrorHandler": _JS_Video_SetErrorHandler, "_JS_Video_SetLoop": _JS_Video_SetLoop, "_JS_Video_SetMute": _JS_Video_SetMute, "_JS_Video_SetPlaybackRate": _JS_Video_SetPlaybackRate, "_JS_Video_SetReadyHandler": _JS_Video_SetReadyHandler, "_JS_Video_SetSeekedOnceHandler": _JS_Video_SetSeekedOnceHandler, "_JS_Video_SetVolume": _JS_Video_SetVolume, "_JS_Video_Time": _JS_Video_Time, "_JS_Video_UpdateToTexture": _JS_Video_UpdateToTexture, "_JS_Video_Width": _JS_Video_Width, "___atomic_compare_exchange_8": ___atomic_compare_exchange_8, "___atomic_fetch_add_8": ___atomic_fetch_add_8, "___buildEnvironment": ___buildEnvironment, "___cxa_allocate_exception": ___cxa_allocate_exception, "___cxa_begin_catch": ___cxa_begin_catch, "___cxa_end_catch": ___cxa_end_catch, "___cxa_find_matching_catch": ___cxa_find_matching_catch, "___cxa_find_matching_catch_2": ___cxa_find_matching_catch_2, "___cxa_find_matching_catch_3": ___cxa_find_matching_catch_3, "___cxa_find_matching_catch_4": ___cxa_find_matching_catch_4, "___cxa_free_exception": ___cxa_free_exception, "___cxa_pure_virtual": ___cxa_pure_virtual, "___cxa_rethrow": ___cxa_rethrow, "___cxa_throw": ___cxa_throw, "___cxa_uncaught_exception": ___cxa_uncaught_exception, "___gxx_personality_v0": ___gxx_personality_v0, "___lock": ___lock, "___map_file": ___map_file, "___resumeException": ___resumeException, "___setErrNo": ___setErrNo, "___syscall10": ___syscall10, "___syscall102": ___syscall102, "___syscall122": ___syscall122, "___syscall140": ___syscall140, "___syscall142": ___syscall142, "___syscall145": ___syscall145, "___syscall146": ___syscall146, "___syscall15": ___syscall15, "___syscall183": ___syscall183, "___syscall192": ___syscall192, "___syscall193": ___syscall193, "___syscall195": ___syscall195, "___syscall196": ___syscall196, "___syscall197": ___syscall197, "___syscall199": ___syscall199, "___syscall202": ___syscall202, "___syscall220": ___syscall220, "___syscall221": ___syscall221, "___syscall268": ___syscall268, "___syscall3": ___syscall3, "___syscall33": ___syscall33, "___syscall38": ___syscall38, "___syscall39": ___syscall39, "___syscall4": ___syscall4, "___syscall40": ___syscall40, "___syscall5": ___syscall5, "___syscall54": ___syscall54, "___syscall6": ___syscall6, "___syscall77": ___syscall77, "___syscall85": ___syscall85, "___syscall91": ___syscall91, "___unlock": ___unlock, "__addDays": __addDays, "__arraySum": __arraySum, "__emscripten_do_request_fullscreen": __emscripten_do_request_fullscreen, "__emscripten_sample_gamepad_data": __emscripten_sample_gamepad_data, "__emscripten_traverse_stack": __emscripten_traverse_stack, "__exit": __exit, "__formatString": __formatString, "__inet_ntop4_raw": __inet_ntop4_raw, "__inet_ntop6_raw": __inet_ntop6_raw, "__inet_pton4_raw": __inet_pton4_raw, "__inet_pton6_raw": __inet_pton6_raw, "__isLeapYear": __isLeapYear, "__read_sockaddr": __read_sockaddr, "__reallyNegative": __reallyNegative, "__setLetterbox": __setLetterbox, "__write_sockaddr": __write_sockaddr, "_abort": _abort, "_atexit": _atexit, "_clock": _clock, "_clock_getres": _clock_getres, "_clock_gettime": _clock_gettime, "_difftime": _difftime, "_dlclose": _dlclose, "_dlopen": _dlopen, "_dlsym": _dlsym, "_emscripten_asm_const_d": _emscripten_asm_const_d, "_emscripten_asm_const_i": _emscripten_asm_const_i, "_emscripten_asm_const_ii": _emscripten_asm_const_ii, "_emscripten_asm_const_iii": _emscripten_asm_const_iii, "_emscripten_asm_const_iiiiii": _emscripten_asm_const_iiiiii, "_emscripten_asm_const_iiiiiii": _emscripten_asm_const_iiiiiii, "_emscripten_asm_const_sync_on_main_thread_i": _emscripten_asm_const_sync_on_main_thread_i, "_emscripten_cancel_main_loop": _emscripten_cancel_main_loop, "_emscripten_exit_fullscreen": _emscripten_exit_fullscreen, "_emscripten_exit_pointerlock": _emscripten_exit_pointerlock, "_emscripten_get_callstack_js": _emscripten_get_callstack_js, "_emscripten_get_canvas_element_size": _emscripten_get_canvas_element_size, "_emscripten_get_canvas_element_size_calling_thread": _emscripten_get_canvas_element_size_calling_thread, "_emscripten_get_canvas_element_size_main_thread": _emscripten_get_canvas_element_size_main_thread, "_emscripten_get_fullscreen_status": _emscripten_get_fullscreen_status, "_emscripten_get_gamepad_status": _emscripten_get_gamepad_status, "_emscripten_get_main_loop_timing": _emscripten_get_main_loop_timing, "_emscripten_get_now": _emscripten_get_now, "_emscripten_get_now_is_monotonic": _emscripten_get_now_is_monotonic, "_emscripten_get_now_res": _emscripten_get_now_res, "_emscripten_get_num_gamepads": _emscripten_get_num_gamepads, "_emscripten_has_threading_support": _emscripten_has_threading_support, "_emscripten_html5_remove_all_event_listeners": _emscripten_html5_remove_all_event_listeners, "_emscripten_is_webgl_context_lost": _emscripten_is_webgl_context_lost, "_emscripten_log": _emscripten_log, "_emscripten_log_js": _emscripten_log_js, "_emscripten_memcpy_big": _emscripten_memcpy_big, "_emscripten_num_logical_cores": _emscripten_num_logical_cores, "_emscripten_request_fullscreen": _emscripten_request_fullscreen, "_emscripten_request_pointerlock": _emscripten_request_pointerlock, "_emscripten_set_blur_callback_on_thread": _emscripten_set_blur_callback_on_thread, "_emscripten_set_canvas_element_size": _emscripten_set_canvas_element_size, "_emscripten_set_canvas_element_size_calling_thread": _emscripten_set_canvas_element_size_calling_thread, "_emscripten_set_canvas_element_size_main_thread": _emscripten_set_canvas_element_size_main_thread, "_emscripten_set_dblclick_callback_on_thread": _emscripten_set_dblclick_callback_on_thread, "_emscripten_set_devicemotion_callback_on_thread": _emscripten_set_devicemotion_callback_on_thread, "_emscripten_set_deviceorientation_callback_on_thread": _emscripten_set_deviceorientation_callback_on_thread, "_emscripten_set_focus_callback_on_thread": _emscripten_set_focus_callback_on_thread, "_emscripten_set_fullscreenchange_callback_on_thread": _emscripten_set_fullscreenchange_callback_on_thread, "_emscripten_set_gamepadconnected_callback_on_thread": _emscripten_set_gamepadconnected_callback_on_thread, "_emscripten_set_gamepaddisconnected_callback_on_thread": _emscripten_set_gamepaddisconnected_callback_on_thread, "_emscripten_set_keydown_callback_on_thread": _emscripten_set_keydown_callback_on_thread, "_emscripten_set_keypress_callback_on_thread": _emscripten_set_keypress_callback_on_thread, "_emscripten_set_keyup_callback_on_thread": _emscripten_set_keyup_callback_on_thread, "_emscripten_set_main_loop": _emscripten_set_main_loop, "_emscripten_set_main_loop_timing": _emscripten_set_main_loop_timing, "_emscripten_set_mousedown_callback_on_thread": _emscripten_set_mousedown_callback_on_thread, "_emscripten_set_mousemove_callback_on_thread": _emscripten_set_mousemove_callback_on_thread, "_emscripten_set_mouseup_callback_on_thread": _emscripten_set_mouseup_callback_on_thread, "_emscripten_set_touchcancel_callback_on_thread": _emscripten_set_touchcancel_callback_on_thread, "_emscripten_set_touchend_callback_on_thread": _emscripten_set_touchend_callback_on_thread, "_emscripten_set_touchmove_callback_on_thread": _emscripten_set_touchmove_callback_on_thread, "_emscripten_set_touchstart_callback_on_thread": _emscripten_set_touchstart_callback_on_thread, "_emscripten_set_wheel_callback_on_thread": _emscripten_set_wheel_callback_on_thread, "_emscripten_webgl_create_context": _emscripten_webgl_create_context, "_emscripten_webgl_destroy_context": _emscripten_webgl_destroy_context, "_emscripten_webgl_destroy_context_calling_thread": _emscripten_webgl_destroy_context_calling_thread, "_emscripten_webgl_do_create_context": _emscripten_webgl_do_create_context, "_emscripten_webgl_do_get_current_context": _emscripten_webgl_do_get_current_context, "_emscripten_webgl_enable_extension": _emscripten_webgl_enable_extension, "_emscripten_webgl_enable_extension_calling_thread": _emscripten_webgl_enable_extension_calling_thread, "_emscripten_webgl_get_current_context": _emscripten_webgl_get_current_context, "_emscripten_webgl_init_context_attributes": _emscripten_webgl_init_context_attributes, "_emscripten_webgl_make_context_current": _emscripten_webgl_make_context_current, "_exit": _exit, "_flock": _flock, "_getenv": _getenv, "_gethostbyaddr": _gethostbyaddr, "_gethostbyname": _gethostbyname, "_getpagesize": _getpagesize, "_getpwuid": _getpwuid, "_gettimeofday": _gettimeofday, "_glActiveTexture": _glActiveTexture, "_glAttachShader": _glAttachShader, "_glBeginQuery": _glBeginQuery, "_glBeginTransformFeedback": _glBeginTransformFeedback, "_glBindAttribLocation": _glBindAttribLocation, "_glBindBuffer": _glBindBuffer, "_glBindBufferBase": _glBindBufferBase, "_glBindBufferRange": _glBindBufferRange, "_glBindFramebuffer": _glBindFramebuffer, "_glBindRenderbuffer": _glBindRenderbuffer, "_glBindSampler": _glBindSampler, "_glBindTexture": _glBindTexture, "_glBindTransformFeedback": _glBindTransformFeedback, "_glBindVertexArray": _glBindVertexArray, "_glBlendEquation": _glBlendEquation, "_glBlendEquationSeparate": _glBlendEquationSeparate, "_glBlendFunc": _glBlendFunc, "_glBlendFuncSeparate": _glBlendFuncSeparate, "_glBlitFramebuffer": _glBlitFramebuffer, "_glBufferData": _glBufferData, "_glBufferSubData": _glBufferSubData, "_glCheckFramebufferStatus": _glCheckFramebufferStatus, "_glClear": _glClear, "_glClearBufferfi": _glClearBufferfi, "_glClearBufferfv": _glClearBufferfv, "_glClearBufferuiv": _glClearBufferuiv, "_glClearColor": _glClearColor, "_glClearDepthf": _glClearDepthf, "_glClearStencil": _glClearStencil, "_glClientWaitSync": _glClientWaitSync, "_glColorMask": _glColorMask, "_glCompileShader": _glCompileShader, "_glCompressedTexImage2D": _glCompressedTexImage2D, "_glCompressedTexImage3D": _glCompressedTexImage3D, "_glCompressedTexSubImage2D": _glCompressedTexSubImage2D, "_glCompressedTexSubImage3D": _glCompressedTexSubImage3D, "_glCopyBufferSubData": _glCopyBufferSubData, "_glCopyTexImage2D": _glCopyTexImage2D, "_glCopyTexSubImage2D": _glCopyTexSubImage2D, "_glCreateProgram": _glCreateProgram, "_glCreateShader": _glCreateShader, "_glCullFace": _glCullFace, "_glDeleteBuffers": _glDeleteBuffers, "_glDeleteFramebuffers": _glDeleteFramebuffers, "_glDeleteProgram": _glDeleteProgram, "_glDeleteQueries": _glDeleteQueries, "_glDeleteRenderbuffers": _glDeleteRenderbuffers, "_glDeleteSamplers": _glDeleteSamplers, "_glDeleteShader": _glDeleteShader, "_glDeleteSync": _glDeleteSync, "_glDeleteTextures": _glDeleteTextures, "_glDeleteTransformFeedbacks": _glDeleteTransformFeedbacks, "_glDeleteVertexArrays": _glDeleteVertexArrays, "_glDepthFunc": _glDepthFunc, "_glDepthMask": _glDepthMask, "_glDetachShader": _glDetachShader, "_glDisable": _glDisable, "_glDisableVertexAttribArray": _glDisableVertexAttribArray, "_glDrawArrays": _glDrawArrays, "_glDrawArraysInstanced": _glDrawArraysInstanced, "_glDrawBuffers": _glDrawBuffers, "_glDrawElements": _glDrawElements, "_glDrawElementsInstanced": _glDrawElementsInstanced, "_glEnable": _glEnable, "_glEnableVertexAttribArray": _glEnableVertexAttribArray, "_glEndQuery": _glEndQuery, "_glEndTransformFeedback": _glEndTransformFeedback, "_glFenceSync": _glFenceSync, "_glFinish": _glFinish, "_glFlush": _glFlush, "_glFlushMappedBufferRange": _glFlushMappedBufferRange, "_glFramebufferRenderbuffer": _glFramebufferRenderbuffer, "_glFramebufferTexture2D": _glFramebufferTexture2D, "_glFramebufferTextureLayer": _glFramebufferTextureLayer, "_glFrontFace": _glFrontFace, "_glGenBuffers": _glGenBuffers, "_glGenFramebuffers": _glGenFramebuffers, "_glGenQueries": _glGenQueries, "_glGenRenderbuffers": _glGenRenderbuffers, "_glGenSamplers": _glGenSamplers, "_glGenTextures": _glGenTextures, "_glGenTransformFeedbacks": _glGenTransformFeedbacks, "_glGenVertexArrays": _glGenVertexArrays, "_glGenerateMipmap": _glGenerateMipmap, "_glGetActiveAttrib": _glGetActiveAttrib, "_glGetActiveUniform": _glGetActiveUniform, "_glGetActiveUniformBlockName": _glGetActiveUniformBlockName, "_glGetActiveUniformBlockiv": _glGetActiveUniformBlockiv, "_glGetActiveUniformsiv": _glGetActiveUniformsiv, "_glGetAttribLocation": _glGetAttribLocation, "_glGetError": _glGetError, "_glGetFramebufferAttachmentParameteriv": _glGetFramebufferAttachmentParameteriv, "_glGetIntegeri_v": _glGetIntegeri_v, "_glGetIntegerv": _glGetIntegerv, "_glGetInternalformativ": _glGetInternalformativ, "_glGetProgramBinary": _glGetProgramBinary, "_glGetProgramInfoLog": _glGetProgramInfoLog, "_glGetProgramiv": _glGetProgramiv, "_glGetRenderbufferParameteriv": _glGetRenderbufferParameteriv, "_glGetShaderInfoLog": _glGetShaderInfoLog, "_glGetShaderPrecisionFormat": _glGetShaderPrecisionFormat, "_glGetShaderSource": _glGetShaderSource, "_glGetShaderiv": _glGetShaderiv, "_glGetString": _glGetString, "_glGetStringi": _glGetStringi, "_glGetTexParameteriv": _glGetTexParameteriv, "_glGetUniformBlockIndex": _glGetUniformBlockIndex, "_glGetUniformIndices": _glGetUniformIndices, "_glGetUniformLocation": _glGetUniformLocation, "_glGetUniformiv": _glGetUniformiv, "_glGetVertexAttribiv": _glGetVertexAttribiv, "_glInvalidateFramebuffer": _glInvalidateFramebuffer, "_glIsEnabled": _glIsEnabled, "_glIsVertexArray": _glIsVertexArray, "_glLinkProgram": _glLinkProgram, "_glMapBufferRange": _glMapBufferRange, "_glPixelStorei": _glPixelStorei, "_glPolygonOffset": _glPolygonOffset, "_glProgramBinary": _glProgramBinary, "_glProgramParameteri": _glProgramParameteri, "_glReadBuffer": _glReadBuffer, "_glReadPixels": _glReadPixels, "_glRenderbufferStorage": _glRenderbufferStorage, "_glRenderbufferStorageMultisample": _glRenderbufferStorageMultisample, "_glSamplerParameteri": _glSamplerParameteri, "_glScissor": _glScissor, "_glShaderSource": _glShaderSource, "_glStencilFuncSeparate": _glStencilFuncSeparate, "_glStencilMask": _glStencilMask, "_glStencilOpSeparate": _glStencilOpSeparate, "_glTexImage2D": _glTexImage2D, "_glTexImage3D": _glTexImage3D, "_glTexParameterf": _glTexParameterf, "_glTexParameteri": _glTexParameteri, "_glTexParameteriv": _glTexParameteriv, "_glTexStorage2D": _glTexStorage2D, "_glTexStorage3D": _glTexStorage3D, "_glTexSubImage2D": _glTexSubImage2D, "_glTexSubImage3D": _glTexSubImage3D, "_glTransformFeedbackVaryings": _glTransformFeedbackVaryings, "_glUniform1fv": _glUniform1fv, "_glUniform1i": _glUniform1i, "_glUniform1iv": _glUniform1iv, "_glUniform1uiv": _glUniform1uiv, "_glUniform2fv": _glUniform2fv, "_glUniform2iv": _glUniform2iv, "_glUniform2uiv": _glUniform2uiv, "_glUniform3fv": _glUniform3fv, "_glUniform3iv": _glUniform3iv, "_glUniform3uiv": _glUniform3uiv, "_glUniform4fv": _glUniform4fv, "_glUniform4iv": _glUniform4iv, "_glUniform4uiv": _glUniform4uiv, "_glUniformBlockBinding": _glUniformBlockBinding, "_glUniformMatrix3fv": _glUniformMatrix3fv, "_glUniformMatrix4fv": _glUniformMatrix4fv, "_glUnmapBuffer": _glUnmapBuffer, "_glUseProgram": _glUseProgram, "_glValidateProgram": _glValidateProgram, "_glVertexAttrib4f": _glVertexAttrib4f, "_glVertexAttrib4fv": _glVertexAttrib4fv, "_glVertexAttribIPointer": _glVertexAttribIPointer, "_glVertexAttribPointer": _glVertexAttribPointer, "_glViewport": _glViewport, "_gmtime": _gmtime, "_gmtime_r": _gmtime_r, "_inet_addr": _inet_addr, "_llvm_ceil_f32": _llvm_ceil_f32, "_llvm_ceil_f64": _llvm_ceil_f64, "_llvm_copysign_f64": _llvm_copysign_f64, "_llvm_cos_f32": _llvm_cos_f32, "_llvm_cttz_i32": _llvm_cttz_i32, "_llvm_eh_typeid_for": _llvm_eh_typeid_for, "_llvm_exp2_f32": _llvm_exp2_f32, "_llvm_fabs_f32": _llvm_fabs_f32, "_llvm_fabs_f64": _llvm_fabs_f64, "_llvm_floor_f32": _llvm_floor_f32, "_llvm_floor_f64": _llvm_floor_f64, "_llvm_log10_f32": _llvm_log10_f32, "_llvm_log2_f32": _llvm_log2_f32, "_llvm_pow_f64": _llvm_pow_f64, "_llvm_sin_f32": _llvm_sin_f32, "_llvm_sqrt_f32": _llvm_sqrt_f32, "_llvm_stackrestore": _llvm_stackrestore, "_llvm_stacksave": _llvm_stacksave, "_llvm_trap": _llvm_trap, "_llvm_trunc_f32": _llvm_trunc_f32, "_localtime": _localtime, "_localtime_r": _localtime_r, "_longjmp": _longjmp, "_mktime": _mktime, "_nanosleep": _nanosleep, "_pthread_cond_destroy": _pthread_cond_destroy, "_pthread_cond_init": _pthread_cond_init, "_pthread_cond_timedwait": _pthread_cond_timedwait, "_pthread_cond_wait": _pthread_cond_wait, "_pthread_equal": _pthread_equal, "_pthread_getspecific": _pthread_getspecific, "_pthread_key_create": _pthread_key_create, "_pthread_key_delete": _pthread_key_delete, "_pthread_mutex_destroy": _pthread_mutex_destroy, "_pthread_mutex_init": _pthread_mutex_init, "_pthread_mutexattr_destroy": _pthread_mutexattr_destroy, "_pthread_mutexattr_init": _pthread_mutexattr_init, "_pthread_mutexattr_setprotocol": _pthread_mutexattr_setprotocol, "_pthread_mutexattr_settype": _pthread_mutexattr_settype, "_pthread_once": _pthread_once, "_pthread_setspecific": _pthread_setspecific, "_sched_yield": _sched_yield, "_setenv": _setenv, "_sigaction": _sigaction, "_sigemptyset": _sigemptyset, "_strftime": _strftime, "_strftime_l": _strftime_l, "_sysconf": _sysconf, "_time": _time, "_tzset": _tzset, "_unsetenv": _unsetenv, "_usleep": _usleep, "_utime": _utime, "emscriptenWebGLComputeImageSize": emscriptenWebGLComputeImageSize, "emscriptenWebGLGet": emscriptenWebGLGet, "emscriptenWebGLGetBufferBinding": emscriptenWebGLGetBufferBinding, "emscriptenWebGLGetHeapForType": emscriptenWebGLGetHeapForType, "emscriptenWebGLGetIndexed": emscriptenWebGLGetIndexed, "emscriptenWebGLGetShiftForType": emscriptenWebGLGetShiftForType, "emscriptenWebGLGetTexPixelData": emscriptenWebGLGetTexPixelData, "emscriptenWebGLGetUniform": emscriptenWebGLGetUniform, "emscriptenWebGLGetVertexAttrib": emscriptenWebGLGetVertexAttrib, "emscriptenWebGLValidateMapBufferTarget": emscriptenWebGLValidateMapBufferTarget, "emscripten_get_canvas_element_size_js": emscripten_get_canvas_element_size_js, "emscripten_set_canvas_element_size_js": emscripten_set_canvas_element_size_js, "DYNAMICTOP_PTR": DYNAMICTOP_PTR, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX };
// EMSCRIPTEN_START_ASM
var asm =Module["asm"]// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg, Module.asmLibraryArg, buffer);

Module["asm"] = asm;
var _SendMessage = Module["_SendMessage"] = function() {  return Module["asm"]["_SendMessage"].apply(null, arguments) };
var _SendMessageFloat = Module["_SendMessageFloat"] = function() {  return Module["asm"]["_SendMessageFloat"].apply(null, arguments) };
var _SendMessageString = Module["_SendMessageString"] = function() {  return Module["asm"]["_SendMessageString"].apply(null, arguments) };
var _SetFullscreen = Module["_SetFullscreen"] = function() {  return Module["asm"]["_SetFullscreen"].apply(null, arguments) };
var __GLOBAL__I_000101 = Module["__GLOBAL__I_000101"] = function() {  return Module["asm"]["__GLOBAL__I_000101"].apply(null, arguments) };
var __GLOBAL__sub_I_AIScriptingClasses_cpp = Module["__GLOBAL__sub_I_AIScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_AIScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_AccessibilityScriptingClasses_cpp = Module["__GLOBAL__sub_I_AccessibilityScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_AccessibilityScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_AndroidJNIScriptingClasses_cpp = Module["__GLOBAL__sub_I_AndroidJNIScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_AndroidJNIScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_AnimationClip_cpp = Module["__GLOBAL__sub_I_AnimationClip_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_AnimationClip_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_AnimationScriptingClasses_cpp = Module["__GLOBAL__sub_I_AnimationScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_AnimationScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_AssetBundleFileSystem_cpp = Module["__GLOBAL__sub_I_AssetBundleFileSystem_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_AssetBundleFileSystem_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_AssetBundleScriptingClasses_cpp = Module["__GLOBAL__sub_I_AssetBundleScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_AssetBundleScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_AudioScriptingClasses_cpp = Module["__GLOBAL__sub_I_AudioScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_AudioScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_ClothScriptingClasses_cpp = Module["__GLOBAL__sub_I_ClothScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_ClothScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_DirectorScriptingClasses_cpp = Module["__GLOBAL__sub_I_DirectorScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_DirectorScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_External_ProphecySDK_BlitOperations_1_cpp = Module["__GLOBAL__sub_I_External_ProphecySDK_BlitOperations_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_External_ProphecySDK_BlitOperations_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_External_Yoga_Yoga_0_cpp = Module["__GLOBAL__sub_I_External_Yoga_Yoga_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_External_Yoga_Yoga_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_External_baselib_builds_Source_0_cpp = Module["__GLOBAL__sub_I_External_baselib_builds_Source_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_External_baselib_builds_Source_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_External_il2cpp_builds_external_baselib_Platforms_WebGL_Source_0_cpp = Module["__GLOBAL__sub_I_External_il2cpp_builds_external_baselib_Platforms_WebGL_Source_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_External_il2cpp_builds_external_baselib_Platforms_WebGL_Source_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_External_il2cpp_builds_external_baselib_Source_0_cpp = Module["__GLOBAL__sub_I_External_il2cpp_builds_external_baselib_Source_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_External_il2cpp_builds_external_baselib_Source_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_GUITexture_cpp = Module["__GLOBAL__sub_I_GUITexture_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_GUITexture_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_GfxDeviceNull_cpp = Module["__GLOBAL__sub_I_GfxDeviceNull_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_GfxDeviceNull_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_GridScriptingClasses_cpp = Module["__GLOBAL__sub_I_GridScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_GridScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_IMGUIScriptingClasses_cpp = Module["__GLOBAL__sub_I_IMGUIScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_IMGUIScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_InputLegacyScriptingClasses_cpp = Module["__GLOBAL__sub_I_InputLegacyScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_InputLegacyScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_InputScriptingClasses_cpp = Module["__GLOBAL__sub_I_InputScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_InputScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_LogAssert_cpp = Module["__GLOBAL__sub_I_LogAssert_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_LogAssert_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Lump_libil2cpp_gc_cpp = Module["__GLOBAL__sub_I_Lump_libil2cpp_gc_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Lump_libil2cpp_gc_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Lump_libil2cpp_icalls_cpp = Module["__GLOBAL__sub_I_Lump_libil2cpp_icalls_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Lump_libil2cpp_icalls_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Lump_libil2cpp_metadata_cpp = Module["__GLOBAL__sub_I_Lump_libil2cpp_metadata_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Lump_libil2cpp_metadata_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Lump_libil2cpp_mono_cpp = Module["__GLOBAL__sub_I_Lump_libil2cpp_mono_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Lump_libil2cpp_mono_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Lump_libil2cpp_os_cpp = Module["__GLOBAL__sub_I_Lump_libil2cpp_os_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Lump_libil2cpp_os_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Lump_libil2cpp_utils_cpp = Module["__GLOBAL__sub_I_Lump_libil2cpp_utils_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Lump_libil2cpp_utils_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Lump_libil2cpp_vm_cpp = Module["__GLOBAL__sub_I_Lump_libil2cpp_vm_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Lump_libil2cpp_vm_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Lump_libil2cpp_vm_utils_cpp = Module["__GLOBAL__sub_I_Lump_libil2cpp_vm_utils_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Lump_libil2cpp_vm_utils_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Mesh_cpp = Module["__GLOBAL__sub_I_Mesh_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Mesh_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Animation_0_cpp = Module["__GLOBAL__sub_I_Modules_Animation_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Animation_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Animation_2_cpp = Module["__GLOBAL__sub_I_Modules_Animation_2_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Animation_2_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Animation_7_cpp = Module["__GLOBAL__sub_I_Modules_Animation_7_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Animation_7_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Animation_Constraints_0_cpp = Module["__GLOBAL__sub_I_Modules_Animation_Constraints_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Animation_Constraints_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_AssetBundle_Public_0_cpp = Module["__GLOBAL__sub_I_Modules_AssetBundle_Public_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_AssetBundle_Public_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Audio_Public_0_cpp = Module["__GLOBAL__sub_I_Modules_Audio_Public_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Audio_Public_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Audio_Public_1_cpp = Module["__GLOBAL__sub_I_Modules_Audio_Public_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Audio_Public_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Audio_Public_2_cpp = Module["__GLOBAL__sub_I_Modules_Audio_Public_2_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Audio_Public_2_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Audio_Public_3_cpp = Module["__GLOBAL__sub_I_Modules_Audio_Public_3_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Audio_Public_3_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Audio_Public_ScriptBindings_1_cpp = Module["__GLOBAL__sub_I_Modules_Audio_Public_ScriptBindings_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Audio_Public_ScriptBindings_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Audio_Public_sound_0_cpp = Module["__GLOBAL__sub_I_Modules_Audio_Public_sound_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Audio_Public_sound_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Cloth_0_cpp = Module["__GLOBAL__sub_I_Modules_Cloth_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Cloth_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_DSPGraph_Public_1_cpp = Module["__GLOBAL__sub_I_Modules_DSPGraph_Public_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_DSPGraph_Public_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Grid_Public_0_cpp = Module["__GLOBAL__sub_I_Modules_Grid_Public_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Grid_Public_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_IMGUI_0_cpp = Module["__GLOBAL__sub_I_Modules_IMGUI_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_IMGUI_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_IMGUI_1_cpp = Module["__GLOBAL__sub_I_Modules_IMGUI_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_IMGUI_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Input_Private_0_cpp = Module["__GLOBAL__sub_I_Modules_Input_Private_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Input_Private_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_ParticleSystem_0_cpp = Module["__GLOBAL__sub_I_Modules_ParticleSystem_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_ParticleSystem_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_ParticleSystem_1_cpp = Module["__GLOBAL__sub_I_Modules_ParticleSystem_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_ParticleSystem_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Physics2D_Public_0_cpp = Module["__GLOBAL__sub_I_Modules_Physics2D_Public_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Physics2D_Public_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Physics2D_Public_1_cpp = Module["__GLOBAL__sub_I_Modules_Physics2D_Public_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Physics2D_Public_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Physics_0_cpp = Module["__GLOBAL__sub_I_Modules_Physics_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Physics_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Physics_2_cpp = Module["__GLOBAL__sub_I_Modules_Physics_2_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Physics_2_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Profiler_Public_1_cpp = Module["__GLOBAL__sub_I_Modules_Profiler_Public_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Profiler_Public_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Profiler_Runtime_1_cpp = Module["__GLOBAL__sub_I_Modules_Profiler_Runtime_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Profiler_Runtime_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Subsystems_0_cpp = Module["__GLOBAL__sub_I_Modules_Subsystems_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Subsystems_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Terrain_Public_0_cpp = Module["__GLOBAL__sub_I_Modules_Terrain_Public_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Terrain_Public_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Terrain_Public_1_cpp = Module["__GLOBAL__sub_I_Modules_Terrain_Public_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Terrain_Public_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Terrain_Public_2_cpp = Module["__GLOBAL__sub_I_Modules_Terrain_Public_2_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Terrain_Public_2_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Terrain_Public_3_cpp = Module["__GLOBAL__sub_I_Modules_Terrain_Public_3_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Terrain_Public_3_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Terrain_VR_0_cpp = Module["__GLOBAL__sub_I_Modules_Terrain_VR_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Terrain_VR_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_TextCore_Native_FontEngine_0_cpp = Module["__GLOBAL__sub_I_Modules_TextCore_Native_FontEngine_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_TextCore_Native_FontEngine_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_TextRendering_Public_0_cpp = Module["__GLOBAL__sub_I_Modules_TextRendering_Public_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_TextRendering_Public_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Tilemap_0_cpp = Module["__GLOBAL__sub_I_Modules_Tilemap_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Tilemap_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Tilemap_Public_0_cpp = Module["__GLOBAL__sub_I_Modules_Tilemap_Public_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Tilemap_Public_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_UI_0_cpp = Module["__GLOBAL__sub_I_Modules_UI_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_UI_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_UI_1_cpp = Module["__GLOBAL__sub_I_Modules_UI_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_UI_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_UI_2_cpp = Module["__GLOBAL__sub_I_Modules_UI_2_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_UI_2_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_UnityWebRequest_Public_0_cpp = Module["__GLOBAL__sub_I_Modules_UnityWebRequest_Public_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_UnityWebRequest_Public_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_VFX_Public_0_cpp = Module["__GLOBAL__sub_I_Modules_VFX_Public_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_VFX_Public_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_VFX_Public_1_cpp = Module["__GLOBAL__sub_I_Modules_VFX_Public_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_VFX_Public_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_VFX_Public_Systems_0_cpp = Module["__GLOBAL__sub_I_Modules_VFX_Public_Systems_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_VFX_Public_Systems_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_VR_0_cpp = Module["__GLOBAL__sub_I_Modules_VR_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_VR_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Video_Public_Base_0_cpp = Module["__GLOBAL__sub_I_Modules_Video_Public_Base_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Video_Public_Base_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_Video_Public_Base_1_cpp = Module["__GLOBAL__sub_I_Modules_Video_Public_Base_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_Video_Public_Base_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Modules_XR_Subsystems_Input_Public_1_cpp = Module["__GLOBAL__sub_I_Modules_XR_Subsystems_Input_Public_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Modules_XR_Subsystems_Input_Public_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_ParticleSystemGeometryJob_cpp = Module["__GLOBAL__sub_I_ParticleSystemGeometryJob_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_ParticleSystemGeometryJob_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_ParticleSystemScriptingClasses_cpp = Module["__GLOBAL__sub_I_ParticleSystemScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_ParticleSystemScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Physics2DScriptingClasses_cpp = Module["__GLOBAL__sub_I_Physics2DScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Physics2DScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_PhysicsQuery_cpp = Module["__GLOBAL__sub_I_PhysicsQuery_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_PhysicsQuery_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_PhysicsScriptingClasses_cpp = Module["__GLOBAL__sub_I_PhysicsScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_PhysicsScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_PlatformDependent_WebGL_External_baselib_builds_Source_0_cpp = Module["__GLOBAL__sub_I_PlatformDependent_WebGL_External_baselib_builds_Source_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_PlatformDependent_WebGL_External_baselib_builds_Source_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_PlatformDependent_WebGL_Source_0_cpp = Module["__GLOBAL__sub_I_PlatformDependent_WebGL_Source_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_PlatformDependent_WebGL_Source_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_PlatformDependent_WebGL_Source_2_cpp = Module["__GLOBAL__sub_I_PlatformDependent_WebGL_Source_2_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_PlatformDependent_WebGL_Source_2_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_PluginInterfaceVR_cpp = Module["__GLOBAL__sub_I_PluginInterfaceVR_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_PluginInterfaceVR_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_2D_Renderer_0_cpp = Module["__GLOBAL__sub_I_Runtime_2D_Renderer_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_2D_Renderer_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_2D_Sorting_0_cpp = Module["__GLOBAL__sub_I_Runtime_2D_Sorting_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_2D_Sorting_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_2D_SpriteAtlas_0_cpp = Module["__GLOBAL__sub_I_Runtime_2D_SpriteAtlas_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_2D_SpriteAtlas_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Allocator_1_cpp = Module["__GLOBAL__sub_I_Runtime_Allocator_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Allocator_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Allocator_2_cpp = Module["__GLOBAL__sub_I_Runtime_Allocator_2_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Allocator_2_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Application_0_cpp = Module["__GLOBAL__sub_I_Runtime_Application_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Application_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_BaseClasses_0_cpp = Module["__GLOBAL__sub_I_Runtime_BaseClasses_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_BaseClasses_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_BaseClasses_1_cpp = Module["__GLOBAL__sub_I_Runtime_BaseClasses_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_BaseClasses_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_BaseClasses_2_cpp = Module["__GLOBAL__sub_I_Runtime_BaseClasses_2_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_BaseClasses_2_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_BaseClasses_3_cpp = Module["__GLOBAL__sub_I_Runtime_BaseClasses_3_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_BaseClasses_3_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Bootstrap_0_cpp = Module["__GLOBAL__sub_I_Runtime_Bootstrap_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Bootstrap_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Burst_0_cpp = Module["__GLOBAL__sub_I_Runtime_Burst_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Burst_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Camera_0_cpp = Module["__GLOBAL__sub_I_Runtime_Camera_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Camera_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Camera_1_cpp = Module["__GLOBAL__sub_I_Runtime_Camera_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Camera_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Camera_2_cpp = Module["__GLOBAL__sub_I_Runtime_Camera_2_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Camera_2_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Camera_6_cpp = Module["__GLOBAL__sub_I_Runtime_Camera_6_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Camera_6_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Camera_7_cpp = Module["__GLOBAL__sub_I_Runtime_Camera_7_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Camera_7_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Camera_8_cpp = Module["__GLOBAL__sub_I_Runtime_Camera_8_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Camera_8_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Camera_Culling_0_cpp = Module["__GLOBAL__sub_I_Runtime_Camera_Culling_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Camera_Culling_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Camera_RenderLoops_0_cpp = Module["__GLOBAL__sub_I_Runtime_Camera_RenderLoops_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Camera_RenderLoops_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Camera_RenderLoops_2_cpp = Module["__GLOBAL__sub_I_Runtime_Camera_RenderLoops_2_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Camera_RenderLoops_2_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Containers_0_cpp = Module["__GLOBAL__sub_I_Runtime_Containers_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Containers_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Core_Callbacks_0_cpp = Module["__GLOBAL__sub_I_Runtime_Core_Callbacks_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Core_Callbacks_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Director_Core_1_cpp = Module["__GLOBAL__sub_I_Runtime_Director_Core_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Director_Core_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Export_Unsafe_0_cpp = Module["__GLOBAL__sub_I_Runtime_Export_Unsafe_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Export_Unsafe_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_File_0_cpp = Module["__GLOBAL__sub_I_Runtime_File_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_File_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Geometry_2_cpp = Module["__GLOBAL__sub_I_Runtime_Geometry_2_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Geometry_2_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_GfxDevice_1_cpp = Module["__GLOBAL__sub_I_Runtime_GfxDevice_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_GfxDevice_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_GfxDevice_2_cpp = Module["__GLOBAL__sub_I_Runtime_GfxDevice_2_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_GfxDevice_2_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_GfxDevice_3_cpp = Module["__GLOBAL__sub_I_Runtime_GfxDevice_3_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_GfxDevice_3_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_GfxDevice_4_cpp = Module["__GLOBAL__sub_I_Runtime_GfxDevice_4_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_GfxDevice_4_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_GfxDevice_5_cpp = Module["__GLOBAL__sub_I_Runtime_GfxDevice_5_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_GfxDevice_5_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_GfxDevice_opengles_0_cpp = Module["__GLOBAL__sub_I_Runtime_GfxDevice_opengles_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_GfxDevice_opengles_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Graphics_0_cpp = Module["__GLOBAL__sub_I_Runtime_Graphics_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Graphics_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Graphics_10_cpp = Module["__GLOBAL__sub_I_Runtime_Graphics_10_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Graphics_10_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Graphics_11_cpp = Module["__GLOBAL__sub_I_Runtime_Graphics_11_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Graphics_11_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Graphics_12_cpp = Module["__GLOBAL__sub_I_Runtime_Graphics_12_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Graphics_12_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Graphics_1_cpp = Module["__GLOBAL__sub_I_Runtime_Graphics_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Graphics_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Graphics_2_cpp = Module["__GLOBAL__sub_I_Runtime_Graphics_2_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Graphics_2_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Graphics_4_cpp = Module["__GLOBAL__sub_I_Runtime_Graphics_4_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Graphics_4_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Graphics_5_cpp = Module["__GLOBAL__sub_I_Runtime_Graphics_5_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Graphics_5_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Graphics_6_cpp = Module["__GLOBAL__sub_I_Runtime_Graphics_6_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Graphics_6_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Graphics_8_cpp = Module["__GLOBAL__sub_I_Runtime_Graphics_8_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Graphics_8_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Graphics_9_cpp = Module["__GLOBAL__sub_I_Runtime_Graphics_9_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Graphics_9_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Graphics_Billboard_0_cpp = Module["__GLOBAL__sub_I_Runtime_Graphics_Billboard_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Graphics_Billboard_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Graphics_CommandBuffer_0_cpp = Module["__GLOBAL__sub_I_Runtime_Graphics_CommandBuffer_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Graphics_CommandBuffer_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Graphics_LOD_0_cpp = Module["__GLOBAL__sub_I_Runtime_Graphics_LOD_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Graphics_LOD_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Graphics_Mesh_0_cpp = Module["__GLOBAL__sub_I_Runtime_Graphics_Mesh_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Graphics_Mesh_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Graphics_Mesh_1_cpp = Module["__GLOBAL__sub_I_Runtime_Graphics_Mesh_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Graphics_Mesh_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Graphics_Mesh_2_cpp = Module["__GLOBAL__sub_I_Runtime_Graphics_Mesh_2_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Graphics_Mesh_2_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Graphics_Mesh_4_cpp = Module["__GLOBAL__sub_I_Runtime_Graphics_Mesh_4_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Graphics_Mesh_4_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Graphics_Mesh_5_cpp = Module["__GLOBAL__sub_I_Runtime_Graphics_Mesh_5_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Graphics_Mesh_5_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Graphics_ScriptableRenderLoop_0_cpp = Module["__GLOBAL__sub_I_Runtime_Graphics_ScriptableRenderLoop_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Graphics_ScriptableRenderLoop_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Input_0_cpp = Module["__GLOBAL__sub_I_Runtime_Input_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Input_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Interfaces_0_cpp = Module["__GLOBAL__sub_I_Runtime_Interfaces_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Interfaces_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Interfaces_1_cpp = Module["__GLOBAL__sub_I_Runtime_Interfaces_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Interfaces_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Interfaces_2_cpp = Module["__GLOBAL__sub_I_Runtime_Interfaces_2_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Interfaces_2_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Jobs_0_cpp = Module["__GLOBAL__sub_I_Runtime_Jobs_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Jobs_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Jobs_1_cpp = Module["__GLOBAL__sub_I_Runtime_Jobs_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Jobs_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Jobs_2_cpp = Module["__GLOBAL__sub_I_Runtime_Jobs_2_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Jobs_2_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Jobs_Internal_1_cpp = Module["__GLOBAL__sub_I_Runtime_Jobs_Internal_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Jobs_Internal_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Jobs_ScriptBindings_0_cpp = Module["__GLOBAL__sub_I_Runtime_Jobs_ScriptBindings_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Jobs_ScriptBindings_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Math_2_cpp = Module["__GLOBAL__sub_I_Runtime_Math_2_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Math_2_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Math_Random_0_cpp = Module["__GLOBAL__sub_I_Runtime_Math_Random_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Math_Random_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Misc_0_cpp = Module["__GLOBAL__sub_I_Runtime_Misc_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Misc_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Misc_2_cpp = Module["__GLOBAL__sub_I_Runtime_Misc_2_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Misc_2_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Misc_3_cpp = Module["__GLOBAL__sub_I_Runtime_Misc_3_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Misc_3_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Misc_4_cpp = Module["__GLOBAL__sub_I_Runtime_Misc_4_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Misc_4_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Misc_5_cpp = Module["__GLOBAL__sub_I_Runtime_Misc_5_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Misc_5_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Modules_0_cpp = Module["__GLOBAL__sub_I_Runtime_Modules_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Modules_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Mono_SerializationBackend_DirectMemoryAccess_0_cpp = Module["__GLOBAL__sub_I_Runtime_Mono_SerializationBackend_DirectMemoryAccess_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Mono_SerializationBackend_DirectMemoryAccess_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Mono_SerializationBackend_DirectMemoryAccess_1_cpp = Module["__GLOBAL__sub_I_Runtime_Mono_SerializationBackend_DirectMemoryAccess_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Mono_SerializationBackend_DirectMemoryAccess_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_PluginInterface_0_cpp = Module["__GLOBAL__sub_I_Runtime_PluginInterface_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_PluginInterface_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_PreloadManager_0_cpp = Module["__GLOBAL__sub_I_Runtime_PreloadManager_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_PreloadManager_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Profiler_0_cpp = Module["__GLOBAL__sub_I_Runtime_Profiler_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Profiler_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Profiler_2_cpp = Module["__GLOBAL__sub_I_Runtime_Profiler_2_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Profiler_2_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Profiler_ExternalGPUProfiler_0_cpp = Module["__GLOBAL__sub_I_Runtime_Profiler_ExternalGPUProfiler_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Profiler_ExternalGPUProfiler_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Profiler_ScriptBindings_0_cpp = Module["__GLOBAL__sub_I_Runtime_Profiler_ScriptBindings_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Profiler_ScriptBindings_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_SceneManager_0_cpp = Module["__GLOBAL__sub_I_Runtime_SceneManager_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_SceneManager_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_ScriptingBackend_Il2Cpp_0_cpp = Module["__GLOBAL__sub_I_Runtime_ScriptingBackend_Il2Cpp_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_ScriptingBackend_Il2Cpp_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Scripting_0_cpp = Module["__GLOBAL__sub_I_Runtime_Scripting_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Scripting_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Scripting_2_cpp = Module["__GLOBAL__sub_I_Runtime_Scripting_2_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Scripting_2_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Scripting_3_cpp = Module["__GLOBAL__sub_I_Runtime_Scripting_3_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Scripting_3_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Scripting_APIUpdating_0_cpp = Module["__GLOBAL__sub_I_Runtime_Scripting_APIUpdating_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Scripting_APIUpdating_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Serialize_1_cpp = Module["__GLOBAL__sub_I_Runtime_Serialize_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Serialize_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Serialize_2_cpp = Module["__GLOBAL__sub_I_Runtime_Serialize_2_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Serialize_2_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Serialize_TransferFunctions_0_cpp = Module["__GLOBAL__sub_I_Runtime_Serialize_TransferFunctions_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Serialize_TransferFunctions_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Serialize_TransferFunctions_1_cpp = Module["__GLOBAL__sub_I_Runtime_Serialize_TransferFunctions_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Serialize_TransferFunctions_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Shaders_1_cpp = Module["__GLOBAL__sub_I_Runtime_Shaders_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Shaders_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Shaders_3_cpp = Module["__GLOBAL__sub_I_Runtime_Shaders_3_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Shaders_3_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Shaders_GpuPrograms_0_cpp = Module["__GLOBAL__sub_I_Runtime_Shaders_GpuPrograms_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Shaders_GpuPrograms_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Shaders_ShaderImpl_2_cpp = Module["__GLOBAL__sub_I_Runtime_Shaders_ShaderImpl_2_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Shaders_ShaderImpl_2_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Transform_0_cpp = Module["__GLOBAL__sub_I_Runtime_Transform_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Transform_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Transform_1_cpp = Module["__GLOBAL__sub_I_Runtime_Transform_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Transform_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Utilities_2_cpp = Module["__GLOBAL__sub_I_Runtime_Utilities_2_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Utilities_2_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Utilities_5_cpp = Module["__GLOBAL__sub_I_Runtime_Utilities_5_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Utilities_5_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Utilities_6_cpp = Module["__GLOBAL__sub_I_Runtime_Utilities_6_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Utilities_6_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Utilities_7_cpp = Module["__GLOBAL__sub_I_Runtime_Utilities_7_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Utilities_7_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Utilities_9_cpp = Module["__GLOBAL__sub_I_Runtime_Utilities_9_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Utilities_9_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_Video_0_cpp = Module["__GLOBAL__sub_I_Runtime_Video_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_Video_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Runtime_VirtualFileSystem_0_cpp = Module["__GLOBAL__sub_I_Runtime_VirtualFileSystem_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Runtime_VirtualFileSystem_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Shader_cpp = Module["__GLOBAL__sub_I_Shader_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Shader_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Shadows_cpp = Module["__GLOBAL__sub_I_Shadows_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Shadows_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_ShapeModule_cpp = Module["__GLOBAL__sub_I_ShapeModule_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_ShapeModule_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_SubsystemsScriptingClasses_cpp = Module["__GLOBAL__sub_I_SubsystemsScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_SubsystemsScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_SwInterCollision_cpp = Module["__GLOBAL__sub_I_SwInterCollision_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_SwInterCollision_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_SwSolverKernel_cpp = Module["__GLOBAL__sub_I_SwSolverKernel_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_SwSolverKernel_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_TLS_cpp = Module["__GLOBAL__sub_I_TLS_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_TLS_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_TemplateInstantiations_cpp = Module["__GLOBAL__sub_I_TemplateInstantiations_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_TemplateInstantiations_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_TerrainScriptingClasses_cpp = Module["__GLOBAL__sub_I_TerrainScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_TerrainScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_TextCoreScriptingClasses_cpp = Module["__GLOBAL__sub_I_TextCoreScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_TextCoreScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_TextRenderingScriptingClasses_cpp = Module["__GLOBAL__sub_I_TextRenderingScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_TextRenderingScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_TilemapScriptingClasses_cpp = Module["__GLOBAL__sub_I_TilemapScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_TilemapScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_UIElementsNativeScriptingClasses_cpp = Module["__GLOBAL__sub_I_UIElementsNativeScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_UIElementsNativeScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_UIScriptingClasses_cpp = Module["__GLOBAL__sub_I_UIScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_UIScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_UVModule_cpp = Module["__GLOBAL__sub_I_UVModule_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_UVModule_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_UnityAdsSettings_cpp = Module["__GLOBAL__sub_I_UnityAdsSettings_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_UnityAdsSettings_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_UnityAnalyticsScriptingClasses_cpp = Module["__GLOBAL__sub_I_UnityAnalyticsScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_UnityAnalyticsScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_UnityWebRequestScriptingClasses_cpp = Module["__GLOBAL__sub_I_UnityWebRequestScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_UnityWebRequestScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_VFXScriptingClasses_cpp = Module["__GLOBAL__sub_I_VFXScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_VFXScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_VRScriptingClasses_cpp = Module["__GLOBAL__sub_I_VRScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_VRScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_VideoScriptingClasses_cpp = Module["__GLOBAL__sub_I_VideoScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_VideoScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_VideoYUV420Convert_cpp = Module["__GLOBAL__sub_I_VideoYUV420Convert_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_VideoYUV420Convert_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_VisualEffectAsset_cpp = Module["__GLOBAL__sub_I_VisualEffectAsset_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_VisualEffectAsset_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_Wind_cpp = Module["__GLOBAL__sub_I_Wind_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_Wind_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_XRScriptingClasses_cpp = Module["__GLOBAL__sub_I_XRScriptingClasses_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_XRScriptingClasses_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_artifacts_WebGL_codegenerator_0_cpp = Module["__GLOBAL__sub_I_artifacts_WebGL_codegenerator_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_artifacts_WebGL_codegenerator_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_clipmuscle_cpp = Module["__GLOBAL__sub_I_clipmuscle_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_clipmuscle_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_iostream_cpp = Module["__GLOBAL__sub_I_iostream_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_iostream_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_nvcloth_src_0_cpp = Module["__GLOBAL__sub_I_nvcloth_src_0_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_nvcloth_src_0_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_nvcloth_src_1_cpp = Module["__GLOBAL__sub_I_nvcloth_src_1_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_nvcloth_src_1_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_physx_source_physxextensions_src_2_cpp = Module["__GLOBAL__sub_I_physx_source_physxextensions_src_2_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_physx_source_physxextensions_src_2_cpp"].apply(null, arguments) };
var __GLOBAL__sub_I_status_cc = Module["__GLOBAL__sub_I_status_cc"] = function() {  return Module["asm"]["__GLOBAL__sub_I_status_cc"].apply(null, arguments) };
var __GLOBAL__sub_I_umbra_cpp = Module["__GLOBAL__sub_I_umbra_cpp"] = function() {  return Module["asm"]["__GLOBAL__sub_I_umbra_cpp"].apply(null, arguments) };
var __ZSt18uncaught_exceptionv = Module["__ZSt18uncaught_exceptionv"] = function() {  return Module["asm"]["__ZSt18uncaught_exceptionv"].apply(null, arguments) };
var ___cxa_can_catch = Module["___cxa_can_catch"] = function() {  return Module["asm"]["___cxa_can_catch"].apply(null, arguments) };
var ___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = function() {  return Module["asm"]["___cxa_is_pointer_type"].apply(null, arguments) };
var ___cxx_global_var_init = Module["___cxx_global_var_init"] = function() {  return Module["asm"]["___cxx_global_var_init"].apply(null, arguments) };
var ___cxx_global_var_init_104 = Module["___cxx_global_var_init_104"] = function() {  return Module["asm"]["___cxx_global_var_init_104"].apply(null, arguments) };
var ___cxx_global_var_init_130 = Module["___cxx_global_var_init_130"] = function() {  return Module["asm"]["___cxx_global_var_init_130"].apply(null, arguments) };
var ___cxx_global_var_init_17 = Module["___cxx_global_var_init_17"] = function() {  return Module["asm"]["___cxx_global_var_init_17"].apply(null, arguments) };
var ___cxx_global_var_init_18 = Module["___cxx_global_var_init_18"] = function() {  return Module["asm"]["___cxx_global_var_init_18"].apply(null, arguments) };
var ___cxx_global_var_init_18_1167 = Module["___cxx_global_var_init_18_1167"] = function() {  return Module["asm"]["___cxx_global_var_init_18_1167"].apply(null, arguments) };
var ___cxx_global_var_init_19 = Module["___cxx_global_var_init_19"] = function() {  return Module["asm"]["___cxx_global_var_init_19"].apply(null, arguments) };
var ___cxx_global_var_init_22 = Module["___cxx_global_var_init_22"] = function() {  return Module["asm"]["___cxx_global_var_init_22"].apply(null, arguments) };
var ___cxx_global_var_init_3773 = Module["___cxx_global_var_init_3773"] = function() {  return Module["asm"]["___cxx_global_var_init_3773"].apply(null, arguments) };
var ___cxx_global_var_init_7638 = Module["___cxx_global_var_init_7638"] = function() {  return Module["asm"]["___cxx_global_var_init_7638"].apply(null, arguments) };
var ___cxx_global_var_init_8611 = Module["___cxx_global_var_init_8611"] = function() {  return Module["asm"]["___cxx_global_var_init_8611"].apply(null, arguments) };
var ___cxx_global_var_init_8792 = Module["___cxx_global_var_init_8792"] = function() {  return Module["asm"]["___cxx_global_var_init_8792"].apply(null, arguments) };
var ___cxx_global_var_init_89 = Module["___cxx_global_var_init_89"] = function() {  return Module["asm"]["___cxx_global_var_init_89"].apply(null, arguments) };
var ___cxx_global_var_init_9187 = Module["___cxx_global_var_init_9187"] = function() {  return Module["asm"]["___cxx_global_var_init_9187"].apply(null, arguments) };
var ___emscripten_environ_constructor = Module["___emscripten_environ_constructor"] = function() {  return Module["asm"]["___emscripten_environ_constructor"].apply(null, arguments) };
var ___errno_location = Module["___errno_location"] = function() {  return Module["asm"]["___errno_location"].apply(null, arguments) };
var __get_daylight = Module["__get_daylight"] = function() {  return Module["asm"]["__get_daylight"].apply(null, arguments) };
var __get_environ = Module["__get_environ"] = function() {  return Module["asm"]["__get_environ"].apply(null, arguments) };
var __get_timezone = Module["__get_timezone"] = function() {  return Module["asm"]["__get_timezone"].apply(null, arguments) };
var __get_tzname = Module["__get_tzname"] = function() {  return Module["asm"]["__get_tzname"].apply(null, arguments) };
var _emscripten_replace_memory = Module["_emscripten_replace_memory"] = function() {  return Module["asm"]["_emscripten_replace_memory"].apply(null, arguments) };
var _free = Module["_free"] = function() {  return Module["asm"]["_free"].apply(null, arguments) };
var _htonl = Module["_htonl"] = function() {  return Module["asm"]["_htonl"].apply(null, arguments) };
var _htons = Module["_htons"] = function() {  return Module["asm"]["_htons"].apply(null, arguments) };
var _i64Add = Module["_i64Add"] = function() {  return Module["asm"]["_i64Add"].apply(null, arguments) };
var _llvm_bswap_i16 = Module["_llvm_bswap_i16"] = function() {  return Module["asm"]["_llvm_bswap_i16"].apply(null, arguments) };
var _llvm_bswap_i32 = Module["_llvm_bswap_i32"] = function() {  return Module["asm"]["_llvm_bswap_i32"].apply(null, arguments) };
var _llvm_ctlz_i64 = Module["_llvm_ctlz_i64"] = function() {  return Module["asm"]["_llvm_ctlz_i64"].apply(null, arguments) };
var _llvm_ctpop_i32 = Module["_llvm_ctpop_i32"] = function() {  return Module["asm"]["_llvm_ctpop_i32"].apply(null, arguments) };
var _llvm_maxnum_f32 = Module["_llvm_maxnum_f32"] = function() {  return Module["asm"]["_llvm_maxnum_f32"].apply(null, arguments) };
var _llvm_maxnum_f64 = Module["_llvm_maxnum_f64"] = function() {  return Module["asm"]["_llvm_maxnum_f64"].apply(null, arguments) };
var _llvm_minnum_f32 = Module["_llvm_minnum_f32"] = function() {  return Module["asm"]["_llvm_minnum_f32"].apply(null, arguments) };
var _llvm_round_f32 = Module["_llvm_round_f32"] = function() {  return Module["asm"]["_llvm_round_f32"].apply(null, arguments) };
var _main = Module["_main"] = function() {  return Module["asm"]["_main"].apply(null, arguments) };
var _malloc = Module["_malloc"] = function() {  return Module["asm"]["_malloc"].apply(null, arguments) };
var _memalign = Module["_memalign"] = function() {  return Module["asm"]["_memalign"].apply(null, arguments) };
var _memcpy = Module["_memcpy"] = function() {  return Module["asm"]["_memcpy"].apply(null, arguments) };
var _memmove = Module["_memmove"] = function() {  return Module["asm"]["_memmove"].apply(null, arguments) };
var _memset = Module["_memset"] = function() {  return Module["asm"]["_memset"].apply(null, arguments) };
var _ntohs = Module["_ntohs"] = function() {  return Module["asm"]["_ntohs"].apply(null, arguments) };
var _pthread_cond_broadcast = Module["_pthread_cond_broadcast"] = function() {  return Module["asm"]["_pthread_cond_broadcast"].apply(null, arguments) };
var _pthread_mutex_lock = Module["_pthread_mutex_lock"] = function() {  return Module["asm"]["_pthread_mutex_lock"].apply(null, arguments) };
var _pthread_mutex_unlock = Module["_pthread_mutex_unlock"] = function() {  return Module["asm"]["_pthread_mutex_unlock"].apply(null, arguments) };
var _realloc = Module["_realloc"] = function() {  return Module["asm"]["_realloc"].apply(null, arguments) };
var _saveSetjmp = Module["_saveSetjmp"] = function() {  return Module["asm"]["_saveSetjmp"].apply(null, arguments) };
var _sbrk = Module["_sbrk"] = function() {  return Module["asm"]["_sbrk"].apply(null, arguments) };
var _strlen = Module["_strlen"] = function() {  return Module["asm"]["_strlen"].apply(null, arguments) };
var _testSetjmp = Module["_testSetjmp"] = function() {  return Module["asm"]["_testSetjmp"].apply(null, arguments) };
var _trail__bridge_on_message = Module["_trail__bridge_on_message"] = function() {  return Module["asm"]["_trail__bridge_on_message"].apply(null, arguments) };
var _trail__flk_dispatch_read_file_callback = Module["_trail__flk_dispatch_read_file_callback"] = function() {  return Module["asm"]["_trail__flk_dispatch_read_file_callback"].apply(null, arguments) };
var _trail__flk_dispatch_sync_cloud_storage_callback = Module["_trail__flk_dispatch_sync_cloud_storage_callback"] = function() {  return Module["asm"]["_trail__flk_dispatch_sync_cloud_storage_callback"].apply(null, arguments) };
var _trail__instrument_fps_onpause = Module["_trail__instrument_fps_onpause"] = function() {  return Module["asm"]["_trail__instrument_fps_onpause"].apply(null, arguments) };
var _trail__instrument_fps_ontoggle = Module["_trail__instrument_fps_ontoggle"] = function() {  return Module["asm"]["_trail__instrument_fps_ontoggle"].apply(null, arguments) };
var _trail__sdk_crash = Module["_trail__sdk_crash"] = function() {  return Module["asm"]["_trail__sdk_crash"].apply(null, arguments) };
var _trail__sdk_post_frame = Module["_trail__sdk_post_frame"] = function() {  return Module["asm"]["_trail__sdk_post_frame"].apply(null, arguments) };
var _trail__sdk_pre_frame = Module["_trail__sdk_pre_frame"] = function() {  return Module["asm"]["_trail__sdk_pre_frame"].apply(null, arguments) };
var _trail__util_loop_delete_cb = Module["_trail__util_loop_delete_cb"] = function() {  return Module["asm"]["_trail__util_loop_delete_cb"].apply(null, arguments) };
var _trail__util_loop_handle_cb = Module["_trail__util_loop_handle_cb"] = function() {  return Module["asm"]["_trail__util_loop_handle_cb"].apply(null, arguments) };
var _trail__util_loop_handle_interval_cb = Module["_trail__util_loop_handle_interval_cb"] = function() {  return Module["asm"]["_trail__util_loop_handle_interval_cb"].apply(null, arguments) };
var _trail__util_loop_handle_timeout_cb = Module["_trail__util_loop_handle_timeout_cb"] = function() {  return Module["asm"]["_trail__util_loop_handle_timeout_cb"].apply(null, arguments) };
var establishStackSpace = Module["establishStackSpace"] = function() {  return Module["asm"]["establishStackSpace"].apply(null, arguments) };
var getTempRet0 = Module["getTempRet0"] = function() {  return Module["asm"]["getTempRet0"].apply(null, arguments) };
var runPostSets = Module["runPostSets"] = function() {  return Module["asm"]["runPostSets"].apply(null, arguments) };
var setTempRet0 = Module["setTempRet0"] = function() {  return Module["asm"]["setTempRet0"].apply(null, arguments) };
var setThrew = Module["setThrew"] = function() {  return Module["asm"]["setThrew"].apply(null, arguments) };
var stackAlloc = Module["stackAlloc"] = function() {  return Module["asm"]["stackAlloc"].apply(null, arguments) };
var stackRestore = Module["stackRestore"] = function() {  return Module["asm"]["stackRestore"].apply(null, arguments) };
var stackSave = Module["stackSave"] = function() {  return Module["asm"]["stackSave"].apply(null, arguments) };
var dynCall_dddi = Module["dynCall_dddi"] = function() {  return Module["asm"]["dynCall_dddi"].apply(null, arguments) };
var dynCall_ddi = Module["dynCall_ddi"] = function() {  return Module["asm"]["dynCall_ddi"].apply(null, arguments) };
var dynCall_ddidi = Module["dynCall_ddidi"] = function() {  return Module["asm"]["dynCall_ddidi"].apply(null, arguments) };
var dynCall_dfi = Module["dynCall_dfi"] = function() {  return Module["asm"]["dynCall_dfi"].apply(null, arguments) };
var dynCall_di = Module["dynCall_di"] = function() {  return Module["asm"]["dynCall_di"].apply(null, arguments) };
var dynCall_diddi = Module["dynCall_diddi"] = function() {  return Module["asm"]["dynCall_diddi"].apply(null, arguments) };
var dynCall_didi = Module["dynCall_didi"] = function() {  return Module["asm"]["dynCall_didi"].apply(null, arguments) };
var dynCall_dii = Module["dynCall_dii"] = function() {  return Module["asm"]["dynCall_dii"].apply(null, arguments) };
var dynCall_diii = Module["dynCall_diii"] = function() {  return Module["asm"]["dynCall_diii"].apply(null, arguments) };
var dynCall_diiii = Module["dynCall_diiii"] = function() {  return Module["asm"]["dynCall_diiii"].apply(null, arguments) };
var dynCall_dij = Module["dynCall_dij"] = function() {  return Module["asm"]["dynCall_dij"].apply(null, arguments) };
var dynCall_dji = Module["dynCall_dji"] = function() {  return Module["asm"]["dynCall_dji"].apply(null, arguments) };
var dynCall_f = Module["dynCall_f"] = function() {  return Module["asm"]["dynCall_f"].apply(null, arguments) };
var dynCall_fdi = Module["dynCall_fdi"] = function() {  return Module["asm"]["dynCall_fdi"].apply(null, arguments) };
var dynCall_ff = Module["dynCall_ff"] = function() {  return Module["asm"]["dynCall_ff"].apply(null, arguments) };
var dynCall_fff = Module["dynCall_fff"] = function() {  return Module["asm"]["dynCall_fff"].apply(null, arguments) };
var dynCall_ffffffi = Module["dynCall_ffffffi"] = function() {  return Module["asm"]["dynCall_ffffffi"].apply(null, arguments) };
var dynCall_ffffi = Module["dynCall_ffffi"] = function() {  return Module["asm"]["dynCall_ffffi"].apply(null, arguments) };
var dynCall_fffi = Module["dynCall_fffi"] = function() {  return Module["asm"]["dynCall_fffi"].apply(null, arguments) };
var dynCall_fffifffi = Module["dynCall_fffifffi"] = function() {  return Module["asm"]["dynCall_fffifffi"].apply(null, arguments) };
var dynCall_ffi = Module["dynCall_ffi"] = function() {  return Module["asm"]["dynCall_ffi"].apply(null, arguments) };
var dynCall_fi = Module["dynCall_fi"] = function() {  return Module["asm"]["dynCall_fi"].apply(null, arguments) };
var dynCall_fidi = Module["dynCall_fidi"] = function() {  return Module["asm"]["dynCall_fidi"].apply(null, arguments) };
var dynCall_fif = Module["dynCall_fif"] = function() {  return Module["asm"]["dynCall_fif"].apply(null, arguments) };
var dynCall_fiff = Module["dynCall_fiff"] = function() {  return Module["asm"]["dynCall_fiff"].apply(null, arguments) };
var dynCall_fifffi = Module["dynCall_fifffi"] = function() {  return Module["asm"]["dynCall_fifffi"].apply(null, arguments) };
var dynCall_fiffi = Module["dynCall_fiffi"] = function() {  return Module["asm"]["dynCall_fiffi"].apply(null, arguments) };
var dynCall_fifi = Module["dynCall_fifi"] = function() {  return Module["asm"]["dynCall_fifi"].apply(null, arguments) };
var dynCall_fifii = Module["dynCall_fifii"] = function() {  return Module["asm"]["dynCall_fifii"].apply(null, arguments) };
var dynCall_fifiii = Module["dynCall_fifiii"] = function() {  return Module["asm"]["dynCall_fifiii"].apply(null, arguments) };
var dynCall_fifiiiii = Module["dynCall_fifiiiii"] = function() {  return Module["asm"]["dynCall_fifiiiii"].apply(null, arguments) };
var dynCall_fii = Module["dynCall_fii"] = function() {  return Module["asm"]["dynCall_fii"].apply(null, arguments) };
var dynCall_fiifi = Module["dynCall_fiifi"] = function() {  return Module["asm"]["dynCall_fiifi"].apply(null, arguments) };
var dynCall_fiifii = Module["dynCall_fiifii"] = function() {  return Module["asm"]["dynCall_fiifii"].apply(null, arguments) };
var dynCall_fiii = Module["dynCall_fiii"] = function() {  return Module["asm"]["dynCall_fiii"].apply(null, arguments) };
var dynCall_fiiifi = Module["dynCall_fiiifi"] = function() {  return Module["asm"]["dynCall_fiiifi"].apply(null, arguments) };
var dynCall_fiiifii = Module["dynCall_fiiifii"] = function() {  return Module["asm"]["dynCall_fiiifii"].apply(null, arguments) };
var dynCall_fiiii = Module["dynCall_fiiii"] = function() {  return Module["asm"]["dynCall_fiiii"].apply(null, arguments) };
var dynCall_fiiiif = Module["dynCall_fiiiif"] = function() {  return Module["asm"]["dynCall_fiiiif"].apply(null, arguments) };
var dynCall_fiiiii = Module["dynCall_fiiiii"] = function() {  return Module["asm"]["dynCall_fiiiii"].apply(null, arguments) };
var dynCall_fiiiiii = Module["dynCall_fiiiiii"] = function() {  return Module["asm"]["dynCall_fiiiiii"].apply(null, arguments) };
var dynCall_fiiiiiifiifif = Module["dynCall_fiiiiiifiifif"] = function() {  return Module["asm"]["dynCall_fiiiiiifiifif"].apply(null, arguments) };
var dynCall_fiiiiiifiiiif = Module["dynCall_fiiiiiifiiiif"] = function() {  return Module["asm"]["dynCall_fiiiiiifiiiif"].apply(null, arguments) };
var dynCall_fji = Module["dynCall_fji"] = function() {  return Module["asm"]["dynCall_fji"].apply(null, arguments) };
var dynCall_i = Module["dynCall_i"] = function() {  return Module["asm"]["dynCall_i"].apply(null, arguments) };
var dynCall_idi = Module["dynCall_idi"] = function() {  return Module["asm"]["dynCall_idi"].apply(null, arguments) };
var dynCall_idii = Module["dynCall_idii"] = function() {  return Module["asm"]["dynCall_idii"].apply(null, arguments) };
var dynCall_idiii = Module["dynCall_idiii"] = function() {  return Module["asm"]["dynCall_idiii"].apply(null, arguments) };
var dynCall_iffffi = Module["dynCall_iffffi"] = function() {  return Module["asm"]["dynCall_iffffi"].apply(null, arguments) };
var dynCall_ifffi = Module["dynCall_ifffi"] = function() {  return Module["asm"]["dynCall_ifffi"].apply(null, arguments) };
var dynCall_iffi = Module["dynCall_iffi"] = function() {  return Module["asm"]["dynCall_iffi"].apply(null, arguments) };
var dynCall_ifi = Module["dynCall_ifi"] = function() {  return Module["asm"]["dynCall_ifi"].apply(null, arguments) };
var dynCall_ifiii = Module["dynCall_ifiii"] = function() {  return Module["asm"]["dynCall_ifiii"].apply(null, arguments) };
var dynCall_ii = Module["dynCall_ii"] = function() {  return Module["asm"]["dynCall_ii"].apply(null, arguments) };
var dynCall_iiddi = Module["dynCall_iiddi"] = function() {  return Module["asm"]["dynCall_iiddi"].apply(null, arguments) };
var dynCall_iidi = Module["dynCall_iidi"] = function() {  return Module["asm"]["dynCall_iidi"].apply(null, arguments) };
var dynCall_iidii = Module["dynCall_iidii"] = function() {  return Module["asm"]["dynCall_iidii"].apply(null, arguments) };
var dynCall_iif = Module["dynCall_iif"] = function() {  return Module["asm"]["dynCall_iif"].apply(null, arguments) };
var dynCall_iifff = Module["dynCall_iifff"] = function() {  return Module["asm"]["dynCall_iifff"].apply(null, arguments) };
var dynCall_iifffffi = Module["dynCall_iifffffi"] = function() {  return Module["asm"]["dynCall_iifffffi"].apply(null, arguments) };
var dynCall_iiffffi = Module["dynCall_iiffffi"] = function() {  return Module["asm"]["dynCall_iiffffi"].apply(null, arguments) };
var dynCall_iiffffiii = Module["dynCall_iiffffiii"] = function() {  return Module["asm"]["dynCall_iiffffiii"].apply(null, arguments) };
var dynCall_iiffffiiiiiii = Module["dynCall_iiffffiiiiiii"] = function() {  return Module["asm"]["dynCall_iiffffiiiiiii"].apply(null, arguments) };
var dynCall_iifffi = Module["dynCall_iifffi"] = function() {  return Module["asm"]["dynCall_iifffi"].apply(null, arguments) };
var dynCall_iifffiii = Module["dynCall_iifffiii"] = function() {  return Module["asm"]["dynCall_iifffiii"].apply(null, arguments) };
var dynCall_iiffi = Module["dynCall_iiffi"] = function() {  return Module["asm"]["dynCall_iiffi"].apply(null, arguments) };
var dynCall_iiffifi = Module["dynCall_iiffifi"] = function() {  return Module["asm"]["dynCall_iiffifi"].apply(null, arguments) };
var dynCall_iiffii = Module["dynCall_iiffii"] = function() {  return Module["asm"]["dynCall_iiffii"].apply(null, arguments) };
var dynCall_iiffiii = Module["dynCall_iiffiii"] = function() {  return Module["asm"]["dynCall_iiffiii"].apply(null, arguments) };
var dynCall_iiffiiii = Module["dynCall_iiffiiii"] = function() {  return Module["asm"]["dynCall_iiffiiii"].apply(null, arguments) };
var dynCall_iifi = Module["dynCall_iifi"] = function() {  return Module["asm"]["dynCall_iifi"].apply(null, arguments) };
var dynCall_iifii = Module["dynCall_iifii"] = function() {  return Module["asm"]["dynCall_iifii"].apply(null, arguments) };
var dynCall_iifiifffii = Module["dynCall_iifiifffii"] = function() {  return Module["asm"]["dynCall_iifiifffii"].apply(null, arguments) };
var dynCall_iifiiffi = Module["dynCall_iifiiffi"] = function() {  return Module["asm"]["dynCall_iifiiffi"].apply(null, arguments) };
var dynCall_iifiifiii = Module["dynCall_iifiifiii"] = function() {  return Module["asm"]["dynCall_iifiifiii"].apply(null, arguments) };
var dynCall_iifiii = Module["dynCall_iifiii"] = function() {  return Module["asm"]["dynCall_iifiii"].apply(null, arguments) };
var dynCall_iifiiii = Module["dynCall_iifiiii"] = function() {  return Module["asm"]["dynCall_iifiiii"].apply(null, arguments) };
var dynCall_iifiiiii = Module["dynCall_iifiiiii"] = function() {  return Module["asm"]["dynCall_iifiiiii"].apply(null, arguments) };
var dynCall_iifiiiijii = Module["dynCall_iifiiiijii"] = function() {  return Module["asm"]["dynCall_iifiiiijii"].apply(null, arguments) };
var dynCall_iii = Module["dynCall_iii"] = function() {  return Module["asm"]["dynCall_iii"].apply(null, arguments) };
var dynCall_iiiddi = Module["dynCall_iiiddi"] = function() {  return Module["asm"]["dynCall_iiiddi"].apply(null, arguments) };
var dynCall_iiidi = Module["dynCall_iiidi"] = function() {  return Module["asm"]["dynCall_iiidi"].apply(null, arguments) };
var dynCall_iiidii = Module["dynCall_iiidii"] = function() {  return Module["asm"]["dynCall_iiidii"].apply(null, arguments) };
var dynCall_iiidiii = Module["dynCall_iiidiii"] = function() {  return Module["asm"]["dynCall_iiidiii"].apply(null, arguments) };
var dynCall_iiif = Module["dynCall_iiif"] = function() {  return Module["asm"]["dynCall_iiif"].apply(null, arguments) };
var dynCall_iiifffiiii = Module["dynCall_iiifffiiii"] = function() {  return Module["asm"]["dynCall_iiifffiiii"].apply(null, arguments) };
var dynCall_iiiffiii = Module["dynCall_iiiffiii"] = function() {  return Module["asm"]["dynCall_iiiffiii"].apply(null, arguments) };
var dynCall_iiifi = Module["dynCall_iiifi"] = function() {  return Module["asm"]["dynCall_iiifi"].apply(null, arguments) };
var dynCall_iiififii = Module["dynCall_iiififii"] = function() {  return Module["asm"]["dynCall_iiififii"].apply(null, arguments) };
var dynCall_iiififiii = Module["dynCall_iiififiii"] = function() {  return Module["asm"]["dynCall_iiififiii"].apply(null, arguments) };
var dynCall_iiififiiii = Module["dynCall_iiififiiii"] = function() {  return Module["asm"]["dynCall_iiififiiii"].apply(null, arguments) };
var dynCall_iiifii = Module["dynCall_iiifii"] = function() {  return Module["asm"]["dynCall_iiifii"].apply(null, arguments) };
var dynCall_iiifiifffii = Module["dynCall_iiifiifffii"] = function() {  return Module["asm"]["dynCall_iiifiifffii"].apply(null, arguments) };
var dynCall_iiifiifii = Module["dynCall_iiifiifii"] = function() {  return Module["asm"]["dynCall_iiifiifii"].apply(null, arguments) };
var dynCall_iiifiifiii = Module["dynCall_iiifiifiii"] = function() {  return Module["asm"]["dynCall_iiifiifiii"].apply(null, arguments) };
var dynCall_iiifiii = Module["dynCall_iiifiii"] = function() {  return Module["asm"]["dynCall_iiifiii"].apply(null, arguments) };
var dynCall_iiifiiii = Module["dynCall_iiifiiii"] = function() {  return Module["asm"]["dynCall_iiifiiii"].apply(null, arguments) };
var dynCall_iiii = Module["dynCall_iiii"] = function() {  return Module["asm"]["dynCall_iiii"].apply(null, arguments) };
var dynCall_iiiifffffi = Module["dynCall_iiiifffffi"] = function() {  return Module["asm"]["dynCall_iiiifffffi"].apply(null, arguments) };
var dynCall_iiiifffffii = Module["dynCall_iiiifffffii"] = function() {  return Module["asm"]["dynCall_iiiifffffii"].apply(null, arguments) };
var dynCall_iiiifffiii = Module["dynCall_iiiifffiii"] = function() {  return Module["asm"]["dynCall_iiiifffiii"].apply(null, arguments) };
var dynCall_iiiiffiffii = Module["dynCall_iiiiffiffii"] = function() {  return Module["asm"]["dynCall_iiiiffiffii"].apply(null, arguments) };
var dynCall_iiiifi = Module["dynCall_iiiifi"] = function() {  return Module["asm"]["dynCall_iiiifi"].apply(null, arguments) };
var dynCall_iiiifii = Module["dynCall_iiiifii"] = function() {  return Module["asm"]["dynCall_iiiifii"].apply(null, arguments) };
var dynCall_iiiifiii = Module["dynCall_iiiifiii"] = function() {  return Module["asm"]["dynCall_iiiifiii"].apply(null, arguments) };
var dynCall_iiiifiiii = Module["dynCall_iiiifiiii"] = function() {  return Module["asm"]["dynCall_iiiifiiii"].apply(null, arguments) };
var dynCall_iiiifiiiii = Module["dynCall_iiiifiiiii"] = function() {  return Module["asm"]["dynCall_iiiifiiiii"].apply(null, arguments) };
var dynCall_iiiii = Module["dynCall_iiiii"] = function() {  return Module["asm"]["dynCall_iiiii"].apply(null, arguments) };
var dynCall_iiiiid = Module["dynCall_iiiiid"] = function() {  return Module["asm"]["dynCall_iiiiid"].apply(null, arguments) };
var dynCall_iiiiidii = Module["dynCall_iiiiidii"] = function() {  return Module["asm"]["dynCall_iiiiidii"].apply(null, arguments) };
var dynCall_iiiiiffi = Module["dynCall_iiiiiffi"] = function() {  return Module["asm"]["dynCall_iiiiiffi"].apply(null, arguments) };
var dynCall_iiiiifi = Module["dynCall_iiiiifi"] = function() {  return Module["asm"]["dynCall_iiiiifi"].apply(null, arguments) };
var dynCall_iiiiifiii = Module["dynCall_iiiiifiii"] = function() {  return Module["asm"]["dynCall_iiiiifiii"].apply(null, arguments) };
var dynCall_iiiiifiiiiif = Module["dynCall_iiiiifiiiiif"] = function() {  return Module["asm"]["dynCall_iiiiifiiiiif"].apply(null, arguments) };
var dynCall_iiiiii = Module["dynCall_iiiiii"] = function() {  return Module["asm"]["dynCall_iiiiii"].apply(null, arguments) };
var dynCall_iiiiiid = Module["dynCall_iiiiiid"] = function() {  return Module["asm"]["dynCall_iiiiiid"].apply(null, arguments) };
var dynCall_iiiiiifff = Module["dynCall_iiiiiifff"] = function() {  return Module["asm"]["dynCall_iiiiiifff"].apply(null, arguments) };
var dynCall_iiiiiifffiiifiii = Module["dynCall_iiiiiifffiiifiii"] = function() {  return Module["asm"]["dynCall_iiiiiifffiiifiii"].apply(null, arguments) };
var dynCall_iiiiiiffiiiiiiiiiffffiii = Module["dynCall_iiiiiiffiiiiiiiiiffffiii"] = function() {  return Module["asm"]["dynCall_iiiiiiffiiiiiiiiiffffiii"].apply(null, arguments) };
var dynCall_iiiiiiffiiiiiiiiiffffiiii = Module["dynCall_iiiiiiffiiiiiiiiiffffiiii"] = function() {  return Module["asm"]["dynCall_iiiiiiffiiiiiiiiiffffiiii"].apply(null, arguments) };
var dynCall_iiiiiiffiiiiiiiiiiiiiii = Module["dynCall_iiiiiiffiiiiiiiiiiiiiii"] = function() {  return Module["asm"]["dynCall_iiiiiiffiiiiiiiiiiiiiii"].apply(null, arguments) };
var dynCall_iiiiiifiif = Module["dynCall_iiiiiifiif"] = function() {  return Module["asm"]["dynCall_iiiiiifiif"].apply(null, arguments) };
var dynCall_iiiiiifiii = Module["dynCall_iiiiiifiii"] = function() {  return Module["asm"]["dynCall_iiiiiifiii"].apply(null, arguments) };
var dynCall_iiiiiii = Module["dynCall_iiiiiii"] = function() {  return Module["asm"]["dynCall_iiiiiii"].apply(null, arguments) };
var dynCall_iiiiiiifiif = Module["dynCall_iiiiiiifiif"] = function() {  return Module["asm"]["dynCall_iiiiiiifiif"].apply(null, arguments) };
var dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = function() {  return Module["asm"]["dynCall_iiiiiiii"].apply(null, arguments) };
var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = function() {  return Module["asm"]["dynCall_iiiiiiiii"].apply(null, arguments) };
var dynCall_iiiiiiiiii = Module["dynCall_iiiiiiiiii"] = function() {  return Module["asm"]["dynCall_iiiiiiiiii"].apply(null, arguments) };
var dynCall_iiiiiiiiiii = Module["dynCall_iiiiiiiiiii"] = function() {  return Module["asm"]["dynCall_iiiiiiiiiii"].apply(null, arguments) };
var dynCall_iiiiiiiiiiii = Module["dynCall_iiiiiiiiiiii"] = function() {  return Module["asm"]["dynCall_iiiiiiiiiiii"].apply(null, arguments) };
var dynCall_iiiiiiiiiiiii = Module["dynCall_iiiiiiiiiiiii"] = function() {  return Module["asm"]["dynCall_iiiiiiiiiiiii"].apply(null, arguments) };
var dynCall_iiiiiiiiiiiiii = Module["dynCall_iiiiiiiiiiiiii"] = function() {  return Module["asm"]["dynCall_iiiiiiiiiiiiii"].apply(null, arguments) };
var dynCall_iiiiiiiiiiiiiii = Module["dynCall_iiiiiiiiiiiiiii"] = function() {  return Module["asm"]["dynCall_iiiiiiiiiiiiiii"].apply(null, arguments) };
var dynCall_iiiiiiiiiiiiiiii = Module["dynCall_iiiiiiiiiiiiiiii"] = function() {  return Module["asm"]["dynCall_iiiiiiiiiiiiiiii"].apply(null, arguments) };
var dynCall_iiiiiiiiiiiiiiiii = Module["dynCall_iiiiiiiiiiiiiiiii"] = function() {  return Module["asm"]["dynCall_iiiiiiiiiiiiiiiii"].apply(null, arguments) };
var dynCall_iiiiiiiiiiiiiiiiii = Module["dynCall_iiiiiiiiiiiiiiiiii"] = function() {  return Module["asm"]["dynCall_iiiiiiiiiiiiiiiiii"].apply(null, arguments) };
var dynCall_iiiiiiiiiiiiiiiiiii = Module["dynCall_iiiiiiiiiiiiiiiiiii"] = function() {  return Module["asm"]["dynCall_iiiiiiiiiiiiiiiiiii"].apply(null, arguments) };
var dynCall_iiiiiiiiiiiiiiiiiiii = Module["dynCall_iiiiiiiiiiiiiiiiiiii"] = function() {  return Module["asm"]["dynCall_iiiiiiiiiiiiiiiiiiii"].apply(null, arguments) };
var dynCall_iiiiiiiiiiiiiiiiiiiii = Module["dynCall_iiiiiiiiiiiiiiiiiiiii"] = function() {  return Module["asm"]["dynCall_iiiiiiiiiiiiiiiiiiiii"].apply(null, arguments) };
var dynCall_iiiiij = Module["dynCall_iiiiij"] = function() {  return Module["asm"]["dynCall_iiiiij"].apply(null, arguments) };
var dynCall_iiiiiji = Module["dynCall_iiiiiji"] = function() {  return Module["asm"]["dynCall_iiiiiji"].apply(null, arguments) };
var dynCall_iiiij = Module["dynCall_iiiij"] = function() {  return Module["asm"]["dynCall_iiiij"].apply(null, arguments) };
var dynCall_iiiiji = Module["dynCall_iiiiji"] = function() {  return Module["asm"]["dynCall_iiiiji"].apply(null, arguments) };
var dynCall_iiiijii = Module["dynCall_iiiijii"] = function() {  return Module["asm"]["dynCall_iiiijii"].apply(null, arguments) };
var dynCall_iiij = Module["dynCall_iiij"] = function() {  return Module["asm"]["dynCall_iiij"].apply(null, arguments) };
var dynCall_iiiji = Module["dynCall_iiiji"] = function() {  return Module["asm"]["dynCall_iiiji"].apply(null, arguments) };
var dynCall_iiijii = Module["dynCall_iiijii"] = function() {  return Module["asm"]["dynCall_iiijii"].apply(null, arguments) };
var dynCall_iiijiii = Module["dynCall_iiijiii"] = function() {  return Module["asm"]["dynCall_iiijiii"].apply(null, arguments) };
var dynCall_iiijji = Module["dynCall_iiijji"] = function() {  return Module["asm"]["dynCall_iiijji"].apply(null, arguments) };
var dynCall_iij = Module["dynCall_iij"] = function() {  return Module["asm"]["dynCall_iij"].apply(null, arguments) };
var dynCall_iiji = Module["dynCall_iiji"] = function() {  return Module["asm"]["dynCall_iiji"].apply(null, arguments) };
var dynCall_iijii = Module["dynCall_iijii"] = function() {  return Module["asm"]["dynCall_iijii"].apply(null, arguments) };
var dynCall_iijiii = Module["dynCall_iijiii"] = function() {  return Module["asm"]["dynCall_iijiii"].apply(null, arguments) };
var dynCall_iijji = Module["dynCall_iijji"] = function() {  return Module["asm"]["dynCall_iijji"].apply(null, arguments) };
var dynCall_iijjii = Module["dynCall_iijjii"] = function() {  return Module["asm"]["dynCall_iijjii"].apply(null, arguments) };
var dynCall_iijjiii = Module["dynCall_iijjiii"] = function() {  return Module["asm"]["dynCall_iijjiii"].apply(null, arguments) };
var dynCall_iijjji = Module["dynCall_iijjji"] = function() {  return Module["asm"]["dynCall_iijjji"].apply(null, arguments) };
var dynCall_iijjjji = Module["dynCall_iijjjji"] = function() {  return Module["asm"]["dynCall_iijjjji"].apply(null, arguments) };
var dynCall_iijjjjiii = Module["dynCall_iijjjjiii"] = function() {  return Module["asm"]["dynCall_iijjjjiii"].apply(null, arguments) };
var dynCall_ij = Module["dynCall_ij"] = function() {  return Module["asm"]["dynCall_ij"].apply(null, arguments) };
var dynCall_iji = Module["dynCall_iji"] = function() {  return Module["asm"]["dynCall_iji"].apply(null, arguments) };
var dynCall_ijii = Module["dynCall_ijii"] = function() {  return Module["asm"]["dynCall_ijii"].apply(null, arguments) };
var dynCall_ijiii = Module["dynCall_ijiii"] = function() {  return Module["asm"]["dynCall_ijiii"].apply(null, arguments) };
var dynCall_ijj = Module["dynCall_ijj"] = function() {  return Module["asm"]["dynCall_ijj"].apply(null, arguments) };
var dynCall_ijji = Module["dynCall_ijji"] = function() {  return Module["asm"]["dynCall_ijji"].apply(null, arguments) };
var dynCall_j = Module["dynCall_j"] = function() {  return Module["asm"]["dynCall_j"].apply(null, arguments) };
var dynCall_jdi = Module["dynCall_jdi"] = function() {  return Module["asm"]["dynCall_jdi"].apply(null, arguments) };
var dynCall_jdii = Module["dynCall_jdii"] = function() {  return Module["asm"]["dynCall_jdii"].apply(null, arguments) };
var dynCall_jfi = Module["dynCall_jfi"] = function() {  return Module["asm"]["dynCall_jfi"].apply(null, arguments) };
var dynCall_ji = Module["dynCall_ji"] = function() {  return Module["asm"]["dynCall_ji"].apply(null, arguments) };
var dynCall_jid = Module["dynCall_jid"] = function() {  return Module["asm"]["dynCall_jid"].apply(null, arguments) };
var dynCall_jidi = Module["dynCall_jidi"] = function() {  return Module["asm"]["dynCall_jidi"].apply(null, arguments) };
var dynCall_jidii = Module["dynCall_jidii"] = function() {  return Module["asm"]["dynCall_jidii"].apply(null, arguments) };
var dynCall_jii = Module["dynCall_jii"] = function() {  return Module["asm"]["dynCall_jii"].apply(null, arguments) };
var dynCall_jiii = Module["dynCall_jiii"] = function() {  return Module["asm"]["dynCall_jiii"].apply(null, arguments) };
var dynCall_jiiii = Module["dynCall_jiiii"] = function() {  return Module["asm"]["dynCall_jiiii"].apply(null, arguments) };
var dynCall_jiiiii = Module["dynCall_jiiiii"] = function() {  return Module["asm"]["dynCall_jiiiii"].apply(null, arguments) };
var dynCall_jiiiiii = Module["dynCall_jiiiiii"] = function() {  return Module["asm"]["dynCall_jiiiiii"].apply(null, arguments) };
var dynCall_jiiiiiiiiii = Module["dynCall_jiiiiiiiiii"] = function() {  return Module["asm"]["dynCall_jiiiiiiiiii"].apply(null, arguments) };
var dynCall_jiiji = Module["dynCall_jiiji"] = function() {  return Module["asm"]["dynCall_jiiji"].apply(null, arguments) };
var dynCall_jiji = Module["dynCall_jiji"] = function() {  return Module["asm"]["dynCall_jiji"].apply(null, arguments) };
var dynCall_jijii = Module["dynCall_jijii"] = function() {  return Module["asm"]["dynCall_jijii"].apply(null, arguments) };
var dynCall_jijiii = Module["dynCall_jijiii"] = function() {  return Module["asm"]["dynCall_jijiii"].apply(null, arguments) };
var dynCall_jijj = Module["dynCall_jijj"] = function() {  return Module["asm"]["dynCall_jijj"].apply(null, arguments) };
var dynCall_jijji = Module["dynCall_jijji"] = function() {  return Module["asm"]["dynCall_jijji"].apply(null, arguments) };
var dynCall_jji = Module["dynCall_jji"] = function() {  return Module["asm"]["dynCall_jji"].apply(null, arguments) };
var dynCall_jjji = Module["dynCall_jjji"] = function() {  return Module["asm"]["dynCall_jjji"].apply(null, arguments) };
var dynCall_v = Module["dynCall_v"] = function() {  return Module["asm"]["dynCall_v"].apply(null, arguments) };
var dynCall_vd = Module["dynCall_vd"] = function() {  return Module["asm"]["dynCall_vd"].apply(null, arguments) };
var dynCall_vf = Module["dynCall_vf"] = function() {  return Module["asm"]["dynCall_vf"].apply(null, arguments) };
var dynCall_vff = Module["dynCall_vff"] = function() {  return Module["asm"]["dynCall_vff"].apply(null, arguments) };
var dynCall_vffff = Module["dynCall_vffff"] = function() {  return Module["asm"]["dynCall_vffff"].apply(null, arguments) };
var dynCall_vffffffiiii = Module["dynCall_vffffffiiii"] = function() {  return Module["asm"]["dynCall_vffffffiiii"].apply(null, arguments) };
var dynCall_vffffi = Module["dynCall_vffffi"] = function() {  return Module["asm"]["dynCall_vffffi"].apply(null, arguments) };
var dynCall_vffffii = Module["dynCall_vffffii"] = function() {  return Module["asm"]["dynCall_vffffii"].apply(null, arguments) };
var dynCall_vfi = Module["dynCall_vfi"] = function() {  return Module["asm"]["dynCall_vfi"].apply(null, arguments) };
var dynCall_vfii = Module["dynCall_vfii"] = function() {  return Module["asm"]["dynCall_vfii"].apply(null, arguments) };
var dynCall_vfiii = Module["dynCall_vfiii"] = function() {  return Module["asm"]["dynCall_vfiii"].apply(null, arguments) };
var dynCall_vi = Module["dynCall_vi"] = function() {  return Module["asm"]["dynCall_vi"].apply(null, arguments) };
var dynCall_vid = Module["dynCall_vid"] = function() {  return Module["asm"]["dynCall_vid"].apply(null, arguments) };
var dynCall_vidd = Module["dynCall_vidd"] = function() {  return Module["asm"]["dynCall_vidd"].apply(null, arguments) };
var dynCall_viddi = Module["dynCall_viddi"] = function() {  return Module["asm"]["dynCall_viddi"].apply(null, arguments) };
var dynCall_viddii = Module["dynCall_viddii"] = function() {  return Module["asm"]["dynCall_viddii"].apply(null, arguments) };
var dynCall_viddiiii = Module["dynCall_viddiiii"] = function() {  return Module["asm"]["dynCall_viddiiii"].apply(null, arguments) };
var dynCall_vidi = Module["dynCall_vidi"] = function() {  return Module["asm"]["dynCall_vidi"].apply(null, arguments) };
var dynCall_vidii = Module["dynCall_vidii"] = function() {  return Module["asm"]["dynCall_vidii"].apply(null, arguments) };
var dynCall_vidiii = Module["dynCall_vidiii"] = function() {  return Module["asm"]["dynCall_vidiii"].apply(null, arguments) };
var dynCall_vif = Module["dynCall_vif"] = function() {  return Module["asm"]["dynCall_vif"].apply(null, arguments) };
var dynCall_viff = Module["dynCall_viff"] = function() {  return Module["asm"]["dynCall_viff"].apply(null, arguments) };
var dynCall_vifff = Module["dynCall_vifff"] = function() {  return Module["asm"]["dynCall_vifff"].apply(null, arguments) };
var dynCall_viffff = Module["dynCall_viffff"] = function() {  return Module["asm"]["dynCall_viffff"].apply(null, arguments) };
var dynCall_vifffffi = Module["dynCall_vifffffi"] = function() {  return Module["asm"]["dynCall_vifffffi"].apply(null, arguments) };
var dynCall_viffffi = Module["dynCall_viffffi"] = function() {  return Module["asm"]["dynCall_viffffi"].apply(null, arguments) };
var dynCall_viffffii = Module["dynCall_viffffii"] = function() {  return Module["asm"]["dynCall_viffffii"].apply(null, arguments) };
var dynCall_viffffiifffiiiiif = Module["dynCall_viffffiifffiiiiif"] = function() {  return Module["asm"]["dynCall_viffffiifffiiiiif"].apply(null, arguments) };
var dynCall_vifffi = Module["dynCall_vifffi"] = function() {  return Module["asm"]["dynCall_vifffi"].apply(null, arguments) };
var dynCall_vifffii = Module["dynCall_vifffii"] = function() {  return Module["asm"]["dynCall_vifffii"].apply(null, arguments) };
var dynCall_viffi = Module["dynCall_viffi"] = function() {  return Module["asm"]["dynCall_viffi"].apply(null, arguments) };
var dynCall_viffii = Module["dynCall_viffii"] = function() {  return Module["asm"]["dynCall_viffii"].apply(null, arguments) };
var dynCall_viffiifffffiii = Module["dynCall_viffiifffffiii"] = function() {  return Module["asm"]["dynCall_viffiifffffiii"].apply(null, arguments) };
var dynCall_viffiifffiii = Module["dynCall_viffiifffiii"] = function() {  return Module["asm"]["dynCall_viffiifffiii"].apply(null, arguments) };
var dynCall_viffiii = Module["dynCall_viffiii"] = function() {  return Module["asm"]["dynCall_viffiii"].apply(null, arguments) };
var dynCall_viffiiiif = Module["dynCall_viffiiiif"] = function() {  return Module["asm"]["dynCall_viffiiiif"].apply(null, arguments) };
var dynCall_vifi = Module["dynCall_vifi"] = function() {  return Module["asm"]["dynCall_vifi"].apply(null, arguments) };
var dynCall_vifii = Module["dynCall_vifii"] = function() {  return Module["asm"]["dynCall_vifii"].apply(null, arguments) };
var dynCall_vifiii = Module["dynCall_vifiii"] = function() {  return Module["asm"]["dynCall_vifiii"].apply(null, arguments) };
var dynCall_vifiiii = Module["dynCall_vifiiii"] = function() {  return Module["asm"]["dynCall_vifiiii"].apply(null, arguments) };
var dynCall_vifiiiii = Module["dynCall_vifiiiii"] = function() {  return Module["asm"]["dynCall_vifiiiii"].apply(null, arguments) };
var dynCall_vifiiiiii = Module["dynCall_vifiiiiii"] = function() {  return Module["asm"]["dynCall_vifiiiiii"].apply(null, arguments) };
var dynCall_vifijii = Module["dynCall_vifijii"] = function() {  return Module["asm"]["dynCall_vifijii"].apply(null, arguments) };
var dynCall_vii = Module["dynCall_vii"] = function() {  return Module["asm"]["dynCall_vii"].apply(null, arguments) };
var dynCall_viid = Module["dynCall_viid"] = function() {  return Module["asm"]["dynCall_viid"].apply(null, arguments) };
var dynCall_viidd = Module["dynCall_viidd"] = function() {  return Module["asm"]["dynCall_viidd"].apply(null, arguments) };
var dynCall_viiddi = Module["dynCall_viiddi"] = function() {  return Module["asm"]["dynCall_viiddi"].apply(null, arguments) };
var dynCall_viidi = Module["dynCall_viidi"] = function() {  return Module["asm"]["dynCall_viidi"].apply(null, arguments) };
var dynCall_viidii = Module["dynCall_viidii"] = function() {  return Module["asm"]["dynCall_viidii"].apply(null, arguments) };
var dynCall_viif = Module["dynCall_viif"] = function() {  return Module["asm"]["dynCall_viif"].apply(null, arguments) };
var dynCall_viiff = Module["dynCall_viiff"] = function() {  return Module["asm"]["dynCall_viiff"].apply(null, arguments) };
var dynCall_viifff = Module["dynCall_viifff"] = function() {  return Module["asm"]["dynCall_viifff"].apply(null, arguments) };
var dynCall_viiffffffffi = Module["dynCall_viiffffffffi"] = function() {  return Module["asm"]["dynCall_viiffffffffi"].apply(null, arguments) };
var dynCall_viiffffffffiii = Module["dynCall_viiffffffffiii"] = function() {  return Module["asm"]["dynCall_viiffffffffiii"].apply(null, arguments) };
var dynCall_viifffffffi = Module["dynCall_viifffffffi"] = function() {  return Module["asm"]["dynCall_viifffffffi"].apply(null, arguments) };
var dynCall_viiffffffi = Module["dynCall_viiffffffi"] = function() {  return Module["asm"]["dynCall_viiffffffi"].apply(null, arguments) };
var dynCall_viifffffi = Module["dynCall_viifffffi"] = function() {  return Module["asm"]["dynCall_viifffffi"].apply(null, arguments) };
var dynCall_viiffffi = Module["dynCall_viiffffi"] = function() {  return Module["asm"]["dynCall_viiffffi"].apply(null, arguments) };
var dynCall_viifffi = Module["dynCall_viifffi"] = function() {  return Module["asm"]["dynCall_viifffi"].apply(null, arguments) };
var dynCall_viiffi = Module["dynCall_viiffi"] = function() {  return Module["asm"]["dynCall_viiffi"].apply(null, arguments) };
var dynCall_viiffii = Module["dynCall_viiffii"] = function() {  return Module["asm"]["dynCall_viiffii"].apply(null, arguments) };
var dynCall_viifi = Module["dynCall_viifi"] = function() {  return Module["asm"]["dynCall_viifi"].apply(null, arguments) };
var dynCall_viifii = Module["dynCall_viifii"] = function() {  return Module["asm"]["dynCall_viifii"].apply(null, arguments) };
var dynCall_viifiii = Module["dynCall_viifiii"] = function() {  return Module["asm"]["dynCall_viifiii"].apply(null, arguments) };
var dynCall_viifiiii = Module["dynCall_viifiiii"] = function() {  return Module["asm"]["dynCall_viifiiii"].apply(null, arguments) };
var dynCall_viii = Module["dynCall_viii"] = function() {  return Module["asm"]["dynCall_viii"].apply(null, arguments) };
var dynCall_viiidi = Module["dynCall_viiidi"] = function() {  return Module["asm"]["dynCall_viiidi"].apply(null, arguments) };
var dynCall_viiif = Module["dynCall_viiif"] = function() {  return Module["asm"]["dynCall_viiif"].apply(null, arguments) };
var dynCall_viiifffi = Module["dynCall_viiifffi"] = function() {  return Module["asm"]["dynCall_viiifffi"].apply(null, arguments) };
var dynCall_viiiffi = Module["dynCall_viiiffi"] = function() {  return Module["asm"]["dynCall_viiiffi"].apply(null, arguments) };
var dynCall_viiiffii = Module["dynCall_viiiffii"] = function() {  return Module["asm"]["dynCall_viiiffii"].apply(null, arguments) };
var dynCall_viiifi = Module["dynCall_viiifi"] = function() {  return Module["asm"]["dynCall_viiifi"].apply(null, arguments) };
var dynCall_viiififfi = Module["dynCall_viiififfi"] = function() {  return Module["asm"]["dynCall_viiififfi"].apply(null, arguments) };
var dynCall_viiififi = Module["dynCall_viiififi"] = function() {  return Module["asm"]["dynCall_viiififi"].apply(null, arguments) };
var dynCall_viiifii = Module["dynCall_viiifii"] = function() {  return Module["asm"]["dynCall_viiifii"].apply(null, arguments) };
var dynCall_viiifiii = Module["dynCall_viiifiii"] = function() {  return Module["asm"]["dynCall_viiifiii"].apply(null, arguments) };
var dynCall_viiifiiiii = Module["dynCall_viiifiiiii"] = function() {  return Module["asm"]["dynCall_viiifiiiii"].apply(null, arguments) };
var dynCall_viiii = Module["dynCall_viiii"] = function() {  return Module["asm"]["dynCall_viiii"].apply(null, arguments) };
var dynCall_viiiif = Module["dynCall_viiiif"] = function() {  return Module["asm"]["dynCall_viiiif"].apply(null, arguments) };
var dynCall_viiiiffffii = Module["dynCall_viiiiffffii"] = function() {  return Module["asm"]["dynCall_viiiiffffii"].apply(null, arguments) };
var dynCall_viiiifffi = Module["dynCall_viiiifffi"] = function() {  return Module["asm"]["dynCall_viiiifffi"].apply(null, arguments) };
var dynCall_viiiiffi = Module["dynCall_viiiiffi"] = function() {  return Module["asm"]["dynCall_viiiiffi"].apply(null, arguments) };
var dynCall_viiiifi = Module["dynCall_viiiifi"] = function() {  return Module["asm"]["dynCall_viiiifi"].apply(null, arguments) };
var dynCall_viiiifii = Module["dynCall_viiiifii"] = function() {  return Module["asm"]["dynCall_viiiifii"].apply(null, arguments) };
var dynCall_viiiifiii = Module["dynCall_viiiifiii"] = function() {  return Module["asm"]["dynCall_viiiifiii"].apply(null, arguments) };
var dynCall_viiiifiiiiif = Module["dynCall_viiiifiiiiif"] = function() {  return Module["asm"]["dynCall_viiiifiiiiif"].apply(null, arguments) };
var dynCall_viiiii = Module["dynCall_viiiii"] = function() {  return Module["asm"]["dynCall_viiiii"].apply(null, arguments) };
var dynCall_viiiiif = Module["dynCall_viiiiif"] = function() {  return Module["asm"]["dynCall_viiiiif"].apply(null, arguments) };
var dynCall_viiiiifffi = Module["dynCall_viiiiifffi"] = function() {  return Module["asm"]["dynCall_viiiiifffi"].apply(null, arguments) };
var dynCall_viiiiifffii = Module["dynCall_viiiiifffii"] = function() {  return Module["asm"]["dynCall_viiiiifffii"].apply(null, arguments) };
var dynCall_viiiiiffi = Module["dynCall_viiiiiffi"] = function() {  return Module["asm"]["dynCall_viiiiiffi"].apply(null, arguments) };
var dynCall_viiiiiffii = Module["dynCall_viiiiiffii"] = function() {  return Module["asm"]["dynCall_viiiiiffii"].apply(null, arguments) };
var dynCall_viiiiifi = Module["dynCall_viiiiifi"] = function() {  return Module["asm"]["dynCall_viiiiifi"].apply(null, arguments) };
var dynCall_viiiiii = Module["dynCall_viiiiii"] = function() {  return Module["asm"]["dynCall_viiiiii"].apply(null, arguments) };
var dynCall_viiiiiif = Module["dynCall_viiiiiif"] = function() {  return Module["asm"]["dynCall_viiiiiif"].apply(null, arguments) };
var dynCall_viiiiiifi = Module["dynCall_viiiiiifi"] = function() {  return Module["asm"]["dynCall_viiiiiifi"].apply(null, arguments) };
var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = function() {  return Module["asm"]["dynCall_viiiiiii"].apply(null, arguments) };
var dynCall_viiiiiiifi = Module["dynCall_viiiiiiifi"] = function() {  return Module["asm"]["dynCall_viiiiiiifi"].apply(null, arguments) };
var dynCall_viiiiiiifiii = Module["dynCall_viiiiiiifiii"] = function() {  return Module["asm"]["dynCall_viiiiiiifiii"].apply(null, arguments) };
var dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = function() {  return Module["asm"]["dynCall_viiiiiiii"].apply(null, arguments) };
var dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = function() {  return Module["asm"]["dynCall_viiiiiiiii"].apply(null, arguments) };
var dynCall_viiiiiiiiii = Module["dynCall_viiiiiiiiii"] = function() {  return Module["asm"]["dynCall_viiiiiiiiii"].apply(null, arguments) };
var dynCall_viiiiiiiiiii = Module["dynCall_viiiiiiiiiii"] = function() {  return Module["asm"]["dynCall_viiiiiiiiiii"].apply(null, arguments) };
var dynCall_viiiiiiiiiiifii = Module["dynCall_viiiiiiiiiiifii"] = function() {  return Module["asm"]["dynCall_viiiiiiiiiiifii"].apply(null, arguments) };
var dynCall_viiiiiiiiiiii = Module["dynCall_viiiiiiiiiiii"] = function() {  return Module["asm"]["dynCall_viiiiiiiiiiii"].apply(null, arguments) };
var dynCall_viiiiiiiiiiiii = Module["dynCall_viiiiiiiiiiiii"] = function() {  return Module["asm"]["dynCall_viiiiiiiiiiiii"].apply(null, arguments) };
var dynCall_viiiiiiiiiiiiii = Module["dynCall_viiiiiiiiiiiiii"] = function() {  return Module["asm"]["dynCall_viiiiiiiiiiiiii"].apply(null, arguments) };
var dynCall_viiiiiiiiiiiiiii = Module["dynCall_viiiiiiiiiiiiiii"] = function() {  return Module["asm"]["dynCall_viiiiiiiiiiiiiii"].apply(null, arguments) };
var dynCall_viiiiiiiiiiiiiiii = Module["dynCall_viiiiiiiiiiiiiiii"] = function() {  return Module["asm"]["dynCall_viiiiiiiiiiiiiiii"].apply(null, arguments) };
var dynCall_viiiiiiiiiiiiiiiii = Module["dynCall_viiiiiiiiiiiiiiiii"] = function() {  return Module["asm"]["dynCall_viiiiiiiiiiiiiiiii"].apply(null, arguments) };
var dynCall_viiiiiiiiiiiiiiiiii = Module["dynCall_viiiiiiiiiiiiiiiiii"] = function() {  return Module["asm"]["dynCall_viiiiiiiiiiiiiiiiii"].apply(null, arguments) };
var dynCall_viiiij = Module["dynCall_viiiij"] = function() {  return Module["asm"]["dynCall_viiiij"].apply(null, arguments) };
var dynCall_viiiijiiii = Module["dynCall_viiiijiiii"] = function() {  return Module["asm"]["dynCall_viiiijiiii"].apply(null, arguments) };
var dynCall_viiiji = Module["dynCall_viiiji"] = function() {  return Module["asm"]["dynCall_viiiji"].apply(null, arguments) };
var dynCall_viiijji = Module["dynCall_viiijji"] = function() {  return Module["asm"]["dynCall_viiijji"].apply(null, arguments) };
var dynCall_viij = Module["dynCall_viij"] = function() {  return Module["asm"]["dynCall_viij"].apply(null, arguments) };
var dynCall_viiji = Module["dynCall_viiji"] = function() {  return Module["asm"]["dynCall_viiji"].apply(null, arguments) };
var dynCall_viijii = Module["dynCall_viijii"] = function() {  return Module["asm"]["dynCall_viijii"].apply(null, arguments) };
var dynCall_viijiijiii = Module["dynCall_viijiijiii"] = function() {  return Module["asm"]["dynCall_viijiijiii"].apply(null, arguments) };
var dynCall_viijijii = Module["dynCall_viijijii"] = function() {  return Module["asm"]["dynCall_viijijii"].apply(null, arguments) };
var dynCall_viijijiii = Module["dynCall_viijijiii"] = function() {  return Module["asm"]["dynCall_viijijiii"].apply(null, arguments) };
var dynCall_viijijj = Module["dynCall_viijijj"] = function() {  return Module["asm"]["dynCall_viijijj"].apply(null, arguments) };
var dynCall_viijj = Module["dynCall_viijj"] = function() {  return Module["asm"]["dynCall_viijj"].apply(null, arguments) };
var dynCall_viijji = Module["dynCall_viijji"] = function() {  return Module["asm"]["dynCall_viijji"].apply(null, arguments) };
var dynCall_viijjiii = Module["dynCall_viijjiii"] = function() {  return Module["asm"]["dynCall_viijjiii"].apply(null, arguments) };
var dynCall_viijjji = Module["dynCall_viijjji"] = function() {  return Module["asm"]["dynCall_viijjji"].apply(null, arguments) };
var dynCall_vij = Module["dynCall_vij"] = function() {  return Module["asm"]["dynCall_vij"].apply(null, arguments) };
var dynCall_viji = Module["dynCall_viji"] = function() {  return Module["asm"]["dynCall_viji"].apply(null, arguments) };
var dynCall_vijii = Module["dynCall_vijii"] = function() {  return Module["asm"]["dynCall_vijii"].apply(null, arguments) };
var dynCall_vijiii = Module["dynCall_vijiii"] = function() {  return Module["asm"]["dynCall_vijiii"].apply(null, arguments) };
var dynCall_vijiji = Module["dynCall_vijiji"] = function() {  return Module["asm"]["dynCall_vijiji"].apply(null, arguments) };
var dynCall_vijijji = Module["dynCall_vijijji"] = function() {  return Module["asm"]["dynCall_vijijji"].apply(null, arguments) };
var dynCall_vijji = Module["dynCall_vijji"] = function() {  return Module["asm"]["dynCall_vijji"].apply(null, arguments) };
var dynCall_vijjii = Module["dynCall_vijjii"] = function() {  return Module["asm"]["dynCall_vijjii"].apply(null, arguments) };
var dynCall_vjiiii = Module["dynCall_vjiiii"] = function() {  return Module["asm"]["dynCall_vjiiii"].apply(null, arguments) };
var dynCall_vjji = Module["dynCall_vjji"] = function() {  return Module["asm"]["dynCall_vjji"].apply(null, arguments) };
;



// === Auto-generated postamble setup entry stuff ===

Module['asm'] = asm;



Module["ccall"] = ccall;
Module["cwrap"] = cwrap;



















Module["stackTrace"] = stackTrace;








Module["addRunDependency"] = addRunDependency;
Module["removeRunDependency"] = removeRunDependency;



Module["FS_createPath"] = FS.createPath;
Module["FS_createDataFile"] = FS.createDataFile;




































/**
 * @constructor
 * @extends {Error}
 * @this {ExitStatus}
 */
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun']) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = function callMain(args) {

  args = args || [];

  ensureInitRuntime();

  var argc = args.length+1;
  var argv = stackAlloc((argc + 1) * 4);
  HEAP32[argv >> 2] = allocateUTF8OnStack(Module['thisProgram']);
  for (var i = 1; i < argc; i++) {
    HEAP32[(argv >> 2) + i] = allocateUTF8OnStack(args[i - 1]);
  }
  HEAP32[(argv >> 2) + argc] = 0;


  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
      exit(ret, /* implicit = */ true);
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      var toLog = e;
      if (e && typeof e === 'object' && e.stack) {
        toLog = [e, e.stack];
      }
      err('exception thrown: ' + toLog);
      Module['quit'](1, e);
    }
  } finally {
    calledMain = true;
  }
}




/** @type {function(Array=)} */
function run(args) {
  args = args || Module['arguments'];

  if (runDependencies > 0) {
    return;
  }


  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    if (ABORT) return;

    ensureInitRuntime();

    preMain();

    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

    if (Module['_main'] && shouldRunNow) Module['callMain'](args);

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
  } else {
    doRun();
  }
}
Module['run'] = run;


function exit(status, implicit) {

  // if this is just main exit-ing implicitly, and the status is 0, then we
  // don't need to do anything here and can just leave. if the status is
  // non-zero, though, then we need to report it.
  // (we may have warned about this earlier, if a situation justifies doing so)
  if (implicit && Module['noExitRuntime'] && status === 0) {
    return;
  }

  if (Module['noExitRuntime']) {
  } else {

    ABORT = true;
    EXITSTATUS = status;
    STACKTOP = initialStackTop;

    exitRuntime();

    if (Module['onExit']) Module['onExit'](status);
  }

  Module['quit'](status, new ExitStatus(status));
}

var abortDecorators = [];

function abort(what) {
  if (Module['onAbort']) {
    Module['onAbort'](what);
  }

  if (what !== undefined) {
    out(what);
    err(what);
    what = JSON.stringify(what)
  } else {
    what = '';
  }

  ABORT = true;
  EXITSTATUS = 1;

  throw 'abort(' + what + '). Build with -s ASSERTIONS=1 for more info.';
}
Module['abort'] = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}

Module["noExitRuntime"] = true;

run();

// {{POST_RUN_ADDITIONS}}





// {{MODULE_ADDITIONS}}




}
