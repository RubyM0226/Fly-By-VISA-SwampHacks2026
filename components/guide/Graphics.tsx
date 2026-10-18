"use client";

import { STEP_BY_ID } from "@/content/steps";
import { APP_NAME } from "@/lib/config";
import { useT, type UiKey } from "@/lib/i18n";
import { STEPS_BY_PURPOSE } from "@/lib/journey";
import { useScamT } from "@/lib/scam/strings";
import { VERDICT_TEXT } from "@/lib/scam";
import { AlertIcon, CheckIcon, ChevronIcon, CircleIcon, ClockIcon, DocumentIcon, GearIcon, MinusIcon, PinIcon, PlaneIcon, PlusIcon, SpeakerIcon } from "../Icons";
import { Bar, Box, Btn, Marked, N, Walkthrough } from "./Mock";

// One component per page of the site. Each draws a simplified copy of that
// page from the site's own labels (so it follows the UI and every language)
// and lists what each numbered callout does. To update one, change the page
// graphic here and its guide.<page>.<n> strings in lib/i18n.ts.

/** guide.<page>.1 … guide.<page>.<count>, in order. */
function useItems(page: string, count: number) {
  const { t } = useT();
  return Array.from({ length: count }, (_, i) => t(`guide.${page}.${i + 1}` as UiKey));
}

export function LandingGraphic() {
  const { t, lang } = useT();
  return (
    <Walkthrough label={t("guide.landing.aria")} items={useItems("landing", 3)}>
      <Marked n={3} className="mb-3 justify-end">
        <Btn kind="outline">English ▾</Btn>
        <Btn kind="outline">− A +</Btn>
        <Btn kind="outline">
          <GearIcon className="h-4 w-4" /> {t("a11y.more")}
        </Btn>
      </Marked>
      <div className="grid items-center gap-3 @lg:grid-cols-2">
        <Box>
          <p className="text-base font-bold text-accent">{APP_NAME[lang]}</p>
          <Bar />
          <Bar w="w-3/4" />
          <Marked n={1}>
            <Btn>{t("landing.getStarted")} →</Btn>
          </Marked>
        </Box>
        <Marked n={2} className="justify-center">
          <span aria-hidden="true" className="block h-24 w-24 rounded-full border-4 border-accent bg-accent-soft" />
        </Marked>
      </div>
    </Walkthrough>
  );
}

export function PlacesGraphic() {
  const { t } = useT();
  return (
    <Walkthrough label={t("guide.places.aria")} items={useItems("places", 4)}>
      <div className="grid items-center gap-3 @lg:grid-cols-2">
        <Box>
          <Marked n={1}>
            <span className="font-bold">{t("home.from")}</span>
          </Marked>
          <Btn kind="outline">{t("country.IN")} ▾</Btn>
          <Marked n={2}>
            <span className="font-bold">{t("home.to")}</span>
          </Marked>
          <Btn kind="outline">{t("country.US")} ▾</Btn>
          <Marked n={4}>
            <Btn>{t("home.continue")} →</Btn>
          </Marked>
        </Box>
        <Marked n={3} className="justify-center">
          <span aria-hidden="true" className="block h-24 w-24 rounded-full border-4 border-accent bg-accent-soft" />
          <span className="flex flex-col gap-1">
            <Btn kind="outline">
              <PlusIcon className="h-4 w-4" />
            </Btn>
            <Btn kind="outline">
              <MinusIcon className="h-4 w-4" />
            </Btn>
          </span>
        </Marked>
      </div>
    </Walkthrough>
  );
}

