<script setup lang="ts">
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import { useRouter } from 'vue-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ApiError } from '@/lib/api'
import { useLoginMutation } from '@/composables/useAuth'
import { loginSchema } from '@/lib/validation/auth'

const router = useRouter()
const error = ref('')
const { mutateAsync, asyncStatus } = useLoginMutation()
const { defineField, errors, handleSubmit } = useForm({
  validationSchema: loginSchema,
  initialValues: {
    email: '',
    password: '',
  },
})
const [email] = defineField('email')
const [password] = defineField('password')

const onSubmit = handleSubmit(async (values) => {
  error.value = ''

  try {
    await mutateAsync({
      email: values.email,
      password: values.password,
    })

    await router.push({ name: 'home' })
  }
  catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : 'Не удалось выполнить вход'
  }
})
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
            <Label for="email">Email</Label>
            <Input id="email" v-model="email" type="email" placeholder="name@example.com" />
            <p v-if="errors.email" class="text-sm text-destructive">{{ errors.email }}</p>
          </div>

          <div class="flex flex-col gap-2">
            <Label for="password">Пароль</Label>
            <Input id="password" v-model="password" type="password" />
            <p v-if="errors.password" class="text-sm text-destructive">{{ errors.password }}</p>
          </div>

          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
        </CardContent>

        <CardFooter class="flex flex-col gap-3 mt-4">
          <Button type="submit" class="w-full" :disabled="asyncStatus === 'loading'">
            {{ asyncStatus === 'loading' ? 'Вход...' : 'Войти' }}
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
