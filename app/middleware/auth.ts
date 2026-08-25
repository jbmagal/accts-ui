export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) {
    return
  }

  const config = useRuntimeConfig()

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
  } catch (error: any) {
    const status =
      error?.statusCode ??
      error?.status ??
      error?.response?.status

    if (status === 401) {
      return navigateTo('/login', {
        replace: true,
      })
    }

    console.error(
      'Authentication check failed:',
      error,
    )

    return navigateTo('/login', {
      replace: true,
    })
  }
})