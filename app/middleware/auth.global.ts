export default defineNuxtRouteMiddleware(async to => {
    const user = await useAuth().load();
    if (!user && to.path !== '/login') return navigateTo('/login');
    if (user && to.path === '/login') return navigateTo('/');
});
