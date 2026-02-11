import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { calculateDishCost } from "@/lib/calculation/aggregator";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/dishes/[id] - 获取菜品详情
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
        }
        const { id } = await params;
        const dishId = Number(id);

        const dish = await prisma.dish.findFirst({
            where: { id: dishId, userId },
            include: {
                ingredients: {
                    include: { ingredient: true },
                },
            },
        });

        if (!dish) {
            return NextResponse.json(
                { success: false, error: "菜品不存在" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: dish });
    } catch (error) {
        console.error("获取菜品详情失败:", error);
        return NextResponse.json(
            { success: false, error: "获取菜品详情失败" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/dishes/[id] - 更新菜品
 * body: { name?, ingredients?: [{ ingredientId, quantity, unit }] }
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
        }
        const { id } = await params;
        const dishId = Number(id);
        const body = await req.json();
        const { name, ingredients } = body;

        // 验证归属权
        const existing = await prisma.dish.findFirst({
            where: { id: dishId, userId },
        });
        if (!existing) {
            return NextResponse.json(
                { success: false, error: "菜品不存在" },
                { status: 404 }
            );
        }

        let estimatedCost = existing.estimatedCost;

        // 如果更新了食材列表，重新计算成本
        if (ingredients && Array.isArray(ingredients)) {
            const ingredientIds = ingredients.map(
                (i: { ingredientId: number }) => i.ingredientId
            );
            const validIngredients = await prisma.ingredient.findMany({
                where: { id: { in: ingredientIds }, userId },
            });

            if (validIngredients.length !== ingredientIds.length) {
                return NextResponse.json(
                    { success: false, error: "部分食材不存在或不属于当前用户" },
                    { status: 400 }
                );
            }

            const costInputs = ingredients.map(
                (i: { ingredientId: number; quantity: number }) => {
                    const ing = validIngredients.find((v) => v.id === i.ingredientId)!;
                    return { quantity: i.quantity, unitPrice: ing.unitPrice };
                }
            );
            estimatedCost = calculateDishCost(costInputs);

            // 删除旧的食材关联，创建新的
            await prisma.dishIngredient.deleteMany({ where: { dishId } });
            await prisma.dishIngredient.createMany({
                data: ingredients.map(
                    (i: { ingredientId: number; quantity: number; unit: string }) => ({
                        dishId,
                        ingredientId: i.ingredientId,
                        quantity: i.quantity,
                        unit: i.unit,
                    })
                ),
            });
        }

        const updated = await prisma.dish.update({
            where: { id: dishId },
            data: {
                ...(name && { name }),
                estimatedCost,
            },
            include: {
                ingredients: {
                    include: { ingredient: true },
                },
            },
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("更新菜品失败:", error);
        return NextResponse.json(
            { success: false, error: "更新菜品失败" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/dishes/[id] - 删除菜品
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
        }
        const { id } = await params;
        const dishId = Number(id);

        const existing = await prisma.dish.findFirst({
            where: { id: dishId, userId },
        });
        if (!existing) {
            return NextResponse.json(
                { success: false, error: "菜品不存在" },
                { status: 404 }
            );
        }

        await prisma.dish.delete({ where: { id: dishId } });

        return NextResponse.json({ success: true, data: { id: dishId } });
    } catch (error) {
        console.error("删除菜品失败:", error);
        return NextResponse.json(
            { success: false, error: "删除菜品失败" },
            { status: 500 }
        );
    }
}
