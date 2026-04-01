import {
  and,
  desc,
  eq,
  gt,
  isNull,
  or,
} from "drizzle-orm";

import { db, schema } from "../../db";
import type {
  LoginBodyModel,
  RegisterBodyModel,
} from "./model";

const accessTokenSecret =
  process.env.JWT_ACCESS_SECRET ?? "dev-access-secret-change-me";
const refreshTokenSecret =
  process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-change-me";
const accessTokenTtlSeconds = Number(
  process.env.JWT_ACCESS_TTL_SECONDS ?? "900",
);
const refreshTokenTtlSeconds = Number(
  process.env.JWT_REFRESH_TTL_SECONDS ?? "604800",
);

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

interface JwtPayload {
  sub: string;
  type: "access" | "refresh";
  iat: number;
  exp: number;
  jti?: string;
}

export abstract class Auth {
  private static encoder = new TextEncoder();
  private static decoder = new TextDecoder();

  private static sanitizeUser(user: typeof schema.users.$inferSelect) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private static base64UrlEncode(input: string | Uint8Array) {
    const bytes =
      typeof input === "string" ? this.encoder.encode(input) : input;

    return Buffer.from(bytes)
      .toString("base64")
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replace(/=+$/u, "");
  }

  private static base64UrlDecode(input: string) {
    const normalized = input.replaceAll("-", "+").replaceAll("_", "/");
    const padding = (4 - (normalized.length % 4)) % 4;

    return Buffer.from(`${normalized}${"=".repeat(padding)}`, "base64");
  }

  private static async importHmacKey(secret: string) {
    return crypto.subtle.importKey(
      "raw",
      this.encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );
  }

  private static async signHmacSha256(input: string, secret: string) {
    const key = await this.importHmacKey(secret);
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      this.encoder.encode(input),
    );

