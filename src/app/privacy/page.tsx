import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="text-sm text-primary hover:underline mb-8 inline-block"
        >
          ← На главную
        </Link>

        <h1 className="text-3xl font-bold mb-2">
          Политика обработки персональных данных
        </h1>
        <p className="text-muted mb-8">
          В соответствии с Федеральным законом № 152-ФЗ «О персональных данных»
        </p>

        <div className="bg-white rounded-xl border border-border p-6 sm:p-8 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Общие положения</h2>
            <p className="text-muted">
              Платформа Brief & КП обрабатывает персональные данные клиентов
              (ФИО, номер телефона, адрес электронной почты) исключительно для
              формирования брифа и коммерческого предложения.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. Защита данных</h2>
            <ul className="text-muted space-y-2 list-disc list-inside">
              <li>
                Персональные данные хранятся в зашифрованном виде (алгоритм
                AES-256-GCM)
              </li>
              <li>Ключ шифрования хранится отдельно от базы данных</li>
              <li>Доступ к расшифрованным данным имеет только администратор</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              3. Исключение передачи в ИИ
            </h2>
            <p className="text-muted">
              При генерации брифа и коммерческого предложения персональные данные{" "}
              <strong className="text-foreground">не передаются</strong> в
              системы искусственного интеллекта. В процесс генерации
              поступают только обезличенные данные о проекте. Персональные
              данные подставляются в итоговый документ автоматически и
              локально, <strong className="text-foreground">после</strong>{" "}
              завершения генерации.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Согласие</h2>
            <p className="text-muted">
              Перед отправкой брифа клиент даёт явное согласие на обработку
              персональных данных. Дата и время согласия фиксируются в системе.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Права субъекта ПДн</h2>
            <p className="text-muted">
              Вы вправе запросить уточнение, блокирование или удаление ваших
              персональных данных, обратившись к администратору платформы.
            </p>
          </section>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-800">
            <strong>Гарантия:</strong> ваши ФИО, телефон и email никогда не
            отправляются в ИИ-сервисы. Они используются только для подстановки в
            готовый результат.
          </div>
        </div>
      </div>
    </div>
  );
}
