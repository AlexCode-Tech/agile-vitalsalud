/**
 * seedNewHorarios.js
 * Limpia los horarios antiguos e inserta exactamente los 16 horarios de médicos del Excel.
 * Todos con duración de cita de 30 minutos.
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const newHorariosData = [
  {
    nombreFrag: 'JIMENEZ MUÑIZ',
    dias: ['Lunes', 'Martes', 'Jueves', 'Viernes'],
    turnos: [{ horaInicio: '14:00', horaFin: '20:00' }]
  },
  {
    nombreFrag: 'CHAVEZ FRIAS',
    dias: ['Lunes', 'Miércoles'],
    turnos: [
      { horaInicio: '08:00', horaFin: '12:00' },
      { horaInicio: '15:00', horaFin: '19:00' }
    ]
  },
  {
    nombreFrag: 'VERA LUNA',
    dias: ['Martes', 'Jueves'],
    turnos: [
      { horaInicio: '09:00', horaFin: '12:00' },
      { horaInicio: '14:00', horaFin: '17:00' },
      { horaInicio: '18:00', horaFin: '20:00' }
    ]
  },
  {
    nombreFrag: 'CORNEJO VALDEZ',
    dias: ['Viernes', 'Sábado'],
    turnos: [
      { horaInicio: '08:00', horaFin: '13:00' },
      { horaInicio: '15:00', horaFin: '19:00' }
    ]
  },
  {
    nombreFrag: 'GARCES GHILARDI',
    dias: ['Lunes', 'Miércoles', 'Viernes'],
    turnos: [
      { horaInicio: '08:00', horaFin: '11:00' },
      { horaInicio: '15:00', horaFin: '18:45' }
    ]
  },
  {
    nombreFrag: 'NEGRON MUÑOZ',
    dias: ['Martes', 'Jueves'],
    turnos: [
      { horaInicio: '09:00', horaFin: '11:15' },
      { horaInicio: '13:30', horaFin: '16:30' },
      { horaInicio: '18:00', horaFin: '19:30' }
    ]
  },
  {
    nombreFrag: 'QUISPE CAMARGO',
    dias: ['Lunes', 'Martes', 'Sábado'],
    turnos: [{ horaInicio: '08:00', horaFin: '14:00' }]
  },
  {
    nombreFrag: 'AMOROS CASTAÑEDA',
    dias: ['Lunes', 'Martes', 'Miércoles'],
    turnos: [
      { horaInicio: '08:30', horaFin: '13:00' },
      { horaInicio: '15:00', horaFin: '18:00' }
    ]
  },
  {
    nombreFrag: 'HUAYNATE CALLUPE',
    dias: ['Jueves', 'Viernes', 'Sábado'],
    turnos: [
      { horaInicio: '08:00', horaFin: '10:15' },
      { horaInicio: '12:00', horaFin: '15:00' },
      { horaInicio: '16:30', horaFin: '18:45' }
    ]
  },
  {
    nombreFrag: 'JUAREZ CHOQUE',
    dias: ['Lunes', 'Miércoles', 'Viernes'],
    turnos: [{ horaInicio: '14:00', horaFin: '20:00' }]
  },
  {
    nombreFrag: 'LONDOÑO MORENO',
    dias: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    turnos: [
      { horaInicio: '09:00', horaFin: '13:00' },
      { horaInicio: '15:00', horaFin: '19:00' }
    ]
  },
  {
    nombreFrag: 'ROJAS TORRES',
    dias: ['Martes', 'Jueves', 'Sábado'],
    turnos: [
      { horaInicio: '08:00', horaFin: '13:00' },
      { horaInicio: '14:00', horaFin: '18:00' }
    ]
  },
  {
    nombreFrag: 'RIVERA VEGA DE LOPEZ',
    dias: ['Lunes', 'Miércoles', 'Viernes'],
    turnos: [
      { horaInicio: '08:00', horaFin: '11:00' },
      { horaInicio: '13:00', horaFin: '16:00' },
      { horaInicio: '17:30', horaFin: '20:30' }
    ]
  },
  {
    nombreFrag: 'SALAZAR ABAD',
    dias: ['Martes', 'Viernes'],
    turnos: [
      { horaInicio: '09:00', horaFin: '13:00' },
      { horaInicio: '15:00', horaFin: '20:00' }
    ]
  },
  {
    nombreFrag: 'PEREDA JOH',
    dias: ['Lunes', 'Miércoles', 'Viernes'],
    turnos: [
      { horaInicio: '08:00', horaFin: '12:00' },
      { horaInicio: '15:00', horaFin: '19:00' }
    ]
  },
  {
    nombreFrag: 'NUÑEZ MORENO',
    dias: ['Martes', 'Jueves', 'Sábado'],
    turnos: [
      { horaInicio: '08:30', horaFin: '11:30' },
      { horaInicio: '13:00', horaFin: '16:00' },
      { horaInicio: '17:30', horaFin: '20:30' }
    ]
  }
];

async function run() {
  const connection = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'vitalsalud_db',
  });

  console.log('🔌 Conectado a MySQL.');

  // 1. Limpiar todos los horarios antiguos
  await connection.execute('DELETE FROM horarios');
  console.log('🗑️  Horarios anteriores eliminados.');

  // 2. Cargar médicos activos
  const [medicos] = await connection.execute('SELECT id, nombre FROM medicos WHERE estado = "activo"');

  let insertados = 0;
  let noEncontrados = 0;

  for (const h of newHorariosData) {
    const medico = medicos.find(m =>
      m.nombre.toUpperCase().includes(h.nombreFrag.toUpperCase())
    );

    if (!medico) {
      console.log(`❌ Médico no encontrado o inactivo para: ${h.nombreFrag}`);
      noEncontrados++;
      continue;
    }

    const horasResumen = h.turnos.map(t => `${t.horaInicio} - ${t.horaFin}`).join(' | ');

    await connection.execute(
      `INSERT INTO horarios (id_medico, dias, horas, duracion, turnos_raw, duracion_min)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        medico.id,
        JSON.stringify(h.dias),
        horasResumen,
        '30 min',
        JSON.stringify(h.turnos),
        30
      ]
    );

    console.log(`✅ Horario asignado a ${medico.nombre}`);
    insertados++;
  }

  await connection.end();
  console.log(`\n🎉 Población finalizada: ${insertados} insertados, ${noEncontrados} no encontrados.`);
}

run().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
