---
name: 02-zoom-hook
description: Universal useZoomScenes hook — keyboard-driven cinematic zoom for React applications
---

# useZoomScenes — universal zoom hook

## What it is

A ~70-line React hook that turns any application into a keyboard-controlled presentation with cinematic zoom transitions. No libraries — just vanilla React + a CSS transition.

## Contract

```ts
const { currentScene, setCurrentScene, hudVisible } = useZoomScenes({
  scenes,                  // map: key → { tab, target?, scale?, ox?, oy?, scroll?, label }
  activeTab,               // current React tab state
  setActiveTab,            // tab setter
  onTabSwitch,             // (newTab) => void  optional, side effects on tab change
  viewportSelector,        // CSS selector for the fixed viewport (e.g. '.zoom-viewport')
  containerSelector,       // CSS selector for the transformed container (e.g. '.zoom-container')
});
```

Returns `currentScene` (apply the transform), and `hudVisible` (show the scene indicator).

## Scene config

```js
const SCENES = {
  // Identity zoom — full view, scale 1
  '1': { tab: 'situation', label: 'Overview' },

  // Numeric (cinematic) — hand-tuned for drama
  '3': { tab: 'situation', scale: 3.0, ox: 17, oy: 2, label: 'KPI tight zoom' },

  // Auto-fit (utility) — zoom to fit selector with padding
  '5': { tab: 'analytics', target: '.results-panel', padding: 40, label: 'Results' },

  // With scroll (when target is in a scrollable container)
  '4': { tab: 'situation', scale: 2.0, ox: 99, oy: 10,
         scroll: { el: '.right-panel', y: 0 },
         label: 'Top alert in panel' },

  // Tab switch + zoom
  '8': { tab: 'scenario', scale: 1.3, ox: 90, oy: 25, label: 'Scenario results' },
};
```

**When to use numeric vs target:**
- **Numeric** for cinematic frames — off-center origin (`oy: 99`, `ox: 3`) creates drama
- **Target** for utility "fit this element" zooms — auto-computed via `getBoundingClientRect`
- **Numeric always wins** when both are provided

## How it works

1. `keydown` listener in `useEffect` on `window`
2. Look up the scene by `e.key`
3. If `tab !== activeTab` → `setActiveTab(scene.tab)` + `setTimeout(apply, 120)` (wait for React to render)
4. `apply()` computes `{ scale, ox, oy }`:
   - If `target` is given → `getBoundingClientRect()` → ratio inside container → ox/oy %
   - Otherwise → numeric override or `(1, 50, 50)`
5. `setCurrentScene({ ...scene, scale, ox, oy, key })` → re-render
6. CSS transition on `.zoom-container` smoothly animates over 0.8s

## CSS

```css
.zoom-viewport {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.zoom-container {
  width: 100%;
  height: 100%;
  transition: transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1),
              transform-origin 0.8s cubic-bezier(0.25, 0.1, 0.25, 1);
  transform-origin: 50% 50%;
  will-change: transform;
}
```

`will-change: transform` is critical — without it the zoom is jerky on large pages.

`cubic-bezier(0.25, 0.1, 0.25, 1)` ≈ `ease-out`, similar to a cinematic dolly.

## Applying it in JSX

```jsx
const zoomStyle = currentScene
  ? { transform: `scale(${currentScene.scale})`,
      transformOrigin: `${currentScene.ox}% ${currentScene.oy}%` }
  : { transform: 'scale(1)', transformOrigin: '50% 50%' };

return (
  <div className="zoom-viewport">
    <div className="zoom-container" style={zoomStyle}>
      {/* your application */}
    </div>
  </div>
);
```

## HUD scene indicator

Optional — show the scene label in the corner on key press (3 seconds, then hide):

```jsx
<div className={`scene-hud ${hudVisible ? 'visible' : ''}`}>
  {currentScene && (
    <>
      <span className="scene-key">{currentScene.key}</span>
      <span className="scene-label">{currentScene.label}</span>
    </>
  )}
</div>
```

CSS:
```css
.scene-hud {
  position: fixed; top: 12px; right: 12px;
  background: rgba(0,0,0,0.75);
  padding: 6px 12px; border-radius: 8px;
  opacity: 0; transition: opacity 0.3s;
  z-index: 9999;
}
.scene-hud.visible { opacity: 1; }
```

**For the final take** you can either keep the HUD (it doubles as scene markers for syncing voiceover) or hide it via `hudVisible: false` / CSS.

## Pitfalls

### 1. Scale > 4 breaks the render

Cap fit-zoom at 4×: `Math.min(scaleX, scaleY, 4)`. Otherwise tiny targets (a 20×20 button) trigger ~50× auto-fit → blur, monstrous content sizes, lag.

### 2. Off-screen origin at high scale

At `scale=2.5` with `ox=96` the right edge of the container slides outside the viewport. Math:
- `right_edge_after_scale = ox*W/100 + (W - ox*W/100) * scale`
- Want ≤ W (1920)
- Solve for `ox` at the chosen scale

Numbers for 1920×1080:
- `scale=2.0, ox≥98` → no clip on the right
- `scale=2.2, ox=99` → no clip
- `scale=2.4, ox=99, oy=99` → no clip on right or bottom

### 3. Tab switch race condition

When a scene changes tabs, the new component mounts asynchronously. Applying zoom before mount → `querySelector(scene.target)` returns `null` → fallback to identity. **Fix:** `setTimeout(apply, 120)` after `setActiveTab`. 100–150ms covers most cases.

### 4. `getBoundingClientRect` and the current transform

If the container is already zoomed when you measure, `getBoundingClientRect` returns scaled coordinates. To get unscaled sizes:
```js
const currentScale = container.getBoundingClientRect().width / viewport.getBoundingClientRect().width;
const unscaledW = elementRect.width / currentScale;
```

The ox/oy ratios stay invariant — both the container and the element scale equally.

### 5. ESC and `-` reset

Standard UX:
- `Escape` → reset zoom (full overview, no tab change)
- `-` or another dedicated key → finale (return to the overview tab)

Add to SCENES like any other scene: `'-': { tab: 'overview', label: 'Finale' }`.

## Ready-made code

See [templates/useZoomScenes.snippet.js](../templates/useZoomScenes.snippet.js) — drop-in for any React app.
