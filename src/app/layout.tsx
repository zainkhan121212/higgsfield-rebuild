import type { Metadata } from "next";
import { Inter, Instrument_Serif, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/shell/nav";
import { Masthead } from "@/components/shell/promo-bar";
import { SessionProvider } from "@/components/shell/session";
import { getSessionUser, toSessionUser } from "@/lib/auth";
import { Toaster } from "@/components/ui/toast";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
// Display face: a high-contrast serif with a real italic — headlines read as
// typeset, not as a logo.
const serif = Instrument_Serif({ variable: "--font-serif-display", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
// Labels, credits, figure numbers: a typewriter mono, the manuscript voice.
const mono = IBM_Plex_Mono({ variable: "--font-mono-ui", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: { default: "Frameline — write it, see it", template: "%s | Frameline" },
  description:
    "A studio where the prompt is the picture. Real image generation, real credits, and 100 of them the moment you arrive — no card, no waitlist.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-fg">
        <SessionProvider initialUser={user ? toSessionUser(user) : null}>
          <div className="relative z-[1] flex min-h-full flex-col">
            <Masthead />
            <Nav />
            <div className="flex-1 flex flex-col min-h-0">{children}</div>
          </div>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
