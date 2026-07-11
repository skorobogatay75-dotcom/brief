"use client";

import type { ProposalSection } from "@/types";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Textarea, Select } from "@/components/ui/Input";

const SECTION_TYPES: { value: ProposalSection["type"]; label: string }[] = [
  { value: "hero", label: "Обложка" },
  { value: "text", label: "Текст" },
  { value: "features", label: "Список / функции" },
  { value: "timeline", label: "Сроки" },
  { value: "pricing", label: "Стоимость" },
  { value: "cta", label: "Призыв к действию" },
];

interface ProposalSectionEditorProps {
  sections: ProposalSection[];
  onChange: (sections: ProposalSection[]) => void;
}

export function ProposalSectionEditor({
  sections,
  onChange,
}: ProposalSectionEditorProps) {
  function updateSection(index: number, updates: Partial<ProposalSection>) {
    onChange(
      sections.map((section, i) =>
        i === index ? { ...section, ...updates } : section
      )
    );
  }

  function moveSection(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sections.length) return;
    const next = [...sections];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <div
          key={section.id}
          className="border border-border rounded-lg p-4 bg-slate-50/50 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">
              Секция {index + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveSection(index, -1)}
                disabled={index === 0}
                className="p-1 text-muted hover:text-foreground disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveSection(index, 1)}
                disabled={index === sections.length - 1}
                className="p-1 text-muted hover:text-foreground disabled:opacity-30"
              >
                ↓
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <FieldWrapper label="Тип секции">
              <Select
                value={section.type}
                onChange={(e) =>
                  updateSection(index, {
                    type: e.target.value as ProposalSection["type"],
                  })
                }
              >
                {SECTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Заголовок">
              <Input
                value={section.title}
                onChange={(e) =>
                  updateSection(index, { title: e.target.value })
                }
              />
            </FieldWrapper>
          </div>

          <FieldWrapper label="Содержание">
            <Textarea
              value={section.content}
              onChange={(e) =>
                updateSection(index, { content: e.target.value })
              }
              rows={4}
            />
          </FieldWrapper>

          {(section.type === "features" || section.type === "timeline") && (
            <FieldWrapper label="Пункты списка (каждый с новой строки)">
              <Textarea
                value={section.items?.join("\n") || ""}
                onChange={(e) =>
                  updateSection(index, {
                    items: e.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean),
                  })
                }
                rows={4}
              />
            </FieldWrapper>
          )}
        </div>
      ))}

      {sections.length === 0 && (
        <p className="text-sm text-muted">
          КП ещё не сгенерировано. Нажмите «Сгенерировать из брифа».
        </p>
      )}
    </div>
  );
}
