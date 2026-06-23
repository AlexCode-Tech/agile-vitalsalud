const db = require('../config/db');

/**
 * Verifica si existe solapamiento de horario para un paciente.
 * (Regla de Negocio RN-05)
 * @param {string} dniPaciente
 * @param {string} fecha YYYY-MM-DD
 * @param {string} hora HH:MM o HH:MM:SS
 * @returns {Promise<boolean>} Retorna true si hay conflicto de horario
 */
async function validarSolapamientoPaciente(dniPaciente, fecha, hora) {
  const query = `
    SELECT id FROM reservas 
    WHERE dni_paciente = ? 
      AND fecha = ? 
      AND hora = ? 
      AND (estado = 'confirmada' OR (estado = 'pre_reserva' AND expira_en > NOW()))
  `;
  const [rows] = await db.execute(query, [dniPaciente, fecha, hora]);
  return rows.length > 0;
}

/**
 * Verifica si existe solapamiento de horario para un médico.
 * (Regla de Negocio RN-12)
 * @param {number} idMedico
 * @param {string} fecha YYYY-MM-DD
 * @param {string} hora HH:MM o HH:MM:SS
 * @returns {Promise<boolean>} Retorna true si hay conflicto de horario
 */
async function validarSolapamientoMedico(idMedico, fecha, hora) {
  const query = `
    SELECT id FROM reservas 
    WHERE id_medico = ? 
      AND fecha = ? 
      AND hora = ? 
      AND (estado = 'confirmada' OR (estado = 'pre_reserva' AND expira_en > NOW()))
  `;
  const [rows] = await db.execute(query, [idMedico, fecha, hora]);
  return rows.length > 0;
}

module.exports = {
  validarSolapamientoPaciente,
  validarSolapamientoMedico
};
