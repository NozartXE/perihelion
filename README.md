# perihelion

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/NozartXE/perihelion/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/NozartXE/perihelion/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**PERIHELION** — Bend gravity. Sling the lost probe home.

Drag back like a slingshot and release. Bend your trajectory around planets, reach the portal, and collect stars along the way. Clear 8 systems with a limited number of launches in each.

Controls: mouse drag to aim and launch, Enter to continue, R to restart, P to pause, and M to mute.

The game is built from plain static files under `game/`. The Node program `main.ts` copies `game/` and `screenshots/` and writes the dossier. Physics uses deterministic fixed steps, and the project has no dependencies.

## Run it

```sh
node serve.ts
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`serve.ts` opens the game at http://localhost:8080.

---
<sub>Entered on [make.fun](https://make.fun/?ref=hr2ehgtj&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
