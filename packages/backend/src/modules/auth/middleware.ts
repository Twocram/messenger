import { Elysia } from "elysia";

import { Auth, AuthError } from "./service";

const accessCookieName = "messenger_access_token";

function getCookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) return null;

  for (const cookie of cookieHeader.split(";")) {
    const [key, ...value] = cookie.trim().split("=");

    if (key === name) return decodeURIComponent(value.join("="));
  }

  return null;
}

export const authMiddleware = new Elysia({ name: "authMiddleware" }).derive(
  { as: "scoped" },
  async ({ request, set }) => {
    const accessToken = getCookieValue(request, accessCookieName);

    if (!accessToken) {
      set.status = 401;
      throw new AuthError("Access token is required", 401);
    }

    const user = await Auth.getCurrentUser(accessToken);

    return { currentUser: user };
  },
);
