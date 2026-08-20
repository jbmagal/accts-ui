export default defineNuxtRouteMiddleware(async () => {
  const config = useRuntimeConfig()

  const apiBase = String(
    config.public.apiBase || '/api',
  ).replace(/\/$/, '')

  try {
    /*
     * During SSR, forward the cookies received by Nuxt
     * from the browser to the Laravel API.
     *
     * During client-side navigation, credentials:'include'
     * lets the browser send the shared .jbm65.com cookies.
     */
    const headers = import.meta.server
      ? useRequestHeaders(['cookie'])
      : undefined

    await $fetch(`${apiBase}/user`, {
      method: 'GET',

      credentials: 'include',

      headers,
    })
  }
  catch (error: any) {
    const status =
      error?.statusCode ??
      error?.status ??
      error?.response?.status

    console.error(
      'Authentication check failed:',
      status,
      error?.data ?? error?.message,
    )

    if (status === 401 || status === 419) {
      return navigateTo('/login')
    }

    /*
     * Don't treat an API/network/server problem as
     * "user is logged out".
     */
    throw error
  }
})