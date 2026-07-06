# Live Sync (Firestore) — setup

The app is **local-first**: it runs 100% offline and stores everything in your
browser. Live Sync is an **optional** layer that mirrors the whole app state to
a Firestore document so multiple phones can share one live scoreboard.

- **Room** = one Firestore document at `rooms/{roomCode}`.
- The full app state is written as a single JSON string (`stateJson`). Using a
  string sidesteps Firestore's "no nested arrays" limit — the brackets feature
  uses nested arrays.
- **Last-write-wins** at party scale: whoever saves last wins. Great when one
  host drives the scoreboard and others mostly watch; simultaneous edits to the
  same thing can clobber. Not a CRDT.

## Joining (every guest — no setup)

The party's Firebase project (`jason-bach-party`) is **baked into the app**
(`js/sync.js` → `DEFAULT_CONFIG`), so guests never touch a config:

1. Open the app link → **Settings → Live Sync**.
2. Type the shared **room code**, pick **your trainer** under "You are".
3. Tap **Connect & sync** — the top-bar Poké Ball turns green when live.

## One-time project setup (already done for `jason-bach-party`)

Kept for reference / pointing the app at a different project:

1. [Firebase console](https://console.firebase.google.com/) → create a project →
   add a **Web App** (`</>`).
2. **Build → Firestore Database → Create database** (production mode, any region).
3. **Build → Authentication → Get started → Sign-in method → enable Anonymous.**
   (The app signs each device in silently; the rules below require it.)
4. **Firestore → Rules**, paste the rules below, click **Publish**.
5. Either replace `DEFAULT_CONFIG` in `js/sync.js`, or paste the new
   `firebaseConfig` into **Settings → Live Sync → Advanced** on each device.

## Security rules (Anonymous auth — recommended)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // The shared state document.
    match /rooms/{room} {
      allow read: if request.auth != null;
      // Cap the doc so a runaway write can't blow past Firestore's 1 MiB limit.
      allow write: if request.auth != null
                   && request.resource.data.stateJson.size() < 950000;
    }
    // Sub-channels: presence, challenges, the live battle, and photo moments.
    // (These are separate so heartbeats/photos never touch the state doc.)
    match /rooms/{room}/{sub}/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Alternative: open room-code rules (no auth)

If you'd rather skip Anonymous auth, you can use open rules. Anyone who knows the
**project ID + room code** can read/write that room, so rotate/rename the room
after the party.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{room} { allow read, write: if true; }
    match /rooms/{room}/{sub}/{docId} { allow read, write: if true; }
  }
}
```

## Notes

- The Firebase **web config is not a secret** (it's a public identifier); security
  comes from the rules above. That's why it's safe to bake `DEFAULT_CONFIG` into
  this public repo — the rules (anonymous auth required) are the actual gate.
- Turning sync **off** (Disconnect) drops back to pure local mode instantly.
- Sub-channels (`presence`, `challenges`, `live`, `photos`) are separate
  subcollections so heartbeats, live battles, and photos never bloat the state
  doc. Photos are downscaled (~512px JPEG) client-side before upload.
- Blaze plan: this uses tiny reads/writes (small docs), so a weekend of a dozen
  people is effectively free-tier-sized usage.
