/* megadex.js — ✨ The Mega-Dex. A separate wall (like the Unown Dex) of every
   Mega Evolution & Primal form — Kalos/Gen 6 and Legends Z-A. You don't CATCH
   these: you unlock a form by Mega-Evolving it in battle (the ✨ button in any
   vs-AI duel). Fill the whole wall and the Mega Judgment unlocks — a legendary
   boss battle. */
(function () {
  const { el } = U;
  function mSprite(id) { return (window.DEX_SPRITES && DEX_SPRITES[id]) || (window.Store && Store.sprite(id)) || ""; }
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }

  // Two eras, split by form id (Z-A megas start at 10278).
  function era(id) { return id >= 10278 ? "za" : "kalos"; }
  const TABS = [
    { key: "kalos", name: "Kalos · Gen 6", emoji: "🗼" },
    { key: "za", name: "Legends Z-A", emoji: "🌆" },
  ];
  let curTab = 0;

  function forms() {
    const F = window.MEGA_FORMS || {};
    return Object.keys(F).map((id) => ({ id: +id, n: F[id].n, base: F[id].base, x: F[id].x, t: F[id].t }))
      .sort((a, b) => (a.base - b.base) || (a.id - b.id));
  }

  // 🌈 The Mega Judgment — the legendary payoff for a full Mega-Dex. Floette (the
  // Eternal Flower), Primal Kyogre & Groudon, Mega Zygarde, and Mega Rayquaza.
  const JUDGMENT = {
    key: "mega", name: "THE MEGA JUDGMENT", face: 10079, boost: 1.5, pts: 40, icon: "🌈",
    team: [10296, 10078, 10077, 10301, 10079],   // Floette, Primal Groudon, Primal Kyogre, Mega Zygarde, Mega Rayquaza (ace)
    quote: "You have awakened every stone. Now the flower that outlived a war, the titans of land and sea, the serpent of order, and the sky-god above them all descend as one. Show them a bond beyond evolution.",
    winChron: "answered THE MEGA JUDGMENT — Rayquaza, the primals, Zygarde and the Eternal Flower all fell!",
    loseChron: "THE MEGA JUDGMENT proved beyond another challenger",
  };

  function judgmentIntro(onGo) {
    const src = mSprite(JUDGMENT.face);
    const lay = el("div", { class: "league-intro final legend-intro" }, [
      el("div", { class: "league-intro-inner" }, [
        src ? el("img", { class: "league-intro-ico legend-boss-ico", src: src, alt: "" }) : el("div", { class: "league-intro-mt" }, "🌈"),
        el("div", { class: "league-intro-flair" }, "🌈 SECRET BATTLE · Mega Evolution"),
        el("div", { class: "league-intro-rank" }, "THE MEGA JUDGMENT"),
        el("div", { class: "league-intro-name" }, "🌈 5 v 5"),
        el("div", { class: "league-intro-quote" }, "“" + JUDGMENT.quote + "”"),
        el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
          el("button", { class: "btn spin-btn", onClick: () => { lay.remove(); onGo(); } }, "🌈 FACE THE JUDGMENT"),
          el("button", { class: "btn subtle", onClick: () => lay.remove() }, "Not yet"),
        ]),
      ]),
    ]);
    document.body.appendChild(lay);
    sfx("fanfare");
    requestAnimationFrame(() => lay.classList.add("go"));
  }

  function challengeJudgment(attId) {
    const size = JUDGMENT.team.length;
    if (Duel.poolFor(attId).length < size) { U.toast("The Judgment fields " + size + " — catch " + size + " of your own first (Safari Zone)."); return; }
    judgmentIntro(() => {
      Duel.pickParty({ attId: attId, min: size, max: size,
        title: "vs THE MEGA JUDGMENT — pick EXACTLY " + size,
        hint: "🌈 A " + size + "v" + size + " secret battle. Mega-Evolve your own to stand a chance — this is the roof of the world.",
        onDone: (ids) => {
          Duel.start({ mode: "local", title: "the Mega Judgment",
            secret: { key: JUDGMENT.key, name: JUDGMENT.name, pts: JUDGMENT.pts, icon: JUDGMENT.icon, winChron: JUDGMENT.winChron, loseChron: JUDGMENT.loseChron },
            a: { units: [{ attId: attId, monIds: ids }] },
            b: { units: [{ npc: JUDGMENT.name, ai: true, monIds: JUDGMENT.team.slice(), boost: JUDGMENT.boost, vsFace: JUDGMENT.face }] },
            onResult: () => Router.render() });
        } });
    });
  }

  function judgmentCard(attId) {
    const beaten = !!(Store.secretWins && Store.secretWins(attId).indexOf("mega") >= 0);
    const beatenBy = Store.state.attendees.filter((a) => Store.secretWins && Store.secretWins(a.id).indexOf("mega") >= 0);
    return el("div", { class: "unown-secret mega-judgment" + (beaten ? " done" : "") }, [
      el("div", { class: "unown-secret-tag" }, beaten ? "🌈 JUDGMENT PASSED" : "🌈 SECRET BATTLE UNLOCKED"),
      el("div", { class: "unown-secret-name" }, "The Mega Judgment"),
      el("div", { class: "unown-secret-sub" }, "Every stone awakened — now face them all: the Eternal Flower, Primal Kyogre & Groudon, Mega Zygarde, and MEGA RAYQUAZA."),
      el("div", { class: "unown-secret-row" }, JUDGMENT.team.map((id) => { const s = mSprite(id); return s ? el("img", { class: "unown-secret-mon", src: s, alt: "" }) : null; })),
      beatenBy.length ? el("div", { class: "gymc-holders" }, beatenBy.map((a) =>
        el("span", { class: "gymc-holder", onClick: () => window.Profile && Profile.open(a.id) }, "🌈 " + a.name))) : null,
      el("button", { class: "btn spin-btn", onClick: () => challengeJudgment(attId) }, beaten ? "🔁 Face the Judgment again (5v5)" : "🌈 Answer the Judgment (5v5)"),
    ]);
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "✨ The Mega-Dex"),
      el("p", { class: "page-sub" }, "Every Mega Evolution & Primal form — Kalos and Legends Z-A. You don't catch these: unlock each one by Mega-Evolving it in battle (the ✨ button in any vs-AI duel). Fill the wall to summon the Mega Judgment." ),
    ]));

    let attId = (window.Sync && Sync.getMe && Sync.getMe()) || (Store.state.attendees[0] || {}).id || "";
    if (!attId) { root.appendChild(el("p", { class: "hint" }, "Add trainers first (Squad page).")); return; }
    const sel = el("select", { class: "in" }, Store.state.attendees.map((a) => el("option", { value: a.id }, a.name + "'s Mega-Dex")));
    sel.value = attId;
    sel.addEventListener("change", () => { attId = sel.value; rebuild(); });
    root.appendChild(sel);

    const tabBar = el("div", { class: "rg-tabs" });
    root.appendChild(tabBar);
    const host = el("div", {});
    root.appendChild(host);

    function paintTabs() {
      tabBar.innerHTML = "";
      TABS.forEach((t, i) => tabBar.appendChild(el("button", { class: "rg-tab" + (i === curTab ? " on" : ""),
        onClick: () => { if (curTab !== i) { curTab = i; paintTabs(); rebuild(); } } }, [
        el("span", { class: "rg-tab-emoji" }, t.emoji), el("span", { class: "rg-tab-name" }, t.name),
      ])));
    }

    function rebuild() {
      host.innerHTML = "";
      const all = forms();
      const have = (Store.megaDexCaught && Store.megaDexCaught(attId)) || [];
      const haveSet = {}; have.forEach((id) => { haveSet[id] = 1; });
      const total = all.length, done = have.length;

      host.appendChild(el("div", { class: "unown-bar" }, [
        el("div", { class: "unown-count" }, "✨ " + done + " / " + total + " Mega-Evolved" ),
        el("div", { class: "unown-progress" }, [el("span", { style: { width: Math.round((done / total) * 100) + "%" } })]),
      ]));

      // 🧭 Gen Ladder: Mega Evolution awakens with Kalos (beat ALDER → Gen 6).
      if (window.Store && Store.genCapFor && Store.genCapFor(attId) < 6) {
        host.appendChild(el("div", { class: "unown-seal" }, [
          el("div", { class: "unown-seal-ico" }, "🔒✨"),
          el("div", { class: "unown-seal-txt" }, "Mega Evolution awakens in Kalos. Beat Champion ALDER (Unova, in The Journey) to unlock the ✨ Mega Evolve button in battle — then fill this wall."),
          el("button", { class: "btn primary sm", onClick: () => { location.hash = "#/regions"; } }, "🗺 To The Journey"),
        ]));
      }

      if (done >= total) host.appendChild(el("div", { class: "unown-complete" }, "🎉 Every stone awakened — MEGA MASTER!"));

      const tabForms = all.filter((f) => era(f.id) === TABS[curTab].key);
      const grid = el("div", { class: "mega-grid" });
      tabForms.forEach((f) => {
        const got = !!haveSet[f.id];
        grid.appendChild(el("div", { class: "mega-cell" + (got ? " got" : " hid"), title: got ? f.n : "??? — Mega-Evolve it in battle" }, [
          got && mSprite(f.id) ? el("img", { class: "mega-mon", src: mSprite(f.id), alt: f.n })
            : el("span", { class: "mega-q" }, "?"),
          el("span", { class: "mega-name" }, got ? f.n : "???"),
          got ? el("span", { class: "mega-bst" }, f.t.join("/") + " · " + f.x) : null,
        ]));
      });
      host.appendChild(el("div", { class: "mega-sub" }, TABS[curTab].emoji + " " + TABS[curTab].name + " — " +
        tabForms.filter((f) => haveSet[f.id]).length + " / " + tabForms.length));
      host.appendChild(grid);

      // 🌈 The payoff, once the WHOLE dex (both eras) is filled.
      if (done >= total) host.appendChild(judgmentCard(attId));
      else host.appendChild(el("div", { class: "unown-secret locked" }, [
        el("div", { class: "unown-secret-tag" }, "🔒 MEGA JUDGMENT — " + (total - done) + " form" + (total - done > 1 ? "s" : "") + " to go"),
        el("div", { class: "unown-secret-sub" }, "Mega-Evolve every form in battle to summon the Mega Judgment — Rayquaza, the primals, Zygarde and the Eternal Flower." ),
      ]));
    }

    paintTabs();
    rebuild();
  }

  window.Views = window.Views || {};
  window.Views.megadex = view;
})();
