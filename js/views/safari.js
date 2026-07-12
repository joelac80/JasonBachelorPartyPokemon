/* safari.js — Pokédex Safari drinking game (per-trainer competition).
   Encounter odds are near-flat (legendaries show up!), but catch rates are
   drastically tiered: Common 55% → Legendary 4% base, and legendaries take
   boosts at half strength — so landing one is a genuine celebration. Everyone
   can catch their OWN of every Pokémon (legendaries included) — no one-of-one
   contention; each trainer builds their own dex.
   Earn boosts by DOING things — each is a random action you must perform;
   chicken out and you take a sip + forfeit that boost, and the wild one may
   spook and bolt (up to 50% for legendaries):
     • Dares      up to 3 × +20%
     • Berry      +15%   (also halves flee chance)
     • Squad rally +10%
     • Helper     +15% (a 2nd trainer joins; earns an assist + a share of the
                        points — half, or the full haul on a legendary)
     • Master Ball dare — one EPIC challenge = a guaranteed catch outright
   Then throw. Catches go into that trainer's own Pokédex and score points for
   their team on Victory Road (rarer = more; a shiny doubles). No drinks are
   handed out for a catch — just the small self-inflicted sip if you chicken
   out of a boost or the wild one bolts. Leaderboard + Ash Ketchum cap for the
   top catcher. State in Store.pokedex. */
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
  const DARES = [
    "Take a sip 🍺", "Finish your current drink 🍻", "Take a shot 🥃",
    "Do 5 push-ups 💪", "Sing one line of any song 🎤", "Strike your best gym-leader pose 🕺",
    "Let the group pick your next drink 🎲", "Speak only in Pokémon names for 1 minute 🗣️",
    "10-second victory dance 💃", "Toast the groom, everyone drinks 🥂",
    "Do your best Pokémon cry 📣", "Waterfall for 3 seconds 🌊",
    "Grab someone a fresh drink 🍺", "Get the groom a round 🤵",
    "Cheers the person on your left 🥂", "Refill an empty cup nearby 🥤",
  ];
  // Berry = coax the wild one closer with a solo bit of theatre.
  const BERRY_ACTS = [
    "Do your best Pokémon cry to lure it closer 📣",
    "Mime tossing it a tasty berry 🫐",
    "Sweet-talk the wild one out loud 🗣️",
    "Strike a friendly gym-leader pose 🕺",
    "Whistle the Pokémon Center jingle 🎵",
    "Narrate the scene like a nature doc 🎥",
    "Offer a real snack to someone in the room 🍿",
  ];
  // Rally = get the whole party involved.
  const RALLY_ACTS = [
    "Get the group to chant the catcher's name 📣",
    "Start a slow-clap the room has to finish 👏",
    "Lead a 'Gotta catch 'em all!' shout 🗣️",
    "Everyone raise a glass and toast the throw 🥂",
    "Run a group 3… 2… 1… THROW countdown 🔢",
    "Whole squad does a Pokéball hand-motion 🙌",
  ];
  // Master Ball dare = one epic, way-tougher challenge for a GUARANTEED catch.
  const MASTER_ACTS = [
    "Down your entire drink in one go 🍺",
    "Do 20 push-ups right now 💪",
    "Serenade the groom with a full verse 🎤",
    "Hold a 60-second plank 🧘",
    "Eat a spoonful of the hottest sauce in the house 🌶️",
    "Let the group draw on your face 🖊️",
    "Do the worm across the floor 🪱",
    "Call a family member and declare your love of Pokémon 📞",
    "Take three shots, back to back 🥃",
    "Dead-hang / wall-sit for a full minute 🧗",
  ];
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
  // Each boost is an action you must actually perform; bail and there's a price.
  // `master` short-circuits the odds to a guaranteed catch when completed.
  const BOOSTS = {
    dare: { pct: 0.20, pool: DARES, verb: "dare", emoji: "🌶️" },
    berry: { pct: 0.15, pool: BERRY_ACTS, verb: "berry", emoji: "🍓" },
    rally: { pct: 0.10, pool: RALLY_ACTS, verb: "rally", emoji: "📣" },
    master: { pct: 1, pool: MASTER_ACTS, verb: "Master Ball dare", emoji: "🟣" },
  };

  // Harder/rarer Pokémon are far more skittish — bailing an action near them
  // is a bigger gamble. ~20% for commons, ~37% for elites, up to 50% legendary.
  function spookChance(nfo) {
    let s = 0.15 + (nfo.x || 60) / 900;
    if (nfo.leg) s += 0.15;
    return Math.max(0.15, Math.min(0.5, s));
  }

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
    // ✨ A shiny scores DOUBLE points. (No drinks are handed out for a catch.)
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
      if (viaMaster) t.masterCatches = (t.masterCatches || 0) + 1;   // 🟣 Master Catcher
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
      else if (nfo.leg) Store.chron(s, "🌟", "LEGENDARY! " + attendeeName(tid) + " caught " + nfo.name + "!" + (viaMaster ? " (Master Ball dare!)" : ""));
      else Store.chron(s, "🔴", attendeeName(tid) + " caught " + nfo.name + "!" + (viaMaster ? " (Master Ball dare!)" : "") + (helperName ? " (assist: " + helperName + ")" : ""));
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
  let berryDone = false, rallyDone = false, masterDone = false;   // boost earned
  let dareLocked = false, berryLost = false, rallyLost = false, masterLost = false;  // bailed
  let pending = null, penaltyMsg = "";                  // pending = {kind,prompt,pct}
  let dexMode = "normal";                               // dex grid: normal | shiny

  function view(root) {
    // While you're on the Safari, a remote sync (someone else walking/catching)
    // must NOT re-render and yank your screen. Your own taps keep it fresh, and
    // the one-of-one guard keeps the roaming race correct. Router clears this on
    // navigation away.
    window.__deferRender = function () { return true; };

    // Wipe all this-encounter boost state (called on new find / trainer swap / run).
    function clearBoosts() {
      level = 0; berryDone = false; rallyDone = false; masterDone = false; helper = "";
      dareLocked = false; berryLost = false; rallyLost = false; masterLost = false; pending = null; penaltyMsg = "";
    }

    // Effective catch chance = base + all active boosts (capped at 100%).
    // Legendaries resist: boosts work at HALF strength on them, so even fully
    // stacked they're ~65% — only the Master Ball dare guarantees one.
    function chanceFor(nfo) {
      if (masterDone) return 1;
      const boosts = 0.2 * level + (berryDone ? 0.15 : 0) + (rallyDone ? 0.10 : 0) + (helper ? 0.15 : 0);
      return Math.min(1, nfo.base + boosts * (nfo.leg ? 0.5 : 1));
    }

    // Present a boost's random action. You then either do it or chicken out.
    function startAction(kind) { const b = BOOSTS[kind]; pending = { kind: kind, prompt: pick(b.pool), pct: b.pct }; penaltyMsg = ""; sfx("select"); renderEncounter(); }
    function doAction() {
      if (!pending) return;
      const k = pending.kind;
      if (k === "dare") level++; else if (k === "berry") berryDone = true;
      else if (k === "rally") rallyDone = true; else if (k === "master") masterDone = true;
      sfx(k === "master" ? "fanfare" : (k === "rally" ? "blip" : "coin"));
      pending = null; renderEncounter();
    }
    function chickenOut() {
      if (!pending) return;
      const k = pending.kind, verb = BOOSTS[k].verb;
      Store.update((s) => { s.pokedex.taken = (s.pokedex.taken || 0) + 1; });   // the price: a sip
      pending = null;
      // Hesitating might spook the wild one into bolting — odds scale with how
      // hard/rare it is (commons ~20%, legendaries up to 50%). Encounter over.
      if (current) {
        const nfo0 = info(current);
        if (Math.random() < spookChance(nfo0)) {
          const id = current;
          wildEscaped(id, nfo0, nfo0.name + " spooked and bolted!",
            "🐔 You hesitated on the " + verb + " — take a sip, and it's gone!");
          return;
        }
      }
      if (k === "dare") dareLocked = true; else if (k === "berry") berryLost = true;
      else if (k === "rally") rallyLost = true; else if (k === "master") masterLost = true;
      penaltyMsg = "🐔 Chickened out of the " + verb + " — take a sip! No more " + verb + " this catch.";
      sfx("error"); renderEncounter();
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
        el("div", { class: "safari-caught-ball" }, [ballIcon(ballByKey(ballUsed)), " Caught with a " + ballByKey(ballUsed).name + (viaMaster ? " (Master Ball dare!)" : "") + "!"]),
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
      if (busy || !current || pending || !window.Duel) return;
      const tid = active();
      if (!tid) return;
      const ctx = { tid: tid, id: current, wasShiny: shiny, glyph: currentGlyph, nfo: nfo,
        helperId: helper && helper !== tid ? helper : "", viaMaster: masterDone,
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
          const res = recordCatch(tid, ctx.id, ctx.wasShiny, "poke", ctx.viaMaster, ctx.helperId, nfo);
          showCaughtCard(tid, ctx.id, ctx.wasShiny, "poke", ctx.viaMaster, nfo, res, "⚔ Weakened in battle, then caught!");
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
        Store.update((s) => { s.pokedex.taken = (s.pokedex.taken || 0) + 1; });   // a wipe costs a sip
        sfx("error");
        enc.innerHTML = "";
        enc.appendChild(el("div", { class: "safari-card result miss" }, [
          el("img", { class: "safari-wild fled", src: SP[ctx.id], alt: nfo.name }),
          el("div", { class: "safari-result-msg" }, "Your team was wiped out!"),
          el("div", { class: "safari-payout miss" }, "😵 The wild " + nfo.name + " wandered off. Take a sip."),
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
      el("p", { class: "page-sub" }, "Pick your trainer, find a wild one, then earn boosts by pulling off dares, berries and rallies — chicken out and you drink (and it might bolt!). Then throw."),
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
    root.appendChild(el("div", { class: "safari-trainer" }, [el("span", { class: "safari-trainer-lbl" }, "Now catching:"), sel]));

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
        // 🌩 roaming legendary: a room-wide event — everyone can go grab one
        const roam = window.Sync && Sync.roam && Sync.roam();
        if (roam && DEX[roam.monId]) {
          enc.appendChild(el("div", { class: "roam-banner" }, [
            el("span", {}, "🌩 A wild " + DEX[roam.monId].n.toUpperCase() + " is ROAMING the lake house — go catch it!"),
            el("button", { class: "btn primary sm", onClick: () => {
              // Each hunter rolls their own shiny shot at the roaming legendary
              // (~1/8) — the only realistic way to land a shiny legendary.
              current = roam.monId; shiny = Math.random() < SHINY_RATE; revealId = null; status = ""; clearBoosts();
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
      const owned = !!rec(active()).caught[current];
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
        owned ? el("span", { class: "safari-owned" }, "✓ already in dex") : null,
      ]);
      // Human-readable breakdown of every active boost.
      let breakdown;
      if (masterDone) {
        breakdown = " (🟣 Master Ball dare!)";
      } else {
        const parts = [];
        if (level) parts.push(level + " dare" + (level > 1 ? "s" : ""));
        if (berryDone) parts.push("berry");
        if (rallyDone) parts.push("rally");
        if (helper) parts.push("helper");
        breakdown = parts.length ? " (base " + Math.round(nfo.base * 100) + "% + " + parts.join(" + ") + ")" : "";
      }
      const odds = el("div", { class: "safari-odds" }, [
        el("span", { class: "safari-odds-big" }, Math.round(chance * 100) + "%"),
        el("span", {}, " catch chance" + breakdown + " · worth " + nfo.pts + " pt" + (nfo.pts > 1 ? "s" : "") + (nfo.leg ? " · resists boosts (½ effect)" : "")),
        el("span", { class: "safari-ball-chip" }, [ballIcon(ball), " " + ball.name + (ball.key === "master" ? " — sure catch!" : "")]),
      ]);
      const pips = el("div", { class: "safari-pips" }, [0, 1, 2].map((i) => el("span", { class: "safari-pip" + (i < level ? " on" : "") })));

      // Active-boost chips (berry / rally / helper) shown alongside the dare pips.
      const activeChips = [];
      if (masterDone) activeChips.push(el("span", { class: "safari-boost-chip master" }, "🟣 Master Ball dare"));
      if (berryDone) activeChips.push(el("span", { class: "safari-boost-chip berry" }, "🍓 Berry +15%"));
      if (rallyDone) activeChips.push(el("span", { class: "safari-boost-chip rally" }, "📣 Rally +10%"));
      if (helper) activeChips.push(el("span", { class: "safari-boost-chip helper" }, "🤝 " + attendeeName(helper) + " +15%"));

      let challengeArea;
      if (pending) {
        // An action is on the table — do it for the boost, or bail and pay up.
        const isMaster = pending.kind === "master";
        challengeArea = el("div", { class: "safari-dare" + (isMaster ? " master" : "") }, [
          isMaster ? el("div", { class: "safari-dare-tag" }, "🟣 MASTER BALL DARE — pull it off for a guaranteed catch") : null,
          el("div", { class: "safari-dare-txt" }, BOOSTS[pending.kind].emoji + " " + pending.prompt),
          el("div", { class: "safari-actions" }, [
            el("button", { class: "btn primary sm", onClick: doAction }, isMaster ? "✓ Nailed it — Master Ball!" : "✓ Did it (+" + Math.round(pending.pct * 100) + "%)"),
            el("button", { class: "btn subtle sm", onClick: chickenOut }, "🐔 Chicken out — take a sip"),
          ]),
        ]);
      } else if (masterDone) {
        challengeArea = el("div", { class: "hint" }, "🟣 Master Ball earned — throw for the guaranteed catch!");
      } else {
        const btns = [];
        if (level < 3 && !dareLocked) btns.push(el("button", { class: "btn subtle sm", onClick: () => startAction("dare") }, "🌶️ Take a dare (+20%)"));
        if (!berryDone && !berryLost) btns.push(el("button", { class: "btn subtle sm", onClick: () => startAction("berry") }, "🍓 Toss a Berry (+15%)"));
        if (!rallyDone && !rallyLost) btns.push(el("button", { class: "btn subtle sm", onClick: () => startAction("rally") }, "📣 Squad rally (+10%)"));
        btns.push(helper
          ? el("button", { class: "btn subtle sm", onClick: () => { helper = ""; renderEncounter(); } }, "🤝 Remove helper")
          : el("button", { class: "btn subtle sm", onClick: pickHelper }, "🤝 Add a helper (+15%)"));
        if (!masterLost) btns.push(el("button", { class: "btn subtle sm safari-master-btn", onClick: () => startAction("master") }, "🟣 Master Ball dare — sure catch"));
        challengeArea = el("div", { class: "safari-actions safari-boosts" }, btns);
      }
      const suspense = el("div", { class: "safari-suspense" });
      const canBattle = window.Duel && Duel.poolFor && Duel.poolFor(active()).length > 0;
      const throwRow = el("div", { class: "safari-actions safari-throw-row" }, [
        el("button", { class: "btn primary", onClick: () => throwBall(nfo), disabled: pending ? "true" : null }, [ballIcon(ball), " Throw " + ball.name]),
        canBattle ? el("button", { class: "btn subtle", onClick: () => battleToWeaken(nfo), disabled: pending ? "true" : null }, "⚔ Battle to weaken") : null,
        el("button", { class: "btn subtle", onClick: () => { current = null; status = ""; clearBoosts(); renderEncounter(); } }, "Run"),
      ]);
      const post = el("div", { class: "safari-post" + (firstShow ? " hidden" : "") }, [
        meta,
        helper ? el("div", { class: "safari-teamup" }, "🤝 " + attendeeName(active()) + " & " + attendeeName(helper) + " — double-battle catch!") : null,
        odds,
        el("div", { class: "safari-challenge" }, [
          el("div", { class: "safari-challenge-row" }, [el("span", { class: "safari-challenge-lbl" }, "Boost"), pips].concat(activeChips)),
          penaltyMsg ? el("div", { class: "safari-penalty" }, penaltyMsg) : null,
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
          Store.logEvent("🌩", "The sky darkens over the lake — a wild " + DEX[pickId].n + " is ROAMING! Everyone go catch one!");
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
      if (busy || !current || pending) return;
      busy = true;
      const chance = chanceFor(nfo);
      const ballUsed = ballTier(chance).key;              // record what we threw
      const viaMaster = masterDone;                       // earned via the epic dare?
      const flee = berryDone ? nfo.flee / 2 : nfo.flee;   // a berry calms it — less likely to bolt
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
        const isShiny = shiny;
        const helperId = helper && helper !== tid ? helper : "";
        const res = recordCatch(tid, id, isShiny, ballUsed, viaMaster, helperId, nfo);
        // (The old "complete the Gen 1-4 dex to unlock Gen 5-9" room gate is
        // retired — the Gen Ladder unlocks generations through BATTLES now.)
        // A roaming legendary stays out for the whole room (everyone can grab
        // their own) — it just wanders off on its own timer, no exclusive claim.
        showCaughtCard(tid, id, isShiny, ballUsed, viaMaster, nfo, res, "");
      } else {
        Store.update((s) => { s.pokedex.taken = (s.pokedex.taken || 0) + 1; });
        sfx("error");
        enc.innerHTML = "";
        enc.appendChild(el("div", { class: "safari-card result miss" }, [
          el("img", { class: "safari-wild fled", src: SP[id], alt: nfo.name }),
          el("div", { class: "safari-result-msg" }, nfo.name + " slipped away!"),
          el("div", { class: "safari-payout miss" }, "😅 It got away. Take a sip." ),
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
