const db = require('../config/db');

/**
 * Valida que entre la nueva cita y cualquier cita existente el mismo día
 * se respete un tiempo de espera mínimo (por defecto 30 minutos).
 * (Regla de Negocio RN-04)
 * @param {string} dniPaciente
 * @param {string} fecha YYYY-MM-DD
 * @param {string} nuevaHora HH:MM o HH:MM:SS
 * @returns {Promise<boolean>} Retorna true si es válido (se respeta el intervalo), false si viola el tiempo mínimo
 */
async function validarTiempoEspera(dniPaciente, fecha, nuevaHora) {
  const query = `
    SELECT hora FROM reservas
    WHERE dni_paciente = ?
      AND fecha = ?
      AND (estado = 'confirmada' OR (estado = 'pre_reserva' AND expira_en > NOW()))
  `;
  const [rows] = await db.execute(query, [dniPaciente, fecha]);
  
  if (rows.length === 0) return true;

  // Convertir nuevaHora a minutos
  const [newH, newM] = nuevaHora.split(':').map(Number);
  const newMinutes = newH * 60 + newM;

  for (const row of rows) {
    // MySQL TIME type is returned as string "HH:MM:SS"
    const [h, m] = row.hora.split(':').map(Number);
    const existingMinutes = h * 60 + m;
    
    // Si la diferencia es menor a 30 minutos, se considera inválido
    if (Math.abs(newMinutes - existingMinutes) < 30) {
      return false;
    }
  }
  
  return true;
}

module.exports = validarTiempoEspera;
