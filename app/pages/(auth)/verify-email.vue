<script setup lang="ts">
const route = useRoute()

const email = computed(() => {
  return typeof route.query.email === 'string'
    ? route.query.email
    : ''
})
</script>

<template>
  <div
    class="
      min-h-screen
      bg-gray-50
      dark:bg-gray-950
      flex
      items-center
      justify-center
      px-4
      py-12
    "
  >
    <div class="w-full max-w-md">

      <UCard>
        <div class="py-6 text-center">

          <!-- Icon -->
          <div
            class="
              mx-auto
              mb-6
              flex
              size-16
              items-center
              justify-center
              rounded-full
              bg-primary-50
              text-primary-600
              dark:bg-primary-950
              dark:text-primary-400
            "
          >
            <span class="text-3xl">
              ✉
            </span>
          </div>

          <h1
            class="
              text-2xl
              font-bold
              text-gray-900
              dark:text-white
            "
          >
            Check your email
          </h1>

          <p
            class="
              mt-3
              text-sm
              leading-6
              text-gray-500
              dark:text-gray-400
            "
          >
            We've sent a verification link to
          </p>

          <p
            v-if="email"
            class="
              mt-1
              font-semibold
              text-gray-900
              dark:text-white
            "
          >
            {{ email }}
          </p>

          <UAlert
            class="mt-6 text-left"
            color="primary"
            variant="soft"
            title="Verify your account"
            description="Open the email and click the verification link to activate your account."
          />

          <p
            class="
              mt-6
              text-xs
              leading-5
              text-gray-400
            "
          >
            If you don't see the email, check your spam
            or junk folder.
          </p>

          <div class="mt-8">
            <UButton
              to="/login"
              color="neutral"
              variant="outline"
              block
            >
              Back to sign in
            </UButton>
          </div>

        </div>
      </UCard>

    </div>
  </div>
</template>