const db = require('../config/db');

class Medico {
  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM medicos WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async findByColegiatura(colegiatura) {
    const [rows] = await db.execute('SELECT * FROM medicos WHERE colegiatura = ?', [colegiatura]);
    return rows[0] || null;
  }

  static async create({ colegiatura, nombre, especialidad, telefono, correo, dni, fotoUrl, estado, fecha_recertificacion }) {
    const [result] = await db.execute(
      'INSERT INTO medicos (colegiatura, nombre, especialidad, telefono, correo, dni, foto_url, estado, fecha_recertificacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [colegiatura, nombre, especialidad, telefono, correo || null, dni || null, fotoUrl || null, estado || 'activo', fecha_recertificacion || null]
    );
    return { id: result.insertId, colegiatura, nombre, especialidad, telefono, correo, dni, fotoUrl, estado, fecha_recertificacion };
  }

  static async listAll() {
    const [rows] = await db.execute('SELECT * FROM medicos ORDER BY nombre ASC');
    return rows;
  }

  static async listActive() {
    const [rows] = await db.execute("SELECT * FROM medicos WHERE estado = 'activo' ORDER BY nombre ASC");
    return rows;
  }

  static async update(id, { nombre, especialidad, telefono, correo, dni, fotoUrl, estado, fecha_recertificacion }) {
    const [result] = await db.execute(
      'UPDATE medicos SET nombre = ?, especialidad = ?, telefono = ?, correo = ?, dni = ?, foto_url = COALESCE(?, foto_url), estado = ?, fecha_recertificacion = ? WHERE id = ?',
      [nombre, especialidad, telefono, correo || null, dni || null, fotoUrl || null, estado, fecha_recertificacion || null, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.execute('DELETE FROM medicos WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Medico;
