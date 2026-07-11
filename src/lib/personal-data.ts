import type { BriefField, ProposalSection } from "@/types";
import { encrypt, decrypt, encryptRecord, decryptRecord } from "./encryption";

/** Ключи ПДн клиента (ФИО, email, телефон) — не передаются в генерацию */
export const CLIENT_PII_KEYS = [
  "client_name",
  "client_email",
  "client_phone",
] as const;

export type ClientPiiKey = (typeof CLIENT_PII_KEYS)[number];

const PII_KEY_PATTERNS = [
  /fio/i,
  /name/i,
  /phone/i,
  /email/i,
  /tel/i,
  /mobile/i,
  /contact/i,
  /фио/i,
  /имя/i,
  /телефон/i,
  /почта/i,
  /email/i,
];

const PII_PLACEHOLDER_PREFIX = "[[PII:";
const PII_PLACEHOLDER_SUFFIX = "]]";

export function createPiiPlaceholder(key: string): string {
  return `${PII_PLACEHOLDER_PREFIX}${key}${PII_PLACEHOLDER_SUFFIX}`;
}

export function isPersonalDataField(field: BriefField): boolean {
  if (field.isPersonalData) return true;
  if (field.type === "email") return true;
  return PII_KEY_PATTERNS.some((p) => p.test(field.variableKey));
}

export function isPiiVariableKey(key: string): boolean {
  return (CLIENT_PII_KEYS as readonly string[]).includes(key);
}

export function splitBriefAnswers(
  fields: BriefField[],
  answers: Record<string, string>
): {
  publicAnswers: Record<string, string>;
  piiAnswers: Record<string, string>;
} {
  const publicAnswers: Record<string, string> = {};
  const piiAnswers: Record<string, string> = {};

  for (const field of fields) {
    const value = answers[field.variableKey] ?? "";
    if (isPersonalDataField(field)) {
      piiAnswers[field.variableKey] = value;
    } else {
      publicAnswers[field.variableKey] = value;
    }
  }

  return { publicAnswers, piiAnswers };
}

export function buildPiiVariables(project: {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  piiAnswers?: Record<string, string>;
}): Record<string, string> {
  return {
    client_name: project.clientName,
    client_email: project.clientEmail,
    client_phone: project.clientPhone,
    ...(project.piiAnswers ?? {}),
  };
}

export function buildPublicVariables(project: {
  title: string;
  description: string;
  clientCompany: string;
  briefAnswers: Record<string, string>;
}): Record<string, string> {
  return {
    project_title: project.title,
    project_description: project.description,
    client_company: project.clientCompany,
    ...project.briefAnswers,
  };
}

/** Маскирует ПДн плейсхолдерами — безопасно для передачи в ИИ/генерацию */
export function maskPiiInVariables(
  variables: Record<string, string>
): Record<string, string> {
  const masked: Record<string, string> = {};

  for (const [key, value] of Object.entries(variables)) {
    if (isPiiVariableKey(key) || isPiiAnswerKey(key)) {
      masked[key] = createPiiPlaceholder(key);
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

function isPiiAnswerKey(key: string): boolean {
  return PII_KEY_PATTERNS.some((p) => p.test(key));
}

/** Подстановка ПДн в готовый результат — только после генерации */
export function substitutePiiInText(
  text: string,
  piiData: Record<string, string>
): string {
  let result = text;

  for (const [key, value] of Object.entries(piiData)) {
    const placeholder = createPiiPlaceholder(key);
    result = result.split(placeholder).join(value?.trim() ? value : "—");
  }

  return result;
}

export function substitutePiiInSections(
  sections: ProposalSection[],
  piiData: Record<string, string>
): ProposalSection[] {
  return sections.map((section) => ({
    ...section,
    title: substitutePiiInText(section.title, piiData),
    content: substitutePiiInText(section.content, piiData),
    items: section.items?.map((item) => substitutePiiInText(item, piiData)),
  }));
}

/** Безопасное отображение имени (только для приветствия на форме брифа) */
export function maskNameForDisplay(fullName: string): string {
  if (!fullName?.trim()) return "клиент";
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0];
  if (first.length <= 2) return first;
  return `${first[0]}${"*".repeat(Math.min(first.length - 1, 3))}`;
}

export function encryptClientPii(data: {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
}): {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
} {
  return {
    clientName: data.clientName ? encrypt(data.clientName) : "",
    clientEmail: data.clientEmail ? encrypt(data.clientEmail) : "",
    clientPhone: data.clientPhone ? encrypt(data.clientPhone) : "",
  };
}

export function decryptClientPii(data: {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
}): {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
} {
  return {
    clientName: data.clientName ? decrypt(data.clientName) : "",
    clientEmail: data.clientEmail ? decrypt(data.clientEmail) : "",
    clientPhone: data.clientPhone ? decrypt(data.clientPhone) : "",
  };
}

export function encryptBriefPii(
  piiAnswers: Record<string, string>
): Record<string, string> {
  return encryptRecord(piiAnswers);
}

export function decryptBriefPii(
  encrypted: Record<string, string>
): Record<string, string> {
  return decryptRecord(encrypted);
}

/** Payload для генерации — без ПДн, пригоден для передачи в ИИ */
export function buildSafeGenerationPayload(project: {
  title: string;
  description: string;
  clientCompany: string;
  briefAnswers: Record<string, string>;
  proposalSections?: ProposalSection[];
}): {
  publicData: Record<string, string>;
  sections: ProposalSection[];
  piiExcluded: string[];
} {
  const publicData = buildPublicVariables(project);
  const piiExcluded = [...CLIENT_PII_KEYS];

  return {
    publicData,
    sections: project.proposalSections ?? [],
    piiExcluded,
  };
}

/** Полный набор ответов брифа (публичные + ПДн) для отображения админу */
export function mergeBriefAnswers(project: {
  briefAnswers: Record<string, string>;
  piiAnswers: Record<string, string>;
}): Record<string, string> {
  return { ...project.briefAnswers, ...project.piiAnswers };
}
