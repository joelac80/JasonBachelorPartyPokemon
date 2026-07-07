# 🎉 Bachelor Party HQ — Jason's Bachelor Party

A **local-first Pokémon-themed PWA** for the big weekend (Bristol, IN · Jul 9–12,
2026). Vanilla JS, no build step, no accounts. Runs 100% in the browser — with an
optional Firebase live-sync layer so every phone shares ONE scoreboard.

**Live app:** https://joelac80.github.io/JasonBachelorPartyPokemon/

## Quick start (the crew)

1. Open the link on your phone → the **welcome tour** walks you through
   everything: pick your trainer, type the room code, done.
2. **Add to Home Screen** (Share → Add to Home Screen on iPhone) for the
   installable app + reliable notifications.
3. Green Poké Ball in the top bar = live-synced to the room.

## What's inside

**🗺 The overworld map** — six towns, each with a theme:

- **🔴 Safari Zone** — the catching game (dares → boosts → throw), ✨ 1-in-16
  shinies, 🍓 Sitrus Berry drops, nicknames, roaming legendaries; the
  **Pokédex Tracker** (teams, dex progress, ⚡ Type Masters) and the
  **Trading Post** (1-for-1 swaps; Kadabra/Machoke/Graveler/Haunter evolve
  ONLY by trade).
- **⚔️ Battle Frontier** — the battling heart:
  - **Battle Arena** — real turn-based Lv50 duels, singles or doubles, each
    trainer on their OWN phone. KO = 2 sips, loss toasts 4; 🧪 Potion = 3 sips
    to heal; 🍺 Liquid Courage = finish half your drink for a same-turn
    can't-miss crit. Battle EXP: 3 KOs by a mon = evolution. Elo ratings +
    the 🥇 Champion's Belt.
  - **Brackets** — tournaments that launch real duels.
  - **🏟 Gym Circuit** — the 16 canon Gen 2 leaders (Johto runs HGSS rematch
    squads). Even matches, hidden lineups, everyone can earn every badge.
  - **👑 Pokémon League** — Victory Road gate (8 Johto badges) → Elite Four
    (HGSS rematch teams, in order) → Champion LANCE → the Hall of Fame (with
    ⚔ Battles of Fame vs enshrined teams) → and RED waits on Mt. Silver for
    anyone holding all 16 badges.
  - When the room is live, gym/League runs **broadcast** — everyone can
    👀 watch move-by-move and cheer with floating emoji.
- **🎰 Game Corner** — Jeopardy (Bulbasaur trivia), the Oracle (predictions),
  the Card Table (President, Euchre, King's Cup…), Catch of the Day dares.
- **🍺 Lakeside Tavern** — the drink tracker (First Sip, Thirstiest, per-drink champs).
- **🏅 Honors Hall** — weekend badges (hand-awarded, with powers), awards
  voting, the Hall of Bulbasaur gallery, and the 💌 sealed Message Wall.
- **👑 The Summit** — the Ceremony (crowning + closing credits), Weekend Log,
  Trip Stats (Wrapped, exports), and the keepsake Poster.

Everything feeds one **Victory Road** team scoreboard, and the **Ceremony**
crowns the champion on the last night.

Tap **?** in the top bar for the Field Guide — the full in-app manual. The
welcome tour can be replayed from there too.

## Running it locally (development)

Any static server works:

```bash
python3 -m http.server 8000      # then open http://localhost:8000
# or:  npx serve .
# or:  double-click start.command (Mac) / start.bat (Windows)
```

Deploys are just pushes to `main` — GitHub Pages serves the repo root.

## Live sync

Optional. The Firebase project (`jason-bach-party`) config is baked in — guests
only enter the shared **room code** (in the welcome tour or Settings). Without
it, each phone is its own save file (Settings → Export/Import moves data).
Details in `SYNC.md`; owner checklist in `ROADMAP.md`.

## Editing content

- `data/seed.js` — party info, attendees, teams, events, badges, itinerary
- Jeopardy clues, badge powers, and Victory Road events are editable in-app (✎)
