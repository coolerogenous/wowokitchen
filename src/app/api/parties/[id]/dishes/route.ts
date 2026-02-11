import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/parties/[id]/dishes - 向饭局添加菜品
 * Host: body: { dishId: number }
 * Guest: body: { dishName, ingredients: [{name, quantity, unit, unitPrice}], guestToken }
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const partyId = Number(id);
        const body = await req.json();

        const party = await prisma.party.findUnique({ where: { id: partyId } });
        if (!party) {
            return NextResponse.json(
                { success: false, error: "饭局不存在" },
                { status: 404 }
            );
        }

        if (party.status === "LOCKED") {
            return NextResponse.json(
                { success: false, error: "饭局已锁定，无法添加菜品" },
                { status: 403 }
            );
        }

        let dishName: string;
        let ingredientsSnapshot: string;
        let costSnapshot: number;
        let addedByGuestId: number | null = null;

        const userId = getUserIdFromRequest(req);

        if (userId && body.dishId) {
            // Host 模式
            const dish = await prisma.dish.findFirst({
                where: { id: body.dishId, userId },
                include: {
                    ingredients: { include: { ingredient: true } },
                },
            });

            if (!dish) {
                return NextResponse.json(
                    { success: false, error: "菜品不存在" },
                    { status: 404 }
                );
            }

            dishName = dish.name;
            ingredientsSnapshot = JSON.stringify(
                dish.ingredients.map((di) => ({
                    name: di.ingredient.name,
                    quantity: di.quantity,
                    unit: di.unit,
                    unitPrice: di.ingredient.unitPrice,
                }))
            );
            costSnapshot = dish.estimatedCost;
        } else if (body.guestToken) {
            // Guest 模式
            const guest = await prisma.partyGuest.findUnique({
                where: { guestToken: body.guestToken },
            });

            if (!guest || guest.partyId !== partyId) {
                return NextResponse.json(
                    { success: false, error: "游客身份验证失败" },
                    { status: 403 }
                );
            }

            if (!body.dishName || !body.ingredients) {
                return NextResponse.json(
                    { success: false, error: "菜品名称和食材信息不能为空" },
                    { status: 400 }
                );
            }

            dishName = body.dishName;
            ingredientsSnapshot = JSON.stringify(body.ingredients);
            costSnapshot = body.ingredients.reduce(
                (sum: number, ing: { quantity: number; unitPrice: number }) =>
                    sum + ing.quantity * ing.unitPrice,
                0
            );
            addedByGuestId = guest.id;
        } else {
            return NextResponse.json(
                { success: false, error: "请提供有效的身份验证信息" },
                { status: 401 }
            );
        }

        const partyDish = await prisma.partyDish.create({
            data: {
                partyId,
                dishName,
                ingredientsSnapshot,
                costSnapshot: Math.round(costSnapshot * 100) / 100,
                addedByGuestId,
            },
            include: {
                addedByGuest: { select: { id: true, nickname: true } },
            },
        });

        return NextResponse.json(
            { success: true, data: partyDish },
            { status: 201 }
        );
    } catch (error) {
        console.error("添加菜品到饭局失败:", error);
        return NextResponse.json(
            { success: false, error: "添加菜品失败" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/parties/[id]/dishes - 从饭局移除菜品
 * body: { partyDishId: number }
 * 仅 Host 可操作
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
        }
        const { id } = await params;
        const partyId = Number(id);
        const body = await req.json();
        const { partyDishId } = body;

        const party = await prisma.party.findFirst({
            where: { id: partyId, hostId: userId },
        });
        if (!party) {
            return NextResponse.json(
                { success: false, error: "饭局不存在或无权操作" },
                { status: 404 }
            );
        }

        if (party.status === "LOCKED") {
            return NextResponse.json(
                { success: false, error: "饭局已锁定，无法移除菜品" },
                { status: 403 }
            );
        }

        await prisma.partyDish.delete({ where: { id: partyDishId } });

        return NextResponse.json({ success: true, data: { id: partyDishId } });
    } catch (error) {
        console.error("移除饭局菜品失败:", error);
        return NextResponse.json(
            { success: false, error: "移除菜品失败" },
            { status: 500 }
        );
    }
}
