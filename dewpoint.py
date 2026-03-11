import pandas as pd
import numpy as np

# Magnus formula constants
b = 17.625
c = 243.04

df = pd.read_csv("df_linear_merged.csv")

# Calculate dew point using Magnus formula
gamma = np.log(df["Humidity"] / 100) + (b * df["Temperature"]) / (c + df["Temperature"])
df["DewPoint"] = (c * gamma) / (b - gamma)

df.to_csv("df_linear_merged.csv", index=False)

print(df.head())
print(f"\nShape: {df.shape}")
