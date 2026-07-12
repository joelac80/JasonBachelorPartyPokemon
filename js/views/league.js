/* league.js — 👑 The Pokémon League: a cinematic climb. Victory Road's
   badge-checked gate, the four Elite Four chambers in canon order (leaders
   silhouetted until beaten), Champion LANCE's hall, the HALL OF FAME (each
   conqueror's winning team, forever), and — only after a champion is
   crowned — Mt. Silver looming at the top, where RED waits and says
   nothing. Canon Gen 2 teams; even matches; lineups hidden in the balls. */
(function () {
  const { el, energyIcon } = U;
  const SP = window.DEX_SPRITES || {};
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }

  // The Elite Four and Champions run their round-two REMATCH teams — six deep,
  // every mon in its FINAL evolved form (Sneasel→Weavile & Girafarig→Farigiraf
  // for Karen/Lucian, Mr. Mime→Mr. Rime, Bisharp→Kingambit for Grimsley, and so
  // on). RED alone keeps his signature Pikachu — that IS his definitive team.
  // A long cinematic ladder in generation order: Johto E4 → LANCE → (Mt. Silver
  // RED, a secret side summit) → Hoenn → Sinnoh (Cynthia) → Unova (Alder) →
  // Kalos (Diantha) → Alola (Prof. Kukui) → the Galar Champion Cup (Leon) →
  // Paldea and Top Champion GEETA — with the Champions Tournament beyond. Each
  // stage carries its own gating (needs = the key you must have beaten), reveal
  // (un-fogs for everyone once ANY trainer beats that key), mystery (name hidden
  // until beaten), boost and point value.
  const LEAGUE = [
    { key: "will", region: "Johto",  name: "WILL",  rank: "Elite Four", type: "psychic",  team: [866, 124, 97, 196, 80, 178], pts: 6, boost: 1.15,
      quote: "I have trained my mind to see all that is coming… and I foresee your defeat." },
    { key: "koga", region: "Johto",  name: "KOGA",  rank: "Elite Four", type: "poison",   team: [168, 49, 205, 110, 89, 169], pts: 6, boost: 1.15, needs: "will",
      quote: "A ninja's poison lingers long after the strike. Can you endure it?" },
    { key: "bruno", region: "Johto", name: "BRUNO", rank: "Elite Four", type: "fighting", team: [237, 106, 107, 208, 214, 68], pts: 6, boost: 1.15, needs: "koga",
      quote: "We will grind you down with our superior power. Hoo hah!" },
    { key: "karen", region: "Johto", name: "KAREN", rank: "Elite Four", type: "dark",     team: [461, 45, 94, 248, 197, 229], pts: 6, boost: 1.15, needs: "bruno",
      quote: "Strong Pokémon. Weak Pokémon. That is only the selfish perception of people. Show me YOUR favorites." },
    { key: "lance", region: "Johto", name: "LANCE", rank: "Champion",   type: "dragon",   team: [130, 149, 149, 149, 142, 6], pts: 8, boost: 1.2, needs: "karen",
      quote: "I've been waiting for you. I knew you, of all trainers, would make it this far." },
    { key: "red", region: "Kanto",   name: "RED",   rank: "???",        type: "fire",     team: [25, 196, 143, 3, 6, 9], pts: 10, boost: 1.35, needs: "lance", reveal: "lance", mystery: true,
      quote: "……" },
    // ---- The Hoenn Elite Four (rematch squads) → Champion STEVEN ----
    { key: "sidney", region: "Hoenn", name: "SIDNEY", rank: "Elite Four", type: "dark",   team: [359, 275, 332, 319, 342, 262], pts: 8, boost: 1.22, needs: "lance", reveal: "lance", gymGate: { start: 16, count: 8, region: "Hoenn" },
      quote: "Well, well — a fresh challenger from another region! No holding back. Let's go all out!" },
    { key: "phoebe", region: "Hoenn", name: "PHOEBE", rank: "Elite Four", type: "ghost",  team: [477, 354, 302, 94, 429, 442], pts: 8, boost: 1.22, needs: "sidney", reveal: "lance",
      quote: "I speak with the departed. They whisper that your team is about to join them…" },
    { key: "glacia", region: "Hoenn", name: "GLACIA", rank: "Elite Four", type: "ice",    team: [365, 362, 478, 461, 131, 87], pts: 8, boost: 1.22, needs: "phoebe", reveal: "lance",
      quote: "Passion burns hotter than any blizzard. Show me a heart that won't freeze!" },
    { key: "drake", region: "Hoenn",  name: "DRAKE",  rank: "Elite Four", type: "dragon", team: [373, 330, 334, 230, 149, 445], pts: 8, boost: 1.22, needs: "glacia", reveal: "lance",
      quote: "Dragons are the mightiest of all! Prove your bond is stronger — if you dare." },
    { key: "steven", region: "Hoenn", name: "STEVEN", rank: "Champion",   type: "steel",  team: [376, 306, 227, 344, 346, 348], pts: 10, boost: 1.3, needs: "drake", reveal: "lance",
      quote: "I'm Steven — collector of rare stones, and Champion of Hoenn. Show me the power you've forged." },
    // ---- The Sinnoh Elite Four (Platinum rematch) → CYNTHIA ----
    { key: "aaron", region: "Sinnoh",  name: "AARON",  rank: "Elite Four", type: "bug",     team: [469, 212, 214, 416, 452, 267], pts: 10, boost: 1.32, needs: "steven", reveal: "steven", gymGate: { start: 24, count: 8, region: "Sinnoh" },
      quote: "The Bug Pokémon I raise are anything but weak. Prepare yourself!" },
    { key: "bertha", region: "Sinnoh", name: "BERTHA", rank: "Elite Four", type: "ground",  team: [450, 472, 464, 340, 76, 232], pts: 10, boost: 1.32, needs: "aaron", reveal: "steven",
      quote: "Hehe — a young one keeps this old woman on her toes. Let's see your grit." },
    { key: "flint", region: "Sinnoh",  name: "FLINT",  rank: "Elite Four", type: "fire",    team: [392, 467, 78, 229, 136, 59], pts: 10, boost: 1.32, needs: "bertha", reveal: "steven",
      quote: "My fire's been waiting for a challenger this bright. Don't you dare disappoint me!" },
    { key: "lucian", region: "Sinnoh", name: "LUCIAN", rank: "Elite Four", type: "psychic", team: [65, 196, 475, 437, 866, 981], pts: 10, boost: 1.32, needs: "flint", reveal: "steven",
      quote: "Few reach me. I'll read every move before you make it. Now — begin." },
    { key: "cynthia", region: "Sinnoh", name: "CYNTHIA", rank: "Champion", type: "dragon",  team: [445, 442, 407, 448, 350, 468], pts: 14, boost: 1.5, needs: "lucian", reveal: "lucian", mystery: true,
      intro: "🎹 piano ensues….",
      quote: "There is no such thing as a battle whose outcome doesn't matter. Come — show me everything you have." },
    // ---- The Unova Elite Four → Champion ALDER ----
    { key: "shauntal", region: "Unova", name: "SHAUNTAL", rank: "Elite Four", type: "ghost",    team: [563, 609, 623, 593, 426, 478], pts: 12, boost: 1.34, needs: "cynthia", reveal: "cynthia", gymGate: { start: 32, count: 8, region: "Unova" },
      quote: "My ghosts have already written the ending of this tale. Care to read it with me?" },
    { key: "grimsley", region: "Unova", name: "GRIMSLEY", rank: "Elite Four", type: "dark",     team: [983, 553, 510, 560, 359, 430], pts: 12, boost: 1.34, needs: "shauntal", reveal: "cynthia",
      quote: "Win or lose, it's all just the roll of the dice. Let's gamble, shall we?" },
    { key: "caitlin", region: "Unova", name: "CAITLIN", rank: "Elite Four", type: "psychic",    team: [579, 518, 561, 576, 475, 376], pts: 12, boost: 1.34, needs: "grimsley", reveal: "cynthia",
      quote: "My Pokémon and I will read your heart — and answer it in full." },
    { key: "marshal", region: "Unova", name: "MARSHAL", rank: "Elite Four", type: "fighting",   team: [534, 620, 538, 539, 526, 68], pts: 12, boost: 1.34, needs: "caitlin", reveal: "cynthia",
      quote: "I seek strength in its purest form. Come — strike me with everything you have!" },
    { key: "alder", region: "Unova", name: "ALDER", rank: "Champion", type: "bug",              team: [637, 626, 584, 589, 617, 628], pts: 16, boost: 1.4, needs: "marshal", reveal: "cynthia",
      quote: "I'm the strongest Champion — old, but still burning. Show this graybeard the fire of youth!" },
    // ---- The Kalos Elite Four → Champion DIANTHA ----
    { key: "malva", region: "Kalos", name: "MALVA", rank: "Elite Four", type: "fire",           team: [663, 668, 324, 609, 229, 38], pts: 14, boost: 1.42, needs: "alder", reveal: "alder", gymGate: { start: 40, count: 8, region: "Kalos" },
      quote: "I am a member of the Elite Four, and a star of the Holo Caster. Burn brightly — or burn away." },
    { key: "wikstrom", region: "Kalos", name: "WIKSTROM", rank: "Elite Four", type: "steel",    team: [707, 476, 212, 681, 437, 376], pts: 14, boost: 1.42, needs: "malva", reveal: "alder",
      quote: "Well met, brave challenger! My blade of steel has been polished for this very duel!" },
    { key: "drasna", region: "Kalos", name: "DRASNA", rank: "Elite Four", type: "dragon",       team: [691, 621, 334, 715, 445, 373], pts: 14, boost: 1.42, needs: "wikstrom", reveal: "alder",
      quote: "Oh, dear — such lovely Pokémon you have. My dragons and I would love to play with them." },
    { key: "siebold", region: "Kalos", name: "SIEBOLD", rank: "Elite Four", type: "water",      team: [693, 130, 121, 689, 9, 230], pts: 14, boost: 1.42, needs: "drasna", reveal: "alder",
      quote: "A battle is art — and I am both chef and artist. Let me savor every move you make." },
    { key: "diantha", region: "Kalos", name: "DIANTHA", rank: "Champion", type: "fairy",        team: [701, 697, 699, 711, 706, 282], pts: 18, boost: 1.46, needs: "siebold", reveal: "alder",
      quote: "Battling alongside you has taught my heart to shine. Now — dazzle me one last time!" },
    // ---- The Alola Elite Four → Champion KUKUI ----
    { key: "molayne", region: "Alola", name: "MOLAYNE", rank: "Elite Four", type: "steel",      team: [707, 51, 376, 983, 462, 227], pts: 15, boost: 1.44, needs: "diantha", reveal: "diantha", gymGate: { start: 48, count: 4, region: "Alola" },
      quote: "My cousin Sophocles lends me the stars; my steel does the rest. Let's shine." },
    { key: "acerola", region: "Alola", name: "ACEROLA", rank: "Elite Four", type: "ghost",      team: [778, 770, 781, 426, 478, 302], pts: 15, boost: 1.44, needs: "molayne", reveal: "diantha",
      quote: "Heeey! My ghost-type friends are dying to meet you — well, they're already dead, but still!" },
    { key: "kahili", region: "Alola", name: "KAHILI", rank: "Elite Four", type: "flying",       team: [733, 628, 630, 169, 741, 227], pts: 15, boost: 1.44, needs: "acerola", reveal: "diantha",
      quote: "A pro golfer's drive and a flying-type's wings — both cut clean through the wind. Fore!" },
    { key: "mina", region: "Alola", name: "MINA", rank: "Elite Four", type: "fairy",            team: [743, 210, 764, 700, 303, 36], pts: 15, boost: 1.44, needs: "kahili", reveal: "diantha",
      quote: "Hmm? Oh — a battle? Sure, sure. My fairies paint outside the lines. Hope you don't mind." },
    { key: "kukui", region: "Alola", name: "PROF. KUKUI", rank: "Champion", type: "fighting",   team: [745, 38, 628, 462, 143, 727], pts: 20, boost: 1.48, needs: "mina", reveal: "diantha",
      quote: "Woo! I built this whole league dreaming of a battle like this one. Let's make it legendary — yeah!" },
    // ---- The Galar Champion Cup → Champion LEON ----
    { key: "marnie", region: "Galar", name: "MARNIE", rank: "Champion Cup", type: "dark",       team: [861, 877, 510, 454, 560, 197], pts: 16, boost: 1.46, needs: "kukui", reveal: "kukui", gymGate: { start: 52, count: 8, region: "Galar" },
      quote: "I'm gonna become Champion for Spikemuth's sake. Nothin' personal — but I'm not holdin' back." },
    { key: "bede", region: "Galar", name: "BEDE", rank: "Champion Cup", type: "fairy",          team: [858, 866, 282, 78, 700, 468], pts: 16, boost: 1.46, needs: "marnie", reveal: "kukui",
      quote: "I'm destined for greatness — obviously. Now stand aside, or be knocked aside." },
    { key: "oleana", region: "Galar", name: "OLEANA", rank: "Champion Cup", type: "poison",     team: [569, 350, 478, 758, 596, 1018], pts: 16, boost: 1.46, needs: "bede", reveal: "kukui",
      quote: "For Chairman Rose, I will allow no one to pass. Efficiency demands your defeat." },
    { key: "hop", region: "Galar", name: "HOP", rank: "Champion Cup", type: "normal",           team: [832, 845, 823, 143, 706, 812], pts: 16, boost: 1.46, needs: "oleana", reveal: "kukui",
      quote: "I'm gonna be the greatest Champion — right after my brother! Bring it on, mate!" },
    { key: "leon", region: "Galar", name: "LEON", rank: "Champion", type: "dragon",             team: [681, 887, 612, 537, 464, 6], pts: 22, boost: 1.5, needs: "hop", reveal: "kukui",
      quote: "My time as Champion is coming to an end… but I'll go out with the greatest battle ever. Let's have a champion time!" },
    // ---- The Paldea Elite Four → Top Champion GEETA ----
    { key: "rika", region: "Paldea", name: "RIKA", rank: "Elite Four", type: "ground",           team: [980, 340, 323, 51, 232, 445], pts: 17, boost: 1.48, needs: "leon", reveal: "leon", gymGate: { start: 60, count: 8, region: "Paldea" },
      quote: "You've got potential, kid — I can smell it. Let's see if the ground agrees." },
    { key: "poppy", region: "Paldea", name: "POPPY", rank: "Elite Four", type: "steel",          team: [879, 959, 823, 437, 462, 212], pts: 17, boost: 1.48, needs: "rika", reveal: "leon",
      quote: "Wanna battle? Yay! My steel-type buddies are super duper strong, you know!" },
    { key: "larryf", region: "Paldea", name: "LARRY", rank: "Elite Four", type: "flying",        team: [357, 398, 334, 741, 973, 715], pts: 17, boost: 1.48, needs: "poppy", reveal: "leon",
      quote: "Off the clock, it's flying-types for me. Simple and strong — no frills. That's the best way, right?" },
    { key: "hassel", region: "Paldea", name: "HASSEL", rank: "Elite Four", type: "dragon",       team: [715, 691, 841, 612, 998, 149], pts: 17, boost: 1.48, needs: "larryf", reveal: "leon",
      quote: "Let us paint a masterpiece together — you, me, and the roar of dragons!" },
    { key: "geeta", region: "Paldea", name: "GEETA", rank: "Top Champion", type: "fairy",        team: [956, 713, 673, 976, 983, 970], pts: 24, boost: 1.55, needs: "hassel", reveal: "leon", mystery: true,
      quote: "As Top Champion, I oversee every league. Show me why you climbed all nine regions to reach me." },
  ];
  window.LEAGUE_STAGES = LEAGUE;
  const idxOf = (key) => LEAGUE.findIndex((s) => s.key === key);
  const stageByKey = (key) => LEAGUE[idxOf(key)];

  // The set of stages a trainer has EFFECTIVELY beaten. Beating any stage was
  // only ever possible after clearing everything on its `needs`-chain, so a
  // later win PROVES every prerequisite was beaten too. We close over that
  // chain here — which self-heals a win that got clipped by a last-write-wins
  // sync (the classic "I beat Koga but the ladder says I didn't": if Bruno is
  // still on record, Koga and Will are re-inferred from it). Never fabricates
  // an unearned win — the game enforced the order at the time it was played.
  function beatenSet(attId) {
    const set = {};
    Store.leagueWins(attId).forEach((k) => {
      set[k] = 1;
      let cur = stageByKey(k);
      while (cur && cur.needs && !set[cur.needs]) { set[cur.needs] = 1; cur = stageByKey(cur.needs); }
    });
    return set;
  }
  const hasBeat = (attId, key) => !!beatenSet(attId)[key];

  function johtoBadges(attId) {
    let n = 0; for (let i = 0; i < 8; i++) if (Store.gymHolders(i).indexOf(attId) >= 0) n++;
    return n;
  }
  // Why can't this trainer fight stage idx yet? "" = clear to battle.
  function leagueBlocked(attId, idx) {
    const st = LEAGUE[idx];
    const beaten = beatenSet(attId);
    // The whole League gates on the 8 Johto badges (Victory Road).
    if (johtoBadges(attId) < 8) return "The League only admits trainers holding all 8 JOHTO badges (" + johtoBadges(attId) + "/8).";
    // RED, the Mt. Silver summit, additionally demands all 16 Johto+Kanto badges.
    if (st.key === "red" && Store.gymBadgesInRange(attId, 0, 16) < 16) return "RED faces only trainers holding ALL 16 Johto & Kanto badges (" + Store.gymBadgesInRange(attId, 0, 16) + "/16).";
    // A new region's Elite Four demands that region's 8 gym badges first.
    if (st.gymGate) {
      const g = st.gymGate, have = Store.gymBadgesInRange(attId, g.start, g.count);
      if (have < g.count) return "The " + g.region + " Elite Four admit only trainers holding all " + g.count + " " + g.region + " gym badges (" + have + "/" + g.count + " — earn them in the Gym Circuit).";
    }
    // Linear climb: the previous stage (st.needs) must be beaten.
    if (st.needs && !beaten[st.needs]) {
      const prev = stageByKey(st.needs);
      if (st.key === "red") return "…the summit is silent. (Beat Champion " + prev.name + " first.)";
      if (st.rank === "Champion") return "Champion " + st.name + " only faces trainers who've toppled all four of the Elite Four.";
      if (prev.rank === "Champion") return "A new region's Elite Four — first defeat Champion " + prev.name + " to earn the invitation.";
      return "The Elite Four fall IN ORDER — beat " + prev.name + " first.";
    }
    return "";
  }
  window.LeagueGate = { blocked: leagueBlocked, johtoBadges: johtoBadges };

  // A stage's card is fogged for everyone until ANY trainer has beaten its
  // `reveal` key (keeps later regions — and the final trainer — a surprise).
  function revealed(st) {
    if (!st.reveal) return true;
    return Store.state.attendees.some((a) => hasBeat(a.id, st.reveal));
  }

  // Cinematic chamber entrance: doors part, the quote lands, then you choose
  // to step in. RED's chamber is snow and silence.
  function chamberIntro(idx, onGo) {
    const st = LEAGUE[idx];
    const isRed = st.key === "red";
    const isFinal = !!st.final;
    const ico = energyIcon(st.type);
    const rankLabel = isRed ? "MT. SILVER" : isFinal ? "THE FINAL BATTLE" : st.rank.toUpperCase();
    const lay = el("div", { class: "league-intro" + (isRed ? " red" : "") + (isFinal ? " final" : "") }, [
      el("div", { class: "league-intro-inner" }, [
        isRed ? el("div", { class: "league-intro-mt" }, "🗻") :
          isFinal ? el("div", { class: "league-intro-mt" }, "🎹") :
          (ico ? el("img", { class: "league-intro-ico", src: ico, alt: "" }) : null),
        // Cynthia's cue: the famous theme's piano swells before the battle.
        st.intro ? el("div", { class: "league-intro-flair" }, st.intro) : null,
        el("div", { class: "league-intro-rank" }, rankLabel),
        el("div", { class: "league-intro-name" }, isRed ? "…" : st.name),
        el("div", { class: "league-intro-quote" }, "“" + st.quote + "”"),
        el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
          el("button", { class: "btn spin-btn", onClick: () => { lay.remove(); onGo(); } },
            isRed ? "🗻 STEP FORWARD" : isFinal ? "🎹 ANSWER THE FINALE" : "⚔ STEP INTO THE CHAMBER"),
          el("button", { class: "btn subtle", onClick: () => lay.remove() }, "Not yet"),
        ]),
      ]),
    ]);
    document.body.appendChild(lay);
    sfx(isRed ? "error" : "fanfare");
    requestAnimationFrame(() => lay.classList.add("go"));
  }

  function challengeLeague(idx, attId) {
    const st = LEAGUE[idx];
    const size = st.team.length;
    const isRed = st.key === "red";
    const isFinal = !!st.final;
    const why = leagueBlocked(attId, idx);
    if (why) { alert(why); return; }
    if (Duel.poolFor(attId).length < size) { alert(st.name + " runs " + size + " Pokémon — you need " + size + " of your own."); return; }
    const foeName = isRed ? "RED" : st.rank + " " + st.name;
    chamberIntro(idx, () => {
      Duel.pickParty({ attId: attId, min: size, max: size,
        title: "vs " + foeName + " — pick EXACTLY " + size,
        hint: isRed ? "The silent trainer. " + size + " vs " + size + "."
          : isFinal ? "The final battle. " + size + " vs " + size + " — the lineup is hidden."
          : "Even match: " + size + " vs " + size + ". The lineup is hidden.",
        onDone: (ids) => {
          Duel.start({ mode: "local",
            title: isRed ? "Mt. Silver" : isFinal ? "the Final Battle" : "the Pokémon League",
            league: { idx: idx, key: st.key, name: st.name, rank: st.rank, region: st.region || "", pts: st.pts, final: isFinal },
            a: { units: [{ attId: attId, monIds: ids }] },
            b: { units: [{ npc: isRed ? "RED" : st.rank.toUpperCase() + " " + st.name, ai: true, monIds: st.team.slice(),
              boost: st.boost || 1.15 }] },
            onResult: () => Router.render() });
        } });
    });
  }

  // 🏰 Hall of Fame Gauntlet — fight EVERY enshrined team back-to-back. Two
  // modes: pick a fresh six each battle, or bring one squad for the whole run
  // (fully healed between rounds).
  function runGauntlet(attId, mode, teamList, label) {
    const teams = (teamList && teamList.slice()) || (Store.state.hof || []).slice();
    const total = teams.length;
    if (!total) return;
    const size = 6;
    if (Duel.poolFor(attId).length < size) { alert("The Gauntlet is 6-on-6 — catch six of your own first (Safari Zone)."); return; }
    const regKey = label || "All";
    let fixed = null;

    const finishRun = (cleared, won) => {
      if (won) {
        try { Store.update((s) => {
          Store.chron(s, "🏰", ((Store.attendee(attId) || {}).name || attId) +
            " ran the " + (label ? label.toUpperCase() + " " : "") + "HALL OF FAME GAUNTLET and toppled all " + total + " enshrined teams" +
            (mode === "fixed" ? " — with ONE squad, no less!" : ", swapping squads each round!"));
          // 🏰 record the clear (keep the harder mode: fixed one-squad beats fresh swap)
          s.gauntlets = s.gauntlets || {};
          const g = s.gauntlets[attId] = s.gauntlets[attId] || {};
          if (g[regKey] !== "fixed") g[regKey] = mode;
        }); } catch (_) {}
        sfx("fanfare");
      }
      let ctrl;
      const body = el("div", { class: "league-intro-inner", style: { textAlign: "center", padding: "8px", gap: "10px" } }, [
        el("div", { style: { fontSize: "52px" } }, won ? "🏆" : "🛡"),
        el("div", { class: "trn-crown-rank" }, won ? "GAUNTLET CLEARED!" : "GAUNTLET OVER"),
        el("div", { class: "trn-crown-name" }, won
          ? "Defeated all " + total + " Hall of Fame team" + (total > 1 ? "s" : "") + "!"
          : "You fell after " + cleared + " / " + total + ". Run it back?"),
        el("button", { class: "btn primary", onClick: () => { if (ctrl) ctrl.close(); Router.render(); } }, "Done"),
      ]);
      ctrl = Modal.open("🏰 Hall of Fame Gauntlet", body, null, { noFooter: true });
    };

    const runAt = (i) => {
      if (i >= total) { finishRun(total, true); return; }
      const h = teams[i];
      const champ = (Store.attendee(h.attId) || {}).name || h.attId;
      const go = (party) => {
        Duel.start({ mode: "local", title: "Hall of Fame Gauntlet (" + (i + 1) + "/" + total + ")",
          gauntlet: true,
          a: { units: [{ attId: attId, monIds: party }] },
          b: { units: [{ npc: "HOF " + champ, ai: true, monIds: (h.party || []).slice() }] },
          onResult: (winSide) => { if (winSide === "a") runAt(i + 1); else finishRun(i, false); } });
      };
      if (mode === "fixed") {
        if (fixed) { go(fixed); return; }
        Duel.pickParty({ attId: attId, min: size, max: size, title: "Your ONE Gauntlet squad — pick 6",
          hint: "🛡 ONE team for the entire gauntlet (fully healed between battles). No swaps — choose a versatile six! First up: " + champ + "'s team.",
          onDone: (ids) => { fixed = ids; go(ids); } });
      } else {
        Duel.pickParty({ attId: attId, min: size, max: size, title: "Round " + (i + 1) + "/" + total + " — vs " + champ + "'s team",
          hint: "🔄 Fresh 6 for THIS battle — counter their lineup. Win to advance to the next enshrined team.",
          onDone: go });
      }
    };
    runAt(0);
  }

  function gauntletChoice(attId, teamList, label) {
    const teams = (teamList && teamList.slice()) || (Store.state.hof || []).slice();
    const n = teams.length;
    let ctrl;
    const body = el("div", { class: "modal-form" }, [
      el("p", { class: "hint" }, "Face all " + n + " enshrined team" + (n > 1 ? "s" : "") + " back-to-back, in order. Lose once and the run ends. One-squad is the tougher badge. Pick your style:"),
      el("div", { class: "gauntlet-modes" }, [
        el("button", { class: "btn primary", onClick: () => { if (ctrl) ctrl.close(); runGauntlet(attId, "fresh", teams, label); } },
          "🔄 Swap squads — pick a fresh 6 every battle"),
        el("button", { class: "btn primary", onClick: () => { if (ctrl) ctrl.close(); runGauntlet(attId, "fixed", teams, label); } },
          "🏆 One squad — same 6 all the way (harder!)"),
      ]),
    ]);
    ctrl = Modal.open("🏰 Hall of Fame Gauntlet", body, null, { noFooter: true });
  }

  // 🏛 Battle of Fame — a champion's enshrined team steps down from its
  // plaque (Stadium-style ghost team, AI-controlled). Pure exhibition.
  function challengeFame(h, attId) {
    const a = Store.attendee(h.attId);
    const champ = (a && a.name) || h.attId;
    const size = (h.party || []).length;
    if (!size) return;
    if (Duel.poolFor(attId).length < size) { alert("This Hall of Fame team runs " + size + " — you need " + size + " of your own."); return; }
    const lay = el("div", { class: "league-intro fame" }, [
      el("div", { class: "league-intro-inner" }, [
        el("div", { class: "league-intro-mt" }, "🏛"),
        el("div", { class: "league-intro-rank" }, "HALL OF FAME"),
        el("div", { class: "league-intro-name" }, champ.toUpperCase()),
        el("div", { class: "league-intro-quote" }, "“The plaque gleams… and the team that conquered the League steps down from legend.”"),
        el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
          el("button", { class: "btn spin-btn", onClick: () => {
            lay.remove();
            Duel.pickParty({ attId: attId, min: size, max: size,
              title: "vs " + champ + "'s Hall of Fame team — pick EXACTLY " + size,
              hint: "Battle of Fame: " + size + " vs " + size + ". Exhibition — glory only.",
              onDone: (ids) => {
                Duel.start({ mode: "local", title: "the Hall of Fame",
                  hof: { attId: h.attId, name: champ },
                  a: { units: [{ attId: attId, monIds: ids }] },
                  b: { units: [{ npc: "HOF " + champ, ai: true, monIds: h.party.slice() }] },
                  onResult: () => Router.render() });
              } });
          } }, "⚔ ANSWER THE LEGEND"),
          el("button", { class: "btn subtle", onClick: () => lay.remove() }, "Not yet"),
        ]),
      ]),
    ]);
    document.body.appendChild(lay);
    sfx("fanfare");
    requestAnimationFrame(() => lay.classList.add("go"));
  }

  // The leader's ace, silhouetted until this stage has been beaten by anyone.
  function aceSprite(idx, beaten) {
    const st = LEAGUE[idx];
    const ace = st.team[st.team.length - 1];
    const src = SP[ace] || Store.sprite(ace);
    if (!src) return null;
    return el("img", { class: "league-ace" + (beaten ? " lit" : ""), src: src, alt: "" });
  }

  // 🏛 Which crown a Hall-of-Fame team earned — named by the champion/region it
  // beat. Newer enshrinements carry key/champ/region; older ones fall back to
  // the legacy "beat RED?" heuristic.
  function hofTitle(h) {
    if (h && h.key === "red") return { ico: "🗻", txt: "conquered Mt. Silver — defeated RED" };
    if (h && h.champ) {
      if (h.rank === "Top Champion") return { ico: "🌟", txt: "Top Champion — beat " + h.champ + (h.region ? " (" + h.region + ")" : "") };
      return { ico: "👑", txt: (h.region ? h.region + " " : "") + "Champion — beat " + h.champ };
    }
    // Legacy entries predate per-crown tracking — label neutrally (every
    // enshrined team beat *a* Champion) rather than guessing the region.
    return { ico: "👑", txt: "League Champion" };
  }

  // ---- reusable renderers (shared with the combined Regions view) ----
  function stageNode(idx, attId) {
    const st = LEAGUE[idx];
    const isRed = st.key === "red";
    const isFinal = !!st.final;
    const mineBeat = hasBeat(attId, st.key);
    const anyBeat = Store.state.attendees.some((a) => hasBeat(a.id, st.key));
    const blocked = leagueBlocked(attId, idx);
    const isNext = !mineBeat && !blocked;
    const ico = energyIcon(st.type);
    const beatenBy = Store.state.attendees.filter((a) => hasBeat(a.id, st.key));
    const nameLabel = st.mystery ? ((anyBeat || mineBeat) ? st.name : "???") : st.rank + " " + st.name;
    const sub = isRed ? "the summit" : isFinal ? "the finale" : (st.rank === "Champion" ? "the Champion's hall" : "an Elite chamber");
    const headIco = isRed ? el("span", { class: "league-mt" }, "🗻")
      : isFinal ? el("span", { class: "league-mt" }, "🎹")
      : (ico ? el("img", { class: "gymc-ico", src: ico, alt: "" }) : null);
    return el("div", { class: "league-stage" + (mineBeat ? " cleared" : "") + (isNext ? " next" : "") + (isRed ? " red" : "") + (isFinal ? " final" : "") + (!mineBeat && blocked ? " locked" : "") }, [
      el("div", { class: "league-stage-rail" }, [el("span", { class: "league-dot" }, mineBeat ? "✅" : (isNext ? "⚔" : "🔒"))]),
      el("div", { class: "league-stage-card" }, [
        el("div", { class: "league-stage-head" }, [
          headIco,
          el("div", {}, [
            el("div", { class: "gymc-badge" }, nameLabel),
            el("div", { class: "gymc-leader" }, sub + " · team of " + st.team.length + " (hidden)"),
          ]),
          aceSprite(idx, mineBeat || anyBeat),
        ]),
        isNext ? el("div", { class: "league-now" }, isFinal ? "🎹 THE FINAL BATTLE AWAITS" : "⚔ YOUR NEXT CHALLENGE") : null,
        (!mineBeat && blocked) ? el("div", { class: "league-lock" }, blocked) : null,
        beatenBy.length ? el("div", { class: "gymc-holders" }, beatenBy.map((a) =>
          el("span", { class: "gymc-holder", onClick: () => window.Profile && Profile.open(a.id) }, ((isRed || isFinal) ? "🗻 " : "👑 ") + a.name))) : null,
        (!mineBeat) ? el("button", { class: "btn " + (isNext ? "primary" : "subtle") + " sm", onClick: () => challengeLeague(idx, attId) },
          (isRed ? "🗻 Face what waits" : isFinal ? "🎹 Face the finale" : "⚔ Challenge " + st.name) + " (" + st.team.length + "v" + st.team.length + ")") :
          el("button", { class: "btn subtle sm", onClick: () => challengeLeague(idx, attId) }, "🔁 Rematch (glory only)"),
      ]),
    ]);
  }

  function gateCard(attId) {
    const jb = johtoBadges(attId), all = Store.gymBadgesInRange(attId, 0, 16);
    return el("div", { class: "league-stage gate" + (jb >= 8 ? " cleared" : " locked") }, [
      el("div", { class: "league-stage-rail" }, [el("span", { class: "league-dot" }, jb >= 8 ? "✅" : "🔒")]),
      el("div", { class: "league-stage-card" }, [
        el("div", { class: "gymc-badge" }, "🚪 Victory Road Gate"),
        el("div", { class: "gymc-leader" }, jb >= 8
          ? "The guard nods. All 8 Johto badges — the gate stands open."
          : "“You'll need all 8 JOHTO badges to pass.” (" + jb + "/8 — earn them in the Gym Circuit)"),
        all >= 16 ? el("div", { class: "league-now" }, "🏟 ALL 16 BADGES — even the summit would accept you.") : null,
      ]),
    ]);
  }

  // One-time backfill: HOF entries enshrined BEFORE per-crown tracking carry no
  // region. Each Champion win created exactly ONE entry, in ladder order — so
  // pair a trainer's region-less entries (oldest first) with the champions they
  // have beaten (ladder order) and stamp region/champ/key/rank. Reliable because
  // only fresh Champion wins enshrine (rematches/HOF/gym battles don't).
  function backfillHofRegions() {
    const hof = Store.state.hof || [];
    if (!hof.some((h) => h && !h.region && !h.key && !h.mig)) return;
    const champs = LEAGUE.filter((s) => (s.rank === "Champion" || s.rank === "Top Champion" || s.final) && s.key !== "red");
    const wonByAtt = {};
    (Store.state.attendees || []).forEach((a) => { wonByAtt[a.id] = champs.filter((c) => hasBeat(a.id, c.key)); });
    Store.update((s) => {
      const byAtt = {};
      (s.hof || []).forEach((h) => { if (h && !h.region && !h.key && !h.mig) (byAtt[h.attId] = byAtt[h.attId] || []).push(h); });
      Object.keys(byAtt).forEach((att) => {
        const entries = byAtt[att].sort((a, b) => (a.ts || 0) - (b.ts || 0));
        const won = wonByAtt[att] || [];
        entries.forEach((h, i) => {
          const c = won[i];
          if (c) { h.region = c.region || ""; h.champ = c.name; h.rank = c.rank; h.key = c.key; }
          else { h.mig = 1; }   // no matching champ on record — leave legacy, don't re-scan
        });
      });
    });
  }

  function renderHOF(hostEl, attId, opts) {
    opts = opts || {};
    backfillHofRegions();
    let hof = (Store.state.hof || []).slice();
    // Region-scoped Hall of Fame: only champions who won THIS region. Kanto &
    // Johto (the origin) also adopts legacy entries that predate region tracking.
    if (opts.regions) {
      const regs = opts.regions;
      const takesLegacy = regs.indexOf("Johto") >= 0 || regs.indexOf("Kanto") >= 0;
      hof = hof.filter((h) => (h.region && regs.indexOf(h.region) >= 0) || (takesLegacy && !h.region));
    }
    if (!hof.length) return;
    hostEl.appendChild(el("h2", { class: "section-title" }, "🏛 Hall of Fame" + (opts.label ? " · " + opts.label : "")));
    hostEl.appendChild(el("p", { class: "hint" },
      "⚔ Battle of Fame: any enshrined team can be challenged — the exact lineup that beat " + (opts.label ? opts.label : "the League") + ", AI-controlled, Stadium-style. Exhibition only (no Elo, no belt)."));
    hostEl.appendChild(el("div", { class: "toolbar" }, [
      el("button", { class: "btn spin-btn", onClick: () => gauntletChoice(attId, hof, opts.label) },
        "🏰 Run the Gauntlet — all " + hof.length + " team" + (hof.length > 1 ? "s" : "")),
    ]));
    // 🏰 who has CLEARED this Hall of Fame's gauntlet, and how hard — one-squad
    // (🏆) is the tougher badge than swap-squads (⚔).
    const regKey = opts.label || "All";
    const clears = (Store.state.attendees || []).map((a) => {
      const m = ((Store.state.gauntlets || {})[a.id] || {})[regKey];
      return m ? { name: a.name, id: a.id, mode: m } : null;
    }).filter(Boolean).sort((a, b) => (a.mode === "fixed" ? 0 : 1) - (b.mode === "fixed" ? 0 : 1));
    if (clears.length) {
      hostEl.appendChild(el("div", { class: "gauntlet-cleared" }, [el("span", { class: "gc-lab" }, "🏰 Gauntlet cleared:")]
        .concat(clears.map((c) => el("span", { class: "gc-chip" + (c.mode === "fixed" ? " hard" : ""),
          onClick: () => window.Profile && Profile.open(c.id),
          title: c.mode === "fixed" ? "One squad, all the way — the hard mode" : "Swapped squads each round" },
          (c.mode === "fixed" ? "🏆 " : "⚔ ") + c.name + (c.mode === "fixed" ? " · one squad" : " · swap"))))));
    }
    hostEl.appendChild(el("div", { class: "hof-list" }, hof.map((h) => {
      const a = Store.attendee(h.attId);
      const title = hofTitle(h);
      return el("div", { class: "hof-row" }, [
        el("div", { class: "hof-name" }, title.ico + " " + ((a && a.name) || h.attId) + " — " + title.txt),
        el("div", { class: "hof-team" }, (h.party || []).map((id) => {
          const shiny = a && Store.state.pokedex.trainers[a.id] && Store.state.pokedex.trainers[a.id].caught[id] && Store.state.pokedex.trainers[a.id].caught[id].shiny;
          const src = (shiny && window.DEX_SPRITES_SHINY && DEX_SPRITES_SHINY[id]) || SP[id] || Store.sprite(id);
          return src ? el("img", { class: "hof-mon", src: src, alt: "" }) : null;
        })),
        el("button", { class: "btn primary sm hof-fight", onClick: () => challengeFame(h, attId) },
          "⚔ Battle this team (" + (h.party || []).length + "v" + (h.party || []).length + ")"),
      ]);
    })));
  }

  function stageIdxsForRegions(regions) {
    const out = [];
    LEAGUE.forEach((st, i) => { if (regions.indexOf(st.region) >= 0) out.push(i); });
    return out;
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "👑 Pokémon League"),
      el("p", { class: "page-sub" }, "Victory Road is only the beginning. Nine regions of Elite chambers and Champions, a silent trainer on the mountain, and — at the summit of it all — the Top Champion who oversees them all." ),
    ]));
    let attId = (window.Sync && Sync.getMe && Sync.getMe()) || (Store.state.attendees[0] || {}).id || "";
    const sel = el("select", { class: "in" }, Store.state.attendees.map((a) => el("option", { value: a.id }, a.name + "'s journey")));
    sel.value = attId;
    const host = el("div", {});
    sel.addEventListener("change", () => { attId = sel.value; paint(); });
    root.appendChild(sel);
    root.appendChild(host);
    function paint() {
      host.innerHTML = "";
      const journey = el("div", { class: "league-journey" });
      journey.appendChild(gateCard(attId));
      for (let i = 0; i < LEAGUE.length; i++) {
        if (revealed(LEAGUE[i])) { journey.appendChild(stageNode(i, attId)); continue; }
        journey.appendChild(el("div", { class: "league-stage locked fog" }, [
          el("div", { class: "league-stage-rail" }, [el("span", { class: "league-dot" }, "🌫")]),
          el("div", { class: "league-stage-card" }, [
            el("div", { class: "gymc-badge" }, "🌫 ﹖﹖﹖"),
            el("div", { class: "gymc-leader" }, "Beyond the last victory, the fog hides what comes next…"),
          ]),
        ]));
        break;
      }
      host.appendChild(journey);
      renderHOF(host, attId);
    }
    paint();
  }

  window.Views = window.Views || {};
  window.Views.league = view;
  window.PokeLeague = {
    stageNode: stageNode, gateCard: gateCard, renderHOF: renderHOF,
    stageIdxsForRegions: stageIdxsForRegions, revealed: revealed,
  };
})();
