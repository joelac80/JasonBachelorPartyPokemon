/* roster.js — The Squad: trainer cards grouped by rank, with favorite
   Pokemon sprites and a full TCG-style card on tap. */
(function () {
  const { el, typeColor, contrast, uid, energyIcon } = U;

  const RANK_ORDER = ["Champion", "Elite Four", "Gym Leader"];
  const RANK_LABEL = { "Champion": "★ Champion", "Elite Four": "Elite Four", "Gym Leader": "Gym Leaders" };

  // ---- portrait: photo > current-form sprite (scaled) > poke ball ---------
  function portrait(a) {
    if (a.photo) return el("img", { class: "tc-photo", src: a.photo, alt: a.name });
    const form = Store.currentForm(a);
    const sprite = form.id ? Store.sprite(form.id) : "";
    if (sprite) return el("img", {
      class: "tc-sprite", src: sprite, alt: form.name || a.favorite || "",
      style: form.scale && form.scale !== 1 ? { transform: "scale(" + form.scale + ")" } : null,
    });
    return el("div", { class: "tc-ball-fallback" });
  }

  // Replace one trainer card in place (no full re-render → no scroll jump).
  function refreshCard(id) {
    const node = document.querySelector('.trainer-card[data-aid="' + id + '"]');
    const a = Store.attendee(id);
    if (node && a) node.replaceWith(card(a));
  }

  function doEvolve(a) {
    const before = Store.currentForm(a);
    if (!before.next) return;
    const isMega = !!before.next.mega;
    const verb = isMega ? "Mega Evolved into" : (before.mode === "grow" ? "grew into" : "evolved into");
    // The shared "Squad evolution" cinematic — same silhouette flicker, flash,
    // reveal, energy fireworks and music the caught-Pokémon evolutions use.
    EvoFX.play({
      beforeSrc: before.id ? Store.sprite(before.id) : "",
      afterSrc: before.next.id ? Store.sprite(before.next.id) : "",
      beforeName: before.name, afterName: before.next.name,
      type: a.type, mega: isMega, scale: before.next.scale || 1, verb: verb,
      onComplete: () => { Store.evolve(a.id); refreshCard(a.id); },
    });
  }

  // ---- evolution strip on a trainer card ----------------------------------
  function evoStrip(a) {
    const cfg = Store.evoConfig(a.id);
    if (!cfg || !cfg.stages || cfg.stages.length < 2) return null;
    const form = Store.currentForm(a);
    const pips = el("div", { class: "evo-pips" }, cfg.stages.map((st, i) =>
      el("span", { class: "evo-pip" + (i <= form.stage ? " on" : "") })));

    return el("div", { class: "evo-strip", onClick: (e) => e.stopPropagation() }, [
      el("div", { class: "evo-line" }, [
        el("span", { class: "evo-stage-label" }, "EVOLUTION"),
        pips,
      ]),
      form.next ? el("div", { class: "evo-req" }, "▸ " + (form.next.req || "")) : null,
      el("div", { class: "evo-controls" }, [
        form.stage > 0
          ? el("button", { class: "evo-btn devo", title: "Revert one stage",
              onClick: (e) => { e.stopPropagation(); Store.devolve(a.id); Router.render(); } }, "◂")
          : null,
        form.next
          ? el("button", { class: "evo-btn go" + (form.next.mega ? " mega" : ""), title: "Requirement: " + (form.next.req || ""),
              onClick: (e) => { e.stopPropagation(); doEvolve(a); } },
              (form.next.mega ? "⚡ Mega Evolve" : "Evolve ▸"))
          : el("span", { class: "evo-max" + (form.mega ? " mega" : "") }, form.mega ? "⚡ MEGA FORM" : "★ FINAL FORM"),
      ]),
    ]);
  }

  function card(a) {
    const color = typeColor(a.type);
    const team = a.team ? Store.team(a.team) : null;
    const megaNow = Store.currentForm(a).mega;

    return el("div", {
      class: "trainer-card" + (megaNow ? " mega" : ""), style: { "--type": color },
      dataset: { aid: a.id },
      onClick: (e) => { if (!e.target.closest(".tc-edit")) openCard(a.id); },
    }, [
      el("div", { class: "tc-top" }, [
        el("span", { class: "tc-name" }, a.name || "Trainer"),
        el("span", { class: "tc-hp" }, a.level ? ("LV." + a.level) : (a.role || "").toUpperCase()),
      ]),
      el("div", { class: "tc-portrait" }, [
        portrait(a),
        (function () {
          const form = Store.currentForm(a);
          const label = form.name || a.favorite;
          return label ? el("div", { class: "tc-fav" }, "♥ " + label) : null;
        })(),
      ]),
      el("div", { class: "tc-body" }, [
        el("div", { class: "tc-role" }, (a.role || "").toUpperCase()),
        el("div", { class: "tc-type-line" }, [
          energyIcon(a.type)
            ? el("img", { class: "energy-ico sm", src: energyIcon(a.type), alt: a.type })
            : el("span", { class: "tc-type-dot", style: { background: color } }),
          (a.type || "normal").toUpperCase() + " TYPE",
        ]),
        team
          ? el("div", { class: "tc-team", style: { color: team.color } }, (team.emoji || "") + " " + team.name)
          : el("div", { class: "tc-team undr" }, "Free Agent"),
        a.nickname ? el("div", { class: "tc-nick" }, "“" + a.nickname + "”") : null,
        evoStrip(a),
      ]),
      el("button", { class: "tc-edit", title: "Edit", onClick: () => editCard(a.id) }, "✎"),
      el("button", { class: "tc-profile", title: "Trainer profile",
        onClick: (e) => { e.stopPropagation(); if (window.Profile) Profile.open(a.id); } }, "ⓘ"),
    ]);
  }

  // ---- full TCG-style card (shown in a modal) -----------------------------
  function energy(cost, type) {
    const row = el("span", { class: "tcg-move-energy" });
    const ico = energyIcon(type);
    for (let i = 0; i < (cost || 0); i++) {
      row.appendChild(ico
        ? el("img", { class: "energy-ico", src: ico, alt: type })
        : el("span", { style: { color: typeColor(type), fontSize: "15px", marginRight: "1px" } }, "●"));
    }
    return row;
  }

  function tcgCard(a) {
    const color = typeColor(a.type);
    const c = a.card || (window.SEED && window.SEED.cards && window.SEED.cards[a.id]) || {};
    const cardType = c.type || a.type || "normal";
    const hp = c.hp || (a.rank === "Champion" ? 100 : 80);
    const form = Store.currentForm(a);
    const sprite = form.id ? Store.sprite(form.id) : "";

    const attacks = (c.attacks && c.attacks.length) ? c.attacks : [
      { name: "Tackle", cost: 1, dmg: "30", text: "A dependable hit." },
    ];

    const frameKids = [];
    if (c.dex) frameKids.push(el("span", { class: "tcg-dex" }, c.dex));
    if (c.art) frameKids.push(el("img", { class: "art", src: c.art, alt: a.name }));
    else if (a.photo) frameKids.push(el("img", { class: "art", src: a.photo, alt: a.name }));
    else if (sprite) frameKids.push(el("img", { class: "sprite", src: sprite, alt: form.name || a.favorite || "",
      style: form.scale && form.scale !== 1 ? { transform: "scale(" + form.scale + ")" } : null }));
    else frameKids.push(el("div", { class: "tc-ball-fallback" }));

    return el("div", { class: "tcg" + (c.holo ? " holo" : "") }, [
      el("div", { class: "tcg-head" }, [
        el("div", {}, [
          el("div", { class: "tcg-stage" },
            form.total ? (form.name + " · Stage " + (form.stage + 1) + "/" + form.total) : (c.stage || "Basic Pokémon")),
          el("div", { class: "tcg-name" }, a.name),
        ]),
        el("div", { class: "tcg-hp" }, [
          el("span", { class: "tcg-stage" }, "HP"),
          el("b", {}, String(hp)),
          energyIcon(cardType)
            ? el("img", { class: "energy-ico hp", src: energyIcon(cardType), alt: cardType })
            : el("span", { class: "tc-type-dot", style: { background: color, width: "18px", height: "18px", border: "2px solid #1c2b16" } }),
        ]),
      ]),
      el("div", { class: "tcg-frame" }, frameKids),
      el("div", { class: "tcg-flavor" },
        c.flavor || (a.favorite ? ("The " + (a.role || "Trainer") + ". Favorite: " + a.favorite + ".") : (a.role || "The Squad"))),
      el("div", { class: "tcg-moves" }, attacks.map((m) =>
        el("div", { class: "tcg-move" }, [
          energy(m.cost, cardType),
          el("div", { class: "tcg-move-main" }, [
            el("span", { class: "tcg-move-name" }, m.name),
            m.text ? el("div", { class: "tcg-move-text" }, m.text) : null,
          ]),
          el("div", { class: "tcg-move-dmg" }, m.dmg || ""),
        ])
      )),
      c.power ? el("div", { class: "tcg-power" }, [
        el("b", {}, "POWER"), " ",
        el("span", { style: { fontWeight: 800 } }, c.power.name), " — ", c.power.text,
      ]) : null,
      el("div", { class: "tcg-foot" }, [
        el("span", {}, "weakness: " + (c.weakness || "—")),
        el("span", {}, "resist: " + (c.resistance || "—")),
        el("span", {}, "retreat: " + (c.retreat != null ? c.retreat : "—")),
      ]),
      el("div", { class: "tcg-meta" }, [
        el("span", {}, c.number || ""),
        el("span", {}, c.illus ? ("Illus. " + c.illus) : ""),
        el("span", {}, c.holo ? "★ HOLO" : ""),
      ]),
    ]);
  }

  function openCard(id) {
    const a = Store.attendee(id);
    if (!a) return;
    Modal.open(a.name, tcgCard(a), null, { wide: true });
  }

  // ---- edit modal ---------------------------------------------------------
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
      field("Rank", "rank", ["Champion", "Elite Four", "Gym Leader"]),
      field("Favorite Pokémon (name)", "favorite"),
      field("Favorite dex # (for sprite)", "favoriteId"),
      field("Type", "type", types),
      el("label", { class: "field" }, [el("span", {}, "Team"), teamSelect]),
      field("Signature move / catchphrase", "catchphrase"),
    ]);

    Modal.open("Edit Trainer", form, () => {
      Store.update((s) => {
        const rec = s.attendees.find((x) => x.id === id);
        form.querySelectorAll("[data-key]").forEach((inp) => {
          let v = inp.value;
          if (inp.dataset.key === "favoriteId") v = parseInt(v, 10) || 0;
          rec[inp.dataset.key] = v;
        });
      });
      Router.render();
    });
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🎴 The Squad"),
      el("p", { class: "page-sub" }, "Tap a card for the full trainer card. Tap ✎ to edit." ),
    ]));

    const list = Store.state.attendees;
    // group by rank in RANK_ORDER, then any others
    const groups = {};
    list.forEach((a) => { const r = a.rank || "The Squad"; (groups[r] = groups[r] || []).push(a); });
    const order = RANK_ORDER.filter((r) => groups[r]).concat(
      Object.keys(groups).filter((r) => !RANK_ORDER.includes(r)));

    order.forEach((r) => {
      root.appendChild(el("div", { class: "rank-group" }, [
        el("h2", { class: "section-title" }, RANK_LABEL[r] || r),
        el("div", { class: "card-grid" }, groups[r].map(card)),
      ]));
    });

    root.appendChild(el("div", { class: "toolbar" }, [
      el("button", { class: "btn primary", onClick: () => {
        const id = uid("trainer");
        Store.update((s) => s.attendees.push({
          id, name: "New Trainer", nickname: "", team: "", type: "normal",
          rank: "Gym Leader", role: "The Squad", favorite: "", favoriteId: 0,
          photo: "", catchphrase: "",
        }));
        Router.render();
        setTimeout(() => editCard(id), 30);
      } }, "+ Add trainer"),
    ]));
  }

  window.Views = window.Views || {};
  window.Views.roster = view;
})();
