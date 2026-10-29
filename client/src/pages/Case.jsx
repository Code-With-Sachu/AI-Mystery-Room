import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Gavel, Eye, BookOpen, Users, Lightbulb, ClipboardList } from "lucide-react";
import useCase from "../hooks/useCase";
import { CaseSkeleton, DifficultyBadge, ErrorState } from "../components/ui";
import SuspectCard from "../components/SuspectCard";
import ClueCard from "../components/ClueCard";
import HintPanel from "../components/HintPanel";

const TABS = [
  { id: "overview", label: "Overview", icon: ClipboardList },
  { id: "scene", label: "Crime scene", icon: BookOpen },
  { id: "suspects", label: "Suspects", icon: Users },
  { id: "evidence", label: "Evidence", icon: Eye },
  { id: "hints", label: "Hints", icon: Lightbulb },
];

function Stat({ label, value }) {
  return (
    <div className="rounded-md border border-ink-700 bg-ink-900 px-4 py-3">
      <p className="text-xs text-mute">{label}</p>
      <p className="typed text-xl text-gold-soft">{value}</p>
    </div>
  );
}

export default function Case() {
  const { id } = useParams();
  const { data: c, error, loading, pending, reload, discover, requestHint } = useCase(id);
  const [tab, setTab] = useState("overview");

  if (loading && !c) return <CaseSkeleton />;
  if (error && !c) return <ErrorState error={error} onRetry={reload} />;

  const done = c.status === "completed";
  const found = c.discoveredClueIds.length;
  const pct = Math.round((found / c.clueCount) * 100);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="typed text-sm text-mute">Case {c.referenceNumber}</p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{c.title}</h1>
          <div className="mt-2 flex items-center gap-3"><DifficultyBadge level={c.difficulty} /><span className="text-sm text-mute">{done ? "Case closed" : "Investigation open"}</span></div>
        </div>
        {done ? (
          <Link to={`/case/${c.id}/results`} className="btn btn-gold">View results</Link>
        ) : (
          <Link to={`/case/${c.id}/accuse`} className="btn btn-danger"><Gavel className="h-4 w-4" aria-hidden /> Make an accusation</Link>
        )}
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Clues found" value={`${found} / ${c.clueCount}`} />
        <Stat label="Hints left" value={`${c.hintsRemaining} / ${c.hintsTotal}`} />
        <Stat label="Score so far" value={c.score} />
        <Stat label="Suspects" value={c.suspects.length} />
      </div>

      <div role="tablist" aria-label="Case sections" className="mt-8 flex gap-1 overflow-x-auto border-b border-ink-700">
        {TABS.map(({ id: tid, label, icon: Icon }) => (
          <button key={tid} role="tab" id={"tab-" + tid} aria-selected={tab === tid} aria-controls={"panel-" + tid} tabIndex={tab === tid ? 0 : -1}
            onClick={() => setTab(tid)}
            onKeyDown={(e) => {
              const i = TABS.findIndex((t) => t.id === tab);
              if (e.key === "ArrowRight") setTab(TABS[(i + 1) % TABS.length].id);
              if (e.key === "ArrowLeft") setTab(TABS[(i - 1 + TABS.length) % TABS.length].id);
            }}
            className={"flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold " + (tab === tid ? "border-gold text-gold-soft" : "border-transparent text-mute hover:text-cream")}>
            <Icon className="h-4 w-4" aria-hidden />{label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={"panel-" + tab} aria-labelledby={"tab-" + tab} className="mt-6">
        {tab === "overview" && (
          <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
            <section className="panel p-6">
              <h2 className="text-xl font-bold">The story</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-cream/90">{c.story}</p>
            </section>
            <section className="panel p-6" aria-labelledby="prog-h">
              <h2 id="prog-h" className="text-xl font-bold">Investigation progress</h2>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink-900" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Evidence examined"><div className="h-full bg-gold transition-all" style={{ width: pct + "%" }} /></div>
              <p className="mt-2 text-sm text-mute">{found} of {c.clueCount} exhibits examined</p>
              <p className="mt-4 text-sm leading-relaxed text-mute">Before you accuse anyone, compare each alibi against the exhibits. Look for who was where, who had a motive, and whose story doesn't line up.</p>
              <button className="btn btn-ghost mt-4" onClick={() => setTab("evidence")}>Go to evidence</button>
            </section>
          </div>
        )}
        {tab === "scene" && (
          <section className="paper p-6"><h2 className="text-xl font-bold">Crime scene</h2><p className="mt-3 whitespace-pre-line leading-relaxed">{c.crimeScene}</p></section>
        )}
        {tab === "suspects" && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{c.suspects.map((s, i) => <SuspectCard key={s.id} suspect={s} index={i} />)}</div>
        )}
        {tab === "evidence" && (
          <>
            {done && <p className="mb-4 text-sm text-mute">The case is closed. Evidence can no longer be examined.</p>}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {c.clues.map((cl) => <ClueCard key={cl.id} clue={cl} busy={pending === "clue:" + cl.id} disabled={!!pending || done} onDiscover={discover} />)}
            </div>
          </>
        )}
        {tab === "hints" && (
          <HintPanel hints={c.hints} remaining={c.hintsRemaining} total={c.hintsTotal} busy={pending === "hint"} disabled={!!pending || done} onRequest={requestHint} />
        )}
      </div>
    </div>
  );
}
