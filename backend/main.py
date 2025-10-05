"""Main FastAPI application for Asteroid Composition Analysis API."""

import json
import logging
import os
from pathlib import Path
from typing import Any, AsyncGenerator

import httpx
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# region: Logging and Environment Configuration
# ==============================================================================
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Load environment variables from .env file in the config folder
try:
    env_path = Path(__file__).resolve().parents[1] / "config" / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
        logger.info("Successfully loaded environment variables from %s.", env_path)
    else:
        logger.info("No .env file found in config folder; using environment variables.")
except Exception as e:
    logger.warning(
        "Could not load .env file. "
        "Ensure you are in the correct working directory. Error: %s",
        e,
    )

# Get allowed origins from environment variable, defaulting to localhost for development
ALLOWED_ORIGINS_STR = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_STR.split(",")]
# endregion

# region: FastAPI Application Setup
# ==============================================================================
app = FastAPI(title="Asteroid Composition Analysis API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# endregion

# region: OpenRouter API Configuration and Models
# ==============================================================================
openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
APP_URL = os.getenv("APP_URL", "http://localhost:3000")

if not openrouter_api_key:
    logger.warning(
        "OPENROUTER_API_KEY environment variable is not set. "
        "Chat functionality will not work."
    )

# Model settings
DEFAULT_MODEL = "google/gemini-2.0-flash-exp:free"
ADVANCED_MODEL = "anthropic/claude-3.5-sonnet:beta"
FALLBACK_MODEL = "meta-llama/llama-3.2-3b-instruct:free"
MAX_TOKENS = 2500
# endregion


# region: Pydantic Models
# ==============================================================================
class AsteroidData(BaseModel):
    """Represents asteroid data for composition analysis."""

    name: str
    id: str
    spectral_type: str | None = None
    albedo: float | None = None
    absolute_magnitude: float | None = None
    estimated_diameter_km: float | None = None
    orbital_period_days: float | None = None
    semi_major_axis_au: float | None = None
    eccentricity: float | None = None
    inclination_deg: float | None = None
    additional_data: dict[str, Any] | None = None


class CompositionRequest(BaseModel):
    """Request model for asteroid composition analysis."""

    asteroid: AsteroidData
    use_streaming: bool = True


# endregion


# region: OpenRouter Service Logic
# ==============================================================================
def build_composition_prompt(asteroid: AsteroidData) -> str:
    """Builds a detailed prompt for the LLM to analyze asteroid composition."""
    prompt = f"""You are an expert planetary scientist specializing in asteroid composition analysis.

Analyze the following asteroid data and provide a detailed composition estimate:

Asteroid Name: {asteroid.name}
Asteroid ID: {asteroid.id}
"""

    if asteroid.spectral_type:
        prompt += f"Spectral Type: {asteroid.spectral_type}\n"
    if asteroid.albedo is not None:
        prompt += f"Albedo: {asteroid.albedo}\n"
    if asteroid.absolute_magnitude is not None:
        prompt += f"Absolute Magnitude (H): {asteroid.absolute_magnitude}\n"
    if asteroid.estimated_diameter_km is not None:
        prompt += f"Estimated Diameter: {asteroid.estimated_diameter_km} km\n"
    if asteroid.orbital_period_days is not None:
        prompt += f"Orbital Period: {asteroid.orbital_period_days} days\n"
    if asteroid.semi_major_axis_au is not None:
        prompt += f"Semi-major Axis: {asteroid.semi_major_axis_au} AU\n"
    if asteroid.eccentricity is not None:
        prompt += f"Eccentricity: {asteroid.eccentricity}\n"
    if asteroid.inclination_deg is not None:
        prompt += f"Inclination: {asteroid.inclination_deg}°\n"

    if asteroid.additional_data:
        prompt += "\nAdditional Data:\n"
        for key, value in asteroid.additional_data.items():
            prompt += f"  {key}: {value}\n"

    prompt += """
Based on this data, provide:
1. **Primary Composition**: What minerals and materials are most likely present
2. **Spectral Class Analysis**: Detailed interpretation of the spectral type (if provided)
3. **Surface Characteristics**: Expected surface features and properties
4. **Formation History**: Likely formation environment and evolution
5. **Comparison**: How this asteroid compares to known asteroid families
6. **Scientific Value**: Potential research or resource value

Format your response in clear sections with detailed explanations based on current planetary science knowledge.
"""
    return prompt


def get_system_prompt() -> str:
    """Gets the system prompt for asteroid composition analysis."""
    return """You are an expert planetary scientist with deep knowledge of:
- Asteroid spectral classification (C, S, M, X-type asteroids and subtypes)
- Mineralogical composition analysis
- Photometric properties and their implications
- Orbital dynamics and asteroid families
- Meteorite analogs and composition
- Space weathering effects
- Asteroid formation and evolution

Provide scientifically accurate, detailed analysis based on the available data. 
When spectral type is available, use it as the primary indicator for composition.
Explain your reasoning and cite relevant asteroid families or well-studied examples when applicable.
Be specific about confidence levels and acknowledge uncertainties where appropriate."""


def _prepare_request_payload(
    model: str, system_prompt: str, user_prompt: str, stream: bool
) -> dict[str, Any]:
    """Prepares the JSON payload for the OpenRouter API request."""
    return {
        "model": model,
        "models": [model, FALLBACK_MODEL],
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "max_tokens": MAX_TOKENS,
        "temperature": 0.7,
        "stream": stream,
    }


def _prepare_headers() -> dict[str, str]:
    """Prepares the headers for the OpenRouter API request."""
    return {
        "Authorization": f"Bearer {openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": APP_URL,
        "X-Title": "Asteroid Composition Analyzer",
    }


async def _process_stream_chunk(chunk: str, buffer: str) -> tuple[str, str]:
    """Processes a single chunk from the streaming response."""
    buffer += chunk
    lines = buffer.split("\n")
    buffer = lines[-1]
    processed_data = ""
    for line in lines[:-1]:
        if line.startswith("data:") and line.strip() != "data: [DONE]":
            try:
                json_str = line[5:].strip()
                if json_str:
                    chunk_data = json.loads(json_str)
                    content = (
                        chunk_data.get("choices", [{}])[0]
                        .get("delta", {})
                        .get("content", "")
                    )
                    if content:
                        data_to_yield = {"content": content}
                        processed_data += f"data: {json.dumps(data_to_yield)}\n\n"
            except json.JSONDecodeError:
                logger.warning("Incomplete JSON chunk received: %s", line)
        elif line.strip() == "data: [DONE]":
            processed_data += "data: [DONE]\n\n"
            break
    return processed_data, buffer


async def generate_streaming_response(
    json_data: dict[str, Any],
) -> AsyncGenerator[str, None]:
    """Generates a streaming response from OpenRouter."""
    url = "https://openrouter.ai/api/v1/chat/completions"
    try:
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST", url, headers=_prepare_headers(), json=json_data, timeout=90.0
            ) as response:
                response.raise_for_status()
                buffer = ""
                async for chunk in response.aiter_bytes():
                    if chunk.strip():
                        processed_data, buffer = await _process_stream_chunk(
                            chunk.decode("utf-8"), buffer
                        )
                        if processed_data:
                            yield processed_data
                if not buffer.strip().endswith("[DONE]"):
                    yield "data: [DONE]\n\n"
    except httpx.HTTPStatusError as e:
        error_detail = e.response.text or f"Status {e.response.status_code}"
        logger.error(
            "OpenRouter HTTPStatusError: %s - %s", e.response.status_code, error_detail
        )
        error_content = {
            "error": f"OpenRouter API error ({e.response.status_code}): {error_detail}"
        }
        yield f"data: {json.dumps(error_content)}\n\n"
        yield "data: [DONE]\n\n"
    except Exception as e:
        logger.error("Unexpected error during streaming: %s", e, exc_info=True)
        error_content = {"error": f"Unexpected error: {e}"}
        yield f"data: {json.dumps(error_content)}\n\n"
        yield "data: [DONE]\n\n"


