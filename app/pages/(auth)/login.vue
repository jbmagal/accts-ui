<script setup lang="ts">
import type {
  FormError,
  FormSubmitEvent
} from '@nuxt/ui'

interface LoginForm {
  email: string
  password: string
  remember: boolean
}

interface LoginResponse {
  message: string

  user: {
    id: number
    name: string
    email: string
    email_verified_at: string | null
  }
}

const config = useRuntimeConfig()

const loading = ref(false)
const errorMessage = ref('')

const showPassword = ref(false)

const state = reactive<LoginForm>({
  email: '',
  password: '',
  remember: false
})

const validate = (
  state: LoginForm
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

  if (!state.password) {
    errors.push({
      name: 'password',
      message: 'Password is required.'
    })
  }

  return errors
}

const getCsrfCookie = async () => {
  await $fetch(
    `${config.public.backendBase}/sanctum/csrf-cookie`,
    {
      credentials: 'include'
    }
  )
}

const onSubmit = async (
  event: FormSubmitEvent<LoginForm>
) => {
  loading.value = true
  errorMessage.value = ''

  try {
    /*
     * Ask Laravel for its CSRF cookie first.
     */
    await getCsrfCookie()

    /*
     * Laravel's XSRF-TOKEN cookie is intentionally
     * readable by JavaScript.
     */
    const xsrfCookie = useCookie<string | null>(
      'XSRF-TOKEN'
    )

    const xsrfToken = xsrfCookie.value
      ? decodeURIComponent(xsrfCookie.value)
      : ''

    const response = await $fetch<LoginResponse>(
      `${config.public.apiBase}/login`,
      {
        method: 'POST',

        credentials: 'include',

        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': xsrfToken
        },

        body: {
          email: event.data.email,
          password: event.data.password,
          remember: event.data.remember
        }
      }
    )

    /*
     * Store only non-sensitive user information.
     * Authentication itself remains in Laravel's
     * session cookie.
     */
    const currentUser = useState<
      LoginResponse['user'] | null
    >(
      'current-user',
      () => null
    )

    currentUser.value = response.user

    await navigateTo('/accounts')
  } catch (error: any) {
    console.error('Login error:', error)

    const data =
      error?.data ??
      error?.response?._data

    if (error?.statusCode === 403) {
      errorMessage.value =
        data?.message ??
        'Please verify your email before signing in.'

      return
    }

    if (data?.errors?.email?.[0]) {
      errorMessage.value =
        data.errors.email[0]

      return
    }

    errorMessage.value =
      data?.message ??
      'Unable to sign in. Please try again.'
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

      <!-- Heading -->
      <div class="mb-8 text-center">
        <h1
          class="
            text-3xl font-bold tracking-tight
            text-gray-900 dark:text-white
          "
        >
          Welcome back
        </h1>

        <p
          class="
            mt-2 text-sm
            text-gray-500 dark:text-gray-400
          "
        >
          Sign in to continue to your account.
        </p>
      </div>

      <UCard>

        <!-- Login Error -->
        <UAlert
          v-if="errorMessage"
          class="mb-6"
          color="error"
          variant="soft"
          title="Sign in failed"
          :description="errorMessage"
        />

        <UForm
          :state="state"
          :validate="validate"
          class="space-y-5"
          @submit="onSubmit"
        >

          <!-- Email -->
          <UFormField
            label="Email address"
            name="email"
            required
          >
            <UInput
              v-model="state.email"
              class="w-full"
              type="email"
              size="lg"
              autocomplete="email"
              placeholder="you@example.com"
              :disabled="loading"
              icon="i-lucide-mail"
            />
          </UFormField>

          <!-- Password -->
          <UFormField
            label="Password"
            name="password"
            required
          >
            <UInput
              v-model="state.password"
              class="w-full"
              :type="showPassword ? 'text' : 'password'"
              size="lg"
              autocomplete="current-password"
              placeholder="Enter your password"
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
                  @click="showPassword = !showPassword"
                />
              </template>
            </UInput>
          </UFormField>

          <!-- Remember + Forgot password -->
          <div
            class="
              flex items-center
              justify-between gap-4
            "
          >
            <UCheckbox
              v-model="state.remember"
              label="Remember me"
            />

            <NuxtLink
              to="/forgot-password"
              class="
                text-sm font-medium
                text-primary-600
                transition-colors
                hover:text-primary-500
                dark:text-primary-400
              "
            >
              Forgot password?
            </NuxtLink>
          </div>

          <!-- Submit -->
          <UButton
            type="submit"
            size="lg"
            block
            :loading="loading"
            :disabled="loading"
          >
            Sign in
          </UButton>

        </UForm>

        <!-- Register -->
        <div
          class="
            mt-6 text-center text-sm
            text-gray-500 dark:text-gray-400
          "
        >
          Don't have an account?

          <NuxtLink
            to="/register"
            class="
              font-medium
              text-primary-600
              hover:text-primary-500
              dark:text-primary-400
            "
          >
            Create account
          </NuxtLink>
        </div>

      </UCard>

    </div>
  </div>
</template>