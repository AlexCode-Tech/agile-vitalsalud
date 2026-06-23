// Entry point para Vercel Serverless Functions
// Wraps Express app para que funcione como handler serverless
const app = require('../app');

module.exports = app;
