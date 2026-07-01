/* memes.js — meme gallery. Add images from a URL or upload a local file. */
(function () {
  const { el, uid } = U;

  function view(root) {
    root.appendChild(el("div", { class: "page-head" }, [
      el("h1", {}, "😂 Meme Vault"),
      el("p", { class: "page-sub" }, "Add the greatest hits. Uploads are stored right in your browser."),
    ]));

    const memes = Store.state.memes;

    const gallery = el("div", { class: "meme-grid" });
    function renderGallery() {
      gallery.innerHTML = "";
      if (!Store.state.memes.length) {
        gallery.appendChild(el("p", { class: "empty" }, "No memes yet. Add the first one below 👇"));
        return;
      }
      Store.state.memes.forEach((m) => {
        gallery.appendChild(el("figure", { class: "meme" }, [
          el("img", { src: m.src, alt: m.caption || "meme", loading: "lazy" }),
          m.caption ? el("figcaption", {}, m.caption) : null,
          el("button", { class: "meme-del", title: "Delete", onClick: () => {
            Store.update((s) => { s.memes = s.memes.filter((x) => x.id !== m.id); });
            renderGallery();
          } }, "🗑"),
        ]));
      });
    }
    renderGallery();

    // ---- Add form ----
    const capIn = el("input", { class: "in", placeholder: "Caption (optional)" });
    const urlIn = el("input", { class: "in", placeholder: "Paste image URL…" });
    const fileIn = el("input", { class: "in", type: "file", accept: "image/*" });

    function addMeme(src) {
      if (!src) return;
      Store.update((s) => s.memes.push({ id: uid("meme"), caption: capIn.value.trim(), src }));
      capIn.value = ""; urlIn.value = ""; fileIn.value = "";
      renderGallery();
    }

    fileIn.addEventListener("change", () => {
      const f = fileIn.files && fileIn.files[0];
      if (!f) return;
      if (f.size > 4 * 1024 * 1024) {
        alert("That image is larger than 4MB — browser storage may fill up. Try a smaller one or use a URL.");
      }
      const reader = new FileReader();
      reader.onload = () => addMeme(reader.result);
      reader.readAsDataURL(f);
    });

    const form = el("div", { class: "meme-add" }, [
      el("h2", { class: "section-title" }, "Add a meme"),
      capIn,
      el("div", { class: "meme-add-row" }, [
        urlIn,
        el("button", { class: "btn primary", onClick: () => addMeme(urlIn.value.trim()) }, "Add from URL"),
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
  window.Views.memes = view;
})();
