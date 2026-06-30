# WeatherWise AI

A modern weather intelligence dashboard built with React, TypeScript, and Vite featuring AI-powered forecasting, risk monitoring, and analytics.

## Features

### Pages
- **Dashboard** - Current weather conditions, forecasts, risk summary, and expert recommendations
- **Forecast** - Hourly/daily forecasts with detailed metrics and charts
- **Risk Monitor** - Geospatial risk visualization with flood, heatwave, and storm alerts
- **AI Assistant** - Interactive weather assistant with chat interface
- **Analytics** - Forecast accuracy, climatic intensity, event tracking, and performance benchmarks
- **Settings** - General settings and API gateway configuration

### Components
- **Sidebar** - Navigation menu with logo and quick actions
- **Header** - Search, notifications, user profile, and mobile navigation
- **WeatherIcon** - Reusable weather icon component
- **Alert Cards** - FloodAlert, HeatwaveAlert, StormWarning
- **Charts** - Temperature, Rainfall, Humidity, WindSpeed charts

### Tech Stack
- **React 19** with TypeScript
- **Vite** for fast HMR
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Recharts** for data visualization
- **lucide-react** for icons
- **react-icons** for social icons (Google)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── alerts/      # Alert cards
│   ├── analytics/   # Analytics cards
│   ├── assistant/    # AI assistant chat
│   ├── charts/      # Weather charts
│   ├── dashboard/   # Dashboard components
│   ├── forecast/   # Forecast components
│   ├── map/       # Weather map
│   ├── risk/      # Risk monitoring
│   ├── settings/   # Settings panels
│   └── ui/         # UI utilities
├── hooks/          # Custom React hooks
├── pages/          # Page components
├── services/       # API services
├── store/         # Zustand stores
├── types/         # TypeScript types
└── utils/         # Utility functions
```

## Theme

Dark theme with colors:
- Background: `#0A0F1E`
- Surface: `#111827`
- Card: `#1C2537`
- Border: `#2D3748`
- Accent Blue: `#3B82F6`