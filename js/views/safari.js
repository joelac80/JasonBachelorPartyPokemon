/* safari.js — Pokédex Safari drinking game (per-trainer competition).
   Encounter odds are near-flat (legendaries show up!), but catch rates are
   drastically tiered: Common 55% → Legendary 4% base, and legendaries take
   boosts at half strength — so landing one is a genuine celebration. Each
   legendary is ONE OF ONE: first catch claims the only one in the region.
   Earn boosts by DOING things — each is a random action you must perform;
   chicken out and you take a sip + forfeit that boost, and the wild one may
   spook and bolt (up to 50% for legendaries):
     • Dares      up to 3 × +20%
     • Berry      +15%   (also halves flee chance)
     • Squad rally +10%
     • Helper     +15% (a 2nd trainer joins; earns an assist + a share of the
                        payout — half the sips, or the full haul on a legendary)
     • Catch combo +5%/link, cap +25% — carries between encounters, a flee breaks it
     • Master Ball dare — one EPIC challenge = a guaranteed catch outright
   Then throw. Catches go into that trainer's own Pokédex. Leaderboard +
   Ash Ketchum cap for the top catcher. State in Store.pokedex. */
(function () {
  const { el } = U;
  const DEX = window.DEX || {};
  const SP = window.DEX_SPRITES || {};
  const SPS = window.DEX_SPRITES_SHINY || {};
  // ✨ Shiny odds — Gen 2 would be proud. Every encounter rolls; a shiny
  // catch pays out DOUBLE sips and is marked forever in the dex.
  const SHINY_RATE = 1 / 16;
  const IDS = Object.keys(DEX).map(Number);
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }
  function now() { try { return Date.now(); } catch (_) { return 0; } }

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
    const d = DEX[id] || { x: 60 }; const x = d.x, leg = !!d.leg;
    const tier = leg ? "Legendary" : x >= 200 ? "Elite" : x >= 140 ? "Strong" : x >= 90 ? "Evolved" : "Common";
    const base = TIER_BASE[tier];
    let sips = 1 + Math.round(x / 70); sips = Math.min(7, Math.max(1, sips));
    if (leg) sips = 8;                       // a legendary catch is a big payout
    const flee = leg ? 0.06 : 0.12;
    return { name: d.n, x: x, leg: leg, base: base, sips: sips, flee: flee, tier: tier, color: TIER_COLOR[tier] };
  }

  // Legendaries are ONE OF ONE: once anyone in the room catches it, it's out
  // of the wild pool for everyone. Returns the owner's attendee id, or "".
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

  // Catch combo (Let's Go-style hot streak): +5% per consecutive catch, cap +25%.
  function comboOf(id) { return (rec(id).combo || 0); }
  function comboBonus(id) { return Math.min(0.25, 0.05 * comboOf(id)); }

  // Near-flat encounter odds — cool Pokémon show up almost as often as commons;
  // the drama lives in the catch rate, not the sighting. Claimed legendaries
  // leave the wild pool entirely (one of one).
  function weightFor(id) {
    const d = DEX[id]; let w = 1 / Math.pow(d.x, 0.30);
    if (d.leg) { if (legendaryOwner(id)) return 0; w *= 0.7; }
    return w;
  }
  function randomEncounter() {
    let total = 0; const cum = [];
    IDS.forEach((id) => { total += weightFor(id); cum.push([total, id]); });
    const r = Math.random() * total;
    for (let i = 0; i < cum.length; i++) if (r <= cum[i][0]) return cum[i][1];
    return IDS[0];
  }

  function P() { return Store.state.pokedex; }
  function rec(id) { return (P().trainers && P().trainers[id]) || { caught: {}, team: [], catches: 0 }; }
  function caughtCount(id) { return Store.dexCount(id); }   // partner freebie excluded
  function attendeeName(id) { const a = Store.attendee(id); return a ? a.name : id; }

  // ── Per-phone Safari session — deliberately NOT synced ──────────────────
  // The catcher this DEVICE is playing as, plus the in-progress wild encounter
  // and its boosts. Kept at module scope (not inside view()) so that a remote
  // sync re-render — triggered when anyone else logs a drink, catches, etc. —
  // RESTORES the same encounter instead of wiping it, and so every phone
  // catches independently. The old design synced the catcher in shared state,
  // which made three phones fight over one encounter (Suicune kept resetting).
  let myCatcher = "";
  let current = null, busy = false, status = "", level = 0, helper = "", shiny = false, revealId = null;
  let berryDone = false, rallyDone = false, masterDone = false;   // boost earned
  let dareLocked = false, berryLost = false, rallyLost = false, masterLost = false;  // bailed
  let pending = null, penaltyMsg = "";                  // pending = {kind,prompt,pct}

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
      const boosts = 0.2 * level + (berryDone ? 0.15 : 0) + (rallyDone ? 0.10 : 0) + (helper ? 0.15 : 0) + comboBonus(active());
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
          const id = current, lost = comboOf(active());
          wildEscaped(id, nfo0, nfo0.name + " spooked and bolted!",
            "🐔 You hesitated on the " + verb + " — take a sip, and it's gone!",
            lost > 1 ? "💔 Catch combo of " + lost + " broken!" : null);
          return;
        }
      }
      if (k === "dare") dareLocked = true; else if (k === "berry") berryLost = true;
      else if (k === "rally") rallyLost = true; else if (k === "master") masterLost = true;
      penaltyMsg = "🐔 Chickened out of the " + verb + " — take a sip! No more " + verb + " this catch.";
      sfx("error"); renderEncounter();
    }

    // Wild one leaves for good (a flee, or a spook from hesitating). Breaks combo.
    function wildEscaped(id, nfo, headline, sub, note) {
      const tid = active();
      Store.update((s) => { const t = s.pokedex.trainers[tid]; if (t) t.combo = 0; });
      sfx("error");
      enc.innerHTML = "";
      enc.appendChild(el("div", { class: "safari-card result miss" }, [
        el("img", { class: "safari-wild fled", src: SP[id], alt: nfo.name }),
        el("div", { class: "safari-result-msg" }, headline),
        el("div", { class: "safari-payout miss" }, sub),
        note ? el("div", { class: "safari-combo-note broke" }, note) : null,
        el("div", { class: "safari-actions" }, [el("button", { class: "btn spin-btn", onClick: findOne }, "🔍 Find another")]),
      ]));
      current = null; busy = false; status = ""; shiny = false; clearBoosts();
      renderStats(); renderBoard(); renderTeam(); renderDex();
    }

    // A helper is a second trainer teaming up (a "double-battle" catch): +15%,
    // and they earn an assist toward the Best Helper badge on a successful catch.
    function pickHelper() {
      const others = Store.state.attendees.filter((a) => a.id !== active());
      const grid = el("div", { class: "sl-vote-grid" }, others.map((a) =>
        el("button", { class: "sl-vote-pick", onClick: () => { helper = a.id; sfx("select"); ref.close(); renderEncounter(); } },
          el("span", { class: "sl-vote-name" }, a.name))));
      const body = el("div", { class: "modal-form" }, [el("div", { class: "field" }, [el("span", {}, "Who's teaming up? (+15% — earns them an assist + a share of the sips)"), grid])]);
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
      stats.appendChild(stat(id ? caughtCount(id) + " / 251" : "—", id ? attendeeName(id) + "'s dex" : "No trainer"));
      stats.appendChild(stat("🍺 " + (P().given || 0), "Sips dealt"));
      stats.appendChild(stat(id && comboOf(id) ? "🔥 " + comboOf(id) : (Store.state.pokedex.log ? Store.state.pokedex.log.length : 0),
        id && comboOf(id) ? "Catch combo" : "Catches logged"));
    }

    // ---- encounter (wild-battle scene with a silhouette that focuses in) ----
    function renderEncounter() {
      enc.innerHTML = "";
      if (!active()) { enc.appendChild(el("div", { class: "safari-idle" }, el("p", { class: "empty" }, "👆 Pick a trainer to start catching."))); return; }
      if (!current) {
        // 🌩 roaming legendary: room-wide race — jump it to the front of the grass
        const roam = window.Sync && Sync.roam && Sync.roam();
        if (roam && DEX[roam.monId] && !legendaryOwner(roam.monId)) {
          enc.appendChild(el("div", { class: "roam-banner" }, [
            el("span", {}, "🌩 A wild " + DEX[roam.monId].n.toUpperCase() + " is ROAMING the lake house — first catch claims it!"),
            el("button", { class: "btn primary sm", onClick: () => {
              current = roam.monId; shiny = false; revealId = null; status = ""; clearBoosts();
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
      const combo = comboOf(active());
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
        shiny ? el("span", { class: "safari-shiny-chip" }, "✨ SHINY — double payout!") : null,
        nfo.leg ? el("span", { class: "safari-oneof" }, "✨ ONE OF ONE") : null,
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
        if (combo) parts.push("combo ×" + combo);
        breakdown = parts.length ? " (base " + Math.round(nfo.base * 100) + "% + " + parts.join(" + ") + ")" : "";
      }
      const odds = el("div", { class: "safari-odds" }, [
        el("span", { class: "safari-odds-big" }, Math.round(chance * 100) + "%"),
        el("span", {}, " catch chance" + breakdown + " · catch deals " + nfo.sips + " sip" + (nfo.sips > 1 ? "s" : "") + (nfo.leg ? " · resists boosts (½ effect)" : "")),
        el("span", { class: "safari-ball-chip" }, [ballIcon(ball), " " + ball.name + (ball.key === "master" ? " — sure catch!" : "")]),
      ]);
      const pips = el("div", { class: "safari-pips" }, [0, 1, 2].map((i) => el("span", { class: "safari-pip" + (i < level ? " on" : "") })));

      // Active-boost chips (berry / rally / combo) shown alongside the dare pips.
      const activeChips = [];
      if (masterDone) activeChips.push(el("span", { class: "safari-boost-chip master" }, "🟣 Master Ball dare"));
      if (berryDone) activeChips.push(el("span", { class: "safari-boost-chip berry" }, "🍓 Berry +15%"));
      if (rallyDone) activeChips.push(el("span", { class: "safari-boost-chip rally" }, "📣 Rally +10%"));
      if (helper) activeChips.push(el("span", { class: "safari-boost-chip helper" }, "🤝 " + attendeeName(helper) + " +15%"));
      if (combo) activeChips.push(el("span", { class: "safari-boost-chip combo" }, "🔥 Combo ×" + combo + " (+" + Math.round(comboBonus(active()) * 100) + "%)"));

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
      const throwRow = el("div", { class: "safari-actions safari-throw-row" }, [
        el("button", { class: "btn primary", onClick: () => throwBall(nfo), disabled: pending ? "true" : null }, [ballIcon(ball), " Throw " + ball.name]),
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
      current = null; revealId = null; busy = false; status = ""; clearBoosts();
      // 🌩 No buttons, no summons — once in a rare while the sky just breaks:
      // a fresh rustle in the grass can stir a ROAMING LEGENDARY the whole
      // room races for (live rooms only; one storm at a time).
      if (window.Sync && Sync.isLive && Sync.isLive() && Sync.startRoam && !(Sync.roam && Sync.roam()) && Math.random() < 1 / 40) {
        const wild = IDS.filter((x) => DEX[x].leg && !legendaryOwner(x));
        if (wild.length) {
          const pickId = wild[(Math.random() * wild.length) | 0];
          Sync.startRoam(pickId);
          Store.logEvent("🌩", "The sky darkens over the lake — a wild " + DEX[pickId].n + " is ROAMING! First to catch it claims it!");
        }
      }
      current = randomEncounter();
      shiny = Math.random() < SHINY_RATE;
      // Pokédex "seen": it appeared in front of the active trainer. Only write
      // (and thus sync) if it's genuinely new — re-walking to an already-seen
      // mon shouldn't churn the room.
      const tid = active();
      const t0 = tid && ((Store.state.pokedex || {}).trainers || {})[tid];
      if (tid && !(t0 && t0.seen && t0.seen[current])) Store.update((s) => {
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
      if (ball) ball.classList.add("go");
      if (wild && outcome !== "break") wild.classList.add("caught-anim");
      sfx("select");
      const beats = ["The ball shakes…", "…and shakes…", "…and shakes…"];
      beats.forEach((t, i) => setTimeout(() => { if (suspense) suspense.textContent = t; sfx("blip"); }, 500 + i * 400));
      setTimeout(() => resolveThrow(outcome, nfo, ballUsed, viaMaster), 1900);
    }

    function resolveThrow(outcome, nfo, ballUsed, viaMaster) {
      const id = current, tid = active();
      if (outcome === "break") {
        status = "So close! " + nfo.name + " broke free — throw again!";
        busy = false; renderEncounter(); return;
      }
      if (outcome === "catch") {
        // 🏁 One-of-one race: if someone else claimed this legendary while your
        // ball was in the air (Suicune with three of you throwing), you lost —
        // no double catches of the region's only one.
        if (nfo.leg && legendaryOwner(id) && legendaryOwner(id) !== tid) {
          const owner = attendeeName(legendaryOwner(id));
          sfx("error");
          enc.innerHTML = "";
          enc.appendChild(el("div", { class: "safari-card result miss" }, [
            el("img", { class: "safari-wild fled", src: SP[id], alt: nfo.name }),
            el("div", { class: "safari-result-msg" }, owner + " already caught " + nfo.name + "!"),
            el("div", { class: "safari-payout miss" }, "🏁 Beaten to the only one in the region — take a sip." ),
            el("div", { class: "safari-actions" }, [el("button", { class: "btn spin-btn", onClick: findOne }, "🔍 Find another")]),
          ]));
          current = null; busy = false; status = ""; shiny = false; clearBoosts();
          renderStats(); renderBoard(); renderTeam(); renderDex();
          return;
        }
        let newCombo = 0;
        const isShiny = shiny;
        // 🍓 ~30% of catches drop a Sitrus Berry into the trainer's bag —
        // auto-eaten in duels when a mon drops below 30% HP.
        const berryDrop = Math.random() < 0.3;
        // ✨ A shiny pays out DOUBLE sips.
        const sips = isShiny ? nfo.sips * 2 : nfo.sips;
        const helperId = helper && helper !== tid ? helper : "";
        const helperName = helperId ? attendeeName(helperId) : "";
        // Helper shares the reward: half the sips on a normal catch, the full
        // haul when the assist lands a legendary.
        const helperSips = helperId ? (nfo.leg ? sips : Math.max(1, Math.round(sips / 2))) : 0;
        Store.update((s) => {
          const t = s.pokedex.trainers[tid] = s.pokedex.trainers[tid] || { caught: {}, team: [], catches: 0 };
          const prev = t.caught[id];
          // Keep the ball that first landed it (best-catch keepsake).
          t.caught[id] = { count: (prev ? prev.count : 0) + 1, ball: (prev && prev.ball) || ballUsed,
            shiny: ((prev && prev.shiny) || isShiny) || undefined,
            nick: (prev && prev.nick) || undefined, kos: (prev && prev.kos) || undefined };
          if (berryDrop) t.berries = (t.berries || 0) + 1;
          t.catches = Object.keys(t.caught).length;
          t.combo = (t.combo || 0) + 1;               // extend the catch combo
          newCombo = t.combo;
          if (viaMaster) t.masterCatches = (t.masterCatches || 0) + 1;   // 🟣 Master Catcher
          if (helperId) {                              // credit the helper's assist + payout
            const h = s.pokedex.trainers[helperId] = s.pokedex.trainers[helperId] || { caught: {}, team: [], catches: 0 };
            h.helps = (h.helps || 0) + 1;
            h.assistSips = (h.assistSips || 0) + helperSips;
          }
          s.pokedex.given = (s.pokedex.given || 0) + sips + helperSips;
          // Feed the championship: a catch scores its sip-value for the
          // catcher's team; the helper's team banks their share too.
          Store.grantPoints(s, "safari", Store.teamOf(tid), sips);
          if (helperId) Store.grantPoints(s, "safari", Store.teamOf(helperId), helperSips);
          s.pokedex.log = s.pokedex.log || [];
          s.pokedex.log.unshift({ trainer: tid, dexId: id, name: nfo.name, ball: ballUsed, helper: helperId || undefined, master: viaMaster || undefined, shiny: isShiny || undefined, ts: now() });
          if (s.pokedex.log.length > 80) s.pokedex.log.length = 80;
          if (isShiny) Store.chron(s, "✨", "SHINY!! " + attendeeName(tid) + " caught a SHINY " + nfo.name + (nfo.leg ? " — a shiny LEGENDARY, the only one in the region!!" : " — double payout!"));
          else if (nfo.leg) Store.chron(s, "🌟", "LEGENDARY! " + attendeeName(tid) + " caught " + nfo.name + " — the only one in the region!" + (viaMaster ? " (Master Ball dare!)" : ""));
          else Store.chron(s, "🔴", attendeeName(tid) + " caught " + nfo.name + "!" + (viaMaster ? " (Master Ball dare!)" : "") + (helperName ? " (assist: " + helperName + ")" : ""));
          if (Store._milestone(s.pokedex.log.length)) Store.chron(s, "🎉", "🔴 " + s.pokedex.log.length + " Pokémon caught this weekend!");
        });
        // Roaming legendary landed → the race is over, tell the room.
        try {
          const roam = window.Sync && Sync.roam && Sync.roam();
          if (roam && roam.monId === id) Sync.claimRoam(attendeeName(tid));
        } catch (_) {}
        const catcherTeam = Store.team(Store.teamOf(tid));
        sfx(isShiny ? "fanfare" : "win");
        const nextBonus = Math.min(0.25, 0.05 * newCombo);
        enc.innerHTML = "";
        enc.appendChild(el("div", { class: "safari-card result win" + (isShiny ? " shiny" : "") }, [
          el("img", { class: "safari-wild pop", src: (isShiny && SPS[id]) || SP[id], alt: nfo.name }),
          el("div", { class: "safari-result-msg" }, "Gotcha! " + attendeeName(tid) + " caught " + (isShiny ? "a ✨ SHINY " : "") + nfo.name + "!"),
          isShiny ? el("div", { class: "safari-legend-note" }, "✨ SHINY — its colors are different! Double payout, marked in the dex forever.") : null,
          nfo.leg ? el("div", { class: "safari-legend-note" }, "🌟 ONE OF ONE — the only " + nfo.name + " in the region belongs to " + attendeeName(tid) + "!") : null,
          el("div", { class: "safari-caught-ball" }, [ballIcon(ballByKey(ballUsed)), " Caught with a " + ballByKey(ballUsed).name + (viaMaster ? " (Master Ball dare!)" : "") + "!"]),
          el("div", { class: "safari-payout" }, "🍺 " + attendeeName(tid) + " hands out " + sips + " sip" + (sips > 1 ? "s" : "") + (isShiny ? " (✨ doubled)" : "") + "!"),
          catcherTeam ? el("div", { class: "safari-team-pts" }, "🏆 +" + sips + " pts → " + catcherTeam.name + " (Victory Road)") : null,
          helperName ? el("div", { class: "safari-assist-note" }, "🤝 Assist from " + helperName + " — they hand out " + helperSips + (nfo.leg ? " sip" + (helperSips > 1 ? "s" : "") + " (full legendary share!)" : " sip" + (helperSips > 1 ? "s" : "") + " too!")) : null,
          berryDrop ? el("div", { class: "safari-combo-note" }, "🍓 It dropped a Sitrus Berry! (auto-heals your Pokémon in duels — 🍓×" + ((rec(tid).berries) || 1) + " in the bag)") : null,
          newCombo > 1 ? el("div", { class: "safari-combo-note" }, "🔥 Catch combo ×" + newCombo + " — +" + Math.round(nextBonus * 100) + "% on your next throw!") : null,
          el("div", { class: "safari-actions" }, [el("button", { class: "btn spin-btn", onClick: findOne }, "🔍 Find another")]),
        ]));
      } else {
        const lostCombo = comboOf(tid);              // grab it before we reset
        Store.update((s) => {
          s.pokedex.taken = (s.pokedex.taken || 0) + 1;
          const t = s.pokedex.trainers[tid];
          if (t) t.combo = 0;                          // a runaway breaks the combo
        });
        sfx("error");
        enc.innerHTML = "";
        enc.appendChild(el("div", { class: "safari-card result miss" }, [
          el("img", { class: "safari-wild fled", src: SP[id], alt: nfo.name }),
          el("div", { class: "safari-result-msg" }, nfo.name + " slipped away!"),
          el("div", { class: "safari-payout miss" }, "😅 It got away. Take a sip." ),
          lostCombo > 1 ? el("div", { class: "safari-combo-note broke" }, "💔 Catch combo of " + lostCombo + " broken!") : null,
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
            el("span", { class: "safari-board-n" }, r.n + " assist" + (r.n > 1 ? "s" : "") + (assistSipsOf(r.a.id) ? " · 🍺 " + assistSipsOf(r.a.id) : "")),
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
    function assistSipsOf(id) { return rec(id).assistSips || 0; }
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

    // ---- dex grid (active trainer) ----
    function renderDex() {
      dexHost.innerHTML = "";
      if (!active()) return;
      dexHost.appendChild(el("h2", { class: "section-title" }, "Pokédex (" + caughtCount(active()) + " / 251)"));
      const caught = rec(active()).caught || {};
      const grid = el("div", { class: "safari-dex" });
      IDS.forEach((id) => {
        const got = !!caught[id];
        const ballKey = got && caught[id].ball;
        const isShiny = got && !!caught[id].shiny;
        const src = (isShiny && SPS[id]) || SP[id];
        grid.appendChild(el("div", { class: "safari-dex-cell" + (got ? " got" : "") + (inTeam(id) ? " team" : "") + (isShiny ? " shiny" : ""),
          title: got ? DEX[id].n + (isShiny ? " ✨ SHINY" : "") + (ballKey === "partner" ? " — your partner ❤" : (ballKey ? " — caught with a " + ballByKey(ballKey).name : "")) + " — tap for team & nickname" : "#" + id + " — not caught",
          onClick: got ? () => openMonSheet(id) : null }, [
          src ? el("img", { src: src, alt: got ? DEX[id].n : "", loading: "lazy" }) : null,
          el("span", { class: "safari-dex-num" }, "#" + id),
          isShiny ? el("span", { class: "safari-dex-shiny" }, "✨") : null,
          ballKey ? el("span", { class: "safari-dex-ball" }, ballIcon(ballByKey(ballKey))) : null,
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
  window.SafariDebug = { info: info, weightFor: weightFor, legendaryOwner: legendaryOwner };
})();
