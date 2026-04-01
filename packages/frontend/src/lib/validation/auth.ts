import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

export const loginSchema = toTypedSchema(
  z.object({
    email: z.email('Введите корректный email'),
    password: z.string().min(1, 'Введите пароль'),
  }),
)

export const registerSchema = toTypedSchema(
  z
    .object({
      username: z
        .string()
        .min(3, 'Логин должен содержать минимум 3 символа')
        .max(32, 'Логин должен содержать не больше 32 символов'),
      email: z.email('Введите корректный email'),
      password: z
        .string()
        .min(8, 'Пароль должен содержать минимум 8 символов'),
      confirmPassword: z
        .string()
        .min(1, 'Подтвердите пароль'),
    })
    .refine((value) => value.password === value.confirmPassword, {
      message: 'Пароли не совпадают',
      path: ['confirmPassword'],
    }),
)
