/* draft.js — captain-driven draft board. Set a captain per team column, then
   draft undrafted trainers (shown as their Pokemon sprites) into the column. */
(function () {
  const { el, contrast } = U;

  function undrafted() {
    return Store.state.attendees.filter((a) => !a.team);
  }

  // Small sprite thumbnail (favorite Pokemon) or a poke ball fallback.
  function thumb(a) {
    const s = a.favoriteId ? Store.sprite(a.favoriteId) : "";
    return s
      ? el("img", { class: "draft-thumb", src: s, alt: a.favorite || "", title: a.favorite || "" })
      : el("span", { class: "draft-thumb-ball" });
  }

  // Modal picker of undrafted trainers. onPick(attendee) fires on click.
  function openPicker(title, onPick) {
    const und = undrafted();
    if (!und.length) { U.toast("Everyone's already on a team 🎉"); return; }
    const grid = el("div", { class: "pick-grid" }, und.map((a) =>
      el("button", { class: "pick-item", onClick: () => { picked = a; ctrl.close(); onPick(a); } }, [
        thumb(a),
        el("span", { class: "pick-name" }, a.name),
        el("span", { class: "pick-fav" }, a.favorite || a.type || ""),
      ])
    ));
    let picked = null;
    const ctrl = Modal.open(title, grid, null, { });
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🎡 Draft Board"),
      el("p", { class: "page-sub" }, "Set a captain for each team, then draft trainers into the columns." ),
    ]));

    const teams = Store.state.teams;
    if (!teams.length) {
      root.appendChild(el("p", { class: "empty" }, "Add teams in Settings first."));
      return;
    }

    const board = el("div", { class: "board-teams draft-cols" });

    function memberRow(a, isCaptain) {
      return el("div", { class: "draft-member" + (isCaptain ? " captain" : "") }, [
        thumb(a),
        el("div", { class: "draft-member-main" }, [
          el("span", { class: "draft-member-name" }, a.name),
          isCaptain ? el("span", { class: "captain-tag" }, "★ CAPTAIN") : null,
        ]),
        el("button", { class: "x", title: isCaptain ? "Remove captain" : "Remove", onClick: () => {
          Store.update((s) => {
            const rec = s.attendees.find((x) => x.id === a.id);
            if (rec) rec.team = "";
            const t = s.teams.find((x) => x.id === a.team);
            if (t && t.captain === a.id) t.captain = "";
          });
          render();
        } }, "×"),
      ]);
    }

    function render() {
      board.innerHTML = "";
      teams.forEach((t) => {
        const members = Store.roster(t.id);
        const captain = t.captain ? Store.attendee(t.captain) : null;
        const others = members.filter((m) => !captain || m.id !== captain.id);

        const col = el("div", { class: "board-team draft-col", style: { borderColor: t.color } }, [
          el("div", { class: "board-team-head", style: { background: t.color, color: contrast(t.color) } },
            [U.teamIcon(t), " " + t.name + " (" + members.length + ")"]),
          el("div", { class: "draft-captain-slot" },
            captain
              ? memberRow(captain, true)
              : el("button", { class: "btn subtle sm set-captain", onClick: () =>
                  openPicker("Choose captain for " + t.name, (a) => {
                    Store.update((s) => {
                      const rec = s.attendees.find((x) => x.id === a.id);
                      if (rec) rec.team = t.id;
                      s.teams.find((x) => x.id === t.id).captain = a.id;
                    });
                    render();
                  }) }, "＋ Set captain")),
          el("div", { class: "draft-members" },
            others.length
              ? others.map((m) => memberRow(m, false))
              : el("div", { class: "board-empty" }, captain ? "— draft players —" : "")),
          el("button", { class: "btn primary sm draft-add", onClick: () =>
            openPicker("Draft a trainer to " + t.name, (a) => {
              Store.update((s) => {
                const rec = s.attendees.find((x) => x.id === a.id);
                if (rec) rec.team = t.id;
              });
              render();
            }) }, "＋ Draft player"),
        ]);
        board.appendChild(col);
      });
    }

    const pool = el("div", { class: "undrafted" });
    function renderPool() {
      pool.innerHTML = "";
      const und = undrafted();
      pool.appendChild(el("h3", {}, "Undrafted (" + und.length + ")"));
      pool.appendChild(el("div", { class: "pool-grid" },
        und.length
          ? und.map((a) => el("div", { class: "pool-chip" }, [thumb(a), el("span", {}, a.name)]))
          : el("span", { class: "board-empty" }, "Everyone's on a team 🎉")));
    }

    // Re-render both board + pool together.
    const origRender = render;
    render = function () { origRender(); renderPool(); };

    root.appendChild(board);
    root.appendChild(pool);

    root.appendChild(el("div", { class: "toolbar" }, [
      el("button", { class: "btn subtle", onClick: () => {
        U.ask("Clear all team assignments and captains?", { icon: "⚠️", danger: true }, () => {
          Store.update((s) => {
            s.attendees.forEach((a) => (a.team = ""));
            s.teams.forEach((t) => (t.captain = ""));
          });
          render();
        });
      } }, "Clear draft"),
      el("button", { class: "btn subtle", onClick: () => { autoBalance(); render(); } }, "⚖️ Auto-balance rest"),
    ]));

    render();
  }

  // Evenly distribute the remaining undrafted trainers (fills smallest team first).
  function autoBalance() {
    Store.update((s) => {
      const und = s.attendees.filter((a) => !a.team);
      for (let i = und.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [und[i], und[j]] = [und[j], und[i]];
      }
      und.forEach((a) => {
        const counts = s.teams.map((t) => ({ id: t.id, n: s.attendees.filter((x) => x.team === t.id).length }));
        counts.sort((x, y) => x.n - y.n);
        a.team = counts[0].id;
      });
    });
  }

  window.Views = window.Views || {};
  window.Views.draft = view;
})();
