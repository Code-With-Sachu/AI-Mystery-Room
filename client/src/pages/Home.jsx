import { Link } from "react-router-dom";
import { Sparkles, FileSearch, Lightbulb, Trophy, ArrowRight } from "lucide-react";

const FEATURES = [
  { icon: Sparkles, title: "A new case every time", text: "Describe any premise. Gemini writes the story, suspects, evidence and a solution that has to hold together." },
  { icon: FileSearch, title: "Evidence you earn", text: "Clues stay sealed until you examine them. The answer never leaves the server until you accuse." },
  { icon: Lightbulb, title: "Hints that nudge", text: "Stuck? Ask the hint desk. Hints point at what to compare, never at who did it." },
  { icon: Trophy, title: "Scored by the server", text: "Correct accusations earn a bonus, each clue adds points, each hint costs points." },
];
const STEPS = [
  ["Set the scene", "Write a premise and pick Easy, Medium or Hard."],
  ["Read the file", "Meet the suspects and read their alibis and motives."],
  ["Examine evidence", "Open sealed exhibits. Look for contradictions."],
  ["Name the culprit", "Accuse once. The case closes and the full solution is revealed."],
];

function CaseFileCard() {
  return (
    <div className="relative mx-auto w-full max-w-md rotate-2" aria-hidden>
      <div className="paper p-6">
        <p className="typed text-xs tracking-wide">CASE FILE</p>
        <h2 className="mt-1 text-2xl font-bold leading-tight">Your premise goes here</h2>
        <div className="mt-4 space-y-2">
          {["w-11/12", "w-10/12", "w-7/12"].map((w, i) => <div key={i} className={`h-2.5 rounded-sm bg-paper-ink/80 ${w}`} />)}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
          {["Suspects", "Exhibits", "Hints"].map((l) => <div key={l} className="rounded-sm border border-paper-ink/40 py-2 typed">{l}</div>)}
        </div>
        <p className="typed mt-5 border-t border-dashed border-paper-ink/40 pt-3 text-xs">Culprit: <span className="inline-block h-3 w-28 translate-y-0.5 bg-paper-ink" /></p>
      </div>
      <span className="typed absolute -right-3 -top-4 animate-stamp rounded-sm border-4 border-crimson-mr px-3 py-1 text-2xl font-bold text-crimson-mr">OPEN</span>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
        <div>
          <h1 className="text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl">Every Clue Tells a Story. Every Suspect Hides a Secret.</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-mute">Give the room a premise and an AI detective-fiction writer builds a case around it: suspects with motives, evidence to examine and exactly one culprit. Your job is to work out who.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/create" className="btn btn-gold !px-6 !py-3 text-base">Enter the Mystery Room <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            <a href="#how" className="btn btn-ghost !px-6 !py-3 text-base">How It Works</a>
          </div>
        </div>
        <CaseFileCard />
      </section>

      <section className="border-y border-ink-700 bg-ink-900" aria-labelledby="features-h">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 id="features-h" className="text-3xl font-bold">What's in the room</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="panel p-5">
                <Icon className="h-6 w-6 text-gold" aria-hidden />
                <h3 className="mt-3 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mute">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14" aria-labelledby="how-h">
        <h2 id="how-h" className="text-3xl font-bold">How an investigation works</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-4">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="border-t-2 border-gold pt-4">
              <p className="typed text-sm text-gold">Step {i + 1}</p>
              <h3 className="mt-1 text-lg font-bold">{t}</h3>
              <p className="mt-2 text-sm text-mute">{d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 flex justify-center"><Link to="/create" className="btn btn-gold !px-6 !py-3">Open a new case</Link></div>
      </section>
    </>
  );
}
