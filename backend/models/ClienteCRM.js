const db = require('../config/db');

class ClienteCRM {
  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM clientes_crm WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async findByDniORuc(dniORuc) {
    const [rows] = await db.execute('SELECT * FROM clientes_crm WHERE dni_o_ruc = ?', [dniORuc]);
    return rows[0] || null;
  }

  static async create({ tipo, dniORuc, nombre, estado, dniTps }) {
    const [result] = await db.execute(
      'INSERT INTO clientes_crm (tipo, dni_o_ruc, nombre, estado, dni_tps) VALUES (?, ?, ?, ?, ?)',
      [tipo, dniORuc, nombre, estado, dniTps || null]
    );
    return { id: result.insertId, tipo, dniORuc, nombre, estado, dniTps };
  }

  static async listAll() {
    const [rows] = await db.execute('SELECT * FROM clientes_crm ORDER BY ultimo_contacto DESC');
    return rows;
  }
}

module.exports = ClienteCRM;
