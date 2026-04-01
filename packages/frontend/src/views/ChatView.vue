<script setup lang="ts">
import { ref, computed } from 'vue'
import { MessageCircle, Send } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import CreateRoomModal from '@/components/CreateRoomModal.vue'

// ── Mock data ──────────────────────────────────────────────────────────────

interface MockUser {
  id: string
  username: string
  avatarUrl: string | null
}

interface MockChat {
  id: string
  member: MockUser
  lastMessage: string
  lastMessageAt: string
}

interface MockMessage {
  id: string
  chatId: string
  senderId: string
  content: string
  createdAt: string
}

const ME_ID = 'me'

const chats: MockChat[] = [
  {
    id: 'chat-1',
    member: { id: 'user-1', username: 'alexey_dev', avatarUrl: null },
    lastMessage: 'Окей, жду ответа!',
    lastMessageAt: '14:32',
  },
  {
    id: 'chat-2',
    member: { id: 'user-2', username: 'marina_k', avatarUrl: null },
    lastMessage: 'Когда встречаемся?',
    lastMessageAt: '13:10',
  },
  {
    id: 'chat-3',
    member: { id: 'user-3', username: 'igor99', avatarUrl: null },
    lastMessage: 'Спасибо, помогло!',
    lastMessageAt: 'Вчера',
  },
]

const messages: MockMessage[] = [
  { id: 'm1', chatId: 'chat-1', senderId: 'user-1', content: 'Привет! Как дела?', createdAt: '14:20' },
  { id: 'm2', chatId: 'chat-1', senderId: ME_ID, content: 'Всё отлично, спасибо! А у тебя?', createdAt: '14:21' },
  { id: 'm3', chatId: 'chat-1', senderId: 'user-1', content: 'Тоже хорошо. Ты уже посмотрел задачу?', createdAt: '14:25' },
  { id: 'm4', chatId: 'chat-1', senderId: ME_ID, content: 'Да, сейчас разбираюсь', createdAt: '14:28' },
  { id: 'm5', chatId: 'chat-1', senderId: 'user-1', content: 'Окей, жду ответа!', createdAt: '14:32' },

  { id: 'm6', chatId: 'chat-2', senderId: ME_ID, content: 'Привет, Marina!', createdAt: '13:00' },
  { id: 'm7', chatId: 'chat-2', senderId: 'user-2', content: 'Привет! Когда встречаемся?', createdAt: '13:10' },

  { id: 'm8', chatId: 'chat-3', senderId: 'user-3', content: 'Помоги с настройкой, пожалуйста', createdAt: 'Вчера' },
  { id: 'm9', chatId: 'chat-3', senderId: ME_ID, content: 'Конечно, вот инструкция...', createdAt: 'Вчера' },
  { id: 'm10', chatId: 'chat-3', senderId: 'user-3', content: 'Спасибо, помогло!', createdAt: 'Вчера' },
]

// ── State ──────────────────────────────────────────────────────────────────

const activeChatId = ref<string>(chats[0].id)
const messageText = ref('')
const isCreateRoomOpen = ref(false)

const activeChat = computed(() => chats.find(c => c.id === activeChatId.value)!)
const activeMessages = computed(() => messages.filter(m => m.chatId === activeChatId.value))

// ── Actions ────────────────────────────────────────────────────────────────

function sendMessage() {
  const text = messageText.value.trim()
  if (!text) return
  // TODO: backend integration
  messages.push({
    id: `m${Date.now()}`,
    chatId: activeChatId.value,
    senderId: ME_ID,
    content: text,
    createdAt: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
  })
  messageText.value = ''
}

function getInitials(username: string) {
  return username.slice(0, 2).toUpperCase()
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
        <button
          v-for="chat in chats"
          :key="chat.id"
          class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
          :class="{ 'bg-muted': chat.id === activeChatId }"
          @click="activeChatId = chat.id"
        >
          <!-- Avatar -->
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {{ getInitials(chat.member.username) }}
          </div>

          <!-- Info -->
          <div class="min-w-0 flex-1">
            <div class="flex items-baseline justify-between gap-1">
              <p class="truncate text-sm font-medium">{{ chat.member.username }}</p>
              <span class="shrink-0 text-xs text-muted-foreground">{{ chat.lastMessageAt }}</span>
            </div>
            <p class="truncate text-xs text-muted-foreground">{{ chat.lastMessage }}</p>
          </div>
        </button>
      </nav>
    </aside>

    <!-- ── Chat area ────────────────────────────────────────────────────── -->
    <div class="flex flex-1 flex-col overflow-hidden">

      <!-- Header -->
      <header class="flex items-center gap-3 border-b px-6 py-4">
        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {{ getInitials(activeChat.member.username) }}
        </div>
        <div>
          <p class="text-sm font-semibold">{{ activeChat.member.username }}</p>
          <p class="text-xs text-muted-foreground">В сети</p>
        </div>
      </header>

      <!-- Messages -->
      <main class="flex-1 overflow-y-auto px-6 py-4">
        <div class="flex flex-col gap-2">
          <div
            v-for="msg in activeMessages"
            :key="msg.id"
            class="flex"
            :class="msg.senderId === 'me' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-sm rounded-2xl px-4 py-2 text-sm"
              :class="msg.senderId === 'me'
                ? 'rounded-br-sm bg-primary text-primary-foreground'
                : 'rounded-bl-sm bg-muted text-foreground'"
            >
              <p>{{ msg.content }}</p>
              <p
                class="mt-1 text-right text-xs opacity-60"
                :class="msg.senderId === 'me' ? 'text-primary-foreground' : 'text-muted-foreground'"
              >
                {{ msg.createdAt }}
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
          />
          <Button type="submit" size="icon" :disabled="!messageText.trim()">
            <Send class="h-4 w-4" />
          </Button>
        </form>
      </footer>
    </div>
  </div>

  <CreateRoomModal v-model:open="isCreateRoomOpen" />
</template>
