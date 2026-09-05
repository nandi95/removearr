<script setup lang="ts">
import type { Status } from '#shared/types'

defineProps<{ status: Status, size?: 'xs' | 'sm' | 'md' }>()

const META: Record<Status, { label: string, color: 'error' | 'warning' | 'neutral' | 'success', icon: string }> = {
  deletable: { label: 'Deletable', color: 'error', icon: 'i-lucide-trash-2' },
  soon: { label: 'Leaving soon', color: 'warning', icon: 'i-lucide-hourglass' },
  snoozed: { label: 'Kept', color: 'neutral', icon: 'i-lucide-bookmark' },
  keep: { label: 'Watched', color: 'success', icon: 'i-lucide-check' },
}
</script>

<template>
  <UBadge :color="META[status].color" :icon="META[status].icon" :label="META[status].label" :size="size ?? 'sm'" variant="subtle" />
</template>
