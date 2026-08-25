<script setup lang="ts">
const config = useRuntimeConfig()

const checking = ref(true)

onMounted(async () => {
  const apiBase = String(
    config.public.apiBase ||
    'https://accts-api.jbm65.com/api'
  ).replace(/\/$/, '')

  try {
    await $fetch(`${apiBase}/user`, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    })

    // Authenticated
    await navigateTo('/accounts', {
      replace: true,
    })
  } catch {
    // 401, 403, 500, etc.
    // Treat as unauthenticated on the root landing page.
    await navigateTo('/login', {
      replace: true,
    })
  } finally {
    checking.value = false
  }
})
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950"
  >
    <div class="text-center">
      <UIcon
        v-if="checking"
        name="i-lucide-loader-circle"
        class="mx-auto size-6 animate-spin"
      />

      <p
        v-if="checking"
        class="mt-3 text-sm text-gray-500"
      >
        Checking session...
      </p>
    </div>
  </div>
</template>