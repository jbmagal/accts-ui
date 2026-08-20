<script setup lang="ts">
import type {
  FormError,
  FormSubmitEvent
} from '@nuxt/ui'

interface ResetPasswordForm {
  password: string
  password_confirmation: string
}

interface ResetPasswordResponse {
  message: string
}

const route = useRoute()
const config = useRuntimeConfig()

const state = reactive<ResetPasswordForm>({
  password: '',
  password_confirmation: ''
})

const loading = ref(false)
const success = ref(false)
const errorMessage = ref('')

const showPassword = ref(false)
const showPasswordConfirmation = ref(false)

/**
 * Read reset token from URL.
 *
 * /reset-password?token=xxxx&email=user@example.com
 */
const token = computed(() => {
  return typeof route.query.token === 'string'
    ? route.query.token
    : ''
})

/**
 * Read email from URL.
 */
const email = computed(() => {
  return typeof route.query.email === 'string'
    ? route.query.email
    : ''
})

/**
 * Make sure the email reset link contains
 * both required parameters.
 */
const validLink = computed(() => {
  return Boolean(
    token.value &&
    email.value
  )
})

/**
 * Nuxt UI form validation.
 */
const validate = (
  state: ResetPasswordForm
): FormError[] => {
  const errors: FormError[] = []

  if (!state.password) {
    errors.push({
      name: 'password',
      message: 'Password is required.'
    })
  } else if (state.password.length < 8) {
    errors.push({
      name: 'password',
      message: 'Password must contain at least 8 characters.'
    })
  }

  if (!state.password_confirmation) {
    errors.push({
      name: 'password_confirmation',
      message: 'Please confirm your password.'
    })
  } else if (
    state.password !== state.password_confirmation
  ) {
    errors.push({
      name: 'password_confirmation',
      message: 'Passwords do not match.'
    })
  }

  return errors
}

/**
 * Ask Laravel / Sanctum to initialize
 * the session + XSRF-TOKEN cookie.
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
 * Read Laravel's XSRF-TOKEN cookie.
 *
 * Laravel stores the token URL encoded,
 * so decode it before using it as
 * X-XSRF-TOKEN.
 */
const getXsrfToken = (): string => {
  if (!import.meta.client) {
    return ''
  }

  const cookie = document.cookie
    .split('; ')
    .find(row =>
      row.startsWith('XSRF-TOKEN=')
    )

  if (!cookie) {
    return ''
  }

  return decodeURIComponent(
    cookie.substring(
      'XSRF-TOKEN='.length
    )
  )
}

/**
 * Reset password.
 */
