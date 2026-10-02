from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class InstrumentFamily(Base):
    __tablename__ = "instrument_families"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)


class Instrument(Base):
    __tablename__ = "instruments"
    __table_args__ = (UniqueConstraint("family_id", "name"),)

    id: Mapped[str] = mapped_column(String(150), primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    family_id: Mapped[str] = mapped_column(ForeignKey("instrument_families.id"), index=True)
    family: Mapped["InstrumentFamily"] = relationship()


class WorkInstrument(Base):
    __tablename__ = "work_instruments"
    __table_args__ = (
        CheckConstraint("quantity IS NULL OR quantity > 0"),
        CheckConstraint("group_order >= 0 AND instrument_order >= 0"),
        UniqueConstraint("work_id", "group_order", "instrument_order"),
    )

    work_id: Mapped[str] = mapped_column(ForeignKey("works.id", ondelete="CASCADE"), primary_key=True)
    instrument_id: Mapped[str] = mapped_column(ForeignKey("instruments.id"), primary_key=True, index=True)
    quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Preserve source wording (e.g. "4 × Flute", "1st Violins"); never infer player counts.
    display_label: Mapped[str] = mapped_column(String(200))
    group_order: Mapped[int] = mapped_column(Integer)
    instrument_order: Mapped[int] = mapped_column(Integer)
    work: Mapped["Work"] = relationship(back_populates="instruments")
    instrument: Mapped["Instrument"] = relationship()
