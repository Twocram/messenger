<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'


const login = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  console.debug('login', login.value)
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle class="text-2xl">Вход</CardTitle>
        <CardDescription>Введите логин и пароль для входа в аккаунт</CardDescription>
      </CardHeader>

      <form @submit.prevent="onSubmit">
        <CardContent class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <Label for="login">Логин</Label>
            <Input id="login" v-model="login" placeholder="username" required />
          </div>

          <div class="flex flex-col gap-2">
            <Label for="password">Пароль</Label>
            <Input id="password" v-model="password" type="password" required />
          </div>

          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
        </CardContent>

        <CardFooter class="flex flex-col gap-3 mt-4">
          <Button type="submit" class="w-full" :disabled="loading">
            {{ loading ? 'Вход...' : 'Войти' }}
          </Button>
          <p class="text-center text-sm text-muted-foreground">
            Нет аккаунта?
            <RouterLink :to="{ name: 'register' }" class="underline underline-offset-4 hover:text-primary">
              Зарегистрироваться
            </RouterLink>
          </p>
        </CardFooter>
      </form>
    </Card>
  </div>
</template>
