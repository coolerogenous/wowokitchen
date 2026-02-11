import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { generateShoppingList } from "@/lib/calculation/aggregator";
import { DishWithIngredients } from "@/types";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/menus/[id] - 获取菜单详情
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
        }
        const { id } = await params;
        const menuId = Number(id);

        const menu = await prisma.menu.findFirst({
            where: { id: menuId, userId },
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

        if (!menu) {
            return NextResponse.json(
                { success: false, error: "菜单不存在" },
                { status: 404 }
            );
        }

        // 生成采购清单
        const dishes: DishWithIngredients[] = menu.dishes.map((md) => md.dish);
        const shoppingList = generateShoppingList(dishes);

        return NextResponse.json({
            success: true,
            data: { ...menu, shoppingList },
        });
    } catch (error) {
        console.error("获取菜单详情失败:", error);
        return NextResponse.json(
            { success: false, error: "获取菜单详情失败" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/menus/[id] - 更新菜单
 * body: { name?, dishIds?: number[] }
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
        }
        const { id } = await params;
        const menuId = Number(id);
        const body = await req.json();
        const { name, dishIds } = body;

        const existing = await prisma.menu.findFirst({
            where: { id: menuId, userId },
        });
        if (!existing) {
            return NextResponse.json(
                { success: false, error: "菜单不存在" },
                { status: 404 }
            );
        }

        // 如果更新菜品列表
        if (dishIds && Array.isArray(dishIds)) {
            const validDishes = await prisma.dish.count({
                where: { id: { in: dishIds }, userId },
            });
            if (validDishes !== dishIds.length) {
                return NextResponse.json(
                    { success: false, error: "部分菜品不存在或不属于当前用户" },
                    { status: 400 }
                );
            }

            // 删除旧的关联，创建新的
            await prisma.menuDish.deleteMany({ where: { menuId } });
            await prisma.menuDish.createMany({
                data: dishIds.map((dishId: number) => ({ menuId, dishId })),
            });
        }

        const updated = await prisma.menu.update({
            where: { id: menuId },
            data: { ...(name && { name }) },
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

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("更新菜单失败:", error);
        return NextResponse.json(
            { success: false, error: "更新菜单失败" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/menus/[id] - 删除菜单
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
        }
        const { id } = await params;
        const menuId = Number(id);

        const existing = await prisma.menu.findFirst({
            where: { id: menuId, userId },
        });
        if (!existing) {
            return NextResponse.json(
                { success: false, error: "菜单不存在" },
                { status: 404 }
            );
        }

        await prisma.menu.delete({ where: { id: menuId } });

        return NextResponse.json({ success: true, data: { id: menuId } });
    } catch (error) {
        console.error("删除菜单失败:", error);
        return NextResponse.json(
            { success: false, error: "删除菜单失败" },
            { status: 500 }
        );
    }
}
