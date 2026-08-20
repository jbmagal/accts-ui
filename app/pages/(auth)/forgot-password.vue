<script setup lang="ts">
import type {
  FormError,
  FormSubmitEvent
} from '@nuxt/ui'

interface ForgotPasswordForm {
  email: string
}

const config = useRuntimeConfig()

const state = reactive<ForgotPasswordForm>({
  email: ''
})

const loading = ref(false)
const sent = ref(false)
const errorMessage = ref('')

const validate = (
  state: ForgotPasswordForm
): FormError[] => {
  const errors: FormError[] = []

  if (!state.email.trim()) {
    errors.push({
      name: 'email',
      message: 'Email address is required.'
    })
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)
  ) {
    errors.push({
      name: 'email',
      message: 'Enter a valid email address.'
    })
  }

  return errors
}

/**
 * Get Laravel Sanctum CSRF cookie.
 */
const getCsrfCookie = async () => {
  await $fetch(
    `${config.public.backendBase}/sanctum/csrf-cookie`,
    {
      credentials: 'include',
      headers: {
        Accept: 'application/json'
      }
    }
  )
}

/**
 * Read XSRF-TOKEN from browser cookies.
 */
const getXsrfToken = (): string => {
  if (!import.meta.client) {
    return ''
  }

  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))

  if (!cookie) {
    return ''
  }

  return decodeURIComponent(
    cookie.substring('XSRF-TOKEN='.length)
  )
}

const onSubmit = async (
  event: FormSubmitEvent<ForgotPasswordForm>
) => {
  loading.value = true
  errorMessage.value = ''

  try {
    /**
     * Step 1:
     * Initialize Laravel CSRF/session cookies.
     */
    await getCsrfCookie()

    /**
     * Step 2:
     * Read the CSRF token Laravel generated.
     */
    const xsrfToken = getXsrfToken()

    if (!xsrfToken) {
      throw new Error(
        'Unable to initialize CSRF protection.'
      )
    }

    /**
     * Step 3:
     * Send password reset request.
     */
    await $fetch(
      `${config.public.apiBase}/forgot-password`,
      {
        method: 'POST',

        credentials: 'include',

        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': xsrfToken
        },

        body: {
          email: event.data.email
        }
      }
    )

    sent.value = true
  } catch (error: any) {
    console.error(
      'FORGOT PASSWORD ERROR:',
      error
    )

    const data =
      error?.data ??
      error?.response?._data

    const status =
      error?.statusCode ??
      error?.status ??
      error?.response?.status

    console.error('STATUS:', status)
    console.error('RESPONSE:', data)

    if (status === 419) {
      errorMessage.value =
        'Your session expired. Please refresh the page and try again.'

      return
    }

    if (status === 422) {
      errorMessage.value =
        data?.errors?.email?.[0] ??
        data?.message ??
        'Please check your email address.'

      return
    }

    errorMessage.value =
      data?.message ??
      error?.message ??
      'Unable to send the password reset email.'
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <div
    class="
      flex min-h-screen items-center justify-center
      bg-gray-50 px-4 py-12
      dark:bg-gray-950
    "
  >
    <div class="w-full max-w-md">
      <UCard>
        <!-- Email sent -->
        <div
          v-if="sent"
          class="py-6 text-center"
        >
          <div
            class="
              mx-auto mb-6 flex size-16
              items-center justify-center rounded-full
              bg-primary-50 text-3xl
              dark:bg-primary-950
            "
          >
            ✉
          </div>

          <h1
            class="
              text-2xl font-bold
              text-gray-900 dark:text-white
            "
          >
            Check your email
          </h1>

          <p
            class="
              mt-3 text-sm leading-6
              text-gray-500 dark:text-gray-400
            "
          >
            If an account exists for
            <strong>{{ state.email }}</strong>,
            we've sent a password reset link.
          </p>

          <UAlert
            class="mt-6 text-left"
            color="primary"
            variant="soft"
            title="Password reset requested"
            description="Open the email and click the reset password link."
          />

          <UButton
            to="/login"
            class="mt-8"
            color="neutral"
            variant="outline"
            block
          >
            Back to sign in
          </UButton>
        </div>

        <!-- Form -->
        <div v-else>
          <div class="mb-8">
            <h1
              class="
                text-2xl font-bold
                text-gray-900 dark:text-white
              "
            >
              Forgot password?
            </h1>

            <p
              class="
                mt-2 text-sm
                text-gray-500 dark:text-gray-400
              "
            >
              Enter your email address and we'll send
              you a link to reset your password.
            </p>
          </div>

          <UAlert
            v-if="errorMessage"
            class="mb-6"
            color="error"
            variant="soft"
            title="Unable to send email"
            :description="errorMessage"
          />

          <UForm
            :state="state"
            :validate="validate"
            class="space-y-5"
            @submit="onSubmit"
          >
            <UFormField
              label="Email address"
              name="email"
              required
            >
              <UInput
                v-model="state.email"
                type="email"
                autocomplete="email"
                placeholder="you@example.com"
                size="lg"
                class="w-full"
                :disabled="loading"
              />
            </UFormField>

            <UButton
              type="submit"
              size="lg"
              block
              :loading="loading"
              :disabled="loading"
            >
              Send reset link
            </UButton>
          </UForm>

          <div class="mt-6 text-center">
            <NuxtLink
              to="/login"
              class="
                text-sm font-medium
                text-primary-600
                hover:text-primary-500
              "
            >
              Back to sign in
            </NuxtLink>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>