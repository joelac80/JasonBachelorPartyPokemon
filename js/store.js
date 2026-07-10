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
        board: clone(seed.jeopardyBoard || { categories: [], final: {} }),
        used: {},          // used["cat-clue"] = true
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
        jeopardy: Object.assign(base.jeopardy, parsed.jeopardy || {}),
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

    // ---- Convenience selectors -------------------------------------------
    team(id) { return this.state.teams.find((t) => t.id === id) || null; },
    attendee(id) { return this.state.attendees.find((a) => a.id === id) || null; },

    // Offline Pokemon sprite (base64 data URI) for a National Dex id, or "".
    sprite(id) { return (window.SPRITES && window.SPRITES[id]) || (window.DEX_SPRITES && window.DEX_SPRITES[id]) || ""; },

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
    // How many species the dex is measured against right now — 493 until the
    // room unlocks the later gens, then the whole National Dex.
    dexTarget() {
      return this.gen59Unlocked() ? (Object.keys(window.DEX || {}).length || this.GEN14_MAX) : this.GEN14_MAX;
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
