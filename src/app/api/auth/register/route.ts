import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";

/**
 * POST /api/auth/register
 * 注册新用户
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

        if (username.length < 2 || username.length > 20) {
            return NextResponse.json(
                { success: false, error: "用户名长度需在 2-20 个字符之间" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, error: "密码长度至少 6 个字符" },
                { status: 400 }
            );
        }

        // 检查用户名是否已存在
        const existingUser = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUser) {
            return NextResponse.json(
                { success: false, error: "用户名已被占用" },
                { status: 409 }
            );
        }

        // 创建用户
        const passwordHash = await hashPassword(password);
        const user = await prisma.user.create({
            data: { username, passwordHash },
        });

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
        console.error("注册失败:", error);
        return NextResponse.json(
            { success: false, error: "注册失败，请稍后重试" },
            { status: 500 }
        );
    }
}
