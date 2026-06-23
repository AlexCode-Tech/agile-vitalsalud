import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import FormRegistro from '../components/paciente/FormRegistro';
import * as pacientesApi from '../api/pacientesApi';

vi.mock('../api/pacientesApi');
vi.mock('../hooks/useAuth', () => ({
  default: () => ({
    loginUser: vi.fn()
  })
}));

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <FormRegistro />
    </BrowserRouter>
  );
};

describe('FormRegistro Component', () => {
  it('debe registrar por correo y contraseña, y mostrar la pantalla de verificación', async () => {
    pacientesApi.registrarPaciente.mockResolvedValueOnce({ correo: 'test@example.com' });
    renderComponent();

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^contraseña \*/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/repetir contraseña/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /registrarse/i }));

    await waitFor(() => {
      expect(pacientesApi.registrarPaciente).toHaveBeenCalledWith({
        correo: 'test@example.com',
        password: 'password123'
      });
      expect(screen.getByText('Verifica tu Cuenta')).toBeInTheDocument();
    });
  });
});
