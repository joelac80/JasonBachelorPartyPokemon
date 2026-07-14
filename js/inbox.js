/* inbox.js — 📬 the per-phone alert inbox. A small localStorage log (this
   phone's view of the world — never synced) that collects everything that
   happened TO you: trade offers arriving, your offers being accepted or
   declined, battle challenges coming in, and your challenges being turned
   down. The 📬 header button carries the unread count; the Alerts page
   (#/inbox) lists the log and marks it read. Capped at 50 entries. */
(function () {
  const KEY = "jasonBachHub.inbox.v1";
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "[]") || []; } catch (_) { return []; } }
  function save(list) { try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50))); } catch (_) {} }
  function now() { try { return Date.now(); } catch (_) { return 0; } }

  window.Inbox = {
    log(emoji, text, link) {
      const list = load();
      list.unshift({ emoji: emoji || "🔔", text: String(text || ""), link: link || "", ts: now(), read: 0 });
      save(list);
      if (window.updateInboxBadge) try { updateInboxBadge(); } catch (_) {}
    },
    list: load,
    unread() { return load().filter((e) => !e.read).length; },
    markAllRead() {
      save(load().map((e) => Object.assign(e, { read: 1 })));
      if (window.updateInboxBadge) try { updateInboxBadge(); } catch (_) {}
    },
  };
})();
