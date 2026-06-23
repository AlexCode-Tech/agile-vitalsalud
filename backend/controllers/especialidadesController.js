const db = require('../config/db');

/**
 * HU-07: Catálogo Público de Especialidades
 */
exports.listarEspecialidades = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM especialidades ORDER BY nombre ASC');
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al obtener el catálogo de especialidades', error: error.message });
  }
};
