import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PUT /api/parties/[id]/lock - 切换饭局状态
 * body: { action: 'lock' | 'unlock' }
 * 仅 Host 可操作
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });
        }
        const { id } = await params;
        const partyId = Number(id);
        const body = await req.json();
        const { action } = body;

        if (!action || !["lock", "unlock"].includes(action)) {
            return NextResponse.json(
                { success: false, error: 'action 必须为 "lock" 或 "unlock"' },
                { status: 400 }
            );
        }

        const party = await prisma.party.findFirst({
            where: { id: partyId, hostId: userId },
        });
        if (!party) {
            return NextResponse.json(
                { success: false, error: "饭局不存在或无权操作" },
                { status: 404 }
            );
        }

        const newStatus = action === "lock" ? "LOCKED" : "ACTIVE";

        if (party.status === newStatus) {
            return NextResponse.json(
                {
                    success: false,
                    error: `饭局已经是${newStatus === "LOCKED" ? "锁定" : "进行中"}状态`,
                },
                { status: 400 }
            );
        }

        const updated = await prisma.party.update({
            where: { id: partyId },
            data: { status: newStatus },
        });

        return NextResponse.json({
            success: true,
            data: {
                id: updated.id,
                status: updated.status,
                message:
                    newStatus === "LOCKED"
                        ? "饭局已锁定，菜单不可再修改"
                        : "饭局已解锁，可以继续加菜",
            },
        });
    } catch (error) {
        console.error("切换饭局状态失败:", error);
        return NextResponse.json(
            { success: false, error: "操作失败" },
            { status: 500 }
        );
    }
}
