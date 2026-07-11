import { notFound } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { prisma, serializeProject } from "@/lib/db";
import { LoginForm } from "@/components/LoginForm";
import { ProjectDetail } from "@/components/ProjectDetail";

type Params = { params: Promise<{ id: string }> };

export default async function ProjectPage({ params }: Params) {
  const authenticated = await isAuthenticated();
  if (!authenticated) return <LoginForm />;

  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });

  if (!project) notFound();

  return <ProjectDetail project={serializeProject(project)} />;
}
