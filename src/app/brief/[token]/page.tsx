"use client";

import { useEffect, useState } from "react";
import type { BriefField } from "@/types";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Textarea, Select } from "@/components/ui/Input";
import { PrivacyNotice, PiiFieldBadge } from "@/components/PrivacyNotice";

interface BriefData {
  token: string;
  title: string;
  description: string;
  clientDisplayName: string;
  briefFields: BriefField[];
  isCompleted: boolean;
  isProposalPublished: boolean;
}

export default function BriefPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [brief, setBrief] = useState<BriefData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pdConsent, setPdConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/brief/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Бриф не найден");
        return res.json();
      })
      .then((data) => {
        setBrief(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Бриф не найден или ссылка устарела");
        setLoading(false);
      });
  }, [token]);

  function updateAnswer(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    if (!pdConsent) {
      setError(
        "Необходимо согласие на обработку персональных данных (152-ФЗ РФ)"
      );
      return;
    }

    setSubmitting(true);
    setError("");

    const res = await fetch(`/api/brief/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, pdConsent: true }),
    });

    const data = await res.json();
    if (res.ok) {
      setSuccess(true);
      setSubmitting(false);
    } else {
      setError(data.error || "Ошибка отправки");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted">Загрузка...</div>
      </div>
    );
  }

  if (error && !brief) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Бриф не найден</h1>
          <p className="text-muted">{error}</p>
        </div>
      </div>
    );
  }

  if (!brief) return null;

  if (success || (brief.isCompleted && !success)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="bg-white rounded-2xl border border-border shadow-lg p-8 max-w-md text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-bold mb-2">
            {success ? "Бриф отправлен!" : "Бриф уже заполнен"}
          </h1>
          <p className="text-muted mb-6">
            {brief.isProposalPublished
              ? "Спасибо! Ваше коммерческое предложение готово."
              : "Спасибо! Мы получили ваш бриф и готовим коммерческое предложение. Мы свяжемся с вами, когда оно будет готово."}
          </p>
          {brief.isProposalPublished && (
            <a href={`/proposal/${brief.token}`}>
              <Button className="w-full">Посмотреть предложение</Button>
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">Б</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {brief.title}
          </h1>
          {brief.description && (
            <p className="text-muted max-w-lg mx-auto">{brief.description}</p>
          )}
          <p className="text-sm text-muted mt-3">
            Здравствуйте, {brief.clientDisplayName}! Заполните бриф, чтобы мы
            подготовили для вас коммерческое предложение.
          </p>
        </div>

        <div className="mb-6 animate-fade-in">
          <PrivacyNotice />
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-border shadow-lg p-6 sm:p-8 space-y-6 animate-fade-in"
        >
          {brief.briefFields.map((field) => (
            <FieldWrapper
              key={field.id}
              label={
                <span className="flex items-center gap-2">
                  {field.label}
                  {field.isPersonalData && <PiiFieldBadge />}
                </span>
              }
              required={field.required}
              hint={
                field.isPersonalData
                  ? "Зашифровано · не передаётся в ИИ · подставляется после генерации"
                  : undefined
              }
            >
              {field.type === "textarea" ? (
                <Textarea
                  value={answers[field.variableKey] || ""}
                  onChange={(e) =>
                    updateAnswer(field.variableKey, e.target.value)
                  }
                  placeholder={field.placeholder}
                  required={field.required}
                />
              ) : field.type === "select" ? (
                <Select
                  value={answers[field.variableKey] || ""}
                  onChange={(e) =>
                    updateAnswer(field.variableKey, e.target.value)
                  }
                  required={field.required}
                >
                  <option value="">Выберите...</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  type={field.type}
                  value={answers[field.variableKey] || ""}
                  onChange={(e) =>
                    updateAnswer(field.variableKey, e.target.value)
                  }
                  placeholder={field.placeholder}
                  required={field.required}
                />
              )}
            </FieldWrapper>
          ))}

          <PrivacyNotice
            variant="banner"
            showConsent
            consentChecked={pdConsent}
            onConsentChange={setPdConsent}
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
              {error}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting || !pdConsent}
          >
            {submitting ? "Отправка..." : "Отправить бриф"}
          </Button>

          <p className="text-xs text-center text-muted">
            Персональные данные защищены и не передаются в ИИ. После отправки мы
            подготовим коммерческое предложение и направим вам ссылку.
          </p>
        </form>
      </div>
    </div>
  );
}
