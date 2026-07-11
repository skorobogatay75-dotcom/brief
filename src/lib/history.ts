import { prisma } from "@/lib/db";

export async function logProjectHistory(
  projectId: string,
  action: string,
  details = ""
) {
  await prisma.projectHistory.create({
    data: { projectId, action, details },
  });
}

export const HISTORY_LABELS: Record<string, string> = {
  created: "Проект создан",
  status_change: "Изменён статус",
  brief_sent: "Бриф отправлен клиенту",
  brief_completed: "Клиент заполнил бриф",
  proposal_generated: "КП сгенерировано",
  proposal_updated: "КП отредактировано",
  proposal_published: "КП опубликовано и отправлено клиенту",
  deal_amount: "Изменена сумма",
  deal_probability: "Изменена вероятность",
  notes: "Изменены заметки",
  reminder: "Изменено напоминание",
  project_info: "Изменены данные проекта",
  brief_fields: "Изменены вопросы брифа",
};
