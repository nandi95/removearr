export function useAuth() {
    const user = useState<string | null | undefined>('user');

    async function load() {
        if (user.value === undefined) user.value = (await $fetch<{ user: string | null }>('/api/auth/me')).user;
        return user.value;
    }

    async function logout() {
        await $fetch('/api/auth/logout', { method: 'POST' });
        user.value = null;
        await navigateTo('/login');
    }

    return { user, load, logout };
}
