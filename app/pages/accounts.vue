<script setup lang="ts">
type EditableField =
  | 'account_name'
  | 'account_key'
  | 'pass_key'
  | 'note'

interface Account {
  id: number
  account_name: string
  account_key: string
  note: string | null
  created_at: string
  updated_at: string
}

interface PaginatedAccounts {
  current_page: number
  data: Account[]
  first_page_url: string
  from: number | null
  last_page: number
  last_page_url: string
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

interface CreateAccountForm {
  account_name: string
  account_key: string
  pass_key: string
  note: string
}

definePageMeta({
  middleware: 'auth',
})

useHead({
  title: 'Accounts',
})

const config = useRuntimeConfig()

const apiBase = String(
  config.public.apiBase || '/api',
).replace(/\/$/, '')

/*
|--------------------------------------------------------------------------
| State
|--------------------------------------------------------------------------
*/

const accounts = ref<Account[]>([])

const loading = ref(true)

const page = ref(1)

const perPage = ref(10)

const search = ref('')

const pagination = reactive({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
  from: null as number | null,
  to: null as number | null,
})

/*
|--------------------------------------------------------------------------
| Messages
|--------------------------------------------------------------------------
*/

const message = ref('')

const errorMessage = ref('')

let messageTimer: ReturnType<typeof setTimeout> | undefined

function showMessage(text: string) {
  message.value = text
  errorMessage.value = ''

  if (messageTimer) {
    clearTimeout(messageTimer)
  }

  messageTimer = setTimeout(() => {
    message.value = ''
  }, 3000)
}

function showError(text: string) {
  errorMessage.value = text
  message.value = ''
}

/*
|--------------------------------------------------------------------------
| HTTP helpers
|--------------------------------------------------------------------------
*/

function getStatus(error: any): number | undefined {
  return (
    error?.statusCode ??
    error?.status ??
    error?.response?.status
  )
}

function getErrorMessage(error: any): string {
  const validationErrors = error?.data?.errors

  if (validationErrors) {
    const firstError = Object
      .values(validationErrors)
      .flat()
      .find(Boolean)

    if (typeof firstError === 'string') {
      return firstError
    }
  }

  return (
    error?.data?.message ??
    error?.message ??
    'An unexpected error occurred.'
  )
}

async function handleUnauthorized(error: any) {
  if (getStatus(error) === 401) {
    await navigateTo('/login')
    return true
  }

  return false
}

/*
|--------------------------------------------------------------------------
| Sanctum CSRF
|--------------------------------------------------------------------------
*/

const backendBase = apiBase.replace(/\/api$/, '')

function getXsrfHeader(): Record<string, string> {
  if (import.meta.server) {
    return {}
  }

  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))

  if (!cookie) {
    return {}
  }

  const rawValue = cookie.substring(
    'XSRF-TOKEN='.length,
  )

  return {
    'X-XSRF-TOKEN': decodeURIComponent(rawValue),
  }
}

async function prepareCsrf() {
  await $fetch(
    `${backendBase}/sanctum/csrf-cookie`,
    {
      credentials: 'include',
    },
  )
}

/*
|--------------------------------------------------------------------------
| Load accounts
|--------------------------------------------------------------------------
*/

async function loadAccounts() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response =
      await $fetch<PaginatedAccounts>(
        `${apiBase}/accounts`,
        {
          credentials: 'include',

          query: {
            page: page.value,
            per_page: perPage.value,

            search:
              search.value.trim() !== ''
                ? search.value.trim()
                : undefined,
          },
        },
      )

    accounts.value = response.data

    pagination.current_page =
      response.current_page

    pagination.last_page =
      response.last_page || 1

    pagination.per_page =
      response.per_page

    pagination.total =
      response.total

    pagination.from =
      response.from

    pagination.to =
      response.to

    /*
     * Example:
     * User is on page 5 then search reduces
     * results to only 2 pages.
     */
    if (
      page.value >
      pagination.last_page
    ) {
      page.value = pagination.last_page
    }
  } catch (error: any) {
    if (await handleUnauthorized(error)) {
      return
    }

    showError(
      getErrorMessage(error),
    )
  } finally {
    loading.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Search
|--------------------------------------------------------------------------
*/

let searchTimer:
  | ReturnType<typeof setTimeout>
  | undefined

watch(search, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  searchTimer = setTimeout(() => {
    if (page.value !== 1) {
      page.value = 1
    } else {
      loadAccounts()
    }
  }, 350)
})

