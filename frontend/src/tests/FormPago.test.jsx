import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import FormPago from '../components/paciente/FormPago';
import { crearPreferenciaMercadoPago } from '../api/reservasApi';

vi.mock('../api/reservasApi');

const renderComponent = () => {
  return render(
    <MemoryRouter initialEntries={['/dashboard/paciente/pago/3']}>
      <Routes>
        <Route path="/dashboard/paciente/pago/:id" element={<FormPago />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('FormPago Component', () => {
  it('debe mostrar el boton de Mercado Pago cuando existe una preferencia', async () => {
    crearPreferenciaMercadoPago.mockResolvedValue({
      initPoint: 'https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id=test',
      monto: 80,
      reserva: {
        id: 3,
        fecha: '2026-06-24',
        hora: '08:30',
        medico: 'DRA. PRUEBA',
        especialidad: 'Consulta General',
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Pagar con Mercado Pago/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/S\/\. 80\.00/i)).toBeInTheDocument();
  });
});
