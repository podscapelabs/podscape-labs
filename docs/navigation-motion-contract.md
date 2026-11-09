# PodScape motion & gesture contract (v1)

This contract covers the installed mobile PWA, mobile browser and desktop. Onboarding should teach **these actual interactions**, not a separate simulated drag engine.

## Navigation hierarchy

1. **Browser edge swipe:** leave the first 34px on either side to the operating system / browser. Never block the native Back gesture.
2. **Installed PWA content swipe:** a deliberate right swipe (at least 110px, predominantly horizontal, within 800ms) navigates backward **only if this tab has an earlier PodScape route**. Never infer safety from `window.history.length` (which might point outside the app). Display subtle feedback while it is in progress.
3. **Local swipe surfaces:** species profile headers own left/right navigation to adjacent species, independently of Back. Horizontal rails, sliders, tabs, dialogs, and editing/drag surfaces own their gestures. A local gesture must opt out of the shared swipe-back using `data-swipe-navigation="local"` where applicable.
4. **Browser-mode gestures:** respect native navigation; do not install a competing general swipe handler in Safari/Chrome.
5. **Desktop:** use ordinary links, browser Back and keyboard controls. Never require swipe to reach a destination.

## Customization interaction

- Workspace cards: long-press to enter edit mode; drag with a handle; arrow buttons provide precise non-drag reordering.
- Home, Manager and toolbar shortcuts: dragging and explicit Move left/right are both supported.
- Reordering keeps existing saved layouts and selections intact.
- Animations support reduced-motion preferences. Focus-visible states and controls must remain functional without animation.
- Tutorial demonstrations use these live components. Do not create an onboarding-only version whose movement is more capable or smoother.

## QA before release

- iPhone installed PWA: Ledger -> profile -> nested detail; right swipe away from the species hero returns to the prior route; hero right swipe moves to the previous species; native edge Back still works.
- Swipe over image carousels, editable canvases, active dialogs and shortcut editors: no global Back activation.
- Vertical scrolling, diagonal movement and slow drags: no global Back activation.
- First-launched deep link: content swipe does not leave PodScape.
- iPhone Safari browser: browser edge swipe remains native; general in-content swipe does not trigger extra Back.
- Desktop keyboard: Back buttons/links, shortcut arrows and widget arrows work normally.
- Both light/dark and reduced-motion: feedback remains legible and doesn't require motion.

**Implementation note:** tab-local route tracking is intentionally conservative; reloads reset in-memory history to avoid navigating outside the platform. This is not a route-transition animation engine, and a real-device build test is still required.
