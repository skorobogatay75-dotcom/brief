interface PrivacyNoticeProps {
  variant?: "banner" | "compact" | "inline";
  showConsent?: boolean;
  consentChecked?: boolean;
  onConsentChange?: (checked: boolean) => void;
}

export function PrivacyNotice({
  variant = "banner",
  showConsent = false,
  consentChecked = false,
  onConsentChange,
}: PrivacyNoticeProps) {
  const content = (
    <>
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm"
          aria-hidden
        >
          🔒
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-medium text-emerald-900">
            Персональные данные защищены (152-ФЗ РФ)
          </p>
          <ul className="text-emerald-800/90 space-y-1 list-disc list-inside text-xs sm:text-sm">
            <li>
              ФИО, телефон и email <strong>шифруются</strong> при хранении
              (AES-256-GCM)
            </li>
            <li>
              Персональные данные <strong>не передаются в ИИ</strong> при
              генерации брифа и КП
            </li>
            <li>
              ПДн подставляются в итоговый документ <strong>только после</strong>{" "}
              генерации, локально на сервере
            </li>
          </ul>
        </div>
      </div>

      {showConsent && onConsentChange && (
        <label className="flex items-start gap-2 mt-4 cursor-pointer group">
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={(e) => onConsentChange(e.target.checked)}
            className="mt-1 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
            required
          />
          <span className="text-xs sm:text-sm text-emerald-900 group-hover:text-emerald-950">
            Я даю согласие на обработку персональных данных в соответствии с{" "}
            <a href="/privacy" className="underline hover:no-underline" target="_blank">
              политикой конфиденциальности
            </a>{" "}
            и 152-ФЗ РФ. Данные не передаются в системы искусственного интеллекта.
          </span>
        </label>
      )}
    </>
  );

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
        <span aria-hidden>🔒</span>
        <span>
          ПДн защищены · не передаются в ИИ · 152-ФЗ
        </span>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <p className="text-xs text-muted">
        🔒 Персональные данные шифруются и не передаются в ИИ.{" "}
        <a href="/privacy" className="text-primary hover:underline">
          Подробнее
        </a>
      </p>
    );
  }

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 sm:p-5">
      {content}
    </div>
  );
}

export function PiiFieldBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
      <span aria-hidden>🔒</span>
      ПДн
    </span>
  );
}
