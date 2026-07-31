<div align="center">

# TraceSky

### Weather Intelligence Platform — AI-Powered Forecasting, Risk Detection & Expert Analysis

[![Live Demo](https://img.shields.io/badge/Live_Demo-trace--sky.vercel.app-38bdf8?style=for-the-badge&logo=vercel&logoColor=white)](https://trace-sky.vercel.app)
[![Backend](https://img.shields.io/badge/API-tracesky--backend.onrender.com-38bdf8?style=for-the-badge&logo=render&logoColor=white)](https://tracesky-backend.onrender.com)
[![API Docs](https://img.shields.io/badge/API_Docs-FastAPI-38bdf8?style=for-the-badge&logo=fastapi&logoColor=white)](https://tracesky-backend.onrender.com/docs)

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-SQLAlchemy-4169e1?logo=postgresql&logoColor=white)](https://www.postgresql.org)

</div>

---

## Live Demo

The full TraceSky walkthrough — plays automatically, loops forever, silent:

<div align="center">
  <img src="demo/tracesky-demo.gif" alt="TraceSky live demo — full walkthrough" width="100%" style="max-width: 920px; border-radius: 14px; border: 1px solid #1e293b; box-shadow: 0 20px 60px rgba(0,0,0,0.5);" />
</div>

> Demo file: [`demo/tracesky-demo.gif`](demo/tracesky-demo.gif)

---

## Key Features

TraceSky pairs a **50+ rule expert system** with live weather data to deliver actionable intelligence — not just raw numbers.

| Feature | What it does |
|---|---|---|
| **AI Assistant** | Natural-language chat powered by a rule-based inference engine. Asks about conditions, flood/storm/heat risk, forecasts, farming advice or solar planning — replies with graphs, gauges and rule traces. |
| **Risk Monitor** | Detects flood, storm and heat risks with **severity levels + confidence scores**, and shows *exactly which rules fired and why*. |
| **Forecasting** | Multi-source ensemble with **bias correction**, day-over-day and year-over-year deviation analysis, and confidence scoring. |
| **Analytics** | Model performance benchmarks vs. source providers, forecast accuracy, climatic intensity and event tracking. |
| **Interactive Maps** | Location search and Leaflet-based mapping for any coordinates, with a default-location setting. |
| **Authentication** | JWT + secure-cookie sessions, Google OAuth sign-in, and email password reset. |
| **Theming** | Customizable UI with theme accents, responsive dark dashboard. |

---

## Architecture

```
┌────────────────────────────┐        ┌──────────────────────────────┐
│      React Frontend        │  HTTP  │        FastAPI Backend       │
│  (Vite + TS + Tailwind)    │ ─────► │                             │
│  · Dashboard / Forecast    │        │  · Auth (JWT / Google OAuth)│
│  · Risk Monitor            │  /api  │  · Expert Inference Engine  │
│  · AI Assistant            │ ◄───── │  · WeatherAPI.com gateway   │
│  · Analytics / Settings    │        │  · Scheduler / Cache (Redis)│
└────────────────────────────┘        └──────────────┬───────────────┘
                                                     │
                                    ┌────────────────┴────────────────┐
                                    │   PostgreSQL (SQLAlchemy/Alembic)│
                                    └─────────────────────────────────┘
```

The frontend talks to the backend through a `/api` proxy (Vercel rewrite → Render). The backend runs the expert system, fetches live weather from WeatherAPI.com, caches with Redis (in-memory fallback), and schedules background analysis.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4, React Router, Zustand, Framer Motion, React Hook Form + Zod, Recharts, Leaflet |
| **Backend** | Python, FastAPI, Uvicorn, SQLAlchemy, Alembic, APScheduler, Pydantic, python-jose, passlib |
| **Data & Cache** | PostgreSQL, Redis (in-memory fallback) |
| **Integrations** | WeatherAPI.com, Google OAuth, SMTP email |
| **Deployment** | Frontend: Vercel · Backend: Render · Database: Supabase/Postgres |

---

## Getting Started

### 1. Clone & configure the backend

```bash
git clone https://github.com/Madhu-204/TraceSky.git
cd TraceSky/TraceSky-backend

python -m venv .venv
.venv\Scripts\activate          # Windows
source .venv/bin/activate       # macOS / Linux

pip install -r requirements.txt
cp .env.example .env            # fill in DATABASE_URL, WEATHERAPI_KEY, JWT_SECRET_KEY

alembic upgrade head            # run migrations
uvicorn app.main:app --reload   # API at http://localhost:8000
```

### 2. Run the frontend

```bash
cd ../TraceSky-frontend

npm install
cp .env.example .env            # VITE_API_BASE_URL=http://localhost:8000/api
npm run dev                     # app at http://localhost:5173
```

> **Free keys** (optional but recommended): [WeatherAPI.com](https://www.weatherapi.com) key for live data, Google OAuth credentials for social sign-in.

---

## Project Structure

```
TraceSky/
├── TraceSky-backend/
│   ├── app/
│   │   ├── core/          # config, security, database
│   │   ├── models/        # SQLAlchemy models
│   │   ├── routers/       # auth, weather, ai
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # expert system, knowledge base, inference
│   │   ├── scheduler/     # background tasks
│   │   └── main.py        # FastAPI app
│   ├── alembic/           # database migrations
│   └── render.yaml        # Render deploy config
├── TraceSky-frontend/
│   ├── src/
│   │   ├── components/    # dashboard, risk, analytics, assistant UI
│   │   ├── pages/         # route-level pages
│   │   ├── services/      # API clients
│   │   ├── store/         # Zustand stores
│   │   └── types/         # TypeScript types
│   ├── vercel.json        # Vercel rewrites /api → backend
│   └── vite.config.ts
├── demo/                  # demo video + assets
└── README.md
```

---

## API Overview

| Endpoint | Description |
|---|---|
| `POST /api/auth/register` | Create an account |
| `POST /api/auth/login` | Sign in (JWT cookie) |
| `GET /api/weather/current?lat=&lon=` | Live current conditions |
| `GET /api/weather/forecast?lat=&lon=` | Ensemble forecast |
| `POST /api/ai/ask` | Query the AI assistant / expert system |
| `POST /api/ai/risk?lat=&lon=` | Run risk detection (flood/storm/heat) |

Full interactive docs at `{backend-url}/docs` (Swagger UI).

---

## License

© 2026 TraceSky Labs Inc. All rights reserved.
