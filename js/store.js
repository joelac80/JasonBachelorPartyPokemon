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
    sprite(id) { return (window.SPRITES && window.SPRITES[id]) || ""; },

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
      const cc = (id) => (tr[id] ? Object.keys(tr[id].caught || {}).length : 0);
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
      return out;
    },

    // ---- Chronicle + Drinks ----------------------------------------------
    // Push a chronicle moment INSIDE an existing update(s). Newest first.
    chron(s, icon, text) {
      s.chronicle = s.chronicle || [];
      s.chronicle.unshift({ ts: (function () { try { return Date.now(); } catch (_) { return 0; } })(), icon: icon, text: text });
      if (s.chronicle.length > 500) s.chronicle.length = 500;
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
      });
    },

    // Distinct named drinks logged, with counts (for the "what we drank" list).
    drinkLabels() {
      const by = {};
      (this.state.drinks || []).forEach((d) => { if (d.label) { const k = d.type + "|" + d.label; (by[k] = by[k] || { type: d.type, label: d.label, n: 0 }).n++; } });
      return Object.keys(by).map((k) => by[k]).sort((a, b) => b.n - a.n);
    },

    // ---- Predictions / Oracle --------------------------------------------
    addPrediction(q, options, byName) {
      q = (q || "").trim();
      const opts = (options || []).map((t) => ({ id: "o" + Math.random().toString(36).slice(2), text: (t || "").trim() })).filter((o) => o.text);
      if (!q || opts.length < 2) return false;
      const stamp = function () { try { return Date.now(); } catch (_) { return 0; } };
      this.update((s) => {
        s.predictions = s.predictions || [];
        s.predictions.unshift({ id: "pr" + Math.random().toString(36).slice(2), q: q, options: opts, votes: {}, closed: false, answer: "", by: byName || "", ts: stamp() });
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
          const head = game === "ridebus" ? "🚌 " + who + " rode the bus" : (game === "kings" ? "👑 " + who : who);
          this.chron(s, "🃏", head + (note ? " — " + note : ""));
        } else {
          this.chron(s, "🃏", note);
        }
      });
      return true;
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
      const keepPhotos = this.state.photos || [];   // photos aren't in the synced doc
      this.state = Object.assign(freshState(), obj);
      if (!obj.photos || !obj.photos.length) this.state.photos = keepPhotos;
      this.persist();
      this._subs.forEach((fn) => fn(this.state));
    },
  };

  window.Store = Store;
})();
