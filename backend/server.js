const app = require('./app');
const cronJob = require('./jobs/liberarPreReservas');

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`[VitalSalud Server] Servidor corriendo en el puerto ${PORT}`);
  
  // Iniciar cron job de liberación de pre-reservas
  cronJob.start();
  console.log('[VitalSalud Server] Cron Job para liberar pre-reservas iniciado.');
});

// Manejo de cierres limpios
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido. Cerrando servidor...');
  cronJob.stop();
  server.close(() => {
    console.log('Servidor cerrado.');
    process.exit(0);
  });
});
