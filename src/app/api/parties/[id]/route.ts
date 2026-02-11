import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/parties/[id] - 获取饭局详情
 * 支持通过 id 或 shareCode 查询（无需登录）
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const party = await prisma.party.findFirst({
            where: isNaN(Number(id)) ? { shareCode: id } : { id: Number(id) },
            include: {
                host: { select: { id: true, username: true } },
                dishes: {
                    include: {
                        addedByGuest: { select: { id: true, nickname: true } },
                    },
                    orderBy: { createdAt: "asc" },
                },
                guests: {
                    select: { id: true, nickname: true, createdAt: true },
                },
            },
        });

        if (!party) {
            return NextResponse.json(
                { success: false, error: "饭局不存在" },
                { status: 404 }
            );
        }

        const totalCost = party.dishes.reduce(
            (sum, dish) => sum + dish.costSnapshot,
            0
        );

        return NextResponse.json({
            success: true,
            data: { ...party, totalCost: Math.round(totalCost * 100) / 100 },
        });
    } catch (error) {
        console.error("获取饭局详情失败:", error);
        return NextResponse.json(
            { success: false, error: "获取饭局详情失败" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/parties/[id] - 删除饭局（仅 Host）
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
        }
        const { id } = await params;
        const partyId = Number(id);

        const party = await prisma.party.findFirst({
            where: { id: partyId, hostId: userId },
        });
        if (!party) {
            return NextResponse.json(
                { success: false, error: "饭局不存在或无权操作" },
                { status: 404 }
            );
        }

        await prisma.party.delete({ where: { id: partyId } });

        return NextResponse.json({ success: true, data: { id: partyId } });
    } catch (error) {
        console.error("删除饭局失败:", error);
        return NextResponse.json(
            { success: false, error: "删除饭局失败" },
            { status: 500 }
        );
    }
}
