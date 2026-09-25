import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "lime" | "white" | "ghost" | "dark" | "outline" | "pink";
type Size = "sm" | "md" | "lg" | "icon";

// Buttons are set like letterpress: square corners, ink or accent, never a
// gradient. `white` is the primary (solid ink on paper).
const variants: Record<Variant, string> = {
  lime: "bg-lime text-paper hover:bg-lime-2",
  white: "bg-fg text-paper hover:bg-fg-2",
  ghost: "bg-transparent text-fg hover:bg-fg/[0.06]",
  dark: "bg-card-2 text-fg hover:bg-line border border-line",
  outline: "bg-transparent text-fg border border-fg/30 hover:border-fg",
  pink: "bg-pink text-white hover:brightness-110",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[13px] rounded-[2px]",
  md: "h-10 px-5 text-sm rounded-[2px]",
  lg: "h-12 px-7 text-[15px] rounded-[2px]",
  icon: "h-9 w-9 rounded-[2px]",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "dark", size = "md", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-colors select-none",
        "disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/60",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});

export function Pill({ children, tone = "lime", className }: { children: React.ReactNode; tone?: "lime" | "pink" | "blue" | "gray"; className?: string }) {
  const tones = {
    lime: "bg-lime text-paper",
    pink: "bg-pink text-white",
    blue: "bg-[#1d4f7c] text-white",
    gray: "bg-fg/8 text-fg-2",
  };
  return (
    <span className={cn("inline-flex items-center rounded-[2px] px-1.5 py-[1px] font-mono text-[9px] font-semibold uppercase tracking-[0.12em] leading-4", tones[tone], className)}>
      {children}
    </span>
  );
}
