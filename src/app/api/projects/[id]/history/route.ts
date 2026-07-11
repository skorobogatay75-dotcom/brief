import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const history = await prisma.projectHistory.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(
    history.map((entry) => ({
      id: entry.id,
      action: entry.action,
      details: entry.details,
      createdAt: entry.createdAt.toISOString(),
    }))
  );
}
