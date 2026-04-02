import { apiGet, apiPost } from '@/lib/api'

export interface ChatMember {
  id: string
  username: string
  avatarUrl: string | null
}

export interface Chat {
  id: string
  name: string | null
  isGroup: boolean
  members: ChatMember[]
  createdAt: string
  updatedAt: string
}

export interface CreateChatPayload {
  participantIds: string[]
  name?: string
}

export function getChats() {
  return apiGet<Chat[]>('chats')
}

export function getChat(chatId: string) {
  return apiGet<Chat>(`chats/${chatId}`)
}

export function createChat(payload: CreateChatPayload) {
  return apiPost<Chat, CreateChatPayload>('chats', payload)
}
