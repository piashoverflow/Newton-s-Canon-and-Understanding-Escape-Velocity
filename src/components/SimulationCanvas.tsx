import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CONSTANTS, LanguageMode, SimulationParams, SimulationState, TrajectoryPoint } from '../types';
import { generateKeplerianPreview } from '../physics/engine';
import { ZoomIn, ZoomOut, Maximize2, Compass, Eye, ShieldAlert, Maximize, Minimize, RotateCcw } from 'lucide-react';

interface SimulationCanvasProps {
  state: SimulationState;
  params: SimulationParams;
  vectorToggles: {
    velocity: boolean;
    gravity: boolean;
    acceleration: boolean;
    preview: boolean;
    trail: boolean;
    hudGrid: boolean;
  };
  cameraMode: 'earth' | 'projectile';
  onToggleCameraMode: () => void;
  muzzleFlashTrigger: number;
  crashExplosionTrigger: number;
  theme?: 'dark' | 'light';
  languageMode?: LanguageMode;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  isScreenSpace?: boolean;
}

interface BlastFlash {
  radius: number;
  maxRadius: number;
  life: number;
  angle: number;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  state,
  params,
  vectorToggles,
  cameraMode,
  onToggleCameraMode,
  muzzleFlashTrigger,
  crashExplosionTrigger,
  theme = 'dark',
  languageMode = 'bilingual',
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Camera viewport state (in world kilometers)
  const [zoom, setZoom] = useState<number>(0.050); // pixels per km (larger majestic Earth by default)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 }); // pan offset in km
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const blastFlashRef = useRef<BlastFlash[]>([]);
  const cannonMuzzlePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Handle Muzzle Flash Animation
  useEffect(() => {
    if (muzzleFlashTrigger > 0) {
      const angleRad = -(params.launchAngleDeg * Math.PI) / 180;

      // Expanding fiery muzzle blast cone
      blastFlashRef.current.push({
        radius: 8,
        maxRadius: 46,
        life: 1.0,
        angle: angleRad,
      });

      const newParticles: Particle[] = [];
      // Fire sparks and flame burst (Screen space)
      for (let i = 0; i < 40; i++) {
        const spread = (Math.random() - 0.5) * 0.75;
        const speed = 120 + Math.random() * 320;
        const pAngle = angleRad + spread;
        newParticles.push({
          x: 0,
          y: 0,
          vx: Math.cos(pAngle) * speed,
          vy: Math.sin(pAngle) * speed,
          life: 1.0,
          maxLife: 0.38 + Math.random() * 0.28,
          color: Math.random() > 0.4 ? (Math.random() > 0.5 ? '#fef08a' : '#f59e0b') : '#ef4444',
          size: 3.5 + Math.random() * 4.5,
          isScreenSpace: true,
        });
      }
      // Gunpowder smoke clouds billowing outward
      for (let i = 0; i < 22; i++) {
        const spread = (Math.random() - 0.5) * 1.15;
        const speed = 35 + Math.random() * 130;
        const pAngle = angleRad + spread;
        newParticles.push({
          x: 0,
          y: 0,
          vx: Math.cos(pAngle) * speed,
          vy: Math.sin(pAngle) * speed,
          life: 1.0,
          maxLife: 0.75 + Math.random() * 0.45,
          color: Math.random() > 0.5 ? 'rgba(203, 213, 225, 0.75)' : 'rgba(148, 163, 184, 0.6)',
          size: 5.5 + Math.random() * 8,
          isScreenSpace: true,
        });
      }
      particlesRef.current.push(...newParticles);
    }
  }, [muzzleFlashTrigger, params.launchAngleDeg]);

