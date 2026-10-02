"""Add queryable instrumentation and ordered editorial metadata; preserve existing tables."""
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models import InstrumentFamily, Instrument, WorkInstrument, WorkRelation
from seed_work_metadata import seed_work_metadata


def upgrade(connection):
    connection.execute(text("ALTER TABLE works ADD COLUMN IF NOT EXISTS about TEXT[] NOT NULL DEFAULT '{}'"))
    connection.execute(text("ALTER TABLE works ADD COLUMN IF NOT EXISTS instrumentation_summary TEXT"))
    for model in (InstrumentFamily, Instrument, WorkInstrument, WorkRelation):
        model.__table__.create(connection, checkfirst=True)
    with Session(bind=connection) as db:
        seed_work_metadata(db)
        db.flush()
        # Commit the Session's participation, not the outer migration transaction.
        db.commit()
