"""
Piece 1 — content ingestion.

Reads the al-folio profile sources (bio, CV, publications), cleans out
template/markup cruft, and splits everything into small text chunks.

Output: data/chunks.json  — a list of {"id", "source", "text"} records,
the input to the embedding/index step (build_index.py).

Pure-stdlib except PyYAML (for cv.yml). No ML dependencies.
Run:  python ingest.py --site /path/to/sabilmakbar.github.io
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

try:
    import yaml
except ImportError:
    raise SystemExit("PyYAML is required: pip install pyyaml")


# ---------------------------------------------------------------- helpers

def strip_front_matter(md: str) -> tuple[dict, str]:
    """Split a Jekyll '--- yaml --- body' file into (front_matter, body)."""
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", md, re.DOTALL)
    if not m:
        return {}, md
    fm = yaml.safe_load(m.group(1)) or {}
    return fm, m.group(2)


def clean_text(s: str) -> str:
    """Drop HTML tags / comments and collapse whitespace."""
    s = re.sub(r"<!--.*?-->", " ", s, flags=re.DOTALL)   # html comments
    s = re.sub(r"<[^>]+>", " ", s)                        # html tags
    s = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", s)        # md links -> text
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


# ---------------------------------------------------------------- sources

def ingest_about(site: Path) -> list[dict]:
    p = site / "_pages" / "about.md"
    if not p.exists():
        return []
    fm, body = strip_front_matter(p.read_text(encoding="utf-8"))
    chunks = []
    subtitle = clean_text(str(fm.get("subtitle", "")))
    if subtitle:
        chunks.append({"source": "about:subtitle",
                       "text": f"Headline / current focus: {subtitle}"})
    body = clean_text(body)
    # one chunk per non-empty paragraph
    for i, para in enumerate(p for p in body.split("\n\n") if len(p.strip()) > 40):
        chunks.append({"source": f"about:bio#{i}", "text": para.strip()})
    return chunks


def flatten_cv(node, trail: list[str]) -> list[str]:
    """Recursively turn the nested cv.yml into readable 'A — B: C' lines."""
    lines = []
    if isinstance(node, dict):
        name = node.get("name") or node.get("title") or node.get("institution")
        meta = []
        for k in ("institution", "year", "value"):
            if node.get(k):
                meta.append(clean_text(str(node[k])))
        head = " — ".join(x for x in ([clean_text(str(name))] if name else []) + meta if x)
        if head:
            lines.append(head)
            trail = trail + [head]
        for k in ("contents", "description"):
            if k in node:
                lines += flatten_cv(node[k], trail)
    elif isinstance(node, list):
        for item in node:
            lines += flatten_cv(item, trail)
    elif node:
        lines.append(clean_text(str(node)))
    return lines


def ingest_cv(site: Path) -> list[dict]:
    p = site / "_data" / "cv.yml"
    if not p.exists():
        return []
    sections = yaml.safe_load(p.read_text(encoding="utf-8")) or []
    chunks = []
    for sec in sections:
        title = clean_text(str(sec.get("title", "CV")))
        lines = flatten_cv(sec.get("contents", []), [])
        text = title + "\n" + "\n".join(f"- {l}" for l in lines if l)
        if lines:
            chunks.append({"source": f"cv:{title}", "text": text.strip()})
    return chunks


def parse_bib(text: str) -> list[dict]:
    """Minimal BibTeX entry parser via brace matching (no external dep)."""
    entries, i, n = [], 0, len(text)
    while True:
        at = text.find("@", i)
        if at == -1:
            break
        brace = text.find("{", at)
        if brace == -1:
            break
        etype = text[at + 1:brace].strip().lower()
        depth, j = 1, brace + 1
        while j < n and depth:
            depth += (text[j] == "{") - (text[j] == "}")
            j += 1
        body = text[brace + 1:j - 1]
        fields = {}
        for fm in re.finditer(r"(\w+)\s*=\s*[{\"](.*?)[}\"]\s*,?\s*(?=\w+\s*=|$)",
                              body, re.DOTALL):
            fields[fm.group(1).lower()] = re.sub(r"\s+", " ", fm.group(2)).strip()
        fields["_type"] = etype
        entries.append(fields)
        i = j
    return entries


def ingest_bib(site: Path) -> list[dict]:
    bibs = list((site / "_bibliography").glob("*.bib"))
    chunks = []
    titles = []  # for the aggregate overview chunk
    for p in bibs:
        for e in parse_bib(p.read_text(encoding="utf-8")):
            author = e.get("author", "")
            # keep only the owner's real papers; drops al-folio template junk
            if not re.search(r"akbar|salsabil", author, re.IGNORECASE):
                continue
            title = clean_text(e.get("title", "")).replace("{", "").replace("}", "")
            venue = e.get("booktitle") or e.get("journal") or ""
            year = e.get("year", "")
            titles.append(f"{title} ({year})" if year else title)
            parts = [f"Research paper / academic publication co-authored by "
                     f"Salsabil Maulana Akbar (Sabil), titled: {title}"]
            if author:
                parts.append(f"Authors: {clean_text(author)}")
            if venue:
                parts.append(f"Published in: {clean_text(venue)}")
            if year:
                parts.append(f"Year: {year}")
            # embed a concise, retrieval-friendly string; long author lists
            # dilute the vector, so keep them out of embed_text.
            embed_text = (f"Research paper / academic publication by Salsabil "
                          f"Akbar: {title}" + (f" ({year})" if year else ""))
            chunks.append({"source": f"pub:{title[:40]}",
                           "text": ". ".join(parts),
                           "embed_text": embed_text})
    # aggregate overview chunk so list-style / meta questions have a target
    if titles:
        overview = ("List of all research papers and publications co-authored "
                    "by Salsabil Maulana Akbar (Sabil): " + "; ".join(titles) + ".")
        chunks.append({
            "source": "pub:overview",
            "text": overview,
            "embed_text": ("Overview and complete list of all academic research "
                           "papers and publications co-authored by Salsabil Akbar. "
                           + "; ".join(titles)),
        })
    return chunks


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--site", required=True, help="path to the al-folio site repo")
    ap.add_argument("--out", default="data/chunks.json")
    args = ap.parse_args()

    site = Path(args.site).expanduser()
    if not site.exists():
        raise SystemExit(f"site path not found: {site}")

    chunks = []
    chunks += ingest_about(site)
    chunks += ingest_cv(site)
    chunks += ingest_bib(site)

    for i, c in enumerate(chunks):
        c["id"] = i

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(chunks, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"wrote {len(chunks)} chunks -> {out}")
    by_src = {}
    for c in chunks:
        by_src[c["source"].split(":")[0]] = by_src.get(c["source"].split(":")[0], 0) + 1
    print("by source type:", dict(by_src))


if __name__ == "__main__":
    main()
