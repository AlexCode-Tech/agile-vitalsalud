const db = require('../config/db');

class Reserva {
  static async create({ dniPaciente, idMedico, fecha, hora, expiraEn }) {
    const [result] = await db.execute(
      'INSERT INTO reservas (dni_paciente, id_medico, fecha, hora, estado, expira_en) VALUES (?, ?, ?, ?, ?, ?)',
      [dniPaciente, idMedico, fecha, hora, 'pre_reserva', expiraEn]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.execute(`
      SELECT
        r.*,
        m.nombre AS medico_nombre,
        m.especialidad AS medico_especialidad,
        m.estado AS medico_estado,
        p.nombre AS paciente_nombre,
        p.correo AS paciente_correo,
        p.telefono AS paciente_telefono
      FROM reservas r
      JOIN medicos m ON r.id_medico = m.id
      JOIN pacientes p ON r.dni_paciente = p.dni
      WHERE r.id = ?
    `, [id]);
    return rows[0] || null;
  }

  static async findByDni(dni) {
    const [rows] = await db.execute(`
      SELECT r.id, r.fecha, r.hora, r.estado, m.nombre AS medico_nombre, m.especialidad AS medico_especialidad
      FROM reservas r
      JOIN medicos m ON r.id_medico = m.id
      WHERE r.dni_paciente = ?
      ORDER BY r.fecha DESC, r.hora DESC
    `, [dni]);
    return rows;
  }

  static async updateEstado(id, nuevoEstado) {
    await db.execute('UPDATE reservas SET estado = ? WHERE id = ?', [nuevoEstado, id]);
  }

  static async tieneEspecialidadEnUltimos15Dias(dniPaciente, especialidad, fechaPropuesta) {
    const query = `
      SELECT r.id, r.fecha FROM reservas r
      JOIN medicos m ON r.id_medico = m.id
      WHERE r.dni_paciente = ?
        AND m.especialidad = ?
        AND (r.estado = 'confirmada' OR (r.estado = 'pre_reserva' AND r.expira_en > NOW()))
        AND ABS(DATEDIFF(r.fecha, ?)) <= 15
    `;
    const [rows] = await db.execute(query, [dniPaciente, especialidad, fechaPropuesta]);
    return rows.length > 0;
  }

  static async confirmarPago(id, metodo, monto) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Lock and fetch reservation details
      const [resRows] = await connection.execute(
        'SELECT * FROM reservas WHERE id = ? FOR UPDATE',
        [id]
      );
      const reserva = resRows[0];

      if (!reserva) {
        throw new Error('Reserva no encontrada');
      }

      if (reserva.estado !== 'pre_reserva') {
        throw new Error('La reserva ya no se encuentra en estado de pre-reserva');
      }

      // Check expiration
      if (new Date(reserva.expira_en) <= new Date()) {
        // Expirado
        await connection.execute('UPDATE reservas SET estado = "cancelada" WHERE id = ?', [id]);
        await connection.commit();
        throw new Error('reserva expiró, horario liberado');
      }

      // 1. Insert Payment
      await connection.execute(
        'INSERT INTO pagos (id_reserva, metodo, estado, monto) VALUES (?, ?, ?, ?)',
        [id, metodo, 'exitoso', monto]
      );

      // 2. Update Reservation State
      await connection.execute(
        'UPDATE reservas SET estado = "confirmada" WHERE id = ?',
        [id]
      );

      // 3. Sync with CRM (RN-10)
      // Get patient details first
      const [patRows] = await connection.execute(
        'SELECT nombre FROM pacientes WHERE dni = ?',
        [reserva.dni_paciente]
      );
      const pacienteNombre = patRows[0] ? patRows[0].nombre : 'Paciente TPS';

      // Check if client exists in CRM
      const [crmRows] = await connection.execute(
        'SELECT id FROM clientes_crm WHERE dni_o_ruc = ?',
        [reserva.dni_paciente]
      );

      if (crmRows.length > 0) {
        // Update type to "Paciente Activo"
        await connection.execute(
          'UPDATE clientes_crm SET tipo = "Paciente Activo", estado = "Activo" WHERE dni_o_ruc = ?',
          [reserva.dni_paciente]
        );
      } else {
        // Insert new "Paciente Activo"
        await connection.execute(
          'INSERT INTO clientes_crm (tipo, dni_o_ruc, nombre, estado, dni_tps) VALUES (?, ?, ?, ?, ?)',
          ['Paciente Activo', reserva.dni_paciente, pacienteNombre, 'Activo', reserva.dni_paciente]
        );
      }

      await connection.commit();
      return true;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async ensurePagosMercadoPagoSchema(connection) {
    const statements = [
      'ALTER TABLE pagos MODIFY metodo VARCHAR(50) NOT NULL',
      'ALTER TABLE pagos MODIFY estado VARCHAR(30) NOT NULL',
      'ALTER TABLE pagos ADD COLUMN mercado_pago_payment_id VARCHAR(80) NULL UNIQUE',
      'ALTER TABLE pagos ADD COLUMN mercado_pago_preference_id VARCHAR(80) NULL',
      'ALTER TABLE pagos ADD COLUMN ticket_codigo VARCHAR(80) NULL UNIQUE'
    ];

    for (const statement of statements) {
      try {
        await connection.execute(statement);
      } catch (error) {
        const duplicateColumn = error.code === 'ER_DUP_FIELDNAME';
        const duplicateKey = error.code === 'ER_DUP_KEYNAME';
        const alreadyModified = error.code === 'ER_CANT_DROP_FIELD_OR_KEY';
        if (!duplicateColumn && !duplicateKey && !alreadyModified) {
          throw error;
        }
      }
    }
  }

  static async confirmarPagoMercadoPago(id, { payment, monto, metodo = 'mercado_pago', preferenceId = null }) {
    const connection = await db.getConnection();
    try {
      await Reserva.ensurePagosMercadoPagoSchema(connection);
      await connection.beginTransaction();

      const [resRows] = await connection.execute(
        'SELECT * FROM reservas WHERE id = ? FOR UPDATE',
        [id]
      );
      const reserva = resRows[0];

      if (!reserva) {
        throw new Error('Reserva no encontrada');
      }

      if (reserva.estado !== 'pre_reserva') {
        throw new Error('La reserva ya no se encuentra en estado de pre-reserva');
      }

      if (new Date(reserva.expira_en) <= new Date()) {
        await connection.execute('UPDATE reservas SET estado = "cancelada" WHERE id = ?', [id]);
        await connection.commit();
        throw new Error('reserva expiro, horario liberado');
      }

      const ticketCodigo = `VS-${id}-${payment.id}`;

      await connection.execute(
        `INSERT INTO pagos
          (id_reserva, metodo, estado, monto, mercado_pago_payment_id, mercado_pago_preference_id, ticket_codigo)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          metodo,
          'exitoso',
          monto,
          String(payment.id),
          preferenceId || payment.preference_id || null,
          ticketCodigo
        ]
      );

      await connection.execute(
        'UPDATE reservas SET estado = "confirmada" WHERE id = ?',
        [id]
      );

      const [patRows] = await connection.execute(
        'SELECT nombre FROM pacientes WHERE dni = ?',
        [reserva.dni_paciente]
      );
      const pacienteNombre = patRows[0] ? patRows[0].nombre : 'Paciente TPS';

      const [crmRows] = await connection.execute(
        'SELECT id FROM clientes_crm WHERE dni_o_ruc = ?',
        [reserva.dni_paciente]
      );

      if (crmRows.length > 0) {
        await connection.execute(
          'UPDATE clientes_crm SET tipo = "Paciente Activo", estado = "Activo" WHERE dni_o_ruc = ?',
          [reserva.dni_paciente]
        );
      } else {
        await connection.execute(
          'INSERT INTO clientes_crm (tipo, dni_o_ruc, nombre, estado, dni_tps) VALUES (?, ?, ?, ?, ?)',
          ['Paciente Activo', reserva.dni_paciente, pacienteNombre, 'Activo', reserva.dni_paciente]
        );
      }

      await connection.commit();
      return ticketCodigo;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async cancelarPreReserva(id) {
    await db.execute(
      'UPDATE reservas SET estado = "cancelada" WHERE id = ? AND estado = "pre_reserva"',
      [id]
    );
  }

  static async findByMedicoId(idMedico) {
    const [rows] = await db.execute(`
      SELECT r.id, r.fecha, r.hora, r.estado, p.nombre AS paciente_nombre, p.telefono AS paciente_telefono
      FROM reservas r
      JOIN pacientes p ON r.dni_paciente = p.dni
      WHERE r.id_medico = ? AND r.estado IN ('confirmada', 'atendida')
      ORDER BY r.fecha ASC, r.hora ASC
    `, [idMedico]);
    return rows;
  }

  static async findOcupadasByMedicoFecha(idMedico, fecha) {
    const [rows] = await db.execute(`
      SELECT id, hora, estado
      FROM reservas
      WHERE id_medico = ?
        AND fecha = ?
        AND (
          estado = 'confirmada'
          OR estado = 'atendida'
          OR (estado = 'pre_reserva' AND expira_en > NOW())
        )
      ORDER BY hora ASC
    `, [idMedico, fecha]);
    return rows;
  }

  static async cancelar(id) {
    await db.execute('UPDATE reservas SET estado = "cancelada" WHERE id = ?', [id]);
  }

  static async atender(id) {
    await db.execute('UPDATE reservas SET estado = "atendida" WHERE id = ?', [id]);
  }

  static async liberarExpiradas() {
    const [result] = await db.execute(
      `UPDATE reservas SET estado = 'cancelada' 
       WHERE estado = 'pre_reserva' AND expira_en <= NOW()`
    );
    return result.affectedRows;
  }
}

module.exports = Reserva;
