"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Project, ProjectHistoryEntry } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { Input, Textarea } from "@/components/ui/Input";
import { getBriefUrl, getProposalUrl } from "@/lib/utils";
import { HISTORY_LABELS } from "@/lib/history";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isReminderDue(reminderAt: string | null) {
  if (!reminderAt) return false;
  return new Date(reminderAt) <= new Date();
}

function EditableCell({
  projectId,
  field,
  initialValue,
  type = "text",
  onSaved,
}: {
  projectId: string;
  field: "dealAmount" | "dealProbability" | "notes" | "reminderAt" | "reminderNote";
  initialValue: string | number;
  type?: "text" | "number" | "datetime-local" | "textarea";
  onSaved?: () => void;
}) {
  const [value, setValue] = useState(String(initialValue ?? ""));

  useEffect(() => {
    setValue(String(initialValue ?? ""));
  }, [initialValue]);

  async function save(nextValue: string) {
    if (nextValue === String(initialValue ?? "")) return;

    const payload: Record<string, unknown> =
      field === "dealAmount"
        ? { dealAmount: Number(nextValue) || 0 }
        : field === "dealProbability"
          ? { dealProbability: Number(nextValue) || 0 }
          : field === "reminderAt"
            ? {
                reminderAt: nextValue
                  ? new Date(nextValue).toISOString()
                  : null,
              }
            : { [field]: nextValue };

    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    onSaved?.();
  }

  if (type === "textarea") {
    return (
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={(e) => save(e.target.value)}
        rows={2}
        className="text-sm min-w-[180px]"
        placeholder="Заметки..."
      />
    );
  }

  return (
    <Input
      type={type}
      min={field === "dealProbability" ? 0 : field === "dealAmount" ? 0 : undefined}
      max={field === "dealProbability" ? 100 : undefined}
      step={field === "dealAmount" ? 1000 : undefined}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={(e) => save(e.target.value)}
      className={`text-sm ${field === "dealAmount" ? "w-28" : field === "dealProbability" ? "w-16" : "min-w-[170px]"}`}
    />
  );
}

interface ProjectsTableProps {
  projects: Project[];
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  const router = useRouter();
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [history, setHistory] = useState<ProjectHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  function refresh() {
    router.refresh();
  }

  async function toggleHistory(projectId: string) {
    if (expandedHistoryId === projectId) {
      setExpandedHistoryId(null);
      return;
    }

    setExpandedHistoryId(projectId);
    setHistoryLoading(true);
    const res = await fetch(`/api/projects/${projectId}/history`);
    const data = res.ok ? await res.json() : [];
    setHistory(data);
    setHistoryLoading(false);
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted mb-4">Проектов пока нет</p>
        <Link href="/admin/projects/new">
          <Button>Создать первый проект</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full text-sm min-w-[1100px]">
          <thead>
            <tr className="border-b border-border bg-slate-50">
              <th className="text-left px-4 py-3 font-medium text-muted">Проект</th>
              <th className="text-left px-4 py-3 font-medium text-muted">Клиент</th>
              <th className="text-left px-4 py-3 font-medium text-muted">Статус</th>
              <th className="text-left px-4 py-3 font-medium text-muted">Сумма, ₽</th>
              <th className="text-left px-4 py-3 font-medium text-muted">Вероятность</th>
              <th className="text-left px-4 py-3 font-medium text-muted">Заметки</th>
              <th className="text-left px-4 py-3 font-medium text-muted">Напоминание</th>
              <th className="text-right px-4 py-3 font-medium text-muted">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {projects.map((project) => {
              const briefUrl = getBriefUrl(project.token);
              const proposalUrl = getProposalUrl(project.token);
              const reminderDue = isReminderDue(project.reminderAt);

              return (
                <tr
                  key={project.id}
                  className={`hover:bg-slate-50/50 ${reminderDue ? "bg-amber-50/60" : ""}`}
                >
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-foreground">{project.title}</div>
                    <div className="text-xs text-muted mt-1">
                      Создан: {formatDate(project.createdAt)}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <a
                        href={briefUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Бриф
                      </a>
                      {project.status === "proposal_ready" && (
                        <a
                          href={proposalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:underline"
                        >
                          КП
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div>{project.clientName}</div>
                    {project.clientCompany && (
                      <div className="text-xs text-muted">{project.clientCompany}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusBadge status={project.status} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <EditableCell
                      projectId={project.id}
                      field="dealAmount"
                      initialValue={project.dealAmount}
                      type="number"
                      onSaved={refresh}
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-2">
                      <EditableCell
                        projectId={project.id}
                        field="dealProbability"
                        initialValue={project.dealProbability}
                        type="number"
                        onSaved={refresh}
                      />
                      <span className="text-xs text-muted">%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <EditableCell
                      projectId={project.id}
                      field="notes"
                      initialValue={project.notes}
                      type="textarea"
                      onSaved={refresh}
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <EditableCell
                      projectId={project.id}
                      field="reminderAt"
                      initialValue={
                        project.reminderAt ? project.reminderAt.slice(0, 16) : ""
                      }
                      type="datetime-local"
                      onSaved={refresh}
                    />
                    {reminderDue && (
                      <div className="text-xs text-amber-700 mt-1 font-medium">
                        Пора напомнить
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-right space-y-2">
                    <Link href={`/admin/projects/${project.id}`}>
                      <Button variant="secondary" size="sm">
                        Открыть
                      </Button>
                    </Link>
                    <div>
                      <ExportExcelButton
                        href={`/api/projects/${project.id}/export`}
                        label="Excel"
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => toggleHistory(project.id)}
                        className="text-xs text-primary hover:underline"
                      >
                        {expandedHistoryId === project.id
                          ? "Скрыть историю"
                          : "История"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {expandedHistoryId && (
        <div className="rounded-xl border border-border bg-white p-4">
          <h3 className="text-sm font-semibold mb-3">История изменений</h3>
          {historyLoading ? (
            <p className="text-sm text-muted">Загрузка...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted">Записей пока нет</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex gap-3 text-sm border-b border-border pb-2 last:border-0"
                >
                  <span className="text-xs text-muted whitespace-nowrap">
                    {formatDate(entry.createdAt)}
                  </span>
                  <div>
                    <div className="font-medium">
                      {HISTORY_LABELS[entry.action] || entry.action}
                    </div>
                    {entry.details && (
                      <div className="text-muted text-xs">{entry.details}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
