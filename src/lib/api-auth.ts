import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "./auth";

/**
 * API 路由鉴权辅助函数
 * 在需要认证的 API 路由中调用此函数
 * 返回 userId 或错误响应
 */
export function requireAuth(
    req: NextRequest
): { userId: number } | NextResponse {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
        return NextResponse.json(
            { success: false, error: "未登录，请先登录" },
            { status: 401 }
        );
    }
    return { userId };
}

/**
 * 包装需要认证的 API handler
 * 自动提取 userId 并注入到 handler 参数中
 */
export function withAuth<T extends unknown[]>(
    handler: (req: NextRequest, userId: number, ...args: T) => Promise<NextResponse>
) {
    return async (req: NextRequest, ...args: T) => {
        const result = requireAuth(req);
        if (result instanceof NextResponse) {
            return result;
        }
        return handler(req, result.userId, ...args);
    };
}
