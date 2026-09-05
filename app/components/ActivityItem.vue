<script setup lang="ts">
import type { ActivityEvent } from '#shared/types'

defineProps<{ event: ActivityEvent }>()
</script>

<template>
  <div class="flex items-start gap-3">
    <span
      class="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full"
      :class="event.type === 'deletion' ? 'bg-error/10 text-error' : event.run.ok ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'"
    >
      <UIcon :name="event.type === 'deletion' ? 'i-lucide-trash-2' : event.run.ok ? 'i-lucide-refresh-cw' : 'i-lucide-triangle-alert'" class="size-3.5" />
    </span>
    <div class="min-w-0 flex-1 text-sm">
      <template v-if="event.type === 'deletion'">
        <p class="truncate">
          Deleted <span class="font-medium">{{ event.deletion.title }}</span>
          <span v-if="event.deletion.seasonNumber !== null" class="text-muted"> · Season {{ event.deletion.seasonNumber }}</span>
        </p>
        <p class="text-xs text-muted">
          {{ gb(event.deletion.sizeBytes) }} freed<template v-if="event.deletion.requestedBy"> · requested by {{ event.deletion.requestedBy }}</template>
        </p>
      </template>
      <template v-else-if="event.run.ok">
        <p>Sync · <span class="font-medium text-error">{{ event.run.deletableCount }}</span> deletable · <span class="font-medium text-warning">{{ event.run.soonCount }}</span> leaving soon</p>
        <p class="text-xs text-muted">{{ gb(event.run.deletableBytes) }} reclaimable · Plex +{{ event.run.plexAdded }} −{{ event.run.plexRemoved }}</p>
      </template>
      <template v-else>
        <p class="text-error">Sync failed</p>
        <p class="truncate text-xs text-muted" :title="event.run.error ?? ''">{{ event.run.error }}</p>
      </template>
    </div>
    <time class="shrink-0 text-xs text-dimmed" :title="dateTime(event.at)">{{ relativeTime(event.at) }}</time>
  </div>
</template>
