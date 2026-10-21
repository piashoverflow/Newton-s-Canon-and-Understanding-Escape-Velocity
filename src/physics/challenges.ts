import { Challenge, SimulationParams, SimulationState } from '../types';

export const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: 'challenge_circular',
    titleEn: 'Challenge 1: The Satellite Orbit',
    titleBn: 'চ্যালেঞ্জ ১: উপগ্রহ কক্ষপথ স্থাপন',
    descriptionEn: 'Achieve a stable circular orbit (eccentricity e < 0.035) where the projectile completes an orbit without hitting Earth or the mountain peak.',
    descriptionBn: 'একটি সুস্থিত বৃত্তাকার কক্ষপথ (উৎকেন্দ্রিকতা e < 0.০৩৫) অর্জন করুন যেন ক্যাননবলটি ভূপৃষ্ঠ বা পাহাড়ে আঘাত না করে পুরো পৃথিবী প্রদক্ষিণ করে।',
    targetCriteriaEn: 'e < 0.035 and Periapsis > 6,671 km (without crashing)',
    targetCriteriaBn: 'উৎকেন্দ্রিকতা e < 0.০৩৫ এবং অনুভূ দূরত্ব > ৬,৬৭১ কিমি (ভূপতন ছাড়া)',
    hintEn: 'At mountain height h = 300 km, calculate v_orbit = √(GM / (R + h)) ≈ 7.73 km/s. Set launch angle to 0°.',
    hintBn: '৩০০ কিমি উচ্চতায় কক্ষীয় বেগ v_orbit = √(GM / (R + h)) ≈ ৭.৭৩ কিমি/সে। কোণ ০° রাখুন।',
    presetParams: {
      mountainHeight: 300,
      launchAngleDeg: 0,
      initialSpeed: 7.73,
      enableDrag: false,
    },
    isCompleted: false,
    evaluate: (state: SimulationState, params: SimulationParams) => {
      // Must have completed at least 90 seconds of flight, have eccentricity < 0.035, and periapsis > R + 250km
      if (state.hasCrashed) return false;
      if (state.time < 60) return false;
      return state.eccentricity < 0.035 && state.periapsis >= 6600;
    },
  },
  {
    id: 'challenge_zero_energy',
    titleEn: 'Challenge 2: The Zero-Energy Horizon',
    titleBn: 'চ্যালেঞ্জ ২: শূন্য-শক্তি দিগন্ত',
    descriptionEn: 'Tune the launch velocity so that the Total Specific Mechanical Energy (ℰ = K + U) reaches the exact parabolic boundary: ℰ ≈ 0.00 MJ/kg (between -0.40 and +0.40 MJ/kg).',
    descriptionBn: 'নিক্ষেপণ বেগ এমনভাবে সমন্বয় করুন যাতে মোট আপেক্ষিক যান্ত্রিক শক্তি (ℰ = K + U) পরাবৃত্তীয় সীমায় অর্থাৎ শূন্যের কাছাকাছি (-০.৪০ থেকে +০.৪০ MJ/kg) পৌঁছায়।',
    targetCriteriaEn: '|ℰ| ≤ 0.40 MJ/kg (Parabolic Escape Threshold)',
    targetCriteriaBn: '|ℰ| ≤ ০.৪০ MJ/kg (পরাবৃত্তীয় মুক্তিবেগ প্রান্তিক)',
    hintEn: 'The escape velocity at height h = 300 km is v_esc = √(2 · GM / (R + h)) ≈ 10.93 km/s. When v = v_esc, kinetic energy exactly cancels negative potential energy!',
    hintBn: '৩০০ কিমি উচ্চতায় মুক্তিবেগ v_esc = √(২ · GM / (R + h)) ≈ ১০.৯৩ কিমি/সে। এই বেগে গতিশক্তি ও বিভবশক্তির যোগফল শূন্য হয়।',
    presetParams: {
      mountainHeight: 300,
      launchAngleDeg: 0,
      initialSpeed: 10.93,
    },
    isCompleted: false,
    evaluate: (state: SimulationState) => {
      if (!state.isFired) return false;
      return Math.abs(state.totalSpecificEnergy) <= 0.45;
    },
  },
  {
    id: 'challenge_apogee_booster',
    titleEn: 'Challenge 3: Deep Apogee Target',
    titleBn: 'চ্যালেঞ্জ ৩: উচ্চ অপভূ লক্ষ্যমাত্রা',
    descriptionEn: 'Launch from 300 km altitude and create an elliptical orbit whose highest point (Apoapsis Altitude) touches approximately 10,000 km (within 9,700 km to 10,300 km).',
    descriptionBn: '৩০০ কিমি উচ্চতার পাহাড় থেকে নিক্ষেপ করে এমন একটি উপবৃত্তাকার কক্ষপথ তৈরি করুন যার সর্বোচ্চ বিন্দু (অপভূ উচ্চতা) ১০,০০০ কিমি (৯,৭০০ কিমি থেকে ১০,৩০০ কিমির মধ্যে) হয়।',
    targetCriteriaEn: 'Apoapsis Altitude: 9,700 km ≤ h_apo ≤ 10,300 km',
    targetCriteriaBn: 'অপভূ উচ্চতা: ৯,৭০০ কিমি ≤ h_apo ≤ ১০,৩০০ কিমি',
    hintEn: 'Using the Vis-Viva equation, launch at approximately 9.35 km/s horizontally from 300 km altitude.',
    hintBn: 'ভিস-ভিভা সমীকরণ অনুসারে ৩০০ কিমি উচ্চতা থেকে আনুমানিক ৯.৩৫ কিমি/সে বেগে অনুভূমিকভাবে নিক্ষেপ করুন।',
    presetParams: {
      mountainHeight: 300,
      launchAngleDeg: 0,
      initialSpeed: 9.35,
    },
    isCompleted: false,
    evaluate: (state: SimulationState) => {
      if (state.hasCrashed) return false;
      const apoapsisAlt = state.apoapsis - 6371;
      return apoapsisAlt >= 9700 && apoapsisAlt <= 10300 && state.periapsis > 6400;
    },
  },
];
