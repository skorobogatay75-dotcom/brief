import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { prisma, serializeProject, encryptProjectPii } from "@/lib/db";
import { logProjectHistory } from "@/lib/history";
import { generateProposalFromAnswers } from "@/lib/utils";
import { STATUS_LABELS } from "@/types";
import type { UpdateProjectInput } from "@/types";

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

  return NextResponse.json(serializeProject(project));
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body: UpdateProjectInput = await request.json();

  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
  }

  const existingSerialized = serializeProject(existing);

  const hasBriefAnswers =
    Object.keys(existingSerialized.briefAnswers).length > 0 ||
    Object.keys(existingSerialized.piiAnswers).length > 0;

  if (body.briefFields !== undefined && hasBriefAnswers) {
    return NextResponse.json(
      { error: "Нельзя изменить вопросы брифа после заполнения клиентом" },
      { status: 400 }
    );
  }

  const piiUpdate =
    body.clientName !== undefined ||
    body.clientEmail !== undefined ||
    body.clientPhone !== undefined
      ? encryptProjectPii({
          clientName: body.clientName ?? existingSerialized.clientName,
          clientEmail: body.clientEmail ?? existingSerialized.clientEmail,
          clientPhone: body.clientPhone ?? existingSerialized.clientPhone,
        })
      : null;

  let proposalSections = existingSerialized.proposalSections;

  if (body.regenerateProposal && hasBriefAnswers) {
    proposalSections = generateProposalFromAnswers({
      title: existingSerialized.title,
      description: existingSerialized.description,
      clientName: existingSerialized.clientName,
      clientEmail: existingSerialized.clientEmail,
      clientPhone: existingSerialized.clientPhone,
      clientCompany: existingSerialized.clientCompany,
      briefAnswers: existingSerialized.briefAnswers,
      piiAnswers: existingSerialized.piiAnswers,
    });
    await logProjectHistory(id, "proposal_generated", "КП перегенерировано из ответов брифа");
  } else if (body.proposalSections !== undefined) {
    proposalSections = body.proposalSections;
    await logProjectHistory(id, "proposal_updated", "Изменены секции КП");
  }

  let status = body.status ?? existingSerialized.status;

  if (body.publishProposal) {
    if (!hasBriefAnswers) {
      return NextResponse.json(
        { error: "Нельзя опубликовать КП без ответов брифа" },
        { status: 400 }
      );
    }
    status = "proposal_ready";
    await logProjectHistory(id, "proposal_published", "КП опубликовано для клиента");
  }

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(piiUpdate && {
        clientName: piiUpdate.clientName,
        clientEmail: piiUpdate.clientEmail,
        clientPhone: piiUpdate.clientPhone,
      }),
      ...(body.clientCompany !== undefined && {
        clientCompany: body.clientCompany,
      }),
      ...(body.status !== undefined && !body.publishProposal && { status: body.status }),
      ...(body.publishProposal && { status }),
      ...(body.briefFields !== undefined && {
        briefFields: JSON.stringify(body.briefFields),
      }),
      proposalSections: JSON.stringify(proposalSections),
      ...(body.dealAmount !== undefined && { dealAmount: body.dealAmount }),
      ...(body.dealProbability !== undefined && {
        dealProbability: Math.min(100, Math.max(0, body.dealProbability)),
      }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.reminderAt !== undefined && {
        reminderAt: body.reminderAt ? new Date(body.reminderAt) : null,
      }),
      ...(body.reminderNote !== undefined && { reminderNote: body.reminderNote }),
    },
  });

  if (body.status !== undefined && body.status !== existingSerialized.status && !body.publishProposal) {
    await logProjectHistory(
      id,
      "status_change",
      `${STATUS_LABELS[existingSerialized.status]} → ${STATUS_LABELS[body.status]}`
    );
  }

  if (body.briefFields !== undefined) {
    await logProjectHistory(id, "brief_fields", "Обновлены вопросы брифа");
  }

  if (body.dealAmount !== undefined && body.dealAmount !== existingSerialized.dealAmount) {
    await logProjectHistory(
      id,
      "deal_amount",
      `${existingSerialized.dealAmount.toLocaleString("ru-RU")} → ${body.dealAmount.toLocaleString("ru-RU")} ₽`
    );
  }

  if (
    body.dealProbability !== undefined &&
    body.dealProbability !== existingSerialized.dealProbability
  ) {
    await logProjectHistory(
      id,
      "deal_probability",
      `${existingSerialized.dealProbability}% → ${body.dealProbability}%`
    );
  }

  if (body.notes !== undefined && body.notes !== existingSerialized.notes) {
    await logProjectHistory(id, "notes", "Обновлены заметки");
  }

  if (
    (body.reminderAt !== undefined || body.reminderNote !== undefined) &&
    (body.reminderAt !== existingSerialized.reminderAt ||
      body.reminderNote !== existingSerialized.reminderNote)
  ) {
    const reminderText = body.reminderAt
      ? new Date(body.reminderAt).toLocaleString("ru-RU")
      : "напоминание снято";
    await logProjectHistory(id, "reminder", reminderText);
  }

  if (
    body.title !== undefined ||
    body.description !== undefined ||
    body.clientCompany !== undefined ||
    piiUpdate
  ) {
    const infoChanged =
      (body.title !== undefined && body.title !== existingSerialized.title) ||
      (body.description !== undefined &&
        body.description !== existingSerialized.description) ||
      (body.clientCompany !== undefined &&
        body.clientCompany !== existingSerialized.clientCompany) ||
      piiUpdate;

    if (infoChanged) {
      await logProjectHistory(id, "project_info", "Обновлены данные проекта");
    }
  }

  if (body.status === "brief_sent" && existingSerialized.status === "draft") {
    await logProjectHistory(id, "brief_sent", "Бриф отправлен клиенту");
  }

  return NextResponse.json(serializeProject(project));
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
