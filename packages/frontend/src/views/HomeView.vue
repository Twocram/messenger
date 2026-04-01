<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { Button } from '@/components/ui/button'
import { useCurrentUserQuery, useLogoutMutation } from '@/composables/useAuth'

const router = useRouter()
const { state, asyncStatus } = useCurrentUserQuery()
const logoutMutation = useLogoutMutation()
const isLoadingProfile = computed(() => asyncStatus.value === 'loading')
const isLoggingOut = computed(() => logoutMutation.asyncStatus.value === 'loading')

async function signOut() {
  logoutMutation.mutate()
  await router.push({ name: 'login' })
}
</script>

<template>
  <main class="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-16">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-muted-foreground">Messenger</p>
        <h1 class="text-3xl font-semibold">Главная</h1>
      </div>

      <div v-if="state.data" class="flex gap-2">
        <RouterLink :to="{ name: 'chat' }">
          <Button>Перейти к чатам</Button>
        </RouterLink>
        <Button variant="outline" :disabled="isLoggingOut" @click="signOut">
          {{ isLoggingOut ? 'Выход...' : 'Выйти' }}
        </Button>
      </div>
    </div>

    <section class="rounded-xl border p-6">
      <template v-if="isLoadingProfile">
        Загружаем профиль...
      </template>

      <template v-else-if="state.error">
        <div class="space-y-3">
          <p class="text-destructive">{{ state.error.message }}</p>
          <RouterLink :to="{ name: 'login' }" class="underline underline-offset-4">
            Перейти ко входу
          </RouterLink>
        </div>
      </template>

      <template v-else-if="state.data">
        <div class="space-y-2">
          <p class="text-sm text-muted-foreground">Вы вошли как</p>
          <p class="text-xl font-medium">{{ state.data.username }}</p>
          <p class="text-muted-foreground">{{ state.data.email }}</p>
        </div>
      </template>

      <template v-else>
        <div class="space-y-3">
          <p class="text-muted-foreground">
            Токены авторизации пока не сохранены. Войдите или создайте аккаунт.
          </p>
          <div class="flex gap-3">
            <RouterLink :to="{ name: 'login' }">
              <Button>Войти</Button>
            </RouterLink>
            <RouterLink :to="{ name: 'register' }">
              <Button variant="outline">Регистрация</Button>
            </RouterLink>
          </div>
        </div>
      </template>
    </section>
  </main>
</template>
