/*
 * store.js — tiny state container with localStorage persistence.
 * Exposes a global `Store`. No frameworks, no build step.
 */
(function () {
  const KEY = "jasonBachHub.v2";

  // Drink types for the tracker (single source of truth for buttons + awards).
  const DRINKS = [
    { type: "Beer", emoji: "🍺" },
    { type: "Seltzer", emoji: "🥤" },
    { type: "Shot", emoji: "🥃" },
    { type: "Cocktail", emoji: "🍸" },
    { type: "Wine", emoji: "🍷" },
    { type: "Water", emoji: "💧" },
  ];
  function drinkEmoji(type) { const d = DRINKS.find((x) => x.type === type); return d ? d.emoji : "🥂"; }

  // Deep clone helper (structuredClone with a JSON fallback for old browsers).
  function clone(obj) {
    try { return structuredClone(obj); }
    catch (_) { return JSON.parse(JSON.stringify(obj)); }
  }

  function freshState() {
    const seed = window.SEED || {};
    return {
      party: clone(seed.party || {}),
      teams: clone(seed.teams || []),
      attendees: clone(seed.attendees || []),
      events: clone(seed.events || []),
      activities: clone(seed.activities || []),
      gamePlan: clone(seed.gamePlan || []),
      badges: clone(seed.badges || []),
      gymBadges: clone(seed.gymBadges || []),
      oakTip: clone(seed.oakTip || {}),
      memes: clone(seed.memes || []),
      hall: clone(seed.hall || []),
      superlatives: clone(seed.superlatives || []),
      challenges: clone(seed.challenges || []),
      evolutions: clone(seed.evolutions || {}),
      // evoStage[attendeeId] = current evolution stage index (0 = base)
      evoStage: {},
      // scores[eventId][teamId] = points awarded
      scores: {},
      // draft metadata
      draft: { order: [], picks: [], started: false },
      // superlativeVotes[categoryId][attendeeId] = vote count
      superlativeVotes: {},
      // challengeDone[challengeId] = { done, by, note }
      challengeDone: {},
      // Live Jeopardy state — the board is cloned so clues can be edited in-app.
      jeopardy: {
        board: clone(seed.jeopardyBoard || { rounds: [], final: {} }),
        round: 0,          // which round is on the board (0 = Single, 1 = Double)
        used: {},          // used["round-cat-clue"] = true
        scores: {},        // scores[teamId] = running total
        finalDone: false,
      },
      // brackets = [ { id, title, participants:[], rounds:[[{a,b,winner}]] } ]
      brackets: [],
      // Safari / Pokédex game — per trainer.
      //   active: currently-selected catcher (attendee id)
      //   trainers[id] = { caught:{[dexId]:{count}}, team:[ids], catches:N }
      //   log = [{ trainer, dexId, name, ts }]
      pokedex: { active: "", trainers: {}, log: [], given: 0, taken: 0 },
      // Battle history: log = [{ title, winner, loser, ts }]
      battles: { log: [] },
      // Weekend chronicle — a running feed of notable moments.
      //   [{ ts, icon, text }]
      chronicle: [],
      // Drink tracker — one entry per logged drink.
      //   [{ id, trainer, type, ts }]
      drinks: [],
      // Photo log — downscaled photo moments. NOT sent in the sync state doc
      //   (too big); shared via a separate Firestore photos channel instead.
      //   [{ id, ts, img, caption, by, reactions:[], comments:[], rev }]
      photos: [],
      // Predictions / Oracle — call outcomes, score correct callers.
      //   [{ id, q, options:[{id,text}], votes:{attId:optId}, closed, answer, by, ts }]
      predictions: [],
      // Card games — one round per entry. `ranking` is best→worst (President)
      //   or the winners (Euchre) or the spotlight player (Kings/Ride the Bus).
      //   [{ id, game, ranking:[attId], note, by, ts }]
      cardGames: [],
      // Message Wall for the groom — sealed from him until the closing ceremony.
      //   [{ id, ts, by, text }]
      messages: [],
      messagesUnlocked: false,
      meta: { version: 1 },
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return freshState();
      const parsed = JSON.parse(raw);
      // Merge in any new seed collections that didn't exist when saved,
      // so editing seed.js can introduce fields without wiping user data.
      const base = freshState();
      return Object.assign(base, parsed, {
        scores: parsed.scores || {},
        draft: Object.assign(base.draft, parsed.draft || {}),
        superlativeVotes: parsed.superlativeVotes || {},
        challengeDone: parsed.challengeDone || {},
        evoStage: parsed.evoStage || {},
        jeopardy: (function () {
          // Keep the player's in-progress board, BUT if the seed ships a newer
          // deck (higher board.version) than what was saved, swap in the fresh
          // clues and reopen the board.
          const saved = parsed.jeopardy || {};
          const merged = Object.assign(base.jeopardy, saved);
          const seedVer = (base.jeopardy.board && base.jeopardy.board.version) || 0;
          const savedVer = (saved.board && saved.board.version) || 0;
          if (savedVer < seedVer) { merged.board = clone(seed.jeopardyBoard); merged.used = {}; merged.finalDone = false; merged.round = 0; }
          return merged;
        })(),
        brackets: parsed.brackets || [],
        pokedex: Object.assign(base.pokedex, parsed.pokedex || {}),
        battles: Object.assign(base.battles, parsed.battles || {}),
        chronicle: parsed.chronicle || [],
        drinks: parsed.drinks || [],
        photos: parsed.photos || [],
        predictions: parsed.predictions || [],
        cardGames: parsed.cardGames || [],
        messages: parsed.messages || [],
        messagesUnlocked: parsed.messagesUnlocked || false,
        meta: Object.assign(base.meta, parsed.meta || {}),
      });
    } catch (e) {
      console.warn("Store: failed to load, starting fresh.", e);
      return freshState();
    }
  }

  const Store = {
    state: load(),
    _subs: [],

    subscribe(fn) {
      this._subs.push(fn);
      return () => { this._subs = this._subs.filter((f) => f !== fn); };
    },

    // Mutate via a callback, then persist + notify.
    update(mutator) {
      mutator(this.state);
      this.persist();
      this._subs.forEach((fn) => fn(this.state));
    },

    persist() {
      try {
        localStorage.setItem(KEY, JSON.stringify(this.state));
      } catch (e) {
        console.warn("Store: failed to persist (storage full or blocked).", e);
      }
    },

    reset() {
      this.state = freshState();
      this.persist();
      this._subs.forEach((fn) => fn(this.state));
    },
    // 🧹 FRESH SLATE — a brand-new party: everything resets like reset(),
    // but the trainer list starts BLANK (no seeded Jason/Joe/Matt) so a new
    // room builds its own crew with "+ Add trainer" (Squad page) or right in
    // the onboarding tour. Team captains are cleared too (they pointed at
    // seeded trainers). Syncs to the whole room like any other state write.
    freshSlate() {
      const s = freshState();
      s.attendees = [];
      (s.teams || []).forEach((t) => { t.captain = ""; });
      s.slate = 1;                     // marks a custom-crew slate
      this.state = s;
      this.persist();
      this._subs.forEach((fn) => fn(this.state));
    },

    // ---- Convenience selectors -------------------------------------------
    team(id) { return this.state.teams.find((t) => t.id === id) || null; },
    attendee(id) { return this.state.attendees.find((a) => a.id === id) || null; },

    // Offline Pokemon sprite (base64 data URI) for a National Dex id, or "".
    sprite(id) { return (window.SPRITES && window.SPRITES[id]) || (window.DEX_SPRITES && window.DEX_SPRITES[id]) || ""; },
    // ✨ Identity sprite: the trainer's favorite (in its current evo-card
    // form), drawn in the SHINY palette for the 1-in-16 trainers who rolled
    // one at signup. Use this anywhere a trainer's face is their favorite.
    favSprite(a) {
      if (!a) return "";
      const f = this.currentForm(a);
      if (!f.id) return "";
      return (a.shinyFav && (window.DEX_SPRITES_SHINY || {})[f.id]) || this.sprite(f.id);
    },
    // The signup roll — ONCE per trainer, ever (favRolled guards re-roll
    // fishing): 1-in-16 marks the TRAINER shiny, and the sparkle follows
    // whatever favorite they ever set. Returns true when it comes up shiny.
    rollFavShiny(attId) {
      const a = this.attendee(attId);
      if (!a || a.favRolled) return !!(a && a.shinyFav);
      let shiny = false;
      this.update((s) => {
        const rec = s.attendees.find((x) => x.id === attId);
        if (!rec || rec.favRolled) return;
        rec.favRolled = 1;
        if (Math.random() < 1 / 16) {
          rec.shinyFav = 1; shiny = true;
          Store.chron(s, "✨", rec.name + " is a SHINY TRAINER — their favorite rolled shiny at signup, a true 1-in-16!");
        }
      });
      return shiny;
    },

    // ---- Evolution -------------------------------------------------------
    evoConfig(attId) {
      return (this.state.evolutions && this.state.evolutions[attId]) ||
             (window.SEED && window.SEED.evolutions && window.SEED.evolutions[attId]) || null;
    },
    evoIndex(attId) { return (this.state.evoStage && this.state.evoStage[attId]) || 0; },

    // The form (name/sprite id/scale) an attendee is currently showing, plus
    // stage info. Falls back to the raw favorite when there's no evo config.
    currentForm(a) {
      const cfg = this.evoConfig(a.id);
      if (!cfg || !cfg.stages || !cfg.stages.length) {
        return { name: a.favorite || "", id: a.favoriteId || 0, scale: 1, stage: 0, total: 0, mode: null, next: null };
      }
      let i = this.evoIndex(a.id);
      if (i >= cfg.stages.length) i = cfg.stages.length - 1;
      const st = cfg.stages[i];
      return {
        name: st.name, id: st.id, scale: st.scale || 1, mega: !!st.mega,
        stage: i, total: cfg.stages.length, mode: cfg.mode,
        next: cfg.stages[i + 1] || null,
      };
    },

    evolve(attId) {
      const cfg = this.evoConfig(attId);
      if (!cfg) return false;
      const cur = this.evoIndex(attId);
      if (cur >= cfg.stages.length - 1) return false;
      this.update((s) => { s.evoStage[attId] = cur + 1; });
      return true;
    },
    devolve(attId) {
      const cur = this.evoIndex(attId);
      if (cur <= 0) return false;
      this.update((s) => { s.evoStage[attId] = cur - 1; });
      return true;
    },

    // Total score for a team across all events.
    teamTotal(teamId) {
      const s = this.state.scores;
      let total = 0;
      for (const ev in s) {
        if (s[ev] && typeof s[ev][teamId] === "number") total += s[ev][teamId];
      }
      return total;
    },

    // Standings sorted high → low, with rank (ties share a rank).
    standings() {
      const rows = this.state.teams.map((t) => ({
        team: t,
        total: this.teamTotal(t.id),
      }));
      rows.sort((a, b) => b.total - a.total);
      let lastTotal = null, lastRank = 0;
      rows.forEach((r, i) => {
        if (r.total !== lastTotal) { lastRank = i + 1; lastTotal = r.total; }
        r.rank = lastRank;
      });
      return rows;
    },

    // Attendees on a given team (or undrafted when team === "").
    roster(teamId) {
      return this.state.attendees.filter((a) => (a.team || "") === teamId);
    },

    // The team id an attendee belongs to (or "" if undrafted).
    teamOf(attId) { const a = this.attendee(attId); return (a && a.team) || ""; },

    // Award mini-game points into a named bucket. Call INSIDE an existing
    // update(s) so it shares the transaction. teamTotal() sums every bucket,
    // so these flow straight into Victory Road standings + the Ceremony.
    grantPoints(s, bucket, teamId, n) {
      if (!teamId || !n) return;
      s.scores = s.scores || {};
      s.scores[bucket] = s.scores[bucket] || {};
      s.scores[bucket][teamId] = (s.scores[bucket][teamId] || 0) + n;
    },

    // Points a team has earned from the mini-game buckets only.
    miniGamePoints(teamId) {
      const s = this.state.scores || {};
      let n = 0;
      ["safari", "battle", "jeopardy", "oracle", "cards"].forEach((b) => { if (s[b] && s[b][teamId]) n += s[b][teamId]; });
      return n;
    },

    // Attendee with the highest fn(id) (>0), as { a, n }, or null.
    _topAttendee(fn) {
      let best = null;
      this.state.attendees.forEach((a) => { const n = fn(a.id); if (n > 0 && (!best || n > best.n)) best = { a: a, n: n }; });
      return best;
    },

    // Live cross-feature trophies, computed from current state so they follow
    // the holder onto the home hub and the Gym Badges case.
    liveTrophies() {
      const tr = (this.state.pokedex && this.state.pokedex.trainers) || {};
      const cc = (id) => this.dexCount(id);
      const mc = (id) => (tr[id] && tr[id].masterCatches) || 0;
      const hp = (id) => (tr[id] && tr[id].helps) || 0;
      const out = [];
      const ash = this._topAttendee(cc);
      if (ash) out.push({ emoji: "🧢", title: "Ash Ketchum", holder: ash.a.name, sub: ash.n + " caught" });
      const mas = this._topAttendee(mc);
      if (mas) out.push({ emoji: "🟣", title: "Master Catcher", holder: mas.a.name, sub: mas.n + " master catch" + (mas.n > 1 ? "es" : "") });
      const help = this._topAttendee(hp);
      if (help) out.push({ emoji: "🤝", title: "Best Helper", holder: help.a.name, sub: help.n + " assist" + (help.n > 1 ? "s" : "") });
      const log = (this.state.battles && this.state.battles.log) || [];
      if (log.length) {
        const w = {}; log.forEach((b) => { w[b.winner] = (w[b.winner] || 0) + 1; });
        const top = Object.keys(w).sort((x, y) => w[y] - w[x])[0];
        if (top) out.push({ emoji: "⚔️", title: "Battle Champ", holder: top, sub: w[top] + " win" + (w[top] > 1 ? "s" : "") });
      }
      const shinyN = (id) => {
        const t = tr[id]; if (!t || !t.caught) return 0;
        let n = 0; for (const k in t.caught) if (t.caught[k].shiny) n++;
        return n;
      };
      const shiner = this._topAttendee(shinyN);
      if (shiner) out.push({ emoji: "✨", title: "Shiny Hunter", holder: shiner.a.name, sub: shiner.n + " shin" + (shiner.n > 1 ? "ies" : "y") + " caught" });
      const crusher = this._topAttendee((id) => this.gymBadgeCount(id));
      if (crusher) {
        const jk = this.gymBadgesInRange(crusher.a.id, 0, 16);   // Johto+Kanto sweep = CHAMPION
        out.push({ emoji: "🏟", title: jk >= 16 ? "CHAMPION" : "Gym Crusher", holder: crusher.a.name,
          sub: jk >= 16 ? "swept ALL 16 Johto & Kanto gyms!" : crusher.n + " gym badges earned" });
      }
      const league = this._topAttendee((id) => this.leagueWins(id).length);
      if (league) {
        const wins = this.leagueWins(league.a.id);
        const beatCynthia = wins.indexOf("cynthia") >= 0;
        const beatRed = wins.indexOf("red") >= 0;
        const total = (window.LEAGUE_STAGES || []).length || 16;
        out.push({
          emoji: beatCynthia ? "🎹" : beatRed ? "🗻" : "👑",
          title: beatCynthia ? "Champion of Champions" : beatRed ? "Conquered Mt. Silver" : "League Contender",
          holder: league.a.name,
          sub: beatCynthia ? "out-dueled CYNTHIA in the final battle" : beatRed ? "defeated RED — nothing left to prove" : league.n + "/" + total + " league battles won" });
      }
      // Champion's Belt — held by the last trainer to win/defend a singles duel.
      const belt = (this.state.battles && this.state.battles.belt) || null;
      if (belt && belt.attId) {
        const ba = this.attendee(belt.attId);
        out.push({ emoji: "🥇", title: "Champion's Belt", holder: (ba && ba.name) || belt.name,
          sub: belt.streak > 1 ? belt.streak + " straight duel wins" : "beat them in a duel to take it" });
      }
      const oracle = this._topAttendee((id) => this.oracleScore(id));
      if (oracle) out.push({ emoji: "🔮", title: "Oracle", holder: oracle.a.name, sub: oracle.n + " correct call" + (oracle.n > 1 ? "s" : "") });
      const pres = this._topAttendee((id) => this.presidencies(id));
      if (pres) out.push({ emoji: "👑", title: "Best President", holder: pres.a.name, sub: pres.n + " presidenc" + (pres.n > 1 ? "ies" : "y") });
      const ass = this._topAttendee((id) => this.assholeries(id));
      if (ass) out.push({ emoji: "💩", title: "Worst President", holder: ass.a.name, sub: ass.n + " time" + (ass.n > 1 ? "s" : "") + " the Asshole" });
      const euch = this._topAttendee((id) => this.euchreWins(id));
      if (euch) out.push({ emoji: "♠️", title: "Euchre Champ", holder: euch.a.name, sub: euch.n + " win" + (euch.n > 1 ? "s" : "") });
      const first = this.firstDrink();
      if (first) { const a = this.attendee(first.trainer); if (a) out.push({ emoji: "🍾", title: "First Sip", holder: a.name, sub: "first drink of the weekend" }); }
      const thirst = this._topAttendee((id) => this.drinkCount(id));
      if (thirst) out.push({ emoji: "🍺", title: "Thirstiest", holder: thirst.a.name, sub: thirst.n + " drinks" });
      const keeper = this._topAttendee((id) => this.logCount(id));
      if (keeper) out.push({ emoji: "📋", title: "Scorekeeper", holder: keeper.a.name, sub: keeper.n + " moments logged" });
      return out;
    },

    // ---- Chronicle + Drinks ----------------------------------------------
    // Who's operating this phone (the scorekeeper) — the signed-in trainer.
    // Reads from Sync's local "me" so it works offline too. "" if not set.
    actorId() { return (window.Sync && Sync.getMe && Sync.getMe()) || ""; },

    // Push a chronicle moment INSIDE an existing update(s). Newest first.
    // Auto-stamps who logged it (the actor) unless `by` is given explicitly.
    chron(s, icon, text, by) {
      s.chronicle = s.chronicle || [];
      const who = (by !== undefined ? by : this.actorId()) || undefined;
      s.chronicle.unshift({ ts: (function () { try { return Date.now(); } catch (_) { return 0; } })(), icon: icon, text: text, by: who });
      if (s.chronicle.length > 500) s.chronicle.length = 500;
    },

    // How many moments a trainer has logged (scorekeeping) — chronicle + photos.
    logCount(attId) {
      let n = 0;
      (this.state.chronicle || []).forEach((c) => { if (c.by === attId) n++; });
      (this.state.photos || []).forEach((p) => { if (p.loggedBy === attId) n++; });
      return n;
    },

    // ---- Analytics (for the Stats hub / Wrapped / poster) -----------------
    _allMoments() {
      const m = (this.state.chronicle || []).map((c) => ({ ts: c.ts, by: c.by }));
      (this.state.photos || []).forEach((p) => m.push({ ts: p.ts, by: p.loggedBy }));
      return m;
    },
    activityByHour() {
      const b = []; for (let i = 0; i < 24; i++) b.push(0);
      this._allMoments().forEach((m) => { try { b[new Date(m.ts).getHours()]++; } catch (_) {} });
      return b;
    },
    activityByDay() {
      const by = {};
      this._allMoments().forEach((m) => { const k = this.dayKey(m.ts); (by[k] = by[k] || { key: k, label: this.dayLabel(m.ts), n: 0 }).n++; });
      return Object.keys(by).sort().map((k) => by[k]);
    },
    // Logs by a person (as scorekeeper) whose hour-of-day is in [lo, hi).
    logsInHours(attId, lo, hi) {
      let n = 0;
      this._allMoments().forEach((m) => { if (m.by === attId) { try { const h = new Date(m.ts).getHours(); if (h >= lo && h < hi) n++; } catch (_) {} } });
      return n;
    },
    photosOf(attId) { const a = this.attendee(attId); const nm = a ? a.name : ""; return (this.state.photos || []).filter((p) => p.by === nm).length; },
    photosTakenBy(attId) { return (this.state.photos || []).filter((p) => p.loggedBy === attId).length; },
    mostReactedPhoto() {
      let best = null;
      (this.state.photos || []).forEach((p) => { const n = (p.reactions || []).length; if (n > 0 && (!best || n > best.n)) best = { p: p, n: n }; });
      return best;
    },
    // Battle head-to-head win records: [{ winner, loser, n }] sorted desc.
    rivalries() {
      const pairs = {};
      (this.state.battles && this.state.battles.log || []).forEach((b) => {
        const k = b.winner + " ⚔ " + b.loser; (pairs[k] = pairs[k] || { winner: b.winner, loser: b.loser, n: 0 }).n++;
      });
      return Object.keys(pairs).map((k) => pairs[k]).sort((a, b) => b.n - a.n);
    },
    // A milestone worth celebrating (round numbers).
    _milestone(n) { return [10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500].indexOf(n) >= 0; },

    // Everything about one trainer, for a Wrapped card.
    wrapped(attId) {
      const a = this.attendee(attId), nm = a ? a.name : attId;
      const tr = (this.state.pokedex && this.state.pokedex.trainers || {})[attId] || {};
      const log = (this.state.battles && this.state.battles.log) || [];
      let w = 0, l = 0; log.forEach((b) => { if (b.winner === nm) w++; if (b.loser === nm) l++; });
      const myDrinks = (this.state.drinks || []).filter((d) => d.trainer === attId);
      const labelCounts = {}; myDrinks.forEach((d) => { if (d.label) labelCounts[d.label] = (labelCounts[d.label] || 0) + 1; });
      const topDrink = Object.keys(labelCounts).sort((x, y) => labelCounts[y] - labelCounts[x])[0] || "";
      return {
        name: nm, team: this.team(this.teamOf(attId)),
        caught: this.dexCount(attId), master: tr.masterCatches || 0, helps: tr.helps || 0,
        // "seen" unions catches in, so pre-tracking catches still count as seen.
        seen: Object.keys(Object.assign({}, tr.seen || {}, tr.caught || {})).length,
        pokeTeam: (tr.team || []).slice(0, 6),
        battleW: w, battleL: l, drinks: this.drinkCount(attId), topDrink: topDrink,
        presidencies: this.presidencies(attId), assholeries: this.assholeries(attId),
        euchre: this.euchreWins(attId), oracle: this.oracleScore(attId),
        logged: this.logCount(attId), photosIn: this.photosOf(attId), photosTaken: this.photosTakenBy(attId),
        duel: this.duelRecord(attId), kos: this.koLife(attId), shinies: this.shinyCount(attId),
        trades: this.tradeCount(attId), evolutions: this.evoCount(attId), gymBadges: this.gymBadgeCount(attId),
        league: this.leagueWins(attId).length,
        beltReigns: this.beltReigns(attId), elo: this.eloOf(attId),
        beltNow: !!(this.state.battles && this.state.battles.belt && this.state.battles.belt.attId === attId),
      };
    },

    // Auto-derived fun superlatives (data-backed, beyond the voted ones).
    funSuperlatives() {
      const out = [];
      const owl = this._topAttendee((id) => this.logsInHours(id, 0, 5));
      if (owl) out.push({ emoji: "🦉", title: "Night Owl", holder: owl.a.name, sub: owl.n + " late-night logs" });
      const bird = this._topAttendee((id) => this.logsInHours(id, 5, 10));
      if (bird) out.push({ emoji: "🌅", title: "Early Bird", holder: bird.a.name, sub: bird.n + " early logs" });
      const doc = this._topAttendee((id) => this.photosOf(id));
      if (doc) out.push({ emoji: "🌟", title: "Most Documented", holder: doc.a.name, sub: doc.n + " photos of them" });
      const shutter = this._topAttendee((id) => this.photosTakenBy(id));
      if (shutter) out.push({ emoji: "📷", title: "Shutterbug", holder: shutter.a.name, sub: shutter.n + " photos taken" });
      const riv = this.rivalries()[0];
      if (riv && riv.n >= 2) out.push({ emoji: "😈", title: "Rivalry", holder: riv.winner, sub: "beat " + riv.loser + " ×" + riv.n });
      return out;
    },
    // One-off chronicle entry from a view.
    logEvent(icon, text) { this.update((s) => { this.chron(s, icon, text); }); },

    // Log a drink for a trainer (used by the Drinks page + the Home quick-log).
    // `label` optionally names the specific drink (e.g. "Bud Light", "Old Fashioned").
    logDrink(trainerId, type, label) {
      if (!trainerId || !type) return;
      const a = this.attendee(trainerId), nm = a ? a.name : trainerId;
      label = (label || "").trim();
      const stamp = function () { try { return Date.now(); } catch (_) { return 0; } };
      this.update((s) => {
        const firstEver = !(s.drinks && s.drinks.length);
        s.drinks = s.drinks || [];
        s.drinks.push({ id: "dk" + Math.random().toString(36).slice(2) + stamp().toString(36), trainer: trainerId, type: type, label: label || undefined, ts: stamp() });
        this.chron(s, this.drinkEmoji(type), nm + " logged a " + type + (label ? " (" + label + ")" : "") + " " + this.drinkEmoji(type));
        if (firstEver) this.chron(s, "🍾", "First drink of the weekend — " + nm + " grabs First Sip!");
        if (this._milestone(s.drinks.length)) this.chron(s, "🎉", "🍺 " + s.drinks.length + " drinks logged this weekend!");
      });
    },

    // Distinct named drinks logged, with counts (for the "what we drank" list).
    drinkLabels() {
      const by = {};
      (this.state.drinks || []).forEach((d) => { if (d.label) { const k = d.type + "|" + d.label; (by[k] = by[k] || { type: d.type, label: d.label, n: 0 }).n++; } });
      return Object.keys(by).map((k) => by[k]).sort((a, b) => b.n - a.n);
    },

    // ---- Predictions / Oracle --------------------------------------------
    addPrediction(q, options, byName, byId) {
      q = (q || "").trim();
      const opts = (options || []).map((t) => ({ id: "o" + Math.random().toString(36).slice(2), text: (t || "").trim() })).filter((o) => o.text);
      if (!q || opts.length < 2) return false;
      const stamp = function () { try { return Date.now(); } catch (_) { return 0; } };
      this.update((s) => {
        s.predictions = s.predictions || [];
        s.predictions.unshift({ id: "pr" + Math.random().toString(36).slice(2), q: q, options: opts, votes: {}, closed: false, answer: "", by: byName || "", byId: byId || "", ts: stamp() });
        this.chron(s, "🔮", "New prediction: " + q);
      });
      return true;
    },
    votePrediction(predId, attId, optionId) {
      if (!attId) return;
      this.update((s) => {
        const p = (s.predictions || []).find((x) => x.id === predId);
        if (!p || p.closed) return;
        p.votes = p.votes || {}; p.votes[attId] = optionId;
      });
    },
    resolvePrediction(predId, optionId) {
      this.update((s) => {
        const p = (s.predictions || []).find((x) => x.id === predId);
        if (!p || p.closed) return;
        p.closed = true; p.answer = optionId;
        const opt = p.options.find((o) => o.id === optionId);
        const winners = Object.keys(p.votes || {}).filter((a) => p.votes[a] === optionId);
        winners.forEach((a) => { this.grantPoints(s, "oracle", this.teamOf(a), 2); });
        const names = winners.map((a) => { const at = this.attendee(a); return at ? at.name : a; });
        this.chron(s, "🔮", "Prediction resolved — “" + p.q + "” → " + (opt ? opt.text : "?") + (names.length ? " (" + names.join(", ") + " called it!)" : " (nobody got it)"));
      });
    },
    oracleScore(attId) {
      let n = 0;
      (this.state.predictions || []).forEach((p) => { if (p.closed && p.votes && p.votes[attId] === p.answer) n++; });
      return n;
    },

    // ---- Message Wall (for the groom) ------------------------------------
    groom() { return this.state.attendees.find((a) => /groom/i.test(a.role || "")) || this.state.attendees[0] || null; },
    isGroomActor() { const g = this.groom(); return !!(g && this.actorId() === g.id); },
    addMessage(text, byId) {
      text = (text || "").trim(); if (!text) return;
      const stamp = function () { try { return Date.now(); } catch (_) { return 0; } };
      this.update((s) => { s.messages = s.messages || []; s.messages.unshift({ id: "mg" + Math.random().toString(36).slice(2), ts: stamp(), by: byId || "", text: text }); });
    },
    unlockMessages() {
      if (this.state.messagesUnlocked) return;
      this.update((s) => { s.messagesUnlocked = true; this.chron(s, "🎬", "The closing ceremony unlocked the Message Wall for the groom!"); });
    },

    // ---- Card games -------------------------------------------------------
    logCardRound(game, ranking, note, byName) {
      ranking = (ranking || []).filter(Boolean);
      note = (note || "").trim();
      if (!game || (!ranking.length && !note)) return false;
      const nm = (id) => { const a = this.attendee(id); return a ? a.name : id; };
      const stamp = function () { try { return Date.now(); } catch (_) { return 0; } };
      this.update((s) => {
        s.cardGames = s.cardGames || [];
        s.cardGames.unshift({ id: "cg" + Math.random().toString(36).slice(2), game: game, ranking: ranking.slice(), note: note || undefined, by: byName || "", ts: stamp() });
        if (game === "president" && ranking.length >= 2) {
          this.chron(s, "🃏", "President round — 👑 " + nm(ranking[0]) + " President, 💩 " + nm(ranking[ranking.length - 1]) + " the Asshole!");
          this.grantPoints(s, "cards", this.teamOf(ranking[0]), 2);
        } else if (game === "euchre" && ranking.length) {
          this.chron(s, "♠️", "Euchre — " + ranking.map(nm).join(" & ") + " take it!");
          ranking.forEach((a) => this.grantPoints(s, "cards", this.teamOf(a), 2));
        } else if (ranking.length) {
          const who = nm(ranking[0]);
          const head = game === "ridebus" ? "🚌 " + who + " rode the bus" : (game === "kings" ? "🫗 " + who : who);
          this.chron(s, "🃏", head + (note ? " — " + note : ""));
        } else {
          this.chron(s, "🃏", note);
        }
      });
      return true;
    },
    // The player set from the most recent round of a game (for "same table" reuse).
    lastCardTable(game) {
      const r = (this.state.cardGames || []).find((x) => x.game === game && x.ranking && x.ranking.length);
      return r ? r.ranking.slice() : [];
    },
    presidencies(att) { let n = 0; (this.state.cardGames || []).forEach((r) => { if (r.game === "president" && r.ranking && r.ranking[0] === att) n++; }); return n; },
    assholeries(att) { let n = 0; (this.state.cardGames || []).forEach((r) => { if (r.game === "president" && r.ranking && r.ranking.length >= 2 && r.ranking[r.ranking.length - 1] === att) n++; }); return n; },
    euchreWins(att) { let n = 0; (this.state.cardGames || []).forEach((r) => { if (r.game === "euchre" && r.ranking && r.ranking.indexOf(att) >= 0) n++; }); return n; },

    // ---- Photo log --------------------------------------------------------
    addPhoto(entry) {
      if (!entry || !entry.id) return;
      this.update((s) => { s.photos = s.photos || []; s.photos.unshift(entry); if (s.photos.length > 150) s.photos.length = 150; });
    },
    // Upsert photos from a sync peer: add new ones, and replace an existing
    // one when the incoming has a newer rev (so reactions/comments propagate).
    mergePhotos(list) {
      if (!list || !list.length) return;
      this.update((s) => {
        s.photos = s.photos || [];
        const idx = {}; s.photos.forEach((p, i) => { idx[p.id] = i; });
        list.forEach((p) => {
          if (!p || !p.id) return;
          if (idx[p.id] === undefined) { s.photos.push(p); idx[p.id] = s.photos.length - 1; }
          else if ((p.rev || 0) >= (s.photos[idx[p.id]].rev || 0)) s.photos[idx[p.id]] = p;
        });
        s.photos.sort((a, b) => b.ts - a.ts);
        if (s.photos.length > 250) s.photos.length = 250;
      });
    },
    _photo(id) { return (this.state.photos || []).find((p) => p.id === id) || null; },
    // Toggle a reaction on a photo for one reactor (one per emoji per person).
    reactPhoto(photoId, emoji, byId, byName) {
      this.update((s) => {
        const p = (s.photos || []).find((x) => x.id === photoId); if (!p) return;
        p.reactions = p.reactions || [];
        const i = p.reactions.findIndex((r) => r.by === byId && r.emoji === emoji);
        if (i >= 0) p.reactions.splice(i, 1);
        else p.reactions.push({ by: byId, name: byName || "", emoji: emoji });
        p.rev = (p.rev || 0) + 1;
      });
      const p = this._photo(photoId);
      if (p && window.Sync && Sync.sharePhoto) Sync.sharePhoto(p);
    },
    commentPhoto(photoId, text, byId, byName) {
      text = (text || "").trim(); if (!text) return;
      const stamp = function () { try { return Date.now(); } catch (_) { return 0; } };
      this.update((s) => {
        const p = (s.photos || []).find((x) => x.id === photoId); if (!p) return;
        p.comments = p.comments || [];
        p.comments.push({ by: byId, name: byName || "", text: text, ts: stamp() });
        p.rev = (p.rev || 0) + 1;
      });
      const p = this._photo(photoId);
      if (p && window.Sync && Sync.sharePhoto) Sync.sharePhoto(p);
    },

    // ---- Partner Pokémon ---------------------------------------------------
    // Every trainer's partner (their favorite) starts owned + leading their
    // Safari team. Idempotent — run at boot and after remote applies so the
    // data self-heals on every device.
    fixupPartners(s) {
      let changed = false;
      s.pokedex = s.pokedex || { active: "", trainers: {}, log: [], given: 0, taken: 0 };
      s.pokedex.trainers = s.pokedex.trainers || {};
      (s.attendees || []).forEach((a) => {
        if (!a.favoriteId) return;
        const t = s.pokedex.trainers[a.id] = s.pokedex.trainers[a.id] || { caught: {}, team: [], catches: 0 };
        t.caught = t.caught || {}; t.team = t.team || [];
        if (!t.caught[a.favoriteId]) { t.caught[a.favoriteId] = { count: 1, ball: "partner" }; changed = true; }
        if (t.team.indexOf(a.favoriteId) < 0 && t.team.length < 6) { t.team.unshift(a.favoriteId); changed = true; }
        // 🎨 A trainer's TYPE follows their favorite (its primary type) —
        // nobody ever chose the "normal" default on purpose, so a card
        // showing NORMAL TYPE under a Blastoise heals to WATER. A type picked
        // by hand in the editor sets typeLock and is never overridden.
        if ((!a.type || a.type === "normal") && !a.typeLock) {
          const d = (window.DEX || {})[a.favoriteId];
          const ty = d && d.t && d.t[0];
          if (ty && ty !== "normal") { a.type = ty; changed = true; }
        }
      });
      return changed;
    },
    // Dex completion for the 251 race — the freebie partner doesn't count.
    dexCount(attId) {
      const a = this.attendee(attId);
      const t = (this.state.pokedex && this.state.pokedex.trainers || {})[attId];
      if (!t) return 0;
      let n = Object.keys(t.caught || {}).length;
      if (a && a.favoriteId && t.caught && t.caught[a.favoriteId]) n--;
      return Math.max(0, n);
    },
    // Gen 5-9 stay hidden in the wild until SOMEONE completes the Gen 1-4 NORMAL
    // dex (all 493 base forms) — then they unlock for the WHOLE ROOM. GEN14_MAX
    // is that gate. The unlock is a synced, sticky flag on the pokedex.
    GEN14_MAX: 493,
    // 🌍 Room-wide switch. (attId is accepted for call-site compat but ignored —
    // once one person unlocks it, it's unlocked for everyone.)
    gen59Unlocked() { return !!(this.state.pokedex && this.state.pokedex.gen59Unlocked); },
    // Has THIS trainer personally caught all 493 base forms? (Drives the
    // progress teaser and the unlock trigger.)
    gen14DexComplete(attId) {
      const t = (this.state.pokedex && this.state.pokedex.trainers || {})[attId];
      if (!t) return false;
      const ownsNormal = (id) => (t.have && t.have[id]) || (t.caught && t.caught[id] && !t.caught[id].shiny);
      for (let id = 1; id <= this.GEN14_MAX; id++) if (!ownsNormal(id)) return false;
      return true;
    },
    // Call after a catch — if this trainer just finished the Gen 1-4 dex and the
    // room hasn't unlocked yet, flip the global switch and credit them. Returns
    // true only on the fresh unlock (so the caller can celebrate).
    checkGen59Unlock(attId) {
      if (this.gen59Unlocked()) return false;
      if (!this.gen14DexComplete(attId)) return false;
      const name = (this.attendee(attId) || {}).name || "a trainer";
      this.update((s) => {
        s.pokedex.gen59Unlocked = true;
        s.pokedex.gen59By = name;
        s.pokedex.gen59At = (function () { try { return Date.now(); } catch (_) { return 0; } })();
        this.chron(s, "🎉", name + " completed the entire Gen 1-4 Pokédex — GEN 5-9 UNLOCKED for everyone!");
      });
      return true;
    },
    // 🧭 THE GEN LADDER — region-by-region progression. Every trainer starts
    // with Gen 1 in the wild; BATTLING opens the world (no dex completion
    // required). Earn all 8 Johto badges → Gen 2. Then each Champion beaten in
    // journey order spills the next generation into the Safari and opens the
    // next region's gyms: LANCE→Gen 3/Hoenn, STEVEN→Gen 4/Sinnoh,
    // CYNTHIA→Gen 5/Unova, ALDER→Gen 6/Kalos (+Mega Evolution),
    // DIANTHA→Gen 7/Alola, KUKUI→Gen 8/Galar, LEON→Gen 9/Paldea.
    // GEETA stays the summit. Per-trainer, driven by their own recorded wins —
    // weekend veterans keep every unlock their battles already earned.
    GEN_SPANS: [[1, 151], [152, 251], [252, 386], [387, 493], [494, 649], [650, 721], [722, 809], [810, 905], [906, 1025]],
    genOf(id) {
      for (let g = 0; g < this.GEN_SPANS.length; g++) if (id <= this.GEN_SPANS[g][1]) return g + 1;
      return 9;
    },
    GEN_LADDER: [
      { gen: 2, champ: "blue", champName: "BLUE", opens: "Johto" },
      { gen: 3, champ: "lance", champName: "LANCE", opens: "Hoenn" },
      { gen: 4, champ: "steven", champName: "STEVEN", opens: "Sinnoh" },
      { gen: 5, champ: "cynthia", champName: "CYNTHIA", opens: "Unova" },
      { gen: 6, champ: "alder", champName: "ALDER", opens: "Kalos" },
      { gen: 7, champ: "diantha", champName: "DIANTHA", opens: "Alola" },
      { gen: 8, champ: "kukui", champName: "PROF. KUKUI", opens: "Galar" },
      { gen: 9, champ: "leon", champName: "LEON", opens: "Paldea" },
    ],
    // The highest generation this trainer has unlocked (1..9).
    genCapFor(attId) {
      if (!attId) return 1;
      const w = this.leagueWins(attId);
      let cap = 1;
      for (let i = 0; i < this.GEN_LADDER.length; i++) {
        const step = this.GEN_LADDER[i];
        let met = w.indexOf(step.champ) >= 0;
        // Grandfather: Kanto's BLUE ladder arrived AFTER the original weekend —
        // a recorded LANCE win proves the old combined region was conquered,
        // so it satisfies the Gen-2 rung for those veterans.
        if (!met && step.champ === "blue") met = w.indexOf("lance") >= 0;
        if (met) cap = step.gen; else break;   // the ladder climbs IN ORDER
      }
      return cap;
    },
    // Highest catchable dex id for this trainer.
    genMaxIdFor(attId) { return this.GEN_SPANS[this.genCapFor(attId) - 1][1]; },
    // What unlocks the NEXT generation — for banners. Null when maxed.
    nextGenGoal(attId) {
      const cap = this.genCapFor(attId);
      if (cap >= 9) return null;
      const step = this.GEN_LADDER[cap - 1];
      return { gen: step.gen,
        text: step.badges ? (step.goal + " in " + step.where)
          : ("beat Champion " + step.champName + " in The Journey" + (step.opens ? " — " + step.opens + " opens too" : "")) };
    },
    // How many species this trainer's dex is measured against (their gen cap).
    // Mega/Primal forms (ids 10000+) are battle-only and never counted. With no
    // trainer given, measure against the room's furthest climber.
    dexTarget(attId) {
      let maxId;
      if (attId) maxId = this.genMaxIdFor(attId);
      else maxId = (this.state.attendees || []).reduce((m, a) => Math.max(m, this.genMaxIdFor(a.id)), this.GEN_SPANS[0][1]);
      const n = Object.keys(window.DEX || {}).filter((id) => +id <= maxId).length;
      return n || this.GEN14_MAX;
    },

    // Caught species of a given type (partner freebie excluded, same fairness
    // rule as dexCount). Types come from DEX[id].t.
    typeCaught(attId, type) {
      const a = this.attendee(attId);
      const t = (this.state.pokedex && this.state.pokedex.trainers || {})[attId];
      if (!t || !t.caught || !window.DEX) return 0;
      let n = 0;
      for (const id in t.caught) {
        if (a && a.favoriteId === +id) continue;
        const d = window.DEX[id];
        if (d && d.t && d.t.indexOf(type) >= 0) n++;
      }
      return n;
    },
    // One "Gym Leader" per type — whoever caught the most of it (ties keep the
    // earlier leader via _topAttendee's strict > comparison).
    typeLeaders() {
      const TYPES = ["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
        "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"];
      return TYPES.map((ty) => {
        const top = this._topAttendee((id) => this.typeCaught(id, ty));
        return { type: ty, holder: top ? top.a.name : "", holderId: top ? top.a.id : "", n: top ? top.n : 0 };
      });
    },

    // ---- Trading Post -------------------------------------------------------
    // Classic link-cable trades evolve on arrival.
    TRADE_EVOS: { 64: 65, 67: 68, 75: 76, 93: 94 },   // Kadabra, Machoke, Graveler, Haunter
    // Can this trainer give this mon away? Partners are untradeable — unless
    // they also caught a wild one (the extra copy can go, the partner stays).
    canTrade(attId, monId) {
      const a = this.attendee(attId);
      const t = (this.state.pokedex && this.state.pokedex.trainers || {})[attId];
      const rec = t && t.caught && t.caught[monId];
      if (!rec) return false;
      if (a && a.favoriteId === +monId && (rec.count || 1) <= 1) return false;
      return true;
    },
    // 1-for-1 swap: A's aMon ⇄ B's bMon. Balls travel with their mons; a mon
    // fully given away leaves the giver's team; trade evolutions fire for the
    // receiver. Returns { toA, toB, evoA, evoB } or null if invalid.
    trade(aId, aMon, bId, bMon, by, opts) {
      aMon = +aMon; bMon = +bMon;
      if (!aId || !bId || aId === bId) return null;
      if (!this.canTrade(aId, aMon) || !this.canTrade(bId, bMon)) return null;
      // Which VARIANT each side is giving up. When a trainer owns both a normal
      // and a shiny of the same species, the picker says which one travels;
      // otherwise fall back to whatever the caught record shows.
      const aWantShiny = opts && opts.aShiny !== undefined ? !!opts.aShiny : undefined;
      const bWantShiny = opts && opts.bShiny !== undefined ? !!opts.bShiny : undefined;
      const EV = this.TRADE_EVOS;
      let result = null;
      this.update((s) => {
        const tr = s.pokedex.trainers;
        const A = tr[aId], B = tr[bId];
        if (!A || !B) return;
        const give = (T, monId, wantShiny) => {
          const r = T.caught[monId];
          const shinyGone = wantShiny === undefined ? !!r.shiny : !!wantShiny;
          const keep = { ball: r.ball || "poke", shiny: shinyGone };   // ✨ travels too
          if ((r.count || 1) > 1) {
            r.count--;
            // If exactly one copy remains and this trainer owned both variants,
            // the survivor is the OPPOSITE of the one that just left — reflect
            // that on the record so the kept mon shows the right form.
            const mixed = !!(T.have && T.have[monId]) && !!(T.haveShiny && T.haveShiny[monId]);
            if (mixed && (r.count || 1) === 1) r.shiny = !shinyGone;
          } else { delete T.caught[monId]; T.team = (T.team || []).filter((x) => +x !== monId); }
          return keep;
        };
        const recv = (T, monId, keep) => {
          const id = EV[monId] || monId;
          T.seen = T.seen || {}; T.seen[monId] = 1; T.seen[id] = 1;
          // Mark the received variant owned, so Safari's encounter table knows.
          if (keep.shiny) { T.haveShiny = T.haveShiny || {}; T.haveShiny[id] = 1; }
          else { T.have = T.have || {}; T.have[id] = 1; }
          const r = T.caught[id];
          if (r) { r.count = (r.count || 1) + 1; if (keep.shiny) r.shiny = true; }
          else T.caught[id] = { count: 1, ball: keep.ball, shiny: keep.shiny || undefined };
          return id;
        };
        const aKeep = give(A, aMon, aWantShiny), bKeep = give(B, bMon, bWantShiny);
        const toB = recv(B, aMon, aKeep);      // B receives what A gave
        const toA = recv(A, bMon, bKeep);      // A receives what B gave
        s.pokedex.trades = s.pokedex.trades || [];
        s.pokedex.trades.unshift({ a: aId, b: bId, gave: aMon, got: bMon,
          ts: (function () { try { return Date.now(); } catch (_) { return 0; } })() });
        if (s.pokedex.trades.length > 60) s.pokedex.trades.length = 60;
        result = { toA: toA, toB: toB, evoA: toA !== bMon, evoB: toB !== aMon };
        const nm = (id) => (window.DEX && DEX[id] && DEX[id].n) || ("#" + id);
        const an = (this.attendee(aId) || {}).name || aId, bn = (this.attendee(bId) || {}).name || bId;
        this.chron(s, "🔁", an + " traded " + nm(aMon) + " to " + bn + " for " + nm(bMon) + "!", by);
        if (result.evoB) this.chron(s, "⚡", "Whoa — the traded " + nm(aMon) + " evolved into " + nm(toB) + " for " + bn + "!", by);
        if (result.evoA) this.chron(s, "⚡", "Whoa — the traded " + nm(bMon) + " evolved into " + nm(toA) + " for " + an + "!", by);
      });
      return result;
    },

    // ---- 📬 trade offer inbox ------------------------------------------------
    // Offers persist in the shared state, so the other trainer accepts (or
    // declines) later from THEIR phone — nobody has to be in the room when
    // it's sent. status: open → accepted / declined / cancelled / expired.
    tradeOffers() { return ((this.state.pokedex || {}).offers || []).filter((o) => o.status === "open"); },
    sendTradeOffer(fromAtt, give, toAtt, want, by, giveShiny, wantShiny) {
      if (!this.canTrade(fromAtt, give)) return null;
      // an identical offer already waiting? don't stack duplicates
      const dupe = this.tradeOffers().find((o) => o.from === fromAtt && o.to === toAtt && o.give === +give && o.want === +want && !!o.giveShiny === !!giveShiny && !!o.wantShiny === !!wantShiny);
      if (dupe) return dupe;
      let offer = null;
      this.update((s) => {
        s.pokedex.offers = s.pokedex.offers || [];
        offer = { id: U.uid(), from: fromAtt, give: +give, to: toAtt, want: +want,
          giveShiny: !!giveShiny, wantShiny: !!wantShiny,
          ts: (function () { try { return Date.now(); } catch (_) { return 0; } })(), status: "open" };
        s.pokedex.offers.unshift(offer);
        if (s.pokedex.offers.length > 40) s.pokedex.offers.length = 40;
        const nm = (id) => (window.DEX && DEX[id] && DEX[id].n) || ("#" + id);
        this.chron(s, "📬", ((this.attendee(fromAtt) || {}).name || "?") + " offered their " + nm(give) + " to " +
          ((this.attendee(toAtt) || {}).name || "?") + " for their " + nm(want) + " — it's waiting in the Trading Post inbox.", by);
      });
      return offer;
    },
    resolveTradeOffer(id, accept, by) {
      const o = ((this.state.pokedex || {}).offers || []).find((x) => x.id === id);
      if (!o || o.status !== "open") return { ok: false, why: "That offer is gone." };
      if (!accept) {
        this.update((s) => { const x = (s.pokedex.offers || []).find((q) => q.id === id); if (x) x.status = "declined"; });
        return { ok: true, declined: true };
      }
      const result = this.trade(o.from, o.give, o.to, o.want, by, { aShiny: o.giveShiny, bShiny: o.wantShiny });
      this.update((s) => { const x = (s.pokedex.offers || []).find((q) => q.id === id); if (x) x.status = result ? "accepted" : "expired"; });
      if (!result) return { ok: false, why: "That trade is no longer valid — one of the Pokémon has moved on." };
      return { ok: true, result: result, offer: o };
    },
    cancelTradeOffer(id) {
      this.update((s) => { const x = (s.pokedex.offers || []).find((q) => q.id === id); if (x && x.status === "open") x.status = "cancelled"; });
    },

    // ---- battle & collecting analytics --------------------------------------
    // Duel win/loss from the battle log (name-matched; doubles count for
    // both partners on a side).
    duelRecord(attId) {
      const a = this.attendee(attId); if (!a) return { w: 0, l: 0 };
      const hit = (label) => (label || "").split(" & ").indexOf(a.name) >= 0;
      let w = 0, l = 0;
      ((this.state.battles && this.state.battles.log) || []).forEach((b) => {
        if (!b.duel) return;
        if (hit(b.winner)) w++; else if (hit(b.loser)) l++;
      });
      return { w: w, l: l };
    },
    koLife(attId) {
      const t = (this.state.pokedex.trainers || {})[attId];
      return (t && t.koLife) || 0;
    },
    shinyCount(attId) {
      const t = (this.state.pokedex.trainers || {})[attId];
      if (!t || !t.caught) return 0;
      let n = 0; for (const k in t.caught) if (t.caught[k].shiny) n++;
      return n;
    },
    tradeCount(attId) {
      return ((this.state.pokedex && this.state.pokedex.trades) || [])
        .filter((t) => t.a === attId || t.b === attId).length;
    },
    evoCount(attId) {
      const t = (this.state.pokedex.trainers || {})[attId];
      return (t && t.evolutions) || 0;
    },
    beltReigns(attId) {
      return ((this.state.battles && this.state.battles.beltLog) || [])
        .filter((x) => x.attId === attId).length;
    },
    eloOf(attId) {
      return ((this.state.battles && this.state.battles.elo) || {})[attId] || 1000;
    },
    // Gym Circuit: 16 leaders, EVERYONE can earn every badge.
    gymHolders(idx) {
      return ((this.state.gymCircuit || {})[idx] || []).slice();
    },
    gymBadgeCount(attId) {
      const c = this.state.gymCircuit || {};
      let n = 0; for (const k in c) if ((c[k] || []).indexOf(attId) >= 0) n++;
      return n;
    },
    // Badges earned within a contiguous gym range (region-aware). Johto = 0-7,
    // Kanto = 8-15, Hoenn = 16-23, Sinnoh = 24-31. "16 badges" always means the
    // original Johto+Kanto set, no matter how many regions exist.
    gymBadgesInRange(attId, start, count) {
      const c = this.state.gymCircuit || {};
      let n = 0; for (let i = start; i < start + count; i++) if ((c[i] || []).indexOf(attId) >= 0) n++;
      return n;
    },
    // Pokémon League progress: stage keys this trainer has beaten
    // (will/koga/bruno/karen/lance/red).
    leagueWins(attId) {
      return ((this.state.league || {})[attId] || []).slice();
    },
    // 🎬 Movie Legends beaten (mewtwo / collector) — special film boss battles.
    movieWins(attId) {
      return ((this.state.movies || {})[attId] || []).slice();
    },
    // ❗ canon-villain encounters won (Giovanni, Silver…) — names, append-only.
    encounterWins(attId) {
      return ((this.state.encounters || {})[attId] || []).slice();
    },
    // 🏆 Champions Tournament titles won by this trainer.
    tourneyWins(attId) {
      return ((this.state.tourneyWins || {})[attId] || 0);
    },
    // 🌌 Legendary & Mythical Challenge cleared per generation — keys like
    // "gen1", "gen2"…"gen9" (append-only, sync-unioned).
    legendWins(attId) {
      return ((this.state.legends || {})[attId] || []).slice();
    },
    // 🌀 Secret battles won (hidden endgame duels) — keys like "unown".
    secretWins(attId) { return ((this.state.secrets || {})[attId] || []).slice(); },
    // ✨ Mega-Dex — mega/primal forms this trainer has Mega-Evolved in battle
    // (append-only, sync-unioned). Unlocked by USE, not by catching.
    megaDexCaught(attId) { return ((this.state.megadex || {})[attId] || []).slice(); },
    megaDexTotal() { return Object.keys(window.MEGA_FORMS || {}).length || 0; },
    recordMega(attId, megaId) {
      if (!attId || !megaId) return;
      this.update((s) => {
        s.megadex = s.megadex || {}; const a = s.megadex[attId] = s.megadex[attId] || [];
        if (a.indexOf(megaId) < 0) {
          a.push(megaId);
          const nm = (window.MEGA_FORMS && MEGA_FORMS[megaId] && MEGA_FORMS[megaId].n) || ("Mega #" + megaId);
          Store.chron(s, "✨", ((Store.attendee(attId) || {}).name || attId) + " Mega-Evolved into " + nm + " in battle! (" + a.length + " logged)");
        }
      });
    },
    // 🔡 Unown Dex — the living alphabet. All 28 glyphs; decoded ones are
    // stored per trainer (append-only, sync-unioned).
    UNOWN_GLYPHS: "ABCDEFGHIJKLMNOPQRSTUVWXYZ!?".split(""),
    unownCaught(attId) { return ((this.state.unown || {})[attId] || []).slice(); },
    // The Unown only answer once you've broken ENTEI's spell (3rd movie battle).
    unownSealBroken(attId) { return this.movieWins(attId).indexOf("entei") >= 0; },
    // Record one decoded glyph (append-only).
    decodeUnown(attId, glyph) {
      if (!attId || this.UNOWN_GLYPHS.indexOf(glyph) < 0) return;
      this.update((s) => {
        s.unown = s.unown || {}; const a = s.unown[attId] = s.unown[attId] || [];
        if (a.indexOf(glyph) < 0) {
          a.push(glyph);
          Store.chron(s, "🔡", ((Store.attendee(attId) || {}).name || attId) + " decoded the Unown “" + glyph + "” — " + a.length + "/28.");
        }
      });
    },
    // "Search the ruins" — reveal one still-hidden glyph. Returns it, or "".
    searchUnown(attId) {
      const have = this.unownCaught(attId);
      const hidden = this.UNOWN_GLYPHS.filter((g) => have.indexOf(g) < 0);
      if (!hidden.length) return "";
      const g = hidden[Math.floor((Math.random ? Math.random() : 0) * hidden.length)] || hidden[0];
      this.decodeUnown(attId, g);
      return g;
    },
    // First ENTEI win breaks the seal and reveals a starter batch (A–E).
    breakUnownSeal(attId) {
      if (!attId) return;
      this.update((s) => {
        s.unown = s.unown || {}; const a = s.unown[attId] = s.unown[attId] || [];
        ["A", "B", "C", "D", "E"].forEach((g) => { if (a.indexOf(g) < 0) a.push(g); });
      });
    },
    // 🪦 Nuzlocke — the hardcore Kanto run: pick ONE starter, catch wilds by
    // battling them down, take the 8 Kanto gyms IN ORDER, then the Kanto
    // Elite Four and BLUE. Any of YOUR Pokémon that faints is dead for the
    // rest of the run; lose the whole box and the run is over. One live run
    // per trainer (s.nuzlocke, newest-edit-wins on sync); finished runs are
    // enshrined in s.nuzlockeHof (append-only) — fewest catches wears the crown.
    // ═══ 💾 SIX SAVE SLOTS — one live run of EACH structure at once ═══
    // Runs live in s.nuzRuns[attId][slot]; s.nuzlocke[attId] stays as an
    // ALIAS of the trainer's ACTIVE run (the one touched last) so legacy
    // clients, old data and slot-less calls keep working unchanged.
    NUZ_SLOTS: ["region", "random", "master", "ages", "trek", "blitz", "movie"],
    nuzSlotOf(region, mode) {
      if (region === "master" || region === "ages" || region === "trek" || region === "movie" || region === "blitz") return region;
      if (region) return mode === "random" ? "random" : "region";
      return "legacy";
    },
    // The slot map, with two jobs on every access: adopt the alias into its
    // slot (migrates pre-slot saves), and RE-LINK the alias to the slot's
    // object (JSON reloads split the two into separate copies).
    _nuzMap(s, attId) {
      s.nuzRuns = s.nuzRuns || {};
      const m = s.nuzRuns[attId] = s.nuzRuns[attId] || {};
      const old = (s.nuzlocke || {})[attId];
      if (old) {
        const k = this.nuzSlotOf(old.region, old.mode);
        if (!m[k] || m[k] === old || (old.upd || 0) > (m[k].upd || 0)) m[k] = old;
        s.nuzlocke[attId] = m[k];
      }
      return m;
    },
    nuzRun(attId, slot) {
      if (!attId) return null;
      const m = this._nuzMap(this.state, attId);
      if (slot) return m[slot] || null;
      const alias = (this.state.nuzlocke || {})[attId];
      if (alias) return alias;
      let best = null;
      Object.keys(m).forEach((k) => {
        const r = m[k]; if (!r) return;
        if (!best || ((!r.over) !== (!best.over) ? !r.over : (r.upd || 0) > (best.upd || 0))) best = r;
      });
      return best;
    },
    // Ids still standing in this run's box.
    nuzAlive(attId, slot) {
      const r = this.nuzRun(attId, slot);
      return r ? r.box.filter((m) => !m.dead).map((m) => m.id) : [];
    },
    _nuzName(attId) { return ((this.attendee(attId) || {}).name || attId); },
    _nuzEdit(attId, fn, slot) {
      if (!attId) return;
      this.update((s) => {
        const m = this._nuzMap(s, attId);
        const r = slot ? m[slot] : (s.nuzlocke || {})[attId];
        if (!r) return;
        fn(r, s);
        r.upd = Date.now();
        s.nuzlocke = s.nuzlocke || {};
        s.nuzlocke[attId] = r;                 // touching a run makes it ACTIVE
      });
    },
    // mode: "" = classic (canon leaders), "random" = 🎲 Randomizer — same
    // leaders, caps and team sizes, but seeded-random species every run.
    // region: a NUZ_REGIONS key = that region's exclusive run, "master" =
    // the all-nine-regions gauntlet, "ages" = 🕰 Through the Ages (all nine
    // regions with a FRESH team each generation — the box retires at every
    // border), "" = the legacy Kanto→Johto structure.
    nuzStart(attId, starterId, mode, region) {
      if (!attId || !starterId) return;
      this.update((s) => {
        const m = Store._nuzMap(s, attId);       // adopt any pre-slot save first
        const run = { starter: starterId, box: [{ id: starterId }], badges: [], league: [],
          catches: 1, deaths: 0, over: "", startTs: Date.now(), upd: Date.now(),
          mode: mode === "random" ? "random" : "", region: region || "",
          seed: (Math.floor(Math.random() * 2147483647) || 1) };
        if (region === "ages") {
          const first = (window.NUZ_REGIONS || [])[0];
          run.curRegion = first ? first.key : "kanto";
          run.retired = [];
        }
        m[Store.nuzSlotOf(run.region, run.mode)] = run;
        s.nuzlocke = s.nuzlocke || {};
        s.nuzlocke[attId] = run;
        const R = (window.NUZ_REGIONS || []).find((x) => x.key === region);
        const label = region === "master" ? "🌍 MASTER RANDOMIZER "
          : region === "ages" ? "🕰 THROUGH-THE-AGES "
          : region === "trek" ? "🎒 LONG-WALK "
          : region === "blitz" ? "⚡ BLITZ-GAUNTLET "
          : (R ? R.name.toUpperCase() + " " : "") + (mode === "random" ? "🎲 RANDOMIZER " : "");
        Store.chron(s, "🪦", this._nuzName(attId) + " began a " + label + "NUZLOCKE run with " + (((window.DEX || {})[starterId] || {}).n || "#" + starterId) + " — every faint is forever!");
      });
    },
    // 🎬 The Movie Marathon: no starter, no roads — a CASTING CALL. The run
    // opens with a drafted cast of six (full power, no level caps) and the
    // filmography is the whole campaign. region:"movie".
    nuzStartMovie(attId, ids) {
      if (!attId || !ids || ids.length < 1) return;
      this.update((s) => {
        const m = Store._nuzMap(s, attId);
        const run = { starter: ids[0], box: ids.map((id) => ({ id: id })), badges: [], league: [],
          catches: ids.length, deaths: 0, over: "", startTs: Date.now(), upd: Date.now(),
          mode: "", region: "movie", seed: (Math.floor(Math.random() * 2147483647) || 1) };
        m.movie = run;
        s.nuzlocke = s.nuzlocke || {};
        s.nuzlocke[attId] = run;
        const names = ids.map((id) => (((window.DEX || {})[id] || {}).n || "#" + id)).join(", ");
        Store.chron(s, "🎬", this._nuzName(attId) + " held a casting call and premiered a MOVIE MARATHON NUZLOCKE — " + ((window.MOVIE_BOSSES || []).length || 16) + " films, one cast (" + names + "), every faint forever!");
      });
    },
    // 🌟 The co-star rule: a beaten film's legend may join the cast — but ONLY
    // into a seat opened by a death. The cast never grows past six standing.
    nuzRecruit(attId, monId, filmName) {
      this._nuzEdit(attId, (r, s) => {
        if (r.over || r.region !== "movie" || !monId) return;
        if (r.box.some((m) => m.id === monId)) return;
        if (r.box.filter((m) => !m.dead).length >= 6) return;
        r.box.push({ id: monId });
        r.catches += 1;
        const n = ((window.DEX || {})[monId] || {}).n || ("#" + monId);
        Store.chron(s, "🌟", "THE CO-STAR RULE — " + n + " stepped off the screen" + (filmName ? " of " + filmName : "") + " and joined " + this._nuzName(attId) + "'s cast!");
      }, "movie");
    },
    // ⬇ Reverse-evolution map for the Long Walk's border resets (lazy).
    _nuzPre() {
      if (this.__nuzPre) return this.__nuzPre;
      const pre = {};
      Object.keys(window.EVO_LEVELS || {}).forEach((from) => {
        (window.EVO_LEVELS[from] || []).forEach((e) => { pre[e.to] = { from: +from, lvl: e.lvl }; });
      });
      return (this.__nuzPre = pre);
    },
    // 🕰 Through the Ages: crossing a generation border. The whole box —
    // survivors and tombstones alike — is left with the professor (archived
    // in r.retired for the ending), and a brand-new regional starter becomes
    // the entire box. Catches/deaths keep counting across the whole saga.
    nuzNewRegion(attId, starterId, regionKey) {
      this._nuzEdit(attId, (r, s) => {
        if (r.over || r.region !== "ages" || !starterId || r.curRegion === regionKey) return;
        const REG = window.NUZ_REGIONS || [];
        const R = REG.find((x) => x.key === regionKey);
        const prev = REG.find((x) => x.key === r.curRegion);
        r.retired = r.retired || [];
        r.retired.push({ region: prev ? prev.name : (r.curRegion || ""), box: r.box });
        r.box = [{ id: starterId }];
        r.catches += 1;
        r.curRegion = regionKey;
        const n = ((window.DEX || {})[starterId] || {}).n || ("#" + starterId);
        Store.chron(s, "🕰", this._nuzName(attId) + " left their team with Professor " + (prev ? prev.prof : "Oak") + " and sailed for " + (R ? R.name : regionKey) + " — a new generation begins with " + n + "!");
      }, "ages");
    },
    // Give up the current run (a fresh nuzStart replaces it). Tombstoned, not
    // deleted, so a lagging phone's copy can't resurrect it on merge.
    nuzAbandon(attId, slot) { this._nuzEdit(attId, (r) => { if (!r.over) r.over = "abandoned"; }, slot); },
    // A wild catch joins the box (one of each species per run — dupes ignored).
    nuzCatch(attId, monId, shiny, slot) {
      this._nuzEdit(attId, (r, s) => {
        if (r.over || r.box.some((m) => m.id === monId)) return;
        const rec = { id: monId };
        if (shiny) rec.shiny = 1;
        r.box.push(rec);
        r.catches += 1;
        const n = ((window.DEX || {})[monId] || {}).n || ("#" + monId);
        Store.chron(s, shiny ? "✨" : "🪦", this._nuzName(attId) + " caught " + (shiny ? "a ✨ SHINY " + n + " for the Nuzlocke box — 1-in-16, under permadeath!" : n + " for the Nuzlocke box (" + r.catches + " caught)."));
      }, slot);
    },
    // Permadeath: every own mon that fainted in a nuzlocke battle dies for the
    // run. If the whole box is gone, the run is OVER.
    nuzDeaths(attId, ids, slot) {
      if (!ids || !ids.length) return;
      this._nuzEdit(attId, (r, s) => {
        if (r.over) return;
        const fallen = [];
        ids.forEach((id) => {
          const m = r.box.find((x) => x.id === id && !x.dead);
          if (m) { m.dead = 1; r.deaths += 1; fallen.push(((window.DEX || {})[id] || {}).n || "#" + id); }
        });
        if (!fallen.length) return;
        Store.chron(s, "🪦", "RIP — " + this._nuzName(attId) + "'s " + fallen.join(", ") + " fainted in the Nuzlocke. Gone for the run.");
        if (!r.box.some((m) => !m.dead)) {
          r.over = "wiped";
          Store.chron(s, "💀", this._nuzName(attId) + "'s Nuzlocke run is OVER — the whole box is gone. " + r.badges.length + " badge" + (r.badges.length === 1 ? "" : "s") + ", " + r.catches + " caught, " + r.deaths + " lost.");
        }
      }, slot);
    },
    // 🎉 Level-gated evolution: the run's level cap crossed this mon's real
    // evolution level and the trainer said yes — the box entry BECOMES the
    // evolved form (death flag and all history ride along).
    nuzEvolve(attId, fromId, toId, slot) {
      this._nuzEdit(attId, (r, s) => {
        const m = r.box.find((x) => x.id === fromId && !x.dead);
        if (!m || r.over) return;
        m.id = toId; delete m.noEvo;
        const n = (id) => ((window.DEX || {})[id] || {}).n || ("#" + id);
        Store.chron(s, "🎉", this._nuzName(attId) + "'s " + n(fromId) + " evolved into " + n(toId) + " mid-Nuzlocke!");
      }, slot);
    },
    // "Not now" (an Everstone moment) — stop the prompt from nagging; the box
    // card keeps a manual ⬆ Evolve button while it stays eligible.
    nuzNoEvo(attId, monId, slot) {
      this._nuzEdit(attId, (r) => {
        const m = r.box.find((x) => x.id === monId && !x.dead);
        if (m) m.noEvo = 1;
      }, slot);
    },
    // 👣 A wild encounter was rolled: the species goes on the run's SEEN list
    // (no-dupes clause — once met, never again) and burns one of the era's
    // limited encounter slots. `eraKey` names the current stretch of road
    // (act:badges:league) — a new badge/stage resets the counter.
    nuzEncounter(attId, wildId, eraKey, slot) {
      this._nuzEdit(attId, (r) => {
        if (r.over) return;
        r.seen = r.seen || [];
        if (wildId && r.seen.indexOf(wildId) < 0) r.seen.push(wildId);
        if (r.encKey !== eraKey) { r.encKey = eraKey; r.encN = 0; }
        r.encN = (r.encN || 0) + 1;
      }, slot);
    },
    nuzBadge(attId, idx, slot) {
      this._nuzEdit(attId, (r, s) => {
        if (r.over || r.badges.indexOf(idx) >= 0) return;
        r.badges.push(idx);
        const REG = window.NUZ_REGIONS || [];
        let n = r.badges.length, total = 8, where = "";
        if (r.region === "master") { total = 68; }
        else if (r.region === "blitz") { total = 12; }
        else if (r.region === "ages" || r.region === "trek") {
          // Region-reset walks — count within THIS region.
          const R = REG.find((x) => idx >= x.gym0 && idx < x.gym0 + x.gymN);
          if (R) { n = r.badges.filter((i) => i >= R.gym0 && i < R.gym0 + R.gymN).length; total = R.gymN; where = " (" + R.name + ")"; }
        } else {
          const R = REG.find((x) => x.key === r.region);
          if (R) total = R.gymN;
        }
        Store.chron(s, "🪦", this._nuzName(attId) + " took Nuzlocke badge " + n + "/" + total + where + " — no losses allowed!");
      }, slot);
    },
    // An Elite Four / Champion stage falls. Champions crown the run (enshrined
    // in the Nuzlocke hall AND the real Hall of Fame). Legacy runs open THE
    // JOHTO ACT after BLUE; a Johto region run offers RED past the crown for
    // the Legend tier; the MASTER gauntlet only crowns at the very last
    // Champion (GEETA) — everything before is a milestone on the road.
    nuzStage(attId, key, slot) {
      this._nuzEdit(attId, (r, s) => {
        if (r.over || r.league.indexOf(key) >= 0) return;
        r.league.push(key);
        const alive = r.box.filter((m) => !m.dead).map((m) => m.id);
        const nm = this._nuzName(attId);
        const tally = r.catches + " caught, " + r.deaths + " lost";
        const enshrine = (tier, hofKey, champ, rank, regionName) => {
          const ts = Date.now();
          s.nuzlockeHof = s.nuzlockeHof || [];
          s.nuzlockeHof.push({ att: attId, catches: r.catches, deaths: r.deaths, box: r.box.map((m) => m.id), ts: ts, tier: tier, mode: r.mode || "", region: regionName || "" });
          s.hof = s.hof || [];
          s.hof.push({ attId: attId, ts: ts, party: alive.slice(0, 6), key: hofKey, champ: champ, rank: rank, region: regionName || "" });
          return ts;
        };
        const REG = window.NUZ_REGIONS || [];
        if (r.region === "blitz") {                            // ⚡ the blitz gauntlet
          Store.chron(s, "⚡", nm + " took a blitz-gauntlet battle — " + (r.badges.length + r.league.length) + "/15 down, the cap climbs again!");
          return;
        }
        if (r.region === "movie") {                            // 🎬 the movie marathon
          const REEL = window.MOVIE_BOSSES || [];
          const lastB = REEL[REEL.length - 1];
          if (lastB && key === lastB.key) {
            r.over = "premiere"; r.doneTs = enshrine("movie", "nuzlocke-movie", lastB.name, "Marathon Premiere", "The Filmography");
            Store.chron(s, "🎬", "THE CREDITS ROLL!!! " + nm + " survived the ENTIRE FILMOGRAPHY — " + REEL.length + " films of movie legends with permadeath on, " + tally + ". A premiere for the ages of cinema.");
          } else {
            Store.chron(s, "🎬", nm + " survived another premiere — " + r.league.length + "/" + (REEL.length || 16) + " films in the MOVIE MARATHON NUZLOCKE!");
          }
          return;
        }
        if (!r.region) {                                       // legacy Kanto→Johto structure
          if (key === "blue") {
            r.act = 2; r.champTs = enshrine("champion", "nuzlocke", "BLUE", "Nuzlocke Champion", "Kanto");
            Store.chron(s, "🏆", "NUZLOCKE CHAMPION!! " + nm + " beat BLUE with permadeath on — " + tally + ". And Johto is calling…");
          } else if (key === "red") {
            r.over = "legend"; r.doneTs = enshrine("legend", "nuzlocke-red", "RED", "Nuzlocke Legend", "Johto");
            Store.chron(s, "🗻", "NUZLOCKE LEGEND!!! " + nm + " climbed Mt. Silver with permadeath on and defeated RED — " + tally + " across TWO regions. Nothing left to prove.");
          } else {
            Store.chron(s, "🪦", nm + " toppled a Nuzlocke Elite Four stage (" + r.league.length + "/5)!");
          }
          return;
        }
        if (r.region === "master") {                           // 🌍 the all-regions gauntlet
          const last = REG[REG.length - 1];
          const R = REG.find((x) => x.champKey === key || x.peak === key);
          if (last && key === last.champKey) {
            r.over = "master"; r.doneTs = enshrine("master", "nuzlocke-master", last.champ, "Master Nuzlocke", "All regions");
            Store.chron(s, "🌍", "MASTER OF ALL REGIONS!!! " + nm + " conquered every gym, every Elite Four and every Champion across all NINE regions with permadeath on — " + tally + ". The ultimate Nuzlocke is COMPLETE.");
          } else if (R && key === R.champKey) {
            const crowns = REG.filter((x) => r.league.indexOf(x.champKey) >= 0).length;
            Store.chron(s, "🏆", nm + " conquered " + R.name + " in the MASTER NUZLOCKE (" + crowns + "/9 regions) — permadeath still on, the road goes on…");
          } else if (R && key === R.peak) {
            Store.chron(s, "🗻", nm + " toppled RED on Mt. Silver mid-MASTER NUZLOCKE — and kept walking.");
          } else {
            Store.chron(s, "🪦", nm + " toppled a Nuzlocke league stage in the master gauntlet!");
          }
          return;
        }
        if (r.region === "trek") {                             // 🎒 The Long Walk
          const last = REG[REG.length - 1];
          const R = REG.find((x) => x.champKey === key || x.peak === key);
          if (last && key === last.champKey) {
            r.over = "trek"; r.doneTs = enshrine("trek", "nuzlocke-trek", last.champ, "The Long Walk", "All regions, one team");
            Store.chron(s, "🎒", "THE LONG WALK IS OVER!!! " + nm + " carried ONE team through all nine regions — every border, every reset curve, RED and all — with permadeath on. " + tally + ". The box that walked the whole saga.");
          } else if (R && key === R.champKey) {
            const crowns = REG.filter((x) => r.league.indexOf(x.champKey) >= 0).length;
            Store.chron(s, "🏆", nm + " conquered " + R.name + " on the LONG WALK (" + crowns + "/9 regions) — same team, next border, the curve resets again…");
            if (!R.peak) Store._nuzBorderDevolve(r, s, nm);
          } else if (R && key === R.peak) {
            Store.chron(s, "🗻", nm + " toppled RED on Mt. Silver — the long walk goes on, one team heavier with the memory.");
            Store._nuzBorderDevolve(r, s, nm);
          } else {
            Store.chron(s, "🪦", nm + " toppled a Nuzlocke league stage on the long walk!");
          }
          return;
        }
        if (r.region === "ages") {                             // 🕰 Through the Ages
          const last = REG[REG.length - 1];
          const R = REG.find((x) => x.champKey === key || x.peak === key);
          if (key === "oak") {                                 // 🔬 THE LAST BOSS — Pallet Town
            const teams = 1 + ((r.retired || []).length);
            r.over = "ages"; r.doneTs = enshrine("ages", "nuzlocke-ages", "PROF. OAK", "Trainer of the Ages", "Nine generations");
            Store.chron(s, "🕰", "TRAINER OF THE AGES!!! " + nm + " walked the whole saga — nine generations, " + teams + " teams — and back home in Pallet Town, PROFESSOR OAK himself fell to the trainer he started. " + tally + " across the ages, permadeath to the last turn. The story is complete.");
          } else if (last && key === last.champKey) {
            Store.chron(s, "🏆", nm + " conquered " + (R ? R.name : "the last region") + " — every league in the saga has fallen. One road remains: home to Pallet Town, where Professor Oak is waiting…");
          } else if (R && key === R.champKey) {
            Store.chron(s, "🏆", nm + " closed the book on Gen " + R.gen + " — " + R.name + " conquered in the THROUGH-THE-AGES NUZLOCKE. A new generation calls…");
          } else if (R && key === R.peak) {
            Store.chron(s, "🗻", nm + " toppled RED on Mt. Silver — the last page of Gen 2 in the THROUGH-THE-AGES NUZLOCKE.");
          } else {
            Store.chron(s, "🪦", nm + " toppled a Nuzlocke league stage on the journey through the ages!");
          }
          return;
        }
        const R = REG.find((x) => x.key === r.region);         // region-exclusive run
        if (R && key === R.peak) {
          r.over = "legend"; r.doneTs = enshrine("legend", "nuzlocke-red", R.peakName || "RED", "Nuzlocke Legend", R.name);
          Store.chron(s, "🗻", "NUZLOCKE LEGEND!!! " + nm + " went past the crown and defeated " + (R.peakName || "RED") + " on Mt. Silver with permadeath on — " + tally + ". Nothing left to prove.");
        } else if (R && key === R.champKey) {
          r.crowned = 1; r.champTs = enshrine("champion", "nuzlocke-" + R.key, R.champ, "Nuzlocke Champion", R.name);
          if (!R.peak) r.over = "champion";
          Store.chron(s, "🏆", "NUZLOCKE CHAMPION!! " + nm + " conquered " + R.name + " with permadeath on — " + tally + "." + (R.peak ? " And Mt. Silver is calling…" : ""));
        } else {
          Store.chron(s, "🪦", nm + " toppled a " + (R ? R.name : "") + " Nuzlocke league stage (" + r.league.length + "/5)!");
        }
      }, slot);
    },
    // 📖 A story-slot villain beaten mid-run — remembered on the RUN, so the
    // ambush never re-fires (real-ladder encounterWins stay untouched).
    nuzStoryWin(attId, name, slot) {
      this._nuzEdit(attId, (r, s) => {
        r.story = r.story || [];
        if (r.story.indexOf(name) < 0) r.story.push(name);
      }, slot);
    },
    // ⚡ The blitz ends when its seeded 15-battle reel is empty — the view
    // calls this after the Champion finale falls.
    nuzBlitzCrown(attId) {
      this._nuzEdit(attId, (r, s) => {
        if (r.over || r.region !== "blitz") return;
        const alive = r.box.filter((m) => !m.dead).map((m) => m.id);
        r.over = "blitz"; r.doneTs = Date.now();
        s.nuzlockeHof = s.nuzlockeHof || [];
        s.nuzlockeHof.push({ att: attId, catches: r.catches, deaths: r.deaths, box: r.box.map((m) => m.id), ts: r.doneTs, tier: "blitz", mode: r.mode || "", region: "15 battles" });
        s.hof = s.hof || [];
        s.hof.push({ attId: attId, ts: r.doneTs, party: alive.slice(0, 6), key: "nuzlocke-blitz", champ: "THE GAUNTLET", rank: "Blitz Gauntlet", region: "15 battles" });
        Store.chron(s, "⚡", "BLITZ COMPLETE!!! " + this._nuzName(attId) + " ran the 15-battle gauntlet from Lv 14 to Lv 100 — a surprise Champion and all — with permadeath on. " + r.catches + " caught, " + r.deaths + " lost.");
      }, "blitz");
    },
    // Bank the crown and stop — a champion who walks away stays a champion.
    // (Legacy act-II runs, or a Johto region run with RED still waiting.)
    nuzRetire(attId, slot) { this._nuzEdit(attId, (r) => { if (!r.over && (r.act === 2 || r.crowned)) r.over = "champion"; }, slot); },
    // 🎒 The border reset: the Lv 14 curve pulls every LIVING box mon back
    // down its line (Venusaur walks into Johto as Bulbasaur — it will earn
    // its evolutions all over again as the caps climb). Tombstones keep the
    // form they fell in; noEvo flags clear so the evolution checks re-offer.
    _nuzBorderDevolve(r, s, nm) {
      const pre = this._nuzPre();
      const DEXX = window.DEX || {};
      const dev = (id) => { let g = 0; while (pre[id] && pre[id].lvl > 14 && DEXX[pre[id].from] && g++ < 6) id = pre[id].from; return id; };
      const n = (id) => (DEXX[id] || {}).n || ("#" + id);
      const changed = [];
      r.box.forEach((m) => {
        if (m.dead) return;
        const to = dev(m.id);
        if (to !== m.id) { changed.push(n(m.id) + "→" + n(to)); m.id = to; delete m.noEvo; }
      });
      if (changed.length) Store.chron(s, "🎒", nm + "'s team crossed the border and the Lv 14 curve pulled them back down: " + changed.join(", ") + ". They'll grow it all back.");
    },
    // Completed runs on the crown board: highest tier first (master and the
    // ages walk > legend > champion), then fewest catches — the classic flex.
    nuzHall() {
      const w = { master: 3, ages: 3, trek: 2.7, movie: 2.5, legend: 2, blitz: 1.5 };
      return (this.state.nuzlockeHof || []).slice().sort((a, b) =>
        ((w[b.tier] || 1) - (w[a.tier] || 1)) || (a.catches - b.catches) || (a.deaths - b.deaths) || (a.ts - b.ts));
    },

    // 🏔 HISUI — beating CYNTHIA (the summit of Gen 4) tears the temporal
    // rift: Arceus speaks, and the ancient region's forms roam this trainer's
    // Safari (plus the Hisui specials on the Sinnoh tab).
    hisuiUnlocked(attId) { return this.leagueWins(attId).indexOf("cynthia") >= 0; },

    // 🗼 Battle Tower — 4v4 double-battle streaks vs randomized trainers.
    // Per-trainer {streak, best} for the classic climb and {rStreak, rBest}
    // for RENTAL mode (random squad handed to you). A loss resets the live
    // streak, bests are forever — and the FIRST time a classic streak hits 7
    // (Palmer's floor), the team is enshrined in the real Hall of Fame.
    towerOf(attId) { return (this.state.tower || {})[attId] || { streak: 0, best: 0, rStreak: 0, rBest: 0 }; },

    // 🟣 Master Balls — a PROGRESSION currency, never bought: 5 for every
    // Champion beaten in The Journey, +3 per nuzlocke crown (+5 when the
    // crown is an ULTIMATE: Master, Ages, Long Walk or Movie Marathon).
    // Earned is DERIVED from wins already on record (fully retroactive);
    // only the SPENT side is stored — a monotonic counter on the trainer's
    // pokedex record (merged by max, so a lagging phone can't refund one).
    mballEarned(attId) {
      const champs = (window.LEAGUE_STAGES || [])
        .filter((st) => st.rank === "Champion" || st.rank === "Top Champion").map((st) => st.key);
      const wins = this.leagueWins(attId);
      let n = 5 * champs.filter((k) => wins.indexOf(k) >= 0).length;
      const ULT = { master: 1, ages: 1, trek: 1, movie: 1 };
      (this.state.nuzlockeHof || []).forEach((r) => { if (r.att === attId) n += ULT[r.tier] ? 5 : 3; });
      return n;
    },
    mballUsed(attId) { return (((this.state.pokedex || {}).trainers || {})[attId] || {}).mballUsed || 0; },
    mballLeft(attId) { return Math.max(0, this.mballEarned(attId) - this.mballUsed(attId)); },
    // 🌩 Roaming-legendary races won (first catch claimed the storm).
    roamWins(attId) { return (((this.state.pokedex || {}).trainers || {})[attId] || {}).roamWins || 0; },

    // 👑 ROOM OWNER — the first person to claim the room sets a PIN (stored
    // as a cheap hash; this is honor-system gatekeeping against accidents
    // and mischief, not cryptography — there is no server to enforce more).
    // Once claimed, destructive acts (removing trainers, fresh slate, reset)
    // ask for the PIN. First claim wins across the room (older ts survives
    // every merge).
    _pinHash(pin) {
      let h = 5381; const str = "bach:" + String(pin || "");
      for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
      return h.toString(36);
    },
    // 🏆 RANK IS EARNED, not typed: the Squad Leaderboard decides. #1 by
    // Trainer Score is the room's CHAMPION, seats 2-5 are the ELITE FOUR,
    // everyone else is a GYM LEADER. A score of zero never wears a crown —
    // fresh rooms are all Gym Leaders until somebody achieves something.
    // (Ties break like the leaderboard: catches, then badges, then name.)
    rankOf(attId) {
      const rows = (this.state.attendees || []).map((a) => ({
        id: a.id, s: this.achievementScore(a.id), c: this.dexCount(a.id),
        b: this.gymBadgeCount(a.id), n: a.name || "",
      })).sort((x, y) => (y.s - x.s) || (y.c - x.c) || (y.b - x.b) || x.n.localeCompare(y.n));
      const i = rows.findIndex((r) => r.id === attId);
      if (i < 0 || rows[i].s <= 0) return "Gym Leader";
      return i === 0 ? "Champion" : i <= 4 ? "Elite Four" : "Gym Leader";
    },

    roomOwner() { return this.state.roomOwner || null; },
    claimRoom(pin, attId) {
      pin = String(pin || "").trim();
      if (pin.length < 4 || this.state.roomOwner) return false;
      const name = (this.attendee(attId) || {}).name || "";
      const h = this._pinHash(pin);
      this.update((s) => {
        if (s.roomOwner) return;
        s.roomOwner = { h: h, attId: attId || "", name: name, ts: (Date.now && Date.now()) || 1 };
        this.chron(s, "👑", (name || "Someone") + " claimed ROOM OWNERSHIP — trainer removal and slate wipes now need the owner's PIN.");
      });
      return !!this.state.roomOwner && this.state.roomOwner.h === h;
    },
    checkOwnerPin(pin) {
      const o = this.state.roomOwner;
      return !!o && o.h === this._pinHash(String(pin || "").trim());
    },
    // 🗑 Remove a trainer — with a TOMBSTONE so a stale phone's last-write
    // push can never resurrect them. Their big progress records go too; Hall
    // of Fame plaques stay (history happened). A re-created person gets a
    // fresh id, so the tombstone never haunts them.
    removeTrainer(attId, byName) {
      const a = this.attendee(attId);
      if (!a) return false;
      this.update((s) => {
        s.trainerTombs = s.trainerTombs || {};
        s.trainerTombs[attId] = (Date.now && Date.now()) || 1;
        s.attendees = (s.attendees || []).filter((x) => x.id !== attId);
        if (s.pokedex && s.pokedex.trainers) delete s.pokedex.trainers[attId];
        ["league", "tower", "nuzRuns", "nuzlocke", "gauntlets", "leagueRuns", "legends", "secrets", "movies"].forEach((k) => {
          if (s[k] && typeof s[k] === "object") delete s[k][attId];
        });
        this.chron(s, "🗑", (byName ? byName + " removed" : "Removed") + " trainer " + a.name + " from the room.");
      });
      // the removed trainer might be signed in on THIS phone
      try { if (window.Sync && Sync.getMe && Sync.getMe() === attId) Sync.setMe(""); } catch (_) {}
      return true;
    },
    towerWin(attId, foeName, tycoon, partyIds, rental) {
      if (!attId) return;
      this.update((s) => {
        s.tower = s.tower || {};
        const t = s.tower[attId] = s.tower[attId] || { streak: 0, best: 0 };
        const nm = this._nuzName(attId);
        if (rental) {
          t.rStreak = (t.rStreak || 0) + 1; t.rBest = Math.max(t.rBest || 0, t.rStreak); t.upd = Date.now();
          if (t.rStreak === 100) Store.chron(s, "👑", nm + " CONQUERED THE 1→100 GAUNTLET on RENTALS ALONE — floor 100, Lv100, no losses!!");
          else if (tycoon) Store.chron(s, "🎲", nm + " beat PALMER with a RENTAL squad — rental streak " + t.rStreak + "!!");
          else if (t.rStreak % 5 === 0) Store.chron(s, "🎲", nm + " is " + t.rStreak + " deep on RENTAL Pokémon alone!");
          return;
        }
        const prevBest = t.best || 0;
        t.streak += 1; t.best = Math.max(prevBest, t.streak); t.upd = Date.now();
        if (t.streak === 100 && prevBest < 100) Store.chron(s, "👑", nm + " CONQUERED THE 1→100 GAUNTLET — floor 100, Lv100, one hundred straight!!");
        if (t.streak === 7 && prevBest < 7) {
          s.hof = s.hof || [];
          s.hof.push({ attId: attId, ts: Date.now(), party: (partyIds || []).slice(0, 6), key: "tower", champ: "PALMER", rank: "Tower Ace", region: "" });
        }
        if (tycoon) Store.chron(s, "🗼", nm + " toppled TOWER TYCOON PALMER — Battle Tower streak " + t.streak + "!!");
        else if (t.streak % 5 === 0) Store.chron(s, "🗼", nm + " is on a Battle Tower HEATER — " + t.streak + " straight!");
      });
    },
    towerLoss(attId, foeName, rental) {
      if (!attId) return;
      this.update((s) => {
        s.tower = s.tower || {};
        const t = s.tower[attId] = s.tower[attId] || { streak: 0, best: 0 };
        const had = rental ? (t.rStreak || 0) : t.streak;
        if (rental) t.rStreak = 0; else t.streak = 0;
        t.upd = Date.now();
        if (had >= 3) Store.chron(s, "🗼", this._nuzName(attId) + "'s " + (rental ? "rental " : "") + "Battle Tower streak ends at " + had + " — " + (foeName || "the tower") + " takes it.");
      });
    },

    // 🎖 TIERED ACHIEVEMENTS — Bronze / Silver / Gold / Platinum across every
    // system in the app, computed LIVE from the records themselves (nothing
    // stored, nothing to hand out). Platinum is intentionally BRUTAL —
    // completion-grade: the whole dex, every gym badge, every league stage,
    // all three ultimate nuzlockes. Returns [{key, emoji, title, unit, value,
    // at:[b,s,g,p], steps?, tier:0-4, tierName, next}].
    ACH_TIERS: ["—", "Bronze", "Silver", "Gold", "Platinum"],
    achievementsFor(attId) {
      if (!attId) return [];
      const LC = window.LegendChallenge || {};
      const legendsTotal = (((LC.LEGENDS) || []).length + ((LC.SPECIALS) || []).length) || 29;
      const filmTotal = (window.MOVIE_BOSSES || []).length || 16;
      const leagueTotal = (window.LEAGUE_STAGES || []).length || 47;
      const gymTotal = ((window.GymCircuit && GymCircuit.GYMS) || []).length || 68;
      const canon = window.CANON_TRAINERS || [];
      const enc = this.encounterWins(attId);
      const tdexGot = canon.filter((t) => enc.indexOf(t.name) >= 0).length
        + this.gymBadgeCount(attId) + this.leagueWins(attId).length
        + this.movieWins(attId).length + this.legendWins(attId).length + this.secretWins(attId).length;
      const tdexTotal = canon.length + gymTotal + leagueTotal + filmTotal + legendsTotal;
      // Nuzlocke climbs by TIER, not count: crown → RED → one ultimate →
      // ALL FOUR ultimates (master + ages + trek + movie). The hardest
      // platinum on the wall, by design.
      const nz = (this.state.nuzlockeHof || []).filter((r) => r.att === attId);
      const nzHas = (t) => nz.some((r) => r.tier === t);
      const ULT = ["master", "ages", "trek", "movie"];
      const nzUlt = ULT.filter(nzHas).length;
      const nzTier = nzUlt >= ULT.length ? 4 : nzUlt >= 1 ? 3 : nzHas("legend") ? 2 : (nzHas("champion") || nzHas("blitz")) ? 1 : 0;
      const defs = [
        { key: "collector", emoji: "🔴", title: "The Collector", unit: "species caught",
          v: this.dexCount(attId), at: [25, 150, 500, 1025] },
        { key: "shiny", emoji: "✨", title: "Shiny Charm", unit: "shinies caught",
          v: this.shinyCount(attId), at: [1, 5, 15, 40] },
        { key: "gyms", emoji: "🏅", title: "Badge Hunter", unit: "gym badges",
          v: this.gymBadgeCount(attId), at: [8, 24, 48, gymTotal] },
        { key: "league", emoji: "👑", title: "League Slayer", unit: "league stages beaten",
          v: this.leagueWins(attId).length, at: [5, 16, 33, leagueTotal] },
        { key: "duels", emoji: "⚔️", title: "Rival of Rivals", unit: "duel wins vs friends",
          v: this.duelRecord(attId).w, at: [5, 15, 40, 100] },
        { key: "kos", emoji: "💥", title: "Knockout Artist", unit: "lifetime KOs",
          v: this.koLife(attId), at: [50, 200, 500, 1500] },
        { key: "tower", emoji: "🗼", title: "Tower Monarch", unit: "best tower streak",
          v: (this.towerOf(attId) || {}).best || 0, at: [7, 25, 50, 100] },
        { key: "nuzlocke", emoji: "🪦", title: "Permadeath Proof", unit: "",
          v: nzTier, at: [1, 2, 3, 4],
          steps: ["win any Nuzlocke crown", "topple RED for the Legend tier",
            "finish an ULTIMATE run (Master, Ages, Long Walk or Movie)", "finish ALL FOUR ultimates"] },
        { key: "films", emoji: "🎬", title: "Silver Screen", unit: "films beaten",
          v: this.movieWins(attId).length, at: [1, 8, 12, filmTotal] },
        { key: "legends", emoji: "🌌", title: "Legend Seeker", unit: "legends & story beats",
          v: this.legendWins(attId).length + this.secretWins(attId).length, at: [1, 10, 20, legendsTotal] },
        { key: "tdex", emoji: "🎓", title: "Know Every Trainer", unit: "trainers registered",
          v: tdexGot, at: [10, 60, 120, tdexTotal] },
        { key: "storm", emoji: "🌩", title: "Storm Chaser", unit: "roaming races won",
          v: this.roamWins(attId), at: [1, 2, 3, 5] },
        { key: "trades", emoji: "🔁", title: "Link Cable", unit: "trades made",
          v: this.tradeCount(attId), at: [1, 5, 15, 40] },
        { key: "evos", emoji: "🎉", title: "Evolution Engine", unit: "evolutions",
          v: this.evoCount(attId), at: [1, 10, 40, 120] },
      ];
      return defs.map((d) => {
        let tier = 0;
        d.at.forEach((th, i) => { if (d.v >= th) tier = i + 1; });
        return { key: d.key, emoji: d.emoji, title: d.title, unit: d.unit, value: d.v,
          at: d.at, steps: d.steps || null, tier: tier, tierName: this.ACH_TIERS[tier],
          next: tier < 4 ? d.at[tier] : 0 };
      });
    },
    // Achievement score for the room board: bronze 1 · silver 2 · gold 3 ·
    // platinum 5 (the jump rewards the brutal ones).
    achievementScore(attId) {
      const pts = [0, 1, 2, 3, 5];
      return this.achievementsFor(attId).reduce((n, a) => n + pts[a.tier], 0);
    },

    // 🎖 Battle Honors — per-trainer awards for the EXTRA challenge ladders
    // (Movie Legends, the Champions Tournament, canon-villain ambushes, Mt.
    // Silver, and the nine-region Top Champion). Unlike liveTrophies (one holder
    // each), every trainer who earns one keeps it — they roll in the closing
    // credits and gather in the ceremony. Returns [{emoji, title, sub}].
    battleHonorsFor(attId) {
      const out = [];
      const mv = this.movieWins(attId);
      const allFilms = (window.MOVIE_BOSSES || []).length || 10;
      if (mv.length >= allFilms) out.push({ emoji: "🎬", title: "Silver Screen Legend", sub: "conquered every Movie Legend — the full filmography" });
      else {
        if (mv.indexOf("mewtwo") >= 0) out.push({ emoji: "🧬", title: "Clone Buster", sub: "toppled MEWTWO and his clones" });
        if (mv.indexOf("collector") >= 0) out.push({ emoji: "🎐", title: "Sky Liberator", sub: "freed the birds from the Collector" });
        if (mv.indexOf("entei") >= 0) out.push({ emoji: "🔥", title: "Dream Breaker", sub: "broke the Unown's spell over ENTEI" });
        if (mv.length >= 4) out.push({ emoji: "🎞", title: "Film Buff", sub: "beat " + mv.length + " of " + allFilms + " Movie Legends" });
      }
      const tw = this.tourneyWins(attId);
      if (tw > 0) out.push({ emoji: "🏆", title: "Tournament Champion", sub: tw > 1 ? tw + "× Champions Cup winner" : "won the Champions Tournament" });
      const enc = this.encounterWins(attId);
      const totalCanon = (window.CANON_TRAINERS || []).length;
      if (enc.length && totalCanon && enc.length >= totalCanon) out.push({ emoji: "☠️", title: "Rogues' Gallery", sub: "beat every villain who ambushed the crew" });
      else if (enc.length >= 5) out.push({ emoji: "🦹", title: "Villain Vanquisher", sub: "sent " + enc.length + " famous rogues packing" });
      else if (enc.length >= 1) out.push({ emoji: "❗", title: "Ambush Survivor", sub: "won " + enc.length + " surprise showdown" + (enc.length > 1 ? "s" : "") });
      const lw = this.leagueWins(attId);
      if (lw.indexOf("red") >= 0) out.push({ emoji: "🗻", title: "Mt. Silver Conqueror", sub: "defeated the silent trainer, RED" });
      if (lw.indexOf("geeta") >= 0) out.push({ emoji: "🌟", title: "Grand Champion", sub: "climbed all nine regions to the Top Champion" });
      // 🌌 Legendary Challenge — one honor per generation cleared, and a grand
      // title for sweeping all nine.
      const lg = this.legendWins(attId);
      if (lg.length >= 9) out.push({ emoji: "🌌", title: "Legend Keeper", sub: "vanquished the legendaries of all nine generations" });
      else if (lg.length >= 1) out.push({ emoji: "✨", title: "Legend Slayer", sub: "conquered the legendaries of " + lg.length + " generation" + (lg.length > 1 ? "s" : "") });
      // 🔡 Unown Dex — read the living alphabet.
      const un = this.unownCaught(attId);
      if (un.length >= 28) out.push({ emoji: "🔡", title: "Unown Scholar", sub: "decoded all 28 Unown" });
      else if (un.length >= 1) out.push({ emoji: "🔠", title: "Unown Reader", sub: "decoded " + un.length + " of 28 Unown" });
      // 🌀 Secret battle — the Unown's Judgment (Arceus & the creation trio).
      if (this.secretWins(attId).indexOf("unown") >= 0) out.push({ emoji: "🌀", title: "The Original One", sub: "answered the Unown's Judgment — Arceus & the creation trio" });
      // ✨ Mega-Dex — mega forms used in battle, and the Mega Judgment.
      const md = this.megaDexCaught(attId), mt = this.megaDexTotal();
      if (mt > 0 && md.length >= mt) out.push({ emoji: "✨", title: "Mega Master", sub: "Mega-Evolved every form in battle" });
      else if (md.length >= 1) out.push({ emoji: "💠", title: "Mega Evolver", sub: "Mega-Evolved " + md.length + " form" + (md.length > 1 ? "s" : "") + " in battle" });
      if (this.secretWins(attId).indexOf("mega") >= 0) out.push({ emoji: "🌈", title: "Beyond Evolution", sub: "beat the Mega Judgment — Rayquaza, the primals, Zygarde & Floette" });
      // Region specials — one honor per secret-battle clear (table-driven).
      const SPECIAL_HONORS = {
        zygarde: { emoji: "🐍", title: "Order Restored", sub: "felled Xerneas, Yveltal & every form of Zygarde" },
        vigil: { emoji: "🌙", title: "Keeper of the Lakes", sub: "outlasted the Sinnoh Vigil — lake spirits to Regigigas" },
        myths: { emoji: "🎵", title: "Storm Singer", sub: "quieted the Myths of Unova" },
        tapus: { emoji: "🗿", title: "Guardians' Blessing", sub: "passed the rites of all four island Tapus" },
        ultra: { emoji: "☄️", title: "Rift Sealer", sub: "sealed the Ultra Rift and returned Necrozma's light" },
        monarchs: { emoji: "👊", title: "Crownless Conqueror", sub: "felled Galar's myths & riderless monarchs" },
        dlc: { emoji: "🎭", title: "Mask & Disk", sub: "unmasked Kitakami and cracked the Indigo Disk" },
        hoopa: { emoji: "🌀", title: "Ageless", sub: "won the Clash of Ages — Hoopa Unbound's every summons fell" },
        volo: { emoji: "⚱️", title: "Ginkgo's Reckoning", sub: "saw through VOLO's smile — all eight, Giratina and Giratina again" },
        nobles: { emoji: "🏔", title: "Warden of Old", sub: "quelled all five Frenzied Nobles of ancient Hisui" },
        almighty: { emoji: "⏳", title: "Chosen of Arceus", sub: "outlasted Origin Dialga, Origin Palkia — and the Almighty itself" },
        delta: { emoji: "☄️", title: "Sky-High Hero", sub: "cleared the Delta Episode — Zinnia bowed, Deoxys fell at the edge of space" },
        flare: { emoji: "🔥", title: "Weapon Breaker", sub: "shut down Team Flare's ultimate weapon — Lysandre, Xerneas and Yveltal" },
        az: { emoji: "🌸", title: "The Freeing Hand", sub: "ended AZ's three thousand years — the Eternal Floette came home" },
        rogues: { emoji: "🏙", title: "Calmer of Lumiose", sub: "soothed every rogue Mega Evolution in the rebuilt city (Legends Z-A)" },
        ncastle: { emoji: "🏰", title: "The Missing Variable", sub: "took N's Castle — the king's dragon fell, and Ghetsis raged into ruin" },
        aether: { emoji: "🧬", title: "Family Breaker", sub: "broke Aether Paradise's spell — freed Lusamine from the Motherbeast" },
        darkest: { emoji: "🌑", title: "Dawnbringer", sub: "ended the Darkest Day — Eternamax Eternatus fell over Hammerlocke" },
        titans: { emoji: "🥪", title: "Titan Tamer", sub: "walked the Path of Legends — all five Titans, for Mabosstiff" },
        paradox: { emoji: "⏰", title: "Unstuck in Time", sub: "survived the Paradox Gauntlet — both professors and Terapagos Stellar" },
      };
      const sw = this.secretWins(attId);
      Object.keys(SPECIAL_HONORS).forEach((k) => { if (sw.indexOf(k) >= 0) out.push(SPECIAL_HONORS[k]); });
      // 🗼 Battle Tower — streak plaques (7 = the Tycoon's silver print).
      const twr = this.towerOf(attId) || {};
      const tb = twr.best || 0;
      if (tb >= 21) out.push({ emoji: "🗼", title: "Tower Legend", sub: "a 21-win Battle Tower streak — the gold print" });
      else if (tb >= 7) out.push({ emoji: "🗼", title: "Tower Ace", sub: "a 7-win streak — took Tower Tycoon PALMER's silver print" });
      else if (tb >= 3) out.push({ emoji: "🛗", title: "Tower Climber", sub: "a " + tb + "-win Battle Tower streak" });
      if ((twr.rBest || 0) >= 7) out.push({ emoji: "🎲", title: "Rental Ace", sub: "a 7-win Tower streak on RENTAL Pokémon alone" });
      // 🪦 Nuzlocke — completed hardcore runs (fewest catches is the flex).
      const nz = (this.state.nuzlockeHof || []).filter((r) => r.att === attId);
      if (nz.length) {
        const best = nz.reduce((a, b) => (b.catches < a.catches ? b : a));
        if (nz.some((r) => r.tier === "master")) out.push({ emoji: "🌍", title: "Master Nuzlocke", sub: "all nine regions, every trainer, permadeath on — the ultimate run" });
        if (nz.some((r) => r.tier === "ages")) out.push({ emoji: "🕰", title: "Trainer of the Ages", sub: "nine generations, a fresh team each era, one unbroken journey — permadeath on" });
        if (nz.some((r) => r.tier === "movie")) out.push({ emoji: "🎬", title: "Marathon Premiere", sub: "survived the entire filmography — every movie legend at full power, permadeath on" });
        if (nz.some((r) => r.tier === "trek")) out.push({ emoji: "🎒", title: "The Long Walk", sub: "one team through all nine regions, the curve resetting at every border — permadeath all the way" });
        if (nz.some((r) => r.tier === "blitz")) out.push({ emoji: "⚡", title: "Blitz Gauntlet", sub: "15 battles, Lv 14 to 100, a surprise Champion — a whole nuzlocke in one sitting" });
        if (nz.some((r) => r.tier === "legend")) out.push({ emoji: "🗻", title: "Nuzlocke Legend", sub: "took the run past the Champion — and RED still fell" });
        out.push({ emoji: "🪦", title: "Nuzlocke Champion", sub: "conquered " + (best.region || "Kanto") + " with permadeath on — " + best.catches + " Pokémon caught" });
        if (best.catches <= 6) out.push({ emoji: "🎖", title: "Minimalist", sub: "Nuzlocke champion with only " + best.catches + " Pokémon all run" });
        if (nz.some((r) => !r.deaths)) out.push({ emoji: "💎", title: "Deathless", sub: "won a Nuzlocke without losing a single Pokémon" });
      }
      return out;
    },
    // Flat roll-up of every trainer's honors, for the ceremony credits.
    battleHonors() {
      const out = [];
      (this.state.attendees || []).forEach((a) => {
        this.battleHonorsFor(a.id).forEach((h) => out.push({ emoji: h.emoji, title: h.title, holder: a.name, sub: h.sub }));
      });
      return out;
    },
    // ⏸ Break timer — one shared countdown for the whole room: "games resume at
    // X". Set/clear syncs to everyone; the newest set OR clear wins (merge guard
    // keeps a stale phone from resurrecting an old timer). `set` timestamps it.
    setBreak(mins, by, note) {
      const ms = Math.max(1, Math.round((Number(mins) || 0) * 60000));
      this.update((s) => { s.break = { until: Date.now() + ms, by: by || "", note: note || "", set: Date.now() }; });
    },
    clearBreak(by) {
      this.update((s) => { s.break = { until: 0, by: by || "", note: "", set: Date.now(), cleared: true }; });
    },
    // The active break, or null if none / already elapsed.
    getBreak() {
      const b = this.state.break;
      if (!b || !b.until || b.until <= Date.now()) return null;
      return b;
    },

    // Nickname a caught mon (per trainer). Blank clears it.
    setNick(attId, monId, nick) {
      this.update((s) => {
        const t = s.pokedex.trainers[attId];
        const r = t && t.caught && t.caught[monId];
        if (!r) return;
        nick = String(nick || "").trim().slice(0, 14);
        if (nick) r.nick = nick; else delete r.nick;
      });
    },
    nickOf(attId, monId) {
      const t = (this.state.pokedex.trainers || {})[attId];
      return (t && t.caught && t.caught[monId] && t.caught[monId].nick) || "";
    },

    // ---- Battle-EXP evolution ------------------------------------------------
    // A mon that personally lands 3 KOs in duels has enough battle EXP to
    // evolve (branched lines choose). The dex remembers the base form; spare
    // EXP carries over to the evolved form; shiny stays shiny.
    KO_TO_EVOLVE: 3,
    evoTargets(monId) {
      const t = (window.DEX_EVOS || {})[monId];
      return t && t.length ? t.slice() : [];
    },
    evoReady(attId, monId) {
      if (this.TRADE_EVOS[monId]) return false;   // Kadabra & co. ONLY evolve by trade
      const t = (this.state.pokedex.trainers || {})[attId];
      const r = t && t.caught && t.caught[monId];
      return !!(r && (r.kos || 0) >= this.KO_TO_EVOLVE && this.evoTargets(monId).length);
    },
    evolveMon(attId, monId, targetId, by) {
      monId = +monId; targetId = +targetId;
      if (!this.evoReady(attId, monId)) return false;
      if (this.evoTargets(monId).indexOf(targetId) < 0) return false;
      let ok = false;
      this.update((s) => {
        const t = s.pokedex.trainers[attId]; if (!t) return;
        const r = t.caught[monId]; if (!r) return;
        // Battle EXP is SPENT on the evolution — the evolved form starts fresh
        // (no spare carried over, so no surprise chain-evolutions).
        r.kos = 0;
        const ex = t.caught[targetId];
        if (ex) { ex.count = (ex.count || 1) + 1; if (r.shiny) ex.shiny = true; }
        else t.caught[targetId] = { count: 1, ball: r.ball || "poke", shiny: r.shiny || undefined };
        t.seen = t.seen || {}; t.seen[targetId] = 1;
        const i = (t.team || []).indexOf(monId);
        if (i >= 0 && t.team.indexOf(targetId) < 0) t.team[i] = targetId;
        t.evolutions = (t.evolutions || 0) + 1;
        const nm = (id) => (window.DEX && DEX[id] && DEX[id].n) || ("#" + id);
        const an = (this.attendee(attId) || {}).name || attId;
        this.chron(s, "🎉", "What?! " + an + "'s " + nm(monId) + " evolved into " + nm(targetId) + " — " + this.KO_TO_EVOLVE + " KOs of battle EXP!", by);
        ok = true;
      });
      return ok;
    },

    drinkTypes() { return DRINKS.slice(); },
    drinkEmoji: drinkEmoji,
    drinkCount(trainerId, type) {
      return (this.state.drinks || []).filter((d) => d.trainer === trainerId && (!type || d.type === type)).length;
    },
    firstDrink() {
      const ds = (this.state.drinks || []).slice().sort((a, b) => a.ts - b.ts);
      return ds[0] || null;
    },
    dayKey(ts) { const d = new Date(ts); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); },
    dayLabel(ts) { try { return new Date(ts).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); } catch (_) { return ""; } },
    // Distinct drink types actually logged (in DRINKS order).
    drinkTypesPresent() {
      const seen = {}; (this.state.drinks || []).forEach((d) => { if (d.type) seen[d.type] = 1; });
      return DRINKS.map((x) => x.type).filter((t) => seen[t]);
    },
    // First Sip + Thirstiest + a champion for each kind (for the Drinks page + Poster).
    drinkAwards() {
      const out = [];
      const first = this.firstDrink();
      if (first) { const a = this.attendee(first.trainer); out.push({ emoji: "🍾", title: "First Sip", holder: a ? a.name : first.trainer, sub: "logged the weekend’s first drink" }); }
      const total = this._topAttendee((id) => this.drinkCount(id));
      if (total) out.push({ emoji: "🍺", title: "Thirstiest Trainer", holder: total.a.name, sub: total.n + " drinks total" });
      this.drinkTypesPresent().forEach((type) => {
        const top = this._topAttendee((id) => this.drinkCount(id, type));
        if (top) out.push({ emoji: drinkEmoji(type), title: "Most " + type, holder: top.a.name, sub: top.n + " " + type.toLowerCase() + (top.n > 1 ? "s" : "") });
      });
      return out;
    },

    // ---- Import / Export --------------------------------------------------
    exportJSON() {
      return JSON.stringify(this.state, null, 2);
    },
    importJSON(text) {
      const parsed = JSON.parse(text); // throws on bad input; caller handles
      this.state = Object.assign(freshState(), parsed);
      this.persist();
      this._subs.forEach((fn) => fn(this.state));
    },

    // Apply a full state object received from a sync peer. Notifies subscribers
    // (Sync guards its own outgoing push with an "applying" flag, so this
    // doesn't echo back to the room).
    // Wholesale adoption of a room's state — used the moment a phone whose
    // cache belongs to a DIFFERENT room joins this one. No cumulative merge:
    // the old room's people, catches and history stay in the old room.
    adoptRemote(obj) {
      if (!obj || typeof obj !== "object") return;
      this.state = Object.assign(freshState(), obj);
      this.fixupPartners(this.state);
      this.persist();
      this._subs.forEach((fn) => fn(this.state));
    },
    applyRemote(obj) {
      if (!obj || typeof obj !== "object") return;
      const prev = this.state;                       // local — may hold catches/badges not yet in `obj`
      const keepPhotos = this.state.photos || [];    // photos aren't in the synced doc
      this.state = Object.assign(freshState(), obj);
      if (!obj.photos || !obj.photos.length) this.state.photos = keepPhotos;
      // The synced doc is last-write-wins on the WHOLE state, so two phones
      // catching/earning at once would clobber each other. Re-union the
      // append-only records (dex variant ownership + gym badges) from our local
      // copy so a concurrent shiny catch or badge is never lost.
      this._mergeCumulative(prev, this.state);
      this.fixupPartners(this.state);               // heal partner ownership
      this.persist();
      this._subs.forEach((fn) => fn(this.state));
    },
    // Fold append-only local records into freshly-applied remote state. These
    // structures are never deleted from (owning a variant / holding a badge is
    // permanent), so a union can't resurrect a trade or undo anything.
    _mergeCumulative(prev, next) {
      // 🗑 trainer tombstones: union, then enforce — a phone still carrying a
      // removed trainer must not resurrect them via last-write-wins.
      const ptb = (prev && prev.trainerTombs) || {};
      const ntb = next.trainerTombs = next.trainerTombs || {};
      Object.keys(ptb).forEach((id) => { if (!ntb[id]) ntb[id] = ptb[id]; });
      if (Object.keys(ntb).length) {
        next.attendees = (next.attendees || []).filter((a) => !ntb[a.id]);
        if (next.pokedex && next.pokedex.trainers) Object.keys(ntb).forEach((id) => { delete next.pokedex.trainers[id]; });
      }
      // 👑 room owner: FIRST claim wins — the copy with the older timestamp
      // survives, so a latecomer can't overwrite the crown.
      const pown = prev && prev.roomOwner;
      if (pown && (!next.roomOwner || (pown.ts || 0) < (next.roomOwner.ts || 0))) next.roomOwner = pown;
      // 🌍 Gen 5-9 global unlock — sticky once ANY phone sets it, so a
      // concurrent write can never re-lock the room.
      const pp = (prev && prev.pokedex) || {};
      next.pokedex = next.pokedex || { active: "", trainers: {}, log: [], given: 0, taken: 0 };
      if (pp.gen59Unlocked && !next.pokedex.gen59Unlocked) {
        next.pokedex.gen59Unlocked = true;
        next.pokedex.gen59By = next.pokedex.gen59By || pp.gen59By;
        next.pokedex.gen59At = next.pokedex.gen59At || pp.gen59At;
      }
      // 🏅 gym badges: union the holder list per gym.
      const pc = (prev && prev.gymCircuit) || {};
      const nc = next.gymCircuit = next.gymCircuit || {};
      Object.keys(pc).forEach((idx) => {
        const arr = nc[idx] = nc[idx] || [];
        (pc[idx] || []).forEach((att) => { if (arr.indexOf(att) < 0) arr.push(att); });
      });
      // 👑 league wins (Elite Four / Champions / RED): append-only per trainer —
      // union so a concurrent last-write-wins push can't erase a stage you beat.
      const pgl = (prev && prev.league) || {};
      const ngl = next.league = next.league || {};
      Object.keys(pgl).forEach((tid) => {
        const arr = ngl[tid] = ngl[tid] || [];
        (pgl[tid] || []).forEach((k) => { if (arr.indexOf(k) < 0) arr.push(k); });
      });
      // 🎬 Movie Legends (Mewtwo / the Collector): append-only per trainer.
      const pmv = (prev && prev.movies) || {};
      const nmv = next.movies = next.movies || {};
      Object.keys(pmv).forEach((tid) => {
        const arr = nmv[tid] = nmv[tid] || [];
        (pmv[tid] || []).forEach((k) => { if (arr.indexOf(k) < 0) arr.push(k); });
      });
      // ❗ canon-villain encounter wins: append-only names per trainer.
      const pe = (prev && prev.encounters) || {};
      const ne = next.encounters = next.encounters || {};
      Object.keys(pe).forEach((tid) => {
        const arr = ne[tid] = ne[tid] || [];
        (pe[tid] || []).forEach((k) => { if (arr.indexOf(k) < 0) arr.push(k); });
      });
      // 🌌 Legendary Challenge clears: append-only generation keys per trainer.
      const plg = (prev && prev.legends) || {};
      const nlg = next.legends = next.legends || {};
      Object.keys(plg).forEach((tid) => {
        const arr = nlg[tid] = nlg[tid] || [];
        (plg[tid] || []).forEach((k) => { if (arr.indexOf(k) < 0) arr.push(k); });
      });
      // 🔡 Unown glyphs decoded: append-only per trainer.
      const pun = (prev && prev.unown) || {};
      const nun = next.unown = next.unown || {};
      Object.keys(pun).forEach((tid) => {
        const arr = nun[tid] = nun[tid] || [];
        (pun[tid] || []).forEach((g) => { if (arr.indexOf(g) < 0) arr.push(g); });
      });
      // 🌀 Secret-battle wins: append-only keys per trainer.
      const psc = (prev && prev.secrets) || {};
      const nsc = next.secrets = next.secrets || {};
      Object.keys(psc).forEach((tid) => {
        const arr = nsc[tid] = nsc[tid] || [];
        (psc[tid] || []).forEach((k) => { if (arr.indexOf(k) < 0) arr.push(k); });
      });
      // ✨ Mega-Dex: append-only mega form ids Mega-Evolved per trainer.
      const pmd = (prev && prev.megadex) || {};
      const nmd = next.megadex = next.megadex || {};
      Object.keys(pmd).forEach((tid) => {
        const arr = nmd[tid] = nmd[tid] || [];
        (pmd[tid] || []).forEach((k) => { if (arr.indexOf(k) < 0) arr.push(k); });
      });
      // 🪦 Nuzlocke: one live run per trainer, EDITED in place — the copy with
      // the newest edit wins (deaths/badges only ever move forward on the
      // owner's own phone). The hall of finished runs unions by (att, ts).
      // 💾 slot map: per trainer per SLOT, the copy touched last wins.
      const pnr = (prev && prev.nuzRuns) || {};
      const nnr = next.nuzRuns = next.nuzRuns || {};
      Object.keys(pnr).forEach((att) => {
        nnr[att] = nnr[att] || {};
        Object.keys(pnr[att] || {}).forEach((k) => {
          const a = pnr[att][k], b = nnr[att][k];
          if (a && (!b || (a.upd || 0) > (b.upd || 0))) nnr[att][k] = a;
        });
      });
      const pnz = (prev && prev.nuzlocke) || {};
      const nnz = next.nuzlocke = next.nuzlocke || {};
      Object.keys(pnz).forEach((tid) => {
        const mine = pnz[tid], theirs = nnz[tid];
        if (!theirs || (mine && (mine.upd || 0) > (theirs.upd || 0))) nnz[tid] = mine;
      });
      const pnh = (prev && prev.nuzlockeHof) || [];
      const nnh = next.nuzlockeHof = next.nuzlockeHof || [];
      pnh.forEach((r) => { if (!nnh.some((x) => x.att === r.att && x.ts === r.ts)) nnh.push(r); });
      // 🗼 Battle Tower: best is a high-water mark (max); the live streak
      // follows whichever copy was updated last.
      const ptr2 = (prev && prev.tower) || {};
      const ntr2 = next.tower = next.tower || {};
      Object.keys(ptr2).forEach((tid) => {
        const a = ptr2[tid], b = ntr2[tid];
        if (!b) { ntr2[tid] = a; return; }
        if ((a.upd || 0) > (b.upd || 0)) { b.streak = a.streak; b.rStreak = a.rStreak || 0; b.upd = a.upd; }
        b.best = Math.max(b.best || 0, a.best || 0);
        b.rBest = Math.max(b.rBest || 0, a.rBest || 0);
      });
      // 🏆 Champions Tournament titles: keep the higher count per trainer.
      const ptw = (prev && prev.tourneyWins) || {};
      const ntw = next.tourneyWins = next.tourneyWins || {};
      Object.keys(ptw).forEach((tid) => { ntw[tid] = Math.max(ntw[tid] || 0, ptw[tid] || 0); });
      // 🏰 Gauntlet clears: per trainer per region — keep the HARDER mode
      // (fixed / one-squad beats fresh / swap-squads).
      const harder = (a, b) => (a === "fixed" || b === "fixed") ? "fixed" : (a || b);
      const pgn = (prev && prev.gauntlets) || {};
      const ngn = next.gauntlets = next.gauntlets || {};
      Object.keys(pgn).forEach((tid) => {
        const dst = ngn[tid] = ngn[tid] || {};
        Object.keys(pgn[tid] || {}).forEach((reg) => { dst[reg] = harder(dst[reg], pgn[tid][reg]); });
      });
      // ⚔ League gauntlet runs (Elite Four → Champion in one go): same rule.
      const plr = (prev && prev.leagueRuns) || {};
      const nlr = next.leagueRuns = next.leagueRuns || {};
      Object.keys(plr).forEach((tid) => {
        const dst = nlr[tid] = nlr[tid] || {};
        Object.keys(plr[tid] || {}).forEach((reg) => { dst[reg] = harder(dst[reg], plr[tid][reg]); });
      });
      // ❓ Jeopardy board is versioned content (like admin config) — keep
      // whichever side has the newer deck so a phone on an older version can't
      // downgrade the questions for everyone.
      const pj = (prev && prev.jeopardy) || {}, nj = next.jeopardy = next.jeopardy || {};
      const pv = (pj.board && pj.board.version) || 0, nv = (nj.board && nj.board.version) || 0;
      if (pj.board && pv > nv) { nj.board = pj.board; nj.used = {}; nj.finalDone = false; nj.round = pj.round || 0; }
      // ⏸ Break timer: a single shared value — keep whichever side was set most
      // recently (a newer set OR clear wins) so a lagging phone can't resurrect a
      // stale timer or wipe a fresh one.
      const pbrk = prev && prev.break, nbrk = next.break;
      if (pbrk && (!nbrk || (pbrk.set || 0) > (nbrk.set || 0))) next.break = pbrk;
      // 🛠 Admin config (party info / teams / events) is EDITED, not append-only,
      // so a union won't do — but a device still holding STALE config must never
      // revert a newer edit via last-write-wins. Every config edit bumps
      // `configRev`; here we keep whichever side was edited most recently, so an
      // organizer's team/event changes stop getting wiped by a lagging phone.
      const pRev = (prev && prev.configRev) || 0;
      const nRev = next.configRev || 0;
      if (pRev > nRev) {
        if (prev.party) next.party = prev.party;
        if (prev.teams) next.teams = prev.teams;
        if (prev.events) next.events = prev.events;
        next.configRev = pRev;
      }
      // 🏛 Hall of Fame: append-only enshrinements — union by attendee + timestamp.
      const phof = (prev && prev.hof) || [];
      const nhof = next.hof = next.hof || [];
      const hseen = {}; nhof.forEach((h) => { if (h) hseen[(h.attId || "") + ":" + (h.ts || "")] = 1; });
      phof.forEach((h) => { if (!h) return; const k = (h.attId || "") + ":" + (h.ts || ""); if (!hseen[k]) { nhof.push(h); hseen[k] = 1; } });
      // ✨ dex variant ownership: union have / haveShiny / seen per trainer, so
      // a shiny (or normal) you caught stays owned even if the catch record
      // itself got last-write-clobbered — the dex + encounter table read these.
      const pt = (prev && prev.pokedex && prev.pokedex.trainers) || {};
      next.pokedex = next.pokedex || { active: "", trainers: {}, log: [], given: 0, taken: 0 };
      next.pokedex.trainers = next.pokedex.trainers || {};
      Object.keys(pt).forEach((tid) => {
        const src = pt[tid]; if (!src) return;
        const dst = next.pokedex.trainers[tid] = next.pokedex.trainers[tid] || { caught: {}, team: [], catches: 0 };
        ["have", "haveShiny", "seen"].forEach((k) => {
          if (!src[k]) return;
          dst[k] = dst[k] || {};
          Object.keys(src[k]).forEach((id) => { if (src[k][id]) dst[k][id] = 1; });
        });
        // 🟣 Master Balls spent: monotonic — the higher count wins.
        if (src.mballUsed) dst.mballUsed = Math.max(dst.mballUsed || 0, src.mballUsed);
        // 🌩 Storm races won: monotonic too.
        if (src.roamWins) dst.roamWins = Math.max(dst.roamWins || 0, src.roamWins);
      });
      // 📬 trade offers: the inbox lives in the last-write-wins doc, so an offer
      // one phone just sent would be wiped by the next phone's push. Union by id
      // and let a TERMINAL status win (accepted/declined/cancelled beats open),
      // so offers survive concurrent writes without ever re-opening a closed one.
      const po = (prev && prev.pokedex && prev.pokedex.offers) || [];
      const no = next.pokedex.offers = next.pokedex.offers || [];
      const seen = {}; no.forEach((o) => { if (o && o.id) seen[o.id] = o; });
      const rank = (st) => (st && st !== "open" ? 1 : 0);   // 0 open, 1 terminal
      po.forEach((o) => {
        if (!o || !o.id) return;
        const ex = seen[o.id];
        if (!ex) { no.push(o); seen[o.id] = o; }
        else if (rank(o.status) > rank(ex.status)) ex.status = o.status;
      });
      if (no.length > 60) next.pokedex.offers = no.slice(0, 60);
    },
  };

  // Seed partner ownership at boot (idempotent; persists only if it changed).
  if (Store.fixupPartners(Store.state)) Store.persist();

  window.Store = Store;
})();
