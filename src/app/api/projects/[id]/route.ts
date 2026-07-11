import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { prisma, serializeProject, encryptProjectPii } from "@/lib/db";
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

  const piiUpdate =
    body.clientName !== undefined ||
    body.clientEmail !== undefined ||
    body.clientPhone !== undefined
      ? encryptProjectPii({
          clientName:
            body.clientName ?? existingSerialized.clientName,
          clientEmail:
            body.clientEmail ?? existingSerialized.clientEmail,
          clientPhone:
            body.clientPhone ?? existingSerialized.clientPhone,
        })
      : null;

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
      ...(body.status !== undefined && { status: body.status }),
      ...(body.briefFields !== undefined && {
        briefFields: JSON.stringify(body.briefFields),
      }),
      ...(body.proposalSections !== undefined && {
        proposalSections: JSON.stringify(body.proposalSections),
      }),
    },
  });

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
