#!/usr/bin/env python3
"""Test script for the Asteroid Composition Analysis API."""

import json
import httpx

# API endpoint
BASE_URL = "http://127.0.0.1:8157"


def test_health():
    """Test the health endpoint."""
    print("Testing /health endpoint...")
    with httpx.Client() as client:
        response = client.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()


def test_root():
    """Test the root endpoint."""
    print("Testing / endpoint...")
    with httpx.Client() as client:
        response = client.get(f"{BASE_URL}/")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()


def test_analyze_ceres():
    """Test composition analysis for 1 Ceres (C-type asteroid)."""
    print("Testing /analyze endpoint with 1 Ceres (C-type asteroid)...")

    asteroid_data = {
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
            "inclination_deg": 10.59,
        },
        "use_streaming": False,  # Non-streaming for easier testing
    }

    with httpx.Client(timeout=60.0) as client:
        response = client.post(f"{BASE_URL}/analyze", json=asteroid_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Asteroid: {result['asteroid_name']} ({result['asteroid_id']})")
            print(f"Model: {result['model_used']}")
            print(f"\nAnalysis:\n{result['analysis']}")
        else:
            print(f"Error: {response.text}")
    print()


def test_analyze_vesta():
    """Test composition analysis for 4 Vesta (V-type asteroid)."""
    print("Testing /analyze endpoint with 4 Vesta (V-type asteroid)...")

    asteroid_data = {
        "asteroid": {
            "name": "4 Vesta",
            "id": "20000004",
            "spectral_type": "V",
            "albedo": 0.423,
            "absolute_magnitude": 3.20,
            "estimated_diameter_km": 525.4,
            "orbital_period_days": 1325.46,
            "semi_major_axis_au": 2.362,
            "eccentricity": 0.089,
            "inclination_deg": 7.14,
        },
        "use_streaming": False,
    }

    with httpx.Client(timeout=60.0) as client:
        response = client.post(f"{BASE_URL}/analyze", json=asteroid_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Asteroid: {result['asteroid_name']} ({result['asteroid_id']})")
            print(f"Model: {result['model_used']}")
            print(f"\nAnalysis:\n{result['analysis']}")
        else:
            print(f"Error: {response.text}")
    print()


def test_analyze_minimal():
    """Test composition analysis with minimal data."""
    print("Testing /analyze endpoint with minimal data...")

    asteroid_data = {
        "asteroid": {
            "name": "Test Asteroid",
            "id": "99999999",
        },
        "use_streaming": False,
    }

    with httpx.Client(timeout=60.0) as client:
        response = client.post(f"{BASE_URL}/analyze", json=asteroid_data)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Asteroid: {result['asteroid_name']} ({result['asteroid_id']})")
            print(f"Model: {result['model_used']}")
            print(f"\nAnalysis:\n{result['analysis'][:500]}...")  # Show first 500 chars
        else:
            print(f"Error: {response.text}")
    print()


if __name__ == "__main__":
    print("=" * 80)
    print("Asteroid Composition Analysis API Test")
    print("=" * 80)
    print()

    try:
        # Basic endpoint tests
        test_health()
        test_root()

        # Composition analysis tests
        test_analyze_ceres()
        # test_analyze_vesta()  # Uncomment to test another asteroid
        # test_analyze_minimal()  # Uncomment to test minimal data

        print("=" * 80)
        print("Tests completed!")
        print("=" * 80)

    except httpx.ConnectError:
        print("ERROR: Cannot connect to the API. Make sure the server is running.")
    except Exception as e:
        print(f"ERROR: {e}")
