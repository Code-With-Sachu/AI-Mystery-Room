import { Lightbulb } from "lucide-react";
import { Spinner } from "./ui";

export default function HintPanel({ hints, remaining, total, busy, disabled, onRequest }) {
  return (
    <section className="panel p-5" aria-labelledby="hint-h">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="hint-h" className="text-xl font-bold">Hint desk</h2>
          <p className="text-sm text-mute">{remaining} of {total} hints remaining. Each hint costs 10 points.</p>
        </div>
        <button className="btn btn-gold" disabled={busy || disabled || remaining === 0} onClick={onRequest}>
          {busy ? <Spinner label="Requesting hint" /> : <Lightbulb className="h-4 w-4" aria-hidden />} Request hint
        </button>
      </div>
      {hints.length === 0 ? (
        <p className="mt-5 rounded-md border border-dashed border-ink-600 p-4 text-sm text-mute">No hints requested yet. Examine evidence and compare alibis first. Hints nudge your reasoning but never name the culprit.</p>
      ) : (
        <ol className="mt-5 space-y-3" aria-live="polite">
          {hints.map((h) => (
            <li key={h.id} className="paper p-4 text-sm"><span className="typed mr-2">Hint {h.order}.</span>{h.text}</li>
          ))}
        </ol>
      )}
    </section>
  );
}
