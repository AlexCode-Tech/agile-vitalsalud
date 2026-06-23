const db = require('../config/db');

class Paciente {
  static async findByDni(dni) {
    const [rows] = await db.execute('SELECT * FROM pacientes WHERE dni = ?', [dni]);
    return rows[0] || null;
  }

  static async findByCorreo(correo) {
    const [rows] = await db.execute('SELECT * FROM pacientes WHERE correo = ?', [correo]);
    return rows[0] || null;
  }

  static async create({ dni, nombre, correo, telefono, passwordHash }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Insertar en pacientes
      await connection.execute(
        'INSERT INTO pacientes (dni, nombre, correo, telefono) VALUES (?, ?, ?, ?)',
        [dni, nombre, correo, telefono]
      );

      // Insertar en usuarios para autenticación
      await connection.execute(
        'INSERT INTO usuarios (correo, password_hash, rol, dni) VALUES (?, ?, ?, ?)',
        [correo, passwordHash, 'Paciente', dni]
      );

      await connection.commit();
      return { dni, nombre, correo, telefono };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
  static async createPacienteOnly({ dni, nombre, correo, telefono }) {
    await db.execute(
      'INSERT INTO pacientes (dni, nombre, correo, telefono) VALUES (?, ?, ?, ?)',
      [dni, nombre, correo, telefono]
    );
    return { dni, nombre, correo, telefono };
  }
  static async update(dni, { correo, telefono }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Actualizar tabla pacientes
      await connection.execute(
        'UPDATE pacientes SET correo = ?, telefono = ? WHERE dni = ?',
        [correo, telefono, dni]
      );

      // Actualizar correo en tabla usuarios si se cambió
      await connection.execute(
        'UPDATE usuarios SET correo = ? WHERE dni = ?',
        [correo, dni]
      );

      await connection.commit();
      return true;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}

module.exports = Paciente;
