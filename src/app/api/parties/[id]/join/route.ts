import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/parties/[id]/join - 游客加入饭局
 * body: { nickname: string }
 * 无需登录
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { nickname } = body;

        if (!nickname) {
            return NextResponse.json(
                { success: false, error: "昵称不能为空" },
                { status: 400 }
            );
        }

        // 查找饭局
        const party = await prisma.party.findFirst({
            where: isNaN(Number(id))
                ? { shareCode: id }
                : { id: Number(id) },
        });

        if (!party) {
            return NextResponse.json(
                { success: false, error: "饭局不存在" },
                { status: 404 }
            );
        }

        if (party.status === "LOCKED") {
            return NextResponse.json(
                { success: false, error: "饭局已锁定，无法加入" },
                { status: 403 }
            );
        }

        // 生成游客 token
        const guestToken = crypto.randomBytes(8).toString("hex");

        const guest = await prisma.partyGuest.create({
            data: {
                partyId: party.id,
                nickname,
                guestToken,
            },
        });

        return NextResponse.json(
            {
                success: true,
                data: {
                    guestId: guest.id,
                    guestToken: guest.guestToken,
                    nickname: guest.nickname,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("加入饭局失败:", error);
        return NextResponse.json(
            { success: false, error: "加入饭局失败" },
            { status: 500 }
        );
    }
}
