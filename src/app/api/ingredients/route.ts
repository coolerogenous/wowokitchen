import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";

/**
 * GET /api/ingredients - 获取当前用户的所有食材
 */
export async function GET(req: NextRequest) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json(
                { success: false, error: "未登录" },
                { status: 401 }
            );
        }

        const ingredients = await prisma.ingredient.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({ success: true, data: ingredients });
    } catch (error) {
        console.error("获取食材列表失败:", error);
        return NextResponse.json(
            { success: false, error: "获取食材列表失败" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/ingredients - 创建食材
 */
export async function POST(req: NextRequest) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json(
                { success: false, error: "未登录" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { name, unitPrice, spec } = body;

        if (!name || unitPrice === undefined || !spec) {
            return NextResponse.json(
                { success: false, error: "名称、单价和规格不能为空" },
                { status: 400 }
            );
        }

        if (typeof unitPrice !== "number" || unitPrice < 0) {
            return NextResponse.json(
                { success: false, error: "单价必须为非负数字" },
                { status: 400 }
            );
        }

        // 检查同名食材
        const existing = await prisma.ingredient.findUnique({
            where: { name_userId: { name, userId } },
        });
        if (existing) {
            return NextResponse.json(
                { success: false, error: `食材"${name}"已存在` },
                { status: 409 }
            );
        }

        const ingredient = await prisma.ingredient.create({
            data: { name, unitPrice, spec, userId },
        });

        return NextResponse.json({ success: true, data: ingredient }, { status: 201 });
    } catch (error) {
        console.error("创建食材失败:", error);
        return NextResponse.json(
            { success: false, error: "创建食材失败" },
            { status: 500 }
        );
    }
}
