from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ingestion.resolution import EntityType
from app.models import Composer, Conductor, IngestionAlias, Orchestra, Venue, Work


class SQLAlchemyCatalog:
    def __init__(self, db: Session):
        self.db = db

    def rows(self, entity_type: EntityType) -> list[tuple[str, str]]:
        model = {"orchestra": Orchestra, "conductor": Conductor, "composer": Composer}[entity_type]
        return list(self.db.execute(select(model.id, model.name)).all())

    def venues(self) -> list[tuple[str, str, str, str]]:
        return list(self.db.execute(select(Venue.id, Venue.name, Venue.city, Venue.country)).all())

    def works_for_composer(self, composer_id: str) -> list[tuple[str, str]]:
        return list(self.db.execute(select(Work.id, Work.title).where(Work.composer_id == composer_id)).all())

    def alias_target(self, entity_type: EntityType, normalized_alias: str, context_id: str = "") -> str | None:
        return self.db.execute(
            select(IngestionAlias.entity_id).where(
                IngestionAlias.entity_type == entity_type,
                IngestionAlias.normalized_alias == normalized_alias,
                IngestionAlias.context_id == context_id,
            )
        ).scalar_one_or_none()

    def target_exists(self, entity_type: EntityType, entity_id: str) -> bool:
        model = {"orchestra": Orchestra, "venue": Venue, "conductor": Conductor, "composer": Composer, "work": Work}[entity_type]
        return self.db.get(model, entity_id) is not None
