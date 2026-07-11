import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { prisma, serializeProject } from "@/lib/db";
import { generateProposalFromAnswers } from "@/lib/utils";

type Params = { params: Promise<{ token: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { token } = await params;
  const project = await prisma.project.findUnique({ where: { token } });

  if (!project) {
    return NextResponse.json({ error: "Предложение не найдено" }, { status: 404 });
  }

  const serialized = serializeProject(project);
  const authenticated = await isAuthenticated();

  if (serialized.status !== "proposal_ready" && !authenticated) {
    return NextResponse.json(
      { error: "Коммерческое предложение ещё не опубликовано" },
      { status: 403 }
    );
  }

  let sections = serialized.proposalSections;
  if (
    sections.length === 0 &&
    (Object.keys(serialized.briefAnswers).length > 0 ||
      Object.keys(serialized.piiAnswers).length > 0)
  ) {
    sections = generateProposalFromAnswers({
      title: serialized.title,
      description: serialized.description,
      clientName: serialized.clientName,
      clientEmail: serialized.clientEmail,
      clientPhone: serialized.clientPhone,
      clientCompany: serialized.clientCompany,
      briefAnswers: serialized.briefAnswers,
      piiAnswers: serialized.piiAnswers,
    });
  }

  return NextResponse.json({
    title: serialized.title,
    clientName: serialized.clientName,
    clientCompany: serialized.clientCompany,
    sections,
    completedAt: serialized.completedAt,
    privacyNotice: {
      personalDataProtected: true,
      aiWasNotUsedForPii: true,
    },
  });
}
