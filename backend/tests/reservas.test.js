const request = require('supertest');
const app = require('../app');
const db = require('../config/db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'vitalsalud_secret_key_123';

jest.mock('../config/db', () => ({
  execute: jest.fn(),
  getConnection: jest.fn()
}));

describe('Reservas Endpoints', () => {
  let pacienteToken;
  let recepcionistaToken;

  beforeAll(() => {
    pacienteToken = jwt.sign({ id: 2, correo: 'paciente@example.com', rol: 'Paciente', dni: '12345678' }, JWT_SECRET);
    recepcionistaToken = jwt.sign({ id: 3, correo: 'recep@example.com', rol: 'Recepcionista' }, JWT_SECRET);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /reservas (HU-06)', () => {
    it('debe crear una pre-reserva válida', async () => {
      db.execute.mockResolvedValueOnce([[{ dni: '12345678', nombre: 'Juan' }]]); // Paciente.findByDni
      db.execute.mockResolvedValueOnce([[{ id: 1, nombre: 'Dr. Perez', especialidad: 'Oftalmologia General', estado: 'activo' }]]); // Medico.findById
      db.execute.mockResolvedValueOnce([[]]); // validarTiempoEspera
      db.execute.mockResolvedValueOnce([[]]); // validarSolapamientoPaciente
      db.execute.mockResolvedValueOnce([[]]); // validarSolapamientoMedico
      db.execute.mockResolvedValueOnce([[]]); // tieneEspecialidadEnUltimos15Dias
      db.execute.mockResolvedValueOnce([{ insertId: 100 }]); // Reserva.create

      const res = await request(app)
        .post('/reservas')
        .set('Authorization', `Bearer ${pacienteToken}`)
        .send({
          dni_paciente: '12345678',
          id_medico: 1,
          fecha: '2026-06-20',
          hora: '10:00'
        });

      expect(res.status).toBe(201);
      expect(res.body.mensaje).toContain('Pre-reserva creada exitosamente');
      expect(res.body.reservaId).toBe(100);
    });

    it('debe completar el perfil del paciente y crear la pre-reserva si el paciente no tiene DNI asociado', async () => {
      const tokenSinDni = jwt.sign({ id: 2, correo: 'paciente@example.com', rol: 'Paciente', dni: null }, JWT_SECRET);

      db.execute.mockResolvedValueOnce([[]]); // Paciente.findByDni: null (no existe)
      db.execute.mockResolvedValueOnce([[]]); // Paciente.create (inside controller)
      db.execute.mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE usuarios SET dni
      db.execute.mockResolvedValueOnce([[{ id: 1, nombre: 'Dr. Perez', especialidad: 'Oftalmologia General', estado: 'activo' }]]); // Medico.findById
      db.execute.mockResolvedValueOnce([[]]); // validarTiempoEspera
      db.execute.mockResolvedValueOnce([[]]); // validarSolapamientoPaciente
      db.execute.mockResolvedValueOnce([[]]); // validarSolapamientoMedico
      db.execute.mockResolvedValueOnce([[]]); // tieneEspecialidadEnUltimos15Dias
      db.execute.mockResolvedValueOnce([{ insertId: 100 }]); // Reserva.create

      const res = await request(app)
        .post('/reservas')
        .set('Authorization', `Bearer ${tokenSinDni}`)
        .send({
          dni_paciente: '12345678',
          nombre_paciente: 'Juan Perez',
          telefono_paciente: '999999999',
          id_medico: 1,
          fecha: '2026-06-20',
          hora: '10:00'
        });

      expect(res.status).toBe(201);
      expect(res.body.mensaje).toContain('Pre-reserva creada exitosamente');
      expect(res.body.reservaId).toBe(100);
    });

    it('debe rechazar si el médico seleccionado está inactivo (RN-12)', async () => {
      db.execute.mockResolvedValueOnce([[{ dni: '12345678' }]]); // Paciente
      db.execute.mockResolvedValueOnce([[{ id: 1, nombre: 'Dr. Perez', estado: 'inactivo' }]]); // Medico inactivo

      const res = await request(app)
        .post('/reservas')
        .set('Authorization', `Bearer ${pacienteToken}`)
        .send({
          dni_paciente: '12345678',
          id_medico: 1,
          fecha: '2026-06-20',
          hora: '10:00'
        });

      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBe('El médico seleccionado no está activo.');
    });

    it('debe rechazar por solapamiento del paciente (RN-05)', async () => {
      db.execute.mockResolvedValueOnce([[{ dni: '12345678' }]]);
      db.execute.mockResolvedValueOnce([[{ id: 1, nombre: 'Dr. Perez', estado: 'activo' }]]);
      db.execute.mockResolvedValueOnce([[]]); // validarTiempoEspera
      db.execute.mockResolvedValueOnce([[{ id: 5 }]]); // paciente solapado

      const res = await request(app)
        .post('/reservas')
        .set('Authorization', `Bearer ${pacienteToken}`)
        .send({
          dni_paciente: '12345678',
          id_medico: 1,
          fecha: '2026-06-20',
          hora: '10:00'
        });

      expect(res.status).toBe(499);
      expect(res.body.mensaje).toBe('Ya tienes una cita programada en este horario. Por favor, selecciona otro momento.');
    });

    it('debe rechazar por misma especialidad en 15 días (RN-06)', async () => {
      db.execute.mockResolvedValueOnce([[{ dni: '12345678' }]]);
      db.execute.mockResolvedValueOnce([[{ id: 1, nombre: 'Dr. Perez', especialidad: 'Oftalmologia General', estado: 'activo' }]]);
      db.execute.mockResolvedValueOnce([[]]); // validarTiempoEspera
      db.execute.mockResolvedValueOnce([[]]); // validarSolapamientoPaciente
      db.execute.mockResolvedValueOnce([[]]); // validarSolapamientoMedico
      db.execute.mockResolvedValueOnce([[{ id: 5, fecha: '2026-06-15' }]]); // tiene especialidad en 15 dias

      const res = await request(app)
        .post('/reservas')
        .set('Authorization', `Bearer ${pacienteToken}`)
        .send({
          dni_paciente: '12345678',
          id_medico: 1,
          fecha: '2026-06-20',
          hora: '10:00'
        });

      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBe('Ya tienes una cita programada de esta especialidad en los últimos o próximos 15 días.');
      expect(res.body.opciones).toContain('reprogramar');
      expect(res.body.opciones).toContain('declarar urgencia');
    });

    it('debe permitir override de la regla de 15 días si es personal de Recepción y declara urgencia (RN-07)', async () => {
      db.execute.mockResolvedValueOnce([[{ dni: '12345678' }]]);
      db.execute.mockResolvedValueOnce([[{ id: 1, nombre: 'Dr. Perez', especialidad: 'Oftalmologia General', estado: 'activo' }]]);
      db.execute.mockResolvedValueOnce([[]]);
      db.execute.mockResolvedValueOnce([[]]);
      db.execute.mockResolvedValueOnce([[]]);
      // tieneEspecialidadEnUltimos15Dias se omite
      db.execute.mockResolvedValueOnce([{ insertId: 101 }]);

      const res = await request(app)
        .post('/reservas')
        .set('Authorization', `Bearer ${recepcionistaToken}`)
        .send({
          dni_paciente: '12345678',
          id_medico: 1,
          fecha: '2026-06-20',
          hora: '10:00',
          esUrgencia: true
        });

      expect(res.status).toBe(201);
      expect(res.body.reservaId).toBe(101);
      expect(res.body.alertaUrgencia).toBe('URGENCIA REGISTRADA: Gestión prioritaria en 10 minutos.');
    });
  });

  describe('PATCH /reservas/:id/pagar (HU-11)', () => {
    it('debe confirmar el pago de una pre-reserva válida', async () => {
      const mockConn = {
        beginTransaction: jest.fn(),
        execute: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn()
      };
      db.getConnection.mockResolvedValue(mockConn);

      const futureDate = new Date(Date.now() + 15 * 60 * 1000);
      // 1. Lock and fetch reservation details
      mockConn.execute.mockResolvedValueOnce([[{ id: 1, dni_paciente: '12345678', estado: 'pre_reserva', expira_en: futureDate }]]);
      // 2. Insert Payment
      mockConn.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // 3. Update Reservation State
      mockConn.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
      // 4. Get patient details
      mockConn.execute.mockResolvedValueOnce([[{ nombre: 'Juan' }]]);
      // 5. Check if client exists in CRM
      mockConn.execute.mockResolvedValueOnce([[]]);
      // 6. Insert new "Paciente Activo" in CRM
      mockConn.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app)
        .patch('/reservas/1/pagar')
        .set('Authorization', `Bearer ${pacienteToken}`)
        .send({
          metodo: 'tarjeta',
          monto: 80.00
        });

      expect(res.status).toBe(200);
      expect(res.body.mensaje).toBe('Pago procesado exitosamente. Cita confirmada.');
    });

    it('debe rechazar si la pre-reserva ha expirado', async () => {
      const mockConn = {
        beginTransaction: jest.fn(),
        execute: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn()
      };
      db.getConnection.mockResolvedValue(mockConn);

      const pastDate = new Date(Date.now() - 5 * 60 * 1000);
      // 1. Lock and fetch reservation details (returns expired)
      mockConn.execute.mockResolvedValueOnce([[{ id: 1, dni_paciente: '12345678', estado: 'pre_reserva', expira_en: pastDate }]]);
      // 2. Update Reservation State to cancelada
      mockConn.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app)
        .patch('/reservas/1/pagar')
        .set('Authorization', `Bearer ${pacienteToken}`)
        .send({
          metodo: 'tarjeta',
          monto: 80.00
        });

      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBe('Tu reserva expiró. El horario fue liberado.');
    });
  });

  describe('PATCH /reservas/:id/atender (HU-03)', () => {
    it('debe cambiar estado de confirmada a atendida', async () => {
      db.execute.mockResolvedValueOnce([[{ id: 1, estado: 'confirmada' }]]); // fetch
      db.execute.mockResolvedValueOnce([[]]); // update

      const res = await request(app)
        .patch('/reservas/1/atender')
        .set('Authorization', `Bearer ${recepcionistaToken}`);

      expect(res.status).toBe(200);
      expect(res.body.mensaje).toBe('Paciente marcado como Atendido exitosamente.');
    });

    it('debe rechazar si la cita ya fue cerrada', async () => {
      db.execute.mockResolvedValueOnce([[{ id: 1, estado: 'atendida' }]]); // fetch

      const res = await request(app)
        .patch('/reservas/1/atender')
        .set('Authorization', `Bearer ${recepcionistaToken}`);

      expect(res.status).toBe(400);
      expect(res.body.mensaje).toBe('Esta cita ya fue cerrada.');
    });
  });
});
