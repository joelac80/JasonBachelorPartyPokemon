/* safari.js — the Pokédex Safari (per-trainer catching competition).
   Encounter odds are near-flat (legendaries show up!), but catch rates are
   drastically tiered: Common 55% → Legendary 4% base, and legendaries take
   boosts at half strength — so landing one is a genuine celebration. Everyone
   builds their OWN dex of every Pokémon... with one exception: a 🌩 ROAMING
   legendary is one-of-one for the room — first trainer to land the catch
   claims it (Sync.claimRoam) and the storm passes for everyone else.
   Raise the odds the CLASSIC Safari way:
     • 🍓 Berry   +10% each (5% it takes the snack and runs; also halves
                  the per-throw flee chance)
     • 🪨 Rock    +30% each (15% it spooks and bolts)
     • Helper     +15% (a 2nd trainer joins; earns an assist + a share of the
                        points — half, or the full haul on a legendary)
     • 🟣 Master Ball — a progression currency (Champions and nuzlocke crowns
                  earn them); arm one for a guaranteed catch
     • ⚔ Or battle it to weaken it — lower HP = better odds, but a KO (or a
                  team wipe) loses the catch, and the commotion may scare it off
   Then throw. Catches go into that trainer's own Pokédex and score points for
   their team on Victory Road (rarer = more; a shiny doubles). Leaderboard +
   Ash Ketchum cap for the top catcher. State in Store.pokedex. */
