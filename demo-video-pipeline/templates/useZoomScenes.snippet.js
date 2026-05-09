/* ─────────────────────────────────────────────────────────────
   useZoomScenes — universal keyboard-driven zoom hook
   ─────────────────────────────────────────────────────────────
   Drop into any React app. Requires React.useState/useEffect destructured.

   Scene config:
     { tab, target?, padding?, scale?, ox?, oy?, scroll?, label }
   - target: CSS selector to fit into viewport (auto-computes ox/oy/scale)
   - padding: margin around fitted target (px, default 40)
   - scale/ox/oy: numeric override; wins when both target and numeric provided
   - scroll: { el, y } to scroll a panel after zoom applies

   Returns: { currentScene, setCurrentScene, hudVisible }
   ───────────────────────────────────────────────────────────── */
function useZoomScenes({
  scenes,
  activeTab,
  setActiveTab,
  onTabSwitch,
  viewportSelector,
  containerSelector,
}) {
  const [currentScene, setCurrentScene] = React.useState(null);
  const [hudVisible, setHudVisible] = React.useState(false);

  React.useEffect(() => {
    let hudTimer;

    const computeZoom = (scene) => {
      // Numeric override path
      if (scene.scale != null || scene.ox != null || scene.oy != null) {
        return {
          scale: scene.scale ?? 1,
          ox: scene.ox ?? 50,
          oy: scene.oy ?? 50,
        };
      }
      // Target-based auto-fit
      if (!scene.target) return { scale: 1, ox: 50, oy: 50 };
      const viewport = document.querySelector(viewportSelector);
      const container = document.querySelector(containerSelector);
      const el = document.querySelector(scene.target);
      if (!viewport || !container || !el) return { scale: 1, ox: 50, oy: 50 };

      const vp = viewport.getBoundingClientRect();
      const cont = container.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const currentScale = cont.width / vp.width || 1;

      const ox = ((r.left - cont.left + r.width / 2) / cont.width) * 100;
      const oy = ((r.top - cont.top + r.height / 2) / cont.height) * 100;
      const unscaledW = r.width / currentScale;
      const unscaledH = r.height / currentScale;
      const px = scene.padding ?? 40;
      const scaleX = (vp.width - px * 2) / unscaledW;
      const scaleY = (vp.height - px * 2) / unscaledH;
      const scale = Math.max(1, Math.min(scaleX, scaleY, 4));
      return { scale, ox, oy };
    };

    const applyScene = (scene, key) => {
      const apply = () => {
        setCurrentScene({ ...scene, key, ...computeZoom(scene) });
        if (scene.scroll) {
          setTimeout(() => {
            const el = document.querySelector(scene.scroll.el);
            if (el) el.scrollTo({ top: scene.scroll.y || 0, behavior: 'smooth' });
          }, 50);
        }
      };
      const tabChange = scene.tab && scene.tab !== activeTab;
      if (tabChange) {
        if (onTabSwitch) onTabSwitch(scene.tab);
        setActiveTab(scene.tab);
        setTimeout(apply, 120);
      } else {
        apply();
      }
      setHudVisible(true);
      clearTimeout(hudTimer);
      hudTimer = setTimeout(() => setHudVisible(false), 3000);
    };

    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === 'Escape') {
        setCurrentScene(null);
        setHudVisible(false);
        return;
      }
      const scene = scenes[e.key];
      if (!scene) return;
      e.preventDefault();
      applyScene(scene, e.key === '-' ? '−' : e.key);
    };

    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      clearTimeout(hudTimer);
    };
  }, [scenes, activeTab, setActiveTab, onTabSwitch, viewportSelector, containerSelector]);

  return { currentScene, setCurrentScene, hudVisible };
}

/* ─────────────────────────────────────────────────────────────
   Example SCENES config
   ───────────────────────────────────────────────────────────── */
const SCENES = {
  '1': { tab: 'overview', label: 'Main screen' },
  '2': { tab: 'overview', scale: 1.5, ox: 35, oy: 52, label: 'Map' },
  '3': { tab: 'overview', scale: 3.0, ox: 17, oy: 2,  label: 'KPI tight zoom' },
  '4': { tab: 'overview', scale: 2.0, ox: 99, oy: 10, scroll: { el: '.right-panel', y: 0 }, label: 'Top alert' },
  '5': { tab: 'overview', target: '.results-panel', padding: 40, label: 'Auto-fit results' },
  '0': { tab: 'analytics', label: 'Analytics tab' },
  '-': { tab: 'overview', label: 'Finale' },
};

/* ─────────────────────────────────────────────────────────────
   App example
   ───────────────────────────────────────────────────────────── */
function App() {
  const [activeTab, setActiveTab] = React.useState('overview');

  const { currentScene, setCurrentScene, hudVisible } = useZoomScenes({
    scenes: SCENES,
    activeTab,
    setActiveTab,
    viewportSelector: '.zoom-viewport',
    containerSelector: '.zoom-container',
  });

  // Reset zoom when navigating via clicks (not keys)
  React.useEffect(() => { setCurrentScene(null); }, [activeTab, setCurrentScene]);

  const zoomStyle = currentScene
    ? { transform: `scale(${currentScene.scale})`,
        transformOrigin: `${currentScene.ox}% ${currentScene.oy}%` }
    : { transform: 'scale(1)', transformOrigin: '50% 50%' };

  return (
    <div className="app-shell">
      <div className="zoom-viewport">
        <div className="zoom-container" style={zoomStyle}>
          {/* your content */}
        </div>
      </div>
      <div className={`scene-hud ${hudVisible ? 'visible' : ''}`}>
        {currentScene && (
          <>
            <span className="scene-key">{currentScene.key}</span>
            <span className="scene-label">{currentScene.label}</span>
          </>
        )}
      </div>
    </div>
  );
}

/* CSS:
.zoom-viewport { width: 100%; height: 100vh; overflow: hidden; position: relative; }
.zoom-container {
  width: 100%; height: 100%;
  transition: transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1),
              transform-origin 0.8s cubic-bezier(0.25, 0.1, 0.25, 1);
  transform-origin: 50% 50%;
  will-change: transform;
}
.scene-hud {
  position: fixed; top: 12px; right: 12px;
  background: rgba(0,0,0,0.75); color: #fff;
  padding: 6px 12px; border-radius: 8px;
  opacity: 0; transition: opacity 0.3s;
  z-index: 9999; font-family: monospace;
}
.scene-hud.visible { opacity: 1; }
.scene-key { background: #4C90F0; padding: 2px 8px; border-radius: 4px; margin-right: 8px; }
*/
