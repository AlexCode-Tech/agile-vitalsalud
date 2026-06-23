const db = require('../config/db');

/**
 * HU-10: Listar Pacientes Recepción TPS
 */
exports.listarPacientesDia = async (req, res) => {
  const { fecha } = req.query;
  
  // Por defecto, usa la fecha actual si no se proporciona
  const targetFecha = fecha || new Date().toISOString().split('T')[0];

  try {
    const query = `
      SELECT r.id, r.fecha, r.hora, r.estado, 
             p.nombre AS paciente_nombre, p.dni AS paciente_dni, p.telefono AS paciente_telefono,
             m.nombre AS medico_nombre, m.especialidad AS medico_especialidad
      FROM reservas r
      JOIN pacientes p ON r.dni_paciente = p.dni
      JOIN medicos m ON r.id_medico = m.id
      WHERE r.fecha = ?
      ORDER BY r.hora ASC
    `;
    
    const [rows] = await db.execute(query, [targetFecha]);
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al listar pacientes del día', error: error.message });
  }
};
