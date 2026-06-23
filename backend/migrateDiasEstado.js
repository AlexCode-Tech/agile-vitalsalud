const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

(async () => {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  const [cols] = await db.execute("SHOW COLUMNS FROM horarios LIKE 'dias_estado'");
  if (cols.length === 0) {
    await db.execute('ALTER TABLE horarios ADD COLUMN dias_estado JSON DEFAULT NULL');
    console.log('OK: dias_estado column added');
  } else {
    console.log('OK: column already exists');
  }
  await db.end();
})().catch(e => { console.error(e.message); process.exit(1); });
