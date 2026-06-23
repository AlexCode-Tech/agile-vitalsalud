const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Rutas
const pacientesRoutes = require('./routes/pacientesRoutes');
const medicosRoutes = require('./routes/medicosRoutes');
const reservasRoutes = require('./routes/reservasRoutes');
const recepcionRoutes = require('./routes/recepcionRoutes');
const especialidadesRoutes = require('./routes/especialidadesRoutes');
const adminRoutes = require('./routes/adminRoutes');
const crmRoutes = require('./routes/crmRoutes');
const horariosRoutes = require('./routes/horariosRoutes');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Servir estáticamente las fotos subidas de los médicos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Montar endpoints
app.use('/pacientes', pacientesRoutes);
app.use('/medicos', medicosRoutes);
app.use('/reservas', reservasRoutes);
app.use('/recepcion', recepcionRoutes);
app.use('/especialidades', especialidadesRoutes);
app.use('/admin', adminRoutes);
app.use('/crm', crmRoutes);
app.use('/horarios', horariosRoutes);

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    mensaje: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

module.exports = app;
