/* ceremony.js — Champion Ceremony: the grand finale. Crowns the Victory Road
   champion with confetti + fanfare, and gathers every award from the weekend:
   the podium, superlative winners, bracket champions, gym badges, and Catch of
   the Day. Read-only — it reflects the state the rest of the app produced. */
(function () {
  const { el, contrast } = U;
  const MEDALS = { 1: "🥇", 2: "🥈", 3: "🥉" };
  function sfx(name) { if (window.SFX && SFX[name]) SFX[name](); }

  function ensureConfettiStyles() {
    if (document.getElementById("cer-confetti-style")) return;
    const css =
      ".cer-confetti{position:fixed;inset:0;z-index:250;pointer-events:none;overflow:hidden;}" +
      ".cer-confetti i{position:absolute;top:-24px;width:11px;height:16px;opacity:.95;border-radius:2px;" +
      "animation:cerFall linear forwards;}" +
      "@keyframes cerFall{0%{transform:translateY(-24px) rotate(0)}100%{transform:translateY(110vh) rotate(720deg)}}" +
      ".cer-crown-pop{animation:cerPop .8s cubic-bezier(.2,1.5,.4,1);}" +
      "@keyframes cerPop{0%{transform:scale(.4);opacity:0}100%{transform:scale(1);opacity:1}}";
    const style = el("style", { id: "cer-confetti-style" });
    style.textContent = css;
    document.head.appendChild(style);
  }

  function confetti() {
    ensureConfettiStyles();
    const colors = ["#ee1515", "#2a75bb", "#ffcb05", "#5fbf6a", "#f45f9c", "#7a5aa0"];
    const layer = el("div", { class: "cer-confetti" });
    for (let i = 0; i < 90; i++) {
      const p = el("i");
      p.style.left = (Math.random() * 100).toFixed(1) + "vw";
      p.style.background = colors[(Math.random() * colors.length) | 0];
      p.style.animationDuration = (2.4 + Math.random() * 2.4).toFixed(2) + "s";
      p.style.animationDelay = (Math.random() * 0.8).toFixed(2) + "s";
      layer.appendChild(p);
    }
    document.body.appendChild(layer);
    setTimeout(() => { if (layer.isConnected) layer.remove(); }, 6000);
  }

  function podium() {
    const rows = Store.standings().slice(0, 3).filter((r) => Store.state.teams.length);
    if (!rows.length) return null;
    const wrap = el("div", { class: "cer-podium" });
    rows.forEach((r) => {
      wrap.appendChild(el("div", { class: "cer-podium-slot rank-" + r.rank, style: { "--tc": r.team.color } }, [
        el("div", { class: "cer-medal" }, MEDALS[r.rank] || ("#" + r.rank)),
        el("div", { class: "cer-podium-team", style: { background: r.team.color, color: contrast(r.team.color) } },
          [U.teamIcon(r.team), " " + r.team.name]),
        el("div", { class: "cer-podium-pts" }, r.total + " pts"),
      ]));
    });
    return wrap;
  }

  function section(title, rows) {
    if (!rows || !rows.length) return null;
    return el("div", { class: "cer-section" }, [
      el("h2", { class: "section-title" }, title),
      el("div", { class: "cer-award-list" }, rows),
    ]);
  }

  function awardRow(emoji, label, winner) {
    return el("div", { class: "cer-award" }, [
      el("span", { class: "cer-award-emoji" }, emoji),
      el("div", { class: "cer-award-main" }, [
        el("div", { class: "cer-award-label" }, label),
        el("div", { class: "cer-award-winner" }, winner),
      ]),
    ]);
  }

  function superlativeRows() {
    const cats = Store.state.superlatives || [];
    const L = window.Superlatives;
    if (!L) return [];
    return cats.map((c) => {
      const lead = L.leader(c.id);
      let winner = "— no votes yet —";
      if (lead && lead.tie) winner = "TIE: " + lead.rows.map((r) => r.a.name).join(" & ");
      else if (lead) winner = lead.a.name + " (" + lead.n + ")";
      return awardRow(c.emoji || "🏅", c.title, winner);
    });
  }

  function bracketRows() {
    return (Store.state.brackets || []).map((b) => {
      const last = b.winners[b.winners.length - 1];
      const champ = (last && last[0]) || "— in progress —";
      return awardRow("🥊", b.title, champ);
    });
  }

  function gymBadgeRows() {
    return (Store.state.gymBadges || []).filter((b) => b.holder).map((b) => {
      const a = Store.attendee(b.holder);
      return awardRow(b.emoji || "🏅", b.name, a ? a.name : b.holder);
    });
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "👑 Champion Ceremony"),
      el("p", { class: "page-sub" }, "The grand finale. Tally it all up and crown the champions."),
    ]));

    const teams = Store.state.teams;
    const top = Store.standings()[0];

    // The big crown moment.
    const stage = el("div", { class: "cer-stage" });
    function renderStage(revealed) {
      stage.innerHTML = "";
      if (!teams.length) { stage.appendChild(el("p", { class: "empty" }, "No teams to crown yet.")); return; }
      if (!revealed) {
        stage.appendChild(el("div", { class: "cer-trophy" }, "🏆"));
        stage.appendChild(el("button", { class: "btn spin-btn", onClick: () => {
          sfx("fanfare"); confetti(); renderStage(true);
        } }, "🎉 CROWN THE CHAMPION"));
        return;
      }
      const fg = contrast(top.team.color);
      stage.appendChild(el("div", { class: "cer-champ-card cer-crown-pop", style: { background: top.team.color, color: fg } }, [
        el("div", { class: "cer-champ-crown" }, "👑"),
        el("div", { class: "cer-champ-label" }, "VICTORY ROAD CHAMPION"),
        el("div", { class: "cer-champ-name" }, [U.teamIcon(top.team), " " + top.team.name]),
        el("div", { class: "cer-champ-pts" }, top.total + " points"),
      ]));
      stage.appendChild(el("button", { class: "btn subtle sm", onClick: () => { confetti(); sfx("win"); } }, "🎊 More confetti"));
    }
    renderStage(false);
    root.appendChild(stage);

    // Podium
    const pod = podium();
    if (pod) { root.appendChild(el("h2", { class: "section-title" }, "Podium")); root.appendChild(pod); }

    // Awards roundup
    const sups = section("Superlative Winners", superlativeRows());
    if (sups) root.appendChild(sups);
    const brs = section("Bracket Champions", bracketRows());
    if (brs) root.appendChild(brs);
    const gyms = section("Gym Badge Holders", gymBadgeRows());
    if (gyms) root.appendChild(gyms);

    // Trophy Hall — every auto-earned trophy + the fun superlatives.
    const allTrophies = Store.liveTrophies().concat(Store.funSuperlatives());
    if (allTrophies.length) {
      root.appendChild(el("h2", { class: "section-title" }, "🏅 Trophy Hall"));
      root.appendChild(el("div", { class: "trophy-strip" }, allTrophies.map((t) =>
        el("div", { class: "trophy" }, [
          el("span", { class: "trophy-emoji" }, t.emoji),
          el("div", { class: "trophy-txt" }, [
            el("div", { class: "trophy-title" }, t.title),
            el("div", { class: "trophy-holder" }, t.holder),
            el("div", { class: "trophy-sub" }, t.sub),
          ]),
        ]))));
    }
    const topPhoto = Store.mostReactedPhoto && Store.mostReactedPhoto();
    if (topPhoto) {
      root.appendChild(el("h2", { class: "section-title" }, "📸 Photo of the Weekend"));
      root.appendChild(el("figure", { class: "poster-photo", onClick: () => window.PhotoLog && PhotoLog.openDetail(topPhoto.p.id, () => Router.render()) }, [
        el("img", { src: topPhoto.p.img, alt: topPhoto.p.caption || "" }),
        el("figcaption", {}, (topPhoto.p.caption || "Photo") + (topPhoto.p.by ? " — " + topPhoto.p.by : "") + "  · " + topPhoto.n + " reactions"),
      ]));
    }

    // Catch of the Day tally
    const chs = Store.state.challenges || [];
    const caught = chs.filter((c) => Store.state.challengeDone[c.id] && Store.state.challengeDone[c.id].done).length;
    root.appendChild(el("h2", { class: "section-title" }, "Catch of the Day"));
    root.appendChild(el("div", { class: "cer-award-list" }, [
      awardRow("🎣", "Challenges caught", caught + " / " + chs.length),
    ]));

    root.appendChild(el("p", { class: "hint", style: { marginTop: "18px" } },
      "Everything here updates automatically from Victory Road, Superlatives, Brackets, Badges, and Catch of the Day."));
  }

  window.Views = window.Views || {};
  window.Views.ceremony = view;
})();
