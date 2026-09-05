import radarrRequest from "./radarrRequest.ts";
import type { Movie } from "../constants/radarrTypes.ts";

/** Delete a movie and its files via radarr. The hardlinked torrent copy is qbittorrent's job (share limit action: remove with content). */
export default function deleteMovie(movie: Movie) {
    return radarrRequest(`movie/${movie.id}?deleteFiles=true`, { method: 'DELETE' });
}
