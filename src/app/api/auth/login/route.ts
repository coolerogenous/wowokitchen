import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";

/**
 * POST /api/auth/login
 * 用户登录
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { username, password } = body;

        // 参数校验
        if (!username || !password) {
            return NextResponse.json(
                { success: false, error: "用户名和密码不能为空" },
                { status: 400 }
            );
        }

        // 查找用户
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, error: "用户名或密码错误" },
                { status: 401 }
            );
        }

        // 验证密码
        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            return NextResponse.json(
                { success: false, error: "用户名或密码错误" },
                { status: 401 }
            );
        }

        // 签发 token
        const token = signToken(user.id);

        return NextResponse.json({
            success: true,
            data: {
                token,
                user: { id: user.id, username: user.username },
            },
        });
    } catch (error) {
        console.error("登录失败:", error);
        return NextResponse.json(
            { success: false, error: "登录失败，请稍后重试" },
            { status: 500 }
        );
    }
}
