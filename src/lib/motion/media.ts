/** Media conditions the landing animations are built for. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";
export const DESKTOP = "(min-width: 1024px)";

/**
 * Inline script that runs before first paint. It marks the document as animated so reveal
 * targets start hidden; if the animation code never arrives, the mark is removed and the
 * page shows as normal.
 */
export const MOTION_BOOTSTRAP = `(function(){try{if(matchMedia("${MOTION_OK}").matches){var d=document.documentElement;d.classList.add("motion");setTimeout(function(){if(!window.__motionReady)d.classList.remove("motion")},4000)}}catch(e){}})()`;
