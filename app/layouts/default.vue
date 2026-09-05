<script setup lang="ts">
const { data, movies, series, totals } = useLibrary();
const { syncing, sync } = useSync();
const { user, logout } = useAuth();
const selected = useSelected();
const open = ref(false);

const links = computed(() => [
    { label: 'Overview', icon: 'i-lucide-layout-dashboard', to: '/' },
    { label: 'Review', icon: 'i-lucide-list-checks', to: '/review', badge: totals.value.deletable.length || undefined },
    { label: 'Library', icon: 'i-lucide-clapperboard', to: '/library' },
    { label: 'Activity', icon: 'i-lucide-history', to: '/activity' }
]);

const groups = computed(() => [
    { id: 'pages', label: 'Go to', items: links.value.map(({ label, icon, to }) => ({ label, icon, to })) },
    { id: 'actions', label: 'Actions', items: [{ label: 'Sync now', icon: 'i-lucide-refresh-cw', onSelect: sync }] },
    {
        id: 'movies', label: 'Movies',
        items: movies.value.map(m => ({ label: m.title, suffix: String(m.year), icon: 'i-lucide-film', onSelect: () => { selected.value = { kind: 'movie', id: m.id }; } }))
    },
    {
        id: 'series', label: 'Series',
        items: series.value.map(s => ({ label: s.title, suffix: String(s.year), icon: 'i-lucide-tv', onSelect: () => { selected.value = { kind: 'series', id: s.id }; } }))
    }
]);

const lastSync = computed(() => data.value?.lastSync);
const syncText = computed(() => {
    if (!lastSync.value) return 'Never synced';
    return `${lastSync.value.ok ? 'Synced' : 'Sync failed'} ${relativeTime(lastSync.value.at)}`;
});
const nextText = computed(() => data.value?.nextRun ? `Next ${relativeTime(data.value.nextRun)}` : '');
</script>

<template>
    <UDashboardGroup unit="rem">
        <UDashboardSidebar id="default"
                           v-model:open="open"
                           collapsible
                           resizable
                           class="bg-elevated/25"
                           :ui="{ footer: 'lg:border-t lg:border-default' }">
            <template #header="{ collapsed }">
                <NuxtLink to="/" class="flex items-center gap-2.5 p-1">
                    <span class="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-inverted shadow-lg shadow-primary/30">
                        <UIcon name="i-lucide-eraser" class="size-4.5" />
                    </span>
                    <span v-if="!collapsed" class="truncate text-base font-semibold tracking-tight">
                        Remove<span class="text-primary">Arr</span>
                    </span>
                </NuxtLink>
            </template>

            <template #default="{ collapsed }">
                <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

                <UNavigationMenu :collapsed="collapsed"
                                 :items="links"
                                 orientation="vertical"
                                 tooltip />

                <UTooltip :text="`${syncText}${nextText ? ' · ' + nextText : ''}`" :disabled="!collapsed" class="mt-auto">
                    <div class="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted" :class="collapsed && 'justify-center'">
                        <span class="relative flex size-2 shrink-0">
                            <span v-if="syncing" class="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                            <span class="relative inline-flex size-2 rounded-full" :class="lastSync ? lastSync.ok ? 'bg-success' : 'bg-error' : 'bg-neutral-500'" />
                        </span>
                        <span v-if="!collapsed" class="truncate">
                            {{ syncText }}<span v-if="nextText" class="text-dimmed"> · {{ nextText }}</span>
                        </span>
                    </div>
                </UTooltip>
            </template>

            <template #footer="{ collapsed }">
                <div class="flex w-full items-center gap-1.5" :class="collapsed && 'flex-col'">
                    <UButton :label="collapsed ? undefined : 'Sync now'"
                             icon="i-lucide-refresh-cw"
                             :loading="syncing"
                             :square="collapsed"
                             variant="soft"
                             :block="!collapsed"
                             @click="sync" />
                    <UColorModeButton />
                    <UTooltip :text="`Sign out ${user}`">
                        <UButton icon="i-lucide-log-out"
                                 color="neutral"
                                 variant="ghost"
                                 aria-label="Sign out"
                                 @click="logout" />
                    </UTooltip>
                </div>
            </template>
        </UDashboardSidebar>

        <UDashboardSearch :groups="groups" />

        <slot />

        <MediaSlideover />
    </UDashboardGroup>
</template>
