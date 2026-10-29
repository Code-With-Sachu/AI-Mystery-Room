import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ToastProvider } from "../context/ToastContext";
import Create from "../pages/Create";
import Accuse from "../pages/Accuse";
import Results from "../pages/Results";
import Case from "../pages/Case";
import ClueCard from "../components/ClueCard";
import ConfirmDialog from "../components/ConfirmDialog";

vi.mock("../services/api", async (orig) => {
  const real = await orig();
  return { ...real, api: { createCase: vi.fn(), getCase: vi.fn(), discoverClue: vi.fn(), requestHint: vi.fn(), accuse: vi.fn(), getResult: vi.fn() } };
});
import { api, ApiError } from "../services/api";

const baseCase = {
  id: "a".repeat(24), referenceNumber: "MR-1", title: "The Test Case", difficulty: "easy", story: "A story.", crimeScene: "A scene.",
  suspects: [
    { id: "s1", name: "Ann Lee", role: "Curator", biography: "Bio A", motive: "Debt", alibi: "At dinner" },
    { id: "s2", name: "Bob Ray", role: "Guard", biography: "Bio B", motive: "Grudge", alibi: "On duty" },
  ],
  clueCount: 2, clues: [{ id: "c1", slot: 1, discovered: false }, { id: "c2", slot: 2, discovered: false }],
  discoveredClueIds: [], hintsTotal: 2, hintsUsed: 0, hintsRemaining: 2, hints: [], score: 0, status: "active",
};
const wrap = (ui, path = "/", routes) => render(
  <MemoryRouter initialEntries={[path]}><ToastProvider>{routes || ui}</ToastProvider></MemoryRouter>
);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("amr:tokens", JSON.stringify({ [baseCase.id]: "tok" }));
});

describe("Create page", () => {
  it("validates the premise and shows the counter", async () => {
    const user = userEvent.setup();
    wrap(<Create />);
    await user.click(screen.getByRole("button", { name: /generate mystery/i }));
    expect(await screen.findByText(/describe the mystery/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/mystery premise/i), "short");
    expect(screen.getByText("5 / 1000")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /generate mystery/i }));
    expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument();
    expect(api.createCase).not.toHaveBeenCalled();
  });
  it("fills the example and selects difficulty, then submits the chosen values", async () => {
    const user = userEvent.setup();
    api.createCase.mockResolvedValue({ case: { id: baseCase.id }, accessToken: "tok2" });
    wrap(null, "/create", <Routes><Route path="/create" element={<Create />} /><Route path="/case/:id" element={<p>case page</p>} /></Routes>);
    await user.click(screen.getByRole("button", { name: /rare diamond vanishes/i }));
    expect(screen.getByLabelText(/mystery premise/i)).toHaveValue("A rare diamond vanishes during a luxury train journey.");
    await user.click(screen.getByLabelText(/hard/i));
    await user.click(screen.getByRole("button", { name: /generate mystery/i }));
    await waitFor(() => expect(api.createCase).toHaveBeenCalledWith("A rare diamond vanishes during a luxury train journey.", "hard"));
    expect(await screen.findByText("case page")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("amr:tokens"))[baseCase.id]).toBe("tok2");
  });
  it("shows a retry option when generation fails", async () => {
    const user = userEvent.setup();
    api.createCase.mockRejectedValueOnce(new ApiError("AI_UNAVAILABLE", "The AI service is currently unavailable.", 503));
    wrap(<Create />);
    await user.type(screen.getByLabelText(/mystery premise/i), "A long enough premise for testing.");
    await user.click(screen.getByRole("button", { name: /generate mystery/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/unavailable/i);
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});

describe("Evidence", () => {
  it("locked clue exposes no content and calls discover; discovered clue shows content", async () => {
    const user = userEvent.setup();
    const onDiscover = vi.fn();
    const { rerender } = render(<ClueCard clue={{ id: "c1", slot: 1, discovered: false }} onDiscover={onDiscover} />);
    expect(screen.getByText(/sealed/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /examine evidence slot 1/i }));
    expect(onDiscover).toHaveBeenCalledWith("c1");
    rerender(<ClueCard clue={{ id: "c1", slot: 1, discovered: true, title: "Torn glove", description: "Found by the door", location: "Hall", relevance: "Fits Ann" }} />);
    expect(screen.getByText("Torn glove")).toBeInTheDocument();
    expect(screen.getByText(/found by the door/i)).toBeInTheDocument();
  });
});

describe("Case page", () => {
  it("loads the case, discovers a clue via the backend and requests a hint", async () => {
    const user = userEvent.setup();
    api.getCase.mockResolvedValue({ case: baseCase });
    const found = { ...baseCase, clues: [{ id: "c1", slot: 1, discovered: true, title: "Torn glove", description: "Found by the door", location: "Hall", relevance: "Fits Ann" }, baseCase.clues[1]], discoveredClueIds: ["c1"], score: 5 };
    api.discoverClue.mockResolvedValue({ clue: { id: "c1", title: "Torn glove" }, case: found });
    api.requestHint.mockResolvedValue({ hint: { id: "h1", order: 1, text: "Compare alibis" }, case: { ...found, hints: [{ id: "h1", order: 1, text: "Compare alibis" }], hintsUsed: 1, hintsRemaining: 1, score: 0 } });
    wrap(null, `/case/${baseCase.id}`, <Routes><Route path="/case/:id" element={<Case />} /></Routes>);
    expect(await screen.findByRole("heading", { name: "The Test Case" })).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /evidence/i }));
    await user.click(screen.getByRole("button", { name: /examine evidence slot 1/i }));
    expect(api.discoverClue).toHaveBeenCalledWith(baseCase.id, "c1", "tok");
    expect(await screen.findByText("Torn glove")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /hints/i }));
    await user.click(screen.getByRole("button", { name: /request hint/i }));
    expect(await screen.findByText("Compare alibis")).toBeInTheDocument();
    expect(screen.getByText(/1 of 2 hints remaining/i)).toBeInTheDocument();
  });
  it("shows an unavailable state for a case without a local token", async () => {
    localStorage.clear();
    wrap(null, `/case/${baseCase.id}`, <Routes><Route path="/case/:id" element={<Case />} /></Routes>);
    expect(await screen.findByText(/case file unavailable/i)).toBeInTheDocument();
  });
});

