import { useMutation, useQuery, useQueryCache } from '@pinia/colada'

import { createChat, getChats, type Chat } from '@/api/chats'
import { getUserByUsername } from '@/api/users'

export function useChatsQuery() {
  return useQuery({
    key: ['chats'],
    query: getChats,
    staleTime: 1000 * 30,
  })
}

export function useCreateDirectChatMutation() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async (username: string) => {
      const user = await getUserByUsername(username)
      const chat = await createChat({
        participantIds: [user.id],
      })

      return chat
    },
    onSuccess: async (chat: Chat) => {
      await queryCache.invalidateQueries({ key: ['chats'] })
      queryCache.setQueryData(['chat', chat.id], chat)
    },
  })
}
