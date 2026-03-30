# Kandilli Archive Digitizer

Kandilli Observatory and Earthquake Research Institute (KOERI) holds 115 years of meteorological records on analog chart papers. These charts contain continuous ink traces drawn by thermographs, barographs, and hygrographs, recording climate variables such as temperature and humidity at sub-hourly resolution. This project provides an end-to-end pipeline that converts these analog archives into digital time-series datasets.

---

## Project Architecture

The system consists of three main components:

### 1. CV Digitization Pipeline — `digitize.py`

A computer vision pipeline for extracting numerical time-series data from analog chart papers.

**Pipeline steps:**

1. **Image loading** — Opens TIF files via Pillow and converts to OpenCV format (legacy JPEG-compressed TIFs cannot be opened directly by OpenCV)
2. **Plot area detection** — If the user provides start/end points, the plot area is computed from those coordinates + trajectory; otherwise, the largest contour is found and the chart area is cropped automatically
3. **Curve isolation** — Ink separation strategy depends on chart type:
   - **Humidity charts:** R-channel intensity tracking — works for both black and navy-blue ink; the R-channel effectively separates ink from the colored paper background
   - **Temperature charts (thermograms):** Adaptive Gaussian thresholding — isolates dark ink from the orange/beige background
4. **Grid line removal** — Morphological horizontal/vertical kernels erase printed grid lines + edge masking
5. **Dominant component selection** — Selects the correct trace when multiple overlapping curves are present
6. **Pixel coordinate extraction** — Uses `_extract_guided_path()` with weighted centroid tracking guided by the user's trajectory (details below)
7. **Grid border detection** — Automatically detects pink non-linear grids on humidity papers and linear grids on temperature papers
8. **Value mapping** — Pixel-to-time/value conversion calibrated via detected grid borders
9. **Non-linearity correction** — For humidity charts, a measurement-based LUT (`_NEM_GRID_NORM`) maps pixel positions to true humidity values; temperature charts are linear and require no LUT
10. **Smoothing** — Savitzky-Golay filter (window=21, order=3)

#### Humidity Paper Non-Linearity LUT

The humidity papers used at Kandilli (Lambrecht 82H and Bestell-Nr. 205079) share identical physical grid spacing. Grid intervals were hand-measured to derive the following normalized LUT:

| Range   | Measurement (units) | Norm (0–1) |
|---------|---------------------|-----------|
| 0–10%   | 54                  | 0.000     |
| 10–20%  | 44                  | 0.181     |
| 20–30%  | 34                  | 0.328     |
| 30–40%  | 28                  | 0.441     |
| 40–50%  | 24                  | 0.535     |
| 50–60%  | 21                  | 0.615     |
| 60–70%  | 21                  | 0.686     |
| 70–80%  | 21                  | 0.756     |
| 80–90%  | 22                  | 0.826     |
| 90–100% | 30                  | 0.900     |

#### User Interaction: Start Point, End Point, and Trajectory

The digitization pipeline accepts three key user inputs from the web interface:

- **Start Point:** The pixel coordinate (x, y) where the ink trace begins on the chart. The user clicks to mark it on the chart image.
- **End Point:** The pixel coordinate where the ink trace ends.
- **Trajectory (guide curve):** A series of points the user draws along the curve. These points do not need to be precise — they serve only as a **directional guide**. The actual y-position is computed from the intensity-weighted centroid of the ink.

The `_extract_guided_path()` function operates in 4 stages:

1. **Biased rough estimate:** Searches for ink intensity near the trajectory using a Gaussian bias
2. **Weighted centroid refinement:** Computes the intensity-weighted centroid in a narrow band (centroid is preferred over argmax for robustness against annotation noise and grid crossings)
3. **Continuity-aware smoothing:** Forward-backward tracking prevents physically impossible jumps
4. **Guide-aware outlier correction:** Points that deviate excessively from the local trend and the trajectory are corrected

