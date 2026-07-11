import { isAuthenticated } from "@/lib/auth";
import { prisma, serializeProject } from "@/lib/db";
import { LoginForm } from "@/components/LoginForm";
import { AdminLayout } from "@/components/AdminLayout";
import { ProjectsTable } from "@/components/ProjectsTable";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

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
    completed: projects.filter(
      (p) => p.status === "brief_completed" || p.status === "proposal_ready"
    ).length,
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Проекты</h1>
          <p className="text-muted mt-1">
            Управление брифами и коммерческими предложениями
          </p>
        </div>
        <Link href="/admin/projects/new">
          <Button>+ Новый проект</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Всего", value: stats.total, color: "text-foreground" },
          { label: "Черновики", value: stats.draft, color: "text-gray-600" },
          { label: "Отправлено", value: stats.sent, color: "text-blue-600" },
          { label: "Заполнено", value: stats.completed, color: "text-green-600" },
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

      <div className="mb-6">
        <PrivacyNotice variant="compact" />
      </div>

      <ProjectsTable projects={projects} />
    </AdminLayout>
  );
}
