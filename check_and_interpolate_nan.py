import pandas as pd

# Read the CSV file
df = pd.read_csv('df_linear_merged.csv')

# Check for NaN values
nan_count = df.isna().sum()
print("NaN values per column:")
print(nan_count)
print(f"\nTotal NaN values: {nan_count.sum()}")

# If there are NaN values, interpolate them
if nan_count.sum() > 0:
    print("\nInterpolating NaN values using linear interpolation...")
    df_interpolated = df.interpolate(method='linear')
    
    # Save the interpolated dataframe
    df_interpolated.to_csv('df_linear_merged.csv', index=False)
    print("Done! Interpolated values saved to df_linear_merged.csv")
    
    # Show NaN count after interpolation
    print(f"\nNaN values after interpolation: {df_interpolated.isna().sum().sum()}")
else:
    print("\nNo NaN values found in the file.")
