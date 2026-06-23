const MERCADO_PAGO_API = 'https://api.mercadopago.com';

function getAccessToken() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    throw new Error('MP_ACCESS_TOKEN no configurado en el servidor.');
  }
  return token;
}

async function requestMercadoPago(path, options = {}) {
  const response = await fetch(`${MERCADO_PAGO_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.message || data.error || 'Error de Mercado Pago';
    const detail = JSON.stringify(data);
    const err = new Error(message);
    err.mpDetail = detail;
    throw err;
  }

  return data;
}

function normalizeBaseUrl(url) {
  return String(url || 'http://localhost:5173').replace(/\/+$/, '');
}

function isLocalUrl(url) {
  return /localhost|127\.0\.0\.1/.test(url);
}

async function createPreference({ reserva, monto, frontendBaseUrl }) {
  const baseUrl = normalizeBaseUrl(frontendBaseUrl);
  const reservaId = String(reserva.id);
  const currencyId = process.env.MP_CURRENCY_ID || 'PEN';

  return requestMercadoPago('/checkout/preferences', {
    method: 'POST',
    body: JSON.stringify({
      items: [
        {
          id: `reserva-${reservaId}`,
          title: 'Reserva de cita medica VitalSalud',
          description: `${reserva.medico_especialidad || 'Consulta medica'} con ${reserva.medico_nombre || 'medico'}`,
          category_id: 'services',
          quantity: 1,
          currency_id: currencyId,
          unit_price: Number(monto),
        },
      ],
      payer: {
        name: reserva.paciente_nombre || undefined,
      },
      external_reference: reservaId,
      metadata: {
        reserva_id: reservaId,
      },
      back_urls: {
        success: `${baseUrl}/dashboard/paciente/pago/${reservaId}?mp_status=success`,
        failure: `${baseUrl}/dashboard/paciente/pago/${reservaId}?mp_status=failure`,
        pending: `${baseUrl}/dashboard/paciente/pago/${reservaId}?mp_status=pending`,
      },
      // auto_return solo funciona con URLs públicas (no localhost)
      ...(isLocalUrl(baseUrl) ? {} : { auto_return: 'approved' }),
      statement_descriptor: 'VITALSALUD',
    }),
  });
}

async function getPayment(paymentId) {
  return requestMercadoPago(`/v1/payments/${encodeURIComponent(paymentId)}`);
}

module.exports = {
  createPreference,
  getPayment,
};
