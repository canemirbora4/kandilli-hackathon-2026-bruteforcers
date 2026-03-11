import pandas as pd
import os

# List of XLSX files to convert
xlsx_files = ['1911-2022-Nem.xlsx']

for xlsx_file in xlsx_files:
    if os.path.exists(xlsx_file):
        # Read the XLSX file
        df = pd.read_excel(xlsx_file, engine='openpyxl')
        # Create CSV filename
        csv_file = xlsx_file.replace('.xlsx', '.csv')
        # Write to CSV
        df.to_csv(csv_file, index=False)
        print(f"Converted {xlsx_file} to {csv_file}")
    else:
        print(f"File {xlsx_file} not found")