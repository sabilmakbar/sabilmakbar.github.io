const OWNER = "sabilmakbar";

export const FEATURED = [
  "SEACrowd/seacrowd-datahub",
  "indonlp/nusa-writes",
  "indonlp/cendol",
  "SEACrowd/seacrowd-experiments",
];

const EXCLUDE_OWN = new Set(["sabilmakbar", "sabilmakbar.github.io", "claude-memories-template"]);
const PERSONAL_LIMIT = 6;

export type Repository = {
  name: string;
  owner: string;
  desc: string;
  stars: number;
  lang: string;
  url: string;
  slug: string;
};

const token = process.env.GITHUB_TOKEN;
const headers: Record<string, string> = {
  "User-Agent": "sabilmakbar-site",
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};
if (token) headers.Authorization = `Bearer ${token}`;

async function gh(url: string, accept = headers.Accept) {
  const response = await fetch(url, { headers: { ...headers, Accept: accept } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response;
}

const shape = (repo: any): Repository => ({
  name: repo.name,
  owner: repo.full_name.split("/")[0],
  desc: repo.description || "",
  stars: repo.stargazers_count ?? 0,
  lang: repo.language || "",
  url: repo.html_url,
  slug: repo.name.toLowerCase(),
});

let repositoryCache: Promise<{ featured: Repository[]; personal: Repository[] }> | undefined;

export function getRepositories() {
  repositoryCache ??= loadRepositories();
  return repositoryCache;
}

async function loadRepositories() {
  try {
    const featured = await Promise.all(
      FEATURED.map(async (path) => shape(await (await gh(`https://api.github.com/repos/${path}`)).json())),
    );
    const own: any[] = await (await gh(`https://api.github.com/users/${OWNER}/repos?per_page=100&sort=updated`)).json();
    const yearAgo = Date.now() - 365 * 24 * 3600 * 1000;
    const score = (repo: any) =>
      (repo.stargazers_count || 0) * 3 +
      (Date.parse(repo.pushed_at) > yearAgo ? 2 : 0) +
      (repo.description ? 1 : 0);
    const personal = own
      .filter((repo) => !repo.fork && !repo.archived && !EXCLUDE_OWN.has(repo.name))
      .sort((a, b) => score(b) - score(a))
      .slice(0, PERSONAL_LIMIT)
      .map(shape);
    return { featured, personal };
  } catch (error) {
    console.warn("[repositories] GitHub fetch failed, showing featured links only:", (error as Error).message);
    const featured = FEATURED.map((path) => {
      const [owner, name] = path.split("/");
      return { name, owner, desc: "", stars: -1, lang: "", url: `https://github.com/${path}`, slug: name };
    });
    return { featured, personal: [] };
  }
}

export async function getReadmeHtml(repo: Repository) {
  try {
    const html = await (
      await gh(
        `https://api.github.com/repos/${repo.owner}/${repo.name}/readme`,
        "application/vnd.github.html+json",
      )
    ).text();
    return cleanReadmeHtml(html);
  } catch (error) {
    console.warn(`[projects] README fetch failed for ${repo.owner}/${repo.name}:`, (error as Error).message);
    return "";
  }
}

export function cleanReadmeHtml(html: string) {
  // GitHub rewrites uploaded README images to five-minute signed URLs. They
  // would be broken by the time a static deployment reaches a visitor.
  return html
    .replace(
      /<a\b[^>]*\bhref="https:\/\/private-user-images\.githubusercontent\.com\/[^"?]+\?[^" ]+"[^>]*>\s*<img\b[^>]*>\s*<\/a>/gi,
      "",
    )
    .replace(
      /<img\b[^>]*\bsrc="https:\/\/private-user-images\.githubusercontent\.com\/[^"?]+\?[^" ]+"[^>]*>/gi,
      "",
    );
}
