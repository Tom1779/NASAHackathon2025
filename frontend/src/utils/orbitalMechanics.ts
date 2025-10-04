/**
 * Orbital Mechanics Utilities
 * Converts orbital elements to 3D positions using Keplerian orbital mechanics
 */

export interface OrbitalElements {
  // Semi-major axis (AU)
  a: number;
  // Eccentricity
  e: number;
  // Inclination (degrees)
  i: number;
  // Longitude of ascending node (degrees)
  om: number;
  // Argument of perihelion (degrees)
  w: number;
  // Mean anomaly (degrees)
  ma: number;
  // Epoch (Julian Date)
  epoch?: number;
}

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

const AU_TO_KM = 149597870.7; // 1 AU in kilometers
const DEG_TO_RAD = Math.PI / 180;

/**
 * Solve Kepler's equation to find eccentric anomaly
 * M = E - e * sin(E)
 * Using Newton-Raphson iteration
 */
function solveKeplersEquation(M: number, e: number, tolerance = 1e-6): number {
  let E = M; // Initial guess
  let delta = 1;
  let iterations = 0;
  const maxIterations = 30;

  while (Math.abs(delta) > tolerance && iterations < maxIterations) {
    delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= delta;
    iterations++;
  }

  return E;
}

/**
 * Calculate true anomaly from eccentric anomaly
 */
function eccentricToTrueAnomaly(E: number, e: number): number {
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);

  const cosv = (cosE - e) / (1 - e * cosE);
  const sinv = (Math.sqrt(1 - e * e) * sinE) / (1 - e * cosE);

  return Math.atan2(sinv, cosv);
}

/**
 * Convert orbital elements to heliocentric Cartesian coordinates
 * Returns position in AU
 */
export function orbitalElementsToPosition(elements: OrbitalElements): Position3D {
  const { a, e, i, om, w, ma } = elements;

  // Convert angles from degrees to radians
  const i_rad = i * DEG_TO_RAD;
  const om_rad = om * DEG_TO_RAD;
  const w_rad = w * DEG_TO_RAD;
  const M_rad = ma * DEG_TO_RAD;

  // Solve Kepler's equation for eccentric anomaly
  const E = solveKeplersEquation(M_rad, e);

  // Calculate true anomaly
  const v = eccentricToTrueAnomaly(E, e);

  // Calculate distance from Sun (in AU)
  const r = a * (1 - e * Math.cos(E));

  // Position in orbital plane
  const x_orb = r * Math.cos(v);
  const y_orb = r * Math.sin(v);

  // Rotation matrices to convert to heliocentric ecliptic coordinates
  const cos_om = Math.cos(om_rad);
  const sin_om = Math.sin(om_rad);
  const cos_w = Math.cos(w_rad);
  const sin_w = Math.sin(w_rad);
  const cos_i = Math.cos(i_rad);
  const sin_i = Math.sin(i_rad);

  // Apply rotation from orbital plane to ecliptic plane
  const x = (cos_om * cos_w - sin_om * sin_w * cos_i) * x_orb +
            (-cos_om * sin_w - sin_om * cos_w * cos_i) * y_orb;

  const y = (sin_om * cos_w + cos_om * sin_w * cos_i) * x_orb +
            (-sin_om * sin_w + cos_om * cos_w * cos_i) * y_orb;

  const z = (sin_w * sin_i) * x_orb + (cos_w * sin_i) * y_orb;

  return { x, y, z };
}

/**
 * Generate orbital trajectory points
 * Returns array of positions in AU along the orbit
 */
export function generateOrbitPath(
  elements: OrbitalElements,
  numPoints = 100
): Position3D[] {
  const points: Position3D[] = [];

  for (let i = 0; i < numPoints; i++) {
    const meanAnomaly = (360 * i) / numPoints; // degrees
    const position = orbitalElementsToPosition({
      ...elements,
      ma: meanAnomaly
    });
    points.push(position);
  }

  return points;
}

/**
 * Calculate mean anomaly at a given time
 * @param elements Orbital elements
 * @param julianDate Target Julian Date
 * @returns Mean anomaly in degrees
 */
export function calculateMeanAnomalyAtTime(
  elements: OrbitalElements,
  julianDate: number
): number {
  if (!elements.epoch) return elements.ma;

  // Calculate mean motion (degrees per day)
  // n = 360 / P, where P is orbital period in days
  // P = 2π √(a³/μ), for Sun μ = 1 (in AU³/day² units with appropriate scaling)
  // Simplified: P ≈ 365.25 * a^(3/2) for orbits around the Sun
  const period = 365.25 * Math.pow(elements.a, 1.5); // days
  const meanMotion = 360 / period; // degrees per day

  // Calculate time difference
  const dt = julianDate - elements.epoch; // days

  // Calculate mean anomaly at target time
  const ma = (elements.ma + meanMotion * dt) % 360;

  return ma;
}

/**
 * Convert AU to kilometers
 */
export function auToKm(au: number): number {
  return au * AU_TO_KM;
}

/**
 * Convert kilometers to AU
 */
export function kmToAu(km: number): number {
  return km / AU_TO_KM;
}

/**
 * Calculate orbital period in days
 */
export function calculateOrbitalPeriod(semiMajorAxis: number): number {
  // Kepler's third law: P² = a³ (with P in years and a in AU)
  // Convert to days: P(days) = P(years) * 365.25
  return 365.25 * Math.pow(semiMajorAxis, 1.5);
}

/**
 * Parse SBDB orbital elements data
 */
export function parseSbdbOrbitalElements(data: Record<string, unknown>): OrbitalElements | null {
  try {
    if (!data.orbit) return null;

    const orbit = data.orbit as Record<string, unknown>;
    const elements = (orbit.elements || []) as Array<Record<string, unknown>>;

    // SBDB returns elements in a specific order, we need to map them
    const elementMap: { [key: string]: number } = {};

    if (orbit.element_labels && orbit.element_values) {
      const labels = orbit.element_labels as string[];
      const values = orbit.element_values as string[];
      labels.forEach((label: string, index: number) => {
        const value = values[index];
        if (value !== undefined) {
          elementMap[label] = parseFloat(value);
        }
      });
    } else {
      // Fallback: assume elements array contains values in standard order
      elements.forEach((el: Record<string, unknown>) => {
        if (el.name && el.value !== undefined) {
          elementMap[el.name as string] = parseFloat(el.value as string);
        }
      });
    }

    return {
      a: elementMap['a'] || elementMap['semi-major axis'] || 1.0,
      e: elementMap['e'] || elementMap['eccentricity'] || 0.0,
      i: elementMap['i'] || elementMap['inclination'] || 0.0,
      om: elementMap['om'] || elementMap['node'] || elementMap['Omega'] || 0.0,
      w: elementMap['w'] || elementMap['peri'] || elementMap['omega'] || 0.0,
      ma: elementMap['ma'] || elementMap['M'] || elementMap['mean anomaly'] || 0.0,
      epoch: orbit.epoch ? parseFloat(String(orbit.epoch)) : undefined
    };
  } catch (error) {
    console.error('Error parsing SBDB orbital elements:', error);
    return null;
  }
}
