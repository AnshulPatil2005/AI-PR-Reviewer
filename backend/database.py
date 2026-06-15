import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

# SQLite needs check_same_thread=False; ignored for PostgreSQL
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_runtime_schema():
    inspector = inspect(engine)

    if "users" in inspector.get_table_names():
        existing = {col["name"] for col in inspector.get_columns("users")}
        additions = {
            "monthly_quota": "INTEGER DEFAULT 10",
            "analyses_this_month": "INTEGER DEFAULT 0",
            "quota_reset_date": "DATETIME",
        }
        with engine.begin() as conn:
            for name, ddl in additions.items():
                if name not in existing:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {name} {ddl}"))

    if "analyses" in inspector.get_table_names():
        existing = {col["name"] for col in inspector.get_columns("analyses")}
        additions = {
            "review_mode": "TEXT DEFAULT 'general'",
            "review_confidence": "FLOAT DEFAULT 0",
            "coverage_summary": "TEXT DEFAULT '{}'",
            "model_metadata": "TEXT DEFAULT '{}'",
            "top_priorities": "TEXT DEFAULT '[]'",
            "status": "TEXT DEFAULT 'completed'",
        }
        with engine.begin() as conn:
            for name, ddl in additions.items():
                if name not in existing:
                    conn.execute(text(f"ALTER TABLE analyses ADD COLUMN {name} {ddl}"))

    if "file_analyses" in inspector.get_table_names():
        existing = {col["name"] for col in inspector.get_columns("file_analyses")}
        additions = {
            "change_summary": "TEXT DEFAULT ''",
            "categories": "TEXT DEFAULT '[]'",
            "why_it_matters": "TEXT DEFAULT ''",
            "coverage_status": "TEXT DEFAULT 'reviewed'",
            "skipped_reason": "TEXT DEFAULT ''",
            "priority_rank": "INTEGER DEFAULT 0",
            "reviewed_chars": "INTEGER DEFAULT 0",
            "total_chars": "INTEGER DEFAULT 0",
        }
        with engine.begin() as conn:
            for name, ddl in additions.items():
                if name not in existing:
                    conn.execute(text(f"ALTER TABLE file_analyses ADD COLUMN {name} {ddl}"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