export function StartGraphic() {
  const { t } = useT();
  return (
    <Walkthrough label={t("guide.start.aria")} items={useItems("start", 7)}>
      <Marked n={7} className="mb-2">
        <span className="text-base font-bold">{t("start.title")} ⓘ</span>
      </Marked>
      <div className="grid gap-3 @lg:grid-cols-2">
        <Box>
          <Marked n={1}>
            <span className="font-bold">{t("start.travelerName")}</span>
          </Marked>
          <Marked n={2}>
            <span className="font-bold">
              {t("start.departureCity")} · {t("start.arrivalCity")}
            </span>
          </Marked>
          <Marked n={3}>
            <span className="font-bold">{t("start.why")}</span>
          </Marked>
          <Btn>{t("start.why.family")}</Btn>
          <Marked n={4}>
            <span className="font-bold">{t("start.howLong")}</span>
            <Btn kind="outline">{t("start.month")} ▾</Btn>
          </Marked>
        </Box>
        <Box>
          <Marked n={5}>
            <span className="font-bold">{t("start.when")}</span>
          </Marked>
          <div aria-hidden="true" className="grid grid-cols-7 gap-1">
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} className={`h-4 rounded ${i < 5 ? "bg-line opacity-50" : i === 9 ? "bg-accent" : "border border-line-strong bg-surface"}`} />
            ))}
          </div>
          <Marked n={6}>
            <Btn>{t("start.make")} →</Btn>
            <Btn kind="outline">{t("start.back")}</Btn>
          </Marked>
        </Box>
      </div>
    </Walkthrough>
  );
}

/** The Dashboard's top cards. `shared`: the caregiver's read-only copy. */
export function DashboardGraphic({ shared = false }: { shared?: boolean }) {
  const { t, lang } = useT();
  const page = shared ? "shared" : "dashboard";
  return (
    <Walkthrough label={t(`guide.${page}.aria` as UiKey)} items={useItems(page, 4)}>
      {shared && (
        <Marked n={1} className="mb-2">
          <Btn>{t("helper.badge")}</Btn>
          <span className="text-base font-bold">{t("helper.title", { name: "Asha Rao" })}</span>
        </Marked>
      )}
      <Box className="@lg:flex @lg:items-center @lg:justify-between @lg:space-y-0">
        <div className="min-w-0 space-y-1">
          <Marked n={shared ? 2 : 1}>
            <span className="text-xs font-bold uppercase text-muted">{t("journey.tripTitle")}</span>
          </Marked>
          <p>Mumbai (BOM), India → Chicago (ORD), United States</p>
          <Bar w="w-1/2" />
        </div>
        <div className="flex flex-col items-start gap-1.5">
          {!shared && (
            <Marked n={2}>
              <Btn kind="accentOutline">{t("journey.edit")} →</Btn>
            </Marked>
          )}
          <Marked n={3}>
            <Btn kind={shared ? "accentOutline" : "outline"}>{t("journey.print")}</Btn>
          </Marked>
        </div>
      </Box>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border-2 border-accent bg-accent-soft p-2.5">
        <Marked n={4}>
          <span className="text-xs font-bold uppercase text-muted">
            <PinIcon className="inline h-4 w-4" /> {t("journey.next")}
          </span>
          <span className="font-bold">{STEP_BY_ID.ds160.text[lang].title}</span>
        </Marked>
        <Btn>{t("journey.showDetails")} →</Btn>
      </div>
    </Walkthrough>
  );
}

export function RoadmapGraphic() {
  const { t, lang } = useT();
  const pills = STEPS_BY_PURPOSE.family.slice(0, 4);
  const step = STEP_BY_ID.ds160.text[lang];
  return (
    <Walkthrough label={t("guide.roadmap.aria")} items={useItems("roadmap", 6)}>
      <div className="flex items-end gap-1.5 overflow-hidden">
        <Btn kind="outline">←</Btn>
        {pills.map((id, i) => (
          <div key={id} className="flex shrink-0 flex-col items-center gap-1">
            {i === 1 ? (
              <Marked n={2}>
                <span className="rounded-full bg-warm px-2 text-xs font-bold text-warm-ink">
                  <PinIcon className="inline h-3 w-3" /> {t("status.current")}
                </span>
              </Marked>
            ) : (
              <span className="h-7" />
            )}
            <span
              className={`rounded-full border-2 px-3 py-1 text-xs font-bold ${
                i === 0 ? "border-accent bg-accent text-accent-ink" : i === 1 ? "border-accent bg-accent-soft" : "border-line-strong bg-surface"
              }`}
            >
              {i === 0 && <CheckIcon className="inline h-3 w-3" />} {STEP_BY_ID[id].text[lang].pill}
            </span>
          </div>
        ))}
        <Btn kind="outline">→</Btn>
        <N n={1} />
      </div>
      <Box className="mt-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Marked n={3}>
            <span className="text-base font-bold">{step.title}</span>
            <Btn kind="outline">
              <SpeakerIcon className="h-4 w-4" />
            </Btn>
          </Marked>
          <Marked n={4}>
            <Btn kind="outline">
              <DocumentIcon className="h-4 w-4" /> {t("journey.viewDocuments")}
            </Btn>
          </Marked>
        </div>
        <Marked n={5}>
          <span className="font-bold">{t("journey.whatToDo")}:</span>
        </Marked>
        <p className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-flex h-4 w-4 items-center justify-center rounded border-2 border-accent bg-accent text-accent-ink">
            <CheckIcon className="h-3 w-3" />
          </span>
          <Bar w="w-2/3" />
        </p>
        <p className="flex items-center gap-2">
          <span aria-hidden="true" className="h-4 w-4 rounded border-2 border-line-strong bg-surface" />
          <Bar w="w-1/2" />
        </p>
        <Marked n={6} className="border-t-2 border-line pt-2">
          <span className="flex items-center gap-1 text-xs font-semibold text-warm-ink">
            <AlertIcon className="h-4 w-4" /> {t("journey.earlierNotDone")}
          </span>
          <Btn>
            <CheckIcon className="h-4 w-4" /> {t("journey.markDone")}
          </Btn>
        </Marked>
      </Box>
    </Walkthrough>
  );
}

