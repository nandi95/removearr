import { OldWatchedMovieWithRadarrId } from "../../main.ts";
import getPlexClient from "../utils/getPlexClient.ts";
import log from "../utils/logger.ts";
import config from "../utils/config.ts";
import type { MediaContainer } from "npm:@ctrl/plex";
import logger from "../utils/logger.ts";

export enum EPlexDataType {
    MOVIES = 1,
    SHOWS = 2,
    SEASONS = 3,
    EPISODES = 4,
}

async function getLeavingSoonCollection() {
    const plex = await getPlexClient();
    const library = await plex.library();
    const section = await library.section('Films');
    const collections = await section.collections({ title: 'Leaving Soon' });

    let leavingSoonCollection = collections.find(collection => collection.title === 'Leaving Soon')!;

    if (!leavingSoonCollection) {
        log.debug('Leaving Soon collection not found, creating it now.');

        const body = {
            title: 'Leaving Soon',
            type: EPlexDataType.MOVIES,
            summary: 'These media will be leaving the platform soon.',
            sectionId: section.key,
        };

        const res: { MediaContainer: MediaContainer } = await plex.query(
            config.plexURL +
            '/library/collections?' +
            Object.entries(body).map(([key, value]) => `${key}=${value}`).join('&'),
            'post'
        );

        await plex.query(`/library/sections/${section.key}/all?type=18&id=${res.MediaContainer.Metadata[0].ratingKey}` +
            `&title.value=${encodeURIComponent(body.title)}&summary.value=${encodeURIComponent(body.summary)}`, 'put');

        leavingSoonCollection = await section.collections({ title: 'Leaving Soon' }).then(collections => {
            return collections.find(collection => collection.title === 'Leaving Soon')!;
        });
    }

    return leavingSoonCollection;
}

export default async function leavingSoonCollection() {
    const leavingSoonCollection = await getLeavingSoonCollection();
    const plex = await getPlexClient();

    return {
        add: async (movies: OldWatchedMovieWithRadarrId[]) => {
            const items = await leavingSoonCollection.items();

            // todo if hidden, unhide collection

            const moviesNotAlreadyOnList = movies.filter(movie => !items.some(item => item.ratingKey === movie.rating_key));

            if (!moviesNotAlreadyOnList.length) {
                log.info('All movies already on the list when adding to leaving soon.');
                return;
            }

            log.info(`Adding ${moviesNotAlreadyOnList.length} movies to the leaving soon collection.`)

            await Promise.all(moviesNotAlreadyOnList.map(movie => {
                return plex.query(
                    `/library/collections/${leavingSoonCollection.ratingKey}/items?uri=server://${config.plexServerID}/com.plexapp.plugins.library/library/metadata/${movie.rating_key}`,
                    'put'
                );
            }));

        },
        remove: async (movies: OldWatchedMovieWithRadarrId[]) => {
            const items = await leavingSoonCollection.items();

            const itemsToRemove = items
                // only remove collections items if they are in the collection
                .filter(item => movies.some(movie => movie.rating_key === item.ratingKey))
                .map(item => plex.query(`/library/collections/${leavingSoonCollection.ratingKey}/children/${item.ratingKey}`, 'delete'));

            await Promise.all(itemsToRemove);

            if (items.length === itemsToRemove.length) {
                // todo - if nothing left in the collection, hide it
                // await plex.query(`/library/collections/${leavingSoonCollection.ratingKey}/prefs?collectionMode=0`, 'put')
            }

            log.info(`Removed ${itemsToRemove.length} movies from the leaving soon collection.`)
        }
    }
}
