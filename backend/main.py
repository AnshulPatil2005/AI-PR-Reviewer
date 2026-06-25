import json
import threading
import time
from datetime import datetime, timedelta
from io import BytesIO
from pathlib import Path
from typing import Any, Literal

from dotenv import load_dotenv

env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

from fastapi import Depends, FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, ConfigDict, EmailStr, field_validator
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from backend.analysis_pipeline import REVIEW_MODES, analyze_pull_request
from backend.repo_analytics import get_repo_stats
from backend.auth import create_access_token, get_current_user, hash_password, verify_password
from backend.database import Base, SessionLocal, engine, ensure_runtime_schema, get_db
from backend.github_utils import fetch_pr_details
from backend.models import Analysis, AnalysisJob, FileAnalysis, Finding, User

app = FastAPI(title="AI PR Reviewer", version="2.1.0")


def _json_loads(value: Any, fallback: Any):
    if value is None:
        return fallback
    if isinstance(value, (list, dict)):
        return value
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return fallback
        try:
            return json.loads(stripped)
        except json.JSONDecodeError:
            return fallback
    return fallback


def _json_dumps(value: Any) -> str:
    return json.dumps(value or [])


def _coerce_suggestion(s) -> str:
    if isinstance(s, str):
        return s
    if isinstance(s, dict):
        for key in ("suggestion", "text", "description", "message", "content", "detail", "title"):
            if key in s and isinstance(s[key], str):
                val = s[key]
                file_prefix = s.get("file") or s.get("filename") or s.get("file_path")
                return f"{file_prefix}: {val}" if file_prefix else val
        parts = [str(v) for v in s.values() if v and isinstance(v, str)]
        return " - ".join(parts) if parts else str(s)
    return str(s)


def _normalize_suggestions(raw) -> list[str]:
    if raw is None:
        return []
    if isinstance(raw, str):
        decoded = _json_loads(raw, None)
        if decoded is None:
            return [raw]
        return _normalize_suggestions(decoded)
    if isinstance(raw, dict):
        if "suggestions" in raw:
            return _normalize_suggestions(raw["suggestions"])
        return [_coerce_suggestion(raw)]
    if isinstance(raw, list):
        return [_coerce_suggestion(item) for item in raw]
    return [_coerce_suggestion(raw)]


@app.on_event("startup")
def on_startup():
    try:
        Base.metadata.create_all(bind=engine)
        ensure_runtime_schema()
        print("[OK] DB schema ready")
    except Exception as e:
        print(f"[WARN] DB startup failed: {e}")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    import traceback

    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": f"{type(exc).__name__}: {exc}"},
        headers={"Access-Control-Allow-Origin": "*"},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str


class UserOut(BaseModel):
    id: int
    email: str
    monthly_quota: int = 10
    analyses_this_month: int = 0
    quota_resets_on: str | None = None

    class Config:
        from_attributes = True


class AnalyzePRRequest(BaseModel):
    repo_url: str
    pr_number: int
    review_mode: Literal["general", "security", "performance", "maintainability"] = "general"

    @field_validator("repo_url")
    @classmethod
    def repo_url_must_be_https(cls, v: str) -> str:
        if not v.startswith("https://"):
            raise ValueError("repo_url must use the https:// scheme")
        return v.strip()

    @field_validator("pr_number")
    @classmethod
    def pr_number_must_be_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("pr_number must be a positive integer")
        return v


class FindingOut(BaseModel):
    title: str
    detail: str
    severity: str
    category: str
    confidence: float
    suggested_fix: str
    file_path: str
    source: str
    line_start: int | None = None
    line_end: int | None = None

    class Config:
        from_attributes = True


class FileSummaryOut(BaseModel):
    filename: str
    risk_score: int
    explanation: str
    change_summary: str
    categories: list[str] = []
    why_it_matters: str
    coverage_status: str
    skipped_reason: str
    priority_rank: int
    reviewed_chars: int
    total_chars: int

    class Config:
        from_attributes = True

    @field_validator("categories", mode="before")
    @classmethod
    def parse_categories(cls, value):
        return _json_loads(value, [])


class AnalysisOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: int
    repo_url: str
    pr_number: int
    pr_title: str
    risk_score: int
    explanation: str
    executive_summary: str = ""
    suggestions: list[str]
    top_priorities: list[str] = []
    findings: list[FindingOut] = []
    file_summaries: list[FileSummaryOut] = []
    file_analyses: list[FileSummaryOut] = []
    coverage_summary: dict[str, Any] = {}
    model_metadata: dict[str, Any] = {}
    review_confidence: float = 0.0
    review_mode: str = "general"
    status: str = "completed"
    created_at: str

    @field_validator("suggestions", "top_priorities", mode="before")
    @classmethod
    def parse_string_lists(cls, value):
        return _normalize_suggestions(value)

    @field_validator("coverage_summary", "model_metadata", mode="before")
    @classmethod
    def parse_dicts(cls, value):
        return _json_loads(value, {})


class AnalysisSummaryOut(BaseModel):
    id: int
    repo_url: str
    pr_number: int
    pr_title: str
    risk_score: int
    status: str
    review_mode: str
    review_confidence: float
    top_priorities: list[str]
    created_at: str

    @field_validator("top_priorities", mode="before")
    @classmethod
    def parse_priorities(cls, value):
        return _normalize_suggestions(value)


class JobOut(BaseModel):
    id: int
    repo_url: str
    pr_number: int
    review_mode: str
    status: str
    stage: str
    progress: float
    error_message: str
    analysis_id: int | None = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class InsightsOut(BaseModel):
    most_analyzed_repos: list[dict[str, Any]]
    average_risk_by_repo: list[dict[str, Any]]
    recent_high_risk_prs: list[dict[str, Any]]


class RepoAnalyticsOut(BaseModel):
    repo_name: str
    description: str
    language: str
    stars: int
    forks: int
    open_issues: int
    open_prs: int
    prs_merged_last_30d: int
    top_contributors: list[str]
    last_pushed_at: str | None
    analyses_count: int
    avg_risk_score: float | None
    risk_trend: list[int]
    hot_files: list[str]


