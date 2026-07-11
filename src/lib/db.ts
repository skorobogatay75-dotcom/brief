import { PrismaClient } from "@prisma/client";
import type {
  BriefField,
  Project,
  ProjectStatus,
  ProposalSection,
} from "@/types";
import {
  decryptClientPii,
  decryptBriefPii,
  encryptClientPii,
  encryptBriefPii,
} from "@/lib/personal-data";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function serializeProject(row: {
  id: string;
  token: string;
  title: string;
  description: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany: string;
  status: string;
  briefFields: string;
  briefAnswers: string;
  encryptedBriefPii: string;
  pdConsentAt: Date | null;
  proposalSections: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}): Project {
  const clientPii = decryptClientPii({
    clientName: row.clientName,
    clientEmail: row.clientEmail,
    clientPhone: row.clientPhone,
  });

  const piiAnswers = decryptBriefPii(
    parseJson<Record<string, string>>(row.encryptedBriefPii, {})
  );

  return {
    id: row.id,
    token: row.token,
    title: row.title,
    description: row.description,
    clientName: clientPii.clientName,
    clientEmail: clientPii.clientEmail,
    clientPhone: clientPii.clientPhone,
    clientCompany: row.clientCompany,
    status: row.status as ProjectStatus,
    briefFields: parseJson<BriefField[]>(row.briefFields, []),
    briefAnswers: parseJson<Record<string, string>>(row.briefAnswers, {}),
    piiAnswers,
    proposalSections: parseJson<ProposalSection[]>(row.proposalSections, []),
    pdConsentAt: row.pdConsentAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

export function encryptProjectPii(data: {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  piiAnswers?: Record<string, string>;
}) {
  return {
    ...encryptClientPii({
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientPhone: data.clientPhone,
    }),
    encryptedBriefPii: JSON.stringify(
      encryptBriefPii(data.piiAnswers ?? {})
    ),
  };
}
