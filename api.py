"""FastAPI backend for Kandilli chart digitization pipeline.

Endpoints:
  Browse:   /api/data-types, /api/frequencies, /api/months, /api/files
  Image:    /api/tiff/{path}, /api/thumbnail/{path}
  Records:  /api/records (GET, POST), /api/records/{id} (GET, PUT)
  Pipeline: /digitize, /digitize/upload
  Misc:     /health, /tool
"""
from __future__ import annotations

import os
import io
import re
import json
import uuid
import base64
import shutil
import sqlite3
from pathlib import Path
from datetime import datetime

import cv2
import numpy as np
import pandas as pd
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from digitize import (
    load_image, find_plot_area,
    isolate_curve, extract_curve_pixels, pixels_to_dataframe, smooth_curve,
    process_tif,
)
from labeler import repair_image, get_box_report

app = FastAPI(title="Kandilli Digitizer", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
OVERLAY_DIR = BASE_DIR / "overlays"
DB_PATH = BASE_DIR / "kandilli.db"
UPLOAD_DIR.mkdir(exist_ok=True)
OVERLAY_DIR.mkdir(exist_ok=True)

app.mount("/overlays", StaticFiles(directory=str(OVERLAY_DIR)), name="overlays")

# ---------------------------------------------------------------------------
# Directory → type mapping and month names
# ---------------------------------------------------------------------------

TURKISH_MONTHS = {
    "OCAK": 1, "ŞUBAT": 2, "SUBAT": 2, "MART": 3, "NİSAN": 4, "NISAN": 4,
    "MAYIS": 5, "HAZİRAN": 6, "HAZIRAN": 6, "TEMMUZ": 7, "AĞUSTOS": 8,
    "AGUSTOS": 8, "EYLÜL": 9, "EYLUL": 9, "EKİM": 10, "EKIM": 10,
    "KASIM": 11, "ARALIK": 12,
}

_FREQ_MAP = {"GÜNLÜK": "Daily", "GUNLUK": "Daily", "HAFTALIK": "Weekly"}

# Flat dirs that sit directly in the workspace root (month-level folders)
_FLAT_DIR_TYPE = {
    "ARALIK": "Nem", "NİSAN": "Nem", "NISAN": "Nem", "OCAK": "Nem",
    "MART": "Sicaklik", "HAZİRAN": "Sicaklik", "HAZIRAN": "Sicaklik",
    "TERMOGRAM_1": "Sicaklik", "TERMOGRAM_2": "Sicaklik",
}


def _norm(s: str) -> str:
    return s.upper().replace("İ", "I").replace("Ş", "S").replace("Ü", "U").replace("Ö", "O").replace("Ç", "C").replace("Ğ", "G")


def _month_num(name: str) -> int:
    n = _norm(name)
    for k, v in TURKISH_MONTHS.items():
        kn = _norm(k)
        if kn == n or kn in n or n in kn:
            return v
    return 0


def _add_tif(index, type_key, dtype, year, month_name, frequency, tif_name, rel_path, day):
    if type_key not in index:
        index[type_key] = {
            "label": "Nem" if dtype == "Nem" else "Sıcaklık",
            "type": dtype,
            "years": set(),
            "dirs": {},
        }
    info = index[type_key]
    info["years"].add(year)
    info["dirs"].setdefault(year, {}).setdefault(frequency, {}).setdefault(month_name, []).append({
        "name": tif_name,
        "path": rel_path,
        "directory": os.path.dirname(rel_path),
        "type": dtype,
        "year": year,
        "month": month_name,
        "frequency": frequency,
        "date": day,
    })


_TIF_RE = re.compile(r'(\d{4})_(.+?)-(\d{2})\.tif', re.IGNORECASE)


def _scan_data_dirs():
    """Scan workspace for TIF data directories and build an index.

    Supports:
      - Flat dirs:  ARALIK/2004_ARALIK-01.tif
      - Nem-GÜNLÜK: Nem-GÜNLÜK/{year}/{month}/{tif}
      - TERMOGRAM-1_1911-2005: TERMOGRAM-1_1911-2005/{year}/{freq}/{month}/{tif}
    """
    index = {}

    all_dirs = sorted(os.listdir(BASE_DIR))
    all_norms = {_norm(d) for d in all_dirs if (BASE_DIR / d).is_dir()}
    has_nem_gunluk = any(n == "NEM" or ("NEM" in n and "GUNLUK" in n) for n in all_norms)
    has_termogram_full = any(n == "TERMOGRAM" or ("TERMOGRAM" in n and "1911" in n) for n in all_norms)

    for d in all_dirs:
        full = BASE_DIR / d
        if not full.is_dir() or d.startswith(('.', '_', 'frontend', 'node')):
            continue

        d_norm = _norm(d)

        # ---- Pattern 1: NEM  (year/month/tifs) ----
        if d_norm in ("NEM",) or ("NEM" in d_norm and "GUNLUK" in d_norm):
            for yr_name in sorted(os.listdir(full)):
                yr_path = full / yr_name
                if not yr_path.is_dir() or not yr_name.isdigit():
                    continue
                year = int(yr_name)
                for mo_name in sorted(os.listdir(yr_path)):
                    mo_path = yr_path / mo_name
                    if not mo_path.is_dir():
                        continue
                    for tif in sorted(os.listdir(mo_path)):
                        m = _TIF_RE.match(tif)
                        if not m:
                            continue
                        rel = f"{d}/{yr_name}/{mo_name}/{tif}"
                        _add_tif(index, "nem", "Nem", year, mo_name, "Daily", tif, rel, m.group(3))
            continue

        # ---- Pattern 2: TERMOGRAM  (year/freq/month/tifs) ----
        if d_norm == "TERMOGRAM" or ("TERMOGRAM" in d_norm and "1911" in d_norm):
            for yr_name in sorted(os.listdir(full)):
                yr_path = full / yr_name
                if not yr_path.is_dir() or not yr_name.isdigit():
                    continue
                year = int(yr_name)
                for freq_name in sorted(os.listdir(yr_path)):
                    freq_path = yr_path / freq_name
                    if not freq_path.is_dir():
                        continue
                    freq_norm = _norm(freq_name)
                    frequency = _FREQ_MAP.get(freq_norm, "Daily")
                    for mo_name in sorted(os.listdir(freq_path)):
                        mo_path = freq_path / mo_name
                        if not mo_path.is_dir():
                            # TIFs might be directly under freq_path (no month subfolder)
                            if mo_name.lower().endswith('.tif'):
                                m = _TIF_RE.match(mo_name)
                                if m:
                                    rel = f"{d}/{yr_name}/{freq_name}/{mo_name}"
                                    month_from_fn = m.group(2)
                                    _add_tif(index, "sicaklik", "Sicaklik", year, month_from_fn, frequency, mo_name, rel, m.group(3))
                            continue
                        for tif in sorted(os.listdir(mo_path)):
                            m = _TIF_RE.match(tif)
                            if not m:
                                continue
                            rel = f"{d}/{yr_name}/{freq_name}/{mo_name}/{tif}"
                            _add_tif(index, "sicaklik", "Sicaklik", year, mo_name, frequency, tif, rel, m.group(3))
            continue

        # ---- Pattern 3: Flat month-level dirs (legacy) ----
        # Skip flat dirs if the comprehensive dataset already covers them
        if has_nem_gunluk and d_norm in {_norm(k) for k in _FLAT_DIR_TYPE if _FLAT_DIR_TYPE[k] == "Nem"}:
            continue
        if has_termogram_full and d_norm in {_norm(k) for k in _FLAT_DIR_TYPE if _FLAT_DIR_TYPE[k] == "Sicaklik"}:
            continue

        dtype = None
        for pattern, tp in _FLAT_DIR_TYPE.items():
            if d_norm == _norm(pattern) or d == pattern:
                dtype = tp
                break
        if dtype is None:
            continue

        tifs = sorted([f for f in os.listdir(full) if f.lower().endswith('.tif')])
        if not tifs:
            continue

        type_key = "nem" if dtype == "Nem" else "sicaklik"
        for tif in tifs:
            m = _TIF_RE.match(tif)
            if not m:
                continue
            year = int(m.group(1))
            rel = f"{d}/{tif}"
            _add_tif(index, type_key, dtype, year, d, "Daily", tif, rel, m.group(3))

    return index


DATA_INDEX = _scan_data_dirs()


# ---------------------------------------------------------------------------
# SQLite records DB
# ---------------------------------------------------------------------------

def _init_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("""
        CREATE TABLE IF NOT EXISTS records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT NOT NULL,
            type TEXT,
            timestamp TEXT,
            interval TEXT DEFAULT 'Daily',
            isLabeled INTEGER DEFAULT 0,
            isBackground INTEGER DEFAULT 0,
            boxCoord TEXT,
            boxType TEXT,
            result TEXT,
            isUsable INTEGER DEFAULT 1,
            createdAt TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.commit()
    conn.close()

_init_db()


def _db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


# ---------------------------------------------------------------------------
# Browse endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/api/data-types")
def get_data_types():
    result = []
    for key, info in DATA_INDEX.items():
        years = sorted(info["years"])
        all_freqs = set()
        total_files = 0
        for y_data in info["dirs"].values():
            for freq, months in y_data.items():
                all_freqs.add(freq)
                for files in months.values():
                    total_files += len(files)
        result.append({
            "key": key,
            "label": info["label"],
            "type": info["type"],
            "years": years,
            "frequencies": sorted(all_freqs),
            "totalFiles": total_files,
        })
    return result


@app.get("/api/frequencies/{type_key}/{year}")
def get_frequencies(type_key: str, year: int):
    info = DATA_INDEX.get(type_key)
    if not info or year not in info["dirs"]:
        return {"frequencies": ["Daily"]}
    freqs = sorted(info["dirs"][year].keys())
    return {"frequencies": freqs if freqs else ["Daily"]}


@app.get("/api/months/{type_key}/{year}")
def get_months(type_key: str, year: int, frequency: str = "Daily"):
    info = DATA_INDEX.get(type_key)
    if not info or year not in info["dirs"]:
        return {"months": []}

    freq_data = info["dirs"][year].get(frequency, {})
    months = []
    for month_name, files in sorted(freq_data.items()):
        months.append({
            "name": month_name,
            "num": _month_num(month_name),
            "count": len(files),
        })
    months.sort(key=lambda m: m["num"])
    return {"months": months}


@app.get("/api/available-dates/{type_key}")
def get_available_dates(type_key: str, year: int = 0, frequency: str = "Daily"):
    info = DATA_INDEX.get(type_key)
    if not info:
        return {"dates": []}
    dates = []
    target_years = [year] if year else sorted(info["years"])
    for y in target_years:
        if y not in info["dirs"]:
            continue
        freq_data = info["dirs"][y].get(frequency, {})
        for month_name, files in freq_data.items():
            mn = _month_num(month_name)
            for f in files:
                dates.append(f"{y}-{str(mn).zfill(2)}-{f['date']}")
    return {"dates": sorted(dates)}


@app.get("/api/files/{type_key}")
def get_files(type_key: str, year: int = 0, month: str = "", frequency: str = "Daily"):
    info = DATA_INDEX.get(type_key)
    if not info:
        return {"files": []}

    files = []
    target_years = [year] if year else sorted(info["years"])
    for y in target_years:
        if y not in info["dirs"]:
            continue
        freq_data = info["dirs"][y].get(frequency, {})
        for month_name, month_files in freq_data.items():
            if month and month_name != month:
                continue
            for f in month_files:
                try:
                    size_mb = os.path.getsize(BASE_DIR / f["path"]) / (1024 * 1024)
                except OSError:
                    size_mb = 0
                files.append({
                    **f,
                    "sizeMB": f"{size_mb:.1f}",
                })
    return {"files": files}


# ---------------------------------------------------------------------------
# Image serving (TIF → PNG/JPEG)
# ---------------------------------------------------------------------------

@app.get("/api/tiff/{path:path}")
def serve_tiff(path: str):
    full = BASE_DIR / path
    if not full.exists():
        raise HTTPException(404, f"File not found: {path}")

    try:
        img = Image.open(str(full)).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=90)
        buf.seek(0)
        return StreamingResponse(buf, media_type="image/jpeg")
    except Exception as e:
        raise HTTPException(500, f"Image conversion error: {e}")


@app.get("/api/thumbnail/{path:path}")
def serve_thumbnail(path: str):
    full = BASE_DIR / path
    if not full.exists():
        raise HTTPException(404, f"File not found: {path}")

    try:
        img = Image.open(str(full)).convert("RGB")
        img.thumbnail((400, 200))
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=75)
        buf.seek(0)
        return StreamingResponse(buf, media_type="image/jpeg")
    except Exception as e:
        raise HTTPException(500, f"Thumbnail error: {e}")


# ---------------------------------------------------------------------------
# Records CRUD
# ---------------------------------------------------------------------------

@app.get("/api/records")
def list_records(
    path: str = "",
    type: str = "",
    search: str = "",
    limit: int = 50,
    offset: int = 0,
):
    conn = _db()
    query = "SELECT * FROM records WHERE 1=1"
    params = []
    if path:
        query += " AND path = ?"
        params.append(path)
    if type:
        query += " AND type = ?"
        params.append(type)
    if search:
        query += " AND (path LIKE ? OR type LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])
    query += " ORDER BY id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    rows = conn.execute(query, params).fetchall()
    conn.close()

    records = []
    for r in rows:
        rec = dict(r)
        # Parse JSON fields
        for field in ["boxCoord", "result"]:
            if rec.get(field):
                try:
                    rec[field] = json.loads(rec[field])
                except (json.JSONDecodeError, TypeError):
                    pass
        rec["isLabeled"] = bool(rec.get("isLabeled"))
        rec["isBackground"] = bool(rec.get("isBackground"))
        rec["isUsable"] = bool(rec.get("isUsable"))
        records.append(rec)

    return {"records": records, "total": len(records)}


@app.get("/api/records/{record_id}")
def get_record(record_id: int):
    conn = _db()
    row = conn.execute("SELECT * FROM records WHERE id = ?", (record_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(404, "Record not found")
    rec = dict(row)
    for field in ["boxCoord", "result"]:
        if rec.get(field):
            try:
                rec[field] = json.loads(rec[field])
            except (json.JSONDecodeError, TypeError):
                pass
    rec["isLabeled"] = bool(rec.get("isLabeled"))
    rec["isBackground"] = bool(rec.get("isBackground"))
    rec["isUsable"] = bool(rec.get("isUsable"))
    return rec


@app.post("/api/records")
def create_record(data: dict):
    conn = _db()
    result_str = json.dumps(data.get("result")) if data.get("result") else None
    boxcoord_str = json.dumps(data.get("boxCoord")) if data.get("boxCoord") else None

    cur = conn.execute(
        """INSERT INTO records (path, type, timestamp, interval, isLabeled, isBackground,
           boxCoord, boxType, result, isUsable) VALUES (?,?,?,?,?,?,?,?,?,?)""",
        (
            data.get("path", ""),
            data.get("type", ""),
            data.get("timestamp", ""),
            data.get("interval", "Daily"),
            1 if data.get("isLabeled") else 0,
            1 if data.get("isBackground") else 0,
            boxcoord_str,
            data.get("boxType"),
            result_str,
            1 if data.get("isUsable", True) else 0,
        )
    )
    conn.commit()
    record_id = cur.lastrowid
    conn.close()
    return {"id": record_id, "message": "Created"}


@app.put("/api/records/{record_id}")
def update_record(record_id: int, data: dict):
    conn = _db()
    existing = conn.execute("SELECT id FROM records WHERE id = ?", (record_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(404, "Record not found")

    result_str = json.dumps(data.get("result")) if data.get("result") else None
    boxcoord_str = json.dumps(data.get("boxCoord")) if data.get("boxCoord") else None

    conn.execute(
        """UPDATE records SET path=?, type=?, timestamp=?, interval=?, isLabeled=?,
           isBackground=?, boxCoord=?, boxType=?, result=?, isUsable=? WHERE id=?""",
        (
            data.get("path", ""),
            data.get("type", ""),
            data.get("timestamp", ""),
            data.get("interval", "Daily"),
            1 if data.get("isLabeled") else 0,
            1 if data.get("isBackground") else 0,
            boxcoord_str,
            data.get("boxType"),
            result_str,
            1 if data.get("isUsable", True) else 0,
            record_id,
        )
    )
    conn.commit()
    conn.close()
    return {"id": record_id, "message": "Updated"}


# ---------------------------------------------------------------------------
# Digitize endpoint
# ---------------------------------------------------------------------------

class BoxAnnotation(BaseModel):
    BoxCoord: list[float]
    BoxType: str
    Boxenter: list[float] | None = None
    Boxexit: list[float] | None = None


class DigitizeRequest(BaseModel):
    image_path: str | None = None
    chart_type: str
    timestamp: str | None = None
    interval: str = "daily"
    start_point: list[float]
    end_point: list[float]
    trajectory: list[list[float]] = []
    boxes: list[BoxAnnotation] = []
    cal_point_1: list[float] | None = None  # [y_pixel, value]
    cal_point_2: list[float] | None = None  # [y_pixel, value]
    time_start: str | None = None
    time_end: str | None = None


@app.post("/digitize")
async def digitize(req: DigitizeRequest):
    image_path = req.image_path
    if not image_path:
        raise HTTPException(400, "image_path is required")

    full_path = BASE_DIR / image_path
    if not full_path.exists():
        raise HTTPException(400, f"Image not found: {image_path}")

    type_config = {
        "nem":      {"ink": "blue",  "y_min": 0,   "y_max": 100},
        "sicaklik": {"ink": "black", "y_min": -15,  "y_max": 45},
    }
    if req.chart_type not in type_config:
        raise HTTPException(400, f"chart_type must be 'nem' or 'sicaklik'")

    cfg = type_config[req.chart_type]
    ink_color = cfg["ink"]

    sp = tuple(int(v) for v in req.start_point)
    ep = tuple(int(v) for v in req.end_point)
    guide = [tuple(int(v) for v in p) for p in req.trajectory] if req.trajectory else None
    n_traj = len(req.trajectory)

    print(f"[DIGITIZE] image={image_path} type={req.chart_type} cal1={req.cal_point_1} cal2={req.cal_point_2}")
    print(f"[DIGITIZE] start={sp} end={ep} trajectory_pts={n_traj}")
    if guide and len(guide) > 2:
        print(f"[DIGITIZE] traj_y range: {min(p[1] for p in guide)} - {max(p[1] for p in guide)}")

    img = load_image(str(full_path))

    is_labeled = len(req.boxes) > 0
    tmp_path = None

    if is_labeled:
        traj_tuples = [tuple(p) for p in req.trajectory]
        box_dicts = [b.model_dump() for b in req.boxes]
        img = repair_image(img, box_dicts, traj_tuples, ink_color=ink_color)
        tmp_path = UPLOAD_DIR / f"_tmp_{uuid.uuid4().hex[:8]}.png"
        cv2.imwrite(str(tmp_path), img)
        process_path = str(tmp_path)
    else:
        process_path = str(full_path)

    try:
        if req.time_start and req.time_end:
            time_start, time_end = req.time_start, req.time_end
        elif req.timestamp:
            try:
                dt = pd.Timestamp(req.timestamp)
                time_start = dt.strftime("%Y-%m-%d 00:00")
                time_end = (dt + pd.Timedelta(days=1)).strftime("%Y-%m-%d 00:00")
            except Exception:
                time_start, time_end = "1900-01-01 00:00", "1900-01-02 00:00"
        else:
            time_start, time_end = "1900-01-01 00:00", "1900-01-02 00:00"

        cal_y1 = req.cal_point_1[0] if req.cal_point_1 else None
        cal_v1 = req.cal_point_1[1] if req.cal_point_1 else None
        cal_y2 = req.cal_point_2[0] if req.cal_point_2 else None
        cal_v2 = req.cal_point_2[1] if req.cal_point_2 else None

        result = process_tif(
            process_path,
            y_min=cfg["y_min"], y_max=cfg["y_max"],
            time_start=time_start, time_end=time_end,
            ink_color=ink_color, smooth=True,
            start_point=sp, end_point=ep, guide_path=guide,
            cal_y1=cal_y1, cal_v1=cal_v1, cal_y2=cal_y2, cal_v2=cal_v2,
            return_pixels=True,
        )

        df, (px, py) = result
        print(f"[DIGITIZE] result: {len(df)} pts, py=[{py.min()}-{py.max()}], mean={df['value'].mean():.1f}")

        if len(df) == 0:
            raise HTTPException(422, "No curve detected")

        line_x = df.index.strftime("%Y-%m-%d %H:%M:%S").tolist() if hasattr(df.index, 'strftime') else list(range(len(df)))
        line_y = df["value"].round(2).tolist()

        # Generate overlay: draw extracted curve on the original image
        overlay_img = img.copy()
        pts = np.column_stack((px, py)).reshape(-1, 1, 2).astype(np.int32)
        if len(pts) > 1:
            cv2.polylines(overlay_img, [pts], False, (0, 255, 0), 2, cv2.LINE_AA)
        _, jpeg_buf = cv2.imencode(".jpg", overlay_img, [cv2.IMWRITE_JPEG_QUALITY, 85])
        overlay_b64 = base64.b64encode(jpeg_buf.tobytes()).decode("ascii")

        return {
            "path": image_path,
            "type": req.chart_type,
            "isLabeled": is_labeled,
            "line_x": line_x,
            "line_y": line_y,
            "points": len(df),
            "stats": {
                "min": round(df["value"].min(), 2),
                "max": round(df["value"].max(), 2),
                "mean": round(df["value"].mean(), 2),
                "std": round(df["value"].std(), 2),
            },
            "overlay_base64": overlay_b64,
        }
    finally:
        if tmp_path and tmp_path.exists():
            tmp_path.unlink()


@app.post("/digitize/upload")
async def digitize_upload(
    file: UploadFile = File(...),
    json_data: str = Form(...),
):
    req_dict = json.loads(json_data)
    suffix = Path(file.filename or "image.tif").suffix
    tmp_file = UPLOAD_DIR / f"{uuid.uuid4().hex[:12]}{suffix}"
    with open(tmp_file, "wb") as f:
        shutil.copyfileobj(file.file, f)
    try:
        req_dict["image_path"] = str(tmp_file)
        req = DigitizeRequest(**req_dict)
        return await digitize(req)
    finally:
        if tmp_file.exists():
            tmp_file.unlink()


# ---------------------------------------------------------------------------
# Serve trajectory tool
# ---------------------------------------------------------------------------

@app.get("/tool")
def serve_tool():
    html_path = BASE_DIR / "trajectory_tool.html"
    if html_path.exists():
        return FileResponse(str(html_path), media_type="text/html")
    raise HTTPException(404, "trajectory_tool.html not found")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
