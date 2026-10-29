const BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(code, message, status = 0) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request(path, { method = "GET", body, token } = {}) {
  let res;
  try {
    res = await fetch(BASE + "/api" + path, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { "X-Case-Token": token } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", "Can't reach the server. Check your connection and try again.");
  }
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok || !json?.success) {
    throw new ApiError(json?.error?.code || "SERVER_ERROR", json?.error?.message || "Something went wrong. Please try again.", res.status);
  }
  return json.data;
}

export const api = {
  createCase: (premise, difficulty) => request("/cases", { method: "POST", body: { premise, difficulty } }),
  getCase: (id, token) => request("/cases/" + id, { token }),
  discoverClue: (id, clueId, token) => request(`/cases/${id}/clues/${encodeURIComponent(clueId)}/discover`, { method: "POST", token }),
  requestHint: (id, token) => request(`/cases/${id}/hints`, { method: "POST", token }),
  accuse: (id, suspectId, reasoning, token) => request(`/cases/${id}/accuse`, { method: "POST", body: { suspectId, reasoning }, token }),
  getResult: (id, token) => request(`/cases/${id}/result`, { token }),
};
