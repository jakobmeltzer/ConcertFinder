from sqlalchemy import String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class IngestionAlias(Base):
    """Human-approved alias from source text to a canonical entity ID.

    entity_id is deliberately not a polymorphic foreign key. The resolver verifies
    the target exists in the appropriate canonical table before using the alias.
    """

    __tablename__ = "ingestion_aliases"
    __table_args__ = (
        UniqueConstraint("entity_type", "context_id", "normalized_alias", name="uq_ingestion_alias_type_context_value"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    entity_type: Mapped[str] = mapped_column(String(30), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(200), nullable=False)
    alias: Mapped[str] = mapped_column(String(500), nullable=False)
    context_id: Mapped[str] = mapped_column(String(200), nullable=False, default="", server_default="")
    normalized_alias: Mapped[str] = mapped_column(String(500), nullable=False)
    source: Mapped[str | None] = mapped_column(String(100), nullable=True)
