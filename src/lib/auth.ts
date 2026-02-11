import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = "7d"; // 7 天有效期

/**
 * 密码加密
 */
export async function hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * 密码验证
 */
export async function verifyPassword(
    plainPassword: string,
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * 生成 JWT Token
 */
export function signToken(userId: number): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * 验证并解析 JWT Token
 */
export function verifyToken(token: string): { userId: number } | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        return decoded;
    } catch {
        return null;
    }
}

/**
 * 从请求中提取用户 ID
 * Authorization: Bearer <token>
 */
export function getUserIdFromRequest(req: NextRequest): number | null {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }
    const token = authHeader.slice(7);
    const decoded = verifyToken(token);
    return decoded?.userId ?? null;
}
