import { CONSTANTS, OrbitClassification, TrajectoryPoint } from '../types';

/**
 * Gravitational acceleration and drag calculations
 */
export function calculateAcceleration(
  x: number,
  y: number,
  vx: number,
  vy: number,
  enableDrag: boolean
): [number, number] {
  const r2 = x * x + y * y;
  const r = Math.sqrt(r2);

  if (r <= 1e-4) {
    return [0, 0];
  }

  // Pure Newtonian Gravitational Acceleration: a_g = -mu / r^3 * vec(r)
  const aGravMag = CONSTANTS.MU_KM / (r2 * r);
  let ax = -aGravMag * x;
  let ay = -aGravMag * y;

  // Atmospheric drag (if enabled and within atmospheric envelope)
  if (enableDrag) {
    const altitude = r - CONSTANTS.EARTH_RADIUS_KM;
    if (altitude > 0 && altitude < 150) {
      // Exponential barometric density: rho = rho_0 * exp(-h / H)
      // Units: density in kg/m^3.
      const rho = CONSTANTS.ATMOSPHERE_SURFACE_DENSITY * Math.exp(-altitude / CONSTANTS.ATMOSPHERE_SCALE_HEIGHT_KM);
      
      // Speed in km/s -> m/s for drag force computation
      const v_km_s = Math.sqrt(vx * vx + vy * vy);
      const v_m_s = v_km_s * 1000;
      
      // Drag acceleration: a_drag = 0.5 * rho * v^2 * (Cd * A / m) in m/s^2
      const a_drag_m_s2 = 0.5 * rho * v_m_s * v_m_s * CONSTANTS.DRAG_COEFFICIENT * CONSTANTS.AREA_TO_MASS_RATIO;
      // Convert to km/s^2
      const a_drag_km_s2 = a_drag_m_s2 / 1000;

      if (v_km_s > 1e-6) {
        // Drag opposes velocity vector
        ax -= a_drag_km_s2 * (vx / v_km_s);
        ay -= a_drag_km_s2 * (vy / v_km_s);
      }
    }
  }

  return [ax, ay];
}

/**
 * 4th-Order Runge-Kutta (RK4) integrator step
 * Highly stable and preserves energy without the secular drift of forward Euler.
 */
export function rk4Step(
  x: number,
  y: number,
  vx: number,
  vy: number,
  dt: number,
  enableDrag: boolean
): { x: number; y: number; vx: number; vy: number } {
  // k1
  const [ax1, ay1] = calculateAcceleration(x, y, vx, vy, enableDrag);
  const k1_vx = ax1 * dt;
  const k1_vy = ay1 * dt;
  const k1_x = vx * dt;
  const k1_y = vy * dt;

  // k2
  const x2 = x + 0.5 * k1_x;
  const y2 = y + 0.5 * k1_y;
  const vx2 = vx + 0.5 * k1_vx;
  const vy2 = vy + 0.5 * k1_vy;
  const [ax2, ay2] = calculateAcceleration(x2, y2, vx2, vy2, enableDrag);
  const k2_vx = ax2 * dt;
  const k2_vy = ay2 * dt;
  const k2_x = vx2 * dt;
  const k2_y = vy2 * dt;

  // k3
  const x3 = x + 0.5 * k2_x;
  const y3 = y + 0.5 * k2_y;
  const vx3 = vx + 0.5 * k2_vx;
  const vy3 = vy + 0.5 * k2_vy;
  const [ax3, ay3] = calculateAcceleration(x3, y3, vx3, vy3, enableDrag);
  const k3_vx = ax3 * dt;
  const k3_vy = ay3 * dt;
  const k3_x = vx3 * dt;
  const k3_y = vy3 * dt;

  // k4
  const x4 = x + k3_x;
  const y4 = y + k3_y;
  const vx4 = vx + k3_vx;
  const vy4 = vy + k3_vy;
  const [ax4, ay4] = calculateAcceleration(x4, y4, vx4, vy4, enableDrag);
  const k4_vx = ax4 * dt;
  const k4_vy = ay4 * dt;
  const k4_x = vx4 * dt;
  const k4_y = vy4 * dt;

  // Combined state update
  const newX = x + (k1_x + 2 * k2_x + 2 * k3_x + k4_x) / 6;
  const newY = y + (k1_y + 2 * k2_y + 2 * k3_y + k4_y) / 6;
  const newVx = vx + (k1_vx + 2 * k2_vx + 2 * k3_vx + k4_vx) / 6;
  const newVy = vy + (k1_vy + 2 * k2_vy + 2 * k3_vy + k4_vy) / 6;

  return { x: newX, y: newY, vx: newVx, vy: newVy };
}

/**
 * Compute orbital characteristics from state vector
 */
