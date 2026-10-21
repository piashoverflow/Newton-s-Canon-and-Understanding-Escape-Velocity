import React from 'react';
import { LanguageMode, SimulationParams, SimulationState } from '../types';
import { TRANSLATIONS, t } from '../i18n/translations';
import { Activity, Gauge, Navigation, Compass, Zap, Clock, RotateCcw } from 'lucide-react';

interface TelemetryDeckProps {
  state: SimulationState;
  params: SimulationParams;
  languageMode: LanguageMode;
}

export const TelemetryDeck: React.FC<TelemetryDeckProps> = ({
  state,
  languageMode,
}) => {
  const orbitMeta = TRANSLATIONS.orbitTypes[state.orbitType];
  const orbitLabel = t(orbitMeta, languageMode);
  const orbitDesc = languageMode === 'bn' ? orbitMeta.descriptionBn : orbitMeta.descriptionEn;

  // Orbit badge styling
  let badgeColor = 'bg-sky-50 text-slate-950 border-2 border-sky-300';
  if (state.orbitType === 'circular') {
    badgeColor = 'bg-emerald-50 text-emerald-950 border-2 border-emerald-400';
  } else if (state.orbitType === 'elliptical') {
    badgeColor = 'bg-sky-50 text-cyan-950 border-2 border-sky-400';
  } else if (state.orbitType === 'parabolic') {
    badgeColor = 'bg-amber-50 text-amber-950 border-2 border-amber-400';
  } else if (state.orbitType === 'hyperbolic') {
    badgeColor = 'bg-purple-50 text-purple-950 border-2 border-purple-400';
  } else if (state.orbitType === 'suborbital_crash') {
    badgeColor = 'bg-rose-50 text-rose-950 border-2 border-rose-400';
  }

  // Energy Bar Calculations
  const maxEnergyScale = 80; // MJ/kg display range
  const K = Math.max(0, state.specificKineticEnergy);
  const U = state.specificPotentialEnergy; // negative
  const E = state.totalSpecificEnergy;

  const kPercent = Math.min(50, (K / maxEnergyScale) * 50);
  const uPercent = Math.min(50, (Math.abs(U) / maxEnergyScale) * 50);
  const ePosPercent = Math.max(0, Math.min(100, 50 + (E / maxEnergyScale) * 50));

  const isBound = E < 0;

  return (
    <div className="space-y-3.5">
      {/* 1. Orbit Classification Header Banner */}
      <div className={`p-3 rounded-xl backdrop-blur-sm transition-all shadow-xs ${badgeColor}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 shrink-0 text-cyan-800" />
            <span className="font-black text-sm tracking-wide text-slate-950">{orbitLabel}</span>
          </div>
          <span className="font-mono text-xs font-black tabular-nums px-2 py-0.5 rounded bg-white text-slate-950 border-2 border-slate-300 shadow-2xs">
            e = {state.eccentricity.toFixed(4)}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-slate-900 font-bold leading-relaxed font-sans">
          {orbitDesc}
        </p>
      </div>

      {/* 2. Primary Telemetry Metric Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Speed */}
        <div className="p-3 bg-gradient-to-br from-sky-50/80 via-white to-sky-100/50 border-2 border-sky-300 rounded-xl shadow-sm shadow-sky-100/80">
          <div className="flex items-center justify-between text-xs text-slate-900 font-black mb-1">
            <span className="flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-cyan-700" />
              {t(TRANSLATIONS.telemetry.velocity, languageMode)}
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-800">km/s</span>
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-cyan-950">
            {state.speed.toFixed(2)}
          </div>
        </div>

        {/* Altitude */}
        <div className="p-3 bg-gradient-to-br from-sky-50/80 via-white to-sky-100/50 border-2 border-sky-300 rounded-xl shadow-sm shadow-sky-100/80">
          <div className="flex items-center justify-between text-xs text-slate-900 font-black mb-1">
            <span className="flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5 text-emerald-700" />
              {t(TRANSLATIONS.telemetry.altitude, languageMode)}
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-800">km</span>
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-emerald-950">
            {Math.max(0, state.altitude).toFixed(1)}
          </div>
        </div>

        {/* Periapsis (Lowest) */}
        <div className="p-3 bg-gradient-to-br from-sky-50/80 via-white to-sky-100/50 border-2 border-sky-300 rounded-xl shadow-sm shadow-sky-100/80 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1 text-xs text-slate-900 font-black mb-1.5">
            <span className="flex items-center gap-1.5 leading-snug">
              <Compass className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>{t(TRANSLATIONS.telemetry.periapsis, languageMode)}</span>
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-700 shrink-0">km</span>
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-slate-950">
            {state.periapsis > 0 ? (state.periapsis - 6371).toFixed(0) : '0'}
          </div>
        </div>

        {/* Apoapsis (Highest) */}
        <div className="p-3 bg-gradient-to-br from-sky-50/80 via-white to-sky-100/50 border-2 border-sky-300 rounded-xl shadow-sm shadow-sky-100/80 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1 text-xs text-slate-900 font-black mb-1.5">
            <span className="flex items-center gap-1.5 leading-snug">
              <Compass className="w-3.5 h-3.5 text-purple-700 shrink-0" />
              <span>{t(TRANSLATIONS.telemetry.apoapsis, languageMode)}</span>
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-700 shrink-0">km</span>
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-slate-950">
            {Number.isFinite(state.apoapsis)
              ? (state.apoapsis - 6371).toFixed(0)
              : '∞ (Escape)'}
          </div>
        </div>
      </div>

      {/* Orbital Period & Revolutions Completed */}
      {state.orbitalPeriodMinutes !== null && state.orbitType !== 'suborbital_crash' && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between p-2.5 bg-gradient-to-br from-sky-50 via-white to-sky-100/40 border-2 border-sky-300 rounded-lg shadow-sm shadow-sky-100/60">
            <span className="flex items-center gap-1.5 text-slate-900 font-black">
              <Clock className="w-3.5 h-3.5 text-cyan-700" />
              {t(TRANSLATIONS.telemetry.orbitPeriod, languageMode)}
            </span>
            <span className="font-mono tabular-nums font-black text-slate-950 text-xs">
              {state.orbitalPeriodMinutes < 120
                ? `${state.orbitalPeriodMinutes.toFixed(1)}m`
                : `${(state.orbitalPeriodMinutes / 60).toFixed(1)}h`}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/40 border-2 border-emerald-300 rounded-lg shadow-sm shadow-emerald-100/60">
            <span className="flex items-center gap-1.5 text-emerald-950 font-black">
              <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
              {languageMode === 'bn' ? 'আবর্তন' : 'Laps'}
            </span>
            <span className="font-mono tabular-nums font-black text-emerald-950 text-sm">
              {state.revolutions || 0}
            </span>
          </div>
        </div>
      )}

      {/* 3. Dynamic Mechanical Energy Bar (Crucial for Conceptual Intuition) */}
      <div className="p-3.5 bg-gradient-to-br from-sky-50/70 via-white to-sky-100/40 border-2 border-sky-300 rounded-xl space-y-3 shadow-sm shadow-sky-100/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-950 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-600" />
            {t(TRANSLATIONS.telemetry.energies, languageMode)}
          </span>
          <span className="text-xs font-mono font-black text-slate-800">MJ/kg</span>
        </div>

        {/* Dynamic Split Dual-Energy Graphic */}
        <div className="relative pt-6 pb-2">
          {/* Zero threshold center mark */}
          <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-slate-500 z-10">
            <div className="absolute -top-5 -translate-x-1/2 font-mono text-[11px] text-slate-950 font-black bg-white px-1.5 py-0.5 rounded border-2 border-slate-400 shadow-2xs">
              0 MJ
            </div>
          </div>

          {/* Negative & Positive Background track */}
          <div className="relative h-6 w-full bg-slate-100 rounded-lg overflow-hidden border-2 border-slate-300 flex">
            {/* Left side: Potential Energy U (Negative, from center expanding left) */}
            <div className="relative w-1/2 h-full flex justify-end bg-slate-200/60">
              <div
                className="h-full bg-rose-500 border-r border-rose-400 transition-all duration-150"
                style={{ width: `${uPercent}%` }}
                title={`Potential Energy: ${U.toFixed(1)} MJ/kg`}
              />
            </div>

            {/* Right side: Kinetic Energy K (Positive, from center expanding right) */}
            <div className="relative w-1/2 h-full flex justify-start bg-slate-200/60">
              <div
                className="h-full bg-emerald-500 border-l border-emerald-400 transition-all duration-150"
                style={{ width: `${kPercent}%` }}
                title={`Kinetic Energy: ${K.toFixed(1)} MJ/kg`}
              />
            </div>
          </div>

          {/* Dynamic Total Energy Marker E cursor */}
          <div
            className="absolute top-4 w-3.5 h-10 -ml-[7px] pointer-events-none transition-all duration-150 z-20 flex flex-col items-center"
            style={{ left: `${ePosPercent}%` }}
          >
            <div className="w-3 h-3 rounded-full bg-cyan-600 shadow-[0_0_8px_rgba(2,132,199,0.9)] border-2 border-white" />
            <div className="w-[2px] h-6 bg-cyan-700" />
          </div>
        </div>

        {/* Numerical Breakdown & Status */}
        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-sky-100">
          <div className="bg-rose-50/70 p-1.5 rounded-lg border border-rose-200">
            <div className="text-[11px] text-rose-950 font-black">U (বিভবশক্তি)</div>
            <div className="font-mono text-xs tabular-nums text-rose-950 font-black">
              {U.toFixed(1)}
            </div>
          </div>
          <div className="bg-sky-50/70 p-1.5 rounded-lg border border-sky-200">
            <div className="text-[11px] text-cyan-950 font-black">ℰ (মোট শক্তি)</div>
            <div className={`font-mono text-xs tabular-nums font-black ${isBound ? 'text-amber-950' : 'text-purple-950'}`}>
              {E >= 0 ? `+${E.toFixed(1)}` : E.toFixed(1)}
            </div>
          </div>
          <div className="bg-emerald-50/70 p-1.5 rounded-lg border border-emerald-200">
            <div className="text-[11px] text-emerald-950 font-black">K (গতিশক্তি)</div>
            <div className="font-mono text-xs tabular-nums text-emerald-950 font-black">
              {K.toFixed(1)}
            </div>
          </div>
        </div>

        {/* State explanation pill */}
        <div className={`text-center py-1.5 px-2 rounded-lg text-xs font-black border-2 ${
          isBound
            ? 'bg-amber-50 text-amber-950 border-amber-300'
            : 'bg-purple-50 text-purple-950 border-purple-300'
        }`}>
          {isBound
            ? t(TRANSLATIONS.telemetry.boundState, languageMode)
            : t(TRANSLATIONS.telemetry.escapeState, languageMode)}
        </div>
      </div>
    </div>
  );
};
