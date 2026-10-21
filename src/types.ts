// Physical and Astronomical Constants for Earth and Gravitational Dynamics

export const CONSTANTS = {
  // Universal Gravitational Constant G (m^3 kg^-1 s^-2)
  G: 6.67430e-11,
  // Earth Mass M (kg)
  EARTH_MASS: 5.97219e24,
  // Standard Gravitational Parameter mu = GM (km^3 / s^2)
  MU_KM: 398600.4418, // 3.986004418e5 km^3/s^2
  // Earth Mean Radius (km)
  EARTH_RADIUS_KM: 6371.0,
  // Atmospheric parameters for drag simulation
  ATMOSPHERE_SCALE_HEIGHT_KM: 8.5, // km
  ATMOSPHERE_SURFACE_DENSITY: 1.225, // kg/m^3
  DRAG_COEFFICIENT: 2.2, // satellite drag coefficient
  AREA_TO_MASS_RATIO: 0.01, // m^2 / kg typical
  // Earth axial rotation period (seconds)
  EARTH_ROTATION_PERIOD_S: 86164, // 1 sidereal day
};

export type OrbitClassification = 
  | 'suborbital_crash'
  | 'circular'
  | 'elliptical'
  | 'parabolic'
  | 'hyperbolic';

export interface TrajectoryPoint {
  x: number; // km
  y: number; // km
  vx: number; // km/s
  vy: number; // km/s
  t: number; // seconds
}

export interface SimulationState {
  // Current dynamic state
  x: number; // km (relative to Earth center)
  y: number; // km
  vx: number; // km/s
  vy: number; // km/s
  time: number; // elapsed simulation seconds
  
  // Status flags
  isRunning: boolean;
  isFired: boolean;
  hasCrashed: boolean;
  hasEscaped: boolean;
  isChallengeMode: boolean;

  // History trail
  trail: TrajectoryPoint[];
  
  // Orbit summary
  orbitType: OrbitClassification;
  altitude: number; // km
  distance: number; // km
  speed: number; // km/s
  eccentricity: number;
  semiMajorAxis: number; // km
  periapsis: number; // km
  apoapsis: number; // km
  orbitalPeriodMinutes: number | null; // min
  revolutions?: number; // count of completed 360-degree orbits around Earth
  
  // Specific energies (MJ/kg or km^2/s^2)
  specificKineticEnergy: number; // km^2/s^2 = MJ/kg
  specificPotentialEnergy: number; // km^2/s^2
  totalSpecificEnergy: number; // km^2/s^2
}

export interface SimulationParams {
  initialSpeed: number; // km/s (0 - 16)
  mountainHeight: number; // km (0 - 2000)
  launchAngleDeg: number; // degrees from horizontal (-30 to +30)
  enableDrag: boolean; // toggle air resistance
  simSpeedMultiplier: number; // 0.1x to 100x
}

export interface Challenge {
  id: string;
  titleEn: string;
  titleBn: string;
  descriptionEn: string;
  descriptionBn: string;
  targetCriteriaEn: string;
  targetCriteriaBn: string;
  hintEn: string;
  hintBn: string;
  presetParams?: Partial<SimulationParams>;
  isCompleted: boolean;
  evaluate: (state: SimulationState, params: SimulationParams) => boolean;
}

export type LanguageMode = 'bilingual' | 'en' | 'bn';
export type ThemeMode = 'dark' | 'light';
