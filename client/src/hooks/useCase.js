import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../services/api";
import { getToken } from "../utils/storage";
import { useToast } from "../context/ToastContext";

export default function useCase(id) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(null); // "clue:<id>" | "hint"

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = getToken(id);
    if (!token) {
      setError(new ApiError("UNAUTHORIZED", "", 401));
      setLoading(false);
      return;
    }
    try {
      setData((await api.getCase(id, token)).case);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const act = useCallback(async (key, fn, okMsg) => {
    if (pending) return null; // block duplicate submissions on the client; server enforces it too
    setPending(key);
    try {
      const out = await fn(getToken(id));
      setData(out.case);
      if (okMsg) toast.success(okMsg(out));
      return out;
    } catch (e) {
      toast.error(e.message);
      if (["CLUE_ALREADY_DISCOVERED", "HINT_CONFLICT", "CASE_COMPLETED"].includes(e.code)) load();
      return null;
    } finally {
      setPending(null);
    }
  }, [id, pending, toast, load]);

  const discover = (clueId) => act("clue:" + clueId, (t) => api.discoverClue(id, clueId, t), (o) => `Evidence collected: ${o.clue.title} (+5)`);
  const requestHint = () => act("hint", (t) => api.requestHint(id, t), () => "Hint added to your notes (−10)");

  return { data, error, loading, pending, reload: load, discover, requestHint };
}
