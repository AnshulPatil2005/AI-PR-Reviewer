export function describeApiError(err: any, fallback: string): string {
  const status = err?.response?.status;
  const detail = err?.response?.data?.detail;
  const url = String(err?.config?.url || "");

  if (status === 404 && (url.includes("/analysis-jobs") || url.includes("/analyses/insights"))) {
    return "The frontend is on the v2 API, but the backend deployment is still on the older API. Redeploy the Render backend so it serves the new routes.";
  }

  if (status === 404 && url.includes("/analyses/")) {
    return "This analysis route is not available on the current backend deployment. Redeploy the backend to the v2 API.";
  }

  return detail || fallback;
}
