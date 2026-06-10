import client from "./client";

export type ReviewMode = "general" | "security" | "performance" | "maintainability";

export interface FindingData {
  title: string;
  detail: string;
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  confidence: number;
  suggested_fix: string;
  file_path: string;
  source: string;
  line_start: number | null;
  line_end: number | null;
}

export interface FileSummaryData {
  filename: string;
  risk_score: number;
  explanation: string;
  change_summary: string;
  categories: string[];
  why_it_matters: string;
  coverage_status: "reviewed" | "skipped";
  skipped_reason: string;
  priority_rank: number;
  reviewed_chars: number;
  total_chars: number;
}

export interface AnalysisData {
  id: number;
  repo_url: string;
  pr_number: number;
  pr_title: string;
  risk_score: number;
  explanation: string;
  executive_summary: string;
  suggestions: string[];
  top_priorities: string[];
  findings: FindingData[];
  file_summaries: FileSummaryData[];
  file_analyses: FileSummaryData[];
  coverage_summary: {
    reviewed_files: string[];
    skipped_files: Array<{ filename: string; reason: string }>;
    truncated_files: string[];
    reviewed_count: number;
    skipped_count: number;
    truncated_count: number;
  };
  model_metadata: {
    review_mode?: string;
    fallback_used?: boolean;
    models_used?: string[];
    heuristic_findings?: number;
    partially_heuristic?: boolean;
    executive_summary?: string;
  };
  review_confidence: number;
  review_mode: ReviewMode;
  status: string;
  created_at: string;
}

export interface AnalysisSummaryData {
  id: number;
  repo_url: string;
  pr_number: number;
  pr_title: string;
  risk_score: number;
  status: string;
  review_mode: ReviewMode;
  review_confidence: number;
  top_priorities: string[];
  created_at: string;
}

export interface JobData {
  id: number;
  repo_url: string;
  pr_number: number;
  review_mode: ReviewMode;
  status: "queued" | "running" | "completed" | "failed";
  stage: string;
  progress: number;
  error_message: string;
  analysis_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface InsightsData {
  most_analyzed_repos: Array<{ repo_url: string; count: number }>;
  average_risk_by_repo: Array<{ repo_url: string; average_risk: number }>;
  recent_high_risk_prs: Array<{
    analysis_id: number;
    repo_url: string;
    pr_number: number;
    risk_score: number;
    created_at: string;
  }>;
}

export interface ComparisonData {
  baseline_analysis_id: number | null;
  current_analysis_id: number;
  risk_delta: number;
  findings_added: string[];
  findings_resolved: string[];
  newly_risky_files: string[];
  model_changed: boolean;
  coverage_changed: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  email: string;
}

export const authApi = {
  register: (email: string, password: string) =>
    client.post<AuthResponse>("/auth/register", { email, password }),
  login: (email: string, password: string) =>
    client.post<AuthResponse>("/auth/login", { email, password }),
  me: () => client.get<{ id: number; email: string }>("/auth/me"),
};

export const analysisApi = {
  analyze: (repo_url: string, pr_number: number, review_mode: ReviewMode) =>
    client.post<AnalysisData | JobData>("/analyze", { repo_url, pr_number, review_mode }),
  createJob: (repo_url: string, pr_number: number, review_mode: ReviewMode) =>
    client.post<JobData>("/analysis-jobs", { repo_url, pr_number, review_mode }),
  getJob: (id: number) => client.get<JobData>(`/analysis-jobs/${id}`),
  getJobResult: (id: number) => client.get<AnalysisData>(`/analysis-jobs/${id}/result`),
  list: (params?: {
    page?: number;
    limit?: number;
    repo?: string;
    status?: string;
    risk_min?: number;
    risk_max?: number;
    sort?: "newest" | "highest_risk";
  }) => client.get<AnalysisSummaryData[]>("/analyses", { params }),
  insights: () => client.get<InsightsData>("/analyses/insights"),
  get: (id: number) => client.get<AnalysisData>(`/analyses/${id}`),
  rerun: (id: number) => client.post<JobData>(`/analyses/${id}/rerun`),
  compare: (id: number, baseline_id?: number) =>
    client.get<ComparisonData>(`/analyses/${id}/compare`, {
      params: baseline_id ? { baseline_id } : undefined,
    }),
  delete: (id: number) => client.delete(`/analyses/${id}`),
  exportUrl: (id: number, format: "json" | "pdf" | "markdown" | "comment" | "executive") =>
    `${import.meta.env.VITE_API_BASE || "http://localhost:8000"}/analyses/${id}/export?format=${format}`,
};
