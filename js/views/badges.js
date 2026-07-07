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

  // 👑 The Pokémon League — Gen 2 canon: the Elite Four in order, then
  // Champion LANCE. And when someone finally takes the throne… Mt. Silver
  // appears. RED says nothing. Canon teams, even matches, hidden lineups.
  const LEAGUE = [
    { key: "will",  name: "WILL",  rank: "Elite Four", type: "psychic",  team: [178, 124, 103, 80, 178], pts: 6 },
    { key: "koga",  name: "KOGA",  rank: "Elite Four", type: "poison",   team: [168, 49, 205, 89, 169], pts: 6 },
    { key: "bruno", name: "BRUNO", rank: "Elite Four", type: "fighting", team: [237, 106, 107, 95, 68], pts: 6 },
    { key: "karen", name: "KAREN", rank: "Elite Four", type: "dark",     team: [197, 45, 94, 198, 229], pts: 6 },
    { key: "lance", name: "LANCE", rank: "Champion",   type: "dragon",   team: [130, 149, 149, 149, 142, 6], pts: 8 },
    { key: "red",   name: "RED",   rank: "???",        type: "fire",     team: [25, 196, 143, 3, 6, 9], pts: 10 },
  ];
  window.LEAGUE_STAGES = LEAGUE;

  function johtoBadges(attId) {
    let n = 0; for (let i = 0; i < 8; i++) if (Store.gymHolders(i).indexOf(attId) >= 0) n++;
    return n;
  }
  // Why can't this trainer fight stage idx yet? "" = clear to battle.
  function leagueBlocked(attId, idx) {
    const wins = Store.leagueWins(attId);
    if (idx <= 3) {
      if (johtoBadges(attId) < 8) return "The League only admits trainers holding all 8 JOHTO badges (" + johtoBadges(attId) + "/8).";
      if (idx > 0 && wins.indexOf(LEAGUE[idx - 1].key) < 0) return "The Elite Four fall IN ORDER — beat " + LEAGUE[idx - 1].name + " first.";
      return "";
    }
    if (idx === 4) {
      const e4 = ["will", "koga", "bruno", "karen"].every((k) => wins.indexOf(k) >= 0);
      return e4 ? "" : "Champion LANCE only faces trainers who've toppled all four Elite Four.";
    }
    if (wins.indexOf("lance") < 0) return "…the summit is silent. (Beat Champion LANCE first.)";
    if (Store.gymBadgeCount(attId) < 16) return "RED faces only trainers holding ALL 16 badges (" + Store.gymBadgeCount(attId) + "/16).";
    return "";
  }

  function challengeLeague(idx) {
    const st = LEAGUE[idx];
    const size = st.team.length;
    const go = (attId) => {
      const why = leagueBlocked(attId, idx);
      if (why) { alert(why); return; }
      if (Duel.poolFor(attId).length < size) { alert(st.name + " runs " + size + " Pokémon — you need " + size + " of your own."); return; }
      Duel.pickParty({ attId: attId, min: size, max: size,
        title: "vs " + (idx === 5 ? "RED" : st.rank + " " + st.name) + " — pick EXACTLY " + size,
        hint: idx === 5 ? "The silent trainer of Mt. Silver. " + size + " vs " + size + "." : "Even match: " + size + " vs " + size + ". The lineup is hidden.",
        onDone: (ids) => {
          Duel.start({ mode: "local",
            title: idx === 5 ? "Mt. Silver" : "the Pokémon League",
            league: { idx: idx, key: st.key, name: st.name, rank: st.rank, pts: st.pts },
            a: { units: [{ attId: attId, monIds: ids }] },
            b: { units: [{ npc: idx === 5 ? "RED" : st.rank.toUpperCase() + " " + st.name, ai: true, monIds: st.team.slice() }] },
            onResult: () => Router.render() });
        } });
    };
    const me = window.Sync && Sync.getMe && Sync.getMe();
    if (me) go(me); else openPicker("Who challenges " + st.name + "?", (a) => go(a.id));
  }

  function leagueCard(idx) {
    const st = LEAGUE[idx];
    const beat = Store.state.attendees.filter((a) => Store.leagueWins(a.id).indexOf(st.key) >= 0);
    const ico = U.energyIcon(st.type);
    const isRed = idx === 5;
    return el("div", { class: "gymc-card league" + (isRed ? " red-card" : "") + (beat.length ? " earned" : "") }, [
      el("div", { class: "gymc-head" }, [
        ico && !isRed ? el("img", { class: "gymc-ico", src: ico, alt: st.type }) : (isRed ? el("span", { class: "gymc-ico red-q" }, "🗻") : null),
        el("div", { class: "gymc-names" }, [
          el("div", { class: "gymc-badge" }, isRed ? "Mt. Silver" : st.rank + " " + st.name),
          el("div", { class: "gymc-leader" }, isRed
            ? "A silent trainer waits at the summit · team of 6 (hidden)"
            : (idx === 4 ? "The final test" : "League gauntlet #" + (idx + 1)) + " · team of " + st.team.length + " (hidden)"),
        ]),
      ]),
      beat.length
        ? el("div", { class: "gymc-holders" }, beat.map((a) =>
            el("span", { class: "gymc-holder", onClick: () => window.Profile && Profile.open(a.id) }, (isRed ? "🗻 " : "👑 ") + a.name)))
        : el("div", { class: "gymc-holders none" }, isRed ? "…" : "Unbeaten"),
      el("button", { class: "btn primary sm", onClick: () => challengeLeague(idx) },
        (isRed ? "🗻 Face RED" : "👑 Challenge " + st.name) + " (" + st.team.length + "v" + st.team.length + ")"),
    ]);
  }

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

    // ---- 👑 the Pokémon League ----
    root.appendChild(el("h2", { class: "section-title" }, "👑 The Pokémon League"));
    root.appendChild(el("p", { class: "hint" },
      "All 8 JOHTO badges get you in. The Elite Four fall in order, then Champion LANCE — canon teams, even matches, hidden lineups. And the stories say something waits beyond…"));
    // RED stays completely hidden until someone has actually beaten LANCE.
    const anyLance = Store.state.attendees.some((a) => Store.leagueWins(a.id).indexOf("lance") >= 0);
    const stages = anyLance ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4];
    root.appendChild(el("div", { class: "gymc-grid" }, stages.map((i) => leagueCard(i))));

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
