import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Trophy, ShieldAlert } from "lucide-react";
import { api } from "../services/api";
import { getToken } from "../utils/storage";
import { CaseSkeleton, DifficultyBadge, ErrorState } from "../components/ui";

function Row({ label, value, strong }) {
  return <div className={"flex justify-between gap-4 py-1.5 " + (strong ? "border-t border-paper-ink/40 pt-3 text-lg font-bold" : "")}><dt>{label}</dt><dd className="typed">{value}</dd></div>;
}

export default function Results() {
  const { id } = useParams();
  const [r, setR] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    const token = getToken(id);
    if (!token) return setError({ code: "UNAUTHORIZED" });
    try {
      setR((await api.getResult(id, token)).result);
    } catch (e) {
      setError(e);
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  if (error?.code === "CASE_ACTIVE") return <Navigate to={`/case/${id}`} replace />;
  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!r) return <CaseSkeleton />;

  const s = r.score;
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className={"rounded-lg border p-6 sm:p-8 " + (r.correct ? "border-gold bg-ink-800" : "border-crimson-mr bg-ink-800")}>
        {r.correct ? <Trophy className="h-9 w-9 text-gold" aria-hidden /> : <ShieldAlert className="h-9 w-9 text-crimson-mr" aria-hidden />}
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{r.correct ? "Case solved" : "The wrong person was accused"}</h1>
        <p className="mt-2 text-lg text-mute">
          {r.correct ? <>You were right: <strong className="text-cream">{r.culprit.name}</strong> did it.</> : <>You accused <strong className="text-cream">{r.accusation.suspectName}</strong>. The culprit was <strong className="text-cream">{r.culprit.name}</strong>, {r.culprit.role}.</>}
        </p>
        <p className="typed mt-3 flex items-center gap-3 text-sm text-mute">Case {r.referenceNumber} <DifficultyBadge level={r.difficulty} /></p>
      </header>

      <div className="mt-8 grid gap-6 md:grid-cols-[1.6fr_1fr]">
        <section className="panel p-6" aria-labelledby="sol-h">
          <h2 id="sol-h" className="text-xl font-bold">How it happened</h2>
          <dl className="mt-4 space-y-4 text-sm leading-relaxed">
            <div><dt className="typed text-gold-soft">Motive</dt><dd className="mt-1">{r.solution.motive}</dd></div>
            <div><dt className="typed text-gold-soft">Method</dt><dd className="mt-1">{r.solution.method}</dd></div>
            <div><dt className="typed text-gold-soft">Timeline</dt><dd className="mt-1">{r.solution.timeline}</dd></div>
            <div><dt className="typed text-gold-soft">Full explanation</dt><dd className="mt-1 whitespace-pre-line">{r.solution.explanation}</dd></div>
          </dl>
          {r.accusation.reasoning && <p className="mt-5 border-l-2 border-gold pl-3 text-sm text-mute"><span className="text-cream">Your reasoning:</span> {r.accusation.reasoning}</p>}
        </section>

        <section className="paper h-fit p-5" aria-labelledby="score-h">
          <h2 id="score-h" className="text-xl font-bold">Final score</h2>
          <dl className="mt-3 text-sm">
            <Row label="Correct accusation" value={`+${s.bonus}`} />
            <Row label={`Clues (${r.cluesDiscovered} × 5)`} value={`+${s.cluePoints}`} />
            <Row label={`Hints (${r.hintsUsed} × 10)`} value={`−${s.hintPenalty}`} />
            <Row label="Total" value={s.total} strong />
          </dl>
          <p className="mt-3 text-xs text-paper-ink/75">{r.cluesDiscovered} of {r.cluesTotal} clues found, {r.hintsUsed} of {r.hintsTotal} hints used.</p>
        </section>
      </div>

      <section className="mt-8" aria-labelledby="key-h">
        <h2 id="key-h" className="text-xl font-bold">The clues that cracked it</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {r.keyClues.map((k) => (
            <article key={k.id} className="paper p-4">
              <h3 className="font-bold">{k.title}</h3>
              <p className="mt-2 text-sm">{k.description}</p>
              <p className="mt-2 border-l-2 border-crimson-mr pl-3 text-sm italic">{k.relevance}</p>
              {!k.discovered && <p className="typed mt-2 text-xs">You never examined this exhibit.</p>}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="elim-h">
        <h2 id="elim-h" className="text-xl font-bold">Why the others are innocent</h2>
        <ul className="mt-4 space-y-3">
          {r.eliminations.map((e) => <li key={e.suspectId} className="panel p-4 text-sm"><strong>{e.name}.</strong> <span className="text-mute">{e.reason}</span></li>)}
        </ul>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/create" className="btn btn-gold !px-6 !py-3">Investigate Another Case</Link>
        <Link to="/" className="btn btn-ghost !px-6 !py-3">Return to Home</Link>
      </div>
    </div>
  );
}
