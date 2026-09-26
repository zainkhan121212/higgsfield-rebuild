import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import Home from "@/app/page";
import { Press } from "@/components/press/press";
import { Cursor } from "@/components/cursor";

// The artifact build: both pages in one document, switched by the hash.
const routeOf = () => (location.hash === "#make" ? "make" : "home");

function App() {
  const [route, setRoute] = useState(routeOf);
  useEffect(() => {
    const on = () => {
      const next = routeOf();
      setRoute((prev) => {
        if (prev !== next) window.scrollTo(0, 0);
        return next;
      });
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return (
    <>
      {route === "make" ? <Press /> : <Home />}
      <Cursor />
    </>
  );
}

document.body.classList.add("grain");
createRoot(document.getElementById("pied-root")!).render(<App />);
