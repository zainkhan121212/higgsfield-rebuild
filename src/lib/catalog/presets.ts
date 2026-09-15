// Video presets ("Effects"). Each one is a camera/VFX recipe appended to the
// user's prompt. Thumbnails are gradient tiles until a generation replaces
// them (see /api/presets/thumb).

export interface Preset {
  id: string;
  name: string;
  category: "general" | "camera" | "vfx" | "transform" | "stunt";
  description: string;
  promptSuffix: string;
  /** which video models expose this preset; empty = all */
  models: string[];
  /** two-stop gradient used as the placeholder thumbnail */
  gradient: [string, string];
  featured?: boolean;
}

const G = (a: string, b: string): [string, string] => [a, b];

export const PRESETS: Preset[] = [
  { id: "general", name: "General", category: "general", description: "Manual control. Your prompt, no recipe.", promptSuffix: "", models: [], gradient: G("#1b1b1b", "#0a0a0a"), featured: true },
  { id: "incline", name: "Incline", category: "camera", description: "Camera tilts up a steep slope as the subject climbs.", promptSuffix: "camera slowly tilts upward along a steep incline, subject walking uphill, dramatic low angle", models: [], gradient: G("#3d2f1f", "#0e0b07"), featured: true },
  { id: "act_natural", name: "Act Natural", category: "camera", description: "Handheld documentary feel, subject unaware.", promptSuffix: "handheld documentary footage, natural candid movement, soft available light", models: [], gradient: G("#2b3a2e", "#0c110d"), featured: true },
  { id: "lacewalker", name: "Lacewalker", category: "vfx", description: "Subject walks on threads of light.", promptSuffix: "subject walking across glowing threads of light suspended in darkness, ethereal particles", models: [], gradient: G("#1f2b4a", "#080b14"), featured: true },
  { id: "burning_man", name: "Burning Man", category: "vfx", description: "Flames consume the frame without harming the subject.", promptSuffix: "subject surrounded by roaring flames and embers, heat distortion, cinematic fire VFX", models: [], gradient: G("#5a1c0a", "#160602"), featured: true },
  { id: "melting", name: "Melting", category: "transform", description: "Everything liquefies and drips.", promptSuffix: "scene slowly melting into liquid, surreal dripping transformation, glossy reflections", models: [], gradient: G("#3a1c4a", "#0f0714"), featured: true },
  { id: "world_morphing", name: "World Morphing", category: "transform", description: "Environment morphs into a new place mid-shot.", promptSuffix: "the environment seamlessly morphs into a completely different location, smooth continuous transition", models: [], gradient: G("#12403a", "#05110f"), featured: true },
  { id: "high_flip", name: "High Flip", category: "stunt", description: "Subject launches into a slow-motion flip.", promptSuffix: "subject performs a high backflip in slow motion, dynamic tracking shot, motion blur", models: [], gradient: G("#3f3410", "#110e04"), featured: true },
  { id: "street_colossus", name: "Street Colossus", category: "vfx", description: "Subject towers over the city.", promptSuffix: "subject appears gigantic towering over city streets, low angle, people looking up, scale VFX", models: [], gradient: G("#2a2f3a", "#0a0c10"), featured: true },
  { id: "selfception", name: "Selfception", category: "vfx", description: "Infinite copies of the subject.", promptSuffix: "infinite recursive copies of the subject receding into the distance, mirror-like repetition", models: [], gradient: G("#1a3a4a", "#050f14"), featured: true },
  { id: "cutout", name: "Cutout", category: "transform", description: "Paper cut-out stop motion.", promptSuffix: "paper cutout stop-motion style, layered card textures, subtle frame stepping", models: [], gradient: G("#4a3a1a", "#140f05"), featured: true },
  { id: "floating_fall", name: "Floating Fall", category: "stunt", description: "Gravity switches off.", promptSuffix: "subject floats and slowly falls upward as gravity reverses, objects drifting, dreamlike", models: [], gradient: G("#1f2a4a", "#070a14"), featured: true },
  { id: "eyes_in", name: "Eyes In", category: "camera", description: "Rapid push-in to the eyes.", promptSuffix: "fast dolly push-in ending on an extreme close-up of the eyes, shallow focus", models: [], gradient: G("#3a1a2a", "#14070d"), featured: true },
  { id: "wild_ride", name: "Wild Ride", category: "stunt", description: "Mounted camera on a speeding vehicle.", promptSuffix: "camera rigged to a speeding vehicle, drifting through neon city streets, tire smoke, motion blur", models: [], gradient: G("#4a1f1f", "#140707"), featured: true },
  { id: "smash_and_grab", name: "Smash and Grab", category: "vfx", description: "Product bursts through glass.", promptSuffix: "product smashes through a car window in slow motion, glass shards suspended, dramatic lighting", models: [], gradient: G("#2f2f2f", "#0a0a0a"), featured: true },
  { id: "studio_slide", name: "Studio Slide", category: "camera", description: "Clean lateral slide in a studio.", promptSuffix: "smooth lateral slider shot in a seamless studio, soft key light, minimal background", models: [], gradient: G("#3a3a2a", "#111109"), featured: true },
  { id: "baseball_game", name: "Baseball Game", category: "general", description: "Stadium energy, crowd, floodlights.", promptSuffix: "at a night baseball game, stadium floodlights, cheering crowd, broadcast camera", models: ["kling_3", "seedance_2_5"], gradient: G("#3a2f4a", "#0f0b14") },
  { id: "nightline", name: "Nightline", category: "camera", description: "Neon-lit night street crawl.", promptSuffix: "slow tracking shot down a rain-soaked neon street at night, reflections, cinematic", models: ["kling_3", "seedance_2_5", "flux_3_video"], gradient: G("#1a2f4a", "#060b14") },
  { id: "neon_city", name: "Neon City", category: "vfx", description: "Cyberpunk skyline flyover.", promptSuffix: "aerial flyover of a cyberpunk neon city, holographic billboards, volumetric haze", models: ["kling_3", "seedance_2_5", "minimax_h3"], gradient: G("#2a1a4a", "#0a0614") },
  { id: "soul_fighter", name: "Soul Fighter", category: "stunt", description: "Martial-arts hero shot.", promptSuffix: "martial arts hero pose, dramatic slow-motion strike, dust particles, rim lighting", models: ["kling_3", "seedance_2_5"], gradient: G("#4a3a1a", "#140f05") },
  { id: "orbit", name: "Orbit", category: "camera", description: "360° orbit around the subject.", promptSuffix: "camera orbits 360 degrees around the subject, smooth gimbal move", models: [], gradient: G("#1f3a3a", "#07110f") },
  { id: "crash_zoom", name: "Crash Zoom", category: "camera", description: "Aggressive snap zoom.", promptSuffix: "aggressive crash zoom into the subject's face, handheld energy", models: [], gradient: G("#3a1f1f", "#110707") },
];

