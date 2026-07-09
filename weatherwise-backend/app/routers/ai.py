from fastapi import APIRouter, Query, HTTPException, status
from pydantic import BaseModel

from app.services.ai_service import AIService

router = APIRouter(prefix="/api/v1/ai", tags=["AI Analysis"])


class ChatRequest(BaseModel):
    session_id: str = "default"
    message: str
    lat: float
    lon: float


@router.post("/chat")
async def chat(body: ChatRequest):
    svc = AIService()
    try:
        result = await svc.chat(body.session_id, body.lat, body.lon, body.message)
        return {"success": True, "data": result}
    finally:
        await svc.close()


@router.get("/risks")
async def get_risks(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    svc = AIService()
    try:
        result = await svc.get_risks(lat, lon)
        return {"success": True, "data": result}
    finally:
        await svc.close()


@router.get("/recommendations")
async def get_recommendations(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    svc = AIService()
    try:
        result = await svc.get_recommendations(lat, lon)
        return {"success": True, "data": result}
    finally:
        await svc.close()


@router.get("/historical-comparison")
async def historical_comparison(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    svc = AIService()
    try:
        result = await svc.get_historical_comparison(lat, lon)
        return {"success": True, "data": result}
    finally:
        await svc.close()


@router.get("/farm-suggestions")
async def farm_suggestions(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    svc = AIService()
    try:
        result = await svc.get_farm_suggestions(lat, lon)
        return {"success": True, "data": result}
    finally:
        await svc.close()


@router.get("/solar-suggestions")
async def solar_suggestions(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    svc = AIService()
    try:
        result = await svc.get_solar_suggestions(lat, lon)
        return {"success": True, "data": result}
    finally:
        await svc.close()


@router.get("/expert-analysis")
async def expert_analysis(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    svc = AIService()
    try:
        result = await svc.get_expert_analysis(lat, lon)
        return {"success": True, "data": result}
    finally:
        await svc.close()


@router.get("/risk-monitor")
async def risk_monitor(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
):
    svc = AIService()
    try:
        result = await svc.get_risk_monitor(lat, lon)
        return {"success": True, "data": result}
    finally:
        await svc.close()
