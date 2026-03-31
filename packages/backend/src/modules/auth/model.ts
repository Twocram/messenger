import { t, type Static } from "elysia";

export const authUserModel = t.Object({
  id: t.String({ format: "uuid" }),
  username: t.String({ minLength: 1 }),
  email: t.String({ format: "email" }),
  avatarUrl: t.Nullable(t.String()),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export const authTokensModel = t.Object({
  accessToken: t.String(),
  refreshToken: t.String(),
});

export const authResponseModel = t.Object({
  user: authUserModel,
  accessToken: t.String(),
  refreshToken: t.String(),
});

export const authErrorModel = t.Object({
  error: t.String(),
});

export const registerBodyModel = t.Object({
  username: t.String({ minLength: 1 }),
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 8 }),
});

export const loginBodyModel = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 1 }),
});

export const refreshTokenBodyModel = t.Object({
  refreshToken: t.String({ minLength: 1 }),
});

export const logoutResponseModel = t.Object({
  success: t.Boolean(),
});

export type AuthUserModel = Static<typeof authUserModel>;
export type AuthResponseModel = Static<typeof authResponseModel>;
export type RegisterBodyModel = Static<typeof registerBodyModel>;
export type LoginBodyModel = Static<typeof loginBodyModel>;
export type RefreshTokenBodyModel = Static<typeof refreshTokenBodyModel>;
