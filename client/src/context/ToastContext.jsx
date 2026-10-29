import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";

const Ctx = createContext({ push: () => {} });
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const dismiss = useCallback((id) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const push = useCallback((type, message) => {
    const id = Math.random().toString(36).slice(2);
    setItems((xs) => [...xs.slice(-3), { id, type, message }]);
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);
  const value = useMemo(() => ({ push, success: (m) => push("success", m), error: (m) => push("error", m) }), [push]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 flex flex-col gap-2 sm:w-96" role="region" aria-label="Notifications" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={"flex items-start gap-3 rounded-md border px-4 py-3 text-sm shadow-lg bg-ink-800 " + (t.type === "error" ? "border-crimson-mr" : "border-gold-deep")}>
            {t.type === "error" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-crimson-mr" aria-hidden /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />}
            <p className="flex-1">{t.message}</p>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="text-mute hover:text-cream"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
