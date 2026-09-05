<script setup lang="ts">
import type { ActivityEvent, SyncRun } from '#shared/types';

useHead({ title: 'Activity' });

const { data, status } = useFetch<{ events: ActivityEvent[]; freedBytes: number; runs: SyncRun[] }>('/api/activity', { key: 'activity-full', query: { limit: 200 }, lazy: true });

const filter = ref<'all' | 'deletion' | 'sync'>('all');
const events = computed(() => (data.value?.events ?? []).filter(e => filter.value === 'all' || e.type === filter.value));
const deletions = computed(() => (data.value?.events ?? []).filter(e => e.type === 'deletion').length);

// group by calendar day for scannability
const days = computed(() => {
    const groups = new Map<string, ActivityEvent[]>();
    for (const event of events.value) {
        const day = new Date(event.at).toDateString();
        groups.set(day, [...(groups.get(day) ?? []), event]);
    }
    return [...groups.entries()];
});
const dayLabel = (day: string) => {
    const diff = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(day).setHours(0, 0, 0, 0)) / 86400_000);
    return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(day));
};
</script>

<template>
    <UDashboardPanel id="activity">
        <template #header>
            <UDashboardNavbar title="Activity">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <span v-if="data" class="text-xs text-muted tabular-nums">{{ gb(data.freedBytes) }} freed · {{ plural(deletions, 'deletion') }}</span>
                </template>
            </UDashboardNavbar>
            <UDashboardToolbar>
                <template #left>
                    <UTabs v-model="filter"
                           :items="[{ label: 'Everything', value: 'all' }, { label: 'Deletions', value: 'deletion', icon: 'i-lucide-trash-2' }, { label: 'Syncs', value: 'sync', icon: 'i-lucide-refresh-cw' }]"
                           :content="false"
                           size="sm"
                           variant="link" />
                </template>
            </UDashboardToolbar>
        </template>

        <template #body>
            <div v-if="status === 'pending' && !data" class="mx-auto max-w-2xl space-y-4">
                <USkeleton v-for="i in 8" :key="i" class="h-10" />
            </div>
            <UEmpty v-else-if="!days.length"
                    icon="i-lucide-history"
                    title="No activity yet"
                    description="Sync runs and deletions will show up here."
                    variant="naked"
                    class="py-16" />
            <div v-else class="mx-auto max-w-2xl space-y-8">
                <section v-for="[day, list] in days" :key="day">
                    <h2 class="mb-3 text-xs font-semibold tracking-wide text-dimmed uppercase">
                        {{ dayLabel(day) }}
                    </h2>
                    <ul class="divide-y divide-default rounded-xl border border-default bg-elevated/40">
                        <li v-for="(event, i) in list" :key="i" class="px-4 py-3">
                            <ActivityItem :event="event" />
                        </li>
                    </ul>
                </section>
            </div>
        </template>
    </UDashboardPanel>
</template>
