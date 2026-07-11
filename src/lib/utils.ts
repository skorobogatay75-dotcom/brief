import { nanoid } from "nanoid";
import type { BriefField, ProposalSection } from "@/types";
import { generateProposalSecure } from "./generation";

export function generateToken(): string {
  return nanoid(12);
}

export function generateFieldId(): string {
  return nanoid(8);
}

export const DEFAULT_BRIEF_FIELDS: BriefField[] = [
  {
    id: "f1",
    label: "Цель проекта",
    type: "textarea",
    placeholder: "Какую задачу должен решить продукт?",
    required: true,
    variableKey: "project_goal",
  },
  {
    id: "f2",
    label: "Целевая аудитория",
    type: "textarea",
    placeholder: "Кто будет пользоваться продуктом?",
    required: true,
    variableKey: "target_audience",
  },
  {
    id: "f3",
    label: "Основные функции",
    type: "textarea",
    placeholder: "Перечислите ключевые функции и возможности",
    required: true,
    variableKey: "main_features",
  },
  {
    id: "f4",
    label: "Желаемые сроки",
    type: "text",
    placeholder: "Например: 2-3 месяца",
    required: false,
    variableKey: "timeline",
  },
  {
    id: "f5",
    label: "Бюджет",
    type: "text",
    placeholder: "Ориентировочный бюджет проекта",
    required: false,
    variableKey: "budget",
  },
  {
    id: "f6",
    label: "Референсы и пожелания по дизайну",
    type: "textarea",
    placeholder: "Ссылки на сайты, стиль, цвета",
    required: false,
    variableKey: "design_refs",
  },
  {
    id: "f7",
    label: "Дополнительные комментарии",
    type: "textarea",
    placeholder: "Всё, что важно учесть",
    required: false,
    variableKey: "comments",
  },
];

export function buildDefaultProposalSections(): ProposalSection[] {
  return [
    {
      id: "hero",
      type: "hero",
      title: "Коммерческое предложение для {{client_company}}",
      content:
        "Разработка: {{project_title}}\n\nПодготовлено для {{client_name}}",
    },
    {
      id: "about",
      type: "text",
      title: "О проекте",
      content:
        "{{project_description}}\n\n**Цель:** {{project_goal}}\n\n**Аудитория:** {{target_audience}}",
    },
    {
      id: "scope",
      type: "features",
      title: "Состав работ",
      content: "На основе вашего брифа мы предлагаем следующий объём:",
      items: ["{{main_features}}"],
    },
    {
      id: "design",
      type: "text",
      title: "Дизайн и UX",
      content: "{{design_refs}}",
    },
    {
      id: "timeline",
      type: "timeline",
      title: "Сроки реализации",
      content: "Ориентировочные сроки: {{timeline}}",
      items: [
        "Анализ и проектирование — 2 недели",
        "Разработка MVP — по согласованному плану",
        "Тестирование и запуск — 1-2 недели",
      ],
    },
    {
      id: "pricing",
      type: "pricing",
      title: "Стоимость",
      content:
        "Ориентировочный бюджет по брифу: **{{budget}}**\n\nТочная смета формируется после детального обсуждения.",
    },
    {
      id: "cta",
      type: "cta",
      title: "Готовы начать?",
      content:
        "Свяжитесь с нами для обсуждения деталей и старта проекта.\n\n{{client_name}} — {{client_email}}",
    },
  ];
}

export function interpolateTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = variables[key];
    return value?.trim() ? value : "—";
  });
}

export function buildVariables(
  project: {
    title: string;
    description: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    clientCompany: string;
    briefAnswers: Record<string, string>;
  }
): Record<string, string> {
  return {
    project_title: project.title,
    project_description: project.description,
    client_name: project.clientName,
    client_email: project.clientEmail,
    client_phone: project.clientPhone,
    client_company: project.clientCompany || project.clientName,
    ...project.briefAnswers,
  };
}

export function generateProposalFromAnswers(
  project: {
    title: string;
    description: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    clientCompany: string;
    briefAnswers: Record<string, string>;
    piiAnswers?: Record<string, string>;
  },
  sections?: ProposalSection[]
): ProposalSection[] {
  return generateProposalSecure(
    {
      title: project.title,
      description: project.description,
      clientName: project.clientName,
      clientEmail: project.clientEmail,
      clientPhone: project.clientPhone,
      clientCompany: project.clientCompany,
      briefAnswers: project.briefAnswers,
      piiAnswers: project.piiAnswers,
    },
    sections
  );
}

export function getAppUrl(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function getBriefUrl(token: string): string {
  return `${getAppUrl()}/brief/${token}`;
}

export function getProposalUrl(token: string): string {
  return `${getAppUrl()}/proposal/${token}`;
}
