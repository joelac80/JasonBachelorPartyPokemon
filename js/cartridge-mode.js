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
  const on = () => { try { return localStorage.getItem(KEY) === "1"; } catch (_) { return false; } };
  const set = (v) => { try { v ? localStorage.setItem(KEY, "1") : localStorage.removeItem(KEY); } catch (_) {} };

  const CURVE = {
    gymFodderEdge: [-2, 3], gymAceEdge: [0, 5],       // badge 1 → badge 8 (lerp)
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
    const R = opts.level || 50;
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
          const ref = lerp.apply(null, (ace ? CURVE.gymAceRef : CURVE.gymFodderRef).concat([frac]));
          return edged(R, e, ref, id, false);
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
        return edged(R, e, ref, id, isRed || isChamp || isAsh);
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
    plan: plan, statsAt: statsAt, CURVE: CURVE,
  };
})();
