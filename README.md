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
