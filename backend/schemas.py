"""Pydantic schemas for request/response validation."""

from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime


# ── boxType enum values ──
BOX_TYPES = ["Dagilma", "Siliklik", "KagitDefect", "NoData"]
BoxTypeLiteral = Literal["Dagilma", "Siliklik", "KagitDefect", "NoData"]


class RecordBase(BaseModel):
    path: str
    type: str
    timestamp: str
    interval: str


class RecordCreate(RecordBase):
    isLabeled: bool = False
    isBackground: bool = False
    boxCoord: Optional[list[float]] = None
    boxType: Optional[BoxTypeLiteral] = None
    result: Optional[dict] = None
    isUsable: bool = True


class RecordUpdate(BaseModel):
    path: Optional[str] = None
    type: Optional[str] = None
    timestamp: Optional[str] = None
    interval: Optional[str] = None
    isLabeled: Optional[bool] = None
    isBackground: Optional[bool] = None
    boxCoord: Optional[list[float]] = None
    boxType: Optional[BoxTypeLiteral] = None
    result: Optional[dict] = None
    isUsable: Optional[bool] = None


class RecordResponse(RecordBase):
    id: int
    isLabeled: bool
    isBackground: bool
    boxCoord: Optional[list[float]] = None
    boxType: Optional[str] = None
    result: Optional[dict] = None
    isUsable: bool
    createdAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class CorrectionRequest(BaseModel):
    """Manuel çizgi düzeltme verisi — tracing modundan gelen noktalar."""
    lineX: list[float]
    lineY: list[float]


class FileInfo(BaseModel):
    name: str
    path: str
    directory: str
    type: str
    year: int
    month: Optional[str] = None
    frequency: Optional[str] = None
    sizeMB: str
    date: Optional[str] = None


class DataTypeInfo(BaseModel):
    key: str           # e.g. "Nem-GÜNLÜK", "TERMOGRAM-1_1911-2005"
    label: str         # e.g. "Nem", "Sıcaklık"
    type: str          # "Nem" | "Sıcaklık"
    years: list[int]
    frequencies: list[str]   # ["GÜNLÜK"] or ["GÜNLÜK", "HAFTALIK"]


class AvailableDates(BaseModel):
    year: int
    months: list[str]        # ["OCAK", "ŞUBAT", ...]
    dates: list[str]         # ["1980-01-15", ...]
