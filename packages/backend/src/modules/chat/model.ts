import { t, type Static } from "elysia";

export const chatMemberModel = t.Object({
  id: t.String({ format: "uuid" }),
  username: t.String(),
  avatarUrl: t.Nullable(t.String()),
});

export const lastMessageModel = t.Nullable(t.Object({
  content: t.String(),
  senderId: t.String({ format: "uuid" }),
  createdAt: t.Date(),
}))


export const chatModel = t.Object({
  id: t.String({ format: "uuid" }),
  name: t.Nullable(t.String()),
  isGroup: t.Boolean(),
  members: t.Array(chatMemberModel),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  lastMessage: lastMessageModel,
});

export const createChatBodyModel = t.Object({
  participantIds: t.Array(t.String({ format: "uuid" }), { minItems: 1 }),
  name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
});

export const chatErrorModel = t.Object({
  error: t.String(),
});


export type ChatMemberModel = Static<typeof chatMemberModel>;
export type ChatModel = Static<typeof chatModel>;
export type CreateChatBodyModel = Static<typeof createChatBodyModel>;
export type LastMessageModel = Static<typeof lastMessageModel>;