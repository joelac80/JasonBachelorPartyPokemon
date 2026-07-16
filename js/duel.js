/* duel.js — turn-based Pokémon duels. Global `Duel`.
   Duel.start({ mode, title, first, a, b, myClient, net, onResult, onEnd })
     a/b: { units: [{ attId, monIds: [...], client? }, ...] }
       1 unit per side = singles (bring a party of up to 6, switch on faint
       or spend a turn to switch voluntarily); 2 units = a DOUBLE battle (2v2 —
       each unit fields one active mon and switches to its own bench; the two
       units can be two trainers, or the same trainer running both slots).
   Everything fights at Lv50: HP/attack come from the species power stat,
   moves from its types. Trainer items (per trainer, each takes the turn):
     🧪 Potion   — heal 120 HP (2 per battle)
     🎯 Dire Hit — unleash a can't-miss guaranteed CRIT this same turn (1 per battle)
                         and lands a guaranteed CRITICAL HIT (once)
   modes: "local" (hot-seat, pass the phone), "remote" (each trainer picks
   their turns on their own phone — actions travel as small serialized
   acts, all dice rolled by the acting phone so every screen agrees), and
   "watch" (spectators replay the same acts live, turn by turn).
   Wins land in the battle log + chronicle and score Victory Road points. */
