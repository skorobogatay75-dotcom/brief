"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BriefField } from "@/types";
import { AdminLayout } from "@/components/AdminLayout";
import { BriefFieldEditor } from "@/components/BriefFieldEditor";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Textarea } from "@/components/ui/Input";
import { DEFAULT_BRIEF_FIELDS } from "@/lib/utils";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [briefFields, setBriefFields] = useState<BriefField[]>(
    () => DEFAULT_BRIEF_FIELDS.map((field) => ({ ...field }))
  );
  const [form, setForm] = useState({
    title: "",
    description: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientCompany: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, briefFields }),
    });

    if (res.ok) {
      const project = await res.json();
      router.push(`/admin/projects/${project.id}`);
    } else {
      const data = await res.json();
      setError(data.error || "Ошибка создания");
      setLoading(false);
    }
  }

  return (
    <AdminLayout>
      <Card className="max-w-3xl">
        <CardHeader
          title="Новый проект"
          description="Заполните данные, настройте вопросы брифа и отправьте ссылку клиенту"
        />

        <form onSubmit={handleSubmit} className="space-y-5">
          <FieldWrapper label="Название проекта" required>
            <Input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Например: Корпоративный сайт"
              required
            />
          </FieldWrapper>

          <FieldWrapper label="Описание проекта">
            <Textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Краткое описание для коммерческого предложения"
            />
          </FieldWrapper>

          <div className="border-t border-border pt-5">
            <h3 className="text-sm font-semibold mb-2">Данные клиента</h3>
            <p className="text-xs text-muted mb-4">
              🔒 ФИО, email и телефон шифруются (AES-256-GCM) и не передаются в
              ИИ при генерации КП
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <FieldWrapper label="Имя клиента" required>
                <Input
                  value={form.clientName}
                  onChange={(e) => update("clientName", e.target.value)}
                  placeholder="Иван Иванов"
                  required
                />
              </FieldWrapper>
              <FieldWrapper label="Компания">
                <Input
                  value={form.clientCompany}
                  onChange={(e) => update("clientCompany", e.target.value)}
                  placeholder="ООО Компания"
                />
              </FieldWrapper>
              <FieldWrapper label="Email">
                <Input
                  type="email"
                  value={form.clientEmail}
                  onChange={(e) => update("clientEmail", e.target.value)}
                  placeholder="client@example.com"
                />
              </FieldWrapper>
              <FieldWrapper label="Телефон">
                <Input
                  value={form.clientPhone}
                  onChange={(e) => update("clientPhone", e.target.value)}
                  placeholder="+7 (999) 123-45-67"
                />
              </FieldWrapper>
            </div>
          </div>

          <div className="border-t border-border pt-5">
            <h3 className="text-sm font-semibold mb-1">Вопросы брифа</h3>
            <p className="text-xs text-muted mb-4">
              Настройте поля до отправки клиенту: добавляйте, удаляйте и меняйте
              вопросы. После заполнения брифа клиентом редактирование будет
              недоступно.
            </p>
            <BriefFieldEditor fields={briefFields} onChange={setBriefFields} />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Создание..." : "Создать проект"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Отмена
            </Button>
          </div>
        </form>
      </Card>
    </AdminLayout>
  );
}
