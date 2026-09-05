<script setup lang="ts">
defineProps<{
    label: string;
    value: string;
    hint?: string;
    icon: string;
    color?: 'error' | 'warning' | 'primary' | 'success' | 'neutral';
    to?: string;
}>();

const NuxtLink = resolveComponent('NuxtLink');

const accent: Record<string, string> = {
    error: 'text-error bg-error/10',
    warning: 'text-warning bg-warning/10',
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    neutral: 'text-muted bg-elevated'
};
</script>

<template>
    <component :is="to ? NuxtLink : 'div'"
               :to="to"
               class="group relative flex flex-col gap-3 rounded-xl border border-default bg-elevated/40 p-5 transition"
               :class="to && 'hover:border-accented hover:bg-elevated/70'">
        <div class="flex items-center justify-between">
            <span class="text-sm text-muted">{{ label }}</span>
            <span class="grid size-8 place-items-center rounded-lg" :class="accent[color ?? 'neutral']">
                <UIcon :name="icon" class="size-4" />
            </span>
        </div>
        <div>
            <p class="text-3xl font-semibold tracking-tight tabular-nums">
                {{ value }}
            </p>
            <p v-if="hint" class="mt-1 text-xs text-dimmed">
                {{ hint }}
            </p>
        </div>
        <UIcon v-if="to" name="i-lucide-arrow-up-right" class="absolute right-4 bottom-4 size-4 text-dimmed opacity-0 transition group-hover:opacity-100" />
    </component>
</template>
