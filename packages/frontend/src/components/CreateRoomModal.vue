<script setup lang="ts">
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

const onSubmit = handleSubmit((_values) => {
  // TODO: backend integration
  resetForm()
  open.value = false
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
          <Button type="submit">Создать</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
