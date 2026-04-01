import { useMutation, useQuery, useQueryCache } from '@pinia/colada'

import { getCurrentUser, login, logout, register, type LoginPayload, type RegisterPayload } from '@/api/auth'
import { markAuthenticated, markUnauthenticated } from '@/lib/auth'

export function useCurrentUserQuery() {
  return useQuery({
    key: ['auth', 'me'],
    query: getCurrentUser,
    staleTime: 1000 * 60,
  })
}

export function useRegisterMutation() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async (payload: RegisterPayload) => {
      const response = await register(payload)
      markAuthenticated()
      return response
    },
    onSettled: async () => {
      await queryCache.invalidateQueries({ key: ['auth'] })
    },
  })
}

export function useLoginMutation() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async (payload: LoginPayload) => {
      const response = await login(payload)
      markAuthenticated()
      return response
    },
    onSettled: async () => {
      await queryCache.invalidateQueries({ key: ['auth'] })
    },
  })
}

export function useLogoutMutation() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async () => {
      await logout()
      markUnauthenticated()
    },
    onSettled: async () => {
      markUnauthenticated()
      await queryCache.invalidateQueries({ key: ['auth'] })
    },
  })
}
