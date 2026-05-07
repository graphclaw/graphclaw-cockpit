---
name: cockpit-contract-tests
description: Contract test patterns for GraphClaw Cockpit — validating that MSW handlers in src/test/handlers.ts conform to the backend OpenAPI spec. Use when writing or reviewing src/test/contract/handlers.contract.test.ts.
---

# Cockpit Contract Test Patterns

## When to use
Writing or reviewing `src/test/contract/handlers.contract.test.ts`. This test layer catches drift between the frontend MSW handlers and the backend API.

---

## File header

```typescript
/**
 * GC-K-API-W<NN>-001 — MSW handler conformance to backend OpenAPI spec
 *
 * Scenario: Every MSW handler in src/test/handlers.ts must reference a real
 * path+method from the backend OpenAPI spec, and its response shape must
 * validate against the spec's response schema.
 *
 * PRD: docs/prd/16-react-implementation.md §16.6
 * Build wave: W<NN>
 * Layer: L3 Contract
 * Owner: frontend-team
 * Last reviewed: YYYY-MM-DD
 *
 * Cases covered:
 *  - Every handler path+method exists in the OpenAPI spec
 *  - Every handler response body validates against the spec response schema
 *
 * Notes:
 *  - Loads openapi.json from src/test/openapi.json (committed snapshot)
 *  - Refresh snapshot: npm run sync-openapi (fetches from http://localhost:8000/openapi.json)
 */
```

---

## Basic contract test pattern

```typescript
// src/test/contract/handlers.contract.test.ts
import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import openApiSpec from '../openapi.json'
import { handlers } from '../handlers'

const ajv = new Ajv({ strict: false })
addFormats(ajv)

describe('MSW handlers conform to OpenAPI spec', () => {
  it('every handler path exists in the spec', () => {
    for (const handler of handlers) {
      const { method, path } = extractHandlerInfo(handler)
      const specPath = openApiSpec.paths[path]
      expect(specPath, `${method} ${path} not found in OpenAPI spec`).toBeDefined()
      expect(specPath[method.toLowerCase()], `method ${method} not defined for ${path}`).toBeDefined()
    }
  })
})
```

---

## Keeping openapi.json in sync

Commit a snapshot at `src/test/openapi.json`. Add a script to refresh it:

```json
// package.json
"sync-openapi": "curl -s http://localhost:8000/openapi.json -o src/test/openapi.json"
```

Run `npm run sync-openapi` whenever the backend adds or changes endpoints, then commit the updated snapshot.

In CI, the contract test runs against the committed snapshot — no live backend required for this layer.

---

## When a contract test fails

A contract test failure means either:
1. The backend changed an endpoint (path, method, or response shape) — update the MSW handler in `src/test/handlers.ts` and refresh `openapi.json`.
2. A frontend developer added an MSW handler for a non-existent endpoint — fix or remove the handler.

---

## Inventory

Add to `src/test/inventory.md`:
```
| GC-K-API-W12-001 | MSW handler conformance to OpenAPI spec | [src/test/contract/handlers.contract.test.ts](../../../src/test/contract/handlers.contract.test.ts) |
```
