## Removarr
Media removal automation for Plex Media Server ([servarr](https://wiki.servarr.com/))

> 🏗️ Work in progress

- Long term todos:
  - [ ] swanky UI for configuration
  - [ ] remove stalled downloads from download client


It relies on
- [Tautulli](https://tautulli.com/) for Plex Media Server monitoring (retrieving user history)
- [Radarr](https://radarr.video/) for movie management (removing movies)
- [Overseerr](https://overseerr.dev/) for requesting media (for movies to be tagged automatically as the requester)

To run:
```bash
deno run -A main.ts
```
