import { Elysia, t } from "elysia";

import { authMiddleware } from "../auth/middleware";
import { AuthError } from "../auth/service";
import { chatErrorModel, chatModel, createChatBodyModel } from "./model";
import { ChatError, ChatService } from "./service";

function handleChatError(error: unknown, set: { status?: number | string }) {
  if (error instanceof ChatError || error instanceof AuthError) {
    set.status = error.status;
    return { error: error.message };
  }

  set.status = 500;
  return { error: error instanceof Error ? error.message : "Unknown error" };
}

export const chatModule = new Elysia({ prefix: "/chats" })
  .use(authMiddleware)
  .get(
    "/",
    async ({ currentUser, set }) => {
      try {
        return await ChatService.getUserChats(currentUser.id);
      } catch (error) {
        return handleChatError(error, set);
      }
    },
    {
      response: {
        200: t.Array(chatModel),
        401: chatErrorModel,
        500: chatErrorModel,
      },
    },
  )
  .post(
    "/",
    async ({ currentUser, body, set }) => {
      try {
        return await ChatService.createChat(currentUser.id, body);
      } catch (error) {
        return handleChatError(error, set);
      }
    },
    {
      body: createChatBodyModel,
      response: {
        200: chatModel,
        400: chatErrorModel,
        401: chatErrorModel,
        404: chatErrorModel,
        500: chatErrorModel,
      },
    },
  )
  .get(
    "/:chatId",
    async ({ currentUser, params, set }) => {
      try {
        return await ChatService.getChatById(params.chatId, currentUser.id);
      } catch (error) {
        return handleChatError(error, set);
      }
    },
    {
      response: {
        200: chatModel,
        401: chatErrorModel,
        404: chatErrorModel,
        500: chatErrorModel,
      },
    },
  );