Start and end points are treated as ground truth at the curve endpoints and are pinned to the final result via a smooth blend zone.

#### Labeler: Damaged Region Repair

Users can mark problematic areas (smudges, fading, paper defects, missing data) with bounding boxes. For each box, enter/exit points are specified. `labeler.py` repairs these regions using trajectory-based interpolation — the pipeline then operates on the repaired image.

---

### 2. Web Interface

#### Backend — `api.py`

FastAPI server (port 8000). Automatically scans TIF directories in the working directory and exposes the following endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health check |
| `/api/data-types` | GET | Available data types |
| `/api/frequencies/{type}/{year}` | GET | Frequency list (Daily/Weekly) |
| `/api/months/{type}/{year}` | GET | Month list |
| `/api/files/{type}` | GET | File list |
| `/api/tiff/{path}` | GET | TIF image |
| `/api/thumbnail/{path}` | GET | Thumbnail preview |
| `/api/records` | GET / POST | List / create records |
| `/api/records/{id}` | GET / PUT / DELETE | Read / update / delete a record |
| `/digitize` | POST | Run digitization pipeline |
| `/digitize/upload` | POST | Digitize with file upload |

#### Frontend — `frontend/`

Next.js + React + Tailwind CSS. Two main pages:

**`/arsiv` — Archive Browser**
- Browse the 115-year archive by Data type → Year → Month → Day
- Full-screen viewer: zoom/pan, bounding box overlays, digitized curve SVG overlay
- Hover over the curve to see instantaneous humidity/temperature values (y-proximity gated)
- Statistics panel: Min, Max, Mean, Std, Point count, sparkline
- Usability status indicator
- **JSON** button: copies `line_x` + `line_y` data to clipboard
- **Delete Record** button: removes the DB record entirely

**`/admin` — Expert Annotation Interface**
- Mark start/end points on a Konva canvas
- Draw a trajectory (guide curve) along the ink trace
- Add bounding boxes over damaged regions
- Set calibration anchors for y-axis calibration
- After digitization: view statistics, hover tooltip on curve, **JSON** copy
- Save / update record to DB

#### Database

SQLite (`kandilli.db` — managed by the FastAPI backend). The Prisma schema is defined in `frontend/prisma/schema.prisma`.

`KandilliRecord` model:

| Field | Type | Description |
|-------|------|-------------|
| `id` | Int | Primary key |
| `path` | String | TIF file path |
| `type` | String | Data type (Humidity / Temperature) |
| `timestamp` | String | Record date |
| `isUsable` | Boolean | Usability flag |
| `result` | JSON | Annotation + digitization output |

Structure of the `result` field:
```json
{
  "start_point": [x, y],
  "end_point": [x, y],
  "trajectory": [[x, y], ...],
  "bounding_boxes": [...],
  "digitize": {
    "line_x": ["2024-01-01 00:00", ...],
    "line_y": [65.2, 66.1, ...],
    "pixel_x": [120, 125, ...],
    "pixel_y": [340, 338, ...],
    "stats": { "min": 25.4, "max": 95.0, "mean": 69.6, "std": 28.3 }
  }
}
```

---

### 3. Time-Series Analysis and Machine Learning (`master` branch)

Beyond CV digitization, the extracted datasets were used for **Forecasting** and **Correlation Analysis**.

> **NOTE:** The machine learning models, trend analyses, and Jupyter Notebooks (`.ipynb` and `.py` files) are located on the **`master`** branch (`git checkout master`).

**Analyses performed:**

1. **Dew Point Derivation:**
   Temperature and humidity values were converted to dew point using the *Magnus formula*. A warming/humidity trend of 0.2254 °C per decade was demonstrated over 1912–2021, with seasonal effects removed using Fourier harmonics.

