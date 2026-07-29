// Regenerate the QA worker's index from the SAME structured data the site uses.
// Single source of truth: src/data/*.ts. Private info never enters here, because
// those files never contain it. Run: npm run build:index  (see package.json).
//
// Output: profile-qa/worker/src/index.json  ->  [{ source, text }]

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { profile } from "../../src/data/profile.ts";
import { education, experience, projects, academicInterests, otherInterests } from "../../src/data/cv.ts";
import { publications } from "../../src/data/publications.ts";

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

type Chunk = { source: string; text: string };
const chunks: Chunk[] = [];
const push = (source: string, text: string) => chunks.push({ source, text: stripHtml(text) });

// --- identity / bio ------------------------------------------------------
push("about:headline", `Current focus of Salsabil Maulana Akbar (Sabil): ${profile.tagline}. Based in ${profile.location}.`);
push("about:bio", profile.blurb);

// --- experience ----------------------------------------------------------
// Overview chunk carries the career-start date so the model can derive
// "years of experience" against today's date (the worker injects that).
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
const out = resolve(here, "../worker/src/index.json");
writeFileSync(out, JSON.stringify(chunks, null, 0) + "\n");
console.log(`wrote ${chunks.length} chunks -> ${out}`);
