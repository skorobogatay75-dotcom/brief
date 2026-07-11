"use client";

import type { BriefField, BriefFieldType } from "@/types";
import { generateFieldId } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input, Select } from "@/components/ui/Input";
import { PiiFieldBadge } from "@/components/PrivacyNotice";
import { isPersonalDataField } from "@/lib/personal-data";

const FIELD_TYPES: { value: BriefFieldType; label: string }[] = [
  { value: "text", label: "Текст" },
  { value: "textarea", label: "Многострочный текст" },
  { value: "email", label: "Email" },
  { value: "number", label: "Число" },
  { value: "date", label: "Дата" },
  { value: "select", label: "Выбор из списка" },
];

interface BriefFieldEditorProps {
  fields: BriefField[];
  onChange: (fields: BriefField[]) => void;
}

export function BriefFieldEditor({ fields, onChange }: BriefFieldEditorProps) {
  function updateField(index: number, updates: Partial<BriefField>) {
    const next = fields.map((f, i) =>
      i === index ? { ...f, ...updates } : f
    );
    onChange(next);
  }

  function addField() {
    const id = generateFieldId();
    onChange([
      ...fields,
      {
        id,
        label: "Новое поле",
        type: "text",
        required: false,
        variableKey: `field_${id}`,
        placeholder: "",
      },
    ]);
  }

  function removeField(index: number) {
    onChange(fields.filter((_, i) => i !== index));
  }

  function moveField(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const next = [...fields];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="border border-border rounded-lg p-4 bg-slate-50/50 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted flex items-center gap-2">
              Поле {index + 1}
              {(field.isPersonalData || isPersonalDataField(field)) && (
                <PiiFieldBadge />
              )}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveField(index, -1)}
                disabled={index === 0}
                className="p-1 text-muted hover:text-foreground disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveField(index, 1)}
                disabled={index === fields.length - 1}
                className="p-1 text-muted hover:text-foreground disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeField(index)}
                className="p-1 text-red-500 hover:text-red-700 text-sm"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <FieldWrapper label="Название поля">
              <Input
                value={field.label}
                onChange={(e) => updateField(index, { label: e.target.value })}
              />
            </FieldWrapper>
            <FieldWrapper label="Тип">
              <Select
                value={field.type}
                onChange={(e) =>
                  updateField(index, {
                    type: e.target.value as BriefFieldType,
                  })
                }
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper
              label="Ключ переменной"
              hint="Используется в шаблоне КП: {{ключ}}"
            >
              <Input
                value={field.variableKey}
                onChange={(e) =>
                  updateField(index, { variableKey: e.target.value })
                }
              />
            </FieldWrapper>
            <FieldWrapper label="Подсказка">
              <Input
                value={field.placeholder || ""}
                onChange={(e) =>
                  updateField(index, { placeholder: e.target.value })
                }
              />
            </FieldWrapper>
          </div>

          {field.type === "select" && (
            <FieldWrapper label="Варианты (через запятую)">
              <Input
                value={field.options?.join(", ") || ""}
                onChange={(e) =>
                  updateField(index, {
                    options: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </FieldWrapper>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) =>
                updateField(index, { required: e.target.checked })
              }
              className="rounded border-border"
            />
            Обязательное поле
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={field.isPersonalData ?? isPersonalDataField(field)}
              onChange={(e) =>
                updateField(index, { isPersonalData: e.target.checked })
              }
              className="rounded border-emerald-300"
            />
            <span className="text-emerald-800">
              Персональные данные (152-ФЗ) — шифруются, не передаются в ИИ
            </span>
          </label>
        </div>
      ))}

      <Button type="button" variant="secondary" onClick={addField}>
        + Добавить поле
      </Button>
    </div>
  );
}
