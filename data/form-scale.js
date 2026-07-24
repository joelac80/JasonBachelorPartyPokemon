/* form-scale.js — ⚖️ ONE STAT SCALE FOR EVERY POKÉMON.
   Loads LAST, after every dex/form file, and runs once at boot.

   THE PROBLEM: every normal species carries a hand-authored battle stat `x`
   that is a compressed fraction of its real base-stat total (~0.20 for a
   Sunkern, ~0.45 for a Tyranitar) — the compression is what keeps a weak mon
   playable and a strong one from dominating. But 112 battle FORMS (Megas,
   Primals, Ultra Necrozma, Zygarde's formes, Eternamax) were authored with the
   RAW BST pasted straight into `x`: Eternamax Eternatus sat at 1125 against a
   top-tier final stage's ~270. Those forms hit 3-4x as hard as anything else
   in the game, which is why several boss fights could ONE-SHOT a healthy team
   and had to be hand-compensated with tiny per-slot boosts.

   THE FIX: rescale any form still on the raw scale onto ITS OWN BASE species'
   ratio. Mega Charizard X keeps Charizard's x/BST relationship, so it lands a
   consistent ~15-20% above the Pokémon it evolved from instead of 3x above the
   entire roster. Derived at runtime from DEX_STATS + MEGA_FORMS.base, so any
   form added later is normalised automatically — no table to maintain.

   Nothing else changes: a form's TYPES, sprites, speed and moves are untouched,
   and the player's own Mega Evolution bonus (a bounded +30% ATK / +20% HP in
   duel.js) is computed off the base mon, so it is unaffected either way. */
(function () {
  var DEX = window.DEX, ST = window.DEX_STATS, MF = window.MEGA_FORMS || {};
  if (!DEX || !ST) return;

  // A form is "raw" when its x is still essentially its base-stat total.
  // Real authored values never come close (the highest is ~0.5 of BST).
  var RAW_AT = 0.70;

  function bstOf(id) {
    var s = ST[id];
    if (!s || !s.length) return 0;
    for (var i = 0, t = 0; i < s.length; i++) t += s[i];
    return t;
  }

  // Base species for a form: MEGA_FORMS knows it outright; otherwise strip the
  // form wording off the name and match the plain species.
  var byName = {};
  Object.keys(DEX).forEach(function (k) {
    var id = +k;
    if (id < 10000 && DEX[id] && DEX[id].n) byName[DEX[id].n] = id;
  });
  var PREFIX = [/^Mega /, /^Primal /, /^Ultra /, /^Origin /, /^Eternamax /, /^Eternal /, /^Shadow /,
    /^Dawn Wings /, /^Dusk Mane /];
  var SUFFIX = / (Attack|Defense|Speed|Complete|10%|Unbound|Stellar|Origin|Therian|Black|White|Crowned|Sky|Zen|Blade|X|Y|Z)$/;

  function baseOf(id) {
    if (MF[id] && MF[id].base) return MF[id].base;
    var n = DEX[id].n || "";
    for (var i = 0; i < PREFIX.length; i++) n = n.replace(PREFIX[i], "");
    n = n.replace(SUFFIX, "").trim();
    return byName[n] || 0;
  }

  var fixed = 0;
  Object.keys(DEX).forEach(function (k) {
    var id = +k, d = DEX[id];
    if (!d || !d.x) return;
    var bst = bstOf(id);
    if (!bst || d.x / bst <= RAW_AT) return;          // already on the game scale

    var base = baseOf(id);
    var bBst = base ? bstOf(base) : 0;
    var bX = base && DEX[base] ? DEX[base].x : 0;
    if (!base || !bBst || !bX) return;                // no base to inherit from — leave it be

    d.x = Math.round(bst * (bX / bBst));
    fixed++;
  });

  // MEGA_FORMS carries its own copy of x (the Mega-Dex reads it) — keep the two
  // in step so the codex never shows a stat the battle engine doesn't use.
  Object.keys(MF).forEach(function (k) {
    if (DEX[+k] && DEX[+k].x) MF[k].x = DEX[+k].x;
  });

  window.FORM_SCALE_FIXED = fixed;   // probe for the balance tests
})();
