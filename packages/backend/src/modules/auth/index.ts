import { Elysia } from "elysia";

import {
  authErrorModel,
  authResponseModel,
  authUserModel,
  loginBodyModel,
  logoutResponseModel,
  refreshTokenBodyModel,
  registerBodyModel,
} from "./model";
import { Auth, AuthError } from "./service";

function getClientMetadata(request: Request) {
  return {
    userAgent: request.headers.get("user-agent"),
    ipAddress:
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip"),
  };
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new AuthError("Authorization bearer token is required", 401);
  }

  return authorization.slice("Bearer ".length);
}

function handleAuthError(error: unknown, set: { status?: number | string }) {
  if (error instanceof AuthError) {
    set.status = error.status;

    return {
      error: error.message,
    };
  }

  set.status = 500;

  return {
    error: error instanceof Error ? error.message : "Unknown auth error",
  };
}

export const authModule = new Elysia({ prefix: "/auth" })
  .post(
    "/register",
    async ({ body, request, set }) => {
      try {
        return await Auth.register(body, getClientMetadata(request));
      } catch (error) {
        return handleAuthError(error, set);
      }
    },
    {
      body: registerBodyModel,
      response: {
        200: authResponseModel,
        400: authErrorModel,
        409: authErrorModel,
        500: authErrorModel,
      },
    },
  )
  .post(
    "/login",
    async ({ body, request, set }) => {
      try {
        return await Auth.login(body, getClientMetadata(request));
      } catch (error) {
        return handleAuthError(error, set);
      }
    },
    {
      body: loginBodyModel,
      response: {
        200: authResponseModel,
        400: authErrorModel,
        401: authErrorModel,
        500: authErrorModel,
      },
    },
  )
  .post(
    "/refresh",
    async ({ body, request, set }) => {
      try {
        return await Auth.refresh(body, getClientMetadata(request));
      } catch (error) {
        return handleAuthError(error, set);
      }
    },
    {
      body: refreshTokenBodyModel,
      response: {
        200: authResponseModel,
        400: authErrorModel,
        401: authErrorModel,
        500: authErrorModel,
      },
    },
  )
  .post(
    "/logout",
    async ({ body, set }) => {
      try {
        return await Auth.logout(body);
      } catch (error) {
        return handleAuthError(error, set);
      }
    },
    {
      body: refreshTokenBodyModel,
      response: {
        200: logoutResponseModel,
        400: authErrorModel,
        401: authErrorModel,
        500: authErrorModel,
      },
    },
  )
  .get(
    "/me",
    async ({ request, set }) => {
      try {
        return await Auth.getCurrentUser(getBearerToken(request));
      } catch (error) {
        return handleAuthError(error, set);
      }
    },
    {
      response: {
        200: authUserModel,
        401: authErrorModel,
        404: authErrorModel,
        500: authErrorModel,
      },
    },
  );
