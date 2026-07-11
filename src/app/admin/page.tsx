import { isAuthenticated } from "@/lib/auth";
import { prisma, serializeProject } from "@/lib/db";
import { LoginForm } from "@/components/LoginForm";
import { AdminLayout } from "@/components/AdminLayout";
import { ProjectsTable } from "@/components/ProjectsTable";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ExportExcelButton } from "@/components/ExportExcelButton";

export default async function AdminPage() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    return <LoginForm />;
  }

  const rows = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });
  const projects = rows.map(serializeProject);

  const stats = {
    total: projects.length,
    draft: projects.filter((p) => p.status === "draft").length,
    sent: projects.filter((p) => p.status === "brief_sent").length,
    completed: projects.filter((p) => p.status === "brief_completed").length,
    published: projects.filter((p) => p.status === "proposal_ready").length,
    pipeline: projects.reduce((sum, p) => sum + p.dealAmount * (p.dealProbability / 100), 0),
    reminders: projects.filter(
      (p) => p.reminderAt && new Date(p.reminderAt) <= new Date()
    ).length,
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Учёт проектов</h1>
          <p className="text-muted mt-1">
            Брифы, коммерческие предложения и воронка продаж
          </p>
        </div>
        <div className="flex gap-3">
          <ExportExcelButton
            href="/api/projects/export"
            label="Скачать все в Excel"
          />
          <Link href="/admin/projects/new">
            <Button>+ Новый проект</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: "Всего", value: stats.total, color: "text-foreground" },
          { label: "Черновики", value: stats.draft, color: "text-gray-600" },
          { label: "Бриф отправлен", value: stats.sent, color: "text-blue-600" },
          { label: "Ждут КП", value: stats.completed, color: "text-amber-600" },
          { label: "КП отправлено", value: stats.published, color: "text-green-600" },
          {
            label: "Воронка, ₽",
            value: Math.round(stats.pipeline).toLocaleString("ru-RU"),
            color: "text-indigo-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-border p-4"
          >
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-sm text-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      {stats.reminders > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Напоминания: {stats.reminders} проект(ов) требуют внимания
        </div>
      )}

      <div className="mb-6">
        <PrivacyNotice variant="compact" />
      </div>

      <ProjectsTable projects={projects} />
    </AdminLayout>
  );
}
