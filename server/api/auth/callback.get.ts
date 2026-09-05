export default defineEventHandler(async event => {
    const session = await getAuthSession(event);
    if (!session.data.pinId) throw createError({ statusCode: 400, message: 'No login in progress' });

    const pin = await $fetch<{ authToken: string | null }>(`https://plex.tv/api/v2/pins/${session.data.pinId}`, { headers: PLEX_HEADERS });
    if (!pin.authToken) return sendRedirect(event, '/login?error=Plex login was not completed');

    const headers = { ...PLEX_HEADERS, 'X-Plex-Token': pin.authToken };
    // this tool deletes media: only the server owner gets in
    const resources = await $fetch<{ clientIdentifier: string; owned: boolean }[]>('https://plex.tv/api/v2/resources', { headers });
    if (!resources.find(r => r.clientIdentifier === config.plexServerId)?.owned) {
        await session.clear();
        return sendRedirect(event, '/login?error=Only the owner of this Plex server can sign in');
    }

    const user = await $fetch<{ username: string }>('https://plex.tv/api/v2/user', { headers });
    await session.update({ pinId: undefined, user: user.username });
    log.info(`${user.username} signed in`);
    return sendRedirect(event, '/');
});
