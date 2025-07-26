import { OldWatchedMovieWithRadarr } from "../../main.ts";
import getPlexClient from "../utils/getPlexClient.ts";
import log from "../utils/logger.ts";
import config from "../utils/config.ts";

export enum PlexDataType {
    MOVIES = 1,
    SHOWS = 2,
    SEASONS = 3,
    EPISODES = 4,
}

enum CollectionMode {
    DEFAULT = -1,
    HIDE = 0,
    HIDEITEMS = 1,
    SHOWITEMS = 2
}

async function getLeavingSoonCollection() {
    const plex = await getPlexClient();
    const library = await plex.library();
    const section = await library.section('Films');

    // Query all collections (including hidden ones) to avoid creating duplicates
    const allCollections = await section.collections();
    let leavingSoonCollection = allCollections.find(collection => collection.title === 'Leaving Soon');

    if (!leavingSoonCollection) {
        log.debug('Leaving Soon collection not found, creating it now.');

        const body = {
            title: 'Leaving Soon',
            type: PlexDataType.MOVIES,
            summary: 'These media will be leaving the platform soon.',
            sectionId: section.key,
        };

        const res: any = await plex.query(
            '/library/collections?' +
            Object.entries(body).map(([key, value]) => `${key}=${value}`).join('&'),
            'post'
        );

        await plex.query(`/library/sections/${section.key}/all?type=18&id=${res.MediaContainer.Metadata[0].ratingKey}` +
            `&title.value=${encodeURIComponent(body.title)}&summary.value=${encodeURIComponent(body.summary)}`, 'put');

        // Re-query all collections to get the newly created one
        const updatedCollections = await section.collections();
        leavingSoonCollection = updatedCollections.find(collection => collection.title === 'Leaving Soon')!;

        log.debug('Leaving Soon collection created successfully.');
    } else {
        log.debug('Leaving Soon collection found (may be hidden), reusing existing collection.');
    }

    return leavingSoonCollection;
}

export default async function leavingSoonCollection() {
    const leavingSoonCollection = await getLeavingSoonCollection();
    const plex = await getPlexClient();

    return {
        add: async (movies: OldWatchedMovieWithRadarr[]) => {
            const items = await leavingSoonCollection.items();

            // if hidden, unhide collection
            if (items.length === 0 && movies.length > 0) {
                await plex.query(`/library/collections/${leavingSoonCollection.ratingKey}/prefs?collectionMode=${CollectionMode.SHOWITEMS}`, 'put');
            }

            const moviesNotAlreadyOnList = movies.filter(movie => !items.some(item => item.ratingKey === movie.tautulli.rating_key));

            if (!moviesNotAlreadyOnList.length) {
                log.info('All movies already on the list when adding to leaving soon.');
                return;
            }

            log.info(`Adding ${moviesNotAlreadyOnList.length} movies to the leaving soon collection.`)

            await Promise.all(moviesNotAlreadyOnList.map(movie => {
                return plex.query(
                    `/library/collections/${leavingSoonCollection.ratingKey}/items?uri=server://${config.plexServerID}/com.plexapp.plugins.library/library/metadata/${movie.tautulli.rating_key}`,
                    'put'
                );
            }));

        },
        remove: async (movies: OldWatchedMovieWithRadarr[]) => {
            const items = await leavingSoonCollection.items();

            const itemsToRemove = items
                // only remove collections items if they are in the collection
                .filter(item => movies.some(movie => movie.tautulli.rating_key === item.ratingKey))
                .map(item => plex.query(`/library/collections/${leavingSoonCollection.ratingKey}/children/${item.ratingKey}`, 'delete'));

            await Promise.all(itemsToRemove);

            if (items.length === itemsToRemove.length) {
                // if nothing left in the collection, hide it
                await plex.query(`/library/collections/${leavingSoonCollection.ratingKey}/prefs?collectionMode=${CollectionMode.DEFAULT}`, 'put');
            }

            log.info(`Removed ${itemsToRemove.length} movies from the leaving soon collection.`)
        }
    }
}
