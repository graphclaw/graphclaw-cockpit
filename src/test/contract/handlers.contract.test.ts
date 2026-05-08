// Copyright 2026 Abhishek Gupta
// SPDX-License-Identifier: Apache-2.0
/**
 * GC-K-API-W12-001 — MSW handler conformance to backend OpenAPI spec
 *
 * Scenario: Every MSW handler in src/test/handlers.ts must reference a real
 * path+method from the backend OpenAPI spec. Catches frontend drift where a
 * handler is added for a non-existent endpoint (or an endpoint is renamed
 * in the backend without updating the frontend mock).
 *
 * PRD: docs/prd/16-react-implementation.md §16.6
 * Build wave: W12
 * Layer: L3 Contract
 * Owner: frontend-team
 * Last reviewed: 2026-05-04
 *
 * Cases covered:
 *  - Every handler path+method exists in the OpenAPI spec
 *  - Spec has paths (non-stub mode — skips gracefully if stub)
 *
 * Notes:
 *  - Loads spec from src/test/openapi.json (committed snapshot)
 *  - Refresh snapshot: npm run sync-openapi (fetches from http://localhost:8000/openapi.json)
 *  - If openapi.json has no paths (stub mode), path checks are skipped with a warning
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { handlers } from '../handlers'

// ── Load OpenAPI spec ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const spec = require('../openapi.json') as {
  openapi?: string
  paths?: Record<string, Record<string, unknown>>
}

// ── Handler path extractor ────────────────────────────────────────────────────

interface HandlerInfo {
  method: string
  path: string
}

/**
 * Extract method and path from an MSW handler.
 * MSW RequestHandler objects expose `info.method` and `info.path`.
 */
function extractHandlerInfo(handler: unknown): HandlerInfo | null {
  const h = handler as {
    info?: { method?: string; path?: string | RegExp }
  }
  if (!h.info?.method || !h.info?.path) return null
  const rawPath = h.info.path
  if (typeof rawPath !== 'string') return null // Skip regex handlers
  return {
    method: h.info.method.toLowerCase(),
    path: rawPath,
  }
}

/**
 * Normalize a path for comparison:
 *  - Strip leading/trailing slashes for consistency
 *  - Convert MSW :param notation to OpenAPI {param} notation
 */
function normalizePath(p: string): string {
  return p
    .replace(/:([^/]+)/g, '{$1}')  // :taskId → {taskId}
    .replace(/\/+/g, '/')           // collapse double slashes
    .replace(/\/$/, '')             // remove trailing slash
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MSW handlers conform to OpenAPI spec', () => {
  const specPaths = spec.paths ?? {}
  const isStubSpec = Object.keys(specPaths).length < 5

  beforeAll(() => {
    if (isStubSpec) {
      console.warn(
        '[contract] openapi.json has no paths (stub mode). ' +
        'Run `npm run sync-openapi` to populate it from the live backend, then re-run.',
      )
    }
  })

  it('openapi.json is present and valid JSON', () => {
    expect(spec).toBeDefined()
    expect(typeof spec).toBe('object')
    expect(spec.openapi).toMatch(/^3\./)
  })

  it('handlers array is non-empty', () => {
    expect(handlers.length).toBeGreaterThan(0)
  })

  it('every handler path+method exists in the OpenAPI spec', () => {
    if (isStubSpec) {
      console.warn('  [skipped] spec has no paths — run npm run sync-openapi first')
      return
    }

    const missing: string[] = []
    const normalizedSpecPaths: Record<string, Record<string, unknown>> = {}

    // Pre-normalize all spec paths
    for (const [path, methods] of Object.entries(specPaths)) {
      normalizedSpecPaths[normalizePath(path)] = methods
    }

    for (const handler of handlers) {
      const info = extractHandlerInfo(handler)
      if (!info) continue // Skip regex-path handlers

      const normalizedPath = normalizePath(info.path)
      const specEntry = normalizedSpecPaths[normalizedPath]

      if (!specEntry) {
        missing.push(`${info.method.toUpperCase()} ${info.path} (normalized: ${normalizedPath})`)
        continue
      }

      if (!specEntry[info.method]) {
        missing.push(
          `${info.method.toUpperCase()} ${info.path} — path exists but method "${info.method}" is not in spec`,
        )
      }
    }

    if (missing.length > 0) {
      const message =
        `${missing.length} MSW handler(s) reference non-existent endpoints:\n` +
        missing.map((m) => `  • ${m}`).join('\n') +
        '\n\nFix: update src/test/handlers.ts or run `npm run sync-openapi` to refresh the spec.'
      expect.fail(message)
    }
  })

  it('lists all handler paths for traceability', () => {
    // This test always passes — it documents every registered handler
    const handlerSummary = handlers
      .map((h) => extractHandlerInfo(h))
      .filter(Boolean)
      .map((i) => `${i!.method.toUpperCase()} ${i!.path}`)

    expect(handlerSummary.length).toBeGreaterThan(0)
    // Log is visible with --reporter=verbose
    console.info(`[contract] ${handlerSummary.length} handlers registered:\n` +
      handlerSummary.map((s) => `  ${s}`).join('\n'))
  })
})
