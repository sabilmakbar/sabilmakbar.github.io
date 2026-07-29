// Shared QA client used by both the floating ChatWidget and the landing page.
// Single source for the endpoint, the transcript store, and the fetch call, so
// the two surfaces stay in sync and a question asked on one carries to the other.

export const ENDPOINT = "https://profile-qa-cf.maulana-1998.workers.dev";
const STORE_KEY = "pqa:transcript:v1";

export type Turn = { q: string; a: string };

export function loadTranscript(): Turn[] {
  try {
    return JSON.parse(sessionStorage.getItem(STORE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveTranscript(turns: Turn[]): void {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(turns));
  } catch {
    /* storage may be unavailable (private mode); degrade silently */
  }
}

// Ask the QA worker. Resolves to the answer text, or throws Error("rate"|"http"|AbortError).
export async function askProfileQA(question: string, signal?: AbortSignal): Promise<string> {
  const r = await fetch(ENDPOINT.replace(/\/$/, "") + "/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
    signal,
  });
  if (r.status === 429) throw new Error("rate");
  if (!r.ok) throw new Error("http");
  const d = await r.json();
  return d.answer || "(no answer)";
}

// Varied, non-templated rejections so repeated failures don't read as canned.
// One pool per cause; a phrasing is picked at random each time.
const REJECTIONS: Record<"timeout" | "rate" | "network", string[]> = {
  timeout: [
    "That one took longer than I expected. Mind asking again in a moment?",
    "The assistant is thinking a little too slowly right now. Give it another try shortly.",
    "Hmm, that request ran out of time. Try once more in a bit.",
    "Still waiting on a reply and it timed out. Please have another go soon.",
  ],
  rate: [
    "That is a lot of questions at once. Give it a few seconds, then ask again.",
    "Slow down just a touch. Wait a moment and I will be ready.",
    "You are asking quicker than I can keep up. One breath, then try again.",
    "Too many questions in a short window. Pause a few seconds and retry.",
  ],
  network: [
    "I could not reach the assistant just now. Please try again.",
    "Something got in the way of reaching the assistant. Mind retrying?",
    "The assistant seems out of reach at the moment. Give it another try shortly.",
    "That did not go through. The assistant is unreachable right now, so try again in a bit.",
  ],
};

const pick = (xs: string[]) => xs[Math.floor(Math.random() * xs.length)];

export function errorMessage(err: any): string {
  if (err?.name === "AbortError") return pick(REJECTIONS.timeout);
  if (err?.message === "rate") return pick(REJECTIONS.rate);
  return pick(REJECTIONS.network);
}
