"""SQLAlchemy model mirroring Prisma KandilliRecord (read from same DB)."""

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base


class KandilliRecord(Base):
    __tablename__ = "KandilliRecord"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    path = Column(String, nullable=False)
    type = Column(String, nullable=False)           # "Nem" | "Sıcaklık"
    timestamp = Column(String, nullable=False)       # ISO date string
    interval = Column(String, nullable=False)        # "Daily" | "Weekly"

    isLabeled = Column(Boolean, default=False)
    isBackground = Column(Boolean, default=False)

    boxCoord = Column(String, nullable=True)         # JSON: [x, y, w, h]
    boxType = Column(String, nullable=True)          # Dagilma|Siliklik|KagitDefect|NoData
    result = Column(String, nullable=True)           # JSON: {lineX: [], lineY: []}
    isUsable = Column(Boolean, default=True)

    createdAt = Column(DateTime, server_default=func.now())
