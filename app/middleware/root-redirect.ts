export default defineNuxtRouteMiddleware(async () => {
  /*
   * Authentication uses browser cookies,
   * so perform this check client-side.
   */
  if (import.meta.server) {
    return
  }

  const config = useRuntimeConfig()

  const apiBase = String(
    config.public.apiBase ||
    'https://accts-api.jbm65.com/api',
  ).replace(/\/$/, '')

  try {
    /*
     * If this succeeds, the Laravel/Sanctum
     * session is valid.
     */
    await $fetch(`${apiBase}/user`, {
      credentials: 'include',
    })

    return navigateTo('/accounts')
  } catch {
    /*
     * No valid authenticated session.
     */
    return navigateTo('/login')
  }
})