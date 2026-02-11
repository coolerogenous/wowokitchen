import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import { calculateDishCost } from "@/lib/calculation/aggregator";

/**
 * GET /api/dishes - 获取当前用户的所有菜品
 */
export async function GET(req: NextRequest) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
        }

        const dishes = await prisma.dish.findMany({
            where: { userId },
            include: {
                ingredients: {
                    include: { ingredient: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({ success: true, data: dishes });
    } catch (error) {
        console.error("获取菜品列表失败:", error);
        return NextResponse.json(
            { success: false, error: "获取菜品列表失败" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/dishes - 创建菜品
 * body: { name, ingredients: [{ ingredientId, quantity, unit }] }
 */
export async function POST(req: NextRequest) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
        }

        const body = await req.json();
        const { name, ingredients } = body;

        if (!name) {
            return NextResponse.json(
                { success: false, error: "菜品名称不能为空" },
                { status: 400 }
            );
        }

        if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
            return NextResponse.json(
                { success: false, error: "菜品至少需要一种食材" },
                { status: 400 }
            );
        }

        // 验证所有食材都属于当前用户
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

        // 计算预估成本
        const costInputs = ingredients.map(
            (i: { ingredientId: number; quantity: number }) => {
                const ing = validIngredients.find((v) => v.id === i.ingredientId)!;
                return { quantity: i.quantity, unitPrice: ing.unitPrice };
            }
        );
        const estimatedCost = calculateDishCost(costInputs);

        // 创建菜品及其食材关联
        const dish = await prisma.dish.create({
            data: {
                name,
                estimatedCost,
                userId,
                ingredients: {
                    create: ingredients.map(
                        (i: { ingredientId: number; quantity: number; unit: string }) => ({
                            ingredientId: i.ingredientId,
                            quantity: i.quantity,
                            unit: i.unit,
                        })
                    ),
                },
            },
            include: {
                ingredients: {
                    include: { ingredient: true },
                },
            },
        });

        return NextResponse.json({ success: true, data: dish }, { status: 201 });
    } catch (error) {
        console.error("创建菜品失败:", error);
        return NextResponse.json(
            { success: false, error: "创建菜品失败" },
            { status: 500 }
        );
    }
}
