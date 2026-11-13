/** The single route policy for globally floating UI.
 * Access-only experiences should have no bottom toolbar or floating panels;
 * normal member and Owner Studio content keeps the standard controls.
 */
const accessPages=[
 "/","/early-access",
 "/account/login","/account/register","/account/sign-up",
 "/account/forgot-password","/account/change-password","/account/reset-password",
 "/admin/forgot-password","/admin/reset-password"
] as const;
export function isStandaloneAccessRoute(pathname:string){
 if(pathname==="/"||pathname==="/admin")return true;
 if(pathname==="/auth"||pathname.startsWith("/auth/"))return true;
 return accessPages.some(path=>path!=="/"&&(pathname===path||pathname.startsWith(path+"/")));
}
export function feedbackAllowedOnRoute(pathname:string){
 return !isStandaloneAccessRoute(pathname)
  && pathname!=="/admin"&&!pathname.startsWith("/admin/")
  && pathname!=="/account/owner-tools"&&!pathname.startsWith("/account/owner-tools/")
  && !pathname.startsWith("/fun-zone/picture-puzzles/");
}
