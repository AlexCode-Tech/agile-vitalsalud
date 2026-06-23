import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import FormReserva from '../components/paciente/FormReserva';
import * as medicosApi from '../api/medicosApi';
import { AuthContext } from '../context/AuthContext';

vi.mock('../api/medicosApi');
vi.mock('../api/reservasApi');

const renderWithContext = (userRole = 'Paciente') => {
  const mockContext = {
    user: { dni: '12345678', correo: 'paciente@example.com', rol: userRole },
    isAuthenticated: true,
    loginUser: vi.fn(),
    logoutUser: vi.fn()
  };

  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockContext}>
        <FormReserva />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('FormReserva Component', () => {
  it('debe filtrar y mostrar solo médicos activos en el selector (RN-12)', async () => {
    medicosApi.obtenerMedicosActivos.mockResolvedValueOnce([
      { id: 1, nombre: 'Dr. Perez', especialidad: 'Oftalmologia General', estado: 'activo' },
      { id: 2, nombre: 'Dra. Silva', especialidad: 'Glaucoma', estado: 'inactivo' }
    ]);

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText(/Dr. Perez/)).toBeInTheDocument();
      expect(screen.queryByText(/Dra. Silva/)).not.toBeInTheDocument();
    });
  });
});
