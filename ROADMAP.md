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
- **Pokédex Safari** — silhouette encounters, dares/berries/rallies (with chicken-out spook), helper double-battles, Master Ball dare, ball tiers, per-catch ball record, ✨ **shinies (1/16, real sprites)**, 🍓 **Sitrus Berry drops**, **nicknames**, 🌩 **roaming legendaries** (room-wide race).
- **Pokémon Duels** — real turn-based Lv50 battles: singles & doubles, **each trainer on their own phone** (partners too), perspective-correct back sprites, exact type chart (immunities, ×4), switching, 🧪 Potion = 3 sips, 🍺 Liquid Courage = same-turn Z-move crit, KO = 2 sips / loss = 4, **battle-EXP evolution** (3 KOs by the mon itself; trade-evo species excluded), veteran KO bonus, Sitrus auto-heal, instant rematch, 📈 **Elo**, 🥇 **Champion's Belt**.
- **🏟 Gym Circuit** — the 16 canon Gen 2 leaders (Johto at **HGSS rematch strength**), even matches, hidden lineups, multi-holder badges, AI-controlled.
- **👑 Pokémon League** — its own cinematic page: Victory Road gate (8 Johto badges) → Elite Four (**HGSS rematch teams**, in order, rank-boosted) → Champion LANCE → **Hall of Fame** (champions enshrined WITH their team; ⚔ **Battle of Fame** vs any enshrined squad) → hidden **RED** on Mt. Silver (needs Lance + all 16 badges).
- **Trading Post** — 1-for-1 swaps (partners untradeable), **trade evolutions** (Kadabra/Machoke/Graveler/Haunter ONLY evolve by trade), remote trade **offers with consent**, shiny flags travel.
- **Brackets** (launch real duels), **Jeopardy** (Daily Bulbas), **Predictions/Oracle**.
- **Card Table** — President/Asshole, Euchre, King's Cup, Ride the Bus (+ "same table" memory).
- **Drink Tracker** — by trainer/type/day, named drinks, "what we drank".

**Competition & keepsakes**
- One **Victory Road** scoreboard: Safari, Duels, Gyms, League, Jeopardy, Oracle, and Cards all auto-feed team points → the **Ceremony** crowns it.
- **Live Trophies** everywhere: 🧢 Ash Ketchum, 🟣 Master Catcher, 🤝 Best Helper, ⚔️ Battle Champ, ✨ Shiny Hunter, 🏟 Gym Crusher/CHAMPION, 👑 League Contender / 🗻 Conquered Mt. Silver, 🥇 Champion's Belt, 🔮 Oracle, 👑/💩 Best & Worst President, ♠️ Euchre Champ, 🍾 First Sip, 🍺 Thirstiest + per-drink champs.
- **Weekend Chronicle** → **Poster Board** (crew grid, awards wall, "what we drank", photo + move-by-move timeline; print/PDF).
- **Photo log** — capture, downscale, caption, react ❤️😂🔥👏🥳 + comment.
- 💌 **Message Wall** — notes for the groom, sealed on his phone until the Ceremony's closing credits.
- **Field Guide** (`?` in top bar) documenting everything + **first-open onboarding tour** (six slides; picks trainer + room code; replayable from the guide).

**Live multiplayer (optional, Firestore)**
- Local-first; sync only when a room is joined. Green Poké Ball indicator. PWA (manifest + service worker), phone **notifications**.
- Presence ("who's here now"), phone-to-phone **challenges** (duels & trades), spectating with **emoji cheers that float on the players' screens**, LIVE home banner, synced photos (separate channel).
- **Gym/League runs broadcast live** — stakes in the alert ("🏅 Fog Badge on the line"), move-by-move watching, and a room-wide "🏁 …wins!" ping at the end.

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
7. Everyone opens the link → the **welcome tour** does the rest (pick your
   trainer + type the room code, right in the tour). Green Poké Ball = live.
   This drives attribution, Scorekeeper, challenges, and message authorship.
   (Anyone who skipped it: Settings, or ? → "Replay the welcome tour".)
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
- **Poster → image export** so it's one-tap shareable (beyond print-to-PDF).
