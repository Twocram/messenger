import { Elysia } from "elysia";

import { authMiddleware } from "../auth/middleware";
import { AuthError } from "../auth/service";
import { userErrorModel, userLookupModel } from "./model";
import { UserError, UserService } from "./service";

function handleUserError(error: unknown, set: { status?: number | string }) {
  if (error instanceof UserError || error instanceof AuthError) {
    set.status = error.status;
    return { error: error.message };
  }

  set.status = 500;
  return { error: error instanceof Error ? error.message : "Unknown error" };
}

export const userModule = new Elysia({ prefix: "/users" })
  .use(authMiddleware)
  .get(
    "/by-username/:username",
    async ({ params, set }) => {
      try {
        return await UserService.getUserByUsername(params.username);
      } catch (error) {
        return handleUserError(error, set);
      }
    },
    {
      response: {
        200: userLookupModel,
        400: userErrorModel,
        401: userErrorModel,
        404: userErrorModel,
        500: userErrorModel,
      },
    },
  );
