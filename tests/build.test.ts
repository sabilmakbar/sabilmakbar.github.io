// Checks the built output in dist/. These catch broken internal links after a
// rename and confirm every expected page is produced. `npm test` builds first.
import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

const EXPECTED = ["index.html", "about/index.html", "blog/index.html", "cv/index.html",
  "activities/index.html", "publications/index.html", "repositories/index.html"];

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) return htmlFiles(p);
    return p.endsWith(".html") ? [p] : [];
  });
}

describe("built site", () => {
  before(() => {
    assert.ok(existsSync(dist), "dist/ is missing; run `npm run build` first");
  });

  for (const page of EXPECTED) {
    test(`${page} is built`, () => {
      assert.ok(existsSync(join(dist, page)), `missing ${page}`);
    });
  }

  test("internal links all resolve", () => {
    const broken: string[] = [];
    for (const file of htmlFiles(dist)) {
      const html = readFileSync(file, "utf8");
      const hrefs = [...html.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1]);
      for (const href of new Set(hrefs)) {
        const rel = href.replace(/^\//, "");
        const candidates = [
          join(dist, rel),
          join(dist, rel, "index.html"),
          join(dist, rel.replace(/\/$/, "") + "/index.html"),
        ];
        if (!candidates.some(existsSync)) {
          broken.push(`${file.replace(dist, "dist")} -> ${href}`);
        }
      }
    }
    assert.deepEqual(broken, [], "broken internal links");
  });

  test("no page leaks a phone number", () => {
    const PHONE = /\+?\d[\d\s().-]{8,}\d/;
    for (const file of htmlFiles(dist)) {
      const text = readFileSync(file, "utf8")
        .replace(/<[^>]*>/g, " ") // drop markup, incl. SVG path coordinates
        .replace(/https?:\/\/\S+/g, " ");
      assert.ok(!PHONE.test(text), `phone-like string in ${file.replace(dist, "dist")}`);
    }
  });

  test("every page has a title and description", () => {
    for (const file of htmlFiles(dist)) {
      const html = readFileSync(file, "utf8");
      assert.match(html, /<title>[^<]+<\/title>/, `no title in ${file.replace(dist, "dist")}`);
      assert.match(html, /name="description" content="[^"]+"/, `no description in ${file.replace(dist, "dist")}`);
    }
  });

  test("the chat widget is on content pages but not the landing page", () => {
    assert.ok(!readFileSync(join(dist, "index.html"), "utf8").includes("pqa-root"));
    assert.ok(readFileSync(join(dist, "about/index.html"), "utf8").includes("pqa-root"));
  });

  test("the chat widget persists across navigation", () => {
    // same persist name on every page, otherwise the conversation is lost
    for (const page of ["about", "cv", "publications", "repositories", "activities", "blog"]) {
      const html = readFileSync(join(dist, page, "index.html"), "utf8");
      assert.ok(
        html.includes('data-astro-transition-persist="chat-widget"'),
        `chat widget not persisted on /${page}`,
      );
    }
  });
});
