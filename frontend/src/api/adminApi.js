import apiClient from './apiClient';

export const obtenerEstadisticas = async (periodo) => {
  const response = await apiClient.get(`/admin/estadisticas?periodo=${periodo}`);
  return response.data;
};

export const obtenerUsuarios = async () => {
  const response = await apiClient.get('/admin/usuarios');
  return response.data;
};

export const actualizarRol = async (id, rol) => {
  const response = await apiClient.patch(`/admin/usuarios/${id}/rol`, { rol });
  return response.data;
};

export const editarUsuario = async (id, datos) => {
  const response = await apiClient.patch(`/admin/usuarios/${id}`, datos);
  return response.data;
};

export const eliminarUsuario = async (id) => {
  const response = await apiClient.delete(`/admin/usuarios/${id}`);
  return response.data;
};
