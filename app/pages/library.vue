<script setup lang="ts">
import type { Kind, LibraryMovie, LibrarySeries, Status } from '#shared/types';

useHead({ title: 'Library' });

const { status: fetchStatus, data, movies, series } = useLibrary();

const kind = ref<Kind>('movie');
const query = ref('');
const filter = ref<Status | 'all' | 'unwatched'>('all');
const requester = ref<string>('all');
const sort = ref<'size' | 'lastPlayed' | 'added' | 'title'>('size');
const desc = ref(true);

const requesters = computed(() => {
    const names = new Set([...movies.value, ...series.value].map(i => i.requestedBy).filter(Boolean) as string[]);
    return [{ label: 'Anyone', value: 'all' }, ...[...names].sort().map(n => ({ label: n, value: n }))];
});

const items = computed<(LibraryMovie | LibrarySeries)[]>(() => {
    const source: (LibraryMovie | LibrarySeries)[] = kind.value === 'movie' ? movies.value : series.value;
    const q = query.value.trim().toLowerCase();

    return source
        .filter(i => !q || i.title.toLowerCase().includes(q))
        .filter(i => filter.value === 'all' || (filter.value === 'unwatched' ? !i.lastPlayed : i.status === filter.value))
        .filter(i => requester.value === 'all' || i.requestedBy === requester.value)
        .sort((a, b) => {
            // never-watched items always sink when sorting by watch date
            if (sort.value === 'lastPlayed' && !a.lastPlayed !== !b.lastPlayed) return a.lastPlayed ? -1 : 1;
            let cmp = 0;
            if (sort.value === 'title') cmp = a.title.localeCompare(b.title);
            else if (sort.value === 'added') cmp = Date.parse(a.added) - Date.parse(b.added);
            else cmp = (a[sort.value] ?? 0) - (b[sort.value] ?? 0);
            return desc.value ? -cmp : cmp;
        });
});

const totalBytes = computed(() => items.value.reduce((acc, i) => acc + i.size, 0));
const loading = computed(() => fetchStatus.value === 'pending' && !data.value);
</script>

<template>
    <UDashboardPanel id="library">
        <template #header>
            <UDashboardNavbar title="Library">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <span class="text-xs text-muted tabular-nums">{{ plural(items.length, 'item') }} · {{ gb(totalBytes, 0) }}</span>
                </template>
            </UDashboardNavbar>
            <UDashboardToolbar>
                <template #left>
                    <UTabs v-model="kind"
                           :items="[{ label: 'Movies', value: 'movie', icon: 'i-lucide-film' }, { label: 'Series', value: 'series', icon: 'i-lucide-tv' }]"
                           :content="false"
                           size="sm"
                           variant="link" />
                    <UInput v-model="query"
                            icon="i-lucide-search"
                            placeholder="Search titles…"
                            size="sm"
                            class="w-48"
                            :ui="{ trailing: 'pe-1' }">
                        <template v-if="query" #trailing>
                            <UButton icon="i-lucide-x"
                                     color="neutral"
                                     variant="link"
                                     size="xs"
                                     aria-label="Clear"
                                     @click="query = ''" />
                        </template>
                    </UInput>
                </template>
                <template #right>
                    <USelect v-model="filter"
                             :items="[
                                 { label: 'Any status', value: 'all' },
                                 { label: 'Deletable', value: 'deletable' },
                                 { label: 'Leaving soon', value: 'soon' },
                                 { label: 'Kept', value: 'snoozed' },
                                 { label: 'Unwatched', value: 'unwatched' }
                             ]"
                             size="sm"
                             class="w-36"
                             icon="i-lucide-filter" />
                    <USelect v-model="requester"
                             :items="requesters"
                             size="sm"
                             class="w-36"
                             icon="i-lucide-user" />
                    <USelect v-model="sort"
                             :items="[{ label: 'Size', value: 'size' }, { label: 'Last watched', value: 'lastPlayed' }, { label: 'Date added', value: 'added' }, { label: 'Title', value: 'title' }]"
                             size="sm"
                             class="w-36" />
                    <UButton :icon="desc ? 'i-lucide-arrow-down-wide-narrow' : 'i-lucide-arrow-up-narrow-wide'"
                             color="neutral"
                             variant="subtle"
                             size="sm"
                             :aria-label="desc ? 'Descending' : 'Ascending'"
                             @click="desc = !desc" />
                </template>
            </UDashboardToolbar>
        </template>

        <template #body>
            <div v-if="loading" class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-5">
                <div v-for="i in 18" :key="i" class="space-y-2">
                    <USkeleton class="poster w-full rounded-lg" />
                    <USkeleton class="h-4 w-3/4" />
                    <USkeleton class="h-3 w-1/2" />
                </div>
            </div>
            <UEmpty v-else-if="!items.length"
                    icon="i-lucide-search-x"
                    title="No matches"
                    description="Try a different search or clear the filters."
                    variant="naked"
                    class="py-16"
                    :actions="[{ label: 'Clear filters', color: 'neutral', variant: 'subtle', onClick: () => { query = ''; filter = 'all'; requester = 'all' } }]" />
            <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-5">
                <PosterCard v-for="item in items"
                            :key="item.id"
                            :kind="kind"
                            :item="item" />
            </div>
        </template>
    </UDashboardPanel>
</template>
