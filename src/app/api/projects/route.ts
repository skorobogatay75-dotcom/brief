import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { prisma, serializeProject, encryptProjectPii } from "@/lib/db";
import {
  DEFAULT_BRIEF_FIELDS,
  generateToken,
  buildDefaultProposalSections,
} from "@/lib/utils";
import type { CreateProjectInput } from "@/types";

export async function GET() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rows.map(serializeProject));
}

export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: CreateProjectInput = await request.json();

  if (!body.title?.trim() || !body.clientName?.trim()) {
    return NextResponse.json(
      { error: "Укажите название проекта и имя клиента" },
      { status: 400 }
    );
  }

  const encrypted = encryptProjectPii({
    clientName: body.clientName.trim(),
    clientEmail: body.clientEmail?.trim() || "",
    clientPhone: body.clientPhone?.trim() || "",
  });

  const project = await prisma.project.create({
    data: {
      token: generateToken(),
      title: body.title.trim(),
      description: body.description?.trim() || "",
      clientName: encrypted.clientName,
      clientEmail: encrypted.clientEmail,
      clientPhone: encrypted.clientPhone,
      clientCompany: body.clientCompany?.trim() || "",
      status: "draft",
      briefFields: JSON.stringify(body.briefFields || DEFAULT_BRIEF_FIELDS),
      briefAnswers: JSON.stringify({}),
      encryptedBriefPii: JSON.stringify({}),
      proposalSections: JSON.stringify(buildDefaultProposalSections()),
    },
  });

  return NextResponse.json(serializeProject(project), { status: 201 });
}