(function () {
  const { el } = U;
  const DEX = window.DEX || {};
  const SP = window.DEX_SPRITES || {};
  const SPS = window.DEX_SPRITES_SHINY || {};
  // ✨ Shiny odds — bumped from the Gen-2 ~1/16 to a party-friendly ~1/8 so a
  // shiny actually shows up over a weekend (still special, ~11% fresh and
  // climbing as your normal dex fills). A shiny catch scores DOUBLE points and
  // is marked forever in the dex.
  const SHINY_RATE = 1 / 8;
  // The wild pool is real catchable species only — the National dex (1–1025).
  // Mega/Primal forms live in DEX too (ids 10000+) but are battle-only, never
  // wild catches, so they're excluded here.
  const IDS = Object.keys(DEX).map(Number).filter((id) => id <= 1025);
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }
  function now() { try { return Date.now(); } catch (_) { return 0; } }

  // 🔡 Wild Unown — once ENTEI's spell is broken (3rd Movie battle), the living
  // alphabet roams the Safari. Each glyph gets a sentinel encounter id (90000+)
  // whose sprite resolves from UNOWN_SPRITES; a catch feeds the Unown Dex
  // (s.unown), NOT the regular Pokédex, so the two stay separate.
  const UNOWN_ENC0 = 90000;
  const UGLYPHS = (window.Store && Store.UNOWN_GLYPHS) || "ABCDEFGHIJKLMNOPQRSTUVWXYZ!?".split("");
  (function () { var U = window.UNOWN_SPRITES || {}; UGLYPHS.forEach(function (g, i) { if (U[g]) SP[UNOWN_ENC0 + i] = U[g]; }); })();
  function isUnownEnc(id) { return id >= UNOWN_ENC0; }
  function unownGlyphOf(id) { return isUnownEnc(id) ? (UGLYPHS[id - UNOWN_ENC0] || "?") : null; }
  // Glyphs this trainer can still meet in the wild (seal broken + not yet decoded).
  function unownWildFor(tid) {
    if (!tid || !(window.Store && Store.unownSealBroken && Store.unownSealBroken(tid))) return [];
    const have = (Store.unownCaught && Store.unownCaught(tid)) || [];
    return UGLYPHS.filter((g) => have.indexOf(g) < 0);
  }

  const TIER_COLOR = { Common: "#8a97a8", Evolved: "#5fbf6a", Strong: "#3aa0e6", Elite: "#7a5aa0", Legendary: "#e6b800" };
  // 🍓/🪨 the classic Safari gamble, tuned for this app:
  const AIDS = {
    berry: { pct: 0.10, fleeRisk: 0.05, emoji: "🍓" },
    rock:  { pct: 0.30, fleeRisk: 0.15, emoji: "🪨" },
  };

  // Catch rates are DRASTICALLY tiered — commons are easy, legendaries are a
  // 4%-base celebration (and boosts only work at half strength on them).
  const TIER_BASE = { Common: 0.55, Evolved: 0.40, Strong: 0.25, Elite: 0.15, Legendary: 0.04 };
  function info(id) {
    if (isUnownEnc(id)) {   // 🔡 a wild Unown glyph — rare, ~mid catch rate, a big score
      const g = unownGlyphOf(id);
      return { name: "Unown " + g, x: 180, leg: false, base: 0.22, pts: 8, flee: 0.10, tier: "Unown", color: "#7a5aa0", unown: g };
    }
    const d = DEX[id] || { x: 60 }; const x = d.x, leg = !!d.leg;
    const tier = leg ? "Legendary" : x >= 200 ? "Elite" : x >= 140 ? "Strong" : x >= 90 ? "Evolved" : "Common";
    const base = TIER_BASE[tier];
    let pts = 1 + Math.round(x / 70); pts = Math.min(7, Math.max(1, pts));
    if (leg) pts = 8;                        // a legendary catch is a big score
    const flee = leg ? 0.06 : 0.12;
    return { name: d.n, x: x, leg: leg, base: base, pts: pts, flee: flee, tier: tier, color: TIER_COLOR[tier] };
  }

  // Who (if anyone) has caught this species — used only for flavor now
  // (everyone can catch their own). Returns an owner's attendee id, or "".
  function legendaryOwner(id) {
    const trs = P().trainers || {};
    for (const tid in trs) { if (trs[tid].caught && trs[tid].caught[id]) return tid; }
    return "";
  }

  // The ball reflects your odds: Poké → Great → Ultra → Master (100% = sure catch).
  const BALLS = {
    poke: { key: "poke", name: "Poké Ball", top: "#ee1515" },
    great: { key: "great", name: "Great Ball", top: "#2a75bb" },
    ultra: { key: "ultra", name: "Ultra Ball", top: "#e6a100" },
    master: { key: "master", name: "Master Ball", top: "#7a2ff2" },
    partner: { key: "partner", name: "Partner", top: "#2e8b3d" },   // came with the trainer ❤
  };
  function ballTier(chance) {
    if (chance >= 1) return BALLS.master;
    if (chance >= 0.75) return BALLS.ultra;
    if (chance >= 0.55) return BALLS.great;
    return BALLS.poke;
  }
  function ballByKey(k) { return BALLS[k] || BALLS.poke; }
  function ballIcon(tier) { return el("span", { class: "ball-ico " + tier.key, style: { "--ball-top": tier.top } }); }

  // Near-flat encounter odds — cool Pokémon show up almost as often as commons;
  // the drama lives in the catch rate, not the sighting. Legendaries stay rare
  // but are NOT one-of-one anymore: everyone can catch their own.
  function weightFor(id) {
    const d = DEX[id]; let w = 1 / Math.pow(d.x, 0.30);
    if (d.leg) w *= 0.7;
    return w;
  }
  function P() { return Store.state.pokedex; }
  function rec(id) { return (P().trainers && P().trainers[id]) || { caught: {}, team: [], catches: 0 }; }

  // Per-variant ownership. Normal and shiny are SEPARATE dex entries (502
  // total). Back-compat: a legacy caught record counts as its own variant via
  // the .shiny flag; the have/haveShiny maps carry the rest (so owning both is
  // possible once you catch the second form).
  function ownsNormal(tid, id) {
    const t = rec(tid);
    if (t.have && t.have[id]) return true;
    return !!(t.caught && t.caught[id] && !t.caught[id].shiny);
  }
  function ownsShiny(tid, id) {
    const t = rec(tid);
    if (t.haveShiny && t.haveShiny[id]) return true;
    return !!(t.caught && t.caught[id] && t.caught[id].shiny);
  }
  // Gen 5-9 (#494+) only appear in the wild — and in the dex grid — once this
  // trainer has completed the Gen 1-4 normal dex (all 493 base forms).
  const GEN14_MAX = (window.Store && Store.GEN14_MAX) || 493;
  // 🧭 The Gen Ladder: each trainer's wild pool runs up to THEIR unlocked
  // generation (start Gen 1; battles in The Journey open the rest).
  function maxIdFor(tid) { return (Store.genMaxIdFor && Store.genMaxIdFor(tid)) || GEN14_MAX; }
  function poolIds(tid) {
    const cap = maxIdFor(tid);
    const pool = IDS.filter((id) => id <= cap);
    // 🏔 Hisui: once this trainer beats CYNTHIA, the temporal rift opens and
    // the ancient forms (ids 10229+, outside the National span) roam their
    // grass too — normal AND shiny, like any other species.
    if (window.HISUI_WILD && Store.hisuiUnlocked && Store.hisuiUnlocked(tid)) HISUI_WILD.forEach((id) => pool.push(id));
    return pool;
  }

  // The encounter table is 502 slots — a normal AND a shiny of every species —
  // minus the (species, variant) pairs THIS trainer already owns. So once you
  // catch a normal Totodile you stop meeting regular Totodile, but a shiny one
  // is still out there. Shinies keep their ~1/16 rarity via the weight factor.
  function randomEncounter(tid) {
    let total = 0; const cum = [];
    const pool = poolIds(tid);
    pool.forEach((id) => {
      const w = weightFor(id);
      if (!ownsNormal(tid, id)) { total += w; cum.push([total, id, false]); }
      if (!ownsShiny(tid, id)) { total += w * SHINY_RATE; cum.push([total, id, true]); }
    });
    if (!cum.length) {   // living dex complete — never stall; re-offer the full table
      let t2 = 0; const c2 = [];
      pool.forEach((id) => { t2 += weightFor(id); c2.push([t2, id]); });
      const rr = Math.random() * t2;
      for (let i = 0; i < c2.length; i++) if (rr <= c2[i][0]) return { id: c2[i][1], shiny: Math.random() < SHINY_RATE };
      return { id: pool[0], shiny: false };
    }
    const r = Math.random() * total;
    for (let i = 0; i < cum.length; i++) if (r <= cum[i][0]) return { id: cum[i][1], shiny: cum[i][2] };
    const last = cum[cum.length - 1];
    return { id: last[1], shiny: last[2] };
  }
  function caughtCount(id) { return Store.dexCount(id); }   // partner freebie excluded
  function attendeeName(id) { const a = Store.attendee(id); return a ? a.name : id; }

  // ── Catch bookkeeping (shared by the ball throw AND weaken-to-catch battles) ──
  // Everything a landed catch writes: dex variant maps, the keepsake record,
  // berry drops, points (+ helper share), the catch log and chron lines.
  // Returns the display numbers the result card needs.
  function recordCatch(tid, id, isShiny, ballUsed, viaMaster, helperId, nfo) {
    // 🍓 ~30% of catches drop a Sitrus Berry into the trainer's bag —
    // auto-eaten in duels when a mon drops below 30% HP.
    const berryDrop = Math.random() < 0.3;
    // ✨ A shiny scores DOUBLE points.
    const pts = isShiny ? nfo.pts * 2 : nfo.pts;
    const helperName = helperId ? attendeeName(helperId) : "";
    // Helper shares the reward: half the points on a normal catch, the full
    // haul when the assist lands a legendary.
    const helperPts = helperId ? (nfo.leg ? pts : Math.max(1, Math.round(pts / 2))) : 0;
    Store.update((s) => {
      const t = s.pokedex.trainers[tid] = s.pokedex.trainers[tid] || { caught: {}, team: [], catches: 0 };
      const prev = t.caught[id];
      // Record which VARIANT you now own (normal vs shiny are separate dex
      // entries). Preserve the other variant if you already had it, so the
      // 502-slot encounter table keeps offering only what you're missing.
      if (isShiny) { t.haveShiny = t.haveShiny || {}; t.haveShiny[id] = 1; }
      else { t.have = t.have || {}; t.have[id] = 1; }
      if (prev) {
        if (prev.shiny) { t.haveShiny = t.haveShiny || {}; t.haveShiny[id] = 1; }
        else { t.have = t.have || {}; t.have[id] = 1; }
      }
      // Keep the ball that first landed it (best-catch keepsake); showcase
      // the shiny if either the old or new copy is shiny (it's the prize).
      t.caught[id] = { count: (prev ? prev.count : 0) + 1, ball: (prev && prev.ball) || ballUsed,
        shiny: ((prev && prev.shiny) || isShiny) || undefined,
        nick: (prev && prev.nick) || undefined, kos: (prev && prev.kos) || undefined };
      if (berryDrop) t.berries = (t.berries || 0) + 1;
      t.catches = Object.keys(t.caught).length;
      if (viaMaster) {
        t.masterCatches = (t.masterCatches || 0) + 1;   // 🟣 Master Catcher
        t.mballUsed = (t.mballUsed || 0) + 1;           // spend the ball (only on a landed catch)
      }
      t.safariPts = (t.safariPts || 0) + pts;      // this trainer's own Safari points
      if (helperId) {                              // credit the helper's assist + share
        const h = s.pokedex.trainers[helperId] = s.pokedex.trainers[helperId] || { caught: {}, team: [], catches: 0 };
        h.helps = (h.helps || 0) + 1;
        h.assistPts = (h.assistPts || 0) + helperPts;
      }
      // Feed the championship: a catch scores its point-value for the
      // catcher's team; the helper's team banks their share too.
      Store.grantPoints(s, "safari", Store.teamOf(tid), pts);
      if (helperId) Store.grantPoints(s, "safari", Store.teamOf(helperId), helperPts);
      s.pokedex.log = s.pokedex.log || [];
      s.pokedex.log.unshift({ trainer: tid, dexId: id, name: nfo.name, ball: ballUsed, helper: helperId || undefined, master: viaMaster || undefined, shiny: isShiny || undefined, ts: now() });
      if (s.pokedex.log.length > 80) s.pokedex.log.length = 80;
      if (isShiny) Store.chron(s, "✨", "SHINY!! " + attendeeName(tid) + " caught a SHINY " + nfo.name + (nfo.leg ? " — a shiny LEGENDARY!!" : " — double points!"));
      else if (nfo.leg) Store.chron(s, "🌟", "LEGENDARY! " + attendeeName(tid) + " caught " + nfo.name + "!" + (viaMaster ? " (Master Ball!)" : ""));
      else Store.chron(s, "🔴", attendeeName(tid) + " caught " + nfo.name + "!" + (viaMaster ? " (Master Ball!)" : "") + (helperName ? " (assist: " + helperName + ")" : ""));
      if (Store._milestone(s.pokedex.log.length)) Store.chron(s, "🎉", "🔴 " + s.pokedex.log.length + " Pokémon caught this weekend!");
    });
    return { pts: pts, helperPts: helperPts, helperName: helperName, berryDrop: berryDrop };
  }

  // 🔡 A wild Unown catch feeds the Unown Dex (append-only), NOT the Pokédex,
  // and still scores its points. Returns the trainer's decoded-glyph total.
  function recordUnownCatch(tid, glyph, nfo) {
    if (window.Store && Store.decodeUnown) Store.decodeUnown(tid, glyph);
    Store.update((s) => {
      const t = s.pokedex.trainers[tid] = s.pokedex.trainers[tid] || { caught: {}, team: [], catches: 0 };
      t.safariPts = (t.safariPts || 0) + nfo.pts;
      Store.grantPoints(s, "safari", Store.teamOf(tid), nfo.pts);
    });
    return ((Store.unownCaught && Store.unownCaught(tid)) || []).length;
  }

  // ── Per-phone Safari session — deliberately NOT synced ──────────────────
  // The catcher this DEVICE is playing as, plus the in-progress wild encounter
  // and its boosts. Kept at module scope (not inside view()) so that a remote
  // sync re-render — triggered when anyone else logs a drink, catches, etc. —
  // RESTORES the same encounter instead of wiping it, and so every phone
  // catches independently. The old design synced the catcher in shared state,
  // which made three phones fight over one encounter (Suicune kept resetting).
  let myCatcher = "";
  let current = null, busy = false, status = "", level = 0, helper = "", shiny = false, revealId = null, currentGlyph = null;
  let roamHunt = "";                                    // roam event id when this encounter IS the roamer
  let berries = 0, rocks = 0, masterArmed = false;     // this encounter's throws
  let throwMsg = "";                                    // last berry/rock feedback
  let dexMode = "normal";                               // dex grid: normal | shiny

  function view(root) {
    // While you're on the Safari, a remote sync (someone else walking/catching)
    // must NOT re-render and yank your screen. Your own taps keep it fresh, and
    // the one-of-one guard keeps the roaming race correct. Router clears this on
    // navigation away.
    window.__deferRender = function () { return true; };

    // Wipe all this-encounter boost state (called on new find / trainer swap / run).
    function clearBoosts() {
      level = 0; berries = 0; rocks = 0; masterArmed = false; helper = ""; throwMsg = ""; roamHunt = "";
    }

    // 🏁 The roaming mon is ONE-OF-ONE: gone means another trainer claimed it
    // (or it wandered off) while you were still lining up your throw.
    function roamGone() {
      if (!roamHunt) return false;
      const r = window.Sync && Sync.roam && Sync.roam();
      return !(r && r.id === roamHunt);
    }
    // Winning the race is worth more than the mon: the claim closes the storm
    // for the room, and the win is banked toward the 🌩 Storm Chaser
    // achievement (and its leaderboard chip).
    function claimStorm(tid) {
      if (window.Sync && Sync.claimRoam) Sync.claimRoam(attendeeName(tid));
      Store.update((s) => {
        const t = s.pokedex.trainers[tid] = s.pokedex.trainers[tid] || { caught: {}, team: [], catches: 0 };
        t.roamWins = (t.roamWins || 0) + 1;
        Store.chron(s, "🌩", attendeeName(tid) + " WON the storm race — the roaming legendary is theirs alone!");
      });
    }
    function showRoamGone(nfo) {
      const id = current;
      sfx("error");
      enc.innerHTML = "";
      enc.appendChild(el("div", { class: "safari-card result miss" }, [
        SP[id] ? el("img", { class: "safari-wild fled", src: SP[id], alt: nfo ? nfo.name : "" }) : null,
        el("div", { class: "safari-result-msg" }, "Too late — " + (nfo ? nfo.name : "it") + " is GONE!"),
        el("div", { class: "safari-payout miss" }, "🌩 The storm passes — another trainer claimed it, or it wandered off."),
        el("div", { class: "safari-actions" }, [el("button", { class: "btn spin-btn", onClick: findOne }, "🔍 Find another")]),
      ]));
      current = null; busy = false; status = ""; shiny = false; currentGlyph = null; clearBoosts();
    }

    // Effective catch chance = base + all active boosts (capped at 100%).
    // Legendaries resist: boosts work at HALF strength on them, so even fully
    // stacked they're ~65% — only the Master Ball dare guarantees one.
    function chanceFor(nfo) {
      if (masterArmed) return 1;
      const boosts = AIDS.berry.pct * berries + AIDS.rock.pct * rocks + (helper ? 0.15 : 0);
      return Math.min(1, nfo.base + boosts * (nfo.leg ? 0.5 : 1));
    }

    // 🍓/🪨 The push-your-luck throws: berries are gentle (+10%, 5% it grabs
    // the snack and runs), rocks are greedy (+30%, 15% it spooks and bolts).
    // Stack as many as your nerve allows — EVERY throw rolls its own flee.
    function throwAid(kind) {
      if (!current || busy) return;
      const a = AIDS[kind], rock = kind === "rock";
      const nfo0 = info(current);
      if (Math.random() < a.fleeRisk) {
        wildEscaped(current, nfo0,
          rock ? nfo0.name + " spooked at the rock and bolted!" : nfo0.name + " grabbed the berry and ran off!",
          rock ? "🪨 Too aggressive — it's gone!" : "🍓 It took the snack and split!");
        return;
      }
      if (rock) rocks++; else berries++;
      throwMsg = rock ? "🪨 The rock rattled it — it's dazed! (+30% catch)" : "🍓 It's munching happily… (+10% catch)";
      sfx(rock ? "blip" : "coin");
      renderEncounter();
    }
    // 🟣 Arm (or disarm) a Master Ball — spent only when the catch lands.
    function toggleMaster() {
      if (masterArmed) { masterArmed = false; renderEncounter(); return; }
      if (!(window.Store && Store.mballLeft && Store.mballLeft(active()) > 0)) return;
      masterArmed = true; throwMsg = ""; sfx("fanfare"); renderEncounter();
    }

    // Wild one leaves for good (a flee, or a spook from hesitating).
    function wildEscaped(id, nfo, headline, sub) {
      sfx("error");
      enc.innerHTML = "";
      enc.appendChild(el("div", { class: "safari-card result miss" }, [
        el("img", { class: "safari-wild fled", src: SP[id], alt: nfo.name }),
        el("div", { class: "safari-result-msg" }, headline),
        el("div", { class: "safari-payout miss" }, sub),
        el("div", { class: "safari-actions" }, [el("button", { class: "btn spin-btn", onClick: findOne }, "🔍 Find another")]),
      ]));
      current = null; busy = false; status = ""; shiny = false; clearBoosts();
      renderStats(); renderBoard(); renderTeam(); renderDex();
    }

    // The "Gotcha!" result card — shared by the classic ball throw and the
    // weaken-to-catch battle path (which adds its own `how` line).
    function showCaughtCard(tid, id, isShiny, ballUsed, viaMaster, nfo, res, how) {
      const catcherTeam = Store.team(Store.teamOf(tid));
      sfx(isShiny ? "fanfare" : "win");
      enc.innerHTML = "";
      enc.appendChild(el("div", { class: "safari-card result win" + (isShiny ? " shiny" : "") }, [
        el("img", { class: "safari-wild pop", src: (isShiny && SPS[id]) || SP[id], alt: nfo.name }),
        el("div", { class: "safari-result-msg" }, "Gotcha! " + attendeeName(tid) + " caught " + (isShiny ? "a ✨ SHINY " : "") + nfo.name + "!"),
        how ? el("div", { class: "safari-legend-note" }, how) : null,
        isShiny ? el("div", { class: "safari-legend-note" }, "✨ SHINY — its colors are different! Double points, marked in the dex forever.") : null,
        nfo.leg ? el("div", { class: "safari-legend-note" }, "🌟 LEGENDARY — " + nfo.name + " joins " + attendeeName(tid) + "'s team!") : null,
        el("div", { class: "safari-caught-ball" }, [ballIcon(ballByKey(ballUsed)), " Caught with a " + ballByKey(ballUsed).name + (viaMaster ? " (Master Ball!)" : "") + "!"]),
        el("div", { class: "safari-payout" }, "🏆 +" + res.pts + " pt" + (res.pts > 1 ? "s" : "") + (isShiny ? " (✨ doubled)" : "") + (catcherTeam ? " → " + catcherTeam.name + " on Victory Road!" : "!")),
        res.helperName ? el("div", { class: "safari-assist-note" }, "🤝 Assist from " + res.helperName + " — +" + res.helperPts + " pt" + (res.helperPts > 1 ? "s" : "") + " to their team" + (nfo.leg ? " (full legendary share!)" : "") + "!") : null,
        res.berryDrop ? el("div", { class: "safari-combo-note" }, "🍓 It dropped a Sitrus Berry! (auto-heals your Pokémon in duels — 🍓×" + ((rec(tid).berries) || 1) + " in the bag)") : null,
        el("div", { class: "safari-actions" }, [el("button", { class: "btn spin-btn", onClick: findOne }, "🔍 Find another")]),
      ]));
    }

    // ⚔ Weaken-to-catch — the OPTIONAL battle path. Fight the wild one with up
    // to 3 of your Pokémon; the lower its HP, the better the ball's odds
    // (throw it mid-battle with the 🔴 button). But it's a gamble: KO it and
    // the catch is LOST, and if your whole side faints it bolts. Your earned
    // boosts still count — they set the odds floor the weakening builds on.
    function battleToWeaken(nfo) {
      if (busy || !current || !window.Duel) return;
      if (roamGone()) { showRoamGone(nfo); return; }
      const tid = active();
      if (!tid) return;
      // ⚔ Sending out a fighter is a commotion — 10% the wild one bolts before
      // the battle even starts. Your berries/rocks CARRY into the battle
      // (they set the odds floor the weakening builds on), so the aggressive
      // path needed its own risk, same as the rock.
      if (Math.random() < 0.10) {
        wildEscaped(current, nfo, nfo.name + " startled at the challenge and bolted!",
          "⚔ The commotion scared it off before the battle began!");
        return;
      }
      const ctx = { tid: tid, id: current, wasShiny: shiny, glyph: currentGlyph, nfo: nfo,
        helperId: helper && helper !== tid ? helper : "", viaMaster: masterArmed,
        baseChance: chanceFor(nfo) };
      // A wild Unown battles as the real #201 with its glyph; sentinels stay Safari-only.
      const wid = ctx.glyph ? 201 : ctx.id;
      const size = Math.min(3, Duel.poolFor(tid).length);
      if (size < 1) return;
      Duel.pickParty({ attId: tid, min: 1, max: size,
        title: "⚔ vs wild " + nfo.name + " — pick up to " + size,
        hint: "Weaken it, then hit 🔴 Throw Ball mid-battle — lower HP = better odds. KO it and the catch is LOST; if your side wipes, it bolts.",
        onDone: (ids) => {
          busy = true;
          Duel.start({ mode: "local", broadcast: false,
            a: { units: [{ attId: tid, monIds: ids }] },
            b: { units: [{ npc: "Wild " + nfo.name, ai: true, monIds: [wid],
              shiny: ctx.wasShiny ? [wid] : null, glyphs: ctx.glyph ? [ctx.glyph] : null }] },
            wild: {
              // Full HP = your boosted throw odds; every chunk of damage adds
              // up to +65% (legendaries resist here too: +45%).
              chanceFn: (frac) => Math.min(1, ctx.baseChance + (1 - frac) * (nfo.leg ? 0.45 : 0.65)),
              onOutcome: (outcome) => finishWildBattle(outcome, ctx),
            } });
        } });
    }

    function finishWildBattle(outcome, ctx) {
      busy = false;
      if (current !== ctx.id) return;   // encounter already moved on
      const tid = ctx.tid, nfo = ctx.nfo;
      if (outcome === "caught") {
        if (ctx.glyph) {
          const total = recordUnownCatch(tid, ctx.glyph, nfo);
          sfx("fanfare");
          enc.innerHTML = "";
          enc.appendChild(el("div", { class: "safari-card result win" }, [
            el("img", { class: "safari-wild pop", src: SP[ctx.id], alt: nfo.name }),
            el("div", { class: "safari-result-msg" }, "Gotcha! " + attendeeName(tid) + " weakened and caught Unown " + ctx.glyph + "!"),
            el("div", { class: "safari-payout" }, "🔡 " + total + "/28 decoded · +" + nfo.pts + " pts"),
            el("div", { class: "safari-actions" }, [el("button", { class: "btn spin-btn", onClick: findOne }, "🔍 Find another")]),
          ]));
        } else {
          if (roamGone()) { showRoamGone(nfo); return; }
          const res = recordCatch(tid, ctx.id, ctx.wasShiny, "poke", ctx.viaMaster, ctx.helperId, nfo);
          const wonStorm = !!roamHunt;
          if (roamHunt) claimStorm(tid);
          showCaughtCard(tid, ctx.id, ctx.wasShiny, "poke", ctx.viaMaster, nfo, res,
            (wonStorm ? "🌩 STORM RACE WON — this one's yours alone! " : "") + "⚔ Weakened in battle, then caught!");
        }
      } else if (outcome === "ko") {
        sfx("error");
        enc.innerHTML = "";
        enc.appendChild(el("div", { class: "safari-card result miss" }, [
          el("img", { class: "safari-wild fled", src: SP[ctx.id], alt: nfo.name }),
          el("div", { class: "safari-result-msg" }, "You knocked out " + nfo.name + "…"),
          el("div", { class: "safari-payout miss" }, "💥 Too much power — a fainted Pokémon can't be caught. It's gone."),
          el("div", { class: "safari-actions" }, [el("button", { class: "btn spin-btn", onClick: findOne }, "🔍 Find another")]),
        ]));
      } else {
        sfx("error");
        enc.innerHTML = "";
        enc.appendChild(el("div", { class: "safari-card result miss" }, [
          el("img", { class: "safari-wild fled", src: SP[ctx.id], alt: nfo.name }),
          el("div", { class: "safari-result-msg" }, "Your team was wiped out!"),
          el("div", { class: "safari-payout miss" }, "😵 The wild " + nfo.name + " wandered off. Ouch."),
          el("div", { class: "safari-actions" }, [el("button", { class: "btn spin-btn", onClick: findOne }, "🔍 Find another")]),
        ]));
      }
      current = null; status = ""; shiny = false; currentGlyph = null; clearBoosts();
      renderStats(); renderBoard(); renderTeam(); renderDex();
    }

    // A helper is a second trainer teaming up (a "double-battle" catch): +15%,
    // and they earn an assist toward the Best Helper badge on a successful catch.
    function pickHelper() {
      const others = Store.state.attendees.filter((a) => a.id !== active());
      const grid = el("div", { class: "sl-vote-grid" }, others.map((a) =>
        el("button", { class: "sl-vote-pick", onClick: () => { helper = a.id; sfx("select"); ref.close(); renderEncounter(); } },
          el("span", { class: "sl-vote-name" }, a.name))));
      const body = el("div", { class: "modal-form" }, [el("div", { class: "field" }, [el("span", {}, "Who's teaming up? (+15% — earns them an assist + a share of the points)"), grid])]);
      const ref = Modal.open("🤝 Double-battle catch", body, null, {});
    }

    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🔴 Pokédex Safari"),
      el("p", { class: "page-sub" }, "Find a wild one, then raise the odds the classic way: 🍓 berries (+10%, but 5% it takes the snack and runs), 🪨 rocks (+30%, but 15% it spooks) — or arm a 🟣 Master Ball for a sure thing. Champions and nuzlocke crowns earn the Master Balls."),
    ]));

    // ---- trainer selector (per-phone, NOT synced) ----
    // Default to whoever THIS phone is signed in as. Each device catches as
    // its own trainer — switching here never touches anyone else's screen.
    const meId = (window.Sync && Sync.getMe && Sync.getMe()) || "";
    if (!myCatcher && meId && Store.attendee(meId)) myCatcher = meId;
    const sel = el("select", { class: "in" }, [el("option", { value: "" }, "— pick a trainer —")].concat(
      Store.state.attendees.map((a) => el("option", { value: a.id, selected: myCatcher === a.id ? "true" : null }, a.name))));
    sel.addEventListener("change", () => {
      myCatcher = sel.value;
      current = null; status = ""; clearBoosts();
      renderAll();
    });
    const lockedRow = U.lockedTrainerRow("Now catching:");
    if (lockedRow) { myCatcher = lockedRow.dataset.me; root.appendChild(lockedRow); }
    else root.appendChild(el("div", { class: "safari-trainer" }, [el("span", { class: "safari-trainer-lbl" }, "Now catching:"), sel]));

    const stats = el("div", { class: "safari-stats" });
    const enc = el("div", { class: "safari-enc" });
    const boardHost = el("div", {});
    const teamHost = el("div", {});
    const dexHost = el("div", {});
    root.appendChild(stats); root.appendChild(enc); root.appendChild(boardHost);
    root.appendChild(teamHost); root.appendChild(dexHost);

    function active() { return myCatcher; }

    // ---- stats ----
    function renderStats() {
      stats.innerHTML = "";
      const id = active();
      const stat = (v, l) => el("div", { class: "safari-stat" }, [el("div", { class: "safari-stat-v" }, String(v)), el("div", { class: "safari-stat-l" }, l)]);
      stats.appendChild(stat(id ? caughtCount(id) + " / " + poolIds(id).length : "—", id ? attendeeName(id) + "'s dex" : "No trainer"));
      stats.appendChild(stat("🏆 " + (id ? (rec(id).safariPts || 0) : 0), "Pts scored"));
      stats.appendChild(stat(Store.state.pokedex.log ? Store.state.pokedex.log.length : 0, "Catches logged"));
    }

    // ---- encounter (wild-battle scene with a silhouette that focuses in) ----
    function renderEncounter() {
      enc.innerHTML = "";
      if (!active()) { enc.appendChild(el("div", { class: "safari-idle" }, el("p", { class: "empty" }, "👆 Pick a trainer to start catching."))); return; }
      if (!current) {
        // 🌩 roaming legendary: a room-wide RACE — one mon, first catch claims it
        const roam = window.Sync && Sync.roam && Sync.roam();
        if (roam && DEX[roam.monId]) {
          enc.appendChild(el("div", { class: "roam-banner" }, [
            el("span", {}, "🌩 A wild " + DEX[roam.monId].n.toUpperCase() + " is ROAMING the party — first catch claims it!"),
            el("button", { class: "btn primary sm", onClick: () => {
              // Each hunter rolls their own shiny shot at the roaming legendary
              // (~1/8) — the only realistic way to land a shiny legendary.
              current = roam.monId; shiny = Math.random() < SHINY_RATE; revealId = null; status = ""; clearBoosts();
              roamHunt = roam.id;
              const tid = active();
              if (tid) Store.update((s) => {
                const t = s.pokedex.trainers[tid] = s.pokedex.trainers[tid] || { caught: {}, team: [], catches: 0 };
                t.seen = t.seen || {}; t.seen[current] = 1;
              });
              sfx("dailyBulba"); renderEncounter();
            } }, "🎯 Encounter it"),
          ]));
        }
        enc.appendChild(el("div", { class: "safari-idle walk" }, [
          el("button", { class: "btn spin-btn", onClick: findOne }, "👣 Walk in the grass"),
          el("div", { class: "safari-grass" }, ["🌿", "🌿", "🌿", "🌿", "🌿"].map((g) => el("span", {}, g))),
        ]));
        return;
      }
      const nfo = info(current);
      const chance = chanceFor(nfo);
      const ball = ballTier(chance);
      // The encounter table never re-offers a variant you own — so if this
      // species rings a bell, what you own is the OTHER form. Say so.
      const hasNorm = ownsNormal(active(), current), hasShiny = ownsShiny(active(), current);
      const firstShow = revealId !== current && !status;

      // ---- battle scene ----
      const wildSrc = (shiny && SPS[current]) || SP[current];
      const wild = wildSrc
        ? el("img", { class: "safari-wild-scene" + (firstShow ? " revealing" : ""), src: wildSrc, alt: nfo.name })
        : el("div", { class: "tc-ball-fallback" });
      const grass = el("div", { class: "safari-scene-grass" }, ["🌿", "🌿", "🌿", "🌿", "🌿"].map((g) => el("span", {}, g)));
      const sparkle = shiny ? el("div", { class: "safari-sparkles" }, ["✨", "✨", "✨"].map((s, i) =>
        el("span", { class: "s" + i }, s))) : null;
      const scene = el("div", { class: "safari-scene" + (firstShow ? " rustle" : "") }, [
        el("div", { class: "safari-scene-platform" }), wild, sparkle, el("div", { class: "safari-ball-throw", style: { "--ball-top": ball.top } }), grass,
      ]);

      // ---- controls (name/odds/etc. hidden until the silhouette focuses in) ----
      const meta = el("div", { class: "safari-wild-meta" }, [
        el("span", { class: "safari-tier", style: { background: nfo.color } }, nfo.tier),
        el("span", { class: "safari-wild-name" }, "No." + current + " " + nfo.name),
        shiny ? el("span", { class: "safari-shiny-chip" }, "✨ SHINY — double points!") : null,
        nfo.leg ? el("span", { class: "safari-oneof" }, "🌟 LEGENDARY") : null,
        (shiny && hasNorm) ? el("span", { class: "safari-owned" }, "✓ normal form in dex — this ✨ SHINY is NEW") : null,
        (!shiny && hasShiny) ? el("span", { class: "safari-owned" }, "✨ shiny form in dex — this normal one is NEW") : null,
      ]);
      // Human-readable breakdown of every active boost.
      let breakdown;
      if (masterArmed) {
        breakdown = " (🟣 Master Ball!)";
      } else {
        const parts = [];
        if (berries) parts.push(berries + " berr" + (berries > 1 ? "ies" : "y"));
        if (rocks) parts.push(rocks + " rock" + (rocks > 1 ? "s" : ""));
        if (helper) parts.push("helper");
        breakdown = parts.length ? " (base " + Math.round(nfo.base * 100) + "% + " + parts.join(" + ") + ")" : "";
      }
      const odds = el("div", { class: "safari-odds" }, [
        el("span", { class: "safari-odds-big" }, Math.round(chance * 100) + "%"),
        el("span", {}, " catch chance" + breakdown + " · worth " + nfo.pts + " pt" + (nfo.pts > 1 ? "s" : "") + (nfo.leg ? " · resists boosts (½ effect)" : "")),
        el("span", { class: "safari-ball-chip" }, [ballIcon(ball), " " + ball.name + (ball.key === "master" ? " — sure catch!" : "")]),
      ]);
      // Active-boost chips (berries / rocks / helper), stacked per throw.
      const activeChips = [];
      if (masterArmed) activeChips.push(el("span", { class: "safari-boost-chip master" }, "🟣 Master Ball armed"));
      if (berries) activeChips.push(el("span", { class: "safari-boost-chip berry" }, "🍓×" + berries + " +" + Math.round(AIDS.berry.pct * berries * 100) + "%"));
      if (rocks) activeChips.push(el("span", { class: "safari-boost-chip rally" }, "🪨×" + rocks + " +" + Math.round(AIDS.rock.pct * rocks * 100) + "%"));
      if (helper) activeChips.push(el("span", { class: "safari-boost-chip helper" }, "🤝 " + attendeeName(helper) + " +15%"));

      const mleft = (window.Store && Store.mballLeft && Store.mballLeft(active())) || 0;
      let challengeArea;
      if (masterArmed) {
        challengeArea = el("div", { class: "safari-actions safari-boosts" }, [
          el("span", { class: "hint" }, "🟣 Master Ball armed — the next throw cannot miss."),
          el("button", { class: "btn subtle sm", onClick: toggleMaster }, "Disarm (keep the ball)"),
        ]);
      } else {
        const btns = [
          el("button", { class: "btn subtle sm", onClick: () => throwAid("berry") }, "🍓 Toss a Berry (+10% · 5% flee)"),
          el("button", { class: "btn subtle sm", onClick: () => throwAid("rock") }, "🪨 Throw a Rock (+30% · 15% flee)"),
          helper
            ? el("button", { class: "btn subtle sm", onClick: () => { helper = ""; renderEncounter(); } }, "🤝 Remove helper")
            : el("button", { class: "btn subtle sm", onClick: pickHelper }, "🤝 Add a helper (+15%)"),
        ];
        if (mleft > 0) btns.push(el("button", { class: "btn subtle sm safari-master-btn", onClick: toggleMaster }, "🟣 Master Ball ×" + mleft + " — sure catch"));
        else btns.push(el("span", { class: "hint safari-mball-hint" }, "🟣 Master Balls ×0 — beat a Champion for 5, nuzlocke crowns pay 3 (ultimates 5)"));
        challengeArea = el("div", { class: "safari-actions safari-boosts" }, btns);
      }
      const suspense = el("div", { class: "safari-suspense" });
      const canBattle = window.Duel && Duel.poolFor && Duel.poolFor(active()).length > 0;
      const throwRow = el("div", { class: "safari-actions safari-throw-row" }, [
        el("button", { class: "btn primary", onClick: () => throwBall(nfo) }, [ballIcon(ball), " Throw " + ball.name]),
        canBattle ? el("button", { class: "btn subtle", onClick: () => battleToWeaken(nfo) }, "⚔ Battle to weaken (10% it bolts)") : null,
        el("button", { class: "btn subtle", onClick: () => { current = null; status = ""; clearBoosts(); renderEncounter(); } }, "Run"),
      ]);
      const post = el("div", { class: "safari-post" + (firstShow ? " hidden" : "") }, [
        meta,
        helper ? el("div", { class: "safari-teamup" }, "🤝 " + attendeeName(active()) + " & " + attendeeName(helper) + " — double-battle catch!") : null,
        odds,
        el("div", { class: "safari-challenge" }, [
          activeChips.length ? el("div", { class: "safari-challenge-row" }, [el("span", { class: "safari-challenge-lbl" }, "Boost")].concat(activeChips)) : null,
          throwMsg ? el("div", { class: "safari-penalty" }, throwMsg) : null,
          challengeArea,
        ]),
        suspense, throwRow,
      ]);
      const appeared = el("div", { class: "safari-appeared" }, status || (firstShow ? "The tall grass rustles…" : ((shiny ? "A wild ✨ SHINY " : "A wild ") + nfo.name + " appeared!")));

      enc.appendChild(el("div", { class: "safari-battlebox" }, [scene, el("div", { class: "safari-controls" }, [appeared, post])]));

      if (firstShow) {
        revealId = current;
        sfx("select");
        setTimeout(() => {
          if (revealId !== current) return;
          appeared.textContent = (shiny ? "A wild ✨ SHINY " : "A wild ") + nfo.name + " appeared!";
          post.classList.remove("hidden");
          sfx(shiny ? "dailyBulba" : "win");
        }, 1200);
      }
    }

    function findOne() {
      current = null; revealId = null; busy = false; status = ""; currentGlyph = null; clearBoosts();
      // 🌩 No buttons, no summons — once in a rare while the sky just breaks:
      // a fresh rustle in the grass can stir a ROAMING LEGENDARY the whole
      // room races for (live rooms only; one storm at a time).
      if (window.Sync && Sync.isLive && Sync.isLive() && Sync.startRoam && !(Sync.roam && Sync.roam()) && Math.random() < 1 / 40) {
        // Roamers stay within what the WALKING trainer has unlocked, so the
        // room event never hands out a legendary from a locked generation.
        const roamCap = Math.min(maxIdFor(active()), GEN14_MAX);
        const wild = IDS.filter((x) => x <= roamCap && DEX[x].leg);
        if (wild.length) {
          const pickId = wild[(Math.random() * wild.length) | 0];
          Sync.startRoam(pickId);
          Store.logEvent("🌩", "The sky darkens over the lake — a wild " + DEX[pickId].n + " is ROAMING! First catch claims it!");
        }
      }
      // Draw from the 502-slot table (un-owned normals + un-owned shinies).
      const tid = active();
      let draw = randomEncounter(tid);
      // 🔡 …but every so often the grass shimmers with an Unown instead. They
      // only roam once the spell is broken, and only glyphs you've yet to read.
      const wildU = unownWildFor(tid);
      if (wildU.length && Math.random() < 0.22) {
        const g = wildU[(Math.random() * wildU.length) | 0];
        draw = { id: UNOWN_ENC0 + UGLYPHS.indexOf(g), shiny: false };
      }
      current = draw.id; shiny = draw.shiny; currentGlyph = unownGlyphOf(current);
      // Pokédex "seen": it appeared in front of the active trainer. Only write
      // (and thus sync) if it's genuinely new — re-walking to an already-seen
      // mon shouldn't churn the room. (Unown live in their own dex — skip here.)
      const t0 = tid && ((Store.state.pokedex || {}).trainers || {})[tid];
      if (tid && !currentGlyph && !(t0 && t0.seen && t0.seen[current])) Store.update((s) => {
        const t = s.pokedex.trainers[tid] = s.pokedex.trainers[tid] || { caught: {}, team: [], catches: 0 };
        t.seen = t.seen || {}; t.seen[current] = 1;
      });
      sfx("blip"); renderEncounter();
    }

    function throwBall(nfo) {
      if (busy || !current) return;
      if (roamGone()) { showRoamGone(nfo); return; }
      busy = true;
      const chance = chanceFor(nfo);
      const ballUsed = ballTier(chance).key;              // record what we threw
      const viaMaster = masterArmed;                      // 🟣 armed for this throw
      const flee = berries ? nfo.flee / 2 : nfo.flee;     // a berry calms it — less likely to bolt
      const outcome = Math.random() < chance ? "catch" : (Math.random() < flee ? "flee" : "break");
      const wild = enc.querySelector(".safari-wild-scene");
      const ball = enc.querySelector(".safari-ball-throw");
      const suspense = enc.querySelector(".safari-suspense");
      const throwRow = enc.querySelector(".safari-throw-row");
      if (throwRow) throwRow.style.visibility = "hidden";

      // Classic wobble: the mon ALWAYS gets sucked in, the ball rocks a few
      // times, then it CLICKS (caught) or bursts back open (missed). A catch
      // always reaches 3 shakes then clicks; a miss breaks out after 1–3.
      const shakes = outcome === "catch" ? 3 : (1 + Math.floor(Math.random() * 3));
      const T_IN = 1000, T_SHAKE = 560;

      if (ball) ball.classList.add("go");                 // arc to the mon
      sfx("select");
      if (suspense) suspense.textContent = "Gotcha…?";
      setTimeout(() => { if (wild) wild.classList.add("caught-anim"); }, 430);   // sucked in

      for (let i = 0; i < shakes; i++) {
        setTimeout(() => {
          if (!ball || !document.body.contains(ball)) return;
          ball.classList.remove("wobble"); void ball.offsetWidth; ball.classList.add("wobble");
          sfx("blip");
          if (suspense) suspense.textContent = "…shake " + (i + 1) + "…";
        }, T_IN + i * T_SHAKE);
      }

      const endT = T_IN + shakes * T_SHAKE;
      setTimeout(() => {
        if (outcome === "catch") {
          if (ball) { ball.classList.remove("wobble"); ball.classList.add("click"); }
          sfx("coin");                                     // the lock-in *click*
          if (suspense) suspense.textContent = "✨ Click!";
          setTimeout(() => resolveThrow(outcome, nfo, ballUsed, viaMaster), 520);
        } else {
          if (ball) { ball.classList.remove("wobble"); ball.classList.add("open"); }
          if (wild) { wild.classList.remove("caught-anim"); wild.classList.add("burst"); }   // pops back out
          if (suspense) suspense.textContent = outcome === "break" ? "It broke free!" : "It got loose!";
          setTimeout(() => resolveThrow(outcome, nfo, ballUsed, viaMaster), 680);
        }
      }, endT);
    }

    function resolveThrow(outcome, nfo, ballUsed, viaMaster) {
      const id = current, tid = active();
      if (outcome === "break") {
        status = "So close! " + nfo.name + " broke free — throw again!";
        busy = false; renderEncounter(); return;
      }
      if (outcome === "catch") {
        // 🔡 A wild Unown → the Unown Dex (append-only), NOT the Pokédex, and it
        // still scores its points for the catcher's team.
        if (isUnownEnc(id)) {
          const g = unownGlyphOf(id);
          const total = recordUnownCatch(tid, g, nfo);
          sfx("fanfare");
          revealId = id;
          status = "🔡 Caught Unown " + g + "! (" + total + "/28 decoded)";
          busy = false; renderEncounter();
          return;
        }
        // 🏁 The roaming race is decided HERE, at the click: if someone else
        // claimed it during your wobble, the ball opens on nothing.
        if (roamGone()) { showRoamGone(nfo); return; }
        const isShiny = shiny;
        const helperId = helper && helper !== tid ? helper : "";
        const res = recordCatch(tid, id, isShiny, ballUsed, viaMaster, helperId, nfo);
        const wonStorm = !!roamHunt;
        if (roamHunt) claimStorm(tid);
        // (The old "complete the Gen 1-4 dex to unlock Gen 5-9" room gate is
        // retired — the Gen Ladder unlocks generations through BATTLES now.)
        showCaughtCard(tid, id, isShiny, ballUsed, viaMaster, nfo, res,
          wonStorm ? "🌩 STORM RACE WON — this one's yours alone!" : "");
      } else {
        sfx("error");
        enc.innerHTML = "";
        enc.appendChild(el("div", { class: "safari-card result miss" }, [
          el("img", { class: "safari-wild fled", src: SP[id], alt: nfo.name }),
          el("div", { class: "safari-result-msg" }, nfo.name + " slipped away!"),
          el("div", { class: "safari-payout miss" }, "😅 It got away — the grass goes still." ),
          el("div", { class: "safari-actions" }, [el("button", { class: "btn spin-btn", onClick: findOne }, "🔍 Find another")]),
        ]));
      }
      current = null; busy = false; status = ""; shiny = false; clearBoosts();
      renderStats(); renderBoard(); renderTeam(); renderDex();
    }

    // ---- leaderboard ----
    function renderBoard() {
      boardHost.innerHTML = "";
      const rows = Store.state.attendees
        .map((a) => ({ a, n: caughtCount(a.id) }))
        .filter((r) => r.n > 0)
        .sort((x, y) => y.n - x.n);
      boardHost.appendChild(el("h2", { class: "section-title" }, "🏆 Catch Leaderboard"));
      if (!rows.length) { boardHost.appendChild(el("p", { class: "hint" }, "No catches yet. Be the first!")); return; }
      const list = el("div", { class: "safari-board" }, rows.map((r, i) =>
        el("div", { class: "safari-board-row clickable" + (i === 0 ? " lead" : ""), title: "View profile",
          onClick: () => window.Profile && Profile.open(r.a.id) }, [
          el("span", { class: "safari-board-rank" }, i === 0 ? "🧢" : "#" + (i + 1)),
          el("span", { class: "safari-board-name" }, r.a.name),
          el("span", { class: "safari-board-n" }, r.n + " caught"),
        ])));
      boardHost.appendChild(list);
      boardHost.appendChild(el("p", { class: "hint" }, "🧢 = Ash Ketchum — most Pokémon caught wins the badge."));

      // ---- Top Helpers (Best Helper badge) ----
      const helpers = Store.state.attendees
        .map((a) => ({ a, n: helpsOf(a.id) }))
        .filter((r) => r.n > 0)
        .sort((x, y) => y.n - x.n);
      if (helpers.length) {
        boardHost.appendChild(el("h2", { class: "section-title" }, "🤝 Top Helpers"));
        boardHost.appendChild(el("div", { class: "safari-board" }, helpers.map((r, i) =>
          el("div", { class: "safari-board-row clickable" + (i === 0 ? " lead" : ""), title: "View profile",
            onClick: () => window.Profile && Profile.open(r.a.id) }, [
            el("span", { class: "safari-board-rank" }, i === 0 ? "🤝" : "#" + (i + 1)),
            el("span", { class: "safari-board-name" }, r.a.name),
            el("span", { class: "safari-board-n" }, r.n + " assist" + (r.n > 1 ? "s" : "") + (assistPtsOf(r.a.id) ? " · 🏆 " + assistPtsOf(r.a.id) + " pts" : "")),
          ]))));
        boardHost.appendChild(el("p", { class: "hint" }, "🤝 = Best Helper — most assists on catches wins the badge."));
      }

      // ---- Master Catchers (landed via the epic Master Ball dare) ----
      const masters = Store.state.attendees
        .map((a) => ({ a, n: masterCatchesOf(a.id) }))
        .filter((r) => r.n > 0)
        .sort((x, y) => y.n - x.n);
      if (masters.length) {
        boardHost.appendChild(el("h2", { class: "section-title" }, "🟣 Master Catchers"));
        boardHost.appendChild(el("div", { class: "safari-board" }, masters.map((r, i) =>
          el("div", { class: "safari-board-row master clickable" + (i === 0 ? " lead" : ""), title: "View profile",
            onClick: () => window.Profile && Profile.open(r.a.id) }, [
            el("span", { class: "safari-board-rank" }, i === 0 ? "🟣" : "#" + (i + 1)),
            el("span", { class: "safari-board-name" }, r.a.name),
            el("span", { class: "safari-board-n" }, r.n + " master catch" + (r.n > 1 ? "es" : "")),
          ]))));
        boardHost.appendChild(el("p", { class: "hint" }, "🟣 = Master Catcher — most Pokémon caught via the epic Master Ball dare."));
      }
    }
    function helpsOf(id) { return rec(id).helps || 0; }
    function assistPtsOf(id) { return rec(id).assistPts || 0; }
    function masterCatchesOf(id) { return rec(id).masterCatches || 0; }

    // ---- mon action sheet: team, nickname, battle record ----
    function openMonSheet(id) {
      const tid = active(); if (!tid) return;
      const r = (rec(tid).caught || {})[id]; if (!r) return;
      const isShiny = !!r.shiny;
      const evoT = Store.evoTargets(id);
      const tradeEvo = Store.TRADE_EVOS[id];
      const nickIn = el("input", { class: "in", placeholder: DEX[id] ? DEX[id].n : "Nickname", value: r.nick || "", maxlength: "14" });
      let ctrl;
      const body = el("div", { class: "modal-form" }, [
        el("div", { class: "evo-prompt-head" }, [
          el("img", { class: "evo-prompt-img", src: (isShiny && SPS[id]) || SP[id] || Store.sprite(id), alt: "" }),
          el("p", { class: "hint" }, (r.nick ? r.nick + " the " : "") + (DEX[id] ? DEX[id].n : "#" + id) +
            (isShiny ? " ✨" : "") + " · " + ballByKey(r.ball || "poke").name +
            " · 💥 " + (r.kos || 0) + " KO" + ((r.kos || 0) === 1 ? "" : "s") +
            (tradeEvo ? " · 🔁 evolves by trade only" : (evoT.length ? " · ⚡ " + (r.kos || 0) + "/" + Store.KO_TO_EVOLVE + " to evolve" : ""))),
        ]),
        el("div", { class: "field" }, [el("span", {}, "✎ Nickname (shows in battles)"), nickIn]),
        el("div", { class: "toolbar" }, [
          el("button", { class: "btn primary", onClick: () => {
            Store.setNick(tid, id, nickIn.value);
            if (ctrl) ctrl.close(); renderTeam(); renderDex();
          } }, "Save"),
          el("button", { class: "btn subtle", onClick: () => { toggleTeam(id); if (ctrl) ctrl.close(); } },
            inTeam(id) ? "− Remove from team" : "＋ Add to team"),
        ]),
      ]);
      ctrl = Modal.open((DEX[id] ? DEX[id].n : "#" + id), body, null, { noFooter: true });
    }

    // ---- team of 6 (active trainer) ----
    function inTeam(id) { return (rec(active()).team || []).indexOf(id) >= 0; }
    function toggleTeam(id) {
      const tid = active(); if (!tid) return;
      Store.update((s) => {
        const t = s.pokedex.trainers[tid] = s.pokedex.trainers[tid] || { caught: {}, team: [], catches: 0 };
        const i = t.team.indexOf(id);
        if (i >= 0) t.team.splice(i, 1);
        else if (t.team.length < 6) t.team.push(id);
        else alert("Team is full (6). Remove one first.");
      });
      renderTeam(); renderDex();
    }
    function renderTeam() {
      teamHost.innerHTML = "";
      if (!active()) return;
      const bag = rec(active()).berries || 0;
      teamHost.appendChild(el("h2", { class: "section-title" }, attendeeName(active()) + "'s Team of 6" + (bag ? " · 🍓×" + bag : "")));
      const team = rec(active()).team || [];
      const slots = el("div", { class: "safari-team" });
      for (let i = 0; i < 6; i++) {
        const id = team[i];
        if (!id) { slots.appendChild(el("div", { class: "safari-team-slot empty" }, "＋")); continue; }
        // Partners can live outside the 251 dex — fall back to the favorites
        // sprite pack and the attendee's favorite name.
        const rc = (rec(active()).caught || {})[id];
        const isShiny = !!(rc && rc.shiny);
        const src = (isShiny && SPS[id]) || SP[id] || Store.sprite(id);
        const nm = (rc && rc.nick) || (DEX[id] ? DEX[id].n
          : ((Store.state.attendees.find((x) => x.favoriteId === id) || {}).favorite || "Partner"));
        slots.appendChild(el("button", { class: "safari-team-slot filled" + (isShiny ? " shiny" : ""), title: "Remove", onClick: () => toggleTeam(id) },
          [src ? el("img", { src: src, alt: nm }) : el("span", {}, "◓"), el("span", {}, (isShiny ? "✨" : "") + nm)]));
      }
      teamHost.appendChild(slots);
    }

    // ---- dex grid (active trainer) — Regular ⇄ Shiny (502 total) ----
    function renderDex() {
      dexHost.innerHTML = "";
      const tid = active();
      if (!tid) return;
      const caught = rec(tid).caught || {};
      const shinyMode = dexMode === "shiny";
      const pool = poolIds(tid);
      const nNorm = pool.reduce((n, id) => n + (ownsNormal(tid, id) ? 1 : 0), 0);
      const nShiny = pool.reduce((n, id) => n + (ownsShiny(tid, id) ? 1 : 0), 0);
      dexHost.appendChild(el("h2", { class: "section-title" },
        (shinyMode ? "✨ Shiny Pokédex (" + nShiny + " / " + pool.length + ")" : "Pokédex (" + nNorm + " / " + pool.length + ")")));
      // toggle between the two halves of the full (normal + shiny) dex
      dexHost.appendChild(el("div", { class: "dex-toggle" }, [
        el("button", { class: "btn sm" + (shinyMode ? " subtle" : " primary"), onClick: () => { dexMode = "normal"; renderDex(); } }, "Regular · " + nNorm),
        el("button", { class: "btn sm" + (shinyMode ? " primary" : " subtle"), onClick: () => { dexMode = "shiny"; renderDex(); } }, "✨ Shiny · " + nShiny),
      ]));
      // 🧭 The Gen Ladder — this trainer's world so far, and what battle opens
      // the next generation. Battling (not dex completion) drives the climb.
      const cap = (Store.genCapFor && Store.genCapFor(tid)) || 1;
      const goal = Store.nextGenGoal && Store.nextGenGoal(tid);
      const hisui = !!(window.HISUI_WILD && Store.hisuiUnlocked && Store.hisuiUnlocked(tid));
      const baseCount = pool.length - (hisui ? HISUI_WILD.length : 0);
      dexHost.appendChild(el("div", { class: "dex-lock" + (goal ? "" : " open") }, [
        el("div", { class: "dex-lock-title" }, (goal ? "🧭" : "🎉") + " Gen " + cap + " of 9 unlocked" + (goal ? "" : " — the whole world!")),
        el("div", { class: "dex-lock-sub" }, (goal
          ? "#1–#" + baseCount + " roam the wild for " + attendeeName(tid) + ". To unlock Gen " + goal.gen + ": " + goal.text + "."
          : "All 1025 Pokémon roam the wild for " + attendeeName(tid) + " — every region conquered.")
          + (hisui ? " 🏔 And through the rift, " + HISUI_WILD.length + " HISUIAN forms of old roam too." : "")),
        goal ? el("div", { class: "dex-lock-bar" }, [el("div", { class: "dex-lock-fill", style: { width: Math.round(cap / 9 * 100) + "%" } })]) : null,
      ]));
      const grid = el("div", { class: "safari-dex" });
      pool.forEach((id) => {
        const got = shinyMode ? ownsShiny(tid, id) : ownsNormal(tid, id);
        const rc = caught[id];
        const ballKey = got && rc && rc.ball;
        const src = shinyMode ? SPS[id] : SP[id];
        grid.appendChild(el("div", { class: "safari-dex-cell" + (got ? " got" : "") + (inTeam(id) ? " team" : "") + (shinyMode ? " shiny" : ""),
          title: got ? DEX[id].n + (shinyMode ? " ✨ SHINY" : "") + " — tap for team & nickname" : "#" + id + " — " + (shinyMode ? "no shiny yet" : "not caught"),
          onClick: got ? () => openMonSheet(id) : null }, [
          src ? el("img", { src: src, alt: got ? DEX[id].n : "", loading: "lazy" }) : null,
          el("span", { class: "safari-dex-num" }, "#" + id),
          shinyMode && got ? el("span", { class: "safari-dex-shiny" }, "✨") : null,
          (got && ballKey && !shinyMode) ? el("span", { class: "safari-dex-ball" }, ballIcon(ballByKey(ballKey))) : null,
        ]));
      });
      dexHost.appendChild(grid);
      const tools = [
        el("button", { class: "btn subtle sm", onClick: () => {
          if (confirm("Reset the ENTIRE Safari (all trainers, catches, teams, log)?")) {
            Store.update((s) => { s.pokedex = { active: "", trainers: {}, log: [], given: 0, taken: 0 }; });
            location.reload();
          }
        } }, "Reset Safari"),
      ];
      dexHost.appendChild(el("div", { class: "toolbar" }, tools));
    }

    function renderAll() { renderStats(); renderEncounter(); renderBoard(); renderTeam(); renderDex(); }
    renderAll();
  }

  window.Views = window.Views || {};
  window.Views.safari = view;
  // Tuning/debug hook (used by tests; harmless in production).
  // Set THIS phone's catcher (e.g. from a profile's "Catch as" button) — local,
  // never synced. Clears any in-progress encounter so the new trainer starts fresh.
  window.Safari = { catchAs: function (id) { if (myCatcher !== id) { myCatcher = id; current = null; status = ""; } } };
  window.SafariDebug = { info: info, weightFor: weightFor, legendaryOwner: legendaryOwner,
    randomEncounter: randomEncounter, ownsNormal: ownsNormal, ownsShiny: ownsShiny };
})();
