import type { ProposalSection } from "@/types";
import {
  buildPiiVariables,
  buildPublicVariables,
  maskPiiInVariables,
  substitutePiiInSections,
  createPiiPlaceholder,
} from "./personal-data";
import {
  buildDefaultProposalSections,
  interpolateTemplate,
} from "./utils";

/**
 * Генерация контента КП в два этапа (152-ФЗ):
 * 1. Генерация без ПДн — в шаблон подставляются только публичные данные,
 *    персональные заменяются на плейсхолдеры [[PII:key]]
 * 2. Локальная подстановка ПДн — после генерации, без передачи в ИИ
 *
 * При подключении ИИ использовать только `prepareAiGenerationInput()` —
 * он гарантированно исключает персональные данные.
 */

export interface GenerationInput {
  title: string;
  description: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany: string;
  briefAnswers: Record<string, string>;
  piiAnswers?: Record<string, string>;
}

export interface AiSafeInput {
  publicVariables: Record<string, string>;
  sections: ProposalSection[];
  excludedFields: string[];
  notice: string;
}

export function prepareAiGenerationInput(
  input: GenerationInput,
  sections?: ProposalSection[]
): AiSafeInput {
  const publicVariables = buildPublicVariables({
    title: input.title,
    description: input.description,
    clientCompany: input.clientCompany || "Заказчик",
    briefAnswers: input.briefAnswers,
  });

  const sourceSections = sections ?? buildDefaultProposalSections();

  return {
    publicVariables,
    sections: sourceSections,
    excludedFields: [
      "client_name",
      "client_email",
      "client_phone",
      ...(input.piiAnswers ? Object.keys(input.piiAnswers) : []),
    ],
    notice:
      "Персональные данные исключены из входа генерации. Подстановка — только после получения результата.",
  };
}

function generateSectionsWithMaskedPii(
  publicVariables: Record<string, string>,
  piiPlaceholders: Record<string, string>,
  sections: ProposalSection[]
): ProposalSection[] {
  const allVars = { ...publicVariables, ...piiPlaceholders };

  return sections.map((section) => ({
    ...section,
    title: interpolateTemplate(section.title, allVars),
    content: interpolateTemplate(section.content, allVars),
    items: section.items?.map((item) => interpolateTemplate(item, allVars)),
  }));
}

export function generateProposalSecure(
  input: GenerationInput,
  sections?: ProposalSection[]
): ProposalSection[] {
  const sourceSections = sections ?? buildDefaultProposalSections();

  const piiData = buildPiiVariables({
    clientName: input.clientName,
    clientEmail: input.clientEmail,
    clientPhone: input.clientPhone,
    piiAnswers: input.piiAnswers,
  });

  // client_company в публичных данных — без подстановки ФИО
  if (!input.clientCompany && input.clientName) {
    piiData.client_company = input.clientName;
  }

  const publicVariables = buildPublicVariables({
    title: input.title,
    description: input.description,
    clientCompany: input.clientCompany || "Заказчик",
    briefAnswers: input.briefAnswers,
  });

  const piiPlaceholders = maskPiiInVariables(piiData);
  if (!input.clientCompany && input.clientName) {
    piiPlaceholders.client_company = createPiiPlaceholder("client_company");
  }

  const generatedSections = generateSectionsWithMaskedPii(
    publicVariables,
    piiPlaceholders,
    sourceSections
  );

  return substitutePiiInSections(generatedSections, piiData);
}