const onSubmit = async (
  event: FormSubmitEvent<ResetPasswordForm>
) => {
  if (!validLink.value) {
    errorMessage.value =
      'This password reset link is invalid.'

    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    /**
     * Step 1:
     * Initialize Laravel CSRF/session.
     */
    await getCsrfCookie()

    /**
     * Step 2:
     * Read XSRF token.
     */
    const xsrfToken = getXsrfToken()

    if (!xsrfToken) {
      throw new Error(
        'Unable to initialize CSRF protection.'
      )
    }

    /**
     * Step 3:
     * Submit reset request.
     */
    const response =
      await $fetch<ResetPasswordResponse>(
        `${config.public.apiBase}/reset-password`,
        {
          method: 'POST',

          credentials: 'include',

          headers: {
            Accept: 'application/json',
            'X-XSRF-TOKEN': xsrfToken
          },

          body: {
            token: token.value,
            email: email.value,
            password: event.data.password,
            password_confirmation:
              event.data.password_confirmation
          }
        }
      )

    console.log(
      'Password reset response:',
      response
    )

    success.value = true

    /**
     * Clear password fields.
     */
    state.password = ''
    state.password_confirmation = ''
  } catch (error: any) {
    console.error(
      'RESET PASSWORD ERROR:',
      error
    )

    const status =
      error?.statusCode ??
      error?.status ??
      error?.response?.status

    const data =
      error?.data ??
      error?.response?._data

    console.error(
      'STATUS:',
      status
    )

    console.error(
      'RESPONSE:',
      data
    )

    if (status === 419) {
      errorMessage.value =
        'Your session expired. Please refresh the page and try again.'

      return
    }

    if (status === 422) {
      errorMessage.value =
        data?.errors?.password?.[0] ??
        data?.errors?.email?.[0] ??
        data?.errors?.token?.[0] ??
        data?.message ??
        'The password reset link is invalid or has expired.'

      return
    }

    if (status === 429) {
      errorMessage.value =
        'Too many attempts. Please wait before trying again.'

      return
    }

    errorMessage.value =
      data?.message ??
      error?.message ??
      'Unable to reset your password.'
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

        <!-- ============================== -->
        <!-- INVALID RESET LINK -->
        <!-- ============================== -->

        <div
          v-if="!validLink"
          class="py-6 text-center"
        >
          <div
            class="
              mx-auto mb-6
              flex size-16
              items-center justify-center
              rounded-full
              bg-red-50
              text-red-600
              dark:bg-red-950
              dark:text-red-400
            "
          >
            <UIcon
              name="i-lucide-link-2-off"
              class="size-8"
            />
          </div>

          <h1
            class="
              text-2xl font-bold
              text-gray-900
              dark:text-white
            "
          >
            Invalid reset link
          </h1>

          <p
            class="
              mt-3
              text-sm leading-6
              text-gray-500
              dark:text-gray-400
            "
          >
            This password reset link is incomplete,
            invalid, or may have expired.
          </p>

          <UAlert
            class="mt-6 text-left"
            color="error"
            variant="soft"
            title="Unable to reset password"
            description="Please request a new password reset link."
          />

          <UButton
            to="/forgot-password"
            class="mt-8"
            size="lg"
            block
          >
            Request new reset link
          </UButton>

          <NuxtLink
            to="/login"
            class="
              mt-6 inline-block
              text-sm font-medium
              text-primary-600
              hover:text-primary-500
              dark:text-primary-400
            "
          >
            Back to sign in
          </NuxtLink>
        </div>


        <!-- ============================== -->
        <!-- PASSWORD RESET SUCCESS -->
        <!-- ============================== -->

        <div
          v-else-if="success"
          class="py-6 text-center"
        >
          <div
            class="
              mx-auto mb-6
              flex size-16
              items-center justify-center
              rounded-full
              bg-green-50
              text-green-600
              dark:bg-green-950
              dark:text-green-400
            "
          >
            <UIcon
              name="i-lucide-circle-check"
              class="size-8"
            />
          </div>

          <h1
            class="
              text-2xl font-bold
              text-gray-900
              dark:text-white
            "
          >
            Password changed
          </h1>

          <p
            class="
              mt-3
              text-sm leading-6
              text-gray-500
              dark:text-gray-400
            "
          >
            Your password has been successfully reset.
            You can now sign in using your new password.
          </p>

          <UAlert
            class="mt-6 text-left"
            color="success"
            variant="soft"
            title="Password updated"
            description="Your new password is ready to use."
          />

          <UButton
            to="/login"
            class="mt-8"
            size="lg"
            block
            icon="i-lucide-log-in"
          >
            Continue to sign in
          </UButton>
        </div>


        <!-- ============================== -->
        <!-- RESET PASSWORD FORM -->
        <!-- ============================== -->

        <div v-else>

          <!-- Heading -->

          <div class="mb-8">
            <h1
              class="
                text-2xl font-bold
                text-gray-900
                dark:text-white
              "
            >
              Reset password
            </h1>

            <p
              class="
                mt-2
                text-sm leading-6
                text-gray-500
                dark:text-gray-400
              "
            >
              Enter a new password for your account.
            </p>
          </div>


          <!-- Account -->

          <div
            class="
              mb-6
              flex items-center gap-3
              rounded-lg
              bg-gray-50
              p-3
              dark:bg-gray-900
            "
          >
            <div
              class="
                flex size-10
                shrink-0
                items-center justify-center
                rounded-full
                bg-primary-50
                text-primary-600
                dark:bg-primary-950
                dark:text-primary-400
              "
            >
              <UIcon
                name="i-lucide-mail"
                class="size-5"
              />
            </div>

            <div class="min-w-0">
              <p
                class="
                  text-xs
                  text-gray-500
                  dark:text-gray-400
                "
              >
                Resetting password for
              </p>

              <p
                class="
                  truncate
                  text-sm font-medium
                  text-gray-900
                  dark:text-white
                "
              >
                {{ email }}
              </p>
            </div>
          </div>


          <!-- Error -->

          <UAlert
            v-if="errorMessage"
            class="mb-6"
            color="error"
            variant="soft"
            title="Password reset failed"
            :description="errorMessage"
          />


          <!-- Form -->

          <UForm
            :state="state"
            :validate="validate"
            class="space-y-5"
            @submit="onSubmit"
          >

            <!-- New Password -->

            <UFormField
              label="New password"
              name="password"
              required
              help="Use at least 8 characters."
            >
              <UInput
                v-model="state.password"
                class="w-full"
                :type="
                  showPassword
                    ? 'text'
                    : 'password'
                "
                size="lg"
                autocomplete="new-password"
                placeholder="Enter your new password"
                :disabled="loading"
                icon="i-lucide-lock"
              >
                <template #trailing>
                  <UButton
                    type="button"
                    color="neutral"
                    variant="link"
                    size="sm"
                    :icon="
                      showPassword
                        ? 'i-lucide-eye-off'
                        : 'i-lucide-eye'
                    "
                    :aria-label="
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    "
                    @click="
                      showPassword =
                        !showPassword
                    "
                  />
                </template>
              </UInput>
            </UFormField>


            <!-- Confirm Password -->

            <UFormField
              label="Confirm new password"
              name="password_confirmation"
              required
            >
              <UInput
                v-model="
                  state.password_confirmation
                "
                class="w-full"
                :type="
                  showPasswordConfirmation
                    ? 'text'
                    : 'password'
                "
                size="lg"
                autocomplete="new-password"
                placeholder="Confirm your new password"
                :disabled="loading"
                icon="i-lucide-lock-keyhole"
              >
                <template #trailing>
                  <UButton
                    type="button"
                    color="neutral"
                    variant="link"
                    size="sm"
                    :icon="
                      showPasswordConfirmation
                        ? 'i-lucide-eye-off'
                        : 'i-lucide-eye'
                    "
                    :aria-label="
                      showPasswordConfirmation
                        ? 'Hide password'
                        : 'Show password'
                    "
                    @click="
                      showPasswordConfirmation =
                        !showPasswordConfirmation
                    "
                  />
                </template>
              </UInput>
            </UFormField>


            <!-- Submit -->

            <UButton
              type="submit"
              size="lg"
              block
              :loading="loading"
              :disabled="loading"
              icon="i-lucide-key-round"
            >
              Reset password
            </UButton>

          </UForm>


          <!-- Back to login -->

          <div class="mt-6 text-center">
            <NuxtLink
              to="/login"
              class="
                text-sm font-medium
                text-primary-600
                hover:text-primary-500
                dark:text-primary-400
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