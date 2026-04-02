import { t, type Static } from "elysia";

export const userLookupModel = t.Object({
  id: t.String({ format: "uuid" }),
  username: t.String(),
  avatarUrl: t.Nullable(t.String()),
});

export const userErrorModel = t.Object({
  error: t.String(),
});

export type UserLookupModel = Static<typeof userLookupModel>;
