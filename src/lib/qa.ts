// Shared QA client used by both the floating ChatWidget and the landing page.
// Single source for the endpoint, the transcript store, and the fetch call, so
// the two surfaces stay in sync and a question asked on one carries to the other.

// Deployed QA worker. Forking this site? Point this at your own worker URL
// (printed by `wrangler deploy`) and set ALLOWED_ORIGINS in its wrangler.toml.
export const ENDPOINT = "https://profile-qa-cf.maulana-1998.workers.dev";
const STORE_KEY = "pqa:transcript:v1";

export type Turn = { q: string; a: string };

// A full page load (first visit or refresh) starts a fresh conversation. This
// module only initialises on a hard load, so in-site navigation, which uses view
// transitions, keeps the transcript intact.
try {
  sessionStorage.removeItem(STORE_KEY);
} catch {
  /* storage may be unavailable */
}

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
// `history` carries recent turns so follow-up questions ("what about that?") resolve.
export async function askProfileQA(question: string, signal?: AbortSignal, history: Turn[] = []): Promise<string> {
  const r = await fetch(ENDPOINT.replace(/\/$/, "") + "/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, history: history.slice(-3) }),
    signal,
  });
  if (r.status === 429) {
    // the worker says which limit was hit: a short burst, or the hourly cap.
    // Retry-After is the standard way to tell callers how long to wait; the
    // limit itself is not a secret, so being clear here only helps real users.
    const body = await r.json().catch(() => ({}));
    const err: any = new Error(body?.kind === "hourly" ? "rate-hourly" : "rate");
    err.retryAfter = Number(r.headers.get("Retry-After")) || undefined;
    throw err;
  }
  if (r.status === 403) throw new Error("forbidden");
  if (!r.ok) throw new Error("http");
  const d = await r.json();
  return d.answer || "(no answer)";
}

// Varied, non-templated rejections so repeated failures don't read as canned.
// One pool per cause; a phrasing is picked at random each time.
const REJECTIONS: Record<"timeout" | "rate" | "rateHourly" | "forbidden" | "network", string[]> = {
  timeout: [
    "That one took longer than I expected. Mind asking again in a moment?",
    "The assistant is thinking a little too slowly right now. Give it another try shortly.",
    "Hmm, that request ran out of time. Try once more in a bit.",
    "Still waiting on a reply and it timed out. Please have another go soon.",
  ],
  rate: [
    "That is a lot of questions at once. Give it {wait}, then ask again.",
    "Slow down just a touch. Wait {wait} and I will be ready.",
    "You are asking quicker than I can keep up. Take {wait}, then try again.",
    "Too many questions in a short window. Pause {wait} and retry.",
  ],
  rateHourly: [
    "That is a lot of curiosity for one hour. This assistant runs on a small free budget, so it pauses for {wait}.",
    "You have reached this hour's limit. It opens up again in {wait}; Sabil's inbox is open in the meantime.",
    "The hourly cap is reached. Come back in {wait} and ask away.",
    "That is the cap for this hour. Things reset in {wait}.",
  ],
  forbidden: [
    "This assistant only answers from Sabil's site. Open it there and ask away.",
    "Requests from here are not accepted. Try asking from the site itself.",
  ],
  network: [
    "I could not reach the assistant just now. Please try again.",
    "Something got in the way of reaching the assistant. Mind retrying?",
    "The assistant seems out of reach at the moment. Give it another try shortly.",
    "That did not go through. The assistant is unreachable right now, so try again in a bit.",
  ],
};

const pick = (xs: string[]) => xs[Math.floor(Math.random() * xs.length)];

// Turn a Retry-After value into something a person would say. Rounded up, so we
// never tell someone to come back earlier than the limit actually allows.
function humanWait(seconds?: number, fallback = "a moment"): string {
  if (!seconds || seconds <= 0) return fallback;
  if (seconds <= 90) return "about a minute";
  const mins = Math.ceil(seconds / 60);
  if (mins < 60) return `about ${mins} minutes`;
  const hours = Math.ceil(mins / 60);
  return hours === 1 ? "about an hour" : `about ${hours} hours`;
}

export function errorMessage(err: any): string {
  if (err?.name === "AbortError") return pick(REJECTIONS.timeout);

  const wait = humanWait(err?.retryAfter);
  if (err?.message === "rate-hourly") return pick(REJECTIONS.rateHourly).replace("{wait}", wait);
  if (err?.message === "rate") return pick(REJECTIONS.rate).replace("{wait}", wait);
  if (err?.message === "forbidden") return pick(REJECTIONS.forbidden);
  return pick(REJECTIONS.network);
}
