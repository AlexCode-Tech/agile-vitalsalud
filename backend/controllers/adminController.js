const db = require('../config/db');

/**
 * HU-12: Panel de Gráficos Estadísticos (Admin)
 */
exports.obtenerEstadisticas = async (req, res) => {
  const { periodo } = req.query; // 'dia', 'mes_actual', 'mes', 'anio'

  try {
    if (periodo === 'dia') {
      const query = `
        SELECT HOUR(hora) AS hora, COUNT(*) AS total
        FROM reservas
        WHERE estado = 'atendida' AND fecha = CURRENT_DATE()
        GROUP BY HOUR(hora)
        ORDER BY hora ASC
      `;
      const [rows] = await db.execute(query);
      return res.status(200).json({ periodo: 'dia', datos: rows });
    } else if (periodo === 'anio') {
      const query = `
        SELECT MONTH(fecha) AS mes, COUNT(*) AS total
        FROM reservas
        WHERE estado = 'atendida' AND YEAR(fecha) = YEAR(CURRENT_DATE())
        GROUP BY MONTH(fecha)
        ORDER BY mes ASC
      `;
      const [rows] = await db.execute(query);
      return res.status(200).json({ periodo: 'anio', datos: rows });
    } else {
      // Por defecto 'mes_actual' / 'mes'
      const query = `
        SELECT DAY(fecha) AS dia, COUNT(*) AS total
        FROM reservas
        WHERE estado = 'atendida' 
          AND MONTH(fecha) = MONTH(CURRENT_DATE()) 
          AND YEAR(fecha) = YEAR(CURRENT_DATE())
        GROUP BY DAY(fecha)
        ORDER BY dia ASC
      `;
      const [rows] = await db.execute(query);
      return res.status(200).json({ periodo: 'mes_actual', datos: rows });
    }
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al obtener estadísticas', error: error.message });
  }
};

/**
 * Obtener todos los usuarios del sistema (Admin)
 */
exports.listarUsuarios = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT
        u.id,
        u.correo,
        u.rol,
        COALESCE(m.dni, u.dni) AS dni,
        m.colegiatura,
        m.telefono,
        u.verificado
      FROM usuarios u
      LEFT JOIN medicos m ON u.id_medico = m.id
      ORDER BY u.id ASC
    `);
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al listar usuarios', error: error.message });
  }
};

/**
 * Actualizar el rol de un usuario (Admin)
 */
exports.actualizarRolUsuario = async (req, res) => {
  const { id } = req.params;
  const { rol } = req.body;

  if (!['Paciente', 'Recepcionista', 'Administrador', 'Medico'].includes(rol)) {
    return res.status(400).json({ mensaje: 'Rol no válido' });
  }

  try {
    await db.execute('UPDATE usuarios SET rol = ? WHERE id = ?', [rol, id]);
    return res.status(200).json({ mensaje: 'Rol actualizado exitosamente' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al actualizar rol del usuario', error: error.message });
  }
};

/**
 * Editar datos básicos de un usuario (correo y verificado) — Admin
 */
exports.editarUsuario = async (req, res) => {
  const { id } = req.params;
  const { correo, verificado } = req.body;

  if (!correo) {
    return res.status(400).json({ mensaje: 'El correo es obligatorio' });
  }

  try {
    // Verificar que el correo no esté en uso por otro usuario
    const [existe] = await db.execute(
      'SELECT id FROM usuarios WHERE correo = ? AND id != ?',
      [correo, id]
    );
    if (existe.length > 0) {
      return res.status(409).json({ mensaje: 'El correo ya está registrado por otro usuario' });
    }

    await db.execute(
      'UPDATE usuarios SET correo = ?, verificado = ? WHERE id = ?',
      [correo, verificado ? 1 : 0, id]
    );
    return res.status(200).json({ mensaje: 'Usuario actualizado exitosamente' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al editar el usuario', error: error.message });
  }
};

/**
 * Eliminar un usuario y todos sus datos relacionados — Admin
 */
exports.eliminarUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    // Proteger al propio administrador para que no se auto-elimine
    const [rows] = await db.execute('SELECT rol FROM usuarios WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Eliminar el usuario; ON DELETE CASCADE en la BD se encarga de medicos/pacientes
    await db.execute('DELETE FROM usuarios WHERE id = ?', [id]);
    return res.status(200).json({ mensaje: 'Usuario eliminado exitosamente' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al eliminar el usuario', error: error.message });
  }
};
