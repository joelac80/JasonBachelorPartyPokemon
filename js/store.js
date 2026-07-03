/*
 * store.js — tiny state container with localStorage persistence.
 * Exposes a global `Store`. No frameworks, no build step.
 */
(function () {
  const KEY = "jasonBachHub.v2";

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
      ["safari", "battle", "jeopardy"].forEach((b) => { if (s[b] && s[b][teamId]) n += s[b][teamId]; });
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
      this.state = Object.assign(freshState(), obj);
      this.persist();
      this._subs.forEach((fn) => fn(this.state));
    },
  };

  window.Store = Store;
})();
