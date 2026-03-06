# CV pipeline: extracts numerical time-series data from scanned analog chart paper (TIF) using grid calibration and curve isolation

import cv2
import numpy as np
import pandas as pd
from pathlib import Path
from scipy.signal import savgol_filter
from PIL import Image
import argparse
import sys


def load_image(path: str) -> np.ndarray:
    # OpenCV can't handle old JPEG-compressed TIFFs from the archive, so we use Pillow
    try:
        pil_img = Image.open(str(path)).convert("RGB")
        return cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    except Exception as e:
        raise FileNotFoundError(f"Cannot load image {path}: {e}")


def find_plot_area(gray: np.ndarray) -> tuple[int, int, int, int]:
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 30, 100)
    edges = cv2.dilate(edges, cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3)), iterations=2)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        h, w = gray.shape
        return 0, 0, w, h

    x, y, w, h = cv2.boundingRect(max(contours, key=cv2.contourArea))
    m = 10
    return x + m, y + m, w - 2 * m, h - 2 * m


def detect_grid_lines(gray_crop: np.ndarray) -> dict:
    lines = cv2.HoughLinesP(
        cv2.Canny(gray_crop, 40, 120), 1, np.pi / 180,
        threshold=100, minLineLength=gray_crop.shape[1] // 4, maxLineGap=20
    )

    h_ys, v_xs = [], []
    if lines is not None:
        for x1, y1, x2, y2 in lines[:, 0]:
            angle = abs(np.degrees(np.arctan2(y2 - y1, x2 - x1)))
            if angle < 5:
                h_ys.append((y1 + y2) // 2)
            elif angle > 85:
                v_xs.append((x1 + x2) // 2)

    return {"horizontal": sorted(set(h_ys)), "vertical": sorted(set(v_xs))}


def isolate_curve(img_crop: np.ndarray, ink_color: str = "black") -> np.ndarray:
    if ink_color == "black":
        gray = cv2.cvtColor(img_crop, cv2.COLOR_BGR2GRAY)
        binary = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV, blockSize=31, C=8
        )
    elif ink_color == "blue":
        hsv = cv2.cvtColor(img_crop, cv2.COLOR_BGR2HSV)
        # Blue-violet ink on archive paper spans Hue 95–180; union of two subranges avoids red bleed
        binary = cv2.bitwise_or(
            cv2.inRange(hsv, np.array([95,  40, 20]), np.array([140, 255, 220])),
            cv2.inRange(hsv, np.array([140, 30, 15]), np.array([180, 255, 200]))
        )
    elif ink_color == "red":
        hsv = cv2.cvtColor(img_crop, cv2.COLOR_BGR2HSV)
        binary = cv2.bitwise_or(
            cv2.inRange(hsv, np.array([0, 80, 50]),   np.array([10, 255, 255])),
            cv2.inRange(hsv, np.array([160, 80, 50]), np.array([180, 255, 255]))
        )
    else:
        raise ValueError(f"Unknown ink_color: {ink_color!r}. Choose black, blue, or red.")

    binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN,  np.ones((2, 2), np.uint8))
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    return binary


