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

  test("every image and asset reference resolves", () => {
    const broken: string[] = [];
    for (const file of htmlFiles(dist)) {
      const html = readFileSync(file, "utf8");
      const refs = [...html.matchAll(/(?:src|href)="(\/[^"#?]+\.(?:png|jpe?g|svg|ico|webp|css|js))"/g)].map((m) => m[1]);
      for (const ref of new Set(refs)) {
        if (!existsSync(join(dist, ref.replace(/^\//, "")))) {
          broken.push(`${file.replace(dist, "dist")} -> ${ref}`);
        }
      }
    }
    assert.deepEqual(broken, [], "missing assets");
  });

  test("every page carries link-preview tags with absolute URLs", () => {
    for (const file of htmlFiles(dist)) {
      const html = readFileSync(file, "utf8");
      const where = file.replace(dist, "dist");
      for (const prop of ["og:title", "og:description", "og:url", "og:image", "og:type"]) {
        assert.match(html, new RegExp(`property="${prop}" content="[^"]+"`), `missing ${prop} on ${where}`);
      }
      assert.match(html, /name="twitter:card" content="summary_large_image"/, `no twitter card on ${where}`);
      // scrapers do not resolve relative paths
      const url = html.match(/property="og:url" content="([^"]+)"/)?.[1] ?? "";
      const img = html.match(/property="og:image" content="([^"]+)"/)?.[1] ?? "";
      assert.match(url, /^https:\/\//, `og:url is not absolute on ${where}`);
      assert.match(img, /^https:\/\//, `og:image is not absolute on ${where}`);
      assert.match(html, /rel="canonical" href="https:\/\//, `no canonical on ${where}`);
    }
  });

  test("descriptions stay within what search and social actually show", () => {
    // Google truncates near 160 characters; link previews often near 125.
    for (const file of htmlFiles(dist)) {
      const html = readFileSync(file, "utf8");
      const where = file.replace(dist, "dist");
      for (const pat of [/name="description" content="([^"]+)"/, /property="og:description" content="([^"]+)"/]) {
        const text = html.match(pat)?.[1] ?? "";
        assert.ok(text.length > 0, `empty description on ${where}`);
        assert.ok(text.length <= 160, `description is ${text.length} chars on ${where}, keep it under 160`);
      }
    }
  });

  test("the preview image is actually shipped", () => {
    const html = readFileSync(join(dist, "index.html"), "utf8");
    const img = html.match(/property="og:image" content="[^"]*(\/img\/[^"]+)"/)?.[1] ?? "";
    assert.ok(img, "could not read the og:image path");
    assert.ok(existsSync(join(dist, img.replace(/^\//, ""))), `og:image missing from the build: ${img}`);
  });

  test("every page declares a language and a viewport", () => {
    for (const file of htmlFiles(dist)) {
      const html = readFileSync(file, "utf8");
      assert.match(html, /<html[^>]+lang="/, `no lang on ${file.replace(dist, "dist")}`);
      assert.match(html, /name="viewport"/, `no viewport on ${file.replace(dist, "dist")}`);
    }
  });

  test("the landing page stays chrome-free", () => {
    // hideChat and hideFooter are what make it feel like a single ask box
    const html = readFileSync(join(dist, "index.html"), "utf8");
    assert.ok(!html.includes("Contact me by Email"), "the footer leaked onto the landing page");
    assert.ok(html.includes("ask-form"), "the ask box is missing");
  });

  test("dark mode styles ship", () => {
    const css = readdirSync(join(dist, "_astro"))
      .filter((f) => f.endsWith(".css"))
      .map((f) => readFileSync(join(dist, "_astro", f), "utf8"))
      .join("");
    assert.match(css, /\.dark/, "no dark mode rules found");
    assert.match(css, /--accent/, "design tokens are missing");
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

  test("analytics beacon matches whether a token was set at build time", () => {
    const token = (process.env.CF_ANALYTICS_TOKEN ?? "").trim();
    const html = readFileSync(join(dist, "about/index.html"), "utf8");
    const hasBeacon = html.includes("static.cloudflareinsights.com/beacon.min.js");
    if (token) {
      assert.ok(hasBeacon, "CF_ANALYTICS_TOKEN is set but no beacon was emitted");
      assert.ok(html.includes(token), "beacon is missing the site token");
    } else {
      // no token means no third-party request at all
      assert.ok(!hasBeacon, "beacon emitted without a token being set");
    }
  });

  test("no third-party scripts beyond the optional analytics beacon", () => {
    const allowed = ["static.cloudflareinsights.com"];
    for (const file of htmlFiles(dist)) {
      const srcs = [...readFileSync(file, "utf8").matchAll(/<script[^>]+src="https:\/\/([^/"]+)/g)].map((m) => m[1]);
      for (const host of new Set(srcs)) {
        assert.ok(allowed.includes(host), `unexpected third-party script from ${host} in ${file.replace(dist, "dist")}`);
      }
    }
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
