// The Help page builds string keys from names (guide.<page>.<n>), which the
// type checker cannot see. Checks that every key it asks for exists in every
// language. Run: npx tsx scripts/check-guide.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DICTIONARY } from "../lib/i18n";

const graphics = readFileSync("components/guide/Graphics.tsx", "utf8");
const screen = readFileSync("components/guide/GuideScreen.tsx", "utf8");

const keys = new Set<string>();
// useItems("page", n) -> guide.page.aria? (aria is read separately) and guide.page.1..n
for (const [, page, n] of graphics.matchAll(/useItems\((?:"(\w+)"|page), (?:(\d+)|shared \? 3 : 6)\)/g)) {
  if (page) for (let i = 1; i <= Number(n); i++) keys.add(`guide.${page}.${i}`);
}
// The two variant graphics: dashboard/shared (4 each), documents (6) / sharedDocs (3).
for (const [page, n] of [["dashboard", 4], ["shared", 4], ["documents", 6], ["sharedDocs", 3]] as const) {
  for (let i = 1; i <= n; i++) keys.add(`guide.${page}.${i}`);
  keys.add(`guide.${page}.aria`);
}
for (const [, key] of graphics.matchAll(/t\("(guide\.[\w.]+)"\)/g)) keys.add(key);
// Sections: guide.section.<key>.title and .intro
for (const [, key] of screen.matchAll(/key: "(\w+)"/g)) {
  keys.add(`guide.section.${key}.title`);
  keys.add(`guide.section.${key}.intro`);
}

assert.ok(keys.size > 100, `only ${keys.size} keys found; did the patterns change?`);
for (const [lang, dict] of Object.entries(DICTIONARY)) {
  for (const key of keys) assert.ok(Object.hasOwn(dict, key), `${lang} is missing ${key}`);
}
console.log(`guide strings: ${keys.size} keys present in ${Object.keys(DICTIONARY).join(", ")}`);
