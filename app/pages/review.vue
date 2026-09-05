<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import type { Candidate } from '~/composables/useLibrary';

useHead({ title: 'Review' });

const route = useRoute();
const router = useRouter();
const { status: fetchStatus, data, totals, keep } = useLibrary();
const selected = useSelected();
const toast = useToast();

type Tab = 'deletable' | 'soon' | 'snoozed';
const tab = computed({
    get: () => (['deletable', 'soon', 'snoozed'].includes(String(route.query.tab)) ? route.query.tab : 'deletable') as Tab,
    set: async v => router.replace({ query: { ...route.query, tab: v === 'deletable' ? undefined : v } })
});
const tabs = computed(() => [
    { label: 'Deletable', value: 'deletable', icon: 'i-lucide-trash-2', badge: totals.value.deletable.length || undefined },
    { label: 'Leaving soon', value: 'soon', icon: 'i-lucide-hourglass', badge: totals.value.soon.length || undefined },
    { label: 'Kept', value: 'snoozed', icon: 'i-lucide-bookmark', badge: totals.value.snoozed.length || undefined }
]);

const kind = ref<'all' | 'movie' | 'series'>('all');
const view = useCookie<'table' | 'grid'>('review-view', { default: () => 'table' });
const sort = ref<'size' | 'idle' | 'title'>('size');

const rows = computed(() => {
    const list = totals.value[tab.value].filter(c => kind.value === 'all' || c.kind === kind.value);
    return [...list].sort((a, b) => {
        if (sort.value === 'title') return a.title.localeCompare(b.title);
        if (sort.value === 'idle') return (a.lastActivity ?? Infinity) - (b.lastActivity ?? Infinity);
        return b.size - a.size;
    });
});

// selection is our own Set so it survives data mutations
const picked = ref(new Set<string>());
const pickedRows = computed(() => rows.value.filter(r => picked.value.has(r.key)));
const pickedBytes = computed(() => pickedRows.value.reduce((acc, c) => acc + c.size, 0));
const allPicked = computed(() => rows.value.length > 0 && rows.value.every(r => picked.value.has(r.key)));
const toggle = (key: string) => {
    if (!picked.value.delete(key)) picked.value.add(key);
};
const toggleAll = () => {
    if (allPicked.value) picked.value.clear();
    else rows.value.forEach(r => picked.value.add(r.key));
};
watch([tab, kind], () => picked.value.clear());

const confirmOpen = ref(false);
function onDeleted(deleted: Candidate[]) {
    deleted.forEach(c => picked.value.delete(c.key));
    if (deleted.length) {
        toast.add({ title: `Deleted ${plural(deleted.length, 'item')}`, description: `${gb(deleted.reduce((a, c) => a + c.size, 0))} reclaimed`, icon: 'i-lucide-check', color: 'success' });
    }
}

const keeping = ref(false);
async function keepPicked(until: string | null) {
    keeping.value = true;
    const items = pickedRows.value;
    try {
        await Promise.all(items.map(async c => keep(c, until)));
        picked.value.clear();
        toast.add({ title: `Kept ${plural(items.length, 'item')}`, icon: 'i-lucide-bookmark', color: 'neutral' });
    } catch (error: any) {
        toast.add({ title: 'Could not keep some items', description: error?.data?.message ?? String(error), color: 'error' });
    } finally {
        keeping.value = false;
    }
}
const inDays = (days: number) => new Date(Date.now() + days * 86400_000).toISOString();
const keepItems = [
    { label: 'Keep 30 days', icon: 'i-lucide-calendar-clock', onSelect: async () => keepPicked(inDays(30)) },
    { label: 'Keep 90 days', icon: 'i-lucide-calendar-clock', onSelect: async () => keepPicked(inDays(90)) },
    { label: 'Keep forever', icon: 'i-lucide-bookmark', onSelect: async () => keepPicked(null) }
];

const columns: TableColumn<Candidate>[] = [
    { id: 'select', meta: { class: { th: 'w-10', td: 'w-10' } } },
    { id: 'item', header: 'Item', meta: { class: { td: 'max-w-0 w-full' } } },
    { accessorKey: 'requestedBy', header: 'Requested by', meta: { class: { th: 'hidden md:table-cell', td: 'hidden md:table-cell' } } },
    { id: 'watchedBy', header: 'Watched by', meta: { class: { th: 'hidden lg:table-cell', td: 'hidden lg:table-cell' } } },
    { id: 'idle', header: 'Idle', meta: { class: { th: 'text-right', td: 'text-right tabular-nums' } } },
    { accessorKey: 'size', header: 'Size', meta: { class: { th: 'text-right', td: 'text-right tabular-nums' } } }
];

