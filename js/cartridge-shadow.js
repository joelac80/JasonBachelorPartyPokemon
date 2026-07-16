/* cartridge-shadow.js — 🎛️ CARTRIDGE MODE step 2: the SHADOW ENGINE.
 *
 * The real games' stat + damage pipeline rides along on every live hit —
 * OBSERVATION ONLY. duel.js calls CartridgeShadow.onHit() with the exact
 * inputs of each resolved hit and keeps its own number; this module
 * computes what the cartridge formula WOULD have dealt and records the
 * pair. Nothing here touches battle state, consumes randomness, or feeds
 * a value back — the lean system and the compressed formulas still run
 * the show until the comparison says the new math is ready.
 *
 * Cartridge model (IV 31, EV 0, neutral nature):
 *   HP    = ⌊(2·base+31)·L/100⌋ + L + 10        (Shedinja: always 1)
 *   stat  = ⌊(2·base+31)·L/100⌋ + 5
 *   dmg   = ⌊⌊⌊(2L/5+2)·pow·A/D⌋/50⌋+2⌋ × spread × crit × rand × STAB × eff × burn
 * with real STAB 1.5 (tera-on-own-type 2.0), A/D picked by move category.
 * Battles with no level (standard duels) shadow at the flat cap L50.
 *
 * Engine-side multipliers that will SURVIVE the flip (boss boost, veteran
 * bonus, raid hpBoost, Dynamax) are inferred from the live mon and applied
 * to the shadow too, so the report isolates the STAT MODEL difference —
 * not the boss tuning. Inspect anytime: CartridgeShadow.print() in the
 * console, or .report() for the raw aggregate.
 */
