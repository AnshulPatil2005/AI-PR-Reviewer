import json
import re
from dataclasses import dataclass
from typing import Any

from backend.openrouter_llm import call_llm

REVIEW_MODES = {
    "general": "General code review with balanced focus on correctness, quality, and maintainability.",
    "security": "Prioritize auth, secrets, permissions, unsafe execution, and exposure risks.",
    "performance": "Prioritize query cost, loops, allocations, cache behavior, and scaling risks.",
    "maintainability": "Prioritize readability, cohesion, change impact, and testability.",
}

FINDING_CATEGORIES = {
    "bug risk",
    "security",
    "performance",
    "maintainability",
    "test coverage gap",
    "breaking-change risk",
}
SEVERITY_ORDER = {"low": 1, "medium": 2, "high": 3, "critical": 4}
CRITICAL_PATH_HINTS = {
    "auth": "Touches authentication or access control paths.",
    "config": "Changes shared runtime configuration or environment-sensitive behavior.",
    "migration": "Modifies schema or data migration behavior.",
    "workflow": "Affects CI or deployment workflow behavior.",
    "dependency": "Changes dependency versions or supply-chain surface area.",
}


@dataclass
class ParsedFile:
    filename: str
    diff: str
    added_lines: int
    removed_lines: int
    total_chars: int
    reviewed_chars: int
    truncated: bool
    skip_reason: str
    categories: list[str]
    why_it_matters: str
    priority_score: int


def _json_loads(value: str | None, fallback: Any):
    if not value:
        return fallback
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return fallback


def _severity_score(severity: str) -> int:
    return SEVERITY_ORDER.get(severity.lower(), 2)


def _normalize_category(raw: str) -> str:
    raw = (raw or "").strip().lower()
    if raw in FINDING_CATEGORIES:
        return raw
    if "security" in raw or "secret" in raw or "auth" in raw:
        return "security"
    if "performance" in raw:
        return "performance"
    if "test" in raw:
        return "test coverage gap"
    if "break" in raw or "compat" in raw:
        return "breaking-change risk"
    if "maint" in raw or "readab" in raw:
        return "maintainability"
    return "bug risk"


def _normalize_severity(raw: str) -> str:
    raw = (raw or "").strip().lower()
    if raw in SEVERITY_ORDER:
        return raw
    if raw in {"warn", "warning"}:
        return "medium"
    return "medium"


def parse_files(diff: str, max_chars_per_file: int = 3500) -> list[ParsedFile]:
    files: list[ParsedFile] = []
    current_name: str | None = None
    current_lines: list[str] = []

    def flush():
        if not current_name:
            return
        full_diff = "".join(current_lines)
        added = sum(1 for line in current_lines if line.startswith("+") and not line.startswith("+++"))
        removed = sum(1 for line in current_lines if line.startswith("-") and not line.startswith("---"))
        categories = classify_file_categories(current_name)
        skip_reason = detect_skip_reason(current_name, full_diff)
        why_it_matters = infer_why_it_matters(categories, current_name)
        priority_score = score_file_priority(current_name, added, removed, categories, skip_reason)
        truncated = len(full_diff) > max_chars_per_file
        files.append(
            ParsedFile(
                filename=current_name,
                diff=full_diff[:max_chars_per_file],
                added_lines=added,
                removed_lines=removed,
                total_chars=len(full_diff),
                reviewed_chars=min(len(full_diff), max_chars_per_file),
                truncated=truncated,
                skip_reason=skip_reason,
                categories=categories,
                why_it_matters=why_it_matters,
                priority_score=priority_score,
            )
        )

    for line in diff.splitlines(keepends=True):
        if line.startswith("diff --git "):
            flush()
            parts = line.split(" b/", 1)
            current_name = parts[1].strip() if len(parts) == 2 else line.strip()
            current_lines = [line]
        elif current_name is not None:
            current_lines.append(line)

    flush()
    return files


def classify_file_categories(filename: str) -> list[str]:
    path = filename.lower()
    categories: list[str] = []
    if any(token in path for token in ("auth", "login", "permission", "policy", "jwt", "token")):
        categories.append("auth")
    if any(token in path for token in ("config", ".env", "settings", "docker", "compose", "nginx", "vercel")):
        categories.append("config")
    if any(token in path for token in ("migrat", "schema", "model", "sql")):
        categories.append("migration")
    if any(token in path for token in (".github/workflows", "ci", "pipeline", "deploy")):
        categories.append("workflow")
    if any(token in path for token in ("package.json", "package-lock", "requirements", "poetry.lock", "pyproject")):
        categories.append("dependency")
    if "test" in path:
        categories.append("tests")
    return categories