const empty = computed(() => ({
    deletable: { icon: 'i-lucide-party-popper', title: 'Nothing to delete', description: 'Come back after the next sync, or check what is leaving soon.' },
    soon: { icon: 'i-lucide-hourglass', title: 'Nothing leaving soon', description: `Items appear here once idle for ${Math.round((data.value?.deleteAfterDays ?? 14) / 2)} days.` },
    snoozed: { icon: 'i-lucide-bookmark', title: 'Nothing kept', description: 'Use Keep on an item to protect it from review.' }
}[tab.value]));
</script>

<template>
    <UDashboardPanel id="review">
        <template #header>
            <UDashboardNavbar title="Review">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <span class="text-xs text-muted tabular-nums">{{ plural(rows.length, 'item') }} · {{ gb(rows.reduce((a, c) => a + c.size, 0)) }}</span>
                </template>
            </UDashboardNavbar>
            <UDashboardToolbar>
                <template #left>
                    <UTabs v-model="tab"
                           :items="tabs"
                           :content="false"
                           size="sm"
                           variant="link"
                           :ui="{ trigger: 'gap-1.5' }" />
                </template>
                <template #right>
                    <UButton v-if="view === 'grid' && rows.length"
                             :label="allPicked ? 'Clear' : 'Select all'"
                             color="neutral"
                             variant="ghost"
                             size="sm"
                             @click="toggleAll" />
                    <UTabs v-model="view"
                           :items="[{ icon: 'i-lucide-list', value: 'table' }, { icon: 'i-lucide-layout-grid', value: 'grid' }]"
                           :content="false"
                           size="sm" />
                    <USelect v-model="kind"
                             :items="[{ label: 'Movies & series', value: 'all' }, { label: 'Movies', value: 'movie' }, { label: 'Series', value: 'series' }]"
                             size="sm"
                             class="w-36" />
                    <USelect v-model="sort"
                             :items="[{ label: 'Largest first', value: 'size' }, { label: 'Longest idle', value: 'idle' }, { label: 'Title', value: 'title' }]"
                             size="sm"
                             class="w-36"
                             icon="i-lucide-arrow-down-wide-narrow" />
                </template>
            </UDashboardToolbar>
        </template>

        <template #body>
            <UTable v-if="view === 'table'"
                    :data="rows"
                    :columns="columns"
                    :loading="fetchStatus === 'pending' && !data"
                    class="rounded-xl border border-default"
                    :ui="{ tr: 'cursor-pointer', td: 'py-2' }"
                    :meta="{ class: { tr: (row) => picked.has(row.original.key) ? 'bg-primary/5' : '' } }"
                    @select="(_, row) => selected = { kind: row.original.kind, id: row.original.id }">
                <template #select-header>
                    <UCheckbox :model-value="allPicked ? true : picked.size ? 'indeterminate' : false"
                               aria-label="Select all"
                               @update:model-value="toggleAll"
                               @click.stop />
                </template>
                <template #select-cell="{ row }">
                    <UCheckbox :model-value="picked.has(row.original.key)"
                               :aria-label="`Select ${row.original.title}`"
                               @update:model-value="toggle(row.original.key)"
                               @click.stop />
                </template>

                <template #item-cell="{ row }">
                    <div class="flex items-center gap-3">
                        <img :src="`/api/art/${row.original.kind}/${row.original.id}/poster`"
                             alt=""
                             class="poster h-24 w-auto shrink-0 rounded-md object-cover shadow-md ring-1 ring-white/10"
                             loading="lazy"
                             @error="($event.target as HTMLImageElement).style.visibility = 'hidden'">
                        <div class="min-w-0">
                            <p class="truncate font-medium text-highlighted">
                                {{ row.original.title }}
                            </p>
                            <p class="truncate text-xs text-muted">
                                <template v-if="row.original.seasonNumber !== null">
                                    Season {{ row.original.seasonNumber }} ·
                                </template>{{ row.original.year }}
                            </p>
                        </div>
                    </div>
                </template>

                <template #requestedBy-cell="{ row }">
                    <span class="text-muted">{{ row.original.requestedBy ?? '—' }}</span>
                </template>
                <template #watchedBy-cell="{ row }">
                    <span class="text-muted">{{ row.original.watchedBy.join(', ') || '—' }}</span>
                </template>
                <template #idle-cell="{ row }">
                    <template v-if="row.original.lastActivity">
                        {{ idleDays(row.original.lastActivity) }}d
                    </template>
                    <span v-else class="text-dimmed">—</span>
                </template>
                <template #size-cell="{ row }">
                    <span class="font-medium">{{ gb(row.original.size) }}</span>
                </template>

                <template #empty>
                    <UEmpty v-bind="empty" variant="naked" class="py-12" />
                </template>
            </UTable>

            <div v-else-if="fetchStatus === 'pending' && !data" class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
                <div v-for="i in 18" :key="i" class="space-y-2">
                    <USkeleton class="poster w-full rounded-lg" />
                    <USkeleton class="h-4 w-3/4" />
                    <USkeleton class="h-3 w-1/2" />
                </div>
            </div>
            <UEmpty v-else-if="!rows.length"
                    v-bind="empty"
                    variant="naked"
                    class="py-16" />
            <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
                <div v-for="c in rows" :key="c.key" class="group relative flex flex-col gap-2">
                    <button type="button"
                            class="poster relative w-full overflow-hidden rounded-lg bg-elevated text-left ring-1 ring-white/10 transition duration-200 will-change-transform outline-none group-hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-primary"
                            :class="picked.has(c.key) && 'ring-2 ring-primary shadow-[0_0_24px_-6px] shadow-primary/40'"
                            @click="selected = { kind: c.kind, id: c.id }">
                        <img :src="`/api/art/${c.kind}/${c.id}/poster`"
                             :alt="c.title"
                             loading="lazy"
                             class="size-full object-cover"
                             @error="($event.target as HTMLImageElement).style.visibility = 'hidden'">
                        <div class="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/80 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                        <div class="absolute inset-x-2 bottom-2 text-[11px] leading-snug text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            <p v-if="c.requestedBy" class="truncate">
                                <span class="text-white/60">Requested</span> {{ c.requestedBy }}
                            </p>
                            <p v-if="c.watchedBy.length" class="truncate">
                                <span class="text-white/60">Watched</span> {{ c.watchedBy.join(', ') }}
                            </p>
                            <p v-if="c.lastActivity" class="truncate text-white/60">
                                {{ idleDays(c.lastActivity) }}d idle
                            </p>
                        </div>
                    </button>
                    <UCheckbox :model-value="picked.has(c.key)"
                               :aria-label="`Select ${c.title}`"
                               class="absolute top-2 left-2 rounded bg-black/60 p-0.5 transition-opacity"
                               :class="picked.has(c.key) ? '' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'"
                               @update:model-value="toggle(c.key)" />
                    <div class="min-w-0 px-0.5">
                        <p class="truncate text-sm font-medium text-highlighted" :title="c.title">
                            {{ c.title }}
                        </p>
                        <p class="truncate text-xs text-muted">
                            <template v-if="c.seasonNumber !== null">
                                Season {{ c.seasonNumber }} ·
                            </template>{{ c.year }} · {{ gb(c.size) }}
                        </p>
                    </div>
                </div>
            </div>

            <Transition enter-active-class="transition duration-200"
                        enter-from-class="translate-y-4 opacity-0"
                        leave-active-class="transition duration-150"
                        leave-to-class="translate-y-4 opacity-0">
                <div v-if="picked.size" class="sticky bottom-4 mt-4 flex items-center gap-3 rounded-xl border border-default bg-elevated/90 p-3 shadow-2xl backdrop-blur">
                    <p class="flex-1 text-sm">
                        <span class="font-semibold tabular-nums">{{ pickedRows.length }}</span> selected · <span class="tabular-nums">{{ gb(pickedBytes) }}</span>
                    </p>
                    <UButton label="Clear"
                             color="neutral"
                             variant="ghost"
                             size="sm"
                             @click="picked.clear()" />
                    <UDropdownMenu v-if="tab !== 'snoozed'" :items="keepItems">
                        <UButton label="Keep"
                                 icon="i-lucide-bookmark"
                                 color="neutral"
                                 variant="subtle"
                                 size="sm"
                                 :loading="keeping"
                                 trailing-icon="i-lucide-chevron-down" />
                    </UDropdownMenu>
                    <UButton :label="`Delete ${gb(pickedBytes)}`"
                             icon="i-lucide-trash-2"
                             color="error"
                             size="sm"
                             @click="confirmOpen = true" />
                </div>
            </Transition>

            <DeleteConfirmModal v-model:open="confirmOpen" :items="pickedRows" @done="onDeleted" />
        </template>
    </UDashboardPanel>
</template>
