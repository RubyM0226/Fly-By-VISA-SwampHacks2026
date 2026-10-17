// No React imports here: the root layout (a Server Component) uses this file.

export const SETTINGS_KEY = "saathi:settings";

/**
 * Runs in <head> before React hydrates so the page never flashes the wrong
 * size, language or contrast. Keep the logic in sync with
 * applySettingsToDocument in lib/settings.ts.
 */
export const PRE_HYDRATION_SCRIPT = `(function(){try{
var s=JSON.parse(localStorage.getItem("${SETTINGS_KEY}")||"{}");
var d=document.documentElement;
if(s.lang==="hi"||s.lang==="en")d.lang=s.lang;
d.dataset.textSize=String(s.textSize||0);
d.dataset.contrast=s.highContrast?"high":"normal";
d.dataset.mono=String(!!s.monochrome);
d.dataset.dyslexia=String(!!s.dyslexiaFont);
d.dataset.spacing=String(s.spacing||0);
d.dataset.bold=String(!!s.boldText);
d.dataset.underline=String(!!s.underlineLinks);
d.dataset.highlight=String(!!s.highlightLinks);
d.dataset.motion=s.pauseMotion?"paused":"normal";
}catch(e){}})();`;
