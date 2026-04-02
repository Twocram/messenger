<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { MessageCircle, Send } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import CreateRoomModal from '@/components/CreateRoomModal.vue'
import { useCurrentUserQuery } from '@/composables/useAuth'
import { useChatsQuery } from '@/composables/useChats'
import {
  useChatMessagesQuery,
  useChatMessagesSocket,
  useSendMessageMutation,
} from '@/composables/useMessages'

const { state: currentUserState } = useCurrentUserQuery()
const { state: chatsState, asyncStatus: chatsStatus } = useChatsQuery()
const messageText = ref('')
const isCreateRoomOpen = ref(false)
const activeChatId = ref<string | null>(null)
const sendMessageMutation = useSendMessageMutation()

const chats = computed(() => chatsState.value.data ?? [])
const currentUserId = computed(() => currentUserState.value.data?.id ?? null)
const activeChat = computed(() => chats.value.find((chat) => chat.id === activeChatId.value) ?? null)
const { state: messagesState, asyncStatus: messagesStatus } = useChatMessagesQuery(() => activeChatId.value)
const activeMessages = computed(() => messagesState.value.data ?? [])
const { socketStatus } = useChatMessagesSocket(() => activeChatId.value)

watch(
  chats,
  (nextChats) => {
    if (!nextChats.length) {
      activeChatId.value = null
      return
    }

    if (!activeChatId.value || !nextChats.some((chat) => chat.id === activeChatId.value)) {
      activeChatId.value = nextChats[0]?.id ?? null
    }
  },
  { immediate: true },
)

const chatTitle = computed(() => {
  if (!activeChat.value) {
    return 'Выберите чат'
  }

  if (activeChat.value.name) {
    return activeChat.value.name
  }

  const otherMembers = activeChat.value.members.filter(
    (member) => member.id !== currentUserId.value,
  )

  return otherMembers.map((member) => member.username).join(', ') || 'Новый чат'
})

async function sendMessage() {
  if (!activeChatId.value) {
    return
  }

  const text = messageText.value.trim()
  if (!text) return

  await sendMessageMutation.mutateAsync({
    chatId: activeChatId.value,
    content: text,
  })

  messageText.value = ''
}

function getInitials(username: string) {
  return username.slice(0, 2).toUpperCase()
}

function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString('ru', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function onChatCreated(chatId: string) {
  activeChatId.value = chatId
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-background">

    <!-- ── Sidebar ──────────────────────────────────────────────────────── -->
    <aside class="flex w-72 shrink-0 flex-col border-r">
      <div class="flex items-center justify-between border-b px-4 py-4">
        <div class="flex items-center gap-2">
          <MessageCircle class="h-5 w-5 text-primary" />
          <span class="text-base font-semibold">Messenger</span>
        </div>
        <Button size="sm" @click="isCreateRoomOpen = true">Новый чат</Button>
      </div>

      <nav class="flex-1 overflow-y-auto">
        <div v-if="chatsStatus === 'loading'" class="px-4 py-3 text-sm text-muted-foreground">
          Загружаем чаты...
        </div>

        <button
          v-for="chat in chats"
          :key="chat.id"
          class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
          :class="{ 'bg-muted': chat.id === activeChatId }"
          @click="activeChatId = chat.id"
        >
          <!-- Avatar -->
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {{ getInitials(chat.name ?? chat.members[0]?.username ?? '??') }}
          </div>

          <!-- Info -->
          <div class="min-w-0 flex-1">
            <div class="flex items-baseline justify-between gap-1">
              <p class="truncate text-sm font-medium">
                {{ chat.name ?? chat.members.filter(member => member.id !== currentUserId)[0]?.username ?? 'Чат' }}
              </p>
            </div>
            <p class="truncate text-xs text-muted-foreground">
              {{ chat.isGroup ? `${chat.members.length} участников` : 'Личный чат' }}
            </p>
          </div>
        </button>
      </nav>
    </aside>

    <!-- ── Chat area ────────────────────────────────────────────────────── -->
    <div class="flex flex-1 flex-col overflow-hidden">

      <!-- Header -->
      <header class="flex items-center gap-3 border-b px-6 py-4">
        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {{ getInitials(chatTitle) }}
        </div>
        <div>
          <p class="text-sm font-semibold">{{ chatTitle }}</p>
          <p class="text-xs text-muted-foreground">
            {{ socketStatus === 'open' ? 'Подключено' : `${activeChat?.members.length ?? 0} участников` }}
          </p>
        </div>
      </header>

      <!-- Messages -->
      <main class="flex-1 overflow-y-auto px-6 py-4">
        <div v-if="messagesStatus === 'loading'" class="text-sm text-muted-foreground">
          Загружаем сообщения...
        </div>

        <div v-else class="flex flex-col gap-2">
          <div
            v-for="msg in activeMessages"
            :key="msg.id"
            class="flex"
            :class="msg.senderId === currentUserId ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-sm rounded-2xl px-4 py-2 text-sm"
              :class="msg.senderId === currentUserId
                ? 'rounded-br-sm bg-primary text-primary-foreground'
                : 'rounded-bl-sm bg-muted text-foreground'"
            >
              <p>{{ msg.content }}</p>
              <p
                class="mt-1 text-right text-xs opacity-60"
                :class="msg.senderId === currentUserId ? 'text-primary-foreground' : 'text-muted-foreground'"
              >
                {{ formatMessageTime(msg.createdAt) }}
              </p>
            </div>
          </div>
        </div>
      </main>

      <!-- Input -->
      <footer class="border-t px-6 py-4">
        <form class="flex items-center gap-3" @submit.prevent="sendMessage">
          <Input
            v-model="messageText"
            placeholder="Напишите сообщение..."
            class="flex-1"
            autocomplete="off"
            :disabled="!activeChatId"
          />
          <Button
            type="submit"
            size="icon"
            :disabled="!activeChatId || !messageText.trim() || sendMessageMutation.asyncStatus.value === 'loading'"
          >
            <Send class="h-4 w-4" />
          </Button>
        </form>
      </footer>
    </div>
  </div>

  <CreateRoomModal v-model:open="isCreateRoomOpen" @created="onChatCreated" />
</template>
