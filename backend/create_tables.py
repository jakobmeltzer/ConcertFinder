from app.database import Base, engine
from app.models import (
    Composer,
    Work,
    Orchestra,
    Venue,
    Conductor,
    Concert,
    ProgrammeItem,
)


print("Creating database tables...")

Base.metadata.create_all(bind=engine)

print("Database tables created successfully!")