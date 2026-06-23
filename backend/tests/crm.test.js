const request = require('supertest');
const app = require('../app');
const db = require('../config/db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'vitalsalud_secret_key_123';

jest.mock('../config/db', () => ({
  execute: jest.fn()
}));

describe('CRM Endpoints', () => {
  let recepcionistaToken;

  beforeAll(() => {
    recepcionistaToken = jwt.sign({ id: 3, correo: 'recep@example.com', rol: 'Recepcionista' }, JWT_SECRET);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /crm/clientes (HU-13)', () => {
    it('debe agregar un cliente tipo Paciente Activo si existe en el TPS', async () => {
      // Paciente.findByDni -> returns patient
      db.execute.mockResolvedValueOnce([[{ dni: '12345678', nombre: 'Juan Perez' }]]);
      // ClienteCRM.findByDniORuc -> returns no existing client
      db.execute.mockResolvedValueOnce([[]]);
      // ClienteCRM.create -> returns insertId
      db.execute.mockResolvedValueOnce([{ insertId: 5 }]);

      const res = await request(app)
        .post('/crm/clientes')
        .set('Authorization', `Bearer ${recepcionistaToken}`)
        .send({
          tipo: 'Paciente Activo',
          dni_o_ruc: '12345678',
          nombre: 'Juan Perez',
          estado: 'Activo'
        });

      expect(res.status).toBe(201);
      expect(res.body.mensaje).toBe('Cliente agregado al CRM exitosamente.');
      expect(res.body.cliente.dniTps).toBe('12345678');
    });

    it('debe rechazar Paciente Activo si no existe en el TPS', async () => {
      db.execute.mockResolvedValueOnce([[]]); // Paciente.findByDni -> not found

      const res = await request(app)
        .post('/crm/clientes')
        .set('Authorization', `Bearer ${recepcionistaToken}`)
        .send({
          tipo: 'Paciente Activo',
          dni_o_ruc: '87654321',
          nombre: 'Juan Desconocido',
          estado: 'Activo'
        });

      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBe('El paciente no está registrado en el TPS.');
    });

    it('debe agregar un cliente tipo Lead directamente', async () => {
      db.execute.mockResolvedValueOnce([[]]); // ClienteCRM.findByDniORuc
      db.execute.mockResolvedValueOnce([{ insertId: 6 }]); // ClienteCRM.create

      const res = await request(app)
        .post('/crm/clientes')
        .set('Authorization', `Bearer ${recepcionistaToken}`)
        .send({
          tipo: 'Lead',
          dni_o_ruc: '99999999',
          nombre: 'Prospecto Gomez',
          estado: 'Prospecto'
        });

      expect(res.status).toBe(201);
      expect(res.body.cliente.dniTps).toBeNull();
    });

    it('debe agregar un cliente B2B si tiene RUC válido', async () => {
      db.execute.mockResolvedValueOnce([[]]); // ClienteCRM.findByDniORuc
      db.execute.mockResolvedValueOnce([{ insertId: 7 }]); // ClienteCRM.create

      const res = await request(app)
        .post('/crm/clientes')
        .set('Authorization', `Bearer ${recepcionistaToken}`)
        .send({
          tipo: 'B2B',
          dni_o_ruc: '20123456789', // 11 dígitos
          nombre: 'Empresa Ocular S.A.',
          estado: 'Activo'
        });

      expect(res.status).toBe(201);
    });

    it('debe rechazar B2B si el RUC es inválido', async () => {
      const res = await request(app)
        .post('/crm/clientes')
        .set('Authorization', `Bearer ${recepcionistaToken}`)
        .send({
          tipo: 'B2B',
          dni_o_ruc: '201234567', // Menos dígitos
          nombre: 'Empresa Ocular S.A.',
          estado: 'Activo'
        });

      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBe('El RUC debe tener exactamente 11 digitos numericos');
    });
  });

  describe('GET /crm/clientes/:id (HU-14)', () => {
    it('debe retornar el detalle del cliente CRM y su historial TPS si aplica', async () => {
      // ClienteCRM.findById -> returns B2C client linked to TPS
      db.execute.mockResolvedValueOnce([[{ id: 1, tipo: 'Paciente Activo', dni_o_ruc: '12345678', nombre: 'Juan Perez', dni_tps: '12345678' }]]);
      // Reserva.findByDni -> returns appointments
      db.execute.mockResolvedValueOnce([[{ id: 10, fecha: '2026-06-20', hora: '10:00:00', estado: 'confirmada', medico_nombre: 'Dr. Perez', medico_especialidad: 'Glaucoma' }]]);

      const res = await request(app)
        .get('/crm/clientes/1')
        .set('Authorization', `Bearer ${recepcionistaToken}`);

      expect(res.status).toBe(200);
      expect(res.body.cliente.nombre).toBe('Juan Perez');
      expect(res.body.historialTPS.length).toBe(1);
      expect(res.body.notas.length).toBeGreaterThan(0);
    });
  });
});