export function computeOrbitalElements(x: number, y: number, vx: number, vy: number) {
  const r = Math.sqrt(x * x + y * y);
  const v = Math.sqrt(vx * vx + vy * vy);
  
  // Specific energies (km^2 / s^2 = MJ / kg)
  const k = 0.5 * v * v;
  const u = -CONSTANTS.MU_KM / r;
  const epsilon = k + u; // Total specific mechanical energy
  
  // Specific angular momentum h = r x v in 2D = x * vy - y * vx
  const h = x * vy - y * vx;
  
  // Eccentricity vector e_vec = (v x h)/mu - r_vec / r
  // (v x h)_x = vy * h
  // (v x h)_y = -vx * h
  const ex = (vy * h) / CONSTANTS.MU_KM - x / r;
  const ey = (-vx * h) / CONSTANTS.MU_KM - y / r;
  const e = Math.sqrt(ex * ex + ey * ey);
  
  // Semi-major axis a = -mu / (2 * epsilon)
  let a = 0;
  let periapsis = 0;
  let apoapsis = 0;
  let periodMin: number | null = null;
  
  if (Math.abs(epsilon) > 1e-5) {
    a = -CONSTANTS.MU_KM / (2 * epsilon);
  } else {
    a = Infinity; // Parabolic
  }

  // Periapsis and Apoapsis
  if (e < 1 && a > 0) {
    periapsis = a * (1 - e);
    apoapsis = a * (1 + e);
    // Period T = 2 * pi * sqrt(a^3 / mu) in seconds
    const periodSec = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / CONSTANTS.MU_KM);
    periodMin = periodSec / 60;
  } else if (e >= 1) {
    // Parabolic / Hyperbolic
    const p = (h * h) / CONSTANTS.MU_KM; // semi-latus rectum
    periapsis = p / (1 + e);
    apoapsis = Infinity;
  }

  // Orbit classification
  let orbitType: OrbitClassification = 'suborbital_crash';
  if (periapsis < CONSTANTS.EARTH_RADIUS_KM) {
    orbitType = 'suborbital_crash';
  } else if (e < 0.015) {
    orbitType = 'circular';
  } else if (e < 1.0) {
    orbitType = 'elliptical';
  } else if (Math.abs(e - 1.0) < 0.01) {
    orbitType = 'parabolic';
  } else {
    orbitType = 'hyperbolic';
  }

  return {
    r,
    v,
    altitude: r - CONSTANTS.EARTH_RADIUS_KM,
    specificKineticEnergy: k,
    specificPotentialEnergy: u,
    totalSpecificEnergy: epsilon,
    eccentricity: e,
    eccentricityVector: { x: ex, y: ey },
    semiMajorAxis: a,
    periapsis,
    apoapsis,
    periodMin,
    orbitType,
  };
}

/**
 * Critical velocity thresholds at radius r0
 */
export function getCriticalVelocities(r0: number) {
  // Circular orbit speed v_orbit = sqrt(GM / r0)
  const vOrbit = Math.sqrt(CONSTANTS.MU_KM / r0);
  // Escape speed v_escape = sqrt(2 * GM / r0)
  const vEscape = Math.sqrt((2 * CONSTANTS.MU_KM) / r0);
  return { vOrbit, vEscape };
}

/**
 * Generate theoretical Keplerian trajectory path points for preview
 */
export function generateKeplerianPreview(
  x0: number,
  y0: number,
  vx0: number,
  vy0: number,
  numPoints: number = 360
): { x: number; y: number }[] {
  const elements = computeOrbitalElements(x0, y0, vx0, vy0);
  const { eccentricity: e, eccentricityVector } = elements;
  const h = x0 * vy0 - y0 * vx0;
  const p = (h * h) / CONSTANTS.MU_KM; // semi-latus rectum = a * (1 - e^2)

  if (p <= 1e-4) return [];

  // Angle of periapsis omega
  const omega = Math.atan2(eccentricityVector.y, eccentricityVector.x);

  const points: { x: number; y: number }[] = [];

  if (e < 0.999) {
    // Closed ellipse or circle: sweep true anomaly theta from 0 to 2*pi
    for (let i = 0; i <= numPoints; i++) {
      const theta = (i / numPoints) * 2 * Math.PI;
      const r = p / (1 + e * Math.cos(theta));
      const trueAngle = theta + omega;
      const x = r * Math.cos(trueAngle);
      const y = r * Math.sin(trueAngle);
      points.push({ x, y });
    }
  } else {
    // Unbound orbit (parabola or hyperbola)
    // True anomaly is bounded by asymptote: cos(theta_inf) = -1/e
    const thetaLimit = e > 1.0001 ? Math.acos(-1 / e) * 0.92 : Math.PI * 0.78;
    const startTheta = -thetaLimit;
    const endTheta = thetaLimit;

    for (let i = 0; i <= numPoints; i++) {
      const theta = startTheta + (i / numPoints) * (endTheta - startTheta);
      const r = p / (1 + e * Math.cos(theta));
      if (r > 0 && r < CONSTANTS.EARTH_RADIUS_KM * 25) {
        const trueAngle = theta + omega;
        const x = r * Math.cos(trueAngle);
        const y = r * Math.sin(trueAngle);
        points.push({ x, y });
      }
    }
  }

  return points;
}
