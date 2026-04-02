import { and, asc, eq } from "drizzle-orm";

import { db, schema } from "../../db";
import type { SendMessageBodyModel } from "./model";

export class MessageError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export abstract class MessageService {
  static async sendMessage(
    chatId: string,
    senderId: string,
    input: SendMessageBodyModel,
  ) {
    // Verify sender is a member of the chat
    const membership = await db.query.chatMembers.findFirst({
      where: and(
        eq(schema.chatMembers.chatId, chatId),
        eq(schema.chatMembers.userId, senderId),
      ),
    });

    if (!membership) {
      throw new MessageError("Chat not found", 404);
    }

    const [message] = await db
      .insert(schema.messages)
      .values({ chatId, senderId, content: input.content })
      .returning();

    if (!message) {
      throw new Error("Failed to send message");
    }

    return message;
  }

  static async getChatMessages(chatId: string, userId: string) {
    // Verify user is a member of the chat
    const membership = await db.query.chatMembers.findFirst({
      where: and(
        eq(schema.chatMembers.chatId, chatId),
        eq(schema.chatMembers.userId, userId),
      ),
    });

    if (!membership) {
      throw new MessageError("Chat not found", 404);
    }

    return db.query.messages.findMany({
      where: eq(schema.messages.chatId, chatId),
      orderBy: [asc(schema.messages.createdAt)],
    });
  }
}
