"use client";

import { useRef, useEffect } from "react";
import type { CanvasMode, AnnotationData, BoxPointMode } from "./AnnotationCanvas";

const BOX_TYPES = ["Dagilma", "Siliklik", "KagitDefect", "NoData"] as const;
const BOX_COLORS: Record<string, string> = {
  Dagilma: "#FF6B6B",
  Siliklik: "#FFA94D",
  KagitDefect: "#FFD43B",
  NoData: "#868E96",
};

export interface DigitizeResult {
  line_x: string[];
  line_y: number[];
  points: number;
  stats: { min: number; max: number; mean: number; std: number };
  isLabeled: boolean;
  overlay_base64?: string;
  pixel_x?: number[];
  pixel_y?: number[];
}

interface ExpertSidebarProps {
  mode: CanvasMode;
  onModeChange: (mode: CanvasMode) => void;
  annotationData: AnnotationData;
  onAnnotationChange: (data: Partial<AnnotationData>) => void;
  onClearCurrent: () => void;
  selectedBoxId: string | null;
  onBoxSelect: (id: string | null) => void;
  boxPointMode: BoxPointMode;
  onBoxPointModeChange: (m: BoxPointMode) => void;
  onSave: () => void;
  onExportJSON: () => void;
  onDigitize: () => void;
  saving: boolean;
  digitizing: boolean;
  digitizeResult: DigitizeResult | null;
  digitizeError: string | null;
  isUsable: boolean;
  onUsableChange: (v: boolean) => void;
  fileName: string | null;
  chartType: string | null;
}

const MODES: { key: CanvasMode; icon: string; label: string; desc: string }[] = [
  { key: "select", icon: "🔍", label: "Seçim / Pan", desc: "Kağıdı kaydır veya işaret seç" },
  { key: "startPoint", icon: "🟢", label: "Başlangıç", desc: "Grafiğin başlangıç noktasını işaretle" },
  { key: "endPoint", icon: "🔴", label: "Bitiş", desc: "Grafiğin bitiş noktasını işaretle" },
  { key: "tracing", icon: "✏️", label: "Veri Takibi", desc: "Eğriyi takip ederek çiz" },
  { key: "boundingBox", icon: "📦", label: "Sorunlu Alan", desc: "Bozukluk alanı dikdörtgenle seç" },
];

// Build the snake_case export JSON
export function buildExportJSON(annotationData: AnnotationData, isUsable: boolean) {
  const { startPoint, endPoint, trajectory, boundingBoxes, imageSize, calPoint1, calPoint2, calVal1, calVal2 } = annotationData;
  const v1 = parseFloat(calVal1);
  const v2 = parseFloat(calVal2);
  return {
    start_point: startPoint ? [startPoint.x, startPoint.y] : null,
    end_point: endPoint ? [endPoint.x, endPoint.y] : null,
    trajectory: trajectory.map((p) => [p.x, p.y]),
    bounding_boxes: boundingBoxes.map((b) => ({
      xmin: b.xmin,
      xmax: b.xmax,
      ymin: b.ymin,
      ymax: b.ymax,
      box_enter: b.box_enter ? [b.box_enter.x, b.box_enter.y] : null,
      box_exit: b.box_exit ? [b.box_exit.x, b.box_exit.y] : null,
      box_type: b.boxType || null,
    })),
    cal_point_1: (calPoint1 && !isNaN(v1)) ? [calPoint1.y, v1] : null,
    cal_point_2: (calPoint2 && !isNaN(v2)) ? [calPoint2.y, v2] : null,
    is_usable: isUsable,
    image_size: [imageSize.width, imageSize.height],
  };
}

