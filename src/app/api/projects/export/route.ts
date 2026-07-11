import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { prisma, serializeProject } from "@/lib/db";
import {
  buildProjectsWorkbook,
  excelResponse,
  safeExcelFilename,
  workbookToBuffer,
} from "@/lib/excel-export";

export async function GET() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });
  const projects = rows.map(serializeProject);
  const workbook = buildProjectsWorkbook(projects);
  const buffer = workbookToBuffer(workbook);
  const filename = safeExcelFilename(
    `proekty_${new Date().toISOString().slice(0, 10)}`
  );

  return excelResponse(buffer, filename);
}
