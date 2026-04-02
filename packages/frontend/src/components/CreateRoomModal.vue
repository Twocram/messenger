<script setup lang="ts">
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/api'
import { useCreateDirectChatMutation } from '@/composables/useChats'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
  created: [chatId: string]
}>()

const schema = toTypedSchema(
  z.object({
    login: z
      .string()
      .min(3, 'Логин должен содержать минимум 3 символа')
      .max(32, 'Логин должен содержать не больше 32 символов'),
  }),
)

const { defineField, errors, handleSubmit, resetForm } = useForm({
  validationSchema: schema,
  initialValues: { login: '' },
})

const [login] = defineField('login')
const error = ref('')
const { mutateAsync, asyncStatus } = useCreateDirectChatMutation()

const onSubmit = handleSubmit(async (values) => {
  error.value = ''

  try {
    const chat = await mutateAsync(values.login)
    emit('created', chat.id)
    resetForm()
    open.value = false
  }
  catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : 'Не удалось создать чат'
  }
})

function onOpenChange(value: boolean) {
  if (!value) {
    resetForm()
    error.value = ''
  }
  open.value = value
}
</script>

<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Новый чат</DialogTitle>
        <DialogDescription>Введите логин пользователя, с которым хотите начать диалог</DialogDescription>
      </DialogHeader>

      <form @submit.prevent="onSubmit">
        <div class="flex flex-col gap-2">
          <Label for="login">Логин пользователя</Label>
          <Input
            id="login"
            v-model="login"
            placeholder="username"
            autocomplete="off"
          />
          <p v-if="errors.login" class="text-sm text-destructive">{{ errors.login }}</p>
        </div>

        <p v-if="error" class="mt-3 text-sm text-destructive">{{ error }}</p>

        <DialogFooter>
          <DialogClose as-child>
            <Button type="button" variant="outline">Отмена</Button>
          </DialogClose>
          <Button type="submit" :disabled="asyncStatus === 'loading'">
            {{ asyncStatus === 'loading' ? 'Создание...' : 'Создать' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
