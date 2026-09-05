<script setup lang="ts">
import type { Candidate } from '~/composables/useLibrary'

const selected = useSelected()
const { movies, series } = useLibrary()

const open = computed({ get: () => !!selected.value, set: (v) => { if (!v) selected.value = null } })

const movie = computed(() => selected.value?.kind === 'movie' ? movies.value.find(m => m.id === selected.value!.id) : undefined)
const show = computed(() => selected.value?.kind === 'series' ? series.value.find(s => s.id === selected.value!.id) : undefined)
const item = computed(() => movie.value ?? show.value)

const candidates = computed<Candidate[]>(() => movie.value
  ? [movieCandidate(movie.value)]
  : show.value ? show.value.seasons.map(s => seasonCandidate(show.value!, s)) : [])

const idle = computed(() => item.value?.lastPlayed ? idleDays(item.value.lastPlayed) : null)

// close when the last thing in here gets deleted
watch(item, (value) => { if (!value && selected.value) selected.value = null })
</script>

<template>
  <USlideover v-model:open="open" :ui="{ content: 'max-w-lg', body: 'p-0 sm:p-0' }" :title="item?.title ?? ''" :description="item ? `${item.year} · ${gb(item.size)}` : ''">
    <template #content>
      <div v-if="item && selected" class="relative flex h-full flex-col overflow-y-auto">
        <div class="relative h-56 shrink-0 overflow-hidden">
          <img :src="`/api/art/${selected.kind}/${item.id}/backdrop`" alt="" class="size-full scale-110 object-cover blur-sm brightness-50" @error="($event.target as HTMLImageElement).style.display = 'none'">
          <div class="absolute inset-0 bg-gradient-to-t from-default via-default/40 to-transparent" />
          <UButton icon="i-lucide-x" color="neutral" variant="ghost" class="absolute right-3 top-3 bg-black/30 text-white hover:bg-black/50" @click="open = false" />
        </div>

        <div class="-mt-28 flex gap-5 px-6">
          <img :src="`/api/art/${selected.kind}/${item.id}/poster`" alt="" class="poster w-32 shrink-0 rounded-lg shadow-2xl ring-1 ring-white/10">
          <div class="mt-16 min-w-0 self-end pb-1">
            <h2 class="text-xl font-semibold leading-tight tracking-tight">{{ item.title }}</h2>
            <p class="mt-1 text-sm text-muted">{{ item.year }} · {{ gb(item.size) }}<template v-if="show"> · {{ plural(show.seasons.length, 'season') }}</template></p>
            <div class="mt-2"><StatusBadge :status="item.status" /></div>
          </div>
        </div>

        <dl class="mt-6 grid grid-cols-3 gap-4 border-y border-default px-6 py-4 text-sm">
          <div>
            <dt class="text-xs uppercase tracking-wide text-dimmed">Requested by</dt>
            <dd class="mt-1 truncate font-medium">{{ item.requestedBy ?? '—' }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-wide text-dimmed">Watched by</dt>
            <dd class="mt-1 truncate font-medium" :title="item.watchedBy.join(', ')">{{ item.watchedBy.join(', ') || 'Nobody' }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-wide text-dimmed">Last played</dt>
            <dd class="mt-1 truncate font-medium">
              <template v-if="item.lastPlayed">{{ shortDate(item.lastPlayed) }} <span class="text-muted">· {{ idle }}d</span></template>
              <template v-else>Never</template>
            </dd>
          </div>
        </dl>

        <div v-if="movie" class="flex items-center gap-2 px-6 py-5">
          <DeleteButton :candidate="candidates[0]!" size="md" class="flex-1" block />
          <KeepMenu :candidate="candidates[0]!" size="md" />
        </div>

        <ul v-else class="divide-y divide-default px-2 py-2">
          <li v-for="c in candidates" :key="c.key" class="flex items-center gap-3 rounded-lg px-4 py-3 hover:bg-elevated/50">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="font-medium">Season {{ c.seasonNumber }}</span>
                <StatusBadge v-if="c.status !== 'keep'" :status="c.status" size="xs" />
              </div>
              <p class="mt-0.5 truncate text-xs text-muted">
                {{ plural(show!.seasons.find(s => s.seasonNumber === c.seasonNumber)!.episodes, 'episode') }} · {{ gb(c.size) }}
                <template v-if="c.watchedBy.length"> · watched by {{ c.watchedBy.join(', ') }}</template>
                <template v-if="c.lastActivity"> · {{ idleDays(c.lastActivity) }}d idle</template>
              </p>
            </div>
            <DeleteButton :candidate="c" size="xs" />
            <KeepMenu :candidate="c" size="xs" />
          </li>
        </ul>
      </div>
    </template>
  </USlideover>
</template>
