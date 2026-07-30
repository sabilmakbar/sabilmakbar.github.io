// Regenerate the QA worker's index from the SAME structured data the site uses.
// Single source of truth: src/data/*.ts. Private info never enters here, because
// those files never contain it. Run: npm run build:index  (see package.json).
//
// Output: profile-qa/worker/src/index.json  ->  [{ source, text }]

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { profile } from "../../src/data/profile.ts";
import { about } from "../../src/data/about.ts";
import { education, experience, projects, awards, academicInterests, otherInterests } from "../../src/data/cv.ts";
import { publications } from "../../src/data/publications.ts";
import { teaching } from "../../src/data/activities.ts";

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

type Chunk = { source: string; text: string };
const chunks: Chunk[] = [];
const push = (source: string, text: string) => chunks.push({ source, text: stripHtml(text) });

// --- identity / bio ------------------------------------------------------
push("about:headline", `Current focus of Salsabil Maulana Akbar (Sabil): ${profile.tagline}. Based in ${profile.location}.`);
push("about:bio", about.summary);
for (const c of about.coreExperience) push(`about:core:${c.label}`, `${c.label}: ${c.text}`);
for (const c of about.exploring)
  push(`about:interest:${c.label}`, `Interest and future direction (not past industry work) — ${c.label}: ${c.text}`);
push(
  "about:keywords",
  "Keywords, domains, and tech stack for Sabil: " + about.keywords.map((k) => `${k.group}: ${k.items}`).join("; ") + ".",
);

// --- experience ----------------------------------------------------------
// Overview chunk carries the career-start date so the model can derive
// "years of experience" against today's date (the worker injects that).
// Direct answer to "what does he do?", so generic questions land on the current
// role rather than on an aspiration chunk.
const current = experience[0];
push(
  "about:current-role",
  `What Salsabil Maulana Akbar (Sabil) does now, his current job, role, and day-to-day work: ` +
    `he works as ${current.title} at ${current.org}${(current as any).location ? `, ${(current as any).location}` : ""} ` +
    `(${current.year}). ${current.points[0]}`,
);

const first = experience[experience.length - 1];
const startMatch = first.year.match(/([A-Z][a-z]{2})\s+(\d{4})/);
const careerStart = startMatch ? `${startMatch[1]} ${startMatch[2]}` : first.year;
push(
  "cv:experience:overview",
  `Salsabil Maulana Akbar (Sabil) began his professional career in ${careerStart} (first role: ${first.title} at ${first.org}). ` +
    `Compute his total years of experience from ${careerStart} to today's date. Roles in reverse-chronological order: ` +
    experience.map((e) => `${e.title} at ${e.org} (${e.year})`).join("; ") + ".",
);
for (const e of experience) {
  push(
    `cv:experience:${e.org}`,
    `${e.title} at ${e.org}${(e as any).location ? `, ${(e as any).location}` : ""} (${e.year}). ` + e.points.join(". ") + ".",
  );
}

// --- education / projects / interests ------------------------------------
for (const ed of education) {
  push("cv:education", `${ed.title}, ${ed.org} (${ed.year}). ` + ed.points.join(". ") + ".");
}
// --- teaching, mentoring, talks ------------------------------------------
push(
  "activities:teaching:overview",
  "Teaching, mentoring, instructing, and speaking experience of Salsabil Maulana Akbar (Sabil), alongside his main roles: " +
    teaching.map((t) => `${t.what} at ${t.where} (${t.when})`).join("; ") + ".",
);
for (const t of teaching) {
  push(`activities:teaching:${t.where}`, `${t.what} at ${t.where} (${t.when}). ${t.detail}`);
}

push(
  "cv:awards",
  "Awards and honours won by Salsabil Maulana Akbar (Sabil): " +
    awards.map((a) => `${a.title} (${a.org}, ${a.year})`).join("; ") + ".",
);
push(
  "cv:projects",
  "Open-source projects by Sabil: " +
    projects.map((p) => `${p.title} (${p.year}) — ${p.points.map(stripHtml).join("; ")}`).join(". ") + ".",
);
for (const a of academicInterests) {
  push("cv:academic-interests", `Academic interest — ${a.title}: ` + a.items.join("; ") + ".");
}
push("cv:other-interests", "Other interests of Sabil: " + otherInterests.map(stripHtml).join("; ") + ".");

// --- publications --------------------------------------------------------
for (const p of publications) {
  push(
    `pub:${p.title.slice(0, 40)}`,
    `Research paper co-authored by Salsabil Maulana Akbar (Sabil), titled: ${p.title}. Authors: ${p.authors}.` +
      `${p.venue ? ` Published in: ${p.venue}.` : ""} Year: ${p.year}.`,
  );
}
push(
  "pub:overview",
  "All publications co-authored by Salsabil Maulana Akbar (Sabil): " +
    publications.map((p) => `${p.title} (${p.venue || "n/a"}, ${p.year})`).join("; ") + ".",
);

// --- write ---------------------------------------------------------------
const here = dirname(fileURLToPath(import.meta.url));
// optional arg lets tests write elsewhere and diff without touching the real file
const out = process.argv[2] ? resolve(process.argv[2]) : resolve(here, "../worker/src/index.json");
writeFileSync(out, JSON.stringify(chunks, null, 0) + "\n");
console.log(`wrote ${chunks.length} chunks -> ${out}`);
