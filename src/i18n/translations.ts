import { LanguageMode, OrbitClassification } from '../types';

export const TRANSLATIONS = {
  appName: {
    en: "Newton's Cannon & Escape Velocity",
    bn: "নিউটনের ক্যানন ও মুক্তিবেগ সিমুলেশন",
    bilingual: "Newton's Cannon | নিউটনের ক্যানন ও মুক্তিবেগ",
  },
  tagline: {
    en: "Orbital Mechanics & Gravitational Trajectory Lab",
    bn: "কক্ষীয় গতিবিদ্যা ও মহাকর্ষীয় ট্র্যাজেক্টরি ল্যাব",
    bilingual: "Orbital Mechanics & Escape Velocity | কক্ষীয় গতিবিদ্যা ও মুক্তিবেগ",
  },
  orbitTypes: {
    suborbital_crash: {
      en: "Sub-orbital Ballistic Crash",
      bn: "উপ-কক্ষীয় ভূপতন (ক্র্যাশ)",
      bilingual: "Sub-orbital Crash (উপ-কক্ষীয় ভূপতন)",
      descriptionEn: "Velocity is insufficient to clear Earth's curvature. Gravity pulls it back to surface.",
      descriptionBn: "বেগ যথেষ্ট না হওয়ায় পৃথিবীর বক্রতা অতিক্রম করতে পারেনি এবং ভূপৃষ্ঠে পতিত হয়েছে।",
    },
    circular: {
      en: "Stable Circular Orbit",
      bn: "সুস্থিত বৃত্তাকার কক্ষপথ",
      bilingual: "Circular Orbit (সুস্থিত বৃত্তাকার কক্ষপথ)",
      descriptionEn: "Centripetal force precisely balances gravitational pull at constant altitude (e ≈ 0).",
      descriptionBn: "কেন্দ্রমুখী বল ও মহাকর্ষ বল সমতা বজায় রেখে নির্দিষ্ট উচ্চতায় অবিরাম আবর্তন করছে (e ≈ 0)।",
    },
    elliptical: {
      en: "Closed Elliptical Orbit",
      bn: "আবদ্ধ উপবৃত্তাকার কক্ষপথ",
      bilingual: "Elliptical Orbit (উপবৃত্তাকার কক্ষপথ)",
      descriptionEn: "Periodic orbit with varying altitude between Periapsis and Apoapsis (0 < e < 1).",
      descriptionBn: "অনুভূ ও অপভূ দূরত্বের মধ্যে উচ্চতা পরিবর্তিত হয়ে উপবৃত্তাকার পথে আবর্তন (0 < e < 1)।",
    },
    parabolic: {
      en: "Parabolic Escape Boundary",
      bn: "পরাবৃত্তীয় মুক্তি সীমা",
      bilingual: "Parabolic Escape (পরাবৃত্তীয় মুক্তি সীমা)",
      descriptionEn: "Escape velocity reached. Total mechanical energy is zero (e = 1). Unbound path to infinity.",
      descriptionBn: "সঠিক মুক্তিবেগ অর্জিত হয়েছে। মোট শক্তি শূন্য (e = 1), এটি আর কখনোই পৃথিবীতে ফিরে আসবে না।",
    },
    hyperbolic: {
      en: "Hyperbolic Deep Space Trajectory",
      bn: "অধিবৃত্তীয় মহাশূন্য গতিপথ",
      bilingual: "Hyperbolic Escape (অধিবৃত্তীয় মহাশূন্য গতিপথ)",
      descriptionEn: "Velocity exceeds escape speed (v > v_esc, e > 1). Kinetic energy permanently positive.",
      descriptionBn: "বেগ মুক্তিবেগের চেয়ে বেশি (v > v_esc, e > 1)। মহাকর্ষ ক্ষেত্র ভেদ করে অনন্ত মহাশূন্যে প্রস্থান।",
    },
  },
  controls: {
    fire: { en: "Fire Cannon", bn: "ক্যানন নিক্ষেপ", bilingual: "Fire Cannon (ক্যানন নিক্ষেপ)" },
    pause: { en: "Pause", bn: "স্থগিত", bilingual: "Pause (স্থগিত)" },
    resume: { en: "Resume", bn: "চালু", bilingual: "Resume (চালু)" },
    reset: { en: "Reset Cannon", bn: "পুনঃস্থাপন", bilingual: "Reset (পুনঃস্থাপন)" },
    step: { en: "Step", bn: "পদক্ষেপ", bilingual: "Step (পদক্ষেপ)" },
    clearTrails: { en: "Clear Trails", bn: "পথরেখা মুছুন", bilingual: "Clear Trails (পথ মুছুন)" },
    launchVelocity: { en: "Launch Velocity", bn: "নিক্ষেপণ বেগ (v₀)", bilingual: "Launch Velocity (নিক্ষেপণ বেগ v₀)" },
    mountainHeight: { en: "Mountain Height", bn: "পাহাড়ের উচ্চতা (h)", bilingual: "Mountain Height (উচ্চতা h)" },
    launchAngle: { en: "Launch Pitch Angle", bn: "নিক্ষেপণ কোণ (θ)", bilingual: "Launch Angle (নিক্ষেপণ কোণ)" },
    simSpeed: { en: "Simulation Speed", bn: "সিমুলেশন গতি", bilingual: "Sim Speed (সিমুলেশন গতি)" },
    drag: { en: "Atmospheric Drag", bn: "বায়ুমণ্ডলীয় ঘর্ষণ", bilingual: "Atmospheric Drag (বায়ুর ঘর্ষণ)" },
    cameraTrack: { en: "Track Projectile", bn: "ক্যাননবল অনুসরণ", bilingual: "Track Target (অনুসরণ)" },
    cameraEarth: { en: "Focus Earth", bn: "পৃথিবী কেন্দ্রিক", bilingual: "Focus Earth (পৃথিবী কেন্দ্রিক)" },
    presets: { en: "Learning Scenarios", bn: "শিক্ষা দৃশ্যকল্প", bilingual: "Learning Presets (শিক্ষা দৃশ্যকল্প)" },
    vectors: { en: "Display Vectors", bn: "ভেক্টর প্রদর্শন", bilingual: "Vectors & Overlays (ভেক্টর)" },
  },
  telemetry: {
    velocity: { en: "Velocity", bn: "বেগ", bilingual: "Velocity (বেগ)" },
    altitude: { en: "Altitude", bn: "উচ্চতা", bilingual: "Altitude (উচ্চতা)" },
    distance: { en: "Distance from Center", bn: "কেন্দ্র হতে দূরত্ব", bilingual: "Radial Distance (দূরত্ব r)" },
    eccentricity: { en: "Eccentricity (e)", bn: "উৎকেন্দ্রিকতা (e)", bilingual: "Eccentricity (উৎকেন্দ্রিকতা e)" },
    orbitPeriod: { en: "Orbital Period", bn: "কক্ষীয় আবর্তনকাল", bilingual: "Orbital Period (আবর্তনকাল T)" },
    periapsis: { en: "Periapsis (Lowest)", bn: "অনুভূ দূরত্ব (সর্বনিম্ন)", bilingual: "Periapsis (অনুভূ)" },
    apoapsis: { en: "Apoapsis (Highest)", bn: "অপভূ দূরত্ব (সর্বোচ্চ)", bilingual: "Apoapsis (অপভূ)" },
    energies: { en: "Mechanical Energies", bn: "যান্ত্রিক শক্তি চিত্র", bilingual: "Mechanical Energy (যান্ত্রিক শক্তি)" },
    kinetic: { en: "Kinetic Energy (K)", bn: "গতিশক্তি (K)", bilingual: "Kinetic Energy (গতিশক্তি K)" },
    potential: { en: "Potential Energy (U)", bn: "বিভবশক্তি (U)", bilingual: "Potential Energy (বিভবশক্তি U)" },
    totalEnergy: { en: "Total Specific Energy (ℰ)", bn: "মোট আপেক্ষিক শক্তি (ℰ)", bilingual: "Total Energy (মোট শক্তি ℰ)" },
    boundState: { en: "Bound System (Negative Energy)", bn: "আবদ্ধ ব্যবস্থা (ঋণাত্মক শক্তি)", bilingual: "Bound Orbit (আবদ্ধ ব্যবস্থা: ℰ < 0)" },
    escapeState: { en: "Escape Achieved (Zero / Positive)", bn: "মুক্তিবেগ অর্জিত (ধনাত্মক শক্তি)", bilingual: "Escape State (মুক্তি অর্জিত: ℰ ≥ 0)" },
  }
};

export function t(
  dictEntry: { en: string; bn: string; bilingual: string },
  mode: LanguageMode
): string {
  if (mode === 'bn') return dictEntry.bn;
  if (mode === 'en') return dictEntry.en;
  return dictEntry.bilingual;
}
