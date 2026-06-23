# VitalSalud

Plataforma de gestión de citas médicas (TPS) y CRM clínico para una clínica oftalmológica en Trujillo, La Libertad, Perú.

## Estructura del Proyecto

El proyecto está dividido en:
- `backend/`: API REST construida con Node.js y Express, con base de datos MySQL.
- `frontend/`: Aplicación Single Page Application (SPA) desarrollada con React, Vite y Tailwind CSS.

## Requisitos Previos

- Node.js (versión 16 o superior recomendada)
- MySQL Server

## Configuración Inicial

1. Copia el archivo de configuración de entorno:
   ```bash
   cp .env.example .env
   ```
2. Configura las credenciales de base de datos y JWT en el archivo `.env`.
3. Instala las dependencias correspondientes en `backend` y `frontend`.
