"use client";

import { useEffect, useState } from "react";
import type { ProposalSection } from "@/types";

interface ProposalData {
  title: string;
  clientName: string;
  clientCompany: string;
  sections: ProposalSection[];
  completedAt: string | null;
}

function renderMarkdown(text: string) {
  return text
    .split("\n")
    .map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <p
            key={i}
            className="font-semibold"
            dangerouslySetInnerHTML={{ __html: bold }}
          />
        );
      }
      return (
        <p
          key={i}
          className="leading-relaxed"
          dangerouslySetInnerHTML={{ __html: bold }}
        />
      );
    });
}

function SectionRenderer({ section }: { section: ProposalSection }) {
  switch (section.type) {
    case "hero":
      return (
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white py-20 sm:py-28">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-4xl mx-auto px-6 text-center">
            <h1 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
              {section.title}
            </h1>
            <div className="text-lg sm:text-xl text-indigo-100 space-y-2">
              {renderMarkdown(section.content)}
            </div>
          </div>
        </section>
      );

    case "features":
      return (
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              {section.title}
            </h2>
            <p className="text-muted mb-8">{section.content}</p>
            <div className="grid gap-4">
              {section.items?.map((item, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-5 rounded-xl bg-slate-50 border border-border"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="text-foreground whitespace-pre-wrap">
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case "timeline":
      return (
        <section className="py-16 sm:py-20 bg-slate-50">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              {section.title}
            </h2>
            <p className="text-muted mb-8">{section.content}</p>
            <div className="space-y-4">
              {section.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
                  <div className="flex-1 p-4 bg-white rounded-lg border border-border">
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case "pricing":
      return (
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-4xl mx-auto px-6">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-8 sm:p-12 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                {section.title}
              </h2>
              <div className="text-lg text-foreground space-y-2">
                {renderMarkdown(section.content)}
              </div>
            </div>
          </div>
        </section>
      );

    case "cta":
      return (
        <section className="py-16 sm:py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              {section.title}
            </h2>
            <div className="text-lg text-indigo-100 mb-8 space-y-2">
              {renderMarkdown(section.content)}
            </div>
            <a
              href="mailto:"
              className="inline-flex items-center px-8 py-3 bg-white text-primary font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
            >
              Связаться с нами
            </a>
          </div>
        </section>
      );

    default:
      return (
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
              {section.title}
            </h2>
            <div className="text-muted space-y-3 text-lg">
              {renderMarkdown(section.content)}
            </div>
          </div>
        </section>
      );
  }
}

export default function ProposalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/proposal/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Не найдено");
        return res.json();
      })
      .then((data) => {
        setProposal(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Коммерческое предложение ещё не сформировано");
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted">Загрузка предложения...</div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Предложение недоступно</h1>
          <p className="text-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {proposal.sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
      <footer className="py-8 bg-slate-900 text-slate-400 text-center text-sm space-y-2">
        <p>
          Коммерческое предложение для {proposal.clientCompany || proposal.clientName}
        </p>
        <p className="text-xs text-emerald-400/80">
          🔒 Персональные данные защищены (152-ФЗ). Не передавались в ИИ —
          подставлены локально после генерации.
        </p>
        {proposal.completedAt && (
          <p className="text-xs">
            Сформировано{" "}
            {new Date(proposal.completedAt).toLocaleDateString("ru-RU")}
          </p>
        )}
      </footer>
    </div>
  );
}
