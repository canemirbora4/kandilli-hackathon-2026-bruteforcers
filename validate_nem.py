import pandas as pd
import numpy as np
from pathlib import Path
from digitize import process_tif, load_image
import cv2

veriler = Path(r'C:\Users\emir2\kandilli-hackathon-2026-bruteforcers\Veriler_H')
nem_dir = [d for d in veriler.iterdir() if 'Nem' in d.name][0]
f = [x for x in nem_dir.glob('*1911*')][0]

df_raw = pd.read_excel(f, sheet_name=0, engine='openpyxl')
years_row = df_raw.iloc[0]
year_to_col = {}
for i, val in enumerate(years_row):
    try:
        y = int(val)
        if 1900 <= y <= 2100:
            year_to_col[y] = df_raw.columns[i]
    except (ValueError, TypeError):
        pass

print(f"Available years: {sorted(year_to_col.keys())[:5]}...{sorted(year_to_col.keys())[-5:]}")

if 2004 not in year_to_col:
    print("2004 not found!")
    exit()

col_2004 = year_to_col[2004]
date_col = df_raw.columns[0]
df_raw[date_col] = pd.to_datetime(df_raw[date_col], errors='coerce')
df_data = df_raw.dropna(subset=[date_col])
dec = df_data[df_data[date_col].dt.month == 12].copy()
dec['day'] = dec[date_col].dt.day
excel_nem = dec.set_index('day')[col_2004]


def detect_plot_area(img: np.ndarray) -> tuple[int, int, int, int]:
    """Detect the pink grid boundary and return a consistent plot area."""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    pink = cv2.bitwise_or(
        cv2.inRange(hsv, np.array([140, 30, 100]), np.array([175, 255, 255])),
        cv2.inRange(hsv, np.array([0, 30, 100]), np.array([10, 255, 255]))
    )
    ys, xs = np.where(pink > 0)
    if len(ys) == 0:
        h, w = img.shape[:2]
        return 60, 60, w - 120, h - 120
    x0, x1 = int(xs.min()), int(xs.max())
    y0, y1 = int(ys.min()), int(ys.max())
    top_skip = 45
    return x0, y0 + top_skip, x1 - x0, y1 - y0 - top_skip


print("\nProcessing ARALIK TIFs...")
out_dir = Path('output_aralik')
out_dir.mkdir(exist_ok=True)

pipe_meds = {}
for day in range(1, 32):
    tif = Path(f'ARALIK/2004_ARALIK-{day:02d}.tif')
    if not tif.exists():
        continue
    start = f'2004-12-{day:02d} 08:00'
    end = f'2004-12-{day + 1:02d} 08:00' if day < 31 else '2005-01-01 08:00'

    img = load_image(str(tif))
    pa = detect_plot_area(img)

    df = process_tif(str(tif), y_min=100, y_max=0,
                     time_start=start, time_end=end,
                     ink_color='blue', plot_area=pa, save_overlay=True)
    df.to_csv(out_dir / f'day_{day:02d}.csv')
    pipe_meds[day] = df['value'].median() if len(df) > 0 else float('nan')
    print(f'  Day {day:2d}: median={pipe_meds[day]:.1f}%  crop={pa}')

SEP = "=" * 50
print(f"\n{SEP}")
print("ARALIK 2004 NEM KARSILASTIRMA")
print(SEP)
print(f"{'Day':>3}  {'Excel':>6} {'Pipe':>6} {'Diff':>6}")
print("-" * 30)

excel_vals, pipe_vals = [], []
for day in range(1, 32):
    e = excel_nem.get(day, np.nan)
    p = pipe_meds.get(day, np.nan)
    if pd.isna(e) or pd.isna(p):
        continue
    d = p - e
    excel_vals.append(e)
    pipe_vals.append(p)
    print(f" {day:2d}   {e:5.1f}  {p:5.1f}  {d:+5.1f}")

ea = np.array(excel_vals)
pa_arr = np.array(pipe_vals)
diffs = pa_arr - ea

print(f"\n{SEP}")
print(f"  Korelasyon (r): {np.corrcoef(ea, pa_arr)[0, 1]:.3f}")
print(f"  MAE: {np.abs(diffs).mean():.1f}%")
print(f"  Mean Bias: {diffs.mean():+.1f}%")
print(f"  Medyan Hata: {np.median(np.abs(diffs)):.1f}%")
print(SEP)
