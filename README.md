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

The SQLite database lives in the `removearr-data` volume (mounted at `/app/.data`).

### Adding it to an existing compose stack

No clone needed, the image is on Docker Hub. Drop this next to your arrs and fill in the env
(see [.env.example](./.env.example) for every variable):

```yaml
services:
  removearr:
    image: nandi95/removearr:main
    container_name: removearr
    ports:
      - "8484:8484"
    environment:
      TAUTULLI_API_KEY: ${TAUTULLI_API_KEY}
      TAUTULLI_API_URL: http://tautulli:8181/api/v2
      RADARR_API_KEY: ${RADARR_API_KEY}
      RADARR_API_URL: http://radarr:7878/api/v3
      SONARR_API_KEY: ${SONARR_API_KEY}
      SONARR_API_URL: http://sonarr:8989/api/v3
      SEER_API_KEY: ${SEER_API_KEY}
      SEER_URL: http://seerr:5055
      PLEX_URL: http://plex:32400
      PLEX_SERVER_ID: ${PLEX_SERVER_ID}
      PLEX_SERVER_NAME: ${PLEX_SERVER_NAME}
      PLEX_EMAIL: ${PLEX_EMAIL}
      PLEX_PASSWORD: ${PLEX_PASSWORD}
      SESSION_SECRET: ${REMOVEARR_SESSION_SECRET}   # openssl rand -hex 32
      TZ: Europe/London
    volumes:
      - removearr-data:/app/.data
    restart: unless-stopped

volumes:
  removearr-data:
```

Service hostnames (`radarr`, `sonarr`, ...) resolve when the containers share a compose network. If your arrs
run with `network_mode: host`, use the host's LAN IP instead. Keep the named volume, the container runs as
`node` and cannot write to a root-owned bind mount.

## Deployment

Pushing to `main` builds a multi-arch image and publishes it as `nandi95/removearr:main`
([workflow](.github/workflows/publish-docker.yml)).

First time:

```bash
git clone https://github.com/nandi95/removearr.git && cd removearr
cp .env.example .env    # fill in the values; if the arrs use host networking, point at the host's LAN IP
docker compose up -d    # http://<host>:8484
```

Updating:

```bash
# Push changes to git, CI publishes the image
git push

# On the host (or let Watchtower pick it up):
cd removearr && docker compose pull && docker compose up -d && docker image prune -f
```

The container exits on startup if any required env var is missing or the SQLite file cannot be opened,
so a crash loop after `up -d` means check `docker logs removearr`.

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
