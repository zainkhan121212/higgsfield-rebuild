import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "lime" | "white" | "ghost" | "dark" | "outline" | "pink";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  lime: "bg-lime text-black hover:bg-lime-2 shadow-[0_0_0_1px_rgba(211,255,61,0.2)]",
  white: "bg-white text-black hover:bg-neutral-200",
  ghost: "bg-transparent text-fg hover:bg-white/8",
  dark: "bg-card-2 text-fg hover:bg-[#242424] border border-line",
  outline: "bg-transparent text-fg border border-line-2 hover:border-fg-3",
  pink: "bg-pink text-white hover:brightness-110",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-full",
  md: "h-10 px-4 text-sm rounded-full",
  lg: "h-12 px-6 text-[15px] rounded-xl",
  icon: "h-9 w-9 rounded-full",
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
    lime: "bg-lime text-black",
    pink: "bg-pink text-white",
    blue: "bg-[#3b82f6] text-white",
    gray: "bg-white/10 text-fg-2",
  };
  return (
    <span className={cn("inline-flex items-center rounded-[4px] px-1.5 py-[1px] text-[10px] font-bold uppercase tracking-wide leading-4", tones[tone], className)}>
      {children}
    </span>
  );
}
