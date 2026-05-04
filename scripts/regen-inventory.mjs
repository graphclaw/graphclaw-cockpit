#!/usr/bin/env node
/**
 * Walk e2e/specs/ and src/ for test files, parse canonical headers,
 * and emit inventory.md at each test root.
 *
 * Legacy files (no canonical header) produce a TODO row.
 *
 * Usage:
 *   node scripts/regen-inventory.mjs [--dry-run]
 *
 * Exit codes:
 *   0  success
 *   1  unexpected error
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { resolve, relative, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..");

const DRY_RUN = process.argv.includes("--dry-run");

// ── GC test ID pattern ────────────────────────────────────────────────────────
const HEADER_FIRST_RE =
  /^(GC-[ULKIEASLA]-[A-Z]{2,5}-W\d+-\d{3})\s*[—\-]+\s*(.+)/;

const SCENARIO_RE =
  /Scenario:\s*([\s\S]+?)(?=\n\s*\n|\n\s*\*\s*PRD:|\n\s*\*\s*Build wave:|\n\s*\*\s*Layer:|\*\/)/;

// ── Header parsing ────────────────────────────────────────────────────────────

function extractBlockComment(text) {
  const stripped = text.trimStart();
  if (!stripped.startsWith("/**") && !stripped.startsWith("/*")) return null;
  const end = stripped.indexOf("*/");
  if (end === -1) return null;
  return stripped.slice(0, end + 2);
}

function cleanComment(raw) {
  return raw
    .replace(/^\/\*+/, "")
    .replace(/\*\/$/, "")
    .split("\n")
    .map((l) => l.replace(/^\s*\*\s?/, ""))
    .join("\n");
}

function truncate(s) {
  const cleaned = s.replace(/\s+/g, " ").trim();
  const punctIdx = cleaned.search(/[.!?]/);
  const sentence = punctIdx !== -1 ? cleaned.slice(0, punctIdx + 1) : cleaned;
  return sentence.length > 80 ? sentence.slice(0, 77) + "..." : sentence;
}

function parseHeader(filePath) {
  let text;
  try {
    text = readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }

  const raw = extractBlockComment(text);
  if (!raw) return null;
  const body = cleanComment(raw);

  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = HEADER_FIRST_RE.exec(trimmed);
    if (m) {
      const id = m[1];
      const title = m[2].trim();
      const sm = SCENARIO_RE.exec(body);
      const scenario = sm ? truncate(sm[1]) : truncate(title);
      return { id, scenario };
    }
    break;
  }
  return null;
}

// ── File walker ───────────────────────────────────────────────────────────────

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "coverage", "__pycache__"]);

function walkSync(dir, predicate) {
  const results = [];
  if (!existsSync(dir)) return results;

  function walk(current) {
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory() && !SKIP_DIRS.has(entry.name)) {
        walk(full);
      } else if (entry.isFile() && predicate(entry.name, full)) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results.sort();
}

// ── Inventory building ────────────────────────────────────────────────────────

function collectEntries(files, inventoryDir) {
  return files.map((filePath) => {
    const header = parseHeader(filePath);
    const rel = relative(inventoryDir, filePath).replace(/\\/g, "/");
    if (header) {
      return { id: header.id, scenario: header.scenario, rel };
    }
    const base = filePath.replace(/\\/g, "/").split("/").pop() ?? filePath;
    return { id: "TODO", scenario: `(no header) ${base}`, rel };
  });
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    if (a.id === "TODO" && b.id !== "TODO") return 1;
    if (a.id !== "TODO" && b.id === "TODO") return -1;
    if (a.id !== b.id) return a.id.localeCompare(b.id);
    return a.rel.localeCompare(b.rel);
  });
}

function renderInventory(title, entries) {
  const today = new Date().toISOString().slice(0, 10);
  const rows = entries.map(
    (e) => `| ${e.id} | ${e.scenario} | [${e.rel}](${e.rel}) |`
  );
  return [
    `# Test Inventory — ${title}`,
    "",
    "| ID | Scenario (1 line) | File |",
    "|---|---|---|",
    ...rows,
    "",
    `_Last regenerated: ${today} by \`scripts/regen-inventory.mjs\`._`,
    "",
  ].join("\n");
}

function writeIfChanged(invPath, content) {
  const stripDate = (s) =>
    s.replace(/_Last regenerated: \d{4}-\d{2}-\d{2} by.*/, "");
  if (existsSync(invPath)) {
    const existing = readFileSync(invPath, "utf-8");
    if (stripDate(existing) === stripDate(content)) return false;
  }
  if (!DRY_RUN) {
    mkdirSync(dirname(invPath), { recursive: true });
    writeFileSync(invPath, content, "utf-8");
  }
  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const changed = [];
  const unchanged = [];

  const E2E_DIR = join(REPO_ROOT, "e2e");
  const SRC_DIR = join(REPO_ROOT, "src");
  const SRC_TEST_DIR = join(REPO_ROOT, "src", "test");

  // 1. E2E inventory: e2e/**/*.spec.ts
  const e2eFiles = walkSync(E2E_DIR, (name) => name.endsWith(".spec.ts"));
  const e2eEntries = sortEntries(collectEntries(e2eFiles, E2E_DIR));
  const e2eInvPath = join(E2E_DIR, "inventory.md");
  const e2eContent = renderInventory("e2e", e2eEntries);
  if (writeIfChanged(e2eInvPath, e2eContent)) {
    changed.push(`  ${DRY_RUN ? "would write" : "wrote"}: e2e/inventory.md`);
  } else {
    unchanged.push("  unchanged: e2e/inventory.md");
  }

  // 2. src/test inventory: all *.test.tsx / *.test.ts under src/
  const unitFiles = walkSync(
    SRC_DIR,
    (name, fullPath) =>
      (name.endsWith(".test.tsx") || name.endsWith(".test.ts")) &&
      !fullPath.includes("contract")
  );
  const unitEntries = sortEntries(collectEntries(unitFiles, SRC_TEST_DIR));
  const unitInvPath = join(SRC_TEST_DIR, "inventory.md");
  const unitContent = renderInventory("src/test (unit + component)", unitEntries);
  if (writeIfChanged(unitInvPath, unitContent)) {
    changed.push(
      `  ${DRY_RUN ? "would write" : "wrote"}: src/test/inventory.md`
    );
  } else {
    unchanged.push("  unchanged: src/test/inventory.md");
  }

  if (changed.length) {
    console.log("Inventory regenerated:");
    changed.forEach((l) => console.log(l));
  }
  if (unchanged.length) {
    console.log("No changes:");
    unchanged.forEach((l) => console.log(l));
  }
}

main();
