# CV pipeline: extracts numerical time-series data from scanned analog chart paper (TIF) using grid calibration and curve isolation
from __future__ import annotations

import cv2
import numpy as np
import pandas as pd
from pathlib import Path
from scipy.signal import savgol_filter, find_peaks
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


_NEM_GRID_NORM = np.array([0.000, 0.180, 0.321, 0.436, 0.533, 0.616, 0.685, 0.753, 0.828, 0.900, 1.000])
_NEM_GRID_PCT  = np.array([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100], dtype=float)


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
    else:
        raise ValueError(f"Unknown ink_color: {ink_color!r}. Choose black or blue.")

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


def _extract_binary_path(binary: np.ndarray, single_trace: bool,
                         seed_point: tuple[int, int] | None,
                         transposed: bool) -> tuple[np.ndarray, np.ndarray]:
    """Per-column/row median on a clean binary mask (for colored inks with good HSV isolation)."""
    clean = remove_grid_lines(binary)
    if not single_trace:
        clean = select_curve_component(clean, seed_point=seed_point)

    if transposed:
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

    h, w = clean.shape
    col_ys = {}
    for x in range(w):
        dark = np.where(clean[:, x] > 0)[0]
        if len(dark) > 0:
            col_ys[x] = int(np.median(dark))
    if not col_ys:
        return np.array([]), np.array([])

    xs_known = np.array(sorted(col_ys.keys()))
    ys_known = np.array([col_ys[x] for x in xs_known])

    max_gap = max(20, w // 100)
    x_out, y_out = [xs_known[0]], [ys_known[0]]
    for i in range(1, len(xs_known)):
        gap = xs_known[i] - xs_known[i - 1]
        if gap <= max_gap:
            for x in range(xs_known[i - 1] + 1, xs_known[i] + 1):
                y_out.append(int(np.interp(x, [xs_known[i - 1], xs_known[i]],
                                           [ys_known[i - 1], ys_known[i]])))
                x_out.append(x)
        else:
            x_out.append(xs_known[i])
            y_out.append(ys_known[i])

    x_all = np.array(x_out)
    y_all = np.array(y_out)
    if len(y_all) > 11:
        y_all = pd.Series(y_all).rolling(11, center=True, min_periods=1).median().astype(int).values
    return x_all, y_all


def _extract_grayscale_path(gray_crop: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Two-pass darkest-band tracking on grayscale (for black ink on colored grid paper)."""
    h, w = gray_crop.shape
    inv = (255 - gray_crop).astype(np.float32)
    inv_blur = cv2.GaussianBlur(inv, (1, 11), 0)

    top_margin = max(8, h // 15)
    bot_margin = max(4, h // 30)
    side_margin = max(4, w // 200)
    inv_blur[:top_margin, :] = 0
    inv_blur[-bot_margin:, :] = 0
    inv_blur[:, :side_margin] = 0
    inv_blur[:, -side_margin:] = 0

    raw_ys = np.argmax(inv_blur, axis=0).astype(float)
    rough = pd.Series(raw_ys).rolling(51, center=True, min_periods=1).median().values

    search_band = max(20, h // 10)
    refined = np.zeros(w, dtype=int)
    for x in range(w):
        center = int(rough[x])
        lo = max(0, center - search_band)
        hi = min(h, center + search_band)
        refined[x] = lo + np.argmax(inv_blur[lo:hi, x])

    final_ys = pd.Series(refined).rolling(11, center=True, min_periods=1).median().astype(int).values
    return np.arange(w), final_ys


def _extract_rchannel_path(img_crop: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """R-channel tracking for blue/dark ink on pink grid paper (humidity charts).
    Blue ink absorbs red light -> appears dark in R channel.
    Pink grid reflects red -> suppressed automatically in inverted R."""
    b, g, r = cv2.split(img_crop)
    inv_r = (255 - r).astype(np.float32)
    inv_r = cv2.GaussianBlur(inv_r, (1, 11), 0)

    h, w = inv_r.shape
    top_m = max(8, h // 10)
    bot_m = max(8, h // 10)
    side_m = max(4, w // 100)
    inv_r[:top_m, :] = 0
    inv_r[-bot_m:, :] = 0
    inv_r[:, :side_m] = 0
    inv_r[:, -side_m:] = 0

    raw_ys = np.argmax(inv_r, axis=0).astype(float)
    rough = pd.Series(raw_ys).rolling(101, center=True, min_periods=1).median().values

    search_band = max(15, h // 10)
    refined = np.zeros(w, dtype=int)
    for x in range(w):
        center = int(rough[x])
        lo = max(0, center - search_band)
        hi = min(h, center + search_band)
        if hi > lo:
            refined[x] = lo + np.argmax(inv_r[lo:hi, x])
        else:
            refined[x] = center

    final_ys = pd.Series(refined).rolling(15, center=True, min_periods=1).median().astype(int).values
    return np.arange(w), final_ys


def _build_intensity_map(img_crop: np.ndarray, gray_crop: np.ndarray,
                         ink_color: str) -> np.ndarray:
    """Build a single-channel intensity map where the curve appears brightest,
    depending on the ink color."""
    if ink_color == "blue":
        _, _, r = cv2.split(img_crop)
        inv = (255 - r).astype(np.float32)
    else:
        inv = (255 - gray_crop).astype(np.float32)
    blurred = cv2.GaussianBlur(inv, (1, 11), 0)
    blurred_u8 = np.clip(blurred, 0, 255).astype(np.uint8)

    if ink_color == "blue":
        # Blue ink: R-channel inversion already isolates the curve well.
        # Only light vertical erosion to suppress pink grid remnants.
        v_kernel = np.ones((5, 1), np.uint8)
        result = cv2.erode(blurred_u8, v_kernel, iterations=1)
    else:
        # Black ink on golden grid: two-step filtering.
        # Step 1: horizontal opening removes isolated blobs (annotations,
        # circled numbers, text) — only horizontally continuous ink survives.
        # Kernel 11px: wide enough to remove most annotations,
        # narrow enough to preserve thinner/faded ink traces.
        h_kernel = np.ones((1, 11), np.uint8)
        opened = cv2.morphologyEx(blurred_u8, cv2.MORPH_OPEN, h_kernel)
        # Step 2: vertical erosion suppresses horizontal grid lines.
        v_kernel = np.ones((7, 1), np.uint8)
        result = cv2.erode(opened, v_kernel, iterations=1)

    return result.astype(np.float32)


def _extract_guided_path(
    img_crop: np.ndarray,
    gray_crop: np.ndarray,
    guide_points: list[tuple[int, int]],
    ink_color: str = "black",
) -> tuple[np.ndarray, np.ndarray]:
    """Direction-guided curve extraction using weighted centroid tracking.

    The user's trajectory is treated purely as a directional guide —
    it selects WHICH curve to follow and the general up/down trend,
    but the actual y-position comes from the ink intensity centroid.

    Key design: weighted centroid (not argmax) makes the tracker
    immune to isolated dark pixels from annotations, grid crossings,
    and handwritten numbers that would cause spikes with argmax."""
    if len(guide_points) < 2:
        raise ValueError("guide_points must have at least 2 points (start + end)")

    guide_points = sorted(guide_points, key=lambda p: p[0])
    gx = np.array([p[0] for p in guide_points], dtype=float)
    gy = np.array([p[1] for p in guide_points], dtype=float)

    x_start = max(0, int(gx[0]))
    x_end = min(gray_crop.shape[1] - 1, int(gx[-1]))
    x_range = np.arange(x_start, x_end + 1)
    n_cols = len(x_range)

    guide_ys = np.interp(x_range, gx, gy)

    inv = _build_intensity_map(img_crop, gray_crop, ink_color)
    h, w = inv.shape

    # Pass 1: biased rough estimate — guide selects which curve region
    sigma = max(40, h // 6)
    ys_col = np.arange(h, dtype=np.float32).reshape(-1, 1)
    guide_row = guide_ys.reshape(1, -1)
    bias = np.exp(-0.5 * ((ys_col - guide_row) / sigma) ** 2)

    inv_region = inv[:, x_start:x_end + 1]
    biased = inv_region * bias

    raw_ys = np.argmax(biased, axis=0).astype(float)
    rough = pd.Series(raw_ys).rolling(51, center=True, min_periods=1).median().values

    # Pass 2: weighted centroid refinement in a narrow band.
    # Instead of picking the single darkest pixel (fragile),
    # compute the intensity-weighted center of mass — this naturally
    # follows the bulk of the ink and ignores isolated noise.
    refine_band = min(25, max(12, h // 40))
    positions = np.arange(h, dtype=np.float32)
    refined = np.zeros(n_cols, dtype=float)

    # Compute a global signal strength reference for confidence thresholding.
    # Columns with very weak ink signal should fall back to the guide path.
    col_max_intensities = np.zeros(n_cols, dtype=float)
    for i, x in enumerate(x_range):
        center = rough[i]
        lo = max(0, int(center) - refine_band)
        hi = min(h, int(center) + refine_band + 1)
        col_max_intensities[i] = inv[lo:hi, x].max() if hi > lo else 0
    signal_ref = np.percentile(col_max_intensities[col_max_intensities > 0], 50) \
        if np.any(col_max_intensities > 0) else 1.0
    weak_threshold = signal_ref * 0.10

    for i, x in enumerate(x_range):
        center = rough[i]
        lo = max(0, int(center) - refine_band)
        hi = min(h, int(center) + refine_band + 1)
        col_slice = inv[lo:hi, x].astype(np.float64)

        weights = col_slice ** 2
        total_w = weights.sum()
        peak_val = col_slice.max() if len(col_slice) > 0 else 0

        if total_w > 0 and peak_val > weak_threshold:
            centroid = lo + np.average(np.arange(hi - lo, dtype=np.float64),
                                       weights=weights)
            # Blend: strong signal → centroid, weak → guide
            confidence = min(1.0, peak_val / (signal_ref * 0.5))
            refined[i] = confidence * centroid + (1 - confidence) * guide_ys[i]
        else:
            refined[i] = guide_ys[i]

    # Pass 3: continuity-aware smoothing with forward-backward tracking.
    # If the centroid jumps more than max_step between consecutive columns,
    # dampen the jump to enforce physical plausibility (the pen can't
    # teleport on the drum).
    max_step = max(1.5, refine_band / 8)
    smoothed = refined.copy()
    # Forward pass
    for i in range(1, n_cols):
        delta = smoothed[i] - smoothed[i - 1]
        if abs(delta) > max_step:
            smoothed[i] = smoothed[i - 1] + np.sign(delta) * max_step
    # Backward pass
    backward = smoothed.copy()
    for i in range(n_cols - 2, -1, -1):
        delta = backward[i] - backward[i + 1]
        if abs(delta) > max_step:
            backward[i] = backward[i + 1] + np.sign(delta) * max_step
    # Average forward and backward for symmetry
    smoothed = (smoothed + backward) / 2.0

    # Pass 4: guide-aware outlier correction.
    # In faded-ink sections, annotations can still pull the tracker away.
    # Points that deviate significantly from the local trend AND are far
    # from the guide path get snapped back toward the guide.
    trend_win = max(101, n_cols // 30)
    if trend_win % 2 == 0:
        trend_win += 1
    trend = pd.Series(smoothed).rolling(trend_win, center=True, min_periods=1).median().values
    dev_from_trend = np.abs(smoothed - trend)
    dev_from_guide = np.abs(smoothed - guide_ys)
    med_dev = max(3.0, np.median(dev_from_trend) * 4)
    for i in range(n_cols):
        if dev_from_trend[i] > med_dev and dev_from_guide[i] > med_dev:
            smoothed[i] = guide_ys[i]

    # Final gentle smoothing
    final_win = max(15, min(31, n_cols // 100))
    if final_win % 2 == 0:
        final_win += 1
    final_ys = pd.Series(smoothed).rolling(
        final_win, center=True, min_periods=1
    ).median().values

    # Pin start and end to user-supplied points with a smooth blend zone.
    # The user can see exactly where the pen starts/ends, so those are ground truth.
    start_y = gy[0]
    end_y = gy[-1]
    pin_zone = min(80, n_cols // 20)
    for i in range(pin_zone):
        alpha = 1.0 - (i / pin_zone)
        final_ys[i] = alpha * start_y + (1 - alpha) * final_ys[i]
        j = n_cols - 1 - i
        final_ys[j] = alpha * end_y + (1 - alpha) * final_ys[j]

    return x_range, final_ys.astype(int)


def extract_curve_pixels(gray_crop: np.ndarray, binary: np.ndarray,
                         single_trace: bool = False,
                         transposed: bool = False,
                         seed_point: tuple[int, int] | None = None,
                         ink_color: str = "black",
                         img_crop: np.ndarray | None = None,
                         guide_points: list[tuple[int, int]] | None = None,
                         ) -> tuple[np.ndarray, np.ndarray]:
    if guide_points and len(guide_points) >= 2 and img_crop is not None:
        return _extract_guided_path(img_crop, gray_crop, guide_points,
                                    ink_color=ink_color)

    if ink_color == "blue":
        clean = remove_grid_lines(binary)
        blue_coverage = (clean > 0).sum() / clean.size
        if blue_coverage > 0.002:
            return _extract_binary_path(binary, single_trace, seed_point, transposed)
        if img_crop is not None:
            return _extract_rchannel_path(img_crop)
        return _extract_binary_path(binary, single_trace, seed_point, transposed)
    if transposed:
        return _extract_binary_path(binary, single_trace, seed_point, transposed)
    return _extract_grayscale_path(gray_crop)


def pixels_to_dataframe(
    x_pixels, y_pixels, plot_width, plot_height,
    time_start, time_end, y_min, y_max,
    transposed: bool = False,
    cal_points: tuple | None = None,
    nonlinear: bool = False,
) -> pd.DataFrame:
    total_seconds = (time_end - time_start).total_seconds()
    if transposed:
        timestamps = [
            time_start + pd.Timedelta(seconds=float(t) / plot_height * total_seconds)
            for t in x_pixels
        ]
        values = y_min + (y_pixels.astype(float) / plot_width) * (y_max - y_min)
    else:
        timestamps = [
            time_start + pd.Timedelta(seconds=float(x) / plot_width * total_seconds)
            for x in x_pixels
        ]
        if cal_points is not None:
            (cy1, cv1), (cy2, cv2) = cal_points
            yf = y_pixels.astype(float)
            span = float(cy2 - cy1) or 1.0
            if nonlinear:
                r1 = float(np.interp(cv1, _NEM_GRID_PCT, _NEM_GRID_NORM))
                r2 = float(np.interp(cv2, _NEM_GRID_PCT, _NEM_GRID_NORM))
                ratio = np.clip(r1 + (yf - cy1) / span * (r2 - r1), 0, 1)
                values = np.interp(ratio, _NEM_GRID_NORM, _NEM_GRID_PCT)
            else:
                values = cv1 + (yf - cy1) / span * (cv2 - cv1)
        else:
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
    nonlinear: bool = False,
    smooth: bool = True,
    save_overlay: bool = False,
    transposed: bool = False,
    seed_point: tuple[int, int] | None = None,
    plot_area: tuple[int, int, int, int] | None = None,
    start_point: tuple[int, int] | None = None,
    end_point: tuple[int, int] | None = None,
    guide_path: list[tuple[int, int]] | None = None,
    cal_y1: float | None = None,
    cal_v1: float | None = None,
    cal_y2: float | None = None,
    cal_v2: float | None = None,
    return_pixels: bool = False,
) -> pd.DataFrame:
    img = load_image(image_path)
    h_full, w_full = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    if plot_area is not None:
        x0, y0, gw, gh = plot_area
    elif start_point is not None and end_point is not None:
        # Derive plot area from user-provided points instead of unreliable
        # contour detection.  Use start/end + trajectory to define bounds
        # with generous padding so the grid detection still works.
        all_pts_x = [start_point[0], end_point[0]]
        all_pts_y = [start_point[1], end_point[1]]
        if guide_path:
            all_pts_x.extend(p[0] for p in guide_path)
            all_pts_y.extend(p[1] for p in guide_path)
        pad_x = 50
        pad_y = max(150, int((max(all_pts_y) - min(all_pts_y)) * 0.5))
        x0 = max(0, min(all_pts_x) - pad_x)
        y0 = max(0, min(all_pts_y) - pad_y)
        x1 = min(w_full, max(all_pts_x) + pad_x)
        y1 = min(h_full, max(all_pts_y) + pad_y)
        gw = x1 - x0
        gh = y1 - y0
    else:
        x0, y0, gw, gh = find_plot_area(gray)
    crop = img[y0:y0 + gh, x0:x0 + gw]

    adjusted_seed = None
    if seed_point is not None:
        adjusted_seed = (seed_point[0] - x0, seed_point[1] - y0)

    # Build guide_points from start/end + optional trajectory, adjusted to crop coords
    adjusted_guide = None
    if start_point is not None and end_point is not None:
        sp = (start_point[0] - x0, start_point[1] - y0)
        ep = (end_point[0] - x0, end_point[1] - y0)
        if guide_path:
            adjusted_guide = [(int(x - x0), int(y - y0)) for x, y in guide_path]
            adjusted_guide.insert(0, sp)
            adjusted_guide.append(ep)
        else:
            adjusted_guide = [sp, ep]

    gray_crop = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    binary = isolate_curve(crop, ink_color)
    x_pix, y_pix = extract_curve_pixels(gray_crop, binary, single_trace=(ink_color != "black"),
                                         transposed=transposed, seed_point=adjusted_seed,
                                         ink_color=ink_color, img_crop=crop,
                                         guide_points=adjusted_guide)

    if len(x_pix) == 0:
        print(f"WARNING: no curve detected in {image_path}")
        return pd.DataFrame(columns=["value"])

    cal_pts_crop = None
    if cal_y1 is not None and cal_y2 is not None and cal_v1 is not None and cal_v2 is not None:
        cal_pts_crop = ((cal_y1 - y0, cal_v1), (cal_y2 - y0, cal_v2))

    df = pixels_to_dataframe(
        x_pix, y_pix, gw, gh,
        pd.Timestamp(time_start), pd.Timestamp(time_end),
        y_min, y_max, transposed=transposed,
        cal_points=cal_pts_crop,
        nonlinear=nonlinear,
    )

    if smooth:
        df = smooth_curve(df)

    if save_overlay:
        out_path = Path(image_path).stem + "_overlay.jpg"
        cv2.imwrite(out_path, build_overlay(crop, x_pix, y_pix))
        print(f"Overlay saved: {out_path}")

    if return_pixels:
        abs_x = x_pix + x0
        abs_y = y_pix + y0
        return df, (abs_x, abs_y)
    return df


def process_chart(
    image_path: str,
    chart_type: str,
    start_point: tuple[int, int],
    end_point: tuple[int, int],
    guide_path: list[tuple[int, int]] | None = None,
    y_min: float | None = None,
    y_max: float | None = None,
    time_start: str | None = None,
    time_end: str | None = None,
    save_overlay: bool = False,
) -> dict:
    """High-level API for web frontend. Accepts user inputs and returns digitized curve.

    Args:
        image_path: Path to the TIF/JPG image.
        chart_type: "nem" or "sicaklik".
        start_point: (x, y) pixel where the curve starts.
        end_point: (x, y) pixel where the curve ends.
        guide_path: Optional list of (x, y) pixels the user drew along the curve.
        y_min/y_max: Override value axis range (auto-set per chart_type if None).
        time_start/time_end: Override time range (optional).
        save_overlay: Save a debug overlay image.

    Returns:
        {"line_x": [...], "line_y": [...], "points": int, "overlay_path": str|None}
    """
    defaults = {
        "nem":      {"ink": "blue",  "y_min": 100, "y_max": 0,  "detect": "pink_grid"},
        "sicaklik": {"ink": "black", "y_min": -15, "y_max": 45, "detect": "contour"},
    }
    if chart_type not in defaults:
        raise ValueError(f"Unknown chart_type: {chart_type!r}. Use 'nem' or 'sicaklik'.")

    cfg = defaults[chart_type]
    y_min = y_min if y_min is not None else cfg["y_min"]
    y_max = y_max if y_max is not None else cfg["y_max"]
    time_start = time_start or "1900-01-01 00:00"
    time_end = time_end or "1900-01-02 00:00"

    img = load_image(image_path)

    plot_area = None
    if cfg["detect"] == "pink_grid":
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        pink = cv2.bitwise_or(
            cv2.inRange(hsv, np.array([140, 30, 100]), np.array([175, 255, 255])),
            cv2.inRange(hsv, np.array([0, 30, 100]), np.array([10, 255, 255]))
        )
        ys, xs = np.where(pink > 0)
        if len(ys) > 0:
            x0, x1 = int(xs.min()), int(xs.max())
            y0, y1 = int(ys.min()), int(ys.max())
            plot_area = (x0, y0 + 45, x1 - x0, y1 - y0 - 45)

    df = process_tif(
        image_path, y_min=y_min, y_max=y_max,
        time_start=time_start, time_end=time_end,
        ink_color=cfg["ink"], nonlinear=(chart_type == "nem"),
        smooth=True, save_overlay=save_overlay,
        start_point=start_point, end_point=end_point,
        guide_path=guide_path, plot_area=plot_area,
    )

    overlay_path = None
    if save_overlay:
        overlay_path = Path(image_path).stem + "_overlay.jpg"

    if len(df) == 0:
        return {"line_x": [], "line_y": [], "points": 0, "overlay_path": overlay_path}

    return {
        "line_x": df.index.astype(str).tolist() if hasattr(df.index, 'strftime') else list(range(len(df))),
        "line_y": df["value"].round(2).tolist(),
        "points": len(df),
        "overlay_path": overlay_path,
    }


def build_parser():
    p = argparse.ArgumentParser(description="Extract numerical data from Kandilli analog chart TIF scans")
    mode = p.add_mutually_exclusive_group(required=True)
    mode.add_argument("--input", help="Single TIF file to process")
    mode.add_argument("--batch", help="Directory of TIF files to process in bulk")

    p.add_argument("--y_min",     type=float, default=-40.0, help="Y-axis minimum value (default: -40)")
    p.add_argument("--y_max",     type=float, default=50.0,  help="Y-axis maximum value (default: 50)")
    p.add_argument("--start",     default="1900-01-01 00:00", help="Chart start time, e.g. '1987-03-02 00:00'")
    p.add_argument("--end",       default="1900-01-08 00:00", help="Chart end time, e.g. '1987-03-09 00:00'")
    p.add_argument("--ink",       default="black", choices=["black", "blue"])
    p.add_argument("--output",    default="output.csv")
    p.add_argument("--overlay",    action="store_true", help="Save curve overlay images for visual verification")
    p.add_argument("--no_smooth",  action="store_true", help="Disable Savitzky-Golay smoothing")
    p.add_argument("--transposed", action="store_true", help="Portrait-orientation charts where time runs top-to-bottom (e.g. wind direction)")
    p.add_argument("--seed",       help="Seed pixel on the curve as x,y (e.g. '100,800') for component selection")
    p.add_argument("--start_pt",   help="Curve start pixel as x,y (e.g. '80,500')")
    p.add_argument("--end_pt",     help="Curve end pixel as x,y (e.g. '3400,300')")
    p.add_argument("--guide",      help="Guide path pixels as x1,y1;x2,y2;... (e.g. '100,500;500,400;1000,350')")
    return p


def _parse_point(s: str) -> tuple[int, int]:
    parts = s.split(",")
    return (int(parts[0]), int(parts[1]))


def main():
    args = build_parser().parse_args()
    seed = None
    if args.seed:
        seed = _parse_point(args.seed)
    start_pt = _parse_point(args.start_pt) if args.start_pt else None
    end_pt = _parse_point(args.end_pt) if args.end_pt else None
    guide = None
    if args.guide:
        guide = [_parse_point(seg) for seg in args.guide.split(";")]
    kwargs = dict(
        y_min=args.y_min, y_max=args.y_max,
        time_start=args.start, time_end=args.end,
        ink_color=args.ink, smooth=not args.no_smooth, save_overlay=args.overlay,
        transposed=args.transposed, seed_point=seed,
        start_point=start_pt, end_point=end_pt, guide_path=guide,
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
