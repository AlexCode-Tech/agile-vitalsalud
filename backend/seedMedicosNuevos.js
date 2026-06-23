/**
 * seedMedicosNuevos.js
 * Inserta los 20 médicos con datos exactos del Excel (imagen actualizada).
 * Contraseña de todos: password123
 */

const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// ─── Datos extraídos del Excel (imagen actualizada) ───────────────────────────
const medicos = [
  { colegiatura: 'CMP045317', nombre: 'SALAZAR SALAZAR, DARWIN VALENTIN',             correo: 'darwinsalazar@vitalsalud.com',      especialidad: 'Consulta General',        telefono: '912345678', fecha_recertificacion: '2030-10-11' },
  { colegiatura: 'CMP012292', nombre: 'MAGUIÑA VARGAS, CIRO PEREGRINO',               correo: 'ciromaguina@vitalsalud.com',        especialidad: 'Consulta General',        telefono: '906677889', fecha_recertificacion: '2026-08-01' },
  { colegiatura: 'CMP012028', nombre: 'PELAEZ ZEVALLOS, HERMES',                      correo: 'zevallos@vitalsalud.com',           especialidad: 'Consulta General',        telefono: '923456789', fecha_recertificacion: '2029-02-03' },
  { colegiatura: 'CMP008885', nombre: 'GOTUZZO HERENCIA, JOSE EDUARDO',               correo: 'josegotuzzo@vitalsalud.com',        especialidad: 'Consulta General',        telefono: '988899001', fecha_recertificacion: '2028-07-11' },
  { colegiatura: 'CMP031086', nombre: 'JIMENEZ MUÑIZ, RICARDO REDAME',                correo: 'ricardojimenez@vitalsalud.com',     especialidad: 'Consulta General',        telefono: '934567890', fecha_recertificacion: '2028-05-03' },
  { colegiatura: 'CMP016013', nombre: 'CHAVEZ FRIAS, WILLIAM WILFREDO',               correo: 'williamchavez@vitalsalud.com',      especialidad: 'Retinología',             telefono: '900011223', fecha_recertificacion: '2029-01-12' },
  { colegiatura: 'CMP025150', nombre: 'VERA LUNA, RUTH YUBANA',                       correo: 'ruthvera@vitalsalud.com',           especialidad: 'Retinología',             telefono: '945678901', fecha_recertificacion: '2027-09-04' },
  { colegiatura: 'CMP023593', nombre: 'CORNEJO VALDEZ, MANUEL AUGUSTO',               correo: 'manuelcornejo@vitalsalud.com',      especialidad: 'Retinología',             telefono: '999900112', fecha_recertificacion: '2028-04-20' },
  { colegiatura: 'CMP014902', nombre: 'GARCES GHILARDI, RAQUEL JOSEFA',               correo: 'raquelgarces@vitalsalud.com',       especialidad: 'Glaucoma',                telefono: '956789012', fecha_recertificacion: '2030-07-07' },
  { colegiatura: 'CMP027734', nombre: 'NEGRON MUÑOZ, JOSE CARLOS',                    correo: 'josenegron@vitalsalud.com',         especialidad: 'Glaucoma',                telefono: '977788990', fecha_recertificacion: '2027-12-04' },
  { colegiatura: 'CMP056418', nombre: 'QUISPE CAMARGO, PEDRO GENARO',                 correo: 'pedroquispe@vitalsalud.com',        especialidad: 'Glaucoma',                telefono: '967890123', fecha_recertificacion: '2026-12-22' },
  { colegiatura: 'CMP076458', nombre: 'AMOROS CASTAÑEDA, ROSA MARIA',                 correo: 'rosaamoros@vitalsalud.com',         especialidad: 'Cirugía Refractiva',      telefono: '955566778', fecha_recertificacion: '2026-12-02' },
  { colegiatura: 'CMP054792', nombre: 'HUAYNATE CALLUPE, JOSE ENRIQUE',               correo: 'josehuaynate@vitalsalud.com',      especialidad: 'Cirugía Refractiva',      telefono: '978901234', fecha_recertificacion: '2028-02-21' },
  { colegiatura: 'CMP054793', nombre: 'JUAREZ CHOQUE, DALIA ISABEL',                  correo: 'daliajuarez@vitalsalud.com',       especialidad: 'Cirugía Refractiva',      telefono: '944455667', fecha_recertificacion: '2031-02-24' },
  { colegiatura: 'CMP054795', nombre: 'LONDOÑO MORENO, JORGE OMAR',                   correo: 'jorgelondono@vitalsalud.com',      especialidad: 'Contactología',           telefono: '989012345', fecha_recertificacion: '2028-11-11' },
  { colegiatura: 'CMP058808', nombre: 'ROJAS TORRES, ELVIS MICHAEL',                  correo: 'elvisrojas@vitalsalud.com',        especialidad: 'Contactología',           telefono: '933344556', fecha_recertificacion: '2029-08-29' },
  { colegiatura: 'CMP058816', nombre: 'RIVERA VEGA DE LOPEZ, NATHALY ANGELICA MARIA', correo: 'angelicalopezvega@vitalsalud.com', especialidad: 'Contactología',           telefono: '990123456', fecha_recertificacion: '2028-07-03' },
  { colegiatura: 'CMP058814', nombre: 'SALAZAR ABAD, JULIANA KATHERINE',               correo: 'julianasalazar@vitalsalud.com',    especialidad: 'Contactología',           telefono: '922233445', fecha_recertificacion: '2027-02-20' },
  { colegiatura: 'CMP058818', nombre: 'PEREDA JOH, CARLOS MANUEL',                    correo: 'carlospereda@vitalsalud.com',      especialidad: 'Oftalmología Pediátrica', telefono: '901234567', fecha_recertificacion: '2027-04-18' },
  { colegiatura: 'CMP058820', nombre: 'NUÑEZ MORENO, LOURDES MERCEDES',               correo: 'lourdesnunez@vitalsalud.com',      especialidad: 'Oftalmología Pediátrica', telefono: '911122334', fecha_recertificacion: '2026-11-14' },
];

