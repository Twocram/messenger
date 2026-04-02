import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import { onBeforeUnmount, ref, watch } from 'vue'

import { getChatMessages, sendMessage, type Message } from '@/api/messages'
import { getWebSocketUrl } from '@/lib/websocket'

export function useChatMessagesQuery(chatId: () => string | null) {
  return useQuery({
    key: () => ['messages', chatId()],
    query: async () => {
      const value = chatId()

      if (!value) {
        return []
      }

      return getChatMessages(value)
    },
    staleTime: 1000 * 10,
  })
}

export function useSendMessageMutation() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async (payload: { chatId: string; content: string }) => {
      return sendMessage(payload.chatId, { content: payload.content })
    },
    onSuccess: (message, payload) => {
      queryCache.setQueryData<Message[]>(['messages', payload.chatId], (oldMessages) => {
        const messages = oldMessages ?? []

        if (messages.some((existingMessage) => existingMessage.id === message.id)) {
          return messages
        }

        return [...messages, message]
      })
    },
  })
}

export function useChatMessagesSocket(chatId: () => string | null) {
  const queryCache = useQueryCache()
  const socketStatus = ref<'closed' | 'connecting' | 'open'>('closed')
  let socket: WebSocket | null = null

  function closeSocket() {
    if (!socket) {
      return
    }

    socket.close()
    socket = null
    socketStatus.value = 'closed'
  }

  function openSocket(nextChatId: string) {
    socketStatus.value = 'connecting'
    socket = new WebSocket(getWebSocketUrl(`/chats/${nextChatId}/messages/ws`))

    socket.onopen = () => {
      socketStatus.value = 'open'
    }

    socket.onclose = () => {
      socketStatus.value = 'closed'
    }

    socket.onerror = () => {
      socketStatus.value = 'closed'
    }

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data) as {
        type: 'message:new'
        payload: Message
      }

      if (payload.type !== 'message:new') {
        return
      }

      queryCache.setQueryData<Message[]>(['messages', nextChatId], (oldMessages) => {
        const messages = oldMessages ?? []

        if (messages.some((message) => message.id === payload.payload.id)) {
          return messages
        }

        return [...messages, payload.payload]
      })
    }
  }

  watch(
    chatId,
    (nextChatId) => {
      closeSocket()

      if (!nextChatId) {
        return
      }

      openSocket(nextChatId)
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    closeSocket()
  })

  return {
    socketStatus,
  }
}
