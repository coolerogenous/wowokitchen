import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";
import zlib from "zlib";

/**
 * POST /api/tokens/encode - 将菜品或菜单编码为密语
 * body: { type: 'dish' | 'menu', id: number }
 */
export async function POST(req: NextRequest) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
        }

        const body = await req.json();
        const { type, id } = body;

        if (!type || !id) {
            return NextResponse.json(
                { success: false, error: "type 和 id 不能为空" },
                { status: 400 }
            );
        }

        let data: object;

        if (type === "dish") {
            const dish = await prisma.dish.findFirst({
                where: { id, userId },
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

            data = {
                type: "dish",
                version: 1,
                data: {
                    name: dish.name,
                    ingredients: dish.ingredients.map((di) => ({
                        name: di.ingredient.name,
                        unitPrice: di.ingredient.unitPrice,
                        spec: di.ingredient.spec,
                        quantity: di.quantity,
                        unit: di.unit,
                    })),
                },
            };
        } else if (type === "menu") {
            const menu = await prisma.menu.findFirst({
                where: { id, userId },
                include: {
                    dishes: {
                        include: {
                            dish: {
                                include: {
                                    ingredients: { include: { ingredient: true } },
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

            data = {
                type: "menu",
                version: 1,
                data: {
                    name: menu.name,
                    dishes: menu.dishes.map((md) => ({
                        name: md.dish.name,
                        ingredients: md.dish.ingredients.map((di) => ({
                            name: di.ingredient.name,
                            unitPrice: di.ingredient.unitPrice,
                            spec: di.ingredient.spec,
                            quantity: di.quantity,
                            unit: di.unit,
                        })),
                    })),
                },
            };
        } else {
            return NextResponse.json(
                { success: false, error: 'type 必须为 "dish" 或 "menu"' },
                { status: 400 }
            );
        }

        // 序列化 → 压缩 → Base64
        const jsonStr = JSON.stringify(data);
        const compressed = zlib.deflateSync(Buffer.from(jsonStr, "utf-8"));
        const token = "WK:" + compressed.toString("base64");

        return NextResponse.json({ success: true, data: { token } });
    } catch (error) {
        console.error("编码密语失败:", error);
        return NextResponse.json(
            { success: false, error: "编码密语失败" },
            { status: 500 }
        );
    }
}
