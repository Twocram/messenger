<script setup lang="ts">
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import { useRouter } from 'vue-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useRegisterMutation } from '@/composables/useAuth'
import { ApiError } from '@/lib/api'
import { registerSchema } from '@/lib/validation/auth'

const router = useRouter()
const error = ref('')
const { mutateAsync, asyncStatus } = useRegisterMutation()
const { defineField, errors, handleSubmit } = useForm({
  validationSchema: registerSchema,
  initialValues: {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  },
})
const [username] = defineField('username')
const [email] = defineField('email')
const [password] = defineField('password')
const [confirmPassword] = defineField('confirmPassword')

const onSubmit = handleSubmit(async (values) => {
  error.value = ''

  try {
    await mutateAsync({
      username: values.username,
      email: values.email,
      password: values.password,
    })

    await router.push({ name: 'home' })
  }
  catch (cause) {
    error.value =
      cause instanceof ApiError ? cause.message : 'Не удалось зарегистрироваться'
  }
})
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
            <Label for="username">Логин</Label>
            <Input id="username" v-model="username" placeholder="username" />
            <p v-if="errors.username" class="text-sm text-destructive">{{ errors.username }}</p>
          </div>

          <div class="flex flex-col gap-2">
            <Label for="email">Email</Label>
            <Input id="email" v-model="email" type="email" placeholder="name@example.com" />
            <p v-if="errors.email" class="text-sm text-destructive">{{ errors.email }}</p>
          </div>

          <div class="flex flex-col gap-2">
            <Label for="password">Пароль</Label>
            <Input id="password" v-model="password" type="password" />
            <p v-if="errors.password" class="text-sm text-destructive">{{ errors.password }}</p>
          </div>

          <div class="flex flex-col gap-2">
            <Label for="confirmPassword">Подтвердите пароль</Label>
            <Input id="confirmPassword" v-model="confirmPassword" type="password" />
            <p v-if="errors.confirmPassword" class="text-sm text-destructive">
              {{ errors.confirmPassword }}
            </p>
          </div>

          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
        </CardContent>

        <CardFooter class="flex flex-col gap-3 mt-4">
          <Button type="submit" class="w-full" :disabled="asyncStatus === 'loading'">
            {{ asyncStatus === 'loading' ? 'Регистрация...' : 'Зарегистрироваться' }}
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
