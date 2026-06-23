const isPg = !!process.env.DATABASE_URL;
require('dotenv').config();

let db;

if (isPg) {
  // ── PRODUCCIÓN: Supabase (PostgreSQL) ─────────────────────────────────────
  const { Pool } = require('pg');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
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
