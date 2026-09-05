<script setup lang="ts">
const props = defineProps<{ values: number[], color?: string }>()

const W = 400
const H = 80

const path = computed(() => {
  const v = props.values
  if (v.length < 2) return { line: '', area: '' }
  const max = Math.max(...v, 1)
  const min = Math.min(...v)
  const range = max - min || 1
  const pts = v.map((y, i) => [i / (v.length - 1) * W, H - 6 - (y - min) / range * (H - 12)] as const)
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  return { line, area: `${line} L${W},${H} L0,${H} Z` }
})
</script>

<template>
  <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" class="h-20 w-full" :class="color ?? 'text-primary'">
    <defs>
      <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="currentColor" stop-opacity="0.35" />
        <stop offset="1" stop-color="currentColor" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path :d="path.area" fill="url(#spark)" />
    <path :d="path.line" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" />
  </svg>
</template>
