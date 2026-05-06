#!/usr/bin/env node
/**
 * check-test-ids.mjs — Validate test IDs in the inventory are unique and well-formed.
 *
 * Format: GC-<L>-<DOM>-<W>-<NNN>
 *   L = U|C|K|I|E|L|A
 *   DOM = 2-4 uppercase letters
 *   W = W followed by digits
 *   NNN = 3-digit zero-padded sequence
 *
 * Usage: node scripts/check-test-ids.mjs
 * Exit 0 if all IDs valid and unique, exit 1 otherwise.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const ID_PATTERN = /^GC-[ULCKIESLA]-[A-Z]{2,4}-W\d+-\d{3}$/;

const inventoryPaths = [
  'e2e/inventory.md',
  'src/test/inventory.md',
];

let errors = 0;
const allIds = new Map();

for (const relPath of inventoryPaths) {
  const fullPath = resolve(root, relPath);
  if (!existsSync(fullPath)) {
    console.warn(`⚠ Inventory not found: ${relPath}`);
    continue;
  }

  const content = readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match table rows: | GC-X-XXX-WNN-NNN | ... |
    const match = line.match(/\|\s*(GC-[A-Z0-9-]+)\s*\|/);
    if (!match) continue;

    const id = match[1];

    if (!ID_PATTERN.test(id)) {
      console.error(`✗ ${relPath}:${i + 1} — malformed ID: ${id}`);
      errors++;
      continue;
    }

    if (allIds.has(id)) {
      console.error(`✗ ${relPath}:${i + 1} — duplicate ID: ${id} (first seen in ${allIds.get(id)})`);
      errors++;
    } else {
      allIds.set(id, `${relPath}:${i + 1}`);
    }
  }
}

if (errors > 0) {
  console.error(`\n${errors} test ID error(s) found.`);
  process.exit(1);
} else {
  console.log(`✓ ${allIds.size} test IDs validated — all unique and well-formed.`);
  process.exit(0);
}