def infer_why_it_matters(categories: list[str], filename: str) -> str:
    for category in categories:
        if category in CRITICAL_PATH_HINTS:
            return CRITICAL_PATH_HINTS[category]
    if filename.endswith((".md", ".txt")):
        return "Mostly documentation impact unless the PR depends on process or API contract changes here."
    return "Carries application behavior or review-relevant code changes."


def detect_skip_reason(filename: str, file_diff: str) -> str:
    lower_name = filename.lower()
    if "binary files" in file_diff.lower():
        return "binary diff"
    if any(token in lower_name for token in ("package-lock.json", "pnpm-lock.yaml", "yarn.lock", ".min.js", ".min.css")):
        return "generated or lockfile noise"
    if any(token in lower_name for token in ("dist/", "build/", "coverage/", "node_modules/")):
        return "generated build artifact"
    return ""


def score_file_priority(filename: str, added: int, removed: int, categories: list[str], skip_reason: str) -> int:
    if skip_reason:
        return 0
    score = min(added + removed, 40)
    if filename.lower().endswith((".py", ".ts", ".tsx", ".js", ".jsx", ".sql", ".yml", ".yaml")):
        score += 8
    if categories:
        score += 20
    if "tests" in categories:
        score += 4
    return score


def _finding(
    *,
    category: str,
    severity: str,
    title: str,
    detail: str,
    suggested_fix: str,
    file_path: str = "",
    source: str = "heuristic",
    confidence: float = 0.75,
) -> dict[str, Any]:
    return {
        "category": _normalize_category(category),
        "severity": _normalize_severity(severity),
        "title": title,
        "detail": detail,
        "suggested_fix": suggested_fix,
        "file_path": file_path,
        "source": source,
        "confidence": confidence,
        "line_start": None,
        "line_end": None,
    }


def detect_heuristics(files: list[ParsedFile], diff: str) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    secret_pattern = re.compile(r"(api[_-]?key|secret|token|password)\s*[:=]\s*['\"][^'\"]{8,}", re.IGNORECASE)
    subprocess_pattern = re.compile(r"(subprocess\.|os\.system|eval\(|exec\(|Runtime\.getRuntime\(\))")
    raw_sql_pattern = re.compile(r"(SELECT|INSERT|UPDATE|DELETE).*(\+|format\(|f\")", re.IGNORECASE)

    for file in files:
        if file.removed_lines > file.added_lines and "tests" in file.categories:
            findings.append(
                _finding(
                    category="test coverage gap",
                    severity="high",
                    title="Tests removed or weakened",
                    detail="This file removes more test coverage than it adds, which raises regression risk.",
                    suggested_fix="Add or update tests that cover the changed behavior before merging.",
                    file_path=file.filename,
                )
            )
        if "dependency" in file.categories and ("+" in file.diff or "-" in file.diff):
            findings.append(
                _finding(
                    category="breaking-change risk",
                    severity="medium",
                    title="Dependency surface changed",
                    detail="Dependency files changed and may alter runtime behavior, transitive vulnerabilities, or APIs.",
                    suggested_fix="Review changelogs and pin or verify versions with focused smoke tests.",
                    file_path=file.filename,
                )
            )
        if "workflow" in file.categories:
            findings.append(
                _finding(
                    category="maintainability",
                    severity="medium",
                    title="CI or deployment workflow changed",
                    detail="Workflow changes can affect release safety, required checks, or secret handling.",
                    suggested_fix="Validate job triggers, permissions, and required checks against expected branch rules.",
                    file_path=file.filename,
                )
            )
        if "auth" in file.categories:
            findings.append(
                _finding(
                    category="security",
                    severity="high",
                    title="Authentication-sensitive code changed",
                    detail="The PR touches authentication or permission paths where small logic errors can have broad impact.",
                    suggested_fix="Add targeted auth tests and review token, session, and permission edge cases.",
                    file_path=file.filename,
                )
            )
        if "config" in file.categories and "cors" in file.diff.lower():
            findings.append(
                _finding(
                    category="security",
                    severity="high",
                    title="CORS or runtime security settings changed",
                    detail="CORS or environment-sensitive configuration changed and may widen access unexpectedly.",
                    suggested_fix="Verify allowed origins, credentials policy, and environment-specific defaults.",
                    file_path=file.filename,
                )
            )
        if "migration" in file.categories:
            findings.append(
                _finding(
                    category="breaking-change risk",
                    severity="high",
                    title="Schema or migration change detected",
                    detail="Schema-affecting changes can break compatibility or data assumptions if rollout is not coordinated.",
                    suggested_fix="Document migration order, backfill needs, and rollback behavior.",
                    file_path=file.filename,
                )
            )
        if secret_pattern.search(file.diff):
            findings.append(
                _finding(
                    category="security",
                    severity="critical",
                    title="Possible secret committed",
                    detail="The diff appears to include a token, password, or secret-like literal.",
                    suggested_fix="Remove the secret, rotate it if real, and load it from environment or secret storage.",
                    file_path=file.filename,
                    confidence=0.9,
                )
            )
        if subprocess_pattern.search(file.diff):
            findings.append(
                _finding(
                    category="security",
                    severity="high",
                    title="Unsafe command or code execution pattern",
                    detail="The diff includes subprocess, eval, exec, or system-call style behavior that warrants careful validation.",
                    suggested_fix="Constrain inputs, prefer safe APIs, and add negative tests around execution paths.",
                    file_path=file.filename,
                )
            )
        if raw_sql_pattern.search(file.diff):
            findings.append(
                _finding(
                    category="security",
                    severity="high",
                    title="Potential raw SQL string construction",
                    detail="The diff appears to build SQL dynamically, which can introduce injection or correctness risks.",
                    suggested_fix="Use parameterized queries or ORM query builders instead of string-built SQL.",
                    file_path=file.filename,
                )
            )

    if "breaking change" in diff.lower():
        findings.append(
            _finding(
                category="breaking-change risk",
                severity="medium",
                title="Breaking change called out in PR text",
                detail="The PR mentions a breaking change and should surface compatibility expectations explicitly.",
                suggested_fix="Add migration notes, versioning guidance, or consumer rollout steps.",
            )
        )
    return findings


