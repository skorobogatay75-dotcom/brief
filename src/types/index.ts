export type BriefFieldType =
  | "text"
  | "textarea"
  | "select"
  | "number"
  | "email"
  | "date";

export interface BriefField {
  id: string;
  label: string;
  type: BriefFieldType;
  placeholder?: string;
  required: boolean;
  options?: string[];
  variableKey: string;
  /** Персональные данные (152-ФЗ): шифруются, не передаются в генерацию/ИИ */
  isPersonalData?: boolean;
}

export interface ProposalSection {
  id: string;
  type: "hero" | "text" | "features" | "timeline" | "pricing" | "cta";
  title: string;
  content: string;
  items?: string[];
}

export type ProjectStatus =
  | "draft"
  | "brief_sent"
  | "brief_completed"
  | "proposal_ready";

export interface Project {
  id: string;
  token: string;
  title: string;
  description: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany: string;
  status: ProjectStatus;
  briefFields: BriefField[];
  briefAnswers: Record<string, string>;
  /** Расшифрованные ПДн из брифа (только для админа) */
  piiAnswers: Record<string, string>;
  proposalSections: ProposalSection[];
  pdConsentAt: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface CreateProjectInput {
  title: string;
  description?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientCompany?: string;
  briefFields?: BriefField[];
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientCompany?: string;
  status?: ProjectStatus;
  briefFields?: BriefField[];
  proposalSections?: ProposalSection[];
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Черновик",
  brief_sent: "Бриф отправлен",
  brief_completed: "Бриф заполнен",
  proposal_ready: "КП готово",
};

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  brief_sent: "bg-blue-100 text-blue-700",
  brief_completed: "bg-amber-100 text-amber-700",
  proposal_ready: "bg-green-100 text-green-700",
};
