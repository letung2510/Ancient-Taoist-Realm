"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const source = fs.readFileSync(path.join(__dirname, "..", "js", "main.js"), "utf8");
const prefix = source.slice(0, source.indexOf("  function enqueueAction"));
const timers = [];
let failOpen = true;
const records = {};
let upgraded = false;
const sandbox = {
  window: {
    setTimeout: (fn) => { timers.push(fn); return timers.length; },
    clearTimeout: () => {},
    indexedDB: {
      open: () => {
        const db = {
          objectStoreNames: { contains: () => upgraded },
          createObjectStore: () => { upgraded = true; return {}; },
          transaction: () => ({ objectStore: () => ({ put: (entry) => { records[entry.id] = entry; } }) })
        };
        const request = { result: db, objectStoreNames: { contains: () => upgraded } };
        timers.push(() => {
          if (failOpen) return request.onerror?.();
          request.onupgradeneeded?.();
          request.onsuccess?.();
        });
        return request;
      }
    }
  }
};
vm.createContext(sandbox);
vm.runInContext(`${prefix}\n})();`, sandbox, { filename: "js/main.js:archive" });

(async () => {
  const archive = sandbox.window.__LOG_ARCHIVE_TEST__;
  assert(archive && typeof archive.flush === "function");
  archive.flush([{ id: "failure-injection-1", type: "test", text: "retry" }]);
  assert.strictEqual(timers.length, 1);
  timers.shift()();
  await Promise.resolve();
  assert(archive.retryQueueSize() > 0, "failed IndexedDB open must enter retry queue");

  failOpen = false;
  const retryTimer = timers.shift();
  assert.strictEqual(typeof retryTimer, "function");
  retryTimer();
  await Promise.resolve();
  assert.strictEqual(archive.retryQueueSize(), 0);
  assert(records["failure-injection-1"], "successful archive retry must persist the event");
  archive.reset();
  console.log("OK: IndexedDB archive failure injection and retry queue");
})().catch((error) => { console.error(error); process.exitCode = 1; });