def _llm_prompt_for_file(title: str, description: str, review_mode: str, file: ParsedFile) -> str:
    return f"""Review this pull request file diff and return JSON only.

Required JSON shape:
{{
  "risk_score": 0,
  "change_summary": "One concise sentence.",
  "why_it_matters": "Why this file matters to the review.",
  "issue_categories": ["security", "maintainability"],
  "findings": [
    {{
      "title": "Short finding title",
      "detail": "Why it matters",
      "severity": "low|medium|high|critical",
      "category": "bug risk|security|performance|maintainability|test coverage gap|breaking-change risk",
      "confidence": 0.0,
      "suggested_fix": "Actionable fix"
    }}
  ]
}}

Review mode: {review_mode}
Mode focus: {REVIEW_MODES.get(review_mode, REVIEW_MODES["general"])}
PR title: {title}
PR description: {description or "(no description)"}
File: {file.filename}
Known critical context: {file.why_it_matters}

Diff:
{file.diff}
"""


def review_file_with_llm(title: str, description: str, review_mode: str, file: ParsedFile) -> dict[str, Any]:
    response = call_llm(
        _llm_prompt_for_file(title, description, review_mode, file),
        system_prompt="You are a senior pull request reviewer. Return JSON only.",
    )
    findings: list[dict[str, Any]] = []
    for item in response.get("findings", []) or []:
        if not isinstance(item, dict):
            continue
        findings.append(
            {
                "title": item.get("title", "Review finding"),
                "detail": item.get("detail", response.get("explanation", "Potential risk detected in this file.")),
                "severity": _normalize_severity(item.get("severity", "medium")),
                "category": _normalize_category(item.get("category", "bug risk")),
                "confidence": float(item.get("confidence", 0.65) or 0.65),
                "suggested_fix": item.get("suggested_fix", ""),
                "file_path": file.filename,
                "source": "llm",
                "line_start": None,
                "line_end": None,
            }
        )

    return {
        "filename": file.filename,
        "risk_score": int(response.get("risk_score", 50) or 50),
        "change_summary": response.get("change_summary", response.get("explanation", "File changed in this pull request.")),
        "why_it_matters": response.get("why_it_matters", file.why_it_matters),
        "categories": sorted({_normalize_category(cat) for cat in response.get("issue_categories", []) or []}),
        "findings": findings,
        "meta": response.get("_meta", {}),
    }


