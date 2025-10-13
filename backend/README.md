# Asteroid Composition Analysis API

An LLM-powered API that analyzes asteroid composition based on spectral data, orbital parameters, and physical characteristics.

## Features

- **Spectral Analysis**: Interprets spectral type (C, S, M, X-type asteroids) to determine composition
- **Composition Estimation**: Provides detailed mineralogical composition based on available data
- **Scientific Context**: Compares asteroids to known families and meteorite analogs
- **Streaming Support**: Real-time streaming responses for better UX
- **Robust Error Handling**: Comprehensive error handling and logging

## Setup

### Prerequisites

- Python 3.10 or higher
- Poetry package manager

### Installation

1. Install Poetry if you haven't already:
```bash
curl -sSL https://install.python-poetry.org | python3 -
```

2. Install dependencies:
```bash
cd backend
poetry install
```

3. The API key is already configured in `/config/.env`

### Running the Server

Start the development server:
```bash
poetry run python main.py
```

Or use uvicorn directly:
```bash
poetry run uvicorn main:app --reload --host 127.0.0.1 --port 8157
```

The API will be available at `http://127.0.0.1:8157`

## API Endpoints

### GET `/`
Root endpoint providing API information.

### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "openrouter_configured": true
}
```

### POST `/analyze`
Analyzes asteroid composition based on provided data.

**Request Body:**
```json
{
  "asteroid": {
    "name": "1 Ceres",
    "id": "20000001",
    "spectral_type": "C",
    "albedo": 0.09,
    "absolute_magnitude": 3.34,
    "estimated_diameter_km": 939.4,
    "orbital_period_days": 1681.6,
    "semi_major_axis_au": 2.767,
    "eccentricity": 0.076,
    "inclination_deg": 10.59
  },
  "use_streaming": true
}
```

**Response (Non-streaming):**
```json
{
  "asteroid_name": "1 Ceres",
  "asteroid_id": "20000001",
  "analysis": "Detailed composition analysis...",
  "model_used": "google/gemini-2.0-flash-exp:free"
}
```

**Response (Streaming):**
Server-Sent Events (SSE) stream with progressive content delivery.

## Data Model

### AsteroidData

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Asteroid name |
| `id` | string | Yes | Asteroid identifier |
| `spectral_type` | string | No | Spectral classification (C, S, M, etc.) |
| `albedo` | float | No | Surface reflectivity (0-1) |
| `absolute_magnitude` | float | No | Absolute magnitude (H) |
| `estimated_diameter_km` | float | No | Diameter in kilometers |
| `orbital_period_days` | float | No | Orbital period in days |
| `semi_major_axis_au` | float | No | Semi-major axis in AU |
| `eccentricity` | float | No | Orbital eccentricity |
| `inclination_deg` | float | No | Orbital inclination in degrees |
| `additional_data` | object | No | Additional parameters |

## LLM Models

The API uses different models based on data availability:

- **Advanced Model** (`anthropic/claude-3.5-sonnet:beta`): Used when spectral type is available
- **Default Model** (`google/gemini-2.0-flash-exp:free`): Used for general analysis
- **Fallback Model** (`meta-llama/llama-3.2-3b-instruct:free`): Backup if primary fails

## Development

### Running Tests
```bash
poetry run pytest
```

### Code Formatting
```bash
poetry run black .
```

### Linting
```bash
poetry run ruff check .
```

## Environment Variables

All environment variables are stored in `/config/.env`:

- `OPENROUTER_API_KEY`: OpenRouter API key
- `ALLOWED_ORIGINS`: CORS allowed origins (comma-separated)
- `APP_URL`: Application URL for referer header

## CORS Configuration

The API is configured to accept requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alternative dev port)

## License

MIT
