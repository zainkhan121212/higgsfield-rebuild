// Motion for the marketing surfaces and for simulated video results.
// Every clip is a Mixkit free-license stock video (free for commercial use,
// no attribution required) served from their public CDN. None of this is
// Higgsfield's media — deliberately not used; these are Mixkit free-license clips.

export interface Clip {
  id: number;
  title: string;
}

/** 360p for tiles (≈1MB), 720p for the player (≈6MB). */
export const clipUrl = (id: number, quality: 360 | 720 = 360) => `https://assets.mixkit.co/videos/${id}/${id}-${quality}.mp4`;

/** preset id → clip that best matches the recipe */
export const PRESET_CLIPS: Record<string, Clip> = {
  general: { id: 40640, title: "Walking a big city at night" },
  incline: { id: 26923, title: "Rooftop walk at sunrise" },
  act_natural: { id: 4815, title: "Smiling on the street, head-on" },
  lacewalker: { id: 18151, title: "Neon sparkles in the dark" },
  burning_man: { id: 52304, title: "Flames burst and intertwine" },
  melting: { id: 1965, title: "Swirling smoke on black" },
  world_morphing: { id: 5399, title: "Neon 3D space landscape" },
  high_flip: { id: 1366, title: "Skater on a vert ramp" },
  street_colossus: { id: 42041, title: "Aerial nightlife of a huge city" },
  selfception: { id: 34351, title: "Rhombus passage of violet light" },
  cutout: { id: 35338, title: "Neon shapes texture" },
  floating_fall: { id: 8533, title: "Grey smoke cloud drifting" },
  eyes_in: { id: 50460, title: "Cyberpunk glasses, close up" },
  wild_ride: { id: 42037, title: "Out of a car window at night" },
  smash_and_grab: { id: 44555, title: "Stylish woman on a Camaro" },
  studio_slide: { id: 33906, title: "Dancing under colored lights" },
  baseball_game: { id: 4064, title: "Fireworks in the night sky" },
  nightline: { id: 4332, title: "Times Square on a rainy night" },
  neon_city: { id: 41375, title: "High above a city at dusk" },
  soul_fighter: { id: 23929, title: "Boxer silhouette on the bag" },
  orbit: { id: 35576, title: "Red sports car under a spotlight" },
  crash_zoom: { id: 42216, title: "Masked dancer close to the lens" },
};

export function clipForPreset(presetId: string | null | undefined): Clip {
  return PRESET_CLIPS[presetId ?? "general"] ?? PRESET_CLIPS.general;
}

/** Feature cards on Explore */
export const FEATURE_CLIPS: Record<string, Clip> = {
  genjutsu: { id: 33898, title: "Urban dancer in smoke" },
  effects: { id: 22587, title: "Building burning down" },
  soul_cinema: { id: 1038, title: "Dancer in the dark" },
  nano_banana: { id: 44541, title: "Stylish woman in a sports car" },
};

/** "Studio projects" row — short films the way the original shows its own. */
export const PROJECT_CLIPS: { clip: Clip; title: string; blurb: string }[] = [
  { clip: { id: 40746, title: "" }, title: "Night Walk", blurb: "One take through a sleeping city" },
  { clip: { id: 40957, title: "" }, title: "Twelve Rounds", blurb: "A semi-pro fight, ringside" },
  { clip: { id: 33899, title: "" }, title: "Smoke Signal", blurb: "Dance piece in fog and light" },
  { clip: { id: 35540, title: "" }, title: "Golden Mile", blurb: "A white coupe on a sunset highway" },
  { clip: { id: 1368, title: "" }, title: "Bowl", blurb: "Skate documentary, front view" },
  { clip: { id: 42207, title: "" }, title: "Masquerade", blurb: "Neon masks under party lights" },
  { clip: { id: 6754, title: "" }, title: "Arterial", blurb: "City traffic, long exposure" },
  { clip: { id: 4426, title: "" }, title: "Ember", blurb: "Lava particles, macro" },
];

/** Restage section grid */
export const GENJUTSU_CLIPS: Clip[] = [
  { id: 33898, title: "Dancer in smoke" },
  { id: 42207, title: "Neon mask" },
  { id: 40369, title: "Hip-hop crew" },
  { id: 34317, title: "Blue tunnel" },
  { id: 41161, title: "Main avenue at night" },
];
