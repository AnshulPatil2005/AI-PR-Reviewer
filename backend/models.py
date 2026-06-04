from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    analyses = relationship("Analysis", back_populates="user", cascade="all, delete-orphan")


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    repo_url = Column(String, nullable=False)
    pr_number = Column(Integer, nullable=False)
    pr_title = Column(String, default="")
    risk_score = Column(Integer, nullable=False)
    explanation = Column(Text, nullable=False)
    suggestions = Column(Text, nullable=False)  # JSON array stored as string
    created_at = Column(DateTime, default=datetime.utcnow)
    is_deleted = Column(Boolean, default=False)

    user = relationship("User", back_populates="analyses")
    file_analyses = relationship("FileAnalysis", back_populates="analysis", cascade="all, delete-orphan")


class FileAnalysis(Base):
    __tablename__ = "file_analyses"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False)
    filename = Column(String, nullable=False)
    risk_score = Column(Integer, nullable=False)
    explanation = Column(Text, nullable=False)

    analysis = relationship("Analysis", back_populates="file_analyses")
