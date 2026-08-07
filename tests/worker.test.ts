// Behaviour tests for the QA worker, run outside the Workers runtime.
//
// The worker is loaded by inlining its JSON import first: wrangler's bundler does
// not support import attributes, and Node requires them, so rewriting the one line
// at load time keeps the deployed source untouched.
import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WORKER_DIR = join(root, "profile-qa/worker/src");
const SITE_ORIGIN = "https://sabilmakbar.github.io";

let worker: any;
let chunkCount = 0;

before(async () => {
  const src = readFileSync(join(WORKER_DIR, "index.js"), "utf8");
  const json = readFileSync(join(WORKER_DIR, "index.json"), "utf8");
  chunkCount = JSON.parse(json).length;
  const patched = src.replace(
    /^import CHUNKS from "\.\/index\.json";.*$/m,
    `const CHUNKS = ${json};`,
  );
  assert.notEqual(patched, src, "could not inline the chunk import; did the import line change?");
  const file = join(mkdtempSync(join(tmpdir(), "worker-")), "index.mjs");
  writeFileSync(file, patched);
  worker = (await import(file)).default;
});

// Minimal stand-ins for the Workers bindings.
const FAKE_VECTOR = Array.from({ length: 8 }, (_, i) => i + 1);
function makeEnv(overrides: any = {}) {
  return {
    AI: {
      run: async (model: string, input: any) => {
        if (model.includes("bge")) {
          const texts = Array.isArray(input.text) ? input.text : [input.text];
          return { data: texts.map(() => [...FAKE_VECTOR]) };
        }
        return { response: "  a grounded answer  " };
      },
    },
    DB: null, // no database: logging and rate limiting fail open
    ...overrides,
  };
}
const ctx = { waitUntil: (p: Promise<any>) => p };

const ask = (body: any, origin = SITE_ORIGIN, env = makeEnv()) =>
  worker.fetch(
    new Request("https://worker.test/chat", {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    env,
    ctx,
  );

describe("origin guard", () => {
  test("the site origin is allowed", async () => {
    const res = await ask({ question: "what does he do?" });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("access-control-allow-origin"), SITE_ORIGIN);
  });

  test("localhost is allowed for local development", async () => {
    const res = await ask({ question: "hi" }, "http://localhost:4321");
    assert.equal(res.status, 200);
  });

  test("an unknown origin is rejected", async () => {
    const res = await ask({ question: "hi" }, "https://evil.example");
    assert.equal(res.status, 403);
    assert.equal(res.headers.get("access-control-allow-origin"), null);
  });

  test("a request with no Origin header is rejected", async () => {
    const res = await worker.fetch(
      new Request("https://worker.test/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "hi" }),
      }),
      makeEnv(),
      ctx,
    );
    assert.equal(res.status, 403);
  });

  test("the allowlist can be overridden per deployment", async () => {
    const env = makeEnv({ ALLOWED_ORIGINS: "https://example.test" });
    assert.equal((await ask({ question: "hi" }, "https://example.test", env)).status, 200);
    // the built-in default must not leak through once overridden
    assert.equal((await ask({ question: "hi" }, SITE_ORIGIN, env)).status, 403);
  });

  test("preflight requests are answered", async () => {
    const res = await worker.fetch(
      new Request("https://worker.test/chat", { method: "OPTIONS", headers: { Origin: SITE_ORIGIN } }),
      makeEnv(),
      ctx,
    );
    assert.equal(res.headers.get("access-control-allow-methods"), "POST, OPTIONS");
  });
});

describe("health endpoint", () => {
  test("reports the number of chunks it serves, without an Origin", async () => {
    const res = await worker.fetch(new Request("https://worker.test/health"), makeEnv(), ctx);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, "ok");
    // CI compares this against the committed index, so it must be the real count
    assert.equal(body.chunks, chunkCount);
  });
});

describe("input validation", () => {
  const bad = [
    ["a missing question", {}],
    ["an empty question", { question: "" }],
    ["a non-string question", { question: 42 }],
    ["an over-long question", { question: "x".repeat(501) }],
  ] as const;

  for (const [label, body] of bad) {
    test(`${label} is rejected`, async () => {
      assert.equal((await ask(body)).status, 400);
    });
  }

  test("malformed JSON is rejected rather than throwing", async () => {
    const res = await worker.fetch(
      new Request("https://worker.test/chat", {
        method: "POST",
        headers: { Origin: SITE_ORIGIN, "Content-Type": "application/json" },
        body: "{not json",
      }),
      makeEnv(),
      ctx,
    );
    assert.equal(res.status, 400);
  });

  test("unknown routes return 404", async () => {
    const res = await worker.fetch(
      new Request("https://worker.test/nope", { method: "POST", headers: { Origin: SITE_ORIGIN } }),
      makeEnv(),
      ctx,
    );
    assert.equal(res.status, 404);
  });
});