def synthesize_report(
    *,
    title: str,
    description: str,
    review_mode: str,
    findings: list[dict[str, Any]],
    file_summaries: list[dict[str, Any]],
) -> dict[str, Any]:
    compact_findings = findings[:8]
    prompt = f"""You are synthesizing a pull request review. Return JSON only.

Required JSON shape:
{{
  "summary": "Two to three sentences.",
  "top_priorities": ["priority 1", "priority 2", "priority 3"],
  "executive_summary": "Plain-language brief for non-technical stakeholders."
}}

Review mode: {review_mode}
PR title: {title}
PR description: {description or "(no description)"}
High-signal findings: {json.dumps(compact_findings)}
Reviewed file summaries: {json.dumps(file_summaries[:6])}
"""
    response = call_llm(
        prompt,
        system_prompt="You summarize engineering review results. Return JSON only.",
    )
    priorities = response.get("top_priorities", [])
    if not isinstance(priorities, list):
        priorities = []
    priorities = [str(item) for item in priorities][:3]

    if not priorities:
        priorities = fallback_priorities(findings)

    return {
        "summary": response.get("summary") or fallback_summary(title, review_mode, findings, file_summaries),
        "top_priorities": priorities,
        "executive_summary": response.get("executive_summary")
        or fallback_executive_summary(review_mode, findings, file_summaries),
        "meta": response.get("_meta", {}),
    }


def fallback_priorities(findings: list[dict[str, Any]]) -> list[str]:
    sorted_findings = sorted(
        findings,
        key=lambda item: (_severity_score(item.get("severity", "medium")), item.get("confidence", 0.0)),
        reverse=True,
    )
    priorities = []
    for finding in sorted_findings[:3]:
        target = finding.get("file_path") or "the PR"
        priorities.append(f"{finding.get('title', 'Review finding')} in {target}")
    return priorities or ["No single critical hotspot surfaced above the baseline review noise."]


def fallback_summary(
    title: str,
    review_mode: str,
    findings: list[dict[str, Any]],
    file_summaries: list[dict[str, Any]],
) -> str:
    severe = sum(1 for item in findings if _severity_score(item.get("severity", "medium")) >= 3)
    reviewed = sum(1 for file in file_summaries if file.get("coverage_status") == "reviewed")
    return (
        f"This review analyzed {reviewed} prioritized files for '{title}' in {review_mode} mode and found "
        f"{len(findings)} total issues, including {severe} high-severity items. "
        "The strongest risks come from the highest-priority findings and any skipped coverage should be reviewed before merge."
    )


def fallback_executive_summary(review_mode: str, findings: list[dict[str, Any]], file_summaries: list[dict[str, Any]]) -> str:
    if not findings:
        return (
            f"The review completed in {review_mode} mode without surfacing any strong blockers, "
            "though a human reviewer should still validate skipped files and product context."
        )
    top = max(findings, key=lambda item: _severity_score(item.get("severity", "medium")))
    return (
        f"The most important concern is '{top.get('title', 'review issue')}', and the review focused on "
        f"{sum(1 for file in file_summaries if file.get('coverage_status') == 'reviewed')} high-priority files."
    )


def aggregate_risk(findings: list[dict[str, Any]], file_summaries: list[dict[str, Any]]) -> int:
    reviewed_scores = [int(item.get("risk_score", 50)) for item in file_summaries if item.get("coverage_status") == "reviewed"]
    base = int(sum(reviewed_scores) / len(reviewed_scores)) if reviewed_scores else 35
    highest = max((_severity_score(item.get("severity", "medium")) for item in findings), default=1)
    floor = {1: 20, 2: 45, 3: 70, 4: 85}[highest]
    if any(item.get("category") == "test coverage gap" and _severity_score(item.get("severity", "medium")) >= 3 for item in findings):
        floor = max(floor, 75)
    return max(0, min(100, max(base, floor)))


def compute_confidence(file_summaries: list[dict[str, Any]], llm_metas: list[dict[str, Any]]) -> float:
    eligible = [item for item in file_summaries if item.get("coverage_status") != "skipped"]
    reviewed = [item for item in file_summaries if item.get("coverage_status") == "reviewed"]
    coverage_ratio = len(reviewed) / len(eligible) if eligible else 1.0
    parse_success = 0.0
    if llm_metas:
        parse_success = sum(1 for meta in llm_metas if meta.get("raw_parse_ok")) / len(llm_metas)
    return round(min(1.0, 0.45 + coverage_ratio * 0.35 + parse_success * 0.20), 2)


