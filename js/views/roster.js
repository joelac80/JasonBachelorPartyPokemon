/* roster.js — Pokemon-style trainer cards for each attendee. */
(function () {
  const { el, typeColor, contrast, uid } = U;

  function card(a) {
    const color = typeColor(a.type);
    const team = a.team ? Store.team(a.team) : null;

    return el("div", { class: "trainer-card", style: { "--type": color } }, [
      el("div", { class: "tc-top", style: { background: color, color: contrast(color) } }, [
        el("span", { class: "tc-name" }, a.name || "Trainer"),
        el("span", { class: "tc-hp" }, (a.role || "").toUpperCase()),
      ]),
      el("div", { class: "tc-portrait" }, [
        el("div", { class: "tc-ball" }, "◓"),
        a.nickname ? el("div", { class: "tc-nick" }, "“" + a.nickname + "”") : null,
      ]),
      el("div", { class: "tc-body" }, [
        el("div", { class: "tc-type" }, [
          el("span", { class: "tc-type-dot", style: { background: color } }),
          (a.type || "normal").toUpperCase() + " TYPE",
        ]),
        team
          ? el("div", { class: "tc-team", style: { color: team.color } },
              (team.emoji || "") + " " + team.name)
          : el("div", { class: "tc-team undr" }, "Free Agent"),
        a.catchphrase
          ? el("div", { class: "tc-move" }, [
              el("span", { class: "tc-move-label" }, "Signature Move"),
              el("span", { class: "tc-move-text" }, a.catchphrase),
            ])
          : null,
      ]),
      el("button", { class: "tc-edit", title: "Edit", onClick: () => editCard(a.id) }, "✎"),
    ]);
  }

  function editCard(id) {
    const a = Store.attendee(id);
    if (!a) return;
    const types = Object.keys(U.TYPE_COLORS);
    const field = (label, key, opts) => {
      const input = opts
        ? el("select", { class: "in" },
            opts.map((o) => el("option", { value: o, selected: a[key] === o ? "true" : null }, o)))
        : el("input", { class: "in", value: a[key] || "" });
      input.dataset.key = key;
      return el("label", { class: "field" }, [el("span", {}, label), input]);
    };

    const teamOpts = [""].concat(Store.state.teams.map((t) => t.id));
    const teamSelect = el("select", { class: "in" },
      teamOpts.map((tid) => el("option", { value: tid, selected: (a.team || "") === tid ? "true" : null },
        tid ? (Store.team(tid) ? Store.team(tid).name : tid) : "— Free Agent —")));
    teamSelect.dataset.key = "team";

    const form = el("div", { class: "modal-form" }, [
      field("Name", "name"),
      field("Nickname", "nickname"),
      field("Role", "role"),
      field("Type", "type", types),
      el("label", { class: "field" }, [el("span", {}, "Team"), teamSelect]),
      field("Signature move / catchphrase", "catchphrase"),
    ]);

    Modal.open("Edit Trainer", form, () => {
      Store.update((s) => {
        const rec = s.attendees.find((x) => x.id === id);
        form.querySelectorAll("[data-key]").forEach((inp) => {
          rec[inp.dataset.key] = inp.value;
        });
      });
      Router.render();
    });
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🎴 Trainer Cards"),
      el("p", { class: "page-sub" }, "The crew. Tap ✎ to edit a card."),
    ]));

    const list = Store.state.attendees;
    root.appendChild(el("div", { class: "card-grid" }, list.map(card)));

    root.appendChild(el("div", { class: "toolbar" }, [
      el("button", { class: "btn primary", onClick: () => {
        const id = uid("trainer");
        Store.update((s) => s.attendees.push({
          id, name: "New Trainer", nickname: "", team: "", type: "normal",
          role: "Attendee", catchphrase: "",
        }));
        Router.render();
        setTimeout(() => editCard(id), 30);
      } }, "+ Add trainer"),
    ]));
  }

  window.Views = window.Views || {};
  window.Views.roster = view;
})();
