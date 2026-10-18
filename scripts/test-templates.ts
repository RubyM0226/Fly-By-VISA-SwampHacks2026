// Builds every template in English and Hindi, then reads each .docx back with
// mammoth to check it opens and holds the right text. Run: npx tsx scripts/test-templates.ts
import assert from "node:assert/strict";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import mammoth from "mammoth";
import { TEMPLATE_BY_ID, type TemplateId } from "../content/templates";
import { buildTemplateDocx } from "../lib/templateDocx";

async function main() {
  const out = mkdtempSync(join(tmpdir(), "flybyvisa-templates-"));

  for (const id of Object.keys(TEMPLATE_BY_ID) as TemplateId[]) {
    const template = TEMPLATE_BY_ID[id];
    assert.equal(template.lines.length, template.text.en.items.length, `${id}: one line count per item`);
    for (const lang of ["en", "hi"] as const) {
      const buf = await buildTemplateDocx(template, lang);
      assert.equal(buf.subarray(0, 2).toString(), "PK", "a .docx is a zip file");
      const path = join(out, `${template.fileName}-${lang}.docx`);
      writeFileSync(path, buf);

      const { value: text } = await mammoth.extractRawText({ buffer: buf });
      for (const label of template.text.en.items) assert.ok(text.includes(label), `${id}/${lang}: English "${label}"`);
      const hi = template.text.hi;
      if (lang === "hi" && hi) {
        for (const label of hi.items) assert.ok(text.includes(label), `${id}/hi: Hindi "${label}"`);
      } else {
        assert.ok(!/[ऀ-ॿ]/.test(text), `${id}/en: no Devanagari in the English-only file`);
      }
      console.log(`ok  ${path} (${buf.length} bytes)`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
