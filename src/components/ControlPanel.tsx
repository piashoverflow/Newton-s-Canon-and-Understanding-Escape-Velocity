import React from 'react';
import { CONSTANTS, LanguageMode, SimulationParams, SimulationState } from '../types';
import { getCriticalVelocities } from '../physics/engine';
import { TRANSLATIONS, t } from '../i18n/translations';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Flame,
  Wind,
  Layers,
  Sparkles,
  Minus,
  Plus,
  Trash2,
  Gauge,
  Info,
  Circle,
  TrendingUp,
} from 'lucide-react';
import { soundEffects } from '../audio/soundEffects';

interface ControlPanelProps {
  state: SimulationState;
  params: SimulationParams;
  onChangeParams: (updates: Partial<SimulationParams>) => void;
  onFire: () => void;
  onTogglePlay: () => void;
  onStep: () => void;
  onReset: () => void;
  onClearTrail: () => void;
  vectorToggles: {
    velocity: boolean;
    gravity: boolean;
    acceleration: boolean;
    preview: boolean;
    trail: boolean;
    hudGrid: boolean;
  };
  onToggleVector: (key: keyof ControlPanelProps['vectorToggles']) => void;
  languageMode: LanguageMode;
  onSelectPreset: (speed: number, height: number, angle?: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  state,
  params,
  onChangeParams,
  onFire,
  onTogglePlay,
  onStep,
  onReset,
  onClearTrail,
  vectorToggles,
  onToggleVector,
  languageMode,
  onSelectPreset,
}) => {
  const speedMultipliers = [1.0, 20.0, 100.0, 300.0, 500.0, 1000.0];

  // Dynamically compute orbital velocities based on current mountain height
  const r0 = CONSTANTS.EARTH_RADIUS_KM + params.mountainHeight;
  const { vOrbit, vEscape } = getCriticalVelocities(r0);

  // Orbital segment thresholds (km/s)
  const CIRCLE_TOLERANCE = 0.08;
  const PARABOLA_TOLERANCE = 0.10;

  const currentSpeed = params.initialSpeed;
  let activeRegimeKey: 'crash' | 'circular' | 'elliptical' | 'parabolic' | 'hyperbolic' = 'crash';

  if (Math.abs(currentSpeed - vOrbit) <= CIRCLE_TOLERANCE) {
    activeRegimeKey = 'circular';
  } else if (Math.abs(currentSpeed - vEscape) <= PARABOLA_TOLERANCE) {
    activeRegimeKey = 'parabolic';
  } else if (currentSpeed < vOrbit) {
    activeRegimeKey = 'crash';
  } else if (currentSpeed < vEscape) {
    activeRegimeKey = 'elliptical';
  } else {
    activeRegimeKey = 'hyperbolic';
  }

  // Segment metadata with high contrast styling
  const segments = [
    {
      id: 'crash' as const,
      nameEn: 'Crash',
      nameBn: 'ভূপতন',
      fullTitleEn: 'Suborbital Ballistic Crash',
      fullTitleBn: 'উপ-কক্ষীয় ভূপতন',
      conditionFormula: `v < v_orbit (${vOrbit.toFixed(2)} km/s)`,
      descEn: 'Insufficient velocity. Gravity pulls the projectile down into the Earth surface before completing an orbit.',
      descBn: 'বেগ অপর্যাপ্ত; ক্যাননবল সম্পূর্ণ কক্ষপথ পূর্ণ করার আগেই অভিকর্ষের টানে ভূমিতে আছড়ে পড়ে।',
      colorText: 'text-rose-950 font-black',
      bgColor: 'bg-rose-50 border-2 border-rose-300',
      activeColor: 'border-2 border-rose-600 bg-rose-100 text-rose-950 font-black shadow-xs',
      dotColor: 'bg-rose-600',
      defaultSpeed: Math.max(1.0, +(vOrbit * 0.65).toFixed(2)),
    },
    {
      id: 'circular' as const,
      nameEn: 'Circle',
      nameBn: 'বৃত্তাকার',
      fullTitleEn: 'Circular Orbit (Circle)',
      fullTitleBn: 'বৃত্তাকার কক্ষপথ',
      conditionFormula: `v = v_orbit = √(GM/r) ≈ ${vOrbit.toFixed(2)} km/s (e ≈ 0.00)`,
      descEn: 'The projectile falls at the exact curve of the Earth. Altitude remains perfectly constant.',
      descBn: 'পৃথিবীর বক্রতার সাথে পতনের হার নিখুঁতভাবে মিলে যায়; ফলে গোলকটি সমউচ্চতায় চিরকাল বৃত্তাকারে ঘোরে।',
      colorText: 'text-emerald-950 font-black',
      bgColor: 'bg-emerald-50 border-2 border-emerald-300',
      activeColor: 'border-2 border-emerald-600 bg-emerald-100 text-emerald-950 font-black shadow-xs',
      dotColor: 'bg-emerald-600',
      defaultSpeed: +vOrbit.toFixed(2),
    },
    {
      id: 'elliptical' as const,
      nameEn: 'Ellipse',
      nameBn: 'উপবৃত্ত',
      fullTitleEn: 'Elliptical Orbit (Ellipse)',
      fullTitleBn: 'উপবৃত্তাকার কক্ষপথ',
      conditionFormula: `${vOrbit.toFixed(2)} < v < ${vEscape.toFixed(2)} km/s (0 < e < 1)`,
      descEn: 'Closed periodic orbit. Launch point forms periapsis (closest), while the far side reaches a higher apoapsis.',
      descBn: 'বন্ধ কক্ষপথ; নিক্ষেপ বিন্দু হয় পেরিজি (কাছে) এবং বিপরীত প্রান্তে সর্বোচ্চ দূরে অ্যাপোজি তৈরি হয়।',
      colorText: 'text-cyan-950 font-black',
      bgColor: 'bg-sky-50 border-2 border-sky-300',
      activeColor: 'border-2 border-cyan-600 bg-sky-100 text-cyan-950 font-black shadow-xs',
      dotColor: 'bg-cyan-600',
      defaultSpeed: +((vOrbit + vEscape) / 2).toFixed(2),
    },
    {
      id: 'parabolic' as const,
      nameEn: 'Parabola',
      nameBn: 'পরাবৃত্ত',
      fullTitleEn: 'Parabolic Escape (Parabola)',
      fullTitleBn: 'পরাবৃত্তাকার মুক্তিবেগ',
      conditionFormula: `v = v_esc = √(2GM/r) ≈ ${vEscape.toFixed(2)} km/s (e = 1.0, E = 0)`,
      descEn: 'Exact escape velocity. Net specific mechanical energy is exactly zero. Projectile escapes Earth forever.',
      descBn: 'মহাকর্ষীয় বন্ধন ঠিক শূন্য (E = 0); পৃথিবীর মহাকর্ষ চিরতরে ছিন্ন করে পরাবৃত্তাকার পথে মুক্ত হয়।',
      colorText: 'text-amber-950 font-black',
      bgColor: 'bg-amber-50 border-2 border-amber-300',
      activeColor: 'border-2 border-amber-600 bg-amber-100 text-amber-950 font-black shadow-xs',
      dotColor: 'bg-amber-600',
      defaultSpeed: +vEscape.toFixed(2),
    },
    {
      id: 'hyperbolic' as const,
      nameEn: 'Hyperbola',
      nameBn: 'অধিবৃত্ত',
      fullTitleEn: 'Hyperbolic Deep Space (Hyperbola)',
      fullTitleBn: 'অধিবৃত্তীয় মহাশূন্য',
      conditionFormula: `v > v_esc (${vEscape.toFixed(2)} km/s) (e > 1.0, E > 0)`,
      descEn: 'Unbound open trajectory. Projectile escapes Earth with positive residual kinetic energy into interstellar space.',
      descBn: 'ধনাত্মক শক্তি নিয়ে (E > 0) মুক্ত হয়ে অনন্ত মহাশূন্যে অধিবৃত্তাকার উন্মুক্ত পথে চলে যায়।',
      colorText: 'text-purple-950 font-black',
      bgColor: 'bg-purple-50 border-2 border-purple-300',
      activeColor: 'border-2 border-purple-600 bg-purple-100 text-purple-950 font-black shadow-xs',
      dotColor: 'bg-purple-600',
      defaultSpeed: Math.min(16.0, +(vEscape * 1.25).toFixed(2)),
    },
  ];

  const presets = [
    {
      id: 'suborbital',
      titleEn: 'Sub-orbital Crash',
      titleBn: 'উপ-কক্ষীয় ভূপতন',
      speed: Math.max(2.0, +(vOrbit * 0.65).toFixed(2)),
      height: params.mountainHeight,
      angle: 0,
      badge: `${(vOrbit * 0.65).toFixed(2)} km/s`,
      color: 'hover:border-rose-500/50 dark:hover:border-rose-500/50',
    },
    {
      id: 'circular',
      titleEn: 'Circular Orbit',
      titleBn: 'বৃত্তাকার কক্ষপথ',
      speed: +vOrbit.toFixed(2),
      height: params.mountainHeight,
      angle: 0,
      badge: `${vOrbit.toFixed(2)} km/s`,
      color: 'hover:border-emerald-500/50 dark:hover:border-emerald-500/50',
    },
    {
      id: 'elliptical',
      titleEn: 'Elliptical Orbit',
      titleBn: 'উপবৃত্তাকার কক্ষপথ',
      speed: +((vOrbit + vEscape) / 2).toFixed(2),
      height: params.mountainHeight,
      angle: 0,
      badge: `${((vOrbit + vEscape) / 2).toFixed(2)} km/s`,
      color: 'hover:border-cyan-500/50 dark:hover:border-cyan-500/50',
    },
    {
      id: 'parabolic',
      titleEn: 'Parabolic Escape',
      titleBn: 'পরাবৃত্তীয় মুক্তিবেগ',
      speed: +vEscape.toFixed(2),
      height: params.mountainHeight,
      angle: 0,
      badge: `${vEscape.toFixed(2)} km/s`,
      color: 'hover:border-amber-500/50 dark:hover:border-amber-500/50',
    },
    {
      id: 'hyperbolic',
      titleEn: 'Hyperbolic Deep Space',
      titleBn: 'অধিবৃত্তীয় মহাশূন্য',
      speed: Math.min(16.0, +(vEscape * 1.25).toFixed(2)),
      height: params.mountainHeight,
      angle: 0,
      badge: `${Math.min(16.0, +(vEscape * 1.25)).toFixed(2)} km/s`,
      color: 'hover:border-purple-500/50 dark:hover:border-purple-500/50',
    },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Primary Action Controls (Fire, Play/Pause, Step, Reset) */}
      <div className="space-y-2">
        <div className="flex gap-2">
          {/* Main Fire Cannon Button */}
          <button
            onClick={() => {
              soundEffects.playClick();
              onFire();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98] text-white font-black rounded-xl shadow-md border border-cyan-300 transition-all cursor-pointer"
          >
            <Flame className="w-5 h-5 text-amber-300 animate-pulse" />
            <span className="tracking-wider uppercase font-black text-sm">
              Fire Cannon
            </span>
          </button>

          {/* Reset Button */}
          <button
            onClick={() => {
              soundEffects.playClick();
              onReset();
            }}
            title={t(TRANSLATIONS.controls.reset, languageMode)}
            className="p-3 bg-white hover:bg-sky-50 text-slate-800 hover:text-slate-950 rounded-xl border-2 border-sky-200 shadow-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Secondary Playback Bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundEffects.playClick();
              onTogglePlay();
            }}
            disabled={!state.isFired || state.hasCrashed}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg border-2 transition-colors cursor-pointer ${
              !state.isFired || state.hasCrashed
                ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                : state.isRunning
                ? 'bg-amber-100 border-amber-400 text-amber-950 hover:bg-amber-200'
                : 'bg-emerald-100 border-emerald-400 text-emerald-950 hover:bg-emerald-200'
            }`}
          >
            {state.isRunning ? <Pause className="w-3.5 h-3.5 text-amber-900" /> : <Play className="w-3.5 h-3.5 text-emerald-900" />}
            <span>
              {state.isRunning
                ? t(TRANSLATIONS.controls.pause, languageMode)
                : t(TRANSLATIONS.controls.resume, languageMode)}
            </span>
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              onStep();
            }}
            disabled={!state.isFired || state.isRunning || state.hasCrashed}
            className="flex items-center gap-1 py-2 px-3 text-xs font-bold rounded-lg bg-white hover:bg-sky-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 hover:text-slate-950 border-2 border-sky-200 transition-colors cursor-pointer shadow-xs"
          >
            <StepForward className="w-3.5 h-3.5 text-sky-700" />
            <span>{t(TRANSLATIONS.controls.step, languageMode)}</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              onClearTrail();
            }}
            title={t(TRANSLATIONS.controls.clearTrails, languageMode)}
            className="flex items-center gap-1 py-2 px-2.5 text-xs font-bold rounded-lg bg-white hover:bg-sky-50 text-slate-700 hover:text-slate-950 border-2 border-sky-200 transition-colors cursor-pointer shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-700" />
          </button>
        </div>
      </div>

      {/* 2. Interactive Parameter Sliders (Light Blue Shaded Card) */}
      <div className="space-y-4 p-3.5 bg-gradient-to-br from-sky-50/80 via-white to-sky-100/50 border-2 border-sky-300 rounded-2xl shadow-sm shadow-sky-200/50">
        {/* A. Launch Velocity Slider with Explicit Orbital Regimes (Circle, Parabola, Hyperbola, Ellipse, Crash) */}
        <div className="space-y-2.5">
          {/* Header & Speed Value */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-black text-slate-950 text-xs tracking-wide">
              {t(TRANSLATIONS.controls.launchVelocity, languageMode)}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  soundEffects.playClick();
                  onChangeParams({
                    initialSpeed: Math.max(0, +(params.initialSpeed - 0.05).toFixed(2)),
                  });
                }}
                className="w-5 h-5 flex items-center justify-center bg-sky-100 hover:bg-sky-200 text-slate-900 rounded font-black text-[10px] cursor-pointer border border-sky-300"
                title="-0.05 km/s"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-mono font-black text-cyan-950 bg-sky-100/90 px-2 py-0.5 rounded border border-sky-300/80 tabular-nums min-w-[70px] text-right text-xs">
                {params.initialSpeed.toFixed(2)} km/s
              </span>
              <button
                onClick={() => {
                  soundEffects.playClick();
                  onChangeParams({
                    initialSpeed: Math.min(16, +(params.initialSpeed + 0.05).toFixed(2)),
                  });
                }}
                className="w-5 h-5 flex items-center justify-center bg-sky-100 hover:bg-sky-200 text-slate-900 rounded font-black text-[10px] cursor-pointer border border-sky-300"
                title="+0.05 km/s"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Quick Segment Selector Buttons */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-900 font-black">
              <span>{languageMode === 'bn' ? 'কক্ষপথের ধাপ (সেগমেন্ট):' : 'Orbital Segments:'}</span>
              <span className="text-[10px] font-mono text-cyan-900 font-bold">
                {languageMode === 'bn' ? 'ক্লিক করে সেট করুন' : 'Click to snap'}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1">
              {segments.map((seg) => {
                const isActive = activeRegimeKey === seg.id;
                return (
                  <button
                    key={seg.id}
                    onClick={() => {
                      soundEffects.playClick();
                      onChangeParams({ initialSpeed: seg.defaultSpeed });
                    }}
                    title={`${languageMode === 'bn' ? seg.fullTitleBn : seg.fullTitleEn}: ${seg.conditionFormula}`}
                    className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg border text-center transition-all cursor-pointer ${
                      isActive
                        ? `${seg.activeColor} ring-2 ring-cyan-500 shadow-xs scale-[1.02]`
                        : 'bg-sky-50/70 border-sky-200 text-slate-950 hover:bg-sky-100 hover:border-cyan-400 font-black'
                    }`}
                  >
                    <span className="flex items-center gap-1 text-[10px] font-black text-slate-950">
                      <span className={`w-2 h-2 rounded-full ${seg.dotColor} shrink-0`} />
                      <span className="truncate">
                        {languageMode === 'bn' ? seg.nameBn : seg.nameEn}
                      </span>
                    </span>
                    <span className="font-mono text-[10px] font-bold text-slate-800 mt-0.5">
                      {seg.defaultSpeed.toFixed(1)}k
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multi-Segment Color Spectrum Gauge Bar */}
          <div className="space-y-1 pt-1">
            <div className="relative h-2.5 w-full rounded-full overflow-hidden bg-sky-200 flex border border-sky-300">
              {/* 1. Crash Segment (0 to vOrbit) */}
              <div
                style={{ width: `${(vOrbit / 16) * 100}%` }}
                className="h-full bg-rose-500 hover:bg-rose-600 transition-colors"
                title={`Suborbital Crash: 0 - ${vOrbit.toFixed(2)} km/s`}
              />
              {/* 2. Elliptical Segment (vOrbit to vEscape) */}
              <div
                style={{ width: `${((vEscape - vOrbit) / 16) * 100}%` }}
                className="h-full bg-sky-500 hover:bg-sky-600 transition-colors"
                title={`Elliptical: ${vOrbit.toFixed(2)} - ${vEscape.toFixed(2)} km/s`}
              />
              {/* 3. Hyperbolic Segment (vEscape to 16) */}
              <div
                style={{ width: `${((16 - vEscape) / 16) * 100}%` }}
                className="h-full bg-purple-500 hover:bg-purple-600 transition-colors"
                title={`Hyperbolic: > ${vEscape.toFixed(2)} km/s`}
              />

              {/* Exact Circular Orbit Marker (Pin) */}
              <div
                style={{ left: `${(vOrbit / 16) * 100}%` }}
                className="absolute top-0 bottom-0 w-1 -ml-0.5 bg-emerald-400 shadow-xs shadow-emerald-950"
                title={`Circular Orbit: exactly ${vOrbit.toFixed(2)} km/s`}
              />
              {/* Exact Parabolic Escape Marker (Pin) */}
              <div
                style={{ left: `${(vEscape / 16) * 100}%` }}
                className="absolute top-0 bottom-0 w-1 -ml-0.5 bg-amber-400 shadow-xs shadow-amber-950"
                title={`Parabolic Escape: exactly ${vEscape.toFixed(2)} km/s`}
              />

              {/* Current Speed Indicator Needle */}
              <div
                style={{ left: `${(Math.min(16, params.initialSpeed) / 16) * 100}%` }}
                className="absolute -top-1 -bottom-1 w-2 -ml-1 bg-white border-2 border-slate-950 rounded-full shadow-md z-10 transition-all pointer-events-none"
              />
            </div>

            {/* Slider Component */}
            <input
              type="range"
              min={0}
              max={16}
              step={0.05}
              value={params.initialSpeed}
              onChange={(e) => onChangeParams({ initialSpeed: parseFloat(e.target.value) })}
              className="w-full cursor-ew-resize accent-cyan-700 bg-sky-100"
            />

            {/* Milestone Labels below slider (High Contrast) */}
            <div className="flex justify-between items-center text-[11px] font-mono font-bold text-slate-800">
              <span>0 km/s</span>
              <button
                onClick={() => {
                  soundEffects.playClick();
                  onChangeParams({ initialSpeed: +vOrbit.toFixed(2) });
                }}
                className="text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer font-black"
                title="Set Circular Velocity"
              >
                v_circ={vOrbit.toFixed(2)}
              </button>
              <button
                onClick={() => {
                  soundEffects.playClick();
                  onChangeParams({ initialSpeed: +vEscape.toFixed(2) });
                }}
                className="text-amber-800 hover:text-amber-950 hover:underline cursor-pointer font-black"
                title="Set Escape Velocity"
              >
                v_esc={vEscape.toFixed(2)}
              </button>
              <span>16 km/s</span>
            </div>
          </div>

          {/* Detailed Active Segment Spotlight Card (Light Blue & White High Contrast) */}
          {(() => {
            const activeSeg = segments.find((s) => s.id === activeRegimeKey) || segments[0];
            return (
              <div
                className={`p-3 rounded-xl border-2 transition-all ${activeSeg.bgColor} space-y-2 shadow-xs`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${activeSeg.dotColor} animate-ping`} />
                    <span className={`text-xs font-black ${activeSeg.colorText}`}>
                      {languageMode === 'bn' ? activeSeg.fullTitleBn : activeSeg.fullTitleEn}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-black px-2 py-0.5 rounded bg-white text-slate-950 border border-slate-300 shadow-2xs">
                    {params.initialSpeed.toFixed(2)} km/s
                  </span>
                </div>

                {/* Mathematical condition explanation */}
                <div className="text-[11px] font-mono font-bold text-slate-950 bg-white/90 px-2.5 py-1.5 rounded-lg border border-slate-300">
                  <span className="text-slate-700 mr-1.5 font-bold">
                    {languageMode === 'bn' ? 'শর্ত:' : 'Condition:'}
                  </span>
                  <span className="text-cyan-950 font-black">
                    {activeSeg.conditionFormula}
                  </span>
                </div>

                {/* Physical Explanation */}
                <p className="text-xs leading-relaxed text-slate-900 font-semibold">
                  {languageMode === 'bn' ? activeSeg.descBn : activeSeg.descEn}
                </p>
              </div>
            );
          })()}
        </div>

        {/* B. Mountain Height Slider (High Contrast) */}
        <div className="space-y-1.5 pt-2 border-t border-sky-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-black text-slate-950 text-xs tracking-wide">
              {t(TRANSLATIONS.controls.mountainHeight, languageMode)}
            </span>
            <span className="font-mono font-black text-slate-950 tabular-nums bg-sky-100/90 px-2 py-0.5 rounded border border-sky-300/80 text-xs">
              {params.mountainHeight.toFixed(0)} km
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={2000}
            step={25}
            value={params.mountainHeight}
            onChange={(e) => onChangeParams({ mountainHeight: parseFloat(e.target.value) })}
            className="w-full cursor-ew-resize accent-cyan-700"
          />
          <div className="flex justify-between text-[11px] font-mono font-bold text-slate-900">
            <span>0 km (Surface)</span>
            <span>1,000 km</span>
            <span>2,000 km</span>
          </div>
        </div>

        {/* C. Launch Pitch Angle Slider (High Contrast) */}
        <div className="space-y-1.5 pt-2 border-t border-sky-200">
          <div className="flex items-center justify-between text-xs">
            <span className="font-black text-slate-950 text-xs tracking-wide">
              {t(TRANSLATIONS.controls.launchAngle, languageMode)}
            </span>
            <span className="font-mono font-black text-slate-950 tabular-nums bg-sky-100/90 px-2 py-0.5 rounded border border-sky-300/80 text-xs">
              {params.launchAngleDeg > 0 ? `+${params.launchAngleDeg}°` : `${params.launchAngleDeg}°`}
            </span>
          </div>
          <input
            type="range"
            min={-30}
            max={30}
            step={1}
            value={params.launchAngleDeg}
            onChange={(e) => onChangeParams({ launchAngleDeg: parseFloat(e.target.value) })}
            className="w-full cursor-ew-resize accent-cyan-700"
          />
          <div className="flex justify-between text-[11px] font-mono font-bold text-slate-900">
            <span>-30° (Downward)</span>
            <span>0° (Horizontal)</span>
            <span>+30° (Upward)</span>
          </div>
        </div>

        {/* D. Atmospheric Drag Toggle */}
        <div className="pt-2 border-t border-sky-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wind className={`w-4 h-4 ${params.enableDrag ? 'text-amber-600' : 'text-slate-600'}`} />
            <span className="text-xs font-black text-slate-950">
              {t(TRANSLATIONS.controls.drag, languageMode)}
            </span>
          </div>
          <button
            onClick={() => {
              soundEffects.playClick();
              onChangeParams({ enableDrag: !params.enableDrag });
            }}
            className={`px-3 py-1 text-xs font-black rounded-lg transition-colors cursor-pointer border-2 ${
              params.enableDrag
                ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs'
                : 'bg-sky-50 border-sky-200 text-slate-800 hover:text-slate-950 hover:bg-sky-100'
            }`}
          >
            {params.enableDrag ? 'ON (সক্রিয়)' : 'OFF (নিষ্ক্রিয়)'}
          </button>
        </div>
      </div>

      {/* 3. Quick Educational Presets (Light Blue Shaded Cards) */}
      <div className="p-3 bg-gradient-to-br from-sky-50/70 via-white to-sky-100/40 border-2 border-sky-300 rounded-2xl shadow-sm shadow-sky-100/70 space-y-2">
        <span className="text-xs font-black text-slate-950 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-cyan-700" />
          {t(TRANSLATIONS.controls.presets, languageMode)}
        </span>
        <div className="grid grid-cols-1 gap-1.5">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                soundEffects.playClick();
                onSelectPreset(p.speed, p.height, p.angle);
              }}
              className={`flex items-center justify-between p-2.5 bg-white hover:bg-sky-50 border-2 border-sky-200/90 rounded-xl text-left transition-all cursor-pointer group shadow-2xs ${p.color}`}
            >
              <div className="text-xs font-black text-slate-950 group-hover:text-cyan-950">
                {languageMode === 'bn' ? p.titleBn : p.titleEn}
              </div>
              <span className="font-mono text-xs text-cyan-950 font-black px-2 py-0.5 rounded bg-sky-100 border border-sky-300">
                {p.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Vector & Overlay Toggles (Light Blue Shaded Card) */}
      <div className="p-3 bg-gradient-to-br from-sky-50/70 via-white to-sky-100/40 border-2 border-sky-300 rounded-2xl space-y-2.5 shadow-sm shadow-sky-100/70">
        <span className="text-xs font-black text-slate-950 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-cyan-700" />
          {t(TRANSLATIONS.controls.vectors, languageMode)}
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Velocity Vector */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-950 font-bold bg-white p-2 rounded-xl border-2 border-sky-200 hover:bg-sky-50 shadow-2xs">
            <input
              type="checkbox"
              checked={vectorToggles.velocity}
              onChange={() => onToggleVector('velocity')}
              className="rounded accent-cyan-700 w-4 h-4"
            />
            <span className="text-cyan-950 font-mono text-xs font-black">v (Velocity)</span>
          </label>

          {/* Gravity Vector */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-950 font-bold bg-white p-2 rounded-xl border-2 border-orange-200 hover:bg-orange-50 shadow-2xs">
            <input
              type="checkbox"
              checked={vectorToggles.gravity}
              onChange={() => onToggleVector('gravity')}
              className="rounded accent-orange-700 w-4 h-4"
            />
            <span className="text-orange-950 font-mono text-xs font-black">Fg (Gravity)</span>
          </label>

          {/* Acceleration Vector */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-950 font-bold bg-white p-2 rounded-xl border-2 border-purple-200 hover:bg-purple-50 shadow-2xs">
            <input
              type="checkbox"
              checked={vectorToggles.acceleration}
              onChange={() => onToggleVector('acceleration')}
              className="rounded accent-purple-700 w-4 h-4"
            />
            <span className="text-purple-950 font-mono text-xs font-black">a (Accel)</span>
          </label>

          {/* Kepler Analytical Preview */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-950 font-bold bg-white p-2 rounded-xl border-2 border-emerald-200 hover:bg-emerald-50 shadow-2xs">
            <input
              type="checkbox"
              checked={vectorToggles.preview}
              onChange={() => onToggleVector('preview')}
              className="rounded accent-emerald-700 w-4 h-4"
            />
            <span className="text-emerald-950 font-mono text-xs font-black">Preview Path</span>
          </label>

          {/* Orbit Trail */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-950 font-bold bg-white p-2 rounded-xl border-2 border-sky-200 hover:bg-sky-50 shadow-2xs">
            <input
              type="checkbox"
              checked={vectorToggles.trail}
              onChange={() => onToggleVector('trail')}
              className="rounded accent-sky-700 w-4 h-4"
            />
            <span className="text-sky-950 font-mono text-xs font-black">Motion Trail</span>
          </label>

          {/* Distance Radar Grid */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-950 font-bold bg-white p-2 rounded-xl border-2 border-slate-300 hover:bg-slate-50 shadow-2xs">
            <input
              type="checkbox"
              checked={vectorToggles.hudGrid}
              onChange={() => onToggleVector('hudGrid')}
              className="rounded accent-slate-700 w-4 h-4"
            />
            <span className="text-slate-950 font-mono text-xs font-black">Range Grid</span>
          </label>
        </div>
      </div>

      {/* 5. Simulation Speed Multipliers (Light Blue Shaded Card) */}
      <div className="p-3 bg-gradient-to-br from-sky-50/70 via-white to-sky-100/40 border-2 border-sky-300 rounded-2xl space-y-2.5 shadow-sm shadow-sky-100/70">
        <div className="flex items-center justify-between text-xs">
          <span className="font-black text-slate-950 flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-cyan-700" />
            {t(TRANSLATIONS.controls.simSpeed, languageMode)}
          </span>
          <div className="text-right">
            <span className="font-mono text-cyan-950 font-black text-xs bg-sky-100 px-2 py-0.5 rounded border border-sky-300 shadow-2xs">
              {params.simSpeedMultiplier}×
            </span>
            <span className="ml-1.5 text-[11px] text-slate-900 font-bold font-mono">
              ({params.simSpeedMultiplier >= 1000
                ? '~5s / orbit'
                : params.simSpeedMultiplier >= 500
                ? '~11s / orbit'
                : params.simSpeedMultiplier >= 300
                ? '~18s / orbit'
                : params.simSpeedMultiplier >= 100
                ? '~54s / orbit'
                : params.simSpeedMultiplier >= 20
                ? '~4.5m / orbit'
                : '~90m / orbit'})
            </span>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {speedMultipliers.map((speed) => (
            <button
              key={speed}
              onClick={() => {
                soundEffects.playClick();
                onChangeParams({ simSpeedMultiplier: speed });
              }}
              className={`py-1 text-xs font-mono rounded-lg font-black transition-colors cursor-pointer border-2 ${
                params.simSpeedMultiplier === speed
                  ? 'bg-cyan-700 border-cyan-800 text-white shadow-xs'
                  : 'bg-white border-sky-200 text-slate-950 hover:bg-sky-100 hover:border-cyan-400'
              }`}
            >
              {speed}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