export function PlanStatusGraphic() {
  const { t } = useT();
  return (
    <Walkthrough label={t("guide.status.aria")} items={useItems("status", 4)}>
      <Box>
        <Marked n={1}>
          <span className="text-base font-bold">{t("fit.yourDate", { date: "1 Jul 2027" })}</span>
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-warm-ink bg-warm px-2 text-xs font-bold text-warm-ink">
            <ClockIcon className="h-4 w-4" /> <span className="underline decoration-dotted">{t("fit.tight")}</span>
          </span>
        </Marked>
        <Marked n={2}>
          <div className="grid min-w-0 flex-1 gap-1 rounded border-2 border-line p-2 @md:grid-cols-[auto_1fr] @md:gap-x-4">
            <span className="text-muted">{t("fit.earliest")}</span>
            <span className="font-bold">3 Jun 2027, Kolkata</span>
            <span className="text-muted">{t("fit.spare")}</span>
            <span className="font-bold">{t("fit.aboutDays", { n: 7 })}</span>
            <span className="text-muted">{t("fit.bookBy")}</span>
            <span className="font-bold">17 Nov 2026</span>
          </div>
        </Marked>
        <p className="text-right">
          <span className="inline-flex items-center gap-2 font-semibold text-accent underline">
            <N n={3} /> {t("fit.how.title")}
          </span>
        </p>
        <Marked n={4}>
          <span className="font-bold">{t("fit.compare", { home: "India" })}</span>
        </Marked>
        <div className="grid gap-2 @md:grid-cols-3">
          {["Kolkata", "Chennai", "New Delhi"].map((city, i) => (
            <span key={city} className={`space-y-1 rounded border-2 p-1.5 ${i === 0 ? "border-accent" : "border-line-strong"}`}>
              <span className="block font-bold">{city}</span>
              {i === 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 text-xs font-bold text-accent-ink">
                  <ClockIcon className="h-3 w-3" /> {t("fit.fastest")}
                </span>
              )}
            </span>
          ))}
        </div>
      </Box>
    </Walkthrough>
  );
}

