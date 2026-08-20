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

          <!-- Success Icon -->
          <div
            class="
              mx-auto
              mb-6
              flex
              size-16
              items-center
              justify-center
              rounded-full
              bg-green-50
              text-green-600
              dark:bg-green-950
              dark:text-green-400
            "
          >
            <span class="text-3xl font-bold">
              ✓
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
            Email verified
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
            Your email address has been successfully
            verified. Your account is now ready to use.
          </p>

          <UAlert
            class="mt-6 text-left"
            color="success"
            variant="soft"
            title="Verification successful"
            description="You may now sign in using your email address and password."
          />

          <div class="mt-8">
            <UButton
              to="/login"
              size="lg"
              block
            >
              Continue to sign in
            </UButton>
          </div>

        </div>
      </UCard>

    </div>
  </div>
</template>