describe("answering", () => {
  test("returns a trimmed answer and its sources", async () => {
    const res = await ask({ question: "what does he do?" });
    const body = await res.json();
    assert.equal(body.answer, "a grounded answer");
    assert.ok(Array.isArray(body.sources) && body.sources.length > 0);
    // sources must be real chunk ids, not invented
    const known = new Set(JSON.parse(readFileSync(join(WORKER_DIR, "index.json"), "utf8")).map((c: any) => c.source));
    for (const s of body.sources) assert.ok(known.has(s), `unknown source: ${s}`);
  });

  test("today's date is supplied so time-relative answers stay correct", async () => {
    let userMessage = "";
    const env = makeEnv({
      AI: {
        run: async (model: string, input: any) => {
          if (model.includes("bge")) return { data: [[...FAKE_VECTOR]] };
          userMessage = input.messages.at(-1).content;
          return { response: "ok" };
        },
      },
    });
    await ask({ question: "how many years of experience?" }, SITE_ORIGIN, env);
    assert.match(userMessage, /Today's date: \d{4}-\d{2}-\d{2}/);
  });

  test("prior turns are replayed so follow-ups resolve", async () => {
    let messages: any[] = [];
    const env = makeEnv({
      AI: {
        run: async (model: string, input: any) => {
          if (model.includes("bge")) return { data: [[...FAKE_VECTOR]] };
          messages = input.messages;
          return { response: "ok" };
        },
      },
    });
    await ask(
      { question: "more than 1mo?", history: [{ q: "any career gap?", a: "no gaps" }] },
      SITE_ORIGIN,
      env,
    );
    assert.ok(
      messages.some((m) => m.role === "user" && m.content === "any career gap?"),
      "the earlier question was not replayed",
    );
    assert.ok(messages.some((m) => m.role === "assistant" && m.content === "no gaps"));
  });

  test("a malformed history is ignored rather than breaking the request", async () => {
    const res = await ask({ question: "hi", history: [{ q: 1 }, "junk", null] as any });
    assert.equal(res.status, 200);
  });

  test("history is bounded so the prompt cannot grow without limit", async () => {
    let messages: any[] = [];
    const env = makeEnv({
      AI: {
        run: async (model: string, input: any) => {
          if (model.includes("bge")) return { data: [[...FAKE_VECTOR]] };
          messages = input.messages;
          return { response: "ok" };
        },
      },
    });
    const history = Array.from({ length: 10 }, (_, i) => ({ q: `q${i}`, a: `a${i}` }));
    await ask({ question: "latest", history }, SITE_ORIGIN, env);
    // system prompt + at most 3 prior turns (2 messages each) + the current question
    assert.ok(messages.length <= 1 + 3 * 2 + 1, `prompt carried ${messages.length} messages`);
  });

  test("an embedding response in an unexpected shape fails loudly", async () => {
    const env = makeEnv({ AI: { run: async () => ({ unexpected: true }) } });
    await assert.rejects(() => ask({ question: "hi" }, SITE_ORIGIN, env));
  });
});

describe("rate limiting", () => {
  // A tiny stand-in for D1: counts rows and answers the COUNT query.
  function fakeDb(existingHits: number) {
    const inserts: any[] = [];
    return {
      inserts,
      prepare(sql: string) {
        return {
          bind(...args: any[]) {
            return {
              first: async () => (sql.includes("COUNT") ? { n: existingHits } : null),
              run: async () => {
                if (sql.startsWith("INSERT INTO rate_hit")) inserts.push(args);
                return {};
              },
            };
          },
        };
      },
    };
  }

  test("a caller under the limit is served and recorded", async () => {
    const db = fakeDb(0);
    const res = await ask({ question: "hi" }, SITE_ORIGIN, makeEnv({ DB: db }));
    assert.equal(res.status, 200);
    assert.equal(db.inserts.length, 1, "the request was not counted");
  });

  test("a caller over the burst limit gets 429 with a Retry-After", async () => {
    const res = await ask({ question: "hi" }, SITE_ORIGIN, makeEnv({ DB: fakeDb(99) }));
    assert.equal(res.status, 429);
    assert.ok(Number(res.headers.get("retry-after")) > 0, "no Retry-After header");
    const body = await res.json();
    assert.equal(body.error, "rate");
    assert.ok(body.kind, "the client needs to know which limit was hit");
  });

  test("callers are keyed without storing the raw IP", async () => {
    const db = fakeDb(0);
    await worker.fetch(
      new Request("https://worker.test/chat", {
        method: "POST",
        headers: { Origin: SITE_ORIGIN, "Content-Type": "application/json", "CF-Connecting-IP": "203.0.113.9" },
        body: JSON.stringify({ question: "hi" }),
      }),
      makeEnv({ DB: db }),
      ctx,
    );
    const key = db.inserts[0][0];
    assert.ok(!String(key).includes("203.0.113.9"), "the raw IP was stored");
    assert.match(String(key), /^[0-9a-f]{24}$/, "expected a hashed caller key");
  });

  test("a database failure fails open rather than blocking answers", async () => {
    const broken = { prepare: () => { throw new Error("d1 down"); } };
    assert.equal((await ask({ question: "hi" }, SITE_ORIGIN, makeEnv({ DB: broken }))).status, 200);
  });
});
