# NASA Hackathon 2025 - Meteor Madness

A comprehensive asteroid exploration and valuation platform for the NASA Space Apps Challenge 2025.

## 🚀 Overview

This project provides tools to explore Near-Earth Objects (NEOs), analyze their composition, estimate economic value, and visualize asteroid trajectories in 3D. It combines NASA's NEO data with advanced algorithms for asteroid valuation and interactive web interfaces.

## 🏗️ Architecture

- **Frontend**: Vue 3 + PrimeVue application for asteroid selection, valuation, and 3D visualization
- **Backend**: FastAPI service for asteroid composition analysis using LLM technology
- **Data**: NASA NEO API integration with local caching and GitHub-hosted chunked data

## 📁 Documentation

See the [`docs/`](./docs/) folder for detailed documentation:

- [Project Plan](./docs/project-plan.md)
- [Backend API](./docs/backend-api.md)
- [Frontend Overview](./docs/frontend-overview.md)
- [Data Fetching](./docs/data-fetching.md)
- [3D Visualization](./docs/3d-visualization.md)
- [Profit Model](./docs/profit-model.md)
- [Valuation Process](./docs/valuation-process.md)
- [Resources](./docs/resources.md)

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- Poetry (for backend)

### Setup

1. Clone the repository

2. **Setup Backend**:
   ```bash
   cd backend
   poetry install
   poetry run uvicorn main:app --reload
   ```

3. **Setup Frontend**:
   ```bash
   cd frontend
   pnpm install
   pnpm run dev
   ```

4. Open `http://localhost:5173` in your browser.

## 🤝 Contributing

See [Project Plan](./docs/project-plan.md) for current tasks and roadmap.

## 📄 License

This project is part of the NASA Space Apps Challenge 2025.
