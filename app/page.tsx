"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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

        {/* Admin link */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
          <a href="/admin" className="admin-link-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Admin Panel
          </a>
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
              <img
                src={imageSrc}
                alt={selectedFile.name}
                className="fullscreen-image"
                onLoad={() => setImgLoading(false)}
                onError={() => setImgLoading(false)}
              />
            </div>

            {/* Bottom info */}
            <div className="fullscreen-bottombar">
              {selectedFile.date && <span>{selectedFile.date}</span>}
              <span>{selectedFile.sizeMB} MB</span>
              <span>{selectedFile.type}</span>
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
                {files.map((file, idx) => (
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
                      <span className="gallery-card-size">{file.sizeMB} MB</span>
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
