"""
Klasör hiyerarşisi tarayıcı — public/data/charts/kandilli_data altındaki TIF dosyalarını keşfeder.

Gerçek yapı:
  Nem:       kandilli_data/Nem-GÜNLÜK/{Yıl}/{Ay}/{YYYY_AY-GG}.tif
  Sıcaklık:  kandilli_data/TERMOGRAM-1_1911-2005/{Yıl}/HAFTALIK/{Ay}/{YYYY_AY-GG}.tif

Dosya adı formatı: 1998_OCAK-01.tif  →  1998-01-01

NOT: macOS dosya sistemi NFD (decomposed) Unicode kullanır.
     Türkçe karakterler (Ğ, Ş, İ, Ü, Ö, Ç) NFD olarak gelir.
     Tüm string karşılaştırmaları NFC normalize edilmelidir.
"""

import os
import re
import unicodedata
from pathlib import Path
from datetime import datetime
from typing import Optional


def nfc(s: str) -> str:
    """macOS NFD → NFC normalize."""
    return unicodedata.normalize("NFC", s)


# ── Türkçe ay adları → sayı ──
TURKISH_MONTHS = {
    "OCAK": 1, "ŞUBAT": 2, "MART": 3, "NİSAN": 4,
    "MAYIS": 5, "HAZİRAN": 6, "TEMMUZ": 7, "AĞUSTOS": 8,
    "EYLÜL": 9, "EKİM": 10, "KASIM": 11, "ARALIK": 12,
    # ASCII fallbacks
    "SUBAT": 2, "NISAN": 4, "HAZIRAN": 6, "AGUSTOS": 8,
    "EYLUL": 9,
}

MONTH_NUM_TO_TR = {v: k for k, v in TURKISH_MONTHS.items() if len(k) > 3}

# ── Veri türü tespiti ──
TYPE_MAPPING = {
    "NEM": "Nem",
    "TERMOGRAM": "Sıcaklık",
    "SICAKLIK": "Sıcaklık",
}

CHARTS_DIR = Path(__file__).resolve().parent.parent / "public" / "data" / "charts" / "kandilli_data"


def get_charts_dir() -> Path:
    return CHARTS_DIR


def detect_type_from_folder(folder_name: str) -> str:
    upper = nfc(folder_name).upper()
    for key, val in TYPE_MAPPING.items():
        if key in upper:
            return val
    return "Bilinmeyen"


def detect_frequency(folder_name: str) -> str:
    upper = nfc(folder_name).upper()
    if "HAFTALIK" in upper:
        return "Weekly"
    return "Daily"


def parse_turkish_month(name: str) -> Optional[int]:
    """Türkçe ay adını sayıya çevir. NFC normalize eder."""
    normalized = nfc(name).upper().strip()
    return TURKISH_MONTHS.get(normalized)


def parse_filename_date(filename: str, year: Optional[int] = None, month: Optional[int] = None) -> Optional[str]:
    """
    Dosya adından tarih parse et.
    Format: YYYY_AY-GG.tif  (ör: 1998_OCAK-01.tif → 1998-01-01)
    """
    stem = nfc(Path(filename).stem)

    # Primary format: YYYY_TURKCE_AY-GG
    m = re.match(r"(\d{4})_([A-ZÇĞİÖŞÜa-zçğıöşü]+)-(\d{1,2})", stem)
    if m:
        yr = int(m.group(1))
        month_name = m.group(2).upper()
        day = int(m.group(3))
        mo = TURKISH_MONTHS.get(month_name)
        if mo:
            try:
                return datetime(yr, mo, day).strftime("%Y-%m-%d")
            except ValueError:
                pass

    # Fallback: YYYY_MM-DD or YYYY_MM_DD
    m = re.match(r"(\d{4})[_-](\d{1,2})[_-](\d{1,2})", stem)
    if m:
        try:
            return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3))).strftime("%Y-%m-%d")
        except ValueError:
            pass

    # Fallback: just day number, year/month from context
    m = re.match(r"^(\d{1,2})$", stem)
    if m and year and month:
        try:
            return datetime(year, month, int(m.group(1))).strftime("%Y-%m-%d")
        except ValueError:
            pass

    return None


def scan_data_types() -> list[dict]:
    """Kök klasörleri tara, hangi veri türleri mevcut."""
    if not CHARTS_DIR.exists():
        return []

    results = []
    for entry in sorted(CHARTS_DIR.iterdir()):
        if not entry.is_dir() or entry.name.startswith("."):
            continue

        folder_name = nfc(entry.name)
        data_type = detect_type_from_folder(folder_name)
        years = []
        frequencies = set()

        for sub in sorted(entry.iterdir()):
            if sub.is_dir() and re.match(r"^\d{4}$", sub.name):
                years.append(int(sub.name))
                for freq_dir in sub.iterdir():
                    if freq_dir.is_dir():
                        fname = nfc(freq_dir.name).upper()
                        if "HAFTALIK" in fname:
                            frequencies.add("Weekly")
                        elif "GÜNLÜK" in fname or "GUNLUK" in fname:
                            frequencies.add("Daily")
                        elif parse_turkish_month(freq_dir.name) is not None:
                            frequencies.add("Daily")

        if not frequencies:
            freq_from_name = detect_frequency(folder_name)
            frequencies.add(freq_from_name)

        results.append({
            "key": folder_name,
            "label": data_type,
            "type": data_type,
            "years": sorted(years),
            "frequencies": sorted(frequencies),
        })

    return results