# endregion


# region: API Endpoints
# ==============================================================================
@app.get("/")
async def root():
    """Root endpoint providing API information."""
    return {
        "message": "Asteroid Composition Analysis API",
        "version": "0.1.0",
        "endpoints": {
            "/analyze": "POST - Analyze asteroid composition",
            "/health": "GET - Health check",
        },
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "openrouter_configured": bool(openrouter_api_key),
    }


@app.options("/analyze")
async def options_analyze():
    """Handles OPTIONS requests for CORS preflight."""
    return {"message": "OK"}


@app.post("/analyze")
async def analyze_composition(request: CompositionRequest):
    """Analyzes asteroid composition based on spectral and orbital data."""
    if not openrouter_api_key:
        raise HTTPException(
            status_code=500, detail="OpenRouter API key is not configured."
        )

    try:
        # Select model based on data complexity
        selected_model = (
            ADVANCED_MODEL if request.asteroid.spectral_type else DEFAULT_MODEL
        )

        # Build prompts
        system_prompt = get_system_prompt()
        user_prompt = build_composition_prompt(request.asteroid)

        json_data = _prepare_request_payload(
            selected_model, system_prompt, user_prompt, request.use_streaming
        )

        logger.info(
            "Analyzing composition for asteroid: %s (model: %s, streaming: %s)",
            request.asteroid.name,
            selected_model,
            request.use_streaming,
        )

        if request.use_streaming:
            return StreamingResponse(
                generate_streaming_response(json_data),
                media_type="text/event-stream",
            )

        # Non-streaming logic
        headers = _prepare_headers()
        url = "https://openrouter.ai/api/v1/chat/completions"
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url, headers=headers, json=json_data, timeout=90.0
            )
            response.raise_for_status()
            response_data = response.json()

            # Extract the composition analysis from the response
            content = (
                response_data.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "")
            )

            return {
                "asteroid_name": request.asteroid.name,
                "asteroid_id": request.asteroid.id,
                "analysis": content,
                "model_used": selected_model,
            }

    except httpx.HTTPStatusError as e:
        logger.error("HTTP error: %s - %s", e.response.status_code, e.response.text)
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"OpenRouter API error: {e.response.text}",
        )
    except Exception as e:
        logger.exception("Unexpected critical error in analyze endpoint: %s", e)
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {e}"
        )


# endregion


# region: Main Execution
# ==============================================================================
def main():
    """Runs the FastAPI app."""
    logger.info("Starting Asteroid Composition Analysis API server")
    uvicorn.run("main:app", host="127.0.0.1", port=8157, reload=True)


if __name__ == "__main__":
    main()
# endregion
