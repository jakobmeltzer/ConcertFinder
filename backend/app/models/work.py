from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Work(Base):
    __tablename__ = "works"

    id: Mapped[str] = mapped_column(String(150), primary_key=True)

    composer_id: Mapped[str] = mapped_column(
        ForeignKey("composers.id"),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(String(300), nullable=False)
    subtitle: Mapped[str | None] = mapped_column(String(300), nullable=True)

    year: Mapped[str | None] = mapped_column(String(50), nullable=True)
    period: Mapped[str | None] = mapped_column(String(100), nullable=True)
    duration: Mapped[str | None] = mapped_column(String(100), nullable=True)
    premiered: Mapped[str | None] = mapped_column(String(100), nullable=True)

    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    about: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list, server_default="{}")
    instrumentation_summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    instruments: Mapped[list["WorkInstrument"]] = relationship(
        back_populates="work", cascade="all, delete-orphan",
        order_by="(WorkInstrument.group_order, WorkInstrument.instrument_order)",
    )
    related_links: Mapped[list["WorkRelation"]] = relationship(
        foreign_keys="WorkRelation.work_id", back_populates="work",
        cascade="all, delete-orphan", order_by="WorkRelation.position",
    )

    composer: Mapped["Composer"] = relationship(
        back_populates="works",
    )

    programme_items: Mapped[list["ProgrammeItem"]] = relationship(
        back_populates="work",
    )