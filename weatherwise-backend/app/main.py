from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import auth, weather, ai
from app.core.security import CORS_ORIGINS

# Create FastAPI app
app = FastAPI(
    title="WeatherWise AI API",
    description="Backend API for WeatherWise AI application",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    init_db()


# Include routers
app.include_router(auth.router)
app.include_router(weather.router)
app.include_router(ai.router)


# Root endpoint
@app.get("/")
def root():
    return {"message": "WeatherWise AI API", "status": "running"}


# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)