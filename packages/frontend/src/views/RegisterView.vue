<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'


const login = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  console.debug("register", login.value)
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle class="text-2xl">Регистрация</CardTitle>
        <CardDescription>Создайте аккаунт для использования мессенджера</CardDescription>
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

          <div class="flex flex-col gap-2">
            <Label for="confirmPassword">Подтвердите пароль</Label>
            <Input id="confirmPassword" v-model="confirmPassword" type="password" required />
          </div>

          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
        </CardContent>

        <CardFooter class="flex flex-col gap-3 mt-4">
          <Button type="submit" class="w-full" :disabled="loading">
            {{ loading ? 'Регистрация...' : 'Зарегистрироваться' }}
          </Button>
          <p class="text-center text-sm text-muted-foreground">
            Уже есть аккаунт?
            <RouterLink :to="{ name: 'login' }" class="underline underline-offset-4 hover:text-primary">
              Войти
            </RouterLink>
          </p>
        </CardFooter>
      </form>
    </Card>
  </div>
</template>
