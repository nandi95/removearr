export default defineEventHandler(async event => {
    const session = await getAuthSession(event);
    return { user: session.data.user ?? null };
});
