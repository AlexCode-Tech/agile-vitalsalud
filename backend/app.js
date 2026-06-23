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

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4000',
  process.env.FRONTEND_BASE_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (Postman, curl, servidor a servidor)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o))) return callback(null, true);
    return callback(new Error(`CORS: origen no permitido: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());

// ── Archivos estáticos de uploads (solo en local) ───────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// ── Endpoints ───────────────────────────────────────────────────────────────
app.use('/pacientes', pacientesRoutes);
app.use('/medicos', medicosRoutes);
app.use('/reservas', reservasRoutes);
app.use('/recepcion', recepcionRoutes);
app.use('/especialidades', especialidadesRoutes);
app.use('/admin', adminRoutes);
app.use('/crm', crmRoutes);
app.use('/horarios', horariosRoutes);

// Health check para Vercel
app.get('/health', (req, res) => res.json({ ok: true, env: process.env.NODE_ENV }));

// ── Manejo de errores global ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    mensaje: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

module.exports = app;