    return this.base64UrlEncode(new Uint8Array(signature));
  }

  private static async signJwt(
    payload: Omit<JwtPayload, "iat" | "exp">,
    secret: string,
    expiresInSeconds: number,
  ) {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: JwtPayload = {
      ...payload,
      iat: now,
      exp: now + expiresInSeconds,
    };

    const encodedHeader = this.base64UrlEncode(
      JSON.stringify({ alg: "HS256", typ: "JWT" }),
    );
    const encodedPayload = this.base64UrlEncode(JSON.stringify(fullPayload));
    const signature = await this.signHmacSha256(
      `${encodedHeader}.${encodedPayload}`,
      secret,
    );

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private static async verifyJwt(token: string, secret: string) {
    const [encodedHeader, encodedPayload, signature] = token.split(".");

    if (!encodedHeader || !encodedPayload || !signature) {
      throw new Error("Invalid token format");
    }

    const expectedSignature = await this.signHmacSha256(
      `${encodedHeader}.${encodedPayload}`,
      secret,
    );

    if (signature !== expectedSignature) {
      throw new Error("Invalid token signature");
    }

    const payload = JSON.parse(
      this.decoder.decode(this.base64UrlDecode(encodedPayload)),
    ) as JwtPayload;

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new Error("Token expired");
    }

    return payload;
  }

  private static async hashRefreshToken(token: string) {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      this.encoder.encode(token),
    );

    return Buffer.from(digest).toString("hex");
  }

  private static buildExpiryDate(ttlSeconds: number) {
    return new Date(Date.now() + ttlSeconds * 1000);
  }

  private static async createTokenPair(
    userId: string,
    metadata?: { userAgent?: string | null; ipAddress?: string | null },
  ) {
    const sessionId = crypto.randomUUID();
    const accessToken = await this.signJwt(
      { sub: userId, type: "access" },
      accessTokenSecret,
      accessTokenTtlSeconds,
    );
    const refreshToken = await this.signJwt(
      { sub: userId, type: "refresh", jti: sessionId },
      refreshTokenSecret,
      refreshTokenTtlSeconds,
    );

    await db.insert(schema.authSessions).values({
      id: sessionId,
      userId,
      refreshTokenHash: await this.hashRefreshToken(refreshToken),
      userAgent: metadata?.userAgent ?? null,
      ipAddress: metadata?.ipAddress ?? null,
      expiresAt: this.buildExpiryDate(refreshTokenTtlSeconds),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private static async revokeSessionById(sessionId: string) {
    await db
      .update(schema.authSessions)
      .set({
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.authSessions.id, sessionId));
  }

  private static async getUserById(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user) {
      throw new AuthError("User not found", 404);
    }

    return user;
  }

  static async register(
    input: RegisterBodyModel,
    metadata?: { userAgent?: string | null; ipAddress?: string | null },
  ) {
    const username = input.username.trim();
    const email = input.email.trim().toLowerCase();

    if (!username || !email || !input.password) {
      throw new AuthError("Username, email, and password are required", 400);
    }

    const existingUser = await db.query.users.findFirst({
      where: or(
        eq(schema.users.email, email),
        eq(schema.users.username, username),
      ),
    });

    if (existingUser) {
      throw new AuthError(
        "User with this email or username already exists",
        409,
      );
    }

    const passwordHash = await Bun.password.hash(input.password);
    const insertedUsers = await db
      .insert(schema.users)
      .values({
        username,
        email,
        passwordHash,
      })
      .returning();

    const createdUser = insertedUsers[0];

    if (!createdUser) {
      throw new Error("Failed to create user");
    }

    return {
      user: this.sanitizeUser(createdUser),
      ...(await this.createTokenPair(createdUser.id, metadata)),
    };
  }

  static async login(
    input: LoginBodyModel,
    metadata?: { userAgent?: string | null; ipAddress?: string | null },
  ) {
    const email = input.email.trim().toLowerCase();

    if (!email || !input.password) {
      throw new AuthError("Email and password are required", 400);
    }

    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    if (!user) {
      throw new AuthError("Invalid email or password", 401);
    }

    const passwordMatches = await Bun.password.verify(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new AuthError("Invalid email or password", 401);
    }

    return {
      user: this.sanitizeUser(user),
      ...(await this.createTokenPair(user.id, metadata)),
    };
  }

  static async refresh(
    refreshToken: string,
    metadata?: { userAgent?: string | null; ipAddress?: string | null },
  ) {
    if (!refreshToken) {
      throw new AuthError("Refresh token is required", 400);
    }

    const payload = await this.verifyJwt(refreshToken, refreshTokenSecret);

    if (payload.type !== "refresh" || !payload.jti) {
      throw new AuthError("Invalid refresh token", 401);
    }

    const session = await db.query.authSessions.findFirst({
      where: and(
        eq(schema.authSessions.id, payload.jti),
        eq(schema.authSessions.userId, payload.sub),
        isNull(schema.authSessions.revokedAt),
        gt(schema.authSessions.expiresAt, new Date()),
      ),
      orderBy: [desc(schema.authSessions.createdAt)],
    });

    if (!session) {
      throw new AuthError("Refresh session is invalid or expired", 401);
    }

    const tokenHash = await this.hashRefreshToken(refreshToken);

    if (session.refreshTokenHash !== tokenHash) {
      await this.revokeSessionById(session.id);
      throw new AuthError("Refresh token mismatch", 401);
    }

    await this.revokeSessionById(session.id);

    const user = await this.getUserById(payload.sub);

    return {
      user: this.sanitizeUser(user),
      ...(await this.createTokenPair(user.id, metadata)),
    };
  }

  static async logout(refreshToken: string) {
    if (!refreshToken) {
      throw new AuthError("Refresh token is required", 400);
    }

    const payload = await this.verifyJwt(refreshToken, refreshTokenSecret);

    if (payload.type !== "refresh" || !payload.jti) {
      throw new AuthError("Invalid refresh token", 401);
    }

    await this.revokeSessionById(payload.jti);

    return {
      success: true,
    };
  }

  static async getCurrentUser(accessToken: string) {
    if (!accessToken) {
      throw new AuthError("Access token is required", 401);
    }

    const payload = await this.verifyJwt(accessToken, accessTokenSecret);

    if (payload.type !== "access") {
      throw new AuthError("Invalid access token", 401);
    }

    return this.sanitizeUser(await this.getUserById(payload.sub));
  }
}
