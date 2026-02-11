import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/parties/[id]/export - 导出饭局定局清单
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const partyId = Number(id);

        const party = await prisma.party.findUnique({
            where: { id: partyId },
            include: {
                host: { select: { username: true } },
                dishes: {
                    include: {
                        addedByGuest: { select: { nickname: true } },
                    },
                    orderBy: { createdAt: "asc" },
                },
                guests: { select: { nickname: true } },
            },
        });

        if (!party) {
            return NextResponse.json(
                { success: false, error: "饭局不存在" },
                { status: 404 }
            );
        }

        // 合并所有菜品的食材（从快照中提取）
        interface SnapshotIngredient {
            name: string;
            quantity: number;
            unit: string;
            unitPrice: number;
        }

        const aggregated = new Map<
            string,
            {
                name: string;
                unit: string;
                unitPrice: number;
                totalQuantity: number;
                totalCost: number;
                fromDishes: string[];
            }
        >();

        for (const dish of party.dishes) {
            let ingredients: SnapshotIngredient[] = [];
            try {
                ingredients = JSON.parse(dish.ingredientsSnapshot);
            } catch {
                continue;
            }

            for (const ing of ingredients) {
                const key = `${ing.name}_${ing.unit}`;
                const existing = aggregated.get(key);
                if (existing) {
                    existing.totalQuantity += ing.quantity;
                    existing.totalCost = existing.totalQuantity * existing.unitPrice;
                    existing.fromDishes.push(dish.dishName);
                } else {
                    aggregated.set(key, {
                        name: ing.name,
                        unit: ing.unit,
                        unitPrice: ing.unitPrice,
                        totalQuantity: ing.quantity,
                        totalCost: ing.quantity * ing.unitPrice,
                        fromDishes: [dish.dishName],
                    });
                }
            }
        }

        const items = Array.from(aggregated.values());
        const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);

        return NextResponse.json({
            success: true,
            data: {
                partyName: party.name,
                hostName: party.host.username,
                status: party.status,
                guestCount: party.guests.length,
                guests: party.guests.map((g) => g.nickname),
                dishes: party.dishes.map((d) => ({
                    name: d.dishName,
                    cost: d.costSnapshot,
                    addedBy: d.addedByGuest?.nickname || party.host.username,
                })),
                shoppingList: {
                    items,
                    totalCost: Math.round(totalCost * 100) / 100,
                    dishCount: party.dishes.length,
                    generatedAt: new Date().toISOString(),
                },
            },
        });
    } catch (error) {
        console.error("导出饭局清单失败:", error);
        return NextResponse.json(
            { success: false, error: "导出失败" },
            { status: 500 }
        );
    }
}
