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

  function award(badgeId) {
    const b = Store.state.gymBadges.find((g) => g.id === badgeId);
    openPicker("Award the " + (b ? b.name : "badge") + " to…", (a) => {
      Store.update((s) => {
        const x = s.gymBadges.find((g) => g.id === badgeId);
        x.holder = a.id; x.used = false;
      });
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
    root.appendChild(el("p", { class: "hint" }, claimed + " of " + list.length + " awarded"));
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
