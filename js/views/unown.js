/* unown.js — 🔡 The Unown Dex. The living alphabet from Spell of the Unown: all
   28 glyphs (A–Z, ! and ?). Sealed until you break ENTEI's spell (the 3rd Movie
   Legend); after that, "search the ruins" to decode them one by one. A full set
   earns the Unown Scholar honor at the closing ceremony. */
(function () {
  const { el } = U;
  const GLYPHS = (window.Store && Store.UNOWN_GLYPHS) || "ABCDEFGHIJKLMNOPQRSTUVWXYZ!?".split("");
  function sprite(g) { return (window.UNOWN_SPRITES || {})[g] || ""; }
  function mSprite(id) { return (window.DEX_SPRITES && DEX_SPRITES[id]) || (window.Store && Store.sprite(id)) || ""; }
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }

  // 🌀 The secret battle unlocked by decoding all 28 glyphs. The Unown are
  // bound up with Arceus & the creation lore, so the alphabet's final test
  // summons ENTEI (from the film), the creation trio, and the Original One.
  const SECRET = {
    key: "unown", name: "THE UNOWN'S JUDGMENT", face: 493, boost: 1.5, pts: 30, icon: "🌀",
    team: [201, 244, 483, 484, 487, 493],   // Unown, Entei, Dialga, Palkia, Giratina, Arceus (ace)
    quote: "You have read every glyph… and the alphabet answers. From the swarm rises ENTEI — and behind it Time, Space and Antimatter bow to THE ORIGINAL ONE. Prove you were meant to hold this knowledge.",
    winChron: "answered the UNOWN'S JUDGMENT — even ARCEUS acknowledged them!",
    loseChron: "the UNOWN'S JUDGMENT found another unready",
  };

  function secretIntro(onGo) {
    const src = mSprite(SECRET.face);
    const lay = el("div", { class: "league-intro final legend-intro" }, [
      el("div", { class: "league-intro-inner" }, [
        src ? el("img", { class: "league-intro-ico legend-boss-ico", src: src, alt: "" }) : el("div", { class: "league-intro-mt" }, "🌀"),
        el("div", { class: "league-intro-flair" }, "🌀 SECRET BATTLE · Spell of the Unown"),
        el("div", { class: "league-intro-rank" }, "THE UNOWN'S JUDGMENT"),
        el("div", { class: "league-intro-name" }, "🌀 6 v 6"),
        el("div", { class: "league-intro-quote" }, "“" + SECRET.quote + "”"),
        el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
          el("button", { class: "btn spin-btn", onClick: () => { lay.remove(); onGo(); } }, "🌀 ANSWER THE JUDGMENT"),
          el("button", { class: "btn subtle", onClick: () => lay.remove() }, "Not yet"),
        ]),
      ]),
    ]);
    document.body.appendChild(lay);
    sfx("fanfare");
    requestAnimationFrame(() => lay.classList.add("go"));
  }

  function challengeSecret(attId) {
    const size = SECRET.team.length;
    if (Duel.poolFor(attId).length < size) { U.toast("The Judgment fields " + size + " — catch " + size + " of your own first (Safari Zone)."); return; }
    secretIntro(() => {
      Duel.pickParty({ attId: attId, min: size, max: size,
        title: "vs THE UNOWN'S JUDGMENT — pick EXACTLY " + size,
        hint: "🌀 A " + size + "v" + size + " secret battle — the alphabet's final test. Arceus and the creation trio await. Bring your very best.",
        onDone: (ids) => {
          Duel.start({ mode: "local", title: "the Unown's Judgment",
            secret: { key: SECRET.key, name: SECRET.name, pts: SECRET.pts, icon: SECRET.icon, winChron: SECRET.winChron, loseChron: SECRET.loseChron },
            a: { units: [{ attId: attId, monIds: ids }] },
            b: { units: [{ npc: SECRET.name, ai: true, monIds: SECRET.team.slice(), boost: SECRET.boost, vsFace: SECRET.face }] },
            onResult: () => Router.render() });
        } });
    });
  }

  function secretCard(attId) {
    const beaten = !!(Store.secretWins && Store.secretWins(attId).indexOf("unown") >= 0);
    const beatenBy = Store.state.attendees.filter((a) => Store.secretWins && Store.secretWins(a.id).indexOf("unown") >= 0);
    return el("div", { class: "unown-secret" + (beaten ? " done" : "") }, [
      el("div", { class: "unown-secret-tag" }, beaten ? "🌀 JUDGMENT PASSED" : "🌀 SECRET BATTLE UNLOCKED"),
      el("div", { class: "unown-secret-name" }, "The Unown's Judgment"),
      el("div", { class: "unown-secret-sub" }, "The alphabet is complete — now face what it summons: Unown, Entei, Dialga, Palkia, Giratina… and ARCEUS, the Original One."),
      el("div", { class: "unown-secret-row" }, SECRET.team.map((id) => { const s = mSprite(id); return s ? el("img", { class: "unown-secret-mon", src: s, alt: "" }) : null; })),
      beatenBy.length ? el("div", { class: "gymc-holders" }, beatenBy.map((a) =>
        el("span", { class: "gymc-holder", onClick: () => window.Profile && Profile.open(a.id) }, "🌀 " + a.name))) : null,
      el("button", { class: "btn spin-btn", onClick: () => challengeSecret(attId) }, beaten ? "🔁 Face the Judgment again (6v6)" : "🌀 Answer the Judgment (6v6)"),
    ]);
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🔡 The Unown Dex"),
      el("p", { class: "page-sub" }, "The living alphabet of Spell of the Unown — 28 glyphs in all. Break ENTEI's spell in the Movie Legends, then catch the Unown as they roam the Safari Zone." ),
    ]));

    let attId = (window.Sync && Sync.getMe && Sync.getMe()) || (Store.state.attendees[0] || {}).id || "";
    if (!attId) { root.appendChild(el("p", { class: "hint" }, "Add trainers first (Squad page).")); return; }
    const sel = el("select", { class: "in" }, Store.state.attendees.map((a) => el("option", { value: a.id }, a.name + "'s Unown")));
    sel.value = attId;
    const host = el("div", {});
    sel.addEventListener("change", () => { attId = sel.value; paint(); });
    root.appendChild(sel);
    root.appendChild(host);

    function paint() {
      host.innerHTML = "";
      const sealed = !(Store.unownSealBroken && Store.unownSealBroken(attId));
      const have = (Store.unownCaught && Store.unownCaught(attId)) || [];
      const haveSet = {}; have.forEach((g) => { haveSet[g] = 1; });
      const done = have.length, total = GLYPHS.length;

      // Progress + the seal / search control.
      host.appendChild(el("div", { class: "unown-bar" }, [
        el("div", { class: "unown-count" }, "🔡 " + done + " / " + total + " decoded"),
        el("div", { class: "unown-progress" }, [el("span", { style: { width: Math.round((done / total) * 100) + "%" } })]),
      ]));

      if (sealed) {
        host.appendChild(el("div", { class: "unown-seal" }, [
          el("div", { class: "unown-seal-ico" }, "🔒🔥"),
          el("div", { class: "unown-seal-txt" }, "The alphabet is sealed. Defeat ENTEI in “Spell of the Unown” (Movie Legends, in The Journey) to break the spell — then the Unown roam the Safari Zone for you to catch."),
          el("button", { class: "btn primary sm", onClick: () => { location.hash = "#/regions"; } }, "🎬 To the Movie Legends"),
        ]));
      } else if (done < total) {
        host.appendChild(el("div", { class: "unown-roam" }, [
          el("span", {}, "🔡 The spell is broken — Unown now roam the Safari Zone. Catch the rest out in the wild!"),
          el("button", { class: "btn primary sm", onClick: () => { location.hash = "#/safari"; } }, "🌿 To the Safari"),
        ]));
        host.appendChild(el("div", { class: "unown-secret locked" }, [
          el("div", { class: "unown-secret-tag" }, "🔒 SECRET BATTLE — " + (total - done) + " glyph" + (total - done > 1 ? "s" : "") + " to go"),
          el("div", { class: "unown-secret-sub" }, "Decode all 28 Unown to summon the alphabet's final test — a 6v6 against Arceus and the creation trio."),
        ]));
      } else {
        host.appendChild(el("div", { class: "unown-complete" }, "🎉 The full alphabet is yours — UNOWN SCHOLAR! All 28 glyphs decoded."));
      }

      // The 28-glyph wall.
      const grid = el("div", { class: "unown-grid" });
      GLYPHS.forEach((g) => {
        const got = !!haveSet[g];
        const key = g === "!" ? "EXCL" : g === "?" ? "QUES" : g;
        const cell = el("div", { class: "unown-cell" + (got ? " got" : " hid"), "data-g": key, title: got ? "Unown " + g : "??? — not yet decoded" }, [
          got && sprite(g) ? el("img", { class: "unown-mon", src: sprite(g), alt: "Unown " + g })
            : el("span", { class: "unown-q" }, "?"),
          el("span", { class: "unown-letter" }, got ? g : "·"),
        ]);
        grid.appendChild(cell);
      });
      host.appendChild(grid);

      // 🌀 The payoff — the secret battle, once every glyph is decoded.
      if (done >= total) host.appendChild(secretCard(attId));

      // Who else has read the alphabet (little roll-up).
      const scholars = Store.state.attendees.filter((a) => ((Store.unownCaught && Store.unownCaught(a.id)) || []).length >= total);
      if (scholars.length) {
        host.appendChild(el("div", { class: "gymc-holders", style: { marginTop: "10px" } }, [el("span", { class: "gc-lab" }, "🎓 Unown Scholars: ")]
          .concat(scholars.map((a) => el("span", { class: "gymc-holder", onClick: () => window.Profile && Profile.open(a.id) }, a.name)))));
      }
    }
    paint();
  }

  window.Views = window.Views || {};
  window.Views.unown = view;
})();
