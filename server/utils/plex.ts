import { MyPlexAccount, type PlexServer } from '@ctrl/plex'

let client: PlexServer | undefined

async function getPlexClient() {
  if (!client) {
    const account = await new MyPlexAccount(config.plexUrl, config.plexEmail, config.plexPassword).connect()
    const resource = await account.resource(config.plexServerName)
    client = await resource.connect()
  }

  return client
}

const TITLE = 'Leaving Soon'
const SUMMARY = 'These media will be leaving the platform soon.'
const MODE = { hide: -1, showItems: 2 }

async function getCollection() {
  const plex = await getPlexClient()
  const library = await plex.library()
  // ponytail: movie section name is the user's; env override if it ever differs
  const section = await library.section(process.env.PLEX_MOVIE_SECTION || 'Films')

  const existing = (await section.collections()).find(c => c.title === TITLE)
  if (existing) return { plex, section, collection: existing }

  log.info('Creating Plex "Leaving Soon" collection')
  const params = new URLSearchParams({ title: TITLE, type: '1', summary: SUMMARY, sectionId: String(section.key) })
  const created: any = await plex.query(`/library/collections?${params}`, 'post')
  const ratingKey = created.MediaContainer.Metadata[0].ratingKey
  await plex.query(`/library/sections/${section.key}/all?type=18&id=${ratingKey}&title.value=${encodeURIComponent(TITLE)}&summary.value=${encodeURIComponent(SUMMARY)}`, 'put')

  return { plex, section, collection: (await section.collections()).find(c => c.title === TITLE)! }
}

/** Make the collection contain exactly these rating keys. Returns what changed. */
export async function syncLeavingSoon(ratingKeys: number[]) {
  const { plex, collection } = await getCollection()
  const items = await collection.items()
  const current = new Set(items.map(item => Number(item.ratingKey)))
  const wanted = new Set(ratingKeys)

  const add = ratingKeys.filter(key => !current.has(key))
  const remove = items.filter(item => !wanted.has(Number(item.ratingKey)))

  await Promise.all([
    ...add.map(key => plex.query(
      `/library/collections/${collection.ratingKey}/items?uri=server://${config.plexServerId}/com.plexapp.plugins.library/library/metadata/${key}`,
      'put',
    )),
    ...remove.map(item => plex.query(`/library/collections/${collection.ratingKey}/children/${item.ratingKey}`, 'delete')),
  ])

  // hide the collection when it is empty, show it when it is not
  const before = items.length > 0
  const after = wanted.size > 0
  if (before !== after) {
    await plex.query(`/library/collections/${collection.ratingKey}/prefs?collectionMode=${after ? MODE.showItems : MODE.hide}`, 'put')
  }

  return { added: add.length, removed: remove.length }
}
