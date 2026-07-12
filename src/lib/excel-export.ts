import * as XLSX from "xlsx";
import type { Project, ProjectHistoryEntry } from "@/types";
import { STATUS_LABELS } from "@/types";
import { HISTORY_LABELS } from "@/lib/history";
import { mergeBriefAnswers } from "@/lib/personal-data";
import { getBriefUrl, getProposalUrl } from "@/lib/utils";

function formatDateRu(value: string | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleString("ru-RU");
}

function sheetFromRows(rows: Record<string, string | number>[]) {
  return XLSX.utils.json_to_sheet(rows);
}

function sheetFromKeyValue(pairs: [string, string | number][]) {
  return XLSX.utils.aoa_to_sheet([["Поле", "Значение"], ...pairs]);
}

export function buildProjectsWorkbook(projects: Project[]) {
  const workbook = XLSX.utils.book_new();

  const summaryRows = projects.map((project) => ({
    Проект: project.title,
    Описание: project.description,
    Клиент: project.clientName,
    Компания: project.clientCompany,
    Email: project.clientEmail,
    Телефон: project.clientPhone,
    Статус: STATUS_LABELS[project.status],
    "Сумма, ₽": project.dealAmount,
    "Вероятность, %": project.dealProbability,
    "Взвешенная сумма, ₽": Math.round(
      project.dealAmount * (project.dealProbability / 100)
    ),
    Заметки: project.notes,
    Напоминание: formatDateRu(project.reminderAt),
    "Текст напоминания": project.reminderNote,
    Создан: formatDateRu(project.createdAt),
    Обновлён: formatDateRu(project.updatedAt),
    "Бриф заполнен": formatDateRu(project.completedAt),
    "Ссылка на бриф": getBriefUrl(project.token),
    "Ссылка на КП":
      project.status === "proposal_ready" ? getProposalUrl(project.token) : "",
  }));

  XLSX.utils.book_append_sheet(
    workbook,
    sheetFromRows(summaryRows),
    "Проекты"
  );

  return workbook;
}

export function buildProjectWorkbook(
  project: Project,
  history: ProjectHistoryEntry[] = []
) {
  const workbook = XLSX.utils.book_new();
  const allAnswers = mergeBriefAnswers(project);

  XLSX.utils.book_append_sheet(
    workbook,
    sheetFromKeyValue([
      ["Название проекта", project.title],
      ["Описание", project.description],
      ["Клиент", project.clientName],
      ["Компания", project.clientCompany],
      ["Email", project.clientEmail],
      ["Телефон", project.clientPhone],
      ["Статус", STATUS_LABELS[project.status]],
      ["Сумма, ₽", project.dealAmount],
      ["Вероятность, %", project.dealProbability],
      [
        "Взвешенная сумма, ₽",
        Math.round(project.dealAmount * (project.dealProbability / 100)),
      ],
      ["Заметки", project.notes],
      ["Напоминание", formatDateRu(project.reminderAt)],
      ["Текст напоминания", project.reminderNote],
      ["Создан", formatDateRu(project.createdAt)],
      ["Обновлён", formatDateRu(project.updatedAt)],
      ["Бриф заполнен", formatDateRu(project.completedAt)],
      ["Согласие на ПДн", formatDateRu(project.pdConsentAt)],
      ["Ссылка на бриф", getBriefUrl(project.token)],
      [
        "Ссылка на КП",
        project.status === "proposal_ready" ? getProposalUrl(project.token) : "",
      ],
    ]),
    "Проект"
  );

  const briefRows = project.briefFields.map((field) => ({
    Вопрос: field.label,
    "Ключ переменной": field.variableKey,
    Ответ: allAnswers[field.variableKey] || "",
    Обязательное: field.required ? "Да" : "Нет",
    "Персональные данные": field.isPersonalData ? "Да" : "Нет",
  }));

  XLSX.utils.book_append_sheet(
    workbook,
    briefRows.length > 0
      ? sheetFromRows(briefRows)
      : sheetFromKeyValue([["", "Ответов брифа пока нет"]]),
    "Ответы брифа"
  );

  const proposalRows = project.proposalSections.flatMap((section) => {
    if (section.items?.length) {
      return section.items.map((item, index) => ({
        Секция: section.type,
        Заголовок: index === 0 ? section.title : "",
        Содержание: index === 0 ? section.content : "",
        Пункт: item,
      }));
    }

    return [
      {
        Секция: section.type,
        Заголовок: section.title,
        Содержание: section.content,
        Пункт: "",
      },
    ];
  });

  XLSX.utils.book_append_sheet(
    workbook,
    proposalRows.length > 0
      ? sheetFromRows(proposalRows)
      : sheetFromKeyValue([["", "КП ещё не сформировано"]]),
    "КП"
  );

  const historyRows = history.map((entry) => ({
    Дата: formatDateRu(entry.createdAt),
    Действие: HISTORY_LABELS[entry.action] || entry.action,
    Детали: entry.details,
  }));

  XLSX.utils.book_append_sheet(
    workbook,
    historyRows.length > 0
      ? sheetFromRows(historyRows)
      : sheetFromKeyValue([["", "История пуста"]]),
    "История"
  );

  return workbook;
}

export function workbookToBuffer(workbook: XLSX.WorkBook) {
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function safeExcelFilename(name: string, suffix = "xlsx") {
  const base =
    name
      .trim()
      .replace(/[<>:"/\\|?*]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 60) || "export";
  return `${base}.${suffix}`;
}

export function excelResponse(buffer: Buffer, filename: string) {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
