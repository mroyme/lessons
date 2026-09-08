#!/usr/bin/env node
// Verifies that every internal link in the authored pages resolves to a real file.
// Generated diagram artifacts are skipped: they are self-contained exports whose
// inline scripts contain href-like strings that are not navigable links.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative, extname } from "node:path";

const ROOT = resolve(process.argv[2] ?? ".");
const SKIP_DIRS = new Set([".git", ".github", "node_modules"]);
const GENERATED_HTML_BYTES = 200 * 1024;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function extractLinks(file, body) {
  const ext = extname(file).toLowerCase();
  const found = [];
  if (ext === ".html") {
    for (const m of body.matchAll(/(?:href|src)\s*=\s*"([^"]*)"/gi)) found.push(m[1]);
    for (const m of body.matchAll(/content\s*=\s*"\s*\d+\s*;\s*url=([^"]+)"/gi)) found.push(m[1]);
  } else if (ext === ".md") {
    for (const m of body.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) found.push(m[1]);
  }
  return found;
}

const isExternal = (t) =>
  /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(t) || t.startsWith("#") || t.trim() === "";

let checked = 0;
const dead = [];
const skipped = [];

for (const file of walk(ROOT)) {
  const ext = extname(file).toLowerCase();
  if (ext !== ".html" && ext !== ".md") continue;
  if (ext === ".html" && statSync(file).size > GENERATED_HTML_BYTES) {
    skipped.push(relative(ROOT, file));
    continue;
  }

  const body = readFileSync(file, "utf8");
  for (const raw of extractLinks(file, body)) {
    if (isExternal(raw)) continue;
    const target = decodeURIComponent(raw.split("#")[0].split("?")[0]).trim();
    if (!target) continue;

    // A directory link resolves if the directory exists; Pages serves its index.html.
    const abs = resolve(dirname(file), target);
    checked++;
    if (!existsSync(abs)) dead.push(`${relative(ROOT, file)} -> ${raw}`);
  }
}

for (const s of skipped) console.log(`skip (generated artifact)  ${s}`);
console.log(`\nchecked ${checked} internal links`);

if (dead.length) {
  console.error(`\n${dead.length} dead link(s):`);
  for (const d of dead) console.error(`  DEAD  ${d}`);
  process.exit(1);
}
console.log("all internal links resolve");
