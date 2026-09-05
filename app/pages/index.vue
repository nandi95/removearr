<script setup lang="ts">
import type { ActivityEvent, SyncRun } from '#shared/types';

useHead({ title: 'Overview' });

const { data, status, totals, movies, series } = useLibrary();
const { syncing, sync } = useSync();
const { data: activity } = useFetch<{ events: ActivityEvent[]; freedBytes: number; runs: SyncRun[] }>('/api/activity', { key: 'activity', query: { limit: 6 }, lazy: true });

const sum = (items: { size: number }[]) => items.reduce((acc, i) => acc + i.size, 0);

// biggest wins first
const upNext = computed(() => [...totals.value.deletable].sort((a, b) => b.size - a.size).slice(0, 12));
const posterFor = (c: { kind: 'movie' | 'series'; id: number }) =>
    c.kind === 'movie' ? movies.value.find(m => m.id === c.id)! : series.value.find(s => s.id === c.id)!;

const trend = computed(() => activity.value?.runs.map(r => r.deletableBytes) ?? []);
const loading = computed(() => status.value === 'pending' && !data.value);
</script>

<template>
    <UDashboardPanel id="overview">
        <template #header>
            <UDashboardNavbar title="Overview">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <span v-if="data?.lastSync" class="hidden text-xs sm:inline" :class="data.lastSync.ok ? 'text-muted' : 'text-error'">{{ data.lastSync.ok ? 'Synced' : 'Sync failed' }} {{ relativeTime(data.lastSync.at) }}</span>
                    <UButton label="Sync now"
                             icon="i-lucide-refresh-cw"
                             :loading="syncing"
                             color="neutral"
                             variant="subtle"
                             @click="sync" />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <template v-if="loading">
                    <USkeleton v-for="i in 4" :key="i" class="h-32 rounded-xl" />
                </template>
                <template v-else>
                    <StatTile label="Reclaimable now"
                              :value="gb(sum(totals.deletable))"
                              :hint="plural(totals.deletable.length, 'item') + ' ready to delete'"
                              icon="i-lucide-trash-2"
                              color="error"
                              to="/review" />
                    <StatTile label="Leaving soon"
                              :value="gb(sum(totals.soon))"
                              :hint="plural(totals.soon.length, 'item') + ` · deletable after ${data?.deleteAfterDays ?? 14} idle days`"
                              icon="i-lucide-hourglass"
                              color="warning"
                              to="/review?tab=soon" />
                    <StatTile label="Library on disk"
                              :value="gb(totals.libraryBytes, 0)"
                              :hint="`${plural(movies.length, 'movie')} · ${plural(series.length, 'series')}`"
                              icon="i-lucide-hard-drive"
                              color="primary"
                              to="/library" />
                    <StatTile label="Freed all time"
                              :value="gb(activity?.freedBytes ?? 0)"
                              :hint="`${plural(totals.snoozed.length, 'item')} kept`"
                              icon="i-lucide-sparkles"
                              color="success"
                              to="/activity" />
                </template>
            </div>

            <div class="mt-6 grid gap-6 lg:grid-cols-3">
                <section class="lg:col-span-2">
                    <div class="mb-3 flex items-baseline justify-between">
                        <h2 class="text-sm font-semibold">
                            Up next
                        </h2>
                        <UButton to="/review"
                                 label="Review all"
                                 trailing-icon="i-lucide-arrow-right"
                                 variant="link"
                                 size="xs"
                                 color="neutral" />
                    </div>

                    <div v-if="loading" class="flex gap-4 overflow-hidden">
                        <USkeleton v-for="i in 6" :key="i" class="poster w-32 shrink-0 rounded-lg" />
                    </div>
                    <UEmpty v-else-if="!upNext.length"
                            icon="i-lucide-party-popper"
                            title="Nothing to reclaim"
                            :description="totals.soon.length ? `${plural(totals.soon.length, 'item')} will become deletable soon.` : 'Everything on disk is either unwatched or still wanted.'"
                            variant="naked"
                            class="rounded-xl border border-dashed border-default py-10" />
                    <div v-else class="-mx-1 flex snap-x scrollbar-none gap-4 overflow-x-auto px-1 pb-2">
                        <PosterCard v-for="c in upNext"
                                    :key="c.key"
                                    :kind="c.kind"
                                    :item="posterFor(c)"
                                    size="sm" />
                    </div>

                    <div v-if="trend.length > 1" class="mt-6 rounded-xl border border-default bg-elevated/40 p-5">
                        <div class="flex items-baseline justify-between">
                            <h2 class="text-sm font-semibold">
                                Reclaimable over time
                            </h2>
                            <span class="text-xs text-dimmed">last {{ plural(trend.length, 'sync') }}</span>
                        </div>
                        <Sparkline :values="trend" class="mt-3 text-error" />
                    </div>
                </section>

                <section>
                    <div class="mb-3 flex items-baseline justify-between">
                        <h2 class="text-sm font-semibold">
                            Recent activity
                        </h2>
                        <UButton to="/activity"
                                 label="All"
                                 trailing-icon="i-lucide-arrow-right"
                                 variant="link"
                                 size="xs"
                                 color="neutral" />
                    </div>
                    <div class="rounded-xl border border-default bg-elevated/40 p-5">
                        <div v-if="!activity" class="space-y-4">
                            <USkeleton v-for="i in 4" :key="i" class="h-8" />
                        </div>
                        <p v-else-if="!activity.events.length" class="text-sm text-muted">
                            No syncs or deletions yet.
                        </p>
                        <ul v-else class="space-y-4">
                            <li v-for="(event, i) in activity.events" :key="i">
                                <ActivityItem :event="event" />
                            </li>
                        </ul>
                    </div>
                </section>
            </div>
        </template>
    </UDashboardPanel>
</template>
