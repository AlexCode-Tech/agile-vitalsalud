/**
 * Vercel Serverless API entry point
 * Todas las rutas /api/* se enrutan aquí → Express backend
 *
 * IMPORTANTE: Vercel envía la request con la URL completa "/api/pacientes",
 * pero Express tiene las rutas montadas sin el prefijo "/api" (ej: "/pacientes").
 * Por eso se elimina el prefijo "/api" antes de pasarla al Express app.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });

const app = require('../backend/app');

module.exports = (req, res) => {
  // Eliminar el prefijo /api para que Express encuentre las rutas
  if (req.url && req.url.startsWith('/api')) {
    req.url = req.url.slice(4) || '/';
  }
  return app(req, res);
};
