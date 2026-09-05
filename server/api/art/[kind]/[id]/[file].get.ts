// radarr/sonarr serve artwork at <api base>/mediacover/<id>/<file>
const FILES: Record<string, string> = { poster: 'poster-250.jpg', backdrop: 'fanart-360.jpg' }

export default defineEventHandler((event) => {
  const { kind, id, file } = getRouterParams(event)
  const name = FILES[file!]

  if (!['movie', 'series'].includes(kind!) || !/^\d+$/.test(id!) || !name) throw createError({ statusCode: 404 })

  const movie = kind === 'movie'

  return proxyRequest(event, `${movie ? config.radarrUrl : config.sonarrUrl}/mediacover/${id}/${name}`, {
    headers: { 'X-Api-Key': movie ? config.radarrApiKey : config.sonarrApiKey },
    onResponse: e => setResponseHeader(e, 'Cache-Control', 'public, max-age=86400'),
  })
})
