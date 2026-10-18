// Central place for names, dates and links the team will tweak often.

export const APP_NAME = { en: "FlyByVisa", hi: "FlyByVisa", es: "FlyByVisa" } as const;

// Shown on every page. Update this whenever someone re-verifies the content
// against the official pages.
export const CONTENT_LAST_CHECKED = "2026-10-16";

export const LINKS = {
  visitorVisa: "https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html",
  visaWizard: "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/wizard.html",
  ds160: "https://ceac.state.gov/genniv/",
  photoRules: "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/photos.html",
  fees: "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/fees/fees-visa-services.html",
  waitTimes: "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/wait-times.html",
  embassyIndia: "https://in.usembassy.gov/visas/",
  embassyUK: "https://uk.usembassy.gov/visas/",
  embassyMexico: "https://mx.usembassy.gov/visas/",
  esta: "https://esta.cbp.dhs.gov/",
  fraudWarning: "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/fraud.html",
  cbpVisitors: "https://www.cbp.gov/travel/international-visitors",
  i94: "https://i94.cbp.dhs.gov/",
  passportIndia: "https://www.passportindia.gov.in/",
  uscisExtend: "https://www.uscis.gov/visit-the-united-states/extend-your-stay",
} as const;
