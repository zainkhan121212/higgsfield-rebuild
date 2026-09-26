import "server-only";

// The press's standing brief to the image model. An image model has no
// separate "system" channel, so the brief is composed around the visitor's
// words on the server: the visitor supplies only the subject, never the
// framing, and can't swap the brief out from the browser.
//
// What the brief asks for is a picture that survives being set in type:
// one subject, a hard silhouette, big areas of pure black and pure white,
// a plain background, no text of its own. The press then turns that picture
// into letters. (Image models can't draw thousands of legible characters, so
// the lettering is always the press's job, not the model's.)

export const LOOKS = {
  photo: "black and white studio photograph, dramatic single-source lighting, deep blacks and bright highlights",
  silhouette: "stark solid black silhouette, crisp clean edges, no interior detail",
  ink: "bold black ink illustration, thick confident strokes, solid black fills, no hatching noise",
  engraving: "vintage copperplate engraving, fine black linework and dense cross-hatching",
  colour: "vivid colour photograph, strong saturated colours, hard light and deep shadow",
} as const;

export type Look = keyof typeof LOOKS;

const BRIEF_BEFORE = "A single clear subject, centred and filling most of the frame:";
const BRIEF_AFTER = [
  "isolated on a plain, empty, pale background",
  "very high contrast, strong readable silhouette, large areas of solid tone",
  "no text, no letters, no watermark, no border, no frame",
  "composed to be reproduced as a letterpress print made of type",
].join(", ");

/**
 * Clean the visitor's words before they reach the model: printable text
 * only, one line, bounded length. Attempts to steer the brief ("ignore the
 * above", "no background") simply become part of the subject; the brief is
 * appended after them, so it always has the last word.
 */
export function cleanSubject(raw: unknown) {
  if (typeof raw !== "string") return "";
  return raw
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069]/g, " ")
    .replace(/[<>{}[\]\\`]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

export function composePrompt(subject: string, look: Look) {
  return `${BRIEF_BEFORE} ${subject}. Style: ${LOOKS[look]}. ${BRIEF_AFTER}.`;
}
