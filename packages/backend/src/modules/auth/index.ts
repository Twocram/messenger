import { Elysia } from "elysia";

import {
  authErrorModel,
  authResponseModel,
  authUserModel,
  loginBodyModel,
  logoutResponseModel,
  registerBodyModel,
} from "./model";
import { Auth, AuthError } from "./service";

const isProduction = process.env.NODE_ENV === "production";
const accessCookieName = "messenger_access_token";
const refreshCookieName = "messenger_refresh_token";
const accessCookieMaxAge = Number(
  process.env.JWT_ACCESS_TTL_SECONDS ?? "900",
);
const refreshCookieMaxAge = Number(
  process.env.JWT_REFRESH_TTL_SECONDS ?? "604800",
);

function getClientMetadata(request: Request) {
  return {
    userAgent: request.headers.get("user-agent"),
    ipAddress:
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip"),
  };
}

function getCookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [key, ...value] = cookie.trim().split("=");

    if (key === name) {
      return decodeURIComponent(value.join("="));
    }
  }

  return null;
}

function serializeCookie(
  name: string,
  value: string,
  options?: {
    maxAge?: number;
    expires?: Date;
  },
) {
  const segments = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (isProduction) {
    segments.push("Secure");
  }

  if (typeof options?.maxAge === "number") {
    segments.push(`Max-Age=${options.maxAge}`);
  }

  if (options?.expires) {
    segments.push(`Expires=${options.expires.toUTCString()}`);
  }

  return segments.join("; ");
}

function setAuthCookies(
  headers: Headers,
  tokens: {
    accessToken: string;
    refreshToken: string;
  },
) {
  headers.append(
    "Set-Cookie",
    serializeCookie(accessCookieName, tokens.accessToken, {
      maxAge: accessCookieMaxAge,
    }),
  );
  headers.append(
    "Set-Cookie",
    serializeCookie(refreshCookieName, tokens.refreshToken, {
      maxAge: refreshCookieMaxAge,
    }),
  );
}

function clearAuthCookies(headers: Headers) {
  const expiredAt = new Date(0);

  headers.append(
    "Set-Cookie",
    serializeCookie(accessCookieName, "", {
      expires: expiredAt,
      maxAge: 0,
    }),
  );
  headers.append(
    "Set-Cookie",
    serializeCookie(refreshCookieName, "", {
      expires: expiredAt,
      maxAge: 0,
    }),
  );
}

function applyHeaders(
  set: { headers: Record<string, string | number | string[] | undefined> },
  headers: Headers,
) {
  const setCookies = [];

  for (const [key, value] of headers.entries()) {
    if (key.toLowerCase() === "set-cookie") {
      setCookies.push(value);
      continue;
    }

    set.headers[key] = value;
  }

  if (setCookies.length > 0) {
    set.headers["set-cookie"] = setCookies;
  }
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
        const result = await Auth.register(body, getClientMetadata(request));
        const headers = new Headers();

        setAuthCookies(headers, result);
        applyHeaders(set, headers);

        return { user: result.user };
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
        const result = await Auth.login(body, getClientMetadata(request));
        const headers = new Headers();

        setAuthCookies(headers, result);
        applyHeaders(set, headers);

        return { user: result.user };
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
    async ({ request, set }) => {
      const headers = new Headers();

      try {
        const refreshToken = getCookieValue(request, refreshCookieName);

        if (!refreshToken) {
          throw new AuthError("Refresh token is required", 401);
        }

        const result = await Auth.refresh(refreshToken, getClientMetadata(request));

        setAuthCookies(headers, result);
        applyHeaders(set, headers);

        return { user: result.user };
      } catch (error) {
        clearAuthCookies(headers);
        applyHeaders(set, headers);

        return handleAuthError(error, set);
      }
    },
    {
      response: {
        200: authResponseModel,
        401: authErrorModel,
        500: authErrorModel,
      },
    },
  )
  .post(
    "/logout",
    async ({ request, set }) => {
      const headers = new Headers();

      try {
        const refreshToken = getCookieValue(request, refreshCookieName);

        if (refreshToken) {
          await Auth.logout(refreshToken);
        }

        clearAuthCookies(headers);
        applyHeaders(set, headers);

        return { success: true };
      } catch (error) {
        clearAuthCookies(headers);
        applyHeaders(set, headers);

        return handleAuthError(error, set);
      }
    },
    {
      response: {
        200: logoutResponseModel,
        401: authErrorModel,
        500: authErrorModel,
      },
    },
  )
  .get(
    "/me",
    async ({ request, set }) => {
      try {
        const accessToken = getCookieValue(request, accessCookieName);

        if (!accessToken) {
          throw new AuthError("Access token is required", 401);
        }

        return await Auth.getCurrentUser(accessToken);
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
