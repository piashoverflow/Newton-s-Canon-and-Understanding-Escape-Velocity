import React from 'react';
import { LanguageMode, ThemeMode } from '../types';
import { Volume2, VolumeX, BookOpen, Award, Sun, Moon, Maximize, Minimize, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { soundEffects } from '../audio/soundEffects';

interface TopBarProps {
  languageMode: LanguageMode;
  onChangeLanguage: (mode: LanguageMode) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenDerivations: () => void;
  onOpenChallenges: () => void;
  onResetAll: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  languageMode,
  onChangeLanguage,
  isMuted,
  onToggleMute,
  theme,
  onToggleTheme,
  onOpenDerivations,
  onOpenChallenges,
  isFullscreen = false,
  onToggleFullscreen,
  isSidebarCollapsed = false,
  onToggleSidebar,
}) => {
  return (
    <header className="h-14 border-b-2 border-sky-300 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20 shrink-0 shadow-xs transition-colors">
      {/* Zone 1: Brand Wordmark & Sidebar Toggle */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={() => {
              soundEffects.playClick();
              onToggleSidebar();
            }}
            title={
              isSidebarCollapsed
                ? languageMode === 'bn' ? 'কন্ট্রোল প্যানেল খুলুন' : 'Open Controls'
                : languageMode === 'bn' ? 'কন্ট্রোল প্যানেল লুকান' : 'Collapse Controls'
            }
            className="p-1.5 rounded-lg border-2 border-sky-300 bg-sky-50 hover:bg-sky-100 text-slate-950 hover:text-cyan-800 transition-colors cursor-pointer shadow-xs"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-cyan-800" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-cyan-800" />
            )}
          </button>
        )}
        <span className="text-base font-black tracking-tight text-slate-950 font-sans">
          Newton's Cannon Lab
        </span>
        <span className="hidden lg:inline-block text-xs text-sky-500 font-black" aria-hidden="true">
          ·
        </span>
        <span className="hidden lg:inline-block text-xs text-slate-900 font-bold font-sans">
          {languageMode === 'bn'
            ? 'কক্ষীয় গতিবিদ্যা ও মুক্তিবেগ ট্র্যাজেক্টরি'
            : 'Gravitational Trajectory & Escape Velocity'}
        </span>
      </div>

      {/* Zone 2: Navigation Links (Ultra High Contrast & Light Blue Accents) */}
      <nav className="hidden md:flex items-center gap-3 text-xs font-black text-slate-950">
        <button
          onClick={() => {
            soundEffects.playClick();
            onOpenDerivations();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-slate-950 border-2 border-sky-300 hover:border-cyan-500 transition-colors cursor-pointer shadow-xs"
        >
          <BookOpen className="w-4 h-4 text-cyan-800" />
          <span className="font-black text-slate-950">{languageMode === 'bn' ? 'গাণিতিক প্রতিপাদন' : 'Derivations'}</span>
        </button>

        <button
          onClick={() => {
            soundEffects.playClick();
            onOpenChallenges();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-slate-950 border-2 border-emerald-300 hover:border-emerald-500 transition-colors cursor-pointer shadow-xs"
        >
          <Award className="w-4 h-4 text-emerald-800" />
          <span className="font-black text-slate-950">{languageMode === 'bn' ? 'পদার্থবিজ্ঞান চ্যালেঞ্জ' : 'Challenges'}</span>
        </button>
      </nav>

      {/* Zone 3: Actions & UDVASH Branding on the Right */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile quick buttons */}
        <button
          onClick={() => {
            soundEffects.playClick();
            onOpenDerivations();
          }}
          className="md:hidden p-1.5 text-slate-900 hover:text-slate-950 hover:bg-sky-100 rounded transition-colors"
          title="Derivations"
        >
          <BookOpen className="w-4 h-4 text-cyan-800" />
        </button>

        <button
          onClick={() => {
            soundEffects.playClick();
            onOpenChallenges();
          }}
          className="md:hidden p-1.5 text-slate-900 hover:text-slate-950 hover:bg-emerald-100 rounded transition-colors"
          title="Challenges"
        >
          <Award className="w-4 h-4 text-emerald-800" />
        </button>

        {/* Light / Dark Theme Toggle */}
        <button
          onClick={() => {
            soundEffects.playClick();
            onToggleTheme();
          }}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          className="p-1.5 sm:p-2 text-slate-950 hover:text-slate-950 bg-sky-50 hover:bg-sky-100 rounded-lg border-2 border-sky-300 transition-colors cursor-pointer shadow-xs"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-700" />
          )}
        </button>

        {/* Fullscreen Toggle */}
        {onToggleFullscreen && (
          <button
            onClick={() => {
              soundEffects.playClick();
              onToggleFullscreen();
            }}
            title={isFullscreen ? 'Exit Full Screen (F)' : 'Full Screen Simulation (F)'}
            className={`p-1.5 sm:p-2 rounded-lg border-2 transition-colors cursor-pointer shadow-xs ${
              isFullscreen
                ? 'bg-cyan-100 border-cyan-500 text-cyan-950 font-black'
                : 'text-slate-950 hover:text-slate-950 bg-sky-50 hover:bg-sky-100 border-sky-300 font-bold'
            }`}
          >
            {isFullscreen ? <Minimize className="w-4 h-4 text-cyan-800" /> : <Maximize className="w-4 h-4 text-slate-800" />}
          </button>
        )}

        {/* Audio Mute/Unmute */}
        <button
          onClick={() => {
            soundEffects.playClick();
            onToggleMute();
          }}
          title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          className="p-1.5 sm:p-2 text-slate-950 hover:text-slate-950 bg-sky-50 hover:bg-sky-100 rounded-lg border-2 border-sky-300 transition-colors cursor-pointer shadow-xs"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-rose-600" />
          ) : (
            <Volume2 className="w-4 h-4 text-cyan-800" />
          )}
        </button>

        {/* Language Selector (Light Blue & White High Contrast) */}
        <div className="flex items-center p-0.5 bg-sky-100 border-2 border-sky-300 rounded-lg text-xs shadow-xs">
          <button
            onClick={() => {
              soundEffects.playClick();
              onChangeLanguage('bilingual');
            }}
            className={`px-2 py-1 rounded transition-colors cursor-pointer font-black text-xs ${
              languageMode === 'bilingual'
                ? 'bg-cyan-700 text-white shadow-xs'
                : 'text-slate-900 hover:text-slate-950'
            }`}
            title="Bilingual mode"
          >
            BN/EN
          </button>
          <button
            onClick={() => {
              soundEffects.playClick();
              onChangeLanguage('bn');
            }}
            className={`px-2 py-1 rounded transition-colors cursor-pointer font-black text-xs ${
              languageMode === 'bn'
                ? 'bg-cyan-700 text-white shadow-xs'
                : 'text-slate-900 hover:text-slate-950'
            }`}
            title="বাংলা"
          >
            বাং
          </button>
          <button
            onClick={() => {
              soundEffects.playClick();
              onChangeLanguage('en');
            }}
            className={`px-2 py-1 rounded transition-colors cursor-pointer font-black text-xs ${
              languageMode === 'en'
                ? 'bg-cyan-700 text-white shadow-xs'
                : 'text-slate-900 hover:text-slate-950'
            }`}
            title="English"
          >
            EN
          </button>
        </div>

        {/* UDVASH (উদ্ভাস) Branding on Top Right */}
        <div className="flex items-center gap-1.5 pl-2 border-l-2 border-sky-300">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border-2 border-red-300 rounded-lg shadow-2xs">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span className="font-black text-xs tracking-wider text-red-700 font-sans">
              UDVASH
            </span>
            <span className="hidden sm:inline text-xs font-bold text-slate-900">
              (উদ্ভাস)
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
