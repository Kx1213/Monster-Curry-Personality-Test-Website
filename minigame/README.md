# Collect Falling Ingredients — Prototype

> Small touch-first HTML5 canvas minigame prototype. Players drag a bowl to collect falling ingredients. Built to be asset-swappable and responsive for handheld devices.

## Files

- `index.html` — host page and UI screens (intro, ingredient targets, result).
- `styles.css` — layout, HUD and responsive styles.
- `game.js` — game logic: canvas, input, spawn, collisions, timer.
- `assets/` — placeholder SVGs for `player.svg`, `ingredient1.svg`, `ingredient2.svg`, `ingredient3.svg`.

## Run (quick)

Open `index.html` in a browser. For best results serve over HTTP (mobile browser file restrictions):

```bash
# from repository root, using Python
python -m http.server 8000
# then open http://localhost:8000/minigame/
```

Or use any static file server / Live Server extension.

## Controls

- Primary: drag or slide horizontally on the canvas (touch/pointer) — the bowl follows your finger.
- Desktop: `ArrowLeft` / `ArrowRight` keys for quick testing.
- Tap `Start` → `Targets` → `Play` to begin a round.

## Config & Swapping Assets

- Asset paths are defined in `game.js` under the `ASSETS` map. Replace the SVG/PNG files in `assets/` and keep file names consistent, or update the `ASSETS` map with new paths.
- Adjustable parameters in `game.js`: `GAME_TIME` (seconds), spawn timing (`spawnInterval` initial value), per-ingredient speeds and sizes inside `spawnIngredient()`.

## Mobile & Touch Considerations

- The prototype uses pointer + touch events and applies device pixel ratio scaling for crisper graphics on high-DPI screens.
- The HUD is hidden until gameplay starts to maximize touch area; UI screens are large and easy to tap.
- The page pauses gameplay on visibility change to avoid lost time while switching apps.

## Testing & Tuning

- Use Chrome/Edge mobile emulation and a real device when possible.
- Tweak `spawnInterval`, `GAME_TIME`, and ingredient speed ranges in `game.js` for difficulty balance.

## Next steps (suggested)

- Add audio feedback for collect/miss and subtle haptics via the Vibration API.
- Add persistent high scores or shareable results.
- Replace placeholder art with Monster Curry assets and tune sizes accordingly.

---

If you want, I can now run a quick tuning pass (adjust spawn rates, score per item) and add a short test harness. Would you like me to tune gameplay or prepare the README for distribution (zip/packaging)?