2. **Forecasting Benchmark:**
   Four models were compared using 109 years of training data:
   - **SARIMA** (Statistical seasonal model — R² ≈ 0.89)
   - **Prophet** (Meta's open-source algorithm)
   - **LSTM** (Deep learning RNN-based model — R² ≈ 0.93)
   - **PatchTST** (Transformer-based architecture, best result — R² = 0.94)

3. **Real-World Correlations:**
   The derived climate trend was correlated with Istanbul urban indicators:
   - **Natural gas consumption (IBB & IGDAS):** r = −0.88
   - **Sunstroke cases (Google Trends):** r = 0.62
   - **Air conditioning searches (Google Trends):** r = 0.61
   - **City water consumption (IBB Open Data):** r = 0.53

---

## How to Run

### Prerequisites

- **Python 3.10+** with pip
- **Node.js 18+** with npm

### Step 1: Clone the Repository

```bash
git clone https://github.com/canemirbora4/kandilli-hackathon-2026-bruteforcers.git
cd kandilli-hackathon-2026-bruteforcers
```

### Step 2: Start the Backend

```bash
pip install -r requirements.txt
uvicorn api:app --host 0.0.0.0 --port 8000
```

The backend will automatically detect any TIF files in the `NEM/` and `TERMOGRAM/` directories. The sample data included in the repository (NEM/2016/August and TERMOGRAM/1990/September) will be available immediately.

### Step 3: Start the Frontend

Open a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

### Step 4: Open in Browser

- **Archive Browser:** [http://localhost:3000/arsiv](http://localhost:3000/arsiv) — browse and view previously digitized records
- **Digitization Interface:** [http://localhost:3000/admin](http://localhost:3000/admin) — annotate charts and run the digitization pipeline

### How to Use

1. Go to the **Digitization Interface** (`/admin`)
2. Select a data type (Humidity or Temperature), then choose the year, month, and day from the sidebar
3. The scanned chart image will load on the canvas
4. **Mark start and end points** by clicking where the ink trace begins and ends
5. **Draw a guide curve** — a rough freehand line along the ink trace (does not need to be precise)
6. **Set calibration anchors** — click on two known grid lines and enter their values (e.g., 20% and 80% for humidity)
7. *(Optional)* **Mark damaged areas** with bounding boxes and sketch the approximate trajectory through them
8. Click **Digitize** — the system processes the image and overlays the extracted curve
9. Review the results (hover for values, check statistics) and click **Save** to store the record

---

### Data Directories

The backend automatically scans TIF directories in the working directory. Supported structures:

- `NEM/{year}/{month}/...tif` — humidity data
- `TERMOGRAM/{year}/{frequency}/{month}/...tif` — temperature data

The repository includes sample data for testing:
- `NEM/2016/AĞUSTOS/` — 31 daily humidity charts
- `TERMOGRAM/1990/GÜNLÜK/EYLÜL/` — 30 daily temperature charts

---

## CLI Usage

`digitize.py` can also be used directly from the command line:

```bash
python digitize.py --input file.tif --y_min -5 --y_max 45 \
  --start_pt "80,500" --end_pt "3400,300" \
  --guide "200,480;800,420;1500,350;2500,310" \
  --start "1987-03-02 00:00" --end "1987-03-09 00:00"
```

| Parameter | Description | Default |
|-----------|-------------|---------|
| `--y_min` / `--y_max` | Y-axis value range | -40 / 50 |
| `--start` / `--end` | Time range | 1900-01-01 / 08 |
| `--ink` | Ink color: `black`, `blue` | black |
| `--overlay` | Draw the curve on the original image | — |
| `--transposed` | Portrait orientation (vertical charts) | — |
| `--no_smooth` | Disable smoothing | — |
| `--start_pt` | Curve start pixel (x,y) | — |
| `--end_pt` | Curve end pixel (x,y) | — |
| `--guide` | Guide points (x1,y1;x2,y2;...) | — |
| `--seed` | Seed pixel for component selection (x,y) | — |

---