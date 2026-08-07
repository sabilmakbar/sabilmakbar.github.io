// Content invariants. These guard the things that are expensive to get wrong:
// private data leaking into public files, and the QA index drifting out of sync
// with src/data. Run with: npm test
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { profile, nav, scholar } from "../src/data/profile.ts";
import { about, taglines } from "../src/data/about.ts";
import { education, experience, awards, projects } from "../src/data/cv.ts";
import { publications } from "../src/data/publications.ts";
import { teaching } from "../src/data/activities.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const INDEX = join(root, "profile-qa/worker/src/index.json");

const dataFiles = readdirSync(join(root, "src/data"))
  .filter((f) => f.endsWith(".ts"))
  .map((f) => ({ name: f, text: readFileSync(join(root, "src/data", f), "utf8") }));

describe("privacy", () => {
  // The CV LaTeX hides a phone number behind a flag, so it must never be
  // copied into anything public, including the chatbot index.
  const PHONE = /\+?\d[\d\s().-]{8,}\d/;
  const MONEY = /US\s?\$|\$\s?\d|\b\d+\s?K\b/;

  for (const { name, text } of dataFiles) {
    test(`${name} has no phone number`, () => {
      const hits = text.split("\n").filter((l) => PHONE.test(l) && !l.includes("http"));
      assert.deepEqual(hits, [], `possible phone number in ${name}`);
    });

    test(`${name} has no absolute money figures`, () => {
      // ignore regex backreferences like $1 in highlight helpers
      const hits = text.split("\n").filter((l) => MONEY.test(l) && !/\$\d['")]/.test(l));
      assert.deepEqual(hits, [], `absolute money figure in ${name}`);
    });
  }

  test("QA index carries no phone number or money figures", () => {
    const raw = readFileSync(INDEX, "utf8");
    assert.ok(!PHONE.test(raw.replace(/https?:\/\/\S+/g, "")), "phone-like string in QA index");
    assert.ok(!MONEY.test(raw), "money figure in QA index");
  });
});

describe("QA index stays in sync with src/data", () => {
  test("regenerating produces the committed index", () => {
    const tmp = join(mkdtempSync(join(tmpdir(), "qa-index-")), "index.json");
    execFileSync(
      process.execPath,
      ["--experimental-strip-types", join(root, "profile-qa/scripts/build-index.ts"), tmp],
      { cwd: root, stdio: "pipe" },
    );
    assert.equal(
      readFileSync(tmp, "utf8"),
      readFileSync(INDEX, "utf8"),
      "index.json is stale; run `npm run build:index` and redeploy the worker",
    );
  });

  test("every chunk has a source and non-empty text", () => {
    const chunks = JSON.parse(readFileSync(INDEX, "utf8"));
    assert.ok(chunks.length > 0);
    for (const c of chunks) {
      assert.ok(c.source, "chunk without a source");
      assert.ok(c.text?.trim().length > 20, `chunk too short: ${c.source}`);
      assert.ok(!/<[a-z]/i.test(c.text), `raw HTML left in chunk: ${c.source}`);
    }
  });
});

describe("experience", () => {
  const parse = (s: string) => Date.parse(`1 ${s.replace(/^([A-Z][a-z]{2})/, "$1")}`);

  test("is ordered newest first", () => {
    const starts = experience.map((e) => parse(e.year.split(" - ")[0]));
    for (const s of starts) assert.ok(!Number.isNaN(s), "unparseable start date");
    const sorted = [...starts].sort((a, b) => b - a);
    assert.deepEqual(starts, sorted, "experience should be reverse-chronological");
  });

  test("career starts Nov 2020, which the chatbot uses for years of experience", () => {
    const first = experience[experience.length - 1];
    assert.match(first.year, /^Nov 2020/);
  });

  test("exactly one current role", () => {
    const current = experience.filter((e) => /present/i.test(e.year));
    assert.equal(current.length, 1);
  });

  test("bullets carry no quantified achievement claims", () => {
    // Impact is described qualitatively on the site; the figures stay in the CV.
    // Award titles are exempt, since "Top 1-3%" is the name of the award itself.
    for (const e of experience) {
      for (const p of e.points) {
        assert.ok(!/\d+(\.\d+)?\s?%/.test(p), `percentage figure in ${e.org}: "${p.slice(0, 60)}..."`);
        assert.ok(!/\d+-fold/.test(p), `multiplier figure in ${e.org}: "${p.slice(0, 60)}..."`);
      }
    }
  });

  test("every role has a title, org and at least one bullet", () => {
    for (const e of experience) {
      assert.ok(e.title && e.org, "role missing title or org");
      assert.ok(e.points.length > 0, `${e.org} has no bullets`);
    }
  });
});

describe("publications and awards", () => {
  test("each publication has a title, authors and a sane year", () => {
    for (const p of publications) {
      assert.ok(p.title && p.authors, `incomplete publication: ${p.title}`);
      assert.ok(p.year >= 2000 && p.year <= new Date().getFullYear() + 1, `odd year: ${p.title}`);
    }
  });

  test("publication links are absolute https", () => {
    for (const p of publications.filter((x) => x.url)) {
      assert.match(p.url!, /^https:\/\//, `bad url: ${p.title}`);
    }
  });

  test("author list mentions Sabil, since the UI highlights his name", () => {
    for (const p of publications) {
      assert.match(p.authors, /Salsabil|Akbar/, `Sabil not in authors: ${p.title}`);
    }
  });

  test("each award has a title, org and year", () => {
    for (const a of awards) assert.ok(a.title && a.org && a.year, "incomplete award");
  });
});

describe("profile and about", () => {
  test("email is consistent between the profile and its mailto link", () => {
    const mailto = profile.social.find((s) => s.label === "Email")!.href;
    assert.equal(mailto, `mailto:${profile.email}`);
  });

  test("every social and scholar link has an icon and https href", () => {
    for (const s of [...profile.social, ...scholar]) {
      assert.ok(s.icon, `${s.label} has no icon`);
      assert.match(s.href, /^(https:\/\/|mailto:)/, `${s.label} has a bad href`);
    }
  });

  test("taglines and about sections are populated", () => {
    assert.ok(taglines.length >= 2, "tagline rotation needs at least two lines");
    assert.ok(about.summary.length > 80);
    assert.ok(about.coreExperience.length > 0 && about.exploring.length > 0);
    assert.ok(about.keywords.every((k) => k.group && k.items));
  });

  test("interests are kept separate from stated experience", () => {
    // XAI and causal inference are aspirations, so they must not appear as skills
    const stack = about.keywords.map((k) => k.items).join(" ").toLowerCase();
    assert.ok(!stack.includes("causal"), "causal inference is an interest, not a listed skill");
    assert.ok(!stack.includes("explainable"), "explainable AI is an interest, not a listed skill");
  });
});

describe("house style", () => {
  test("no em dashes in authored content", () => {
    // They read as machine-written, so the site uses commas or full stops instead.
    for (const { name, text } of dataFiles) {
      assert.ok(!text.includes("—"), `em dash in ${name}`);
    }
    assert.ok(!readFileSync(INDEX, "utf8").includes("—"), "em dash in the QA index");
  });

  test("no placeholder text left behind", () => {
    const PLACEHOLDER = /\b(TODO|FIXME|TBD|lorem ipsum|coming soon here|xxx)\b/i;
    for (const { name, text } of dataFiles) {
      assert.ok(!PLACEHOLDER.test(text), `placeholder text in ${name}`);
    }
  });

  test("the current employer stays anonymised", () => {
    // Deliberate: the CV names it, the public site does not. If this is ever
    // revealed on purpose, update this test in the same change.
    assert.match(experience[0].org, /Stealth/i);
  });
});

describe("no duplicate entries", () => {
  const dupes = (xs: string[]) => xs.filter((x, i) => xs.indexOf(x) !== i);

  test("publications are unique", () => {
    assert.deepEqual(dupes(publications.map((p) => p.title)), []);
  });

  test("awards are unique", () => {
    assert.deepEqual(dupes(awards.map((a) => `${a.title}|${a.year}`)), []);
  });

  test("teaching entries are unique", () => {
    assert.deepEqual(dupes(teaching.map((t) => `${t.where}|${t.when}`)), []);
  });

  test("nav labels and hrefs are unique", () => {
    assert.deepEqual(dupes(nav.map((n) => n.label)), []);
    assert.deepEqual(dupes(nav.map((n) => n.href)), []);
  });
});

describe("dates", () => {
  const MONTH = "(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)";
  const ONE_OFF = new RegExp(`^${MONTH} \\d{4}$`);
  const RANGE = new RegExp(`^${MONTH} \\d{4} - (${MONTH} \\d{4}|present)$`);
  const startOf = (s: string) => Date.parse(`1 ${s.split(" - ")[0]}`.replace("Sept", "Sep"));

  test("teaching dates are either a single month or a month range", () => {
    for (const t of teaching) {
      assert.ok(ONE_OFF.test(t.when) || RANGE.test(t.when), `unrecognised date on ${t.where}: "${t.when}"`);
    }
  });

  test("teaching is listed newest first", () => {
    const starts = teaching.map((t) => startOf(t.when));
    for (const s of starts) assert.ok(!Number.isNaN(s), "unparseable teaching date");
    assert.deepEqual(starts, [...starts].sort((a, b) => b - a), "teaching should be reverse-chronological");
  });

  test("no date is in the future", () => {
    const now = Date.now();
    for (const t of teaching) assert.ok(startOf(t.when) <= now, `future date on ${t.where}`);
    for (const e of experience) assert.ok(startOf(e.year) <= now, `future date on ${e.org}`);
  });
});

describe("assets referenced by data exist", () => {
  test("both profile photos are present", () => {
    for (const p of [profile.avatar, (profile as any).avatarAlt]) {
      assert.ok(existsSync(join(root, "public", p.replace(/^\//, ""))), `missing image: ${p}`);
    }
  });

  test("every icon used has an implementation", () => {
    const icon = readFileSync(join(root, "src/components/Icon.astro"), "utf8");
    for (const s of [...profile.social, ...scholar]) {
      assert.ok(icon.includes(`name === "${s.icon}"`), `Icon.astro has no case for "${s.icon}"`);
    }
  });
});

describe("blog posts", () => {
  const dir = join(root, "src/content/blog");
  const posts = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md")) : [];

  test("each post has the frontmatter the schema requires", () => {
    for (const f of posts) {
      const fm = readFileSync(join(dir, f), "utf8").split("---")[1] ?? "";
      for (const key of ["title:", "date:", "summary:"]) {
        assert.ok(fm.includes(key), `${f} is missing ${key}`);
      }
      const date = fm.match(/date:\s*(\S+)/)?.[1] ?? "";
      assert.ok(!Number.isNaN(Date.parse(date)), `${f} has an unparseable date: ${date}`);
    }
  });

  test("post filenames are unique slugs", () => {
    const slugs = posts.map((f) => f.replace(/\.md$/, ""));
    assert.deepEqual(slugs.filter((s, i) => slugs.indexOf(s) !== i), []);
  });
});

describe("navigation", () => {
  test("every nav link resolves to a page", () => {
    for (const item of nav) {
      const slug = item.href.replace(/^\/|\/$/g, "");
      const candidates = [
        join(root, "src/pages", `${slug}.astro`),
        join(root, "src/pages", slug, "index.astro"),
        join(root, "src/pages", "index.astro"),
      ];
      assert.ok(candidates.some(existsSync), `no page for nav item ${item.href}`);
    }
  });
});

describe("teaching", () => {
  test("every entry has where, what, when and detail", () => {
    assert.ok(teaching.length > 0);
    for (const t of teaching) {
      assert.ok(t.where && t.what && t.when && t.detail, `incomplete entry: ${t.where}`);
    }
  });
});

describe("projects", () => {
  test("project links are absolute https", () => {
    for (const p of projects) assert.match(p.href, /^https:\/\//, `bad url: ${p.title}`);
  });
});
