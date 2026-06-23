require('dotenv').config();
// La integración Supabase de Vercel administra POSTGRES_URL y debe tener
// prioridad sobre cualquier DATABASE_URL heredada de despliegues anteriores.
const rawPostgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
let postgresUrl = rawPostgresUrl;

if (rawPostgresUrl) {
  const parsedUrl = new URL(rawPostgresUrl);
  // pg interpreta estos parámetros y reemplaza el objeto ssl definido abajo.
  // Supabase usa una cadena administrada; mantenemos TLS pero permitimos su CA.
  ['sslmode', 'sslcert', 'sslkey', 'sslrootcert'].forEach((key) => {
    parsedUrl.searchParams.delete(key);
  });
  postgresUrl = parsedUrl.toString();
}
const isPg = !!postgresUrl;

let db;

if (isPg) {
  // ── PRODUCCIÓN: Supabase (PostgreSQL) ─────────────────────────────────────
  const { Pool } = require('pg');

  const pool = new Pool({
    connectionString: postgresUrl,
    ssl: { rejectUnauthorized: false },
    max: 10,
  });

  /**
   * Convierte placeholders MySQL (?) a PostgreSQL ($1, $2, ...)
   */
  function toPostgresQuery(query) {
    let idx = 1;
    return query.replace(/\?/g, () => `$${idx++}`);
  }

  /**
   * Interfaz compatible con mysql2: devuelve [rows, fields]
   */
  async function execute(query, params = []) {
    const pgQuery = toPostgresQuery(query);
    const result = await pool.query(pgQuery, params);
    return [result.rows, result.fields || []];
  }

  db = { execute, query: execute, pool };

} else {
  // ── LOCAL: MySQL ───────────────────────────────────────────────────────────
  const mysql = require('mysql2/promise');

  const pool = mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'vitalsalud_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  db = pool;
}

module.exports = db;
