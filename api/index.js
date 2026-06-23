/**
 * Vercel Serverless API entry point
 * Todas las rutas /api/* se enrutan aquí → Express backend
 */
require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const app = require('../backend/app');

module.exports = app;
