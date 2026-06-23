const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function updateTelefonos() {
  const pool = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vitalsalud_db',
  });

  // Datos extraídos de la imagen: [nombre_parcial, telefono]
  const telefonos = [
    { nombre: 'SALAZAR SALAZAR, DARWIN VALENTIN',       telefono: '912345678' },
    { nombre: 'MAGUIÑA VARGAS, CIRO PEREGRINO',         telefono: '923456789' },
    { nombre: 'PELAEZ ZEVALLOS, HERMES',                telefono: '934567890' },
    { nombre: 'GOTUZZO HERENCIA, JOSE EDUARDO',         telefono: '945678901' },
    { nombre: 'JIMENEZ MUÑIZ, RICARDO REDAME',          telefono: '900011223' },
    { nombre: 'CHAVEZ FRIAS, WILLIAM WILFREDO',         telefono: '911122334' },
    { nombre: 'VERA LUNA, RUTH YUBANA',                 telefono: '922233445' },
    { nombre: 'CORNEJO VALDEZ, MANUEL AUGUSTO',         telefono: '999900112' },
    { nombre: 'GARCES GHILARDI, RAQUEL JOSEFA',         telefono: '956789012' },
    { nombre: 'NEGRON MUÑOZ, JOSE CARLOS',              telefono: '988899001' },
    { nombre: 'QUISPE CAMARGO, PEDRO GENARO',           telefono: '967890123' },
    { nombre: 'AMOROS CASTAÑEDA, ROSA MARIA',           telefono: '977788990' },
    { nombre: 'HUAYNATE CALLUPE, JOSE ENRIQUE',         telefono: '978901234' },
    { nombre: 'JUAREZ CHOQUE, DALIA ISABEL',            telefono: '966677889' },
    { nombre: 'LONDOÑO MORENO, JORGE OMAR',             telefono: '989012345' },
    { nombre: 'ROJAS TORRES, ELVIS MICHAEL',            telefono: '955566778' },
    { nombre: 'RIVERA VEGA DE LOPEZ, NATHALY',          telefono: '990123456' },
    { nombre: 'SALAZAR ABAD, JULIANA KATHERINE',        telefono: '944455667' },
    { nombre: 'PEREDA JOH, CARLOS MANUEL',              telefono: '901234556' },
    { nombre: 'NUÑEZ MORENO, LOURDES MERCEDES',         telefono: '933344556' },
  ];

  console.log('🔄 Actualizando teléfonos de médicos...\n');

  for (const medico of telefonos) {
    // Buscar por nombre usando LIKE para mayor flexibilidad
    const keyword = medico.nombre.split(',')[0].trim(); // usa apellido principal
    const [rows] = await pool.execute(
      'SELECT id, nombre FROM medicos WHERE nombre LIKE ?',
      [`%${keyword}%`]
    );

    if (rows.length === 0) {
      console.log(`❌ No encontrado: ${medico.nombre}`);
      continue;
    }

    // Si hay múltiples, tomar el más parecido (primero)
    const found = rows[0];
    await pool.execute(
      'UPDATE medicos SET telefono = ? WHERE id = ?',
      [medico.telefono, found.id]
    );
    console.log(`✅ ID ${found.id} | ${found.nombre} → ${medico.telefono}`);
  }

  console.log('\n🎉 Actualización completada.');
  await pool.end();
}

updateTelefonos().catch(console.error);
