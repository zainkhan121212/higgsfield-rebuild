// Secondary product pages behind the nav. Copy mirrors the original; media
// is pulled from the landing catalog by key so these pages share the same
// source switch as Explore.

export type MediaRef =
  | { kind: "feature"; index: number }
  | { kind: "effects"; from?: number; count?: number }
  | { kind: "row"; row: "seedance25" | "gptImage2" | "marketing" | "seedance2" | "soulCinema" | "soul2"; count?: number }
  | { kind: "projects" }
  | { kind: "genjutsu" }
  | { kind: "banner"; name: "supercomputer" | "canvas" | "photodump" }
  | { kind: "promo" };

export interface Step { title: string; body: string }

export interface ProductPage {
  slug: string;
  nav: string;
  badge?: "New" | "Free";
  title: string;
  tagline: string;
  hero: MediaRef;
  cta: { label: string; href: string };
  secondary?: { label: string; href: string };
  steps?: Step[];
  gallery?: { title: string; blurb?: string; media: MediaRef; ratio?: string; cols?: number };
  extras?: ("courses" | "promptBank" | "festival" | "chats" | "upload" | "enterprise" | "bundle" | "canvases")[];
}

export const PAGES: ProductPage[] = [
  {
    slug: "mcp", nav: "MCP",
    title: "Higgsfield MCP & plugin", tagline: "Create images and videos directly from your prompts in any AI tool.",
    hero: { kind: "feature", index: 4 }, cta: { label: "Add Higgsfield plugin to ChatGPT", href: "/gpt-astra" }, secondary: { label: "Connect and start creating", href: "/ai/video" },
    steps: [
      { title: "Describe the video", body: "“Create a short video explaining how warmer light bulbs can make a room look more expensive.”" },
      { title: "The agent plans it", body: "It keeps the tip concise, emphasises the warmer colour temperature, and picks energetic graphics to hold attention." },
      { title: "You get the cut", body: "A concise design tip with bold captions, energetic motion, and a polished vertical edit." },
    ],
    gallery: { title: "Create with Higgsfield skills in ChatGPT", blurb: "Give your ChatGPT access to the most powerful image and video models.", media: { kind: "row", row: "marketing", count: 8 }, ratio: "16/9", cols: 4 },
  },
  {
    slug: "gpt-astra", nav: "ChatGPT Plugin", badge: "New",
    title: "Discover what you can create with Higgsfield and ChatGPT Astra", tagline: "Motion design bundle — bring your ideas to life with editable animation workflows.",
    hero: { kind: "feature", index: 0 }, cta: { label: "Install the plugin", href: "/mcp" }, secondary: { label: "See Effects in ChatGPT", href: "/effects" },
    extras: ["bundle"],
    gallery: { title: "Skills & presets", media: { kind: "effects", count: 10 }, ratio: "3/4", cols: 5 },
  },
  {
    slug: "genjutsu", nav: "Genjutsu", badge: "New",
    title: "Higgsfield Genjutsu", tagline: "Reality manipulation — transfer motion into new scenes, or swap details while everything else stays as filmed.",
    hero: { kind: "feature", index: 2 }, cta: { label: "Start generating", href: "/ai/video?model=genjutsu" }, secondary: { label: "Browse presets", href: "/effects" },
    steps: [
      { title: "Upload one video", body: "Any clip: phone footage, a product shot, a dance." },
      { title: "Pick what changes", body: "Recast the motion with your characters, locations and products — or swap a detail." },
      { title: "Get every version", body: "One upload in. Endless new visions out." },
    ],
    gallery: { title: "One video, many versions", media: { kind: "genjutsu" }, ratio: "4/5", cols: 5 },
  },
  {
    slug: "generate", nav: "Cinema Studio",
    title: "Cinema Studio 4.0 — direct every detail", tagline: "Bring your stories to life. Practical workflows from working AI filmmakers.",
    hero: { kind: "row", row: "seedance25" }, cta: { label: "Open the video studio", href: "/ai/video?model=seedance_2_5" }, secondary: { label: "Learn to make movies", href: "/academy" },
    steps: [
      { title: "Block the scene", body: "Camera, lens, framing and light as controls, not adjectives." },
      { title: "Direct the take", body: "Presets for dolly, orbit, crash zoom and rack focus." },
      { title: "Render in Seedance 2.5", body: "1080p, up to 30 seconds, native audio." },
    ],
    gallery: { title: "Made in Cinema Studio", media: { kind: "row", row: "seedance25", count: 10 }, ratio: "9/16", cols: 5 },
  },
  {
    slug: "marketing-studio", nav: "Marketing Studio",
    title: "Turn any product into ready-to-post content", tagline: "Product shots, UGC ads and campaign cuts from a single upload.",
    hero: { kind: "row", row: "marketing" }, cta: { label: "Explore templates", href: "/ai/video?preset=smash_and_grab" }, secondary: { label: "Product photos", href: "/ai/image?model=gpt_image_2" },
    steps: [
      { title: "Upload the product", body: "One packshot is enough." },
      { title: "Pick a template", body: "Smash and Grab, Studio Slide, Orbit — or write your own brief." },
      { title: "Post", body: "Vertical, square and wide cuts, ready for every channel." },
    ],
    gallery: { title: "See what creators and brands are making", media: { kind: "row", row: "marketing", count: 12 }, ratio: "16/9", cols: 4 },
  },
  {
    slug: "supercomputer", nav: "Supercomputer",
    title: "What are we creating today?", tagline: "Build, generate, and market anything with skills, connectors, and automation.",
    hero: { kind: "banner", name: "supercomputer" }, cta: { label: "Start a chat", href: "/ai/image?model=gpt_image_2" }, secondary: { label: "How MCP works", href: "/mcp" },
    extras: ["chats"],
  },
  {
    slug: "3d-jutsu", nav: "3D Jutsu", badge: "New",
    title: "Prompt your 3D scene", tagline: "Adjust props and cameras, then turn your scene into a video.",
    hero: { kind: "feature", index: 4 }, cta: { label: "Build a set", href: "/ai/video?model=seedance_2_5" },
    steps: [
      { title: "Build the set", body: "Describe it. Props, layout and light arrive as objects you can grab, not a picture." },
      { title: "Stage the shot", body: "Add people and cameras, then move everything by hand until the frame reads." },
      { title: "Export to Seedance", body: "Press Export. Seedance 2.5 renders your 3D take into the finished shot." },
    ],
    gallery: { title: "Scenes rendered from 3D takes", media: { kind: "row", row: "seedance2", count: 8 }, ratio: "16/9", cols: 4 },
  },
  {
    slug: "layers", nav: "Edit",
    title: "Turn flat images into editable layers", tagline: "Separate, edit, and rebuild any image. Every element, now yours to edit.",
    hero: { kind: "row", row: "gptImage2" }, cta: { label: "Upload media", href: "/ai/image?model=gpt_image_2_5_sunburst" },
    extras: ["upload"],
    gallery: { title: "Edits from the community", media: { kind: "row", row: "gptImage2", count: 12 }, ratio: "3/4", cols: 6 },
  },
  {
    slug: "academy", nav: "Academy",
    title: "Learn. Create. Ship. All in one place.", tagline: "Real workflows for AI video, ads, and content, from your first try to a finished reel.",
    hero: { kind: "projects" }, cta: { label: "Start the first course", href: "/ai/video" },
    extras: ["courses", "promptBank"],
  },
  {
    slug: "community", nav: "Community",
    title: "Global film festival", tagline: "Any story. Any genre. Make your film in Higgsfield. Fourteen winners, a million dollars.",
    hero: { kind: "projects" }, cta: { label: "Join the festival", href: "/contests" }, secondary: { label: "Share a generation", href: "/ai/image" },
    gallery: { title: "Projects by community", media: { kind: "row", row: "seedance25", count: 15 }, ratio: "9/16", cols: 5 },
  },
  {
    slug: "contests", nav: "Contests",
    title: "Any story. Any genre. One prize pool.", tagline: "$1,000,000 prize pool · 24 days to create a film.",
    hero: { kind: "projects" }, cta: { label: "Join the festival", href: "/ai/video?model=seedance_2_5" },
    extras: ["festival"],
  },
  {
    slug: "plugins", nav: "Plugins",
    title: "Higgsfield is now inside After Effects", tagline: "Higgsfield MCP: your agent, our models.",
    hero: { kind: "feature", index: 0 }, cta: { label: "Start creating with the plugin", href: "/mcp" },
    steps: [
      { title: "Copy the bridge prompt", body: "Settings → Connectors → add a custom connector, name it Higgsfield Bridge, paste the URL." },
      { title: "Describe what you want", body: "“Build a logo reveal with a bounce ease and a light streak in After Effects.”" },
      { title: "It lands as editable layers", body: "Colour grade footage, match a cinematic look, turn a 3D fight scene into an anime short." },
    ],
    gallery: { title: "Made with the plugin", media: { kind: "effects", from: 5, count: 10 }, ratio: "3/4", cols: 5 },
  },
  {
    slug: "canvas", nav: "Canvas",
    title: "Generate stunning media with AI Canvas", tagline: "Moodboard, chain workflows, and share with your team — all on one canvas.",
    hero: { kind: "banner", name: "canvas" }, cta: { label: "New canvas", href: "/ai/image" }, secondary: { label: "Templates · Quick start", href: "/effects" },
    extras: ["canvases"],
  },
  {
    slug: "original-series", nav: "Originals",
    title: "Originals by Higgsfield", tagline: "The first AI-native streaming platform. Higgsfield Choice, First Look, On Our Radar.",
    hero: { kind: "projects" }, cta: { label: "Start creating with Seedance 2.5", href: "/ai/video?model=seedance_2_5" },
    gallery: { title: "Higgsfield Choice", media: { kind: "projects" }, ratio: "16/9", cols: 4 },
  },
  {
    slug: "enterprise", nav: "Enterprise",
    title: "The AI-native creative suite built for enterprise", tagline: "390 of the Fortune 500 already work with us. Purpose-built for the modern creative enterprise.",
    hero: { kind: "row", row: "soulCinema" }, cta: { label: "Talk to sales", href: "#contact" }, secondary: { label: "See pricing", href: "/pricing" },
    extras: ["enterprise"],
  },
];

export const NAV_PAGES = PAGES.filter((p) => !["enterprise"].includes(p.slug));

export function getPage(slug: string) {
  return PAGES.find((p) => p.slug === slug);
}
