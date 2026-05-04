#!/usr/bin/env node
/**
 * Lint test file headers in graphclaw-cockpit.
 *
 * Behavior:
 *   - Files passed via --files (new/modified in PR) → ERROR if no canonical header
 *   - Legacy files (scan mode) → WARNING if no canonical header
 *   - Malformed header (ID present but fields missing) → ERROR
 *   - ID not registered in inventory.md → ERROR
 *
 * Usage:
 *   node scripts/check-test-headers.mjs                       # scan all test files
 *   node scripts/check-test-headers.mjs --files a.spec.ts b.test.tsx
 *
 * Exit codes:
 *   0  pass (warnings allowed)
 *   1  one or more errors
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, relative, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readdirSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..");

// ── Regex patterns ────────────────────────────────────────────────────────────
const ID_FULL_RE = /^GC-[ULKIEASLA]-[A-Z]{2,5}-W\d+-\d{3}$/;
const ID_RE = /GC-[ULKIEASLA]-[A-Z]{2,5}-W\d+-\d{3}/;
const HEADER_FIRST_RE =
  /^(GC-[ULKIEASLA]-[A-Z]{2,5}-W\d+-\d{3})\s*[—\-]+\s*(.+)/;

const REQUIRED_FIELDS = [
  "Scenario:",
  "PRD:",
  "Build wave:",
  "Layer:",
  "Owner:",
  "Last reviewed:",
  "Cases covered:",
];

// ── Diagnostics ───────────────────────────────────────────────────────────────
const warnings = [];
const errors = [];

function warn(filePath, msg) {
  const rel = relative(REPO_ROOT, filePath).replace(/\\/g, "/");
  warnings.push(`  WARN  ${rel}: ${msg}`);
}

function err(filePath, msg) {
  const rel = relative(REPO_ROOT, filePath).replace(/\\/g, "/");
  errors.push(`  ERROR ${rel}: ${msg}`);
}

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

/**
 * Returns { id, body } if canonical header present, or null.
 * body = cleaned comment text for field validation.
 */
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
    if (m) return { id: m[1], body };
    break; // First non-blank line didn't match
  }
  return null;
}

// ── Inventory reader ──────────────────────────────────────────────────────────

function loadRegisteredIds() {
  const ids = new Set();
  const roots = [
    join(REPO_ROOT, "e2e", "inventory.md"),
    join(REPO_ROOT, "src", "test", "inventory.md"),
  ];
  for (const invPath of roots) {
    if (!existsSync(invPath)) continue;
    for (const line of readFileSync(invPath, "utf-8").split("\n")) {
      const m = ID_RE.exec(line);
      if (m) ids.add(m[0]);
    }
  }
  return ids;
}

// ── File walker ───────────────────────────────────────────────────────────────

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
      if (
        entry.isDirectory() &&
        !["node_modules", ".git", "dist", "coverage"].includes(entry.name)
      ) {
        walk(full);
      } else if (entry.isFile() && predicate(entry.name, full)) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results.sort();
}

function findAllTestFiles() {
  const e2eFiles = walkSync(
    join(REPO_ROOT, "e2e"),
    (name) => name.endsWith(".spec.ts")
  );
  const unitFiles = walkSync(
    join(REPO_ROOT, "src"),
    (name) => name.endsWith(".test.tsx") || name.endsWith(".test.ts")
  );
  return [...e2eFiles, ...unitFiles];
}

// ── Check a single file ───────────────────────────────────────────────────────

function checkFile(filePath, isNew, registeredIds) {
  const header = parseHeader(filePath);

  if (!header) {
    if (isNew) {
      err(
        filePath,
        "missing canonical header — file must start with /** GC-X-DOM-WNN-NNN — title */"
      );
    } else {
      warn(
        filePath,
        "legacy file — no canonical GC header (add one when next touching this file)"
      );
    }
    return;
  }

  const { id, body } = header;

  // Validate ID format
  if (!ID_FULL_RE.test(id)) {
    err(filePath, `malformed test ID: "${id}"`);
  }

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!body.includes(field)) {
      err(filePath, `missing required header field: "${field}"`);
    }
  }

  // Check inventory registration
  if (!registeredIds.has(id)) {
    err(
      filePath,
      `test ID "${id}" is not registered in inventory.md — run: node scripts/regen-inventory.mjs`
    );
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const filesIdx = args.indexOf("--files");

  let filesToCheck;
  let isNewMap = new Map();

  if (filesIdx !== -1) {
    // Specific files passed — treat as new/modified
    const rawFiles = args.slice(filesIdx + 1).filter((a) => !a.startsWith("--"));
    filesToCheck = rawFiles.map((f) => resolve(f));
    for (const f of filesToCheck) isNewMap.set(f, true);
  } else {
    // Scan everything
    filesToCheck = findAllTestFiles();
    for (const f of filesToCheck) isNewMap.set(f, false);
  }

  const registeredIds = loadRegisteredIds();

  for (const filePath of filesToCheck) {
    if (!existsSync(filePath)) {
      err(filePath, "file not found");
      continue;
    }
    checkFile(filePath, isNewMap.get(filePath) ?? false, registeredIds);
  }

  // Report
  if (warnings.length) {
    console.log(`Warnings (${warnings.length}):`);
    warnings.forEach((w) => console.log(w));
  }
  if (errors.length) {
    console.log(`Errors (${errors.length}):`);
    errors.forEach((e) => console.log(e));
  }
  if (!warnings.length && !errors.length) {
    console.log(`✓ All ${filesToCheck.length} test file(s) checked — no issues.`);
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

main();
