"use strict";

const { execFile, spawnSync } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");
// index.offline.html is rebuilt only on explicit request, so its parity gate is opt-in.
const withOfflineBundle = process.argv.includes("--with-offline-bundle");
const allChecks = [
  ["verify_game", "tools/verify_game.js"],
  ["verify_data_bundle_equivalence", "tools/verify_data_bundle_equivalence.js"],
  ["verify_review_batches", "tools/verify_review_batches.js"],
  ["verify_dichi_deep", "tools/verify_dichi_deep.js"],
  ["verify_companion_runtime", "tools/verify_companion_runtime.js"],
  ["verify_expansion_stress", "tools/verify_expansion_stress.js"],
  ["verify_completion_tasks", "tools/verify_completion_tasks.js"],
  ["verify_ui_surface_contract", "tools/verify_ui_surface_contract.js"],
  ["verify_log_narrative", "tools/verify_log_narrative.js"],
  ["verify_log_producers", "tools/verify_log_producers.js"],
  ["verify_catalog_balance", "tools/verify_catalog_balance.js"],
  ["verify_utf8_integrity", "tools/verify_utf8_integrity.js"],
  ["verify_random_boundaries", "tools/verify_random_boundaries.js"],
  ["verify_asset_references", "tools/verify_asset_references.js"],
  ["verify_indexeddb_archive", "tools/verify_indexeddb_archive.js"],
  ["profile_runtime_budget", "tools/profile_runtime_budget.js"],
  ["verify_33_item_coverage", "tools/verify_33_item_coverage.js"],
  ["verify_opening_intent", "tools/verify_opening_intent.js"],
  ["verify_expansion_log_matrix", "tools/verify_expansion_log_matrix.js"],
  ["verify_character_generator_replay", "tools/verify_character_generator_replay.js"],
  ["diagnose_breakthrough", "tools/diagnose_breakthrough.js"]
  , ["verify_offline_bundle", "tools/verify_offline_bundle.js"]
  , ["verify_audit_closure", "tools/verify_audit_closure.js"]
  , ["verify_canonical_contracts", "tools/verify_canonical_contracts.js"]
  , ["verify_behavior_first_matrix", "tools/verify_behavior_first_matrix.js"]
  , ["verify_audit_deep", "tools/verify_audit_deep.js"]
  , ["verify_webgame_boundary", "tools/verify_webgame_boundary.js"]
  , ["verify_legacy_behavior_matrix", "tools/verify_legacy_behavior_matrix.js"]
  , ["verify_legacy_log_matrix", "tools/verify_legacy_log_matrix.js"]
  , ["verify_offline_parity", "tools/verify_offline_parity.js"]
  , ["verify_cultivation_producers", "tools/verify_cultivation_producers.js"]
  , ["verify_world_producer_matrix", "tools/verify_world_producer_matrix.js"]
  , ["verify_progression_requirement_matrix", "tools/verify_progression_requirement_matrix.js"]
  , ["verify_technique_channel_matrix", "tools/verify_technique_channel_matrix.js"]
  , ["verify_browser_ui_contract", "tools/verify_browser_ui_contract.js"]
  , ["verify_ui_variant_render_matrix", "tools/verify_ui_variant_render_matrix.js"]
  , ["verify_save_envelope", "tools/verify_save_envelope.js"]
  , ["verify_action_dispatch_matrix", "tools/verify_action_dispatch_matrix.js"]
  , ["verify_map_producer_matrix", "tools/verify_map_producer_matrix.js"]
  , ["verify_n90_n114_behavior", "tools/verify_n90_n114_behavior.js"]
  , ["verify_n3_n54_behavior", "tools/verify_n3_n54_behavior.js"]
  , ["verify_m79_m88_behavior", "tools/verify_m79_m88_behavior.js"]
  , ["verify_cultivation_controls", "tools/verify_cultivation_controls.js"]
  , ["verify_local_movement_weather", "tools/verify_local_movement_weather.js"]
  , ["verify_long_range_replay", "tools/verify_long_range_replay.js"]
  , ["verify_p0_gap_closure", "tools/verify_p0_gap_closure.js"]
  , ["verify_world_data_audit", "tools/verify_world_data_audit.js"]
  , ["verify_refactor_invariants", "tools/verify_refactor_invariants.js"]
];
const checks = withOfflineBundle ? allChecks : allChecks.filter(([name]) => name !== "verify_offline_bundle");
if (!withOfflineBundle) process.stdout.write("SKIP verify_offline_bundle (pass --with-offline-bundle after rebuilding index.offline.html)\n");

