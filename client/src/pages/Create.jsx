import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { api } from "../services/api";
import { saveCase } from "../utils/storage";
import { DIFFICULTY_INFO, EXAMPLES, PREMISE_MAX, validatePremise } from "../utils/format";
import { Spinner } from "../components/ui";

const STAGES = ["Interviewing witnesses…", "Dusting for fingerprints…", "Cross-checking alibis…", "Sealing the evidence room…"];

export default function Create() {
  const nav = useNavigate();
  const [premise, setPremise] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [stage, setStage] = useState(0);
  const submitting = useRef(false);

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setStage((s) => (s + 1) % STAGES.length), 3500);
    return () => clearInterval(t);
  }, [busy]);

  const invalid = validatePremise(premise);

  async function submit(e) {
    e?.preventDefault();
    setTouched(true);
    if (invalid || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    setStage(0);
    try {
      const { case: c, accessToken } = await api.createCase(premise.replace(/\s+/g, " ").trim(), difficulty);
      saveCase(c.id, accessToken);
      nav("/case/" + c.id);
    } catch (err) {
      setError(err);
      setBusy(false);
    } finally {
      submitting.current = false;
    }
  }

  if (busy) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-28 text-center" role="status" aria-live="polite">
        <Spinner label="Preparing case" />
        <h1 className="mt-6 text-3xl font-bold">Preparing your case file</h1>
        <p className="mt-3 text-mute">{STAGES[stage]}</p>
        <p className="mt-8 text-sm text-mute">This usually takes 10 to 40 seconds. Please keep this tab open.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-bold">Open a new case</h1>
      <p className="mt-2 text-mute">Tell the room what happened. Gemini will invent the people and the evidence.</p>

      {error && (
        <div role="alert" className="mt-6 rounded-md border border-crimson-mr bg-crimson-mr/10 p-4">
          <p className="font-semibold">The case couldn't be prepared</p>
          <p className="mt-1 text-sm text-mute">{error.message}</p>
          <button type="button" className="btn btn-ghost mt-3 !py-1.5" onClick={submit}><RotateCcw className="h-4 w-4" aria-hidden /> Try again</button>
        </div>
      )}

      <form onSubmit={submit} noValidate className="mt-8 space-y-8">
        <div>
          <label htmlFor="premise" className="block text-lg font-semibold">Mystery premise</label>
          <textarea id="premise" className="field mt-2 min-h-[8rem]" value={premise} maxLength={PREMISE_MAX + 200} onChange={(e) => setPremise(e.target.value)} onBlur={() => setTouched(true)} aria-invalid={touched && !!invalid} aria-describedby="premise-help" placeholder="A priceless painting disappears during a private gallery exhibition." />
          <div id="premise-help" className="mt-1 flex justify-between gap-4 text-sm">
            <p className={touched && invalid ? "text-crimson-mr" : "text-mute"} role={touched && invalid ? "alert" : undefined}>{touched && invalid ? invalid : "Who, where and what went missing or wrong?"}</p>
            <p className={premise.length > PREMISE_MAX ? "text-crimson-mr" : "text-mute"}>{premise.length} / {PREMISE_MAX}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Example premises">
            {EXAMPLES.map((ex) => (
              <button type="button" key={ex} className="rounded-full border border-ink-600 px-3 py-1 text-left text-sm text-mute hover:border-gold hover:text-gold-soft" onClick={() => { setPremise(ex); setTouched(false); }}>{ex}</button>
            ))}
          </div>
        </div>

        <fieldset>
          <legend className="text-lg font-semibold">Difficulty</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {Object.entries(DIFFICULTY_INFO).map(([key, d]) => (
              <label key={key} className={"cursor-pointer rounded-lg border p-4 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-gold " + (difficulty === key ? "border-gold bg-ink-800" : "border-ink-700 hover:border-ink-600")}>
                <input type="radio" name="difficulty" value={key} checked={difficulty === key} onChange={() => setDifficulty(key)} className="sr-only" />
                <span className="block text-lg font-bold">{d.label}</span>
                <span className="mt-1 block text-sm text-mute">{d.blurb}</span>
                <span className="typed mt-3 block text-xs text-gold-soft">{d.suspects} suspects, {d.clues} clues, {d.hints} hints</span>
                <span className="typed block text-xs text-mute">+{d.bonus} for a correct accusation</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button type="submit" className="btn btn-gold !px-6 !py-3 text-base">Generate Mystery</button>
      </form>
    </div>
  );
}
