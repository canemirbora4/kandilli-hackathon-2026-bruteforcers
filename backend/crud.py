"""CRUD operations for KandilliRecord."""

import json
from sqlalchemy.orm import Session
from typing import Optional
from models import KandilliRecord


def get_records(
    db: Session,
    type: Optional[str] = None,
    timestamp: Optional[str] = None,
    path: Optional[str] = None,
    is_labeled: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
):
    query = db.query(KandilliRecord)
    if type:
        query = query.filter(KandilliRecord.type == type)
    if timestamp:
        query = query.filter(KandilliRecord.timestamp.contains(timestamp))
    if path:
        query = query.filter(KandilliRecord.path.contains(path))
    if is_labeled is not None:
        query = query.filter(KandilliRecord.isLabeled == is_labeled)
    total = query.count()
    records = query.order_by(KandilliRecord.timestamp.desc()).offset(skip).limit(limit).all()
    return records, total



def get_record(db: Session, record_id: int):
    return db.query(KandilliRecord).filter(KandilliRecord.id == record_id).first()


def get_record_by_path(db: Session, path: str):
    return db.query(KandilliRecord).filter(KandilliRecord.path == path).first()


def create_record(db: Session, data: dict) -> KandilliRecord:
    # Serialize JSON fields
    if "boxCoord" in data and data["boxCoord"] is not None:
        data["boxCoord"] = json.dumps(data["boxCoord"])
    if "result" in data and data["result"] is not None:
        data["result"] = json.dumps(data["result"])

    record = KandilliRecord(**data)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_record(db: Session, record_id: int, data: dict) -> Optional[KandilliRecord]:
    record = db.query(KandilliRecord).filter(KandilliRecord.id == record_id).first()
    if not record:
        return None

    for key, value in data.items():
        if value is None and key not in ("boxCoord", "result", "boxType"):
            continue
        if key == "boxCoord" and value is not None:
            value = json.dumps(value)
        elif key == "result" and value is not None:
            value = json.dumps(value)
        setattr(record, key, value)

    db.commit()
    db.refresh(record)
    return record


def delete_record(db: Session, record_id: int) -> bool:
    record = db.query(KandilliRecord).filter(KandilliRecord.id == record_id).first()
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True


def serialize_record(record: KandilliRecord) -> dict:
    """ORM nesnesini JSON-safe dict'e dönüştür."""
    return {
        "id": record.id,
        "path": record.path,
        "type": record.type,
        "timestamp": record.timestamp,
        "interval": record.interval,
        "isLabeled": record.isLabeled,
        "isBackground": record.isBackground,
        "boxCoord": json.loads(record.boxCoord) if record.boxCoord else None,
        "boxType": record.boxType,
        "result": json.loads(record.result) if record.result else None,
        "isUsable": record.isUsable,
        "createdAt": record.createdAt.isoformat() if record.createdAt else None,
    }
