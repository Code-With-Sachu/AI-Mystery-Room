import { Link } from "react-router-dom";
import { Loader2, SearchX } from "lucide-react";
import { DIFFICULTY_INFO } from "../utils/format";

export function Spinner({ label = "Loading" }) {
  return <Loader2 className="h-5 w-5 animate-spin" aria-label={label} role="img" />;
}

export function DifficultyBadge({ level }) {
  const tone = { easy: "border-sky-mr text-sky-mr", medium: "border-gold text-gold", hard: "border-crimson-mr text-crimson-mr" }[level] || "border-mute text-mute";
  return <span className={"rounded-full border px-2.5 py-0.5 text-xs font-semibold " + tone}>{DIFFICULTY_INFO[level]?.label || level}</span>;
}

export function Skeleton({ className = "" }) {
  return <div className={"animate-pulse rounded-md bg-ink-700/60 " + className} aria-hidden />;
}

export function CaseSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-10" role="status" aria-label="Loading case file">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-24" />
      <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
    </div>
  );
}

const ERR_COPY = {
  UNAUTHORIZED: "This case file was opened in a different browser, so it can't be shown here.",
  FORBIDDEN: "This case file was opened in a different browser, so it can't be shown here.",
  NOT_FOUND: "That case file doesn't exist or has been archived.",
};

export function ErrorState({ error, onRetry }) {
  const gone = ["UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND"].includes(error?.code);
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center" role="alert">
      <SearchX className="mx-auto h-10 w-10 text-gold" aria-hidden />
      <h1 className="mt-4 text-2xl font-bold">{gone ? "Case file unavailable" : "The file wouldn't open"}</h1>
      <p className="mt-2 text-mute">{ERR_COPY[error?.code] || error?.message || "Something went wrong."}</p>
      <div className="mt-6 flex justify-center gap-3">
        {!gone && onRetry && <button className="btn btn-gold" onClick={onRetry}>Try again</button>}
        <Link to="/create" className={"btn " + (gone ? "btn-gold" : "btn-ghost")}>Start a new case</Link>
        <Link to="/" className="btn btn-ghost">Back to home</Link>
      </div>
    </div>
  );
}
