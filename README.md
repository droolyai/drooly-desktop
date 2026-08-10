# Drooly Desktop — Maple City (DDD) + WetDrool 18+

Native desktop apps for the Drooly games. Secure Electron shells over the
live web games — **same cloud moshpit as web and Solana Seeker**, so desktop
players share rooms with every device (cross-device multiplayer out of the box).

One running app covers **both** games: an animated dusk-palette boot screen
(film grain, progress sweep, rotating tips) plays on cold start and on switch,
and a native **Games** menu jumps between Maple City and WetDrool without a
second install.

| App | Game | Rating |
| --- | ---- | ------ |
| **Maple City** | https://drooly.ai/games/ddd | SFW |
| **WetDrool** | https://drooly.ai/games/wetdrool | **18+** (age gate in-game) |

## Download

Grab the latest from [Releases](https://github.com/droolyai/drooly-desktop/releases):

- **macOS** — `.dmg` (Apple Silicon + Intel)
- **Windows** — `.exe` installer or portable
- **Linux** — `.AppImage`

macOS builds are unsigned for now: right-click → Open on first launch.

### Homebrew (macOS)

```bash
brew install --cask droolyai/tap/maple-city
brew install --cask droolyai/tap/wetdrool
```

## Build from source

```bash
npm install
npm run build:ddd        # Maple City
npm run build:wetdrool   # WetDrool 18+
# artifacts in dist/<game>/
```

Dev run: `npm start` (Maple City) · `npm run start:wetdrool`

## Architecture

- Web is canonical (`DIST-WEB-FIRST-001`) — these shells load the live site, so
  every update ships instantly to desktop with zero re-release.
- One cloud moshpit (Cloudflare Durable Objects) for all devices; the shell
  injects `platform: "desktop"` for cross-play roster badges.
- Hardened window: context isolation, sandbox, HTTPS-only host allowlist,
  external links open in your OS browser, renderer crashes logged to
  `crash.log` in the app-data folder with a Reload prompt.

## Token honesty

DDD is the in-game economy. A DDD Token-2022 mint exists on Solana mainnet
with **zero supply and no pool** — nothing is tradeable and nothing is being
sold. Any change to that will be published in-app and on drooly.ai only.

Original IP (Maple City, D-Roc, Ari Pink). Not affiliated with Rockstar.

## Support the studio

Drooly ships free, open, web-first software from a one-person studio. If you want it to
keep existing, you can tip at **[drooly.ai/support](https://drooly.ai/support)** — card or
BTC/ETH/SOL. A tip grants nothing: no perks, no credits, no priority. That is the whole deal.
