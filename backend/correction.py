"""
Eğri düzeltme algoritması — placeholder.

Kullanıcının admin panelinde mouse ile çizdiği tracing verilerini (lineX, lineY)
veya bounding box içindeki eğriyi yeniden sayısallaştırmak için kullanılır.

İki mod:
1. Tracing: Kullanıcı mouse ile eğriyi takip eder → doğrudan lineX, lineY alınır
2. Auto-correct: boxCoord alanı içinde digitize.py pipeline'ı çalıştırılır
"""

import sys
from pathlib import Path

# digitize.py'yi import edebilmek için proje kökünü path'e ekle
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


def apply_tracing_correction(line_x: list[float], line_y: list[float]) -> dict:
    """
    Kullanıcının mouse ile çizdiği tracing verisini doğrudan döndür.
    İleriye dönük: smoothing, interpolation, outlier removal uygulanabilir.
    """
    # Placeholder: şimdilik veriyi olduğu gibi döndür
    # TODO: Savitzky-Golay smoothing, gap interpolation
    return {
        "lineX": line_x,
        "lineY": line_y,
    }


def auto_correct_curve(
    image_path: str,
    box_coord: list[float],
    ink_color: str = "black"
) -> dict:
    """
    boxCoord alanı içindeki eğriyi otomatik olarak yeniden sayısallaştır.
    digitize.py'deki mevcut pipeline fonksiyonlarını kullanır.
    """
    try:
        from digitize import load_image, isolate_curve, extract_curve_pixels, remove_grid_lines
        import cv2
        import numpy as np

        full_path = PROJECT_ROOT / "public" / image_path
        img = load_image(str(full_path))

        # boxCoord: [x, y, width, height]
        x, y, w, h = [int(c) for c in box_coord]
        crop = img[y:y + h, x:x + w]

        gray_crop = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        binary = isolate_curve(crop, ink_color)
        x_pix, y_pix = extract_curve_pixels(
            gray_crop, binary,
            single_trace=(ink_color != "black"),
            ink_color=ink_color,
            img_crop=crop,
        )

        if len(x_pix) == 0:
            return {"lineX": [], "lineY": [], "error": "Eğri bulunamadı"}

        return {
            "lineX": x_pix.tolist(),
            "lineY": y_pix.tolist(),
        }
    except ImportError as e:
        return {
            "lineX": [],
            "lineY": [],
            "error": f"digitize.py import edilemedi: {e}. CV bağımlılıklarını kurun.",
        }
    except Exception as e:
        return {
            "lineX": [],
            "lineY": [],
            "error": str(e),
        }
