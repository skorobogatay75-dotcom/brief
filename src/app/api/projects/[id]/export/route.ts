import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { prisma, serializeProject } from "@/lib/db";
import {
  buildProjectWorkbook,
  excelResponse,
  safeExcelFilename,
  workbookToBuffer,
} from "@/lib/excel-export";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });

  if (!project) {
    return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
  }

  const history = await prisma.projectHistory.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
  });

  const serialized = serializeProject(project);
  const workbook = buildProjectWorkbook(
    serialized,
    history.map((entry) => ({
      id: entry.id,
      action: entry.action,
      details: entry.details,
      createdAt: entry.createdAt.toISOString(),
    }))
  );
  const buffer = workbookToBuffer(workbook);
  const filename = safeExcelFilename(serialized.title);

  return excelResponse(buffer, filename);
}
