import { t, type Static } from "elysia";

export const messageModel = t.Object({
  id: t.String({ format: "uuid" }),
  chatId: t.String({ format: "uuid" }),
  senderId: t.String({ format: "uuid" }),
  content: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export const sendMessageBodyModel = t.Object({
  content: t.String({ minLength: 1 }),
});

export const messageErrorModel = t.Object({
  error: t.String(),
});

export type MessageModel = Static<typeof messageModel>;
export type SendMessageBodyModel = Static<typeof sendMessageBodyModel>;
