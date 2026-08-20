export default defineNuxtRouteMiddleware(async () => {
  /*
   * Perform the Laravel authentication check in the browser.
   *
   * This avoids SSR trying to call a relative /api URL
   * from inside the Nitro server.
   */
  if (import.meta.server) {
    return
  }

  const config = useRuntimeConfig()

  const apiBase = String(
    config.public.apiBase || '/api',
  ).replace(/\/$/, '')

  try {
    await $fetch(`${apiBase}/user`, {
      credentials: 'include',
    })
  } catch (error: any) {
    const status =
      error?.statusCode ??
      error?.status ??
      error?.response?.status

    if (status === 401) {
      return navigateTo('/login')
    }

    /*
     * Also redirect when the authentication
     * endpoint itself rejects access.
     */
    return navigateTo('/login')
  }
})