// Per-case access tokens live in this browser only. Wrapped in try/catch: storage can be unavailable.
const KEY = "amr:tokens";
const LAST = "amr:last";
const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
};
export const getToken = (id) => read()[id] || null;
export function saveCase(id, token) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...read(), [id]: token }));
    localStorage.setItem(LAST, id);
  } catch {
    /* ignore */
  }
}
export function getLastCaseId() {
  try {
    const id = localStorage.getItem(LAST);
    return id && read()[id] ? id : null;
  } catch {
    return null;
  }
}
export function forgetLast() {
  try {
    localStorage.removeItem(LAST);
  } catch {
    /* ignore */
  }
}
