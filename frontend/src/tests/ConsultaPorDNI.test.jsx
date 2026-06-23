import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConsultaPorDNI from '../components/recepcion/ConsultaPorDNI';

vi.mock('../../api/reservasApi');

const renderComponent = () => {
  return render(<ConsultaPorDNI />);
};

describe('ConsultaPorDNI Component', () => {
  it('debe mostrar error de validación local si el DNI ingresado no es de 8 dígitos', async () => {
    renderComponent();

    const input = screen.getByPlaceholderText(/Ingrese DNI/i);
    fireEvent.change(input, { target: { value: '123' } }); // DNI corto

    const searchBtn = screen.getByRole('button', { name: /Buscar/i });
    fireEvent.click(searchBtn);

    const errorMsg = await screen.findByText('El DNI debe tener exactamente 8 digitos numericos');
    expect(errorMsg).toBeInTheDocument();
  });
});
