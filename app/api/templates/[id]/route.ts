import { isTemplateId, TEMPLATE_BY_ID } from "@/content/templates";
import { buildTemplateDocx } from "@/lib/templateDocx";
import type { Lang } from "@/lib/settings";

// GET /api/templates/<id>?lang=hi  a FlyByVisa helper template as a Word file,
// in the site language plus English. Public: templates hold no personal data.

const LANGS: readonly Lang[] = ["en", "hi"];

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isTemplateId(id)) return Response.json({ error: "not_found" }, { status: 404 });

  const asked = new URL(request.url).searchParams.get("lang");
  const lang: Lang = LANGS.includes(asked as Lang) ? (asked as Lang) : "en";
  const template = TEMPLATE_BY_ID[id];
  const file = await buildTemplateDocx(template, lang);

  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${template.fileName}${lang === "en" ? "" : `-${lang}`}.docx"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
