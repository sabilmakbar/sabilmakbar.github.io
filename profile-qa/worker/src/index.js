// Profile QA — Cloudflare Worker (Workers AI).
// question -> hybrid retrieval (dense embeddings + BM25) over the bundled chunks
//          -> grounded answer from an open model. No paid APIs.
//
// Both chunks and query are embedded ON Cloudflare with the SAME model, so there
// is no cross-platform vector matching to break when CF rotates models. Chunk
// vectors are embedded once per isolate and cached in module scope.

import CHUNKS from "./index.json"; // [{source, text}]

const EMBED_MODEL = "@cf/baai/bge-m3";
const GEN_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";
const TOP_K = 5;
const ALPHA = 0.5; // weight on dense; (1 - ALPHA) on BM25

// Browser origins allowed to call this worker. Override per deployment with the
// ALLOWED_ORIGINS var in wrangler.toml (comma-separated), so a fork changes
// config rather than code. localhost entries are relative to whoever is running
// the dev server, so they work for anyone without naming a specific machine.
const DEFAULT_ALLOWED_ORIGINS = [
  "https://sabilmakbar.github.io",
  "http://localhost:4321",
  "http://127.0.0.1:4321",
];

function allowedOrigins(env) {
  const raw = (env.ALLOWED_ORIGINS || "").trim();
  if (!raw) return new Set(DEFAULT_ALLOWED_ORIGINS);
  return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
}

const SYSTEM_PROMPT =
  "You are a helpful assistant that answers questions about Salsabil Maulana " +
  "Akbar (who goes by 'Sabil') for visitors to his personal website. Answer " +
  "ONLY using the profile context provided in the user message. If the answer " +
  "is not in the context, say you don't have that information rather than " +
  "guessing. You MAY compute simple date-based facts (for example, years of " +
  "experience or how long a role lasted) from the dates in the context together " +
  "with today's date given below; treat a role marked 'present' as ending today. " +
  "Distinguish clearly between what he has done professionally and what the context " +
  "labels as an interest or a direction he is exploring; never describe an interest " +
  "or aspiration as professional experience. " +
  "Be concise, factual, and speak about him in the third person.";

// ---- embeddings ---------------------------------------------------------
// CF text-embedding responses have varied by model/version; accept the shapes
// we've seen and fail loudly (with the payload) otherwise so logs are useful.
function extractVectors(res) {
  if (Array.isArray(res?.data) && Array.isArray(res.data[0])) return res.data;
  if (Array.isArray(res?.response) && Array.isArray(res.response[0])) return res.response;
  if (Array.isArray(res?.data?.dense_vecs)) return res.data.dense_vecs; // bge-m3 dense
  if (Array.isArray(res?.dense_vecs)) return res.dense_vecs;
  throw new Error("unexpected embedding response: " + JSON.stringify(res).slice(0, 300));
}

const normalize = (v) => {
  const n = Math.hypot(...v) || 1;
  return v.map((x) => x / n);
};

async function embed(env, texts) {
  const res = await env.AI.run(EMBED_MODEL, { text: texts });
  return extractVectors(res).map(normalize);
}

let CHUNK_VECS = null; // cached per isolate
async function chunkVectors(env) {
  if (!CHUNK_VECS) CHUNK_VECS = await embed(env, CHUNKS.map((c) => c.text));
  return CHUNK_VECS;
}

// ---- BM25 (precomputed once per isolate) --------------------------------
const tokenize = (s) => (s.toLowerCase().match(/[a-z0-9]+/g) || []);
const DOCS = CHUNKS.map((c) => tokenize(c.text));
const AVGDL = DOCS.reduce((a, d) => a + d.length, 0) / DOCS.length;
const DF = {};
for (const doc of DOCS) for (const t of new Set(doc)) DF[t] = (DF[t] || 0) + 1;
const IDF = {};
for (const t in DF) IDF[t] = Math.log(1 + (DOCS.length - DF[t] + 0.5) / (DF[t] + 0.5));

function bm25Scores(query, k1 = 1.5, b = 0.75) {
  const qterms = tokenize(query);
  return DOCS.map((doc) => {
    const tf = {};
    for (const t of doc) tf[t] = (tf[t] || 0) + 1;
    let s = 0;
    for (const t of qterms) {
      if (!tf[t]) continue;
      s += (IDF[t] || 0) * (tf[t] * (k1 + 1)) /
           (tf[t] + k1 * (1 - b + b * doc.length / AVGDL));
    }
    return s;
  });
}

const minmax = (xs) => {
  const lo = Math.min(...xs), hi = Math.max(...xs);
  return hi > lo ? xs.map((x) => (x - lo) / (hi - lo)) : xs.map(() => 0);
};

