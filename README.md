# PMO App

Aplicacion web ligera para gestion y control de proyectos con recomendaciones automaticas.

## Stack

- Backend: Node.js, Express, Sequelize, MySQL, JWT
- Frontend: React, Vite, Axios, React Router DOM, Recharts

## Preparar base de datos

Crear la base en MySQL antes de iniciar el backend:

```sql
CREATE DATABASE pmo_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Copiar variables de entorno:

```bash
cd backend
cp .env.example .env
```

Ajustar `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME` y `JWT_SECRET`.
El backend usa `sequelize.sync({ alter: true })` para crear/actualizar tablas al iniciar.

## Ejecutar

Desde la raiz del proyecto:

```bash
npm run dev
```

El comando levanta backend y frontend en paralelo.

Por defecto el frontend consume `http://localhost:4000/api`. Para cambiarlo, crear `frontend/.env`:

```bash
VITE_API_URL=http://localhost:4000/api
```

## Modulos incluidos

- Autenticacion con registro, login, JWT y roles.
- Proyectos con desviacion y semaforo automatico.
- HU / SD con filtros, bloqueos, vencimientos y defectos en QA.
- Riesgos con nivel automatico y alertas de mitigacion/seguimiento.
- Cambios de alcance con validacion de impacto antes de aprobar.
- Recursos con calculo automatico de carga.
- Acuerdos por proyecto.
- Dashboard con metricas, graficos y recomendaciones automaticas.
