/* badges.js — Gym Badges: 8 awardable badges with a reason to earn + a power. */
(function () {
  const { el, contrast } = U;

  function thumb(a) {
    const s = a && a.favoriteId ? Store.sprite(a.favoriteId) : "";
    if (a && a.photo) return el("img", { class: "draft-thumb", src: a.photo, alt: a.name });
    return s
      ? el("img", { class: "draft-thumb", src: s, alt: a.favorite || "" })
      : el("span", { class: "draft-thumb-ball" });
  }

  function openPicker(title, onPick) {
    const people = Store.state.attendees;
    if (!people.length) { alert("Add trainers first (Squad page)."); return; }
    const grid = el("div", { class: "pick-grid" }, people.map((a) =>
      el("button", { class: "pick-item", onClick: () => { ctrl.close(); onPick(a); } }, [
        thumb(a),
        el("span", { class: "pick-name" }, a.name),
        el("span", { class: "pick-fav" }, a.favorite || a.role || ""),
      ])
    ));
    const ctrl = Modal.open(title, grid, null, {});
  }

  function badgeCard(b) {
    const fg = contrast(b.color);
    const holder = b.holder ? Store.attendee(b.holder) : null;

    const holderArea = holder
      ? el("div", { class: "badge-holder held" + (b.used ? " used" : "") }, [
          thumb(holder),
          el("div", { class: "badge-holder-main" }, [
            el("div", { class: "badge-holder-name" }, holder.name),
            el("div", { class: "badge-holder-status" }, b.used ? "⚑ Power used" : "Power ready"),
          ]),
        ])
      : el("div", { class: "badge-holder" }, el("span", { class: "badge-unclaimed" }, "Unclaimed"));

    const actions = holder
      ? el("div", { class: "badge-actions" }, [
          el("button", { class: "btn subtle sm", onClick: () => {
            Store.update((s) => { const x = s.gymBadges.find((g) => g.id === b.id); x.used = !x.used; });
            Router.render();
          } }, b.used ? "Mark ready" : "Mark used"),
          el("button", { class: "btn subtle sm", onClick: () => award(b.id) }, "Reassign"),
          el("button", { class: "btn danger sm", onClick: () => {
            Store.update((s) => { const x = s.gymBadges.find((g) => g.id === b.id); x.holder = ""; x.used = false; });
            Router.render();
          } }, "Clear"),
        ])
      : el("div", { class: "badge-actions" }, [
          el("button", { class: "btn primary sm", onClick: () => award(b.id) }, "🏅 Award badge"),
        ]);

    // Icon precedence: user-supplied file (b.icon) > built-in SVG > emoji disc.
    const icon = b.icon || (window.BADGE_ICONS && window.BADGE_ICONS[b.id]) || "";
    const disc = icon
      ? el("div", { class: "gym-badge-disc has-img" },
          el("img", { class: "gym-badge-img", src: icon, alt: b.name }))
      : el("div", { class: "gym-badge-disc", style: { background: b.color, color: fg } }, b.emoji || "🏅");

    return el("div", { class: "gym-badge" + (holder ? " claimed" : "") }, [
      el("div", { class: "gym-badge-top" }, [
        disc,
        el("div", { class: "gym-badge-name" }, b.name),
        el("button", { class: "gym-badge-edit", title: "Edit badge", onClick: () => editBadge(b.id) }, "✎"),
      ]),
      el("div", { class: "gym-badge-row" }, [
        el("span", { class: "gym-badge-label" }, "Earn it"),
        el("span", { class: "gym-badge-text" }, b.earn || ""),
      ]),
      el("div", { class: "gym-badge-row power" }, [
        el("span", { class: "gym-badge-label" }, "⚡ Power"),
        el("span", { class: "gym-badge-text" }, b.power || ""),
      ]),
      holderArea,
      actions,
    ]);
  }

  // Edit a badge's name, earn condition and power — state-backed, so edits
  // persist and sync to the room.
  function editBadge(badgeId) {
    const b = Store.state.gymBadges.find((g) => g.id === badgeId);
    if (!b) return;
    const nameIn = el("input", { class: "in", value: b.name || "" });
    const earnIn = el("textarea", { class: "in", rows: 2 });
    earnIn.value = b.earn || "";
    const powerIn = el("textarea", { class: "in", rows: 2 });
    powerIn.value = b.power || "";
    let ctrl;
    const body = el("div", { class: "modal-form" }, [
      el("label", { class: "field" }, [el("span", {}, "Badge name"), nameIn]),
      el("label", { class: "field" }, [el("span", {}, "How to earn it"), earnIn]),
      el("label", { class: "field" }, [el("span", {}, "⚡ Power (what the holder gets to do)"), powerIn]),
      el("div", { class: "toolbar" }, [
        el("button", { class: "btn primary", onClick: () => {
          Store.update((s) => {
            const x = s.gymBadges.find((g) => g.id === badgeId);
            x.name = nameIn.value.trim() || x.name;
            x.earn = earnIn.value.trim();
            x.power = powerIn.value.trim();
          });
          if (ctrl) ctrl.close();
          Router.render();
        } }, "Save"),
        el("button", { class: "btn subtle", onClick: () => { if (ctrl) ctrl.close(); } }, "Cancel"),
      ]),
    ]);
    ctrl = Modal.open("Edit: " + (b.name || "badge"), body, null, {});
  }

  function award(badgeId) {
    const b = Store.state.gymBadges.find((g) => g.id === badgeId);
    openPicker("Award the " + (b ? b.name : "badge") + " to…", (a) => {
      Store.update((s) => {
        const x = s.gymBadges.find((g) => g.id === badgeId);
        x.holder = a.id; x.used = false;
        if (Store.chron) Store.chron(s, "🏅", a.name + " earned the " + (b ? b.name : "badge") + "!");
      });
      if (window.SFX) SFX.win();
      Router.render();
    });
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🏅 Gym Badges"),
      el("p", { class: "page-sub" }, "Eight badges to hand out through the weekend. Each comes with a power." ),
    ]));

    const list = Store.state.gymBadges || [];
    if (!list.length) {
      root.appendChild(el("p", { class: "empty" }, "No badges yet — add some in seed.js."));
      return;
    }

    const claimed = list.filter((b) => b.holder).length;

    // Glossy badge case (Trainer Card style) — earned badges lit + shining.
    root.appendChild(el("div", { class: "badge-case" }, [
      el("div", { class: "badge-case-title" }, "Badge Case · " + claimed + " / " + list.length),
      el("div", { class: "badge-case-grid" }, list.map((b) => {
        const icon = b.icon || (window.BADGE_ICONS && window.BADGE_ICONS[b.id]) || "";
        const earned = !!b.holder;
        return el("div", { class: "case-slot" + (earned ? " earned" : ""), title: b.name },
          [
            el("div", { class: "case-disc", style: { "--bc": b.color || "#888" } }, [
              icon ? el("img", { class: "case-img", src: icon, alt: b.name })
                   : el("span", { class: "case-emoji" }, b.emoji || "🏅"),
              earned ? el("span", { class: "case-shine" }) : null,
            ]),
            earned ? null : el("div", { class: "case-lock" }, "🔒"),
          ]);
      })),
    ]));

    // Live Trophies — auto-earned in the mini-games (Safari, Battle).
    const trophies = Store.liveTrophies();
    if (trophies.length) {
      root.appendChild(el("h2", { class: "section-title" }, "🏅 Live Trophies"));
      root.appendChild(el("p", { class: "hint" }, "Earned automatically in the games — no need to hand these out."));
      root.appendChild(el("div", { class: "trophy-strip" }, trophies.map((t) =>
        el("div", { class: "trophy" }, [
          el("span", { class: "trophy-emoji" }, t.emoji),
          el("div", { class: "trophy-txt" }, [
            el("div", { class: "trophy-title" }, t.title),
            el("div", { class: "trophy-holder" }, t.holder),
            el("div", { class: "trophy-sub" }, t.sub),
          ]),
        ]))));
    }

    root.appendChild(el("h2", { class: "section-title" }, "Award & Powers"));
    root.appendChild(el("div", { class: "gym-badge-grid" }, list.map(badgeCard)));

    root.appendChild(el("div", { class: "toolbar" }, [
      el("button", { class: "btn subtle", onClick: () => {
        if (confirm("Clear all badge holders?")) {
          Store.update((s) => s.gymBadges.forEach((b) => { b.holder = ""; b.used = false; }));
          Router.render();
        }
      } }, "Reset all badges"),
    ]));
  }

  window.Views = window.Views || {};
  window.Views.badges = view;
})();
