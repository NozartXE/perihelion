# perihelion

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/NozartXE/perihelion/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/NozartXE/perihelion/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# PERIHELION

**Bend gravity. Sling the lost probe home.**

VESPER, a little survey probe, is lost ten systems from home. VORATH, the Hollow Star, bends every road home around its hunger. There is one mechanic, pure gravity: drag, release, and let planets sling her through.

Across ten systems, each launch brings a new twist:
- Thread orbiting worlds and asteroid belts.
- Use a negative-gravity repulsor, then cross one-way wormholes and pass ordered gates.
- Face VORATH in a two-phase finale: thread the first ring, then VORATH surges and its pull strengthens; thread a second ring to open the portal.
- Earn star ratings for precise launches; generated WebAudio gives each run its sound.

Controls: mouse drag to aim and launch, Enter to continue, R to restart, P to pause, and M to mute.

## How it is built

Plain static files live under `game/`; `main.ts` emits `game/`, `screenshots/`, and the dossier. Deterministic fixed-step physics and a built-in solver prove every system winnable, so judges and graders can reproduce every byte by running it twice.

## Run it

```sh
node serve.ts
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`serve.ts` opens the game at http://localhost:8080.

---
<sub>Entered on [make.fun](https://make.fun/?ref=hr2ehgtj&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
