import { apiGet, apiPost } from '@/lib/api'

export interface AuthUser {
  id: string
  username: string
  email: string
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: AuthUser
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export function register(payload: RegisterPayload) {
  return apiPost<AuthResponse, RegisterPayload>('auth/register', payload)
}

export function login(payload: LoginPayload) {
  return apiPost<AuthResponse, LoginPayload>('auth/login', payload)
}

export function logout() {
  return apiPost<{ success: boolean }, undefined>('auth/logout', undefined)
}

export function getCurrentUser() {
  return apiGet<AuthUser>('auth/me')
}
