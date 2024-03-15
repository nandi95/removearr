import tautulliRequest from "./tautulliRequest.ts";

/**
 * Get medias that have been started to be watched.
 */
export default async function getPlayedMovies() {
    const libraries = await tautulliRequest(
        'get_libraries',
        { body: { refresh: 'true' } }
    );

    const movieLibrary = libraries.find(library => library.section_type === 'movie');

    if (!movieLibrary) {
        throw new Error('No movie library found');
    }

    const { data } = await tautulliRequest(
        'get_library_media_info',
        { body: { refresh: 'true', section_id: movieLibrary.section_id, length: movieLibrary.count, order_column: 'last_played' } }
    );

    return data.filter(movie => movie.last_played);
}
