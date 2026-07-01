/*
 * fetch-sprites.js — regenerate data/sprites.js with offline Pokemon sprites.
 *
 * Usage (from the project root, needs Node + internet just this once):
 *   node tools/fetch-sprites.js bulbasaur totodile pikachu:25 158
 *
 * Each argument is a Pokemon name, a "name:dexId", or a bare dex number.
 * Names are resolved to National Dex numbers via PokeAPI. Existing entries in
 * data/sprites.js are preserved and merged, so you can add favorites over time.
 *
 * The result is base64 data URIs embedded in a plain JS file — no network is
 * needed at runtime, so the app stays 100% local at the lake house.
 */
const https = require("https");
const fs = require("fs");
const path = require("path");

const CA_PATH = "/root/.ccr/ca-bundle.crt";
const caOpts = fs.existsSync(CA_PATH) ? { ca: fs.readFileSync(CA_PATH) } : {};
const SPRITE_URL = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const SPECIES_URL = (name) =>
  `https://pokeapi.co/api/v2/pokemon-species/${encodeURIComponent(name.toLowerCase())}`;

function get(url, asJson) {
  return new Promise((resolve, reject) => {
    https.get(url, caOpts, (r) => {
      if (r.statusCode !== 200) { reject(new Error(`${r.statusCode} for ${url}`)); return; }
      const chunks = [];
      r.on("data", (d) => chunks.push(d));
      r.on("end", () => {
        const buf = Buffer.concat(chunks);
        resolve(asJson ? JSON.parse(buf.toString("utf8")) : buf);
      });
    }).on("error", reject);
  });
}

async function resolveId(token) {
  if (/^\d+$/.test(token)) return { id: Number(token), name: token };
  const [name, dex] = token.split(":");
  if (dex && /^\d+$/.test(dex)) return { id: Number(dex), name };
  const species = await get(SPECIES_URL(name), true); // resolve name -> dex id
  return { id: species.id, name };
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length) { console.error("Pass Pokemon names or dex numbers."); process.exit(1); }

  const outPath = path.join(__dirname, "..", "data", "sprites.js");
  let existing = {};
  if (fs.existsSync(outPath)) {
    const txt = fs.readFileSync(outPath, "utf8");
    const m = txt.match(/window\.SPRITES\s*=\s*(\{[\s\S]*\});/);
    if (m) { try { existing = JSON.parse(m[1]); } catch (_) {} }
  }

  for (const token of args) {
    const { id, name } = await resolveId(token);
    if (existing[id]) { console.log(`skip ${name} (#${id}) — already present`); continue; }
    const buf = await get(SPRITE_URL(id), false);
    existing[id] = "data:image/png;base64," + buf.toString("base64");
    console.log(`added ${name} (#${id}) — ${buf.length}B`);
  }

  const header =
    "/*\n * sprites.js — offline Pokemon sprites as base64 data URIs.\n" +
    " * Keyed by National Dex number. Regenerate with tools/fetch-sprites.js.\n */\n";
  fs.writeFileSync(outPath, header + "window.SPRITES = " + JSON.stringify(existing) + ";\n");
  console.log(`wrote ${outPath} (${fs.statSync(outPath).size}B, ${Object.keys(existing).length} sprites)`);
}

main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
