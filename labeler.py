"""Image-level labeler: repairs unreadable regions in the source image
by painting the user's trajectory over box-annotated areas BEFORE
the digitization pipeline processes it.

Flow:
  1. User marks bad areas with boxes + draws trajectory over them
  2. Labeler clears each box region (fills with local background color)
  3. Labeler draws the trajectory line in the original ink color/thickness
  4. The repaired image is fed into the normal digitize pipeline
"""

import cv2
import numpy as np



def _ink_color_bgr(ink_color: str) -> tuple[int, int, int]:
    """Return a BGR color matching the chart's ink."""
    if ink_color == "blue":
        return (180, 80, 20)
    return (30, 30, 30)


def repair_image(
    img_bgr: np.ndarray,
    boxes: list[dict],
    trajectory: list[tuple[int, int]],
    ink_color: str = "black",
    line_thickness: int = 3,
) -> np.ndarray:
    """Repair an image by replacing box regions with trajectory-drawn lines.

    Args:
        img_bgr: Original image (BGR, full size).
        boxes: List of box dicts. Each needs 'coords' or 'BoxCoord' key
               with [xmin, ymin, xmax, ymax].
        trajectory: User's hand-drawn path as list of (x, y) pixel coords.
        ink_color: "black" or "blue" — determines drawn line color.
        line_thickness: Pixel width of the drawn ink line.

    Returns:
        A copy of the image with box regions repaired.
    """
    if not boxes or not trajectory:
        return img_bgr.copy()

    repaired = img_bgr.copy()

    traj_sorted = sorted(trajectory, key=lambda p: p[0])
    traj_x = np.array([p[0] for p in traj_sorted], dtype=float)
    traj_y = np.array([p[1] for p in traj_sorted], dtype=float)

    ink_bgr = _ink_color_bgr(ink_color)

    for box in boxes:
        coords = box.get("coords", box.get("BoxCoord"))
        if coords is None or len(coords) != 4:
            continue

        xmin, ymin, xmax, ymax = [int(c) for c in coords]
        h, w = repaired.shape[:2]
        xmin = max(0, xmin)
        ymin = max(0, ymin)
        xmax = min(w, xmax)
        ymax = min(h, ymax)

        # Draw trajectory segment within this box — no background clearing
        xs_in_box = np.arange(xmin, xmax + 1)
        ys_in_box = np.interp(xs_in_box.astype(float), traj_x, traj_y)

        pts = np.column_stack((xs_in_box, ys_in_box.astype(int))).reshape(-1, 1, 2).astype(np.int32)
        if len(pts) > 1:
            cv2.polylines(repaired, [pts], False, ink_bgr, line_thickness, cv2.LINE_AA)

    return repaired


def get_box_report(boxes: list[dict]) -> list[dict]:
    """Generate a structured report of box annotations."""
    report = []
    for box in boxes:
        coords = box.get("coords", box.get("BoxCoord"))
        if coords is None:
            continue
        box_type = box.get("box_type", box.get("BoxType", "NoData"))
        enter_pt = box.get("enter", box.get("Boxenter"))
        exit_pt = box.get("exit", box.get("Boxexit"))
        report.append({
            "BoxCoord": [float(c) for c in coords],
            "BoxType": box_type,
            "Boxenter": enter_pt,
            "Boxexit": exit_pt,
        })
    return report
