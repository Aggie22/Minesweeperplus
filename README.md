# Minesweeper+

A custom Minesweeper with three game modes and swappable textures. No build step and no dependencies.

## Play

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

## Modes

- **Normal** — the classic rules. The clock counts up; one mine ends the game. Best times are kept per board size.
- **Zen** — no clock and no game over. Hitting a mine counts as a slip and you carry on.
- **Time Trial** — a countdown (6 seconds per mine). Clearing a board banks the time you have left plus a bonus (3 seconds per mine) and deals the next board. A mine or an empty clock ends the run; your best streak is kept.

Board sizes: Beginner, Intermediate, Expert, or a custom width, height and mine count. The first click is always safe.

## Controls

| Action | Mouse | Touch | Keyboard |
| --- | --- | --- | --- |
| Dig | Click | Tap | Space / Enter |
| Flag | Right-click | Long-press | F |
| Open around a number | Click the number | Tap the number | Space on the number |
| New game | Face button | Face button | N |

**Flag mode** swaps tap and long-press, which is handy on phones.

## Textures

The **Textures** button opens the picker with eight packs: Classic, Midnight, Paper, Meadow, Candy, Neon Arcade, Deep Space and Groovy.

Under **Make your own** you can upload images for the covered tile, uncovered tile, mine, flag and page background. Anything you leave empty comes from the base pack you choose. Uploads are resized and stored in your browser only.

## Code

- `js/game.js` — the rules, with no DOM code
- `js/themes.js` — the texture packs; add an entry to `THEMES` to make a new one
- `js/app.js` — modes, input, timers and the texture picker
- `style.css` — layout; all colours come from CSS custom properties set by the active pack