/** Deterministic sample-frame URL for a preset (keyless FLUX endpoint; cached on their CDN after first hit). */
export function presetThumbUrl(p: Preset, size: "card" | "wide" = "card"): string {
  const subject = PRESET_SUBJECTS[hashStr(p.id) % PRESET_SUBJECTS.length];
  const prompt = p.id === "general"
    ? `${subject}, cinematic film still, natural light, 35mm, shallow depth of field`
    : `${subject}, ${p.promptSuffix}, cinematic film still, high detail`;
  const [w, h] = size === "wide" ? [1024, 576] : [768, 1024];
  const q = new URLSearchParams({ width: String(w), height: String(h), seed: String(hashStr(p.id + size) % 100000), model: "flux", nologo: "true", safe: "true", enhance: "false" });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${q.toString()}`;
}

const PRESET_SUBJECTS = [
  "a young woman in a red trench coat on a rainy city street at night",
  "a man in a black leather jacket standing in an empty parking garage",
  "a skateboarder in a white hoodie on a rooftop at golden hour",
  "a dancer in a flowing yellow dress in a concrete plaza",
  "a boxer wrapped in hand tape in a dim gym",
  "a model in an oversized wool coat in a brutalist courtyard",
];

function hashStr(s: string) {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function getPreset(id?: string | null): Preset {
  return PRESETS.find((p) => p.id === id) ?? PRESETS[0];
}

export function presetsForModel(modelId: string): Preset[] {
  return PRESETS.filter((p) => p.models.length === 0 || p.models.includes(modelId));
}
