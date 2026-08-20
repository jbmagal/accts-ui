<script setup lang="ts">
interface User {
  id: number
  name: string
  email: string
  email_verified_at: string | null
}

const config = useRuntimeConfig()

const user = ref<User | null>(null)
const loading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  try {
    const response = await $fetch<{ user: User }>(
      `${config.public.apiBase}/user`,
      {
        credentials: 'include',
        headers: {
          Accept: 'application/json'
        }
      }
    )

    user.value = response.user
  } catch (error: any) {
    console.error('Unable to load user:', error)

    errorMessage.value =
      error?.data?.message ??
      'Your session has expired. Please sign in again.'

    // await navigateTo('/login')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div
    class="
      min-h-screen
      bg-gray-50
      dark:bg-gray-950
    "
  >
    <!-- Header -->
    <header
      class="
        border-b
        border-gray-200
        bg-white
        dark:border-gray-800
        dark:bg-gray-900
      "
    >
      <div
        class="
          mx-auto
          flex
          max-w-7xl
          items-center
          justify-between
          px-4
          py-4
          sm:px-6
          lg:px-8
        "
      >
        <div>
          <h1
            class="
              text-xl
              font-bold
              text-gray-900
              dark:text-white
            "
          >
            JBM Accounts
          </h1>
        </div>

        <div
          v-if="user"
          class="flex items-center gap-3"
        >
          <div class="text-right">
            <p
              class="
                text-sm
                font-medium
                text-gray-900
                dark:text-white
              "
            >
              {{ user.name }}
            </p>

            <p
              class="
                text-xs
                text-gray-500
                dark:text-gray-400
              "
            >
              {{ user.email }}
            </p>
          </div>

          <UAvatar
            :alt="user.name"
            size="md"
          />
        </div>
      </div>
    </header>

    <!-- Content -->
    <main
      class="
        mx-auto
        max-w-7xl
        px-4
        py-8
        sm:px-6
        lg:px-8
      "
    >
      <div v-if="loading">
        <UCard>
          <div class="space-y-4">
            <USkeleton class="h-8 w-48" />
            <USkeleton class="h-4 w-72" />
          </div>
        </UCard>
      </div>

      <div
        v-else-if="user"
        class="space-y-6"
      >
        <div>
          <h2
            class="
              text-2xl
              font-bold
              text-gray-900
              dark:text-white
            "
          >
            Welcome, {{ user.name }}
          </h2>

          <p
            class="
              mt-1
              text-gray-500
              dark:text-gray-400
            "
          >
            You are successfully signed in.
          </p>
        </div>

        <UCard>
          <template #header>
            <div>
              <h3 class="font-semibold">
                Account
              </h3>

              <p
                class="
                  mt-1
                  text-sm
                  text-gray-500
                  dark:text-gray-400
                "
              >
                Your account information.
              </p>
            </div>
          </template>

          <div class="space-y-4">
            <div>
              <p
                class="
                  text-xs
                  font-medium
                  uppercase
                  text-gray-400
                "
              >
                Name
              </p>

              <p class="mt-1">
                {{ user.name }}
              </p>
            </div>

            <USeparator />

            <div>
              <p
                class="
                  text-xs
                  font-medium
                  uppercase
                  text-gray-400
                "
              >
                Email
              </p>

              <p class="mt-1">
                {{ user.email }}
              </p>
            </div>

            <USeparator />

            <div>
              <p
                class="
                  text-xs
                  font-medium
                  uppercase
                  text-gray-400
                "
              >
                Email status
              </p>

              <UBadge
                class="mt-2"
                :color="
                  user.email_verified_at
                    ? 'success'
                    : 'warning'
                "
                variant="soft"
              >
                {{
                  user.email_verified_at
                    ? 'Verified'
                    : 'Not verified'
                }}
              </UBadge>
            </div>
          </div>
        </UCard>
      </div>
    </main>
  </div>
</template>