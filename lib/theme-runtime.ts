import {
 THEMES,THEME_STORAGE_KEY,isThemePreference,resolveTheme,themeColorScheme,
 type ThemeId,type ThemePreference
} from "./theme-registry";

/** One runtime application path for every theme-aware UI control. */
export function storedThemePreference():ThemePreference{
 const saved=localStorage.getItem(THEME_STORAGE_KEY);
 return isThemePreference(saved)?saved:"system";
}
export function applyThemePreference(mode:ThemePreference):ThemeId{
 const theme=resolveTheme(mode,window.matchMedia("(prefers-color-scheme: dark)").matches);
 const root=document.documentElement;
 root.dataset.theme=theme;
 root.dataset.themePreference=mode;
 root.style.colorScheme=themeColorScheme(theme);
 const canvas=THEMES.find(item=>item.id===theme)?.colors[0];
 if(canvas){
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach(meta=>{
   meta.setAttribute("content",canvas);
  });
 }
 window.dispatchEvent(new CustomEvent("podscape-theme-change",{detail:theme}));
 return theme;
}
export function chooseThemePreference(mode:ThemePreference):ThemeId{
 if(mode==="system")localStorage.removeItem(THEME_STORAGE_KEY);
 else localStorage.setItem(THEME_STORAGE_KEY,mode);
 return applyThemePreference(mode);
}