class ComparisonOut(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    baseline_analysis_id: int | None
    current_analysis_id: int
    risk_delta: int
    findings_added: list[str]
    findings_resolved: list[str]
    newly_risky_files: list[str]
    model_changed: bool
    coverage_changed: bool


@app.get("/")
@app.head("/")
def health_check():
    return {"status": "ok", "version": "2.1.0"}


@app.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered.")
    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
    user = User(email=req.email, hashed_password=hash_password(req.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user_id=user.id, email=user.email)


@app.post("/auth/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email, User.is_active == True).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = create_access_token(user.id, user.email)
    return TokenResponse(access_token=token, user_id=user.id, email=user.email)


@app.get("/auth/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    now = datetime.utcnow()
    if now.month == 12:
        next_reset = now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        next_reset = now.replace(month=now.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0)
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        monthly_quota=getattr(current_user, "monthly_quota", 10) or 10,
        analyses_this_month=getattr(current_user, "analyses_this_month", 0) or 0,
        quota_resets_on=next_reset.strftime("%Y-%m-%d"),
    )


def _job_to_out(job: AnalysisJob) -> JobOut:
    return JobOut(
        id=job.id,
        repo_url=job.repo_url,
        pr_number=job.pr_number,
        review_mode=job.review_mode,
        status=job.status,
        stage=job.stage,
        progress=job.progress,
        error_message=job.error_message or "",
        analysis_id=job.analysis_id,
        created_at=job.created_at.isoformat(),
        updated_at=job.updated_at.isoformat(),
    )


def _analysis_to_out(analysis: Analysis) -> AnalysisOut:
    file_summaries = [
        FileSummaryOut(
            filename=fa.filename,
            risk_score=fa.risk_score,
            explanation=fa.explanation,
            change_summary=fa.change_summary or fa.explanation,
            categories=_json_loads(fa.categories, []),
            why_it_matters=fa.why_it_matters or "",
            coverage_status=fa.coverage_status or "reviewed",
            skipped_reason=fa.skipped_reason or "",
            priority_rank=fa.priority_rank or 0,
            reviewed_chars=fa.reviewed_chars or 0,
            total_chars=fa.total_chars or 0,
        )
        for fa in sorted(analysis.file_analyses, key=lambda item: item.priority_rank or 0)
    ]

    findings = [
        FindingOut(
            title=item.title,
            detail=item.detail,
            severity=item.severity,
            category=item.category,
            confidence=item.confidence,
            suggested_fix=item.suggested_fix or "",
            file_path=item.file_path or "",
            source=item.source or "llm",
            line_start=item.line_start,
            line_end=item.line_end,
        )
        for item in analysis.findings
    ]

    model_metadata = _json_loads(analysis.model_metadata, {})
    return AnalysisOut(
        id=analysis.id,
        repo_url=analysis.repo_url,
        pr_number=analysis.pr_number,
        pr_title=analysis.pr_title or "",
        risk_score=analysis.risk_score,
        explanation=analysis.explanation,
        executive_summary=model_metadata.get("executive_summary", ""),
        suggestions=_normalize_suggestions(analysis.suggestions),
        top_priorities=_normalize_suggestions(analysis.top_priorities),
        findings=findings,
        file_summaries=file_summaries,
        file_analyses=file_summaries,
        coverage_summary=_json_loads(analysis.coverage_summary, {}),
        model_metadata=model_metadata,
        review_confidence=analysis.review_confidence or 0.0,
        review_mode=analysis.review_mode or "general",
        status=analysis.status or "completed",
        created_at=analysis.created_at.isoformat(),
    )


def _analysis_to_summary(analysis: Analysis) -> AnalysisSummaryOut:
    return AnalysisSummaryOut(
        id=analysis.id,
        repo_url=analysis.repo_url,
        pr_number=analysis.pr_number,
        pr_title=analysis.pr_title or "",
        risk_score=analysis.risk_score,
        status=analysis.status or "completed",
        review_mode=analysis.review_mode or "general",
        review_confidence=analysis.review_confidence or 0.0,
        top_priorities=_normalize_suggestions(analysis.top_priorities),
        created_at=analysis.created_at.isoformat(),
    )


def _get_owned_analysis(analysis_id: int, user_id: int, db: Session) -> Analysis:
    analysis = (
        db.query(Analysis)
        .options(joinedload(Analysis.file_analyses), joinedload(Analysis.findings))
        .filter(Analysis.id == analysis_id, Analysis.user_id == user_id, Analysis.is_deleted == False)
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return analysis


def _get_owned_job(job_id: int, user_id: int, db: Session) -> AnalysisJob:
    job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id, AnalysisJob.user_id == user_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return job


def _update_job(
    db: Session,
    job: AnalysisJob,
    *,
    status_value: str | None = None,
    stage: str | None = None,
    progress: float | None = None,
    error_message: str | None = None,
    analysis_id: int | None = None,
):
    if status_value is not None:
        job.status = status_value
    if stage is not None:
        job.stage = stage
    if progress is not None:
        job.progress = progress
    if error_message is not None:
        job.error_message = error_message
    if analysis_id is not None:
        job.analysis_id = analysis_id
    db.commit()
    db.refresh(job)


def _persist_analysis(db: Session, *, user_id: int, repo_url: str, pr_number: int, pr_title: str, review_mode: str, report: dict[str, Any]) -> Analysis:
    analysis = Analysis(
        user_id=user_id,
        repo_url=repo_url,
        pr_number=pr_number,
        pr_title=pr_title,
        risk_score=report["risk_score"],
        explanation=report["summary"],
        suggestions=_json_dumps(report["suggestions"]),
        review_mode=review_mode,
        review_confidence=report["review_confidence"],
        coverage_summary=_json_dumps(report["coverage_summary"]),
        model_metadata=_json_dumps({**report["model_metadata"], "executive_summary": report["executive_summary"]}),
        top_priorities=_json_dumps(report["top_priorities"]),
        status="completed",
    )
    db.add(analysis)
    db.flush()

    for file_summary in report["file_summaries"]:
        db.add(
            FileAnalysis(
                analysis_id=analysis.id,
                filename=file_summary["filename"],
                risk_score=file_summary["risk_score"],
                explanation=file_summary["explanation"],
                change_summary=file_summary["change_summary"],
                categories=_json_dumps(file_summary["categories"]),
                why_it_matters=file_summary["why_it_matters"],
                coverage_status=file_summary["coverage_status"],
                skipped_reason=file_summary["skipped_reason"],
                priority_rank=file_summary["priority_rank"],
                reviewed_chars=file_summary["reviewed_chars"],
                total_chars=file_summary["total_chars"],
            )
        )

    for finding in report["findings"]:
        db.add(
            Finding(
                analysis_id=analysis.id,
                file_path=finding.get("file_path", ""),
                category=finding["category"],
                severity=finding["severity"],
                confidence=finding.get("confidence", 0.65),
                title=finding["title"],
                detail=finding["detail"],
                suggested_fix=finding.get("suggested_fix", ""),
                source=finding.get("source", "llm"),
                line_start=finding.get("line_start"),
                line_end=finding.get("line_end"),
            )
        )

    db.commit()
    db.refresh(analysis)
    return analysis


def _run_job(job_id: int):
    db = SessionLocal()
    try:
        job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if not job:
            return
        _update_job(db, job, status_value="running", stage="fetching_pr", progress=0.1, error_message="")
        title, description, diff = fetch_pr_details(job.repo_url, job.pr_number)

        _update_job(db, job, status_value="running", stage="analyzing_diff", progress=0.45)
        report = analyze_pull_request(title, description, diff, job.review_mode)

        _update_job(db, job, status_value="running", stage="saving_report", progress=0.8)
        analysis = _persist_analysis(
            db,
            user_id=job.user_id,
            repo_url=job.repo_url,
            pr_number=job.pr_number,
            pr_title=title,
            review_mode=job.review_mode,
            report=report,
        )

        _update_job(db, job, status_value="completed", stage="completed", progress=1.0, analysis_id=analysis.id)
    except Exception as exc:
        job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if job:
            _update_job(db, job, status_value="failed", stage="failed", progress=1.0, error_message=str(exc))
    finally:
        db.close()


def _check_and_increment_quota(user: User, db: Session) -> None:
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    reset_date = getattr(user, "quota_reset_date", None)
    this_month = getattr(user, "analyses_this_month", 0) or 0
    quota = getattr(user, "monthly_quota", 10) or 10

    if reset_date is None or reset_date < month_start:
        user.analyses_this_month = 0
        user.quota_reset_date = month_start
        this_month = 0

    if this_month >= quota:
        raise HTTPException(
            status_code=429,
            detail=f"Monthly quota reached ({quota} analyses). Resets on the 1st of next month.",
        )

    user.analyses_this_month = this_month + 1
    db.commit()


def _create_job(payload: AnalyzePRRequest, current_user: User, db: Session) -> AnalysisJob:
    if payload.review_mode not in REVIEW_MODES:
        raise HTTPException(status_code=400, detail="Invalid review mode.")

    # Return cached result if same PR was analyzed within 24h with the same review mode
    cutoff = datetime.utcnow() - timedelta(hours=24)
    cached = (
        db.query(Analysis)
        .filter(
            Analysis.user_id == current_user.id,
            Analysis.repo_url == payload.repo_url.strip(),
            Analysis.pr_number == payload.pr_number,
            Analysis.review_mode == payload.review_mode,
            Analysis.is_deleted == False,
            Analysis.status == "completed",
            Analysis.created_at >= cutoff,
        )
        .order_by(Analysis.created_at.desc())
        .first()
    )
    if cached:
        job = AnalysisJob(
            user_id=current_user.id,
            repo_url=payload.repo_url.strip(),
            pr_number=payload.pr_number,
            review_mode=payload.review_mode,
            status="completed",
            stage="cached",
            progress=1.0,
            error_message="",
            analysis_id=cached.id,
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    _check_and_increment_quota(current_user, db)

    job = AnalysisJob(
        user_id=current_user.id,
        repo_url=payload.repo_url.strip(),
        pr_number=payload.pr_number,
        review_mode=payload.review_mode,
        status="queued",
        stage="queued",
        progress=0.0,
        error_message="",
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    threading.Thread(target=_run_job, args=(job.id,), daemon=True).start()
    return job


@app.post("/analysis-jobs", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_analysis_job(
    payload: AnalyzePRRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = _create_job(payload, current_user, db)
    return _job_to_out(job)


@app.get("/analysis-jobs/{job_id}", response_model=JobOut)
def get_analysis_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _job_to_out(_get_owned_job(job_id, current_user.id, db))


@app.get("/analysis-jobs/{job_id}/result", response_model=AnalysisOut)
def get_analysis_job_result(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = _get_owned_job(job_id, current_user.id, db)
    if job.status != "completed" or not job.analysis_id:
        raise HTTPException(status_code=409, detail="Job result is not ready yet.")
    return _analysis_to_out(_get_owned_analysis(job.analysis_id, current_user.id, db))


@app.post("/analyses/{analysis_id}/rerun", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def rerun_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analysis = _get_owned_analysis(analysis_id, current_user.id, db)
    payload = AnalyzePRRequest(
        repo_url=analysis.repo_url,
        pr_number=analysis.pr_number,
        review_mode=analysis.review_mode or "general",
    )
    job = _create_job(payload, current_user, db)
    return _job_to_out(job)


@app.post("/analyze")
def analyze_pr_compat(
    payload: AnalyzePRRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = _create_job(payload, current_user, db)
    deadline = time.time() + 20
    while time.time() < deadline:
        db.expire_all()
        fresh_job = _get_owned_job(job.id, current_user.id, db)
        if fresh_job.status == "completed" and fresh_job.analysis_id:
            analysis = _get_owned_analysis(fresh_job.analysis_id, current_user.id, db)
            return JSONResponse(status_code=201, content=_analysis_to_out(analysis).model_dump())
        if fresh_job.status == "failed":
            return JSONResponse(status_code=500, content={"detail": fresh_job.error_message or "Analysis failed."})
        time.sleep(1)
    return JSONResponse(status_code=202, content=_job_to_out(job).model_dump())


@app.get("/analyses", response_model=list[AnalysisSummaryOut])
def list_analyses(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    repo: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    risk_min: int | None = Query(None, ge=0, le=100),
    risk_max: int | None = Query(None, ge=0, le=100),
    sort: str = Query("newest"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    offset = (page - 1) * limit
    query = db.query(Analysis).filter(Analysis.user_id == current_user.id, Analysis.is_deleted == False)
    if repo:
        query = query.filter(Analysis.repo_url.ilike(f"%{repo}%"))
    if status_filter:
        query = query.filter(Analysis.status == status_filter)
    if risk_min is not None:
        query = query.filter(Analysis.risk_score >= risk_min)
    if risk_max is not None:
        query = query.filter(Analysis.risk_score <= risk_max)

    if sort == "highest_risk":
        query = query.order_by(Analysis.risk_score.desc(), Analysis.created_at.desc())
    else:
        query = query.order_by(Analysis.created_at.desc())

    rows = query.offset(offset).limit(limit).all()
    return [_analysis_to_summary(row) for row in rows]


@app.get("/analyses/insights", response_model=InsightsOut)
def analysis_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    base = db.query(Analysis).filter(Analysis.user_id == current_user.id, Analysis.is_deleted == False)
    repo_counts = (
        base.with_entities(Analysis.repo_url, func.count(Analysis.id).label("count"))
        .group_by(Analysis.repo_url)
        .order_by(func.count(Analysis.id).desc())
        .limit(5)
        .all()
    )
    avg_risk = (
        base.with_entities(Analysis.repo_url, func.avg(Analysis.risk_score).label("avg_risk"))
        .group_by(Analysis.repo_url)
        .order_by(func.avg(Analysis.risk_score).desc())
        .limit(5)
        .all()
    )
    recent_high = (
        base.filter(Analysis.risk_score >= 70)
        .order_by(Analysis.created_at.desc())
        .limit(5)
        .all()
    )
    return InsightsOut(
        most_analyzed_repos=[{"repo_url": row.repo_url, "count": row.count} for row in repo_counts],
        average_risk_by_repo=[{"repo_url": row.repo_url, "average_risk": round(float(row.avg_risk), 1)} for row in avg_risk],
        recent_high_risk_prs=[
            {
                "analysis_id": row.id,
                "repo_url": row.repo_url,
                "pr_number": row.pr_number,
                "risk_score": row.risk_score,
                "created_at": row.created_at.isoformat(),
            }
            for row in recent_high
        ],
    )


@app.get("/repos/analytics", response_model=RepoAnalyticsOut)
def repo_analytics(
    repo_url: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        github_stats = get_repo_stats(repo_url)
    except (ValueError, EnvironmentError) as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Aggregate from our DB: analyses this user ran on this repo
    analyses = (
        db.query(Analysis)
        .filter(
            Analysis.user_id == current_user.id,
            Analysis.repo_url == repo_url,
            Analysis.is_deleted == False,
            Analysis.status == "completed",
        )
        .order_by(Analysis.created_at.desc())
        .all()
    )
    risk_scores = [a.risk_score for a in analyses]
    avg_risk = round(sum(risk_scores) / len(risk_scores), 1) if risk_scores else None
    risk_trend = list(reversed(risk_scores[:10]))  # oldest → newest

    hot_files = (
        db.query(FileAnalysis.filename, func.avg(FileAnalysis.risk_score).label("avg_risk"))
        .join(Analysis)
        .filter(
            Analysis.user_id == current_user.id,
            Analysis.repo_url == repo_url,
            Analysis.is_deleted == False,
            FileAnalysis.risk_score >= 60,
        )
        .group_by(FileAnalysis.filename)
        .order_by(func.avg(FileAnalysis.risk_score).desc())
        .limit(5)
        .all()
    )

    return RepoAnalyticsOut(
        **github_stats,
        analyses_count=len(analyses),
        avg_risk_score=avg_risk,
        risk_trend=risk_trend,
        hot_files=[row.filename for row in hot_files],
    )


@app.get("/analyses/{analysis_id}", response_model=AnalysisOut)
def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _analysis_to_out(_get_owned_analysis(analysis_id, current_user.id, db))


@app.get("/analyses/{analysis_id}/compare", response_model=ComparisonOut)
def compare_analysis(
    analysis_id: int,
    baseline_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current = _get_owned_analysis(analysis_id, current_user.id, db)
    if baseline_id:
        baseline = _get_owned_analysis(baseline_id, current_user.id, db)
    else:
        baseline = (
            db.query(Analysis)
            .filter(
                Analysis.user_id == current_user.id,
                Analysis.is_deleted == False,
                Analysis.repo_url == current.repo_url,
                Analysis.pr_number == current.pr_number,
                Analysis.id != current.id,
                Analysis.created_at < current.created_at,
            )
            .order_by(Analysis.created_at.desc())
            .first()
        )

    if not baseline:
        return ComparisonOut(
            baseline_analysis_id=None,
            current_analysis_id=current.id,
            risk_delta=0,
            findings_added=[],
            findings_resolved=[],
            newly_risky_files=[],
            model_changed=False,
            coverage_changed=False,
        )

    current_keys = {f"{item.file_path}|{item.title}|{item.category}" for item in current.findings}
    baseline_keys = {f"{item.file_path}|{item.title}|{item.category}" for item in baseline.findings}
    current_risky_files = {item.filename for item in current.file_analyses if item.risk_score >= 70}
    baseline_risky_files = {item.filename for item in baseline.file_analyses if item.risk_score >= 70}
    current_models = set(_json_loads(current.model_metadata, {}).get("models_used", []))
    baseline_models = set(_json_loads(baseline.model_metadata, {}).get("models_used", []))
    coverage_changed = _json_loads(current.coverage_summary, {}) != _json_loads(baseline.coverage_summary, {})

    return ComparisonOut(
        baseline_analysis_id=baseline.id,
        current_analysis_id=current.id,
        risk_delta=current.risk_score - baseline.risk_score,
        findings_added=sorted(current_keys - baseline_keys),
        findings_resolved=sorted(baseline_keys - current_keys),
        newly_risky_files=sorted(current_risky_files - baseline_risky_files),
        model_changed=current_models != baseline_models,
        coverage_changed=coverage_changed,
    )


@app.delete("/analyses/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analysis = _get_owned_analysis(analysis_id, current_user.id, db)
    analysis.is_deleted = True
    db.commit()


def _render_markdown_report(out: AnalysisOut) -> str:
    findings_lines = "\n".join(
        f"- [{finding.severity.upper()}] {finding.title} ({finding.file_path or 'PR'}): {finding.detail}"
        for finding in out.findings[:8]
    )
    priorities = "\n".join(f"- {item}" for item in out.top_priorities)
    return (
        f"# PR Review Summary\n\n"
        f"- Repository: `{out.repo_url}`\n"
        f"- PR: `#{out.pr_number}`\n"
        f"- Review mode: `{out.review_mode}`\n"
        f"- Risk score: **{out.risk_score}/100**\n"
        f"- Review confidence: **{int(out.review_confidence * 100)}%**\n\n"
        f"## Assessment\n\n{out.explanation}\n\n"
        f"## Top Priorities\n\n{priorities or '- No top priorities generated.'}\n\n"
        f"## Findings\n\n{findings_lines or '- No findings.'}\n"
    )


def _render_pr_comment(out: AnalysisOut) -> str:
    bullets = "\n".join(f"- {item}" for item in out.top_priorities)
    return (
        f"### Agentic PR Copilot Review\n"
        f"- Risk: **{out.risk_score}/100**\n"
        f"- Mode: `{out.review_mode}`\n"
        f"- Confidence: **{int(out.review_confidence * 100)}%**\n\n"
        f"**Summary**\n{out.explanation}\n\n"
        f"**Top priorities**\n{bullets or '- No priorities generated.'}\n"
    )


@app.get("/analyses/{analysis_id}/export")
def export_analysis(
    analysis_id: int,
    format: str = Query("json", pattern="^(json|pdf|markdown|comment|executive)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    out = _analysis_to_out(_get_owned_analysis(analysis_id, current_user.id, db))

    if format == "json":
        content = json.dumps(out.model_dump(), indent=2).encode()
        return StreamingResponse(
            BytesIO(content),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=analysis-{analysis_id}.json"},
        )

    if format == "markdown":
        content = _render_markdown_report(out).encode()
        return StreamingResponse(
            BytesIO(content),
            media_type="text/markdown",
            headers={"Content-Disposition": f"attachment; filename=analysis-{analysis_id}.md"},
        )

    if format == "comment":
        content = _render_pr_comment(out).encode()
        return StreamingResponse(
            BytesIO(content),
            media_type="text/plain",
            headers={"Content-Disposition": f"attachment; filename=analysis-{analysis_id}-comment.txt"},
        )

    if format == "executive":
        content = out.executive_summary.encode()
        return StreamingResponse(
            BytesIO(content),
            media_type="text/plain",
            headers={"Content-Disposition": f"attachment; filename=analysis-{analysis_id}-executive.txt"},
        )

    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib.units import inch
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
    except ImportError:
        raise HTTPException(status_code=500, detail="reportlab not installed. Run: pip install reportlab")

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, rightMargin=inch, leftMargin=inch, topMargin=inch, bottomMargin=inch)
    styles = getSampleStyleSheet()
    story = []

    def p(text: str, style: str = "Normal") -> Paragraph:
        return Paragraph(text.replace("\n", "<br/>"), styles[style])

    story.append(p(f"PR Analysis Report - #{out.pr_number}", "Heading1"))
    story.append(p(f"<b>Repository:</b> {out.repo_url}"))
    story.append(p(f"<b>Title:</b> {out.pr_title or 'N/A'}"))
    story.append(p(f"<b>Analyzed:</b> {out.created_at}"))
    story.append(p(f"<b>Review mode:</b> {out.review_mode}"))
    story.append(Spacer(1, 12))
    story.append(p(f"Risk Score: {out.risk_score}/100", "Heading2"))
    story.append(p(out.explanation))
    story.append(Spacer(1, 12))
    story.append(p("Top Priorities", "Heading2"))
    for item in out.top_priorities:
        story.append(p(f"- {item}"))
    story.append(Spacer(1, 12))
    story.append(p("Findings", "Heading2"))
    for finding in out.findings[:10]:
        story.append(p(f"<b>{finding.severity.upper()}</b> - {finding.title}"))
        story.append(p(f"{finding.file_path or 'PR'}: {finding.detail}"))
        if finding.suggested_fix:
            story.append(p(f"Suggested fix: {finding.suggested_fix}"))
        story.append(Spacer(1, 6))

    doc.build(story)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=analysis-{analysis_id}.pdf"},
    )