(function () {
  const { el } = U;
  const DEX = window.DEX || {};
  const SP = window.DEX_SPRITES || {};
  const BACKS = window.DEX_SPRITES_BACK || {};          // full 251 rear views
  const SPS = window.DEX_SPRITES_SHINY || {};           // ✨ shiny fronts
  const BACKS_S = window.DEX_SPRITES_BACK_SHINY || {};  // ✨ shiny rear views
  const BACK = window.SPRITES_BACK || {};               // legacy squad set (fallback)
  // A mon instance is shiny if that trainer's dex record says so.
  function isShinyFor(attId, monId) {
    const t = ((Store.state.pokedex || {}).trainers || {})[attId];
    return !!(t && t.caught && t.caught[monId] && t.caught[monId].shiny);
  }
  function frontSprite(id, shiny) { return (shiny && SPS[id]) || SP[id] || (window.Store && Store.sprite(id)) || ""; }
  function backSprite(id, shiny) { return (shiny && BACKS_S[id]) || BACKS[id] || BACK[id] || ""; }
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }
  function now() { try { return Date.now(); } catch (_) { return 0; } }

  const TYPE_EMOJI = { normal: "⭐", fire: "🔥", water: "💧", electric: "⚡", grass: "🌿", ice: "❄️", fighting: "🥊", poison: "☠️", ground: "⛰️", flying: "🪽", psychic: "🔮", bug: "🐛", rock: "🪨", ghost: "👻", dragon: "🐉", dark: "🌑", steel: "⚙️", fairy: "✨" };
  const TYPE_COLOR = { normal: "#a8a878", fire: "#f08030", water: "#6890f0", electric: "#e0b400", grass: "#78c850", ice: "#58b8c8", fighting: "#c03028", poison: "#a040a0", ground: "#c8a850", flying: "#a890f0", psychic: "#f85888", bug: "#a8b820", rock: "#b8a038", ghost: "#705898", dragon: "#7038f8", dark: "#705848", steel: "#9898b0", fairy: "#e87898" };

  // 🌍 BATTLE BIOMES — the arena wears the region it's fought in. A named
  // region (passed as opts.env from the gym/league circuit) wins; otherwise
  // the scene is drawn from the FOE's element so every wild/tower/bracket
  // fight still gets thematic ground under its feet. Each biome is a CSS
  // class `bg-<scene>` (see styles.css) and may carry ambient weather.
  const REGION_SCENE = {
    Kanto: "field", Johto: "dusk", Hoenn: "sea", Sinnoh: "snow", Unova: "city",
    Kalos: "lumi", Alola: "beach", Galar: "stadium", Paldea: "canyon", Hisui: "rift",
  };
  const TYPE_SCENE = {
    fire: "volcano", ice: "snow", water: "sea", grass: "field", bug: "field",
    rock: "canyon", ground: "canyon", electric: "city", steel: "city",
    psychic: "lumi", fairy: "lumi", ghost: "dusk", dark: "dusk",
    dragon: "sky", flying: "sky", poison: "cave", fighting: "stadium", normal: "field",
  };
  // Ambient weather reads off the SCENE (calm scenes stay clear so weather
  // stays a moment, not wallpaper): snowfields snow, volcanoes ember, canyons
  // blow sand, the ancient rift drifts with motes.
  const SCENE_WX = { snow: "snow", volcano: "ember", canyon: "sand", rift: "rift" };
  function battleScene(env, foeType) {
    if (env && REGION_SCENE[env]) return REGION_SCENE[env];   // named region (league halls)
    if (env && /^bg-/.test(env)) return env.slice(3);          // explicit scene ("bg-snow")
    if (env && TYPE_SCENE[env]) return TYPE_SCENE[env];        // an element — per-gym theming
    return (foeType && TYPE_SCENE[foeType]) || "field";        // else the foe's element
  }

  // Two damage moves per type: [name, power, accuracy] — a reliable jab and
  // a heavy haymaker that sometimes whiffs.
  const MOVES = {
    normal: [["Body Slam", 60, 100], ["Double-Edge", 100, 85]],
    fire: [["Flamethrower", 65, 100], ["Fire Blast", 110, 75]],
    water: [["Surf", 65, 100], ["Hydro Pump", 110, 75]],
    electric: [["Thunderbolt", 65, 100], ["Thunder", 110, 70]],
    grass: [["Razor Leaf", 60, 100], ["Solar Beam", 110, 80]],
    ice: [["Ice Beam", 65, 100], ["Blizzard", 110, 70]],
    fighting: [["Brick Break", 60, 100], ["Cross Chop", 105, 80]],
    poison: [["Sludge", 60, 100], ["Sludge Bomb", 105, 80]],
    ground: [["Dig", 60, 100], ["Earthquake", 100, 90]],
    flying: [["Wing Attack", 60, 100], ["Sky Attack", 110, 75]],
    psychic: [["Psybeam", 60, 100], ["Psychic", 100, 85]],
    bug: [["Fury Cutter", 55, 100], ["Megahorn", 115, 75]],
    rock: [["Rock Throw", 55, 100], ["Rock Slide", 105, 80]],
    ghost: [["Lick", 55, 100], ["Shadow Ball", 100, 85]],
    dragon: [["Dragon Breath", 60, 100], ["Outrage", 110, 75]],
    dark: [["Bite", 60, 100], ["Crunch", 105, 80]],
    steel: [["Metal Claw", 55, 100], ["Iron Tail", 105, 75]],
    fairy: [["Fairy Wind", 55, 100], ["Moonblast", 110, 75]],
  };

  // Resolve a move NAME (from a learnset) into a battle move via the move
  // dictionary. Unknown names return null so the caller can fall back — a data
  // typo can never crash a battle.
  function moveObj(name) {
    const d = window.MOVES_DB && MOVES_DB[name];
    if (!d) return null;
    return { name: name, type: d.t, cat: d.cat || "phys", pow: d.pow || 0,
      acc: (d.acc == null ? 100 : d.acc), pri: d.pri || 0, fx: d.fx || null,
      spread: !!d.spread, recharge: !!d.recharge, charge: d.charge || null,
      freezeDry: !!d.freezeDry };
  }
  function typeMove(t, m) { return { name: m[0], type: t, cat: "phys", pow: m[1], acc: m[2], pri: 0, fx: null }; }
  // Gen-1/2 stat-stage multiplier (−6..+6).
  function stageMul(n) { n = Math.max(-6, Math.min(6, n || 0)); return n >= 0 ? (2 + n) / 2 : 2 / (2 - n); }
  // Effective Speed for turn order: base × speed-stage, halved by paralysis.
  function effSpeed(m) { let s = (m.spe || 50) * stageMul(m.stg ? m.stg.spe : 0); if (m.status === "par") s *= 0.5; return s; }

  // 📉 A battle fought at a LEVEL caps what anyone can KNOW: no Earthquake on
  // a Lv 10 Pokémon. The curve is 40 + Lv×1.2 (Lv5 ≈ 46, Lv14 ≈ 57, Lv32 ≈ 78,
  // Lv48 ≈ 98); Lv 58+ knows it all. Status moves always stay. The guarantees
  // that keep low-level fights fair without leaking full-power moves:
  //  • the slots fill in as a real trainer's would — at least 2 damaging
  //    moves early, 3 from Lv 12, the full 4 from Lv 24 — refilled from the
  //    learnset weakest-first…
  //  • …but a refilled move is CLAMPED to the curve (Slash at Lv5 hits like
  //    a Lv5 move, shown as "Slash 46") — no learnset lottery.
  // ⚖️ A gamble must stay a gamble worth TAKING: a low-accuracy or charge/
  // recharge move keeps a 25% power premium over the curve (the cartridge
  // ratio — Blizzard:Ice Beam is 110:90). A flat clamp used to hand back a
  // Blizzard at Ice Beam's exact number: same power, 70% accuracy, a
  // strictly-worse button. Expected damage still favors the reliable move
  // (110×0.7 < 88) — the premium buys the high roll, not a free lunch.
  function riskCapFor(m, cap) {
    return ((m.acc && m.acc <= 85) || m.charge || m.recharge) ? cap * 1.25 : cap;
  }
  // End-of-turn chip, as a fraction of max HP. Burn is gentle (1/16) because
  // it ALSO halves physical attack; poison bites 1/10; Leech Seed keeps the
  // cartridge 1/8 (it feeds the seeder, and Grass mons are flat immune).
  const RESIDUAL_DIV = { brn: 16, psn: 10, seed: 8 };
  function capMoves(moves, level) {
    if (!level || level >= 58) return moves;
    const cap = 40 + level * 1.2;
    const want = level >= 24 ? 4 : level >= 12 ? 3 : 2;
    const kept = moves.filter((m) => !m.pow || m.pow <= riskCapFor(m, cap));
    const dmg = moves.filter((m) => m.pow).sort((a, b) => a.pow - b.pow);
    const nDmg = () => kept.filter((m) => m.pow).length;
    for (let i = 0; i < dmg.length && (kept.length < want || nDmg() < 2); i++) {
      if (kept.indexOf(dmg[i]) >= 0) continue;
      const lid = riskCapFor(dmg[i], cap);
      // clone before clamping — move objects are shared across mons
      kept.push(dmg[i].pow > lid ? Object.assign({}, dmg[i], { pow: Math.round(lid) }) : dmg[i]);
    }
    return kept;
  }

  // 🧗 THE STAB LADDER — three rungs per type, weakest first, every name a
  // real MOVES_DB move (effects ride along). When the level curve strips a
  // mon of EVERY damaging move of its own element (Charmeleon at Lv 14: its
  // only fire move is a 90-power Flamethrower), the ladder hands back the
  // rung that level would really know — Ember through Lv 16, Flame Wheel
  // 17-41, Flamethrower itself once the curve allows 90 (Lv 42+).
  const STAB_LADDER = {
    normal: ["Tackle", "Headbutt", "Hyper Voice"],
    fire: ["Ember", "Flame Wheel", "Flamethrower"],
    water: ["Water Gun", "Bubble Beam", "Surf"],
    electric: ["Thunder Shock", "Spark", "Thunderbolt"],
    grass: ["Absorb", "Razor Leaf", "Energy Ball"],
    ice: ["Powder Snow", "Aurora Beam", "Ice Beam"],
    fighting: ["Mach Punch", "Brick Break", "Sky Uppercut"],
    poison: ["Poison Sting", "Sludge", "Sludge Bomb"],
    ground: ["Mud-Slap", "Scorching Sands", "Earth Power"],
    flying: ["Gust", "Wing Attack", "Drill Peck"],
    psychic: ["Confusion", "Psybeam", "Psychic"],
    bug: ["Leech Life", "Bug Bite", "Bug Buzz"],
    rock: ["Rock Throw", "Ancient Power", "Power Gem"],
    ghost: ["Shadow Sneak", "Hex", "Shadow Ball"],
    dragon: ["Twister", "Dragon Breath", "Dragon Pulse"],
    dark: ["Pursuit", "Bite", "Crunch"],
    steel: ["Bullet Punch", "Steel Wing", "Flash Cannon"],
    fairy: ["Fairy Wind", "Draining Kiss", "Moonblast"],
  };
  function ladderMove(t, level) {
    const rungs = STAB_LADDER[t] || [];
    const cap = level && level < 58 ? 40 + level * 1.2 : Infinity;
    let pick = null;
    for (let i = 0; i < rungs.length; i++) {
      const mv = moveObj(rungs[i]);
      if (!mv) continue;
      if (pick === null || mv.pow <= cap) pick = mv;   // climb while the curve allows
    }
    // rung 1 can sit a hair over a very low cap (Rock Throw 50 at Lv 5) —
    // clamp it like any refilled move rather than hand back nothing
    if (pick && pick.pow > cap) pick = Object.assign({}, pick, { pow: Math.round(cap) });
    return pick;
  }

  // Lv50 battle stats from the species power stat (x = base experience). Moves
  // come from the species' real Gen-2 learnset (data/learnsets.js) resolved via
  // the move dictionary; a missing/short set falls back to the type table. A
  // battle-wide `level` (nuzlocke caps, True Story, Stadium cups) trims the
  // moveset down to what that level would really know.
  // 🧬 Battle forms (megas, Hisuians, Origins, formes) have no learnset rows
  // of their own — they fight with their BASE species' curated moveset
  // instead of the bland generic type table. Megas/primals resolve through
  // MEGA_FORMS; the rest map here.
  const FORM_BASE = { 10001: 386, 10002: 386, 10003: 386, 10007: 487, 10061: 670,
    10086: 720, 10118: 718, 10120: 718, 10157: 800, 10190: 890,
    10229: 58, 10230: 59, 10231: 100, 10232: 101, 10233: 157, 10234: 211,
    10235: 215, 10236: 503, 10237: 549, 10238: 570, 10239: 571, 10240: 628,
    10241: 705, 10242: 706, 10243: 713, 10244: 724, 10245: 483, 10246: 484,
    10276: 1024, 10277: 1024,
    10094: 25 };   // ⚡ Ash's Pikachu fights with Pikachu's own curated kit
  function baseOf(monId) {
    if (window.MEGA_FORMS && MEGA_FORMS[monId]) return MEGA_FORMS[monId].base;
    return FORM_BASE[monId] || 0;
  }

  // ⚖️ THE LEAN SYSTEM — real stat identity on the compressed engine. Each
  // mon carries [off, def] in -10..+10 (data/dex-leans.js, derived from its
  // cartridge Atk:SpA and Def:SpD ratios). Positive off = special attacker
  // (Alakazam +8), negative = physical (Machamp -6). Positive def = special
  // WALL (Chansey +10 shrugs Thunderbolts, folds to Body Slam), negative =
  // physical wall (Cloyster -10). The tilt moves damage ±35% on offense and
  // ±30% on defense around the SAME average, so every mon's overall power —
  // and the whole tuned difficulty curve — is unchanged; only the SHAPE of
  // its threat now matches the games. Forms fall back to their base species.
  function leanOf(monId) {
    const L = window.DEX_LEANS || {};
    return L[monId] || L[baseOf(monId)] || [0, 0];
  }
  // attacker's tilt on a move it THROWS
  function offTilt(m, mv) {
    const o = (m.lean || [0, 0])[0];
    if (!o) return 1;
    return mv.cat === "spec" ? 1 + 0.035 * o : mv.cat === "phys" ? 1 - 0.035 * o : 1;
  }
  // defender's tilt on a hit it TAKES
  function defTilt(tm, mv) {
    const d = (tm.lean || [0, 0])[1];
    if (!d) return 1;
    return mv.cat === "spec" ? 1 - 0.03 * d : mv.cat === "phys" ? 1 + 0.03 * d : 1;
  }
  function statsFor(monId, level) {
    const d = DEX[monId] || { n: "???", x: 60 };
    const x = d.x || 60;
    const types = (d.t && d.t.length ? d.t : ["normal"]).slice(0, 2);
    let moves = [];
    const set = window.DEX_MOVESETS && (DEX_MOVESETS[monId] || DEX_MOVESETS[baseOf(monId)]);
    if (set && set.length) set.forEach((nm) => { const mv = moveObj(nm); if (mv) moves.push(mv); });
    if (moves.length < 2) {                       // no/short learnset → type table
      moves = [];
      types.forEach((t) => (MOVES[t] || MOVES.normal).forEach((m) => moves.push(typeMove(t, m))));
      if (types.length === 1 && types[0] !== "normal") moves.push(typeMove("normal", ["Tackle", 40, 100]));
    }
    // Which of its OWN types the full-power set actually attacks with — the
    // STAB guarantee restores what the level cap strips, never re-curates.
    const hadStab = {};
    moves.forEach((m) => { if (m.pow && types.indexOf(m.type) >= 0) hadStab[m.type] = 1; });
    moves = capMoves(moves, level).slice(0, 4);
    // 🎯 STAB guarantee: losing every move of your own element to the level
    // curve (a Charmeleon with no fire) is not allowed — the ladder fills
    // the gap with the rung this level has earned.
    if (level && level < 58) types.forEach((t) => {
      if (!hadStab[t] || moves.some((m) => m.pow && m.type === t)) return;
      const mv = ladderMove(t, level);
      if (!mv || moves.some((m) => m.name === mv.name)) return;
      if (moves.length >= 4) {
        // make room by dropping the weakest damaging move of a FOREIGN type
        // (status moves and the mon's other element stay untouchable)
        let worst = -1;
        for (let i = 0; i < moves.length; i++) {
          const m = moves[i];
          if (!m.pow || types.indexOf(m.type) >= 0) continue;
          if (worst < 0 || m.pow < moves[worst].pow) worst = i;
        }
        if (worst < 0) return;
        moves.splice(worst, 1);
      }
      moves.push(mv);
    });
    // 🧬 FORM-TYPE STAB: a battle form that gains a NEW type (Mega Charizard X
    // → fire/DRAGON, Mega Gyarados → water/DARK, Primal Groudon → ground/FIRE)
    // inherits its base's moveset, which has NO move of that new element — so
    // it could never use its new STAB. Hand it the ladder move of any type it
    // holds but can't yet hit with, so the type change actually MEANS something.
    // Runs at every level (unlike the cap guarantee): the top rung above Lv58.
    const baseId = baseOf(monId);
    if (baseId && DEX[baseId]) {
      const baseTypes = (DEX[baseId].t || []).slice(0, 2);
      types.forEach((t) => {
        if (baseTypes.indexOf(t) >= 0) return;                 // not a NEW type
        if (moves.some((m) => m.pow && m.type === t)) return;  // already can hit with it
        const mv = ladderMove(t, level);
        if (!mv || moves.some((m) => m.name === mv.name)) return;
        if (moves.length >= 4) {
          // evict the weakest damaging move of a type this form does NOT hold
          let worst = -1;
          for (let i = 0; i < moves.length; i++) {
            const mm = moves[i];
            if (!mm.pow || types.indexOf(mm.type) >= 0) continue;
            if (worst < 0 || mm.pow < moves[worst].pow) worst = i;
          }
          if (worst < 0) return;
          moves.splice(worst, 1);
        }
        moves.push(mv);
      });
    }
    // 🩹 HP grows with the battle level, damage in lockstep via the move
    // curve — so every level band lands in the classic 3-4-hit rhythm.
    // Lv5 = 55% pool, Lv14 = 64%, Lv36 = 86%, Lv50+ = full (standard
    // battles, the Lv100 ladder, and remote duels are untouched).
    const hpMul = level ? Math.min(1, 0.5 + level / 100) : 1;
    return { id: monId, name: d.n, x: x, types: types,
      lean: leanOf(monId),   // ⚖️ [off, def] stat identity — see leanOf above
      spe: (window.DEX_SPEED && DEX_SPEED[monId]) || 50,   // Gen-2 base Speed → turn order
      hpMax: Math.round((120 + Math.round(x * 0.5)) * hpMul),
      // ⚡ THE LIGHT BALL — Ash's Pikachu (10094) carries it forever: the
      // attack of a 650-BST monster in a 320-BST body. Hits like a Mega,
      // folds like paper, never evolves. The trophy past the final boss.
      atk: monId === 10094 ? (0.55 + 650 / 500) : (0.55 + x / 500),
      // ---- live battle state (reset on switch-in where noted) ----
      status: null,        // major status: par | brn | psn | slp | frz
      slp: 0,              // remaining sleep turns
      seeded: false,       // Leech Seed drain each turn
      _flinch: false,      // flinched this turn (volatile)
      _confN: 0,           // 💫 confused for N more actions (volatile)
      _recharge: false,    // must spend next turn recharging (Hyper Beam etc.)
      _charging: null,     // mid two-turn move ({move}): must strike next turn
      _invuln: false,      // semi-invulnerable while charging (Dig/Fly/Phantom Force)
      stg: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0 },   // stat stages
      moves: moves };
  }

  function effFor(moveType, defTypes, mv) {
    const f = window.Battle && Battle.effectiveness;
    if (!f) return 1;
    let e = defTypes.reduce((m, t) => m * f(moveType, t), 1);
    // ❄️💧 Freeze-Dry's signature: it hits WATER super-effectively. Ice vs
    // water is normally ×0.5, so replacing it with ×2 is a clean ×4 on any
    // water-typed target (dual types compose correctly: Water/Grass → ×4).
    if (mv && mv.freezeDry && defTypes.indexOf("water") >= 0) e *= 4;
    return e;
  }

  // Last resort when every move is nullified by immunity (e.g. a mono-Normal
  // mon staring down a Ghost): typeless, always usable, never great.
  const STRUGGLE = { name: "Struggle", type: "none", cat: "phys", pow: 50, acc: 100, pri: 0, fx: null };

  // ---- status helpers ----
  const STATUS_TAG = { par: "PAR", brn: "BRN", psn: "PSN", slp: "SLP", frz: "FRZ" };
  const STATUS_GOT = { par: " is paralyzed! It may not attack!", brn: " was burned!", psn: " was poisoned!",
    slp: " fell asleep!", frz: " was frozen solid!" };
  // Can this status land? One major status at a time; some types are immune.
  function canStatus(tm, id) {
    if (!tm || tm.status) return false;
    const ty = tm.types || [];
    if (id === "brn" && ty.indexOf("fire") >= 0) return false;
    if (id === "frz" && ty.indexOf("ice") >= 0) return false;
    if (id === "psn" && (ty.indexOf("poison") >= 0 || ty.indexOf("steel") >= 0)) return false;
    if (id === "par" && ty.indexOf("electric") >= 0) return false;   // Gen 6+: Electric can't be paralyzed
    return true;
  }
  const STAT_LABEL = { atk: "Attack", def: "Defense", spa: "Sp. Atk", spd: "Sp. Def", spe: "Speed", acc: "accuracy" };
  // Apply a stat-stage change; returns a human line (or null if it couldn't move).
  function applyStage(m, stat, stg) {
    const cur = m.stg[stat] || 0;
    const next = Math.max(-6, Math.min(6, cur + stg));
    if (next === cur) return m.name + "'s " + STAT_LABEL[stat] + (stg > 0 ? " won't go higher!" : " won't go lower!");
    m.stg[stat] = next;
    const big = Math.abs(stg) >= 2 ? " sharply" : "";
    return m.name + "'s " + STAT_LABEL[stat] + (stg > 0 ? big + " rose!" : big + " fell!");
  }

  // A trainer's pickable Pokémon: team of 6 first, then the rest of their
  // caught dex — and the partner is ALWAYS in the pool (it used to vanish
  // as soon as you caught anything, so "you need 6" miscounted by one).
  function poolFor(attId) {
    const t = ((Store.state.pokedex || {}).trainers || {})[attId] || {};
    const ids = (t.team || []).filter(Boolean).slice();
    Object.keys(t.caught || {}).map(Number).forEach((id) => { if (ids.indexOf(id) < 0) ids.push(id); });
    const a = Store.attendee(attId);
    if (a && a.favoriteId && ids.indexOf(a.favoriteId) < 0) ids.push(a.favoriteId);
    return ids;
  }

  // 📖 A LEVEL-CAPPED roster shows only who can really step onto the field:
  // every owned mon walks down to its cap-legal form, duplicates that land on
  // the same form collapse to ONE card (Tangrowth at cap 24 IS Tangela — no
  // point showing both), and within a line only the LATEST owned form stays
  // (own Tangela + Tangrowth at cap 40 → just Tangrowth). Split branches are
  // their own lines — Politoed and Poliwrath, Slowbro and Slowking, both stay.
  function capPool(pool, level, min) {
    const JS = window.JourneyStyle;
    if (!level || !JS || !JS.formAt) return { list: pool, defiant: {} };
    const PRE = {};
    const EV = window.EVO_LEVELS || {};
    Object.keys(EV).forEach((f) => (EV[f] || []).forEach((e) => { PRE[e.to] = +f; }));
    // Group the roster by what each mon IS at this cap. A group with a
    // cap-legal catch shows that one honest card (the Venusaur folds into
    // your real Bulbasaur). A group with NO legal catch shows the owned mon
    // in its TRUE form instead — an ILLEGAL card: a Venusaur towering over
    // a Lv 14 field, playable but liable to ignore you half the time.
    const groups = {}, reps = [];
    pool.forEach((id) => {
      const r = JS.formAt(id, level);
      if (!groups[r]) { groups[r] = { legal: false, owned: [] }; reps.push(r); }
      let steps = 0, cur = id;
      while (cur !== r && PRE[cur] != null && steps < 9) {
        // baby retro-fits (pre-form id HIGHER than the grown form) are not
        // missing stages — a caught Pikachu at cap 14 simply IS its Pichu
        if (PRE[cur] < cur) steps++;
        cur = PRE[cur];
      }
      if (steps === 0) groups[r].legal = true;
      else groups[r].owned.push({ id: id, steps: steps });
    });
    const isAncestorOf = (a, b) => { let p = PRE[b]; while (p) { if (p === a) return true; p = PRE[p]; } return false; };
    const defiant = {};
    let cards = [];
    reps.forEach((r) => {
      const g = groups[r];
      if (g.legal) { cards.push(r); return; }
      // illegal family: keep the MAXIMAL owned forms — the latest of the
      // line, with split finals (Poliwrath + Politoed) each their own card
      g.owned.forEach((o) => {
        if (g.owned.some((x) => x.id !== o.id && isAncestorOf(o.id, x.id))) return;
        if (cards.indexOf(o.id) >= 0) return;
        cards.push(o.id); defiant[o.id] = o.steps;
      });
    });
    // drop any card that's an ANCESTOR of another shown card (same line,
    // earlier stage) — the pre-evolution walk keeps branches apart
    const have = {}; cards.forEach((c) => { have[c] = 1; });
    cards = cards.filter((c) => !cards.some((x) => x !== c && isAncestorOf(c, x)));
    // never trim a roster below the battle's minimum — relax stage by stage
    // (duplicate lines come back first, then the raw roster) so a thin box
    // can still field a full team
    if (cards.length < (min || 1)) cards = reps;
    if (cards.length < (min || 1)) cards = pool;
    return { list: cards, defiant: defiant };
  }

  // Ordered party picker (modal) — used to challenge someone to a remote
  // duel and to accept one. onDone receives the picked mon ids, lead first.
  function pickParty(opts) {
    // opts.pool restricts the choices (e.g. a locked tournament squad of 6);
    // otherwise the trainer's whole roster is fair game. opts.level trims the
    // roster to the battle's cap (one card per line, latest legal form).
    let pool = (opts.pool && opts.pool.length) ? opts.pool.slice() : poolFor(opts.attId);
    let defiant = {};
    if (opts.level) { const cp = capPool(pool, opts.level, opts.min || 1); pool = cp.list; defiant = cp.defiant; }
    const max = opts.max || 6;
    const min = opts.min || 1;
    let picked = [];
    // Sort/filter the pool by dex number, generation and type.
    const filter = { gen: 0, type: "", desc: false };
    const grid = el("div", { class: "duel-party-grid" });
    // ⚡ Last party used (per phone, per trainer) — powers "Use last team".
    const LAST_KEY = "jasonBachHub.lastParty.v1";
    function lastParties() { try { return JSON.parse(localStorage.getItem(LAST_KEY) || "{}") || {}; } catch (_) { return {}; } }
    const cta = el("button", { class: "btn primary", onClick: () => {
      if (picked.length < min) return;
      try { const lp = lastParties(); lp[opts.attId] = picked.slice(); localStorage.setItem(LAST_KEY, JSON.stringify(lp)); } catch (_) {}
      // meta.defiant: borrowed-power picks (form never caught) → the battle
      // rolls DISOBEDIENCE on them; callers thread it into their unit.
      const defyPicked = {};
      picked.forEach((id) => { if (defiant[id]) defyPicked[id] = defiant[id]; });
      ref.close(); opts.onDone(picked.slice(), { defiant: defyPicked });
    } }, "Ready");
    function paint() {
      grid.innerHTML = "";
      const shown = (window.DexFilter ? DexFilter.apply(pool, filter) : pool.slice());
      if (!shown.length) grid.appendChild(el("div", { class: "duel-pick-empty" }, "No Pok\u00e9mon match \u2014 clear the filter."));
      shown.forEach((id) => {
        const st = statsFor(id);
        const idx = picked.indexOf(id);
        const shiny = isShinyFor(opts.attId, id);
        const src = frontSprite(id, shiny);
        grid.appendChild(el("button", { class: "duel-pick" + (idx >= 0 ? " on" : "") + (shiny ? " is-shiny" : "") + (defiant[id] ? " is-defiant" : ""),
          title: st.name + (shiny ? " \u2728 SHINY" : "") + (defiant[id] ? " \u26a0 illegal at this cap \u2014 obeys only half the time!" : ""), onClick: () => {
          const i = picked.indexOf(id);
          if (i >= 0) picked.splice(i, 1); else if (picked.length < max) picked.push(id);
          paint();
        } }, [
          src ? el("img", { src: src, alt: st.name }) : el("span", { class: "draft-thumb-ball" }),
          shiny ? el("span", { class: "duel-pick-shiny" }, "\u2728") : null,
          defiant[id] ? el("span", { class: "duel-pick-defy" }, "\u26a0") : null,
          idx >= 0 ? el("span", { class: "duel-pick-n" }, String(idx + 1)) : null,
        ]));
      });
      cta.textContent = picked.length < min
        ? "⚔ Pick " + (min - picked.length) + " more"
        : "⚔ Ready — " + (picked.length === 1 ? picked.length + " Pokémon" : "party of " + picked.length);
      cta.disabled = picked.length < min;
    }
    // ⚡ One tap re-picks the party this trainer took into their LAST battle
    // (self-explanatory, no setup) — filtered to this picker's pool and capped
    // to its size, so a saved six adapts to a 4v4. The button only exists
    // when there's usable history; a fresh trainer never sees it.
    const lastUsable = ((lastParties()[opts.attId] || []).filter((id) => pool.indexOf(id) >= 0)).slice(0, max);
    const teamBtn = lastUsable.length ? el("button", { class: "btn subtle sm", onClick: () => {
      picked = lastUsable.slice();
      paint();
    } }, "⚡ Use last team (" + lastUsable.length + ")") : null;
    // Filter bar only when there's enough to sift through (a locked squad of a
    // few doesn't need it).
    const filterBar = (pool.length > 8 && window.DexFilter) ? DexFilter.controls(filter, paint) : null;
    const body = el("div", { class: "modal-form" }, [
      opts.preview || null,
      el("p", { class: "hint" }, (opts.hint || "Tap Pokémon in order — the first is your lead.") + " Up to " + max + "."),
      filterBar,
      grid,
      Object.keys(defiant).length ? el("p", { class: "hint" },
        "⚠ ILLEGAL AT THIS CAP — you never caught its earlier forms, so it steps out in FULL form… and ignores you HALF the time. Catch the base form, or raise the cap, to command its respect.") : null,
      el("div", { class: "toolbar duel-pick-actions" }, [cta, teamBtn]),
    ]);
    paint();
    const ref = Modal.open(opts.title || "Choose your party", body, null, {});
  }

  // Lead picker — from a fixed set of ids, tap one to send out first. Returns
  // the same ids reordered with the chosen mon at the front (rest keep order).
  // Used between gauntlet battles so a one-squad run can re-lead each round.
  function pickLead(opts) {
    const ids = (opts.ids || []).slice();
    if (ids.length < 2) { opts.onDone(ids); return; }
    let ref;
    const grid = el("div", { class: "duel-lead-grid" }, ids.map((id) => {
      const st = statsFor(id);
      const shiny = isShinyFor(opts.attId, id);
      const src = frontSprite(id, shiny);
      return el("button", { class: "duel-lead-pick" + (shiny ? " is-shiny" : ""), title: st.name, onClick: () => {
        if (ref) ref.close();
        opts.onDone([id].concat(ids.filter((x) => x !== id)));
      } }, [
        src ? el("img", { src: src, alt: st.name }) : el("span", { class: "draft-thumb-ball" }),
        el("span", { class: "duel-lead-name" }, st.name),
      ]);
    }));
    const body = el("div", { class: "modal-form" }, [
      el("p", { class: "hint" }, opts.hint || "Fully healed. Tap the Pokémon to send out first — the rest wait on the bench."),
      grid,
    ]);
    ref = Modal.open(opts.title || "Choose your lead", body, null, {});
  }

  // Simple trainer picker (modal) — used to choose a double-battle partner.
  function pickTrainer(opts) {
    const skip = opts.exclude || [];
    const grid = el("div", { class: "sl-vote-grid" }, Store.state.attendees
      .filter((a) => skip.indexOf(a.id) < 0)
      .map((a) => {
        const f = Store.currentForm(a);
        const src = f.id ? Store.sprite(f.id) : "";
        return el("button", { class: "sl-vote-pick", onClick: () => { ref.close(); opts.onDone(a.id); } }, [
          src ? el("img", { class: "sl-thumb", src: src, alt: "" }) : el("span", { class: "draft-thumb-ball" }),
          el("span", { class: "sl-vote-name" }, a.name),
        ]);
      }));
    const body = el("div", { class: "modal-form" }, [
      opts.hint ? el("p", { class: "hint" }, opts.hint) : null,
      grid,
    ]);
    const ref = Modal.open(opts.title || "Pick a trainer", body, null, {});
  }

  // 🎭 Boss chatter — generic pools for AI trainers (any battle can override
  // per-boss via unit.speak / unit.ace / unit.outro). Lines are picked
  // deterministically from stable numbers so every phone shows the same one.
  const TAUNT_HALF = [
    "Hold fast! We are NOT done here!",
    "Tch… impressive. But grit wins wars!",
    "Shake it off! Show them why we came!",
    "Good… GOOD. Now it gets serious.",
  ];
  const GLOAT_KO = [
    "One down. Care to guess how this ends?",
    "Was that your best? I do hope not.",
    "You'll need far more than that.",
    "And the crowd goes quiet…",
  ];
  const ACE_LINES = [
    "…you've forced my hand. My partner. My pride. FINISH THIS!",
    "All or nothing — my ace takes the field!",
    "This is everything I have. Everything!",
  ];
  const OUTRO_LOSE = [
    "…magnificent. I haven't felt a battle like that in years.",
    "So that's the shape of your resolve. Well fought.",
    "Hmph. Go on then — the road ahead deserves you.",
  ];
  const OUTRO_WIN = [
    "Come back when your Pokémon believe in you as much as you do.",
    "A fine effort — but this summit isn't for sale.",
    "Rest, heal, return. I'll be right here.",
  ];
  function bossLine(pool, seed) { return pool[Math.abs(seed || 0) % pool.length]; }

  // ---------------- the battle itself ----------------
  function start(opts) {
    opts = opts || {};
    const mode = opts.mode || "local";
    const myClient = opts.myClient || "";
    let net = opts.net || null;
    const title = (opts.title || "Duel").trim() || "Duel";
    // 🎭 Chatter gate — GENERIC boss banter (taunts, gloats, stock ace/outro
    // lines) is seasoning for FEATURED battles only: League chambers, movie
    // bosses, legendary and secret fights. Everyday gyms, nuzlocke trainers
    // and the tower stay quiet — unless a unit brings its own scripted lines
    // (speak/ace/outro), which always play. Repetition is the enemy of cool.
    const chatty = !!(opts.league || opts.movie || opts.legend || opts.secret);

    // 🎛️ CARTRIDGE MODE — the real games' stats and damage math, hidden
    // behind a per-phone switch (cartridge-mode.js). A remote setup pins the
    // flag for BOTH phones (opts.cartridge) so the engines never disagree.
    const CART = !!(opts.cartridge != null ? opts.cartridge
      : (window.CartridgeMode && CartridgeMode.on() && window.DEX_STATS));

    function makeUnit(u) {
      // NPC units (gym leaders) have no attendee — just a name and an AI flag.
      const at = u.npc ? { name: u.npc, team: "" } : (Store.attendee(u.attId) || { name: "Trainer", team: "" });
      // 🎛️ Cartridge Mode: every AI mon fights at its CURVE level (the level
      // plan replaces boost multipliers entirely — see cartridge-mode.js).
      const cartPlan = CART && u.ai ? CartridgeMode.plan(opts, u) : null;
      const party = (u.monIds || []).map((id, i) => {
        if (!id) return null;
        let mid = id, mLvl = 0;
        if (CART) {
          mLvl = cartPlan ? cartPlan[i] : (opts.level || 50);
          // era law at ITS OWN level: a story ace steps down to the form its
          // (edged) level allows — the true-form one-shot at Lv 14 is gone.
          // 🎖 …but never past its ICONIC form (Misty's STARMIE stays).
          if (opts.level && u.ai && window.JourneyStyle) {
            mid = CartridgeMode.formFor(opts, id, mLvl, i === (u.monIds || []).length - 1);
          }
        }
        const m = statsFor(mid, CART ? mLvl : opts.level); m.hp = m.hpMax;
        // ✨ shiny is a trainer's own catch — but an NPC boss can FORCE it via
        // u.shiny (true = all, or an array of ids). Mewtwo uses this to field his
        // cloned army in their eerie shadow palette (shiny Charizard is jet-black).
        const forced = u.shiny === true || (Array.isArray(u.shiny) && u.shiny.indexOf(id) >= 0);
        // u.shinyExact pins shininess to the list alone — nuzlocke runs roll
        // their OWN shinies and must not borrow the Safari collection's.
        m.shiny = forced || (!u.shinyExact && isShinyFor(u.attId, id));   // carried into battle
        // battle EXP: KOs banked before this battle (this mon must land the
        // blow itself to earn more). Veterans hit harder: +1% attack per
        // banked KO, capped at +10% — enough to feel, not enough to trivialize
        // the bosses (the old 2%/20% made a trained team steamroll).
        const t0 = ((Store.state.pokedex || {}).trainers || {})[u.attId];
        const rec0 = (t0 && t0.caught && t0.caught[id]) || {};
        m.kos0 = rec0.kos || 0;
        m.kos = 0;
        m.atk = m.atk * (1 + Math.min(0.1, 0.01 * m.kos0));
        if (CART) {
          // 🎛️ real stats at a real level; the boost multiplier is already
          // spent (it became the level edge), only raid hpBoost survives
          const cs = CartridgeMode.statsAt(mid, mLvl);
          m.lvl = mLvl; m.cart = cs; m.spe = cs.spe;
          m.vetMul = 1 + Math.min(0.1, 0.01 * m.kos0);
          m.hpMax = cs.hp;
          if (u.hpBoost && u.hpBoost !== 1) m.hpMax = Math.round(m.hpMax * u.hpBoost);
          m.hp = m.hpMax;
        } else {
        // League-calibre foes (Elite Four/Champion/RED) hit and endure
        // harder than any gym — rank boost keeps the ladder a ladder.
        // Accepts a scalar (whole team) or an ARRAY aligned to monIds (the
        // nuzlocke split-boost: devolved fodder near-full, real ace eased).
        const bst = Array.isArray(u.boost) ? (u.boost[i] || 1) : u.boost;
        if (bst && bst !== 1) { m.atk *= bst; m.hpMax = Math.round(m.hpMax * bst); m.hp = m.hpMax; }
        // 🩸 BOSS: a raid-style extended HP pool (Safari legendary bosses) —
        // HP only, so the fight is long rather than one-shot lethal.
        if (u.hpBoost && u.hpBoost !== 1) { m.hpMax = Math.round(m.hpMax * u.hpBoost); m.hp = m.hpMax; }
        }
        m.species = m.name;
        // 🔡 A boss can field lettered Unown (u.glyphs, aligned to monIds) so a
        // swarm can spell a word — the sprite + name follow the glyph.
        if (u.glyphs && u.glyphs[i]) { m.glyph = u.glyphs[i]; m.name = "Unown " + m.glyph; m.species = m.name; }
        else if (rec0.nick) m.name = rec0.nick;     // nicknames scream in battle text
        return m;
      }).filter(Boolean);
      if (!party.length) { const m = statsFor(1); m.hp = m.hpMax; party.push(m); }
      // 🍓 one Sitrus Berry per trainer per battle, if their bag has any
      // (snapshotted at setup so every phone agrees).
      const bag = ((Store.state.pokedex || {}).trainers || {})[u.attId];
      return { attId: u.attId, client: u.client || "", name: at.name, teamId: at.team || "",
        ai: !!u.ai, boss: !!u.boss, hasBerry: !!(bag && bag.berries > 0), berryUsed: false,
        defy: u.defy || null,                          // ⚠ borrowed power: {monId: stagesOver}
        vsFace: u.vsFace || null,                      // 🎬 boss portrait for the VS intro
        // 🎭 A boss can hide its last N party mons (u.reserve) — off the ball
        // row and VS intro until they're actually sent out ("one more!"), and
        // speak lines (u.speak = {partyIdx: [lines]}) before a send-out.
        reserve: Math.max(0, Math.min(u.reserve || 0, party.length - 1)),
        speak: u.speak || null,
        ace: u.ace || null,                            // {line} for the last-mon moment
        outro: u.outro || null,                        // {win, lose} closing quotes
        gimmick: u.gimmick || null,                    // 🎪 the ace's region spectacle (z/dyna/tera/mega)
        // 🧢 a WORLD-CHAMPION script: per-party-slot transforms ({g, megaId,
        // teraType, gmax} or null, aligned to monIds) — the ultimate boss
        // doesn't share the one-spectacle rule; each phase gets its moment.
        gimmicks: u.gimmicks || null,
        party: party, cur: 0, potions: 2, courage: true, armed: false };
    }
    const sides = {
      a: { key: "a", units: ((opts.a || {}).units || []).slice(0, 2).map(makeUnit) },
      b: { key: "b", units: ((opts.b || {}).units || []).slice(0, 2).map(makeUnit) },
    };
    // SOLO double (one trainer, 2v2): both field slots draw from ONE shared
    // party — any of the four can go into either slot (just not the same mon
    // on both at once). We build the party once (slot 0's) and point slot 1 at
    // it, so switching/fainting is a single shared bench.
    // A side is shared when the setup SAYS so — or when it obviously is:
    // two slots run by the same trainer with identical team lists (a stale
    // phone's broadcast drops the flag; without this a watcher would double
    // the ball row and field the same lead in both slots).
    function looksShared(sd) {
      const us = ((opts[sd] || {}).units || []);
      if (us.length !== 2) return false;
      const same = (a, b) => (a || "") === (b || "");
      return same(us[0].attId, us[1].attId) && same(us[0].npc, us[1].npc)
        && JSON.stringify(us[0].monIds || []) === JSON.stringify(us[1].monIds || []);
    }
    ["a", "b"].forEach((sd) => {
      const us = sides[sd].units;
      us.forEach((u) => { u._side = sd; });
      if (((opts[sd] || {}).shared || looksShared(sd)) && us.length === 2) {
        us[1].party = us[0].party;               // one party, two field pointers
        us[0].cur = 0; us[1].cur = 1;
        sides[sd].shared = true;
      }
    });
    const doubles = sides.a.units.length > 1 || sides.b.units.length > 1;
    function other(s) { return s === "a" ? "b" : "a"; }
    // One trainer running both slots of a double reads as one name, not "X & X".
    function label(s) {
      const seen = [];
      sides[s].units.forEach((u) => { if (seen.indexOf(u.name) < 0) seen.push(u.name); });
      return seen.join(" & ");
    }
    function mon(u) { return u.party[u.cur]; }
    // A slot's bench = its living party members that AREN'T the slot's own
    // active and aren't currently fielded by a sibling slot sharing the party
    // (a shared-party solo double can't put the same mon in both slots).
    function bench(u) {
      const taken = {};
      sides[u._side].units.forEach((o) => { if (o !== u && o.party === u.party) taken[o.cur] = 1; });
      return u.party.map((m, i) => ({ m: m, i: i })).filter((x) => x.i !== u.cur && !taken[x.i] && x.m.hp > 0);
    }
    // A slot is "alive" (still fighting) if its active is up, or it has a
    // usable mon on the bench to send in.
    function unitAlive(u) { return mon(u).hp > 0 || bench(u).length > 0; }
    function firstLiving(s) { const us = sides[s].units; for (let i = 0; i < us.length; i++) if (unitAlive(us[i])) return i; return 0; }
    function livingEnemies(s) { return sides[other(s)].units.map((u, i) => ({ u: u, i: i })).filter((x) => unitAlive(x.u)); }

    const S = { seq: 0, queue: [], busy: false, done: false, moved: 0, pending: null, zmove: false,
      first: opts.first === "b" ? "b" : (opts.first === "a" ? "a" : null), actor: null,
      // Simultaneous turns: every active slot picks an action (an "order") without
      // seeing the others; then all orders resolve fastest-first (real-Pokémon
      // style). phase: "select" (picking) | "resolve" (playing out) | "replace"
      // (sending out fainted slots at end of turn).
      phase: "select", orders: {}, sel: [], res: [], repl: [], turnDone: null,
      megaSide: { a: false, b: false } };   // ✨ one Mega Evolution per side per battle
    if (!S.first) {
      // The faster lead goes first (real Gen-2 base Speed). Deterministic
      // tie-break (challenger first) so every phone — players, partners, and
      // watchers — agrees who leads.
      const ax = mon(sides.a.units[0]).spe, bx = mon(sides.b.units[0]).spe;
      S.first = ax >= bx ? "a" : "b";
    }
    S.actor = { side: S.first, unit: firstLiving(S.first) };
    // 🎭 Hidden reserves: how many of each side's party slots are visible on
    // the ball row right now. A hidden mon reveals itself the moment it's sent
    // out — the count ticks UP and the room goes "…it has ANOTHER one?!"
    S.reveal = {};
    ["a", "b"].forEach((sd) => {
      const total = sideMons(sd).length;
      const rsv = sides[sd].units.reduce((mx, u) => Math.max(mx, u.reserve || 0), 0);
      S.reveal[sd] = total - Math.min(rsv, Math.max(0, total - 1));
    });

    // ---- arena DOM ----
    // Perspective: each phone draws ITS OWN side at the bottom with back
    // sprites, like the real games. The battle data (sides a/b, acts) is
    // identical everywhere — only the camera flips. Watchers and hot-seat
    // screens see side a at the bottom.
    const myView = (mode === "remote"
      && sides.b.units.some((u) => u.client === myClient)
      && !sides.a.units.some((u) => u.client === myClient)) ? "b" : "a";
    function posOf(s) { return s === myView ? "you" : "foe"; }
    const sprites = {
      a: el("div", { class: "battle-sprite " + posOf("a") + (sides.a.units.length > 1 ? " doubles" : "") }),
      b: el("div", { class: "battle-sprite " + posOf("b") + (sides.b.units.length > 1 ? " doubles" : "") }),
    };
    function monImg(s, u) {
      const m = mon(u);
      const sid = m.megaId || m.id;                 // ✨ mega forms swap the sprite
      // 🔡 lettered Unown draw from the glyph sprite sheet (front only — bosses).
      const glyph = m.glyph && window.UNOWN_SPRITES && UNOWN_SPRITES[m.glyph];
      const back = (s === myView && !glyph) ? backSprite(sid, m.shiny) : "";
      const src = glyph || back || frontSprite(sid, m.shiny);
      return src
        ? el("img", { class: "battle-sprite-img", src: src, alt: "",
            style: s === myView && !back ? { transform: "scaleX(-1)" } : {} })
        : el("div", { class: "battle-ball-inner" });
    }
    function renderSprites(s) {
      const w = sprites[s]; w.innerHTML = "";
      sides[s].units.forEach((u, i) => {
        // Fainted styling follows the ACTIVE mon's HP, not unitAlive — a slot
        // whose active is down but has a bench is "alive", yet its corpse must
        // NOT pop back up when a sibling's replacement re-renders the side.
        const mw = el("div", { class: "battle-mon mon" + i + (mon(u).hp > 0 ? "" : " fainted") }, [monImg(s, u)]);
        u._monEl = mw;
        w.appendChild(mw);
      });
    }
    renderSprites("a"); renderSprites("b");

    const hpBoxes = {
      a: el("div", { class: "battle-hpbox " + posOf("a") + (sides.a.units.length > 1 ? " doubles" : "") }),
      b: el("div", { class: "battle-hpbox " + posOf("b") + (sides.b.units.length > 1 ? " doubles" : "") }),
    };
    function paintHp(u) {
      if (!u._fill) return;
      const m = mon(u), pct = Math.max(0, m.hp / m.hpMax);
      u._fill.style.width = (pct * 100).toFixed(1) + "%";
      u._fill.classList.toggle("low", pct <= 0.5 && pct > 0.2);
      u._fill.classList.toggle("crit", pct <= 0.2);
      u._num.textContent = Math.max(0, m.hp) + " / " + m.hpMax;
      if (u._faceEl) u._faceEl.classList.toggle("low", pct <= 0.35);   // the grimace
      paintStatus(u);
      paintParty(u._side);   // remaining-team balls track every faint/heal
    }
    // Every Pokémon on a side (shared-double slots point at one party, so we
    // dedupe by party reference — no double-counting).
    function sideMons(s) {
      const seen = [], out = [];
      sides[s].units.forEach((u) => { if (seen.indexOf(u.party) < 0) { seen.push(u.party); u.party.forEach((m) => out.push(m)); } });
      return out;
    }
    // 🔴 the classic party-ball row: one ball per team member, dimmed (×) once
    // it's fainted, so both trainers can see how many each has left.
    function paintParty(s) {
      const row = sides[s] && sides[s]._balls; if (!row) return;
      let mons = sideMons(s);
      // 🎭 hidden reserves stay off the row until sent out — the total grows.
      const rv = S.reveal && S.reveal[s];
      if (rv != null && rv < mons.length) mons = mons.slice(0, Math.max(1, rv));
      row.innerHTML = "";
      if (mons.length <= 1) { row.style.display = "none"; return; }
      row.style.display = "";
      const alive = mons.filter((m) => m.hp > 0).length;
      mons.forEach((m) => row.appendChild(el("div", { class: "pball" + (m.hp > 0 ? "" : " down"), title: m.name })));
      row.appendChild(el("span", { class: "pball-count" }, alive + "/" + mons.length));
    }
    // The little PAR/BRN/PSN/SLP/FRZ badge next to a mon's name.
    function paintStatus(u) {
      if (!u._statusEl) return;
      const m = mon(u), st = m.status;
      u._statusEl.textContent = st ? STATUS_TAG[st] : "";
      u._statusEl.className = "duel-status" + (st ? " st-" + st : " hidden");
    }
    function renderHp(s) {
      const box = hpBoxes[s]; box.innerHTML = "";
      const balls = el("div", { class: "battle-party" });
      sides[s]._balls = balls; box.appendChild(balls);
      sides[s].units.forEach((u) => {
        const m = mon(u);
        u._fill = el("div", { class: "battle-hp-fill" });
        u._num = el("span", { class: "duel-hp-num" });
        u._statusEl = el("span", { class: "duel-status hidden" });
        // 🎬 A boss with a portrait (vsFace) stares you down BESIDE their HP
        // bars all battle — and grimaces once their mon drops into the red.
        const faceSrc = (u.ai && u.vsFace) ? frontSprite(u.vsFace, false) : "";
        u._faceEl = faceSrc ? el("img", { class: "duel-boss-face", src: faceSrc, alt: "" }) : null;
        box.appendChild(el("div", { class: "battle-hp-mem" + (u._faceEl ? " with-face" : "") }, [
          u._faceEl,
          // opts.level: a battle-wide display level (the Nuzlocke's run cap) \u2014
          // purely cosmetic, so a fresh run reads Lv14 instead of Lv50.
          el("div", { class: "battle-hp-name" }, [(m.shiny ? "\u2728" : "") + m.name + " ", el("span", { class: "duel-lv" }, "Lv" + (opts.level || 50)),
            u.boss ? el("span", { class: "duel-boss-tag" }, "\ud83e\ude78 BOSS") : null, u._statusEl]),
          el("div", { class: "battle-hp-row" }, [
            el("span", { class: "battle-hp-lbl" }, "HP"),
            el("div", { class: "battle-hp-track" + (u.boss ? " boss" : "") }, [u._fill]),
          ]),
          el("div", { class: "duel-hp-sub" }, [u._num, el("span", { class: "duel-owner" }, u.name)]),
        ]));
        paintHp(u);
      });
      paintParty(s);
    }
    renderHp("a"); renderHp("b");

    const msg = el("div", { class: "battle-msg" }, title + " — " + label("a") + " VS " + label("b") + "!");
    const menu = el("div", { class: "battle-menu" });
    // 🌍 Dress the stage: named region (opts.env) or the FOE's element, plus a
    // matching ambient-weather layer. The foe is whichever side ISN'T my view.
    const foeLead = mon(sides[other(myView)].units[0]);
    const scene = battleScene(opts.env, (foeLead.types || [])[0]);
    const wx = opts.weather || SCENE_WX[scene] || null;
    const arena = el("div", { class: "battle-arena bg-" + scene }, [
      wx ? el("div", { class: "battle-wx wx-" + wx },
        Array.from({ length: wx === "rift" ? 14 : 24 }, () => {
          const p = el("i");
          p.style.left = (Math.random() * 100).toFixed(1) + "%";
          p.style.animationDelay = (-Math.random() * 4).toFixed(2) + "s";
          p.style.animationDuration = (2.2 + Math.random() * 2.6).toFixed(2) + "s";
          return p;
        })) : null,
      el("div", { class: "battle-platform foe" }), el("div", { class: "battle-platform you" }),
      hpBoxes[other(myView)], sprites[other(myView)], sprites[myView], hpBoxes[myView],
    ]);
    const overlay = el("div", { class: "battle" }, [arena, msg, menu]);
    // Watchers get a PERSISTENT bar — reactions were buried in the turn
    // menu (cleared during every animation, i.e. most of the battle) and
    // there was no way to leave at all.
    if (mode === "watch") {
      // one cheer per beat — a mashed button won't flood every phone's screen
      let rxLast = 0;
      overlay.appendChild(el("div", { class: "duel-watch-bar" }, [
        opts.rx ? el("div", { class: "duel-rx-bar" }, ["🔥", "👏", "😱", "💀", "👊"].map((e) =>
          el("button", { class: "duel-rx-btn", onClick: () => {
            const t = now(); if (t - rxLast < 600) return; rxLast = t;
            try { opts.rx(e); } catch (_) {}
          } }, e))) : null,
        el("button", { class: "btn subtle sm", onClick: () => close() }, "✕ Stop watching"),
      ]));
    }
    function close() {
      if (window.SFX && SFX.battleMusic) SFX.battleMusic(false);
      overlay.classList.add("out");
      setTimeout(() => overlay.remove(), 350);
      // release the page-scroll lock unless another battle screen is still up
      if (document.querySelectorAll(".battle").length <= 1)
        document.documentElement.classList.remove("scroll-lock");
      if (opts.onEnd) try { opts.onEnd(); } catch (_) {}
    }

    // Type-colored impact burst on the defender (+ a screen shake on crits).
    function spawnHit(monEl, color, crit) {
      const fx = el("div", { class: "duel-hit", style: { "--hc": color } }, [el("b")]);
      for (let i = 0; i < 8; i++) {
        const p = el("i");
        const ang = (Math.PI * 2 * i) / 8 + Math.random() * 0.6;
        const d = 32 + Math.random() * 28;
        p.style.setProperty("--dx", (Math.cos(ang) * d).toFixed(0) + "px");
        p.style.setProperty("--dy", (Math.sin(ang) * d).toFixed(0) + "px");
        fx.appendChild(p);
      }
      monEl.appendChild(fx);
      setTimeout(() => fx.remove(), 700);
      if (crit) { overlay.classList.add("shake"); setTimeout(() => overlay.classList.remove("shake"), 450); }
    }

    // 💥 Floating damage number — rises off the struck mon, colored by weight:
    // yellow for crits, red for super-effective, grey for resisted.
    function floatDmg(monEl, dmg, crit, eff) {
      if (!monEl || !dmg) return;
      const tone = crit ? " crit" : (eff > 1 ? " weak" : (eff > 0 && eff < 1 ? " resist" : ""));
      const n = el("div", { class: "duel-dmg" + tone }, "−" + dmg + (crit ? "!" : ""));
      n.style.left = (28 + Math.random() * 40).toFixed(0) + "%";
      monEl.appendChild(n);
      setTimeout(() => n.remove(), 2000);
    }
    // 🩸 Drain the HP readout DOWN to its new value instead of snapping — the
    // fill bar already CSS-eases its width; here we tick the number to match so
    // the two move together and every hit reads as a real chunk taken.
    function drainHp(u, fromHp) {
      if (!u || !u._num) { if (u) paintHp(u); return; }
      const m = mon(u), to = Math.max(0, m.hp), from = Math.max(to, fromHp | 0);
      paintHp(u);                                  // fill width + low/crit + party balls
      if (from === to) return;
      u._num.textContent = from + " / " + m.hpMax; // start at the OLD value…
      const dur = 520; let t0 = 0;
      requestAnimationFrame(function tick(ts) {     // …then tick down to the new
        if (!t0) t0 = ts;
        const k = Math.min(1, (ts - t0) / dur);
        u._num.textContent = Math.round(from + (to - from) * k) + " / " + m.hpMax;
        if (k < 1 && mon(u) === m) requestAnimationFrame(tick);
      });
    }

    // Spectator reactions — everyone's taps float up on every screen.
    let rxSeen = -1;
    function spawnRx(item) {
      // a mash of cheers stays a cheer, not a blizzard — cap the floats
      const up = arena.querySelectorAll(".duel-rx");
      if (up.length >= 10) up[0].remove();
      const n = el("div", { class: "duel-rx" }, [
        el("span", { class: "duel-rx-e" }, item.e || "🔥"),
        item.by ? el("span", { class: "duel-rx-by" }, item.by) : null,
      ]);
      n.style.left = (8 + Math.random() * 74).toFixed(0) + "%";
      arena.appendChild(n);
      setTimeout(() => n.remove(), 2400);
    }
    function receiveRx(list) {
      list = list || [];
      if (rxSeen < 0) { rxSeen = list.length; return; }   // don't replay history on join
      for (let i = rxSeen; i < list.length; i++) spawnRx(list[i]);
      rxSeen = Math.max(rxSeen, list.length);
    }

    // Broadcast local battles turn-by-turn when the room is live: the full
    // setup + every act goes out on the duel channel (the same plumbing
    // remote duels use), so any phone can WATCH move-by-move and cheer —
    // gym runs and League climbs become room events. The banner channel
    // still announces it (Watch alert + the Home LIVE strip), carrying the
    // stakes so the room knows a badge or a crown is on the line.
    // remoteId: for a duel played across phones, the shared battle/duel id
    // (passed in by app.js) so this screen finishes the RIGHT battle doc.
    const remoteId = opts.duelId || null;
    let liveLocal = false, castId = null, castUnsub = null, liveId = null;
    if (mode === "local" && opts.broadcast !== false && window.Sync && Sync.isLive && Sync.isLive()) {
      liveLocal = true;
      try {
        const lg = opts.league;
        const stakes = opts.gym ? "🏅 " + ((opts.gym.badge || "Gym") + " Badge") + " on the line"
          : lg ? (lg.key === "red" ? "🗻 Mt. Silver — facing RED" : "👑 " + ((lg.rank || "League") + " " + (lg.name || "")).trim())
          : opts.hof ? "🏛 Battle of Fame" : "";
        // `shared` MUST travel with the setup: without it a watcher rebuilds a
        // shared-party double (Battle Tower) as two separate 4-mon parties —
        // 8 party balls and the same lead mon standing in both field slots.
        const setup = { mode: "local", title: title, first: S.first,
          level: opts.level || null,   // battle-wide level: Lv tags + moveset caps must match on watchers
          gims: opts.gims || null,     // 🏟 gimmick ruleset rides along (cups, custom friendlies)
          cartridge: CART,             // 🎛️ both phones must run the SAME engine
          gym: opts.gym || null, league: lg || null, hof: opts.hof || null,
          a: { shared: !!(opts.a || {}).shared, units: ((opts.a || {}).units || []) },
          b: { shared: !!(opts.b || {}).shared, units: ((opts.b || {}).units || []) } };
        castId = Sync.startRemoteDuel && Sync.startRemoteDuel(setup);
        if (castId) {
          net = { send: function (act) { try { Sync.sendDuelAct(castId, act); } catch (_) {} } };
          castUnsub = Sync.onDuel(function (d) { if (d && d.id === castId) receiveRx(d.rx || []); });
        }
        // Give the banner the SAME id as the duel doc so watchers link the two.
        liveId = Sync.startLiveBattle({ id: castId || undefined, aName: label("a"), bName: label("b"), event: title,
          aClient: Sync.myClientId(), mode: castId ? "duel-remote" : "duel", stakes: stakes });
      } catch (_) {}
    }

    function beats(steps, fin) {
      let i = 0;
      (function next() {
        if (i >= steps.length) { if (fin) fin(); return; }
        const s = steps[i++];
        if (s[0] != null) msg.textContent = s[0];
        if (s[2]) s[2]();
        setTimeout(next, s[1]);
      })();
    }

    // 💬 Trainer lines ALSO pop as a speech bubble by their Pokémon — the
    // beat bar moves fast, the bubble lingers so the trash talk lands.
    function sayBubble(u, text) {
      try {
        const host = u && u._monEl;
        if (!host || !document.body.contains(host)) return;
        const old = host.querySelector(".duel-bubble"); if (old) old.remove();
        const b = el("div", { class: "duel-bubble" }, text);
        host.appendChild(b);
        setTimeout(() => { b.classList.add("fade"); setTimeout(() => { try { b.remove(); } catch (_) {} }, 600); }, 4200);
      } catch (_) {}
    }

    // ---- act plumbing: every decision is a small serializable act ----
    function sendAct(act) {
      act.by = myClient || "local";
      if (net) try { net.send(act); } catch (_) {}
      enqueue(act);
    }
    function enqueue(act) {
      if (!act || typeof act.seq !== "number") return;
      if (act.seq <= S.seq) return;                                   // already applied (echo)
      if (S.queue.some((q) => q.seq === act.seq)) return;
      S.queue.push(act);
      S.queue.sort((x, y) => x.seq - y.seq);
      pump();
    }
    function receiveActs(acts) { (acts || []).forEach(enqueue); }
    function pump() {
      if (!S.ready || S.busy || S.done || !S.queue.length) return;
      if (S.queue[0].seq !== S.seq + 1) return;                        // wait for the gap to fill
      const act = S.queue.shift();
      const instant = S.queue.length > 0;                              // catching up — skip anims
      S.busy = true;
      S.seq = act.seq;
      applyAct(act, instant, () => { S.busy = false; pump(); });
    }

    // ---- selection phase: prompt each living slot for its action ----
    // Slots are prompted one at a time over the synced act stream (fast side
    // first) so seq stays monotonic — but a chosen action is only RECORDED,
    // not played out, and nobody sees the others' picks until they resolve.
    function beginSelect() {
      if (S.done) return;
      S.phase = "select"; S.orders = {}; S.pending = null; S.zmove = false; S.res = []; S.repl = [];
      S.sel = [];
      // Flinch is volatile — it only lasts the turn it was inflicted.
      ["a", "b"].forEach((sd) => sides[sd].units.forEach((u) => { if (mon(u)) mon(u)._flinch = false; }));
      [S.first, other(S.first)].forEach((sd) => sides[sd].units.forEach((u, i) => { if (unitAlive(u)) S.sel.push({ side: sd, unit: i }); }));
      if (!S.sel.length) return;
      S.actor = S.sel[0];
      renderMenu();
    }
    // During selection, move to the next slot that still needs to choose.
    // (Resolution and replacement drive themselves; advance is a no-op there.)
    function advance() {
      if (S.phase !== "select") return;
      if (S.sel.length) { S.actor = S.sel[0]; renderMenu(); }
    }

    // ---- resolution phase: play out every order, fastest first ----
    function beginResolve() {
      S.phase = "resolve";
      const list = [];
      Object.keys(S.orders).forEach((k) => {
        const i = k.indexOf(":"); const side = k.slice(0, i), unit = +k.slice(i + 1);
        list.push(Object.assign({ side: side, unit: unit }, S.orders[k]));
      });
      // Switches go first, then potions, then attacks by PRIORITY, then Speed
      // (desc). Ties break deterministically (side, then slot) so every phone
      // resolves identically. Speed is the effective value (para-halved, stage).
      const rank = (o) => o.kind === "ball" ? 0 : o.kind === "switch" ? 1 : o.kind === "potion" ? 2 : 3;
      list.sort((a, b) => {
        if (rank(a) !== rank(b)) return rank(a) - rank(b);
        const pa = a.pri || 0, pb = b.pri || 0;
        if (pa !== pb) return pb - pa;                  // higher priority moves first
        const sa = effSpeed(mon(sides[a.side].units[a.unit])), sb = effSpeed(mon(sides[b.side].units[b.unit]));
        if (sa !== sb) return sb - sa;
        if (a.side !== b.side) return a.side < b.side ? -1 : 1;
        return a.unit - b.unit;
      });
      S.res = list;
      resolveNext();
    }
    function resolveNext() {
      if (S.done) return;
      const o = S.res.shift();
      if (!o) { endResidual(); return; }               // → chip damage, then end of turn
      const u = sides[o.side].units[o.unit];
      if (mon(u).hp <= 0) { resolveNext(); return; }   // fainted before it could act → skip
      if (o.kind === "ball") return resolveBall(o, u);
      if (o.kind === "switch") return resolveSwitch(o, u);
      if (o.kind === "potion") return resolvePotion(o, u);
      return resolveMove(o, u);   // status act-checks live inside resolveMove now
    }
    function resolveSwitch(o, u) {
      if (!bench(u).some((x) => x.i === o.to)) { resolveNext(); return; }   // no longer valid
      const old = mon(u).name; switchIn(u, o.to); S.moved++;
      renderSprites(o.side); renderHp(o.side); menu.innerHTML = "";
      beats([[u.name + " withdrew " + old + " — go, " + mon(u).name + "!", 1100, () => sfx("blip")]], resolveNext);
    }
    // Reset a switched-in mon's volatile battle state (stat stages, flinch,
    // Leech Seed) — the major status (par/brn/psn) rides along, cartridge-style.
    function switchIn(u, to) {
      // 🔴 a Dynamaxed mon that leaves the field reverts immediately
      const out = mon(u);
      if (out && out._dyna) {
        const ratio = out.hpMax ? out.hp / out.hpMax : 1;
        out.hpMax = out._dynaBase || out.hpMax;
        out.hp = Math.max(1, Math.round(out.hpMax * ratio));
        out._dyna = 0; out._dynaBase = 0;
      }
      if (u._monEl) u._monEl.classList.remove("dyna", "tera", "z-charge");
      u.cur = to;
      const m = mon(u);
      m.stg = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0 };
      m._flinch = false; m.seeded = false; m._recharge = false; m._charging = null; m._invuln = false; m._confN = 0;
    }
    // 🔴 Wild battles: a thrown ball spends the turn. Catch odds come from the
    // wild mon's REMAINING HP via opts.wild.chanceFn — weaken it for a better
    // shot, but a KO loses it. Shared with the Throw button label so the
    // trainer always sees the live % BEFORE they commit the turn.
    function ballChance(wm) {
      const frac = Math.max(0, wm.hp / wm.hpMax);
      return Math.max(0.03, Math.min(1, (opts.wild && opts.wild.chanceFn) ? opts.wild.chanceFn(frac) : (0.3 + (1 - frac) * 0.5)));
    }
    // The roll was baked at pick time (deterministic across phones). The throw
    // plays out ON the wild mon's sprite: sucked into a ball that wobbles per
    // shake, then clicks shut (caught) or bursts back open (broke free).
    function resolveBall(o, u) {
      S.moved++;
      const foe = sides[other(o.side)].units[0];
      const wm = mon(foe);
      const chance = ballChance(wm);
      const caught = (o.roll != null ? o.roll : 1) < chance;
      menu.innerHTML = "";
      const img = foe._monEl && foe._monEl.querySelector(".battle-sprite-img");
      const ballEl = el("div", { class: "duel-catch-ball" });
      // A catch always rocks 3 times then clicks; a miss breaks out after 1–2.
      const shakes = caught ? 3 : 1 + (Math.floor((o.roll || 0) * 977) % 2);
      const steps = [["🔴 " + u.name + " threw a Poké Ball! (" + Math.round(chance * 100) + "%)", 950, () => {
        sfx("select");
        if (foe._monEl) foe._monEl.appendChild(ballEl);
        if (img) img.classList.add("captured");
      }]];
      for (let i = 0; i < shakes; i++) steps.push(["…shake " + (i + 1) + "…", 800, () => {
        ballEl.classList.remove("wobble"); void ballEl.offsetWidth; ballEl.classList.add("wobble");
        sfx("blip");
      }]);
      if (caught) {
        S.done = true;
        steps.push(["✨ Click! GOTCHA — " + wm.species + " was caught!", 1500, () => { ballEl.classList.remove("wobble"); ballEl.classList.add("click"); sfx("fanfare"); }]);
        beats(steps, () => { close(); try { if (opts.wild && opts.wild.onOutcome) opts.wild.onOutcome("caught", faintedOwnIds()); } catch (_) {} });
        return;
      }
      steps.push(["💨 " + wm.species + " broke free! (weaken it for a better shot)", 1200, () => {
        ballEl.classList.remove("wobble"); ballEl.classList.add("open");
        if (img) img.classList.remove("captured");
        setTimeout(() => ballEl.remove(), 600);
        sfx("error");
      }]);
      beats(steps, resolveNext);
    }
    // Which of side a's own mons are down — Nuzlocke deaths / wild-battle report.
    function faintedOwnIds() {
      const seen = [], out = [];
      sides.a.units.forEach((u) => {
        if (seen.indexOf(u.party) >= 0) return; seen.push(u.party);
        u.party.forEach((m) => { if (m.hp <= 0) out.push(m.id); });
      });
      return out;
    }
    function resolvePotion(o, u) {
      u.potions = Math.max(0, u.potions - 1); S.moved++;
      const m = mon(u); m.hp = Math.min(m.hpMax, m.hp + 120); paintHp(u); menu.innerHTML = "";
      beats([["🧪 " + u.name + " uses a Potion — " + m.name + " regained health! (+120 HP)", 1200, () => sfx("coin")]], resolveNext);
    }
    // Status is checked HERE, at resolution — so a status just inflicted by a
    // faster foe already stops this mon THIS turn (not just next turn). The
    // para/thaw dice were baked into the order (o.statusRoll) at pick time, so
    // every phone reaches the same verdict; sleep counts down deterministically.
    function resolveMove(o, u) {
      const m = mon(u);
      // If a mid-charge mon (Dig/Fly…) is about to be stopped cold this turn,
      // the charge is disrupted — cancel it so it can't stay stuck underground
      // (semi-invulnerable) forever. (It still completes normally on a wake/thaw.)
      if (m._charging) {
        const slpBlock = m.status === "slp" && (m.slp || 0) > 1;
        const frzBlock = m.status === "frz" && (o.statusRoll || 0) >= 0.2;
        const parBlock = m.status === "par" && (o.statusRoll || 0) < 0.25;
        if (m._recharge || slpBlock || frzBlock || parBlock || m._flinch) { m._charging = null; m._invuln = false; }
      }
      // Recharge (Hyper Beam / Giga Impact…): the turn AFTER the blast is spent
      // catching your breath — no attack lands.
      if (m._recharge) {
        m._recharge = false; menu.innerHTML = "";
        beats([[m.name + " must recharge!", 1050, () => sfx("error")]], resolveNext); return;
      }
      if (m.status === "slp") {
        if ((m.slp || 0) > 1) { m.slp -= 1; menu.innerHTML = "";
          beats([[m.name + " is fast asleep…", 1050, () => sfx("error")]], resolveNext); return; }
        m.status = null; m.slp = 0; paintStatus(u); menu.innerHTML = "";
        beats([[m.name + " woke up!", 950, () => sfx("blip")]], () => resolveMoveGo(o, u)); return;
      }
      if (m.status === "frz") {
        if ((o.statusRoll || 0) < 0.2) { m.status = null; paintStatus(u); menu.innerHTML = "";
          beats([[m.name + " thawed out!", 950, () => sfx("blip")]], () => resolveMoveGo(o, u)); return; }
        menu.innerHTML = "";
        beats([[m.name + " is frozen solid!", 1050, () => sfx("error")]], resolveNext); return;
      }
      if (m.status === "par" && (o.statusRoll || 0) < 0.25) {
        menu.innerHTML = "";
        beats([[m.name + " is paralyzed! It can't move!", 1050, () => sfx("error")]], resolveNext); return;
      }
      // Flinched by a faster foe's move earlier this turn → lose the turn.
      if (m._flinch) { m._flinch = false; menu.innerHTML = "";
        beats([[m.name + " flinched and couldn't move!", 1000, () => sfx("error")]], resolveNext); return; }
      // 💫 Confusion: counts down per ACTION. Snap out at zero; otherwise the
      // baked coin-toss decides — heads it acts, tails it decks itself with a
      // typeless 40-power hit (own attack vs own defense, cartridge-style).
      if (o.conf && (m._confN || 0) > 0) {
        m._confN = Math.max(0, m._confN - 1);
        if (m._confN <= 0) {
          menu.innerHTML = "";
          beats([["💫 " + m.name + " snapped out of confusion!", 950, () => sfx("blip")]], () => resolveMoveGo(o, u));
          return;
        }
        if (o.conf.self) {
          const d = Math.max(1, Math.round(o.conf.dmg / stageMul(m.stg ? m.stg.def : 0)));
          menu.innerHTML = "";
          beats([
            ["💫 " + m.name + " is confused!", 900, () => sfx("error")],
            ["It hurt itself in its confusion! (−" + d + " HP)", 1150, () => {
              m.hp = Math.max(0, m.hp - d); paintHp(u);
              if (m.hp <= 0 && u._monEl) u._monEl.classList.add("fainted");
              sfx("error");
            }],
          ], resolveNext);
          return;
        }
        menu.innerHTML = "";
        beats([["💫 " + m.name + " is confused!", 900, () => sfx("blip")]], () => {
          if (o.loaf) { resolveMove(Object.assign({}, o, { conf: null }), u); return; }   // still might loaf
          resolveMoveGo(o, u);
        });
        return;
      }
      // ⚠ Borrowed power throws its tantrum: the form was never caught, and
      // right now it doesn't feel like listening. Line picked off the baked
      // statusRoll so every watching phone reads the same insubordination.
      if (o.loaf) {
        const LOAF = [" is loafing around!", " turned away and ignored orders!", " pretended not to hear!", " yawned and did nothing!", " won't obey!"];
        menu.innerHTML = "";
        beats([["⚠ " + m.name + LOAF[Math.floor((o.statusRoll || 0) * LOAF.length) % LOAF.length], 1200, () => sfx("error")]], resolveNext);
        return;
      }
      resolveMoveGo(o, u);
    }
    // The actual move execution (targeting, damage, effects) once the mon is
    // clear to act.
    function resolveMoveGo(o, u) {
      const m = mon(u);
      const mv = o.move === 99 ? STRUGGLE : (m.moves[o.move] || m.moves[0]);
      // Two-turn charge move: turn 1 charges (Dig/Fly/Phantom Force also go
      // semi-invulnerable), turn 2 strikes. On the charge turn we bank the move
      // and stop here; next turn the mon is forced to complete it.
      if (mv.charge && !m._charging) {
        m._charging = { move: o.move }; m._invuln = !!mv.charge.invuln;
        menu.innerHTML = "";
        const cs = [[m.name + " " + mv.charge.msg, 1050, () => sfx("blip")]];
        if (mv.charge.stat) cs.push([applyStage(m, mv.charge.stat.stat, mv.charge.stat.stg), 850, () => sfx("blip")]);
        beats(cs, resolveNext); return;
      }
      if (mv.charge && m._charging) { m._charging = null; m._invuln = false; }   // emerge and strike
      const isStatus = mv.cat === "status";
      const dSide = other(o.side);
      let tUnit = o.tUnit, tu = sides[dSide].units[tUnit];
      if (!tu || mon(tu).hp <= 0) {                    // chosen target fainted → re-target
        // Re-target needs a mon actually STANDING on the field — a slot whose
        // active fainted this turn still counts as "alive" via its bench, but
        // there's nothing there to hit until it sends the replacement out.
        // (This is the spread double-KO case: both foes drop at once, and the
        // slower attacker's queued move must fizzle, not punch a corpse.)
        const standing = sides[dSide].units.map((fu, i) => ({ fu: fu, i: i })).filter((x) => mon(x.fu).hp > 0);
        if (!isStatus) {
          if (!standing.length) {                      // no one left on the field
            menu.innerHTML = "";
            beats([[m.name + " has no target left…", 900, () => sfx("error")]], resolveNext);
            return;
          }
          tUnit = standing[0].i; tu = sides[dSide].units[tUnit];
        }
      }
      const tm = tu ? mon(tu) : null;
      // Type effect is computed now against the ACTUAL target (re-target safe);
      // stat-stage and burn modifiers use current battle state (deterministic).
      const eff = tm ? effFor(mv.type, tm.types, mv) : 1;
      const immune = eff === 0;
      // A semi-invulnerable target (mid-Dig/Fly/Phantom Force) can't be hit —
      // by damaging moves OR foe-targeting status moves (Thunder Wave, Toxic,
      // Leech Seed…). The foe's own self-buffs still go through (they don't
      // touch the buried mon).
      const fx0 = mv.fx;
      const foeAimed = !isStatus || (fx0 && (fx0.status || fx0.seed || fx0.flinch || fx0.confuse != null || (fx0.stat && fx0.stat.who === "foe")));
      const avoided = tm && tm._invuln && foeAimed;
      const miss = immune ? false : (o.miss || !!avoided);
      // Spread moves (Surf, Earthquake, Discharge…) splash EVERY other fielded
      // foe in a double battle. Each hit is dialed to 75% when 2+ are struck —
      // the classic all-adjacent penalty.
      const dUnits = sides[dSide].units;
      let spreadFoes = [];
      if (!isStatus && !miss && mv.spread && dUnits.length > 1) {
        spreadFoes = dUnits.map((fu, i) => ({ fu: fu, i: i })).filter((x) => x.i !== tUnit && mon(x.fu).hp > 0 && !mon(x.fu)._invuln);
      }
      const spreadMult = spreadFoes.length ? 0.75 : 1;
      // Damage for one target: base × type × stat-stages × burn × (spread penalty).
      const dmgFor = (target, teff) => {
        if (teff === 0) return 0;
        const off = mv.cat === "spec" ? "spa" : "atk";
        const def = mv.cat === "spec" ? "spd" : "def";
        // 🎛️ CARTRIDGE MODE: the real formula — level term, true Atk/Def
        // division, full 1.5 STAB (2.0 tera-on-own-type), the same roll and
        // crit the order baked. Stages scale the STATS, cartridge-style.
        if (CART) {
          const tm2 = mon(target);
          const spec = mv.cat === "spec";
          const ca = m.cart || CartridgeMode.statsAt(m.id || 1, m.lvl || 50);
          const cd = tm2.cart || CartridgeMode.statsAt(tm2.id || 1, tm2.lvl || 50);
          let A = (spec ? ca.spa : ca.atk) * stageMul(m.stg[off]);
          if (+m.id === 10094) A *= 2;               // ⚡ the Light Ball, canon: both categories
          const D = Math.max(1, (spec ? cd.spd : cd.def) * stageMul(tm2.stg[def]));
          const burn = (mv.cat === "phys" && m.status === "brn") ? 0.5 : 1;
          const orig = m._teraBase || m.types || [];
          const own = orig.indexOf(mv.type) >= 0;
          const stab = (m._tera && m._tera === mv.type) ? (own ? 2 : 1.5) : (own ? 1.5 : 1);
          const raw = Math.floor(Math.floor(Math.floor(2 * (m.lvl || 50) / 5 + 2) * mv.pow * A / D) / 50) + 2;
          return Math.max(1, Math.round(raw * teff * (o.crit ? 1.5 : 1) * (o.zed ? 1.8 : 1)
            * (o.roll || 0.92) * stab * burn * spreadMult * (m.vetMul || 1)));
        }
        const statMod = stageMul(m.stg[off]) / stageMul(mon(target).stg[def]);
        const burnMod = (mv.cat === "phys" && m.status === "brn") ? 0.5 : 1;
        // 🎯 STAB: a move of the attacker's OWN element hits ×1.2 — read off
        // the LIVE types so a Mega's new typing counts. Kept below the
        // cartridge 1.5 to preserve the 3-4-hit rhythm. 💎 A TERASTALLIZED
        // mon's tera-type moves hit the full cartridge ×1.5 — and its
        // ORIGINAL types keep the 1.2 (cartridge-true), so an off-type tera
        // is a new weapon, never an offensive downgrade.
        const stabMod = (m._tera && m._tera === mv.type) ? 1.5
          : ((m.types || []).indexOf(mv.type) >= 0
             || (m._teraBase && m._teraBase.indexOf(mv.type) >= 0)) ? 1.2 : 1;
        // ⚖️ the DEFENDER's lean: a special wall shrugs this if it's special,
        // a physical wall if it's physical (attacker's tilt is baked in base)
        const out = Math.max(1, Math.round(o.base * teff * statMod * burnMod * stabMod * spreadMult * defTilt(mon(target), mv)));
        // 🎛️ Cartridge shadow rides along, observation only — it records what
        // the real games' formula would deal; the live number is untouched.
        if (window.CartridgeShadow) try {
          CartridgeShadow.onHit({ att: m, def: mon(target), mv: mv, eff: teff, crit: o.crit,
            zed: o.zed, base: o.base, spread: spreadMult, dmg: out, level: opts.level || 0 });
        } catch (_) {}
        return out;
      };
      let dmg = 0;
      if (!miss && !immune && !isStatus && tm) dmg = dmgFor(tu, eff);
      const spread = spreadFoes.map((x) => {
        const teff = effFor(mv.type, mon(x.fu).types, mv);
        return { tUnit: x.i, eff: teff, dmg: dmgFor(x.fu, teff) };
      });
      applyMove({ kind: "move", side: o.side, unit: o.unit, move: o.move, tUnit: tUnit,
        miss: miss, avoided: !!avoided, crit: o.crit, armed: o.armed, courage: o.courage, eff: eff, dmg: dmg,
        cat: mv.cat, mvType: mv.type, fx: mv.fx, fxHit: o.fxHit, slpTurns: o.slpTurns, by: o.by,
        spread: spread, recharge: mv.recharge, zed: o.zed },
        u, false, resolveNext);
    }

    // ---- residual (end-of-turn): burn/poison chip + Leech Seed drain, in a
    // fixed slot order so every phone agrees, then the end-of-turn wrap-up. ----
    function endResidual() {
      if (S.done) return;
      const steps = [];
      const chip = (m, kind) => Math.max(1, Math.round(m.hpMax / (RESIDUAL_DIV[kind] || RESIDUAL_DIV.seed)));
      // 🔴 Dynamax winds down: 3 turns of towering, then back to size (HP
      // ratio preserved — a healthy giant shrinks into a healthy mon).
      ["a", "b"].forEach((sd) => sides[sd].units.forEach((u) => {
        const m = mon(u);
        if (!m._dyna || m.hp <= 0) return;
        m._dyna -= 1;
        if (m._dyna > 0) return;
        steps.push(["🔴 " + m.name + " returned to normal size.", 900, () => {
          const ratio = m.hpMax ? m.hp / m.hpMax : 1;
          m.hpMax = m._dynaBase || m.hpMax;
          m.hp = Math.max(1, Math.round(m.hpMax * ratio));
          m._dynaBase = 0;
          if (u._monEl) u._monEl.classList.remove("dyna");
          paintHp(u);
        }]);
      }));
      ["a", "b"].forEach((sd) => sides[sd].units.forEach((u) => {
        const m = mon(u);
        if (m.hp <= 0) return;
        if (m.status === "brn" || m.status === "psn") {
          // Burn chips gently (1/16) — it ALSO halves physical attack, so a
          // 1/8 bite on top was punishing twice. Poison bites harder (1/10)
          // but no longer melts a mon in five turns.
          const d = chip(m, m.status);
          steps.push([(m.status === "brn" ? "🔥 " : "☠️ ") + m.name + (m.status === "brn" ? " is hurt by its burn!" : " is hurt by poison!") + " (−" + d + " HP)", 1000, () => {
            m.hp = Math.max(0, m.hp - d); paintHp(u); if (m.hp <= 0 && u._monEl) u._monEl.classList.add("fainted"); sfx("error");
          }]);
        }
        if (m.seeded) {
          const d = chip(m);
          steps.push(["🌱 " + m.name + "'s health is sapped by Leech Seed! (−" + d + " HP)", 1000, () => {
            m.hp = Math.max(0, m.hp - d);
            const foe = (livingEnemies(u._side)[0] || {}).u;
            // the seed can only feed a mon still STANDING — a seeder that
            // fainted this turn (awaiting its replacement) must never be
            // revived by its own seed (nuzlocke deaths are forever)
            if (foe) { const fm = mon(foe); if (fm.hp > 0) { fm.hp = Math.min(fm.hpMax, fm.hp + d); paintHp(foe); } }
            paintHp(u); if (m.hp <= 0 && u._monEl) u._monEl.classList.add("fainted"); sfx("coin");
          }]);
        }
      }));
      const doneResidual = () => {
        // Attribute the recorded win to the WINNER's controlling phone so
        // exactly one screen logs it (act.by === myClient), same as a KO move.
        if (!sides.a.units.some(unitAlive)) { finish("b", { by: sides.b.units[0].client }, "faint", false, function () {}); return; }
        if (!sides.b.units.some(unitAlive)) { finish("a", { by: sides.a.units[0].client }, "faint", false, function () {}); return; }
        endTurn();
      };
      if (!steps.length) { doneResidual(); return; }
      menu.innerHTML = "";
      beats(steps, doneResidual);
    }

    // ---- end of turn: send out any fainted slots, then next turn ----
    function endTurn() {
      if (S.done) return;
      S.repl = [];
      ["a", "b"].forEach((sd) => sides[sd].units.forEach((u, i) => {
        if (mon(u).hp <= 0 && bench(u).length > 0) S.repl.push({ side: sd, unit: i });
      }));
      promptReplace();
      // Release the turn lock and re-pump: orders/replacements that arrived from
      // another phone DURING this turn's resolution now apply against the new
      // turn's state (this is what un-sticks "waiting for the other trainer").
      const d = S.turnDone; S.turnDone = null; if (d) d();
    }
    function promptReplace() {
      if (S.done) return;
      // A queued slot only still needs replacing if it's actually down AND has
      // a living bench mon to send. In a shared-party double, both slots can
      // faint the same turn and each gets queued — but filling the first slot
      // claims the last shared bench mon, leaving its sibling with nothing.
      // That field position just stays empty (play down a mon) instead of
      // hanging forever on "picking a new Pokémon."
      while (S.repl.length) {
        const r = S.repl[0];
        const u = sides[r.side].units[r.unit];
        if (mon(u).hp > 0 || bench(u).length === 0) { S.repl.shift(); continue; }
        S.phase = "replace";
        S.pending = r; S.actor = r;
        renderMenu();
        return;
      }
      S.pending = null;
      beginSelect();
    }

    function applyAct(act, instant, done) {
      const u = sides[act.side].units[act.unit];
      // An "order" is a slot's chosen action — recorded, not yet played out.
      // When the last living slot has ordered, the whole turn resolves by Speed.
      if (act.kind === "order") {
        S.orders[act.side + ":" + act.unit] = act.order;
        S.sel = S.sel.filter((s) => !(s.side === act.side && s.unit === act.unit));
        if (S.sel.length) { S.actor = S.sel[0]; renderMenu(); done(); }
        // Last pick in → HOLD the pump lock (don't call done) so a faster
        // phone's next-turn order can't interleave with this turn's animated
        // resolution; it's released + the queue re-pumped once the turn ends.
        else { S.turnDone = done; beginResolve(); }
        return;
      }
      // End-of-turn replacement of a fainted slot. Hold the lock through the
      // send-out animation; release + re-pump only after the next slot/turn is
      // set up (so queued next-turn orders apply against fresh state).
      if (act.kind === "next") {
        u.cur = act.to; S.moved++;
        // 🎭 sending out a hidden reserve reveals it — the ball row grows.
        const surprise = S.reveal && act.to >= (S.reveal[act.side] || 0);
        if (surprise) S.reveal[act.side] = act.to + 1;
        const fin = () => {
          S.repl = S.repl.filter((s) => !(s.side === act.side && s.unit === act.unit));
          promptReplace(); done();
        };
        if (instant) { renderSprites(act.side); renderHp(act.side); fin(); return; }
        menu.innerHTML = "";
        // The trainer gets their line BEFORE the reveal (Volo's Giratina moment),
        // then the sprite appears with the classic send-out beat.
        const talk = (u.speak && u.speak[act.to]) || null;
        const talkBeats = talk ? talk.map((ln) => ["🗣 " + u.name + ": “" + ln + "”", 2200, () => { sfx("select"); sayBubble(u, ln); }]) : [];
        // 🎭 THE ACE MOMENT — an AI boss down to their very last: a line (custom
        // ace.line, or a generic; a scripted speak reveal already covers it),
        // the screen flashes, and the ace digs deep (+8% attack).
        const aceMon = mon(u);
        const isAce = u.ai && !opts.wild && u.party.length >= 3 && u.party.filter((x) => x.hp > 0).length === 1;
        // Custom ace lines always play; the GENERIC pool is featured-only.
        if (isAce && !talk && ((u.ace && u.ace.line) || chatty)) { const aln = (u.ace && u.ace.line) || bossLine(ACE_LINES, aceMon.id); talkBeats.push(["🗣 " + u.name + ": “" + aln + "”", 2200, () => { sfx("select"); sayBubble(u, aln); }]); }
        beats(talkBeats, () => {
          renderSprites(act.side); renderHp(act.side);
          const sendBeats = [[u.name + " sent out " + mon(u).name + "!" + (surprise ? " …ANOTHER one?!" : ""), 1100, () => sfx(surprise ? "fanfare" : "blip")]];
          // Pure theater: the flash and the line, but NO stat surge — final
          // mons don't get mechanically stronger (cut by request).
          if (isAce) sendBeats.push(["⚡ " + aceMon.name + " is giving it everything!", 1200, () => {
            overlay.classList.add("ace-flash");
            setTimeout(() => overlay.classList.remove("ace-flash"), 1300);
            sfx("fanfare");
          }]);
          beats(sendBeats, fin);
        });
        return;
      }
      // 🎪 A player-fired transform, synced through the act stream so every
      // phone — the opponent's and the watchers' — plays the same spectacle
      // at the same seq. (Transforms are free: they don't spend the turn.)
      if (act.kind === "gimmick") {
        const gp = { side: act.side, unit: act.unit };
        if (act.g === "mega") megaEvolve(u, gp, act.megaId);
        else if (act.g === "z") zPower(u, gp);
        else if (act.g === "dyna") dynamax(u, gp);
        else if (act.g === "tera") teraize(u, gp, act.teraType);
        done();
        return;
      }
      if (act.kind === "forfeit") {
        finish(other(act.side), act, "forfeit", instant, done);
        return;
      }
      done();
    }

    // The KO'ing mon earns battle EXP (3 KOs = an evolution). Every screen
    // applies the same acts, so every phone increments identically — that
    // keeps the count safe under last-write-wins state sync.
    function creditKO(u, m) {
      // Nuzlocke runs level-gate their OWN evolutions and never touch the
      // real dex — no EXP credit (it would silently bank KOs on the REAL
      // Squirtle of the same species) and no "(2/3 KOs to evolve)" chatter.
      if (opts.nuzlocke) return null;
      m.kos = (m.kos || 0) + 1;
      try {
        Store.update((s) => {
          const t = s.pokedex.trainers[u.attId];
          const r = t && t.caught && t.caught[m.id];
          if (r) r.kos = (r.kos || 0) + 1;
          if (t) t.koLife = (t.koLife || 0) + 1;      // lifetime KOs (never spent)
        });
      } catch (_) {}
      if (!(window.DEX_EVOS || {})[m.id]) return null;
      const need = Store.KO_TO_EVOLVE || 3;
      const total = (m.kos0 || 0) + m.kos;
      // Kadabra/Machoke/Graveler/Haunter refuse to evolve from EXP — only a
      // trade will do. Rub it in at the moment they'd otherwise be ready.
      if (Store.TRADE_EVOS && Store.TRADE_EVOS[m.id]) {
        return total >= need
          ? "🔁 " + m.name + " has the EXP… but it ONLY evolves by TRADE — hit the Trading Post!"
          : "⚔ " + m.name + " earned battle EXP! (" + total + "/" + need + ")";
      }
      // A line the trainer FULLY owns doesn't tease an evolution — its KOs
      // bank straight into the veteran attack bonus instead (+1% a KO, cap +10%).
      const worth = !Store.evoWorthTargets || Store.evoWorthTargets(u.attId, m.id).length > 0;
      if (!worth) return "⚔ " + m.name + " earned battle EXP — the veteran grows stronger! (" + total + " KOs banked)";
      return total >= need
        ? "⚡ " + m.name + " has enough battle EXP to EVOLVE after the battle!"
        : "⚔ " + m.name + " earned battle EXP! (" + total + "/" + need + " KOs to evolve)";
    }

    function applyMove(act, u, instant, done) {
      S.moved++;
      const dSide = other(act.side);
      const tu = sides[dSide].units[act.tUnit];
      const m = mon(u), mv = act.move === 99 ? STRUGGLE : (m.moves[act.move] || m.moves[0]), tm = tu ? mon(tu) : null;
      const fx = act.fx;
      const isStatus = act.cat === "status";
      // A self-targeting status move (Recover, Swords Dance, Dragon Dance, Rest)
      // ignores the foe's typing — it can't be "immune"/"missed" by type.
      const allSelfStats = fx && fx.stats && fx.stats.every((sc) => sc.who === "self");
      const selfMove = isStatus && !!(fx && (fx.heal || fx.rest || (fx.stat && fx.stat.who === "self") || allSelfStats));
      if (act.courage) u.courage = false;               // the Dire Hit, spent on this very hit
      const chug = act.courage ? [["🎯 " + u.name + " uses a DIRE HIT!", 950, () => sfx("correct")]] : [];

      const eatBerry = (unit) => {
        unit.berryUsed = true;
        const mm = mon(unit); mm.hp = Math.min(mm.hpMax, mm.hp + 45); paintHp(unit);
        try { Store.update((s) => { const t = s.pokedex.trainers[unit.attId]; if (t && t.berries > 0) t.berries--; }); } catch (_) {}
      };
      const berryReady = (unit) => { const mm = mon(unit); return mm.hp > 0 && mm.hp < mm.hpMax * 0.3 && unit.hasBerry && !unit.berryUsed; };

      // End the whole move: mark faints, end the battle if a side is wiped,
      // else carry on (fainted slots get replaced at end of turn).
      const settle = () => {
        if (tu) paintHp(tu); paintHp(u); paintStatus(u); if (tu) paintStatus(tu);
        if (tm && tm.hp <= 0 && tu._monEl) tu._monEl.classList.add("fainted");
        if (m.hp <= 0 && u._monEl) u._monEl.classList.add("fainted");
        if (tu && !sides[dSide].units.some(unitAlive)) { finish(act.side, act, "faint", instant, done); return; }
        if (!sides[act.side].units.some(unitAlive)) { finish(dSide, act, "faint", instant, done); return; }
        advance(); done();
      };

      // Apply all of the move's after-effects to state. `push(msg, delay, sfx)`
      // queues a narration beat; in instant catch-up mode push is a no-op.
      function applyEffects(dmgDealt, push) {
        if (!fx) return;
        if (fx.status && act.fxHit && tm && tm.hp > 0 && act.eff !== 0 && canStatus(tm, fx.status.id)) {
          tm.status = fx.status.id;
          if (fx.status.id === "slp") tm.slp = act.slpTurns || 1;
          push("💤 " + tm.name + STATUS_GOT[fx.status.id], 1050, "error");
        }
        if (fx.stat) {
          if (fx.stat.who === "self" && act.fxHit) push(applyStage(m, fx.stat.stat, fx.stat.stg), 900, "blip");
          else if (fx.stat.who === "foe" && act.fxHit && tm && tm.hp > 0 && act.eff !== 0) push(applyStage(tm, fx.stat.stat, fx.stat.stg), 900, "blip");
        }
        // Multi-stat moves (Dragon Dance, Calm Mind, Close Combat's drawback…).
        if (fx.stats && act.fxHit) fx.stats.forEach((sc) => {
          if (sc.who === "foe") { if (tm && tm.hp > 0 && act.eff !== 0) push(applyStage(tm, sc.stat, sc.stg), 850, "blip"); }
          else push(applyStage(m, sc.stat, sc.stg), 850, "blip");
        });
        if (fx.drain && dmgDealt > 0 && m.hp > 0) {
          const h = Math.max(1, Math.round(dmgDealt * fx.drain)); const b = m.hp; m.hp = Math.min(m.hpMax, m.hp + h);
          if (m.hp > b) push("🧛 " + m.name + " drained energy! (+" + (m.hp - b) + " HP)", 950, "coin");
        }
        if (fx.heal) { const b = m.hp; m.hp = Math.min(m.hpMax, m.hp + Math.round(m.hpMax * fx.heal));
          push("💚 " + m.name + " regained health! (+" + (m.hp - b) + " HP)", 1000, "coin"); }
        if (fx.rest) { m.hp = m.hpMax; m.status = "slp"; m.slp = 2;
          push("😴 " + m.name + " slept and restored full HP!", 1100, "coin"); }
        if (fx.seed && tm && tm.hp > 0 && (tm.types || []).indexOf("grass") < 0 && !tm.seeded) {
          tm.seeded = true; push("🌱 " + tm.name + " was seeded!", 950, "blip"); }
        if (fx.recoil && dmgDealt > 0) { const r = Math.max(1, Math.round(dmgDealt * fx.recoil)); m.hp = Math.max(0, m.hp - r);
          push("💢 " + m.name + " is hit with recoil! (−" + r + " HP)", 950, "error"); }
        if (fx.flinch && act.fxHit && tm && tm.hp > 0) tm._flinch = true;
        if (fx.confuse != null && act.fxHit && tm && tm.hp > 0 && act.eff !== 0 && !tm._confN) {
          tm._confN = act.confN || 3;
          push("💫 " + tm.name + " became confused!", 950, "blip");
        }
      }

      // Spread damage: splash each secondary foe (damage only — no secondary
      // status/stat effects on the splash targets).
      const applySpread = () => (act.spread || []).forEach((sp) => {
        const su = sides[dSide].units[sp.tUnit]; if (!su) return;
        const sm = mon(su);
        if (sp.eff === 0 || sm.hp <= 0) return;
        sm.hp = Math.max(0, sm.hp - sp.dmg);
        if (sm.hp <= 0) creditKO(u, m); else if (berryReady(su)) eatBerry(su);
      });

      // ---- instant (catch-up) path: no animation, apply everything now ----
      if (instant) {
        if (!act.miss && !(act.eff === 0 && !selfMove)) {
          // drain/recoil key off the HP the target ACTUALLY lost — overkill
          // damage doesn't heal (50 HP left + a 100 hit drains from 50).
          const hpLost = (!isStatus && tm) ? Math.min(act.dmg, tm.hp) : 0;
          if (!isStatus && tm) { tm.hp = Math.max(0, tm.hp - act.dmg); if (tm.hp <= 0) creditKO(u, m); else if (berryReady(tu)) eatBerry(tu); }
          applySpread();
          applyEffects(isStatus ? 0 : hpLost, function () {});
          if (act.recharge && m.hp > 0) m._recharge = true;
        }
        settle();
        return;
      }

      menu.innerHTML = "";
      u._monEl.classList.add("attack");
      setTimeout(() => u._monEl.classList.remove("attack"), 600);
      const used = [(act.zed ? "🌀 " + m.name + " UNLEASHES its Z-Power! " : "") + m.name + " used " + mv.name + "!",
        act.zed ? 1400 : 800, () => { sfx(act.zed ? "fanfare" : "select"); if (act.zed && u._monEl) u._monEl.classList.remove("z-charge"); }];
      if (act.miss) {
        const missMsg = act.avoided ? (tm ? tm.name : "The foe") + " avoided the attack!" : "…it missed!";
        beats(chug.concat([used, [missMsg, 1000, () => sfx("error")]]), () => { advance(); done(); }); return;
      }
      if (act.eff === 0 && !selfMove) {                 // immune (damage OR foe-status move)
        beats(chug.concat([used, ["It doesn't affect " + (tm ? tm.name : "it") + "…", 1150, () => sfx("error")]]), () => { advance(); done(); });
        return;
      }
      // The blast connected — this mon must recharge next turn.
      if (act.recharge) m._recharge = true;

      // (The SIGNATURE call-out + screen shake for a boss's last mon was cut
      // by request — endgame fights are hard enough, and it read like a free
      // super move landing at the worst possible time.)

      const steps = chug.concat([used]);
      if (!isStatus && tm) {
        steps.push([null, 500, () => {
          const before = tm.hp;
          tm.hp = Math.max(0, tm.hp - act.dmg);
          if (tm.hp <= 0) act._exp = creditKO(u, m);
          // A crit gets ONLY the red flash — stacking it with the hurt blink
          // (opacity dip) made the whole scene look like it went transparent.
          tu._monEl.classList.add(act.crit ? "crit" : "hurt");
          setTimeout(() => tu._monEl.classList.remove("hurt", "crit"), 700);
          spawnHit(tu._monEl, TYPE_COLOR[act.mvType] || "#fff", act.crit);
          floatDmg(tu._monEl, act.dmg, act.crit, act.eff);   // 💥 rising damage number
          // (No extra shake for super-effective/big hits — with SE-heavy teams
          // the screen never stopped moving. Crits alone rock the screen, via
          // spawnHit; the damage number + red flash carry the weight.)
          drainHp(tu, before); sfx("coin");                   // 🩸 tick the HP down, don't snap
        }]);
        if (act.crit) steps.push([act.armed ? "🎯💥 DIRE HIT — a guaranteed critical hit!" : "💥 A critical hit!", 900, () => sfx("correct")]);
        if (act.eff >= 4) steps.push(["💥💥 It's SUPER effective!! (double weakness)", 950]);
        else if (act.eff > 1) steps.push(["It's super effective!", 900]);
        else if (act.eff <= 0.25) steps.push(["It barely has any effect…", 900]);
        else if (act.eff < 1) steps.push(["It's not very effective…", 900]);
        steps.push(["−" + act.dmg + " HP!", 650]);
      }
      // Spread splash: each other fielded foe also takes the hit.
      (act.spread || []).forEach((sp) => {
        const su = sides[dSide].units[sp.tUnit]; if (!su) return;
        const sm = mon(su);
        if (sp.eff === 0) { steps.push(["…it doesn't affect " + sm.name + "…", 850, () => sfx("error")]); return; }
        steps.push([null, 450, () => {
          const sbefore = sm.hp;
          sm.hp = Math.max(0, sm.hp - sp.dmg);
          if (sm.hp <= 0) sp._exp = creditKO(u, m);
          su._monEl.classList.add("hurt");
          setTimeout(() => su._monEl.classList.remove("hurt"), 600);
          spawnHit(su._monEl, TYPE_COLOR[act.mvType] || "#fff", false);
          floatDmg(su._monEl, sp.dmg, false, sp.eff);
          drainHp(su, sbefore); sfx("coin");
        }]);
        steps.push(["…and " + sm.name + " too! (−" + sp.dmg + " HP)", 700]);
      });
      // Post-damage / status-move effects (drain, recoil, status, stat, etc.).
      // dmgDealt is capped at the target's CURRENT HP (still pre-hit here —
      // the damage step is queued, not applied): overkill never over-heals.
      const dmgDealt = (!isStatus && tm) ? Math.min(act.dmg, tm.hp) : 0;
      applyEffects(dmgDealt, (msg, delay, s) => { if (msg) steps.push([msg, delay, () => { paintHp(u); if (tu) paintHp(tu); if (s) sfx(s); }]); });

      beats(steps, () => {
        const koSteps = [];
        if (tm && tm.hp <= 0) koSteps.push([tm.name + " fainted!", 1100, () => { tu._monEl.classList.add("fainted"); sfx("error"); }]);
        // 🎭 boss chatter — FEATURED battles only (see `chatty`), and each
        // beat lands at most ONCE per battle so it stays a moment, not a tic.
        if (tm && !opts.wild && chatty) {
          if (tm.hp > 0 && tu.ai && !tu._tauntedOnce && tm.hp <= tm.hpMax / 2) {
            tu._tauntedOnce = true;
            const tln = bossLine(TAUNT_HALF, tm.id + tm.hpMax);
            koSteps.push(["🗣 " + tu.name + ": “" + tln + "”", 1600, () => { sfx("select"); sayBubble(tu, tln); }]);
          }
          // (The COMEBACK 25% heal for a boss's ace in deep red was cut by
          // request — no more free swings for the final mon. The ace still
          // gets its defiant LINE below, but words don't restore HP.)
          if (tm.hp > 0 && tu.ai && !tu._comebackDone
              && tu.party.filter((x) => x.hp > 0).length === 1 && tm.hp <= tm.hpMax * 0.3) {
            tu._comebackDone = true;
            koSteps.push(["🗣 " + tu.name + ": “We are NOT done. ONE more stand!”", 1800, () => { sfx("select"); sayBubble(tu, "We are NOT done. ONE more stand!"); }]);
          }
          if (tm.hp <= 0 && u.ai && !tu.ai && !u._gloatedOnce) {
            u._gloatedOnce = true;
            const gln = bossLine(GLOAT_KO, tm.id + m.id);
            koSteps.push(["🗣 " + u.name + ": “" + gln + "”", 1600, () => { sfx("select"); sayBubble(u, gln); }]);
          }
        }
        if (act._exp) koSteps.push([act._exp, 1300, () => sfx("coin")]);
        // A splashed foe that fainted from the spread hit.
        (act.spread || []).forEach((sp) => {
          const su = sides[dSide].units[sp.tUnit]; if (!su) return;
          const sm = mon(su);
          if (sm.hp <= 0) {
            koSteps.push([sm.name + " fainted!", 1100, () => { su._monEl.classList.add("fainted"); sfx("error"); }]);
            if (sp._exp) koSteps.push([sp._exp, 1300, () => sfx("coin")]);
          }
        });
        if (m.hp <= 0) koSteps.push([m.name + " fainted from recoil!", 1150, () => { u._monEl.classList.add("fainted"); sfx("error"); }]);
        if (tm && tm.hp > 0 && berryReady(tu)) koSteps.push(["🍓 " + tu.name + "'s Sitrus Berry! " + tm.name + " recovered 45 HP!", 1250, () => { eatBerry(tu); sfx("coin"); }]);
        if (koSteps.length) beats(koSteps, settle); else settle();
      });
    }

    // ---- battle-EXP evolutions (after the battle, classic style) ----
    // Prompts appear on the phone that controls the mon; branched lines
    // (Eevee!) get a choice. Declining keeps the EXP for next time.
    function promptEvolutions(afterAll) {
      const fin = afterAll || function () {};
      if (mode === "watch" || !window.Modal) { fin(); return; }
      const pend = [], seen = {};
      ["a", "b"].forEach((sd) => sides[sd].units.forEach((un) => {
        if (!(mode === "local" || isMine(un))) return;
        un.party.forEach((mn) => {
          const key = un.attId + ":" + mn.id;
          if (seen[key]) return; seen[key] = 1;
          if (Store.evoReady(un.attId, mn.id)) pend.push({ attId: un.attId, owner: un.name, mon: mn });
        });
      }));
      (function next() {
        const p = pend.shift(); if (!p) { fin(); return; }
        showEvoPrompt(p, next);
      })();
    }

    // Losers always want to run it back — same trainers, same parties,
    // fresh HP. Hot-seat only (remote rematches are a new challenge).
    // The prompt only appears when someone actually LOST and wants revenge:
    // beat the AI and you just move on; wild grinds, Nuzlocke runs and the
    // Battle Tower have their own flows and never nag.
    function offerRematch(wLabel, winSide) {
      if (mode !== "local" || !window.Modal) return;
      if (opts.wild || opts.nuzlocke || opts.tower) return;
      if (winSide) {
        const wAI = sides[winSide].units.some((x) => x.ai);
        const lAI = sides[other(winSide)].units.some((x) => x.ai);
        if (lAI && !wAI) return;                     // the human WON — no popup
      }
      let ctrl;
      const body = el("div", { class: "chal-modal" }, [
        el("div", { class: "chal-line" }, "🏆 " + wLabel + " took it. Run it back?"),
        el("div", { class: "toolbar" }, [
          el("button", { class: "btn primary", onClick: () => { if (ctrl) ctrl.close(); start(opts); } }, "🔁 Rematch"),
          el("button", { class: "btn subtle", onClick: () => { if (ctrl) ctrl.close(); } }, "Done"),
        ]),
      ]);
      ctrl = Modal.open("Rematch?", body, null, { noFooter: true });
    }
    function showEvoPrompt(p, onDone) {
      // only branches that still unlock something — a form not yet caught,
      // or a shiny upgrade (owned lines bank their KOs as the veteran bonus)
      const targets = Store.evoWorthTargets ? Store.evoWorthTargets(p.attId, p.mon.id) : Store.evoTargets(p.mon.id);
      if (!targets.length) { onDone(); return; }
      const nm = (id) => (DEX[id] && DEX[id].n) || ("#" + id);
      let ctrl;
      const evolveTo = (tid) => {
        if (!Store.evolveMon(p.attId, p.mon.id, tid)) { if (ctrl) ctrl.close(); onDone(); return; }
        if (ctrl) ctrl.close();
        // The full "Squad evolution" cinematic: silhouette flicker → flash →
        // color reveal → energy fireworks, with the evolve + win music.
        const type = (window.DEX && DEX[tid] && DEX[tid].t && DEX[tid].t[0]) || "";
        if (window.EvoFX && EvoFX.play) {
          EvoFX.play({
            beforeSrc: frontSprite(p.mon.id, p.mon.shiny),
            afterSrc: frontSprite(tid, p.mon.shiny),
            beforeName: p.mon.name, afterName: nm(tid),
            type: type, shiny: p.mon.shiny, onComplete: onDone,
          });
        } else { onDone(); }
      };
      const body = el("div", { class: "modal-form" }, [
        el("div", { class: "evo-prompt-head" }, [
          el("img", { class: "evo-prompt-img", src: frontSprite(p.mon.id, p.mon.shiny), alt: "" }),
          el("p", { class: "hint" }, "⚡ " + p.owner + "'s " + (p.mon.shiny ? "✨" : "") + p.mon.name +
            " has enough battle EXP to evolve (" + (Store.KO_TO_EVOLVE || 3) + " KOs — it landed them itself)!"),
        ]),
        el("div", { class: "toolbar", style: { flexWrap: "wrap" } }, targets.map((tid) =>
          el("button", { class: "btn primary", onClick: () => evolveTo(tid) }, [
            frontSprite(tid, p.mon.shiny) ? el("img", { class: "evo-opt-img", src: frontSprite(tid, p.mon.shiny), alt: "" }) : null,
            " Evolve into " + nm(tid),
          ])).concat([
          el("button", { class: "btn subtle", onClick: () => { if (ctrl) ctrl.close(); onDone(); } }, "Not now (keep the EXP)"),
        ])),
      ]);
      ctrl = Modal.open("🎉 " + p.mon.name + " is ready to evolve!", body, null, { noFooter: true });
    }

    function finish(winSide, act, how, instant, done) {
      S.done = true;
      menu.innerHTML = "";
      const wLabel = label(winSide), lLabel = label(other(winSide));
      const wMons = sides[winSide].units.map((x) => mon(x).name).join(" & ");
      const lMons = sides[other(winSide)].units.map((x) => mon(x).name).join(" & ");
      const record = mode === "local" || (mode === "remote" && act.by === myClient);
      // 🎭 THE OUTRO — an AI boss gets the last word: a CUSTOM closing quote
      // (unit.outro.{win,lose} — real canon lines where we have them) always
      // plays; the generic pool only seasons featured battles. Wild mons
      // don't monologue.
      let outroInfo = null;
      if (!opts.wild) {
        const wU = sides[winSide].units[0], lU = sides[other(winSide)].units[0];
        if (lU.ai && !wU.ai) { const oln = (lU.outro && lU.outro.lose) || (chatty ? bossLine(OUTRO_LOSE, lU.party[0].id) : null); if (oln) outroInfo = { u: lU, line: oln }; }
        else if (wU.ai && !lU.ai) { const oln = (wU.outro && wU.outro.win) || (chatty ? bossLine(OUTRO_WIN, wU.party[0].id) : null); if (oln) outroInfo = { u: wU, line: oln }; }
      }
      // 🎭 The boss's last word is a MOMENT now, not a passing line: a card
      // with their ace and their real quote, held until the player taps
      // Continue — a Champion's concession deserves a beat of silence.
      const outroPop = (info, next) => {
        const spk = info.u, aceId = (spk.party[spk.party.length - 1] || spk.party[0] || {}).id;
        const src = (window.DEX_SPRITES && DEX_SPRITES[aceId]) || (window.Store && Store.sprite(aceId)) || "";
        const lay = el("div", { class: "modal-overlay duel-outro-pop" }, [
          el("div", { class: "modal duel-outro" }, [
            src ? el("img", { class: "duel-outro-face", src: src, alt: "" }) : null,
            el("div", { class: "duel-outro-name" }, "🗣 " + spk.name),
            el("div", { class: "duel-outro-quote" }, "“" + info.line + "”"),
            el("button", { class: "btn primary duel-outro-go", onClick: () => { lay.remove(); sfx("select"); next(); } }, "Continue ▸"),
          ]),
        ]);
        document.body.appendChild(lay);
        sfx("select");
      };
      // Nuzlocke runs level-gate their OWN evolutions (the box, not the real
      // dex) — the 3-KO prompt here would evolve the wrong Squirtle.
      const finishUp = () => { close(); if (opts.onResult) opts.onResult(winSide); setTimeout(() => (opts.nuzlocke ? offerRematch(wLabel, winSide) : promptEvolutions(() => offerRematch(wLabel, winSide))), 700); if (done) done(); };
      beats([
        how === "forfeit" ? ["🏳️ " + lLabel + (lLabel.indexOf(" & ") >= 0 ? " give up!" : " gives up!"), 1200, () => sfx("error")] : [null, 250],
        ["🏆 " + wLabel + " win" + (wLabel.indexOf(" & ") >= 0 ? "" : "s") + " the duel!", 1700, () => sfx("fanfare")],
      ].filter(Boolean), () => { if (outroInfo) outroPop(outroInfo, finishUp); else finishUp(); });
      if (!record) return;
      // End the room broadcast no matter which branch records below —
      // watchers' screens resolve and the LIVE banner clears.
      try {
        if (window.Sync) {
          if (mode === "remote") { Sync.endRemoteDuel(remoteId, wLabel); Sync.finishLiveBattle(remoteId, wLabel); }
          else if (liveLocal) { if (castId) Sync.endRemoteDuel(castId, wLabel); Sync.finishLiveBattle(liveId, wLabel); }
          if (castUnsub) { castUnsub(); castUnsub = null; }
        }
      } catch (_) {}
      // 🌿 Wild battle (Safari option / Nuzlocke grass) — pure exhibition.
      // "caught" ends via resolveBall; landing here means the wild fainted
      // ("ko" — the catch is lost) or your side wiped ("lost").
      if (opts.wild) {
        try { if (opts.wild.onOutcome) opts.wild.onOutcome(winSide === "a" ? "ko" : "lost", faintedOwnIds()); } catch (_) {}
        return;
      }
      // 🩹 Nuzlocke battles never touch the real ladder — they report the run's
      // deaths (every own mon that fainted) and the result to the run instead.
      if (opts.nuzlocke) {
        try { if (opts.nuzlocke.onEnd) opts.nuzlocke.onEnd(faintedOwnIds(), winSide); } catch (_) {}
        return;
      }
      // 🗼 Battle Tower: streaks live in the tower's own ledger — never the
      // real ladder, Elo, or leaderboards.
      if (opts.tower) {
        try { if (opts.tower.onEnd) opts.tower.onEnd(winSide); } catch (_) {}
        return;
      }
      // 👑 Pokémon League: Elite Four → LANCE → the silent one on Mt. Silver.
      // Off the leaderboards, like gyms — glory (and points) only.
      if (opts.league) {
        try {
          const playerSide = sides.a.units.some((x) => x.ai) ? "b" : "a";
          const player = sides[playerSide].units[0];
          const lg = opts.league;
          Store.update((s) => {
            if (winSide === playerSide) {
              s.league = s.league || {};
              const w = s.league[player.attId] = s.league[player.attId] || [];
              const fresh = w.indexOf(lg.key) < 0;
              if (fresh) w.push(lg.key);
              if (lg.style && Store.styleWin) Store.styleWin(s, player.attId, lg.key, lg.style);
              Store.grantPoints(s, "battle", player.teamId, lg.pts || 6);
              // 🏛 Hall of Fame: the champion AND the team that did it, forever.
              // Stamp WHICH league/region was won so the plaque can name it.
              const enshrine = () => { if (fresh) { s.hof = s.hof || []; s.hof.push({ attId: player.attId, ts: now(), party: player.party.map((x) => x.id), key: lg.key, champ: lg.name, rank: lg.rank, region: lg.region || "" }); } };
              if (lg.key === "ash") { enshrine(); Store.chron(s, "🧢", player.name + " defeated POKÉMON MASTER ASH KETCHUM — Pikachu bows, the torch is passed, and a silhouette walks into the sun. THE JOURNEY IS COMPLETE.");
                // ⚡ PIKACHU STAYS — Ash's partner joins the champion's own
                // team (form 10094: Light Ball attack, never evolves). Once.
                const tr = ((s.pokedex || {}).trainers || {})[player.attId];
                if (tr) { tr.caught = tr.caught || {};
                  if (!tr.caught[10094]) { tr.caught[10094] = { name: "Ash's Pikachu" };
                    Store.chron(s, "⚡", "PIKACHU STAYED — Ash's partner, Light Ball and all, joins " + player.name + "'s team. He will never evolve. He doesn't need to."); } }
              }
              else if (lg.key === "red") { enshrine(); Store.chron(s, "🗻", player.name + " climbed Mt. Silver and defeated RED. There is nothing left to prove. THE ABSOLUTE CHAMPION."); }
              else if (lg.final) { enshrine(); Store.chron(s, "🎹", player.name + " out-dueled CYNTHIA in the final battle — the piano falls silent. THE TRUE CHAMPION OF CHAMPIONS."); }
              else if (lg.rank === "Top Champion") { enshrine(); Store.chron(s, "🏆", player.name + " toppled TOP CHAMPION " + lg.name + " — nine regions conquered. Enshrined in the HALL OF FAME!"); }
              else if (lg.rank === "Champion") { enshrine(); Store.chron(s, "👑", player.name + " defeated Champion " + lg.name + " — welcome to the HALL OF FAME!" + (lg.key === "lance" && fresh ? " …the summit of Mt. Silver just rumbled." : "")); }
              else Store.chron(s, "⭐", player.name + " toppled " + lg.rank + " " + lg.name + "!");
            } else {
              if (lg.key === "ash") Store.chron(s, "🧢", "ASH grins and rubs his nose — \"Not yet!\" " + player.name + " will be back for the torch.");
              else if (lg.key === "red") Store.chron(s, "🗻", "RED said nothing. " + player.name + " descends the mountain to train.");
              else if (lg.final) Store.chron(s, "🎹", "CYNTHIA remains undefeated — the piano plays on for " + player.name + ".");
              else Store.chron(s, "🤖", lg.rank + " " + lg.name + " stands undefeated — " + player.name + " will be back.");
            }
          });
        } catch (_) {}
        return;
      }
      // 🏟 Gym challenges: badge on a win, a rematch on a loss — they never touch
      // the duel leaderboard, Elo, or the Champion's Belt.
      if (opts.gym) {
        try {
          const playerSide = sides.a.units.some((x) => x.ai) ? "b" : "a";
          const player = sides[playerSide].units[0];
          Store.update((s) => {
            if (winSide === playerSide) {
              // Everyone can hold every badge — a win just adds you.
              s.gymCircuit = s.gymCircuit || {};
              const hs = s.gymCircuit[opts.gym.idx] = s.gymCircuit[opts.gym.idx] || [];
              const fresh = hs.indexOf(player.attId) < 0;
              if (fresh) hs.push(player.attId);
              if (opts.gym.style && Store.styleWin) Store.styleWin(s, player.attId, "gym:" + opts.gym.idx, opts.gym.style);
              Store.grantPoints(s, "battle", player.teamId, 5);
              Store.chron(s, "🏅", player.name + " defeated Leader " + opts.gym.leader + " and earned the " + (opts.gym.badge || "gym") + " Badge!" + (fresh ? "" : " (rematch flex)"));
              if (fresh && opts.gym.idx < 16 && Store.gymBadgesInRange(player.attId, 0, 16) >= 16)
                Store.chron(s, "🏆", "ALL 16 BADGES — " + player.name + " has conquered Johto AND Kanto. CHAMPION!!");
              else if (fresh) {
                // Region badge sweeps unlock that region's Elite Four. {start,
                // count, emoji, label} per post-Kanto region.
                const REGION_SWEEP = [
                  { start: 16, count: 8, emoji: "🌊", label: "HOENN" },
                  { start: 24, count: 8, emoji: "🏔", label: "SINNOH" },
                  { start: 32, count: 8, emoji: "🏙", label: "UNOVA" },
                  { start: 40, count: 8, emoji: "🗼", label: "KALOS" },
                  { start: 48, count: 4, emoji: "🌺", label: "ALOLA" },
                  { start: 52, count: 8, emoji: "⚽", label: "GALAR" },
                  { start: 60, count: 8, emoji: "🍊", label: "PALDEA" },
                ];
                const rg = REGION_SWEEP.find((r) => opts.gym.idx >= r.start && opts.gym.idx < r.start + r.count);
                if (rg && Store.gymBadgesInRange(player.attId, rg.start, rg.count) >= rg.count) {
                  const gate = rg.label === "GALAR" ? "enter the Galar Champion Cup" : "challenge the " + rg.label[0] + rg.label.slice(1).toLowerCase() + " Elite Four";
                  Store.chron(s, rg.emoji, "ALL " + rg.count + " " + rg.label + " BADGES — " + player.name + " may now " + gate + "!");
                }
              }
            } else {
              Store.chron(s, "🤖", "Leader " + opts.gym.leader + " defended the gym — " + player.name + " trains harder.");
            }
          });
        } catch (_) {}
        return;
      }
      // 🏛 Battle of Fame: a Hall of Fame team steps down from its plaque.
      // Pure exhibition — no leaderboard, no Elo, no belt. Glory only.
      if (opts.hof) {
        try {
          const playerSide = sides.a.units.some((x) => x.ai) ? "b" : "a";
          const player = sides[playerSide].units[0];
          const ghost = opts.hof;
          const ownGhost = player.attId === ghost.attId;
          Store.update((s) => {
            if (winSide === playerSide) {
              Store.grantPoints(s, "battle", player.teamId, 4);
              Store.chron(s, "🏛", ownGhost
                ? player.name + " defeated the ghost of their own championship team. Growth."
                : player.name + " took down " + ghost.name + "'s Hall of Fame team! The plaque still shines… but so does " + player.name + ".");
            } else {
              Store.chron(s, "🏛", ownGhost
                ? player.name + " lost to their own past self. Humbling."
                : ghost.name + "'s Hall of Fame team stands eternal — " + player.name + " salutes the champion.");
            }
          });
        } catch (_) {}
        return;
      }
      // 🏆 Champions Tournament: a bracket exhibition against a legend's team.
      // No Elo, no belt, no leaderboard — the bracket advances via onResult.
      if (opts.tournament) {
        try {
          const playerSide = sides.a.units.some((x) => x.ai) ? "b" : "a";
          const player = sides[playerSide].units[0];
          const foe = opts.tournament.foe || "a legend";
          Store.update((s) => {
            if (winSide === playerSide) {
              Store.grantPoints(s, "battle", player.teamId, 4);
              Store.chron(s, "🏆", player.name + " defeated " + foe + " in the Champions Tournament!");
            } else {
              Store.chron(s, "🏆", foe + " knocked " + player.name + " out of the Champions Tournament.");
            }
          });
        } catch (_) {}
        return;
      }
      // 🎬 Movie Legends: MEWTWO (Strikes Back) & the COLLECTOR (Pokémon 2000).
      // Special cinematic boss battles — win is recorded per trainer (append-only,
      // sync-unioned) for a ✅ on the wall; no Elo, no belt, glory only.
      if (opts.movie) {
        try {
          const playerSide = sides.a.units.some((x) => x.ai) ? "b" : "a";
          const player = sides[playerSide].units[0];
          const mvb = opts.movie;
          Store.update((s) => {
            if (winSide === playerSide) {
              s.movies = s.movies || {};
              const w = s.movies[player.attId] = s.movies[player.attId] || [];
              if (w.indexOf(mvb.key) < 0) w.push(mvb.key);
              Store.grantPoints(s, "battle", player.teamId, mvb.pts || 10);
              Store.chron(s, mvb.icon || "🎬", player.name + " " + (mvb.winChron || ("defeated " + mvb.name + "!")));
            } else {
              Store.chron(s, mvb.icon || "🎬", (mvb.loseChron || (mvb.name + " proved too powerful")) + " — " + player.name + " retreats to train.");
            }
          });
        } catch (_) {}
        return;
      }
      // 🌌 Legendary & Mythical Challenge — a generation's legendaries, 6v6.
      // Post-league extension; win recorded per trainer per generation
      // (append-only, sync-unioned) for the wall + a ceremony honor.
      if (opts.legend) {
        try {
          const playerSide = sides.a.units.some((x) => x.ai) ? "b" : "a";
          const player = sides[playerSide].units[0];
          const lg = opts.legend;
          Store.update((s) => {
            if (winSide === playerSide) {
              s.legends = s.legends || {};
              const w = s.legends[player.attId] = s.legends[player.attId] || [];
              if (w.indexOf(lg.key) < 0) w.push(lg.key);
              Store.grantPoints(s, "battle", player.teamId, lg.pts || 20);
              Store.chron(s, lg.icon || "🌌", player.name + " " + (lg.winChron || ("conquered the " + lg.name + "!")));
            } else {
              Store.chron(s, lg.icon || "🌌", (lg.loseChron || (lg.name + " proved untamable")) + " — " + player.name + " retreats to train.");
            }
          });
        } catch (_) {}
        return;
      }
      // 🌀 Secret battle — a hidden endgame duel (e.g. the Unown's Judgment).
      // Win recorded per trainer per key (append-only) for a ceremony honor.
      if (opts.secret) {
        try {
          const playerSide = sides.a.units.some((x) => x.ai) ? "b" : "a";
          const player = sides[playerSide].units[0];
          const sc = opts.secret;
          Store.update((s) => {
            if (winSide === playerSide) {
              s.secrets = s.secrets || {};
              const w = s.secrets[player.attId] = s.secrets[player.attId] || [];
              if (w.indexOf(sc.key) < 0) w.push(sc.key);
              Store.grantPoints(s, "battle", player.teamId, sc.pts || 30);
              Store.chron(s, sc.icon || "🌀", player.name + " " + (sc.winChron || ("defeated " + sc.name + "!")));
            } else {
              Store.chron(s, sc.icon || "🌀", (sc.loseChron || (sc.name + " proved beyond reach")) + " — " + player.name + " retreats to train.");
            }
          });
        } catch (_) {}
        return;
      }
      // 🏰 Hall of Fame Gauntlet — a back-to-back run against enshrined teams.
      // The league view drives the chain via onResult (already fired above); no
      // per-battle logging, Elo, belt, or chron here.
      if (opts.gauntlet) { return; }
      // ❗ Surprise post-gym challenger (Giovanni, Silver…). Pure exhibition —
      // no Elo, no belt, no badge. Bragging rights.
      if (opts.encounter) {
        try {
          const playerSide = sides.a.units.some((x) => x.ai) ? "b" : "a";
          const player = sides[playerSide].units[0];
          const foe = opts.encounter.foe || "a mysterious challenger";
          Store.update((s) => {
            if (winSide === playerSide) {
              Store.grantPoints(s, "battle", player.teamId, 5);
              // 🎖 record the villain beaten (append-only) for Battle Honors.
              if (opts.encounter.who) {
                s.encounters = s.encounters || {};
                const e = s.encounters[player.attId] = s.encounters[player.attId] || [];
                if (e.indexOf(opts.encounter.who) < 0) e.push(opts.encounter.who);
              }
              Store.chron(s, "❗", player.name + " sent " + foe + " packing in a surprise showdown!");
            } else {
              Store.chron(s, "❗", foe + " ambushed " + player.name + " and won. Humbling.");
            }
          });
        } catch (_) {}
        return;
      }
      try {
        Store.update((s) => {
          s.battles = s.battles || { log: [] }; s.battles.log = s.battles.log || [];
          // wIds/lIds: attendee ids stamped alongside the display labels, so
          // the W-L record survives renames and doubles ("A & B") labels.
          s.battles.log.unshift({ title: title, winner: wLabel, loser: lLabel, ts: now(),
            duel: true, wMon: wMons, lMon: lMons,
            wIds: sides[winSide].units.map((x) => x.attId).filter(Boolean),
            lIds: sides[other(winSide)].units.map((x) => x.attId).filter(Boolean) });
          if (s.battles.log.length > 60) s.battles.log.length = 60;
          const teams = [];
          sides[winSide].units.forEach((x) => { if (x.teamId && teams.indexOf(x.teamId) < 0) teams.push(x.teamId); });
          teams.forEach((tid) => Store.grantPoints(s, "battle", tid, 4));
          if (Store.chron) Store.chron(s, "⚔️", doubles
            ? wLabel + " out-dueled " + lLabel + " in a double battle!"
            : wLabel + "'s " + wMons + " KO'd " + lLabel + "'s " + lMons + " in a duel!");
          // Champion's Belt — singles only. Unclaimed → winner takes it;
          // the holder loses → it changes hands; the holder wins → a defense.
          // A duel that doesn't involve the holder leaves the belt alone.
          if (!doubles) {
            const w = sides[winSide].units[0], l = sides[other(winSide)].units[0];
            const belt = s.battles.belt;
            const logBelt = () => { s.battles.beltLog = s.battles.beltLog || []; s.battles.beltLog.push({ attId: w.attId, ts: now() }); };
            if (!belt || !belt.attId) {
              s.battles.belt = { attId: w.attId, name: w.name, streak: 1, ts: now() }; logBelt();
              if (Store.chron) Store.chron(s, "🥇", w.name + " claimed the Champion's Belt!");
            } else if (belt.attId === w.attId) {
              belt.streak = (belt.streak || 1) + 1; belt.name = w.name;
            } else if (belt.attId === l.attId) {
              s.battles.belt = { attId: w.attId, name: w.name, streak: 1, ts: now() }; logBelt();
              if (Store.chron) Store.chron(s, "🥇", w.name + " took the Champion's Belt from " + l.name + "!");
            }
            // 📈 Duel Elo (singles only, K=32, everyone starts at 1000).
            if (w.attId && l.attId) {
              s.battles.elo = s.battles.elo || {};
              const rw = s.battles.elo[w.attId] || 1000, rl = s.battles.elo[l.attId] || 1000;
              const exp = 1 / (1 + Math.pow(10, (rl - rw) / 400));
              s.battles.elo[w.attId] = Math.round(rw + 32 * (1 - exp));
              s.battles.elo[l.attId] = Math.round(rl - 32 * (1 - exp));
            }
          }
        });
      } catch (_) {}
    }

    // ---- menus (only the phone that controls the current pick gets one) ----
    function isMine(u) { return mode === "local" || (mode === "remote" && u.client === myClient); }

    // A short tag describing a move's effect, shown on its button.
    function fxLabel(m) {
      // Payoff/drawback flags that live on the move itself (no fx block needed).
      const tags = [];
      if (m.spread) tags.push("💠 both");
      if (m.recharge) tags.push("💤 recharge");
      if (m.charge) tags.push(m.charge.invuln ? "⏳ 2-turn·hides" : "⏳ 2-turn");
      const fx = m.fx;
      let base = "";
      if (fx) {
        if (fx.status) base = "💤 " + STATUS_TAG[fx.status.id] + (fx.status.chance < 100 ? " " + fx.status.chance + "%" : "");
        else if (fx.stat) { const s = STAT_LABEL[fx.stat.stat] || fx.stat.stat; base = (fx.stat.who === "self" ? "self " : "foe ") + s + (fx.stat.stg > 0 ? " ▲" : " ▼"); }
        else if (fx.stats) { const up = fx.stats.filter((x) => x.stg > 0).length, dn = fx.stats.filter((x) => x.stg < 0).length;
          const who = fx.stats.every((x) => x.who === "self") ? "self " : ""; base = who + (up ? "▲".repeat(Math.min(up, 2)) : "") + (dn ? "▼".repeat(Math.min(dn, 2)) : ""); }
        else if (fx.rest) base = "😴 full heal";
        else if (fx.heal) base = "💚 heal";
        else if (fx.drain) base = "🧛 drain";
        else if (fx.recoil) base = "💢 recoil";
        else if (fx.seed) base = "🌱 seed";
        else if (fx.flinch) base = "😵 flinch " + fx.flinch + "%";
        else if (fx.confuse != null) base = "💫 confuse " + fx.confuse + "%";
        else if (fx.crit === "high") base = "🎯 high crit";
      }
      if (base) tags.push(base);
      return tags.join(" · ");
    }
    function moveBtn(m, onPick) {
      const catIcon = m.cat === "spec" ? "🌀" : m.cat === "status" ? "🌟" : "👊";
      const bits = [catIcon, m.cat === "status" ? "STATUS" : "POW " + m.pow, (m.acc >= 101 ? "—" : m.acc + "%")];
      if (m.pri > 0) bits.push("⚡1st");
      const fl = fxLabel(m);
      return el("button", { class: "duel-move", style: { "--mt": TYPE_COLOR[m.type] || "#a8a878" }, onClick: onPick }, [
        el("span", { class: "duel-move-name" }, (TYPE_EMOJI[m.type] || "⭐") + " " + m.name),
        el("span", { class: "duel-move-sub" }, bits.join(" · ")),
        fl ? el("span", { class: "duel-move-fx" }, fl) : null,
      ]);
    }

    function confirmPanel(text, okLabel, onOk) {
      menu.innerHTML = "";
      menu.appendChild(el("div", { class: "duel-confirm" }, [
        el("div", { class: "duel-confirm-txt" }, text),
        el("div", { class: "battle-menu-row" }, [
          el("button", { class: "btn primary", onClick: onOk }, okLabel),
          el("button", { class: "btn subtle", onClick: renderMenu }, "↩ Back"),
        ]),
      ]));
    }

    function partyPanel(u, ptr, kind, allowBack) {
      // pick a replacement (kind "next") or a voluntary switch (kind "switch")
      menu.innerHTML = "";
      menu.appendChild(el("div", { class: "duel-turn " + (posOf(ptr.side)) },
        kind === "next" ? "💫 " + u.name + " — choose your next Pokémon!" : "🔄 " + u.name + " — switch to who?"));
      menu.appendChild(el("div", { class: "duel-party-row" }, bench(u).map((x) =>
        el("button", { class: "duel-bench", onClick: () => {
          if (kind === "next") sendAct({ seq: S.seq + 1, kind: "next", side: ptr.side, unit: ptr.unit, to: x.i });
          else sendAct({ seq: S.seq + 1, kind: "order", side: ptr.side, unit: ptr.unit, order: { kind: "switch", to: x.i } });
        } }, [
          frontSprite(x.m.id, x.m.shiny) ? el("img", { src: frontSprite(x.m.id, x.m.shiny), alt: x.m.name }) : el("span", { class: "draft-thumb-ball" }),
          el("span", { class: "duel-bench-txt" }, x.m.name + " · " + x.m.hp + "/" + x.m.hpMax),
        ]))));
      if (allowBack) menu.appendChild(el("div", { class: "battle-menu-row" },
        [el("button", { class: "btn subtle sm", onClick: renderMenu }, "↩ Back")]));
    }

    function pickTarget(u, ptr, mIdx, z) {
      const foes = livingEnemies(ptr.side);
      if (foes.length <= 1) { doMove(u, ptr, mIdx, foes.length ? foes[0].i : 0, z); return; }
      // 💠 Spread moves (Surf, Earthquake…) hit EVERY foe — nothing to pick,
      // so the "Which target?" screen is skipped entirely.
      const smv = mIdx === 99 ? STRUGGLE : mon(u).moves[mIdx];
      if (smv && smv.spread) { doMove(u, ptr, mIdx, foes[0].i, z); return; }
      menu.innerHTML = "";
      menu.appendChild(el("div", { class: "duel-turn " + (posOf(ptr.side)) }, "🎯 Which target?"));
      menu.appendChild(el("div", { class: "battle-menu-row" }, foes.map((x) =>
        el("button", { class: "btn primary", onClick: () => doMove(u, ptr, mIdx, x.i, z) },
          mon(x.u).name + " (" + x.u.name + ")"))));
      menu.appendChild(el("div", { class: "battle-menu-row" },
        [el("button", { class: "btn subtle sm", onClick: renderMenu }, "↩ Back")]));
    }

    function doMove(u, ptr, mIdx, tIdx, z) {
      const m = mon(u), mv = mIdx === 99 ? STRUGGLE : m.moves[mIdx];
      const armed = !!z;                               // Dire Hit: unleashed on THIS hit
      S.zmove = false;
      const isStatus = mv.cat === "status";
      // 🌀 an armed Z-Power fires on the next DAMAGING move: ×1.8, can't miss
      const zed = !!u._zArmed && !isStatus && !!mv.pow;
      if (zed) u._zArmed = false;
      // Roll accuracy, crit, damage spread and any effect proc NOW (baked into
      // the synced order); type effect + stat/burn mods are applied at
      // resolution against whoever's actually standing there (re-target safe).
      const accMod = stageMul(m.stg ? m.stg.acc : 0);
      const miss = !zed && !armed && mv.acc < 101 && (Math.random() * 100 >= mv.acc * accMod);
      const highCrit = !!(mv.fx && mv.fx.crit === "high");
      // Crit odds run canon-flavored: 5% base, 12.5% for high-crit moves
      // (Slash, Razor Leaf…), and crits hit ×1.5 — not ×2 — so a lucky
      // streak stings instead of deleting the run. The Dire Hit still
      // guarantees the crit.
      const crit = !miss && !isStatus && (armed || Math.random() < (highCrit ? 0.125 : 0.05));
      // the damage roll is baked HERE (synced in the order) — the live model
      // folds it into base; 🎛️ cartridge applies it at resolution (o.roll)
      const roll = 0.85 + Math.random() * 0.15;
      const base = (miss || isStatus) ? 0 : Math.max(1, Math.round(mv.pow * (zed ? 1.8 : 1) * m.atk * offTilt(m, mv) * (crit ? 1.5 : 1) * roll));
      // Secondary effect: does it proc? (self-buff status moves always do.)
      let fxHit = false, slpTurns = 0;
      if (mv.fx && !miss) {
        let ch = 100;
        if (mv.fx.status) ch = mv.fx.status.chance;
        else if (mv.fx.flinch != null) ch = mv.fx.flinch;
        else if (mv.fx.confuse != null) ch = mv.fx.confuse;
        else if (mv.fx.stat && mv.fx.stat.chance != null) ch = mv.fx.stat.chance;
        // (fx.stats setup/drawback moves are always 100% → ch stays 100)
        fxHit = Math.random() * 100 < (ch == null ? 100 : ch);
        if (fxHit && mv.fx.status && mv.fx.status.id === "slp") slpTurns = 2 + Math.floor(Math.random() * 3);
      }
      // Baked at pick time so the SAME-turn status check at resolution (para
      // full-skip / freeze thaw) is deterministic across every phone.
      const statusRoll = Math.random();
      // ⚠ ILLEGAL-form disobedience: a mon fielded ABOVE the cap's law (a
      // true-form Venusaur on a Lv 14 field, base form never caught) ignores
      // orders HALF the time — flat 50%, one stage over or two. Rolled at
      // pick time like everything else, so watchers replay the same tantrum.
      // A mid-charge mon always completes its move (no stuck Dig).
      const loaf = !m._charging && !!(u.defy && u.defy[m.id]) && Math.random() < 0.5;
      // 💫 If the actor is confused, its coin-toss (50% hit yourself), the
      // self-hit damage spread, and the incoming confusion DURATION (for
      // moves that inflict it) are all baked here — every phone replays the
      // same stumble. A mid-charge mon still completes its move.
      const conf = (!m._charging && (m._confN || 0) > 0)
        ? { self: Math.random() < 0.5, dmg: CART && m.cart
            // 🎛️ cartridge confusion: the classic 40-pow typeless self-hit
            ? Math.max(1, Math.round((Math.floor(Math.floor(Math.floor(2 * (m.lvl || 50) / 5 + 2) * 40 * m.cart.atk / Math.max(1, m.cart.def)) / 50) + 2) * (0.85 + Math.random() * 0.15)))
            : Math.max(1, Math.round(40 * m.atk * (0.85 + Math.random() * 0.15))) }
        : null;
      const confN = 2 + Math.floor(Math.random() * 3);
      sendAct({ seq: S.seq + 1, kind: "order", side: ptr.side, unit: ptr.unit,
        order: { kind: "move", move: mIdx, tUnit: tIdx, miss: miss, crit: crit, base: base, roll: roll, statusRoll: statusRoll,
          armed: armed, courage: armed, loaf: loaf, conf: conf, confN: confN, zed: zed,
          pri: (mIdx === 99 ? 0 : (mv.pri || 0)), fxHit: fxHit, slpTurns: slpTurns } });
    }

    // ---- gym-leader AI: picks the hardest-hitting move vs the best target,
    // sends the next mon on a faint. No items — leaders play it straight.
    function aiAct(u, ptr) {
      if (S.done) return;
      if (S.pending) {
        const b = bench(u);
        if (b.length) sendAct({ seq: S.seq + 1, kind: "next", side: ptr.side, unit: ptr.unit, to: b[0].i });
        return;
      }
      const m = mon(u);
      // Recharging AI: it must waste the turn too (order resolves as a skip).
      if (m._recharge) { doMove(u, ptr, 0, (livingEnemies(ptr.side)[0] || { i: 0 }).i); return; }
      // Mid two-turn move: it's locked into completing the charge move.
      if (m._charging) { doMove(u, ptr, m._charging.move, (livingEnemies(ptr.side)[0] || { i: 0 }).i); return; }
      // 🧢 A WORLD-CHAMPION SCRIPT (u.gimmicks): the ultimate boss doesn't
      // share the one-spectacle-per-side rule — each scripted party slot
      // transforms on its first action (Mega Charizard, G-Max Gengar,
      // Z-Pikachu…). Free, like every transform; the attack follows.
      if (u.gimmicks) {
        const plan = u.gimmicks[u.cur];
        if (plan && !m._gimmed) {
          m._gimmed = true;
          if (plan.g === "mega" && plan.megaId) { megaEvolve(u, ptr, plan.megaId); return; }
          if (plan.g === "z") { zPower(u, ptr); return; }
          if (plan.g === "dyna") { dynamax(u, ptr, plan.gmax); return; }
          if (plan.g === "tera") { teraize(u, ptr, plan.teraType || aiTeraType(u, ptr)); return; }
        }
      }
      // 🎪 THE ACE'S SPECTACLE — a boss unleashes its region's gimmick the
      // moment its LAST Pokémon (a 3+ squad down to one) hits the field: a
      // Paldea leader terastallizes, Galar Dynamaxes, Alola fires a Z-Move,
      // Kalos Mega Evolves (if its ace has a form). It's free (doesn't cost
      // the turn) — fire it, then renderMenu re-schedules aiAct to attack.
      if (aiGimmick(u, ptr)) return;
      let best = null, bestStatus = null;
      livingEnemies(ptr.side).forEach((f) => {
        m.moves.forEach((mv, i) => {
          if (mv.cat === "status") {
            // Value a status/setup move a little — enough to use it sometimes,
            // never over a solid attack.
            const s = 22 * (mv.acc >= 101 ? 1 : mv.acc / 100);
            if (!bestStatus || s > bestStatus.score) bestStatus = { score: s, mIdx: i, tIdx: f.i };
            return;
          }
          const score = mv.pow * effFor(mv.type, mon(f.u).types, mv) * (mv.acc / 100)
            * ((m.types || []).indexOf(mv.type) >= 0 ? 1.2 : 1)
            // ⚖️ lean-aware: a special attacker favors its special moves, and
            // nobody Thunderbolts a Chansey when Body Slam is on the menu
            * offTilt(m, mv) * defTilt(mon(f.u), mv);
          if (!best || score > best.score) best = { score: score, mIdx: i, tIdx: f.i };
        });
      });
      if (best && best.score > 0) { doMove(u, ptr, best.mIdx, best.tIdx); return; }
      if (bestStatus) { doMove(u, ptr, bestStatus.mIdx, bestStatus.tIdx); return; }   // walled → try status
      doMove(u, ptr, 99, (livingEnemies(ptr.side)[0] || { i: 0 }).i);   // nothing → Struggle
    }

    // 💎 The AI ace picks its Tera type like a champion, not a mirror. Every
    // type it can actually attack with (plus its own) is scored: OFFENSE — the
    // ×1.5 tera STAB measured against everything left on the player's bench;
    // DEFENSE — how the mono-tera shell takes the fielded foe's known moves;
    // and a nudge AWAY from its own types, because the scary tera is the one
    // you didn't see coming (a Dragon ace crystallizing into Steel as your
    // Fairy sweeper winds up).
    function aiTeraType(u, ptr) {
      const m = mon(u);
      const own = m.types || ["normal"];
      const atkTypes = [];
      (m.moves || []).forEach((v) => { if (v.pow && v.type !== "none" && atkTypes.indexOf(v.type) < 0) atkTypes.push(v.type); });
      const cands = atkTypes.concat(own.filter((t) => atkTypes.indexOf(t) < 0));
      if (!cands.length) return own[0];
      const bench = sideMons(other(ptr.side)).filter((x) => x.hp > 0);
      const fielded = livingEnemies(ptr.side).map((f) => mon(f.u));
      let best = own[0], bestScore = -Infinity;
      cands.forEach((t) => {
        let score = 0;
        // offense: the tera STAB only matters if a damaging move carries it
        if (atkTypes.indexOf(t) >= 0) bench.forEach((f) => { score += 2 * (effFor(t, f.types || [], null) - 1); });
        // defense: how the mono-t shell eats what's aimed at it right now
        fielded.forEach((f) => (f.moves || []).forEach((v) => { if (v.pow) score -= (effFor(v.type, [t], v) - 1); }));
        if (own.indexOf(t) >= 0) score -= 0.75;   // prefer the surprise
        if (score > bestScore) { bestScore = score; best = t; }
      });
      return best;
    }

    // 🎪 The AI ace's once-per-battle gimmick. Fires only when a boss's LAST
    // Pokémon (a real squad, 3+, down to one) is on the field and the side's
    // spectacle slot is still free. Returns true if it transformed (the caller
    // waits a beat, then attacks). Region-native: u.gimmick is set by the
    // gym/league caller from the leader's region.
    function aiGimmick(u, ptr) {
      if (!u.gimmick || S.megaSide[ptr.side]) return false;
      const m = mon(u);
      const isAce = u.party.length >= 3 && u.party.filter((x) => x.hp > 0).length === 1;
      if (!isAce) return false;
      if (m.megaId || m._tera || m._dyna || u._zArmed) return false;   // already spent
      if (u.gimmick === "mega") {
        const ids = (window.MEGA_BY_BASE && MEGA_BY_BASE[m.id]) || null;
        if (!ids || !ids.length) return false;                        // this ace has no mega
        megaEvolve(u, ptr, ids[0]); return true;
      }
      if (u.gimmick === "z") { zPower(u, ptr); return true; }
      if (u.gimmick === "dyna") { dynamax(u, ptr); return true; }
      if (u.gimmick === "tera") { teraize(u, ptr, aiTeraType(u, ptr)); return true; }
      return false;
    }

    // ✨ Mega Evolution — a free pre-move transform (doesn't cost the turn).
    // Swaps the active mon's stats/types/sprite/name to its mega form, once per
    // side per battle, and records the form to the trainer's Mega-Dex.
    function megaEvolve(u, ptr, megaId) {
      const m = mon(u);
      // level-capped battles (True Story, Stadium cups) mega WITHIN the cap —
      // the form swaps, the HP pool and curve do not escape the level.
      const meg = statsFor(megaId, CART ? (m.lvl || 50) : opts.level);
      const ratio = m.hpMax ? (m.hp / m.hpMax) : 1;
      const was = m.name;
      m.megaId = megaId;
      m.hpMax = meg.hpMax;
      m.x = meg.x; m.types = meg.types; m.spe = meg.spe;
      m.lean = meg.lean;   // ⚖️ a stat-flipped mega (Mewtwo X!) changes its identity
      m.atk = meg.atk * (1 + Math.min(0.1, 0.01 * (m.kos0 || 0)));
      // 🎛️ cartridge: the mega's REAL stats at the same level (HP ratio kept)
      if (CART) { m.cart = CartridgeMode.statsAt(megaId, m.lvl || 50); m.hpMax = m.cart.hp; m.spe = m.cart.spe; }
      m.hp = Math.max(1, Math.round(m.hpMax * ratio));
      m.name = meg.name;
      // 🧬 adopt the mega's moveset so a type-CHANGING form can wield its new
      // STAB (Mega Charizard X gains a Dragon move it never had as Charizard).
      // Same-type megas keep their kit — only the gained element is added.
      m.moves = meg.moves;
      S.megaSide[ptr.side] = true;
      try { if (u.attId && window.Store && Store.recordMega) Store.recordMega(u.attId, megaId); } catch (_) {}
      renderSprites(ptr.side); renderHp(ptr.side);
      if (u._monEl) { u._monEl.classList.add("mega-go"); setTimeout(() => { if (u._monEl) u._monEl.classList.remove("mega-go"); }, 1000); }
      sfx("fanfare");
      msg.textContent = "✨ " + was + " Mega Evolved into " + meg.name + "!";
      renderMenu();
    }

    // 🎪 GENERATION GIMMICKS — each is a once-per-side battle moment sharing
    // the Mega slot (one spectacle per side per battle, pick your era):
    // 🌀 Z-MOVE (Alola open): arm it, and the next damaging move hits ×1.8
    //    and cannot miss. 🔴 DYNAMAX (Galar open): HP pool ×1.75 for 3 turns,
    //    then it shrinks back (ratio kept; ends early on switch-out).
    // 💎 TERASTALLIZE (Paldea open): crystallize into the primary type —
    //    mono-typed from here on, tera-type moves at the full ×1.5 STAB.
    function zPower(u, ptr) {
      const m = mon(u);
      S.megaSide[ptr.side] = true;
      u._zArmed = true;
      if (u._monEl) u._monEl.classList.add("z-charge");
      sfx("fanfare");
      msg.textContent = "🌀 " + m.name + " is surrounded by Z-Power! Its next strike will be devastating!";
      renderMenu();
    }
    function dynamax(u, ptr, gmax) {
      const m = mon(u);
      S.megaSide[ptr.side] = true;
      const ratio = m.hpMax ? m.hp / m.hpMax : 1;
      m._dynaBase = m.hpMax;
      m._dyna = 3;
      m.hpMax = Math.round(m.hpMax * 1.75);
      m.hp = Math.max(1, Math.round(m.hpMax * ratio));
      if (u._monEl) u._monEl.classList.add("dyna");
      renderHp(ptr.side);
      sfx("fanfare");
      msg.textContent = gmax
        ? "🔴 " + m.name + " GIGANTAMAXED — its shape itself has changed! It looms over the whole field! (3 turns)"
        : "🔴 " + m.name + " DYNAMAXED — it towers over the field! (3 turns)";
      renderMenu();
    }
    function teraize(u, ptr, pick) {
      const m = mon(u);
      S.megaSide[ptr.side] = true;
      // any of the 18 — the player picks from the crystal grid, the AI ace
      // picks the meanest option (aiTeraType); default stays the primary.
      const t = pick || (m.types || ["normal"])[0];
      m._teraBase = (m.types || []).slice();   // original STAB survives the crystal
      m._tera = t;
      m.types = [t];
      if (u._monEl) u._monEl.classList.add("tera");
      sfx("fanfare");
      msg.textContent = "💎 " + m.name + " TERASTALLIZED into pure " + t.toUpperCase() + " — its " + t + " moves shine at full power!";
      renderMenu();
    }

    // 🎪 Route a player's transform through the act stream — one code path
    // for hot-seat, remote duels and broadcast watchers alike, so every
    // phone plays the same spectacle at the same seq.
    function fireGimmick(u, ptr, g, x) {
      sendAct(Object.assign({ seq: S.seq + 1, kind: "gimmick", g: g, side: ptr.side, unit: ptr.unit }, x || {}));
    }

    // 💎 The Tera crystal is YOURS to color — pick any of the 18 types.
    // ⚔-marked chips are types this mon can actually attack with (where the
    // ×1.5 tera STAB shines); its current types wear a ring.
    function teraPicker(u, ptr) {
      const m = mon(u);
      menu.innerHTML = "";
      menu.appendChild(el("div", { class: "duel-turn " + posOf(ptr.side) },
        "💎 " + m.name + " — crystallize into which type?"));
      const atk = {};
      (m.moves || []).forEach((v) => { if (v.pow && v.type !== "none") atk[v.type] = 1; });
      menu.appendChild(el("div", { class: "tera-grid" }, Object.keys(TYPE_COLOR).map((t) =>
        el("button", { class: "tera-chip" + ((m.types || []).indexOf(t) >= 0 ? " own" : ""),
          style: { "--tc": TYPE_COLOR[t] },
          onClick: () => fireGimmick(u, ptr, "tera", { teraType: t }) },
          (atk[t] ? "⚔ " : "") + t.toUpperCase()))));
      menu.appendChild(el("div", { class: "battle-menu-row" },
        [el("button", { class: "btn subtle sm", onClick: () => renderMenu() }, "← Back")]));
    }

    function renderMenu() {
      if (S.done) return;
      menu.innerHTML = "";
      const ptr = S.pending || S.actor;
      const u = sides[ptr.side].units[ptr.unit];
      // Only the hosting phone rolls the AI's dice — watchers replay its
      // acts from the stream like any other player's.
      if (u.ai && mode !== "watch") {
        menu.appendChild(el("div", { class: "duel-wait" }, "🤖 " + u.name +
          (S.pending ? " sends out the next Pokémon…" : " is planning an attack…")));
        setTimeout(() => {
          const p2 = S.pending || S.actor;
          if (!S.done && !S.busy && sides[p2.side].units[p2.unit] === u) aiAct(u, p2);
        }, 1400);
        return;
      }
      if (mode === "watch" || !isMine(u)) {
        // (watchers' reactions + leave live in the persistent duel-watch-bar)
        menu.appendChild(el("div", { class: "duel-wait" },
          (mode === "watch" ? "👀 " : "⏳ ") + u.name +
          (S.pending ? " is choosing the next Pokémon…" : " is choosing…")));
        return;
      }
      // it's this phone's pick — ping if the app is backgrounded (once per turn)
      if (mode === "remote" && window.AppNotify && AppNotify.ping) {
        const k = S.seq + (S.pending ? "p" : "m");
        if (S.pinged !== k) {
          S.pinged = k;
          AppNotify.ping("🎮 Your move!", S.pending ? "Choose your next Pokémon" : "What will " + mon(u).name + " do?");
        }
      }
      if (S.pending) { partyPanel(u, ptr, "next", false); return; }
      const m = mon(u);
      // Everything immune against everything standing? Struggle keeps the
      // fight alive (typeless, always usable).
      const foes = livingEnemies(ptr.side);
      // Recharging from last turn's blast — the turn is spent. One tap to ride
      // it out (the order resolves as a forced skip).
      if (m._recharge) {
        menu.appendChild(el("div", { class: "duel-turn " + (posOf(ptr.side)) }, "💤 " + m.name + " must recharge!"));
        menu.appendChild(el("div", { class: "battle-menu-row" },
          [el("button", { class: "btn primary", onClick: () => doMove(u, ptr, 0, (foes[0] || { i: 0 }).i) }, "💤 Recharge…")]));
        return;
      }
      // Mid two-turn move (Dig/Fly/Solar Beam…) — it must strike this turn.
      if (m._charging) {
        const cm = m.moves[m._charging.move] || m.moves[0];
        menu.appendChild(el("div", { class: "duel-turn " + (posOf(ptr.side)) }, "⚡ " + m.name + " is charging " + cm.name + "!"));
        menu.appendChild(el("div", { class: "battle-menu-row" },
          [el("button", { class: "btn primary", onClick: () => doMove(u, ptr, m._charging.move, (foes[0] || { i: 0 }).i) }, "💥 Unleash " + cm.name + "!")]));
        return;
      }
      const walled = m.moves.every((mv) => foes.every((f) => effFor(mv.type, mon(f.u).types, mv) === 0));
      // Dire Hit armed: Z-move style — it's active, now unleash
      // a move on THIS same turn (can't miss, guaranteed crit).
      if (S.zmove) {
        menu.appendChild(el("div", { class: "duel-turn " + (posOf(ptr.side)) },
          "🎯💥 DIRE HIT — " + u.name + ", unleash a move!"));
        const zEls = m.moves.map((mv, i) => moveBtn(mv, () => pickTarget(u, ptr, i, true)));
        if (walled) zEls.push(moveBtn(STRUGGLE, () => pickTarget(u, ptr, 99, true)));
        menu.appendChild(el("div", { class: "duel-moves zmove" }, zEls));
        return;
      }
      menu.appendChild(el("div", { class: "duel-turn " + (posOf(ptr.side)) },
        "🎮 " + u.name + " — what will " + m.name + " do?"));
      const moveEls = m.moves.map((mv, i) => moveBtn(mv, () => pickTarget(u, ptr, i)));
      if (walled) moveEls.push(moveBtn(STRUGGLE, () => pickTarget(u, ptr, 99)));
      menu.appendChild(el("div", { class: "duel-moves" }, moveEls));
      // ✨ Mega Evolve + the era gimmicks — offered to this slot's own phone
      // when the side's spectacle slot is free. Against the AI they unlock
      // down the Gen Ladder (earn your eras); a PURE friend-vs-friend duel —
      // hot-seat OR phone-to-phone — opens ALL of them: the full sandbox.
      // Every transform routes through the act stream (fireGimmick), so
      // remote opponents and watchers replay the same spectacle.
      const megaIds = (window.MEGA_BY_BASE && MEGA_BY_BASE[m.id]) || null;
      const pvp = !sides.a.units.some((x) => x.ai) && !sides.b.units.some((x) => x.ai);
      // 🏟 A RULESET (opts.gims) overrides everything: a Mega Cup offers ONLY
      // the Mega button (regardless of Gen Ladder), a "no gimmicks" friendly
      // offers none ([]). Without one: PvP opens all, vs-AI stays era-gated.
      const allow = opts.gims || null;
      const can = (g, dflt) => allow ? allow.indexOf(g) >= 0 : dflt;
      const cap = (window.Store && Store.genCapFor) ? Store.genCapFor(u.attId) : 9;
      const megaOpen = can("mega", pvp || !(window.Store && Store.genCapFor) || cap >= 6);
      if (!u.ai && !S.megaSide[ptr.side] && !m.megaId) {
        const F = window.MEGA_FORMS || {};
        const gims = [];
        if (megaOpen && megaIds && megaIds.length) megaIds.forEach((mid) => gims.push(
          el("button", { class: "btn mega-btn", onClick: () => fireGimmick(u, ptr, "mega", { megaId: mid }) },
            "✨ Mega Evolve" + (megaIds.length > 1 ? " → " + ((F[mid] || {}).n || "Mega").replace(/^Mega /, "") : ""))));
        // 🎪 the era gimmicks unlock down the Gen Ladder, like megas do
        if (can("z", pvp || cap >= 7)) gims.push(el("button", { class: "btn mega-btn gim-z", onClick: () => fireGimmick(u, ptr, "z") }, "🌀 Z-Move"));
        if (can("dyna", pvp || cap >= 8) && !m._dyna) gims.push(el("button", { class: "btn mega-btn gim-dyna", onClick: () => fireGimmick(u, ptr, "dyna") }, "🔴 Dynamax"));
        if (can("tera", pvp || cap >= 9) && !m._tera) gims.push(el("button", { class: "btn mega-btn gim-tera", onClick: () => teraPicker(u, ptr) }, "💎 Terastallize"));
        if (gims.length) menu.appendChild(el("div", { class: "battle-menu-row mega-row" }, gims));
      }
      const row = [];
      if (opts.wild && mode === "local" && !u.ai) {
        // Live odds ON the button — recomputed every turn from the wild
        // mon's remaining HP, so "weaken it" is a number, not a vibe.
        const pct = Math.round(ballChance(mon(sides[other(ptr.side)].units[0])) * 100);
        row.push(el("button", { class: "btn primary sm", onClick: () => {
          sendAct({ seq: S.seq + 1, kind: "order", side: ptr.side, unit: ptr.unit, order: { kind: "ball", roll: Math.random() } });
        } }, "🔴 Throw Ball · " + pct + "%"));
      }
      row.push(
        el("button", { class: "btn subtle sm", disabled: u.potions > 0 ? null : "true", onClick: () => {
          confirmPanel("🧪 Potion — " + m.name + " heals 120 HP. (Takes this turn; " + u.potions + " left this battle.)",
            "✅ Use Potion — heal!", () => sendAct({ seq: S.seq + 1, kind: "order", side: ptr.side, unit: ptr.unit, order: { kind: "potion" } }));
        } }, "🧪 Potion ×" + u.potions),
        el("button", { class: "btn subtle sm", disabled: u.courage ? null : "true", onClick: () => {
          confirmPanel("🎯 Dire Hit — " + u.name + " UNLEASHES a move this same turn: it can't miss and lands a guaranteed CRITICAL HIT. (Once per battle.)",
            "🎯 Dire Hit — power up!", () => { S.zmove = true; sfx("correct"); renderMenu(); });
        } }, "🎯 Dire Hit"));
      if (bench(u).length) row.push(el("button", { class: "btn subtle sm", onClick: () => partyPanel(u, ptr, "switch", true) }, "🔄 Switch"));
      row.push(el("button", { class: "btn subtle sm", onClick: () => {
        if (!S.moved) {                           // nothing happened yet — just walk away (hot-seat only)
          if (mode === "local") {
            if (liveLocal) try { Sync.finishLiveBattle(liveId, ""); if (castId) Sync.endRemoteDuel(castId, ""); if (castUnsub) { castUnsub(); castUnsub = null; } } catch (_) {}
            close(); return;
          }
        }
        if (confirm("Give up? " + label(other(ptr.side)) + " take" + (sides[other(ptr.side)].units.length > 1 ? "" : "s") + " the win.")) {
          sendAct({ seq: S.seq + 1, kind: "forfeit", side: ptr.side, unit: ptr.unit });
        }
      } }, "🏳️ Forfeit"));
      menu.appendChild(el("div", { class: "battle-menu-row duel-items" }, row));
    }

    // ---- VS intro, then the faster lead moves first ----
    function vsPanel(cls, s) {
      const mons = [];
      sides[s].units.forEach((u) => {
        if (u.ai) {
          // 🌿 A wild encounter hides nothing — the wild mon itself stares you
          // down in the intro (there's no trainer, no balls).
          if (opts.wild) {
            const wm = mon(u);
            const wsrc = frontSprite(wm.id, wm.shiny);
            mons.push(wsrc ? el("img", { class: "vs-mon vs-boss", src: wsrc, alt: "" }) : el("div", { class: "battle-ball-inner vs-mon" }));
            return;
          }
          // A boss can stare you down with its own portrait (Mewtwo) instead of
          // hiding behind balls.
          if (u.vsFace) {
            const fsrc = frontSprite(u.vsFace, false);
            mons.push(fsrc ? el("img", { class: "vs-mon vs-boss", src: fsrc, alt: "" }) : el("div", { class: "battle-ball-inner vs-mon" }));
            return;
          }
          // Gym leaders keep their team in the balls — one ball per mon,
          // identities hidden until they're sent out. (Hidden reserves don't
          // even get a ball — you're not supposed to know they exist.)
          u.party.slice(0, u.party.length - (u.reserve || 0)).forEach(() => mons.push(el("div", { class: "battle-ball-inner vs-mon" })));
          return;
        }
        const m = mon(u);
        const src = frontSprite(m.id, m.shiny);
        mons.push(src ? el("img", { class: "vs-mon", src: src, alt: "" }) : el("div", { class: "battle-ball-inner vs-mon" }));
      });
      return el("div", { class: "vs-panel " + cls }, [
        el("div", { class: "vs-mons" }, mons),
        el("div", { class: "vs-name" }, label(s)),
      ]);
    }
    const vs = el("div", { class: "battle-vs" }, [vsPanel("a", myView), el("div", { class: "vs-badge" }, "VS"), vsPanel("b", other(myView))]);
    document.documentElement.classList.add("scroll-lock");
    document.body.appendChild(overlay);
    overlay.appendChild(vs);
    if (window.SFX && SFX.battleMusic) SFX.battleMusic(true);
    sfx("blip");
    requestAnimationFrame(() => vs.classList.add("go"));
    setTimeout(() => sfx("select"), 300);
    setTimeout(() => {
      vs.classList.add("out");
      setTimeout(() => vs.remove(), 400);
      overlay.classList.add("go", "ready");
      sfx("blip");
      const lead = sides[S.first].units[0];
      msg.textContent = "Choose your moves — the fastest strikes first!";
      setTimeout(() => { if (!S.done) { S.ready = true; beginSelect(); pump(); } }, 900);
    }, 1700);

    // `alive` lets the app tell a screen that's really up from stale
    // bookkeeping (an overlay torn down without its onEnd ever firing).
    return { receiveActs: receiveActs, receiveRx: receiveRx, close: close,
      alive: function () { return document.body.contains(overlay); } };
  }

  window.Duel = { start: start, statsFor: statsFor, poolFor: poolFor, pickParty: pickParty, pickTrainer: pickTrainer, pickLead: pickLead,
    _capMoves: capMoves, _residualDiv: RESIDUAL_DIV, _effFor: effFor };   // test seams
})();
