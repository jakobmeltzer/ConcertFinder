from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ProgrammeItem(Base):
    __tablename__ = "programme_items"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    concert_id: Mapped[str] = mapped_column(
        ForeignKey("concerts.id"),
        nullable=False,
    )

    work_id: Mapped[str] = mapped_column(
        ForeignKey("works.id"),
        nullable=False,
    )

    programme_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    concert: Mapped["Concert"] = relationship(
        back_populates="programme_items",
    )

    work: Mapped["Work"] = relationship(
        back_populates="programme_items",
    )