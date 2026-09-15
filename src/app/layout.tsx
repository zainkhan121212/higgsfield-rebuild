import type { Metadata } from "next";
import { Inter, Archivo } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/shell/nav";
import { PromoBar } from "@/components/shell/promo-bar";
import { SessionProvider } from "@/components/shell/session";
import { getSessionUser, toSessionUser } from "@/lib/auth";
import { Toaster } from "@/components/ui/toast";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: { default: "Higgsfield — AI-native creative suite", template: "%s | Higgsfield" },
  description: "Generate cinematic images and videos with 30+ models, presets, and one credit balance.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <html lang="en" className={`${inter.variable} ${archivo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-fg">
        <SessionProvider
          initialUser={user ? toSessionUser(user) : null}
        >
          <PromoBar />
          <Nav />
          <div className="flex-1 flex flex-col min-h-0">{children}</div>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
