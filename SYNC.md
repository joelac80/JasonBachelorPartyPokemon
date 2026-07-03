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

## One-time setup (≈5 minutes)

1. Go to the [Firebase console](https://console.firebase.google.com/) and
   create a project (or reuse one). Add a **Web App** (`</>`).
2. **Build → Firestore Database → Create database** (production mode, any region).
3. **Build → Authentication → Get started → Sign-in method → enable Anonymous.**
   (The app signs each device in silently; the rules below require it.)
4. **Firestore → Rules**, paste the rules below, click **Publish**.
5. In the app: **Settings → Live Sync** → paste your `firebaseConfig` object,
   choose a shared **room code**, enter your name, tap **Connect & sync**.
6. On every other phone: open the app → **Settings** → paste the **same** config
   and room code → **Connect**.

## Security rules (Anonymous auth — recommended)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{room} {
      // Any signed-in (anonymous) device can read/write a room.
      // Cap the doc so a runaway write can't blow past Firestore's 1 MiB limit.
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.resource.data.stateJson.size() < 900000;
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
    match /rooms/{room} {
      allow read, write: if true;
    }
  }
}
```

## Notes

- The Firebase **web config is not a secret** (it's a public identifier); security
  comes from the rules above. It's kept out of this repo and pasted per-device on
  purpose, since the repo is public.
- Turning sync **off** (Disconnect) drops back to pure local mode instantly.
- Blaze plan: this uses tiny reads/writes (one small doc), so a weekend of a dozen
  people is effectively free-tier-sized usage.
