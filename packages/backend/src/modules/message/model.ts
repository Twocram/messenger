import { t, type Static } from "elysia";

export const messageModel = t.Object({
  id: t.String({ format: "uuid" }),
  chatId: t.String({ format: "uuid" }),
  senderId: t.String({ format: "uuid" }),
  content: t.String(),
  editedAt: t.Nullable(t.Date()),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export const sendMessageBodyModel = t.Object({
  content: t.String({ minLength: 1 }),
});

export const editMessageBodyModel = t.Object({
  content: t.String({ minLength: 1 }),
});

export const messageErrorModel = t.Object({
  error: t.String(),
});

export const messageSocketEventModel = t.Union([
  t.Object({ type: t.Literal("message:new"), payload: messageModel }),
  t.Object({ type: t.Literal("message:edit"), payload: messageModel }),
]);

export type MessageModel = Static<typeof messageModel>;
export type SendMessageBodyModel = Static<typeof sendMessageBodyModel>;
export type EditMessageBodyModel = Static<typeof editMessageBodyModel>;
export type MessageSocketEventModel = Static<typeof messageSocketEventModel>;
