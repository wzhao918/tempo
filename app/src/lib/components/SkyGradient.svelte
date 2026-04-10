<script>
  /**
   * SkyGradient — time-of-day ambient background.
   * Renders a gradient at the top of the viewport that fades into the app's
   * dark background. Updates every minute. No external APIs — just the clock.
   *
   * Color phases:
   *   Night (0-5):       deep navy/black
   *   Dawn (5-7):        warm orange/pink
   *   Morning (7-10):    soft gold
   *   Midday (10-15):    bright warm yellow
   *   Afternoon (15-17): golden amber
   *   Dusk (17-19):      orange/pink/purple
   *   Evening (19-21):   deep blue/purple
   *   Night (21-24):     deep navy/black
   */

  import { tick } from '$lib/engine.svelte.js';

  let hour = $derived(tick.hour);

  // Interpolate between color stops based on current hour
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
    [0,   [8, 10, 22],     0.6],   // deep night
    [5,   [8, 10, 22],     0.6],   // deep night
    [6,   [45, 20, 40],    0.7],   // pre-dawn purple
    [7,   [120, 60, 30],   0.5],   // dawn orange
    [8,   [140, 100, 40],  0.35],  // morning gold
    [10,  [150, 120, 50],  0.25],  // late morning
    [12,  [160, 130, 55],  0.2],   // midday (subtle)
    [15,  [150, 110, 45],  0.25],  // afternoon
    [17,  [140, 70, 30],   0.4],   // late afternoon amber
    [18,  [130, 50, 40],   0.5],   // dusk orange
    [19,  [60, 30, 60],    0.6],   // dusk purple
    [20,  [25, 15, 45],    0.6],   // evening
    [21,  [12, 10, 30],    0.6],   // night
    [24,  [8, 10, 22],     0.6],   // deep night
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
</script>

<div class="sky-gradient" style={gradientStyle}></div>

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
</style>
