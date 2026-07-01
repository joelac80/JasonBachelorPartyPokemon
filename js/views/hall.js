/* hall.js — Hall of Bulbasaur: a gallery wall the crew fills with card
   pics, fan art, and cool shots. Images are added by URL or uploaded
   (stored in this browser). No art ships with the app — you curate it. */
(function () {
  const { el, uid } = U;

  function view(root) {
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
