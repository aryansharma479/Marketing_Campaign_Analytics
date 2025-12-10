import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import type { User } from "@shared/schema";

const JWT_SECRET = process.env.SESSION_SECRET || "campaign-analytics-secret-key-change-in-production";
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

export interface TokenPayload {
  userId: string;
  username: string;
  role: string;
  type: "access" | "refresh";
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

export function generateAccessToken(user: User): string {
  const payload: Omit<TokenPayload, "type"> & { type: "access" } = {
    userId: user.id,
    username: user.username,
    role: user.role,
    type: "access",
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken(user: User): { token: string; expiresAt: Date } {
  const payload: Omit<TokenPayload, "type"> & { type: "refresh"; jti: string } = {
    userId: user.id,
    username: user.username,
    role: user.role,
    type: "refresh",
    jti: randomUUID(),
  };
  
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  return { token, expiresAt };
}

export function verifyToken(token: string): DecodedToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch {
    return null;
  }
}

export function getTokenExpiry(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as DecodedToken;
    if (decoded?.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch {
    return null;
  }
}
