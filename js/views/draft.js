/* draft.js — spinner wheel + snake draft board for assigning trainers to teams. */
(function () {
  const { el, contrast } = U;

  let spinning = false;
  let angle = 0; // current wheel rotation in radians

  function undrafted() {
    return Store.state.attendees.filter((a) => !a.team);
  }

  function drawWheel(canvas, names) {
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const cx = size / 2, cy = size / 2, r = size / 2 - 6;
    ctx.clearRect(0, 0, size, size);

    if (!names.length) {
      ctx.fillStyle = "#26433a";
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#cfe8dd";
      ctx.font = "bold 18px system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("Everyone drafted!", cx, cy);
      return;
    }

    const slice = (Math.PI * 2) / names.length;
    const palette = ["#5fbf6a", "#f5732f", "#3aa0e6", "#c9a227", "#f45f9c",
      "#7a5aa0", "#f2c744", "#c0392b", "#7fd7e0", "#9aba2c"];

    names.forEach((name, i) => {
      const start = angle + i * slice;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + slice);
      ctx.closePath();
      ctx.fillStyle = palette[i % palette.length];
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 2; ctx.stroke();

      // label
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + slice / 2);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = contrast(palette[i % palette.length]);
      ctx.font = "bold " + Math.max(11, Math.min(18, 220 / names.length + 8)) + "px system-ui, sans-serif";
      const label = name.length > 14 ? name.slice(0, 13) + "…" : name;
      ctx.fillText(label, r - 14, 0);
      ctx.restore();
    });

    // hub
    ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fillStyle = "#0d1b17"; ctx.fill();
    ctx.strokeStyle = "#ff5252"; ctx.lineWidth = 4; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.fillStyle = "#fff"; ctx.fill();
  }

  function spin(canvas, names, onResult) {
    if (spinning || !names.length) return;
    spinning = true;
    const slice = (Math.PI * 2) / names.length;
    const spins = 5 + Math.random() * 4;
    const target = angle + spins * Math.PI * 2 + Math.random() * Math.PI * 2;
    const startA = angle;
    const dur = 4200;
    const t0 = performance.now();

    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    function frame(now) {
      const t = Math.min(1, (now - t0) / dur);
      angle = startA + (target - startA) * easeOut(t);
      drawWheel(canvas, names);
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        spinning = false;
        // Pointer sits at the top (−90°). Find which slice is under it.
        const norm = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const pointer = (Math.PI * 1.5 - norm + Math.PI * 2) % (Math.PI * 2);
        const idx = Math.floor(pointer / slice) % names.length;
        onResult(idx);
      }
    }
    requestAnimationFrame(frame);
  }

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🎡 Draft & Wheel"),
      el("p", { class: "page-sub" }, "Spin the wheel to pick a trainer, then assign them to a team."),
    ]));

    const teams = Store.state.teams;
    if (!teams.length) {
      root.appendChild(el("p", { class: "empty" }, "Add teams in Settings first."));
      return;
    }

    // ---- Wheel column ----
    const canvas = el("canvas", { class: "wheel", width: "360", height: "360" });
    const resultBox = el("div", { class: "wheel-result" }, "Spin to draft!");
    const teamPicker = el("div", { class: "chip-row" });
    let selectedTeam = teams[0].id;
    let picked = null;

    function renderTeamPicker() {
      teamPicker.innerHTML = "";
      teams.forEach((t) => {
        const active = t.id === selectedTeam;
        teamPicker.appendChild(el("button", {
          class: "chip" + (active ? " active" : ""),
          style: active ? { background: t.color, color: contrast(t.color), borderColor: t.color } : {},
          onClick: () => { selectedTeam = t.id; renderTeamPicker(); },
        }, (t.emoji || "") + " " + t.name));
      });
    }
    renderTeamPicker();

    const assignBtn = el("button", { class: "btn primary", disabled: "true",
      onClick: () => {
        if (!picked) return;
        Store.update((s) => {
          const a = s.attendees.find((x) => x.id === picked.id);
          if (a) a.team = selectedTeam;
          s.draft.picks.push({ attendee: picked.id, team: selectedTeam });
        });
        picked = null;
        assignBtn.disabled = true;
        resultBox.textContent = "Assigned! Spin again.";
        redraw();
        renderBoard();
      } }, "Assign to team");

    const spinBtn = el("button", { class: "btn spin-btn",
      onClick: () => {
        const names = undrafted();
        if (!names.length) { resultBox.textContent = "Everyone's drafted! 🎉"; return; }
        spinBtn.disabled = true;
        spin(canvas, names.map((n) => n.name), (idx) => {
          spinBtn.disabled = false;
          picked = names[idx];
          resultBox.innerHTML = "";
          resultBox.appendChild(el("span", { class: "picked-name" }, "🎯 " + picked.name));
          assignBtn.disabled = false;
        });
      } }, "🎡 SPIN");

    function redraw() { drawWheel(canvas, undrafted().map((n) => n.name)); }

    const wheelCol = el("div", { class: "wheel-col" }, [
      el("div", { class: "wheel-wrap" }, [
        el("div", { class: "wheel-pointer" }, "▼"),
        canvas,
      ]),
      resultBox,
      spinBtn,
      el("div", { class: "assign-row" }, [
        el("div", { class: "assign-label" }, "Assign pick to:"),
        teamPicker,
        assignBtn,
      ]),
    ]);

    // ---- Board column ----
    const boardCol = el("div", { class: "board-col" });
    function renderBoard() {
      boardCol.innerHTML = "";
      boardCol.appendChild(el("h2", { class: "section-title" }, "Draft Board"));

      const und = undrafted();
      boardCol.appendChild(el("div", { class: "board-teams" },
        teams.map((t) => {
          const members = Store.roster(t.id);
          return el("div", { class: "board-team", style: { borderColor: t.color } }, [
            el("div", { class: "board-team-head", style: { background: t.color, color: contrast(t.color) } },
              (t.emoji || "") + " " + t.name + " (" + members.length + ")"),
            el("div", { class: "board-members" },
              members.length
                ? members.map((m) => el("div", { class: "board-chip" }, [
                    el("span", {}, m.name),
                    el("button", { class: "x", title: "Remove", onClick: () => {
                      Store.update((s) => {
                        const a = s.attendees.find((x) => x.id === m.id);
                        if (a) a.team = "";
                      });
                      redraw(); renderBoard();
                    } }, "×"),
                  ]))
                : el("div", { class: "board-empty" }, "— empty —")),
          ]);
        })
      ));

      boardCol.appendChild(el("div", { class: "undrafted" }, [
        el("h3", {}, "Undrafted (" + und.length + ")"),
        el("div", { class: "chip-row" },
          und.length
            ? und.map((a) => el("span", { class: "chip static" }, a.name))
            : el("span", { class: "board-empty" }, "Everyone's on a team 🎉")),
      ]));

      boardCol.appendChild(el("div", { class: "toolbar" }, [
        el("button", { class: "btn subtle", onClick: () => {
          if (confirm("Clear all team assignments?")) {
            Store.update((s) => { s.attendees.forEach((a) => (a.team = "")); s.draft.picks = []; });
            redraw(); renderBoard();
          }
        } }, "Clear draft"),
        el("button", { class: "btn subtle", onClick: () => autoBalance(redraw, renderBoard) },
          "⚖️ Auto-balance rest"),
      ]));
    }

    root.appendChild(el("div", { class: "draft-layout" }, [wheelCol, boardCol]));
    redraw();
    renderBoard();
  }

  // Evenly distribute undrafted trainers across teams (fills smallest first).
  function autoBalance(redraw, renderBoard) {
    Store.update((s) => {
      const und = s.attendees.filter((a) => !a.team);
      // shuffle
      for (let i = und.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [und[i], und[j]] = [und[j], und[i]];
      }
      und.forEach((a) => {
        const counts = s.teams.map((t) => ({
          id: t.id, n: s.attendees.filter((x) => x.team === t.id).length,
        }));
        counts.sort((x, y) => x.n - y.n);
        a.team = counts[0].id;
      });
    });
    redraw();
    renderBoard();
  }

  window.Views = window.Views || {};
  window.Views.draft = view;
})();
