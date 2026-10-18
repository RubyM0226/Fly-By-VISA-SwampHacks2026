import { BorderStyle, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { Template } from "@/content/templates";
import type { Lang } from "./settings";

// Builds a FlyByVisa template as a .docx. The font is left to the viewer, so
// Word or LibreOffice picks one that can show Devanagari.

const BODY = 28; // half-points: 14 pt, large and easy to read
const SMALL = 24;
const GREY = "555555";

/** The template text for `lang`, plus English underneath when `lang` is not English. */
export async function buildTemplateDocx(template: Template, lang: Lang): Promise<Buffer> {
  const en = template.text.en;
  const main = template.text[lang] ?? en; // no translation yet: English only
  const second = main === en ? null : en;

  const line = (text: string, opts: { bold?: boolean; grey?: boolean; after?: number } = {}) =>
    new Paragraph({
      spacing: { after: opts.after ?? 80 },
      children: [
        new TextRun({ text, bold: opts.bold, size: opts.grey ? SMALL : BODY, color: opts.grey ? GREY : undefined }),
      ],
    });
  // An empty ruled line to write the answer on.
  const blank = () =>
    new Paragraph({
      spacing: { before: 240, after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "888888", space: 1 } },
      children: [new TextRun({ text: "", size: BODY })],
    });

  const children: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      spacing: { after: second ? 0 : 240 },
      children: [new TextRun({ text: `FlyByVisa: ${main.title}`, bold: true, size: 44 })],
    }),
  ];
  if (second) {
    children.push(
      new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: second.title, size: 32, color: GREY })] }),
    );
  }
  main.intro.forEach((text, i) => {
    children.push(line(text, { after: second ? 0 : 80 }));
    if (second) children.push(line(second.intro[i], { grey: true }));
  });

  main.items.forEach((label, i) => {
    children.push(
      new Paragraph({
        spacing: { before: 360, after: second ? 0 : 80 },
        keepNext: true,
        children: [new TextRun({ text: `${i + 1}. ${label}`, bold: true, size: BODY })],
      }),
    );
    if (second) children.push(line(second.items[i], { grey: true }));
    for (let n = 0; n < (template.lines[i] ?? 1); n++) children.push(blank());
  });

  children.push(new Paragraph({ spacing: { before: 480 }, children: [] }));
  children.push(line(main.closing, { bold: true, after: second ? 0 : 80 }));
  if (second) children.push(line(second.closing, { grey: true }));

  const doc = new Document({
    creator: "FlyByVisa",
    title: main.title,
    styles: { default: { document: { run: { size: BODY } } } },
    sections: [{ children }],
  });
  return Packer.toBuffer(doc);
}
