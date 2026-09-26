import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Libre_Caslon_Display, Libre_Caslon_Text, Courier_Prime } from "next/font/google";
import "./globals.css";
import { Cursor } from "@/components/cursor";

// Display: a Caslon cut for posters. Text: the book Caslon, with a real
// italic. Labels: a typewriter. Three voices of the same print shop.
const display = Libre_Caslon_Display({ variable: "--font-caslon-display", subsets: ["latin"], weight: "400" });
const text = Libre_Caslon_Text({ variable: "--font-caslon-text", subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"] });
const mono = Courier_Prime({ variable: "--font-courier", subsets: ["latin"], weight: ["400", "700"] });

// Absolute links for share previews: APP_URL when set, else Vercel's own.
const SITE = process.env.APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3100");

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  openGraph: { siteName: "Pied", type: "website" },
  twitter: { card: "summary_large_image" },
  title: { default: "Pied — pictures set in type", template: "%s · Pied" },
  description:
    "Give Pied a picture or a sentence. It sets it in letters that scatter when your cursor passes through — paint it, then keep it as a live desktop wallpaper.",
};

export const viewport: Viewport = { themeColor: "#f4f3ee" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Reading the request makes every page render per request, which is what
  // lets Next stamp this request's CSP nonce on its own scripts (proxy.ts).
  await headers();
  return (
    <html lang="en" className={`${display.variable} ${text.variable} ${mono.variable}`}>
      <body className="grain min-h-svh">
        {children}
        <Cursor />
      </body>
    </html>
  );
}
