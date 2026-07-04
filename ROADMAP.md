# Bachelor Party HQ — Status, To-Do & Next-Level Ideas

_A local-first, offline Pokémon-themed companion app for Jason's bachelor party
(Bristol, IN · Jul 9–12, 2026). No build step, no framework — vanilla JS + one
optional Firebase layer for live multiplayer._

---

## ✅ What's built (the sweep)

**Core**
- Overworld map hub, countdown, hash router, 16 map destinations.
- Squad roster with evolving favorites (grow/evolve/mega + reveal animation) and TCG cards.
- Trainer **Profiles** (tap ⓘ / leaderboard names) aggregating everyone's stats.
- Retro SFX + offline chiptune music; energy-symbol & gym-badge iconography.

**Games**
- **Pokédex Safari** — silhouette encounters, dares/berries/rallies (with chicken-out spook), helper double-battles, Master Ball dare, ball tiers, per-catch ball record.
- **Battle Arena** — 1v1/2v2, type effectiveness, VS intro, back sprites, logging.
- **Brackets**, **Jeopardy** (Daily Bulbas), **Predictions/Oracle**.
- **Card Table** — President/Asshole, Euchre, King's Cup, Ride the Bus (+ "same table" memory).
- **Drink Tracker** — by trainer/type/day, named drinks, "what we drank".

**Competition & keepsakes**
- One **Victory Road** scoreboard: Safari, Battle, Jeopardy, Oracle, and Cards all auto-feed team points → the **Ceremony** crowns it.
- **Live Trophies** everywhere: 🧢 Ash Ketchum, 🟣 Master Catcher, 🤝 Best Helper, ⚔️ Battle Champ, 🔮 Oracle, 👑/💩 Best & Worst President, ♠️ Euchre Champ, 🍾 First Sip, 🍺 Thirstiest + per-drink champs.
- **Weekend Chronicle** → **Poster Board** (crew grid, awards wall, "what we drank", photo + move-by-move timeline; print/PDF).
- **Photo log** — capture, downscale, caption, react ❤️😂🔥👏🥳 + comment.
- **Field Guide** (`?` in top bar) documenting everything.

**Live multiplayer (optional, Firestore)**
- Local-first; sync only when a room is joined. Green Poké Ball indicator.
- Presence ("who's here now"), phone-to-phone **challenges**, **spectator** battles, LIVE home banner, phone **notifications**, synced photos (separate channel).

---

## 📋 To-do before the party (owner: you)

1. **Enable GitHub Pages** for a permanent public URL — Settings → Pages → Deploy from branch → `main` → `/root`.
2. **Set up Firebase** for Live Sync (optional but great) — follow `SYNC.md`: create project, enable Firestore + Anonymous auth, **paste the security rules**, then in-app Settings → Live Sync paste the config + a shared room code.
   - ⚠️ **Re-paste the Firestore rules** if you pasted an earlier version — the rules were fixed to cover the sub-channels (presence/challenges/live/photos). Old rules block those.
3. **Two-phone test** of live sync — the sandbox blocks Google's SDK CDN, so the cross-device path (presence → challenge → accept → spectate → notification → photo share) is only mock-validated. Confirm on real phones; send the Live-Sync status line if anything misbehaves.
4. **Drop in Bob's real Jeopardy clues** — Jeopardy board → ✎ edit each clue.
5. **Fill real details in Settings** — party info, teams, and Victory Road events/rules/points as they firm up.
6. Have everyone **Add to Home Screen** for the best notification behavior.

---

## ⚠️ Known limitations (by design, not bugs)

- **Local by default:** without Live Sync, each phone is its own save file. Use one host device, or Settings → Export/Import to move data.
- **Last-write-wins** on sync: two people editing the *same* thing at the same instant can clobber. Fine at party scale.
- **Photos** are downscaled (~512px JPEG) and shared on their own channel to stay under Firestore's 1 MiB doc limit.

---

## 🚀 Next-level ideas (to take it further)

**Sentimental / connective**
- **Message Wall for Jason** — everyone leaves a note/advice/roast, sealed until the Ceremony and printed on the poster. _(The centerpiece.)_
- **Quote / "Overheard" board** — log the weekend's best lines with who said them; huge for the poster.

**More play, more interests**
- **Bachelor Bingo** — shared dare/goal card; first to bingo wins a badge.
- **Group polls / "This or That"** — quick votes to make real decisions (which bar, next activity).
- **Signature Drink award** — most-logged specific drink becomes "the official drink of the trip."

**Coordination (uses the sync layer)**
- **Live status + "Rally the crew" ping** — set "at the bar / on the boat", broadcast "everyone to the dock in 10!" → notification to all.

**Polish the keepsake**
- **Photo Wall / slideshow** on the poster (grid of all pics; auto-advancing recap).
- **Caption contest** — submit + vote on captions for a photo.
- **Ceremony finale upgrade** — pull every trophy + a highlight reel + the message wall into one grand closing screen.

**Platform**
- **PWA install** — manifest + service worker for a true installable, offline-cached app and more reliable notifications.
- **Poster → image export** so it's one-tap shareable (beyond print-to-PDF).
