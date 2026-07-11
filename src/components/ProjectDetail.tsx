"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Project, BriefField, ProjectHistoryEntry } from "@/types";
import { AdminLayout } from "@/components/AdminLayout";
import { BriefFieldEditor } from "@/components/BriefFieldEditor";
import { ProposalSectionEditor } from "@/components/ProposalSectionEditor";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { FieldWrapper, Input, Textarea } from "@/components/ui/Input";
import { getBriefUrl, getProposalUrl } from "@/lib/utils";
import { mergeBriefAnswers } from "@/lib/personal-data";
import { PrivacyNotice, PiiFieldBadge } from "@/components/PrivacyNotice";
import { isPersonalDataField } from "@/lib/personal-data";
import { HISTORY_LABELS } from "@/lib/history";

interface ProjectDetailProps {
  project: Project;
}

type TabId = "info" | "brief" | "answers" | "proposal" | "accounting";

export function ProjectDetail({ project: initial }: ProjectDetailProps) {
  const router = useRouter();
  const [project, setProject] = useState(initial);
  const [tab, setTab] = useState<TabId>(
    initial.status === "draft"
      ? "brief"
      : initial.status === "brief_completed"
        ? "proposal"
        : "info"
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ProjectHistoryEntry[]>([]);

  const briefUrl = getBriefUrl(project.token);
  const proposalUrl = getProposalUrl(project.token);
  const hasAnswers =
    Object.keys(project.briefAnswers).length > 0 ||
    Object.keys(project.piiAnswers).length > 0;
  const allAnswers = mergeBriefAnswers(project);
  const canEditBrief =
    !hasAnswers &&
    (project.status === "draft" || project.status === "brief_sent");
  const isProposalPublished = project.status === "proposal_ready";
  const hasProposalDraft = project.proposalSections.length > 0;

  useEffect(() => {
    fetch(`/api/projects/${project.id}/history`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setHistory);
  }, [project.id, project.updatedAt]);

  async function save(updates: Record<string, unknown>) {
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
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "Ошибка сохранения");
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

  const tabs: { id: TabId; label: string }[] = [
    { id: "info", label: "Проект" },
    { id: "brief", label: "Бриф" },
    ...(hasAnswers ? [{ id: "answers" as const, label: "Ответы" }] : []),
    ...(hasAnswers ? [{ id: "proposal" as const, label: "КП" }] : []),
    { id: "accounting", label: "Учёт" },
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
        <div className="flex gap-2">
          <ExportExcelButton
            href={`/api/projects/${project.id}/export`}
            label="Скачать Excel"
          />
          <Button variant="danger" size="sm" onClick={handleDelete}>
            Удалить
          </Button>
        </div>
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
            {isProposalPublished && (
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
              <div>
                Создан: {new Date(project.createdAt).toLocaleString("ru-RU")}
              </div>
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
            <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg mt-4">
              Бриф ещё не отправлен. Настройте вопросы на вкладке «Бриф».
            </p>
          )}

          {project.status === "brief_completed" && (
            <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg mt-4">
              КП сгенерировано. Проверьте и отредактируйте на вкладке «КП», затем
              опубликуйте для клиента.
            </p>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
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
            <ProjectInfoForm project={project} onSave={save} saving={saving} />
          )}

          {tab === "brief" && (
            <div>
              {canEditBrief ? (
                <>
                  <p className="text-sm text-muted mb-4">
                    Настройте вопросы брифа перед отправкой клиенту.
                  </p>
                  <BriefFieldEditor
                    fields={project.briefFields}
                    onChange={(fields) =>
                      setProject({ ...project, briefFields: fields })
                    }
                  />
                  <div className="flex flex-wrap gap-3 mt-4">
                    <Button
                      onClick={() => save({ briefFields: project.briefFields })}
                      disabled={saving}
                      variant="secondary"
                    >
                      {saving ? "Сохранение..." : "Сохранить вопросы"}
                    </Button>
                    {project.status === "draft" && (
                      <Button
                        onClick={() =>
                          save({
                            briefFields: project.briefFields,
                            status: "brief_sent",
                          })
                        }
                        disabled={saving}
                      >
                        {saving ? "Отправка..." : "Сохранить и отправить клиенту"}
                      </Button>
                    )}
                    {project.status === "brief_sent" && (
                      <Button
                        onClick={() => copyLink(briefUrl)}
                        variant="secondary"
                      >
                        Скопировать ссылку на бриф
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted mb-4">
                    Клиент уже заполнил бриф — вопросы больше нельзя изменить.
                  </p>
                  <BriefFieldsReadOnly fields={project.briefFields} />
                </>
              )}
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
            </div>
          )}

          {tab === "proposal" && hasAnswers && (
            <div>
              <p className="text-sm text-muted mb-4">
                {isProposalPublished
                  ? "КП опубликовано и доступно клиенту по ссылке. Вы можете продолжить редактирование и сохранить изменения."
                  : "КП сгенерировано автоматически после заполнения брифа. Отредактируйте текст и опубликуйте, когда будете готовы отправить клиенту."}
              </p>

              <ProposalSectionEditor
                sections={project.proposalSections}
                onChange={(sections) =>
                  setProject({ ...project, proposalSections: sections })
                }
              />

              <div className="flex flex-wrap gap-3 mt-4">
                {!hasProposalDraft && (
                  <Button
                    onClick={() => save({ regenerateProposal: true })}
                    disabled={saving}
                  >
                    {saving ? "Генерация..." : "Сгенерировать из брифа"}
                  </Button>
                )}
                {hasProposalDraft && (
                  <>
                    <Button
                      onClick={() =>
                        save({ proposalSections: project.proposalSections })
                      }
                      disabled={saving}
                      variant="secondary"
                    >
                      {saving ? "Сохранение..." : "Сохранить КП"}
                    </Button>
                    <Button
                      onClick={() => save({ regenerateProposal: true })}
                      disabled={saving}
                      variant="secondary"
                    >
                      Перегенерировать
                    </Button>
                    <a
                      href={proposalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="secondary" type="button">
                        Предпросмотр
                      </Button>
                    </a>
                    {!isProposalPublished && (
                      <Button
                        onClick={() =>
                          save({
                            proposalSections: project.proposalSections,
                            publishProposal: true,
                          })
                        }
                        disabled={saving}
                      >
                        {saving
                          ? "Публикация..."
                          : "Опубликовать и отправить клиенту"}
                      </Button>
                    )}
                    {isProposalPublished && (
                      <Button
                        onClick={() => copyLink(proposalUrl)}
                        variant="secondary"
                      >
                        Скопировать ссылку на КП
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {tab === "accounting" && (
            <AccountingForm
              project={project}
              history={history}
              onSave={save}
              saving={saving}
            />
          )}

          {message && (
            <p className="text-sm text-green-600 mt-4">{message}</p>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}

function BriefFieldsReadOnly({ fields }: { fields: BriefField[] }) {
  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="border border-border rounded-lg p-4 bg-slate-50/50"
        >
          <div className="text-sm font-medium flex items-center gap-2">
            {index + 1}. {field.label}
            {(field.isPersonalData || isPersonalDataField(field)) && (
              <PiiFieldBadge />
            )}
            {field.required && (
              <span className="text-xs text-red-500">обязательное</span>
            )}
          </div>
          {field.placeholder && (
            <p className="text-xs text-muted mt-1">{field.placeholder}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function AccountingForm({
  project,
  history,
  onSave,
  saving,
}: {
  project: Project;
  history: ProjectHistoryEntry[];
  onSave: (data: Record<string, unknown>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    dealAmount: project.dealAmount,
    dealProbability: project.dealProbability,
    notes: project.notes,
    reminderAt: project.reminderAt ? project.reminderAt.slice(0, 16) : "",
    reminderNote: project.reminderNote,
  });

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            dealAmount: form.dealAmount,
            dealProbability: form.dealProbability,
            notes: form.notes,
            reminderAt: form.reminderAt
              ? new Date(form.reminderAt).toISOString()
              : null,
            reminderNote: form.reminderNote,
          });
        }}
        className="space-y-4"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <FieldWrapper label="Сумма сделки, ₽">
            <Input
              type="number"
              min={0}
              step={1000}
              value={form.dealAmount || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  dealAmount: Number(e.target.value) || 0,
                })
              }
            />
          </FieldWrapper>
          <FieldWrapper label="Вероятность сделки, %">
            <Input
              type="number"
              min={0}
              max={100}
              value={form.dealProbability}
              onChange={(e) =>
                setForm({
                  ...form,
                  dealProbability: Number(e.target.value) || 0,
                })
              }
            />
          </FieldWrapper>
        </div>

        <FieldWrapper label="Заметки">
          <Textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={4}
            placeholder="Договорённости, контекст, следующие шаги..."
          />
        </FieldWrapper>

        <div className="grid sm:grid-cols-2 gap-4">
          <FieldWrapper label="Напоминание">
            <Input
              type="datetime-local"
              value={form.reminderAt}
              onChange={(e) =>
                setForm({ ...form, reminderAt: e.target.value })
              }
            />
          </FieldWrapper>
          <FieldWrapper label="Текст напоминания">
            <Input
              value={form.reminderNote}
              onChange={(e) =>
                setForm({ ...form, reminderNote: e.target.value })
              }
              placeholder="Например: позвонить клиенту"
            />
          </FieldWrapper>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? "Сохранение..." : "Сохранить учёт"}
        </Button>
      </form>

      <div>
        <h3 className="text-sm font-semibold mb-3">История изменений</h3>
        {history.length === 0 ? (
          <p className="text-sm text-muted">Записей пока нет</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex gap-3 text-sm border-b border-border pb-2 last:border-0"
              >
                <span className="text-xs text-muted whitespace-nowrap">
                  {new Date(entry.createdAt).toLocaleString("ru-RU")}
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
    </div>
  );
}

function ProjectInfoForm({
  project,
  onSave,
  saving,
}: {
  project: Project;
  onSave: (data: Record<string, unknown>) => void;
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
