import { eq } from "drizzle-orm";

import { db, schema } from "../../db";

export class UserError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export abstract class UserService {
  static async getUserByUsername(username: string) {
    const normalizedUsername = username.trim();

    if (!normalizedUsername) {
      throw new UserError("Username is required", 400);
    }

    const user = await db.query.users.findFirst({
      where: eq(schema.users.username, normalizedUsername),
      columns: {
        id: true,
        username: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      throw new UserError("User not found", 404);
    }

    return user;
  }
}