(function () {
  "use strict";

  const CAP = 2000;                       // hit-record ring buffer
  let buf = [];

  const statsOf = (id) => (window.DEX_STATS || {})[id] || [60, 60, 60, 60, 60, 60];
  const statAt = (b, L) => Math.floor((2 * b + 31) * L / 100) + 5;
  const hpAt = (b, L, id) => (+id === 292 ? 1 : Math.floor((2 * b + 31) * L / 100) + L + 10);
  const stageMul = (n) => { n = Math.max(-6, Math.min(6, n || 0)); return n >= 0 ? (2 + n) / 2 : 2 / (2 - n); };

  // The live engine's own baselines — needed to strip its species-power
  // number back OUT of a mon that boosts/veteran bonuses have scaled up,
  // so the same inflation can be applied to the shadow pool.
  const engineAtk0 = (id, x) => (+id === 10094 ? 0.55 + 650 / 500 : 0.55 + (x || 60) / 500);
  const engineHp0 = (x, level) => {
    const hpMul = level ? Math.min(1, 0.5 + level / 100) : 1;
    return Math.round((120 + Math.round((x || 60) * 0.5)) * hpMul);
  };

  // duel.js offTilt, verbatim — to back the baked random roll out of `base`.
  const offTilt = (m, mv) => {
    const o = (m.lean || [0, 0])[0];
    if (!o) return 1;
    return mv.cat === "spec" ? 1 + 0.035 * o : mv.cat === "phys" ? 1 - 0.035 * o : 1;
  };

  // Real STAB: 1.5 on your own element; a terastallized mon hits 2.0 with
  // tera-type moves that were ALSO its original type, 1.5 otherwise.
  const stabFor = (m, mv) => {
    const orig = m._teraBase || m.types || [];
    const own = orig.indexOf(mv.type) >= 0;
    if (m._tera && m._tera === mv.type) return own ? 2 : 1.5;
    return own ? 1.5 : 1;
  };

  function onHit(h) {
    if (!h || !h.mv || !h.mv.pow || !h.dmg) return;
    const att = h.att, def = h.def, mv = h.mv;
    const aId = att.megaId || att.id, dId = def.megaId || def.id;
    const L = h.level || 50;
    const as = statsOf(aId), ds = statsOf(dId);
    const spec = mv.cat === "spec";

    // --- shadow attack & defense (stages applied to the STAT, cartridge-style)
    let A = statAt(spec ? as[3] : as[1], L);
    if (+aId === 10094) A *= 2;                        // ⚡ Light Ball doubles both
    A *= stageMul(att.stg && att.stg[spec ? "spa" : "atk"]);
    let D = statAt(spec ? ds[4] : ds[2], L);
    D *= stageMul(def.stg && def.stg[spec ? "spd" : "def"]);

    // --- reuse the LIVE hit's baked random roll (backed out of base)
    const critM = h.crit ? 1.5 : 1, zM = h.zed ? 1.8 : 1;
    let rf = h.base / (mv.pow * zM * (att.atk || 1) * offTilt(att, mv) * critM);
    rf = Math.max(0.85, Math.min(1, rf || 1));

    // --- engine-side inflation that survives the flip, mirrored onto the shadow
    const boostMul = Math.max(1, Math.min(6, (att.atk || 1) / engineAtk0(aId, att.x)));
    let hp0 = engineHp0(def.x, h.level);
    if (def._dyna > 0) hp0 = Math.round(hp0 * 1.75);   // 🔴 towering pool, both models
    const hpInfl = hp0 ? Math.max(0.5, Math.min(6, (def.hpMax || hp0) / hp0)) : 1;

    const burn = (!spec && att.status === "brn") ? 0.5 : 1;
    const raw = Math.floor(Math.floor(Math.floor(2 * L / 5 + 2) * mv.pow * A / D) / 50) + 2;
    const sDmg = Math.max(1, Math.round(raw * h.spread * critM * zM * rf * stabFor(att, mv) * h.eff * burn * boostMul));
    const sHpMax = Math.max(1, Math.round(hpAt(ds[0], L, dId) * hpInfl));

    if (buf.length >= CAP) buf.shift();
    buf.push({
      att: att.name, def: def.name, move: mv.name, cat: mv.cat, lvl: L,
      eff: h.eff, crit: !!h.crit, zed: !!h.zed,
      dmg: h.dmg, hpMax: def.hpMax,
      sDmg: sDmg, sHpMax: sHpMax,
      pct: Math.round(1000 * h.dmg / (def.hpMax || 1)) / 10,
      sPct: Math.round(1000 * sDmg / sHpMax) / 10,
    });
  }

  // hits-to-KO from one hit's % bite — the number that IS the game feel
  const htk = (pct) => (pct <= 0 ? 99 : Math.min(99, Math.ceil(100 / pct)));

  function report() {
    const groups = {};
    buf.forEach((r) => {
      const k = r.att + " → " + r.def + " | " + r.move + (r.crit ? " (crit)" : "") + (r.zed ? " (Z)" : "");
      (groups[k] = groups[k] || { key: k, n: 0, pct: 0, sPct: 0, lvl: r.lvl }).n++;
      groups[k].pct += r.pct; groups[k].sPct += r.sPct;
    });
    const matchups = Object.values(groups).map((g) => ({
      matchup: g.key, hits: g.n, lvl: g.lvl,
      livePct: Math.round(10 * g.pct / g.n) / 10,
      cartPct: Math.round(10 * g.sPct / g.n) / 10,
      liveHTK: htk(g.pct / g.n), cartHTK: htk(g.sPct / g.n),
      delta: Math.round(10 * (g.sPct - g.pct) / g.n) / 10,
    })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    const n = buf.length || 1;
    const agree = matchups.filter((m) => m.liveHTK === m.cartHTK).length;
    return {
      hits: buf.length,
      avgLivePct: Math.round(10 * buf.reduce((s, r) => s + r.pct, 0) / n) / 10,
      avgCartPct: Math.round(10 * buf.reduce((s, r) => s + r.sPct, 0) / n) / 10,
      htkAgreePct: matchups.length ? Math.round(100 * agree / matchups.length) : 100,
      matchups: matchups,
      raw: buf.slice(),
    };
  }

  function print() {
    const r = report();
    console.log("🎛️ CARTRIDGE SHADOW — " + r.hits + " hits observed | avg bite live "
      + r.avgLivePct + "% vs cartridge " + r.avgCartPct + "% | hits-to-KO agrees on "
      + r.htkAgreePct + "% of matchups");
    if (console.table) console.table(r.matchups.map((m) => ({
      matchup: m.matchup, hits: m.hits, "live %": m.livePct, "cart %": m.cartPct,
      "live HTK": m.liveHTK, "cart HTK": m.cartHTK, "Δ%": m.delta,
    })));
    return r;
  }

  window.CartridgeShadow = { onHit: onHit, report: report, print: print,
    reset: function () { buf = []; } };
})();
