-- VitalSalud Database Schema and Initial Seeds

CREATE DATABASE IF NOT EXISTS vitalsalud;
USE vitalsalud;

-- Drop tables if they exist to start fresh (in correct order of dependencies)
DROP TABLE IF EXISTS pagos;
DROP TABLE IF EXISTS clientes_crm;
DROP TABLE IF EXISTS reservas;
DROP TABLE IF EXISTS horarios;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS pacientes;
DROP TABLE IF EXISTS medicos;
DROP TABLE IF EXISTS especialidades;

-- 1. Especialidades Table
CREATE TABLE especialidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) UNIQUE NOT NULL,
    descripcion TEXT,
    duracion INT NOT NULL DEFAULT 30,
    tiempo_espera_posterior INT NULL
);

-- 2. Pacientes Table
CREATE TABLE pacientes (
    dni VARCHAR(8) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    correo VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_dni_length CHECK (LENGTH(dni) = 8 AND dni REGEXP '^[0-9]+$')
);

-- 3. Medicos Table
CREATE TABLE medicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    colegiatura VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    especialidad VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    correo VARCHAR(255) UNIQUE NULL,
    dni VARCHAR(8) UNIQUE NULL,
    foto_url VARCHAR(255),
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    fecha_recertificacion DATE NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Horarios Table (Disponibilidad de Médicos)
CREATE TABLE horarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_medico INT NOT NULL,
    dias TEXT NOT NULL,
    horas VARCHAR(255) NOT NULL,
    duracion VARCHAR(50) NOT NULL,
    turnos_raw TEXT NOT NULL,
    duracion_min INT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_medico) REFERENCES medicos(id) ON DELETE CASCADE
);

-- 5. Usuarios Table (Auth & Roles)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    correo VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('Paciente', 'Recepcionista', 'Administrador', 'Medico') NOT NULL,
    dni VARCHAR(8) UNIQUE NULL,
    id_medico INT UNIQUE NULL,
    codigo_verificacion VARCHAR(6) NULL,
    verificado BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dni) REFERENCES pacientes(dni) ON DELETE CASCADE,
    FOREIGN KEY (id_medico) REFERENCES medicos(id) ON DELETE CASCADE
);

-- 6. Reservas Table (TPS Citas)
CREATE TABLE reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dni_paciente VARCHAR(8) NOT NULL,
    id_medico INT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado ENUM('pre_reserva', 'confirmada', 'atendida', 'cancelada') DEFAULT 'pre_reserva',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expira_en TIMESTAMP NOT NULL,
    FOREIGN KEY (dni_paciente) REFERENCES pacientes(dni) ON DELETE CASCADE,
    FOREIGN KEY (id_medico) REFERENCES medicos(id) ON DELETE CASCADE,
    -- Composite index to enforce scheduling lock & speed up queries
    INDEX idx_medico_fecha_hora (id_medico, fecha, hora)
);

-- 7. Pagos Table
CREATE TABLE pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_reserva INT NOT NULL,
    metodo VARCHAR(50) NOT NULL,
    estado VARCHAR(30) NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    mercado_pago_payment_id VARCHAR(80) UNIQUE NULL,
    mercado_pago_preference_id VARCHAR(80) NULL,
    ticket_codigo VARCHAR(80) UNIQUE NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_reserva) REFERENCES reservas(id) ON DELETE CASCADE
);

-- 8. Clientes CRM Table
CREATE TABLE clientes_crm (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('Paciente Activo', 'Lead', 'B2B') NOT NULL,
    dni_o_ruc VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    ultimo_contacto TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    dni_tps VARCHAR(8) UNIQUE NULL,
    FOREIGN KEY (dni_tps) REFERENCES pacientes(dni) ON DELETE SET NULL
);

-- ==========================================
-- Seeds (Initial Data)
-- ==========================================

-- Insert Specialties
INSERT INTO especialidades (nombre, descripcion, duracion, tiempo_espera_posterior) VALUES
('Oftalmología General', 'Revisión clínica general del ojo, diagnóstico inicial', 30, NULL),
('Retinología', 'Evaluación de retina, requiere dilatación previa de pupilas', 45, 30),
('Glaucoma', 'Medición de presión intraocular, evaluación de nervio óptico', 30, NULL),
('Cirugía Refractiva', 'Estudio de córnea para candidatura a cirugía (LASIK, etc.)', 60, NULL),
('Contactología', 'Adaptación y control de lentes de contacto', 30, NULL),
('Oftalmología Pediátrica', 'Evaluación visual en niños', 30, NULL);

-- Insert Medicos
INSERT INTO medicos (colegiatura, nombre, especialidad, telefono, correo, dni, foto_url, estado) VALUES
('CMP12345', 'Dr. Juan Perez', 'Oftalmología General', '987654321', 'juan.perez@vitalsalud.com', '11111111', NULL, 'activo'),
('CMP23456', 'Dra. Maria Gomez', 'Retinología', '987654322', 'maria.gomez@vitalsalud.com', '22222222', NULL, 'activo'),
('CMP34567', 'Dr. Carlos Mendoza', 'Oftalmología Pediátrica', '987654323', 'carlos.mendoza@vitalsalud.com', '33333333', NULL, 'activo'),
('CMP45678', 'Dra. Ana Silva', 'Glaucoma', '987654324', 'ana.silva@vitalsalud.com', '44444444', NULL, 'inactivo'); -- Doctor inactivo para pruebas de RN-12

-- Insert Staff Users (password_hash is bcrypt for 'password123')
INSERT INTO usuarios (correo, password_hash, rol, dni, id_medico, verificado) VALUES
('admin@vitalsalud.com', '$2b$10$SvfFjnw5v4JR.dZv9b3m5OH/EBeS6GnAUTYQOi1hGHqIq64XNWHvC', 'Administrador', NULL, NULL, 1),
('recepcion@vitalsalud.com', '$2b$10$SvfFjnw5v4JR.dZv9b3m5OH/EBeS6GnAUTYQOi1hGHqIq64XNWHvC', 'Recepcionista', NULL, NULL, 1),
('juan.perez@vitalsalud.com', '$2b$10$SvfFjnw5v4JR.dZv9b3m5OH/EBeS6GnAUTYQOi1hGHqIq64XNWHvC', 'Medico', NULL, 1, 1),
('maria.gomez@vitalsalud.com', '$2b$10$SvfFjnw5v4JR.dZv9b3m5OH/EBeS6GnAUTYQOi1hGHqIq64XNWHvC', 'Medico', NULL, 2, 1),
('carlos.mendoza@vitalsalud.com', '$2b$10$SvfFjnw5v4JR.dZv9b3m5OH/EBeS6GnAUTYQOi1hGHqIq64XNWHvC', 'Medico', NULL, 3, 1),
('ana.silva@vitalsalud.com', '$2b$10$SvfFjnw5v4JR.dZv9b3m5OH/EBeS6GnAUTYQOi1hGHqIq64XNWHvC', 'Medico', NULL, 4, 1);
