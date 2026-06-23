const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true // Permite ejecutar múltiples sentencias si es necesario
  });

  console.log('[InitDB] Conectado a MySQL.');

  const sqlFile = path.join(__dirname, 'initDB.sql');
  let sql = fs.readFileSync(sqlFile, 'utf8');
  const dbName = process.env.DB_NAME || 'vitalsalud';
  sql = sql.replace(/CREATE DATABASE IF NOT EXISTS vitalsalud;/g, `CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
  sql = sql.replace(/USE vitalsalud;/g, `USE \`${dbName}\`;`);

  // Ejecutamos todo el script initDB.sql
  try {
    await connection.query(sql);
    console.log('[InitDB] Esquema y semillas creados exitosamente.');
  } catch (error) {
    console.error('[InitDB] Error al ejecutar el script SQL:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

run().catch(error => {
  console.error('[InitDB] Error de conexión a MySQL:', error);
  process.exit(1);
});