/** The Documents page. `shared`: what a caregiver can do there. */
export function DocumentsGraphic({ shared = false }: { shared?: boolean }) {
  const { t } = useT();
  const page = shared ? "sharedDocs" : "documents";
  return (
    <Walkthrough label={t(`guide.${page}.aria` as UiKey)} items={useItems(page, shared ? 3 : 6)}>
      {!shared && (
        <Marked n={1} className="mb-2">
          <span aria-hidden="true" className="h-4 w-4 rounded border-2 border-accent bg-accent" />
          <Bar w="w-40" />
        </Marked>
      )}
      <Box>
        <Marked n={shared ? 1 : 2}>
          <span className="text-base font-bold text-accent">{t("nav.documents")}</span>
          <Btn kind="outline">
            <SpeakerIcon className="h-4 w-4" />
          </Btn>
        </Marked>
        <div className="grid gap-2 @lg:grid-cols-2">
          <Box>
            <Marked n={shared ? 2 : 3}>
              <span className="font-bold">DS-160</span>
              <span className="inline-flex items-center gap-1 text-muted">
                <CircleIcon className="h-4 w-4" /> {t("documents.missing")}
              </span>
            </Marked>
            <Bar w="w-5/6" />
            <div className="flex flex-wrap items-center gap-2">
              {!shared && <N n={4} />}
              <Btn>{t("documents.addCopy")}</Btn>
              <span className="italic text-muted">*{t("documents.blank.online")}</span>
            </div>
          </Box>
          <Box>
            <Marked n={shared ? 3 : 5}>
              <span className="font-bold">{t("files.title")}</span>
              <span className="inline-flex items-center gap-1 text-accent">
                <CheckIcon className="h-4 w-4" /> {t("documents.added")}
              </span>
            </Marked>
            <div className="flex flex-wrap gap-2">
              <Btn kind="outline">{t("files.open")}</Btn>
              {!shared && <Btn kind="outline">{t("documents.replace")}</Btn>}
              {!shared && <Btn kind="danger">{t("files.delete")}</Btn>}
            </div>
          </Box>
        </div>
      </Box>
      {!shared && (
        <Marked n={6} className="mt-2">
          <span className="font-bold text-accent">{t("documents.other")}</span>
          <Btn>{t("files.upload")}</Btn>
        </Marked>
      )}
    </Walkthrough>
  );
}

export function FlightsGraphic() {
  const { t } = useT();
  return (
    <Walkthrough label={t("guide.flights.aria")} items={useItems("flights", 6)}>
      <Box>
        <Marked n={1}>
          <Btn kind="outline">{t("flights.from")}: BOM ▾</Btn>
          <Btn kind="outline">{t("flights.to")}: ORD ▾</Btn>
          <Btn>
            <PlaneIcon className="h-4 w-4" /> {t("flights.search")}
          </Btn>
        </Marked>
      </Box>
      <Box className="mt-2 border-accent">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Marked n={2}>
            <span className="rounded-full bg-accent-soft px-2 font-bold">{t("flights.pick.best")}</span>
          </Marked>
          <Marked n={3}>
            <Btn kind="accentOutline">{t("flights.select")}</Btn>
          </Marked>
        </div>
        <p className="text-base font-bold">
          $605 <span className="text-sm font-normal">· {t("flights.oneStop")}</span>
        </p>
        <Marked n={4}>
          <span className="rounded border-2 border-line px-2 py-0.5">{t("flights.transit.none")}</span>
        </Marked>
        <Marked n={5}>
          <Btn>{t("flights.book")}</Btn>
          <Btn kind="outline">{t("flights.kayak")}</Btn>
        </Marked>
      </Box>
      <Marked n={6} className="mt-2">
        <Btn kind="outline">
          {t("flights.all", { n: 12 })} <ChevronIcon className="h-4 w-4" />
        </Btn>
      </Marked>
    </Walkthrough>
  );
}

export function OfficeMapGraphic() {
  const { t } = useT();
  return (
    <Walkthrough label={t("guide.map.aria")} items={useItems("map", 4)}>
      <div className="relative h-32 rounded-lg border-2 border-line-strong bg-accent-soft">
        <span className="absolute left-[30%] top-[20%] flex items-center gap-1">
          <N n={1} />
          <span className="rounded-full border-2 border-accent bg-surface px-2 text-xs font-bold">New Delhi</span>
        </span>
        <span className="absolute left-[18%] top-[58%] rounded-full border-2 border-accent bg-surface px-2 text-xs font-bold">Mumbai</span>
        <span className="absolute right-[6%] top-[30%] max-w-[55%] rounded border-l-4 border-accent bg-surface p-1.5 text-xs">
          <span className="flex items-center gap-1 font-bold text-accent">
            <N n={2} /> {t("map.consulate")} · Kolkata
          </span>
          {t("map.interviewWait", { n: 6.5 })}
        </span>
      </div>
      <Marked n={3} className="mt-2">
        <span className="text-base font-bold">{t("map.listTitle")}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 text-xs font-bold text-accent-ink">
          <ClockIcon className="h-3 w-3" /> {t("fit.fastest")}
        </span>
      </Marked>
      <Marked n={4} className="mt-2">
        <span className="text-muted">{t("map.asOf", { date: "17 Sep 2026" })}</span>
      </Marked>
    </Walkthrough>
  );
}

