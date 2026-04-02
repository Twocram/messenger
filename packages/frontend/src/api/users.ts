import { apiGet } from '@/lib/api'

export interface UserLookup {
  id: string
  username: string
  avatarUrl: string | null
}

export function getUserByUsername(username: string) {
  return apiGet<UserLookup>(`users/by-username/${encodeURIComponent(username)}`)
}