def scan_files_for_type(
    type_key: str,
    year: Optional[int] = None,
    frequency: Optional[str] = None,
    month: Optional[str] = None,
) -> list[dict]:
    """Belirli bir veri türü için dosyaları listele."""
    root = CHARTS_DIR / type_key
    if not root.exists():
        return []

    files = []
    data_type = detect_type_from_folder(type_key)
    month_nfc = nfc(month).upper() if month else None

    def walk_dir(current: Path, ctx: dict):
        try:
            entries = sorted(current.iterdir())
        except PermissionError:
            return

        for entry in entries:
            if entry.name.startswith("."):
                continue
            entry_name_nfc = nfc(entry.name)

            if entry.is_dir():
                if re.match(r"^\d{4}$", entry_name_nfc):
                    if year and int(entry_name_nfc) != year:
                        continue
                    walk_dir(entry, {**ctx, "year": int(entry_name_nfc)})
                elif "GÜNLÜK" in entry_name_nfc.upper() or "GUNLUK" in entry_name_nfc.upper():
                    if frequency and frequency != "Daily":
                        continue
                    walk_dir(entry, {**ctx, "frequency": "Daily"})
                elif "HAFTALIK" in entry_name_nfc.upper():
                    if frequency and frequency != "Weekly":
                        continue
                    walk_dir(entry, {**ctx, "frequency": "Weekly"})
                elif parse_turkish_month(entry_name_nfc) is not None:
                    # Bu bir ay klasörü
                    month_name_nfc = nfc(entry_name_nfc).upper()
                    if month_nfc and month_name_nfc != month_nfc:
                        continue
                    walk_dir(entry, {
                        **ctx,
                        "month_name": entry_name_nfc,
                        "month_num": parse_turkish_month(entry_name_nfc),
                    })
                else:
                    walk_dir(entry, ctx)
            elif entry.suffix.lower() in (".tif", ".tiff"):
                date_str = parse_filename_date(
                    entry.name,
                    year=ctx.get("year"),
                    month=ctx.get("month_num"),
                )
                freq = ctx.get("frequency", detect_frequency(type_key))

                try:
                    rel_path = entry.relative_to(CHARTS_DIR)
                except ValueError:
                    rel_path = Path(entry.name)

                files.append({
                    "name": nfc(entry.stem),
                    "path": nfc(str(rel_path).replace("\\", "/")),
                    "directory": nfc(str(entry.parent.relative_to(CHARTS_DIR)).replace("\\", "/")),
                    "type": data_type,
                    "year": ctx.get("year", 0),
                    "month": nfc(ctx["month_name"]) if ctx.get("month_name") else None,
                    "frequency": freq,
                    "sizeMB": f"{entry.stat().st_size / (1024 * 1024):.1f}",
                    "date": date_str,
                })

    walk_dir(root, {"frequency": detect_frequency(type_key)})
    return files


def get_available_dates(type_key: str, year: int, frequency: Optional[str] = None) -> dict:
    """Belirli yıl için hangi aylarda ve günlerde TIF mevcut."""
    files = scan_files_for_type(type_key, year=year, frequency=frequency)

    months = set()
    dates = []

    for f in files:
        if f.get("month"):
            months.add(f["month"])
        if f.get("date"):
            dates.append(f["date"])

    return {
        "year": year,
        "months": sorted(months, key=lambda m: parse_turkish_month(m) or 0),
        "dates": sorted(set(dates)),
    }


def get_frequencies_for_year(type_key: str, year: int) -> list[str]:
    """Belirli yıl klasörünün altında hangi frekanslar var."""
    year_dir = CHARTS_DIR / type_key / str(year)
    if not year_dir.exists():
        return []

    frequencies = set()
    for entry in year_dir.iterdir():
        if entry.is_dir():
            name = nfc(entry.name).upper()
            if "HAFTALIK" in name:
                frequencies.add("Weekly")
            elif "GÜNLÜK" in name or "GUNLUK" in name:
                frequencies.add("Daily")
            elif parse_turkish_month(entry.name) is not None:
                frequencies.add("Daily")

    if not frequencies:
        frequencies.add("Daily")
    return sorted(frequencies)


def get_months_for_year(type_key: str, year: int, frequency: Optional[str] = None) -> list[dict]:
    """Yıl için mevcut ayları ve her aydaki dosya sayısını döndür."""
    files = scan_files_for_type(type_key, year=year, frequency=frequency)

    month_counts: dict[str, int] = {}
    for f in files:
        m = f.get("month")
        if m:
            month_counts[m] = month_counts.get(m, 0) + 1

    return [
        {"name": name, "num": parse_turkish_month(name) or 0, "count": count}
        for name, count in sorted(
            month_counts.items(),
            key=lambda x: parse_turkish_month(x[0]) or 0,
        )
    ]
