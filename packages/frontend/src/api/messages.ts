import { apiGet, apiPost } from '@/lib/api'

export interface Message {
  id: string
  chatId: string
  senderId: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface SendMessagePayload {
  content: string
}

export function getChatMessages(chatId: string) {
  return apiGet<Message[]>(`chats/${chatId}/messages`)
}

export function sendMessage(chatId: string, payload: SendMessagePayload) {
  return apiPost<Message, SendMessagePayload>(`chats/${chatId}/messages`, payload)
}