/*
|--------------------------------------------------------------------------
| Pagination
|--------------------------------------------------------------------------
*/

watch(page, () => {
  loadAccounts()
})

watch(perPage, () => {
  if (page.value !== 1) {
    page.value = 1
  } else {
    loadAccounts()
  }
})

function previousPage() {
  if (page.value > 1) {
    page.value--
  }
}

function nextPage() {
  if (
    page.value <
    pagination.last_page
  ) {
    page.value++
  }
}

/*
|--------------------------------------------------------------------------
| Create modal
|--------------------------------------------------------------------------
*/

const createOpen = ref(false)

const creating = ref(false)

const createError = ref('')

const createForm =
  reactive<CreateAccountForm>({
    account_name: '',
    account_key: '',
    pass_key: '',
    note: '',
  })

function resetCreateForm() {
  createForm.account_name = ''
  createForm.account_key = ''
  createForm.pass_key = ''
  createForm.note = ''

  createError.value = ''
}

function openCreateModal() {
  resetCreateForm()

  createOpen.value = true
}

async function createAccount() {
  createError.value = ''

  if (
    !createForm.account_name.trim() ||
    !createForm.account_key.trim() ||
    !createForm.pass_key
  ) {
    createError.value =
      'Account name, account key and password are required.'

    return
  }

  creating.value = true

  try {
    await prepareCsrf()

    await $fetch(
      `${apiBase}/accounts`,
      {
        method: 'POST',

        credentials: 'include',

        headers: getXsrfHeader(),

        body: {
          account_name:
            createForm.account_name.trim(),

          account_key:
            createForm.account_key.trim(),

          pass_key:
            createForm.pass_key,

          note:
            createForm.note.trim() ||
            null,
        },
      },
    )

    createOpen.value = false

    resetCreateForm()

    showMessage(
      'Account created successfully.',
    )

    if (page.value !== 1) {
      page.value = 1
    } else {
      await loadAccounts()
    }
  } catch (error: any) {
    if (await handleUnauthorized(error)) {
      return
    }

    createError.value =
      getErrorMessage(error)
  } finally {
    creating.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Inline editing
|--------------------------------------------------------------------------
*/

const editingAccountId =
  ref<number | null>(null)

const editingField =
  ref<EditableField | null>(null)

const editValue = ref('')

const savingCell = ref(false)

function isEditing(
  account: Account,
  field: EditableField,
) {
  return (
    editingAccountId.value === account.id &&
    editingField.value === field
  )
}

function startEdit(
  account: Account,
  field: EditableField,
) {
  if (savingCell.value) {
    return
  }

  editingAccountId.value =
    account.id

  editingField.value =
    field

  /*
   * Never preload the actual password.
   *
   * Clicking **** means:
   * "replace password"
   */
  if (field === 'pass_key') {
    editValue.value = ''
    return
  }

  editValue.value =
    String(account[field] ?? '')
}

function cancelEdit() {
  editingAccountId.value = null
  editingField.value = null
  editValue.value = ''
}

async function saveEdit(
  account: Account,
  field: EditableField,
) {
  if (!isEditing(account, field)) {
    return
  }

  if (savingCell.value) {
    return
  }

  // Don't change password if the new password is empty.
  if (
    field === 'pass_key' &&
    !editValue.value
  ) {
    cancelEdit()
    return
  }

  // account_name and account_key are required.
  if (
    (
      field === 'account_name' ||
      field === 'account_key'
    ) &&
    !editValue.value.trim()
  ) {
    showError(
      field === 'account_name'
        ? 'Account name is required.'
        : 'Account key is required.',
    )

    return
  }

  const oldValue =
    field === 'pass_key'
      ? null
      : String(account[field] ?? '')

  /*
   * Preserve password spaces exactly.
   * Trim the other fields.
   */
  const newValue =
    field === 'pass_key'
      ? editValue.value
      : editValue.value.trim()

  // Nothing changed.
  if (
    field !== 'pass_key' &&
    newValue === oldValue
  ) {
    cancelEdit()
    return
  }

  savingCell.value = true

  try {
    await prepareCsrf()

    /*
     * IMPORTANT:
     *
     * Laravel AccountController expects:
     *
     * {
     *   field: "note",
     *   value: "some note"
     * }
     */
    const body = {
      field,
      value:
        field === 'note'
          ? newValue || null
          : newValue,
    }

    await $fetch(
      `${apiBase}/accounts/${account.id}`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: getXsrfHeader(),
        body,
      },
    )

    cancelEdit()

    showMessage(
      field === 'pass_key'
        ? 'Password updated successfully.'
        : 'Account updated successfully.',
    )

    await loadAccounts()
  } catch (error: any) {
    if (await handleUnauthorized(error)) {
      return
    }

    showError(
      getErrorMessage(error),
    )
  } finally {
    savingCell.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Copy decrypted password
|--------------------------------------------------------------------------
*/

const copyingId =
  ref<number | null>(null)

async function copyPassword(
  account: Account,
) {
  copyingId.value = account.id

  errorMessage.value = ''

  try {
    const response =
      await $fetch<{
        pass_key: string
      }>(
        `${apiBase}/accounts/${account.id}/password`,
        {
          credentials: 'include',
        },
      )

    await navigator.clipboard.writeText(
      response.pass_key,
    )

    /*
     * Do not store response.pass_key
     * in component state.
     */
    showMessage(
      `Password for "${account.account_name}" copied to clipboard.`,
    )
  } catch (error: any) {
    if (await handleUnauthorized(error)) {
      return
    }

    if (
      error?.name ===
      'NotAllowedError'
    ) {
      showError(
        'Clipboard permission was denied.',
      )

      return
    }

    showError(
      getErrorMessage(error),
    )
  } finally {
    copyingId.value = null
  }
}

/*
|--------------------------------------------------------------------------
| Initial load
|--------------------------------------------------------------------------
*/

onMounted(() => {
  loadAccounts()
})
</script>

<template>
  <div
    class="min-h-screen bg-gray-50 dark:bg-gray-950"
  >
    <div
      class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
      <!-- Header -->
      <div
        class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1
            class="text-2xl font-bold text-gray-900 dark:text-white"
          >
            Accounts
          </h1>

          <p
            class="mt-1 text-sm text-gray-500 dark:text-gray-400"
          >
            Manage your saved account
            credentials.
          </p>
        </div>

        <UButton
          icon="i-lucide-plus"
          label="New Account"
          size="lg"
          @click="openCreateModal"
        />
      </div>

      <!-- Success message -->
      <div
        v-if="message"
        class="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
      >
        {{ message }}
      </div>

      <!-- Error -->
      <div
        v-if="errorMessage"
        class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
      >
        {{ errorMessage }}
      </div>

      <!-- Search / controls -->
      <div
        class="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Search account name, account key or note..."
            size="lg"
            class="w-full sm:max-w-md"
          />

          <div
            class="flex items-center gap-2"
          >
            <span
              class="text-sm text-gray-500 dark:text-gray-400"
            >
              Rows
            </span>

            <select
              v-model.number="perPage"
              class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option :value="10">
                10
              </option>

              <option :value="25">
                25
              </option>

              <option :value="50">
                50
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div
        class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div class="overflow-x-auto">
          <table
            class="min-w-full divide-y divide-gray-200 dark:divide-gray-800"
          >
            <thead
              class="bg-gray-50 dark:bg-gray-950"
            >
              <tr>
                <th
                  class="w-20 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  Copy
                </th>

                <th
                  class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  Account Name
                </th>

                <th
                  class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  Account Key
                </th>

                <th
                  class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  Pass Key
                </th>

                <th
                  class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  Note
                </th>
              </tr>
            </thead>

            <tbody
              class="divide-y divide-gray-100 dark:divide-gray-800"
            >
              <!-- Loading -->
              <tr v-if="loading">
                <td
                  colspan="5"
                  class="px-4 py-16 text-center"
                >
                  <div
                    class="flex items-center justify-center gap-3 text-gray-500"
                  >
                    <UIcon
                      name="i-lucide-loader-circle"
                      class="size-5 animate-spin"
                    />

                    Loading accounts...
                  </div>
                </td>
              </tr>

              <!-- No results -->
              <tr
                v-else-if="accounts.length === 0"
              >
                <td
                  colspan="5"
                  class="px-4 py-16 text-center"
                >
                  <UIcon
                    name="i-lucide-inbox"
                    class="mx-auto mb-3 size-10 text-gray-400"
                  />

                  <div
                    class="font-medium text-gray-700 dark:text-gray-300"
                  >
                    No accounts found
                  </div>

                  <div
                    class="mt-1 text-sm text-gray-500"
                  >
                    {{
                      search
                        ? 'Try another search.'
                        : 'Create your first account.'
                    }}
                  </div>
                </td>
              </tr>

              <tr
                v-for="account in accounts"
                v-else
                :key="account.id"
                class="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <!-- COPY -->
                <td
                  class="px-4 py-3 text-center"
                >
                  <UButton
                    icon="i-lucide-copy"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    :loading="
                      copyingId === account.id
                    "
                    aria-label="Copy password"
                    title="Copy decrypted password"
                    @click.stop="
                      copyPassword(account)
                    "
                  />
                </td>

                <!-- ACCOUNT NAME -->
                <td
                  class="min-w-52 cursor-pointer px-4 py-3 text-sm"
                  title="Click to edit"
                  @dblclick="
                    startEdit(
                      account,
                      'account_name',
                    )
                  "
                >
                  <UInput
                    v-if="
                      isEditing(
                        account,
                        'account_name',
                      )
                    "
                    v-model="editValue"
                    autofocus
                    class="w-full"
                    @click.stop
                    @keyup.enter="
                      saveEdit(
                        account,
                        'account_name',
                      )
                    "
                    @keyup.esc="cancelEdit"
                    @blur="
                      saveEdit(
                        account,
                        'account_name',
                      )
                    "
                  />

                  <span
                    v-else
                    class="font-medium text-gray-900 dark:text-white"
                  >
                    {{ account.account_name }}
                  </span>
                </td>

                <!-- ACCOUNT KEY -->
                <td
                  class="min-w-52 cursor-pointer px-4 py-3 text-sm"
                  title="Click to edit"
                  @dblclick="
                    startEdit(
                      account,
                      'account_key',
                    )
                  "
                >
                  <UInput
                    v-if="
                      isEditing(
                        account,
                        'account_key',
                      )
                    "
                    v-model="editValue"
                    autofocus
                    class="w-full"
                    @click.stop
                    @keyup.enter="
                      saveEdit(
                        account,
                        'account_key',
                      )
                    "
                    @keyup.esc="cancelEdit"
                    @blur="
                      saveEdit(
                        account,
                        'account_key',
                      )
                    "
                  />

                  <span
                    v-else
                    class="text-gray-700 dark:text-gray-300"
                  >
                    {{ account.account_key }}
                  </span>
                </td>

                <!-- PASSWORD -->
                <td
                  class="min-w-48 cursor-pointer px-4 py-3 text-sm"
                  title="Click to replace password"
                  @dblclick="
                    startEdit(
                      account,
                      'pass_key',
                    )
                  "
                >
                  <UInput
                    v-if="
                      isEditing(
                        account,
                        'pass_key',
                      )
                    "
                    v-model="editValue"
                    type="password"
                    placeholder="New password"
                    autofocus
                    class="w-full"
                    @click.stop
                    @keyup.enter="
                      saveEdit(
                        account,
                        'pass_key',
                      )
                    "
                    @keyup.esc="cancelEdit"
                    @blur="
                      saveEdit(
                        account,
                        'pass_key',
                      )
                    "
                  />

                  <span
                    v-else
                    class="font-mono tracking-widest text-gray-700 dark:text-gray-300"
                  >
                    ****
                  </span>
                </td>

                <!-- NOTE -->
                <td
                  class="min-w-64 cursor-pointer px-4 py-3 text-sm"
                  title="Click to edit"
                  @dblclick="
                    startEdit(
                      account,
                      'note',
                    )
                  "
                >
                  <UInput
                    v-if="
                      isEditing(
                        account,
                        'note',
                      )
                    "
                    v-model="editValue"
                    autofocus
                    class="w-full"
                    @click.stop
                    @keyup.enter="
                      saveEdit(
                        account,
                        'note',
                      )
                    "
                    @keyup.esc="cancelEdit"
                    @blur="
                      saveEdit(
                        account,
                        'note',
                      )
                    "
                  />

                  <span
                    v-else-if="account.note"
                    class="text-gray-600 dark:text-gray-400"
                  >
                    {{ account.note }}
                  </span>

                  <span
                    v-else
                    class="italic text-gray-400"
                  >
                    No note
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          v-if="!loading"
          class="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <div
            class="text-sm text-gray-500 dark:text-gray-400"
          >
            <template
              v-if="pagination.total > 0"
            >
              Showing
              <strong>
                {{ pagination.from }}
              </strong>
              to
              <strong>
                {{ pagination.to }}
              </strong>
              of
              <strong>
                {{ pagination.total }}
              </strong>
              accounts
            </template>

            <template v-else>
              0 accounts
            </template>
          </div>

          <div
            class="flex items-center gap-2"
          >
            <UButton
              icon="i-lucide-chevron-left"
              label="Previous"
              color="neutral"
              variant="outline"
              :disabled="
                page <= 1 || loading
              "
              @click="previousPage"
            />

            <div
              class="min-w-24 text-center text-sm text-gray-600 dark:text-gray-400"
            >
              Page
              <strong>{{ page }}</strong>
              of
              <strong>
                {{ pagination.last_page }}
              </strong>
            </div>

            <UButton
              trailing-icon="i-lucide-chevron-right"
              label="Next"
              color="neutral"
              variant="outline"
              :disabled="
                page >=
                  pagination.last_page ||
                loading
              "
              @click="nextPage"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- CREATE ACCOUNT MODAL -->
    <UModal
      v-model:open="createOpen"
      title="Create Account"
      description="Add a new account to your repository."
    >
      <template #body>
        <form
          class="space-y-5"
          @submit.prevent="createAccount"
        >
          <div
            v-if="createError"
            class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {{ createError }}
          </div>

          <div>
            <label
              class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Account Name
              <span class="text-red-500">
                *
              </span>
            </label>

            <UInput
              v-model="
                createForm.account_name
              "
              icon="i-lucide-user"
              placeholder="e.g. Gmail"
              size="lg"
              class="w-full"
              autofocus
            />
          </div>

          <div>
            <label
              class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Account Key
              <span class="text-red-500">
                *
              </span>
            </label>

            <UInput
              v-model="
                createForm.account_key
              "
              icon="i-lucide-key-round"
              placeholder="e.g. user@example.com"
              size="lg"
              class="w-full"
            />
          </div>

          <div>
            <label
              class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password / Pass Key
              <span class="text-red-500">
                *
              </span>
            </label>

            <UInput
              v-model="
                createForm.pass_key
              "
              type="password"
              icon="i-lucide-lock-keyhole"
              placeholder="Enter password"
              size="lg"
              class="w-full"
            />

            <p
              class="mt-1.5 text-xs text-gray-500"
            >
              The password will be
              encrypted by Laravel before
              being stored.
            </p>
          </div>

          <div>
            <label
              class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Note
            </label>

            <UTextarea
              v-model="createForm.note"
              placeholder="Optional note..."
              :rows="4"
              class="w-full"
            />
          </div>
        </form>
      </template>

      <template #footer>
        <div
          class="flex w-full justify-end gap-2"
        >
          <UButton
            label="Cancel"
            color="neutral"
            variant="outline"
            :disabled="creating"
            @click="
              createOpen = false
            "
          />

          <UButton
            icon="i-lucide-save"
            label="Create Account"
            :loading="creating"
            @click="createAccount"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>