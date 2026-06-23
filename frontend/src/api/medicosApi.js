import apiClient from './apiClient';

export const registrarMedico = async (formData) => {
  const response = await apiClient.post('/medicos', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const obtenerMedicosActivos = async () => {
  const response = await apiClient.get('/medicos');
  return response.data;
};

export const obtenerTodosMedicos = async () => {
  const response = await apiClient.get('/medicos/todos');
  return response.data;
};

export const actualizarMedico = async (id, formData) => {
  const response = await apiClient.patch(`/medicos/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const eliminarMedico = async (id) => {
  const response = await apiClient.delete(`/medicos/${id}`);
  return response.data;
};

export const toggleAusenciaMedico = async (id) => {
  const response = await apiClient.patch(`/medicos/${id}/ausencia`);
  return response.data;
};
