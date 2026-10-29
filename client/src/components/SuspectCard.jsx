import { useState } from "react";
import { ChevronDown, UserRound } from "lucide-react";

const initials = (n) => n.split(/\s+/).map((p) => p[0]).slice(0, 2).join("");

export default function SuspectCard({ suspect, index }) {
  const [open, setOpen] = useState(false);
  const panel = "suspect-" + suspect.id;
  return (
    <article className="paper relative overflow-hidden" style={{ transform: `rotate(${index % 2 ? 0.4 : -0.4}deg)` }}>
      <div className="flex gap-4 p-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-sm border-2 border-paper-ink/60 bg-paper-dim typed text-xl" aria-hidden>
          {initials(suspect.name) || <UserRound />}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-tight">{suspect.name}</h3>
          <p className="typed text-sm text-paper-ink/75">{suspect.role}</p>
        </div>
      </div>
      <p className="px-4 pb-3 text-sm leading-relaxed">{suspect.biography}</p>
      <div id={panel} hidden={!open} className="space-y-3 border-t border-dashed border-paper-ink/40 px-4 py-3 text-sm">
        <p><span className="typed">Alibi.</span> {suspect.alibi}</p>
        <p><span className="typed">Motive and ties.</span> {suspect.motive}</p>
      </div>
      <button className="flex w-full items-center justify-between border-t border-paper-ink/30 bg-paper-dim px-4 py-2 text-sm font-semibold hover:bg-paper-ink/10" aria-expanded={open} aria-controls={panel} onClick={() => setOpen(!open)}>
        {open ? "Close file" : `Inspect ${suspect.name.split(" ")[0]}`}
        <ChevronDown className={"h-4 w-4 transition-transform " + (open ? "rotate-180" : "")} aria-hidden />
      </button>
    </article>
  );
}
