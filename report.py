import pandas as pd
import numpy as np
from pathlib import Path

veriler = Path(r'C:\Users\emir2\kandilli-hackathon-2026-bruteforcers\Veriler_H')
sicak_dir = [d for d in veriler.iterdir() if 'cakl' in d.name][0]
f = [x for x in sicak_dir.glob('*Uzun*')][0]
sheets = pd.read_excel(f, sheet_name=None, engine='openpyxl')

results = {}
for sheet_name in ['Max', 'Min', 'Ort']:
    df = sheets[sheet_name]
    date_col = df.columns[0]
    df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
    df = df.dropna(subset=[date_col])
    march = df[df[date_col].dt.month == 3].copy()
    march['day'] = march[date_col].dt.day
    results[sheet_name] = march.set_index('day')[1985]

SEP = "=" * 72
print("MART 1985 TERMOGRAM DIGITIZASYON RAPORU")
print(SEP)
print(f"{'Day':>3}  {'ExMax':>5} {'ExMin':>5} {'ExAvg':>5}  {'PipMed':>6} {'Pip5%':>6} {'Pip95%':>6} {'Diff':>5}  Status")
print("-" * 72)

excel_avgs = []
pipe_meds = []
good = 0
warn = 0

for day in range(1, 32):
    csv = Path(f'output_mart/day_{day:02d}.csv')
    if not csv.exists():
        continue
    df = pd.read_csv(csv, index_col=0, parse_dates=True)

    e_max = results['Max'].get(day, np.nan)
    e_min = results['Min'].get(day, np.nan)
    e_avg = results['Ort'].get(day, np.nan)
    p_med = df['value'].median()
    p_5 = df['value'].quantile(0.05)
    p_95 = df['value'].quantile(0.95)
    diff = p_med - e_avg

    if day == 14:
        status = "FLIP"
    elif abs(diff) <= 1.0:
        status = "OK"
        good += 1
    elif abs(diff) <= 2.0:
        status = "~OK"
        good += 1
        warn += 1
    else:
        status = "BAD"

    if day != 14:
        excel_avgs.append(e_avg)
        pipe_meds.append(p_med)

    # Check if pipe min/max is within excel min/max range
    range_ok = ""
    if not np.isnan(e_min) and not np.isnan(e_max):
        if p_5 >= e_min - 3 and p_95 <= e_max + 3:
            range_ok = ""
        else:
            range_ok = " !"

    print(f" {day:2d}   {e_max:5.1f} {e_min:5.1f} {e_avg:5.1f}  {p_med:6.1f} {p_5:6.1f} {p_95:6.1f} {diff:+5.1f}  {status}{range_ok}")

ea = np.array(excel_avgs)
pm = np.array(pipe_meds)
diffs = pm - ea

print(SEP)
print("OZET (Day 14 ters tarama haric)")
print(SEP)
print(f"  Korelasyon (r):     {np.corrcoef(ea, pm)[0,1]:.3f}")
print(f"  MAE:                {np.abs(diffs).mean():.2f} C")
print(f"  Medyan Hata:        {np.median(np.abs(diffs)):.2f} C")
print(f"  Mean Bias:          {diffs.mean():+.2f} C")
print(f"  Max Hata:           {np.abs(diffs).max():.1f} C")
print(f"  < 1.0C hata:        {(np.abs(diffs) < 1.0).sum()}/30 gun ({(np.abs(diffs) < 1.0).sum()/30*100:.0f}%)")
print(f"  < 1.5C hata:        {(np.abs(diffs) < 1.5).sum()}/30 gun ({(np.abs(diffs) < 1.5).sum()/30*100:.0f}%)")
print(f"  < 2.0C hata:        {(np.abs(diffs) < 2.0).sum()}/30 gun ({(np.abs(diffs) < 2.0).sum()/30*100:.0f}%)")
print(f"  Basarili gunler:    {good}/30")
print(SEP)
