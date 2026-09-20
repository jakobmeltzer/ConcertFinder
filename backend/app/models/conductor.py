from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Conductor(Base):
    __tablename__ = "conductors"

    id: Mapped[str] = mapped_column(String(150), primary_key=True)

    name: Mapped[str] = mapped_column(String(300), nullable=False)

    website: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    concerts: Mapped[list["Concert"]] = relationship(
        back_populates="conductor",
    )