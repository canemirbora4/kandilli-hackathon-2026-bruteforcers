"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import DateCalendar from "@/components/DateCalendar";

const FASTAPI = "http://localhost:8000";

interface DataType {
  key: string;
  label: string;
  type: string;
  years: number[];
  frequencies: string[];
}

interface MonthInfo {
  name: string;
  num: number;
  count: number;
}

interface FileItem {
  name: string;
  path: string;
  directory: string;
  type: string;
  year: number;
  month: string | null;
  frequency: string;
  sizeMB: string;
  date: string | null;
}

interface DigitizenData {
  line_x: string[];
  line_y: number[];
  pixel_x?: number[];
  pixel_y?: number[];
  stats: { min: number; max: number; mean: number; std: number };
}

interface BoundingBox {
  xmin: number; xmax: number; ymin: number; ymax: number;
  box_type?: string | null;
}

const BOX_COLORS: Record<string, string> = {
  Dagilma: "#FF6B6B", Siliklik: "#FFA94D", KagitDefect: "#FFD43B", NoData: "#868E96",
};
const BOX_DEFAULT = "#3b82f6";

function Sparkline({ values, color = "#10b981" }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const W = 320, H = 60;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 8) - 4;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={W} height={H} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
    </svg>
  );
}

export default function Home() {
  // Navigation state
  const [dataTypes, setDataTypes] = useState<DataType[]>([]);
  const [selectedType, setSelectedType] = useState<DataType | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [availableFreqs, setAvailableFreqs] = useState<string[]>([]);
  const [selectedFreq, setSelectedFreq] = useState<string>("");
  const [months, setMonths] = useState<MonthInfo[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Files & gallery
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imgLoading, setImgLoading] = useState(false);

  // Calendar
  const [showCalendar, setShowCalendar] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  // Digitize record
  const [digitizeData, setDigitizeData] = useState<DigitizenData | null>(null);
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([]);
  const [imageSize, setImageSize] = useState<[number, number] | null>(null);
  const [isUsable, setIsUsable] = useState<boolean | null>(null);
  const [recordId, setRecordId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [imgScale, setImgScale] = useState<{ x: number; y: number }>({ x: 1, y: 1 });
  const imgRef = useRef<HTMLImageElement>(null);
  const [hoverTooltip, setHoverTooltip] = useState<{ x: number; y: number; value: number } | null>(null);
  const [jsonCopied, setJsonCopied] = useState(false);
  // path → boolean cache so gallery cards show badge without extra fetches
  const [digitizedPaths, setDigitizedPaths] = useState<Set<string>>(new Set());

  // ── Data fetching ──

  useEffect(() => {
    fetch(`${FASTAPI}/api/data-types`)
      .then((r) => r.json())
      .then((data) => { setDataTypes(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedType?.years.length) {
      setSelectedYear(selectedType.years[selectedType.years.length - 1]); // last year
    }
  }, [selectedType]);

  useEffect(() => {
    if (!selectedType || !selectedYear) return;
    fetch(`${FASTAPI}/api/frequencies/${selectedType.key}/${selectedYear}`)
      .then((r) => r.json())
      .then((data) => {
        setAvailableFreqs(data.frequencies || []);
        if (data.frequencies?.length > 0) setSelectedFreq(data.frequencies[0]);
      })
      .catch(() => {});
  }, [selectedType, selectedYear]);

  useEffect(() => {
    if (!selectedType || !selectedYear) return;
    const typeEnc = encodeURIComponent(selectedType.key);
    const url = `${FASTAPI}/api/months/${typeEnc}/${selectedYear}${selectedFreq ? `?frequency=${selectedFreq}` : ""}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const monthList = data.months || [];
        setMonths(monthList);
        // Her zaman ilk mevcut ayı seç (yıl değiştiğinde de)
        if (monthList.length > 0) {
          setSelectedMonth(monthList[0].name);
        } else {
          setSelectedMonth(null);
        }
      })
      .catch(() => {});
  }, [selectedType, selectedYear, selectedFreq]);

  useEffect(() => {
    if (!selectedType || !selectedYear) return;
    const typeEnc = encodeURIComponent(selectedType.key);
    fetch(`${FASTAPI}/api/available-dates/${typeEnc}?year=${selectedYear}`)
      .then((r) => r.json())
      .then((data) => setAvailableDates(data.dates || []))
      .catch(() => {});
  }, [selectedType, selectedYear]);

  // Fetch files for selected month
  useEffect(() => {
    if (!selectedType || !selectedYear || !selectedMonth) { setFiles([]); return; }
    const typeEnc = encodeURIComponent(selectedType.key);
    const monthEnc = encodeURIComponent(selectedMonth);
    let url = `${FASTAPI}/api/files/${typeEnc}?year=${selectedYear}&month=${monthEnc}`;
    if (selectedFreq) url += `&frequency=${selectedFreq}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => setFiles(data.files || []))
      .catch(() => {});
  }, [selectedType, selectedYear, selectedMonth, selectedFreq]);

  // Fetch digitize record for selected file
  useEffect(() => {
    if (!selectedFile) { setDigitizeData(null); setBoundingBoxes([]); setImageSize(null); setIsUsable(null); return; }
    const pathEnc = encodeURIComponent(selectedFile.path);
    fetch(`${FASTAPI}/api/records?path=${pathEnc}&limit=1`)
      .then((r) => r.json())
      .then((data) => {
        const rec = data.records?.find((r: { path: string }) => r.path === selectedFile.path);
        const result = rec?.result || {};
        const d = result.digitize || null;
        setDigitizeData(d);
        setBoundingBoxes(result.bounding_boxes || []);
        setImageSize(result.image_size || null);
        setIsUsable(rec ? Boolean(rec.isUsable) : null);
        setRecordId(rec?.id ?? null);
        if (d || (result.bounding_boxes?.length > 0))
          setDigitizedPaths((prev) => new Set(prev).add(selectedFile.path));
      })
      .catch(() => { setDigitizeData(null); setBoundingBoxes([]); setImageSize(null); setIsUsable(null); setRecordId(null); });
  }, [selectedFile]);

  // Fetch digitize status for all files in current month (for badge)
  useEffect(() => {
    if (files.length === 0) return;
    files.forEach((f) => {
      const pathEnc = encodeURIComponent(f.path);
      fetch(`${FASTAPI}/api/records?path=${pathEnc}&limit=1`)
        .then((r) => r.json())
        .then((data) => {
          const rec = data.records?.find((r: { path: string }) => r.path === f.path);
          if (rec?.result?.digitize) {
            setDigitizedPaths((prev) => new Set(prev).add(f.path));
          }
        })
        .catch(() => {});
    });
  }, [files]);

  const handleDeleteRecord = useCallback(async () => {
    if (!recordId) return;
    setDeleting(true);
    try {
      await fetch(`${FASTAPI}/api/records/${recordId}`, { method: "DELETE" });
      setDigitizeData(null);
      setBoundingBoxes([]);
      setIsUsable(null);
      setRecordId(null);
      if (selectedFile) setDigitizedPaths((prev) => { const s = new Set(prev); s.delete(selectedFile.path); return s; });
    } finally {
      setDeleting(false);
    }
  }, [recordId, selectedFile]);

  const handleCopyJSON = useCallback(() => {
    if (!digitizeData) return;
    const json = JSON.stringify({ line_x: digitizeData.line_x, line_y: digitizeData.line_y }, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 2000);
    });
  }, [digitizeData]);

  // ── Navigation helpers ──
  const currentIndex = useMemo(
    () => (selectedFile ? files.findIndex((f) => f.path === selectedFile.path) : -1),
    [selectedFile, files]
  );

  const goTo = useCallback((idx: number) => {
    if (idx >= 0 && idx < files.length) {
      setSelectedFile(files[idx]);
      setImgLoading(true);
    }
  }, [files]);

  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);
  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "Escape") { setFullscreen(false); setSelectedFile(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goPrev, goNext]);

  const imageSrc = selectedFile
    ? `${FASTAPI}/api/tiff/${selectedFile.path}`
    : "";

  const thumbnailSrc = (file: FileItem) =>
    `${FASTAPI}/api/thumbnail/${file.path}?size=320`;

  // ── Render ──

  return (
    <div className="app-layout">
      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M8 13h2" /><path d="M8 17h2" />
                <path d="M14 13h2" /><path d="M14 17h2" />
              </svg>
            </div>
            <div>
              <h1>Kandilli Arşiv</h1>
              <p>115 Yıllık İklim Kayıtları</p>
            </div>
          </div>
        </div>

        <div className="sidebar-filters">
          {/* Type */}
          <label className="labeling-label">Veri Türü</label>
          <div className="filter-chips">
            {dataTypes.map((dt) => (
              <button
                key={dt.key}
                className={`filter-chip ${selectedType?.key === dt.key ? "active" : ""}`}
                onClick={() => {
                  setSelectedType(dt);
                  setSelectedMonth(null);
                  setSelectedFile(null);
                  setFullscreen(false);
                }}
              >
                {dt.label}
                <span style={{ opacity: 0.6, marginLeft: 4, fontSize: 10 }}>
                  {dt.years.length > 0 && `${dt.years[0]}–${dt.years[dt.years.length - 1]}`}
                </span>
              </button>
            ))}
          </div>

          {/* Year */}
          {selectedType && selectedType.years.length > 0 && (
            <>
              <label className="labeling-label">Yıl</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select
                  className="admin-select"
                  value={selectedYear || ""}
                  onChange={(e) => {
                    setSelectedYear(parseInt(e.target.value));
                    setSelectedMonth(null);
                    setSelectedFile(null);
                  }}
                  style={{ flex: 1 }}
                >
                  {selectedType.years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <button
                  className={`filter-chip ${showCalendar ? "active" : ""}`}
                  onClick={() => setShowCalendar((v) => !v)}
                >
                  📅
                </button>
              </div>
            </>
          )}

          {/* Frequency */}
          {availableFreqs.length > 1 && (
            <>
              <label className="labeling-label">Frekans</label>
              <div className="filter-chips">
                {availableFreqs.map((f) => (
                  <button
                    key={f}
                    className={`filter-chip ${selectedFreq === f ? "active" : ""}`}
                    onClick={() => setSelectedFreq(f)}
                  >
                    {f === "Daily" ? "Günlük" : "Haftalık"}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Calendar */}
        {showCalendar && selectedYear && (
          <div className="admin-calendar-wrap">
            <DateCalendar
              year={selectedYear}
              availableDates={availableDates}
              selectedDate={null}
              onDateSelect={(d) => {
                // Find the month from the date and select it
                const parts = d.split("-");
                const monthNum = parseInt(parts[1]);
                const m = months.find((mm) => mm.num === monthNum);
                if (m) setSelectedMonth(m.name);
                setShowCalendar(false);
              }}
            />
          </div>
        )}

        {/* Month list */}
        <div className="sidebar-content">
          {loading && (
            <div className="file-count-badge">
              <div className="loading-spinner" style={{ margin: "20px auto", width: 24, height: 24 }} />
            </div>
          )}
          {!loading && !selectedType && (
            <div className="file-count-badge">Yukarıdan veri türü seçin</div>
          )}
          {months.map((m) => (
            <div
              key={m.name}
              className={`file-card ${selectedMonth === m.name ? "active" : ""}`}
              onClick={() => { setSelectedMonth(m.name); setSelectedFile(null); setFullscreen(false); }}
            >
              <div className="file-card-name">
                <svg className="file-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                <span>{m.name}</span>
              </div>
              <div className="file-card-meta">
                <span>{m.count} kayıt</span>
                <span>{selectedYear}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
          <a href="/" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>← Ana Sayfa</a>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="main-content">
        {/* Header */}
        <div className="viewer-header">
          <div className="viewer-header-title">
            <span className="dot" />
            {selectedFile
              ? selectedFile.name
              : selectedMonth
                ? `${selectedMonth} ${selectedYear}`
                : "Grafik Kağıdı Seçin"}
          </div>
          <div className="viewer-header-info">
            {selectedType && <div className="info-badge">{selectedType.label}</div>}
            {selectedYear && <div className="info-badge">{selectedYear}</div>}
            {selectedMonth && <div className="info-badge">{selectedMonth}</div>}
            {files.length > 0 && <div className="info-badge">{files.length} dosya</div>}
          </div>
        </div>

        {/* Fullscreen viewer */}
        {selectedFile && fullscreen ? (
          <div className="fullscreen-viewer">
            {/* Nav overlay */}
            <div className="fullscreen-nav">
              <button
                className="nav-btn nav-prev"
                onClick={goPrev}
                disabled={currentIndex <= 0}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                className="nav-btn nav-next"
                onClick={goNext}
                disabled={currentIndex >= files.length - 1}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Topbar */}
            <div className="fullscreen-topbar">
              <div className="fullscreen-title">
                {selectedFile.name}.tif
                <span className="fullscreen-counter">{currentIndex + 1} / {files.length}</span>
              </div>
              <button className="fullscreen-close" onClick={() => setFullscreen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Image */}
            <div className="fullscreen-image-wrap">
              {imgLoading && (
                <div className="chart-viewer-loading">
                  <div className="loading-spinner" />
                </div>
              )}
              <div style={{ position: "relative", display: "inline-block", lineHeight: 0 }}>
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt={selectedFile.name}
                  className="fullscreen-image"
                  onLoad={() => {
                    setImgLoading(false);
                    if (imgRef.current) {
                      const nw = imageSize?.[0] ?? imgRef.current.naturalWidth;
                      const nh = imageSize?.[1] ?? imgRef.current.naturalHeight;
                      setImgScale({
                        x: imgRef.current.offsetWidth / nw,
                        y: imgRef.current.offsetHeight / nh,
                      });
                    }
                  }}
                  onError={() => setImgLoading(false)}
                  onMouseMove={(e) => {
                    if (!digitizeData?.pixel_x?.length || !digitizeData?.pixel_y?.length || !imgRef.current) { setHoverTooltip(null); return; }
                    const naturalW = imageSize?.[0] ?? imgRef.current.naturalWidth;
                    const naturalH = imageSize?.[1] ?? imgRef.current.naturalHeight;
                    const imgX = e.nativeEvent.offsetX / imgRef.current.offsetWidth * naturalW;
                    const imgY = e.nativeEvent.offsetY / imgRef.current.offsetHeight * naturalH;
                    const px = digitizeData.pixel_x;
                    let lo = 0, hi = px.length - 1;
                    while (lo < hi) { const mid = (lo + hi) >> 1; if (px[mid] < imgX) lo = mid + 1; else hi = mid; }
                    if (lo > 0 && Math.abs(px[lo - 1] - imgX) < Math.abs(px[lo] - imgX)) lo--;
                    if (Math.abs(digitizeData.pixel_y[lo] - imgY) > 30) { setHoverTooltip(null); return; }
                    setHoverTooltip({ x: e.clientX, y: e.clientY, value: digitizeData.line_y[lo] });
                  }}
                  onMouseLeave={() => setHoverTooltip(null)}
                />
                {/* Bounding box overlays */}
                {boundingBoxes.map((box, i) => {
                  const color = BOX_COLORS[box.box_type || ""] || BOX_DEFAULT;
                  return (
                    <div key={i} style={{
                      position: "absolute",
                      left: box.xmin * imgScale.x,
                      top: box.ymin * imgScale.y,
                      width: (box.xmax - box.xmin) * imgScale.x,
                      height: (box.ymax - box.ymin) * imgScale.y,
                      border: `2px solid ${color}`,
                      background: `${color}22`,
                      pointerEvents: "none",
                    }}>
                      {box.box_type && (
                        <span style={{
                          position: "absolute", top: -18, left: 0,
                          fontSize: 10, fontWeight: 600, color,
                          background: "rgba(0,0,0,0.6)", padding: "1px 4px", borderRadius: 3,
                        }}>{box.box_type}</span>
                      )}
                    </div>
                  );
                })}
                {/* Digitized curve SVG overlay */}
                {digitizeData?.pixel_x && digitizeData?.pixel_y && (
                  <svg style={{
                    position: "absolute", top: 0, left: 0,
                    width: "100%", height: "100%", pointerEvents: "none",
                  }}>
                    <polyline
                      points={digitizeData.pixel_x.map((x, i) =>
                        `${x * imgScale.x},${digitizeData.pixel_y![i] * imgScale.y}`
                      ).join(" ")}
                      fill="none" stroke="#10b981" strokeWidth={2}
                      strokeLinecap="round" strokeLinejoin="round" opacity={0.85}
                    />
                  </svg>
                )}
              </div>
            </div>

            {/* Digitize panel */}
            {digitizeData && (
              <div style={{
                position: "absolute", bottom: 48, left: "50%", transform: "translateX(-50%)",
                background: "rgba(15,20,30,0.92)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14, padding: "14px 20px", minWidth: 360, backdropFilter: "blur(8px)",
              }}>
                <div style={{ display: "flex", gap: 20, marginBottom: 10, justifyContent: "center" }}>
                  {[
                    { label: "Min", value: digitizeData.stats.min },
                    { label: "Max", value: digitizeData.stats.max },
                    { label: "Ort", value: digitizeData.stats.mean },
                    { label: "Std", value: digitizeData.stats.std },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#10b981", fontVariantNumeric: "tabular-nums" }}>
                        {value.toFixed(1)}
                      </div>
                    </div>
                  ))}
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 2 }}>Nokta</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                      {digitizeData.line_y.length}
                    </div>
                  </div>
                </div>
                <Sparkline values={digitizeData.line_y} />
                <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
                  <button
                    onClick={handleCopyJSON}
                    style={{
                      background: jsonCopied ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.08)",
                      border: `1px solid ${jsonCopied ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.15)"}`,
                      color: jsonCopied ? "#10b981" : "rgba(255,255,255,0.7)",
                      borderRadius: 7, padding: "5px 16px", fontSize: 12,
                      fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                    }}
                  >
                    {jsonCopied ? "✓ Kopyalandı" : "JSON"}
                  </button>
                </div>
              </div>
            )}

            {/* Hover value tooltip */}
            {hoverTooltip && (
              <div style={{
                position: "fixed", left: hoverTooltip.x + 14, top: hoverTooltip.y - 24,
                background: "rgba(0,0,0,0.78)", color: "#fff", padding: "3px 9px",
                borderRadius: 6, fontSize: 13, fontWeight: 600, pointerEvents: "none",
                zIndex: 1000, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
              }}>
                {hoverTooltip.value.toFixed(1)}{selectedType?.type === "Nem" ? "%" : "°C"}
              </div>
            )}

            {/* Bottom info */}
            <div className="fullscreen-bottombar">
              {selectedFile.date && <span>{selectedFile.date}</span>}
              <span>{selectedFile.sizeMB} MB</span>
              <span>{selectedFile.type}</span>
              {digitizeData && <span style={{ color: "#10b981" }}>✓ Dijitalize edildi</span>}
              {isUsable === true && <span style={{ color: "#10b981", fontWeight: 600 }}>✓ Kullanılabilir</span>}
              {isUsable === false && <span style={{ color: "#ef4444", fontWeight: 600 }}>✗ Kullanılamaz</span>}
              {recordId && (
                <button
                  onClick={handleDeleteRecord}
                  disabled={deleting}
                  style={{
                    background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
                    color: "#ef4444", borderRadius: 6, padding: "3px 10px",
                    fontSize: 11, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  {deleting ? "Siliniyor..." : "Kaydı Sil"}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Gallery grid */
          <div className="gallery-area">
            {files.length === 0 && selectedMonth ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    style={{ color: "var(--accent)" }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                </div>
                <h2>Bu ayda dosya bulunamadı</h2>
              </div>
            ) : files.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    style={{ color: "var(--accent)" }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                </div>
                <h2>Grafik Kağıdı Seçin</h2>
                <p>Sol panelden veri türü, yıl ve ay seçerek arşive göz atın.</p>
              </div>
            ) : (
              <div className="gallery-grid">
                {files.map((file) => (
                  <div
                    key={file.path}
                    className={`gallery-card ${selectedFile?.path === file.path ? "active" : ""}`}
                    onClick={() => {
                      setSelectedFile(file);
                      setFullscreen(true);
                      setImgLoading(true);
                    }}
                  >
                    <div className="gallery-thumb">
                      <img
                        src={thumbnailSrc(file)}
                        alt={file.name}
                        loading="lazy"
                      />
                    </div>
                    <div className="gallery-card-info">
                      <span className="gallery-card-name">{file.date || file.name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="gallery-card-size">{file.sizeMB} MB</span>
                        {digitizedPaths.has(file.path) && (
                          <span style={{ fontSize: 10, background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 4, padding: "1px 5px" }}>✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
