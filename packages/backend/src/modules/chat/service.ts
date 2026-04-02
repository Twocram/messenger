import { and, eq, inArray } from "drizzle-orm";

import { db, schema } from "../../db";
import type { CreateChatBodyModel } from "./model";

export class ChatError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export abstract class ChatService {
  static async createChat(currentUserId: string, input: CreateChatBodyModel) {
    const allParticipantIds = [
      ...new Set([currentUserId, ...input.participantIds]),
    ];

    if (allParticipantIds.length < 2) {
      throw new ChatError("A chat requires at least 2 participants", 400);
    }

    const isGroup = allParticipantIds.length > 2 || Boolean(input.name);

    // For DMs, check if a chat already exists between these two users
    if (!isGroup) {
      const otherUserId = allParticipantIds.find((id) => id !== currentUserId)!;
      const existing = await this.findDirectChat(currentUserId, otherUserId);

      if (existing) {
        return existing;
      }
    }

    const participants = await db.query.users.findMany({
      where: inArray(schema.users.id, allParticipantIds),
      columns: { id: true, username: true, avatarUrl: true },
    });

    if (participants.length !== allParticipantIds.length) {
      throw new ChatError("One or more participants not found", 404);
    }

    const [chat] = await db
      .insert(schema.chats)
      .values({ name: input.name ?? null, isGroup })
      .returning();

    if (!chat) {
      throw new Error("Failed to create chat");
    }

    await db.insert(schema.chatMembers).values(
      allParticipantIds.map((userId) => ({ chatId: chat.id, userId })),
    );

    return {
      ...chat,
      members: participants,
    };
  }

  static async getUserChats(userId: string) {
    // Get all chat IDs the user belongs to
    const memberships = await db.query.chatMembers.findMany({
      where: eq(schema.chatMembers.userId, userId),
      columns: { chatId: true },
    });

    if (memberships.length === 0) {
      return [];
    }

    const chatIds = memberships.map((m) => m.chatId);

    const chats = await db.query.chats.findMany({
      where: inArray(schema.chats.id, chatIds),
    });

    // Get all members for these chats
    const allMembers = await db
      .select({
        chatId: schema.chatMembers.chatId,
        id: schema.users.id,
        username: schema.users.username,
        avatarUrl: schema.users.avatarUrl,
      })
      .from(schema.chatMembers)
      .innerJoin(schema.users, eq(schema.chatMembers.userId, schema.users.id))
      .where(inArray(schema.chatMembers.chatId, chatIds));

    const membersByChat = new Map<
      string,
      { id: string; username: string; avatarUrl: string | null }[]
    >();

    for (const { chatId, ...member } of allMembers) {
      const list = membersByChat.get(chatId) ?? [];
      list.push(member);
      membersByChat.set(chatId, list);
    }

    return chats.map((chat) => ({
      ...chat,
      members: membersByChat.get(chat.id) ?? [],
    }));
  }

  static async getChatById(chatId: string, userId: string) {
    const membership = await db.query.chatMembers.findFirst({
      where: and(
        eq(schema.chatMembers.chatId, chatId),
        eq(schema.chatMembers.userId, userId),
      ),
    });

    if (!membership) {
      throw new ChatError("Chat not found", 404);
    }

    const chat = await db.query.chats.findFirst({
      where: eq(schema.chats.id, chatId),
    });

    if (!chat) {
      throw new ChatError("Chat not found", 404);
    }

    const rows = await db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        avatarUrl: schema.users.avatarUrl,
      })
      .from(schema.chatMembers)
      .innerJoin(schema.users, eq(schema.chatMembers.userId, schema.users.id))
      .where(eq(schema.chatMembers.chatId, chatId));

    return { ...chat, members: rows };
  }

  private static async findDirectChat(userA: string, userB: string) {
    // A direct chat has both users as members and isGroup = false
    const membershipsA = await db.query.chatMembers.findMany({
      where: eq(schema.chatMembers.userId, userA),
      columns: { chatId: true },
    });

    if (membershipsA.length === 0) return null;

    const chatIds = membershipsA.map((m) => m.chatId);

    const membershipB = await db.query.chatMembers.findFirst({
      where: and(
        eq(schema.chatMembers.userId, userB),
        inArray(schema.chatMembers.chatId, chatIds),
      ),
    });

    if (!membershipB) return null;

    const chat = await db.query.chats.findFirst({
      where: and(
        eq(schema.chats.id, membershipB.chatId),
        eq(schema.chats.isGroup, false),
      ),
    });

    if (!chat) return null;

    const rows = await db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        avatarUrl: schema.users.avatarUrl,
      })
      .from(schema.chatMembers)
      .innerJoin(schema.users, eq(schema.chatMembers.userId, schema.users.id))
      .where(eq(schema.chatMembers.chatId, chat.id));

    return { ...chat, members: rows };
  }
}
