const request = require('supertest');
const app = require('../app');
const db = require('../config/db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'vitalsalud_secret_key_123';

jest.mock('../config/db', () => ({
  execute: jest.fn()
}));

describe('Admin Endpoints', () => {
  let adminToken;
  let pacienteToken;

  beforeAll(() => {
    adminToken = jwt.sign({ id: 1, correo: 'admin@vitalsalud.com', rol: 'Administrador' }, JWT_SECRET);
    pacienteToken = jwt.sign({ id: 2, correo: 'paciente@example.com', rol: 'Paciente', dni: '12345678' }, JWT_SECRET);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /admin/estadisticas', () => {
    it('debe permitir a un administrador ver estadísticas por día', async () => {
      db.execute.mockResolvedValueOnce([[{ hora: 10, total: 3 }]]);

      const res = await request(app)
        .get('/admin/estadisticas?periodo=dia')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.periodo).toBe('dia');
      expect(res.body.datos[0].total).toBe(3);
    });

    it('debe permitir a un administrador ver estadísticas por mes_actual', async () => {
      db.execute.mockResolvedValueOnce([[{ dia: 15, total: 10 }]]);

      const res = await request(app)
        .get('/admin/estadisticas?periodo=mes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.periodo).toBe('mes_actual');
      expect(res.body.datos[0].total).toBe(10);
    });

    it('debe permitir a un administrador ver estadísticas por año', async () => {
      db.execute.mockResolvedValueOnce([[{ mes: 6, total: 120 }]]);

      const res = await request(app)
        .get('/admin/estadisticas?periodo=anio')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.periodo).toBe('anio');
      expect(res.body.datos[0].total).toBe(120);
    });

    it('debe denegar el acceso a un paciente', async () => {
      const res = await request(app)
        .get('/admin/estadisticas?periodo=mes')
        .set('Authorization', `Bearer ${pacienteToken}`);

      expect(res.status).toBe(403);
    });
  });
});
