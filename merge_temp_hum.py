"""Merge temperature linear file with humidity information from nemyil_cleaned.csv.

The temperature file (`df_linear.csv`) has two columns: Date and Temperature.
The humidity file (`nemyil_cleaned.csv`) is a wide-format table where the first
column is a dummy date (same day/month for every year, usually with 1900 as the
year) and the remaining columns are years.  Each row corresponds to a day of the
year (365 rows, no Feb 29) and each column gives the humidity value for that
day and year.

This script reads both files, aligns them by the month-day portion of the date,
and appends a humidity column to the temperature dataframe.  Leap‑day rows in
the temperature data will receive NaN humidity.  If a particular year is
missing from the humidity file, that value will be NaN as well.

The merged result is written back to disk as `df_linear_merged.csv` by default.

Usage:
    python merge_temp_hum.py

"""

from __future__ import annotations

import os
import pandas as pd


def main():
    workspace = os.path.dirname(__file__)
    temp_path = os.path.join(workspace, "df_linear.csv")
    hum_path = os.path.join(workspace, "nemyil_cleaned.csv")

    # read temperature series
    temp = pd.read_csv(temp_path, parse_dates=["Date"])
    temp["Year"] = temp["Date"].dt.year
    temp["MonthDay"] = temp["Date"].dt.strftime("%m-%d")

    # read humidity table
    hum = pd.read_csv(hum_path)
    # create a MonthDay key from the dummy date column
    # handle cases where the column might already be parsed as datetime
    try:
        hum["MonthDay"] = pd.to_datetime(hum["Date"]).dt.strftime("%m-%d")
    except Exception:  # fall back to string slicing
        hum["MonthDay"] = hum["Date"].astype(str).str.slice(5, 10)

    # pivot from wide to long so we can merge easily
    id_vars = ["MonthDay"]
    value_vars = [c for c in hum.columns if c not in ("Date", "MonthDay")]
    hum_long = hum.melt(id_vars=id_vars, value_vars=value_vars, var_name="Year", value_name="Humidity")

    # convert Year to int if possible (some years may be read as floats)
    hum_long["Year"] = pd.to_numeric(hum_long["Year"], errors="coerce").astype("Int64")

    # perform left join on (Year, MonthDay)
    merged = temp.merge(
        hum_long,
        how="left",
        on=["Year", "MonthDay"],
    )

    # drop helper columns and reorder
    merged = merged.drop(columns=["MonthDay", "Year"])
    merged = merged[["Date", "Temperature", "Humidity"]]

    # sort by date and interpolate missing humidity values
    merged = merged.sort_values("Date")
    merged["Humidity"] = merged["Humidity"].interpolate(method="linear")

    out_path = os.path.join(workspace, "df_linear_merged.csv")
    merged.to_csv(out_path, index=False)
    print(f"Wrote merged data to {out_path} (rows: {len(merged)})")


if __name__ == "__main__":
    main()
