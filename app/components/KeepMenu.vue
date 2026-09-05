<script setup lang="ts">
import type { Candidate } from '~/composables/useLibrary'

const props = defineProps<{ candidate: Candidate, size?: 'xs' | 'sm' | 'md' }>()
const { keep, unkeep } = useLibrary()
const toast = useToast()
const loading = ref(false)

const inDays = (days: number) => new Date(Date.now() + days * 86400_000).toISOString()

async function run(action: () => Promise<void>, title: string) {
  loading.value = true
  try {
    await action()
    toast.add({ title, description: props.candidate.title, icon: 'i-lucide-bookmark', color: 'neutral' })
  }
  catch (error: any) {
    toast.add({ title: 'Failed', description: error?.data?.message ?? String(error), color: 'error' })
  }
  finally {
    loading.value = false
  }
}

const items = computed(() => props.candidate.status === 'snoozed'
  ? [{ label: 'Stop keeping', icon: 'i-lucide-bookmark-x', onSelect: () => run(() => unkeep(props.candidate), 'Back in review') }]
  : [
      { label: 'Keep 30 days', icon: 'i-lucide-calendar-clock', onSelect: () => run(() => keep(props.candidate, inDays(30)), 'Kept for 30 days') },
      { label: 'Keep 90 days', icon: 'i-lucide-calendar-clock', onSelect: () => run(() => keep(props.candidate, inDays(90)), 'Kept for 90 days') },
      { label: 'Keep forever', icon: 'i-lucide-bookmark', onSelect: () => run(() => keep(props.candidate, null), 'Kept forever') },
    ])
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton
      :icon="candidate.status === 'snoozed' ? 'i-lucide-bookmark-check' : 'i-lucide-bookmark'"
      label="Keep"
      color="neutral"
      variant="subtle"
      :size="size ?? 'sm'"
      :loading="loading"
      trailing-icon="i-lucide-chevron-down"
    />
  </UDropdownMenu>
</template>
