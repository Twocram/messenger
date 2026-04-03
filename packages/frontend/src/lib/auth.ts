import ky from 'ky'

import { getApiUrl } from './api-url'

let authState: boolean | null = null
let authCheckPromise: Promise<boolean> | null = null

export async function checkAuthSession(force = false) {
  if (!force && authState !== null) {
    return authState
  }

  if (!authCheckPromise) {
    authCheckPromise = ky
      .get(getApiUrl('auth/me'), {
        credentials: 'include',
      })
      .then((response) => {
        authState = response.ok
        return authState
      })
      .catch(() => {
        authState = false
        return false
      })
      .finally(() => {
        authCheckPromise = null
      })
  }

  return authCheckPromise
}

export function markAuthenticated() {
  authState = true
}

export function markUnauthenticated() {
  authState = false
}
