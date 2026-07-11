import { NextRequest, NextResponse } from "next/server";
import { prisma, serializeProject } from "@/lib/db";
import { generateProposalFromAnswers } from "@/lib/utils";
import { logProjectHistory } from "@/lib/history";
import {
  splitBriefAnswers,
  maskNameForDisplay,
  isPersonalDataField,
  encryptBriefPii,
} from "@/lib/personal-data";
import type { BriefField } from "@/types";

type Params = { params: Promise<{ token: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { token } = await params;
  const project = await prisma.project.findUnique({ where: { token } });

  if (!project) {
    return NextResponse.json({ error: "Бриф не найден" }, { status: 404 });
  }

  const serialized = serializeProject(project);

  const publicBriefFields = serialized.briefFields.map((field) => ({
    ...field,
    isPersonalData: isPersonalDataField(field),
  }));

  return NextResponse.json({
    token: serialized.token,
    title: serialized.title,
    description: serialized.description,
    clientDisplayName: maskNameForDisplay(serialized.clientName),
    briefFields: publicBriefFields,
    status: serialized.status,
    isCompleted:
      serialized.status === "brief_completed" ||
      serialized.status === "proposal_ready",
    isProposalPublished: serialized.status === "proposal_ready",
    privacyNotice: {
      encrypted: true,
      aiExcluded: true,
      law: "152-ФЗ РФ",
    },
  });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params;
  const project = await prisma.project.findUnique({ where: { token } });

  if (!project) {
    return NextResponse.json({ error: "Бриф не найден" }, { status: 404 });
  }

  const body = await request.json();
  const answers: Record<string, string> = body.answers ?? body;
  const pdConsent: boolean = body.pdConsent === true;

  if (!pdConsent) {
    return NextResponse.json(
      {
        error:
          "Необходимо согласие на обработку персональных данных (152-ФЗ РФ)",
      },
      { status: 400 }
    );
  }

  const fields = JSON.parse(project.briefFields) as BriefField[];

  const missing = fields
    .filter((f) => f.required && !answers[f.variableKey]?.trim())
    .map((f) => f.label);

  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Заполните обязательные поля: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  const { publicAnswers, piiAnswers } = splitBriefAnswers(fields, answers);
  const serialized = serializeProject(project);

  const proposalSections = generateProposalFromAnswers(
    {
      title: serialized.title,
      description: serialized.description,
      clientName: serialized.clientName,
      clientEmail: serialized.clientEmail,
      clientPhone: serialized.clientPhone,
      clientCompany: serialized.clientCompany,
      briefAnswers: publicAnswers,
      piiAnswers,
    },
    serialized.proposalSections.length > 0
      ? serialized.proposalSections
      : undefined
  );

  const updated = await prisma.project.update({
    where: { token },
    data: {
      briefAnswers: JSON.stringify(publicAnswers),
      encryptedBriefPii: JSON.stringify(encryptBriefPii(piiAnswers)),
      proposalSections: JSON.stringify(proposalSections),
      status: "brief_completed",
      completedAt: new Date(),
      pdConsentAt: new Date(),
    },
  });

  await logProjectHistory(
    project.id,
    "brief_completed",
    "Клиент заполнил бриф, КП сгенерировано для проверки"
  );
  await logProjectHistory(project.id, "proposal_generated", "Черновик КП создан автоматически");

  return NextResponse.json({
    success: true,
    message: "Спасибо! Мы получили ваш бриф и готовим коммерческое предложение.",
    project: serializeProject(updated),
  });
}
