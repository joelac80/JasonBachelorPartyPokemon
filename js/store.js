/*
 * store.js — tiny state container with localStorage persistence.
 * Exposes a global `Store`. No frameworks, no build step.
 */
(function () {
  const KEY = "jasonBachHub.v1";

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
      memes: clone(seed.memes || []),
      // scores[eventId][teamId] = points awarded
      scores: {},
      // draft metadata
      draft: { order: [], picks: [], started: false },
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
  };

  window.Store = Store;
})();