async function run() {
  const connection = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'vitalsalud_db',
  });

  console.log('🔌 Conectado a MySQL.\n');

  // 1. Asegurar que la especialidad "Consulta General" exista
  const [espRows] = await connection.execute(
    "SELECT id FROM especialidades WHERE nombre = 'Consulta General'"
  );
  if (espRows.length === 0) {
    await connection.execute(
      "INSERT INTO especialidades (nombre, descripcion, duracion, tiempo_espera_posterior) VALUES ('Consulta General', 'Revisión clínica general y diagnóstico inicial', 30, NULL)"
    );
    console.log('✅ Especialidad "Consulta General" agregada.\n');
  } else {
    console.log('ℹ️  Especialidad "Consulta General" ya existe.\n');
  }

  // 2. Hash de contraseña (una sola vez para todos)
  const passwordHash = await bcrypt.hash('password123', 10);

  let insertados = 0;
  let omitidos   = 0;
  let errores    = 0;

  for (const m of medicos) {
    try {
      const [resM] = await connection.execute(
        `INSERT IGNORE INTO medicos (colegiatura, nombre, especialidad, telefono, correo, estado, fecha_recertificacion)
         VALUES (?, ?, ?, ?, ?, 'activo', ?)`,
        [m.colegiatura, m.nombre, m.especialidad, m.telefono, m.correo, m.fecha_recertificacion]
      );

      if (resM.affectedRows === 0) {
        console.log(`⚠️  [OMITIDO] Ya existe: ${m.nombre}`);
        omitidos++;
        continue;
      }

      const medicoId = resM.insertId;

      await connection.execute(
        `INSERT IGNORE INTO usuarios (correo, password_hash, rol, id_medico, verificado)
         VALUES (?, ?, 'Medico', ?, 1)`,
        [m.correo, passwordHash, medicoId]
      );

      console.log(`✅ ${m.nombre} | ${m.correo} | ${m.especialidad}`);
      insertados++;
    } catch (err) {
      console.error(`❌ ERROR con ${m.nombre}: ${err.message}`);
      errores++;
    }
  }

  await connection.end();
  console.log(`\n🎉 Completado: ${insertados} insertados, ${omitidos} omitidos, ${errores} errores.`);
}

run().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
