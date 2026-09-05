import { MyPlexAccount, type PlexServer } from '@ctrl/plex';

let client: PlexServer | undefined;

async function getPlexClient() {
    if (!client) {
        const account = await new MyPlexAccount(config.plexUrl, config.plexEmail, config.plexPassword).connect();
        const resource = await account.resource(config.plexServerName);
        client = await resource.connect();
    }

    return client;
}

const TITLE = 'Leaving Soon';
const SUMMARY = 'These media will be leaving the platform soon.';
const MODE = { hide: -1, showItems: 2 };

const itemUri = (ratingKeys: number[]) =>
    encodeURIComponent(`server://${config.plexServerId}/com.plexapp.plugins.library/library/metadata/${ratingKeys.join(',')}`);

/** Make the collection contain exactly these rating keys. Returns what changed. */
export async function syncLeavingSoon(ratingKeys: number[]) {
    const plex = await getPlexClient();
    const library = await plex.library();
    // ponytail: movie section name is the user's; env override if it ever differs
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty env must fall back too
    const section = await library.section(process.env.PLEX_MOVIE_SECTION || 'Films');
    const collection = (await section.collections()).find(c => c.title === TITLE);

    if (!collection) {
        if (!ratingKeys.length) return { added: 0, removed: 0 };

        // plex rejects adds to a collection that was created empty, so it is born with its first items
        log.info(`Creating Plex "${TITLE}" collection with ${ratingKeys.length} movies`);
        const params = new URLSearchParams({ type: '1', title: TITLE, smart: '0', sectionId: String(section.key) });
        const created: any = await plex.query(`/library/collections?${params}&uri=${itemUri(ratingKeys)}`, 'post');
        const key = created.MediaContainer.Metadata[0].ratingKey;
        await plex.query(`/library/sections/${section.key}/all?type=18&id=${key}&summary.value=${encodeURIComponent(SUMMARY)}`, 'put');
        await plex.query(`/library/collections/${key}/prefs?collectionMode=${MODE.showItems}`, 'put');

        return { added: ratingKeys.length, removed: 0 };
    }

    const items = await collection.items();
    const current = new Set(items.map(item => Number(item.ratingKey)));
    const wanted = new Set(ratingKeys);

    const add = ratingKeys.filter(key => !current.has(key));
    const remove = items.filter(item => !wanted.has(Number(item.ratingKey)));

    if (add.length) await plex.query(`/library/collections/${collection.ratingKey}/items?uri=${itemUri(add)}`, 'put');
    await Promise.all(remove.map(async item => plex.query(`/library/collections/${collection.ratingKey}/children/${item.ratingKey}`, 'delete')));

    // hide the collection when it is empty, show it when it is not
    const before = items.length > 0;
    const after = wanted.size > 0;
    if (before !== after) {
        await plex.query(`/library/collections/${collection.ratingKey}/prefs?collectionMode=${after ? MODE.showItems : MODE.hide}`, 'put');
    }

    return { added: add.length, removed: remove.length };
}
