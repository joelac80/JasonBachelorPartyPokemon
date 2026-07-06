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

## ✅ Done (setup night, Jul 5)

- **GitHub Pages live**: https://joelac80.github.io/JasonBachelorPartyPokemon/ — share this link.
- **Firebase set up** (`jason-bach-party`): Firestore + Anonymous auth + rules published;
  the config is **baked into the app**, so guests only type the room code.
- **First on-device sync session**: green ball confirmed; fixed reconnect-on-reload,
  mobile menu, scoreboard sticky column, card ⓘ placement from real-phone testing.

## 📋 Still to do before the party (owner: you)

**Testing**
1. **Re-run the two-device test** (post-fixes): both devices sign in as different
   trainers → both appear in Battle Arena "Trainers here now" → send a challenge →
   accept → third device gets the Watch alert → spectate resolves. Also confirm a
   drink logged on one phone appears on the other, and a photo shares to the room.
2. Sanity-check **phone notifications** (allow permission; works best after
   Add to Home Screen).

**Content**
3. **Drop in Bob's real Jeopardy clues** — Jeopardy board → ✎ edit each clue.
4. **Tune badge powers / earn conditions** — Badges → ✎ on any badge (now editable).
5. **Fill real details in Settings** — party info, Victory Road events/rules/points.
6. **Clear test data right before the trip** — Settings → Reset to defaults on the
   host phone **while connected** (the reset syncs to the room). Note: shared photos
   live in their own Firestore channel and will merge back — delete the room's
   `photos` subcollection in the Firebase console if you want those gone too.

**On arrival — tell the crew**
7. Everyone opens the link → Settings → **room code + "You are" (their trainer)** →
   Connect. Green Poké Ball = live. This drives attribution, Scorekeeper, challenges,
   and message authorship.
8. **Jason signs in as himself** — keeps the 💌 Message Wall sealed on his phone
   until the closing credits unlock it.
9. Everyone **Add to Home Screen** for the best notifications.
10. During the weekend: draft teams (Victory Road → Setup), log everything, leave
    Messages for Jason, snap photo moments.
11. At the end: **Ceremony → 🎬 Roll the Closing Credits** → Bulbasaur send-off →
    Poster → Jason's "NEW AREA UNLOCKED" Message Wall reveal.

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
