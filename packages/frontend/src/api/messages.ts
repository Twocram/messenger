import { apiGet, apiPatch, apiPost } from '@/lib/api'

export interface Message {
  id: string
  chatId: string
  senderId: string
  content: string
  editedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface SendMessagePayload {
  content: string
}

export interface EditMessagePayload {
  content: string
}

export function getChatMessages(chatId: string) {
  return apiGet<Message[]>(`chats/${chatId}/messages`)
}

export function sendMessage(chatId: string, payload: SendMessagePayload) {
  return apiPost<Message, SendMessagePayload>(`chats/${chatId}/messages`, payload)
}

export function editMessage(chatId: string, messageId: string, payload: EditMessagePayload) {
  return apiPatch<Message, EditMessagePayload>(`chats/${chatId}/messages/${messageId}`, payload)
}
