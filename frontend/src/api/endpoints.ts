import client from "./client";

export interface FileAnalysisData {
  filename: string;
  risk_score: number;
  explanation: string;
}

export interface AnalysisData {
  id: number;
  repo_url: string;
  pr_number: number;
  pr_title: string;
  risk_score: number;
  explanation: string;
  suggestions: string[];
  file_analyses: FileAnalysisData[];
  created_at: string;
}

export interface AnalysisSummaryData {
  id: number;
  repo_url: string;
  pr_number: number;
  pr_title: string;
  risk_score: number;
  created_at: string;
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
  analyze: (repo_url: string, pr_number: number) =>
    client.post<AnalysisData>("/analyze", { repo_url, pr_number }),
  list: (page = 1, limit = 20) =>
    client.get<AnalysisSummaryData[]>("/analyses", { params: { page, limit } }),
  get: (id: number) => client.get<AnalysisData>(`/analyses/${id}`),
  delete: (id: number) => client.delete(`/analyses/${id}`),
  exportUrl: (id: number, format: "json" | "pdf") =>
    `${import.meta.env.VITE_API_BASE || "http://localhost:8000"}/analyses/${id}/export?format=${format}`,
};
