const pool = require('./config/db');

async function run() {
  console.log('[Migration] Conectando a la base de datos...');
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS horarios (
          id INT AUTO_INCREMENT PRIMARY KEY,
          id_medico INT NOT NULL,
          dias TEXT NOT NULL,
          horas VARCHAR(255) NOT NULL,
          duracion VARCHAR(50) NOT NULL,
          turnos_raw TEXT NOT NULL,
          duracion_min INT NOT NULL,
          creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (id_medico) REFERENCES medicos(id) ON DELETE CASCADE
      );
    `;
    await pool.query(createTableQuery);
    console.log('[Migration] Tabla "horarios" creada o ya existente exitosamente.');
  } catch (error) {
    console.error('[Migration] Error al crear la tabla "horarios":', error);
  } finally {
    await pool.end();
  }
}

run();
