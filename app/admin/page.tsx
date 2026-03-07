"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import ExpertSidebar, { buildExportJSON } from "@/components/ExpertSidebar";
import type { CanvasMode, AnnotationData, BoxPointMode } from "@/components/AnnotationCanvas";

// react-konva → client-side only
const AnnotationCanvas = dynamic(() => import("@/components/AnnotationCanvas"), {
  ssr: false,
  loading: () => (
    <div className="annotation-canvas-container">
      <div className="chart-viewer-loading">
        <div className="loading-spinner" />
        <span>Canvas yükleniyor...</span>
      </div>
    </div>
  ),
});

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

const INITIAL_ANNOTATION: AnnotationData = {
  startPoint: null,
  endPoint: null,
  trajectory: [],
  boundingBoxes: [],
  imageSize: { width: 0, height: 0 },
};

export default function AdminPage() {
  // ── Navigation (Gallery tarzı: Tür → Yıl → Ay → Gün) ──
  const [dataTypes, setDataTypes] = useState<DataType[]>([]);
  const [selectedType, setSelectedType] = useState<DataType | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [availableFreqs, setAvailableFreqs] = useState<string[]>([]);
  const [selectedFreq, setSelectedFreq] = useState<string>("");
  const [months, setMonths] = useState<MonthInfo[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  // ── Canvas ──
  const [mode, setMode] = useState<CanvasMode>("select");
  const [annotation, setAnnotation] = useState<AnnotationData>({ ...INITIAL_ANNOTATION });
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [boxPointMode, setBoxPointMode] = useState<BoxPointMode>(null);
  const [isUsable, setIsUsable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recordId, setRecordId] = useState<number | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // ── Data fetching (aynı gallery yapısı) ──

  useEffect(() => {
    fetch(`${FASTAPI}/api/data-types`)
      .then((r) => r.json())
      .then(setDataTypes)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedType?.years.length) {
      setSelectedYear(selectedType.years[selectedType.years.length - 1]);
    }
  }, [selectedType]);

  useEffect(() => {
    if (!selectedType || !selectedYear) return;
    const typeEnc = encodeURIComponent(selectedType.key);
    fetch(`${FASTAPI}/api/frequencies/${typeEnc}/${selectedYear}`)
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
        const ml = data.months || [];
        setMonths(ml);
        if (ml.length > 0) setSelectedMonth(ml[0].name);
        else setSelectedMonth(null);
      })
      .catch(() => {});
  }, [selectedType, selectedYear, selectedFreq]);

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

  // When file changes, reset annotation & check DB
  useEffect(() => {
    if (!selectedFile) return;
    setAnnotation({ ...INITIAL_ANNOTATION });
    setSelectedBoxId(null);
    setMode("select");
    setIsUsable(true);
    setSaveMsg(null);

    // Check for existing record
    const pathEnc = encodeURIComponent(selectedFile.path);
    fetch(`${FASTAPI}/api/records?path=${pathEnc}&limit=1`)
      .then((r) => r.json())
      .then((data) => {
        const match = data.records?.find((r: Record<string, string>) =>
          r.path === selectedFile.path || selectedFile.path.includes(r.path)
        );
        if (match) {
          setRecordId(match.id);
          setIsUsable(match.isUsable);
          // Load existing annotation from result
          if (match.result) {
            const res = match.result;
            setAnnotation((prev) => ({
              ...prev,
              startPoint: res.start_point ? { x: res.start_point[0], y: res.start_point[1] } : null,
              endPoint: res.end_point ? { x: res.end_point[0], y: res.end_point[1] } : null,
              trajectory: (res.trajectory || []).map((p: number[]) => ({ x: p[0], y: p[1] })),
              boundingBoxes: (res.bounding_boxes || []).map((b: { xmin: number; xmax: number; ymin: number; ymax: number; box_enter?: number[]; box_exit?: number[]; box_type?: string }, i: number) => ({
                id: `db-${i}`,
                xmin: b.xmin,
                xmax: b.xmax,
                ymin: b.ymin,
                ymax: b.ymax,
                box_enter: b.box_enter ? { x: b.box_enter[0], y: b.box_enter[1] } : { x: b.xmin, y: b.ymin },
                box_exit: b.box_exit ? { x: b.box_exit[0], y: b.box_exit[1] } : { x: b.xmax, y: b.ymax },
                boxType: b.box_type || undefined,
              })),
            }));
          }
        } else {
          setRecordId(null);
        }
      })
      .catch(() => setRecordId(null));
  }, [selectedFile]);

  // ── Navigation helpers ──
  const currentIndex = selectedFile ? files.findIndex((f) => f.path === selectedFile.path) : -1;
  const goPrev = useCallback(() => {
    if (currentIndex > 0) setSelectedFile(files[currentIndex - 1]);
  }, [currentIndex, files]);
  const goNext = useCallback(() => {
    if (currentIndex < files.length - 1) setSelectedFile(files[currentIndex + 1]);
  }, [currentIndex, files]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goPrev, goNext]);

  // ── Annotation update ──
  const handleAnnotationChange = useCallback((updates: Partial<AnnotationData>) => {
    setAnnotation((prev) => ({ ...prev, ...updates }));
  }, []);

  // ── Build export JSON ──
  const getExportJSON = useCallback(() => buildExportJSON(annotation, isUsable), [annotation, isUsable]);

  // ── Smart clear: only clears the current mode's data ──
  const handleClearCurrent = useCallback(() => {
    switch (mode) {
      case "startPoint":
        setAnnotation((prev) => ({ ...prev, startPoint: null }));
        break;
      case "endPoint":
        setAnnotation((prev) => ({ ...prev, endPoint: null }));
        break;
      case "tracing":
        setAnnotation((prev) => ({ ...prev, trajectory: [] }));
        break;
      case "boundingBox":
        setAnnotation((prev) => ({ ...prev, boundingBoxes: [] }));
        setSelectedBoxId(null);
        setBoxPointMode(null);
        break;
    }
  }, [mode]);

  // ── Save to FastAPI ──
  const handleSave = useCallback(async () => {
    if (!selectedFile) return;
    setSaving(true);
    setSaveMsg(null);

    const exportJSON = getExportJSON();

    const payload = {
      path: selectedFile.path,
      type: selectedType?.type || "Nem",
      timestamp: selectedFile.date || selectedFile.name,
      interval: selectedFreq === "Weekly" ? "Weekly" : "Daily",
      isLabeled: true,
      isBackground: false,
      boxCoord: annotation.boundingBoxes.length > 0
        ? [annotation.boundingBoxes[0].xmin, annotation.boundingBoxes[0].xmax, annotation.boundingBoxes[0].ymin, annotation.boundingBoxes[0].ymax]
        : null,
      boxType: annotation.boundingBoxes.length > 0 ? annotation.boundingBoxes[0].boxType || null : null,
      isUsable,
      result: exportJSON,
    };

    try {
      if (recordId) {
        await fetch(`${FASTAPI}/api/records/${recordId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        const res = await fetch(`${FASTAPI}/api/records`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        setRecordId(data.id);
      }
      setSaveMsg("✅ Kayıt başarılı!");
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (e) {
      console.error("Save error:", e);
      setSaveMsg("❌ Kayıt hatası");
    }
    setSaving(false);
  }, [selectedFile, annotation, selectedType, selectedFreq, recordId, isUsable, getExportJSON]);

  // ── Export JSON to clipboard ──
  const handleExportJSON = useCallback(() => {
    const json = JSON.stringify(getExportJSON(), null, 2);
    navigator.clipboard.writeText(json).then(() => {
      setSaveMsg("📋 JSON panoya kopyalandı!");
      setTimeout(() => setSaveMsg(null), 3000);
    });
  }, [getExportJSON]);

  const imageSrc = selectedFile ? `${FASTAPI}/api/tiff/${selectedFile.path}` : "";

  return (
    <div className="admin-layout">
      {/* ===== LEFT — Navigation ===== */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon" style={{ background: "linear-gradient(135deg, #ef4444, #f59e0b)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <h1>Uzman Doğrulama</h1>
              <p>Analog Grafik İşaretleme</p>
            </div>
          </div>
        </div>

        <div className="admin-filters">
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
                }}
              >
                {dt.label}
              </button>
            ))}
          </div>

          {/* Year */}
          {selectedType && selectedType.years.length > 0 && (
            <>
              <label className="labeling-label">Yıl</label>
              <select
                className="admin-select"
                value={selectedYear || ""}
                onChange={(e) => {
                  setSelectedYear(parseInt(e.target.value));
                  setSelectedMonth(null);
                  setSelectedFile(null);
                }}
              >
                {selectedType.years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
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

          {/* Month */}
          {months.length > 0 && (
            <>
              <label className="labeling-label">Ay</label>
              <div className="filter-chips">
                {months.map((m) => (
                  <button
                    key={m.name}
                    className={`filter-chip ${selectedMonth === m.name ? "active" : ""}`}
                    onClick={() => { setSelectedMonth(m.name); setSelectedFile(null); }}
                  >
                    {m.name} <span style={{ opacity: 0.5, fontSize: 10, marginLeft: 2 }}>{m.count}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* File list — day selector */}
        <div className="sidebar-content">
          {files.length === 0 && selectedMonth && (
            <div className="file-count-badge">Bu ayda dosya bulunamadı</div>
          )}
          {files.length === 0 && !selectedMonth && selectedType && (
            <div className="file-count-badge">Ay seçin</div>
          )}
          {!selectedType && (
            <div className="file-count-badge">Yukarıdan veri türü seçin</div>
          )}
          {files.map((file) => (
            <div
              key={file.path}
              className={`file-card ${selectedFile?.path === file.path ? "active" : ""}`}
              onClick={() => setSelectedFile(file)}
            >
              <div className="file-card-name">
                <svg className="file-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
                <span>{file.date || file.name}</span>
              </div>
              <div className="file-card-meta">
                <span>{file.sizeMB} MB</span>
              </div>
            </div>
          ))}
          {files.length > 0 && (
            <div className="file-count-badge">{files.length} dosya</div>
          )}
        </div>
      </aside>

      {/* ===== CENTER — Canvas ===== */}
      <main className="admin-main">
        {/* Header */}
        <div className="viewer-header">
          <div className="viewer-header-title">
            <span className="dot" style={{
              background: mode === "startPoint" ? "#10b981"
                : mode === "endPoint" ? "#ef4444"
                : mode === "tracing" ? "#f59e0b"
                : mode === "boundingBox" ? "#3b82f6"
                : "var(--success)",
            }} />
            {selectedFile
              ? `${selectedMonth || ""} ${selectedYear || ""} — ${selectedFile.date || selectedFile.name}`
              : "Dosya Seçin"}
          </div>
          <div className="viewer-header-info">
            {selectedType && <div className="info-badge">{selectedType.label}</div>}
            {selectedFile && files.length > 0 && (
              <div className="info-badge">{currentIndex + 1} / {files.length}</div>
            )}
            {/* Prev/Next */}
            {selectedFile && (
              <>
                <button className="nav-btn-header" onClick={goPrev} disabled={currentIndex <= 0}>
                  ← Önceki
                </button>
                <button className="nav-btn-header" onClick={goNext} disabled={currentIndex >= files.length - 1}>
                  Sonraki →
                </button>
              </>
            )}
            {saveMsg && <div className="info-badge" style={{ background: "var(--success)", color: "#fff", borderColor: "var(--success)" }}>{saveMsg}</div>}
          </div>
        </div>

        <div className="admin-editor-area">
          {selectedFile ? (
            <AnnotationCanvas
              imageSrc={imageSrc}
              mode={mode}
              annotationData={annotation}
              onAnnotationChange={handleAnnotationChange}
              selectedBoxId={selectedBoxId}
              onBoxSelect={setSelectedBoxId}
              boxPointMode={boxPointMode}
              onBoxPointSet={() => setBoxPointMode(null)}
            />
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                  style={{ color: "var(--accent-warm)" }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h2>Grafik Kağıdı Seçin</h2>
              <p>
                Sol panelden Veri Türü → Yıl → Ay → Gün seçerek
                analog grafik işaretlemeye başlayın.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* ===== RIGHT — Expert Sidebar ===== */}
      <ExpertSidebar
        mode={mode}
        onModeChange={setMode}
        annotationData={annotation}
        onAnnotationChange={handleAnnotationChange}
        onClearCurrent={handleClearCurrent}
        selectedBoxId={selectedBoxId}
        onBoxSelect={setSelectedBoxId}
        boxPointMode={boxPointMode}
        onBoxPointModeChange={setBoxPointMode}
        onSave={handleSave}
        onExportJSON={handleExportJSON}
        saving={saving}
        isUsable={isUsable}
        onUsableChange={setIsUsable}
        fileName={selectedFile?.name || null}
      />
    </div>
  );
}
