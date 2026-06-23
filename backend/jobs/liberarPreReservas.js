const cron = require('node-cron');
const Reserva = require('../models/Reserva');

// Se ejecuta cada 20 minutos según RN-02 y HU-06
const scheduleExpression = '*/20 * * * *';

const task = cron.schedule(scheduleExpression, async () => {
  try {
    console.log('[Cron Job] Iniciando verificación de pre-reservas expiradas...');
    const affected = await Reserva.liberarExpiradas();
    if (affected > 0) {
      console.log(`[Cron Job] Se liberaron ${affected} pre-reservas expiradas por falta de pago.`);
    }
  } catch (error) {
    console.error('[Cron Job] Error al liberar pre-reservas expiradas:', error.message);
  }
}, {
  scheduled: false // Se iniciará explícitamente en server.js
});

module.exports = task;