describe("Accusation", () => {
  it("requires a suspect, confirms, then submits the selected id", async () => {
    const user = userEvent.setup();
    api.getCase.mockResolvedValue({ case: baseCase });
    api.accuse.mockResolvedValue({ result: {} });
    wrap(null, `/case/${baseCase.id}/accuse`, <Routes><Route path="/case/:id/accuse" element={<Accuse />} /><Route path="/case/:id/results" element={<p>results page</p>} /></Routes>);
    const submit = await screen.findByRole("button", { name: /submit accusation/i });
    expect(submit).toBeDisabled();
    await user.click(screen.getByLabelText(/bob ray/i));
    await user.type(screen.getByLabelText(/your reasoning/i), "He lied.");
    await user.click(submit);
    expect(screen.getByRole("alertdialog")).toHaveTextContent(/this is final/i);
    expect(api.accuse).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /yes, close the case/i }));
    await waitFor(() => expect(api.accuse).toHaveBeenCalledWith(baseCase.id, "s2", "He lied.", "tok"));
    expect(await screen.findByText("results page")).toBeInTheDocument();
  });
  it("cancelling the dialog does not submit", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ConfirmDialog open title="Sure?" confirmLabel="Go" onConfirm={() => {}} onCancel={onCancel}>x</ConfirmDialog>);
    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalled();
  });
});

describe("Results", () => {
  const result = {
    id: baseCase.id, referenceNumber: "MR-1", title: "The Test Case", difficulty: "easy", correct: false,
    accusation: { suspectId: "s1", suspectName: "Ann Lee", reasoning: "", correct: false },
    culprit: { id: "s2", name: "Bob Ray", role: "Guard" },
    solution: { motive: "Grudge", method: "Spare key", timeline: "At nine", explanation: "Bob lied." },
    keyClues: [{ id: "c1", title: "Torn glove", description: "d", location: "l", relevance: "r", discovered: false }],
    eliminations: [{ suspectId: "s1", name: "Ann Lee", reason: "Seen at dinner" }],
    score: { total: 0, bonus: 0, cluePoints: 5, hintPenalty: 20 }, cluesDiscovered: 1, cluesTotal: 5, hintsUsed: 2, hintsTotal: 2,
  };
  it("renders the verdict, solution and score breakdown", async () => {
    api.getResult.mockResolvedValue({ result });
    wrap(null, `/case/${baseCase.id}/results`, <Routes><Route path="/case/:id/results" element={<Results />} /></Routes>);
    expect(await screen.findByRole("heading", { name: /wrong person/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Bob Ray/).length).toBeGreaterThan(0);
    expect(screen.getByText("Bob lied.")).toBeInTheDocument();
    expect(screen.getByText(/you never examined this exhibit/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /investigate another case/i })).toHaveAttribute("href", "/create");
    expect(screen.getByRole("link", { name: /return to home/i })).toHaveAttribute("href", "/");
  });
  it("sends the player back to the case when it is still active", async () => {
    api.getResult.mockRejectedValue(new ApiError("CASE_ACTIVE", "still open", 409));
    api.getCase.mockResolvedValue({ case: baseCase });
    wrap(null, `/case/${baseCase.id}/results`, <Routes><Route path="/case/:id/results" element={<Results />} /><Route path="/case/:id" element={<p>active case</p>} /></Routes>);
    expect(await screen.findByText("active case")).toBeInTheDocument();
  });
});
