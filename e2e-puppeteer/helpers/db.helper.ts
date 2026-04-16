import { Client, type QueryResult } from 'pg';

// ── Connection config ─────────────────────────────────────────────────────────
// Same DSN used by the Python backend; overridable via TEST_DATABASE_URL env var
const DEFAULT_DSN =
  process.env.TEST_DATABASE_URL ??
  'postgresql://graphclaw:graphclaw_dev@localhost:5432/graphclaw';

// Graph name matches GRAPH_NAME in graphclaw/src/graphclaw/db/age/utils.py
const GRAPH_NAME = 'graphclaw';

// ── agtype parser ─────────────────────────────────────────────────────────────
/**
 * AGE returns all Cypher columns as the custom 'agtype' PostgreSQL type.
 * The pg driver returns them as strings. This function normalises them to
 * plain JS values, mirroring _parse_agtype() in age/utils.py.
 */
function parseAgtype(raw: unknown): unknown {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (s === 'null') return null;

  // Strip AGE type suffixes: ::vertex, ::edge, ::path, ::agtype
  const stripped = s
    .replace(/::vertex$/, '')
    .replace(/::edge$/, '')
    .replace(/::path$/, '')
    .replace(/::agtype$/, '')
    .trim();

  try {
    return JSON.parse(stripped);
  } catch {
    // If it's a bare unquoted string (shouldn't normally happen), return as-is
    return stripped;
  }
}

// ── DbClient ──────────────────────────────────────────────────────────────────
/**
 * Direct PostgreSQL client with Apache AGE session setup.
 * Replicates _setup_age() from graphclaw/src/graphclaw/db/age/connection.py
 * so that Cypher queries work from the Node.js test layer.
 *
 * Usage:
 *   const db = new DbClient();
 *   await db.connect();
 *   const count = await db.countNodes('Task');
 *   await db.disconnect();
 */
export class DbClient {
  private readonly client: Client;

  constructor(dsn: string = DEFAULT_DSN) {
    this.client = new Client({ connectionString: dsn });
  }

  /** Open connection and initialise the AGE session. */
  async connect(): Promise<void> {
    await this.client.connect();
    // These two statements mirror _setup_age() in age/connection.py exactly
    await this.client.query("LOAD 'age'");
    await this.client.query(
      "SET search_path = ag_catalog, \"$user\", public",
    );
  }

  /** Close the connection cleanly. */
  async disconnect(): Promise<void> {
    await this.client.end();
  }

  // ── AGE Cypher helpers ──────────────────────────────────────────────────────

  /**
   * Run a Cypher query against the AGE graph.
   * Returns raw query result — use the typed helpers below where possible.
   *
   * @param cypher  Cypher query body (without the outer cypher() wrapper)
   * @param columns Array of column alias + type strings for the AS clause,
   *                e.g. ['result agtype'] or ['props agtype', 'cnt agtype']
   */
  async runCypher(
    cypher: string,
    columns: string[] = ['result agtype'],
  ): Promise<QueryResult> {
    const asCols = columns.join(', ');
    const sql = `SELECT * FROM cypher('${GRAPH_NAME}', $$ ${cypher} $$) AS (${asCols})`;
    return this.client.query(sql);
  }

  /**
   * Retrieve a single AGE vertex by its 'id' property.
   * Returns the properties object or null if not found.
   */
  async getNodeById(id: string): Promise<Record<string, unknown> | null> {
    const escapedId = id.replace(/'/g, "\\'");
    const result = await this.runCypher(
      `MATCH (n {id: '${escapedId}'}) RETURN properties(n)`,
      ['props agtype'],
    );
    if (result.rows.length === 0) return null;
    const parsed = parseAgtype(result.rows[0].props);
    return parsed as Record<string, unknown>;
  }

  /**
   * Count AGE vertices of a given label (e.g. 'Task', 'Goal', 'Agent').
   */
  async countNodes(label: string): Promise<number> {
    const result = await this.runCypher(
      `MATCH (n:${label}) RETURN count(n)`,
      ['cnt agtype'],
    );
    return Number(parseAgtype(result.rows[0]?.cnt) ?? 0);
  }

  /**
   * Retrieve a single named property of a vertex.
   */
  async getNodeProperty(id: string, property: string): Promise<unknown> {
    const node = await this.getNodeById(id);
    return node ? node[property] : null;
  }

  /**
   * Check whether a directed edge of the given type exists between two node IDs.
   */
  async edgeExists(
    sourceId: string,
    targetId: string,
    edgeType: string,
  ): Promise<boolean> {
    const src = sourceId.replace(/'/g, "\\'");
    const tgt = targetId.replace(/'/g, "\\'");
    const result = await this.runCypher(
      `MATCH (a {id: '${src}'})-[r:${edgeType}]->(b {id: '${tgt}'}) RETURN count(r)`,
      ['cnt agtype'],
    );
    return Number(parseAgtype(result.rows[0]?.cnt) ?? 0) > 0;
  }

  /**
   * Return true when the node is absent from the graph — useful for
   * verifying that a DELETE call propagated all the way to AGE.
   */
  async nodeAbsent(id: string): Promise<boolean> {
    return (await this.getNodeById(id)) === null;
  }

  // ── Plain SQL helpers ───────────────────────────────────────────────────────

  /**
   * Execute arbitrary SQL against the relational schema.
   * Used for verifying feature flags, members, scoring weights, etc.
   * that live in relational tables rather than the AGE graph.
   */
  async querySQL<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    const result = await this.client.query(sql, params);
    return result.rows as T[];
  }
}
