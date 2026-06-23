const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'aleeexpsm2005@gmail.com',
    pass: 'igcxcutcqhpyrprw' // Contraseña de aplicación sin espacios
  }
});

/**
 * Envía el código de verificación al correo del paciente
 * @param {string} correo 
 * @param {string} codigo 
 */
async function enviarCodigoVerificacion(correo, codigo) {
  const info = await transporter.sendMail({
    from: 'aleeexpsm2005@gmail.com',
    to: correo,
    subject: 'Código de Verificación - VitalSalud',
    text: `Hola,\n\nGracias por registrarte en VitalSalud.\n\nTu código de verificación es: ${codigo}\n\nIngresa este código en el sistema para activar tu cuenta.\n\nSaludos,\nEl equipo de VitalSalud`,
    html: `<p>Hola,</p><p>Gracias por registrarte en VitalSalud.</p><p>Tu código de verificación es: <strong>${codigo}</strong></p><p>Ingresa este código en el sistema para activar tu cuenta.</p><p>Saludos,<br>El equipo de VitalSalud</p>`
  });

  return info;
}

module.exports = { enviarCodigoVerificacion };
