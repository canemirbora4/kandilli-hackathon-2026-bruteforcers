"""
Fourier Seasonal Reverse Transformation
========================================
For each of Temperature, Humidity, and DewPoint:
  1. Fit sinusoidal model: value ~ sin(2π·doy/365.25) + cos(2π·doy/365.25)
                                   + sin(4π·doy/365.25) + cos(4π·doy/365.25)
  2. Subtract the fitted seasonal component
  3. Add the deseasonalized column to the dataframe
Saves the result back to df_linear_merged.csv with 3 new columns.
"""

import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

# Load
df = pd.read_csv("df_linear_merged.csv", parse_dates=["Date"])
df = df.sort_values("Date").reset_index(drop=True)
df["DayOfYear"] = df["Date"].dt.dayofyear

# Fourier features (1st + 2nd harmonic)
df["sin1"] = np.sin(2 * np.pi * df["DayOfYear"] / 365.25)
df["cos1"] = np.cos(2 * np.pi * df["DayOfYear"] / 365.25)
df["sin2"] = np.sin(4 * np.pi * df["DayOfYear"] / 365.25)
df["cos2"] = np.cos(4 * np.pi * df["DayOfYear"] / 365.25)

fourier_cols = ["sin1", "cos1", "sin2", "cos2"]
X_seasonal = df[fourier_cols].values

# Deseasonalize each column
for col in ["Temperature", "Humidity", "DewPoint"]:
    model = LinearRegression()
    model.fit(X_seasonal, df[col].values)
    seasonal_fit = model.predict(X_seasonal)
    new_col = f"{col}_deseasonal"
    df[new_col] = df[col] - seasonal_fit

    amp1 = np.sqrt(model.coef_[0]**2 + model.coef_[1]**2)
    print(f"{col}:")
    print(f"  Mean (intercept) : {model.intercept_:.4f}")
    print(f"  Seasonal amplitude (1st harmonic): {amp1:.4f}")
    print(f"  -> New column: {new_col}")
    print()

# Drop helper columns, keep only original + new deseasonalized columns
df = df.drop(columns=["DayOfYear", "sin1", "cos1", "sin2", "cos2"])

# Save
df.to_csv("df_linear_merged.csv", index=False)
print(f"Saved df_linear_merged.csv with {len(df.columns)} columns:")
print(f"  {list(df.columns)}")
print(f"\nPreview:")
print(df.head())