// Resource modes:
//   --changed   skip checks whose inputs are unchanged since their last PASS (cache: .cache/regression.json)
//   --quick     skip the slow checks listed in SLOW_CHECKS (use the full run before committing)
//   --jobs=N    run N checks in parallel (default 1 to keep CPU/RAM low)
const fs = require("fs");
const crypto = require("crypto");
const argValue = (name) => (process.argv.find((arg) => arg.startsWith(name + "=")) || "").split("=")[1];
const changedOnly = process.argv.includes("--changed");
const quick = process.argv.includes("--quick");
const jobs = Math.max(1, Math.min(4, Number(argValue("--jobs") || 1)));
const SLOW_CHECKS = new Set(["verify_game", "verify_review_batches", "verify_action_dispatch_matrix", "verify_offline_parity", "verify_long_range_replay"]);
const CACHE_FILE = path.join(root, ".cache", "regression.json");
const hashCache = new Map();
function hashPath(relative) {
  if (hashCache.has(relative)) return hashCache.get(relative);
  const full = path.join(root, relative);
  const hash = crypto.createHash("sha1");
  if (fs.existsSync(full)) {
    const stat = fs.statSync(full);
    if (stat.isDirectory()) fs.readdirSync(full).sort().forEach((entry) => hash.update(entry + ":" + hashPath(path.join(relative, entry))));
    else hash.update(fs.readFileSync(full));
  }
  const digest = hash.digest("hex");
  hashCache.set(relative, digest);
  return digest;
}
function checkFingerprint(file) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  const inputs = [file, "tools/lib", "js", "data", "index.html", "styles.css", "tools/character_generator.js", "gemini-code-1788430656294.js"];
  if (/requirement/.test(source)) inputs.push("requirement");
  if (/index\.offline\.html/.test(source)) inputs.push("index.offline.html");
  if (/webgame/.test(source)) inputs.push("webgame");
  if (/assets/.test(source)) inputs.push("assets");
  if (/sample_characters/.test(source)) inputs.push("tools/fixtures/sample_characters.json");
  (source.match(/tools\/[\w./-]+\.js/g) || []).forEach((dependency) => inputs.push(dependency));
  return crypto.createHash("sha1").update(inputs.map((input) => input + "=" + hashPath(input)).join("|")).digest("hex");
}
const cache = (() => { try { return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")); } catch (error) { return {}; } })();
const selectedChecks = checks.filter(([name, file]) => {
  if (quick && SLOW_CHECKS.has(name)) { process.stdout.write(`SKIP ${name} (--quick)\n`); return false; }
  if (changedOnly && cache[name] === checkFingerprint(file)) { process.stdout.write(`SKIP ${name} (unchanged)\n`); return false; }
  return true;
});
function rememberPass(result) {
  cache[result.name] = checkFingerprint(result.file);
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

const runCheck = ([name, file]) => new Promise((resolve) => {
  const timeoutMs = ["verify_action_dispatch_matrix.js", "verify_review_batches.js"].some((name) => file.endsWith(name))
    ? 300 * 1000
    : 180 * 1000;
  process.stdout.write(`START ${name} (timeout ${Math.round(timeoutMs / 1000)}s)\n`);
  const startedAt = Date.now();
  execFile(process.execPath, [file], {
    cwd: root,
    maxBuffer: 16 * 1024 * 1024,
    // Some canonical data-integrity probes intentionally generate the full
    // 10k Fate/character fixture set. Keep a hard ceiling, but do not confuse
    // a cold CI/Windows run with a hung test.
    timeout: timeoutMs,
    killSignal: "SIGTERM",
    windowsHide: true
  }, (error, stdout, stderr) => {
    const timeout = Boolean(error && error.killed && error.signal === "SIGTERM");
    const result = {
      name,
      file,
      ok: !error,
      ms: Date.now() - startedAt,
      output: (stdout || "") + (stderr || "") + (timeout ? `\nTIMEOUT: ${name} exceeded ${Math.round(timeoutMs / 1000)}s\n` : "")
    };
    process.stdout.write(`${result.ok ? "PASS" : "FAIL"} ${name} (${(result.ms / 1000).toFixed(1)}s)\n`);
    resolve(result);
  });
});

// Keep the heavyweight VM fixtures from starving one another on CI/Windows.
// Running all checks at once made the 10k-character and long-world simulations
// exceed their individual timeout even though each check passes in isolation.
const runChecks = (items, concurrency = 4) => new Promise((resolve) => {
  const results = [];
  let cursor = 0;
  let active = 0;
  const pump = () => {
    if (cursor >= items.length && active === 0) return resolve(results);
    while (active < concurrency && cursor < items.length) {
      const item = items[cursor++];
      active += 1;
      runCheck(item).then((result) => {
        results.push(result);
        active -= 1;
        pump();
      });
    }
  };
  pump();
});

const failures = [];
runChecks(selectedChecks, jobs).then((results) => {
  results.forEach((result) => {
    if (!result.ok) failures.push(result);
    else rememberPass(result);
  });

  // A few legacy stress fixtures use process-wide random seeds; retry a failed
  // isolated check once so a transient fixture collision is not reported as a
  // deterministic regression.
  const retryFailures = failures.splice(0);
  runChecks(retryFailures.map((failure) => [failure.name, failure.file]), 1).then((retried) => {
    retried.forEach((result) => {
      if (!result.ok) failures.push(result);
      else { rememberPass(result); process.stdout.write(`PASS ${result.name} (retry)\n`); }
    });

    const buildDataCheck = spawnSync(process.execPath, ["tools/build_data.js", "--check"], { cwd: root, encoding: "utf8" });
    if (buildDataCheck.status !== 0) failures.push({ name: "build_data_check", output: (buildDataCheck.stdout || "") + (buildDataCheck.stderr || "") });
    else process.stdout.write("PASS build_data_check\n");
    const requirement = spawnSync(process.execPath, ["validate_requirement_docs.js"], { cwd: path.join(root, "requirement"), encoding: "utf8" });
    if (requirement.status !== 0) failures.push({ name: "validate_requirement_docs", output: (requirement.stdout || "") + (requirement.stderr || "") });
    else process.stdout.write("PASS validate_requirement_docs\n");

    const index = spawnSync(process.execPath, ["tools/build_requirement_index.js", "--check"], { cwd: root, encoding: "utf8" });
    if (index.status !== 0) failures.push({ name: "requirement_index", output: (index.stdout || "") + (index.stderr || "") });
    else process.stdout.write("PASS requirement_index\n");

    const diff = spawnSync("git", ["diff", "--check"], { cwd: root, encoding: "utf8" });
    if (diff.status !== 0) failures.push({ name: "git diff --check", output: (diff.stdout || "") + (diff.stderr || "") });
    else process.stdout.write("PASS git diff --check\n");

    if (failures.length) {
      failures.forEach((failure) => process.stderr.write(`FAIL ${failure.name}\n${failure.output}\n`));
      process.exitCode = 1;
    } else {
      process.stdout.write(`OK: ${selectedChecks.length + 4} regression checks passed${selectedChecks.length < checks.length ? ` (${checks.length - selectedChecks.length} skipped)` : ""}\n`);
    }
  });
});
