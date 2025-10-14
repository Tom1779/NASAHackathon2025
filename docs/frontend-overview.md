# Meteor Madness - Frontend

A Vue 3 + PrimeVue application for the NASA Space Apps Challenge 2025 - Meteor Madness mission.

## 🚀 Overview

This frontend application provides an interactive interface for exploring asteroids and estimating their worth based on chemical composition. Built with modern web technologies and optimized for performance.

### ✨ Key Features

- **🔍 Asteroid Selection**: Interactive dropdown with NASA's Near Earth Object data
- **🌌 3D Visualization Space**: Ready for Three.js asteroid simulation integration
- **📊 Detailed Analytics**: Comprehensive asteroid data including size estimates and orbital information
- **💎 Worth Estimation**: Chemical composition analysis and value calculation interface
- **📱 Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **🎨 Space Theme**: Dark UI with purple accents and performance-optimized styling

## 🏗️ Architecture

### Component Structure

```
src/
├── components/           # Modular Vue components
│   ├── AppHeader.vue        # Application header with branding
│   ├── AsteroidSelector.vue # Asteroid selection and quick stats
│   ├── AsteroidSimulation.vue # 3D visualization container
│   ├── AsteroidDetails.vue  # Basic info and size estimates
│   ├── CloseApproachData.vue # Orbital data with responsive table
│   └── WorthEstimation.vue  # Chemical analysis placeholder
├── composables/          # Vue composition functions
│   └── useAsteroids.ts      # Asteroid data management and API calls
├── types/               # TypeScript definitions
│   └── asteroid.ts          # NASA API compatible types
├── assets/              # Global styles and utilities
│   └── main.css            # Custom CSS with PrimeVue theme overrides
└── App.vue              # Main application orchestrator
```

### 🔧 Technology Stack

- **Vue 3** with Composition API and `<script setup>`
- **TypeScript** with strict type checking enabled
- **PrimeVue 4** - Professional UI component library
- **PrimeIcons** - Comprehensive icon set
- **Vite** - Lightning-fast build tool
- **ESLint + Prettier** - Code quality and formatting

## 🎯 Team Integration Points

### For 3D Simulation Developer

- **Component**: `AsteroidSimulation.vue`
- **Props**: Receives `selectedAsteroid` object with all NASA data
- **Container**: Pre-styled 3D visualization area ready for Three.js integration

### For Backend/API Developer

- **Composable**: `useAsteroids.ts`
- **Data Source**: Loads from GitHub-hosted chunked JSON files, with an in-memory cache.
- **Backend Integration**: Connects to a FastAPI backend for detailed asteroid composition analysis using LLM technology.
- **Types**: Use `Asteroid` interface for type safety

### For Chemical Analysis Integration

- **Component**: `WorthEstimation.vue`
- **Backend API**: Integrates with FastAPI `/analyze-composition` endpoint for LLM-based composition analysis
- **Enhancement**: Add composition data to `Asteroid` type
- **UI**: Ready-to-use card layout for displaying calculated worth

## 🔗 Backend Integration

The frontend integrates with a FastAPI backend for advanced asteroid analysis:

- **Composition Analysis**: LLM-powered analysis of asteroid materials and economic value
- **API Endpoints**: `/analyze-composition` for detailed asteroid breakdown
- **Error Handling**: Graceful fallbacks when backend is unavailable
- **Async Processing**: Non-blocking API calls with loading states

## 🚀 Performance Optimizations

- **No Backdrop Blur**: Removed `backdrop-filter: blur()` for better Chrome performance
- **Optimized Backgrounds**: Solid transparency instead of GPU-intensive effects
- **Responsive Tables**: Mobile-optimized with smaller fonts on small screens
- **Component Splitting**: Modular architecture for better bundle optimization

## 📋 Data Structure

The application uses NASA's Near Earth Object API format:

```typescript
interface Asteroid {
  id: string
  name: string
  absolute_magnitude_h: number
  estimated_diameter: {
    kilometers: { estimated_diameter_min: number; estimated_diameter_max: number }
    meters: { estimated_diameter_min: number; estimated_diameter_max: number }
    // ... other units
  }
  is_potentially_hazardous_asteroid: boolean
  close_approach_data: Array<{
    close_approach_date: string
    relative_velocity: { kilometers_per_hour: string }
    miss_distance: { kilometers: string }
    orbiting_body: string
  }>
  // ... additional NASA API fields
}
```

## 🛠️ Development Setup

### Prerequisites

- **Node.js** 20.19.0+ or 22.12.0+
- **pnpm** (recommended) or npm

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:5173
```

### Development Commands

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
pnpm build

# Runs the end-to-end tests
pnpm test:e2e
# Runs the tests only on Chromium
pnpm test:e2e --project=chromium
# Runs the tests of a specific file
pnpm test:e2e tests/example.spec.ts
# Runs the tests in debug mode
pnpm test:e2e --debug
```

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
```
