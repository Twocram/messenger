import ky, { type HTTPError } from 'ky'

import { markUnauthenticated } from './auth'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export interface ApiErrorPayload {
  error?: string
  message?: string
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

let refreshRequest: Promise<boolean> | null = null

async function toApiError(error: unknown) {
  if (error instanceof ApiError) {
    return error
  }

  if (error instanceof Error && 'response' in error) {
    const httpError = error as HTTPError
    let payload: ApiErrorPayload | undefined

    try {
      payload = (await httpError.response.clone().json()) as ApiErrorPayload
    }
    catch {
      payload = undefined
    }

    return new ApiError(
      payload?.error ?? payload?.message ?? httpError.message,
      httpError.response.status,
    )
  }

  return new ApiError(error instanceof Error ? error.message : 'Unknown API error', 500)
}

async function refreshTokens() {
  if (!refreshRequest) {
    refreshRequest = ky
      .post(`${API_URL}/auth/refresh`, {
        credentials: 'include',
      })
      .then((response) => {
        const success = response.ok

        if (!success) {
          markUnauthenticated()
        }

        return success
      })
      .catch(() => {
        markUnauthenticated()
        return false
      })
      .finally(() => {
        refreshRequest = null
      })
  }

  return refreshRequest
}

export const api = ky.create({
  prefixUrl: API_URL,
  credentials: 'include',
  retry: 0,
  hooks: {
    afterResponse: [
      async (request, options, response) => {
        if (response.status !== 401) {
          return response
        }

        const url = new URL(request.url)
        const isAuthRefreshRequest = url.pathname.endsWith('/auth/refresh')
        const hasRetried = options.context.retryAuth === true

        if (isAuthRefreshRequest || hasRetried) {
          markUnauthenticated()
          return response
        }

        const refreshed = await refreshTokens()

        if (!refreshed) {
          return response
        }

        return ky(request, {
          ...options,
          context: {
            ...options.context,
            retryAuth: true,
          },
        })
      },
    ],
  },
})

export async function apiGet<T>(url: string) {
  try {
    return await api.get(url).json<T>()
  }
  catch (error) {
    throw await toApiError(error)
  }
}

export async function apiPost<TResponse, TBody>(url: string, body: TBody) {
  try {
    return await api
      .post(url, body === undefined ? undefined : { json: body })
      .json<TResponse>()
  }
  catch (error) {
    throw await toApiError(error)
  }
}

export async function apiPatch<TResponse, TBody>(url: string, body: TBody) {
  try {
    return await api
      .patch(url, body === undefined ? undefined : { json: body })
      .json<TResponse>()
  }
  catch (error) {
    throw await toApiError(error)
  }
}
