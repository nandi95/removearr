export default defineEventHandler(async event => {
    const path = getRequestURL(event).pathname;
    if (!path.startsWith('/api/') || path.startsWith('/api/auth/')) return;
    const session = await getAuthSession(event);
    if (!session.data.user) throw createError({ statusCode: 401, message: 'Sign in required' });
});
