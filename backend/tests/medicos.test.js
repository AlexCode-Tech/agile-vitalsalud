const request = require('supertest');
const app = require('../app');
const db = require('../config/db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'vitalsalud_secret_key_123';

jest.mock('../config/db', () => ({
  execute: jest.fn()
}));

describe('Medicos Endpoints', () => {
  let adminToken;
  let pacienteToken;

  beforeAll(() => {
    adminToken = jwt.sign({ id: 1, correo: 'admin@vitalsalud.com', rol: 'Administrador' }, JWT_SECRET);
    pacienteToken = jwt.sign({ id: 2, correo: 'paciente@example.com', rol: 'Paciente', dni: '12345678' }, JWT_SECRET);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /medicos', () => {
    it('debe permitir a un administrador registrar un médico con colegiatura única', async () => {
      db.execute.mockResolvedValueOnce([[]]); // Medico.findByColegiatura
      db.execute.mockResolvedValueOnce([{ insertId: 10 }]); // Medico.create

      const res = await request(app)
        .post('/medicos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          colegiatura: 'CMP12345',
          nombre: 'Dr. House',
          especialidad: 'Oftalmologia General',
          telefono: '999999999'
        });

      expect(res.status).toBe(201);
      expect(res.body.mensaje).toBe('Médico registrado exitosamente');
      expect(res.body.medico.id).toBe(10);
    });

    it('debe rechazar colegiatura duplicada', async () => {
      db.execute.mockResolvedValueOnce([[{ id: 5, colegiatura: 'CMP12345' }]]); // Medico.findByColegiatura (duplicada)

      const res = await request(app)
        .post('/medicos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          colegiatura: 'CMP12345',
          nombre: 'Dr. House',
          especialidad: 'Oftalmologia General',
          telefono: '999999999'
        });

      expect(res.status).toBe(409);
      expect(res.body.mensaje).toBe('Número de colegiatura ya registrado');
    });

    it('debe denegar el acceso a un paciente que intenta registrar un médico', async () => {
      const res = await request(app)
        .post('/medicos')
        .set('Authorization', `Bearer ${pacienteToken}`)
        .send({
          colegiatura: 'CMP99999',
          nombre: 'Dr. Paciente',
          especialidad: 'Oftalmologia General',
          telefono: '999999999'
        });

      expect(res.status).toBe(403);
      expect(res.body.mensaje).toBe('Acceso denegado. Permisos insuficientes.');
    });
  });

  describe('GET /medicos/todos', () => {
    it('debe permitir a un administrador ver todos los médicos', async () => {
      db.execute.mockResolvedValueOnce([[{ id: 1, nombre: 'Dr. House', estado: 'activo' }]]);

      const res = await request(app)
        .get('/medicos/todos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].nombre).toBe('Dr. House');
    });

    it('debe denegar el acceso a un paciente', async () => {
      const res = await request(app)
        .get('/medicos/todos')
        .set('Authorization', `Bearer ${pacienteToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /medicos/:id', () => {
    it('debe permitir a un administrador actualizar un médico', async () => {
      db.execute.mockResolvedValueOnce([[{ id: 1, nombre: 'Dr. House' }]]);
      db.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
      db.execute.mockResolvedValueOnce([[{ id: 1, nombre: 'Dr. Gregory House', estado: 'inactivo' }]]);

      const res = await request(app)
        .patch('/medicos/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Dr. Gregory House',
          especialidad: 'Oftalmologia General',
          telefono: '999999999',
          estado: 'inactivo'
        });

      expect(res.status).toBe(200);
      expect(res.body.mensaje).toBe('Médico actualizado exitosamente');
      expect(res.body.medico.nombre).toBe('Dr. Gregory House');
      expect(res.body.medico.estado).toBe('inactivo');
    });

    it('debe denegar el acceso a un paciente', async () => {
      const res = await request(app)
        .patch('/medicos/1')
        .set('Authorization', `Bearer ${pacienteToken}`)
        .send({
          nombre: 'Dr. Gregory House',
          especialidad: 'Oftalmologia General',
          telefono: '999999999',
          estado: 'inactivo'
        });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /medicos/:id', () => {
    it('debe permitir a un administrador eliminar un médico', async () => {
      db.execute.mockResolvedValueOnce([[{ id: 1, nombre: 'Dr. Gregory House' }]]); // Medico.findById
      db.execute.mockResolvedValueOnce([{ affectedRows: 1 }]); // Medico.delete

      const res = await request(app)
        .delete('/medicos/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.mensaje).toBe('Médico eliminado exitosamente');
    });

    it('debe devolver 404 si el médico no existe', async () => {
      db.execute.mockResolvedValueOnce([[]]); // Medico.findById (null)

      const res = await request(app)
        .delete('/medicos/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.mensaje).toBe('Médico no encontrado');
    });

    it('debe denegar el acceso a un paciente', async () => {
      const res = await request(app)
        .delete('/medicos/1')
        .set('Authorization', `Bearer ${pacienteToken}`);

      expect(res.status).toBe(403);
    });
  });
});
