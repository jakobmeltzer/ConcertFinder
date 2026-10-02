"""Add durable source identity, timezone/title metadata, aliases and programme ordering guard."""
from sqlalchemy import text

from app.models import IngestionAlias


def upgrade(connection):
    connection.execute(text("ALTER TABLE concerts ADD COLUMN IF NOT EXISTS title VARCHAR(500)"))
    connection.execute(text("ALTER TABLE concerts ADD COLUMN IF NOT EXISTS timezone VARCHAR(100)"))
    connection.execute(text("ALTER TABLE concerts ADD COLUMN IF NOT EXISTS source VARCHAR(100)"))
    connection.execute(text("ALTER TABLE concerts ADD COLUMN IF NOT EXISTS source_event_id VARCHAR(200)"))

    connection.execute(text("""
        CREATE UNIQUE INDEX IF NOT EXISTS uq_concert_source_event
        ON concerts (source, source_event_id)
        WHERE source IS NOT NULL AND source_event_id IS NOT NULL
    """))
    connection.execute(text("""
        CREATE UNIQUE INDEX IF NOT EXISTS uq_programme_item_concert_order
        ON programme_items (concert_id, programme_order)
    """))
    IngestionAlias.__table__.create(connection, checkfirst=True)
