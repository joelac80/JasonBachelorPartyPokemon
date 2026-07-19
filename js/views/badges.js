/* badges.js — 🎖 the awards floor. Three layers:
   1. TIERED ACHIEVEMENTS (auto): Bronze → Silver → Gold → Platinum across
      every system we've built — catching, gyms, leagues, duels, the tower,
      nuzlockes, films, legends, the Trainer Dex. Computed live, never
      hand-awarded; platinum is completion-grade on purpose.
   2. Weekend Badges (hand-awarded): 8 party badges with earn + power.
   3. Live trophies: one holder each, follows the current leader. */
(function () {
  const { el, contrast } = U;

  let achMe = "";   // per-phone: whose achievement card wall is open

  const TIER_CLASS = ["none", "bronze", "silver", "gold", "platinum"];
  function achCard(a) {
    const t = a.tier;
    const pct = a.next ? Math.min(100, Math.round((a.value / a.next) * 100)) : 100;
    return el("div", { class: "ach-card t-" + TIER_CLASS[t] }, [
      el("div", { class: "ach-top" }, [
        el("div", { class: "ach-disc " + TIER_CLASS[t] }, a.emoji),
        el("div", { class: "ach-main" }, [
          el("div", { class: "ach-title" }, a.title),
          el("div", { class: "ach-tiername" + (t ? " on" : "") }, t ? a.tierName : "Unranked"),
        ]),
        el("div", { class: "ach-dots" }, [1, 2, 3, 4].map((i) =>
          el("span", { class: "ach-dot " + (i <= t ? TIER_CLASS[i] : "") }))),
      ]),
      el("div", { class: "ach-bar" }, [el("div", { class: "ach-fill " + TIER_CLASS[Math.min(4, t + 1)], style: { width: pct + "%" } })]),
      el("div", { class: "ach-sub" }, a.steps
        ? (t >= 4 ? "🏆 ALL THREE ultimate runs — nothing harder exists." : "Next: " + a.steps[t])
        : (t >= 4 ? "🏆 MAXED — " + a.value + " " + a.unit : a.value + " / " + a.next + " " + a.unit + " → " + Store.ACH_TIERS[t + 1])),
    ]);
  }

  // 🏆 The room board — everyone ranked by achievement score (🥉1 🥈2 🥇3 💎5).
  function achievementsSection(root) {
    const meId = (window.Sync && Sync.getMe && Sync.getMe()) || "";
    if (!achMe && meId && Store.attendee(meId)) achMe = meId;
    if (!achMe && Store.state.attendees.length) achMe = Store.state.attendees[0].id;

    root.appendChild(el("h2", { class: "section-title" }, "🎖 Tiered Achievements"));
    root.appendChild(el("p", { class: "hint" }, "Bronze → Silver → Gold → Platinum, earned automatically by playing — no handing out. Platinum means COMPLETION: the whole dex, every badge, every stage, all three ultimate nuzlockes."));

    const rows = Store.state.attendees
      .map((a) => ({ a: a, score: Store.achievementScore(a.id), plats: Store.achievementsFor(a.id).filter((x) => x.tier === 4).length }))
      .sort((x, y) => (y.score - x.score) || (y.plats - x.plats));
    if (rows.length > 1 || (rows.length === 1 && rows[0].score > 0)) {
      root.appendChild(el("div", { class: "ach-board" }, rows.map((r, i) =>
        el("button", { class: "ach-board-row" + (r.a.id === achMe ? " on" : ""), onClick: () => { achMe = r.a.id; Router.render(); } }, [
          el("span", { class: "ach-board-rank" }, i === 0 && r.score > 0 ? "👑" : "#" + (i + 1)),
          el("span", { class: "ach-board-name" }, r.a.name),
          el("span", { class: "ach-board-score" }, r.score + " pts" + (r.plats ? " · 💎" + r.plats : "")),
        ]))));
    }

    if (!achMe) { root.appendChild(el("p", { class: "empty" }, "Add trainers first (Squad page).")); return; }
    const who = Store.attendee(achMe);
    root.appendChild(el("p", { class: "hint" }, "🎴 " + ((who && who.name) || "") + "'s wall — tap a name above to compare."));
    root.appendChild(el("div", { class: "ach-grid" }, Store.achievementsFor(achMe).map(achCard)));
  }

  function thumb(a) {
    const s = a ? Store.favSprite(a) : "";
    if (a && a.photo) return el("img", { class: "draft-thumb", src: a.photo, alt: a.name });
    return s
      ? el("img", { class: "draft-thumb", src: s, alt: a.favorite || "" })
      : el("span", { class: "draft-thumb-ball" });
  }

  function openPicker(title, onPick) {
    const people = Store.state.attendees;
    if (!people.length) { U.toast("Add trainers first (Squad page)."); return; }
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
      el("h1", {}, "🎖 Badges & Achievements"),
      el("p", { class: "page-sub" }, "Bronze → Silver → Gold → Platinum achievements earned by PLAYING — catching, battling, the tower, the nuzlockes, the films — plus the hand-awarded party badges and the live trophies." ),
    ]));

    // 🎖 The tiered wall — auto-earned, the room board on top.
    achievementsSection(root);

    // Pokémon battling lives in The Journey now.
    root.appendChild(el("div", { class: "duel-belt", onClick: () => { location.hash = "#/regions"; } },
      "⚔ Looking for the Gym Leaders? Every region's gyms, Elite Four & Champion live in THE JOURNEY →"));

    root.appendChild(el("h2", { class: "section-title" }, "🏅 Party Badges (hand-awarded)"));

    const list = Store.state.gymBadges || [];
    if (!list.length) {
      root.appendChild(el("p", { class: "empty" }, "No party badges in this room yet — new rooms start with 8."));
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
        U.ask("Clear all badge holders?", { icon: "⚠️", danger: true }, () => {
          Store.update((s) => s.gymBadges.forEach((b) => { b.holder = ""; b.used = false; }));
          Router.render();
        });
      } }, "Reset all badges"),
    ]));
  }

  window.Views = window.Views || {};
  window.Views.badges = view;
})();
