# RemoveArr

Reclaims disk space on a Plex + [servarr](https://wiki.servarr.com/) stack by finding media the requester has already
finished watching and nobody has touched for a while, then letting you delete it with one click.

> Deletion is always a human action in the UI. The scheduled job only *proposes*.

## How it works

- Every night (`CRON_SCHEDULE`) RemoveArr joins Radarr, Sonarr and Tautulli history and marks each movie / season:
  - **Deletable** — the person who requested it (Radarr/Sonarr tag like `1-johndoe`) fully watched it and it has been
    idle for `DELETE_AFTER_DAYS` (default 14).
  - **Leaving soon** — same, but only idle for half that.
  - **Kept** — you snoozed it (30 / 90 days or forever).
- Movies that are leaving soon or deletable are mirrored into a Plex collection called **Leaving Soon** so viewers get a heads-up.
- The UI has an overview, a review queue with bulk delete, a library browser and an activity log. Sync runs and deletions
  are stored in a small SQLite file.
- Deleting a season unmonitors it and removes its files; when nothing else of the series is on disk and no unaired season
  has a [Seerr](https://github.com/seerr-team/seerr) request, the whole series is removed from Sonarr.

Requires Tautulli, Radarr, Sonarr, Seerr and Plex credentials — see [.env.example](./.env.example).

## Run with Docker

```bash
cp .env.example .env   # fill in your values
docker compose up -d   # http://localhost:8484
```

The SQLite database lives in `./data` (mounted at `/app/.data`).

## Develop

```bash
npm install
npm run dev        # http://localhost:3000, reads .env
npm test           # vitest
npm run typecheck
```

`npm run build && node --env-file=.env .output/server/index.mjs` runs the production build locally.

## Why deleting in Sonarr/Radarr did not free disk space

With the [TRaSH guides](https://trash-guides.info/) layout, `/data/torrents` and `/data/media` sit on the same
filesystem and the arrs import by **hardlinking** the download into the media folder. A hardlink is a second
directory entry for the same data, not a symlink, so nothing about the media file reveals it (only the
`nlink` count does). Deleting through Sonarr/Radarr removes the media link only. The data stays alive as
long as the torrent copy exists, so the delete frees nothing.

The torrent copy is supposed to go when seeding finishes. Sonarr/Radarr have "Remove Completed" on and
would remove the torrent *with its files* once the per-torrent seed ratio/time (set from the Prowlarr
indexer settings) is reached. That never happened here because qBittorrent's own share-limit action
(Options → BitTorrent → Seeding Limits → "then") was set to "Remove torrent", which drops the torrent but
keeps the files before the arrs get to it. Years of this left ~700 untracked entries in `/data/torrents`.

Fix: set that dropdown to **"Remove torrent and its files"** (or "Stop torrent" and let the arrs remove
it). The global limit checkboxes stay off; the dropdown still governs the per-torrent limits. The UI greys
the dropdown out until a checkbox is ticked, so tick one, change it, save, untick, save.

Now a Sonarr/Radarr delete is enough: the torrent copy is already gone, the media link is the last one,
and the space is actually reclaimed. RemoveArr itself only calls the arr APIs and never touches the disk.
