/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CONSTANTS,
  Challenge,
  LanguageMode,
  SimulationParams,
  SimulationState,
  ThemeMode,
} from './types';
import { computeOrbitalElements, rk4Step } from './physics/engine';
import { INITIAL_CHALLENGES } from './physics/challenges';
import { soundEffects } from './audio/soundEffects';
import { TopBar } from './components/TopBar';
import { SimulationCanvas } from './components/SimulationCanvas';
import { TelemetryDeck } from './components/TelemetryDeck';
import { ControlPanel } from './components/ControlPanel';
import { DerivationsModal } from './components/DerivationsModal';
import { ChallengeModal } from './components/ChallengeModal';
import { Trophy, Activity, Sliders, PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronUp } from 'lucide-react';

export default function App() {
  // 1. Theme State (Default: light, can toggle to dark)
  const [theme, setTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // 2. Simulation Parameters
  const [params, setParams] = useState<SimulationParams>({
    initialSpeed: 7.73, // km/s (circular orbit at 300 km)
    mountainHeight: 300, // km
    launchAngleDeg: 0, // horizontal
    enableDrag: false,
    simSpeedMultiplier: 300.0, // Default 300x speed (~18s per full orbit around Earth)
  });

  // Helper to compute initial state
  const getInitialState = (currentParams: SimulationParams): SimulationState => {
    const r0 = CONSTANTS.EARTH_RADIUS_KM + currentParams.mountainHeight;
    const angleRad = (currentParams.launchAngleDeg * Math.PI) / 180;
    // Initial cannon position at North Pole: x=0, y=r0
    // Tangent horizontal direction is +X, rotated by pitch angle
    const x0 = 0;
    const y0 = r0;
    const vx0 = currentParams.initialSpeed * Math.cos(angleRad);
    const vy0 = currentParams.initialSpeed * Math.sin(angleRad);

    const elements = computeOrbitalElements(x0, y0, vx0, vy0);

    return {
      x: x0,
      y: y0,
      vx: vx0,
      vy: vy0,
      time: 0,
      isRunning: false,
      isFired: false,
      hasCrashed: false,
      hasEscaped: false,
      isChallengeMode: false,
      revolutions: 0,
      trail: [{ x: x0, y: y0, vx: vx0, vy: vy0, t: 0 }],
      orbitType: elements.orbitType,
      altitude: elements.altitude,
      distance: elements.r,
      speed: elements.v,
      eccentricity: elements.eccentricity,
      semiMajorAxis: elements.semiMajorAxis,
      periapsis: elements.periapsis,
      apoapsis: elements.apoapsis,
      orbitalPeriodMinutes: elements.periodMin,
      specificKineticEnergy: elements.specificKineticEnergy,
      specificPotentialEnergy: elements.specificPotentialEnergy,
      totalSpecificEnergy: elements.totalSpecificEnergy,
    };
  };

  // 3. Simulation Dynamic State
  const [state, setState] = useState<SimulationState>(() => getInitialState(params));

  // Mutable ref for tight 60 FPS physics loop
  const simStateRef = useRef<SimulationState>(state);
  simStateRef.current = state;

  const simParamsRef = useRef<SimulationParams>(params);
  simParamsRef.current = params;

  // 4. Vector Toggles
  const [vectorToggles, setVectorToggles] = useState({
    velocity: true,
    gravity: true,
    acceleration: false,
    preview: true,
    trail: true,
    hudGrid: true,
  });

  // 5. Camera & Sound & I18n UI State
  const [cameraMode, setCameraMode] = useState<'earth' | 'projectile'>('earth');
  const [languageMode, setLanguageMode] = useState<LanguageMode>('bilingual');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [muzzleFlashTrigger, setMuzzleFlashTrigger] = useState<number>(0);
  const [crashExplosionTrigger, setCrashExplosionTrigger] = useState<number>(0);

  // 6. Modals State
  const [isDerivationsOpen, setIsDerivationsOpen] = useState(false);
  const [isChallengesOpen, setIsChallengesOpen] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>(INITIAL_CHALLENGES);
  const [celebrationBanner, setCelebrationBanner] = useState<string | null>(null);

  // Sidebar, Fullscreen & Floating Telemetry View States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTelemetryCollapsed, setIsTelemetryCollapsed] = useState(true);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = () => {
    soundEffects.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'f' || e.key === 'F') {
        handleToggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync initial state when mountain height or launch velocity change before firing
  useEffect(() => {
    if (!state.isFired) {
      setState(getInitialState(params));
    }
  }, [params.mountainHeight, params.launchAngleDeg, params.initialSpeed, state.isFired]);

  // Handle Mute Toggle
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEffects.setMuted(nextMuted);
  };

  // Handle Theme Toggle
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // 7. Action Handlers: Fire, Play/Pause, Step, Reset
  const handleFire = () => {
    const fresh = getInitialState(params);
    fresh.isFired = true;
    fresh.isRunning = true;
    setState(fresh);
    setMuzzleFlashTrigger((c) => c + 1);
    soundEffects.playCannonBlast();
  };

  const handleTogglePlay = () => {
    setState((prev) => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const handleStep = () => {
    if (!state.isFired || state.hasCrashed) return;
    stepSimulation(0.5);
  };

  const handleReset = () => {
    setState(getInitialState(params));
  };

  const handleClearTrail = () => {
    setState((prev) => ({
      ...prev,
      trail: prev.isFired ? [{ x: prev.x, y: prev.y, vx: prev.vx, vy: prev.vy, t: prev.time }] : [],
    }));
  };

  const handleToggleVector = (key: keyof typeof vectorToggles) => {
    setVectorToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Preset Selector
  const handleSelectPreset = (speed: number, height: number, angle: number = 0) => {
    setParams((prev) => ({
      ...prev,
      initialSpeed: speed,
      mountainHeight: height,
      launchAngleDeg: angle,
    }));
    const fresh = getInitialState({
      ...params,
      initialSpeed: speed,
      mountainHeight: height,
      launchAngleDeg: angle,
    });
    fresh.isFired = true;
    fresh.isRunning = true;
    setState(fresh);
    setMuzzleFlashTrigger((c) => c + 1);
    soundEffects.playCannonBlast();
  };

  // Challenge preset apply
  const handleApplyChallengePreset = (challenge: Challenge) => {
    if (challenge.presetParams) {
      setParams((prev) => ({ ...prev, ...challenge.presetParams }));
    }
    const fresh = getInitialState({
      ...params,
      ...(challenge.presetParams || {}),
    });
    fresh.isFired = true;
    fresh.isRunning = true;
    fresh.isChallengeMode = true;
    setState(fresh);
    setMuzzleFlashTrigger((c) => c + 1);
    soundEffects.playCannonBlast();
  };

  // 8. Core Physics Step Execution
  const stepSimulation = useCallback((dtSeconds: number) => {
    const s = { ...simStateRef.current };
    const p = simParamsRef.current;

    if (!s.isFired || !s.isRunning || s.hasCrashed) return;

    // Sub-stepping for RK4 stability
    const subSteps = Math.max(10, Math.min(60, Math.floor(dtSeconds * 20)));
    const subDt = dtSeconds / subSteps;

    let curX = s.x;
    let curY = s.y;
    let curVx = s.vx;
    let curVy = s.vy;
    let crashed = false;

    for (let step = 0; step < subSteps; step++) {
      const next = rk4Step(curX, curY, curVx, curVy, subDt, p.enableDrag);
      curX = next.x;
      curY = next.y;
      curVx = next.vx;
      curVy = next.vy;

      // Check collision with Earth (r <= R_earth)
      const r = Math.sqrt(curX * curX + curY * curY);
      if (r <= CONSTANTS.EARTH_RADIUS_KM) {
        crashed = true;
        // Clamp to Earth surface
        curX = (curX / r) * CONSTANTS.EARTH_RADIUS_KM;
        curY = (curY / r) * CONSTANTS.EARTH_RADIUS_KM;
        break;
      }
    }

    const nextTime = s.time + dtSeconds;
    const elements = computeOrbitalElements(curX, curY, curVx, curVy);
    const escaped = elements.r > CONSTANTS.EARTH_RADIUS_KM * 25;

    // Track orbital revolutions (crossing positive Y axis from negative X to positive X)
    let revs = s.revolutions || 0;
    if (s.x < 0 && curX >= 0 && curY > 0) {
      revs += 1;
      soundEffects.playOrbitSuccess();
    }

    // Append to trajectory trail (sampled to avoid too dense array)
    const newTrail = [...s.trail];
    if (newTrail.length === 0 || nextTime - newTrail[newTrail.length - 1].t > 0.15) {
      newTrail.push({
        x: curX,
        y: curY,
        vx: curVx,
        vy: curVy,
        t: nextTime,
      });
      // Cap trail length (keep multiple full revolutions visible)
      if (newTrail.length > 8000) {
        newTrail.splice(0, newTrail.length - 8000);
      }
    }

    if (crashed && !s.hasCrashed) {
      soundEffects.playCrashImpact();
      setCrashExplosionTrigger((c) => c + 1);
    } else if (escaped && !s.hasEscaped) {
      soundEffects.playEscapeBoom();
    }

    const nextState: SimulationState = {
      ...s,
      x: curX,
      y: curY,
      vx: curVx,
      vy: curVy,
      time: nextTime,
      isRunning: !crashed,
      hasCrashed: crashed,
      hasEscaped: escaped,
      revolutions: revs,
      trail: newTrail,
      orbitType: elements.orbitType,
      altitude: elements.altitude,
      distance: elements.r,
      speed: elements.v,
      eccentricity: elements.eccentricity,
      semiMajorAxis: elements.semiMajorAxis,
      periapsis: elements.periapsis,
      apoapsis: elements.apoapsis,
      orbitalPeriodMinutes: elements.periodMin,
      specificKineticEnergy: elements.specificKineticEnergy,
      specificPotentialEnergy: elements.specificPotentialEnergy,
      totalSpecificEnergy: elements.totalSpecificEnergy,
    };

    setState(nextState);

    // Evaluate active challenges
    setChallenges((prevChallenges) => {
      let updated = false;
      const nextList = prevChallenges.map((ch) => {
        if (!ch.isCompleted && ch.evaluate(nextState, p)) {
          updated = true;
          soundEffects.playOrbitSuccess();
          setCelebrationBanner(
            languageMode === 'bn'
              ? `অভিনন্দন! "${ch.titleBn}" সফলভাবে সম্পন্ন হয়েছে!`
              : `Challenge Completed: "${ch.titleEn}"!`
          );
          setTimeout(() => setCelebrationBanner(null), 5000);
          return { ...ch, isCompleted: true };
        }
        return ch;
      });
      return updated ? nextList : prevChallenges;
    });
  }, [languageMode]);

  // 9. Animation Frame Loop for Time Progression
  useEffect(() => {
    let animId: number;
    let lastTimestamp: number = performance.now();

    const loop = (currentTimestamp: number) => {
      const deltaSec = (currentTimestamp - lastTimestamp) / 1000;
      lastTimestamp = currentTimestamp;

      // Bound deltaSec to prevent giant jumps when tab switches
      const safeDelta = Math.min(deltaSec, 0.1);

      if (simStateRef.current.isFired && simStateRef.current.isRunning && !simStateRef.current.hasCrashed) {
        // Multiplied by user simulation speed setting
        const effectiveDt = safeDelta * simParamsRef.current.simSpeedMultiplier;
        stepSimulation(effectiveDt);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [stepSimulation]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans select-none transition-colors">
      {/* 1. Universal Top Navigation Bar with UDVASH branding and theme toggle */}
      <TopBar
        languageMode={languageMode}
        onChangeLanguage={setLanguageMode}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenDerivations={() => setIsDerivationsOpen(true)}
        onOpenChallenges={() => setIsChallengesOpen(true)}
        onResetAll={handleReset}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* 2. Main Content Split View: Slim Controls on the LEFT, Expanded Canvas with Floating Telemetry on the RIGHT */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Side: Slim Dedicated Control Panel */}
        {/* Left Side: Slim Dedicated Control Panel (Clean Light Blue & White Appearance) */}
        <aside
          className={`${
            isSidebarCollapsed
              ? 'w-0 border-0 opacity-0 overflow-hidden pointer-events-none'
              : 'w-full lg:w-[295px] xl:w-[315px] opacity-100'
          } h-1/2 lg:h-full bg-gradient-to-b from-sky-50 via-white to-blue-50/40 flex flex-col shrink-0 overflow-hidden border-b lg:border-b-0 lg:border-r-2 border-sky-300 transition-all duration-300 z-10 shadow-lg`}
        >
          {/* Header of the slim Left Sidebar with collapse button */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-sky-100 via-sky-50 to-blue-100 border-b-2 border-sky-300 shrink-0">
            <span className="text-xs font-black text-slate-950 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-cyan-800" />
              {languageMode === 'bn' ? 'সিমুলেশন নিয়ন্ত্রণ' : 'Simulation Controls'}
            </span>
            <button
              onClick={() => {
                soundEffects.playClick();
                setIsSidebarCollapsed(true);
              }}
              title={languageMode === 'bn' ? 'কন্ট্রোল লুকান (ক্যানভাস বড় করুন)' : 'Collapse Controls (Expand Canvas)'}
              className="p-1 hover:bg-sky-200 text-slate-900 hover:text-slate-950 rounded-lg transition-colors cursor-pointer border border-sky-200"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* Sidebar Scrollable Body: Pure Controls */}
          <div className="flex-1 overflow-y-auto p-3 bg-sky-50/30">
            <ControlPanel
              state={state}
              params={params}
              onChangeParams={(updates) => setParams((p) => ({ ...p, ...updates }))}
              onFire={handleFire}
              onTogglePlay={handleTogglePlay}
              onStep={handleStep}
              onReset={handleReset}
              onClearTrail={handleClearTrail}
              vectorToggles={vectorToggles}
              onToggleVector={handleToggleVector}
              languageMode={languageMode}
              onSelectPreset={handleSelectPreset}
            />
          </div>
        </aside>

        {/* Right Side: Interactive 2D Gravitational Canvas Stage with Floating Telemetry HUD */}
        <main className="flex-1 relative h-1/2 lg:h-full overflow-hidden bg-[#030712]">
          {/* Floating button to reopen sidebar when collapsed */}
          {isSidebarCollapsed && (
            <button
              onClick={() => {
                soundEffects.playClick();
                setIsSidebarCollapsed(false);
              }}
              title={languageMode === 'bn' ? 'কন্ট্রোল প্যানেল খুলুন' : 'Open Controls'}
              className="absolute top-16 left-4 z-20 flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-sky-50 text-slate-950 border-2 border-sky-300 rounded-xl shadow-2xl backdrop-blur-md text-xs font-black transition-all hover:scale-105 cursor-pointer"
            >
              <PanelLeftOpen className="w-4 h-4 text-cyan-800" />
              <span>{languageMode === 'bn' ? 'কন্ট্রোল' : 'Controls'}</span>
            </button>
          )}

          {/* Floating Live Telemetry Deck on Right Side (Crisp Light Blue & White Card) */}
          <div
            className={`absolute top-4 right-4 z-20 transition-all duration-300 ${
              isTelemetryCollapsed
                ? 'w-auto'
                : 'w-[315px] sm:w-[340px] max-w-[calc(100vw-2rem)]'
            }`}
          >
            <div className="bg-gradient-to-br from-sky-50 via-white to-sky-100/50 backdrop-blur-xl border-2 border-sky-300 rounded-2xl shadow-xl shadow-sky-200/50 overflow-hidden transition-all ring-1 ring-sky-400/30">
              {/* Floating Header */}
              <div
                onClick={() => {
                  soundEffects.playClick();
                  setIsTelemetryCollapsed((prev) => !prev);
                }}
                className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-sky-100/90 via-sky-50 to-blue-100/90 border-b-2 border-sky-300 cursor-pointer select-none hover:bg-sky-200/70 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-600"></span>
                  </span>
                  <span className="text-xs font-black text-slate-950 flex items-center gap-1.5 truncate">
                    <Activity className="w-4 h-4 text-cyan-800 shrink-0" />
                    {languageMode === 'bn' ? 'লাইভ টেলিমেট্রি' : 'Live Telemetry'}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-white text-cyan-950 border border-sky-300 shadow-2xs">
                    {state.speed.toFixed(2)} km/s
                  </span>
                  {isTelemetryCollapsed ? (
                    <span className="text-[11px] font-black bg-cyan-600 hover:bg-cyan-700 text-white px-2 py-0.5 rounded-lg shadow-2xs flex items-center gap-1">
                      <span>{languageMode === 'bn' ? 'খুলুন' : 'Open'}</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <button
                      type="button"
                      title="Minimize Telemetry"
                      className="p-1 text-slate-950 hover:text-cyan-800 rounded transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Body */}
              {!isTelemetryCollapsed && (
                <div className="p-3 max-h-[calc(100vh-140px)] overflow-y-auto space-y-3 bg-gradient-to-b from-sky-50/50 via-white to-sky-50/40">
                  <TelemetryDeck
                    state={state}
                    params={params}
                    languageMode={languageMode}
                  />
                </div>
              )}
            </div>
          </div>

          <SimulationCanvas
            state={state}
            params={params}
            vectorToggles={vectorToggles}
            cameraMode={cameraMode}
            onToggleCameraMode={() =>
              setCameraMode((m) => (m === 'earth' ? 'projectile' : 'earth'))
            }
            muzzleFlashTrigger={muzzleFlashTrigger}
            crashExplosionTrigger={crashExplosionTrigger}
            theme={theme}
            languageMode={languageMode}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />
        </main>
      </div>

      {/* 3. Celebratory Achievement Banner */}
      {celebrationBanner && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-emerald-900/95 dark:bg-emerald-950/95 border border-emerald-400 rounded-2xl shadow-2xl text-emerald-100 dark:text-emerald-200 text-sm font-semibold backdrop-blur-md animate-in slide-in-from-bottom duration-300">
          <Trophy className="w-5 h-5 text-amber-300 animate-bounce" />
          <span>{celebrationBanner}</span>
        </div>
      )}

      {/* 4. Modals */}
      <DerivationsModal
        isOpen={isDerivationsOpen}
        onClose={() => setIsDerivationsOpen(false)}
        languageMode={languageMode}
      />

      <ChallengeModal
        isOpen={isChallengesOpen}
        onClose={() => setIsChallengesOpen(false)}
        challenges={challenges}
        onApplyChallengePreset={handleApplyChallengePreset}
        languageMode={languageMode}
      />
    </div>
  );
}
