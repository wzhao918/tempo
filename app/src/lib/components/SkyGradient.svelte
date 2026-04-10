<script>
  /**
   * SkyGradient — time-of-day ambient background.
   *
   * Two layers:
   *   1. A color gradient fading from the top of the viewport that shifts
   *      through the day (deep night → dawn → sky blue day → sunset → night).
   *   2. A star field, visible only during night hours, that gently twinkles.
   *
   * Both layers are driven by the engine's centralized `tick.hour` (fractional
   * hour of day), so they update smoothly without their own timers.
   *
   * Color phases (approximate):
   *   Night (0–5):         deep navy/black, stars visible
   *   Pre-dawn (5–6):      purple, stars fading out
   *   Dawn (6–7):          warm orange
   *   Early morning (7–9): pale gold transitioning to pale blue
   *   Late morning (9–12): deep sky blue
   *   Afternoon (12–15):   bright sky blue, near-white
   *   Late afternoon (15–17): warming back toward gold
   *   Golden hour (17–18): amber
   *   Sunset (18–19):      orange/pink
   *   Dusk (19–20):        purple, stars fading in
   *   Evening (20–22):     deep purple → navy
   *   Night (22–24):       deep navy/black, stars fully visible
   */

  import { tick } from '$lib/engine.svelte.js';

  let hour = $derived(tick.hour);

  // ─── Color gradient ──────────────────────────────────────────
  function lerp(a, b, t) {
    return a + (b - a) * Math.max(0, Math.min(1, t));
  }

  function lerpColor(c1, c2, t) {
    return [
      Math.round(lerp(c1[0], c2[0], t)),
      Math.round(lerp(c1[1], c2[1], t)),
      Math.round(lerp(c1[2], c2[2], t)),
    ];
  }

  // Color stops: [hour, [r, g, b], opacity]
  const STOPS = [
    [0,   [6, 8, 20],       0.75],  // deep night
    [5,   [6, 8, 20],       0.75],  // deep night
    [6,   [40, 25, 55],     0.65],  // pre-dawn purple
    [7,   [180, 85, 50],    0.55],  // dawn orange
    [9,   [150, 160, 180],  0.40],  // early morning pale blue
    [12,  [60, 120, 200],   0.45],  // late morning deep sky blue
    [15,  [140, 180, 220],  0.35],  // afternoon bright sky blue
    [17,  [180, 160, 140],  0.40],  // late afternoon warming
    [18,  [200, 120, 60],   0.55],  // golden hour amber
    [19,  [180, 70, 80],    0.60],  // sunset orange/pink
    [20,  [70, 40, 90],     0.65],  // dusk purple
    [22,  [25, 20, 55],     0.70],  // evening deep purple
    [24,  [6, 8, 20],       0.75],  // deep night
  ];

  let gradientStyle = $derived.by(() => {
    // Find the two stops we're between
    let i = 0;
    for (; i < STOPS.length - 1; i++) {
      if (hour < STOPS[i + 1][0]) break;
    }

    const [h1, c1, o1] = STOPS[i];
    const [h2, c2, o2] = STOPS[i + 1];
    const t = (hour - h1) / (h2 - h1);
    const color = lerpColor(c1, c2, t);
    const opacity = lerp(o1, o2, t);

    const rgb = `${color[0]}, ${color[1]}, ${color[2]}`;
    return `background: linear-gradient(180deg, rgba(${rgb}, ${opacity.toFixed(2)}) 0%, rgba(${rgb}, ${(opacity * 0.3).toFixed(2)}) 40%, transparent 100%);`;
  });

  // ─── Star field ──────────────────────────────────────────────
  // Pre-generated once on module load so the stars' positions are stable
  // for the life of the app. Each star has its own twinkle animation
  // parameters, distributed across a range so they don't pulse in sync.

  const STAR_COUNT = 80;
  const STARS = Array.from({ length: STAR_COUNT }, () => ({
    left: Math.random() * 100,                  // percent across viewport
    top: Math.random() * 38,                    // percent from top (matches gradient fade zone)
    size: 0.8 + Math.random() * 1.6,            // px diameter
    baseOpacity: 0.35 + Math.random() * 0.55,   // individual brightness
    delay: Math.random() * 8,                   // animation offset in seconds
    duration: 3 + Math.random() * 5,            // twinkle cycle length
  }));

  // Layer opacity driven by hour:
  //   0–5:   1   (full night)
  //   5–6:   1 → 0 (fade out before dawn)
  //   6–19:  0   (hidden during day)
  //   19–21: 0 → 1 (fade in after sunset)
  //   21–24: 1   (full night)
  let starLayerOpacity = $derived.by(() => {
    const h = hour;
    if (h < 5) return 1;
    if (h < 6) return 1 - (h - 5);
    if (h < 19) return 0;
    if (h < 21) return (h - 19) / 2;
    return 1;
  });
</script>

<div class="sky-gradient" style={gradientStyle}></div>

<div class="star-field" style="opacity: {starLayerOpacity.toFixed(3)}">
  {#each STARS as star}
    <div
      class="star"
      style="
        left: {star.left}%;
        top: {star.top}%;
        width: {star.size}px;
        height: {star.size}px;
        --base-opacity: {star.baseOpacity};
        animation-delay: {star.delay}s;
        animation-duration: {star.duration}s;
      "
    ></div>
  {/each}
</div>

<style>
  .sky-gradient {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 100vh;
    pointer-events: none;
    z-index: 0;
    transition: background 60s linear;
  }

  .star-field {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 45vh;             /* concentrated at the top, matches gradient reach */
    pointer-events: none;
    z-index: 0;
    transition: opacity 60s linear;
  }

  .star {
    position: absolute;
    background: #f5f5ff;
    border-radius: 50%;
    opacity: var(--base-opacity);
    animation-name: twinkle;
    animation-iteration-count: infinite;
    animation-timing-function: ease-in-out;
    box-shadow: 0 0 2px rgba(245, 245, 255, 0.5);
  }

  @keyframes twinkle {
    0%, 100% {
      opacity: calc(var(--base-opacity) * 1);
    }
    50% {
      opacity: calc(var(--base-opacity) * 0.25);
    }
  }
</style>
