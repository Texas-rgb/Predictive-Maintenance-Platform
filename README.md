# PredictiveOS — Aviation Engine Health & Maintenance Platform

> An end-to-end industrial AI platform that monitors asset health, manages maintenance workflows, and predicts Remaining Useful Life (RUL) of aviation engines using an Attention-LSTM model trained on NASA's CMAPSS dataset.

---

## Overview

PredictiveOS is a full-stack predictive maintenance system built for industrial asset management. It combines real-time sensor monitoring, alert management, and AI-powered RUL prediction into a single unified dashboard — designed the way a real operations team would use it.

The ML model at its core is a custom **Attention-LSTM** architecture with a self-built decision layer, trained on the NASA CMAPSS FD001 dataset. It predicts how many operational cycles remain before an engine requires maintenance, with confidence estimation via **Monte Carlo Dropout** (20 stochastic forward passes).

---

## Features

- **Fleet Dashboard** — live asset health overview, alert trends, and system activity log
- **Asset Management** — searchable fleet with per-asset health scores, sensor data, and drill-down detail pages
- **RUL Predictor** — paste 630 sensor values (30 cycles × 21 CMAPSS sensors) and get an instant prediction with confidence score and standard deviation
- **RUL History Tracking** — every prediction is saved to the asset's history and visualised as a trend chart
- **Alert Center** — severity-ranked alerts with acknowledge and resolve workflows
- **Maintenance Orders** — full work order lifecycle (scheduled → in progress → completed) with asset linking
- **Analytics** — 30-day alert volume charts, asset health distribution, and fleet KPIs

---

## Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React + TypeScript |
| Routing | Wouter |
| State / Fetching | TanStack Query |
| UI Components | shadcn/ui + Tailwind CSS |
| Charts | Recharts |
| Build Tool | Vite |

### Backend
| Layer | Technology |
|---|---|
| API Server | Node.js + Express + TypeScript |
| Database ORM | Drizzle ORM |
| Validation | Zod |
| Logging | Pino |

### ML Model
| Layer | Technology |
|---|---|
| Framework | TensorFlow / Keras |
| Architecture | Attention-LSTM with custom decision layer |
| Dataset | NASA CMAPSS FD001 |
| Inference API | Gradio (hosted on Hugging Face Spaces) |
| Confidence | Monte Carlo Dropout (20 passes) |
| Deployment | Hugging Face Spaces |

---

## ML Model Architecture

The model uses a custom **AttentionLayer** built on top of an LSTM backbone:

```
Input (30 timesteps × 21 sensors)
  → LSTM layers
  → Custom Attention Layer (learns which timesteps matter most)
  → Dense decision layer
  → RUL output (cycles remaining)
```

Normalisation happens **inside** the model via a Keras `Normalization` layer, making deployment scaler-free. Confidence is estimated at inference time using Monte Carlo Dropout — the model runs 20 stochastic forward passes and reports the mean prediction with standard deviation.

**Health state thresholds:**
- 🟢 **Healthy** — RUL > 100 cycles
- 🟡 **Warning** — RUL 40–100 cycles
- 🔴 **Critical** — RUL < 40 cycles

---

## Project Structure

```
├── artifacts/
│   ├── predictive-maintenance/     # React frontend
│   │   └── src/
│   │       ├── pages/              # Dashboard, Assets, Alerts, Maintenance, Analytics, Predictor
│   │       ├── components/         # Layout, UI components
│   │       └── hooks/
│   └── api-server/                 # Express API
│       └── src/
│           └── routes/             # sensors, assets, alerts, maintenance, predictions, predict
├── lib/
│   └── db/                         # Drizzle schema + migrations
│       └── src/schema/             # assets, sensors, sensorReadings, alerts, maintenanceOrders, rulPredictions
└── pnpm-workspace.yaml
```

---

## Running Locally

### Prerequisites
- Node.js 18+
- pnpm
- PostgreSQL database

### Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/predictive-maintenance-platform.git
cd predictive-maintenance-platform

# Install dependencies
pnpm install

# Set environment variables
cp .env.example .env
# Add your DATABASE_URL to .env

# Push DB schema
pnpm db:push

# Start the API server
pnpm --filter api-server dev

# Start the frontend (in a new terminal)
pnpm --filter predictive-maintenance dev
```

The frontend runs on `http://localhost:5173` and the API on `http://localhost:3000`.

### ML Model (Hugging Face)
The RUL inference model is hosted on Hugging Face Spaces and called automatically by the API server. No local setup required for inference.

To run the model locally:

```bash
pip install gradio tensorflow numpy
python app.py
```

---

## Data & Limitations

The current version uses **simulated sensor data** modelled on the NASA CMAPSS FD001 dataset. The simulation generates realistic degradation curves across 21 sensor channels with configurable health profiles (healthy / warning / critical).

Real IoT sensor integration is architecturally supported — the sensor schema and readings table are designed to accept live data streams. Connecting a real data source requires implementing a sensor ingestion endpoint and pointing physical sensors at the `/api/sensors/:id/readings` route.

---

## Model Performance

| Metric | Value |
|---|---|
| Dataset | NASA CMAPSS FD001 |
| Input shape | (30 timesteps, 21 sensors) |
| Architecture | Attention-LSTM |
| Confidence method | Monte Carlo Dropout (n=20) |
| Preprocessing | In-model Normalization layer |

---

## Roadmap

- [ ] Live IoT sensor ingestion via MQTT or WebSocket
- [ ] Multi-engine fleet RUL comparison view
- [ ] Alert auto-generation from RUL threshold breaches
- [ ] Mobile navigation (hamburger menu)
- [ ] Export predictions to CSV

---

## Author

Built by Tanisha Suyal (https://github.com/Texas-rgb)

Model hosted on [Hugging Face Spaces](https://huggingface.co/spaces/Texas-rgb/aviation-predictive-maintenance)

---

## License

MIT
