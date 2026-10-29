import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Check } from "lucide-react";
import useCase from "../hooks/useCase";
import { api } from "../services/api";
import { getToken } from "../utils/storage";
import { useToast } from "../context/ToastContext";
import { CaseSkeleton, ErrorState } from "../components/ui";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Accuse() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { data: c, error, loading, reload } = useCase(id);
  const [suspectId, setSuspectId] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (loading && !c) return <CaseSkeleton />;
  if (error && !c) return <ErrorState error={error} onRetry={reload} />;
  if (c.status === "completed") return <Navigate to={`/case/${id}/results`} replace />;

  const chosen = c.suspects.find((s) => s.id === suspectId);

  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      await api.accuse(id, suspectId, reasoning.trim(), getToken(id));
      nav(`/case/${id}/results`, { replace: true });
    } catch (e) {
      setBusy(false);
      setConfirming(false);
      if (e.code === "CASE_COMPLETED") return nav(`/case/${id}/results`, { replace: true });
      toast.error(e.message);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to={`/case/${id}`} className="inline-flex items-center gap-1 text-sm text-mute hover:text-gold"><ArrowLeft className="h-4 w-4" aria-hidden /> Back to the investigation</Link>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Who did it?</h1>
      <p className="mt-2 text-mute">{c.title}. You have examined {c.discoveredClueIds.length} of {c.clueCount} exhibits and used {c.hintsUsed} hints.</p>

      <div className="mt-6 flex gap-3 rounded-md border border-crimson-mr bg-crimson-mr/10 p-4 text-sm" role="note">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-crimson-mr" aria-hidden />
        <p>You get one accusation. Submitting it closes the case and reveals the full solution. You can't examine more evidence afterwards.</p>
      </div>

      <fieldset className="mt-8">
        <legend className="text-lg font-semibold">Choose a suspect</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2" role="radiogroup">
          {c.suspects.map((s) => {
            const on = s.id === suspectId;
            return (
              <label key={s.id} className={"relative cursor-pointer rounded-lg border p-4 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-gold " + (on ? "border-gold bg-ink-800" : "border-ink-700 hover:border-ink-600")}>
                <input type="radio" name="suspect" value={s.id} checked={on} onChange={() => setSuspectId(s.id)} className="sr-only" />
                <span className="block text-lg font-bold">{s.name}</span>
                <span className="typed block text-sm text-gold-soft">{s.role}</span>
                <span className="mt-2 block text-sm text-mute"><span className="font-semibold text-cream/80">Alibi:</span> {s.alibi}</span>
                {on && <Check className="absolute right-3 top-3 h-5 w-5 text-gold" aria-label="Selected" />}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-8">
        <label htmlFor="reasoning" className="block text-lg font-semibold">Your reasoning <span className="text-sm font-normal text-mute">(optional)</span></label>
        <textarea id="reasoning" className="field mt-2 min-h-[6rem]" maxLength={1500} value={reasoning} onChange={(e) => setReasoning(e.target.value)} placeholder="Which exhibits and contradictions point to this person?" />
      </div>

      <button className="btn btn-danger mt-6 !px-6 !py-3" disabled={!suspectId} onClick={() => setConfirming(true)}>Submit Accusation</button>
      {!suspectId && <p className="mt-2 text-sm text-mute">Select a suspect to continue.</p>}

      <ConfirmDialog open={confirming} busy={busy} danger title={`Accuse ${chosen?.name}?`} confirmLabel="Yes, close the case" onConfirm={submit} onCancel={() => setConfirming(false)}>
        This is final. The case will close immediately and the real solution will be revealed.
      </ConfirmDialog>
    </div>
  );
}
