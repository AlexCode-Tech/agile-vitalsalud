const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Envía el código de verificación al correo del paciente
 * @param {string} correo 
 * @param {string} codigo 
 */
async function enviarCodigoVerificacion(correo, codigo) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP_USER y SMTP_PASS no están configurados.');
  }

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: correo,
    subject: 'Código de Verificación - VitalSalud',
    text: `Hola,\n\nGracias por registrarte en VitalSalud.\n\nTu código de verificación es: ${codigo}\n\nIngresa este código en el sistema para activar tu cuenta.\n\nSaludos,\nEl equipo de VitalSalud`,
    html: `<p>Hola,</p><p>Gracias por registrarte en VitalSalud.</p><p>Tu código de verificación es: <strong>${codigo}</strong></p><p>Ingresa este código en el sistema para activar tu cuenta.</p><p>Saludos,<br>El equipo de VitalSalud</p>`
  });

  return info;
}

module.exports = { enviarCodigoVerificacion };
