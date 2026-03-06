import pandas as pd
from pathlib import Path

veriler = Path(r'C:\Users\emir2\kandilli-hackathon-2026-bruteforcers\Veriler_H')
sicak_dir = [d for d in veriler.iterdir() if 'cakl' in d.name][0]
f = [x for x in sicak_dir.glob('*Uzun*')][0]

sheets = pd.read_excel(f, sheet_name=None, engine='openpyxl')

print("=== Excel Reference: March 1985 ===")
print(f"{'Day':>4} {'Max':>6} {'Min':>6} {'Avg':>6}")
print("-" * 26)

for sheet_name in ['Max', 'Min', 'Ort']:
    df = sheets[sheet_name]
    date_col = df.columns[0]
    df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
    df = df.dropna(subset=[date_col])
    march = df[df[date_col].dt.month == 3].copy()
    march['day'] = march[date_col].dt.day
    if 1985 in march.columns:
        locals()[f'march_{sheet_name}'] = march[['day', 1985]].set_index('day')[1985]

for day in range(1, 32):
    mx = march_Max.get(day, float('nan'))
    mn = march_Min.get(day, float('nan'))
    avg = march_Ort.get(day, float('nan'))
    print(f"{day:4d} {mx:6.1f} {mn:6.1f} {avg:6.1f}")

# Now compare with pipeline output
print("\n=== Pipeline vs Excel Comparison ===")
print(f"{'Day':>4} {'Excel Avg':>10} {'Pipe Mean':>10} {'Pipe Med':>10} {'Pipe Min':>10} {'Pipe Max':>10} {'Diff':>8}")
print("-" * 66)

for day in range(1, 32):
    csv_path = f'output_mart{day:02d}.csv'
    if not Path(csv_path).exists():
        continue
    pipe = pd.read_csv(csv_path, index_col=0, parse_dates=True)
    if len(pipe) == 0:
        continue
    excel_avg = march_Ort.get(day, float('nan'))
    p_mean = pipe['value'].mean()
    p_med = pipe['value'].median()
    p_min = pipe['value'].min()
    p_max = pipe['value'].max()
    diff = p_mean - excel_avg if not pd.isna(excel_avg) else float('nan')
    print(f"{day:4d} {excel_avg:10.1f} {p_mean:10.1f} {p_med:10.1f} {p_min:10.1f} {p_max:10.1f} {diff:+8.1f}")
