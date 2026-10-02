from sqlalchemy import CheckConstraint, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class WorkRelation(Base):
    __tablename__ = "work_relations"
    __table_args__ = (
        CheckConstraint("work_id <> related_work_id"),
        CheckConstraint("position >= 0"),
        UniqueConstraint("work_id", "position"),
    )

    work_id: Mapped[str] = mapped_column(ForeignKey("works.id", ondelete="CASCADE"), primary_key=True)
    related_work_id: Mapped[str] = mapped_column(ForeignKey("works.id", ondelete="CASCADE"), primary_key=True, index=True)
    position: Mapped[int] = mapped_column(Integer)
    work: Mapped["Work"] = relationship(foreign_keys=[work_id], back_populates="related_links")
    related_work: Mapped["Work"] = relationship(foreign_keys=[related_work_id])
