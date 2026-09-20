from fastapi import FastAPI

from app.routers import composers, works, concerts


app = FastAPI(
    title="ConcertFinder API",
    description="API for discovering classical music performances.",
    version="1.0.0",
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "ConcertFinder API is running",
    }


app.include_router(composers.router)
app.include_router(works.router)
app.include_router(concerts.router)