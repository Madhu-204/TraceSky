from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException, status

from app.routers.auth import get_current_user
from app.schemas.auth import UserResponse
from app.services.weather_service import WeatherService

router = APIRouter(prefix="/api/v1/weather", tags=["Weather"])


@router.get("/current")
async def get_current_weather(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    _: UserResponse = Depends(get_current_user),
):
    svc = WeatherService()
    try:
        result = await svc.get_current_weather(lat, lon)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to fetch weather data from upstream"
            )
        return {"success": True, "data": result}
    finally:
        await svc.close()


@router.get("/forecast")
async def get_forecast(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    days: int = Query(7, ge=1, le=16, description="Number of forecast days"),
    _: UserResponse = Depends(get_current_user),
):
    svc = WeatherService()
    try:
        result = await svc.get_forecast(lat, lon, days)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to fetch forecast data from upstream"
            )
        return {"success": True, "data": result}
    finally:
        await svc.close()


@router.get("/historical")
async def get_historical(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    _: UserResponse = Depends(get_current_user),
):
    try:
        start = date.fromisoformat(start_date)
        end = date.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD."
        )

    if (end - start).days > 365:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Date range cannot exceed 365 days"
        )

    svc = WeatherService()
    try:
        result = await svc.get_historical(lat, lon, start, end)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to fetch historical data from upstream"
            )
        return {"success": True, "data": result}
    finally:
        await svc.close()