export function ScamCheckGraphic() {
  const { t, lang } = useT();
  const { st } = useScamT();
  return (
    <Walkthrough label={t("guide.scam.aria")} items={useItems("scam", 6)}>
      <Box>
        <Marked n={1}>
          <span className="font-bold">{st("inputLabel")}</span>
        </Marked>
        <span aria-hidden="true" className="block h-10 rounded border-2 border-line-strong bg-surface" />
        <Marked n={2}>
          <span className="font-bold">{st("imageLabel")}</span>
        </Marked>
        <Marked n={3}>
          <Btn>{st("check")}</Btn>
        </Marked>
      </Box>
      <Box className="mt-2 border-danger">
        <Marked n={4}>
          <span className="inline-flex items-center gap-1 text-base font-bold text-danger">
            <AlertIcon className="h-4 w-4" /> {VERDICT_TEXT["likely-scam"].label[lang]}
          </span>
        </Marked>
        <Marked n={5}>
          <span className="font-bold">{st("why")}</span>
          <span className="font-bold">· {st("todo")}</span>
          <span className="font-bold">· {st("official")}</span>
        </Marked>
        <Marked n={6}>
          <span className="font-bold">{st("followLabel")}</span>
        </Marked>
      </Box>
    </Walkthrough>
  );
}

export function TerminologyGraphic() {
  const { t } = useT();
  return (
    <Walkthrough label={t("guide.terms.aria")} items={useItems("terms", 4)}>
      <Marked n={1}>
        <span className="font-bold">{t("glossary.searchLabel")}</span>
        <span className="rounded border-2 border-line-strong bg-surface px-2 text-muted">{t("glossary.placeholder")}</span>
      </Marked>
      <Marked n={2} className="mt-2">
        <Btn kind="outline">{t("glossary.cat.visas")}</Btn>
        <Btn kind="outline">{t("glossary.cat.forms")}</Btn>
      </Marked>
      <Marked n={3} className="mt-2">
        <span className="min-w-0 flex-1 space-y-1 rounded border-2 border-l-[6px] border-line border-l-accent bg-surface p-2">
          <span className="block font-bold">B-2 Visa</span>
          <Bar w="w-3/4" />
        </span>
      </Marked>
      <Marked n={4} className="mt-2">
        <span>
          <Bar w="w-16" />
        </span>
        <span className="font-semibold underline decoration-dotted decoration-2 underline-offset-4">DS-160</span>
        <span className="rounded border-2 border-line-strong bg-surface px-2 text-xs">{t("guide.terms.tip")}</span>
      </Marked>
    </Walkthrough>
  );
}

export function LookupGraphic() {
  const { t } = useT();
  return (
    <Walkthrough label={t("guide.lookup.aria")} items={useItems("lookup", 4)}>
      <Box>
        <Marked n={1}>
          <span className="font-bold">{t("docs.searchLabel")}</span>
        </Marked>
        <div className="flex flex-wrap gap-2">
          <span className="min-w-0 flex-1 rounded border-2 border-line-strong bg-surface px-2 text-muted">{t("docs.placeholder")}</span>
          <Btn>{t("docs.ask")}</Btn>
        </div>
        <Marked n={2}>
          <span className="text-muted">{t("docs.try")}</span>
          <Btn kind="outline">passport</Btn>
          <Btn kind="outline">photo</Btn>
        </Marked>
      </Box>
      <Box className="mt-2">
        <Marked n={3}>
          <span className="font-bold">{t("docs.you")}</span>
        </Marked>
        <Bar />
        <Bar w="w-2/3" />
        <span className="font-semibold text-accent underline">{t("docs.source")}</span>
        <p className="text-xs text-muted">{t("docs.aiNote")}</p>
      </Box>
      <Marked n={4} className="mt-2">
        <span className="font-bold">{t("docs.common")}</span>
      </Marked>
    </Walkthrough>
  );
}

