import { Elysia, t } from "elysia";

import { authMiddleware } from "../auth/middleware";
import { AuthError } from "../auth/service";
import {
  editMessageBodyModel,
  messageErrorModel,
  messageModel,
  messageSocketEventModel,
  sendMessageBodyModel,
} from "./model";
import { MessageError, MessageService } from "./service";

function handleMessageError(
  error: unknown,
  set: { status?: number | string },
) {
  if (error instanceof MessageError || error instanceof AuthError) {
    set.status = error.status;
    return { error: error.message };
  }

  set.status = 500;
  return { error: error instanceof Error ? error.message : "Unknown error" };
}

export const messageModule = new Elysia({ prefix: "/chats/:chatId/messages" })
  .use(authMiddleware)
  .ws("/ws", {
    response: messageSocketEventModel,
    async open(ws) {
      await MessageService.subscribeToChat(
        ws.data.params.chatId,
        ws.data.currentUser.id,
        ws,
      );
    },
    close(ws) {
      MessageService.unsubscribeFromChat(ws.data.params.chatId, ws.id);
    },
  })
  .get(
    "/",
    async ({ currentUser, params, set }) => {
      try {
        return await MessageService.getChatMessages(
          params.chatId,
          currentUser.id,
        );
      } catch (error) {
        return handleMessageError(error, set);
      }
    },
    {
      response: {
        200: t.Array(messageModel),
        401: messageErrorModel,
        404: messageErrorModel,
        500: messageErrorModel,
      },
    },
  )
  .post(
    "/",
    async ({ currentUser, params, body, set }) => {
      try {
        return await MessageService.sendMessage(
          params.chatId,
          currentUser.id,
          body,
        );
      } catch (error) {
        return handleMessageError(error, set);
      }
    },
    {
      body: sendMessageBodyModel,
      response: {
        200: messageModel,
        400: messageErrorModel,
        401: messageErrorModel,
        404: messageErrorModel,
        500: messageErrorModel,
      },
    },
  )
  .patch(
    "/:messageId",
    async ({ currentUser, params, body, set }) => {
      try {
        return await MessageService.editMessage(
          params.messageId,
          currentUser.id,
          body,
        );
      } catch (error) {
        return handleMessageError(error, set);
      }
    },
    {
      body: editMessageBodyModel,
      response: {
        200: messageModel,
        400: messageErrorModel,
        401: messageErrorModel,
        403: messageErrorModel,
        404: messageErrorModel,
        500: messageErrorModel,
      },
    },
  );
