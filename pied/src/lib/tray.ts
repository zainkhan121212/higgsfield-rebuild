import type { FieldData } from "./field";
import { renderStill } from "./export";

// The slideshow tray: plates kept aside while you set the next one. Each is
// a frozen copy, so painting the current plate never changes a kept one.
export type TrayItem = { id: string; title: string; data: FieldData; thumb: string };

export function keep(d: FieldData, title: string): TrayItem {
  const data: FieldData = {
    ...d,
    ch: typeof d.ch === "string" ? d.ch : d.ch.slice(),
    rgba: d.rgba.slice(),
    fx: d.fx ? d.fx.slice() : undefined,
  };
  const thumb = renderStill(data, 240, 135, "contain").toDataURL("image/jpeg", 0.82);
  return { id: Math.random().toString(36).slice(2, 10), title, data, thumb };
}
