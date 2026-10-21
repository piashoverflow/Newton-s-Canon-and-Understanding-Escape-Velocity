import React, { useState } from 'react';
import { LanguageMode } from '../types';
import { X, BookOpen, Atom, Compass, ArrowRight, History } from 'lucide-react';

interface DerivationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  languageMode: LanguageMode;
}

export const DerivationsModal: React.FC<DerivationsModalProps> = ({
  isOpen,
  onClose,
  languageMode,
}) => {
  const [activeTab, setActiveTab] = useState<'orbit' | 'escape' | 'visviva' | 'history'>('orbit');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-300">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {languageMode === 'bn'
                  ? 'গাণিতিক প্রতিপাদন ও ঐতিহাসিক প্রেক্ষাপট'
                  : "Mathematical Derivations & Historical Context"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {languageMode === 'bn'
                  ? 'নিউটনের ক্যানন, মুক্তিবেগ ও মহাকর্ষীয় গতিবিদ্যার সমীকরণমালা'
                  : "Equations of Newton's Cannon, Escape Velocity & Orbital Dynamics"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('orbit')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'orbit'
                ? 'border-cyan-500 text-cyan-700 dark:text-cyan-300'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Atom className="w-3.5 h-3.5" />
            <span>{languageMode === 'bn' ? '১. কক্ষীয় বেগ (v_orbit)' : '1. Orbital Velocity (v_orbit)'}</span>
          </button>
          <button
            onClick={() => setActiveTab('escape')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'escape'
                ? 'border-amber-500 text-amber-700 dark:text-amber-300'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{languageMode === 'bn' ? '২. মুক্তিবেগ (v_escape)' : '2. Escape Velocity (v_escape)'}</span>
          </button>
          <button
            onClick={() => setActiveTab('visviva')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'visviva'
                ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Atom className="w-3.5 h-3.5" />
            <span>{languageMode === 'bn' ? '৩. ভিস-ভিভা সমীকরণ' : '3. Vis-Viva Equation'}</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-purple-500 text-purple-700 dark:text-purple-300'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{languageMode === 'bn' ? '৪. নিউটনের ভাবনা (১৬৮৭)' : "4. Newton's Thought Experiment"}</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300 leading-relaxed font-sans">
          {/* TAB 1: ORBITAL CIRCULAR VELOCITY */}
          {activeTab === 'orbit' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-cyan-300">
                {languageMode === 'bn'
                  ? 'বৃত্তীয় কক্ষীয় বেগ প্রতিপাদন (Circular Orbital Velocity Derivation)'
                  : 'Circular Orbital Velocity Derivation'}
              </h3>
              <p>
                {languageMode === 'bn'
                  ? 'একটি উপগ্রহ বা ক্যাননবলকে পৃথিবীর চারিদিকে r ব্যাসার্ধের বৃত্তাকার কক্ষপথে অবিরাম আবর্তন করতে হলে প্রয়োজনীয় কেন্দ্রমুখী বল (Centripetal Force) অবিকল পৃথিবীর মহাকর্ষীয় বল (Gravitational Force) দ্বারা সরবরাহ হতে হবে।'
                  : 'For a satellite or projectile of mass m to maintain a stable circular orbit at radial distance r from Earth center (mass M), the required centripetal force must be supplied entirely by Newton’s gravitational force.'}
              </p>

              {/* Step 1 */}
              <div className="p-4 bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 font-mono text-xs">
                <div className="text-slate-500 dark:text-slate-400">// 1. Equating Centripetal Force and Gravitational Pull:</div>
                <div className="text-base text-cyan-700 dark:text-cyan-200 font-semibold pl-4">
                  F_c = F_g &implies; m · v² / r = G · M · m / r²
                </div>
                <div className="text-slate-500 dark:text-slate-400">// 2. Divide both sides by the projectile mass (m):</div>
                <div className="text-base text-slate-800 dark:text-slate-200 pl-4">
                  v² / r = G · M / r²
                </div>
                <div className="text-slate-500 dark:text-slate-400">// 3. Multiply both sides by radius r:</div>
                <div className="text-base text-slate-800 dark:text-slate-200 pl-4">
                  v² = G · M / r
                </div>
                <div className="text-slate-500 dark:text-slate-400">// 4. Taking the square root gives the orbital velocity:</div>
                <div className="p-3 bg-cyan-100 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-500/40 rounded-lg text-lg text-cyan-800 dark:text-cyan-300 font-bold text-center">
                  v_orbit = √( G · M / r )
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs space-y-1.5">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {languageMode === 'bn' ? 'ভূপৃষ্ঠে মান নির্ণয়:' : 'Earth Surface Values:'}
                </div>
                <div className="text-slate-600 dark:text-slate-300">G = 6.6743 × 10⁻¹¹ m³ kg⁻¹ s⁻², M = 5.972 × 10²⁴ kg, R = 6,371 km</div>
                <div className="text-cyan-700 dark:text-cyan-400 font-mono font-semibold">
                  v_orbit(surface) ≈ √(398,600 / 6371) ≈ 7.91 km/s (২৮,৪৭৬ কিমি/ঘণ্টা)
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  {languageMode === 'bn'
                    ? '৩০০ কিমি উচ্চতার পাহাড়ে: r = ৬৬৭১ কিমি &implies; v_orbit ≈ ৭.৭৩ কিমি/সে।'
                    : 'At h = 300 km altitude: r = 6,671 km &implies; v_orbit ≈ 7.73 km/s.'}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ESCAPE VELOCITY */}
          {activeTab === 'escape' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-amber-300">
                {languageMode === 'bn'
                  ? 'মুক্তিবেগ প্রতিপাদন (Escape Velocity Derivation)'
                  : 'Escape Velocity Derivation'}
              </h3>
              <p>
                {languageMode === 'bn'
                  ? 'মুক্তিবেগ হলো সেই ন্যূনতম বেগ যার মাধ্যমে একটি বস্তুকে কোনো গ্রহের মহাকর্ষ ক্ষেত্র থেকে ছুড়ে দিলে তা আর কখনোই সেই গ্রহে ফিরে আসে না। যান্ত্রিক শক্তি সংরক্ষণশীলতার নীতি (Conservation of Mechanical Energy) অনুযায়ী, অসীম দূরত্বে (r &rarr; &infin;) মোট শক্তি শূন্য বা ধনাত্মক হতে হবে।'
                  : 'Escape velocity is the minimum initial speed required for an object to break free from a gravitational body’s influence without further propulsion. By conservation of total mechanical energy (E = K + U), at the threshold where an object just barely reaches infinity with zero residual kinetic energy, total energy E = 0.'}
              </p>

              {/* Energy Equation */}
              <div className="p-4 bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 font-mono text-xs">
                <div className="text-slate-500 dark:text-slate-400">// 1. Conservation of Mechanical Energy:</div>
                <div className="text-base text-amber-700 dark:text-amber-200 font-semibold pl-4">
                  E_initial = E_final
                </div>
                <div className="text-base text-slate-800 dark:text-slate-200 pl-4">
                  K_initial + U_initial = K_final + U_final
                </div>
                <div className="text-slate-500 dark:text-slate-400">// 2. At infinity (r &rarr; &infin;), U_final = 0 and at minimum escape threshold v_final = 0:</div>
                <div className="text-base text-slate-800 dark:text-slate-200 pl-4">
                  ½ · m · v_esc² + (-G · M · m / r) = 0
                </div>
                <div className="text-slate-500 dark:text-slate-400">// 3. Rearranging kinetic and potential energies:</div>
                <div className="text-base text-slate-800 dark:text-slate-200 pl-4">
                  ½ · m · v_esc² = G · M · m / r
                </div>
                <div className="text-slate-500 dark:text-slate-400">// 4. Canceling mass m and multiplying by 2:</div>
                <div className="text-base text-slate-800 dark:text-slate-200 pl-4">
                  v_esc² = 2 · G · M / r
                </div>
                <div className="p-3 bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 rounded-lg text-lg text-amber-800 dark:text-amber-300 font-bold text-center">
                  v_escape = √( 2 · G · M / r ) = √2 · v_orbit
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs space-y-1.5">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {languageMode === 'bn'
                    ? 'কক্ষীয় বেগ ও মুক্তিবেগের যুগান্তকারী সম্পর্ক:'
                    : 'The Fundamental Orbital-Escape Relationship:'}
                </div>
                <div className="text-amber-700 dark:text-amber-400 font-mono font-semibold text-sm">
                  v_escape = √2 · v_orbit ≈ 1.4142 · v_orbit
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  {languageMode === 'bn'
                    ? 'ভূপৃষ্ঠে: v_escape ≈ ১.৪১৪২ × ৭.৯১ = ১১.১৮ কিমি/সে (৪০,২৫০ কিমি/ঘণ্টা)। ৩০০ কিমি পাহাড় থেকে: v_escape ≈ ১০.৯৩ কিমি/সে।'
                    : 'At Earth surface: v_escape ≈ 1.4142 × 7.91 = 11.19 km/s (40,270 km/h). At h = 300 km: v_escape ≈ 10.93 km/s.'}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VIS-VIVA & ENERGIES */}
          {activeTab === 'visviva' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-emerald-300">
                {languageMode === 'bn'
                  ? 'ভিস-ভিভা সমীকরণ ও কক্ষীয় শক্তি (The Vis-Viva Equation)'
                  : 'The Vis-Viva Equation & Orbital Energy'}
              </h3>
              <p>
                {languageMode === 'bn'
                  ? 'ল্যাটিন ভাষায় Vis Viva অর্থ "জীবন্ত শক্তি"। এই সমীকরণটি কক্ষপথের যে কোনো বিন্দুতে দূরত্ব r এবং উপবৃত্তের অর্ধ-পরাক্ষ a এর ভিত্তিতে তাৎক্ষণিক গতিবেগ v নির্ণয় করে।'
                  : 'In celestial mechanics, the Vis-Viva equation (Latin for "living force") directly relates the speed v of an orbiting body at any instantaneous distance r to the semi-major axis a of its Keplerian orbit.'}
              </p>

              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-lg text-emerald-300 font-bold text-center">
                  v² = G · M · ( 2 / r - 1 / a )
                </div>
                <div className="text-slate-400">// Orbit Conic Classifications by Specific Energy ℰ = -GM / (2a):</div>
                <div className="space-y-1.5 pl-2 text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">1. Circular Orbit:</span>
                    <span>r = a, e = 0, ℰ = -GM/(2r) &lt; 0 (Bound)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">2. Elliptical Orbit:</span>
                    <span>a &gt; 0, 0 &lt; e &lt; 1, ℰ &lt; 0 (Bound)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold">3. Parabolic Orbit:</span>
                    <span>a &rarr; &infin;, e = 1, ℰ = 0 (Escape Threshold)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400 font-bold">4. Hyperbolic Orbit:</span>
                    <span>a &lt; 0, e &gt; 1, ℰ &gt; 0 (Hyperbolic Escape)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NEWTON'S 1687 HISTORICAL THOUGHT EXPERIMENT */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-purple-300">
                {languageMode === 'bn'
                  ? 'স্যার আইজ্যাক নিউটনের ১৬৮৭ সালের মহাকাব্যিক চিন্তা পরীক্ষা'
                  : "Sir Isaac Newton's 1687 Thought Experiment"}
              </h3>
              <p>
                {languageMode === 'bn'
                  ? '১৬৮৭ সালে তাঁর কালজয়ী গ্রন্থ "Philosophiae Naturalis Principia Mathematica" এবং পরবর্তীতে "A Treatise of the System of the World"-এ স্যার আইজ্যাক নিউটন পৃথিবীর ইতিহাসে সবচেয়ে বিখ্যাত চিন্তা পরীক্ষাটির প্রস্তাব দেন।'
                  : 'In his landmark 1687 masterwork "Philosophiae Naturalis Principia Mathematica" and "A Treatise of the System of the World", Sir Isaac Newton proposed the thought experiment that forever united terrestrial physics with celestial mechanics.'}
              </p>

              <blockquote className="p-4 bg-slate-950/80 border-l-4 border-cyan-400 text-slate-300 italic text-xs leading-relaxed">
                "If we imagine a stone to be projected from the top of a high mountain by the force of gunpowder with a greater and greater velocity, it would describe a curve more and more enlarged... and reaching at last beyond the circumference of the earth, would enter into an orbit, and go round the whole earth, just as the planets go round the sun."
                <div className="mt-2 text-right not-italic font-mono text-cyan-400 text-[11px]">
                  — Sir Isaac Newton, 1687
                </div>
              </blockquote>

              <p>
                {languageMode === 'bn'
                  ? 'নিউটনের মূল অন্তর্দৃষ্টি ছিল: একটি সাধারণ কামানের গোলা এবং চাঁদের আবর্তন একই মহাকর্ষ বলের অধীন! যদি ক্যাননের গোলার বেগ যথেষ্ট বেশি হয়, তাহলে পৃথিবীর বক্রতার কারণে ভূমি যে হারে নিচের দিকে নেমে যায়, গোলার পতনের হার ঠিক একই হয়। ফলে ক্যাননবলটি অবিরাম পতনশীল অবস্থায় থেকেও কখনোই ভূপৃষ্ঠে পতিত না হয়ে একটি কৃত্রিম উপগ্রহে রূপান্তরিত হয়।'
                  : 'Newton showed that an apple falling to the ground, a cannonball fired from a mountaintop, and the Moon orbiting Earth are all governed by the exact same inverse-square law of universal gravitation. At orbital velocity, as gravity pulls the projectile downward, the curved surface of Earth drops away at the exact same rate! It falls perpetually around Earth without ever striking it.'}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {languageMode === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
