# 🎉 Bachelor Party HQ — Jason's Bachelor Party

A **100% local** web app for the big weekend. No internet required, no accounts,
no build step. Themes: **Bulbasaur / Pokémon**, **Indiana Hoosiers** (Fernando
Mendoza), **Carolina Panthers** (a.k.a. *Team Persian*), and pure **lake house
vibes**.

## What's inside

- **🏆 Victory Road** — the Beer Olympics scoreboard. Award points per team per
  event, watch live standings and medals update in real time.
- **🎡 Draft & Wheel** — spin a wheel to pick a trainer, assign them to a team,
  and manage a live draft board (with an auto-balance button).
- **🎴 Trainer Cards** — Pokémon-style cards for everyone attending. Fully
  editable (name, nickname, type, team, signature move).
- **🗓️ Itinerary** — the weekend schedule on a clean timeline.
- **😂 Meme Vault** — add memes by URL or upload straight from your phone/laptop.
- **⚙️ Settings** — edit party info, teams, and events; export/import a backup;
  reset to defaults.

## How to run it

### Easiest (recommended)
- **Mac:** double-click `start.command`
- **Windows:** double-click `start.bat`

These start a tiny local web server and open the app in your browser. Everyone
on the **same Wi‑Fi** can also join from their phones: find the host computer's
local IP (e.g. `192.168.1.42`) and visit `http://192.168.1.42:8000`.

> Note: each device keeps its **own** copy of the data in its browser. For a
> shared scoreboard, run it on one laptop/TV and use that as the "control
> center." Use **Settings ▸ Export/Import** to copy data between devices.

### Manual
From this folder, run any static server, e.g.:
```bash
python3 -m http.server 8000      # then open http://localhost:8000
# or:  npx serve .
```

You *can* also just double-click `index.html`, but some browsers restrict local
storage on `file://` — serving it (above) is more reliable.

## Adding your real info

Open **`data/seed.js`** and edit the arrays:

- `party` — title, date/time, location, blurb (drives the home page + countdown)
- `attendees` — the real crew (name, team, Pokémon type, catchphrase)
- `teams` — team names, emojis, colors
- `events` — Victory Road events and their point values
- `activities` — the itinerary
- `memes` — starter memes (or add them in-app)

After editing `seed.js`, open the app and use **Settings ▸ Reset to defaults**
to reload the fresh data (this wipes in-app edits/scores, so do it before the
party starts). You can also just edit everything in-app — changes are saved
automatically in the browser.

## Tech notes

- Plain HTML/CSS/JavaScript. No dependencies, no CDNs, works offline.
- State is stored in the browser via `localStorage`.
- Structure:
  - `index.html` — shell + script order
  - `css/styles.css` — the theme
  - `data/seed.js` — all editable content
  - `js/` — `store`, `router`, `util`, `modal`, `app`, and one file per view in `js/views/`

Gotta party 'em all. 🔴⚪
