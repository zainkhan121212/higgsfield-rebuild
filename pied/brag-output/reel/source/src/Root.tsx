import React from "react";
import { Composition, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import fonts from "../fonts.json";
import { Reel, TOTAL } from "./Reel";

// Pied's own faces, from the site's build.
for (const f of fonts as { family: string; weight: string; style: string; file: string }[]) {
  loadFont({ family: f.family, url: staticFile(f.file), weight: f.weight, style: f.style });
}

export const Root: React.FC = () => <Composition id="PiedReel" component={Reel} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />;
