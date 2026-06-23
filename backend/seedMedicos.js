/**
 * seedMedicos.js
 * Inserta los 20 médicos nuevos (sin tocar los existentes ni hacer DROP TABLE).
 * Contraseña de todos: password123
 * Hash bcrypt pre-generado para 'password123':
 *   $2b$10$SvfFjnw5v4JR.dZv9b3m5OH/EBeS6GnAUTYQOi1hGHqIq64XNWHvC
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// ─── Datos de los médicos ───────────────────────────────────────────────────
const medicos = [
  { colegiatura: 'CMP045317', nombre: 'SALAZAR SALAZAR, DARWIN VALENTIN', especialidad: 'Oftalmología General', telefono: '', correo: 'darwinsalazar@gmail.com', dni: '021049', fecha_recertificacion: '2030-10-11' },
  { colegiatura: 'CMP012292', nombre: 'MAGUIÑA VARGAS, CIRO PEREGRINO', especialidad: 'Oftalmología General', telefono: '', correo: 'ciromaguiña@gmail.com', dni: '011298', fecha_recertificacion: '2026-08-01' },
  { colegiatura: 'CMP012028', nombre: 'PELAEZ ZEVALLOS, HERMES', especialidad: 'Oftalmología General', telefono: '', correo: 'hermespelazes@gmail.com', dni: '004702', fecha_recertificacion: '2029-02-03' },
  { colegiatura: 'CMP008885', nombre: 'GOTUZZO HERENCIA, JOSE EDUARDO', especialidad: 'Oftalmología General', telefono: '', correo: 'josegotuzzo@gmail.com', dni: '006502', fecha_recertificacion: '2028-07-11' },
  { colegiatura: 'CMP031086', nombre: 'JIMENEZ MUÑIZ, RICARDO REDAME', especialidad: 'Oftalmología General', telefono: '', correo: 'ricardojimenez@gmail.com', dni: 'A06782', fecha_recertificacion: '2028-05-03' },
  { colegiatura: 'CMP016013', nombre: 'CHAVEZ FRIAS, WILLIAM WILFREDO', especialidad: 'Retinología', telefono: '', correo: 'williamchavez@gmail.com', dni: '007637', fecha_recertificacion: '2029-01-12' },
  { colegiatura: 'CMP025150', nombre: 'VERA LUNA, RUTH YUBANA', especialidad: 'Retinología', telefono: '', correo: 'ruthvera@gmail.com', dni: '019180', fecha_recertificacion: '2027-09-04' },
  { colegiatura: 'CMP023593', nombre: 'CORNEJO VALDEZ, MANUEL AUGUSTO', especialidad: 'Retinología', telefono: '', correo: 'manuelcornejo@gmail.com', dni: '010228', fecha_recertificacion: '2028-04-20' },
  { colegiatura: 'CMP014902', nombre: 'GARCES GHILARDI, RAQUEL JOSEFA', especialidad: 'Glaucoma', telefono: '', correo: 'raquelgarces@gmail.com', dni: '005804', fecha_recertificacion: '2030-07-07' },
  { colegiatura: 'CMP027734', nombre: 'NEGRON MUÑOZ, JOSE CARLOS', especialidad: 'Glaucoma', telefono: '', correo: 'josenegron@gmail.com', dni: '031817', fecha_recertificacion: '2027-12-04' },
  { colegiatura: 'CMP056418', nombre: 'QUISPE CAMARGO, PEDRO GENARO', especialidad: 'Glaucoma', telefono: '', correo: 'pedroquispe@gmail.com', dni: '043474', fecha_recertificacion: '2026-12-22' },
  { colegiatura: 'CMP076458', nombre: 'AMOROS CASTAÑEDA, ROSA MARIA', especialidad: 'Cirugía Refractiva', telefono: '', correo: 'rosaamoros@gmail.com', dni: '035411', fecha_recertificacion: '2029-12-02' },
  { colegiatura: 'CMP054792', nombre: 'HUAYNATE CALLUPE, JOSE ENRIQUE', especialidad: 'Cirugía Refractiva', telefono: '', correo: 'josehuaynate@gmail.com', dni: '046090', fecha_recertificacion: '2028-02-21' },
  { colegiatura: 'CMP054793', nombre: 'JUAREZ CHOQQUE, DALIA ISABEL', especialidad: 'Cirugía Refractiva', telefono: '', correo: 'daliajuarez@gmail.com', dni: '053812', fecha_recertificacion: '2031-02-24' },
  { colegiatura: 'CMP054795', nombre: 'LONDOÑO MORENO, JORGE OMAR', especialidad: 'Contactología', telefono: '', correo: 'jorgelondoño@gmail.com', dni: '025815', fecha_recertificacion: '2028-11-11' },
  { colegiatura: 'CMP058808', nombre: 'ROJAS TORRES, ELVIS MICHAEL', especialidad: 'Contactología', telefono: '', correo: 'elvisrojas@gmail.com', dni: '035717', fecha_recertificacion: '2029-08-29' },
  { colegiatura: 'CMP058816', nombre: 'RIVERA VEGA DE LOPEZ, NATHALY ANGELICA MARIA', especialidad: 'Contactología', telefono: '', correo: 'angelicalopezvega@gmail.com', dni: '046820', fecha_recertificacion: '2028-07-03' },
  { colegiatura: 'CMP058814', nombre: 'SALAZAR ABAD, JULIANA KATHERINE', especialidad: 'Contactología', telefono: '', correo: 'julianasalazar@gmail.com', dni: '029755', fecha_recertificacion: '2027-02-20' },
  { colegiatura: 'CMP058818', nombre: 'PEREDA JOH, CARLOS MANUEL', especialidad: 'Oftalmología Pediátrica', telefono: '', correo: 'carlospereda@gmail.com', dni: '028860', fecha_recertificacion: '2027-04-18' },
  { colegiatura: 'CMP058820', nombre: 'NUÑEZ MORENO, LOURDES MERCEDES', especialidad: 'Oftalmología Pediátrica', telefono: '', correo: 'lourdesnuñez@gmail.com', dni: '043018', fecha_recertificacion: '2026-11-14' }
];

// ─── Script principal ───────────────────────────────────────────────────────
async function run() {
  const connection = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'vitalsalud',
  });

  console.log('[SeedMedicos] Conectado a MySQL.');

  // Generar hash una sola vez para todos
  const passwordHash = await bcrypt.hash('passwrd123', 10);

  let insertados = 0;
  let omitidos   = 0;

  for (const m of medicos) {
    try {
      // 1. Insertar en medicos (IGNORE si ya existe por colegiatura/correo/dni)
      const [resM] = await connection.execute(
        `INSERT IGNORE INTO medicos (colegiatura, nombre, especialidad, telefono, correo, dni, estado, fecha_recertificacion)
         VALUES (?, ?, ?, ?, ?, ?, 'activo', ?)`,
        [m.colegiatura, m.nombre, m.especialidad, m.telefono, m.correo, m.dni, m.fecha_recertificacion]
      );

      if (resM.affectedRows === 0) {
        console.log(`  [OMITIDO] Médico ya existe: ${m.nombre}`);
        omitidos++;
        continue;
      }

      const medicoId = resM.insertId;

      // 2. Insertar cuenta en usuarios
      await connection.execute(
        `INSERT IGNORE INTO usuarios (correo, password_hash, rol, id_medico, verificado)
         VALUES (?, ?, 'Medico', ?, 1)`,
        [m.correo, passwordHash, medicoId]
      );

      console.log(`  [OK] ${m.nombre} → ${m.correo} (id_medico=${medicoId})`);
      insertados++;
    } catch (err) {
      console.error(`  [ERROR] ${m.nombre}: ${err.message}`);
    }
  }

  await connection.end();
  console.log(`\n[SeedMedicos] Completado: ${insertados} insertados, ${omitidos} omitidos.`);
}

run().catch(err => {
  console.error('[SeedMedicos] Error fatal:', err);
  process.exit(1);
});
