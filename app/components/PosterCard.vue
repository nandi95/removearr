<script setup lang="ts">
import type { Kind, LibraryMovie, LibrarySeries } from '#shared/types'

const props = defineProps<{ kind: Kind, item: LibraryMovie | LibrarySeries, size?: 'sm' | 'md' }>()
const selected = useSelected()
const broken = ref(false)

const ring: Record<string, string> = {
  deletable: 'ring-2 ring-error/80 shadow-[0_0_28px_-4px] shadow-error/40',
  soon: 'ring-2 ring-warning/70 shadow-[0_0_24px_-6px] shadow-warning/30',
  snoozed: 'ring-1 ring-default opacity-70',
  keep: 'ring-1 ring-default/60',
}

const seasons = computed(() => 'seasons' in props.item ? props.item.seasons : null)
const sub = computed(() => {
  const parts = [String(props.item.year), gb(props.item.size)]
  if (seasons.value) parts.push(plural(seasons.value.length, 'season'))
  return parts.join(' · ')
})
</script>

<template>
  <button
    type="button"
    class="group flex flex-col gap-2 text-left outline-none"
    :class="size === 'sm' ? 'w-32 shrink-0 snap-start' : 'w-full'"
    @click="selected = { kind, id: item.id }"
  >
    <div
      class="poster relative w-full overflow-hidden rounded-lg transition duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl group-focus-visible:ring-2 group-focus-visible:ring-primary"
      :class="ring[item.status]"
    >
      <img
        v-if="!broken"
        :src="`/api/art/${kind}/${item.id}/poster`"
        :alt="item.title"
        loading="lazy"
        class="size-full object-cover transition duration-500 group-hover:scale-105"
        @error="broken = true"
      >
      <div v-else class="grid size-full place-items-center text-dimmed">
        <UIcon :name="kind === 'movie' ? 'i-lucide-film' : 'i-lucide-tv'" class="size-8" />
      </div>

      <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent opacity-0 transition group-hover:opacity-100" />

      <div class="absolute inset-x-2 bottom-2 translate-y-2 text-[11px] leading-snug text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
        <p v-if="item.requestedBy" class="truncate"><span class="text-white/60">Requested</span> {{ item.requestedBy }}</p>
        <p v-if="item.watchedBy.length" class="truncate"><span class="text-white/60">Watched</span> {{ item.watchedBy.join(', ') }}</p>
        <p v-if="item.lastPlayed" class="truncate text-white/60">{{ idleDays(item.lastPlayed) }}d idle</p>
      </div>

      <div v-if="item.status !== 'keep'" class="absolute left-1.5 top-1.5">
        <StatusBadge :status="item.status" size="xs" />
      </div>
      <UIcon v-else-if="item.lastPlayed" name="i-lucide-check" class="absolute right-1.5 top-1.5 size-4 rounded-full bg-success p-0.5 text-inverted shadow" />
    </div>

    <div class="min-w-0 px-0.5">
      <p class="truncate text-sm font-medium" :title="item.title">{{ item.title }}</p>
      <p class="truncate text-xs text-muted">{{ sub }}</p>
    </div>
  </button>
</template>
