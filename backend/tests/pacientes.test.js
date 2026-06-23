const request = require('supertest');
const app = require('../app');
const db = require('../config/db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'vitalsalud_secret_key_123';

jest.mock('../config/db', () => ({
  execute: jest.fn(),
  getConnection: jest.fn()
}));

describe('Pacientes Endpoints', () => {
  let token;

  beforeAll(() => {
    token = jwt.sign({ id: 1, correo: 'juan@example.com', rol: 'Paciente', dni: '12345678' }, JWT_SECRET);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /pacientes (HU-01 Simplificado)', () => {
    it('debe registrar un paciente inactivo/no verificado solo con correo y contraseña', async () => {
      db.execute.mockResolvedValueOnce([[]]); // Correo check: no user
      db.execute.mockResolvedValueOnce([{ affectedRows: 1 }]); // User insert

      const res = await request(app)
        .post('/pacientes')
        .send({
          correo: 'juan@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(201);
      expect(res.body.mensaje).toBe('Código de verificación enviado a su correo.');
      expect(res.body.correo).toBe('juan@example.com');
    });

    it('debe rechazar si falta correo o contraseña', async () => {
      const res = await request(app)
        .post('/pacientes')
        .send({
          correo: 'juan@example.com'
        });

      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBe('Correo y contraseña son obligatorios');
    });

    it('debe rechazar correo duplicado', async () => {
      db.execute.mockResolvedValueOnce([[{ id: 1 }]]); // Correo check: user found

      const res = await request(app)
        .post('/pacientes')
        .send({
          correo: 'juan@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(409);
      expect(res.body.mensaje).toBe('Este correo ya está registrado.');
    });
  });

  describe('POST /pacientes/verify-code', () => {
    it('debe verificar código correcto y activar cuenta', async () => {
      db.execute.mockResolvedValueOnce([[{ id: 1, correo: 'juan@example.com', codigo_verificacion: '123456', verificado: 0 }]]); // user fetch
      db.execute.mockResolvedValueOnce([{ affectedRows: 1 }]); // user update verificado

      const res = await request(app)
        .post('/pacientes/verify-code')
        .send({
          correo: 'juan@example.com',
          codigo: '123456'
        });

      expect(res.status).toBe(200);
      expect(res.body.mensaje).toBe('Correo verificado con éxito.');
      expect(res.body.token).toBeDefined();
    });

    it('debe rechazar código incorrecto', async () => {
      db.execute.mockResolvedValueOnce([[{ id: 1, correo: 'juan@example.com', codigo_verificacion: '123456', verificado: 0 }]]); // user fetch

      const res = await request(app)
        .post('/pacientes/verify-code')
        .send({
          correo: 'juan@example.com',
          codigo: '999999'
        });

      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBe('Código de verificación incorrecto');
    });
  });

  describe('POST /pacientes/login', () => {
    it('debe denegar login si el usuario no está verificado', async () => {
      db.execute.mockResolvedValueOnce([[{ id: 1, correo: 'juan@example.com', verificado: 0 }]]); // fetch user

      const res = await request(app)
        .post('/pacientes/login')
        .send({
          correo: 'juan@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(403);
      expect(res.body.mensaje).toBe('Cuenta no verificada. Por favor, verifica tu correo primero.');
    });
  });

  describe('PATCH /pacientes/:id (Actualizar Perfil)', () => {
    it('debe permitir actualizar correo y teléfono', async () => {
      db.execute.mockResolvedValueOnce([[{ dni: '12345678', correo: 'juan@example.com' }]]); // Paciente.findByDni

      const mockConn = {
        beginTransaction: jest.fn(),
        execute: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn()
      };
      db.getConnection.mockResolvedValue(mockConn);

      const res = await request(app)
        .patch('/pacientes/12345678')
        .set('Authorization', `Bearer ${token}`)
        .send({
          correo: 'juan_new@example.com',
          telefono: '988888888'
        });

      expect(res.status).toBe(200);
      expect(res.body.mensaje).toBe('Perfil actualizado exitosamente');
    });

    it('debe rechazar intento de modificar el DNI', async () => {
      const res = await request(app)
        .patch('/pacientes/12345678')
        .set('Authorization', `Bearer ${token}`)
        .send({
          dni: '87654321',
          correo: 'juan@example.com'
        });

      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBe('No está permitido modificar el DNI del paciente.');
    });
  });
});
