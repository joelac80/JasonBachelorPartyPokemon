/* cartridge-mode.js — 🎛️ CARTRIDGE MODE (hidden beta switch).
 *
 * When ON, duel.js swaps its compressed stat model for the real games':
 * true base stats (data/dex-stats.js) at REAL levels, the cartridge damage
 * formula with actual Atk/Def division, full 1.5 STAB (2.0 tera-on-own-type).
 * Difficulty comes from LEVELS ALONE — no boss stat multipliers.
 *
 * 🎢 THE CURVE (tuned by 27k+ simulated fights, test-cartcurve.mjs):
 * challenge rises from badge 1 to the Champion inside EVERY region, then
 * resets for the next — a 1-to-champion arc, no cartridge-style gym-3 hump.
 * Two mechanisms per foe:
 *   EDGE — levels over the reference, by position (badge 1 fodder −2 …
 *     badge 8 ace +5; E4 chambers climb +2…+7; Champion +5/+7; RED +9/+13;
 *     Ash +7/+11).
 *   NORMALIZATION — a species' level bends toward its position's power
 *     budget (level ≈ edge·ref/BST, clamped −5…+2): a Miltank fights a few
 *     levels LOWER, a Sentret a few higher. Species luck stops deciding
 *     difficulty; position does. (Champions may normalize UP to +3 so a
 *     modest-species champ still bites.)
 * Trainers with plain `boost` multipliers (nuzlocke curve, encounters,
 * tower…) get the boost TRANSLATED into a level edge (×1.1≈+2, ×1.2≈+4,
 * ×1.35≈+7, ×1.5≈+9), so the nuzlocke/randomizer difficulty arc carries
 * straight over — same landscape, real math.
 *
 * The flag is per phone and rides into remote duel setups so both sides
 * always run the same engine. Toggle: CartridgeMode.enable() in a console,
 * or 7 quick taps on the version dot at the foot of “Every Way to Play”.
 */
