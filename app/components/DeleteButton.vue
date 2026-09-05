<script setup lang="ts">
import type { Candidate } from '~/composables/useLibrary'

const props = defineProps<{ candidate: Candidate, size?: 'xs' | 'sm' | 'md', block?: boolean }>()
const emit = defineEmits<{ deleted: [] }>()

const { deleteOne } = useLibrary()
const toast = useToast()
const armed = ref(false)
const loading = ref(false)
let timer: ReturnType<typeof setTimeout>

// two-step: first click arms for 3s, second click fires
async function click() {
  clearTimeout(timer)
  if (!armed.value) {
    armed.value = true
    timer = setTimeout(() => { armed.value = false }, 3000)
    return
  }

  armed.value = false
  loading.value = true
  try {
    await deleteOne(props.candidate)
    toast.add({ title: `Deleted ${label.value}`, description: `${gb(props.candidate.size)} reclaimed`, icon: 'i-lucide-trash-2', color: 'success' })
    emit('deleted')
  }
  catch (error: any) {
    toast.add({ title: `Could not delete ${label.value}`, description: error?.data?.message ?? String(error), icon: 'i-lucide-triangle-alert', color: 'error' })
  }
  finally {
    loading.value = false
  }
}

const label = computed(() => props.candidate.seasonNumber === null
  ? props.candidate.title
  : `${props.candidate.title} S${String(props.candidate.seasonNumber).padStart(2, '0')}`)
</script>

<template>
  <UButton
    :label="armed ? 'Sure?' : 'Delete'"
    :icon="armed ? 'i-lucide-triangle-alert' : 'i-lucide-trash-2'"
    :color="armed ? 'error' : 'neutral'"
    :variant="armed ? 'solid' : 'subtle'"
    :size="size ?? 'sm'"
    :block="block"
    :loading="loading"
    @click="click"
  />
</template>
