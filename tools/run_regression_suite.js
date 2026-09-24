"use strict";

const { execFile, spawnSync } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");
const checks = [
  ["verify_game", "tools/verify_game.js"],
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
  , ["verify_save_envelope", "tools/verify_save_envelope.js"]
  , ["verify_action_dispatch_matrix", "tools/verify_action_dispatch_matrix.js"]
  , ["verify_map_producer_matrix", "tools/verify_map_producer_matrix.js"]
  , ["verify_n90_n114_behavior", "tools/verify_n90_n114_behavior.js"]
  , ["verify_n3_n54_behavior", "tools/verify_n3_n54_behavior.js"]
  , ["verify_m79_m88_behavior", "tools/verify_m79_m88_behavior.js"]
];

const runCheck = ([name, file]) => new Promise((resolve) => {
  execFile(process.execPath, [file], {
    cwd: root,
    maxBuffer: 16 * 1024 * 1024,
    // Some canonical data-integrity probes intentionally generate the full
    // 10k Fate/character fixture set. Keep a hard ceiling, but do not confuse
    // a cold CI/Windows run with a hung test.
    timeout: 180 * 1000,
    killSignal: "SIGTERM"
  }, (error, stdout, stderr) => {
    const timeout = Boolean(error && error.killed && error.signal === "SIGTERM");
    resolve({
      name,
      file,
      ok: !error,
      output: (stdout || "") + (stderr || "") + (timeout ? "\nTIMEOUT: check exceeded 180s\n" : "")
    });
  });
});

const failures = [];
Promise.all(checks.map(runCheck)).then((results) => {
  results.forEach((result) => {
    if (!result.ok) failures.push(result);
    else process.stdout.write(`PASS ${result.name}\n`);
  });

  // A few legacy stress fixtures use process-wide random seeds; retry a failed
  // isolated check once so a transient fixture collision is not reported as a
  // deterministic regression.
  const retryFailures = failures.splice(0);
  Promise.all(retryFailures.map((failure) => runCheck([failure.name, failure.file]))).then((retried) => {
    retried.forEach((result) => {
      if (!result.ok) failures.push(result);
      else process.stdout.write(`PASS ${result.name} (retry)\n`);
    });

    const requirement = spawnSync(process.execPath, ["validate_requirement_docs.js"], { cwd: path.join(root, "requirement"), encoding: "utf8" });
    if (requirement.status !== 0) failures.push({ name: "validate_requirement_docs", output: (requirement.stdout || "") + (requirement.stderr || "") });
    else process.stdout.write("PASS validate_requirement_docs\n");

    const diff = spawnSync("git", ["diff", "--check"], { cwd: root, encoding: "utf8" });
    if (diff.status !== 0) failures.push({ name: "git diff --check", output: (diff.stdout || "") + (diff.stderr || "") });
    else process.stdout.write("PASS git diff --check\n");

    if (failures.length) {
      failures.forEach((failure) => process.stderr.write(`FAIL ${failure.name}\n${failure.output}\n`));
      process.exitCode = 1;
    } else {
      process.stdout.write(`OK: ${checks.length + 2} regression checks passed\n`);
    }
  });
});
