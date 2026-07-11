"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/types";
import { AdminLayout } from "@/components/AdminLayout";
import { BriefFieldEditor } from "@/components/BriefFieldEditor";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Textarea } from "@/components/ui/Input";
import { getBriefUrl, getProposalUrl } from "@/lib/utils";
import { mergeBriefAnswers } from "@/lib/personal-data";
import { PrivacyNotice, PiiFieldBadge } from "@/components/PrivacyNotice";
import { isPersonalDataField } from "@/lib/personal-data";

interface ProjectDetailProps {
  project: Project;
}

export function ProjectDetail({ project: initial }: ProjectDetailProps) {
  const router = useRouter();
  const [project, setProject] = useState(initial);
  const [tab, setTab] = useState<"info" | "brief" | "answers">("info");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const briefUrl = getBriefUrl(project.token);
  const proposalUrl = getProposalUrl(project.token);
  const hasAnswers =
    Object.keys(project.briefAnswers).length > 0 ||
    Object.keys(project.piiAnswers).length > 0;
  const allAnswers = mergeBriefAnswers(project);

  async function save(updates: Partial<Project>) {
    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (res.ok) {
      const updated = await res.json();
      setProject(updated);
      setMessage("Сохранено");
      router.refresh();
    } else {
      setMessage("Ошибка сохранения");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Удалить проект? Это действие необратимо.")) return;
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    router.push("/admin");
  }

  async function copyLink(url: string) {
    await navigator.clipboard.writeText(url);
    setMessage("Ссылка скопирована");
  }

  const tabs = [
    { id: "info" as const, label: "Проект" },
    { id: "brief" as const, label: "Бриф" },
    ...(hasAnswers ? [{ id: "answers" as const, label: "Ответы" }] : []),
  ];

  return (
    <AdminLayout>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="text-muted text-sm">
            Клиент: {project.clientName}
            {project.clientCompany && ` · ${project.clientCompany}`}
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={handleDelete}>
          Удалить
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-1">
          <h3 className="text-sm font-semibold mb-3">Ссылки</h3>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted mb-1">Бриф для клиента</div>
              <div className="flex items-center gap-2">
                <a
                  href={briefUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline truncate"
                >
                  {briefUrl}
                </a>
                <button
                  onClick={() => copyLink(briefUrl)}
                  className="text-xs text-muted hover:text-foreground shrink-0"
                >
                  📋
                </button>
              </div>
            </div>
            {(project.status === "brief_completed" ||
              project.status === "proposal_ready") && (
              <div>
                <div className="text-xs text-muted mb-1">
                  Коммерческое предложение
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={proposalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-600 hover:underline truncate"
                  >
                    {proposalUrl}
                  </a>
                  <button
                    onClick={() => copyLink(proposalUrl)}
                    className="text-xs text-muted hover:text-foreground shrink-0"
                  >
                    📋
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <PrivacyNotice variant="compact" />
            <div className="text-xs text-muted space-y-1 mt-3">
              <div>Создан: {new Date(project.createdAt).toLocaleString("ru-RU")}</div>
              {project.completedAt && (
                <div>
                  Бриф заполнен:{" "}
                  {new Date(project.completedAt).toLocaleString("ru-RU")}
                </div>
              )}
              {project.pdConsentAt && (
                <div className="text-emerald-600">
                  Согласие на обработку ПДн:{" "}
                  {new Date(project.pdConsentAt).toLocaleString("ru-RU")}
                </div>
              )}
            </div>
          </div>

          {project.status === "draft" && (
            <Button
              className="w-full mt-4"
              size="sm"
              variant="secondary"
              onClick={() => save({ status: "brief_sent" })}
            >
              Отметить как «Бриф отправлен»
            </Button>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex gap-1 border-b border-border mb-6">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === t.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "info" && (
            <ProjectInfoForm
              project={project}
              onSave={save}
              saving={saving}
            />
          )}

          {tab === "brief" && (
            <div>
              <p className="text-sm text-muted mb-4">
                Настройте поля брифа. Поля с меткой «ПДн» шифруются и не
                передаются в ИИ при генерации — подставляются только после.
                Ключи переменных:{" "}
                <code className="text-xs bg-slate-100 px-1 rounded">
                  {"{{project_goal}}"}
                </code>
              </p>
              <BriefFieldEditor
                fields={project.briefFields}
                onChange={(fields) => setProject({ ...project, briefFields: fields })}
              />
              <Button
                className="mt-4"
                onClick={() => save({ briefFields: project.briefFields })}
                disabled={saving}
              >
                {saving ? "Сохранение..." : "Сохранить бриф"}
              </Button>
            </div>
          )}

          {tab === "answers" && hasAnswers && (
            <div className="space-y-4">
              {project.briefFields.map((field) => (
                <div
                  key={field.id}
                  className="border-b border-border pb-4 last:border-0"
                >
                  <div className="text-sm font-medium text-muted mb-1 flex items-center gap-2">
                    {field.label}
                    {isPersonalDataField(field) && <PiiFieldBadge />}
                  </div>
                  <div className="text-foreground whitespace-pre-wrap">
                    {allAnswers[field.variableKey] || "—"}
                  </div>
                </div>
              ))}
              <a href={proposalUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary">Открыть КП</Button>
              </a>
            </div>
          )}

          {message && (
            <p className="text-sm text-green-600 mt-4">{message}</p>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}

function ProjectInfoForm({
  project,
  onSave,
  saving,
}: {
  project: Project;
  onSave: (data: Partial<Project>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    title: project.title,
    description: project.description,
    clientName: project.clientName,
    clientEmail: project.clientEmail,
    clientPhone: project.clientPhone,
    clientCompany: project.clientCompany,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="space-y-4"
    >
      <FieldWrapper label="Название проекта">
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </FieldWrapper>
      <FieldWrapper label="Описание">
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </FieldWrapper>
      <PrivacyNotice variant="inline" />
      <div className="grid sm:grid-cols-2 gap-4">
        <FieldWrapper
          label={
            <span className="flex items-center gap-2">
              Имя клиента <PiiFieldBadge />
            </span>
          }
        >
          <Input
            value={form.clientName}
            onChange={(e) => setForm({ ...form, clientName: e.target.value })}
          />
        </FieldWrapper>
        <FieldWrapper label="Компания">
          <Input
            value={form.clientCompany}
            onChange={(e) =>
              setForm({ ...form, clientCompany: e.target.value })
            }
          />
        </FieldWrapper>
        <FieldWrapper
          label={
            <span className="flex items-center gap-2">
              Email <PiiFieldBadge />
            </span>
          }
        >
          <Input
            value={form.clientEmail}
            onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
          />
        </FieldWrapper>
        <FieldWrapper
          label={
            <span className="flex items-center gap-2">
              Телефон <PiiFieldBadge />
            </span>
          }
        >
          <Input
            value={form.clientPhone}
            onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
          />
        </FieldWrapper>
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? "Сохранение..." : "Сохранить"}
      </Button>
    </form>
  );
}
