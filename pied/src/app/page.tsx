import { preload } from "react-dom";
import { Masthead } from "@/components/landing/masthead";
import { Hero } from "@/components/landing/hero";
import { Definition } from "@/components/landing/definition";
import { Ticker } from "@/components/landing/ticker";
import { Process } from "@/components/landing/process";
import { Specimens } from "@/components/landing/specimens";
import { Desktop } from "@/components/landing/desktop";
import { Finale } from "@/components/landing/finale";

export default function Home() {
  // The hero plate is the first thing anyone sees; fetch its picture with the page.
  preload("/samples/pour.jpg", { as: "image", fetchPriority: "high" });
  return (
    <>
      <Masthead />
      <main>
        <Hero />
        <Definition />
        <Ticker />
        <Process />
        <Specimens />
        <Desktop />
        <Finale />
      </main>
    </>
  );
}