export function AccountGraphic() {
  const { t } = useT();
  return (
    <Walkthrough label={t("guide.account.aria")} items={useItems("account", 6)}>
      <Marked n={1}>
        <span className="text-base font-bold">{t("account.hi", { name: "Asha" })}</span>
      </Marked>
      <Box className="mt-2">
        <Marked n={2}>
          <span className="font-bold text-accent">{t("trip.title")}</span>
        </Marked>
        <div className="grid gap-2 @lg:grid-cols-2">
          <span className="space-y-1">
            <Bar />
            <Bar w="w-3/4" />
            <Bar w="w-1/2" />
          </span>
          <span className="space-y-1">
            <span aria-hidden="true" className="block h-10 rounded border-2 border-line-strong bg-surface" />
            <Btn>{t("trip.save")}</Btn>
          </span>
        </div>
      </Box>
      <Box className="mt-2">
        <Marked n={3}>
          <span className="text-xs font-bold uppercase text-muted">{t("account.roadmapStatus")}</span>
        </Marked>
      </Box>
      <Box className="mt-2">
        <Marked n={4}>
          <span className="font-bold text-accent">{t("account.addCollaborator")}</span>
          <Btn>{t("account.helper.generate")}</Btn>
        </Marked>
      </Box>
      <Box className="mt-2">
        <Marked n={5}>
          <span className="font-bold text-accent">{t("account.files.title")}</span>
          <Btn kind="danger">{t("files.deleteAll")}</Btn>
        </Marked>
      </Box>
      <Marked n={6} className="mt-2 justify-center">
        <Btn kind="danger">{t("myPlan.signOut")}</Btn>
      </Marked>
    </Walkthrough>
  );
}

export function SettingsGraphic() {
  const { t } = useT();
  return (
    <Walkthrough label={t("guide.settings.aria")} items={useItems("settings", 5)}>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Marked n={1}>
          <Btn kind="outline">English ▾</Btn>
        </Marked>
        <Marked n={2}>
          <span className="text-muted">{t("a11y.textSize")}</span>
          <Btn kind="outline">
            <MinusIcon className="h-4 w-4" />
          </Btn>
          <span className="font-bold">A</span>
          <Btn kind="outline">
            <PlusIcon className="h-4 w-4" />
          </Btn>
        </Marked>
        <Btn kind="outline">
          <GearIcon className="h-4 w-4" /> {t("a11y.more")}
        </Btn>
      </div>
      <Box className="mt-2">
        <Marked n={3}>
          <span className="font-bold">{t("a11y.spacing")}</span>
          <Btn>{t("a11y.spacing0")}</Btn>
          <Btn kind="outline">{t("a11y.spacing1")}</Btn>
        </Marked>
        <Marked n={4}>
          <div className="grid min-w-0 flex-1 gap-1.5 @lg:grid-cols-2">
            {(["a11y.highContrast", "a11y.dyslexia", "a11y.bold", "a11y.definitions"] as const).map((key, i) => (
              <span key={key} className="flex items-center justify-between gap-2 rounded border-2 border-line-strong bg-surface px-2 py-1">
                <span className="font-semibold">{t(key)}</span>
                <span className={`rounded-full px-2 text-xs font-bold ${i === 3 ? "bg-accent text-accent-ink" : "bg-warm text-warm-ink"}`}>
                  {t(i === 3 ? "a11y.on" : "a11y.off")}
                </span>
              </span>
            ))}
          </div>
        </Marked>
        <Marked n={5} className="justify-center border-t-2 border-line pt-2">
          <Btn kind="outline">{t("a11y.reset")}</Btn>
        </Marked>
      </Box>
    </Walkthrough>
  );
}

export function ContactGraphic() {
  const { t } = useT();
  return (
    <Walkthrough label={t("guide.contact.aria")} items={useItems("contact", 2)}>
      <div className="space-y-2 rounded-lg border-2 border-dashed border-line-strong bg-surface p-3 text-center">
        <p className="font-bold">{t("helper.contact.title")}</p>
        <Marked n={1} className="justify-center">
          <span className="rounded-lg bg-green-700 px-3 py-1 text-sm font-bold text-white">{t("helper.contact.button")}</span>
        </Marked>
      </div>
      <Marked n={2} className="mt-2">
        <span className="font-bold">{t("nav.account")}</span>
        <Btn kind="outline">{t("helperAccount.stopViewing")}</Btn>
      </Marked>
    </Walkthrough>
  );
}
