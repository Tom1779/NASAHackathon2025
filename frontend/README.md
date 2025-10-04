# Meteor Madness - Frontend

A Vue 3 + PrimeVue application for the NASA Space Apps Challenge 2025 - Meteor Madness mission.

## Overview

This frontend application provides an interactive interface for exploring asteroids and estimating their worth based on chemical composition. The app features:

- **Asteroid Selection**: Browse and select from NASA's Near Earth Object database
- **3D Visualization Space**: Reserved area for Three.js asteroid simulation (integration pending)
- **Detailed Information**: Comprehensive asteroid data including size estimates, orbital data, and hazard assessment
- **Worth Estimation**: Placeholder for chemical composition analysis and value calculation

## Project Structure

```
src/
├── components/           # Reusable Vue components (future)
├── composables/          # Vue composition functions
│   └── useAsteroids.ts  # Asteroid data management
├── types/               # TypeScript type definitions
│   └── asteroid.ts      # Asteroid-related types
├── assets/             # Static assets and styles
└── App.vue             # Main application component
```

## Features

### Current Implementation

- Responsive design with space-themed dark UI
- Asteroid selection dropdown with search capability
- Real-time asteroid information display
- Size estimates in multiple units (km, m, miles, feet)
- Close approach data visualization
- Hazard assessment indicators

### Integration Points for Team Members

- **3D Simulation**: Component ready for Three.js integration in the designated simulation area
- **API Integration**: `useAsteroids.ts` composable ready to replace mock data with actual NASA API calls
- **Worth Calculation**: Placeholder section ready for chemical composition analysis integration

## Technology Stack

- **Vue 3** - Progressive JavaScript framework
- **PrimeVue** - UI component library with space theme customization
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and development server

## Data Structure

The app expects asteroid data in NASA's NEO API format:

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
