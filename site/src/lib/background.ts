import type { Background } from "@/lib/data/types";

/**
 * Full-screen backgrounds. The admin keeps a list of options, each a picture
 * for the light theme, one for the dark theme, and a veil: how much of the
 * theme's own ground colour lies over the picture so text keeps its contrast.
 *
 * Which option shows is decided before the first paint by the inline script
 * below, in this order: a `?background=<id|none>` preview link, the visitor's
 * own choice (only while the picker is on), then the site default. React never
 * renders these attributes, so hydration cannot undo them.
 */

export type BackgroundLook = {
  id: string;
  name: string;
  light: string;
  dark: string | null;
  veilLight: number;
  veilDark: number;
};

export const BACKGROUND_STORAGE_KEY = "background";
export const NO_BACKGROUND = "none";

const PROPERTIES = ["--bg-light", "--bg-dark", "--bg-veil-light", "--bg-veil-dark"] as const;

export function toLook(row: Background): BackgroundLook {
  return { id: row.id, name: row.name, light: row.light_url, dark: row.dark_url, veilLight: row.veil_light, veilDark: row.veil_dark };
}

/** A CSS url(). JSON's escapes for quotes and backslashes are also valid in a CSS string. */
export function cssUrl(url: string): string {
  return `url(${JSON.stringify(url)})`;
}

/** The custom properties that paint one option, set on <html>. */
export function backgroundVars(look: BackgroundLook): Record<string, string> {
  const vars: Record<string, string> = {
    "--bg-light": cssUrl(look.light),
    "--bg-veil-light": String(look.veilLight / 100),
    "--bg-veil-dark": String(look.veilDark / 100),
  };
  if (look.dark) vars["--bg-dark"] = cssUrl(look.dark);
  return vars;
}

/** Shows one option, or none, after hydration. The picker calls this. */
export function applyBackground(look: BackgroundLook | null) {
  const root = document.documentElement;
  for (const name of PROPERTIES) root.style.removeProperty(name);
  if (!look) {
    root.removeAttribute("data-bg");
    root.setAttribute("data-bg-id", NO_BACKGROUND);
    return;
  }
  for (const [name, value] of Object.entries(backgroundVars(look))) root.style.setProperty(name, value);
  root.setAttribute("data-bg", "");
  root.setAttribute("data-bg-id", look.id);
}

/**
 * Runs while the <head> is parsed: applies a saved theme, drops the no-js
 * flag, and paints the chosen background before anything is drawn.
 */
export function bootScript(looks: BackgroundLook[], defaultId: string | null, pickerOn: boolean): string {
  const config = {
    looks: Object.fromEntries(looks.map((look) => [look.id, backgroundVars(look)])),
    fallback: defaultId && looks.some((look) => look.id === defaultId) ? defaultId : NO_BACKGROUND,
    picker: pickerOn,
  };
  // "<" is escaped so no value can close the <script> element early.
  const json = JSON.stringify(config).replace(/</g, "\\u003c");
  return `(function(){
var d=document.documentElement;d.classList.remove("no-js");
try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")d.setAttribute("data-theme",t)}catch(e){}
var c=${json},id=null;
try{id=new URLSearchParams(location.search).get("background");if(!id&&c.picker)id=localStorage.getItem(${JSON.stringify(BACKGROUND_STORAGE_KEY)})}catch(e){}
if(!id||(id!==${JSON.stringify(NO_BACKGROUND)}&&!c.looks[id]))id=c.fallback;
d.setAttribute("data-bg-id",id);
var v=c.looks[id];if(!v)return;
for(var k in v)d.style.setProperty(k,v[k]);
d.setAttribute("data-bg","");
})()`;
}
