import { and, asc, eq } from "drizzle-orm";
import type { ElysiaWS } from "elysia/ws";

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
  private static chatConnections = new Map<
    string,
    Map<string, ElysiaWS<{ currentUser: { id: string } }>>
  >();

  static async sendMessage(
    chatId: string,
    senderId: string,
    input: SendMessageBodyModel,
  ) {
    await this.assertChatMembership(chatId, senderId);

    const [message] = await db
      .insert(schema.messages)
      .values({ chatId, senderId, content: input.content })
      .returning();

    if (!message) {
      throw new Error("Failed to send message");
    }

    this.broadcastMessage(chatId, message);

    return message;
  }

  static async getChatMessages(chatId: string, userId: string) {
    await this.assertChatMembership(chatId, userId);

    return db.query.messages.findMany({
      where: eq(schema.messages.chatId, chatId),
      orderBy: [asc(schema.messages.createdAt)],
    });
  }

  static async subscribeToChat(
    chatId: string,
    userId: string,
    ws: ElysiaWS<{ currentUser: { id: string } }>,
  ) {
    await this.assertChatMembership(chatId, userId);

    const connections = this.chatConnections.get(chatId) ?? new Map();
    connections.set(ws.id, ws);
    this.chatConnections.set(chatId, connections);
  }

  static unsubscribeFromChat(chatId: string, socketId: string) {
    const connections = this.chatConnections.get(chatId);

    if (!connections) {
      return;
    }

    connections.delete(socketId);

    if (connections.size === 0) {
      this.chatConnections.delete(chatId);
    }
  }

  private static async assertChatMembership(chatId: string, userId: string) {
    const membership = await db.query.chatMembers.findFirst({
      where: and(
        eq(schema.chatMembers.chatId, chatId),
        eq(schema.chatMembers.userId, userId),
      ),
    });

    if (!membership) {
      throw new MessageError("Chat not found", 404);
    }
  }

  private static broadcastMessage(
    chatId: string,
    message: Awaited<ReturnType<typeof db.query.messages.findFirst>> extends infer _
      ? {
          id: string;
          chatId: string;
          senderId: string;
          content: string;
          createdAt: Date;
          updatedAt: Date;
        }
      : never,
  ) {
    const connections = this.chatConnections.get(chatId);

    if (!connections) {
      return;
    }

    for (const ws of connections.values()) {
      ws.send({
        type: "message:new",
        payload: message,
      });
    }
  }
}
