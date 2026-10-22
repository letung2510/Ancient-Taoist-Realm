"use strict";
// Shared runtime loader for node verification scripts: runs the browser scripts in configured runtime order.
//
// loadRuntime(options) -> { context, sandbox, window, E, X }
//   until:        last script to load (inclusive): "js/expansion.js" (default, engine + data only),
//                 "js/ui.js" (adds the UI layer; callers must supply `document` etc. via globals) or "all".
//   exclude:      script paths (without ?v=) to skip.
//   globals:      extra properties copied onto the vm context before any script runs.
//   sandboxStyle: "self"   -> context.window === context; default globals console/Math/Date/JSON/structuredClone.
//                 "window" -> context = { window: {} } (classic tool fixture); scripts publish onto context.window.
// `context` and `sandbox` are the same vm context object; `window` is context.window.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..", "..");
const MANIFEST_PATH = path.join(ROOT, "data", "manifest.json");

function parseScriptsFromIndex() {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  return Array.from(html.matchAll(/<script[^>]+src="([^"?]+)/g), (match) => match[1]);
}

function runtimeScripts() {
  if (fs.existsSync(MANIFEST_PATH)) {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
    if (Array.isArray(manifest.runtimeScripts) && manifest.runtimeScripts.length) {
      return manifest.runtimeScripts.slice();
    }
  }
  return parseScriptsFromIndex();
}

function selectScripts(until = "js/expansion.js", exclude = []) {
  const all = runtimeScripts();
  const end = until === "all" ? all.length - 1 : all.indexOf(until);
  if (end < 0) throw new Error(`loadRuntime: "${until}" is not a runtime script`);
  const skip = new Set(exclude);
  return all.slice(0, end + 1).filter((file) => !skip.has(file));
}

function loadRuntime(options = {}) {
  const style = options.sandboxStyle || "self";
  if (style !== "self" && style !== "window") throw new Error(`loadRuntime: unknown sandboxStyle "${style}"`);
  const base = style === "self"
    ? { console, Math, Date, JSON, structuredClone: global.structuredClone }
    : { window: {} };
  const context = Object.assign(base, options.globals || {});
  if (style === "self") context.window = context;
  vm.createContext(context);
  selectScripts(options.until, options.exclude).forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename: file });
  });
  const win = context.window;
  return { context, sandbox: context, window: win, E: win.GameEngine, X: win.GameExpansion };
}

module.exports = { ROOT, runtimeScripts, selectScripts, loadRuntime };