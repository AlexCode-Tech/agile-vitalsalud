const db = require('../config/db');

class Horario {
  static async listAll() {
    const [rows] = await db.execute(
      `SELECT h.id AS horario_id, h.id_medico, h.dias, h.horas, h.duracion, h.turnos_raw, h.duracion_min, h.dias_estado, h.creado_en, m.nombre as medico, m.colegiatura, m.estado as estado_medico 
       FROM horarios h 
       JOIN medicos m ON h.id_medico = m.id 
       ORDER BY h.id DESC`
    );
    return rows.map(row => ({
      id: row.horario_id,
      medicoId: row.id_medico,
      medico: row.medico,
      colegiatura: row.colegiatura,
      estadoMedico: row.estado_medico,
      diasEstado: typeof row.dias_estado === 'string' ? JSON.parse(row.dias_estado) : (row.dias_estado || {}),
      dias: typeof row.dias === 'string' ? JSON.parse(row.dias) : (row.dias || []),
      horas: row.horas,
      duracion: row.duracion,
      turnosRaw: typeof row.turnos_raw === 'string' ? JSON.parse(row.turnos_raw) : (row.turnos_raw || []),
      duracionMin: row.duracion_min,
      creado_en: row.creado_en
    }));
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM horarios WHERE id = ?', [id]);
    if (!rows[0]) return null;
    const row = rows[0];
    return {
      ...row,
      dias: typeof row.dias === 'string' ? JSON.parse(row.dias) : (row.dias || []),
      turnosRaw: typeof row.turnos_raw === 'string' ? JSON.parse(row.turnos_raw) : (row.turnos_raw || []),
      diasEstado: typeof row.dias_estado === 'string' ? JSON.parse(row.dias_estado) : (row.dias_estado || {}),
      medicoId: row.id_medico,
      duracionMin: row.duracion_min
    };
  }

  static async updateDiaEstado(id, diasEstado) {
    await db.execute(
      'UPDATE horarios SET dias_estado = ? WHERE id = ?',
      [JSON.stringify(diasEstado), id]
    );
  }

  static async create({ id_medico, dias, horas, duracion, turnos_raw, duracion_min }) {
    const [result] = await db.execute(
      'INSERT INTO horarios (id_medico, dias, horas, duracion, turnos_raw, duracion_min) VALUES (?, ?, ?, ?, ?, ?)',
      [
        id_medico,
        typeof dias === 'string' ? dias : JSON.stringify(dias),
        horas,
        duracion,
        typeof turnos_raw === 'string' ? turnos_raw : JSON.stringify(turnos_raw),
        duracion_min
      ]
    );
    return result.insertId;
  }

  static async delete(id) {
    const [result] = await db.execute('DELETE FROM horarios WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Horario;
