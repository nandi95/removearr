export default defineEventHandler(async event => {
    const pin = await $fetch<{ id: number; code: string }>('https://plex.tv/api/v2/pins?strong=true', { method: 'POST', headers: PLEX_HEADERS });
    const session = await getAuthSession(event);
    await session.update({ pinId: pin.id });

    const params = new URLSearchParams({
        clientID: PLEX_HEADERS['X-Plex-Client-Identifier'],
        code: pin.code,
        forwardUrl: `${getRequestURL(event).origin}/api/auth/callback`,
        'context[device][product]': 'RemoveArr'
    });
    return sendRedirect(event, `https://app.plex.tv/auth#?${params}`);
});
