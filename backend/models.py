from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    monthly_quota = Column(Integer, default=10)
    analyses_this_month = Column(Integer, default=0)
    quota_reset_date = Column(DateTime, nullable=True, default=None)

    analyses = relationship("Analysis", back_populates="user", cascade="all, delete-orphan")
    analysis_jobs = relationship("AnalysisJob", back_populates="user", cascade="all, delete-orphan")


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    repo_url = Column(String, nullable=False)
    pr_number = Column(Integer, nullable=False)
    pr_title = Column(String, default="")
    risk_score = Column(Integer, nullable=False)
    explanation = Column(Text, nullable=False)
    suggestions = Column(Text, nullable=False, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow)
    is_deleted = Column(Boolean, default=False)
    review_mode = Column(String, default="general")
    review_confidence = Column(Float, default=0.0)
    coverage_summary = Column(Text, default="{}")
    model_metadata = Column(Text, default="{}")
    top_priorities = Column(Text, default="[]")
    status = Column(String, default="completed")

    user = relationship("User", back_populates="analyses")
    file_analyses = relationship("FileAnalysis", back_populates="analysis", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="analysis", cascade="all, delete-orphan")
    jobs = relationship("AnalysisJob", back_populates="analysis")


class FileAnalysis(Base):
    __tablename__ = "file_analyses"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False)
    filename = Column(String, nullable=False)
    risk_score = Column(Integer, nullable=False)
    explanation = Column(Text, nullable=False)
    change_summary = Column(Text, default="")
    categories = Column(Text, default="[]")
    why_it_matters = Column(Text, default="")
    coverage_status = Column(String, default="reviewed")
    skipped_reason = Column(Text, default="")
    priority_rank = Column(Integer, default=0)
    reviewed_chars = Column(Integer, default=0)
    total_chars = Column(Integer, default=0)

    analysis = relationship("Analysis", back_populates="file_analyses")


class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False)
    file_path = Column(String, nullable=False, default="")
    category = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    confidence = Column(Float, default=0.6)
    title = Column(String, nullable=False)
    detail = Column(Text, nullable=False)
    suggested_fix = Column(Text, default="")
    source = Column(String, default="llm")
    line_start = Column(Integer, nullable=True)
    line_end = Column(Integer, nullable=True)

    analysis = relationship("Analysis", back_populates="findings")


class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=True)
    repo_url = Column(String, nullable=False)
    pr_number = Column(Integer, nullable=False)
    review_mode = Column(String, default="general")
    status = Column(String, default="queued")
    stage = Column(String, default="queued")
    progress = Column(Float, default=0.0)
    error_message = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="analysis_jobs")
    analysis = relationship("Analysis", back_populates="jobs")
