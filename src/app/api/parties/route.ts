import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import crypto from "crypto";

/**
 * GET /api/parties - 获取当前用户创建的所有饭局
 */
export async function GET(req: NextRequest) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
        }

        const parties = await prisma.party.findMany({
            where: { hostId: userId },
            include: {
                dishes: true,
                guests: { select: { id: true, nickname: true } },
                _count: { select: { dishes: true, guests: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ success: true, data: parties });
    } catch (error) {
        console.error("获取饭局列表失败:", error);
        return NextResponse.json(
            { success: false, error: "获取饭局列表失败" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/parties - 创建饭局
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
                { success: false, error: "饭局名称不能为空" },
                { status: 400 }
            );
        }

        const shareCode = crypto.randomBytes(4).toString("hex").toUpperCase();

        let dishSnapshots: {
            dishName: string;
            ingredientsSnapshot: string;
            costSnapshot: number;
        }[] = [];

        if (dishIds && dishIds.length > 0) {
            const dishes = await prisma.dish.findMany({
                where: { id: { in: dishIds }, userId },
                include: {
                    ingredients: { include: { ingredient: true } },
                },
            });

            dishSnapshots = dishes.map((dish) => ({
                dishName: dish.name,
                ingredientsSnapshot: JSON.stringify(
                    dish.ingredients.map((di) => ({
                        name: di.ingredient.name,
                        quantity: di.quantity,
                        unit: di.unit,
                        unitPrice: di.ingredient.unitPrice,
                    }))
                ),
                costSnapshot: dish.estimatedCost,
            }));
        }

        const party = await prisma.party.create({
            data: {
                name,
                shareCode,
                hostId: userId,
                dishes: { create: dishSnapshots },
            },
            include: { dishes: true, guests: true },
        });

        return NextResponse.json({ success: true, data: party }, { status: 201 });
    } catch (error) {
        console.error("创建饭局失败:", error);
        return NextResponse.json(
            { success: false, error: "创建饭局失败" },
            { status: 500 }
        );
    }
}
