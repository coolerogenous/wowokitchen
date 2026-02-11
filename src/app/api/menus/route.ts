import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";

/**
 * GET /api/menus - 获取当前用户的所有菜单
 */
export async function GET(req: NextRequest) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
        }

        const menus = await prisma.menu.findMany({
            where: { userId },
            include: {
                dishes: {
                    include: {
                        dish: {
                            include: {
                                ingredients: {
                                    include: { ingredient: true },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ success: true, data: menus });
    } catch (error) {
        console.error("获取菜单列表失败:", error);
        return NextResponse.json(
            { success: false, error: "获取菜单列表失败" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/menus - 创建菜单
 * body: { name, dishIds?: number[] }
 */
export async function POST(req: NextRequest) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
        }

        const body = await req.json();
        const { name, dishIds } = body;

        if (!name) {
            return NextResponse.json(
                { success: false, error: "菜单名称不能为空" },
                { status: 400 }
            );
        }

        // 验证菜品归属权
        if (dishIds && dishIds.length > 0) {
            const validDishes = await prisma.dish.count({
                where: { id: { in: dishIds }, userId },
            });
            if (validDishes !== dishIds.length) {
                return NextResponse.json(
                    { success: false, error: "部分菜品不存在或不属于当前用户" },
                    { status: 400 }
                );
            }
        }

        const menu = await prisma.menu.create({
            data: {
                name,
                userId,
                dishes: dishIds
                    ? {
                        create: dishIds.map((dishId: number) => ({ dishId })),
                    }
                    : undefined,
            },
            include: {
                dishes: {
                    include: {
                        dish: {
                            include: {
                                ingredients: {
                                    include: { ingredient: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json({ success: true, data: menu }, { status: 201 });
    } catch (error) {
        console.error("创建菜单失败:", error);
        return NextResponse.json(
            { success: false, error: "创建菜单失败" },
            { status: 500 }
        );
    }
}
