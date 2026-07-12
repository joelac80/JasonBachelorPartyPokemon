/* unown.js — 🔡 The Unown Dex. The living alphabet from Spell of the Unown: all
   28 glyphs (A–Z, ! and ?). Sealed until you break ENTEI's spell (the 3rd Movie
   Legend); after that, "search the ruins" to decode them one by one. A full set
   earns the Unown Scholar honor at the closing ceremony. */
(function () {
  const { el } = U;
  const GLYPHS = (window.Store && Store.UNOWN_GLYPHS) || "ABCDEFGHIJKLMNOPQRSTUVWXYZ!?".split("");
  function sprite(g) { return (window.UNOWN_SPRITES || {})[g] || ""; }
  function sfx(n) { if (window.SFX && SFX[n]) SFX[n](); }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🔡 The Unown Dex"),
      el("p", { class: "page-sub" }, "The living alphabet of Spell of the Unown — 28 glyphs in all. Break ENTEI's spell in the Movie Legends, then read them out of the ruins one by one." ),
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
          el("div", { class: "unown-seal-txt" }, "The alphabet is sealed. Defeat ENTEI in “Spell of the Unown” (Movie Legends, in The Journey) to break the spell — the Unown will begin to answer."),
          el("button", { class: "btn primary sm", onClick: () => { location.hash = "#/regions"; } }, "🎬 To the Movie Legends"),
        ]));
      } else if (done < total) {
        host.appendChild(el("div", { class: "toolbar", style: { justifyContent: "center" } }, [
          el("button", { class: "btn spin-btn", onClick: () => {
            const g = Store.searchUnown && Store.searchUnown(attId);
            if (g) { sfx("correct"); paint(); const cell = host.querySelector('.unown-cell[data-g="' + (g === "!" ? "EXCL" : g === "?" ? "QUES" : g) + '"]');
              if (cell) { cell.classList.add("just"); } }
          } }, "🔍 Search the ruins — decode a glyph"),
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
