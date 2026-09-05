<script setup lang="ts">
definePageMeta({ layout: false });
useHead({ title: 'Sign in' });

const error = computed(() => useRoute().query.error as string | undefined);
</script>

<template>
    <div class="grid min-h-screen place-items-center p-6">
        <UCard class="w-full max-w-sm text-center">
            <span class="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-primary text-inverted shadow-lg shadow-primary/30">
                <UIcon name="i-lucide-eraser" class="size-6" />
            </span>
            <h1 class="text-lg font-semibold tracking-tight">
                Remove<span class="text-primary">Arr</span>
            </h1>
            <p class="mt-1 text-sm text-muted">
                Sign in with the Plex account that owns the server.
            </p>

            <UAlert v-if="error"
                    :description="error"
                    color="error"
                    variant="soft"
                    class="mt-4 text-left" />

            <UButton to="/api/auth/login"
                     external
                     label="Sign in with Plex"
                     icon="i-lucide-log-in"
                     block
                     class="mt-6" />
        </UCard>
    </div>
</template>
