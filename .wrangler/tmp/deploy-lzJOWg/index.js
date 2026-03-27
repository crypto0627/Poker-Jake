var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// src/line.ts
var LINE_API = "https://api.line.me/v2/bot";
async function replyMessage(token, replyToken, text) {
  const res = await fetch(`${LINE_API}/message/reply`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }]
    })
  });
  if (!res.ok) {
    console.error("replyMessage failed:", res.status, await res.text());
  }
}
__name(replyMessage, "replyMessage");
async function replyWithMention(token, replyToken, text, mentionUserId, mentionName) {
  const pattern = `@${mentionName}`;
  const bodyText = text.includes(pattern) ? text.replace(pattern, "{m0}") : `{m0} ${text}`;
  const message = {
    type: "textV2",
    text: bodyText,
    substitution: {
      m0: {
        type: "mention",
        mentionee: { type: "user", userId: mentionUserId }
      }
    }
  };
  const res = await fetch(`${LINE_API}/message/reply`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ replyToken, messages: [message] })
  });
  if (!res.ok) {
    console.error("replyWithMention failed:", res.status, await res.text());
    await replyMessage(token, replyToken, text);
  }
}
__name(replyWithMention, "replyWithMention");
async function getGroupMemberProfile(token, groupId, userId) {
  try {
    const res = await fetch(
      `${LINE_API}/group/${groupId}/member/${userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.ok) {
      const data = await res.json();
      return data.displayName;
    }
  } catch {
  }
  return `\u73A9\u5BB6${userId.slice(-4)}`;
}
__name(getGroupMemberProfile, "getGroupMemberProfile");
async function verifySignature(channelSecret, body, signature) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(channelSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return expected === signature;
}
__name(verifySignature, "verifySignature");

// src/card.ts
var SUITS = ["\u2660", "\u2665", "\u2666", "\u2663"];
var RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
var SUIT_EMOJI = {
  "\u2660": "\u2660\uFE0F",
  "\u2665": "\u2665\uFE0F",
  "\u2666": "\u2666\uFE0F",
  "\u2663": "\u2663\uFE0F"
};
var RANK_VALUE = Object.fromEntries(
  RANKS.map((r, i) => [r, i + 2])
);
function makeCard(rank, suit) {
  return {
    rank,
    suit,
    value: RANK_VALUE[rank],
    label: `${rank}${SUIT_EMOJI[suit] ?? suit}`
  };
}
__name(makeCard, "makeCard");
function makeDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(makeCard(rank, suit));
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
__name(makeDeck, "makeDeck");

// src/handEvaluator.ts
var HAND_NAMES = {
  8: "\u540C\u82B1\u9806 (Straight Flush)",
  7: "\u56DB\u689D (Four of a Kind)",
  6: "\u846B\u8606 (Full House)",
  5: "\u540C\u82B1 (Flush)",
  4: "\u9806\u5B50 (Straight)",
  3: "\u4E09\u689D (Three of a Kind)",
  2: "\u5169\u5C0D (Two Pair)",
  1: "\u4E00\u5C0D (One Pair)",
  0: "\u9AD8\u724C (High Card)"
};
function combinations(arr, k) {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, k - 1).map((c) => [first, ...c]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}
__name(combinations, "combinations");
function scoreFiveCards(cards) {
  let values = cards.map((c) => c.value).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);
  const isFlush = new Set(suits).size === 1;
  let isStraight = false;
  let straightHigh = values[0];
  const uniqueVals = [...new Set(values)];
  if (uniqueVals.length === 5) {
    if (values[0] - values[4] === 4) {
      isStraight = true;
    } else if (new Set(values).size === 5 && (/* @__PURE__ */ new Set([14, 2, 3, 4, 5])).size === 5 && values.every((v) => [14, 2, 3, 4, 5].includes(v))) {
      isStraight = true;
      values = [5, 4, 3, 2, 1];
      straightHigh = 5;
    }
  }
  const counts = /* @__PURE__ */ new Map();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const groupSizes = groups.map((g) => g[1]);
  const groupVals = groups.map((g) => g[0]);
  if (isStraight && isFlush) return [8, [straightHigh]];
  if (groupSizes[0] === 4) return [7, groupVals];
  if (groupSizes[0] === 3 && groupSizes[1] === 2) return [6, groupVals];
  if (isFlush) return [5, values];
  if (isStraight) return [4, [straightHigh]];
  if (groupSizes[0] === 3) return [3, groupVals];
  if (groupSizes[0] === 2 && groupSizes[1] === 2) return [2, groupVals];
  if (groupSizes[0] === 2) return [1, groupVals];
  return [0, values];
}
__name(scoreFiveCards, "scoreFiveCards");
function compareScores(a, b) {
  if (a[0] !== b[0]) return a[0] - b[0];
  for (let i = 0; i < Math.max(a[1].length, b[1].length); i++) {
    const diff = (a[1][i] ?? 0) - (b[1][i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
__name(compareScores, "compareScores");
function bestHand(holeCards, community) {
  const all = [...holeCards, ...community];
  const n = Math.min(all.length, 7);
  const combos = combinations(all, Math.min(5, n));
  let best = [-1, []];
  for (const combo of combos) {
    const score = scoreFiveCards(combo);
    if (compareScores(score, best) > 0) best = score;
  }
  return best;
}
__name(bestHand, "bestHand");
function handName(score) {
  return HAND_NAMES[score[0]] ?? "\u672A\u77E5";
}
__name(handName, "handName");

// src/game.ts
var SMALL_BLIND = 10;
var BIG_BLIND = 20;
var STARTING_CHIPS = 1e3;
var MAX_PLAYERS = 9;
function ok(groupMsg, privateMsgs = {}, opts = {}) {
  return { ok: true, groupMsg, privateMessages: privateMsgs, ...opts };
}
__name(ok, "ok");
function fail(groupMsg) {
  return { ok: false, groupMsg, privateMessages: {} };
}
__name(fail, "fail");
function toSettlement(p, finalChips) {
  return {
    userId: p.userId,
    name: p.name,
    finalChips,
    sessionStake: p.sessionStake,
    net: finalChips - p.sessionStake,
    buyInThisSession: p.buyInThisSession
  };
}
__name(toSettlement, "toSettlement");
function newGame(groupId) {
  return {
    groupId,
    phase: "waiting",
    handNum: 0,
    players: [],
    queue: [],
    pendingBuyIn: [],
    deck: [],
    community: [],
    pot: 0,
    currentBet: 0,
    dealerIdx: 0,
    currentIdx: 0
  };
}
__name(newGame, "newGame");
function makePlayer(userId, name) {
  return {
    userId,
    name,
    chips: STARTING_CHIPS,
    holeCards: [],
    currentBet: 0,
    totalBet: 0,
    folded: false,
    allIn: false,
    isDealer: false,
    isSB: false,
    isBB: false,
    hasActed: false,
    wantsToLeave: false,
    position: "",
    pendingTopUp: 0,
    sessionStake: STARTING_CHIPS,
    buyInThisSession: 1
  };
}
__name(makePlayer, "makePlayer");
function makePlayerFromQueue(q) {
  return {
    userId: q.userId,
    name: q.name,
    chips: q.startingChips,
    holeCards: [],
    currentBet: 0,
    totalBet: 0,
    folded: false,
    allIn: false,
    isDealer: false,
    isSB: false,
    isBB: false,
    hasActed: false,
    wantsToLeave: false,
    position: "",
    pendingTopUp: 0,
    // sessionStake=0 means new player who hasn't received chips yet → set now
    sessionStake: q.sessionStake === 0 ? q.startingChips : q.sessionStake,
    buyInThisSession: q.buyInThisSession
  };
}
__name(makePlayerFromQueue, "makePlayerFromQueue");
function findPlayer(state, userId) {
  return state.players.find((p) => p.userId === userId);
}
__name(findPlayer, "findPlayer");
function activePlayers(state) {
  return state.players.filter((p) => !p.folded);
}
__name(activePlayers, "activePlayers");
function playersWhoCanAct(state) {
  return state.players.filter((p) => !p.folded && !p.allIn);
}
__name(playersWhoCanAct, "playersWhoCanAct");
function dealCard(state) {
  return state.deck.pop();
}
__name(dealCard, "dealCard");
function playerBet(p, amount) {
  const actual = Math.min(amount, p.chips);
  p.chips -= actual;
  p.currentBet += actual;
  p.totalBet += actual;
  if (p.chips === 0) p.allIn = true;
  return actual;
}
__name(playerBet, "playerBet");
function resetForHand(p) {
  p.holeCards = [];
  p.currentBet = 0;
  p.totalBet = 0;
  p.folded = false;
  p.allIn = false;
  p.isDealer = false;
  p.isSB = false;
  p.isBB = false;
  p.hasActed = false;
  p.position = "";
}
__name(resetForHand, "resetForHand");
var MID_POSITIONS = {
  0: [],
  // 3 players: BTN SB BB
  1: ["UTG"],
  // 4 players
  2: ["UTG", "CO"],
  // 5 players
  3: ["UTG", "HJ", "CO"],
  // 6-Max
  4: ["UTG", "UTG+1", "HJ", "CO"],
  // 7 players
  5: ["UTG", "UTG+1", "LJ", "HJ", "CO"],
  // 8 players
  6: ["UTG", "UTG+1", "MP", "LJ", "HJ", "CO"]
  // 9-Max (Full-Ring)
};
function assignPositions(state) {
  const n = state.players.length;
  const d = state.dealerIdx % n;
  if (n === 2) {
    state.players[d].position = "BTN/SB";
    state.players[(d + 1) % n].position = "BB";
    return;
  }
  state.players[d].position = "BTN";
  state.players[(d + 1) % n].position = "SB";
  state.players[(d + 2) % n].position = "BB";
  const mid = MID_POSITIONS[n - 3] ?? [];
  for (let i = 0; i < mid.length; i++) {
    state.players[(d + 3 + i) % n].position = mid[i];
  }
}
__name(assignPositions, "assignPositions");
function resetForRound(state) {
  for (const p of state.players) {
    p.currentBet = 0;
    p.hasActed = false;
  }
  state.currentBet = 0;
}
__name(resetForRound, "resetForRound");
function skipToCanAct(state) {
  const n = state.players.length;
  for (let i = 0; i < n; i++) {
    if (!state.players[state.currentIdx].folded && !state.players[state.currentIdx].allIn) return;
    state.currentIdx = (state.currentIdx + 1) % n;
  }
}
__name(skipToCanAct, "skipToCanAct");
function isBettingRoundComplete(state) {
  for (const p of state.players) {
    if (!p.folded && !p.allIn) {
      if (!p.hasActed || p.currentBet < state.currentBet) return false;
    }
  }
  return true;
}
__name(isBettingRoundComplete, "isBettingRoundComplete");
function findNextActor(state) {
  const n = state.players.length;
  let idx = (state.currentIdx + 1) % n;
  for (let i = 0; i < n; i++) {
    const p = state.players[idx];
    if (!p.folded && !p.allIn && (!p.hasActed || p.currentBet < state.currentBet)) {
      state.currentIdx = idx;
      return p;
    }
    idx = (idx + 1) % n;
  }
  return null;
}
__name(findNextActor, "findNextActor");
function calculateSidePots(allPlayers) {
  const levels = [...new Set(allPlayers.filter((p) => p.totalBet > 0).map((p) => p.totalBet))].sort(
    (a, b) => a - b
  );
  const pots = [];
  let prevLevel = 0;
  for (const level of levels) {
    const contributors = allPlayers.filter((p) => p.totalBet >= level);
    const potSize = (level - prevLevel) * contributors.length;
    const eligible = contributors.filter((p) => !p.folded);
    if (potSize > 0 && eligible.length > 0) pots.push({ amount: potSize, eligible });
    prevLevel = level;
  }
  return pots;
}
__name(calculateSidePots, "calculateSidePots");
function tableStatus(state) {
  const communityStr = state.community.length ? state.community.map((c) => c.label).join("  ") : "\uFF08\u5C1A\u672A\u7FFB\u724C\uFF09";
  const lines = state.players.map((p, i) => {
    let s;
    if (p.folded) s = "\u274C \u68C4\u724C";
    else if (p.allIn) s = `\u{1F680} All-In\uFF08\u5DF2\u62BC $${p.totalBet}\uFF09`;
    else {
      const bet = p.currentBet > 0 ? `\uFF0C\u672C\u8F2A $${p.currentBet}` : "";
      s = `\u{1F4B0} $${p.chips}${bet}`;
    }
    const marker = i === state.currentIdx && !p.folded && !p.allIn ? "\u25B6 " : "   ";
    const pos = p.position ? `[${p.position}] ` : "";
    return `${marker}${pos}${p.name}: ${s}`;
  });
  const queueStr = state.queue.length ? `
\u23F3 \u7B49\u5F85\u4E0A\u684C\uFF1A${state.queue.map((q) => q.name).join("\u3001")}` : "";
  const pendingStr = state.pendingBuyIn.length ? `
\u{1F4B8} \u7B49\u5F85\u52A0\u5009\uFF1A${state.pendingBuyIn.map((p) => p.name).join("\u3001")}` : "";
  return [
    `\u{1F3B4} \u516C\u5171\u724C\uFF1A${communityStr}`,
    `\u{1F4B5} \u5E95\u6C60\uFF1A$${state.pot}  |  \u7576\u524D\u4E0B\u6CE8\uFF1A$${state.currentBet}`,
    ...lines
  ].join("\n") + queueStr + pendingStr;
}
__name(tableStatus, "tableStatus");
function chipsummary(state) {
  return ["\u{1F4B0} \u7C4C\u78BC\uFF1A", ...state.players.map((p) => `  ${p.name}: $${p.chips}`)].join("\n");
}
__name(chipsummary, "chipsummary");
function finalStandings(_state, settled) {
  const medals = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];
  const lines = settled.sort((a, b) => b.net - a.net).map((s, i) => {
    const sign = s.net >= 0 ? "+" : "";
    return `  ${medals[i] ?? `${i + 1}.`} ${s.name}: ${sign}$${s.net}\uFF08\u5269 $${s.finalChips}\uFF09`;
  });
  return ["\u{1F3C6} \u672C\u5C40\u7D50\u7B97\uFF1A", ...lines].join("\n");
}
__name(finalStandings, "finalStandings");
function addPlayer(state, userId, name) {
  if (state.players.some((p) => p.userId === userId)) return fail("\u4F60\u5DF2\u7D93\u5728\u724C\u684C\u4E0A\u4E86\uFF01");
  if (state.queue.some((q) => q.userId === userId)) return fail("\u4F60\u5DF2\u7D93\u5728\u7B49\u5F85\u968A\u5217\u4E2D\uFF0C\u4E0B\u4E00\u5C40\u81EA\u52D5\u4E0A\u684C\u3002");
  if (state.pendingBuyIn.some((p) => p.userId === userId)) return fail("\u4F60\u6B63\u5728\u7B49\u5F85\u52A0\u5009\u6C7A\u5B9A\uFF0C\u8F38\u5165 /buyin \u52A0\u5009\u6216 /leave \u96E2\u958B\u3002");
  const gameInProgress = !["waiting", "ended"].includes(state.phase);
  const total = state.players.length + state.queue.length;
  if (total >= MAX_PLAYERS) return fail(`\u684C\u5B50\u5DF2\u6EFF\uFF08\u6700\u591A ${MAX_PLAYERS} \u4EBA\uFF09\uFF01`);
  if (gameInProgress) {
    state.queue.push({
      userId,
      name,
      startingChips: STARTING_CHIPS,
      sessionStake: 0,
      // not yet received chips; set when hand starts
      buyInThisSession: 1
    });
    return ok(`\u23F3 ${name} \u52A0\u5165\u7B49\u5F85\u968A\u5217\uFF01\u4E0B\u4E00\u5C40\u958B\u59CB\u6642\u81EA\u52D5\u4E0A\u684C\uFF08\u968A\u5217\uFF1A${state.queue.length} \u4EBA\uFF09`);
  }
  if (state.phase === "ended") state.phase = "waiting";
  state.players.push(makePlayer(userId, name));
  return ok(`\u2705 ${name} \u52A0\u5165\u904A\u6232\uFF01\uFF08${state.players.length}/${MAX_PLAYERS}\uFF09
\u6E4A 2 \u4EBA\u4EE5\u4E0A\u8F38\u5165 /start \u958B\u59CB\uFF01`);
}
__name(addPlayer, "addPlayer");
function removePlayer(state, userId) {
  const pbIdx = state.pendingBuyIn.findIndex((p) => p.userId === userId);
  if (pbIdx !== -1) {
    const [pb] = state.pendingBuyIn.splice(pbIdx, 1);
    const settlement2 = {
      userId: pb.userId,
      name: pb.name,
      finalChips: 0,
      sessionStake: pb.sessionStake,
      net: -pb.sessionStake,
      buyInThisSession: pb.buyInThisSession
    };
    return ok(`\u{1F44B} ${pb.name} \u96E2\u958B\u904A\u6232\u3002`, {}, { settlements: [settlement2] });
  }
  const qIdx = state.queue.findIndex((q) => q.userId === userId);
  if (qIdx !== -1) {
    const [q] = state.queue.splice(qIdx, 1);
    const settlement2 = {
      userId: q.userId,
      name: q.name,
      finalChips: 0,
      sessionStake: q.sessionStake,
      net: -q.sessionStake,
      buyInThisSession: q.buyInThisSession
    };
    return ok(`\u{1F44B} ${q.name} \u5DF2\u5F9E\u7B49\u5F85\u968A\u5217\u96E2\u958B\u3002`, {}, { settlements: [settlement2] });
  }
  const player = findPlayer(state, userId);
  if (!player) return fail("\u4F60\u4E0D\u5728\u724C\u684C\u6216\u7B49\u5F85\u968A\u5217\uFF01");
  const gameInProgress = !["waiting", "ended", "showdown"].includes(state.phase);
  if (gameInProgress) {
    if (state.players[state.currentIdx]?.userId === userId && !player.folded) {
      player.folded = true;
      player.hasActed = true;
    }
    player.wantsToLeave = true;
    return ok(`\u{1F44B} ${player.name} \u7533\u8ACB\u96E2\u684C\uFF0C\u672C\u5C40\u7D50\u675F\u5F8C\u9000\u51FA\u3002`);
  }
  const settlement = toSettlement(player, player.chips);
  state.players = state.players.filter((p) => p.userId !== userId);
  return ok(`\u{1F44B} ${player.name} \u96E2\u958B\u904A\u6232\u3002`, {}, { settlements: [settlement] });
}
__name(removePlayer, "removePlayer");
function startGame(state, _userId) {
  if (state.phase !== "waiting") return fail("\u904A\u6232\u5DF2\u7D93\u958B\u59CB\u4E86\uFF01");
  if (state.players.length < 2) return fail("\u81F3\u5C11\u9700\u8981 2 \u4EBA\u624D\u80FD\u958B\u59CB\uFF01");
  state.dealerIdx = 0;
  return startNewHand(state);
}
__name(startGame, "startGame");
function nextHand(state, _userId) {
  if (state.phase === "waiting") {
    if (state.players.length < 2) return fail("\u81F3\u5C11\u9700\u8981 2 \u4EBA\u624D\u80FD\u958B\u59CB\uFF01");
    state.dealerIdx = 0;
    return startNewHand(state);
  }
  if (state.phase !== "showdown") return fail("\u672C\u5C40\u5C1A\u672A\u7D50\u675F\uFF01");
  return startNewHand(state);
}
__name(nextHand, "nextHand");
function forceEndGame(state) {
  if (state.phase === "waiting") {
    state.phase = "ended";
    return ok("\u{1F6D1} \u904A\u6232\u5DF2\u5F37\u5236\u91CD\u7F6E\u3002", {});
  }
  return _doEndGame(state);
}
__name(forceEndGame, "forceEndGame");
function endGame(state, _userId) {
  if (state.phase === "waiting") return fail("\u904A\u6232\u9084\u6C92\u958B\u59CB\uFF01");
  return _doEndGame(state);
}
__name(endGame, "endGame");
function _doEndGame(state) {
  const settlements = [
    ...state.players.map((p) => toSettlement(p, p.chips)),
    // Pending buy-in players already have 0 chips
    ...state.pendingBuyIn.map((pb) => ({
      userId: pb.userId,
      name: pb.name,
      finalChips: 0,
      sessionStake: pb.sessionStake,
      net: -pb.sessionStake,
      buyInThisSession: pb.buyInThisSession
    })),
    // Queue entries who never got to play
    ...state.queue.map((q) => ({
      userId: q.userId,
      name: q.name,
      finalChips: 0,
      sessionStake: q.sessionStake,
      net: -q.sessionStake,
      buyInThisSession: q.buyInThisSession
    }))
  ];
  state.phase = "ended";
  state.pendingBuyIn = [];
  state.queue = [];
  return ok(
    `\u{1F3B0} \u904A\u6232\u7D50\u675F\uFF01
` + finalStandings(state, settlements),
    {},
    { settlements }
  );
}
__name(_doEndGame, "_doEndGame");
function buyIn(state, userId, amount) {
  if (amount <= 0) return fail("\u52A0\u5009\u91D1\u984D\u5FC5\u9808\u5927\u65BC 0\uFF01");
  const pbIdx = state.pendingBuyIn.findIndex((p) => p.userId === userId);
  if (pbIdx !== -1) {
    const [pb] = state.pendingBuyIn.splice(pbIdx, 1);
    const capped = Math.min(amount, STARTING_CHIPS);
    state.queue.push({
      userId: pb.userId,
      name: pb.name,
      startingChips: capped,
      sessionStake: pb.sessionStake + capped,
      buyInThisSession: pb.buyInThisSession + 1
    });
    return ok(
      `\u{1F4B0} ${pb.name} \u52A0\u5009 $${capped}\uFF01\u4E0B\u4E00\u5C40\u958B\u59CB\u6642\u4E0A\u684C\u3002
\uFF08\u672C\u5C40\u7E3D\u6295\u5165\uFF1A$${pb.sessionStake + capped}\uFF0C\u52A0\u5009 ${pb.buyInThisSession} \u6B21\uFF09`
    );
  }
  const player = findPlayer(state, userId);
  if (player) {
    const already = player.pendingTopUp;
    const maxTopUp = STARTING_CHIPS - player.chips - already;
    if (maxTopUp <= 0) return fail(`\u4F60\u7684\u7C4C\u78BC\uFF08\u542B\u9810\u7D04\uFF09\u5DF2\u9054\u4E0A\u9650 $${STARTING_CHIPS}\uFF0C\u7121\u6CD5\u518D\u52A0\u5009\uFF01`);
    const capped = Math.min(amount, maxTopUp);
    player.pendingTopUp += capped;
    return ok(
      `\u{1F4B0} ${player.name} \u9810\u7D04\u52A0\u5009 $${capped}\uFF0C\u4E0B\u4E00\u5C40\u958B\u59CB\u6642\u751F\u6548\uFF01
\uFF08\u76EE\u524D $${player.chips}\uFF0C\u4E0B\u4E00\u5C40\u5C07\u6709 $${player.chips + player.pendingTopUp}\uFF09`
    );
  }
  const q = state.queue.find((e) => e.userId === userId);
  if (q) {
    const maxAdd = STARTING_CHIPS - q.startingChips;
    if (maxAdd <= 0) return fail(`\u4F60\u7684\u7C4C\u78BC\u5DF2\u9054\u4E0A\u9650 $${STARTING_CHIPS}\uFF0C\u7121\u6CD5\u518D\u52A0\u5009\uFF01`);
    const capped = Math.min(amount, maxAdd);
    q.startingChips += capped;
    q.sessionStake += capped;
    q.buyInThisSession++;
    return ok(`\u{1F4B0} ${q.name} \u52A0\u5009 $${capped}\uFF0C\u4E0A\u684C\u6642\u5C07\u6709 $${q.startingChips}\uFF01`);
  }
  return fail("\u4F60\u4E0D\u5728\u724C\u684C\u6216\u7B49\u5F85\u5340\uFF01");
}
__name(buyIn, "buyIn");
function getStatus(state) {
  if (state.phase === "waiting") {
    if (!state.players.length) return "\u684C\u5B50\u662F\u7A7A\u7684\uFF01\u8F38\u5165 /join \u52A0\u5165\u904A\u6232\u3002";
    const names = state.players.map((p) => `  \u2022 ${p.name}\uFF08$${p.chips}\uFF09`).join("\n");
    const q = state.queue.length ? `
\u23F3 \u7B49\u5F85\u968A\u5217\uFF1A${state.queue.map((q2) => q2.name).join("\u3001")}` : "";
    return `\u{1F550} \u7B49\u5F85\u73A9\u5BB6\u4E2D (${state.players.length}/${MAX_PLAYERS})
${names}${q}
\u6E4A 2 \u4EBA\u4EE5\u4E0A\u8ACB\u8F38\u5165 /start \u958B\u59CB\uFF01`;
  }
  if (state.phase === "ended") return "\u904A\u6232\u5DF2\u7D50\u675F\u3002\u8F38\u5165 /join \u958B\u59CB\u65B0\u904A\u6232\uFF01";
  return tableStatus(state);
}
__name(getStatus, "getStatus");
function processAction(state, userId, action, amount = 0) {
  if (["waiting", "ended", "showdown"].includes(state.phase)) return fail("\u73FE\u5728\u4E0D\u662F\u884C\u52D5\u6642\u9593\uFF01");
  const current = state.players[state.currentIdx];
  if (current.userId !== userId) {
    const actor = findPlayer(state, userId);
    if (!actor) return fail("\u4F60\u4E0D\u5728\u9019\u5C40\u904A\u6232\u4E2D\uFF01");
    return fail(`\u73FE\u5728\u8F2A\u5230 ${current.name} \u884C\u52D5\uFF01`);
  }
  const player = current;
  const toCall = state.currentBet - player.currentBet;
  let actionMsg;
  switch (action) {
    case "fold":
      player.folded = true;
      player.hasActed = true;
      actionMsg = `\u{1F3F3}\uFE0F ${player.name} \u68C4\u724C`;
      break;
    case "check":
      if (toCall > 0) return fail(`\u4E0D\u80FD\u904E\u724C\uFF01\u9700\u8DDF\u6CE8 $${toCall}\uFF0C\u8ACB\u7528 /call \u6216 /fold\u3002`);
      player.hasActed = true;
      actionMsg = `\u270B ${player.name} \u904E\u724C`;
      break;
    case "call": {
      if (toCall <= 0) {
        player.hasActed = true;
        actionMsg = `\u270B ${player.name} \u904E\u724C`;
      } else {
        const actual = playerBet(player, Math.min(toCall, player.chips));
        state.pot += actual;
        player.hasActed = true;
        const s = player.allIn ? "All-In\uFF01" : `\u5269 $${player.chips}`;
        actionMsg = `\u{1F4B0} ${player.name} \u8DDF\u6CE8 $${actual}\uFF08${s}\uFF09`;
      }
      break;
    }
    case "raise": {
      const minRaise = toCall + BIG_BLIND;
      if (amount < minRaise && amount < player.chips) {
        return fail(`\u6700\u5C11\u9700\u52A0\u6CE8 $${minRaise}\uFF08\u8DDF\u6CE8 $${toCall} + \u6700\u5C0F\u52A0\u6CE8 $${BIG_BLIND}\uFF09`);
      }
      const additional = Math.min(amount, player.chips + player.currentBet) - player.currentBet;
      if (additional <= 0) return fail("\u52A0\u6CE8\u91D1\u984D\u4E0D\u8DB3\uFF01");
      const actual = playerBet(player, additional);
      state.pot += actual;
      state.currentBet = player.currentBet;
      player.hasActed = true;
      for (const p of state.players) if (p !== player && !p.folded && !p.allIn) p.hasActed = false;
      const s = player.allIn ? "All-In\uFF01" : `\u5269 $${player.chips}`;
      actionMsg = `\u2B06\uFE0F ${player.name} \u52A0\u6CE8\u81F3 $${state.currentBet}\uFF08${s}\uFF09`;
      break;
    }
    case "allin": {
      if (player.chips === 0) return fail("\u4F60\u5DF2\u7D93\u5168\u62BC\u4E86\uFF01");
      const actual = playerBet(player, player.chips);
      state.pot += actual;
      player.hasActed = true;
      if (player.currentBet > state.currentBet) {
        state.currentBet = player.currentBet;
        for (const p of state.players) if (p !== player && !p.folded && !p.allIn) p.hasActed = false;
      }
      actionMsg = `\u{1F680} ${player.name} \u5168\u62BC $${actual}\uFF01\uFF08\u5171\u62BC $${player.totalBet}\uFF09`;
      break;
    }
    default:
      return fail("\u672A\u77E5\u6307\u4EE4\uFF01");
  }
  return afterAction(state, actionMsg);
}
__name(processAction, "processAction");
function startNewHand(state) {
  state.handNum++;
  const exitSettlements = [];
  state.players = state.players.filter((p) => {
    if (p.wantsToLeave) {
      exitSettlements.push(toSettlement(p, p.chips));
      return false;
    }
    return true;
  });
  const newBusted = [];
  state.players = state.players.filter((p) => {
    if (p.chips === 0 && !state.pendingBuyIn.some((pb) => pb.userId === p.userId)) {
      state.pendingBuyIn.push({
        userId: p.userId,
        name: p.name,
        sessionStake: p.sessionStake,
        buyInThisSession: p.buyInThisSession
      });
      newBusted.push({ userId: p.userId, name: p.name });
      return false;
    }
    return true;
  });
  while (state.queue.length > 0 && state.players.length < MAX_PLAYERS) {
    const q = state.queue.shift();
    if (!state.players.some((p) => p.userId === q.userId)) {
      state.players.push(makePlayerFromQueue(q));
    }
  }
  if (state.players.length < 2) {
    state.phase = "ended";
    const allSettlements = [
      ...exitSettlements,
      ...state.players.map((p) => toSettlement(p, p.chips)),
      ...state.pendingBuyIn.map((pb) => ({
        userId: pb.userId,
        name: pb.name,
        finalChips: 0,
        sessionStake: pb.sessionStake,
        net: -pb.sessionStake,
        buyInThisSession: pb.buyInThisSession
      }))
    ];
    state.pendingBuyIn = [];
    const msg = newBusted.length ? `\u{1F4B8} ${newBusted.map((b) => b.name).join("\u3001")} \u7206\u5009\uFF0C\u4EBA\u6578\u4E0D\u8DB3\uFF0C\u904A\u6232\u7D50\u675F\uFF01` : "\u4EBA\u6578\u4E0D\u8DB3\uFF0C\u904A\u6232\u7D50\u675F\uFF01";
    return ok(msg + "\n" + finalStandings(state, allSettlements), {}, {
      settlements: allSettlements,
      bustedPlayers: newBusted
    });
  }
  for (const p of state.players) {
    if (p.pendingTopUp > 0) {
      p.chips += p.pendingTopUp;
      p.sessionStake += p.pendingTopUp;
      p.buyInThisSession++;
      p.pendingTopUp = 0;
    }
  }
  state.players.forEach(resetForHand);
  state.deck = makeDeck();
  state.community = [];
  state.pot = 0;
  state.currentBet = BIG_BLIND;
  const n = state.players.length;
  const dealerIdx = state.dealerIdx % n;
  const sbIdx = n === 2 ? dealerIdx : (dealerIdx + 1) % n;
  const bbIdx = n === 2 ? (dealerIdx + 1) % n : (dealerIdx + 2) % n;
  state.players[dealerIdx].isDealer = true;
  state.players[sbIdx].isSB = true;
  state.players[bbIdx].isBB = true;
  assignPositions(state);
  const sbP = state.players[sbIdx];
  const bbP = state.players[bbIdx];
  state.pot += playerBet(sbP, SMALL_BLIND);
  state.pot += playerBet(bbP, BIG_BLIND);
  state.currentBet = Math.max(sbP.currentBet, bbP.currentBet, BIG_BLIND);
  for (let i = 0; i < 2; i++) for (const p of state.players) p.holeCards.push(dealCard(state));
  state.currentIdx = n === 2 ? sbIdx : (bbIdx + 1) % n;
  skipToCanAct(state);
  state.phase = "preflop";
  const posLines = state.players.map((p) => {
    const tags = [p.isDealer && "D", p.isSB && "SB", p.isBB && "BB"].filter(Boolean);
    const tag = tags.length ? `[${tags.join("/")}] ` : "      ";
    return `  ${tag}${p.name}: $${p.chips}`;
  });
  const current = state.players[state.currentIdx];
  const bustNote = newBusted.length ? `
\u{1F4B8} ${newBusted.map((b) => b.name).join("\u3001")} \u7206\u5009\uFF0C\u7B49\u5F85\u52A0\u5009\uFF08/buyin \u6216 /leave\uFF09` : "";
  const queueNote = state.queue.length ? `
\u23F3 \u7B49\u5F85\u4E0A\u684C\uFF1A${state.queue.map((q) => q.name).join("\u3001")}` : "";
  const groupMsg = `\u{1F0CF} \u7B2C ${state.handNum} \u5C40\u958B\u59CB\uFF01
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
` + posLines.join("\n") + `
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u76F2\u6CE8\uFF1A\u5C0F\u76F2 $${SMALL_BLIND} / \u5927\u76F2 $${BIG_BLIND} | \u5E95\u6C60\uFF1A$${state.pot}
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u2709\uFE0F \u624B\u724C\u5DF2\u79C1\u8A0A\u7D66\u6BCF\u4F4D\u73A9\u5BB6\uFF01
\u{1F449} @${current.name} \u8F2A\u5230\u4F60\u884C\u52D5\uFF01
\u53EF\u7528\u6307\u4EE4\uFF1A/call /raise <\u91D1\u984D> /fold /check /allin` + bustNote + queueNote;
  const privateMsgs = {};
  for (const p of state.players) {
    privateMsgs[p.userId] = `\u{1F0CF} \u4F60\u7684\u624B\u724C\uFF08\u7B2C ${state.handNum} \u5C40\uFF09\uFF1A
` + p.holeCards.map((c) => c.label).join("  ");
  }
  return ok(groupMsg, privateMsgs, {
    mentionUserId: current.userId,
    mentionName: current.name,
    bustedPlayers: newBusted,
    settlements: exitSettlements.length ? exitSettlements : void 0
  });
}
__name(startNewHand, "startNewHand");
function afterAction(state, actionMsg) {
  const active = activePlayers(state);
  if (active.length === 1) return awardUncontested(state, active[0], actionMsg);
  if (isBettingRoundComplete(state)) return advancePhase(state, actionMsg);
  const next = findNextActor(state);
  if (!next) return advancePhase(state, actionMsg);
  const msg = `${actionMsg}
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
${tableStatus(state)}
\u{1F449} @${next.name} \u8F2A\u5230\u4F60\u884C\u52D5\uFF01`;
  return ok(msg, {}, { mentionUserId: next.userId, mentionName: next.name });
}
__name(afterAction, "afterAction");
function advancePhase(state, prevMsg) {
  resetForRound(state);
  const n = state.players.length;
  state.currentIdx = (state.dealerIdx + 1) % n;
  skipToCanAct(state);
  let phaseLabel;
  if (state.phase === "preflop") {
    state.community.push(dealCard(state), dealCard(state), dealCard(state));
    state.phase = "flop";
    phaseLabel = "\u7FFB\u724C (Flop)";
  } else if (state.phase === "flop") {
    state.community.push(dealCard(state));
    state.phase = "turn";
    phaseLabel = "\u8F49\u724C (Turn)";
  } else if (state.phase === "turn") {
    state.community.push(dealCard(state));
    state.phase = "river";
    phaseLabel = "\u6CB3\u724C (River)";
  } else {
    return showdown(state, prevMsg);
  }
  const communityStr = state.community.map((c) => c.label).join("  ");
  if (playersWhoCanAct(state).length <= 1) {
    while (state.community.length < 5) state.community.push(dealCard(state));
    return showdown(state, `${prevMsg}
\u{1F3B4} ${phaseLabel}\uFF1A${communityStr}\uFF08\u81EA\u52D5\u767C\u5B8C\u5269\u9918\u516C\u5171\u724C\uFF09`);
  }
  const next = state.players[state.currentIdx];
  const msg = `${prevMsg}
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u{1F3B4} ${phaseLabel}\uFF1A${communityStr}
${tableStatus(state)}
\u{1F449} @${next.name} \u8F2A\u5230\u4F60\u884C\u52D5\uFF01`;
  return ok(msg, {}, { mentionUserId: next.userId, mentionName: next.name });
}
__name(advancePhase, "advancePhase");
function showdown(state, prevMsg) {
  state.phase = "showdown";
  const sidePots = calculateSidePots(state.players);
  const evaluated = activePlayers(state).map((p) => ({
    player: p,
    score: bestHand(p.holeCards, state.community)
  }));
  function cmp(a, b) {
    if (a[0] !== b[0]) return b[0] - a[0];
    for (let i = 0; i < Math.max(a[1].length, b[1].length); i++) {
      const d = (b[1][i] ?? 0) - (a[1][i] ?? 0);
      if (d !== 0) return d;
    }
    return 0;
  }
  __name(cmp, "cmp");
  evaluated.sort((a, b) => cmp(a.score, b.score));
  const winnings = {};
  const potResults = [];
  for (const pot of sidePots) {
    const eligible = pot.eligible.map((ep) => evaluated.find((e) => e.player.userId === ep.userId)).sort((a, b) => cmp(a.score, b.score));
    const best = eligible[0].score;
    const winners = eligible.filter((e) => cmp(e.score, best) === 0);
    const share = Math.floor(pot.amount / winners.length);
    const rem = pot.amount % winners.length;
    for (const w of winners) winnings[w.player.userId] = (winnings[w.player.userId] ?? 0) + share;
    if (rem) winnings[winners[0].player.userId] = (winnings[winners[0].player.userId] ?? 0) + rem;
    if (sidePots.length > 1) {
      const potType = pot.eligible.length < activePlayers(state).length ? "\u908A\u6C60" : "\u4E3B\u6C60";
      potResults.push(`  ${potType} $${pot.amount} \u2192 ${winners.map((w) => w.player.name).join("\u3001")}`);
    }
  }
  for (const p of state.players) p.chips += winnings[p.userId] ?? 0;
  const communityStr = state.community.map((c) => c.label).join("  ");
  const revealLines = evaluated.map(
    ({ score, player: p }) => `  ${p.name}\uFF1A${p.holeCards.map((c) => c.label).join("  ")}  \u2192  ${handName(score)}`
  );
  let winLine;
  if (sidePots.length === 1) {
    const mainWinner = evaluated[0];
    const mainWinners = evaluated.filter((e) => cmp(e.score, mainWinner.score) === 0);
    if (mainWinners.length === 1) {
      winLine = `\u{1F3C6} ${mainWinner.player.name} \u7372\u52DD\uFF01\u8D0F\u5F97 $${winnings[mainWinner.player.userId] ?? 0}`;
    } else {
      const share = Math.floor(state.pot / mainWinners.length);
      winLine = `\u{1F91D} \u5E73\u5C40\uFF01${mainWinners.map((w) => w.player.name).join("\u3001")} \u5404\u5F97 $${share}`;
    }
  } else {
    winLine = potResults.join("\n");
  }
  state.dealerIdx = (state.dealerIdx + 1) % state.players.length;
  return ok(
    `${prevMsg}
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u{1F3B4} \u516C\u5171\u724C\uFF1A${communityStr}
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u{1F4CB} \u6524\u724C\uFF1A
${revealLines.join("\n")}
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
${winLine}
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
${chipsummary(state)}
\u8F38\u5165 /next \u958B\u59CB\u4E0B\u4E00\u5C40\uFF0C\u6216 /endgame \u7D50\u675F\u904A\u6232`
  );
}
__name(showdown, "showdown");
function awardUncontested(state, winner, prevMsg) {
  winner.chips += state.pot;
  state.phase = "showdown";
  state.dealerIdx = (state.dealerIdx + 1) % state.players.length;
  return ok(
    `${prevMsg}
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u{1F3C6} ${winner.name} \u7372\u52DD\uFF01\u8D0F\u5F97\u5E95\u6C60 $${state.pot}\uFF08\u5176\u4ED6\u4EBA\u68C4\u724C\uFF09
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
${chipsummary(state)}
\u8F38\u5165 /next \u958B\u59CB\u4E0B\u4E00\u5C40\uFF0C\u6216 /endgame \u7D50\u675F\u904A\u6232`
  );
}
__name(awardUncontested, "awardUncontested");

// src/accounts.ts
function defaultAccount(userId, name) {
  return {
    userId,
    name,
    balance: 0,
    totalBuyIn: 0,
    buyInCount: 0,
    gamesPlayed: 0,
    updatedAt: Date.now()
  };
}
__name(defaultAccount, "defaultAccount");
async function loadAccount(kv, userId) {
  return kv.get(`a:${userId}`, "json");
}
__name(loadAccount, "loadAccount");
async function saveAccount(kv, account) {
  account.updatedAt = Date.now();
  await kv.put(`a:${account.userId}`, JSON.stringify(account), {
    expirationTtl: 31536e3
    // 1 year
  });
}
__name(saveAccount, "saveAccount");
async function applySettlement(kv, entry) {
  const acc = await loadAccount(kv, entry.userId) ?? defaultAccount(entry.userId, entry.name);
  acc.name = entry.name;
  acc.balance += entry.net;
  acc.totalBuyIn += entry.sessionStake;
  acc.buyInCount += entry.buyInThisSession;
  acc.gamesPlayed += 1;
  await saveAccount(kv, acc);
  return acc;
}
__name(applySettlement, "applySettlement");
async function registerGroupMember(kv, groupId, userId) {
  const key = `gm:${groupId}`;
  const members = await kv.get(key, "json") ?? [];
  if (!members.includes(userId)) {
    members.push(userId);
    await kv.put(key, JSON.stringify(members), { expirationTtl: 31536e3 });
  }
}
__name(registerGroupMember, "registerGroupMember");
async function getLeaderboard(kv, groupId) {
  const members = await kv.get(`gm:${groupId}`, "json") ?? [];
  const accounts = await Promise.all(members.map((uid) => loadAccount(kv, uid)));
  return accounts.filter(Boolean).sort((a, b) => b.balance - a.balance);
}
__name(getLeaderboard, "getLeaderboard");
function formatAccount(acc) {
  const sign = acc.balance >= 0 ? "+" : "";
  const reBuys = acc.buyInCount - acc.gamesPlayed;
  return `\u{1F464} ${acc.name}
  \u7D2F\u7A4D\u76C8\u8667\uFF1A${sign}$${acc.balance}
  \u7E3D\u4E0B\u6CE8\uFF1A$${acc.totalBuyIn}\uFF08${acc.gamesPlayed} \u5C40\uFF09
  \u52A0\u5009\u6B21\u6578\uFF1A${reBuys} \u6B21`;
}
__name(formatAccount, "formatAccount");

// src/index.ts
async function loadGame(kv, groupId) {
  const raw = await kv.get(groupId, "json");
  if (!raw) return newGame(groupId);
  raw.queue ??= [];
  raw.pendingBuyIn ??= [];
  for (const p of raw.players ?? []) {
    p.wantsToLeave ??= false;
    p.position ??= "";
    p.pendingTopUp ??= 0;
    p.sessionStake ??= p.chips;
    p.buyInThisSession ??= 1;
  }
  return raw;
}
__name(loadGame, "loadGame");
async function saveGame(kv, state) {
  await kv.put(state.groupId, JSON.stringify(state), { expirationTtl: 86400 });
}
__name(saveGame, "saveGame");
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type"
};
async function handlePlayerAPI(request, env2) {
  const url = new URL(request.url);
  const groupId = url.searchParams.get("groupId");
  if (!groupId) {
    return new Response(JSON.stringify({ error: "Missing groupId" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS }
    });
  }
  const auth = request.headers.get("Authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing token" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS }
    });
  }
  const profileRes = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!profileRes.ok) {
    return new Response(JSON.stringify({ error: "Invalid LINE token" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS }
    });
  }
  const lineProfile = await profileRes.json();
  const [state, account] = await Promise.all([
    loadGame(env2.GAMES_KV, groupId),
    loadAccount(env2.GAMES_KV, lineProfile.userId)
  ]);
  const userId = lineProfile.userId;
  const player = state.players.find((p) => p.userId === userId);
  const pending = state.pendingBuyIn.find((p) => p.userId === userId);
  const inQueue = state.queue.some((q) => q.userId === userId);
  const currentPlayer = state.players[state.currentIdx];
  const view = {
    phase: state.phase,
    handNum: state.handNum,
    holeCards: player?.holeCards.map((c) => c.label) ?? [],
    community: state.community.map((c) => c.label),
    pot: state.pot,
    currentBet: state.currentBet,
    players: state.players.map((p, i) => ({
      name: p.name,
      chips: p.chips,
      currentBet: p.currentBet,
      totalBet: p.totalBet,
      folded: p.folded,
      allIn: p.allIn,
      isDealer: p.isDealer,
      isSB: p.isSB,
      isBB: p.isBB,
      position: p.position,
      isMe: p.userId === userId,
      isCurrentTurn: i === state.currentIdx && !p.folded && !p.allIn
    })),
    myState: player ? {
      chips: player.chips,
      currentBet: player.currentBet,
      toCall: Math.max(0, state.currentBet - player.currentBet),
      isMyTurn: currentPlayer?.userId === userId,
      folded: player.folded,
      allIn: player.allIn,
      sessionStake: player.sessionStake,
      sessionNet: player.chips - player.sessionStake,
      inPendingBuyIn: false,
      inQueue: false
    } : pending ? {
      chips: 0,
      currentBet: 0,
      toCall: 0,
      isMyTurn: false,
      folded: false,
      allIn: false,
      sessionStake: pending.sessionStake,
      sessionNet: -pending.sessionStake,
      inPendingBuyIn: true,
      inQueue: false
    } : inQueue ? {
      chips: 0,
      currentBet: 0,
      toCall: 0,
      isMyTurn: false,
      folded: false,
      allIn: false,
      sessionStake: 0,
      sessionNet: 0,
      inPendingBuyIn: false,
      inQueue: true
    } : null,
    account: account ? {
      balance: account.balance,
      totalBuyIn: account.totalBuyIn,
      buyInCount: account.buyInCount,
      gamesPlayed: account.gamesPlayed
    } : null,
    pendingBuyInList: state.pendingBuyIn.map((p) => p.name),
    queueList: state.queue.map((q) => q.name)
  };
  return new Response(JSON.stringify(view), {
    headers: { "Content-Type": "application/json", ...CORS_HEADERS }
  });
}
__name(handlePlayerAPI, "handlePlayerAPI");
function buildLiffUrl(base, groupId) {
  return `${base}?liff.state=${encodeURIComponent("/?groupId=" + groupId)}`;
}
__name(buildLiffUrl, "buildLiffUrl");
function buildHelpText(liffUrl) {
  return `\u{1F0CF} \u5FB7\u5DDE\u64B2\u514B\u6307\u4EE4\u8AAA\u660E

\u3010\u52A0\u5165/\u96E2\u958B\u3011
  /join  \u6216  \u52A0\u5165        \u2014 \u52A0\u5165\u684C\u5B50
  /leave \u6216  \u96E2\u958B        \u2014 \u96E2\u958B\uFF08\u958B\u59CB\u524D\uFF09
  /start \u6216  \u958B\u59CB        \u2014 \u958B\u59CB\u904A\u6232\uFF08\u22652\u4EBA\uFF09

\u3010\u904A\u6232\u4E2D\u884C\u52D5\u3011
  /call  \u6216  \u8DDF\u6CE8        \u2014 \u8DDF\u6CE8
  /check \u6216  \u904E\u724C        \u2014 \u904E\u724C
  /fold  \u6216  \u68C4\u724C        \u2014 \u68C4\u724C
  /raise \u6216  \u52A0\u6CE8 <\u91D1\u984D>  \u2014 \u52A0\u6CE8\uFF08\u4F8B: /raise 100\uFF09
  /allin \u6216  \u5168\u62BC        \u2014 \u5168\u62BC
  /buyin \u6216  \u52A0\u5009 [\u91D1\u984D]  \u2014 \u52A0\u5009\uFF08\u4E0A\u9650 $${STARTING_CHIPS}\uFF0C\u4E0B\u4E00\u5C40\u751F\u6548\uFF09

\u3010\u5176\u4ED6\u3011
  /next     \u6216 \u4E0B\u4E00\u5C40  \u2014 \u4E0B\u4E00\u5C40
  /endgame  \u6216 \u7D50\u675F    \u2014 \u7D50\u675F\u904A\u6232\uFF08\u8A18\u9304\u5E33\u6236\uFF09
  /forceend \u6216 \u5F37\u5236\u7D50\u675F \u2014 \u5F37\u5236\u7D50\u675F\u904A\u6232\uFF08\u4EFB\u4F55\u72C0\u614B\u7686\u53EF\uFF09
  /status  \u6216 \u72C0\u614B   \u2014 \u67E5\u770B\u684C\u6CC1
  /balance \u6216 \u5E33\u6236   \u2014 \u67E5\u770B\u500B\u4EBA\u5E33\u6236
  /rank    \u6216 \u6392\u884C\u699C  \u2014 \u672C\u7FA4\u6392\u884C\u699C
  /link    \u6216 \u9023\u7D50   \u2014 \u91CD\u65B0\u767C\u9001\u67E5\u770B\u9023\u7D50
  /help    \u6216 \u5E6B\u52A9   \u2014 \u6B64\u8AAA\u660E

\u{1F0CF} \u5E95\u724C\u8ACB\u9EDE\u4EE5\u4E0B\u9023\u7D50\u67E5\u770B\uFF1A
${liffUrl}

\u8D77\u59CB\u7C4C\u78BC\uFF1A$${STARTING_CHIPS}  |  \u76F2\u6CE8\uFF1A$10 / $20`;
}
__name(buildHelpText, "buildHelpText");
var ALIASES = {
  "\u52A0\u5165": "/join",
  "\u96E2\u958B": "/leave",
  "\u958B\u59CB": "/start",
  "\u8DDF\u6CE8": "/call",
  "\u904E\u724C": "/check",
  "\u68C4\u724C": "/fold",
  "\u52A0\u6CE8": "/raise",
  "\u5168\u62BC": "/allin",
  "\u52A0\u5009": "/buyin",
  "\u4E0B\u4E00\u5C40": "/next",
  "\u7D50\u675F": "/endgame",
  "\u5F37\u5236\u7D50\u675F": "/forceend",
  "\u72C0\u614B": "/status",
  "\u9023\u7D50": "/link",
  "\u624B\u724C": "/cards",
  "\u5E33\u6236": "/balance",
  "\u6211\u7684\u5E33\u6236": "/balance",
  "\u6392\u884C\u699C": "/rank",
  "\u5E6B\u52A9": "/help"
};
var index_default = {
  async fetch(request, env2, ctx) {
    const { pathname } = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method === "GET" && pathname === "/api/player") {
      return handlePlayerAPI(request, env2);
    }
    if (request.method === "GET") {
      return new Response("OK", { status: 200 });
    }
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }
    const body = await request.text();
    const signature = request.headers.get("x-line-signature") ?? "";
    try {
      const valid = await verifySignature(env2.LINE_CHANNEL_SECRET, body, signature);
      if (!valid) {
        console.error("Signature verification failed.");
        return new Response("OK");
      }
    } catch (e) {
      console.error("Signature error:", e);
      return new Response("OK");
    }
    const payload = JSON.parse(body);
    ctx.waitUntil(
      (async () => {
        for (const evt of payload.events) {
          try {
            await handleEvent(evt, env2);
          } catch (e) {
            console.error("handleEvent error:", e);
          }
        }
      })()
    );
    return new Response("OK");
  }
};
async function handleEvent(event, env2) {
  console.log("event:", JSON.stringify({
    type: event.type,
    sourceType: event.source.type,
    text: event.message?.text
  }));
  if (event.type !== "message" || event.message?.type !== "text") return;
  if (event.source.type !== "group") {
    if (event.replyToken) {
      await replyMessage(
        env2.LINE_CHANNEL_ACCESS_TOKEN,
        event.replyToken,
        "\u8ACB\u5728\u7FA4\u7D44\u4E2D\u4F7F\u7528\u9019\u500B\u6A5F\u5668\u4EBA\uFF01\n\u8F38\u5165 /help \u67E5\u770B\u6307\u4EE4\u3002"
      );
    }
    return;
  }
  const groupId = event.source.groupId;
  const userId = event.source.userId;
  const replyToken = event.replyToken;
  const rawText = (event.message.text ?? "").trim();
  const parts = rawText.split(/\s+/);
  let cmd = parts[0];
  const args = parts.slice(1);
  if (ALIASES[cmd]) cmd = ALIASES[cmd];
  cmd = cmd.toLowerCase();
  if (!cmd.startsWith("/")) return;
  const token = env2.LINE_CHANNEL_ACCESS_TOKEN;
  const state = await loadGame(env2.GAMES_KV, groupId);
  const displayName = await getGroupMemberProfile(token, groupId, userId);
  let result = null;
  let replyText = "";
  switch (cmd) {
    case "/help":
    case "/h":
      replyText = buildHelpText(buildLiffUrl(env2.LIFF_URL, groupId));
      break;
    case "/join":
      result = addPlayer(state, userId, displayName);
      if (result.ok) await registerGroupMember(env2.GAMES_KV, groupId, userId);
      break;
    case "/leave":
      result = removePlayer(state, userId);
      break;
    case "/start":
      result = startGame(state, userId);
      if (result.ok) {
        result = { ...result, groupMsg: result.groupMsg + `

\u{1F0CF} \u5E95\u724C\u67E5\u770B\uFF1A${buildLiffUrl(env2.LIFF_URL, groupId)}` };
      }
      break;
    case "/call":
      result = processAction(state, userId, "call");
      break;
    case "/check":
      result = processAction(state, userId, "check");
      break;
    case "/fold":
      result = processAction(state, userId, "fold");
      break;
    case "/raise": {
      const amt = parseInt(args[0] ?? "", 10);
      if (isNaN(amt)) {
        replyText = "\u8ACB\u6307\u5B9A\u52A0\u6CE8\u91D1\u984D\uFF0C\u4F8B\u5982\uFF1A/raise 100";
        break;
      }
      result = processAction(state, userId, "raise", amt);
      break;
    }
    case "/allin":
      result = processAction(state, userId, "allin");
      break;
    case "/buyin": {
      const amt = parseInt(args[0] ?? "", 10) || STARTING_CHIPS;
      result = buyIn(state, userId, amt);
      break;
    }
    case "/next":
      result = nextHand(state, userId);
      if (result.ok && result.bustedPlayers?.length) {
        result = {
          ...result,
          groupMsg: result.groupMsg + `

\u{1F4B8} \u7206\u5009\u73A9\u5BB6\u8ACB\u9EDE\u9023\u7D50\u52A0\u5009\uFF1A${buildLiffUrl(env2.LIFF_URL, groupId)}
\u6307\u4EE4\uFF1A/buyin [\u91D1\u984D] \u6216 /leave`
        };
      }
      break;
    case "/forceend": {
      result = forceEndGame(state);
      if (result.settlements?.length) {
        for (const s of result.settlements) {
          await applySettlement(env2.GAMES_KV, s);
          await registerGroupMember(env2.GAMES_KV, groupId, s.userId);
        }
      }
      await env2.GAMES_KV.delete(groupId);
      await sendResult(token, replyToken, result);
      return;
    }
    case "/endgame": {
      result = endGame(state, userId);
      if (result.settlements?.length) {
        for (const s of result.settlements) {
          await applySettlement(env2.GAMES_KV, s);
          await registerGroupMember(env2.GAMES_KV, groupId, s.userId);
        }
      }
      await env2.GAMES_KV.delete(groupId);
      await sendResult(token, replyToken, result);
      return;
    }
    case "/status": {
      const statusText = getStatus(state);
      const activePh = state.phase !== "waiting" && state.phase !== "ended" && state.phase !== "showdown";
      const cur = activePh ? state.players[state.currentIdx] : null;
      if (cur && !cur.folded && !cur.allIn) {
        result = {
          ok: true,
          groupMsg: `@${cur.name} \u8F2A\u5230\u4F60\u884C\u52D5\uFF01

${statusText}`,
          privateMessages: {},
          mentionUserId: cur.userId,
          mentionName: cur.name
        };
      } else {
        replyText = statusText;
      }
      break;
    }
    case "/link":
    // /cards kept as fallback but now just points to the LIFF app
    case "/cards":
      replyText = `\u{1F0CF} \u8ACB\u9EDE\u4EE5\u4E0B\u9023\u7D50\u67E5\u770B\u5E95\u724C\uFF1A
${buildLiffUrl(env2.LIFF_URL, groupId)}`;
      break;
    case "/balance": {
      const acc = await loadAccount(env2.GAMES_KV, userId) ?? defaultAccount(userId, displayName);
      replyText = formatAccount({ ...acc, name: displayName });
      break;
    }
    case "/rank": {
      const board = await getLeaderboard(env2.GAMES_KV, groupId);
      if (!board.length) {
        replyText = "\u6392\u884C\u699C\u66AB\u7121\u8CC7\u6599\uFF0C\u5148\u5B8C\u6210\u4E00\u5C40\u904A\u6232\u5427\uFF01";
      } else {
        const medals = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];
        const lines = board.map((acc, i) => {
          const sign = acc.balance >= 0 ? "+" : "";
          const reBuys = acc.buyInCount - acc.gamesPlayed;
          return `${medals[i] ?? `${i + 1}.`} ${acc.name}\uFF1A${sign}$${acc.balance}\uFF08${acc.gamesPlayed} \u5C40\uFF0C\u52A0\u5009 ${reBuys} \u6B21\uFF09`;
        });
        replyText = `\u{1F3C6} \u672C\u7FA4\u6392\u884C\u699C
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
${lines.join("\n")}`;
      }
      break;
    }
    default:
      replyText = "\u672A\u77E5\u6307\u4EE4\u3002\u8F38\u5165 /help \u67E5\u770B\u6240\u6709\u6307\u4EE4\u3002";
  }
  if (result) {
    replyText = result.groupMsg;
  }
  await saveGame(env2.GAMES_KV, state);
  await sendResult(token, replyToken, result ?? { ok: true, groupMsg: replyText, privateMessages: {} });
}
__name(handleEvent, "handleEvent");
async function sendResult(token, replyToken, result) {
  if (result.mentionUserId && result.mentionName) {
    await replyWithMention(token, replyToken, result.groupMsg, result.mentionUserId, result.mentionName);
  } else {
    await replyMessage(token, replyToken, result.groupMsg);
  }
}
__name(sendResult, "sendResult");
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
