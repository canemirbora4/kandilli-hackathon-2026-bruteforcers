"""
Kandilli Arşiv — FastAPI Backend
Etiketleme, dosya keşfi, galeri ve eğri düzeltme API'si.

Çalıştırma:
  cd backend && uvicorn main:app --reload --port 8000
"""

import json
import io
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from PIL import Image

from database import engine, get_db
from models import Base, KandilliRecord
from schemas import RecordCreate, RecordUpdate, CorrectionRequest
import crud
import file_scanner
import correction

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Kandilli Arşiv API",
    description="115 yıllık iklim verisi arşivi — etiketleme ve sayısallaştırma",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ────────────────────────────────────────────
#  DOSYA KEŞFİ & GALERİ
# ────────────────────────────────────────────

@app.get("/api/data-types")
def list_data_types():
    """Mevcut veri türlerini (kök klasörleri) listele."""
    return file_scanner.scan_data_types()


@app.get("/api/files/{type_key}")
def list_files(
    type_key: str,
    year: Optional[int] = None,
    frequency: Optional[str] = None,
    month: Optional[str] = None,
):
    """Türe göre TIF dosyalarını listele."""
    files = file_scanner.scan_files_for_type(type_key, year=year, frequency=frequency, month=month)
    return {"total": len(files), "files": files}


@app.get("/api/available-dates/{type_key}")
def available_dates(type_key: str, year: int):
    """Belirli yıl için hangi tarihler/aylar TIF mevcut."""
    return file_scanner.get_available_dates(type_key, year)


@app.get("/api/frequencies/{type_key}/{year}")
def frequencies_for_year(type_key: str, year: int):
    """Belirli yıl için mevcut frekanslar."""
    freqs = file_scanner.get_frequencies_for_year(type_key, year)
    return {"year": year, "frequencies": freqs}


@app.get("/api/months/{type_key}/{year}")
def months_for_year(type_key: str, year: int, frequency: Optional[str] = None):
    """Belirli yıl için mevcut ayları ve dosya sayılarını döndür."""
    months = file_scanner.get_months_for_year(type_key, year, frequency=frequency)
    return {"year": year, "months": months}


# ────────────────────────────────────────────
#  TIFF → PNG PROXY
# ────────────────────────────────────────────

@app.get("/api/tiff/{path:path}")
async def tiff_proxy(path: str):
    """Herhangi bir TIF dosyasını PNG olarak sun."""
    charts_dir = file_scanner.get_charts_dir()
    full_path = charts_dir / path

    if not full_path.exists():
        project_root = Path(__file__).resolve().parent.parent
        full_path = project_root / "public" / "data" / "charts" / "kandilli_data" / path

    if not full_path.exists():
        raise HTTPException(status_code=404, detail=f"Dosya bulunamadı: {path}")

    try:
        img = Image.open(str(full_path)).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="PNG", optimize=True)
        buf.seek(0)
        return StreamingResponse(
            buf,
            media_type="image/png",
            headers={"Cache-Control": "public, max-age=86400, immutable"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dönüşüm hatası: {e}")


@app.get("/api/thumbnail/{path:path}")
async def tiff_thumbnail(path: str, size: int = 300):
    """TIF dosyasının küçük boyutlu thumbnail'ini sun."""
    charts_dir = file_scanner.get_charts_dir()
    full_path = charts_dir / path

    if not full_path.exists():
        raise HTTPException(status_code=404, detail=f"Dosya bulunamadı: {path}")

    try:
        img = Image.open(str(full_path)).convert("RGB")
        img.thumbnail((size, size), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=75)
        buf.seek(0)
        return StreamingResponse(
            buf,
            media_type="image/jpeg",
            headers={"Cache-Control": "public, max-age=604800, immutable"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Thumbnail hatası: {e}")


# ────────────────────────────────────────────
#  CRUD — KandilliRecord
# ────────────────────────────────────────────

@app.get("/api/records")
def list_records(
    type: Optional[str] = None,
    timestamp: Optional[str] = None,
    path: Optional[str] = None,
    is_labeled: Optional[bool] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    records, total = crud.get_records(
        db, type=type, timestamp=timestamp, path=path,
        is_labeled=is_labeled, skip=(page - 1) * limit, limit=limit,
    )
    return {
        "records": [crud.serialize_record(r) for r in records],
        "total": total,
        "page": page,
        "totalPages": max(1, -(-total // limit)),
    }


@app.get("/api/records/{record_id}")
def get_record(record_id: int, db: Session = Depends(get_db)):
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı")
    return crud.serialize_record(record)


@app.post("/api/records")
def create_record(data: RecordCreate, db: Session = Depends(get_db)):
    record = crud.create_record(db, data.model_dump())
    return crud.serialize_record(record)


@app.put("/api/records/{record_id}")
def update_record(record_id: int, data: RecordUpdate, db: Session = Depends(get_db)):
    updated = crud.update_record(db, record_id, data.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı")
    return crud.serialize_record(updated)


@app.delete("/api/records/{record_id}")
def delete_record(record_id: int, db: Session = Depends(get_db)):
    success = crud.delete_record(db, record_id)
    if not success:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı")
    return {"ok": True}


# ────────────────────────────────────────────
#  EĞRİ DÜZELTME
# ────────────────────────────────────────────

@app.post("/api/correct/{record_id}")
def correct_curve(record_id: int, data: CorrectionRequest, db: Session = Depends(get_db)):
    """Tracing düzeltme — lineX/lineY kaydet."""
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı")

    result = correction.apply_tracing_correction(data.lineX, data.lineY)
    crud.update_record(db, record_id, {"result": result, "isLabeled": True})
    return {"ok": True, "result": result}


@app.post("/api/auto-correct/{record_id}")
def auto_correct(record_id: int, db: Session = Depends(get_db)):
    """boxCoord alan crop → digitize.py pipeline."""
    record = crud.get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Kayıt bulunamadı")

    if not record.boxCoord:
        raise HTTPException(status_code=400, detail="boxCoord tanımlı değil")

    box = json.loads(record.boxCoord)
    result = correction.auto_correct_curve(record.path, box)

    if "error" in result and result["error"]:
        raise HTTPException(status_code=500, detail=result["error"])

    crud.update_record(db, record_id, {"result": result, "isLabeled": True})
    return {"ok": True, "result": result}
