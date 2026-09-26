import { preload } from "react-dom";
import { Masthead } from "@/components/landing/masthead";
import { Hero } from "@/components/landing/hero";
import { Definition } from "@/components/landing/definition";
import { Ticker } from "@/components/landing/ticker";
import { Process } from "@/components/landing/process";
import { Specimens } from "@/components/landing/specimens";
import { Desktop } from "@/components/landing/desktop";
import { Finale } from "@/components/landing/finale";
import { Changing } from "@/components/landing/changing";
import { TypeTrail } from "@/components/fx/type-trail";
import { ScrollGauge } from "@/components/fx/scroll-gauge";

export default function Home() {
  // The hero plate is the first thing anyone sees; fetch its picture with the page.
  preload("/samples/pour.jpg", { as: "image", fetchPriority: "high" });
  return (
    <>
      <Masthead />
      <ScrollGauge />
      <TypeTrail />
      <main>
        <Hero />
        <Definition />
        <Ticker />
        <Process />
        <Specimens />
        <Changing />
        <Desktop />
        <Finale />
      </main>
    </>
  );
}
