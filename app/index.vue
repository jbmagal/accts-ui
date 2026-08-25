<script setup lang="ts">
definePageMeta({
  middleware: 'root-redirect',
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <UIcon
      name="i-lucide-loader-circle"
      class="size-6 animate-spin"
    />
  </div>
</template>