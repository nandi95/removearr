## Removarr
Media removal automation for Plex Media Server ([servarr](https://wiki.servarr.com/))

> 🏗️ Work in progress

Currently, the aim is to make it work for my setup before making it more generic/configurable.

- Long term todos:
  - [ ] swanky UI for configuration
  - [ ] remove stalled downloads from download client


It relies on
- [Tautulli](https://tautulli.com/) for Plex Media Server monitoring (retrieving user history)
- [Radarr](https://radarr.video/) for movie management (removing movies)

To run:
```bash
deno run -A main.ts
```

Example usage with docker compose in [compose.yml](./compose.yml)

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
and the space is actually reclaimed. Removarr itself only calls the arr APIs and never touches the disk.
