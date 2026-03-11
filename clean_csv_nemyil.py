import pandas as pd
import numpy as np

# Read the raw CSV without header
df = pd.read_csv('nemyil.csv', header=None)

# Row 2 (index 1) contains the years
years_row = df.iloc[1].values

# Extract years starting from column 2 (index 2), which contains years: 1911, 1912, 1913, etc.
# Column 0 = "NEM (%)"
# Column 1 = "Unnamed: 1" (empty col name)
# Column 2 onwards = year data (1911, 1912, ...)

years = []
for i in range(2, len(years_row)):
    val = years_row[i]
    if pd.notna(val):
        year = int(float(val))
        years.append(year)

# Extract data starting from row 4 (index 3)
# Keep column 0 (dates) and columns 2 onwards (year data)
data = df.iloc[3:, [0] + list(range(2, 2 + len(years)))].copy()

# Set column names: "Date" for first column, then year names
col_names = ['Date'] + [str(year) for year in years]
data.columns = col_names

# Remove any completely empty rows
data = data.dropna(axis=0, how='all')

# Remove the Index column if it exists and reset index
data = data.reset_index(drop=True)

# Convert year columns to numeric
for col in data.columns:
    if col != 'Date':
        data[col] = pd.to_numeric(data[col], errors='coerce')

# Drop the 1911 column
data = data.drop(columns=['1911'])

# Save as cleaned CSV
data.to_csv('nemyil_clean.csv', index=False)

print("Cleaned CSV saved as nemyil_clean.csv")
print(f"Shape: {data.shape}")
print(f"Years: {col_names[1:5]}... (first 4 years)")
print(f"\nFirst few rows:")
print(data.head(10))
print(f"\nLast few rows:")
print(data.tail())
