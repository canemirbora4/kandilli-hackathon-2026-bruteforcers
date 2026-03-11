import pandas as pd

# Read the CSV file
df = pd.read_csv('uzunyil.csv')

print("Original shape:", df.shape)

# Drop rows where all values are NaN or empty
df = df.dropna(how='all')

# Keep only the 'Maksimum' column and columns that are years (digits) except 1911
columns_to_keep = ['Maksimum'] + [col for col in df.columns if col.isdigit() and col != '1911']

print("Columns to keep:", columns_to_keep)

df = df[columns_to_keep]

# Drop the last 4 rows (meaningless statistics: years row, tmax Ort, tmax>=30, tmax<=0)
df = df.iloc[:-4]

print("Shape after removing last 4 rows:", df.shape)

# Rename the first column to 'Date' since it contains dates
df = df.rename(columns={'Maksimum': 'Date'})

# Save the cleaned data to a new CSV file
df.to_csv('uzunyil_cleaned.csv', index=False)

print("Cleaned CSV saved as uzunyil_cleaned.csv")