function corsHeaders(origin, allowed) {
  const h = { "Content-Type": "application/json" };
  if (allowed.has(origin)) {
    h["Access-Control-Allow-Origin"] = origin;
    h["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    h["Access-Control-Allow-Headers"] = "Content-Type";
  }
  return h;
}

// ---- rate limiting -------------------------------------------------------
// Counts recent requests per caller in D1. Two windows: a short burst guard and
// an hourly cap, so one visitor cannot drain the shared free AI quota.
const RATE_LIMITS = [
  { seconds: 60, max: 8, kind: "burst" },
  { seconds: 3600, max: 40, kind: "hourly" },
];

// Identify the caller without storing an IP: hash it with a daily salt.
async function callerKey(request) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const day = new Date().toISOString().slice(0, 10);
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${day}:${ip}`));
  return [...new Uint8Array(buf)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Returns null when allowed, or {kind, retryAfter} when the caller is over.
async function checkRateLimit(env, key) {
  if (!env.DB) return null;
  const now = Date.now();
  try {
    for (const limit of RATE_LIMITS) {
      const since = new Date(now - limit.seconds * 1000).toISOString();
      const row = await env.DB
        .prepare("SELECT COUNT(*) AS n FROM rate_hit WHERE key = ? AND ts > ?")
        .bind(key, since)
        .first();
      if ((row?.n ?? 0) >= limit.max) {
        return { kind: limit.kind, retryAfter: limit.seconds };
      }
    }
    await env.DB
      .prepare("INSERT INTO rate_hit (key, ts) VALUES (?, ?)")
      .bind(key, new Date(now).toISOString())
      .run();
  } catch (e) {
    console.error("rate limit check failed, allowing:", e); // fail open
  }
  return null;
}

// Log one Q&A to D1. Best-effort: never throws into the request path.
async function logQA(env, row) {
  if (!env.DB) return;
  try {
    await env.DB
      .prepare("INSERT INTO qa_log (ts, question, answer, sources, latency_ms) VALUES (?, ?, ?, ?, ?)")
      .bind(row.ts, row.question, row.answer, row.sources, row.latency_ms)
      .run();
  } catch (e) {
    console.error("qa_log insert failed:", e);
  }
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const allowed = allowedOrigins(env);
    const headers = corsHeaders(origin, allowed);

    if (request.method === "OPTIONS") return new Response(null, { headers });
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", chunks: CHUNKS.length }), { headers });
    }
    if (request.method !== "POST" || url.pathname !== "/chat") {
      return new Response(JSON.stringify({ error: "not found" }), { status: 404, headers });
    }

    // Guard: only serve browser calls from known origins. Without this, any site
    // (or script) could spend the free Workers AI quota. CORS alone does not stop
    // the request from running server-side, so reject it before doing any work.
    if (!allowed.has(origin)) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers });
    }

    let question, history;
    try {
      ({ question, history } = await request.json());
    } catch { question = null; }
    if (!question || typeof question !== "string" || question.length > 500) {
      return new Response(JSON.stringify({ error: "invalid question" }), { status: 400, headers });
    }

    // Recent turns, defensively validated and bounded.
    const turns = (Array.isArray(history) ? history : [])
      .filter((t) => t && typeof t.q === "string" && typeof t.a === "string")
      .slice(-3)
      .map((t) => ({ q: t.q.slice(0, 500), a: t.a.slice(0, 1500) }));

    // throttle before spending any AI quota
    const limited = await checkRateLimit(env, await callerKey(request));
    if (limited) {
      return new Response(JSON.stringify({ error: "rate", kind: limited.kind }), {
        status: 429,
        headers: { ...headers, "Retry-After": String(limited.retryAfter) },
      });
    }

    const t0 = Date.now();

    // Short follow-ups ("what about that?") carry no searchable terms on their
    // own, so retrieve using the recent questions blended with this one.
    const retrievalQuery = [...turns.slice(-2).map((t) => t.q), question].join(" ");

    // 1. embed chunks (cached) + query with the same CF model
    const vecs = await chunkVectors(env);
    const [qn] = await embed(env, [retrievalQuery]);

    // 2. hybrid score: dense cosine (vectors normalized) + BM25
    const dense = vecs.map((v) => v.reduce((s, x, i) => s + x * qn[i], 0));
    const lexical = bm25Scores(retrievalQuery);
    const dN = minmax(dense), lN = minmax(lexical);
    const combined = dense.map((_, i) => ALPHA * dN[i] + (1 - ALPHA) * lN[i]);

    // 3. top-k
    const top = combined
      .map((score, i) => ({ score, i }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_K)
      .map((x) => x.i);
    const context = top.map((i) => `[${CHUNKS[i].source}]\n${CHUNKS[i].text}`).join("\n\n");

    // 4. generate a grounded answer
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, for date math
    const out = await env.AI.run(GEN_MODEL, {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        // prior turns first, so pronouns and follow-ups have an antecedent
        ...turns.flatMap((t) => [
          { role: "user", content: t.q },
          { role: "assistant", content: t.a },
        ]),
        { role: "user", content: `Today's date: ${today}\n\nProfile context:\n${context}\n\nQuestion: ${question}` },
      ],
      max_tokens: 400,
      temperature: 0.2,
    });

    const answer = (out.response || "").trim();
    const sources = top.map((i) => CHUNKS[i].source);

    // best-effort logging, off the response path
    ctx.waitUntil(
      logQA(env, {
        ts: new Date().toISOString(),
        question,
        answer,
        sources: JSON.stringify(sources),
        latency_ms: Date.now() - t0,
      }),
    );

    return new Response(JSON.stringify({ answer, sources }), { headers });
  },
};