(function () {
  "use strict";
  const KEY = "jasonBachHub.cartridge.v1";
  // 🎛️ DEFAULT ON. This is the engine now: a Snorlax should shrug off a hit a
  // Magikarp dies to, and only real base stats give you that. The old
  // compressed model drove bulk AND offence off one number, so Blissey was the
  // tankiest thing in the game *and* one of the hardest hitters, while Shuckle
  // died in the same two hits as a Caterpie. Opt-OUT is still honoured for
  // anyone who explicitly turned it off (stored "0"), so a phone that chose
  // classic keeps classic.
  const on = () => { try { return localStorage.getItem(KEY) !== "0"; } catch (_) { return true; } };
  const set = (v) => { try { localStorage.setItem(KEY, v ? "1" : "0"); } catch (_) {} };

  const CURVE = {
    // 🪜 SMOOTHED + STEEPER. The old ramp (fodder -2→3, ace 0→5) left badges 1-6
    // at almost no edge and then spiked on badge 8 — a measured sweep read 100%
    // for six straight gyms, then a cliff. Start the region with real pressure
    // and climb to a higher ceiling, so the whole run bites instead of the tail.
    gymFodderEdge: [0, 4], gymAceEdge: [2, 6],        // badge 1 → badge 8 (lerp)
    gymFodderRef: [340, 500], gymAceRef: [380, 560],
    lgFodderEdge: [2, 1], lgAceEdge: [4, 1],          // E4 chamber q: base + q·step
    lgFodderRef: 500, lgAceRef: 580, bossAceRef: 600,
    champEdge: { f: 5, a: 7 }, redEdge: { f: 9, a: 13 }, ashEdge: { f: 7, a: 11 },
    genFodderRef: 500, genAceRef: 560,                // boost-translated trainers
    normDown: 5, normUp: 2, bossNormUp: 3,
    // per-boss hand tuning (league key → edge delta): the two champions the
    // simulator flagged as walls even at even edges — real bulk is enough.
    overrides: { cynthia: -2, alder: -2 },
  };

  // 🎖 SIGNATURE MONS — the forms the story remembers. A leader's ACE never
  // devolves past its iconic form (Falkner's bird is PIDGEOTTO at badge 1,
  // Misty's star is STARMIE, Morty's shadow is GENGAR — level be damned),
  // while un-pinned aces walk the era law as usual (Brock opens with ONIX;
  // Steelix is Jasmine's story). `tank: true` exempts a famous single-stage
  // terror from species normalization — Whitney's MILTANK fights at its full
  // position edge with its full real bulk. The wall is the point.
  // `move` is the 🎵 SIGNATURE MOVE — the attack the story remembers,
  // guaranteed on the ace even when the level curve trims its kit
  // (Rollout isn't in the move DB, so Whitney menaces with Body Slam).
  const SIG = {
    FALKNER: { minForm: 17 }, BUGSY: { minForm: 123, move: "Fury Cutter" },
    WHITNEY: { tank: true, move: "Body Slam" }, CHUCK: { move: "Dynamic Punch" },
    MORTY: { minForm: 94, move: "Shadow Ball" }, JASMINE: { minForm: 208, move: "Iron Tail" },
    PRYCE: { minForm: 221, move: "Blizzard" }, CLAIR: { minForm: 230, move: "Hyper Beam" },
    MISTY: { minForm: 121, move: "Bubble Beam" }, "LT. SURGE": { minForm: 26, move: "Thunderbolt" },
    ERIKA: { minForm: 45, move: "Petal Dance" }, KOGA: { move: "Sludge Bomb" },
    SABRINA: { minForm: 65, move: "Psychic" }, BLAINE: { minForm: 59, move: "Fire Blast" },
    GIOVANNI: { move: "Earthquake" },
    MAYLENE: { minForm: 448, move: "Aura Sphere" },
    VIOLA: { minForm: 666 }, CLEMONT: { minForm: 695 }, VALERIE: { minForm: 700 },
    NESSA: { minForm: 834 }, KABU: { minForm: 851 }, ALLISTER: { minForm: 94 }, OPAL: { minForm: 869 },
    IONO: { minForm: 939 },
  };
  // 👑 league aces carry theirs too — keyed by stage key, famous ones only
  const LEAGUE_SIG = {
    lorelei: "Ice Beam", brunok: "Dynamic Punch", bruno: "Dynamic Punch", agatha: "Shadow Ball",
    lance4: "Hyper Beam", lance: "Hyper Beam", karen: "Crunch", blue: "Hydro Pump",
    cynthia: "Draco Meteor", steven: "Meteor Mash", red: "Volt Tackle",
  };
  // The move a foe's ACE is guaranteed to know, if the story pinned one.
  function sigMove(opts, ace) {
    if (!ace || !opts) return null;
    if (opts.gym && SIG[opts.gym.leader]) return SIG[opts.gym.leader].move || null;
    if (opts.league) return LEAGUE_SIG[opts.league.key] || null;
    return null;
  }
  let PRE = null;
  const preMap = () => {
    if (PRE) return PRE;
    PRE = {};
    Object.keys(window.EVO_LEVELS || {}).forEach((f) =>
      (window.EVO_LEVELS[f] || []).forEach((e) => { PRE[e.to] = +f; }));
    return PRE;
  };
  // 💪 THE FODDER POWER FLOOR. The era law devolves a leader's supporting mons
  // to whatever their level allows, with nothing stopping the walk — so a
  // BADGE-4 gym fielded a Feebas (BST 200), a Slugma (250) and a Tynamo (275).
  // A gym leader four badges deep should not be handing you free switches.
  // Devolve as the era law says, then step back UP the line until the form
  // clears a floor that rises with the badge (BST 280 at Lv 14 → 450 at Lv 48).
  // A genuinely weak LINE (Farfetch'd, Dunsparce) has nowhere to climb and
  // simply keeps its true form — weak species stay weak, which is the point.
  const fodderFloor = (opts) => {
    const L = opts && opts.level;
    if (!L) return 0;                                     // ⚔ Challenge never devolves
    return Math.round(280 + Math.max(0, Math.min(1, (L - 14) / 34)) * 170);
  };
  function fodderFloored(opts, trueId, devolved) {
    if (devolved === trueId) return devolved;
    const floor = fodderFloor(opts);
    if (!floor || bstOf(devolved) >= floor) return devolved;
    // walk trueId → … → devolved, then take the MOST devolved form that clears
    const P = preMap(), path = [trueId];
    let x = trueId, guard = 0;
    while (P[x] && x !== devolved && guard++ < 6) { x = P[x]; path.push(x); }
    for (let i = path.length - 1; i >= 0; i--) if (bstOf(path[i]) >= floor) return path[i];
    return trueId;                                        // the whole line is under it
  }
  // The form a foe's mon takes at its level — devolution with the iconic floor.
  // 👑 THE ACE KEEPS ITS TRUE FORM. That is the contract everywhere else in the
  // app (the classic path exempts the last slot outright), it is what makes a
  // leader's signature Pokémon the boss moment, and without it a leader who
  // isn't hand-listed in SIG fielded an UNEVOLVED ace — a Lv 29 Skiddo closing
  // RAMOS's gym instead of his Gogoat, ONIX for Brock, RIOLU for Korrina.
  // SIG.minForm is the opposite lever: a curated SOFTENING for the few early
  // leaders whose full final form would be brutal at badge-1 levels (FALKNER
  // closes with PIDGEOTTO, not a full Pidgeot at Lv 11). Listed → step down to
  // that floor; unlisted → the ace stands at full power.
  function formFor(opts, id, lvl, ace) {
    const f = window.JourneyStyle ? JourneyStyle.formAt(id, lvl) : id;
    if (!ace) return fodderFloored(opts, id, f);          // era law, with a power floor
    const sig = opts && opts.gym && SIG[opts.gym.leader];
    if (!sig || !sig.minForm) return id;                  // 👑 true form, always
    if (f === sig.minForm) return f;
    // if the devolve walked PAST the iconic form, stop AT the iconic form
    const P = preMap();
    let cur = sig.minForm, guard = 0;
    while (cur && guard++ < 6) { if (cur === f) return sig.minForm; cur = P[cur] || 0; }
    return f;
  }

  const ST = () => window.DEX_STATS || {};
  const bstOf = (id) => { const s = ST()[id]; return s ? s[0] + s[1] + s[2] + s[3] + s[4] + s[5] : 360; };
  const statAt = (b, L) => Math.floor((2 * b + 31) * L / 100) + 5;
  const hpAt = (b, L, id) => (+id === 292 ? 1 : Math.floor((2 * b + 31) * L / 100) + L + 10);
  const lerp = (a, b, f) => a + (b - a) * f;
  const edged = (R, edge, ref, id, boss) => {
    const E = R + edge, L = Math.round(E * ref / Math.max(200, bstOf(id)));
    const up = boss ? CURVE.bossNormUp : CURVE.normUp;
    return Math.max(5, Math.min(100, Math.max(E - CURVE.normDown, Math.min(E + up, L))));
  };
  // boost multiplier → level edge (how the old tuning carries over)
  const boostEdge = (b) => (!b || b <= 1) ? 0 : Math.max(1, Math.min(12, Math.round(Math.log(b) / Math.log(1.045))));

  // The level plan for one AI trainer's party (aligned to monIds).
  // Player units always fight at the battle reference (story level, or 50).
  function plan(opts, u) {
    // 📖 story passes `level` (which also devolves); ⚔ challenge passes
    // `refLevel` — same reference, NO era devolution, plus a widening foeEdge.
    const R = opts.level || opts.refLevel || 50;
    const SAGA = opts.level ? 0 : (opts.foeEdge || 0);
    // ⚔ CHALLENGE (no story level): species normalization may bend a foe BELOW
    // the reference, which left leaders fighting at L43 against your L50 — the
    // ladder was free. In Challenge nobody drops under the reference: it is an
    // honest even-level fight against a full six, with your bag sealed.
    const floorR = !opts.level;
    const atLeastR = (L) => (floorR ? Math.max(R, L) : L);
    const ids = u.monIds || [];
    const last = ids.length - 1;
    // 🏟 gym battle: position inside its region drives the arc
    if (opts.gym && window.GYM_CIRCUIT) {
      const GYMS = window.GYM_CIRCUIT;
      const g = GYMS[opts.gym.idx];
      if (g) {
        const list = GYMS.map((x, i) => i).filter((i) => GYMS[i].region === g.region);
        const frac = list.length > 1 ? list.indexOf(opts.gym.idx) / (list.length - 1) : 1;
        return ids.map((id, i) => {
          const ace = i === last;
          const e = Math.round(lerp.apply(null, (ace ? CURVE.gymAceEdge : CURVE.gymFodderEdge).concat([frac])));
          // 🎖 a signature TANK (Whitney's Miltank) skips normalization — the
          // famous terror fights at its full edge with its full real bulk
          const sig = ace && SIG[g.leader];
          if (sig && sig.tank) return Math.max(5, Math.min(100, R + e + SAGA));
          const ref = lerp.apply(null, (ace ? CURVE.gymAceRef : CURVE.gymFodderRef).concat([frac]));
          return atLeastR(edged(R, e + SAGA, ref, id, false));
        });
      }
    }
    // 👑 league chamber: q-th step of the region's run; Champions cap it
    if (opts.league && window.LEAGUE_STAGES) {
      const key = opts.league.key;
      const L = window.LEAGUE_STAGES;
      const st = L[opts.league.idx] || {};
      const isRed = key === "red", isAsh = key === "ash";
      let q = 0, isChamp = false;
      if (!isRed && !isAsh && st.region != null) {
        const run = L.map((x, i) => i).filter((i) => L[i].region === st.region && L[i].key !== "red");
        q = Math.max(0, run.indexOf(opts.league.idx));
        isChamp = q === run.length - 1;
      }
      const over = CURVE.overrides[key] || 0;
      return ids.map((id, i) => {
        const ace = i === last;
        const e = (isAsh ? (ace ? CURVE.ashEdge.a : CURVE.ashEdge.f)
          : isRed ? (ace ? CURVE.redEdge.a : CURVE.redEdge.f)
          : isChamp ? (ace ? CURVE.champEdge.a : CURVE.champEdge.f)
          : (ace ? CURVE.lgAceEdge[0] + q * CURVE.lgAceEdge[1] : CURVE.lgFodderEdge[0] + q * CURVE.lgFodderEdge[1])) + over;
        const ref = ace ? ((isRed || isChamp || isAsh) ? CURVE.bossAceRef : CURVE.lgAceRef) : CURVE.lgFodderRef;
        return atLeastR(edged(R, e + SAGA, ref, id, isRed || isChamp || isAsh));
      });
    }
    // 🎲 everything else (nuzlocke curve, encounters, tower, movies, legends):
    // the boss boost translates into a level edge — same landscape, real math.
    // An UNBOOSTED foe is exactly an even match: level R, no normalization.
    return ids.map((id, i) => {
      const b = Array.isArray(u.boost) ? (u.boost[i] || 1) : (u.boost || 1);
      const e = boostEdge(b);
      if (!e) return R;
      return edged(R, e, i === last ? CURVE.genAceRef : CURVE.genFodderRef, id, e >= 8);
    });
  }

  // 🎚 THE LEVEL BELONGS TO THE MON THAT ACTUALLY FIGHTS. plan() budgets a
  // level from a species' BST — but 📖 True Story then DEVOLVES the slot, so a
  // fat true id normalized its level DOWN (clamped E−5) and the little form
  // took the field at that discount: Falkner opened with a Lv 11 Hoothoot
  // against a Lv 14 challenger, and 48 of 68 story gyms were quietly softened.
  // Fix: resolve the FORM first, re-budget on the form, repeat until the pair
  // stops moving. `lvls` is ALWAYS the plan for the ids we hand back, so the
  // level matches the mon on the field by construction.
  // 🔁 A handful of slots can never settle — a Misdreavus whose budget level
  // is high enough to BE a Mismagius, whose fatter budget drops it back below
  // the evolution again (10 of 264 story-gym slots). Six passes bound the
  // spin, and a slot still flipping takes the SMALLER of its two forms: at the
  // (higher) level its own budget then hands it, an under-evolved mon is legal
  // where an over-evolved one is not, and it still clears the fodder floor
  // (both candidates came out of formFor, which applies the floor).
  // The fodder power floor and the era law are untouched: this only changes
  // WHICH id the budget is computed from.
  function planned(opts, u) {
    const trueIds = u.monIds || [];
    let ids = trueIds.slice();
    let lvls = plan(opts, u);
    if (!(opts && opts.level) || !window.JourneyStyle) return { ids: ids, lvls: lvls };
    const last = trueIds.length - 1;
    const rePlan = () => plan(opts, { monIds: ids, boost: u.boost });
    let prev = ids.slice();
    for (let pass = 0; pass < 6; pass++) {
      const forms = trueIds.map((id, i) => (id ? formFor(opts, id, lvls[i], i === last) : id));
      const settled = forms.every((f, i) => f === ids[i]);
      prev = ids; ids = forms; lvls = rePlan();
      if (settled) break;
    }
    const calmed = ids.map((id, i) => (!id || id === prev[i]) ? id : (bstOf(id) <= bstOf(prev[i]) ? id : prev[i]));
    if (calmed.some((f, i) => f !== ids[i])) { ids = calmed; lvls = rePlan(); }
    return { ids: ids, lvls: lvls };
  }

  // one mon's cartridge battle stats at a level (IV 31, EV 0, neutral)
  function statsAt(id, L) {
    const s = ST()[id] || [60, 60, 60, 60, 60, 60];
    return { hp: hpAt(s[0], L, id), atk: statAt(s[1], L), def: statAt(s[2], L),
      spa: statAt(s[3], L), spd: statAt(s[4], L), spe: s[5] };
  }

  window.CartridgeMode = {
    on: on,
    enable: function () { set(true); return true; },
    disable: function () { set(false); return false; },
    toggle: function () { set(!on()); return on(); },
    plan: plan, planned: planned, statsAt: statsAt, formFor: formFor, sigMove: sigMove,
    CURVE: CURVE, SIG: SIG, LEAGUE_SIG: LEAGUE_SIG,
  };
})();