  // Handle Crash Explosion Animation
  useEffect(() => {
    if (crashExplosionTrigger > 0) {
      const cx = state.x;
      const cy = state.y;
      const newParticles: Particle[] = [];
      for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 150 + Math.random() * 600;
        newParticles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1.0,
          maxLife: 0.5 + Math.random() * 0.4,
          color: Math.random() > 0.5 ? '#f43f5e' : '#fb923c',
          size: 2.5 + Math.random() * 3.5,
        });
      }
      particlesRef.current.push(...newParticles);
    }
  }, [crashExplosionTrigger, state.x, state.y]);

  // Reset Camera View
  const handleResetCamera = useCallback(() => {
    setZoom(0.050);
    setPan({ x: 0, y: 0 });
  }, []);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom((prev) => Math.max(0.001, Math.min(0.25, prev * factor)));
  };

  // Mouse and Touch drag pan
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      const dx = (e.clientX - dragStartRef.current.x) / zoom;
      const dy = (e.clientY - dragStartRef.current.y) / zoom;
      setPan((prev) => ({ x: prev.x - dx, y: prev.y + dy }));
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current && e.touches.length === 1) {
      const dx = (e.touches[0].clientX - dragStartRef.current.x) / zoom;
      const dy = (e.touches[0].clientY - dragStartRef.current.y) / zoom;
      setPan((prev) => ({ x: prev.x - dx, y: prev.y + dy }));
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // Dynamic DPR resizing
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Coordinate Transform: Center of screen
      let centerX = width / 2;
      let centerY = height / 2;

      // Camera offset
      let camX = pan.x;
      let camY = pan.y;

      if (cameraMode === 'projectile' && state.isFired && !state.hasCrashed) {
        camX = state.x;
        camY = state.y;
      }

      // Convert world (km) to canvas screen coords
      const toScreenX = (xKm: number) => centerX + (xKm - camX) * zoom;
      const toScreenY = (yKm: number) => centerY - (yKm - camY) * zoom; // Invert Y

      // Canvas theme is Light Mode with crisp celestial grid
      const isLight = true;

      // 1. Beautiful Light-Coloured Background around Earth
      const bgGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        Math.min(width, height) * 0.15,
        centerX,
        centerY,
        Math.max(width, height) * 0.85
      );
      bgGrad.addColorStop(0, '#f8fcff'); // pristine luminous sky-50
      bgGrad.addColorStop(0.5, '#f0f7fe'); // soft celestial ice-blue
      bgGrad.addColorStop(1, '#e2eefb'); // gentle light sky tint at edges
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. High-Tech Blueprint Cartesian Coordinate Grid
      let gridSpacingKm = 5000;
      if (zoom > 0.08) gridSpacingKm = 1000;
      else if (zoom > 0.035) gridSpacingKm = 2500;
      else if (zoom < 0.015) gridSpacingKm = 10000;

      const minXKm = camX - centerX / zoom;
      const maxXKm = camX + (width - centerX) / zoom;
      const minYKm = camY - (height - centerY) / zoom;
      const maxYKm = camY + centerY / zoom;

      const startX = Math.floor(minXKm / gridSpacingKm) * gridSpacingKm;
      const endX = Math.ceil(maxXKm / gridSpacingKm) * gridSpacingKm;
      const startY = Math.floor(minYKm / gridSpacingKm) * gridSpacingKm;
      const endY = Math.ceil(maxYKm / gridSpacingKm) * gridSpacingKm;

      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.14)'; // delicate blueprint grid line

      // Vertical grid lines
      for (let gx = startX; gx <= endX; gx += gridSpacingKm) {
        const sx = toScreenX(gx);
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, height);
        ctx.stroke();
      }

      // Horizontal grid lines
      for (let gy = startY; gy <= endY; gy += gridSpacingKm) {
        const sy = toScreenY(gy);
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(width, sy);
        ctx.stroke();
      }

      // Intersection Crosshair (+) Ticks for aesthetic precision
      ctx.fillStyle = 'rgba(2, 132, 199, 0.4)';
      for (let gx = startX; gx <= endX; gx += gridSpacingKm) {
        const sx = toScreenX(gx);
        for (let gy = startY; gy <= endY; gy += gridSpacingKm) {
          const sy = toScreenY(gy);
          ctx.fillRect(sx - 3, sy - 0.5, 6, 1);
          ctx.fillRect(sx - 0.5, sy - 3, 1, 6);
        }
      }
      ctx.restore();

      // 3. Draw Concentric Distance Scale Radar Circles (Background Orbital Rings)
      if (vectorToggles.hudGrid) {
        ctx.save();
        ctx.strokeStyle = 'rgba(2, 132, 199, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);

        const rangeRings = [
          { r: CONSTANTS.EARTH_RADIUS_KM + 300, name: 'LEO 300 km' },
          { r: 10000, name: 'r = 10,000 km' },
          { r: 15000, name: 'r = 15,000 km' },
          { r: 25000, name: 'r = 25,000 km' },
          { r: 42164, name: 'GEO 42,164 km' },
        ];

        const scX = toScreenX(0);
        const scY = toScreenY(0);

        rangeRings.forEach((ring) => {
          const screenR = ring.r * zoom;
          ctx.beginPath();
          ctx.arc(scX, scY, screenR, 0, Math.PI * 2);
          ctx.stroke();

          // High contrast ring label
          ctx.font = 'bold 10px "JetBrains Mono", monospace';
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillText(ring.name, scX + screenR + 6, scY - 4);
        });

        // Crosshairs at Earth Center
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(2, 132, 199, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(scX - 22, scY);
        ctx.lineTo(scX + 22, scY);
        ctx.moveTo(scX, scY - 22);
        ctx.lineTo(scX, scY + 22);
        ctx.stroke();

        // 45-degree faint radial guide rays
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.18)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 6]);
        for (let ang = 0; ang < Math.PI * 2; ang += Math.PI / 4) {
          const maxR = 48000 * zoom;
          ctx.beginPath();
          ctx.moveTo(scX, scY);
          ctx.lineTo(scX + Math.cos(ang) * maxR, scY + Math.sin(ang) * maxR);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.restore();
      }

      // 4. Render Photorealistic Earth (Authentic NASA Blue Marble Western Hemisphere)
      const earthScreenX = toScreenX(0);
      const earthScreenY = toScreenY(0);
      const earthScreenR = CONSTANTS.EARTH_RADIUS_KM * zoom;
      const R = earthScreenR;

      // Soft spherical globe drop shadow for light background 3D depth
      ctx.save();
      ctx.shadowColor = 'rgba(15, 23, 42, 0.24)';
      ctx.shadowBlur = Math.max(16, 32 * zoom * 30);
      ctx.beginPath();
      ctx.arc(earthScreenX, earthScreenY, earthScreenR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
      ctx.fill();
      ctx.restore();

      // 4A. Delicate, Realistic Atmospheric Limb (Rayleigh Scattering Glow)
      // Realistic thin atmosphere: scales to ~140 km (1.022 * R), not a bloated cartoon halo
      const coronaGradient = ctx.createRadialGradient(
        earthScreenX, earthScreenY, earthScreenR * 0.995,
        earthScreenX, earthScreenY, earthScreenR * 1.025
      );
      coronaGradient.addColorStop(0, 'rgba(56, 189, 248, 0.85)'); // luminous stratospheric cyan
      coronaGradient.addColorStop(0.35, 'rgba(14, 165, 233, 0.45)');
      coronaGradient.addColorStop(0.7, 'rgba(2, 132, 199, 0.15)');
      coronaGradient.addColorStop(1, 'rgba(2, 132, 199, 0)');
      ctx.fillStyle = coronaGradient;
      ctx.beginPath();
      ctx.arc(earthScreenX, earthScreenY, earthScreenR * 1.025, 0, Math.PI * 2);
      ctx.fill();

      // Razor-thin stratospheric edge
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.85)';
      ctx.lineWidth = Math.max(1.0, 1.8 * zoom * 50);
      ctx.beginPath();
      ctx.arc(earthScreenX, earthScreenY, earthScreenR * 1.002, 0, Math.PI * 2);
      ctx.stroke();

      // 4B. Earth Globe Body (Clipped strictly to Spherical Circle)
      ctx.save();
      ctx.beginPath();
      ctx.arc(earthScreenX, earthScreenY, earthScreenR, 0, Math.PI * 2);
      ctx.clip();

      // 1. Oceanic Base with Directional Solar Illumination & Abyssal Depth
      const oceanGrad = ctx.createRadialGradient(
        earthScreenX - R * 0.22,
        earthScreenY - R * 0.25,
        R * 0.08,
        earthScreenX,
        earthScreenY,
        R
      );
      oceanGrad.addColorStop(0, '#1a4f8f'); // sunlit tropical Atlantic/Pacific
      oceanGrad.addColorStop(0.35, '#10376d'); // deep sapphire ocean
      oceanGrad.addColorStop(0.72, '#081e47'); // abyssal blue
      oceanGrad.addColorStop(0.92, '#040f26'); // oceanic depths towards limb
      oceanGrad.addColorStop(1, '#020714'); // deep limb boundary
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(earthScreenX - R, earthScreenY - R, R * 2, R * 2);

      // Specular Sun Glint off Pacific Ocean (Natural liquid ocean reflection)
      const sunglintGrad = ctx.createRadialGradient(
        earthScreenX - R * 0.2,
        earthScreenY + R * 0.06,
        0,
        earthScreenX - R * 0.2,
        earthScreenY + R * 0.06,
        R * 0.18
      );
      sunglintGrad.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
      sunglintGrad.addColorStop(0.4, 'rgba(186, 230, 253, 0.18)');
      sunglintGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = sunglintGrad;
      ctx.beginPath();
      ctx.ellipse(earthScreenX - R * 0.2, earthScreenY + R * 0.06, R * 0.16, R * 0.1, -0.35, 0, Math.PI * 2);
      ctx.fill();

      // 2. Continents and Geographic Biomes
      ctx.save();
      ctx.translate(earthScreenX, earthScreenY);

      // --- TURQUOISE CONTINENTAL SHELVES & CORAL REEFS (Bahamas, Florida Keys, Yucatan) ---
      // Bahamas Grand Bahama & Great Bahama Bank (Signature turquoise shallows from orbit)
      ctx.fillStyle = 'rgba(6, 182, 212, 0.65)';
      ctx.beginPath();
      ctx.ellipse(R * 0.28, -R * 0.04, R * 0.075, R * 0.04, -0.3, 0, Math.PI * 2);
      ctx.fill();
      // Florida Keys & Gulf of Mexico shelf
      ctx.fillStyle = 'rgba(14, 165, 233, 0.45)';
      ctx.beginPath();
      ctx.ellipse(R * 0.18, -R * 0.05, R * 0.1, R * 0.05, -0.15, 0, Math.PI * 2);
      ctx.fill();
      // Yucatan Channel & Caribbean fringing shallows
      ctx.fillStyle = 'rgba(45, 212, 191, 0.5)';
      ctx.beginPath();
      ctx.ellipse(R * 0.08, R * 0.06, R * 0.05, R * 0.038, 0.4, 0, Math.PI * 2);
      ctx.fill();
      // Caribbean islands shallow reef fringe (Cuba, Hispaniola)
      ctx.beginPath();
      ctx.ellipse(R * 0.26, R * 0.02, R * 0.095, R * 0.03, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // --- NORTH AMERICAN CONTINENT ---
      // Base Temperate & Boreal Vegetation (Canada, Pacific Northwest, US Midwest, East Coast)
      ctx.fillStyle = '#1e3f22'; // Realistic rich forest biome
      ctx.beginPath();
      // Alaska & Yukon peninsula
      ctx.moveTo(-R * 0.49, -R * 0.62);
      ctx.bezierCurveTo(-R * 0.42, -R * 0.72, -R * 0.26, -R * 0.7, -R * 0.12, -R * 0.65);
      // Canadian Arctic & Hudson Bay shoreline
      ctx.bezierCurveTo(R * 0.04, -R * 0.63, R * 0.16, -R * 0.6, R * 0.24, -R * 0.5);
      // Maritime provinces & New England
      ctx.bezierCurveTo(R * 0.32, -R * 0.4, R * 0.3, -R * 0.26, R * 0.23, -R * 0.16);
      // Mid-Atlantic & Florida Peninsula
      ctx.bezierCurveTo(R * 0.25, -R * 0.08, R * 0.23, -R * 0.01, R * 0.19, -R * 0.03);
      // Northern Gulf of Mexico coast
      ctx.bezierCurveTo(R * 0.13, -R * 0.12, R * 0.01, -R * 0.13, -R * 0.05, -R * 0.06);
      // Mexico Gulf Coast & Yucatan peninsula
      ctx.bezierCurveTo(-R * 0.02, 0.02, R * 0.05, 0.04, R * 0.07, 0.08);
      // Central American Isthmus
      ctx.bezierCurveTo(R * 0.09, 0.15, R * 0.14, 0.22, R * 0.18, 0.26);
      // Pacific coast of Central America
      ctx.bezierCurveTo(R * 0.11, 0.24, 0.01, 0.16, -R * 0.07, 0.08);
      // Mexico Pacific coastline
      ctx.bezierCurveTo(-R * 0.14, 0.02, -R * 0.18, -R * 0.05, -R * 0.24, -R * 0.07);
      // California coastline & Pacific Northwest
      ctx.bezierCurveTo(-R * 0.34, -R * 0.2, -R * 0.38, -R * 0.36, -R * 0.43, -R * 0.48);
      ctx.closePath();
      ctx.fill();

      // Great Plains & Mississippi Valley transition (Golden olive / agricultural prairie)
      ctx.fillStyle = '#5c6e3b';
      ctx.beginPath();
      ctx.moveTo(-R * 0.18, -R * 0.48);
      ctx.bezierCurveTo(-R * 0.08, -R * 0.45, 0.0, -R * 0.4, R * 0.08, -R * 0.32);
      ctx.bezierCurveTo(R * 0.12, -R * 0.22, R * 0.09, -R * 0.12, 0.0, -R * 0.14);
      ctx.bezierCurveTo(-R * 0.1, -R * 0.16, -R * 0.15, -R * 0.28, -R * 0.18, -R * 0.48);
      ctx.closePath();
      ctx.fill();

      // American Southwest, Mojave, Sonoran Desert & Colorado Plateau (Authentic warm sandstone ochre)
      ctx.fillStyle = '#b58451';
      ctx.beginPath();
      ctx.moveTo(-R * 0.38, -R * 0.46);
      ctx.bezierCurveTo(-R * 0.3, -R * 0.44, -R * 0.2, -R * 0.4, -R * 0.12, -R * 0.34);
      ctx.bezierCurveTo(-R * 0.08, -R * 0.24, -R * 0.07, -R * 0.14, -R * 0.1, -R * 0.04);
      ctx.bezierCurveTo(-R * 0.13, 0.03, -R * 0.17, 0.06, -R * 0.22, 0.02);
      ctx.bezierCurveTo(-R * 0.26, -R * 0.07, -R * 0.33, -R * 0.2, -R * 0.36, -R * 0.34);
      ctx.closePath();
      ctx.fill();

      // Rocky Mountain Granite Spine & Sierra Nevada Snow Ridges
      ctx.strokeStyle = '#78716c';
      ctx.lineWidth = Math.max(1.2, R * 0.02);
      ctx.beginPath();
      ctx.moveTo(-R * 0.34, -R * 0.48);
      ctx.lineTo(-R * 0.26, -R * 0.32);
      ctx.lineTo(-R * 0.17, -R * 0.14);
      ctx.stroke();

      // Snow-dusted alpine crests on Rockies
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = Math.max(0.8, R * 0.01);
      ctx.beginPath();
      ctx.moveTo(-R * 0.33, -R * 0.47);
      ctx.lineTo(-R * 0.25, -R * 0.31);
      ctx.lineTo(-R * 0.18, -R * 0.15);
      ctx.stroke();

      // Baja California Peninsula (Realistic slender finger extending into Pacific)
      ctx.fillStyle = '#b58451';
      ctx.beginPath();
      ctx.moveTo(-R * 0.25, -R * 0.1);
      ctx.bezierCurveTo(-R * 0.24, -R * 0.02, -R * 0.19, 0.06, -R * 0.16, 0.12);
      ctx.bezierCurveTo(-R * 0.18, 0.12, -R * 0.22, 0.04, -R * 0.27, -R * 0.06);
      ctx.closePath();
      ctx.fill();

      // Gulf of California / Sea of Cortez (Deep navy water between Baja and mainland)
      ctx.strokeStyle = '#0e265c';
      ctx.lineWidth = Math.max(1, R * 0.012);
      ctx.beginPath();
      ctx.moveTo(-R * 0.24, -R * 0.07);
      ctx.lineTo(-R * 0.18, 0.08);
      ctx.stroke();

      // Great Lakes System (Lake Superior, Michigan, Huron, Erie, Ontario)
      ctx.fillStyle = '#0f2c66';
      // Lake Superior
      ctx.beginPath();
      ctx.ellipse(-R * 0.02, -R * 0.46, R * 0.038, R * 0.019, -0.2, 0, Math.PI * 2);
      ctx.fill();
      // Lake Michigan & Huron
      ctx.beginPath();
      ctx.ellipse(0.01, -R * 0.41, R * 0.023, R * 0.034, 0.2, 0, Math.PI * 2);
      ctx.fill();
      // Lake Erie & Ontario
      ctx.beginPath();
      ctx.ellipse(R * 0.06, -R * 0.37, R * 0.025, R * 0.015, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // --- SOUTH AMERICAN CONTINENT ---
      // Amazon Rainforest Canopy (Deep lush tropical emerald green)
      ctx.fillStyle = '#143818';
      ctx.beginPath();
      ctx.moveTo(R * 0.18, 0.26);
      ctx.bezierCurveTo(R * 0.28, 0.24, R * 0.44, 0.26, R * 0.54, 0.32);
      ctx.bezierCurveTo(R * 0.66, 0.42, R * 0.72, 0.55, R * 0.68, 0.71);
      ctx.bezierCurveTo(R * 0.54, 0.79, R * 0.41, 0.66, R * 0.31, 0.52);
      ctx.bezierCurveTo(R * 0.23, 0.42, R * 0.16, 0.34, R * 0.18, 0.26);
      ctx.closePath();
      ctx.fill();

      // Brazilian Highlands & Cerrado savanna
      ctx.fillStyle = '#4c5c2d';
      ctx.beginPath();
      ctx.ellipse(R * 0.48, 0.52, R * 0.16, R * 0.12, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Andes Mountain Chain (Running continuously along the Pacific coast of South America)
      ctx.strokeStyle = '#5a4d3e';
      ctx.lineWidth = Math.max(1.2, R * 0.022);
      ctx.beginPath();
      ctx.moveTo(R * 0.18, 0.28);
      ctx.lineTo(R * 0.24, 0.46);
      ctx.lineTo(R * 0.31, 0.66);
      ctx.stroke();

      // Alpine snow caps along the Andes
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = Math.max(0.8, R * 0.009);
      ctx.beginPath();
      ctx.moveTo(R * 0.19, 0.31);
      ctx.lineTo(R * 0.24, 0.47);
      ctx.lineTo(R * 0.3, 0.65);
      ctx.stroke();

      // Caribbean Islands (Cuba, Hispaniola, Jamaica, Puerto Rico)
      ctx.fillStyle = '#224a24';
      ctx.beginPath();
      ctx.ellipse(R * 0.22, 0.01, R * 0.065, R * 0.015, -0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(R * 0.34, 0.05, R * 0.036, R * 0.015, -0.1, 0, Math.PI * 2);
      ctx.fill();

      // Arctic / Greenland Glacial Ice Shield (Permanent ice sheet with crevasse shading)
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(R * 0.12, -R * 0.69, R * 0.29, R * 0.12, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.ellipse(R * 0.16, -R * 0.68, R * 0.18, R * 0.07, 0.15, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // restore continent transform

      // --- 4C. PHOTOREALISTIC SATELLITE CLOUD SYSTEMS WITH PHYSICAL 3D SHADOWS ---
      ctx.save();
      ctx.translate(earthScreenX, earthScreenY);

      // Cloud Rendering Function: Draws directional cloud drop shadows first, then textured white cloud decks
      const renderRealisticClouds = (offsetX: number, offsetY: number, isShadow: boolean) => {
        const shadowColor = 'rgba(0, 0, 0, 0.28)';
        const cirrusColor = isShadow ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.45)';
        const stormCoreColor = isShadow ? shadowColor : 'rgba(255, 255, 255, 0.96)';
        const stormFlankColor = isShadow ? 'rgba(0, 0, 0, 0.18)' : 'rgba(255, 255, 255, 0.75)';

        // 1. Signature Canadian / Great Lakes Cyclonic Storm Vortex (Authentic NASA Blue Marble swirl)
        ctx.fillStyle = stormCoreColor;
        ctx.beginPath();
        // Central low-pressure swirl eye & core
        ctx.arc(offsetX - R * 0.02, offsetY - R * 0.48, R * 0.08, 0.2, Math.PI * 1.6);
        ctx.bezierCurveTo(
          offsetX + R * 0.14, offsetY - R * 0.58,
          offsetX + R * 0.26, offsetY - R * 0.45,
          offsetX + R * 0.19, offsetY - R * 0.36
        );
        ctx.bezierCurveTo(
          offsetX + R * 0.08, offsetY - R * 0.34,
          offsetX - R * 0.08, offsetY - R * 0.39,
          offsetX - R * 0.02, offsetY - R * 0.48
        );
        ctx.fill();

        // Cyclonic Outer Spiral Arm wrapping across northern Quebec & Atlantic
        ctx.fillStyle = stormFlankColor;
        ctx.beginPath();
        ctx.moveTo(offsetX - R * 0.02, offsetY - R * 0.54);
        ctx.bezierCurveTo(
          offsetX + R * 0.16, offsetY - R * 0.62,
          offsetX + R * 0.36, offsetY - R * 0.52,
          offsetX + R * 0.46, offsetY - R * 0.38
        );
        ctx.bezierCurveTo(
          offsetX + R * 0.38, offsetY - R * 0.34,
          offsetX + R * 0.22, offsetY - R * 0.48,
          offsetX - R * 0.02, offsetY - R * 0.54
        );
        ctx.fill();

        // Secondary spiral arm trailing across the Great Plains
        ctx.beginPath();
        ctx.moveTo(offsetX - R * 0.06, offsetY - R * 0.44);
        ctx.bezierCurveTo(
          offsetX - R * 0.18, offsetY - R * 0.38,
          offsetX - R * 0.26, offsetY - R * 0.28,
          offsetX - R * 0.22, offsetY - R * 0.22
        );
        ctx.bezierCurveTo(
          offsetX - R * 0.16, offsetY - R * 0.26,
          offsetX - R * 0.12, offsetY - R * 0.34,
          offsetX - R * 0.06, offsetY - R * 0.44
        );
        ctx.fill();

        // 2. Pacific Marine Frontal Storm Streams (Layered wisps off Washington, California & Baja)
        ctx.fillStyle = stormFlankColor;
        ctx.beginPath();
        ctx.ellipse(offsetX - R * 0.46, offsetY - R * 0.28, R * 0.17, R * 0.06, -0.32, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(offsetX - R * 0.39, offsetY - R * 0.11, R * 0.14, R * 0.048, 0.38, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(offsetX - R * 0.32, offsetY + R * 0.07, R * 0.12, R * 0.042, -0.18, 0, Math.PI * 2);
        ctx.fill();

        // 3. Convective Cumulonimbus Clusters over Gulf of Mexico & Caribbean
        ctx.fillStyle = stormCoreColor;
        ctx.beginPath();
        ctx.ellipse(offsetX + R * 0.05, offsetY - R * 0.05, R * 0.11, R * 0.038, 0.12, 0, Math.PI * 2);
        ctx.ellipse(offsetX + R * 0.23, offsetY + R * 0.13, R * 0.15, R * 0.048, -0.14, 0, Math.PI * 2);
        ctx.fill();

        // 4. Atlantic Frontal Weather Band Sweeping toward Bermuda
        ctx.fillStyle = stormFlankColor;
        ctx.beginPath();
        ctx.ellipse(offsetX + R * 0.44, offsetY - R * 0.3, R * 0.22, R * 0.055, -0.38, 0, Math.PI * 2);
        ctx.ellipse(offsetX + R * 0.54, offsetY - R * 0.14, R * 0.17, R * 0.045, -0.22, 0, Math.PI * 2);
        ctx.fill();

        // 5. Intertropical Convergence Zone (ITCZ) Equatorial Cloud Band (Across South America)
        ctx.fillStyle = stormFlankColor;
        ctx.beginPath();
        ctx.ellipse(offsetX + R * 0.35, offsetY + R * 0.28, R * 0.28, R * 0.05, 0.08, 0, Math.PI * 2);
        ctx.ellipse(offsetX - R * 0.08, offsetY + R * 0.26, R * 0.22, R * 0.045, -0.06, 0, Math.PI * 2);
        ctx.fill();

        // 6. Massive Southern Ocean Circumpolar Cloud Shield
        ctx.fillStyle = stormCoreColor;
        ctx.beginPath();
        ctx.ellipse(offsetX - R * 0.12, offsetY + R * 0.58, R * 0.62, R * 0.16, -0.08, 0, Math.PI * 2);
        ctx.ellipse(offsetX + R * 0.26, offsetY + R * 0.69, R * 0.52, R * 0.14, 0.14, 0, Math.PI * 2);
        ctx.ellipse(offsetX - R * 0.36, offsetY + R * 0.44, R * 0.32, R * 0.1, 0.28, 0, Math.PI * 2);
        ctx.fill();

        // 7. High-Altitude Delicate Cirrus Streaks (catching sunlight across the continent)
        ctx.fillStyle = cirrusColor;
        ctx.beginPath();
        ctx.ellipse(offsetX - R * 0.2, offsetY - R * 0.32, R * 0.26, R * 0.03, -0.12, 0, Math.PI * 2);
        ctx.ellipse(offsetX + R * 0.08, offsetY - R * 0.24, R * 0.22, R * 0.028, 0.08, 0, Math.PI * 2);
        ctx.ellipse(offsetX - R * 0.28, offsetY + R * 0.22, R * 0.2, R * 0.025, 0.15, 0, Math.PI * 2);
        ctx.fill();
      };

      // 1. Draw Physical 3D Cloud Shadows offset by +3.5px, +2.8px
      renderRealisticClouds(3.5, 2.8, true);
      // 2. Draw Realistic White Cloud Decks
      renderRealisticClouds(0, 0, false);

      ctx.restore(); // restore cloud transform

      // --- 4D. TRUE 3D SPHERICAL DIRECTIONAL LIGHTING & COSINE LIMB DARKENING ---
      // Directional illumination from upper-left (sunlight vector [-0.4, -0.4])
      const sphericalGrad = ctx.createRadialGradient(
        earthScreenX - R * 0.18,
        earthScreenY - R * 0.18,
        R * 0.15,
        earthScreenX,
        earthScreenY,
        R
      );
      sphericalGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)'); // delicate solar sheen
      sphericalGrad.addColorStop(0.58, 'rgba(0, 0, 0, 0)'); // daylight ambient
      sphericalGrad.addColorStop(0.84, 'rgba(4, 9, 24, 0.35)'); // terminator falloff
      sphericalGrad.addColorStop(0.96, 'rgba(2, 6, 18, 0.72)'); // deep limb shadow
      sphericalGrad.addColorStop(1, 'rgba(1, 3, 10, 0.88)'); // razor black rim
      ctx.fillStyle = sphericalGrad;
      ctx.fillRect(earthScreenX - R, earthScreenY - R, R * 2, R * 2);

      ctx.restore(); // restore Earth clipping

      // 5. Distinct Mountain Summit and Miniature Cannon
      // Mountain positioned at the top (North Pole: x=0, y=R + h)
      const mountBaseY = earthScreenY - earthScreenR;
      const mountPeakY = toScreenY(CONSTANTS.EARTH_RADIUS_KM + params.mountainHeight);
      const mountHalfWidth = Math.max(14, 28 * zoom * 100);

      // Draw Mountain Triangular Mass with rock strata
      ctx.save();
      const mountainGrad = ctx.createLinearGradient(0, mountPeakY, 0, mountBaseY);
      mountainGrad.addColorStop(0, '#64748b'); // granite peak
      mountainGrad.addColorStop(0.45, '#475569'); // slate rock
      mountainGrad.addColorStop(1, '#1e293b'); // base
      ctx.fillStyle = mountainGrad;
      ctx.beginPath();
      ctx.moveTo(earthScreenX - mountHalfWidth, mountBaseY);
      ctx.lineTo(earthScreenX - mountHalfWidth * 0.35, mountPeakY + (mountBaseY - mountPeakY) * 0.45);
      ctx.lineTo(earthScreenX, mountPeakY);
      ctx.lineTo(earthScreenX + mountHalfWidth * 0.35, mountPeakY + (mountBaseY - mountPeakY) * 0.45);
      ctx.lineTo(earthScreenX + mountHalfWidth, mountBaseY);
      ctx.closePath();
      ctx.fill();

      // Mountain Snow Cap & Glacial Arête
      const snowCapY = mountPeakY + (mountBaseY - mountPeakY) * 0.3;
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(earthScreenX - mountHalfWidth * 0.3, snowCapY);
      ctx.lineTo(earthScreenX, mountPeakY);
      ctx.lineTo(earthScreenX + mountHalfWidth * 0.3, snowCapY);
      ctx.lineTo(earthScreenX, snowCapY + 4);
      ctx.closePath();
      ctx.fill();

      // Miniature Polished Brass Cannon atop mountain
      ctx.save();
      ctx.translate(earthScreenX, mountPeakY);

      // Cannon Carriage (Stout dark oak wood carriage)
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-9, -5, 18, 6);
      // Carriage Iron Wheels with rivets
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(-6, 2, 4.5, 0, Math.PI * 2);
      ctx.arc(6, 2, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(-6, 2, 1.5, 0, Math.PI * 2);
      ctx.arc(6, 2, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Cannon Barrel (Oriented according to launch pitch angle)
      // Angle 0 deg = horizontal (pointing to the right +X)
      const barrelAngle = -(params.launchAngleDeg * Math.PI) / 180;
      ctx.rotate(barrelAngle);

      // Polished Brass Barrel with metallic highlight
      const brassGrad = ctx.createLinearGradient(0, -9, 0, -1);
      brassGrad.addColorStop(0, '#fef08a'); // golden sunlight highlight
      brassGrad.addColorStop(0.35, '#f59e0b');
      brassGrad.addColorStop(0.7, '#d97706'); // polished brass body
      brassGrad.addColorStop(1, '#78350f'); // shadow
      ctx.fillStyle = brassGrad;
      ctx.fillRect(-6, -9, 28, 8);

      // Barrel Cascabel (rear knob) & Muzzle Ring
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(-6, -5, 3.5, 0, Math.PI * 2);
      ctx.fill();
      // Muzzle collar
      ctx.fillRect(18, -10.5, 4.5, 11);
      // Bore mouth opening (dark hollow)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(22, -9, 2.5, 8);

      // Compute cannon muzzle screen position for blast particles and projectile origin
      const muzzleLocalX = 23;
      const muzzleLocalY = -5;
      const cosB = Math.cos(barrelAngle);
      const sinB = Math.sin(barrelAngle);
      cannonMuzzlePosRef.current = {
        x: earthScreenX + (muzzleLocalX * cosB - muzzleLocalY * sinB),
        y: mountPeakY + (muzzleLocalX * sinB + muzzleLocalY * cosB),
      };

      // --- IF NOT FIRED: DRAW LOADED 3D CANNONBALL IN THE BARREL! ---
      if (!state.isFired) {
        const loadedBallR = 6.5;
        const loadedBallX = 23;
        const loadedBallY = -5;

        // Spherical 3D gradient for the loaded iron ball
        const loadedGrad = ctx.createRadialGradient(
          loadedBallX - 2, loadedBallY - 2, 0.5,
          loadedBallX, loadedBallY, loadedBallR
        );
        loadedGrad.addColorStop(0, '#ffffff'); // bright highlight
        loadedGrad.addColorStop(0.2, '#cbd5e1'); // shiny iron
        loadedGrad.addColorStop(0.5, '#475569'); // cast iron body
        loadedGrad.addColorStop(0.85, '#1e293b'); // dark shadow
        loadedGrad.addColorStop(1, '#020617'); // black edge
        ctx.fillStyle = loadedGrad;
        ctx.beginPath();
        ctx.arc(loadedBallX, loadedBallY, loadedBallR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Pulsing "Ready to Fire" beacon ring around loaded ball
        const readyPulse = 0.5 + Math.sin(Date.now() * 0.007) * 0.5;
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 + readyPulse * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(loadedBallX, loadedBallY, loadedBallR + 2.5 + readyPulse * 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore(); // restore cannon transform
      ctx.restore(); // restore mountain transform

      // 6. Analytical Keplerian Preview (Deep Dark High-Contrast Dashed Path)
      if (vectorToggles.preview) {
        let previewPoints: { x: number; y: number }[] = [];
        if (!state.isFired) {
          // Preview from current mountain summit with slider launch speed & angle
          const r0 = CONSTANTS.EARTH_RADIUS_KM + params.mountainHeight;
          const thetaRad = (params.launchAngleDeg * Math.PI) / 180;
          const vx0 = params.initialSpeed * Math.cos(thetaRad);
          const vy0 = params.initialSpeed * Math.sin(thetaRad);
          previewPoints = generateKeplerianPreview(0, r0, vx0, vy0, 240);
        } else if (!state.hasCrashed) {
          // Preview current orbit from current projectile position and velocity
          previewPoints = generateKeplerianPreview(state.x, state.y, state.vx, state.vy, 240);
        }

        if (previewPoints.length > 1) {
          ctx.save();
          const darkPreviewColor = state.orbitType === 'circular'
            ? '#022c22' // Deep dark forest emerald
            : state.orbitType === 'parabolic' || state.orbitType === 'hyperbolic'
            ? '#3b0764' // Deep dark royal violet
            : state.orbitType === 'suborbital_crash'
            ? '#7f1d1d' // Deep dark crimson
            : '#090d16'; // Deep dark navy midnight

          // Layer 1: High-contrast white halo casing
          ctx.setLineDash([7, 5]);
          ctx.lineWidth = 4.2;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.moveTo(toScreenX(previewPoints[0].x), toScreenY(previewPoints[0].y));
          for (let pIdx = 1; pIdx < previewPoints.length; pIdx++) {
            ctx.lineTo(toScreenX(previewPoints[pIdx].x), toScreenY(previewPoints[pIdx].y));
          }
          ctx.stroke();

          // Layer 2: Deep Dark dashed core stroke
          ctx.lineWidth = 2.6;
          ctx.strokeStyle = darkPreviewColor;
          ctx.stroke();
          ctx.restore();
        }
      }

      // 7. Historical Trajectory Trail (Deep Dark High-Contrast Path Along Which the Object Moves)
      if (vectorToggles.trail && state.trail.length > 1) {
        ctx.save();
        const trailLen = state.trail.length;

        // Layer 1: High-contrast white halo casing beneath the full path
        ctx.lineWidth = 5.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.moveTo(toScreenX(state.trail[0].x), toScreenY(state.trail[0].y));
        for (let i = 1; i < trailLen; i++) {
          ctx.lineTo(toScreenX(state.trail[i].x), toScreenY(state.trail[i].y));
        }
        ctx.stroke();

        // Layer 2: Deep Dark solid stroke (Bold 3.6px width with high opacity)
        ctx.lineWidth = 3.6;
        for (let i = 1; i < trailLen; i++) {
          const ptPrev = state.trail[i - 1];
          const ptCurr = state.trail[i];
          // High opacity minimum (0.72) keeps older segments around Earth dark and vivid
          const alpha = Math.min(1.0, 0.72 + (i / trailLen) * 0.28);

          ctx.strokeStyle = state.hasCrashed && i === trailLen - 1
            ? `rgba(127, 29, 29, ${alpha})` // Deep dark crimson (#7f1d1d)
            : state.orbitType === 'circular'
            ? `rgba(2, 44, 34, ${alpha})` // Deep dark forest emerald (#022c22)
            : state.orbitType === 'parabolic' || state.orbitType === 'hyperbolic'
            ? `rgba(59, 7, 100, ${alpha})` // Deep dark royal violet (#3b0764)
            : `rgba(9, 13, 22, ${alpha})`; // Deep dark midnight navy black (#090d16)

          ctx.beginPath();
          ctx.moveTo(toScreenX(ptPrev.x), toScreenY(ptPrev.y));
          ctx.lineTo(toScreenX(ptCurr.x), toScreenY(ptCurr.y));
          ctx.stroke();
        }
        ctx.restore();
      }

      // 8A. Muzzle Blast Cone Flares
      if (blastFlashRef.current.length > 0) {
        ctx.save();
        for (let i = blastFlashRef.current.length - 1; i >= 0; i--) {
          const bf = blastFlashRef.current[i];
          bf.radius += (bf.maxRadius - bf.radius) * 0.32;
          bf.life -= 0.06;

          if (bf.life <= 0) {
            blastFlashRef.current.splice(i, 1);
            continue;
          }

          const mx = cannonMuzzlePosRef.current.x;
          const my = cannonMuzzlePosRef.current.y;

          ctx.save();
          ctx.translate(mx, my);
          ctx.rotate(bf.angle);

          const flashGrad = ctx.createRadialGradient(0, 0, 1, bf.radius * 0.5, 0, bf.radius);
          flashGrad.addColorStop(0, `rgba(255, 255, 255, ${bf.life})`);
          flashGrad.addColorStop(0.35, `rgba(254, 240, 138, ${bf.life * 0.95})`);
          flashGrad.addColorStop(0.7, `rgba(249, 115, 22, ${bf.life * 0.75})`);
          flashGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
          ctx.fillStyle = flashGrad;

          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.lineTo(bf.radius * 0.85, -bf.radius * 0.5);
          ctx.lineTo(bf.radius * 1.15, 0);
          ctx.lineTo(bf.radius * 0.85, bf.radius * 0.5);
          ctx.lineTo(0, 6);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        }
        ctx.restore();
      }

      // 6B. Dynamic Particles (Muzzle Flash, Gunpowder Smoke & Crash debris)
      if (particlesRef.current.length > 0) {
        ctx.save();
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx * 0.016;
          p.y += p.vy * 0.016;
          p.life -= 0.016 / p.maxLife;

          if (p.life <= 0) {
            particlesRef.current.splice(i, 1);
            continue;
          }

          let scrX: number;
          let scrY: number;
          if (p.isScreenSpace) {
            scrX = cannonMuzzlePosRef.current.x + p.x;
            scrY = cannonMuzzlePosRef.current.y + p.y;
          } else {
            scrX = toScreenX(p.x);
            scrY = toScreenY(p.y);
          }

          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.beginPath();
          ctx.arc(scrX, scrY, p.size * (p.isScreenSpace ? (1 + (1 - p.life) * 0.7) : 1), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 7. Render Projectile / Cannonball (কামানের গোলা)
      if (state.isFired) {
        const projX = state.x;
        const projY = state.y;
        const projScrX = toScreenX(projX);
        const projScrY = toScreenY(projY);

        if (!state.hasCrashed) {
          // --- THE SOLID 3D CAST-IRON CANNONBALL ---
          const ballR = 9.5; // Distinct, solid radius (approx 19px diameter)

          // A. Fiery Propulsion / Friction Wake trailing behind the ball
          const vMag = state.speed;
          if (vMag > 0.05) {
            const normVx = state.vx / vMag;
            const normVy = state.vy / vMag;
            // 4 trailing incandescent wake puffs
            for (let t = 1; t <= 4; t++) {
              const dist = t * (ballR * 0.9);
              const puffScrX = projScrX - normVx * dist;
              const puffScrY = projScrY + normVy * dist; // Inverted Y coordinate
              const puffR = ballR * (1 - t * 0.18);
              const alpha = 0.8 - t * 0.17;
              const flameColor = t === 1 
                ? `rgba(254, 240, 138, ${alpha})` // bright core yellow
                : t === 2 
                ? `rgba(249, 115, 22, ${alpha})` // blazing orange
                : t === 3
                ? `rgba(239, 68, 68, ${alpha})` // flame red
                : `rgba(148, 163, 184, ${alpha * 0.6})`; // grey smoke puff

              ctx.fillStyle = flameColor;
              ctx.beginPath();
              ctx.arc(puffScrX, puffScrY, Math.max(2.5, puffR), 0, Math.PI * 2);
              ctx.fill();
            }
          }

          // B. Celestial / Atmospheric Heating Radiant Glow Aura
          const isInAtmosphere = (state.distance - CONSTANTS.EARTH_RADIUS_KM) < 150;
          const glowR = ballR * 2.8;
          const projGlow = ctx.createRadialGradient(projScrX, projScrY, ballR * 0.4, projScrX, projScrY, glowR);
          if (isInAtmosphere || state.orbitType === 'suborbital_crash') {
            projGlow.addColorStop(0, 'rgba(251, 146, 60, 0.85)'); // atmospheric orange-red heating
            projGlow.addColorStop(0.5, 'rgba(239, 68, 68, 0.4)');
            projGlow.addColorStop(1, 'rgba(220, 38, 38, 0)');
          } else {
            projGlow.addColorStop(0, 'rgba(56, 189, 248, 0.85)'); // celestial cyan vacuum aura
            projGlow.addColorStop(0.5, 'rgba(14, 165, 233, 0.35)');
            projGlow.addColorStop(1, 'rgba(2, 132, 199, 0)');
          }
          ctx.fillStyle = projGlow;
          ctx.beginPath();
          ctx.arc(projScrX, projScrY, glowR, 0, Math.PI * 2);
          ctx.fill();

          // C. 3D Spherical Metallic Cannonball Body
          const ballGrad = ctx.createRadialGradient(
            projScrX - ballR * 0.38,
            projScrY - ballR * 0.38,
            ballR * 0.08,
            projScrX,
            projScrY,
            ballR
          );
          ballGrad.addColorStop(0, '#ffffff'); // pure white specular glint
          ballGrad.addColorStop(0.18, '#cbd5e1'); // shiny metallic steel highlight
          ballGrad.addColorStop(0.45, '#64748b'); // gunmetal iron sheen
          ballGrad.addColorStop(0.75, '#334155'); // cast iron slate
          ballGrad.addColorStop(0.95, '#0f172a'); // deep shadowed iron
          ballGrad.addColorStop(1, '#020617'); // pitch black rim

          ctx.fillStyle = ballGrad;
          ctx.beginPath();
          ctx.arc(projScrX, projScrY, ballR, 0, Math.PI * 2);
          ctx.fill();

          // Sharp dark cast-iron rim outline
          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Intense specular highlight pin-dot
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.beginPath();
          ctx.arc(projScrX - ballR * 0.35, projScrY - ballR * 0.35, ballR * 0.22, 0, Math.PI * 2);
          ctx.fill();

          // D. High-Tech Target Reticle & Label Tag (Cannot be missed!)
          const reticleR = ballR + 13;
          ctx.save();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
          ctx.lineWidth = 1.2;
          // 4 corner reticle brackets
          const arcLen = Math.PI / 4;
          for (let a = 0; a < 4; a++) {
            const startA = a * (Math.PI / 2) + Math.PI / 8;
            ctx.beginPath();
            ctx.arc(projScrX, projScrY, reticleR, startA, startA + arcLen);
            ctx.stroke();
          }

          // Sleek HUD Label Tag (Adapts to light and dark theme)
          const revSuffix = state.revolutions && state.revolutions > 0
            ? (languageMode === 'bn' ? ` [ঘূর্ণন ${state.revolutions}]` : ` [Lap ${state.revolutions}]`)
            : '';
          const tagText = languageMode === 'bn'
            ? `কামানের গোলা • ${state.speed.toFixed(2)} কিমি/সে${revSuffix}`
            : `Cannonball • ${state.speed.toFixed(2)} km/s${revSuffix}`;

          ctx.font = 'bold 10px "JetBrains Mono", monospace';
          const textMetrics = ctx.measureText(tagText);
          const tagBoxW = textMetrics.width + 16;
          const tagBoxH = 20;
          const tagBoxX = projScrX + reticleR + 5;
          const tagBoxY = projScrY - 10;

          // Connector line from reticle to label
          ctx.strokeStyle = isLight ? 'rgba(14, 165, 233, 0.65)' : 'rgba(56, 189, 248, 0.7)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(projScrX + reticleR * 0.707, projScrY - reticleR * 0.707);
          ctx.lineTo(tagBoxX, tagBoxY + tagBoxH / 2);
          ctx.stroke();

          // Tag background pill
          ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.9)';
          ctx.strokeStyle = isLight ? 'rgba(14, 165, 233, 0.6)' : 'rgba(56, 189, 248, 0.6)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(tagBoxX, tagBoxY, tagBoxW, tagBoxH, 4);
          ctx.fill();
          ctx.stroke();

          // Status indicator dot inside tag
          ctx.fillStyle = state.orbitType === 'circular'
            ? '#10b981'
            : state.orbitType === 'parabolic' || state.orbitType === 'hyperbolic'
            ? '#a855f7'
            : state.orbitType === 'suborbital_crash'
            ? '#f43f5e'
            : '#0284c7';
          ctx.beginPath();
          ctx.arc(tagBoxX + 7, tagBoxY + tagBoxH / 2, 3, 0, Math.PI * 2);
          ctx.fill();

          // Tag text
          ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
          ctx.fillText(tagText, tagBoxX + 14, tagBoxY + 14);
          ctx.restore();

          // 8. Vector Visualizations (Velocity, Gravity, Acceleration) - Large, clear & non-overlapping!
          if (state.isFired) {
            const vMag = state.speed;
            const [ax, ay] = [
              -(CONSTANTS.MU_KM / Math.pow(state.distance, 3)) * state.x,
              -(CONSTANTS.MU_KM / Math.pow(state.distance, 3)) * state.y,
            ];
            const aMag = Math.sqrt(ax * ax + ay * ay);

            // Vector scale factors (pixels per unit) - increased substantially for high visibility!
            const vScale = 14.0; // pixels per km/s (increased from 6.5)
            const aScale = 14500; // pixels per km/s^2 (increased from 6500)

            // Normal unit vector perpendicular to acceleration/gravity to prevent overlapping shafts
            const normAx = ax / (aMag || 1);
            const normAy = ay / (aMag || 1);
            const perpX = -normAy * 6;
            const perpY = normAx * 6;

            const bothGravityAndAccel = vectorToggles.gravity && vectorToggles.acceleration;

            // A. Velocity Vector (Cyan Arrow, Tangential) - Bolder & Longer
            if (vectorToggles.velocity && vMag > 0.05) {
              const vEndX = projScrX + state.vx * vScale;
              const vEndY = projScrY - state.vy * vScale; // Invert Y
              drawArrow(
                ctx,
                projScrX,
                projScrY,
                vEndX,
                vEndY,
                isLight ? '#0284c7' : '#06b6d4',
                `v (Velocity) • ${state.speed.toFixed(2)} km/s`,
                'outer',
                isLight
              );
            }

            // B. Gravitational Force / Gravity Vector (Orange-Red Arrow, Radial inward)
            if (vectorToggles.gravity && aMag > 1e-5) {
              const shiftX = bothGravityAndAccel ? perpX : 0;
              const shiftY = bothGravityAndAccel ? perpY : 0;
              const gEndX = projScrX + ax * aScale + shiftX;
              const gEndY = projScrY - ay * aScale + shiftY;
              drawArrow(
                ctx,
                projScrX + shiftX,
                projScrY + shiftY,
                gEndX,
                gEndY,
                isLight ? '#ea580c' : '#f97316',
                `Fg (Gravity)`,
                'right',
                isLight
              );
            }

            // C. Resultant Acceleration Vector (Violet/Purple) - Offset so it never clashes with Fg!
            if (vectorToggles.acceleration && aMag > 1e-5) {
              const shiftX = bothGravityAndAccel ? -perpX : 0;
              const shiftY = bothGravityAndAccel ? -perpY : 0;
              const aLenFactor = bothGravityAndAccel ? 0.82 : 0.95;
              const aEndX = projScrX + ax * aScale * aLenFactor + shiftX;
              const aEndY = projScrY - ay * aScale * aLenFactor + shiftY;
              drawArrow(
                ctx,
                projScrX + shiftX,
                projScrY + shiftY,
                aEndX,
                aEndY,
                isLight ? '#9333ea' : '#a855f7',
                `a (Accel)`,
                bothGravityAndAccel ? 'left' : 'left',
                isLight
              );
            }
          }
        } else {
          // --- CRASHED ON EARTH IMPACT EVENT ---
          ctx.save();
          // Expanding fiery crater glow
          const craterGrad = ctx.createRadialGradient(projScrX, projScrY, 2, projScrX, projScrY, 18);
          craterGrad.addColorStop(0, 'rgba(244, 63, 94, 0.95)');
          craterGrad.addColorStop(0.4, 'rgba(239, 68, 68, 0.65)');
          craterGrad.addColorStop(1, 'rgba(185, 28, 28, 0)');
          ctx.fillStyle = craterGrad;
          ctx.beginPath();
          ctx.arc(projScrX, projScrY, 18, 0, Math.PI * 2);
          ctx.fill();

          // Impact Crater Marker
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(projScrX, projScrY, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Crash Label Tag
          ctx.font = 'bold 10px "JetBrains Mono", monospace';
          ctx.fillStyle = isLight ? '#be123c' : '#fda4af';
          ctx.fillText(
            languageMode === 'bn' ? '💥 ক্র্যাশ বিন্দু (Impact Point)' : '💥 Impact Point (Crashed)',
            projScrX + 12,
            projScrY + 4
          );
          ctx.restore();
        }
      }

      // 9. Distance Scale Bar in bottom-left
      const scaleBarKm = 2000;
      const scaleBarPixels = scaleBarKm * zoom;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(24, height - 24);
      ctx.lineTo(24 + scaleBarPixels, height - 24);
      ctx.moveTo(24, height - 30);
      ctx.lineTo(24, height - 18);
      ctx.moveTo(24 + scaleBarPixels, height - 30);
      ctx.lineTo(24 + scaleBarPixels, height - 18);
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.fillText(`Scale: ${scaleBarKm.toLocaleString()} km`, 24, height - 34);

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    state,
    params,
    vectorToggles,
    zoom,
    pan,
    cameraMode,
    theme,
  ]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-sky-50/50">
      {/* 2D Canvas */}
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="w-full h-full block cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Floating Canvas Camera & Viewport Controls HUD (Light Blue & White Theme) */}
      <div className="absolute top-4 left-4 flex items-center gap-1.5 p-1 bg-white/95 backdrop-blur-md border-2 border-sky-300 rounded-xl shadow-lg shadow-sky-200/50 text-xs z-10">
        <button
          onClick={() => setZoom((z) => Math.min(0.25, z * 1.3))}
          title="Zoom In (+)"
          className="p-1.5 text-slate-800 hover:text-cyan-900 hover:bg-sky-100 rounded-lg transition-colors cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.001, z * 0.7))}
          title="Zoom Out (-)"
          className="p-1.5 text-slate-800 hover:text-cyan-900 hover:bg-sky-100 rounded-lg transition-colors cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetCamera}
          title="Reset Camera View (ক্যামেরা রিসেট)"
          className="p-1.5 text-slate-800 hover:text-cyan-900 hover:bg-sky-100 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-sky-300 mx-0.5" />
        <button
          onClick={onToggleCameraMode}
          title={cameraMode === 'earth' ? 'Switch to Projectile Tracking' : 'Switch to Focus Earth'}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors font-bold cursor-pointer ${
            cameraMode === 'projectile'
              ? 'bg-cyan-100 text-cyan-950 border border-cyan-400'
              : 'text-slate-800 hover:text-cyan-900 hover:bg-sky-100'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-cyan-700" />
          <span>{cameraMode === 'projectile' ? 'Tracking' : 'Earth View'}</span>
        </button>
        {onToggleFullscreen && (
          <>
            <div className="w-[1px] h-4 bg-sky-300 mx-0.5" />
            <button
              onClick={onToggleFullscreen}
              title={isFullscreen ? 'Exit Full Screen (Esc / F)' : 'Full Screen Simulation (F)'}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors font-bold cursor-pointer ${
                isFullscreen
                  ? 'bg-cyan-100 text-cyan-950 border border-cyan-400'
                  : 'text-slate-800 hover:text-cyan-900 hover:bg-sky-100'
              }`}
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline text-xs">{isFullscreen ? 'Exit' : 'Full Screen'}</span>
            </button>
          </>
        )}
      </div>

      {/* Dynamic Status Watermark / State Banner */}
      {state.hasCrashed && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-2 bg-rose-950/90 border border-rose-500/60 backdrop-blur-md rounded-xl shadow-2xl text-rose-200 text-xs font-mono font-semibold animate-bounce">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>BALLISTIC IMPACT DETECTED (ভূপতন হয়েছে)</span>
        </div>
      )}

      {state.hasEscaped && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-2 bg-purple-950/90 border border-purple-500/60 backdrop-blur-md rounded-xl shadow-2xl text-purple-200 text-xs font-mono font-semibold">
          <Eye className="w-4 h-4 text-purple-400 shrink-0" />
          <span>ESCAPE VELOCITY EXCEEDED (মুক্তি অর্জিত)</span>
        </div>
      )}
    </div>
  );
};

/**
 * Helper to draw crisp vector arrows with directional head and non-overlapping label badge
 */
function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  label: string,
  labelSide: 'right' | 'left' | 'outer' = 'right',
  isLight: boolean = false
) {
  const headLen = 13;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length < 8) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.8;
  ctx.lineCap = 'round';

  // Arrow shaft
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Arrow head
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle - Math.PI / 6.5),
    toY - headLen * Math.sin(angle - Math.PI / 6.5)
  );
  ctx.lineTo(
    toX - headLen * Math.cos(angle + Math.PI / 6.5),
    toY - headLen * Math.sin(angle + Math.PI / 6.5)
  );
  ctx.closePath();
  ctx.fill();

  // Anti-collision badge / pill for vector label
  ctx.font = 'bold 10px "JetBrains Mono", monospace';
  const metrics = ctx.measureText(label);
  const boxW = metrics.width + 12;
  const boxH = 18;

  let boxX = toX + 8;
  let boxY = toY - 9;

  if (labelSide === 'left') {
    boxX = toX - boxW - 8;
    boxY = toY - 9;
  } else if (labelSide === 'outer') {
    boxX = toX + Math.cos(angle) * 8 - (Math.cos(angle) < 0 ? boxW : 0);
    boxY = toY + Math.sin(angle) * 8 - 9;
  }

  // Draw pill background
  ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(15, 23, 42, 0.94)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 4);
  ctx.fill();
  ctx.stroke();

  // Draw label text
  ctx.fillStyle = isLight ? '#0f172a' : '#f8fafc';
  ctx.fillText(label, boxX + 6, boxY + 12);
  ctx.restore();
}
