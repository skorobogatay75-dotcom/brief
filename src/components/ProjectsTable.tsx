"use client";

import Link from "next/link";
import { Project } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/Button";
import { getBriefUrl, getProposalUrl } from "@/lib/utils";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CopyButton({ text, label }: { text: string; label: string }) {
  async function copy() {
    await navigator.clipboard.writeText(text);
  }

  return (
    <button
      onClick={copy}
      className="text-xs text-primary hover:underline"
      title={`Скопировать ${label}`}
    >
      📋
    </button>
  );
}

export function ProjectsTable({ projects }: { projects: Project[] }) {
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
    <div className="overflow-x-auto rounded-xl border border-border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-slate-50">
            <th className="text-left px-4 py-3 font-medium text-muted">
              Проект
            </th>
            <th className="text-left px-4 py-3 font-medium text-muted">
              Клиент
            </th>
            <th className="text-left px-4 py-3 font-medium text-muted">
              Статус
            </th>
            <th className="text-left px-4 py-3 font-medium text-muted">
              Ссылки
            </th>
            <th className="text-left px-4 py-3 font-medium text-muted">
              Дата
            </th>
            <th className="text-right px-4 py-3 font-medium text-muted">
              Действия
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {projects.map((project) => {
            const briefUrl = getBriefUrl(project.token);
            const proposalUrl = getProposalUrl(project.token);

            return (
              <tr key={project.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">
                    {project.title}
                  </div>
                  {project.description && (
                    <div className="text-xs text-muted mt-0.5 line-clamp-1">
                      {project.description}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div>{project.clientName}</div>
                  {project.clientCompany && (
                    <div className="text-xs text-muted">
                      {project.clientCompany}
                    </div>
                  )}
                  {project.clientEmail && (
                    <div className="text-xs text-muted">
                      {project.clientEmail}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={project.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <a
                        href={briefUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-xs"
                      >
                        Бриф
                      </a>
                      <CopyButton text={briefUrl} label="ссылку на бриф" />
                    </div>
                    {(project.status === "brief_completed" ||
                      project.status === "proposal_ready") && (
                      <div className="flex items-center gap-1">
                        <a
                          href={proposalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:underline text-xs"
                        >
                          КП
                        </a>
                        <CopyButton text={proposalUrl} label="ссылку на КП" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">
                  <div>Создан: {formatDate(project.createdAt)}</div>
                  {project.completedAt && (
                    <div>Бриф: {formatDate(project.completedAt)}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/projects/${project.id}`}>
                    <Button variant="secondary" size="sm">
                      Открыть
                    </Button>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
