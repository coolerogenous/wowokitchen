import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/ingredients/[id] - 获取单个食材
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
        }
        const { id } = await params;
        const ingredientId = Number(id);

        const ingredient = await prisma.ingredient.findFirst({
            where: { id: ingredientId, userId },
        });

        if (!ingredient) {
            return NextResponse.json(
                { success: false, error: "食材不存在" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: ingredient });
    } catch (error) {
        console.error("获取食材详情失败:", error);
        return NextResponse.json(
            { success: false, error: "获取食材详情失败" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/ingredients/[id] - 更新食材
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
        }
        const { id } = await params;
        const ingredientId = Number(id);
        const body = await req.json();
        const { name, unitPrice, spec } = body;

        // 验证归属权
        const existing = await prisma.ingredient.findFirst({
            where: { id: ingredientId, userId },
        });
        if (!existing) {
            return NextResponse.json(
                { success: false, error: "食材不存在" },
                { status: 404 }
            );
        }

        // 如果修改了名称，检查是否与其他食材重名
        if (name && name !== existing.name) {
            const duplicate = await prisma.ingredient.findUnique({
                where: { name_userId: { name, userId } },
            });
            if (duplicate) {
                return NextResponse.json(
                    { success: false, error: `食材"${name}"已存在` },
                    { status: 409 }
                );
            }
        }

        const updated = await prisma.ingredient.update({
            where: { id: ingredientId },
            data: {
                ...(name && { name }),
                ...(unitPrice !== undefined && { unitPrice }),
                ...(spec && { spec }),
            },
        });

        // 如果修改了单价，需要重算关联菜品的成本
        if (unitPrice !== undefined && unitPrice !== existing.unitPrice) {
            await recalculateDishCosts(ingredientId);
        }

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("更新食材失败:", error);
        return NextResponse.json(
            { success: false, error: "更新食材失败" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/ingredients/[id] - 删除食材
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
        }
        const { id } = await params;
        const ingredientId = Number(id);

        // 验证归属权
        const existing = await prisma.ingredient.findFirst({
            where: { id: ingredientId, userId },
        });
        if (!existing) {
            return NextResponse.json(
                { success: false, error: "食材不存在" },
                { status: 404 }
            );
        }

        // 检查是否被菜品引用
        const usedInDishes = await prisma.dishIngredient.count({
            where: { ingredientId },
        });
        if (usedInDishes > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: `该食材被 ${usedInDishes} 道菜品使用中，请先移除关联后再删除`,
                },
                { status: 409 }
            );
        }

        await prisma.ingredient.delete({ where: { id: ingredientId } });

        return NextResponse.json({ success: true, data: { id: ingredientId } });
    } catch (error) {
        console.error("删除食材失败:", error);
        return NextResponse.json(
            { success: false, error: "删除食材失败" },
            { status: 500 }
        );
    }
}

/**
 * 重算使用了某食材的所有菜品成本
 */
async function recalculateDishCosts(ingredientId: number) {
    const dishIngredients = await prisma.dishIngredient.findMany({
        where: { ingredientId },
        select: { dishId: true },
    });

    const dishIds = [...new Set(dishIngredients.map((di) => di.dishId))];

    for (const dishId of dishIds) {
        const allIngredients = await prisma.dishIngredient.findMany({
            where: { dishId },
            include: { ingredient: true },
        });

        const newCost = allIngredients.reduce(
            (sum, di) => sum + di.quantity * di.ingredient.unitPrice,
            0
        );

        await prisma.dish.update({
            where: { id: dishId },
            data: { estimatedCost: Math.round(newCost * 100) / 100 },
        });
    }
}
