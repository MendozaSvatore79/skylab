import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err: Error) => {
  console.error('Error en el pool de conexión:', err);
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Consulta ejecutada', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error en query:', error);
    throw error;
  }
}

export async function getClient() {
  const client = await pool.connect();
  return client;
}

export default pool;

/**
 * Ensure the given columns exist on a table; if they are missing, add them.
 * columnsSpec should be an object mapping column name -> SQL type string,
 * e.g. { avatar_url: "varchar(255)", address: "text" }
 */
export async function ensureColumns(tableName: string, columnsSpec: Record<string, string>) {
  // Build list of candidate column names
  const names = Object.keys(columnsSpec);
  if (names.length === 0) return;

  const res = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = ANY($2)`,
    [tableName, names]
  );
  const existing = new Set(res.rows.map((r: any) => r.column_name));

  const toAdd = names.filter(n => !existing.has(n));
  if (toAdd.length === 0) return;

  for (const col of toAdd) {
    const type = columnsSpec[col] || 'text';
    // Use IF NOT EXISTS to be safe even if concurrent
    const sql = `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${col} ${type}`;
    try {
      await pool.query(sql);
      console.log(`Added column ${col} to ${tableName}`);
    } catch (err) {
      console.error(`Failed to add column ${col} to ${tableName}:`, err);
      // don't rethrow; best-effort
    }
  }
}
