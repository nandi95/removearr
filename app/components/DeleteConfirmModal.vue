<script setup lang="ts">
import type { Candidate } from '~/composables/useLibrary'

const props = defineProps<{ items: Candidate[] }>()
const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ done: [deleted: Candidate[]] }>()

const { deleteOne } = useLibrary()
const running = ref(false)
const results = ref(new Map<string, 'ok' | string>())
// snapshot on open: the live selection shrinks as rows get deleted
const list = ref<Candidate[]>([])
const total = computed(() => list.value.reduce((acc, c) => acc + c.size, 0))
const done = computed(() => results.value.size)
const finished = computed(() => !running.value && done.value > 0 && done.value === list.value.length)

const label = (c: Candidate) => c.seasonNumber === null ? `${c.title} (${c.year})` : `${c.title} · Season ${c.seasonNumber}`

async function run() {
  running.value = true
  const deleted: Candidate[] = []
  // sequential on purpose: the arrs and the disk do not enjoy a burst of deletes
  for (const c of list.value) {
    try {
      await deleteOne(c)
      results.value.set(c.key, 'ok')
      deleted.push(c)
    }
    catch (error: any) {
      results.value.set(c.key, error?.data?.message ?? String(error))
    }
  }
  running.value = false
  emit('done', deleted)
}

watch(open, (v) => { if (v) { results.value = new Map(); list.value = [...props.items] } })
</script>

<template>
  <UModal v-model:open="open" :dismissible="!running" :title="finished ? 'Done' : `Delete ${plural(list.length, 'item')}?`" :description="finished ? undefined : `${gb(total)} will be removed from disk through Radarr and Sonarr. This cannot be undone.`">
    <template #body>
      <ul class="max-h-72 divide-y divide-default overflow-y-auto rounded-lg border border-default text-sm">
        <li v-for="c in list" :key="c.key" class="flex items-center gap-3 px-3 py-2">
          <UIcon
            v-if="results.get(c.key)"
            :name="results.get(c.key) === 'ok' ? 'i-lucide-check' : 'i-lucide-x'"
            class="size-4 shrink-0"
            :class="results.get(c.key) === 'ok' ? 'text-success' : 'text-error'"
          />
          <UIcon v-else-if="running" name="i-lucide-loader-circle" class="size-4 shrink-0 animate-spin text-dimmed" />
          <UIcon v-else :name="c.kind === 'movie' ? 'i-lucide-film' : 'i-lucide-tv'" class="size-4 shrink-0 text-dimmed" />
          <span class="min-w-0 flex-1 truncate" :title="results.get(c.key) !== 'ok' ? results.get(c.key) : ''">{{ label(c) }}</span>
          <span class="shrink-0 tabular-nums text-muted">{{ gb(c.size) }}</span>
        </li>
      </ul>
      <UProgress v-if="running || finished" :value="done" :max="list.length" class="mt-4" :color="finished ? 'success' : 'primary'" />
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton v-if="finished" label="Close" color="neutral" @click="open = false" />
        <template v-else>
          <UButton label="Cancel" color="neutral" variant="ghost" :disabled="running" @click="open = false" />
          <UButton :label="`Delete ${gb(total)}`" color="error" icon="i-lucide-trash-2" :loading="running" @click="run" />
        </template>
      </div>
    </template>
  </UModal>
</template>
