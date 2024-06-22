import tautulliRequest from "./tautulliRequest.ts";
import {LibraryType} from "../constants/tautulliTypes.ts";

/**
 * Get media that have been started to be watched.
 */
export default async function getPlayedMedia(type: LibraryType) {
    const libraries = await tautulliRequest(
        'get_libraries',
        { body: { refresh: 'true' } }
    );

    const mediaLibrary = libraries.find(library => library.section_type === type);

    if (!mediaLibrary) {
        throw new Error(`No ${type} library found`);
    }

    const { data } = await tautulliRequest(
        'get_library_media_info',
        {
            body: {
                refresh: 'true',
                section_id: mediaLibrary.section_id,
                length: mediaLibrary.count,
                order_column: 'last_played'
            }
        }
    );

    return data.filter(movie => movie.last_played);
}
