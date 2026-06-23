import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FormCliente from '../components/crm/FormCliente';

vi.mock('../../api/crmApi');

const renderComponent = () => {
  return render(<FormCliente />);
};

describe('FormCliente Component', () => {
  it('debe cambiar dinámicamente el campo de identificación (DNI a RUC) al cambiar a tipo B2B (RN-10)', async () => {
    renderComponent();

    // Por defecto es Paciente Activo (B2C), debe mostrar etiqueta DNI
    expect(screen.getByText(/DNI/i)).toBeInTheDocument();
    expect(screen.queryByText(/RUC/i)).not.toBeInTheDocument();

    // Cambiar selector a B2B
    const select = screen.getByLabelText('Tipo de Registro');
    fireEvent.change(select, { target: { value: 'B2B' } });

    // Ahora debe mostrar etiqueta RUC
    expect(screen.getByText(/RUC/i)).toBeInTheDocument();
    expect(screen.queryByText(/DNI/i)).not.toBeInTheDocument();
  });
});
