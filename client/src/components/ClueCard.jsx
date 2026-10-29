import { Lock, MapPin, Fingerprint } from "lucide-react";
import { Spinner } from "./ui";

export default function ClueCard({ clue, busy, disabled, onDiscover }) {
  if (!clue.discovered) {
    return (
      <div className="flex min-h-[11rem] flex-col items-center justify-center gap-3 rounded-md border border-dashed border-ink-600 bg-ink-900 p-4 text-center">
        <Lock className="h-6 w-6 text-mute" aria-hidden />
        <p className="typed text-sm text-mute">Evidence slot {clue.slot}: sealed</p>
        <button className="btn btn-gold !py-1.5" disabled={busy || disabled} onClick={() => onDiscover(clue.id)} aria-label={`Examine evidence slot ${clue.slot}`}>
          {busy ? <Spinner label="Examining" /> : <Fingerprint className="h-4 w-4" aria-hidden />} Examine
        </button>
      </div>
    );
  }
  return (
    <article className="paper p-4">
      <header className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-bold leading-tight">{clue.title}</h3>
        <span className="typed shrink-0 rounded-sm border border-paper-ink/50 px-1.5 text-xs">Exhibit {clue.slot}</span>
      </header>
      <p className="mt-2 text-sm leading-relaxed">{clue.description}</p>
      <p className="mt-3 border-l-2 border-crimson-mr pl-3 text-sm italic">{clue.relevance}</p>
      <p className="typed mt-3 flex items-center gap-1 text-xs text-paper-ink/75"><MapPin className="h-3 w-3" aria-hidden /> {clue.location}</p>
    </article>
  );
}
