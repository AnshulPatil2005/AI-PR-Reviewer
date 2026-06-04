import json
import os
from io import BytesIO
from pathlib import Path

from dotenv import load_dotenv

env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from backend.agents.file_agent import analyze_file
from backend.agents.risk_agent import assess_risk
from backend.agents.suggestion_agent import generate_suggestions
from backend.auth import create_access_token, get_current_user, hash_password, verify_password
from backend.database import Base, engine, get_db
from backend.github_utils import fetch_pr_details, parse_diff_by_file
from backend.models import Analysis, FileAnalysis, User

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI PR Reviewer", version="2.0.0")

# CORS — read allowed origins from env for cloud deployments
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Auth schemas
# ---------------------------------------------------------------------------

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

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Analysis schemas
# ---------------------------------------------------------------------------

class AnalyzePRRequest(BaseModel):
    repo_url: str
    pr_number: int


class FileAnalysisOut(BaseModel):
    filename: str
    risk_score: int
    explanation: str

    class Config:
        from_attributes = True


class AnalysisOut(BaseModel):
    id: int
    repo_url: str
    pr_number: int
    pr_title: str
    risk_score: int
    explanation: str
    suggestions: list[str]
    file_analyses: list[FileAnalysisOut] = []
    created_at: str

    class Config:
        from_attributes = True


class AnalysisSummary(BaseModel):
    id: int
    repo_url: str
    pr_number: int
    pr_title: str
    risk_score: int
    created_at: str

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------

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
    return current_user


# ---------------------------------------------------------------------------
# Analyze endpoint
# ---------------------------------------------------------------------------

@app.post("/analyze", response_model=AnalysisOut, status_code=status.HTTP_201_CREATED)
async def analyze_pr(
    request: AnalyzePRRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        title, description, diff = fetch_pr_details(request.repo_url, request.pr_number)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        risk_result = assess_risk(title, description, diff)
        suggestions_result = generate_suggestions(title, description, diff)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {e}")

    suggestions = suggestions_result.get("suggestions", [])
    if not suggestions:
        suggestions = risk_result.get("suggestions", [])

    # File-level analysis (best-effort — don't fail the whole request if this errors)
    file_diffs = parse_diff_by_file(diff)
    file_results: list[dict] = []
    for filename, file_diff in file_diffs.items():
        try:
            file_results.append(analyze_file(filename, file_diff))
        except Exception:
            pass

    # Persist to database
    analysis = Analysis(
        user_id=current_user.id,
        repo_url=request.repo_url,
        pr_number=request.pr_number,
        pr_title=title,
        risk_score=risk_result.get("risk_score", 50),
        explanation=risk_result.get("explanation", "Could not determine."),
        suggestions=json.dumps(suggestions),
    )
    db.add(analysis)
    db.flush()

    for fr in file_results:
        db.add(FileAnalysis(
            analysis_id=analysis.id,
            filename=fr["filename"],
            risk_score=fr["risk_score"],
            explanation=fr["explanation"],
        ))

    db.commit()
    db.refresh(analysis)

    return _analysis_to_out(analysis)


# ---------------------------------------------------------------------------
# History endpoints
# ---------------------------------------------------------------------------

@app.get("/analyses", response_model=list[AnalysisSummary])
def list_analyses(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    offset = (page - 1) * limit
    rows = (
        db.query(Analysis)
        .filter(Analysis.user_id == current_user.id, Analysis.is_deleted == False)
        .order_by(Analysis.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [_analysis_to_summary(r) for r in rows]


@app.get("/analyses/{analysis_id}", response_model=AnalysisOut)
def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analysis = _get_owned_analysis(analysis_id, current_user.id, db)
    return _analysis_to_out(analysis)


@app.delete("/analyses/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analysis = _get_owned_analysis(analysis_id, current_user.id, db)
    analysis.is_deleted = True
    db.commit()


# ---------------------------------------------------------------------------
# Export endpoint
# ---------------------------------------------------------------------------

@app.get("/analyses/{analysis_id}/export")
def export_analysis(
    analysis_id: int,
    format: str = Query("json", regex="^(json|pdf)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analysis = _get_owned_analysis(analysis_id, current_user.id, db)
    out = _analysis_to_out(analysis)

    if format == "json":
        payload = out.model_dump()
        content = json.dumps(payload, indent=2).encode()
        return StreamingResponse(
            BytesIO(content),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=analysis-{analysis_id}.json"},
        )

    # PDF via reportlab
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

    story.append(p(f"PR Analysis Report — #{out.pr_number}", "Heading1"))
    story.append(p(f"<b>Repository:</b> {out.repo_url}"))
    story.append(p(f"<b>Title:</b> {out.pr_title or 'N/A'}"))
    story.append(p(f"<b>Analyzed:</b> {out.created_at}"))
    story.append(Spacer(1, 12))

    story.append(p(f"Risk Score: {out.risk_score}/100", "Heading2"))
    story.append(p(out.explanation))
    story.append(Spacer(1, 12))

    story.append(p("Suggestions", "Heading2"))
    for i, s in enumerate(out.suggestions, 1):
        story.append(p(f"{i}. {s}"))
    story.append(Spacer(1, 12))

    if out.file_analyses:
        story.append(p("File-Level Breakdown", "Heading2"))
        for fa in out.file_analyses:
            story.append(p(f"<b>{fa.filename}</b> — Risk: {fa.risk_score}/100"))
            story.append(p(fa.explanation))
            story.append(Spacer(1, 6))

    doc.build(story)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=analysis-{analysis_id}.pdf"},
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_owned_analysis(analysis_id: int, user_id: int, db: Session) -> Analysis:
    analysis = db.query(Analysis).filter(
        Analysis.id == analysis_id,
        Analysis.user_id == user_id,
        Analysis.is_deleted == False,
    ).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return analysis


def _analysis_to_out(analysis: Analysis) -> AnalysisOut:
    try:
        suggestions = json.loads(analysis.suggestions)
    except (json.JSONDecodeError, TypeError):
        suggestions = []
    return AnalysisOut(
        id=analysis.id,
        repo_url=analysis.repo_url,
        pr_number=analysis.pr_number,
        pr_title=analysis.pr_title or "",
        risk_score=analysis.risk_score,
        explanation=analysis.explanation,
        suggestions=suggestions,
        file_analyses=[
            FileAnalysisOut(
                filename=fa.filename,
                risk_score=fa.risk_score,
                explanation=fa.explanation,
            )
            for fa in analysis.file_analyses
        ],
        created_at=analysis.created_at.isoformat(),
    )


def _analysis_to_summary(analysis: Analysis) -> AnalysisSummary:
    return AnalysisSummary(
        id=analysis.id,
        repo_url=analysis.repo_url,
        pr_number=analysis.pr_number,
        pr_title=analysis.pr_title or "",
        risk_score=analysis.risk_score,
        created_at=analysis.created_at.isoformat(),
    )