def build_coverage_summary(file_summaries: list[dict[str, Any]]) -> dict[str, Any]:
    reviewed = [item["filename"] for item in file_summaries if item.get("coverage_status") == "reviewed"]
    skipped = [
        {"filename": item["filename"], "reason": item.get("skipped_reason", "not prioritized")}
        for item in file_summaries
        if item.get("coverage_status") == "skipped"
    ]
    truncated = [item["filename"] for item in file_summaries if item.get("reviewed_chars", 0) < item.get("total_chars", 0)]
    return {
        "reviewed_files": reviewed,
        "skipped_files": skipped,
        "truncated_files": truncated,
        "reviewed_count": len(reviewed),
        "skipped_count": len(skipped),
        "truncated_count": len(truncated),
    }


def analyze_pull_request(title: str, description: str, diff: str, review_mode: str) -> dict[str, Any]:
    files = parse_files(diff)
    heuristic_findings = detect_heuristics(files, diff)
    prioritized = sorted(files, key=lambda item: item.priority_score, reverse=True)
    llm_targets = [item for item in prioritized if not item.skip_reason][:15]
    reviewed_names = {item.filename for item in llm_targets}

    file_summaries: list[dict[str, Any]] = []
    findings = list(heuristic_findings)
    llm_metas: list[dict[str, Any]] = []

    for index, file in enumerate(prioritized, start=1):
        coverage_status = "reviewed" if file.filename in reviewed_names else "skipped"
        summary = {
            "filename": file.filename,
            "risk_score": 15 if coverage_status == "skipped" else 50,
            "change_summary": "Skipped from deep review." if coverage_status == "skipped" else "Awaiting LLM review.",
            "why_it_matters": file.why_it_matters,
            "categories": [_normalize_category(cat) if cat in FINDING_CATEGORIES else "maintainability" for cat in []],
            "coverage_status": coverage_status,
            "skipped_reason": file.skip_reason or ("lower-priority file beyond review budget" if coverage_status == "skipped" else ""),
            "priority_rank": index,
            "reviewed_chars": file.reviewed_chars if coverage_status == "reviewed" else 0,
            "total_chars": file.total_chars,
            "explanation": "",
        }
        if coverage_status == "reviewed":
            llm_review = review_file_with_llm(title, description, review_mode, file)
            llm_metas.append(llm_review["meta"])
            categories = sorted(
                set(file.categories)
                | set(llm_review.get("categories", []))
                | {finding["category"] for finding in llm_review.get("findings", [])}
            )
            summary.update(
                {
                    "risk_score": llm_review["risk_score"],
                    "change_summary": llm_review["change_summary"],
                    "why_it_matters": llm_review["why_it_matters"],
                    "categories": categories,
                    "explanation": llm_review["change_summary"],
                }
            )
            findings.extend(llm_review["findings"])
        else:
            summary["categories"] = file.categories
            summary["explanation"] = summary["change_summary"]
        file_summaries.append(summary)

    findings = dedupe_findings(findings)
    synthesis = synthesize_report(
        title=title,
        description=description,
        review_mode=review_mode,
        findings=findings,
        file_summaries=file_summaries,
    )
    llm_metas.append(synthesis["meta"])
    coverage_summary = build_coverage_summary(file_summaries)
    model_metadata = {
        "review_mode": review_mode,
        "calls": llm_metas,
        "fallback_used": any(meta.get("fallback_used") for meta in llm_metas),
        "models_used": [meta.get("model") for meta in llm_metas if meta.get("model")],
        "heuristic_findings": len(heuristic_findings),
        "partially_heuristic": bool(heuristic_findings),
    }
    confidence = compute_confidence(file_summaries, llm_metas)
    risk_score = aggregate_risk(findings, file_summaries)

    return {
        "risk_score": risk_score,
        "summary": synthesis["summary"],
        "executive_summary": synthesis["executive_summary"],
        "top_priorities": synthesis["top_priorities"],
        "findings": findings,
        "file_summaries": file_summaries,
        "coverage_summary": coverage_summary,
        "model_metadata": model_metadata,
        "review_confidence": confidence,
        "suggestions": synthesis["top_priorities"],
    }


def dedupe_findings(findings: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[tuple[str, str, str]] = set()
    result: list[dict[str, Any]] = []
    for finding in findings:
        key = (
            finding.get("file_path", ""),
            finding.get("title", ""),
            finding.get("category", ""),
        )
        if key in seen:
            continue
        seen.add(key)
        result.append(finding)
    result.sort(
        key=lambda item: (_severity_score(item.get("severity", "medium")), item.get("confidence", 0.0)),
        reverse=True,
    )
    return result
