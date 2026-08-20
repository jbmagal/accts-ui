<script setup lang="ts">
import type {
  FormError,
  FormSubmitEvent
} from '@nuxt/ui'

interface RegisterForm {
  name: string
  email: string
  password: string
  password_confirmation: string
}

const config = useRuntimeConfig()

const loading = ref(false)
const submitError = ref('')

const serverErrors = ref<Record<string, string[]>>({})

const state = reactive<RegisterForm>({
  name: '',
  email: '',
  password: '',
  password_confirmation: ''
})

const validate = (state: RegisterForm): FormError[] => {
  const errors: FormError[] = []

  if (!state.name.trim()) {
    errors.push({
      name: 'name',
      message: 'Name is required.'
    })
  }

  if (!state.email.trim()) {
    errors.push({
      name: 'email',
      message: 'Email is required.'
    })
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) {
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

const clearServerError = (field: string) => {
  if (serverErrors.value[field]) {
    delete serverErrors.value[field]
  }

  submitError.value = ''
}

const onSubmit = async (
  event: FormSubmitEvent<RegisterForm>
) => {
  loading.value = true
  submitError.value = ''
  serverErrors.value = {}

  try {
    await $fetch(`${config.public.apiBase}/register`, {
      method: 'POST',
      body: event.data,
      headers: {
        Accept: 'application/json'
      }
    })

    await navigateTo({
      path: '/verify-email',
      query: {
        email: event.data.email
      }
    })
  } catch (error: any) {
    const data =
      error?.data ??
      error?.response?._data

    if (data?.errors) {
      serverErrors.value = data.errors
    }

    submitError.value =
      data?.message ??
      'Unable to create your account. Please try again.'
  } finally {
    loading.value = false
  }
}
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

      <!-- Logo / Heading -->
      <div class="mb-8 text-center">
        <h1
          class="
            text-3xl
            font-bold
            tracking-tight
            text-gray-900
            dark:text-white
          "
        >
          Create your account
        </h1>

        <p
          class="
            mt-2
            text-sm
            text-gray-500
            dark:text-gray-400
          "
        >
          Enter your information to get started.
        </p>
      </div>

      <!-- Card -->
      <UCard>
        <UAlert
          v-if="submitError"
          class="mb-6"
          color="error"
          variant="soft"
          title="Registration failed"
          :description="submitError"
        />

        <UForm
          :state="state"
          :validate="validate"
          class="space-y-5"
          @submit="onSubmit"
        >
          <!-- Name -->
          <UFormField
            label="Full name"
            name="name"
            required
            :error="serverErrors.name?.[0]"
          >
            <UInput
              v-model="state.name"
              class="w-full"
              size="lg"
              placeholder="Juan Dela Cruz"
              autocomplete="name"
              :disabled="loading"
              @update:model-value="clearServerError('name')"
            />
          </UFormField>

          <!-- Email -->
          <UFormField
            label="Email address"
            name="email"
            required
            :error="serverErrors.email?.[0]"
          >
            <UInput
              v-model="state.email"
              class="w-full"
              size="lg"
              type="email"
              placeholder="you@example.com"
              autocomplete="email"
              :disabled="loading"
              @update:model-value="clearServerError('email')"
            />
          </UFormField>

          <!-- Password -->
          <UFormField
            label="Password"
            name="password"
            required
            help="Minimum of 8 characters."
            :error="serverErrors.password?.[0]"
          >
            <UInput
              v-model="state.password"
              class="w-full"
              size="lg"
              type="password"
              placeholder="Enter your password"
              autocomplete="new-password"
              :disabled="loading"
              @update:model-value="clearServerError('password')"
            />
          </UFormField>

          <!-- Confirm Password -->
          <UFormField
            label="Confirm password"
            name="password_confirmation"
            required
            :error="serverErrors.password_confirmation?.[0]"
          >
            <UInput
              v-model="state.password_confirmation"
              class="w-full"
              size="lg"
              type="password"
              placeholder="Enter password again"
              autocomplete="new-password"
              :disabled="loading"
              @update:model-value="
                clearServerError('password_confirmation')
              "
            />
          </UFormField>

          <!-- Submit -->
          <UButton
            type="submit"
            size="lg"
            block
            :loading="loading"
            :disabled="loading"
          >
            Create account
          </UButton>
        </UForm>

        <div
          class="
            mt-6
            text-center
            text-sm
            text-gray-500
            dark:text-gray-400
          "
        >
          Already have an account?

          <NuxtLink
            to="/login"
            class="
              font-medium
              text-primary-600
              hover:text-primary-500
              dark:text-primary-400
            "
          >
            Sign in
          </NuxtLink>
        </div>
      </UCard>

      <p
        class="
          mt-6
          text-center
          text-xs
          text-gray-400
        "
      >
        By creating an account, you agree to our Terms
        and Privacy Policy.
      </p>

    </div>
  </div>
</template>