export default function ExpertSidebar({
  mode,
  onModeChange,
  annotationData,
  onAnnotationChange,
  onClearCurrent,
  selectedBoxId,
  onBoxSelect,
  boxPointMode,
  onBoxPointModeChange,
  onSave,
  onExportJSON,
  onDigitize,
  saving,
  digitizing,
  digitizeResult,
  digitizeError,
  isUsable,
  onUsableChange,
  fileName,
}: ExpertSidebarProps) {
  const { startPoint, endPoint, trajectory, boundingBoxes, calVal1, calVal2 } = annotationData;
  const selectedBox = boundingBoxes.find((b) => b.id === selectedBoxId);
  const boxEditorRef = useRef<HTMLDivElement>(null);

  // Auto scroll to box editor when a box is selected
  useEffect(() => {
    if (selectedBox && boxEditorRef.current) {
      boxEditorRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedBoxId]);

  const handleBoxTypeChange = (boxType: string) => {
    if (!selectedBoxId) return;
    onAnnotationChange({
      boundingBoxes: boundingBoxes.map((b) =>
        b.id === selectedBoxId ? { ...b, boxType } : b
      ),
    });
  };

  const handleDeleteBox = () => {
    if (!selectedBoxId) return;
    onAnnotationChange({
      boundingBoxes: boundingBoxes.filter((b) => b.id !== selectedBoxId),
    });
    onBoxSelect(null);
  };

  // What will the cancel button clear?
  const getCancelLabel = () => {
    switch (mode) {
      case "startPoint": return startPoint ? "🟢 Başlangıç Noktasını Sil" : null;
      case "endPoint": return endPoint ? "🔴 Bitiş Noktasını Sil" : null;
      case "tracing": return trajectory.length > 0 ? "✏️ Çizgiyi Sil" : null;
      case "boundingBox": return boundingBoxes.length > 0 ? "📦 Tüm Kutuları Sil" : null;
      default: return null;
    }
  };
  const cancelLabel = getCancelLabel();

  const exportData = buildExportJSON(annotationData, isUsable);
  const hasData = startPoint || endPoint || trajectory.length > 0 || boundingBoxes.length > 0;

  return (
    <div className="expert-sidebar">
      {/* Header */}
      <div className="expert-sidebar-header">
        <h3>Uzman Doğrulama</h3>
        {fileName && <span className="labeling-box-id">{fileName}</span>}
      </div>

      {/* Mode Selector */}
      <div className="labeling-section">
        <label className="labeling-label">Çizim Modu</label>
        <div className="mode-buttons">
          {MODES.map((m) => (
            <button
              key={m.key}
              className={`mode-btn ${mode === m.key ? "active" : ""}`}
              onClick={() => { onModeChange(m.key); onBoxPointModeChange(null); }}
              title={m.desc}
            >
              <span className="mode-btn-icon">{m.icon}</span>
              <span className="mode-btn-label">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══════ SELECTED BOX EDITOR ═══════ */}
      {/* Placed high in the sidebar so user immediately sees it after drawing a box */}
      {selectedBox && (
        <div ref={boxEditorRef} className="labeling-section selected-box-section">
          <label className="labeling-label" style={{ color: "#3b82f6" }}>
            📦 Seçili Kutu #{boundingBoxes.indexOf(selectedBox) + 1}
          </label>

          {/* Coordinates */}
          <div className="labeling-coords">
            <span>xmin: {selectedBox.xmin}</span>
            <span>xmax: {selectedBox.xmax}</span>
            <span>ymin: {selectedBox.ymin}</span>
            <span>ymax: {selectedBox.ymax}</span>
          </div>

          {/* ─── Box Enter / Exit ─── */}
          <label className="labeling-label" style={{ marginTop: 10, fontSize: 11 }}>Giriş / Çıkış Noktaları</label>
          <div className="box-point-controls">
            <button
              className={`box-point-btn enter ${boxPointMode === "enter" ? "active" : ""}`}
              onClick={() => onBoxPointModeChange(boxPointMode === "enter" ? null : "enter")}
            >
              <span className="type-dot" style={{ background: "#eab308" }} />
              {selectedBox.box_enter
                ? `IN (${selectedBox.box_enter.x}, ${selectedBox.box_enter.y})`
                : boxPointMode === "enter" ? "⏳ Canvas'a tıklayın" : "🟡 Giriş Seç"}
            </button>
            <button
              className={`box-point-btn exit ${boxPointMode === "exit" ? "active" : ""}`}
              onClick={() => onBoxPointModeChange(boxPointMode === "exit" ? null : "exit")}
            >
              <span className="type-dot" style={{ background: "#a855f7" }} />
              {selectedBox.box_exit
                ? `OUT (${selectedBox.box_exit.x}, ${selectedBox.box_exit.y})`
                : boxPointMode === "exit" ? "⏳ Canvas'a tıklayın" : "🟣 Çıkış Seç"}
            </button>
          </div>

          {/* Prompt banner when in point-set mode */}
          {boxPointMode && (
            <div className="box-point-banner">
              {boxPointMode === "enter"
                ? "🟡 Canvas üzerinde GİRİŞ noktasına tıklayın"
                : "🟣 Canvas üzerinde ÇIKIŞ noktasına tıklayın"}
            </div>
          )}

          {/* Box type */}
          <div className="labeling-box-types" style={{ marginTop: 8 }}>
            {BOX_TYPES.map((type) => (
              <button
                key={type}
                className={`labeling-type-btn ${selectedBox.boxType === type ? "active" : ""}`}
                style={{
                  borderColor: selectedBox.boxType === type ? BOX_COLORS[type] : undefined,
                  background: selectedBox.boxType === type ? `${BOX_COLORS[type]}22` : undefined,
                }}
                onClick={() => handleBoxTypeChange(type)}
              >
                <span className="type-dot" style={{ background: BOX_COLORS[type] }} />
                {type}
              </button>
            ))}
          </div>
          <button className="annotation-delete-box-btn" onClick={handleDeleteBox}>
            Kutucuğu Sil
          </button>
        </div>
      )}

      {/* Annotation Status */}
      <div className="labeling-section">
        <label className="labeling-label">İşaretlemeler</label>
        <div className="annotation-status-list">
          <div className={`annotation-status-item ${startPoint ? "set" : ""}`}>
            <span className="annotation-indicator" style={{ background: startPoint ? "#10b981" : "var(--border)" }} />
            <span>Başlangıç</span>
            {startPoint ? (
              <span className="annotation-coord">{startPoint.x}, {startPoint.y}</span>
            ) : (
              <span className="annotation-empty">—</span>
            )}
            {startPoint && (
              <button className="annotation-clear-btn" onClick={() => onAnnotationChange({ startPoint: null })}>×</button>
            )}
          </div>
          <div className={`annotation-status-item ${endPoint ? "set" : ""}`}>
            <span className="annotation-indicator" style={{ background: endPoint ? "#ef4444" : "var(--border)" }} />
            <span>Bitiş</span>
            {endPoint ? (
              <span className="annotation-coord">{endPoint.x}, {endPoint.y}</span>
            ) : (
              <span className="annotation-empty">—</span>
            )}
            {endPoint && (
              <button className="annotation-clear-btn" onClick={() => onAnnotationChange({ endPoint: null })}>×</button>
            )}
          </div>
          <div className={`annotation-status-item ${trajectory.length > 0 ? "set" : ""}`}>
            <span className="annotation-indicator" style={{ background: trajectory.length > 0 ? "#f59e0b" : "var(--border)" }} />
            <span>Çizgi</span>
            {trajectory.length > 0 ? (
              <span className="annotation-coord">{trajectory.length} nokta</span>
            ) : (
              <span className="annotation-empty">—</span>
            )}
            {trajectory.length > 0 && (
              <button className="annotation-clear-btn" onClick={() => onAnnotationChange({ trajectory: [] })}>×</button>
            )}
          </div>
          <div className={`annotation-status-item ${boundingBoxes.length > 0 ? "set" : ""}`}>
            <span className="annotation-indicator" style={{ background: boundingBoxes.length > 0 ? "#3b82f6" : "var(--border)" }} />
            <span>Kutucuk</span>
            {boundingBoxes.length > 0 ? (
              <span className="annotation-coord">{boundingBoxes.length} alan</span>
            ) : (
              <span className="annotation-empty">—</span>
            )}
            {boundingBoxes.length > 0 && (
              <button
                className="annotation-clear-btn"
                onClick={() => { onAnnotationChange({ boundingBoxes: [] }); onBoxSelect(null); }}
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2-nokta Y ekseni kalibrasyonu */}
      <div className="labeling-section">
        <label className="labeling-label">Y Ekseni Kalibrasyonu</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Cal Point 1 */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              className={`mode-btn ${mode === "calPoint1" ? "active" : ""}`}
              style={{ flex: "0 0 auto", minWidth: 90, fontSize: 11 }}
              onClick={() => onModeChange(mode === "calPoint1" ? "select" : "calPoint1")}
              title="Canvas'ta 1. kalibrasyon noktasını seç"
            >
              📍 Nokta 1
            </button>
            <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 56 }}>
              {annotationData.calPoint1 ? `y=${annotationData.calPoint1.y}` : "seçilmedi"}
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={calVal1}
              placeholder="değer"
              onChange={(e) => onAnnotationChange({ calVal1: e.target.value })}
              style={{ flex: 1, padding: "3px 6px", borderRadius: 5, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 12 }}
            />
            {annotationData.calPoint1 && (
              <button className="annotation-clear-btn" onClick={() => onAnnotationChange({ calPoint1: null })}>×</button>
            )}
          </div>
          {/* Cal Point 2 */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              className={`mode-btn ${mode === "calPoint2" ? "active" : ""}`}
              style={{ flex: "0 0 auto", minWidth: 90, fontSize: 11 }}
              onClick={() => onModeChange(mode === "calPoint2" ? "select" : "calPoint2")}
              title="Canvas'ta 2. kalibrasyon noktasını seç"
            >
              📍 Nokta 2
            </button>
            <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 56 }}>
              {annotationData.calPoint2 ? `y=${annotationData.calPoint2.y}` : "seçilmedi"}
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={calVal2}
              placeholder="değer"
              onChange={(e) => onAnnotationChange({ calVal2: e.target.value })}
              style={{ flex: 1, padding: "3px 6px", borderRadius: 5, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: 12 }}
            />
            {annotationData.calPoint2 && (
              <button className="annotation-clear-btn" onClick={() => onAnnotationChange({ calPoint2: null })}>×</button>
            )}
          </div>
        </div>
      </div>

      {/* isUsable toggle */}
      <div className="labeling-section">
        <div className="labeling-toggle-row">
          <span>Kullanılabilir Veri</span>
          <button
            className={`toggle-switch ${isUsable ? "on" : ""}`}
            onClick={() => onUsableChange(!isUsable)}
          >
            <span className="toggle-thumb" />
          </button>
        </div>
      </div>

      {/* JSON Preview */}
      {hasData && (
        <div className="labeling-section">
          <label className="labeling-label">JSON Çıktı</label>
          <pre className="json-preview">{JSON.stringify(exportData, null, 2)}</pre>
        </div>
      )}

      {/* Digitize Result */}
      {digitizeResult && (
        <div className="labeling-section">
          <label className="labeling-label" style={{ color: "var(--success)" }}>Dijitalizasyon Sonucu</label>
          <div className="digitize-stats">
            <div className="stat-row"><span>Nokta</span><strong>{digitizeResult.points}</strong></div>
            <div className="stat-row"><span>Min</span><strong>{digitizeResult.stats.min}</strong></div>
            <div className="stat-row"><span>Max</span><strong>{digitizeResult.stats.max}</strong></div>
            <div className="stat-row"><span>Ort</span><strong>{digitizeResult.stats.mean}</strong></div>
            <div className="stat-row"><span>Std</span><strong>{digitizeResult.stats.std}</strong></div>
          </div>
        </div>
      )}
      {digitizeError && (
        <div className="labeling-section">
          <div style={{ color: "var(--danger)", fontSize: 12, padding: "8px 12px", background: "rgba(239,68,68,0.1)", borderRadius: 8 }}>
            {digitizeError}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="labeling-actions">
        <button
          className="labeling-action-btn digitize-btn"
          onClick={onDigitize}
          disabled={digitizing || !startPoint || !endPoint || trajectory.length === 0}
          title={!startPoint || !endPoint || trajectory.length === 0 ? "Dijitalize etmek icin baslangic, bitis ve cizgi gerekli" : ""}
        >
          {digitizing ? "Dijitalize ediliyor..." : "🔬 Dijitalize Et"}
        </button>
        <button className="labeling-action-btn save-btn" onClick={onSave} disabled={saving}>
          {saving ? "Kaydediliyor..." : "💾 Kaydet"}
        </button>
        <button className="labeling-action-btn correct-btn" onClick={onExportJSON} disabled={!hasData}>
          JSON
        </button>
        {cancelLabel && (
          <button className="labeling-action-btn cancel-btn" onClick={onClearCurrent}>
            {cancelLabel}
          </button>
        )}
        <a href="/" className="labeling-action-btn" style={{ textDecoration: "none", textAlign: "center" }}>
          Ana Sayfa
        </a>
      </div>
    </div>
  );
}
