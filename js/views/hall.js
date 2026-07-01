/* hall.js — Hall of Bulbasaur: a gallery wall the crew fills with card
   pics, fan art, and cool shots. Images are added by URL or uploaded
   (stored in this browser). No art ships with the app — you curate it. */
(function () {
  const { el, uid } = U;

  // Inject the intro animation styles once.
  function ensureIntroStyles() {
    if (document.getElementById("hall-intro-style")) return;
    const css =
      ".hall-intro{position:fixed;inset:0;z-index:300;overflow:hidden;display:flex;align-items:center;" +
      "justify-content:center;cursor:pointer;background:radial-gradient(circle at 50% 42%,#eafce6,#bfe6c1);" +
      "animation:hallFade .5s ease 2.7s forwards;}" +
      ".hall-intro .rain-sprite{position:absolute;top:-90px;image-rendering:pixelated;opacity:.9;" +
      "animation:hallRain linear 1 forwards;}" +
      ".hall-intro .rain-sprite.ball{border-radius:50%;border:2px solid #111;" +
      "background:linear-gradient(#ee1515 0 46%,#111 46% 54%,#fff 54% 100%);}" +
      "@keyframes hallRain{0%{transform:translateY(-90px) rotate(0)}100%{transform:translateY(116vh) rotate(380deg)}}" +
      ".hall-intro-hero{position:relative;z-index:2;text-align:center;opacity:0;transform:scale(.3);" +
      "animation:hallPop .7s cubic-bezier(.2,1.5,.4,1) .5s forwards;}" +
      ".hall-intro-hero img{width:180px;height:180px;image-rendering:pixelated;filter:drop-shadow(0 10px 10px rgba(0,0,0,.3));}" +
      ".hall-intro-title{font-family:var(--pixel,monospace);font-weight:700;text-transform:uppercase;" +
      "font-size:clamp(28px,7vw,56px);color:#2e8b3d;margin-top:8px;" +
      "text-shadow:3px 3px 0 #ffcb05,6px 6px 0 rgba(0,0,0,.15);}" +
      "@keyframes hallFade{to{opacity:0;visibility:hidden;}}" +
      "@keyframes hallPop{to{opacity:1;transform:scale(1);}}";
    const style = el("style", { id: "hall-intro-style" });
    style.textContent = css;
    document.head.appendChild(style);
  }

  // A shower of Bulbasaur sprites, then a big one + title. Tap to skip.
  function playIntro() {
    ensureIntroStyles();
    const sprite = Store.sprite(1); // Bulbasaur (present if chosen as a favorite)
    const overlay = el("div", { class: "hall-intro" });
    overlay.addEventListener("click", () => overlay.remove());

    for (let i = 0; i < 26; i++) {
      const size = (38 + Math.random() * 42) | 0;
      const node = sprite
        ? el("img", { class: "rain-sprite", src: sprite, alt: "" })
        : el("div", { class: "rain-sprite ball" });
      node.style.left = (Math.random() * 96).toFixed(1) + "vw";
      node.style.width = size + "px";
      node.style.height = size + "px";
      node.style.animationDuration = (2.1 + Math.random() * 1.9).toFixed(2) + "s";
      node.style.animationDelay = (Math.random() * 1.7).toFixed(2) + "s";
      overlay.appendChild(node);
    }

    overlay.appendChild(el("div", { class: "hall-intro-hero" }, [
      sprite
        ? el("img", { src: sprite, alt: "Bulbasaur" })
        : el("div", { class: "tc-ball-fallback", style: { width: "150px", height: "150px", margin: "0 auto" } }),
      el("div", { class: "hall-intro-title" }, "HALL OF BULBA!!"),
    ]));

    document.body.appendChild(overlay);
    setTimeout(() => { if (overlay.isConnected) overlay.remove(); }, 3300);
  }

  function view(root) {
    playIntro();

    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "🌿 Hall of Bulbasaur"),
      el("p", { class: "page-sub" }, "The shrine. Add favorite cards, fan art, and legendary shots." ),
    ]));

    const gallery = el("div", { class: "meme-grid" });
    function renderGallery() {
      gallery.innerHTML = "";
      const items = Store.state.hall || [];
      if (!items.length) {
        gallery.appendChild(el("div", { style: { textAlign: "center", padding: "16px", gridColumn: "1 / -1" } }, [
          el("div", { class: "tc-ball-fallback", style: { margin: "0 auto 10px" } }),
          el("p", { class: "empty" }, "The Hall is empty. Add the first piece below 👇"),
        ]));
        return;
      }
      items.forEach((m) => {
        gallery.appendChild(el("figure", { class: "meme" }, [
          el("img", { src: m.src, alt: m.caption || "hall", loading: "lazy" }),
          m.caption ? el("figcaption", {}, m.caption) : null,
          el("button", { class: "meme-del", title: "Remove", onClick: () => {
            Store.update((s) => { s.hall = (s.hall || []).filter((x) => x.id !== m.id); });
            renderGallery();
          } }, "🗑"),
        ]));
      });
    }
    renderGallery();

    // ---- Add form ----
    const capIn = el("input", { class: "in", placeholder: "Caption (e.g. Base Set Bulbasaur)" });
    const urlIn = el("input", { class: "in", placeholder: "Paste an image URL…" });
    const fileIn = el("input", { class: "in", type: "file", accept: "image/*" });

    function add(src) {
      if (!src) return;
      Store.update((s) => {
        s.hall = s.hall || [];
        s.hall.push({ id: uid("hall"), caption: capIn.value.trim(), src });
      });
      capIn.value = ""; urlIn.value = ""; fileIn.value = "";
      renderGallery();
    }

    fileIn.addEventListener("change", () => {
      const f = fileIn.files && fileIn.files[0];
      if (!f) return;
      if (f.size > 4 * 1024 * 1024) {
        alert("That image is over 4MB — browser storage may fill up. Try a smaller one or use a URL.");
      }
      const reader = new FileReader();
      reader.onload = () => add(reader.result);
      reader.readAsDataURL(f);
    });

    const form = el("div", { class: "meme-add" }, [
      el("h2", { class: "section-title" }, "Add to the Hall"),
      capIn,
      el("div", { class: "meme-add-row" }, [
        urlIn,
        el("button", { class: "btn primary", onClick: () => add(urlIn.value.trim()) }, "Add from URL"),
      ]),
      el("div", { class: "meme-add-row" }, [
        el("span", { class: "or" }, "or"),
        fileIn,
      ]),
    ]);

    root.appendChild(gallery);
    root.appendChild(form);
  }

  window.Views = window.Views || {};
  window.Views.hall = view;
})();