def remove_grid_lines(binary: np.ndarray) -> np.ndarray:
    h, w = binary.shape

    h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (w // 8, 1))
    h_lines = cv2.dilate(cv2.erode(binary, h_kernel), h_kernel)
    cleaned = cv2.subtract(binary, h_lines)

    v_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, h // 8))
    v_lines = cv2.dilate(cv2.erode(binary, v_kernel), v_kernel)
    cleaned = cv2.subtract(cleaned, v_lines)

    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))

    margin = max(4, h // 60)
    cleaned[:margin, :] = 0
    cleaned[-margin:, :] = 0
    cleaned[:, :margin] = 0
    cleaned[:, -margin:] = 0
    return cleaned


def select_curve_component(binary: np.ndarray, seed_point: tuple[int, int] | None = None) -> np.ndarray:
    n_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(binary, connectivity=8)
    if n_labels <= 1:
        return binary

    if seed_point is not None:
        sx, sy = seed_point
        sy = max(0, min(sy, binary.shape[0] - 1))
        sx = max(0, min(sx, binary.shape[1] - 1))
        label_at_seed = labels[sy, sx]
        if label_at_seed > 0:
            return np.where(labels == label_at_seed, 255, 0).astype(np.uint8)
        for r in range(1, 30):
            for dy in range(-r, r + 1):
                for dx in range(-r, r + 1):
                    ny, nx = sy + dy, sx + dx
                    if 0 <= ny < binary.shape[0] and 0 <= nx < binary.shape[1]:
                        if labels[ny, nx] > 0:
                            return np.where(labels == labels[ny, nx], 255, 0).astype(np.uint8)

    h, w = binary.shape
    min_width = w // 3

    candidates = []
    for i in range(1, n_labels):
        comp_w = stats[i, cv2.CC_STAT_WIDTH]
        area = stats[i, cv2.CC_STAT_AREA]
        if comp_w >= min_width:
            thickness = area / comp_w
            candidates.append((i, area, thickness))

    if candidates:
        best = min(candidates, key=lambda c: c[2])
        return np.where(labels == best[0], 255, 0).astype(np.uint8)

    largest = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
    return np.where(labels == largest, 255, 0).astype(np.uint8)


def extract_curve_pixels(gray_crop: np.ndarray, binary: np.ndarray,
                         single_trace: bool = False,
                         transposed: bool = False,
                         seed_point: tuple[int, int] | None = None) -> tuple[np.ndarray, np.ndarray]:
    h, w = gray_crop.shape

    if transposed:
        clean = remove_grid_lines(binary)
        if not single_trace:
            clean = select_curve_component(clean, seed_point=seed_point)
        row_xs = {}
        for y in range(clean.shape[0]):
            dark = np.where(clean[y, :] > 0)[0]
            if len(dark) > 0:
                row_xs[y] = int(np.median(dark))
        if not row_xs:
            return np.array([]), np.array([])
        ys_known = np.array(sorted(row_xs.keys()))
        xs_known = np.array([row_xs[y] for y in ys_known])
        y_all = np.arange(ys_known[0], ys_known[-1] + 1)
        x_all = np.interp(y_all, ys_known, xs_known).astype(int)
        if len(x_all) > 11:
            x_all = pd.Series(x_all).rolling(11, center=True, min_periods=1).median().astype(int).values
        return y_all, x_all

    inv = (255 - gray_crop).astype(np.float32)
    inv_blur = cv2.GaussianBlur(inv, (1, 11), 0)

    top_margin = max(8, h // 15)
    bot_margin = max(4, h // 30)
    side_margin = max(4, w // 200)
    inv_blur[:top_margin, :] = 0
    inv_blur[-bot_margin:, :] = 0
    inv_blur[:, :side_margin] = 0
    inv_blur[:, -side_margin:] = 0

    # Pass 1: rough estimate
    raw_ys = np.argmax(inv_blur, axis=0).astype(float)
    rough = pd.Series(raw_ys).rolling(51, center=True, min_periods=1).median().values

    # Pass 2: constrained search within band around rough estimate
    search_band = max(20, h // 10)
    refined = np.zeros(w, dtype=int)
    for x in range(w):
        center = int(rough[x])
        lo = max(0, center - search_band)
        hi = min(h, center + search_band)
        refined[x] = lo + np.argmax(inv_blur[lo:hi, x])

    final_ys = pd.Series(refined).rolling(11, center=True, min_periods=1).median().astype(int).values
    xs = np.arange(w)

    return xs, final_ys


def pixels_to_dataframe(
    x_pixels, y_pixels, plot_width, plot_height,
    time_start, time_end, y_min, y_max,
    transposed: bool = False
) -> pd.DataFrame:
    total_seconds = (time_end - time_start).total_seconds()
    if transposed:
        # x_pixels = time axis (rows), y_pixels = value axis (cols)
        timestamps = [
            time_start + pd.Timedelta(seconds=float(t) / plot_height * total_seconds)
            for t in x_pixels
        ]
        # x pixel left→right: left = y_min, right = y_max
        values = y_min + (y_pixels.astype(float) / plot_width) * (y_max - y_min)
    else:
        timestamps = [
            time_start + pd.Timedelta(seconds=float(x) / plot_width * total_seconds)
            for x in x_pixels
        ]
        # pixel y=0 is the top of the chart → y_max
        values = y_max - (y_pixels.astype(float) / plot_height) * (y_max - y_min)
    return pd.DataFrame({"timestamp": timestamps, "value": values}).set_index("timestamp").sort_index()


def smooth_curve(df: pd.DataFrame, window: int = 21) -> pd.DataFrame:
    if len(df) < window:
        return df
    df = df.copy()
    df["value_raw"] = df["value"]
    df["value"] = savgol_filter(df["value"], window_length=window, polyorder=3)
    return df


def build_overlay(img_crop, x_pixels, y_pixels) -> np.ndarray:
    overlay = img_crop.copy()
    for x, y in zip(x_pixels.tolist(), y_pixels.tolist()):
        cv2.circle(overlay, (x, y), 1, (0, 200, 0), -1)
    return overlay


def process_tif(
    image_path: str,
    y_min: float = -40.0,
    y_max: float = 50.0,
    time_start: str = "1900-01-01 00:00",
    time_end: str = "1900-01-08 00:00",
    ink_color: str = "black",
    smooth: bool = True,
    save_overlay: bool = False,
    transposed: bool = False,
    seed_point: tuple[int, int] | None = None,
) -> pd.DataFrame:
    img = load_image(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    x0, y0, gw, gh = find_plot_area(gray)
    crop = img[y0:y0 + gh, x0:x0 + gw]

    adjusted_seed = None
    if seed_point is not None:
        adjusted_seed = (seed_point[0] - x0, seed_point[1] - y0)

    gray_crop = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    binary = isolate_curve(crop, ink_color)
    x_pix, y_pix = extract_curve_pixels(gray_crop, binary, single_trace=(ink_color != "black"),
                                         transposed=transposed, seed_point=adjusted_seed)

    if len(x_pix) == 0:
        print(f"WARNING: no curve detected in {image_path}")
        return pd.DataFrame(columns=["value"])

    df = pixels_to_dataframe(
        x_pix, y_pix, gw, gh,
        pd.Timestamp(time_start), pd.Timestamp(time_end),
        y_min, y_max, transposed=transposed
    )

    if smooth:
        df = smooth_curve(df)

    if save_overlay:
        out_path = Path(image_path).stem + "_overlay.jpg"
        cv2.imwrite(out_path, build_overlay(crop, x_pix, y_pix))
        print(f"Overlay saved: {out_path}")

    return df


def build_parser():
    p = argparse.ArgumentParser(description="Extract numerical data from Kandilli analog chart TIF scans")
    mode = p.add_mutually_exclusive_group(required=True)
    mode.add_argument("--input", help="Single TIF file to process")
    mode.add_argument("--batch", help="Directory of TIF files to process in bulk")

    p.add_argument("--y_min",     type=float, default=-40.0, help="Y-axis minimum value (default: -40)")
    p.add_argument("--y_max",     type=float, default=50.0,  help="Y-axis maximum value (default: 50)")
    p.add_argument("--start",     default="1900-01-01 00:00", help="Chart start time, e.g. '1987-03-02 00:00'")
    p.add_argument("--end",       default="1900-01-08 00:00", help="Chart end time, e.g. '1987-03-09 00:00'")
    p.add_argument("--ink",       default="black", choices=["black", "blue", "red"])
    p.add_argument("--output",    default="output.csv")
    p.add_argument("--overlay",    action="store_true", help="Save curve overlay images for visual verification")
    p.add_argument("--no_smooth",  action="store_true", help="Disable Savitzky-Golay smoothing")
    p.add_argument("--transposed", action="store_true", help="Portrait-orientation charts where time runs top-to-bottom (e.g. wind direction)")
    p.add_argument("--seed",       help="Seed pixel on the curve as x,y (e.g. '100,800') for component selection")
    return p


def main():
    args = build_parser().parse_args()
    seed = None
    if args.seed:
        parts = args.seed.split(",")
        seed = (int(parts[0]), int(parts[1]))
    kwargs = dict(
        y_min=args.y_min, y_max=args.y_max,
        time_start=args.start, time_end=args.end,
        ink_color=args.ink, smooth=not args.no_smooth, save_overlay=args.overlay,
        transposed=args.transposed, seed_point=seed,
    )

    if args.input:
        df = process_tif(args.input, **kwargs)
        out = args.output if args.output.endswith(".csv") else args.output + ".csv"
        df.to_csv(out)
        print(f"Saved {len(df)} data points -> {out}")
        print(df.describe())
    else:
        src_dir = Path(args.batch)
        tif_files = sorted(src_dir.glob("*.tif"))
        if not tif_files:
            print(f"No TIF files found in: {src_dir}")
            sys.exit(1)

        out_dir = Path(args.output)
        out_dir.mkdir(parents=True, exist_ok=True)

        frames = []
        for tif in tif_files:
            print(f"Processing: {tif.name}")
            df = process_tif(str(tif), **kwargs)
            df.to_csv(out_dir / (tif.stem + ".csv"))
            frames.append(df)

        if frames:
            combined = pd.concat(frames).sort_index()
            combined.to_csv(out_dir / "combined.csv")
            print(f"\nDone. {len(combined)} total points -> {out_dir}/")


if __name__ == "__main__":
    main()
