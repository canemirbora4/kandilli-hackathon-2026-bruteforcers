import pandas as pd
import numpy as np
from pathlib import Path

veriler = Path(r'C:\Users\emir2\kandilli-hackathon-2026-bruteforcers\Veriler_H')
sicak_dir = [d for d in veriler.iterdir() if 'cakl' in d.name][0]
f = [x for x in sicak_dir.glob('*Uzun*')][0]
sheets = pd.read_excel(f, sheet_name=None, engine='openpyxl')

df_ort = sheets['Ort']
date_col = df_ort.columns[0]
df_ort[date_col] = pd.to_datetime(df_ort[date_col], errors='coerce')
df_ort = df_ort.dropna(subset=[date_col])
march = df_ort[df_ort[date_col].dt.month == 3].copy()
march['day'] = march[date_col].dt.day
excel_avg = march.set_index('day')[1985]

pipe_meds = {}
for day in range(1, 32):
    csv = Path(f'output_mart/day_{day:02d}.csv')
    if csv.exists():
        df = pd.read_csv(csv, index_col=0, parse_dates=True)
        pipe_meds[day] = df['value'].median()

print("Day   Excel   Pipe   Diff")
print("-" * 28)
excel_vals = []
pipe_vals = []
diffs = []
for day in range(1, 32):
    e = excel_avg.get(day, float('nan'))
    p = pipe_meds.get(day, float('nan'))
    d = p - e if not (pd.isna(e) or pd.isna(p)) else float('nan')
    if not pd.isna(d):
        diffs.append(d)
        excel_vals.append(e)
        pipe_vals.append(p)
    print(f" {day:2d}   {e:5.1f}   {p:5.1f}  {d:+5.1f}")

diffs = np.array(diffs)
print(f"\nMAE: {np.abs(diffs).mean():.2f}C")
print(f"Mean Bias: {diffs.mean():+.2f}C")
r = np.corrcoef(excel_vals, pipe_vals)[0, 1]
print(f"Correlation (r): {r:.3f}")
