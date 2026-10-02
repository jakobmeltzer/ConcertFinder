"""Run numbered migrations atomically. Run after create_tables.py on a fresh DB."""
import importlib.util
from pathlib import Path

from sqlalchemy import text
from app.database import engine


def migrate():
    with engine.begin() as connection:
        connection.execute(text("SELECT pg_advisory_xact_lock(72160401)"))
        connection.execute(text("CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())"))
        for path in sorted((Path(__file__).parent / "migrations").glob("[0-9]*.py")):
            version = path.stem
            if connection.execute(text("SELECT 1 FROM schema_migrations WHERE version = :version"), {"version": version}).scalar():
                continue
            spec = importlib.util.spec_from_file_location(version, path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            module.upgrade(connection)
            connection.execute(text("INSERT INTO schema_migrations (version) VALUES (:version)"), {"version": version})
            print(f"Applied {version}")


if __name__ == "__main__":
    migrate()
