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

  // 🏟 The Gym Circuit — the 16 canon Gen 2 leaders (Johto, then the
  // Kanto rematch tour), canon teams. EVEN MATCH: you bring exactly as many
  // Pokémon as the leader runs, and their lineup stays hidden until each one
  // comes out of its ball. Everyone can earn every badge (no stealing).
  const GYMS = [
    { leader: "FALKNER",   badge: "Zephyr",   type: "flying",   team: [16, 17] },
    { leader: "BUGSY",     badge: "Hive",     type: "bug",      team: [11, 14, 123] },
    { leader: "WHITNEY",   badge: "Plain",    type: "normal",   team: [35, 241] },
    { leader: "MORTY",     badge: "Fog",      type: "ghost",    team: [92, 93, 93, 94] },
    { leader: "CHUCK",     badge: "Storm",    type: "fighting", team: [57, 62] },
    { leader: "JASMINE",   badge: "Mineral",  type: "steel",    team: [81, 81, 208] },
    { leader: "PRYCE",     badge: "Glacier",  type: "ice",      team: [86, 87, 221] },
    { leader: "CLAIR",     badge: "Rising",   type: "dragon",   team: [148, 148, 148, 230] },
    { leader: "BROCK",     badge: "Boulder",  type: "rock",     team: [75, 111, 139, 95, 141] },
    { leader: "MISTY",     badge: "Cascade",  type: "water",    team: [55, 195, 131, 121] },
    { leader: "LT. SURGE", badge: "Thunder",  type: "electric", team: [26, 101, 82, 125] },
    { leader: "ERIKA",     badge: "Rainbow",  type: "grass",    team: [114, 189, 182, 71] },
    { leader: "JANINE",    badge: "Soul",     type: "poison",   team: [169, 49, 110, 168] },
    { leader: "SABRINA",   badge: "Marsh",    type: "psychic",  team: [196, 122, 65] },
    { leader: "BLAINE",    badge: "Volcano",  type: "fire",     team: [219, 126, 78] },
    { leader: "BLUE",      badge: "Earth",    type: "ground",   team: [18, 65, 112, 130, 103, 59] },
  ];
  window.GYM_CIRCUIT = GYMS;   // profiles/tests can read the circuit

  function challengeGym(idx) {
    const gym = GYMS[idx];
    const size = gym.team.length;
    const go = (attId) => {
      if (Duel.poolFor(attId).length < size) {
        alert("Leader " + gym.leader + " runs " + size + " Pokémon — you need " + size + " of your own to challenge (catch more in the Safari!).");
        return;
      }
      Duel.pickParty({ attId: attId, min: size, max: size,
        title: "vs Leader " + gym.leader + " — pick EXACTLY " + size,
        hint: "Even match: " + size + " vs " + size + ". The leader's team is HIDDEN until it comes out of the ball.",
        onDone: (ids) => {
          Duel.start({ mode: "local", title: "the " + gym.badge + " Badge Gym", gym: { idx: idx, leader: gym.leader, badge: gym.badge },
            a: { units: [{ attId: attId, monIds: ids }] },
            b: { units: [{ npc: "LEADER " + gym.leader, ai: true, monIds: gym.team.slice() }] },
            onResult: () => Router.render() });
        } });
    };
    const me = window.Sync && Sync.getMe && Sync.getMe();
    if (me) go(me); else openPicker("Who challenges Leader " + gym.leader + "?", (a) => go(a.id));
  }

  function circuitCard(idx) {
    const g = GYMS[idx];
    const holders = Store.gymHolders(idx);
    const ico = U.energyIcon(g.type);
    return el("div", { class: "gymc-card" + (holders.length ? " earned" : "") }, [
      el("div", { class: "gymc-head" }, [
        ico ? el("img", { class: "gymc-ico", src: ico, alt: g.type }) : null,
        el("div", { class: "gymc-names" }, [
          el("div", { class: "gymc-badge" }, g.badge + " Badge"),
          el("div", { class: "gymc-leader" }, "Leader " + g.leader + " · team of " + g.team.length + " (hidden)"),
        ]),
      ]),
      holders.length
        ? el("div", { class: "gymc-holders" }, holders.map((id) => {
            const a = Store.attendee(id);
            return el("span", { class: "gymc-holder", onClick: () => window.Profile && Profile.open(id) }, "🏅 " + (a ? a.name : id));
          }))
        : el("div", { class: "gymc-holders none" }, "No badge holders yet"),
      el("button", { class: "btn primary sm", onClick: () => challengeGym(idx) }, "⚔ Challenge (" + g.team.length + "v" + g.team.length + ")"),
    ]);
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
      el("p", { class: "page-sub" }, "Battle the 16 Gym Leaders of Johto & Kanto for real badges — even matches, hidden teams. The hand-awarded party badges (with powers) live below." ),
    ]));

    // ---- 🏟 the Gym Circuit ----
    root.appendChild(el("h2", { class: "section-title" }, "🏟 Gym Circuit — 16 Leaders"));
    const totalBadges = (Store.state.attendees || []).reduce((n, a) => n + Store.gymBadgeCount(a.id), 0);
    root.appendChild(el("p", { class: "hint" },
      "Even match: bring EXACTLY as many Pokémon as the leader runs — their team stays hidden until each comes out of its ball. Everyone can earn every badge; sweep all 16 to become CHAMPION. Lose = 3 sips." +
      (totalBadges ? " (" + totalBadges + " badge" + (totalBadges > 1 ? "s" : "") + " earned so far.)" : "")));
    root.appendChild(el("div", { class: "gymc-grid" }, GYMS.map((g, i) => circuitCard(i))));

    // The League has its own cinematic page now.
    root.appendChild(el("div", { class: "duel-belt", onClick: () => { location.hash = "#/league"; } },
      "👑 All 8 Johto badges? Victory Road is open — enter the POKÉMON LEAGUE →"));

    root.appendChild(el("h2", { class: "section-title" }, "🏅 Party Badges (hand-awarded)"));

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
