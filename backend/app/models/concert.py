from datetime import date, time

from sqlalchemy import Date, ForeignKey, String, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Concert(Base):
    __tablename__ = "concerts"

    id: Mapped[str] = mapped_column(String(200), primary_key=True)

    date: Mapped[date] = mapped_column(Date, nullable=False)
    time: Mapped[time] = mapped_column(Time, nullable=False)

    orchestra_id: Mapped[str] = mapped_column(
        ForeignKey("orchestras.id"),
        nullable=False,
    )

    venue_id: Mapped[str] = mapped_column(
        ForeignKey("venues.id"),
        nullable=False,
    )

    conductor_id: Mapped[str | None] = mapped_column(
        ForeignKey("conductors.id"),
        nullable=True,
    )

    ticket_url: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )

    source_url: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )

    orchestra: Mapped["Orchestra"] = relationship(
        back_populates="concerts",
    )

    venue: Mapped["Venue"] = relationship(
        back_populates="concerts",
    )

    conductor: Mapped["Conductor | None"] = relationship(
        back_populates="concerts",
    )

    programme_items: Mapped[list["ProgrammeItem"]] = relationship(
        back_populates="concert",
        cascade="all, delete-orphan",
        order_by="ProgrammeItem.programme_order",
    )